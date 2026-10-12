"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Leaf,
  ShieldCheck,
  TrendingDown,
  RefreshCw,
  FileText,
  AlertTriangle,
  Car,
  Home,
  TreePine,
  ArrowLeft,
} from "lucide-react";
import confetti from "canvas-confetti";

interface Props {
  onBack?: () => void;
}

export const RiskStatisticView: React.FC<Props> = ({ onBack }) => {
  const [riskPercent, setRiskPercent] = useState(14.2);
  const [isRecalibrating, setIsRecalibrating] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<"Day" | "Week" | "Month">("Week");

  const handleRecalibrate = () => {
    setIsRecalibrating(true);
    setTimeout(() => {
      setRiskPercent(11.8);
      setIsRecalibrating(false);
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#52B788", "#E2F2DF", "#3EA572"],
      });
    }, 1000);
  };

  return (
    <div className="w-full h-full bg-[#F8F9FA] flex flex-col justify-between overflow-hidden relative select-none">
      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-20 no-scrollbar">
        {/* Header Bar */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                type="button"
                className="w-9 h-9 rounded-full bg-white border border-gray-100 flex items-center justify-center text-[#181B1A] hover:bg-gray-50 shadow-xs mr-1"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            {/* Avatar with leaf badge */}
            <div className="relative w-11 h-11">
              <div className="w-11 h-11 rounded-full bg-[#E2F2DF] flex items-center justify-center font-bold text-xs text-[#181B1A] border-2 border-white shadow-xs">
                LU
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#E2F2DF] rounded-full flex items-center justify-center border border-white">
                <Leaf className="w-2.5 h-2.5 text-[#3EA572]" />
              </div>
            </div>

            {/* Name and Level Progress Bar */}
            <div className="flex flex-col">
              <h2 className="text-[17px] font-bold text-[#181B1A] leading-tight">Ludmila</h2>
              <div className="mt-1 flex items-center">
                <div className="w-24 h-1.5 bg-[#E8EBE9] rounded-full relative">
                  <div className="w-10 h-full bg-[#3EA572] rounded-full" />
                  <div className="absolute left-9 -top-[3px] w-3 h-3 bg-[#3EA572] border-2 border-white rounded-full shadow-xs" />
                </div>
              </div>
            </div>
          </div>

          {/* Notification Button */}
          <button
            type="button"
            className="w-10 h-10 bg-[#141716] rounded-2xl flex items-center justify-center text-white shadow-xs hover:opacity-90 transition-opacity relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#FF4D4D] rounded-full border border-white" />
          </button>
        </header>

        {/* Title & Filter Tabs */}
        <div className="mt-5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E9491]">Risk Assessment</span>
            <h3 className="text-lg font-bold text-[#181B1A] leading-tight">CO₂ Impact Metrics</h3>
          </div>

          <div className="flex bg-[#EAECEB] p-1 rounded-full text-xs font-semibold">
            {(["Day", "Week", "Month"] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-2.5 py-0.5 rounded-full transition-all ${
                  selectedPeriod === period
                    ? "bg-[#181B1A] text-white shadow-xs"
                    : "text-[#8E9491] hover:text-[#181B1A]"
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* Radial CO2 Risk Gauge Card */}
        <div className="mt-4 p-5 rounded-3xl bg-[#E2F2DF] border border-[#D0E6CD] shadow-sm relative overflow-hidden text-center">
          <div className="flex items-center justify-between text-xs text-[#3EA572] font-semibold mb-2">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" />
              Verified Clean Index
            </span>
            <span className="bg-white/80 px-2 py-0.5 rounded-full text-[10px] text-[#181B1A]">
              Sentinel-2 Telemetry
            </span>
          </div>

          {/* SVG Radial Gauge */}
          <div className="relative w-44 h-44 mx-auto flex items-center justify-center my-1">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
              {/* Background dotted circle track */}
              <circle
                cx="80"
                cy="80"
                r="64"
                fill="none"
                stroke="#C6DEC3"
                strokeWidth="6"
                className="gauge-dotted-track"
              />
              {/* Progress arc */}
              <motion.circle
                cx="80"
                cy="80"
                r="64"
                fill="none"
                stroke="#3EA572"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray="402"
                initial={{ strokeDashoffset: 402 }}
                animate={{ strokeDashoffset: 402 - (402 * (100 - riskPercent)) / 100 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </svg>

            {/* Gauge Centered Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[10px] uppercase font-bold text-[#3EA572] tracking-wider">Risk Level</span>
              <span className="text-3xl font-extrabold text-[#181B1A] font-mono leading-none mt-1">
                {riskPercent}%
              </span>
              <span className="text-[11px] font-semibold text-[#3EA572] mt-1 flex items-center gap-0.5">
                <TrendingDown className="w-3 h-3" />
                LOW RISK
              </span>
            </div>
          </div>

          <p className="text-xs text-[#3F463E] leading-normal max-w-xs mx-auto mt-2">
            Your carbon footprint is <strong>85.8% cleaner</strong> than regional peer benchmark. Zero double-counting
            detected.
          </p>
        </div>

        {/* Category Breakdown Cards */}
        <div className="mt-4 space-y-2.5">
          <div className="p-3.5 rounded-2xl bg-white border border-gray-100 flex items-center justify-between shadow-soft">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-50 text-[#3EA572]">
                <Car className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#181B1A]">Transport Efficiency</div>
                <div className="text-[10px] text-[#8E9491]">Zero-emission bike & walking</div>
              </div>
            </div>
            <span className="font-mono font-bold text-xs text-[#3EA572]">-42.4%</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-gray-100 flex items-center justify-between shadow-soft">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <Home className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#181B1A]">Household Energy</div>
                <div className="text-[10px] text-[#8E9491]">Smart grid solar blend</div>
              </div>
            </div>
            <span className="font-mono font-bold text-xs text-blue-600">-18.1%</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-gray-100 flex items-center justify-between shadow-soft">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#E2F2DF] text-[#3EA572]">
                <TreePine className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#181B1A]">Agroforestry Offset</div>
                <div className="text-[10px] text-[#8E9491]">Araku & Sundarbans sinks</div>
              </div>
            </div>
            <span className="font-mono font-bold text-xs text-[#3EA572]">+64.5 tCO₂</span>
          </div>
        </div>

        {/* Action Button: Recalibrate */}
        <div className="mt-4">
          <button
            onClick={handleRecalibrate}
            disabled={isRecalibrating}
            type="button"
            className="w-full py-3 rounded-2xl bg-[#181B1A] hover:bg-[#252A28] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-action transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#52B788] ${isRecalibrating ? "animate-spin" : ""}`} />
            <span>{isRecalibrating ? "Re-scanning Sensor Feed..." : "Recalibrate Sensor Data"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
