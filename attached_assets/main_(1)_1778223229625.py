# services/satellite/main.py
"""
KARTA Satellite Service
Queries Google Earth Engine (Sentinel-2, TROPOMI, OCO-2, MODIS)
to produce carbon estimation MRV reports.
"""
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
from contextlib import asynccontextmanager
import asyncio
import redis.asyncio as aioredis
import json
import logging
import math
import os
import random
import time
from datetime import datetime, date

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ─── GEE IMPORT (conditional - not available in all envs) ────────────────────
try:
    import ee
    GEE_AVAILABLE = True
except ImportError:
    GEE_AVAILABLE = False
    logger.warning("Google Earth Engine not available — using simulation mode")

# ─── LIFESPAN ─────────────────────────────────────────────────────────────────

redis_client: aioredis.Redis = None
gee_semaphore: asyncio.Semaphore = None   # max 10 concurrent GEE calls

@asynccontextmanager
async def lifespan(app: FastAPI):
    global redis_client, gee_semaphore
    redis_client = aioredis.from_url(
        os.getenv("REDIS_URL", "redis://localhost:6379"),
        decode_responses=True,
    )
    gee_semaphore = asyncio.Semaphore(10)

    if GEE_AVAILABLE:
        try:
            credentials = ee.ServiceAccountCredentials(
                email=os.getenv("GEE_SERVICE_ACCOUNT"),
                key_file=os.getenv("GEE_KEY_FILE"),
            )
            ee.Initialize(credentials)
            logger.info("Google Earth Engine initialized")
        except Exception as e:
            logger.error(f"GEE init failed: {e}")

    logger.info("Satellite Service started")
    yield
    await redis_client.aclose()

app = FastAPI(title="KARTA Satellite Service", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ─── MODELS ───────────────────────────────────────────────────────────────────

class ScanRequest(BaseModel):
    project_id: str
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    area_ha: float = Field(..., gt=0)
    methodology: str
    force_refresh: bool = False

class ScanResult(BaseModel):
    project_id: str
    scan_date: str
    ndvi_mean: float
    ndvi_min: float
    ndvi_max: float
    cloud_cover_pct: int
    ch4_ppb: float
    co2_ppm: float
    fire_risk_score: int
    fire_detected: bool
    biomass_t_ha: float
    baseline_tonnes: float
    leakage_tonnes: float
    estimated_tonnes: float
    scene_id: str
    from_cache: bool = False

# ─── CARBON CALCULATION ───────────────────────────────────────────────────────

METHODOLOGY_PARAMS = {
    "VM0044": {"carbon_fraction": 0.47, "co2_factor": 3.67, "leakage_rate": 0.05, "baseline_t_ha": 2.1},
    "VM0042": {"carbon_fraction": 0.40, "co2_factor": 3.67, "leakage_rate": 0.08, "baseline_t_ha": 1.8},
    "VM0047": {"carbon_fraction": 0.47, "co2_factor": 3.67, "leakage_rate": 0.10, "baseline_t_ha": 3.2},
    "VM0033": {"carbon_fraction": 0.45, "co2_factor": 3.67, "leakage_rate": 0.05, "baseline_t_ha": 4.5},
}

def ndvi_to_biomass(ndvi: float) -> float:
    """Convert NDVI to above-ground biomass (t/ha). Based on India-calibrated model."""
    if ndvi < 0.2:   return 5.0
    if ndvi < 0.4:   return 20.0 + (ndvi - 0.2) * 100
    if ndvi < 0.6:   return 40.0 + (ndvi - 0.4) * 150
    return 70.0 + (ndvi - 0.6) * 200

def calculate_tonnes(ndvi: float, area_ha: float, methodology: str) -> tuple[float, float, float]:
    params = METHODOLOGY_PARAMS.get(methodology, METHODOLOGY_PARAMS["VM0044"])
    biomass = ndvi_to_biomass(ndvi)
    gross = biomass * area_ha * params["carbon_fraction"] * params["co2_factor"]
    baseline = params["baseline_t_ha"] * area_ha
    leakage = gross * params["leakage_rate"]
    net = max(gross - baseline - leakage, 0)
    return round(biomass, 2), round(baseline, 2), round(leakage, 2)

# ─── GEE QUERIES ─────────────────────────────────────────────────────────────

async def query_sentinel2_ndvi(lat: float, lon: float, area_ha: float) -> dict:
    """Query Sentinel-2 for NDVI at given coordinates."""
    if not GEE_AVAILABLE:
        return simulate_sentinel2(lat, lon)

    async with gee_semaphore:
        try:
            point = ee.Geometry.Point([lon, lat])
            buffer_m = math.sqrt(area_ha * 10000) * 1.2
            region = point.buffer(buffer_m).bounds()

            # Last 30 days, cloud cover < 20%
            collection = (
                ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
                .filterBounds(region)
                .filterDate(
                    ee.Date(datetime.utcnow().strftime("%Y-%m-%d")).advance(-30, "day"),
                    ee.Date(datetime.utcnow().strftime("%Y-%m-%d")),
                )
                .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 20))
                .sort("CLOUDY_PIXEL_PERCENTAGE")
            )

            image = collection.first()
            ndvi = image.normalizedDifference(["B8", "B4"])

            stats = ndvi.reduceRegion(
                reducer=ee.Reducer.mean().combine(
                    ee.Reducer.min(), sharedInputs=True
                ).combine(ee.Reducer.max(), sharedInputs=True),
                geometry=region,
                scale=10,
                maxPixels=1e9,
            ).getInfo()

            cloud = image.get("CLOUDY_PIXEL_PERCENTAGE").getInfo()
            scene_id = image.get("system:index").getInfo()

            return {
                "ndvi_mean": round(stats.get("nd_mean", 0.65), 4),
                "ndvi_min": round(stats.get("nd_min", 0.40), 4),
                "ndvi_max": round(stats.get("nd_max", 0.85), 4),
                "cloud_cover_pct": int(cloud),
                "scene_id": scene_id,
            }
        except Exception as e:
            logger.error(f"GEE Sentinel-2 error: {e}")
            return simulate_sentinel2(lat, lon)

