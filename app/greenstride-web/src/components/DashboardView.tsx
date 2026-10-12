"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Leaf,
  Calendar,
  Bell,
  Search,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  TreePine,
  Activity,
  Globe2,
  Sparkles,
  Smartphone,
  Eye,
  CheckCircle2,
  Flame,
  Zap,
} from "lucide-react";
import confetti from "canvas-confetti";

interface Props {
  onOpenMobileScreen?: (screen: "performance" | "onboarding" | "risk") => void;
}

export const DashboardView: React.FC<Props> = ({ onOpenMobileScreen }) => {
  const [activeNav, setActiveNav] = useState("overview");
  const [totalOffset, setTotalOffset] = useState(14820);
  const [offsetVelocity, setOffsetVelocity] = useState(84);

  const handleSimulateBoost = () => {
    setTotalOffset((prev) => prev + 25);
    setOffsetVelocity((v) => Math.min(100, v + 2));
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: ["#45A849", "#E2F2DF", "#0C150A"],
    });
  };

  return (
    <div className="min-h-screen bg-[#F7F9F6] text-[#0C150A] flex flex-col font-sans selection:bg-[#E2F2DF] selection:text-[#0C150A]">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#F7F9F6]/90 backdrop-blur-md px-6 lg:px-12 py-4 border-b border-[#0C150A]/5 transition-all">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#E2F2DF] flex items-center justify-center text-[#0C150A] shadow-sm">
              <Leaf className="w-6 h-6 text-[#0C150A]" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight-custom text-[#0C150A] block leading-none">
                GreenStride
              </span>
              <span className="text-[11px] font-semibold text-[#3F463E]/70 uppercase tracking-widest">
                Atmos Network
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav
            aria-label="Main Navigation"
            className="hidden md:flex items-center bg-white p-1.5 rounded-full border border-gray-100 shadow-sm text-xs"
          >
            {[
              { id: "overview", label: "Overview" },
              { id: "co2-statistics", label: "CO2 Statistics" },
              { id: "trees", label: "Tree Plantings" },
              { id: "biosphere", label: "3D Biosphere" },
              { id: "verification", label: "Solana Verification" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`px-5 py-2 rounded-full font-semibold transition-colors ${
                  activeNav === item.id
                    ? "bg-[#0C150A] text-white"
                    : "text-[#3F463E] hover:text-[#0C150A]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            {/* Date Pill */}
            <div className="hidden sm:flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-100 text-xs font-medium text-[#3F463E] shadow-sm">
              <Calendar className="w-3.5 h-3.5 text-[#3F463E]/70" />
              <span>Oct 2026 • Live Devnet</span>
            </div>

            {/* Notification Bell */}
            <button
              type="button"
              className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-[#0C150A] relative hover:bg-gray-50 shadow-sm transition-colors"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#45A849] ring-2 ring-white" />
            </button>

            {/* Profile Avatar */}
            <div className="flex items-center gap-2 pl-1">
              <div className="w-10 h-10 rounded-full bg-[#E2F2DF] border border-[#d3ebd0] flex items-center justify-center font-bold text-xs text-[#0C150A] shadow-sm">
                LU
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="max-w-[1440px] w-full mx-auto px-6 lg:px-12 py-8 flex-1 space-y-8">
        {/* Hero Section Banner */}
        <section className="bg-gradient-to-r from-[#E2F2DF]/80 via-[#ECF7EA] to-[#E2F2DF]/50 rounded-4xl p-8 lg:p-10 border border-[#d3ebd0]/60 shadow-soft relative overflow-hidden">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3.5 py-1.5 rounded-full text-xs font-bold text-[#0C150A] mb-4 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#45A849] animate-pulse" />
              <span>Sentinel-2 Multispectral Orbit Active (10m GSD)</span>
            </div>

            <h2 className="text-3xl lg:text-5xl font-extrabold tracking-tight-custom text-[#0C150A] leading-[1.1]">
              Ecological intelligence meets on-chain carbon precision.
            </h2>

            <p className="mt-3 text-sm lg:text-base text-[#3F463E] max-w-2xl leading-relaxed">
              Real-world physical carbon sequestration captured via satellite telemetry, zero-knowledge proven, and
              minted as verified SPL token assets on Solana Devnet.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={handleSimulateBoost}
                className="bg-[#0C150A] hover:bg-[#1A2617] text-white px-6 py-3 rounded-full font-bold text-xs flex items-center gap-2 shadow-sm transition-transform active:scale-95"
              >
                <Zap className="w-4 h-4 text-[#E2F2DF]" />
                <span>Simulate Carbon Mint (+25 tCO₂e)</span>
              </button>

              <button
                onClick={() => onOpenMobileScreen?.("performance")}
                className="bg-white hover:bg-gray-50 text-[#0C150A] border border-gray-200 px-5 py-3 rounded-full font-semibold text-xs flex items-center gap-2 shadow-xs transition-colors"
              >
                <Smartphone className="w-4 h-4 text-[#45A849]" />
                <span>Launch Mobile 3D Mode</span>
              </button>

              <button
                onClick={() => onOpenMobileScreen?.("risk")}
                className="bg-white hover:bg-gray-50 text-[#0C150A] border border-gray-200 px-5 py-3 rounded-full font-semibold text-xs flex items-center gap-2 shadow-xs transition-colors"
              >
                <Activity className="w-4 h-4 text-[#3EA572]" />
                <span>CO₂ Risk Statistic</span>
              </button>
            </div>
          </div>
        </section>

        {/* 4 Key Statistics Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Stat 1: Total Verified Carbon */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-soft">
            <div className="flex items-center justify-between text-xs text-[#3F463E]">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Total Carbon Offset</span>
              <div className="p-2 rounded-xl bg-[#E2F2DF] text-[#45A849]">
                <Leaf className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 text-3xl font-extrabold text-[#0C150A] font-mono tracking-tight">
              {totalOffset.toLocaleString()}{" "}
              <span className="text-sm font-normal text-[#3F463E]">tCO₂e</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-[#45A849] font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+18.4% this quarter (Solana Devnet)</span>
            </div>
          </div>

          {/* Stat 2: Native Trees */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-soft">
            <div className="flex items-center justify-between text-xs text-[#3F463E]">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Native Trees Geotagged</span>
              <div className="p-2 rounded-xl bg-[#E2F2DF] text-[#45A849]">
                <TreePine className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 text-3xl font-extrabold text-[#0C150A] font-mono tracking-tight">
              128,450
            </div>
            <div className="mt-2 text-xs text-[#3F463E]">
              <span className="font-semibold text-[#0C150A]">96.2%</span> survival rate across parcels
            </div>
          </div>

          {/* Stat 3: Sensor Mesh */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-soft">
            <div className="flex items-center justify-between text-xs text-[#3F463E]">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Active Sensor Mesh</span>
              <div className="p-2 rounded-xl bg-[#E2F2DF] text-[#45A849]">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 text-3xl font-extrabold text-[#0C150A] font-mono tracking-tight">
              98.4%
            </div>
            <div className="mt-2 text-xs text-[#45A849] font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#45A849]" />
              <span>Sentinel-2 L2A & PlanetScope online</span>
            </div>
          </div>

          {/* Stat 4: Canopy Coverage */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-soft">
            <div className="flex items-center justify-between text-xs text-[#3F463E]">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Canopy Restored</span>
              <div className="p-2 rounded-xl bg-[#E2F2DF] text-[#45A849]">
                <Globe2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 text-3xl font-extrabold text-[#0C150A] font-mono tracking-tight">
              4.8 <span className="text-sm font-normal text-[#3F463E]">Hectares</span>
            </div>
            <div className="mt-2 text-xs text-[#3F463E]">Araku & Sundarbans conservation zones</div>
          </div>
        </section>

        {/* 2-Column: Radial Gauge & Project Map */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Interactive Radial Gauge (from Stitch Screen 1) */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-soft flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#0C150A]">Absorption Velocity</h3>
                  <p className="text-xs text-[#3F463E]">Real-time photosynthesis flux</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#E2F2DF] text-[#45A849] text-xs font-bold font-mono">
                  Grade S
                </span>
              </div>

              {/* Radial Gauge SVG */}
              <div className="relative w-48 h-48 mx-auto my-6 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                  <circle
                    cx="80"
                    cy="80"
                    r="64"
                    fill="none"
                    stroke="#E2F2DF"
                    strokeWidth="10"
                    className="gauge-dots"
                  />
                  <motion.circle
                    cx="80"
                    cy="80"
                    r="64"
                    fill="none"
                    stroke="#45A849"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray="402"
                    initial={{ strokeDashoffset: 402 }}
                    animate={{ strokeDashoffset: 402 - (402 * offsetVelocity) / 100 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-extrabold text-[#0C150A] font-mono">{offsetVelocity}%</span>
                  <span className="text-[11px] font-semibold text-[#45A849] uppercase tracking-wider mt-0.5">
                    Capacity
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F7F9F6] border border-gray-100 text-xs text-[#3F463E] space-y-1">
              <div className="flex justify-between">
                <span>NDVI Spectral Reading:</span>
                <span className="font-mono font-bold text-[#0C150A]">+0.824 / 1.0</span>
              </div>
              <div className="flex justify-between">
                <span>Solana Proof Memo:</span>
                <span className="font-mono text-[#45A849]">ATMOS:ORBIT:892</span>
              </div>
            </div>
          </div>

          {/* Right 2-Cols: Active Restoration Parcels */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-soft flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-[#0C150A]">Active Verified Parcels</h3>
                  <p className="text-xs text-[#3F463E]">Cryptographically anchored in Solana PDA state</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onOpenMobileScreen?.("onboarding")}
                    className="text-xs text-[#45A849] hover:underline font-semibold flex items-center gap-1"
                  >
                    <span>View Onboarding &rarr;</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    title: "Sundarbans Coastal Mangrove",
                    location: "West Bengal, India / BD",
                    sequestration: "4,200 tCO₂e",
                    sensor: "Sentinel-2 L2A",
                    confidence: "98.4%",
                    grade: "S",
                  },
                  {
                    title: "Araku Valley Native Shade Coffee",
                    location: "Eastern Ghats, AP",
                    sequestration: "8,900 tCO₂e",
                    sensor: "PlanetScope 3m",
                    confidence: "94.1%",
                    grade: "A",
                  },
                  {
                    title: "Nilgiri Biomass Pyrolysis Kiln",
                    location: "Western Ghats, TN",
                    sequestration: "1,450 tCO₂e",
                    sensor: "Thermal Spectral",
                    confidence: "99.1%",
                    grade: "S",
                  },
                  {
                    title: "Thar Desert Agro-Voltaic Solar",
                    location: "Jaisalmer, Rajasthan",
                    sequestration: "12,000 tCO₂e",
                    sensor: "Telemetry Inverter",
                    confidence: "88.7%",
                    grade: "B",
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-[#F7F9F6] border border-gray-100 hover:border-[#45A849]/40 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <span className="px-2 py-0.5 rounded-full bg-white text-[#45A849] font-bold text-[10px] border border-gray-100 font-mono">
                        Grade {item.grade} • {item.confidence}
                      </span>
                      <span className="text-[11px] font-mono text-[#0C150A] font-bold">{item.sequestration}</span>
                    </div>
                    <h4 className="font-bold text-sm text-[#0C150A] mt-2">{item.title}</h4>
                    <p className="text-[11px] text-[#3F463E] mt-0.5">{item.location}</p>
                    <div className="mt-3 pt-2 border-t border-gray-200/60 flex items-center justify-between text-[10px] text-[#3F463E]">
                      <span>Sensor: {item.sensor}</span>
                      <span className="text-[#45A849] font-semibold flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                        Anchor Verified
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 p-4 rounded-2xl bg-[#E2F2DF] border border-[#d3ebd0] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#45A849] shrink-0" />
                <span className="text-[#0C150A]">
                  <strong>Zero Double-Counting:</strong> Every parcel boundary is hashed into Solana PDA state accounts.
                </span>
              </div>
              <a
                href="https://explorer.solana.com/?cluster=devnet"
                target="_blank"
                rel="noreferrer"
                className="bg-[#0C150A] hover:bg-[#1A2617] text-white px-4 py-2 rounded-full font-bold text-xs flex items-center gap-1.5 shrink-0"
              >
                <span>Solana Explorer</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#0C150A]/5 bg-white px-6 lg:px-12 py-6 text-xs text-[#3F463E]">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>🌿 GreenStride Atmos Network</span>
            <span>•</span>
            <span className="font-semibold text-[#0C150A]">Next.js Full Ecological Infrastructure</span>
          </div>
          <div className="flex items-center gap-4 text-[#3F463E]">
            <a href="#overview" className="hover:text-[#0C150A]">Overview</a>
            <a href="#co2-statistics" className="hover:text-[#0C150A]">CO2 Statistics</a>
            <a href="#verification" className="hover:text-[#0C150A]">Verification</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
