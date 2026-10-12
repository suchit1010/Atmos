/**
 * Atmos "God's Eye View" - Satellite & AI Multi-Modal Cross-Verification
 * Inspired by Bilawal Sidhu's God's Eye View geospatial architecture (github.com/bilawalsidhu/gods-eye-view)
 * Cross-references ground IoT sensor claims with multi-spectral satellite Earth observation.
 */

export interface SatelliteLayerData {
  id: "optical" | "thermal" | "ndvi" | "sar";
  name: string;
  source: string;
  resolution: string;
  spectralBand: string;
  detectedMetric: string;
  confidence: number;
  status: "CONFIRMED" | "ANALYZING" | "ALERT";
  description: string;
}

export interface SatelliteObservationRecord {
  facilityName: string;
  coordinates: {
    lat: number;
    lng: number;
    elevationM: number;
  };
  lastPassTimestamp: string;
  nextPassTimestamp: string;
  constellation: string[];
  crossVerificationScore: number;
  aiGroundTruthMatch: boolean;
  layers: SatelliteLayerData[];
  aiAnalysisSummary: string;
  solanaOracleSignature: string;
}

export const GODS_EYE_KALOL_OBSERVATION: SatelliteObservationRecord = {
  facilityName: "Kalol Biochar Pyrolysis Station #1",
  coordinates: {
    lat: 23.2798,
    lng: 72.4984,
    elevationM: 81,
  },
  lastPassTimestamp: "2026-10-12 14:18:02 UTC",
  nextPassTimestamp: "2026-10-13 04:32:10 UTC",
  constellation: ["Sentinel-2B (ESA)", "Landsat-9 (NASA)", "PlanetScope-Dove (3m)"],
  crossVerificationScore: 98.7,
  aiGroundTruthMatch: true,
  aiAnalysisSummary: "Multi-spectral orbital telemetry cross-matches ground IoT pyrometer. SWIR band confirms 580°C exothermic reaction inside retort chamber with zero fugitive methane plume.",
  solanaOracleSignature: "5Vn8r...9kLm2_Ed25519_SatOracle_Kalol",
  layers: [
    {
      id: "optical",
      name: "High-Res Optical RGB",
      source: "PlanetScope / Sentinel-2B",
      resolution: "3m / 10m",
      spectralBand: "B02 (Blue), B03 (Green), B04 (Red)",
      detectedMetric: "Feedstock pile volume: ~12.5 tonnes agricultural residue staged",
      confidence: 99.1,
      status: "CONFIRMED",
      description: "Visual imagery validates containment yard, dry feedstock storage, and no open-air burning.",
    },
    {
      id: "thermal",
      name: "Thermal Infrared (SWIR / TIRS)",
      source: "Landsat-9 TIRS-2 / Sentinel-2 SWIR",
      resolution: "20m",
      spectralBand: "B11 (1610 nm) & B12 (2190 nm)",
      detectedMetric: "Core reactor hotspot: 582°C localized signature",
      confidence: 98.4,
      status: "CONFIRMED",
      description: "Confirms controlled thermal decomposition inside insulated retort kiln matching logged batch run.",
    },
    {
      id: "ndvi",
      name: "NDVI Residue Collection Delta",
      source: "Sentinel-2 Multi-Spectral",
      resolution: "10m",
      spectralBand: "(B08 - B04) / (B08 + B04)",
      detectedMetric: "ΔNDVI: -0.28 on adjacent 4-hectare cotton parcel",
      confidence: 97.6,
      status: "CONFIRMED",
      description: "Demonstrates crop residues were harvested and diverted from field burning into the biochar kiln.",
    },
    {
      id: "sar",
      name: "SAR Radar Structural Integrity",
      source: "Sentinel-1 C-Band SAR",
      resolution: "5m",
      spectralBand: "VV / VH Polarisation (5.405 GHz)",
      detectedMetric: "Permanent metal kiln geometry radar backscatter confirmed",
      confidence: 99.8,
      status: "CONFIRMED",
      description: "All-weather radar verifies physical kiln presence and prevents fictitious facility duplication.",
    },
  ],
};
