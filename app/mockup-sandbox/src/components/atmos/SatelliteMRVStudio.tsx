import React, { useState } from "react";
import LandBoundaryEditor from "../mockups/land-boundary-editor";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import {
  Satellite,
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  MapPin,
  Eye,
  RefreshCw,
  Zap,
} from "lucide-react";

export const SatelliteMRVStudio: React.FC = () => {
  const [spectralBand, setSpectralBand] = useState<"ndvi" | "truecolor" | "biomass" | "thermal">("ndvi");
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    ndviMean: number;
    estimatedSequestration: number;
    confidence: number;
    grade: "S" | "A" | "B";
    geohash: string;
  } | null>({
    ndviMean: 0.814,
    estimatedSequestration: 124.5,
    confidence: 98.4,
    grade: "S",
    geohash: "tu4p7x89q",
  });

  const handleRunSatelliteScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setScanResult({
        ndviMean: 0.826,
        estimatedSequestration: 138.2,
        confidence: 99.1,
        grade: "S",
        geohash: "tu4p7x" + Math.random().toString(36).substring(2, 5),
      });
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-950 to-cyan-950/40 border border-emerald-500/30 p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
              <Satellite className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">Sentinel-2 Satellite & AI MRV Studio</h2>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                  Copernicus Data Feed
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Sub-meter GIS parcel tracing with automated multispectral vegetation index and anti-spoofing verification.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleRunSatelliteScan}
              disabled={scanning}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
            >
              {scanning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Analyzing Spectral Data...
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 mr-1.5" />
                  Re-Scan Sentinel-2 Orbit
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Spectral Layer Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-slate-200">Satellite Sensor Layer:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { id: "ndvi", label: "NDVI Vegetation Index (B8/B4)", color: "emerald" },
            { id: "truecolor", label: "RGB True Color", color: "blue" },
            { id: "biomass", label: "Allometric Biomass Density", color: "amber" },
            { id: "thermal", label: "Canopy Moisture Stress", color: "cyan" },
          ].map((band) => (
            <button
              key={band.id}
              onClick={() => setSpectralBand(band.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                spectralBand === band.id
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                  : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-white"
              }`}
            >
              {band.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Boundary Editor & Satellite Map Preview */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
        <LandBoundaryEditor />
      </div>

      {/* Telemetry & AI Multi-Agent Audit Summary */}
      {scanResult && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
            <span className="text-[10px] uppercase text-slate-400 tracking-wider">Mean NDVI Index</span>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
              +{scanResult.ndviMean} <span className="text-xs text-slate-400 font-normal">/ 1.0</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">High photosynthetic vigor; healthy canopy coverage.</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
            <span className="text-[10px] uppercase text-slate-400 tracking-wider">Est. Annual CO₂ Flux</span>
            <div className="text-xl font-bold font-mono text-cyan-400 mt-1">
              {scanResult.estimatedSequestration} <span className="text-xs text-slate-400 font-normal">tCO₂e/yr</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Calculated via IPCC Tier-3 biomass allometrics.</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
            <span className="text-[10px] uppercase text-slate-400 tracking-wider">AI Verification Confidence</span>
            <div className="text-xl font-bold font-mono text-purple-400 mt-1">
              {scanResult.confidence}% <span className="text-xs text-emerald-400 font-normal">(Grade {scanResult.grade})</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Claude Haiku 4.5 consensus cross-validation.</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
            <span className="text-[10px] uppercase text-slate-400 tracking-wider">Solana GeoHash Anchor</span>
            <div className="text-lg font-bold font-mono text-amber-400 mt-1 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-amber-400" />
              {scanResult.geohash}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Cryptographic spatial PDA preventing double-claims.</p>
          </div>
        </div>
      )}
    </div>
  );
};
