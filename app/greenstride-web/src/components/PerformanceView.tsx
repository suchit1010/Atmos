"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Leaf,
  Flame,
  Footprints,
  Globe2,
  TreePine,
  ShieldCheck,
  Compass,
  BarChart3,
  User,
  Home,
  Zap,
} from "lucide-react";
import confetti from "canvas-confetti";

interface Props {
  onNavigateToRisk?: () => void;
}

export const PerformanceView: React.FC<Props> = ({ onNavigateToRisk }) => {
  const [viewMode, setViewMode] = useState<"3D" | "2D">("3D");
  const [steps, setSteps] = useState(8420);
  const [isStriding, setIsStriding] = useState(false);
  const [activeTab, setActiveTab] = useState<"home" | "stats" | "map" | "profile">("stats");

  const handleStartStride = () => {
    setIsStriding(true);
    setSteps((s) => s + 350);

    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.8 },
      colors: ["#35C46A", "#EBF7EE", "#8DC698", "#181B1A"],
    });

    setTimeout(() => setIsStriding(false), 1500);
  };

  return (
    <div className="w-full h-full bg-[#F8F9FA] flex flex-col justify-between overflow-hidden relative select-none">
      {/* Scrollable Container */}
      <div className="flex-1 overflow-y-auto px-6 pt-5 pb-24 no-scrollbar">
        {/* Header Bar */}
        <header className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-3">
            {/* Avatar with leaf badge */}
            <div className="relative">
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#35C46A] to-[#8DC698] p-0.5 shadow-sm">
                <div className="w-full h-full rounded-full bg-[#EBF7EE] flex items-center justify-center font-bold text-xs text-[#181B1A]">
                  LU
                </div>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-xs">
                <Leaf className="w-2.5 h-2.5 text-[#35C46A]" />
              </div>
            </div>

            {/* Name & Slider Bar */}
            <div>
              <div className="text-[17px] font-semibold text-[#181B1A] tracking-tight">Ludmila</div>
              <div className="flex items-center mt-1 w-24">
                <div className="w-full bg-[#E5EAE7] h-[5px] rounded-full relative flex items-center">
                  <motion.div
                    animate={{ width: `${(steps / 10000) * 100}%` }}
                    className="bg-[#78BC8A] h-[5px] rounded-l-full"
                  />
                  <div
                    style={{ left: `${Math.min(90, (steps / 10000) * 100)}%` }}
                    className="w-2.5 h-2.5 rounded-full bg-white border-[2.5px] border-[#66B87B] absolute shadow-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notification Button */}
          <button
            type="button"
            className="w-10 h-10 rounded-2xl bg-[#1C1F22] flex items-center justify-center text-white relative shadow-sm hover:opacity-90 transition-opacity"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#35C46A] ring-2 ring-[#1C1F22]" />
          </button>
        </header>

        {/* 2D / 3D Mode Switcher */}
        <div className="mt-5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E9493]">Visualization</span>
            <h2 className="text-lg font-bold text-[#181B1A] leading-tight">Eco Biosphere</h2>
          </div>

          <div className="bg-[#EAECEB] p-1 rounded-full flex items-center text-xs font-semibold">
            <button
              onClick={() => setViewMode("3D")}
              className={`px-3 py-1 rounded-full transition-all ${
                viewMode === "3D" ? "bg-[#181B1A] text-white shadow-xs" : "text-[#8E9493] hover:text-[#181B1A]"
              }`}
            >
              3D Globe
            </button>
            <button
              onClick={() => setViewMode("2D")}
              className={`px-3 py-1 rounded-full transition-all ${
                viewMode === "2D" ? "bg-[#181B1A] text-white shadow-xs" : "text-[#8E9493] hover:text-[#181B1A]"
              }`}
            >
              2D Flat
            </button>
          </div>
        </div>

        {/* 3D / 2D Earth Canvas */}
        <div className="mt-4 relative h-64 rounded-3xl bg-gradient-to-b from-[#EBF7EE]/60 to-[#F0F5F1]/80 border border-[#E2EBE4] overflow-hidden flex items-center justify-center">
          {/* Animated Globe Orbit */}
          <motion.div
            animate={{ rotate: viewMode === "3D" ? 360 : 0 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="relative w-48 h-48 rounded-full bg-gradient-to-tr from-[#35C46A]/20 via-[#EBF7EE] to-white border border-[#A6DDB4] shadow-[0_12px_30px_rgba(53,196,106,0.18)] flex items-center justify-center"
          >
            {/* Grid Latitude Lines */}
            <svg className="absolute inset-0 w-full h-full text-[#78BC8A]/30" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="1" />
              <ellipse cx="50" cy="50" rx="46" ry="18" fill="none" stroke="currentColor" strokeWidth="1" />
              <ellipse cx="50" cy="50" rx="46" ry="32" fill="none" stroke="currentColor" strokeWidth="1" />
              <line x1="50" y1="2" x2="50" y2="98" stroke="currentColor" strokeWidth="1" />
            </svg>

            {/* Glowing Eco Nodes */}
            <motion.div
              animate={{ scale: [1, 1.25, 1] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="absolute top-10 left-12 w-3.5 h-3.5 rounded-full bg-[#35C46A] border-2 border-white shadow-sm flex items-center justify-center"
            >
              <div className="w-1 h-1 rounded-full bg-white" />
            </motion.div>

            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 3, repeat: Infinity, delay: 0.8 }}
              className="absolute bottom-12 right-14 w-3 h-3 rounded-full bg-[#8DC698] border-2 border-white shadow-sm"
            />

            <div className="text-center z-10">
              <Globe2 className="w-8 h-8 text-[#35C46A] mx-auto opacity-80" />
              <span className="text-[10px] font-mono text-[#35C46A] font-bold mt-1 block">Live Orbit Active</span>
            </div>
          </motion.div>

          {/* Floating Pill on top of globe */}
          <div className="absolute bottom-3 left-4 right-4 bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-gray-100 flex items-center justify-between text-xs shadow-xs">
            <span className="text-[#8E9493]">Real-Time Sync:</span>
            <span className="font-mono font-bold text-[#35C46A] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#35C46A] animate-pulse" />
              Sentinel-2 Orbit 18B
            </span>
          </div>
        </div>

        {/* Performance Metric Cards */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {/* Card 1: Daily Steps */}
          <div className="p-3.5 rounded-2xl bg-white border border-gray-100 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#8E9493]">Daily Steps</span>
              <div className="p-1 rounded-lg bg-[#EBF7EE] text-[#35C46A]">
                <Footprints className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 text-xl font-extrabold text-[#181B1A] font-mono">
              {steps.toLocaleString()}
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px] text-[#8E9493]">
              <span>Goal: 10,000</span>
              <span className="text-[#35C46A] font-bold">{Math.round((steps / 10000) * 100)}%</span>
            </div>
          </div>

          {/* Card 2: CO2 Saved */}
          <div
            onClick={onNavigateToRisk}
            className="p-3.5 rounded-2xl bg-white border border-gray-100 shadow-soft cursor-pointer hover:border-[#35C46A]/50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#8E9493]">CO₂ Avoided</span>
              <div className="p-1 rounded-lg bg-[#EBF7EE] text-[#35C46A]">
                <Leaf className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 text-xl font-extrabold text-[#35C46A] font-mono">
              2.4 <span className="text-xs text-[#8E9493] font-normal">kg</span>
            </div>
            <div className="mt-1 text-[10px] text-[#35C46A] font-medium flex items-center gap-1">
              <span>View Risk &rarr;</span>
            </div>
          </div>

          {/* Card 3: Active Energy */}
          <div className="p-3.5 rounded-2xl bg-white border border-gray-100 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#8E9493]">Energy Spent</span>
              <div className="p-1 rounded-lg bg-orange-50 text-orange-500">
                <Flame className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 text-xl font-extrabold text-[#181B1A] font-mono">
              420 <span className="text-xs text-[#8E9493] font-normal">kcal</span>
            </div>
            <div className="mt-1 text-[10px] text-[#8E9493]">Active Metabolic Burn</div>
          </div>

          {/* Card 4: Trees Funded */}
          <div className="p-3.5 rounded-2xl bg-white border border-gray-100 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#8E9493]">Trees Funded</span>
              <div className="p-1 rounded-lg bg-[#EBF7EE] text-[#35C46A]">
                <TreePine className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 text-xl font-extrabold text-[#181B1A] font-mono">+3</div>
            <div className="mt-1 text-[10px] text-[#35C46A] font-medium">Mangrove Seedlings</div>
          </div>
        </div>

        {/* Start Eco Stride Action Button */}
        <div className="mt-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStartStride}
            className="w-full py-3.5 rounded-2xl bg-[#181B1A] hover:bg-[#252A28] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-action transition-all"
          >
            <Zap className="w-4 h-4 text-[#35C46A]" />
            <span>{isStriding ? "Recording Active Stride..." : "Record Eco Stride (+350 Steps)"}</span>
          </motion.button>
        </div>
      </div>

      {/* Floating Bottom Nav Bar */}
      <nav className="absolute bottom-4 left-6 right-6 h-14 bg-[#181B1A] rounded-full flex items-center justify-around px-4 shadow-xl z-30">
        {[
          { id: "home", icon: Home, label: "Home" },
          { id: "stats", icon: BarChart3, label: "Stats" },
          { id: "map", icon: Compass, label: "Map" },
          { id: "profile", icon: User, label: "Profile" },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (tab.id === "stats" && onNavigateToRisk) {
                  onNavigateToRisk();
                }
              }}
              className={`p-2 rounded-full transition-colors relative ${
                isSelected ? "text-[#35C46A]" : "text-[#8E9493] hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5" />
              {isSelected && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#35C46A]"
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