def simulate_sentinel2(lat: float, lon: float) -> dict:
    """Realistic simulation when GEE not available."""
    lat_factor = max(0, 1 - abs(lat - 20) / 40)
    ndvi_base = 0.45 + lat_factor * 0.30
    ndvi_mean = round(ndvi_base + random.uniform(-0.05, 0.10), 4)
    return {
        "ndvi_mean": ndvi_mean,
        "ndvi_min": round(ndvi_mean - 0.15, 4),
        "ndvi_max": round(ndvi_mean + 0.15, 4),
        "cloud_cover_pct": random.randint(2, 18),
        "scene_id": f"S2A_MSIL2A_{date.today().strftime('%Y%m%d')}_SIM",
    }

async def query_tropomi_ch4(lat: float, lon: float) -> float:
    if not GEE_AVAILABLE:
        return round(1850 + random.uniform(0, 80), 2)
    try:
        point = ee.Geometry.Point([lon, lat])
        col = (
            ee.ImageCollection("COPERNICUS/S5P/NRTI/L3_CH4")
            .select("CH4_column_volume_mixing_ratio_dry_air")
            .filterBounds(point)
            .filterDate(
                ee.Date(datetime.utcnow().strftime("%Y-%m-%d")).advance(-30, "day"),
                ee.Date(datetime.utcnow().strftime("%Y-%m-%d")),
            )
            .mean()
        )
        val = col.reduceRegion(ee.Reducer.mean(), point, 7000).getInfo()
        return round(val.get("CH4_column_volume_mixing_ratio_dry_air", 1900), 2)
    except Exception:
        return round(1850 + random.uniform(0, 80), 2)

