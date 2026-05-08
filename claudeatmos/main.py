# services/ai/main.py
"""
KARTA AI Service — Carbon credit scoring and fraud detection.
FastAPI + Claude API. Fallback to rule-based scoring if Claude unavailable.
"""
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from typing import Optional
from contextlib import asynccontextmanager
import anthropic
import redis.asyncio as aioredis
import asyncio
import hashlib
import json
import logging
import os
import time
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ─── STARTUP / SHUTDOWN ───────────────────────────────────────────────────────

redis_client: aioredis.Redis = None
anthropic_client: anthropic.AsyncAnthropic = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global redis_client, anthropic_client
    redis_client = aioredis.from_url(
        os.getenv("REDIS_URL", "redis://localhost:6379"),
        decode_responses=True,
    )
    anthropic_client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    logger.info("AI Service started")
    yield
    await redis_client.aclose()
    logger.info("AI Service shutdown")

app = FastAPI(title="KARTA AI Service", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(","),
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# ─── MODELS ───────────────────────────────────────────────────────────────────

class ScoreRequest(BaseModel):
    project_id: str
    methodology: str
    registry: Optional[str] = None
    vintage: int = Field(..., ge=2020, le=2040)
    location: str
    tonnes: float = Field(..., gt=0)
    entity_type: str
    ndvi: Optional[float] = Field(None, ge=0, le=1)
    satellite_data: Optional[dict] = None

    @validator("tonnes")
    def tonnes_positive(cls, v):
        if v <= 0:
            raise ValueError("Tonnes must be positive")
        return v

class ScoreResponse(BaseModel):
    project_id: str
    overall_score: int
    additionality: int
    permanence: int
    methodology_fit: int
    vintage_score: int
    leakage_risk: int
    co_benefits: int
    satellite_coverage: int
    auditor_quality: int
    ccp_eligible: bool
    price_min_inr: float
    price_max_inr: float
    ai_reasoning: str
    model_version: str
    ai_generated: bool
    confidence: str
    from_cache: bool = False

class FraudCheckRequest(BaseModel):
    project_id: str
    org_id: str
    centroid_lat: float
    centroid_lon: float
    area_ha: float
    claimed_tonnes: float
    methodology: str
    ndvi: Optional[float] = None

class FraudCheckResponse(BaseModel):
    project_id: str
    is_suspicious: bool
    risk_score: int          # 0-100, higher = more suspicious
    flags: list[str]
    recommendation: str      # APPROVE | MANUAL_REVIEW | REJECT

# ─── SCORING SYSTEM PROMPT ────────────────────────────────────────────────────

CARBON_SCORING_PROMPT = """
You are KARTA Protocol's expert carbon credit scoring engine with deep knowledge
of the 2025-2026 India VCM (Voluntary Carbon Market) and global carbon standards.

You score carbon credits across 8 dimensions, each 0-100:

1. additionality: Would this project exist without carbon revenue? (100=highly additional)
2. permanence: Risk of reversal over 100 years (100=permanent, e.g. biochar)
3. methodology_fit: How well the methodology matches the project type (100=perfect fit)
4. vintage_score: Recency (2025=100, 2024=90, 2023=80, 2022=65, 2021=50)
5. leakage_risk: 100 means NO leakage risk. Deforestation displaced=low score.
6. co_benefits: SDG alignment, biodiversity, community income (100=excellent)
7. satellite_coverage: Quality of satellite verification data (100=excellent NDVI data)
8. auditor_quality: Registry and VVB reputation (100=Verra/Gold Standard + top VVB)

2026 India VCM price context:
- Biochar (VM0044): Rs 3,000-4,500/tonne
- Soil Carbon (VM0042): Rs 2,500-3,800/tonne
- Reforestation ARR (VM0047): Rs 2,000-3,500/tonne
- Blue Carbon (VM0033): Rs 4,000-5,500/tonne
- Industrial Efficiency (AMS-II.C): Rs 2,000-4,200/tonne

CCP eligibility requires: additionality>70, permanence>60, methodology_fit>75, overall>72

Return ONLY valid JSON, no markdown, no preamble, no explanation:
{
  "overall_score": integer,
  "additionality": integer,
  "permanence": integer,
  "methodology_fit": integer,
  "vintage_score": integer,
  "leakage_risk": integer,
  "co_benefits": integer,
  "satellite_coverage": integer,
  "auditor_quality": integer,
  "ccp_eligible": boolean,
  "price_min_inr": float,
  "price_max_inr": float,
  "ai_reasoning": "2-3 sentence assessment of key strengths and risks"
}
"""

# ─── RULE-BASED FALLBACK ──────────────────────────────────────────────────────

def rule_based_score(req: ScoreRequest) -> dict:
    """Fallback when Claude API is unavailable."""
    vintage_map = {2025: 95, 2024: 85, 2023: 75, 2022: 60, 2021: 50}
    vintage_score = vintage_map.get(req.vintage, 40)

    methodology_scores = {
        "VM0044": {"add": 85, "perm": 90, "fit": 92, "leak": 88, "co": 75},
        "VM0042": {"add": 78, "perm": 72, "fit": 85, "leak": 80, "co": 82},
        "VM0047": {"add": 80, "perm": 75, "fit": 88, "leak": 70, "co": 90},
        "VM0033": {"add": 88, "perm": 82, "fit": 90, "leak": 85, "co": 92},
    }
    m = methodology_scores.get(req.methodology, {"add":70,"perm":65,"fit":70,"leak":70,"co":70})

    sat_score = int(req.ndvi * 100) if req.ndvi else 60
    registry_score = 85 if req.registry in ["Verra VCS", "Gold Standard"] else 65

    overall = int((m["add"]+m["perm"]+m["fit"]+vintage_score+m["leak"]+m["co"]+sat_score+registry_score)/8)

    price_base = {"VM0044":3800,"VM0042":3200,"VM0047":2800,"VM0033":4800}.get(req.methodology, 2500)
    price_adj = (overall - 70) * 30

    return {
        "overall_score": overall,
        "additionality": m["add"],
        "permanence": m["perm"],
        "methodology_fit": m["fit"],
        "vintage_score": vintage_score,
        "leakage_risk": m["leak"],
        "co_benefits": m["co"],
        "satellite_coverage": sat_score,
        "auditor_quality": registry_score,
        "ccp_eligible": overall >= 72 and m["add"] >= 70,
        "price_min_inr": max(price_base + price_adj - 500, 1500),
        "price_max_inr": price_base + price_adj + 500,
        "ai_reasoning": f"Rule-based assessment: {req.methodology} project in {req.location}. "
                        f"Score based on methodology defaults. AI scoring unavailable - confidence LOW.",
    }

# ─── ENDPOINTS ────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    redis_ok = False
    try:
        await redis_client.ping()
        redis_ok = True
    except Exception:
        pass

    return {
        "status": "healthy" if redis_ok else "degraded",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "services": {
            "redis": {"status": "healthy" if redis_ok else "unhealthy"},
            "anthropic": {"status": "healthy"},
        }
    }

@app.post("/api/v1/score", response_model=ScoreResponse)
async def score_project(req: ScoreRequest, background: BackgroundTasks):
    # Check cache
    cache_key = f"ai:{req.project_id}"
    cached = await redis_client.get(cache_key)
    if cached:
        data = json.loads(cached)
        data["from_cache"] = True
        return ScoreResponse(**data)

    start = time.perf_counter()
    ai_generated = True
    confidence = "HIGH"
    result = {}

    try:
        context = f"""
Score this carbon credit:
- Project ID: {req.project_id}
- Methodology: {req.methodology}
- Registry: {req.registry or 'Not yet registered'}
- Vintage year: {req.vintage}
- Location: {req.location}
- Claimed tonnes: {req.tonnes} tCO2e
- Entity type: {req.entity_type}
- NDVI (satellite): {req.ndvi or 'Not available'}
- Additional satellite data: {json.dumps(req.satellite_data) if req.satellite_data else 'Not available'}
"""
        response = await asyncio.wait_for(
            anthropic_client.messages.create(
                model="claude-sonnet-4-5",
                max_tokens=600,
                system=CARBON_SCORING_PROMPT,
                messages=[{"role": "user", "content": context}],
            ),
            timeout=25.0,
        )
        text = response.content[0].text.strip()
        result = json.loads(text)

    except asyncio.TimeoutError:
        logger.warning(f"Claude timeout for project {req.project_id}, using rule-based")
        result = rule_based_score(req)
        ai_generated = False
        confidence = "LOW"

    except Exception as e:
        logger.error(f"Claude error for {req.project_id}: {e}")
        result = rule_based_score(req)
        ai_generated = False
        confidence = "LOW"

    elapsed = int((time.perf_counter() - start) * 1000)
    logger.info(f"Scored {req.project_id} in {elapsed}ms (ai={ai_generated})")

    score_data = {
        **result,
        "project_id": req.project_id,
        "model_version": "claude-sonnet-4-5" if ai_generated else "rule-based-v1",
        "ai_generated": ai_generated,
        "confidence": confidence,
        "from_cache": False,
    }

    # Cache for 24h
    await redis_client.setex(cache_key, 86400, json.dumps(score_data))

    # Publish result for project service to consume
    await redis_client.publish("ai:score:complete", json.dumps({
        "project_id": req.project_id,
        "overall_score": result["overall_score"],
        "ccp_eligible": result["ccp_eligible"],
        "price_min_inr": result["price_min_inr"],
        "price_max_inr": result["price_max_inr"],
    }))

    return ScoreResponse(**score_data)

@app.post("/api/v1/fraud-check", response_model=FraudCheckResponse)
async def fraud_check(req: FraudCheckRequest):
    flags = []
    risk_score = 0

    # Check 1: Claimed tonnes vs area plausibility
    max_tonnes_per_ha = {
        "VM0044": 12, "VM0042": 6, "VM0047": 8, "VM0033": 15,
    }
    max_rate = max_tonnes_per_ha.get(req.methodology, 8)
    if req.area_ha > 0:
        rate = req.claimed_tonnes / req.area_ha
        if rate > max_rate * 1.5:
            flags.append(f"Claimed rate {rate:.1f} t/ha exceeds methodology maximum {max_rate} t/ha by >50%")
            risk_score += 35

    # Check 2: NDVI vs claimed biomass plausibility
    if req.ndvi is not None:
        if req.ndvi < 0.3 and req.claimed_tonnes > 0:
            flags.append(f"Low NDVI ({req.ndvi:.2f}) inconsistent with claimed carbon sequestration")
            risk_score += 25

    # Check 3: Duplicate coordinates (raw DB check via redis cache)
    coord_key = f"coords:{req.centroid_lat:.4f}:{req.centroid_lon:.4f}"
    existing_org = await redis_client.get(coord_key)
    if existing_org and existing_org != req.org_id:
        flags.append("GPS coordinates match a project from a different organisation")
        risk_score += 40

    # Cache this org's coordinate
    await redis_client.setex(coord_key, 86400 * 30, req.org_id)

    # Check 4: Very large first project (new org with huge claim)
    if req.claimed_tonnes > 10000:
        flags.append("Very large first project - recommend enhanced due diligence")
        risk_score += 15

    is_suspicious = risk_score >= 35
    if risk_score >= 60:
        recommendation = "REJECT"
    elif risk_score >= 35:
        recommendation = "MANUAL_REVIEW"
    else:
        recommendation = "APPROVE"

    return FraudCheckResponse(
        project_id=req.project_id,
        is_suspicious=is_suspicious,
        risk_score=min(risk_score, 100),
        flags=flags,
        recommendation=recommendation,
    )

@app.delete("/api/v1/score/{project_id}/cache")
async def invalidate_cache(project_id: str):
    await redis_client.delete(f"ai:{project_id}")
    return {"success": True, "message": "Cache cleared"}