async def query_oco2_co2(lat: float, lon: float) -> float:
    if not GEE_AVAILABLE:
        return round(415 + random.uniform(0, 8), 2)
    try:
        point = ee.Geometry.Point([lon, lat])
        col = (
            ee.ImageCollection("NASA/OCO2/DATA/L2_STANDARD")
            .select("xco2")
            .filterBounds(point)
            .filterDate(
                ee.Date(datetime.utcnow().strftime("%Y-%m-%d")).advance(-60, "day"),
                ee.Date(datetime.utcnow().strftime("%Y-%m-%d")),
            )
            .mean()
        )
        val = col.reduceRegion(ee.Reducer.mean(), point, 5000).getInfo()
        return round(val.get("xco2", 415), 2)
    except Exception:
        return round(415 + random.uniform(0, 8), 2)

async def query_modis_fire(lat: float, lon: float) -> dict:
    if not GEE_AVAILABLE:
        return {"fire_risk_score": random.randint(5, 20), "fire_detected": False}
    try:
        point = ee.Geometry.Point([lon, lat]).buffer(10000)
        fires = (
            ee.ImageCollection("FIRMS")
            .filterBounds(point)
            .filterDate(
                ee.Date(datetime.utcnow().strftime("%Y-%m-%d")).advance(-30, "day"),
                ee.Date(datetime.utcnow().strftime("%Y-%m-%d")),
            )
        )
        count = fires.size().getInfo()
        return {
            "fire_risk_score": min(count * 10, 100),
            "fire_detected": count > 0,
        }
    except Exception:
        return {"fire_risk_score": 10, "fire_detected": False}

# ─── ENDPOINTS ────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat(), "version": "1.0.0"}

@app.post("/api/v1/scan", response_model=ScanResult)
async def scan_project(req: ScanRequest, background: BackgroundTasks):
    cache_key = f"sat:{req.project_id}"

    if not req.force_refresh:
        cached = await redis_client.get(cache_key)
        if cached:
            data = json.loads(cached)
            data["from_cache"] = True
            return ScanResult(**data)

    start = time.perf_counter()

    # Run all satellite queries concurrently
    sentinel_data, ch4, co2, fire_data = await asyncio.gather(
        query_sentinel2_ndvi(req.lat, req.lon, req.area_ha),
        query_tropomi_ch4(req.lat, req.lon),
        query_oco2_co2(req.lat, req.lon),
        query_modis_fire(req.lat, req.lon),
    )

    ndvi = sentinel_data["ndvi_mean"]
    biomass, baseline, leakage = calculate_tonnes(ndvi, req.area_ha, req.methodology)
    gross = biomass * req.area_ha * METHODOLOGY_PARAMS.get(
        req.methodology, METHODOLOGY_PARAMS["VM0044"]
    )["carbon_fraction"] * 3.67
    net = max(gross - baseline - leakage, 0)

    result = ScanResult(
        project_id=req.project_id,
        scan_date=date.today().isoformat(),
        ndvi_mean=ndvi,
        ndvi_min=sentinel_data["ndvi_min"],
        ndvi_max=sentinel_data["ndvi_max"],
        cloud_cover_pct=sentinel_data["cloud_cover_pct"],
        ch4_ppb=ch4,
        co2_ppm=co2,
        fire_risk_score=fire_data["fire_risk_score"],
        fire_detected=fire_data["fire_detected"],
        biomass_t_ha=biomass,
        baseline_tonnes=baseline,
        leakage_tonnes=leakage,
        estimated_tonnes=round(net, 2),
        scene_id=sentinel_data["scene_id"],
        from_cache=False,
    )

    # Cache for 7 days
    await redis_client.setex(cache_key, 604800, result.model_dump_json())

    # Notify project service
    await redis_client.publish("satellite:scan:complete", json.dumps({
        "project_id": req.project_id,
        "estimated_tonnes": result.estimated_tonnes,
        "ndvi_mean": result.ndvi_mean,
        "fire_detected": result.fire_detected,
    }))

    elapsed = int((time.perf_counter() - start) * 1000)
    logger.info(f"Scan complete for {req.project_id}: {result.estimated_tonnes}t in {elapsed}ms")

    return result

@app.delete("/api/v1/scan/{project_id}/cache")
async def invalidate_cache(project_id: str):
    await redis_client.delete(f"sat:{project_id}")
    return {"success": True}
