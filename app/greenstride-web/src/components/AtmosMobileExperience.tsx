"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { AtmosIcon } from "./AtmosIcon";
import {
  Smartphone,
  Sparkles,
  Wifi,
  Battery,
  Volume2,
  VolumeX,
  Languages,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  SlidersHorizontal,
  Home,
  Layers,
  LineChart,
  Briefcase,
  User,
  Check,
  Clock,
  ArrowRight,
  ArrowUpRight,
  X,
  Camera,
  MapPin,
  Lock,
  Globe,
  HelpCircle,
  Copy,
  Search,
  Leaf,
  Sun,
  Car,
  Building,
  Anchor,
  Plane,
  Download,
  Share2,
} from "lucide-react";

export type ScreenId =
  | "01_welcome"          // 1. Splash / Welcome
  | "02_auth"             // 2. Auth (OTP)
  | "03_home"             // 3. Home Dashboard
  | "04_select_project"   // 4. Select Project Type
  | "05_capture_data"     // 5. Biochar Production / Metrics
  | "06_verification"     // 6. Verification
  | "07_zk_proof"         // 7. ZK Proof
  | "08_credits_issued"   // 8. Credits Issued
  | "09_marketplace"      // 9. Market
  | "10_payment"          // 10. Payment
  | "11_certificate"      // 11. Solana Certificate
  | "12_portfolio"        // 12. Portfolio
  | "13_profile";         // 13. Profile

interface ScreenMeta {
  id: ScreenId;
  number: number;
  title: string;
  badge?: string;
}

const SCREENS: ScreenMeta[] = [
  { id: "01_welcome", number: 1, title: "Welcome" },
  { id: "02_auth", number: 2, title: "Auth (OTP)" },
  { id: "03_home", number: 3, title: "Home Dashboard", badge: "Core" },
  { id: "04_select_project", number: 4, title: "Select Project" },
  { id: "05_capture_data", number: 5, title: "Biochar Production", badge: "Metrics" },
  { id: "06_verification", number: 6, title: "Verification" },
  { id: "07_zk_proof", number: 7, title: "ZK Proof", badge: "Solana" },
  { id: "08_credits_issued", number: 8, title: "Credits Issued" },
  { id: "09_marketplace", number: 9, title: "Market" },
  { id: "10_payment", number: 10, title: "Payment", badge: "Dodo" },
  { id: "11_certificate", number: 11, title: "Solana Certificate" },
  { id: "12_portfolio", number: 12, title: "Portfolio" },
  { id: "13_profile", number: 13, title: "Profile" },
];

export function AtmosMobileExperience() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>("03_home");
  const [lang, setLang] = useState<"en" | "hi" | "gu">("en");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [period, setPeriod] = useState<"W" | "M" | "Y">("M");
  const [otp, setOtp] = useState(["2", "4", "7", "9", "1", ""]);
  const [biomassInput, setBiomassInput] = useState(12500);
  const [biocharOutput, setBiocharOutput] = useState(3200);
  const [equipmentType, setEquipmentType] = useState("Retort kiln");
  const [evidencePhotosCount, setEvidencePhotosCount] = useState(3);
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card">("upi");
  const [portfolioTab, setPortfolioTab] = useState<"holdings" | "history" | "impact">("holdings");

  // Modals & sub-sheets
  const [showScreenDropdown, setShowScreenDropdown] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showSolanaTxModal, setShowSolanaTxModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [showDodoModal, setShowDodoModal] = useState(false);
  const [activeProfileSheet, setActiveProfileSheet] = useState<string | null>(null);

  // Play subtle Apple tactile click sound
  const playHapticSound = (type: "tap" | "success" | "shutter" = "tap") => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === "tap") {
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.05);
      } else if (type === "shutter") {
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.12);
      } else if (type === "success") {
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      }
    } catch (e) {}
  };

  const navigateTo = (screen: ScreenId) => {
    playHapticSound("tap");
    setActiveScreen(screen);
  };

  // Celebration on certificate settlement
  useEffect(() => {
    if (activeScreen === "11_certificate") {
      playHapticSound("success");
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.65 },
        colors: ["#35C46A", "#E2F2DF", "#0C150A", "#FFD700"],
      });
    }
  }, [activeScreen]);

  // Compute live yield percentage
  const yieldPct = ((biocharOutput / biomassInput) * 100).toFixed(1);

  // Helper: renders bottom 5-tab bar on main screens
  const renderBottomNav = (currentTab: "home" | "projects" | "market" | "portfolio" | "profile") => (
    <div className="absolute left-0 right-0 bottom-0 h-[76px] bg-[#F1F1F1] rounded-t-[32px] px-3 flex justify-between items-center shadow-lg border-t border-black/5 z-30 select-none">
      <button
        onClick={() => navigateTo("03_home")}
        className={`flex-1 flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition-colors ${
          currentTab === "home" ? "text-[#0C150A]" : "text-[#3F463E] hover:text-[#0C150A]"
        }`}
      >
        <Home size={20} strokeWidth={currentTab === "home" ? 2.5 : 2} />
        <span>Home</span>
      </button>

      <button
        onClick={() => navigateTo("04_select_project")}
        className={`flex-1 flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition-colors ${
          currentTab === "projects" ? "text-[#0C150A]" : "text-[#3F463E] hover:text-[#0C150A]"
        }`}
      >
        <Layers size={20} strokeWidth={currentTab === "projects" ? 2.5 : 2} />
        <span>Projects</span>
      </button>

      <button
        onClick={() => navigateTo("09_marketplace")}
        className={`flex-1 flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition-colors ${
          currentTab === "market" ? "text-[#0C150A]" : "text-[#3F463E] hover:text-[#0C150A]"
        }`}
      >
        <LineChart size={20} strokeWidth={currentTab === "market" ? 2.5 : 2} />
        <span>Market</span>
      </button>

      <button
        onClick={() => navigateTo("12_portfolio")}
        className={`flex-1 flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition-colors ${
          currentTab === "portfolio" ? "text-[#0C150A]" : "text-[#3F463E] hover:text-[#0C150A]"
        }`}
      >
        <Briefcase size={20} strokeWidth={currentTab === "portfolio" ? 2.5 : 2} />
        <span>Portfolio</span>
      </button>

      <button
        onClick={() => navigateTo("13_profile")}
        className={`flex-1 flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition-colors ${
          currentTab === "profile" ? "text-[#0C150A]" : "text-[#3F463E] hover:text-[#0C150A]"
        }`}
      >
        <User size={20} strokeWidth={currentTab === "profile" ? 2.5 : 2} />
        <span>Profile</span>
      </button>
    </div>
  );

  return (
    <div className="relative select-none shrink-0">
      {/* Titanium iPhone 16 Pro Device Frame */}
      <div className="relative w-[390px] h-[844px] bg-[#0C150A] rounded-[52px] p-[10px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.1),inset_0_0_0_2px_rgba(255,255,255,0.12)]">
        {/* Inner Screen Bezel */}
        <div className="relative w-full h-full bg-[#FFFFFF] rounded-[42px] overflow-hidden flex flex-col font-['Inter',sans-serif] text-[#0C150A]">
          
          {/* iOS Dynamic Island & Status Bar */}
          <div className="relative z-40 w-full pt-3 px-7 flex items-center justify-between text-[13px] font-bold tracking-tight text-[#0C150A] select-none">
            <span>9:41</span>

            {/* Dynamic Island Pill with Interactive Screen Jumper */}
            <div
              onClick={() => setShowScreenDropdown(!showScreenDropdown)}
              className="cursor-pointer hover:scale-105 transition-transform absolute left-1/2 -translate-x-1/2 top-2.5 h-[28px] px-3 bg-black rounded-full flex items-center gap-1.5 text-white text-[10px] shadow-md border border-white/10"
              title="Tap to switch between the 13 screens"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#35C46A] animate-pulse" />
              <span className="font-mono text-[9px] text-[#A6E3B8]">
                {SCREENS.find((s) => s.id === activeScreen)?.title || "Atmos"}
              </span>
              <AtmosIcon name="mk" size={12} className="text-[#35C46A]" />
            </div>

            <div className="flex items-center gap-1.5 text-[#0C150A]">
              <Wifi size={13} strokeWidth={2.5} />
              <Battery size={15} strokeWidth={2.5} />
            </div>
          </div>

          {/* Quick Screen Dropdown Switcher (inside phone bezel) */}
          <AnimatePresence>
            {showScreenDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-12 left-4 right-4 z-50 bg-[#0C150A]/95 backdrop-blur-xl border border-white/15 rounded-2xl p-2 shadow-2xl max-h-[460px] overflow-y-auto text-xs"
              >
                <div className="px-2 py-1 text-[10px] uppercase tracking-wider font-extrabold text-[#6FCF97] border-b border-white/10 mb-1">
                  Atmos 13-Screen Userflow Navigation
                </div>
                {SCREENS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      navigateTo(s.id);
                      setShowScreenDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-colors ${
                      activeScreen === s.id
                        ? "bg-[#276A3C] text-white font-bold"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span>{s.number}. {s.title}</span>
                    {activeScreen === s.id && <Check size={14} className="text-[#6FCF97]" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Screen Content Render Area with Apple Spring Transitions */}
          <div className="relative flex-1 flex flex-col overflow-y-auto overflow-x-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeScreen}
                initial={{ opacity: 0, y: 10, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.99 }}
                  transition={{ type: "spring", stiffness: 380, damping: 28 }}
                  className="flex-1 flex flex-col h-full"
                >
                  {/* ============================================================== */}
                  {/* SCREEN 1: SPLASH / WELCOME (Page 1 in Userflow) */}
                  {/* ============================================================== */}
                  {activeScreen === "01_welcome" && (
                    <div className="flex-1 flex flex-col justify-between p-6 bg-[#E2F2DF]">
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2">
                          <AtmosIcon name="mk" size={32} className="text-[#0C150A]" />
                          <b className="text-2xl font-extrabold text-[#0C150A]">Atmos</b>
                        </div>
                        <button
                          onClick={() => alert("Atmos dMRV Support: Helpline 1800-ATMOS")}
                          className="text-xs font-bold text-[#0C150A] hover:underline"
                        >
                          Help
                        </button>
                      </div>

                      {/* Central Rotating Rosette Motif */}
                      <div className="flex items-center justify-center my-auto">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
                          className="text-[#3F463E] opacity-90"
                        >
                          <AtmosIcon name="mk" size={210} />
                        </motion.div>
                      </div>

                      {/* Bottom Copy Area */}
                      <div className="flex flex-col gap-3 pb-2">
                        <div className="flex flex-col gap-1">
                          <h1 className="text-[26px] leading-tight font-extrabold text-[#0C150A]">
                            Evidence you can audit.<br />Credits you can trust.
                          </h1>
                          <p className="text-xs text-[#3F463E] leading-relaxed">
                            Real-world climate action, verified by people and recorded on Solana.
                          </p>
                        </div>

                        {/* Segmented Progress Pill */}
                        <div className="w-24 h-1.5 rounded-full bg-black/15 overflow-hidden my-0.5">
                          <div className="w-[40%] h-full bg-[#0C150A] rounded-full" />
                        </div>

                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => navigateTo("02_auth")}
                          className="w-full h-14 rounded-full bg-[#0C150A] text-white font-extrabold text-base shadow-md hover:bg-black transition-all flex items-center justify-center gap-2"
                        >
                          <span>Get Started</span>
                          <ChevronRight size={18} />
                        </motion.button>
                      </div>
                    </div>
                  )}

                  {/* ============================================================== */}
                  {/* SCREEN 2: AUTH / OTP (Page 2 in Userflow) */}
                  {/* ============================================================== */}
                  {activeScreen === "02_auth" && (
                    <div className="flex-1 flex flex-col justify-between p-6 bg-white">
                      <div className="flex flex-col gap-3.5 pt-2">
                        <button
                          onClick={() => navigateTo("01_welcome")}
                          className="w-10 h-10 rounded-full bg-[#F1F1F1] text-[#0C150A] flex items-center justify-center hover:bg-[#E2F2DF] transition-colors"
                        >
                          <ChevronLeft size={20} />
                        </button>

                        <div>
                          <p className="text-xs text-[#3F463E] font-medium">Welcome to</p>
                          <h1 className="text-3xl font-extrabold text-[#0C150A] mt-0.5">Atmos</h1>
                          <p className="text-xs text-[#3F463E] mt-0.5">Sign in to continue</p>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-[#3F463E] block mb-1">
                            Phone number
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="h-12 px-3.5 rounded-2xl bg-[#F7F9F6] border border-black/10 flex items-center font-bold text-xs text-[#0C150A]">
                              IN +91
                            </span>
                            <input
                              type="text"
                              defaultValue="98765 43210"
                              className="flex-1 h-12 px-4 rounded-2xl bg-[#F7F9F6] border border-black/10 font-bold text-sm text-[#0C150A] outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-[#3F463E] block mb-1">
                            Enter code
                          </label>
                          <div className="grid grid-cols-6 gap-2">
                            {otp.map((digit, idx) => (
                              <input
                                key={idx}
                                type="text"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => {
                                  const newOtp = [...otp];
                                  newOtp[idx] = e.target.value;
                                  setOtp(newOtp);
                                  playHapticSound("tap");
                                }}
                                className={`h-12 rounded-xl text-center text-lg font-black outline-none transition-all ${
                                  idx === 4
                                    ? "border-2 border-[#0C150A] bg-white text-[#0C150A] shadow-xs"
                                    : "bg-[#F7F9F6] border border-black/10 text-[#0C150A]"
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        <p className="text-[11px] text-[#3F463E] font-medium">Resend in 00:28</p>

                        <div className="relative flex items-center justify-center my-0.5">
                          <div className="border-t border-black/10 w-full" />
                          <span className="bg-white px-3 text-[10px] text-[#3F463E] font-medium absolute">
                            or continue with
                          </span>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <button
                            onClick={() => navigateTo("03_home")}
                            className="w-full h-11 rounded-2xl border border-black/10 text-xs font-bold text-[#0C150A] hover:bg-black/5 transition-colors"
                          >
                            Continue with Google
                          </button>
                          <button
                            onClick={() => navigateTo("03_home")}
                            className="w-full h-11 rounded-2xl border border-black/10 text-xs font-bold text-[#0C150A] hover:bg-black/5 transition-colors"
                          >
                            Continue with Apple
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 pb-2">
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => navigateTo("03_home")}
                          className="w-full h-13 rounded-full bg-[#0C150A] text-white font-extrabold text-base shadow-md hover:bg-black transition-all"
                        >
                          Verify
                        </motion.button>
                        <p className="text-center text-[10px] text-[#3F463E] leading-relaxed">
                          We never store your Aadhaar number. Your photos are signed on your phone.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ============================================================== */}
                  {/* SCREEN 3: HOME DASHBOARD (Page 3 in Userflow) */}
                  {/* ============================================================== */}
                  {activeScreen === "03_home" && (
                    <div className="flex-1 flex flex-col justify-between p-5 bg-[#F7F9F6] pb-20">
                      <div className="flex flex-col gap-3.5">
                        {/* Header: User & Goal */}
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-[#E2F2DF] text-[#0C150A] flex items-center justify-center font-extrabold text-sm border border-black/5 shadow-xs">
                              RP
                            </div>
                            <div>
                              <h1 className="text-[19px] font-extrabold text-[#0C150A] leading-tight">
                                Hi, Ramesh
                              </h1>
                              <p className="text-[11px] font-bold text-[#3F463E]">
                                Setup 80% · ID verified
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-[#0C150A] bg-[#E2F2DF] px-2.5 py-1 rounded-full border border-black/5">
                              Goal: 25 tCO₂e
                            </span>
                            <motion.button
                              whileTap={{ scale: 0.92 }}
                              onClick={() => setShowNotificationModal(true)}
                              className="relative w-9 h-9 rounded-full bg-white border border-[#E2E2E2] text-[#0C150A] flex items-center justify-center shadow-xs"
                            >
                              <AtmosIcon name="bl" size={16} />
                              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#35C46A] ring-2 ring-white animate-pulse" />
                            </motion.button>
                          </div>
                        </div>

                        {/* Top KPI Metric Tiles */}
                        <div className="grid grid-cols-3 gap-2">
                          <div
                            onClick={() => navigateTo("04_select_project")}
                            className="cursor-pointer bg-white border border-[#E6E6E6] rounded-2xl p-3 flex flex-col gap-1 hover:border-[#0C150A] transition-all"
                          >
                            <span className="w-7 h-7 rounded-full bg-[#E2F2DF] text-[#0C150A] flex items-center justify-center">
                              <Layers size={14} />
                            </span>
                            <span className="text-lg font-black text-[#0C150A] leading-tight mt-0.5">3</span>
                            <span className="text-[10px] text-[#3F463E] font-medium leading-tight">Active</span>
                          </div>

                          <div
                            onClick={() => navigateTo("06_verification")}
                            className="cursor-pointer bg-white border border-[#E6E6E6] rounded-2xl p-3 flex flex-col gap-1 hover:border-[#0C150A] transition-all"
                          >
                            <span className="w-7 h-7 rounded-full bg-[#E2F2DF] text-[#0C150A] flex items-center justify-center">
                              <Clock size={14} />
                            </span>
                            <span className="text-lg font-black text-[#0C150A] leading-tight mt-0.5">2</span>
                            <span className="text-[10px] text-[#3F463E] font-medium leading-tight">Review</span>
                          </div>

                          <div
                            onClick={() => navigateTo("12_portfolio")}
                            className="cursor-pointer bg-[#E2F2DF] rounded-2xl p-3 flex flex-col gap-1 hover:bg-[#d5ebd1] transition-all"
                          >
                            <span className="w-7 h-7 rounded-full bg-[#0C150A] text-white flex items-center justify-center">
                              <Briefcase size={14} />
                            </span>
                            <span className="text-sm font-black text-[#0C150A] leading-tight mt-0.5 truncate">₹22,000</span>
                            <span className="text-[10px] text-[#0C150A] font-bold leading-tight">Paid out</span>
                          </div>
                        </div>

                        {/* Stitch Signature Hero Radial Progress Gauge */}
                        <div className="bg-white rounded-3xl p-4 border border-black/5 shadow-xs flex flex-col items-center">
                          <div className="w-full flex items-center justify-between mb-2">
                            <div>
                              <p className="text-[11px] text-[#3F463E] font-bold">Your carbon assets</p>
                              <p className="text-xs text-[#8EAA97]">Pilot units · not registry-recognised</p>
                            </div>
                            <div className="flex items-center bg-[#F1F1F1] rounded-full p-0.5">
                              {(["W", "M", "Y"] as const).map((p) => (
                                <button
                                  key={p}
                                  onClick={() => {
                                    setPeriod(p);
                                    playHapticSound("tap");
                                  }}
                                  className={`w-7 h-6 rounded-full text-[10px] font-bold transition-all ${
                                    period === p ? "bg-[#0C150A] text-white shadow-xs" : "text-[#3F463E]"
                                  }`}
                                >
                                  {p}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="relative flex justify-center items-center py-1">
                            <svg width="180" height="180" viewBox="0 0 250 250" className="transform -rotate-90">
                              <circle cx="125" cy="125" r="108" fill="none" stroke="#E2F2DF" strokeWidth="16" />
                              <motion.circle
                                cx="125"
                                cy="125"
                                r="108"
                                fill="none"
                                stroke="#0C150A"
                                strokeWidth="16"
                                strokeLinecap="round"
                                initial={{ strokeDasharray: "0 678.6" }}
                                animate={{ strokeDasharray: "488.5 678.6" }}
                                transition={{ duration: 1.2, ease: "easeOut" }}
                              />
                              <circle cx="125" cy="125" r="86" fill="none" stroke="#C9DEC5" strokeWidth="2.5" strokeDasharray="2 10" />
                            </svg>

                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                              <div className="w-8 h-8 rounded-full bg-[#E2F2DF] text-[#0C150A] flex items-center justify-center mb-0.5">
                                <AtmosIcon name="mk" size={18} />
                              </div>
                              <span className="text-[10px] text-[#3F463E] font-bold">Verified this month</span>
                              <span className="text-2xl font-black text-[#0C150A] tracking-tight">18.000 t</span>
                              <span className="text-[10px] text-[#3F463E]">+6.439 t · Sample data</span>
                            </div>
                          </div>
                        </div>

                        {/* Recent Activity Section */}
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <h2 className="text-sm font-extrabold text-[#0C150A]">Recent activity</h2>
                            <button onClick={() => navigateTo("12_portfolio")} className="text-[11px] font-bold text-[#276A3C] hover:underline">
                              View all
                            </button>
                          </div>

                          <div
                            onClick={() => navigateTo("11_certificate")}
                            className="cursor-pointer bg-white p-3 rounded-2xl flex items-center justify-between border border-black/5 hover:border-black/20 transition-all shadow-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="w-8 h-8 rounded-full bg-[#E2F2DF] text-[#276A3C] flex items-center justify-center font-bold text-xs">
                                ✓
                              </span>
                              <div>
                                <p className="text-xs font-extrabold text-[#0C150A]">Credits issued · Batch #2</p>
                                <p className="text-[10px] text-[#3F463E]">Biochar · Kalol</p>
                              </div>
                            </div>
                            <span className="text-xs font-black text-[#276A3C]">18.000 t</span>
                          </div>

                          <div
                            onClick={() => navigateTo("10_payment")}
                            className="cursor-pointer bg-white p-3 rounded-2xl flex items-center justify-between border border-black/5 hover:border-black/20 transition-all shadow-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="w-8 h-8 rounded-full bg-[#E2F2DF] text-[#276A3C] flex items-center justify-center">
                                <Briefcase size={14} />
                              </span>
                              <div>
                                <p className="text-xs font-extrabold text-[#0C150A]">Payment received</p>
                                <p className="text-[10px] text-[#3F463E]">Sample buyer</p>
                              </div>
                            </div>
                            <span className="text-xs font-black text-[#0C150A]">₹22,000</span>
                          </div>

                          <div
                            onClick={() => navigateTo("06_verification")}
                            className="cursor-pointer bg-white p-3 rounded-2xl flex items-center justify-between border border-black/5 hover:border-black/20 transition-all shadow-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="w-8 h-8 rounded-full bg-[#E2F2DF] text-[#276A3C] flex items-center justify-center">
                                <Clock size={14} />
                              </span>
                              <div>
                                <p className="text-xs font-extrabold text-[#0C150A]">Batch #3 in review</p>
                                <p className="text-[10px] text-[#3F463E]">1 of 2 verifiers approved</p>
                              </div>
                            </div>
                            <span className="text-[11px] font-bold text-[#3F463E]">Today</span>
                          </div>
                        </div>
                      </div>

                      {renderBottomNav("home")}
                    </div>
                  )}

                  {/* ============================================================== */}
                  {/* SCREEN 4: SELECT PROJECT TYPE (Page 4 in Userflow) */}
                  {/* ============================================================== */}
                  {activeScreen === "04_select_project" && (
                    <div className="flex-1 flex flex-col justify-between p-5 bg-[#F7F9F6] pb-20 overflow-y-auto">
                      <div className="flex flex-col gap-3.5 pt-2">
                        <div>
                          <h1 className="text-2xl font-extrabold text-[#0C150A]">Select project type</h1>
                          <p className="text-xs text-[#3F463E] mt-1 leading-relaxed">
                            Atmos starts with biochar. More types unlock as their methodologies are reviewed.
                          </p>
                        </div>

                        {/* 3x3 Tile Grid */}
                        <div className="grid grid-cols-3 gap-2.5">
                          {/* Biochar - Selected */}
                          <div className="bg-white p-3 rounded-2xl border-2 border-[#0C150A] flex flex-col justify-between aspect-square relative shadow-xs">
                            <div className="w-8 h-8 rounded-full bg-[#0C150A] text-white flex items-center justify-center relative">
                              <Leaf size={15} />
                              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#35C46A] text-[#0C150A] text-[8px] flex items-center justify-center font-bold">
                                ✓
                              </span>
                            </div>
                            <span className="text-[11px] font-extrabold text-[#0C150A] leading-tight">
                              Biochar production
                            </span>
                          </div>

                          {[
                            { title: "Agroforestry", icon: Sparkles },
                            { title: "Solar energy", icon: Sun },
                            { title: "EV fleet", icon: Car },
                            { title: "Building retrofit", icon: Building },
                            { title: "Shipping", icon: Anchor },
                            { title: "Aviation", icon: Plane },
                            { title: "City initiative", icon: Home },
                            { title: "Individual action", icon: User },
                          ].map((item, idx) => {
                            const IconComp = item.icon;
                            return (
                              <div
                                key={idx}
                                className="bg-white p-3 rounded-2xl border border-black/5 opacity-60 flex flex-col justify-between aspect-square relative"
                              >
                                <span className="absolute top-1.5 right-1.5 text-[8px] bg-[#F1F1F1] px-1.5 py-0.2 rounded-full text-[#3F463E] font-medium">
                                  Soon
                                </span>
                                <span className="w-7 h-7 rounded-full bg-[#E2F2DF] text-[#0C150A] flex items-center justify-center">
                                  <IconComp size={14} />
                                </span>
                                <span className="text-[10px] font-bold text-[#3F463E] leading-tight">
                                  {item.title}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="pt-3 pb-2">
                        <button
                          onClick={() => navigateTo("05_capture_data")}
                          className="w-full h-13 rounded-full bg-[#0C150A] text-white font-extrabold text-base shadow-md hover:bg-black transition-colors"
                        >
                          Next
                        </button>
                      </div>

                      {renderBottomNav("projects")}
                    </div>
                  )}

                  {/* ============================================================== */}
                  {/* SCREEN 5: CAPTURE DATA / METRICS (Page 5 in Userflow) */}
                  {/* ============================================================== */}
                  {activeScreen === "05_capture_data" && (
                    <div className="flex-1 flex flex-col justify-between p-5 bg-[#F7F9F6] overflow-y-auto">
                      <div className="flex flex-col gap-3 pt-1">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <button onClick={() => navigateTo("04_select_project")} className="p-1">
                            <ChevronLeft size={20} />
                          </button>
                          <div className="text-center">
                            <h1 className="text-sm font-extrabold text-[#0C150A]">Biochar production</h1>
                            <p className="text-[10px] text-[#3F463E]">3/5 complete</p>
                          </div>
                          <button onClick={() => navigateTo("03_home")} className="p-1">
                            <X size={18} />
                          </button>
                        </div>

                        {/* Progress Segments */}
                        <div className="grid grid-cols-5 gap-1.5">
                          <div className="h-1 rounded-full bg-[#0C150A]" />
                          <div className="h-1 rounded-full bg-[#0C150A]" />
                          <div className="h-1 rounded-full bg-[#0C150A]" />
                          <div className="h-1 rounded-full bg-black/10" />
                          <div className="h-1 rounded-full bg-black/10" />
                        </div>

                        {/* Form Card */}
                        <div className="bg-white p-4 rounded-3xl border border-black/5 flex flex-col gap-3 shadow-xs">
                          <div>
                            <span className="text-[10px] text-[#3F463E]">Project name</span>
                            <p className="text-xs font-extrabold text-[#0C150A]">Biochar Unit · Kalol</p>
                          </div>

                          <div>
                            <span className="text-[10px] text-[#3F463E]">Location</span>
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-xs font-extrabold text-[#0C150A]">Kalol, Gujarat, India</p>
                              <MapPin size={14} className="text-[#276A3C]" />
                            </div>
                            <div className="h-16 w-full rounded-2xl bg-[#E2F2DF] relative overflow-hidden flex items-center justify-center border border-[#276A3C]/20">
                              <div className="w-full h-2 bg-white/60 transform -rotate-12 absolute" />
                              <div className="w-full h-3 bg-white/40 transform rotate-45 absolute" />
                              <div className="w-5 h-5 rounded-full bg-[#0C150A] text-white flex items-center justify-center shadow-md relative z-10">
                                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                              </div>
                            </div>
                          </div>

                          {/* Sliders */}
                          <div className="space-y-2 pt-1 border-t border-black/5">
                            <p className="text-[11px] font-bold text-[#3F463E]">Production metrics · 2/3</p>

                            <div>
                              <div className="flex justify-between text-xs font-bold mb-0.5">
                                <span>Biomass input (kg)</span>
                                <span className="text-[#0C150A]">{biomassInput.toLocaleString()} kg</span>
                              </div>
                              <input
                                type="range"
                                min="5000"
                                max="20000"
                                step="250"
                                value={biomassInput}
                                onChange={(e) => setBiomassInput(parseInt(e.target.value))}
                                className="w-full accent-[#0C150A]"
                              />
                            </div>

                            <div>
                              <div className="flex justify-between text-xs font-bold mb-0.5">
                                <span>Biochar output (kg)</span>
                                <span className="text-[#0C150A]">{biocharOutput.toLocaleString()} kg</span>
                              </div>
                              <input
                                type="range"
                                min="1000"
                                max="8000"
                                step="100"
                                value={biocharOutput}
                                onChange={(e) => setBiocharOutput(parseInt(e.target.value))}
                                className="w-full accent-[#0C150A]"
                              />
                            </div>

                            <p className="text-xs font-bold text-[#276A3C]">
                              ✓ Yield {yieldPct}% · within the 45% limit
                            </p>
                          </div>

                          {/* Equipment */}
                          <div
                            onClick={() => setShowEquipmentModal(true)}
                            className="cursor-pointer pt-1 border-t border-black/5 hover:opacity-80 transition-opacity"
                          >
                            <span className="text-[10px] text-[#3F463E]">Equipment type</span>
                            <div className="flex justify-between items-center text-xs font-extrabold text-[#0C150A] mt-0.5">
                              <span>{equipmentType}</span>
                              <ChevronRight size={14} />
                            </div>
                          </div>

                          {/* Photos */}
                          <div className="pt-1 border-t border-black/5">
                            <div className="flex justify-between items-center text-[11px] font-bold mb-1.5">
                              <span>Evidence photos (camera only)</span>
                              <span className="text-[#3F463E]">{evidencePhotosCount}/6</span>
                            </div>
                            <div className="grid grid-cols-4 gap-1.5">
                              {Array.from({ length: evidencePhotosCount }).map((_, i) => (
                                <div
                                  key={i}
                                  className="aspect-square rounded-xl bg-[#0C150A] text-white flex items-center justify-center text-[9px] font-bold"
                                >
                                  P#{i + 1}
                                </div>
                              ))}
                              {evidencePhotosCount < 6 && (
                                <div
                                  onClick={() => setShowCameraModal(true)}
                                  className="aspect-square rounded-xl border-2 border-dashed border-black/20 flex flex-col items-center justify-center text-[#0C150A] cursor-pointer hover:bg-black/5"
                                >
                                  <Camera size={16} />
                                  <span className="text-[8px] font-bold mt-0.5">Add</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 pb-2">
                        <button
                          onClick={() => navigateTo("06_verification")}
                          className="w-full h-13 rounded-full bg-[#0C150A] text-white font-extrabold text-base shadow-md hover:bg-black transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ============================================================== */}
                  {/* SCREEN 6: VERIFICATION REVIEW (Page 6 in Userflow) */}
                  {/* ============================================================== */}
                  {activeScreen === "06_verification" && (
                    <div className="flex-1 flex flex-col justify-between p-5 bg-[#F7F9F6] overflow-y-auto">
                      <div className="flex flex-col gap-3 pt-1">
                        <div>
                          <h1 className="text-2xl font-extrabold text-[#0C150A]">Verification</h1>
                          <p className="text-xs text-[#3F463E] mt-0.5 leading-relaxed">
                            Your evidence is being reviewed by people, not just software.
                          </p>
                        </div>

                        {/* Phase Status Card */}
                        <div className="bg-white border border-black/5 rounded-3xl p-4 flex flex-col gap-3 shadow-xs">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-extrabold text-[#0C150A]">Phase 2 of 3 · Verifier review</span>
                            <span className="text-[#276A3C] font-bold">Batch #3</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-black/10 overflow-hidden">
                            <div className="w-[66%] h-full bg-[#0C150A] rounded-full" />
                          </div>

                          <div className="space-y-2.5 pt-1">
                            <div className="flex items-start gap-2.5">
                              <span className="w-6 h-6 rounded-full bg-[#E2F2DF] text-[#0C150A] flex items-center justify-center font-bold text-xs shrink-0">
                                ✓
                              </span>
                              <div>
                                <p className="text-xs font-extrabold text-[#0C150A]">Evidence checks</p>
                                <p className="text-[10px] text-[#3F463E]">Automated · 92/100 · no problems found</p>
                              </div>
                            </div>

                            <div className="flex items-start gap-2.5">
                              <span className="w-6 h-6 rounded-full bg-[#0C150A] text-[#35C46A] flex items-center justify-center shrink-0">
                                <span className="w-2 h-2 rounded-full bg-[#35C46A] animate-pulse" />
                              </span>
                              <div>
                                <p className="text-xs font-extrabold text-[#0C150A]">Verifier review</p>
                                <p className="text-[10px] text-[#3F463E]">
                                  1 of 2 approved · waiting for the second organisation
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start gap-2.5 opacity-60">
                              <span className="w-6 h-6 rounded-full border border-black/30 flex items-center justify-center shrink-0" />
                              <div>
                                <p className="text-xs font-bold text-[#0C150A]">Calculation</p>
                                <p className="text-[10px] text-[#3F463E]">Runs after both verifiers approve</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Estimated CO2 Counter */}
                        <div className="bg-[#E2F2DF] rounded-3xl p-4 flex items-center justify-between border border-[#276A3C]/20 shadow-xs">
                          <div>
                            <span className="text-[10px] text-[#3F463E] font-medium">Estimated CO₂ (pending approval)</span>
                            <p className="text-2xl font-black text-[#0C150A] mt-0.5">6.439 tCO₂e</p>
                            <p className="text-[10px] text-[#3F463E]">Pilot methodology v1 · Sample data</p>
                          </div>

                          {/* Score Ring */}
                          <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                            <svg width="56" height="56" viewBox="0 0 64 64">
                              <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="6" />
                              <circle
                                cx="32"
                                cy="32"
                                r="26"
                                fill="none"
                                stroke="#0C150A"
                                strokeWidth="6"
                                strokeDasharray="163"
                                strokeDashoffset="13"
                                strokeLinecap="round"
                                transform="rotate(-90 32 32)"
                              />
                            </svg>
                            <span className="absolute font-black text-[#0C150A] text-sm">92</span>
                          </div>
                        </div>

                        {/* Reviewers Check Box */}
                        <div className="bg-white border border-black/5 rounded-2xl p-3.5 shadow-xs">
                          <p className="text-xs font-bold text-[#0C150A] mb-1">What reviewers check</p>
                          <p className="text-[10px] text-[#3F463E] leading-relaxed">
                            Photos at your site, steps in order, lab report, reactor temperature log, and no duplicate evidence across projects.
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 pb-2 flex flex-col gap-1.5">
                        <button
                          onClick={() => setShowEvidenceModal(true)}
                          className="w-full h-13 rounded-full bg-[#0C150A] text-white font-extrabold text-base shadow-md hover:bg-black transition-colors"
                        >
                          View evidence
                        </button>
                        <button
                          onClick={() => navigateTo("07_zk_proof")}
                          className="w-full py-1 text-center text-xs text-[#276A3C] font-bold hover:underline"
                        >
                          Proceed to ZK proof →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ============================================================== */}
                  {/* SCREEN 7: ZERO-KNOWLEDGE PROOF (Page 7 in Userflow) */}
                  {/* ============================================================== */}
                  {activeScreen === "07_zk_proof" && (
                    <div className="flex-1 flex flex-col justify-between p-5 bg-[#F7F9F6] overflow-y-auto">
                      <div className="flex flex-col gap-3 pt-1">
                        <div>
                          <h1 className="text-2xl font-extrabold text-[#0C150A]">Zero-knowledge proof</h1>
                          <p className="text-xs text-[#3F463E] mt-0.5">
                            Checking the calculation while keeping your numbers private.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <div className="bg-white border border-black/5 rounded-2xl p-3 flex items-center gap-2.5 shadow-xs">
                            <span className="w-6 h-6 rounded-full bg-[#E2F2DF] text-[#0C150A] flex items-center justify-center font-bold text-xs">
                              ✓
                            </span>
                            <span className="text-xs font-extrabold text-[#0C150A]">Committing your numbers</span>
                          </div>

                          <div className="bg-white border border-black/5 rounded-2xl p-3 flex items-center gap-2.5 shadow-xs">
                            <span className="w-6 h-6 rounded-full bg-[#E2F2DF] text-[#0C150A] flex items-center justify-center font-bold text-xs">
                              ✓
                            </span>
                            <span className="text-xs font-extrabold text-[#0C150A]">Generating the proof</span>
                          </div>

                          <div className="bg-white border border-black/5 rounded-2xl p-3 flex items-center gap-2.5 shadow-xs">
                            <span className="w-6 h-6 rounded-full bg-[#0C150A] text-[#35C46A] flex items-center justify-center">
                              <span className="w-2 h-2 rounded-full bg-[#35C46A] animate-ping" />
                            </span>
                            <span className="text-xs font-extrabold text-[#0C150A]">Verifying on Solana</span>
                          </div>
                        </div>

                        <div className="bg-white border border-black/5 rounded-2xl p-3.5 shadow-xs">
                          <p className="text-xs font-extrabold text-[#0C150A] mb-0.5">Stays private</p>
                          <p className="text-[10px] text-[#3F463E] leading-relaxed">
                            Production volumes · Lab values · Equipment logs · Exact site coordinates
                          </p>
                        </div>

                        <div className="bg-white border border-black/5 rounded-2xl p-3.5 shadow-xs">
                          <p className="text-xs font-extrabold text-[#0C150A] mb-0.5">Gets verified</p>
                          <p className="text-[10px] text-[#3F463E] leading-relaxed">
                            6.439 tCO₂e matches the methodology formula · Tied to this batch and project · Your evidence set
                          </p>
                        </div>

                        <div className="bg-white border border-black/5 rounded-2xl p-3.5 shadow-xs">
                          <p className="text-xs font-extrabold text-[#0C150A] mb-0.5">Good to know</p>
                          <p className="text-[10px] text-[#3F463E] leading-relaxed">
                            A proof checks the arithmetic. Verifiers check the facts.
                          </p>
                        </div>

                        {/* Hash Card */}
                        <div className="bg-[#E2F2DF] border border-[#276A3C]/20 rounded-2xl p-3 flex items-center justify-between">
                          <div>
                            <span className="text-[9px] text-[#3F463E] block">Proof commitment</span>
                            <span className="font-mono text-xs font-bold text-[#0C150A]">zk_79a2b1c…</span>
                          </div>
                          <button onClick={() => alert("Copied ZK Proof hash")} className="p-1 text-[#0C150A]">
                            <Copy size={15} />
                          </button>
                        </div>
                      </div>

                      <div className="pt-3 pb-2">
                        <button
                          onClick={() => navigateTo("08_credits_issued")}
                          className="w-full h-13 rounded-full bg-[#0C150A] text-white font-extrabold text-base shadow-md hover:bg-black transition-colors"
                        >
                          Next: issue credits
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ============================================================== */}
                  {/* SCREEN 8: CREDITS ISSUED (Page 8 in Userflow) */}
                  {/* ============================================================== */}
                  {activeScreen === "08_credits_issued" && (
                    <div className="flex-1 flex flex-col justify-between p-5 bg-[#F7F9F6] overflow-y-auto">
                      <div className="flex flex-col items-center text-center gap-2.5 pt-1">
                        <div className="w-14 h-14 rounded-full bg-[#E2F2DF] text-[#0C150A] flex items-center justify-center font-bold text-2xl shadow-md border border-black/5">
                          ✓
                        </div>
                        <h1 className="text-2xl font-extrabold text-[#0C150A]">Credits issued</h1>
                        <p className="text-xs text-[#3F463E]">Pilot units for Batch #3</p>

                        {/* Metadata Card */}
                        <div className="w-full bg-white text-[#0C150A] rounded-3xl p-4 text-xs flex flex-col gap-2 text-left shadow-xs border border-black/5">
                          <div className="flex justify-between py-0.5 border-b border-black/5">
                            <span className="text-[#3F463E]">Name</span>
                            <b className="text-[#0C150A]">Biochar Batch #3</b>
                          </div>
                          <div className="flex justify-between py-0.5 border-b border-black/5">
                            <span className="text-[#3F463E]">Issued to you</span>
                            <b className="text-[#0C150A]">5.796 tCO₂e</b>
                          </div>
                          <div className="flex justify-between py-0.5 border-b border-black/5">
                            <span className="text-[#3F463E]">Reserve pool</span>
                            <b className="text-[#0C150A]">0.643 tCO₂e</b>
                          </div>
                          <div className="flex justify-between py-0.5 border-b border-black/5">
                            <span className="text-[#3F463E]">Methodology</span>
                            <b className="font-mono text-[9px] text-[#0C150A]">ATMOS-BIOCHAR-PILOT-v1</b>
                          </div>
                          <div className="flex justify-between py-0.5 border-b border-black/5">
                            <span className="text-[#3F463E]">Vintage</span>
                            <b className="text-[#0C150A]">2026</b>
                          </div>
                          <div className="flex justify-between py-0.5 border-b border-black/5">
                            <span className="text-[#3F463E]">Network</span>
                            <b className="text-[#0C150A]">Solana Devnet</b>
                          </div>
                          <div className="flex justify-between py-0.5 border-b border-black/5">
                            <span className="text-[#3F463E]">Proof commitment</span>
                            <b className="font-mono text-[9px] text-[#0C150A]">zk_79a2b1c…</b>
                          </div>
                          <div className="flex justify-between items-center pt-0.5">
                            <span className="text-[#3F463E]">Status</span>
                            <span className="text-[9px] bg-[#FEF3C7] text-[#92400E] font-bold px-2 py-0.5 rounded-full">
                              Pilot · not registry-recognised
                            </span>
                          </div>
                        </div>

                        <p className="text-[10px] text-[#3F463E] leading-relaxed px-1">
                          10% of every batch stays in a shared reserve pool that protects buyers if a batch is later revoked.
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 pt-2 pb-2">
                        <button
                          onClick={() => navigateTo("09_marketplace")}
                          className="w-full h-13 rounded-full bg-[#0C150A] text-white font-extrabold text-base shadow-md hover:bg-black transition-colors"
                        >
                          List for sale
                        </button>
                        <button
                          onClick={() => setShowCertificateModal(true)}
                          className="w-full h-11 rounded-full border border-black/10 text-[#0C150A] font-extrabold text-xs hover:bg-black/5 transition-colors"
                        >
                          View certificate
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ============================================================== */}
                  {/* SCREEN 9: MARKETPLACE (Page 9 in Userflow) */}
                  {/* ============================================================== */}
                  {activeScreen === "09_marketplace" && (
                    <div className="flex-1 flex flex-col justify-between p-5 bg-[#F7F9F6] pb-20 overflow-y-auto">
                      <div className="flex flex-col gap-3 pt-1">
                        {/* Search Bar */}
                        <div className="flex items-center gap-2 bg-white border border-black/10 px-3.5 py-2.5 rounded-2xl shadow-xs">
                          <Search size={15} className="text-black/50" />
                          <input
                            type="text"
                            placeholder="Search carbon units…"
                            className="bg-transparent text-xs text-[#0C150A] placeholder-black/40 outline-none flex-1 font-medium"
                          />
                          <span className="text-[9px] bg-[#E2F2DF] text-[#0C150A] px-2 py-0.5 rounded-full font-bold">
                            Sample data
                          </span>
                        </div>

                        {/* Filter Pills */}
                        <div className="flex items-center gap-1.5">
                          <button className="px-3 py-1 rounded-full bg-[#0C150A] text-white font-extrabold text-xs">
                            All
                          </button>
                          <button className="px-3 py-1 rounded-full bg-white border border-black/5 text-[#3F463E] font-bold text-xs hover:bg-black/5">
                            Biochar
                          </button>
                          <button className="px-3 py-1 rounded-full bg-white border border-black/5 text-[#3F463E]/60 font-medium text-xs">
                            Agroforestry · Soon
                          </button>
                        </div>

                        <p className="text-[11px] text-[#3F463E] leading-snug">
                          Pilot units from human-verified batches. Prices are set by sellers.
                        </p>

                        {/* Listings */}
                        <div className="flex flex-col gap-2.5 mt-0.5">
                          {/* Card 1: Kalol */}
                          <div className="bg-white border border-black/5 rounded-3xl p-4 flex flex-col gap-2 shadow-xs">
                            <div className="flex items-center gap-2 text-[9px]">
                              <span className="bg-[#FEF3C7] text-[#92400E] px-2 py-0.5 rounded-full font-bold">
                                Pilot · unrecognised
                              </span>
                              <span className="text-[#3F463E]">Evidence 92/100 · 2 verifiers</span>
                            </div>
                            <div>
                              <h2 className="text-sm font-extrabold text-[#0C150A]">Biochar · Kalol, Gujarat</h2>
                              <p className="text-[11px] text-[#3F463E]">Batch #3 · 6.439 tCO₂e · Vintage 2026</p>
                            </div>
                            <div className="flex items-center justify-between pt-1 border-t border-black/5">
                              <div>
                                <span className="text-base font-black text-[#0C150A]">₹11,100</span>
                                <span className="text-xs text-[#3F463E]"> / tonne</span>
                                <p className="text-[9px] text-[#276A3C] font-bold">Available: 5.796 t</p>
                              </div>
                              <button
                                onClick={() => navigateTo("10_payment")}
                                className="w-9 h-9 rounded-full bg-[#0C150A] text-white flex items-center justify-center hover:scale-105 transition-transform shadow-xs"
                              >
                                <ArrowUpRight size={18} />
                              </button>
                            </div>
                          </div>

                          {/* Card 2: Jaipur */}
                          <div className="bg-white border border-black/5 rounded-3xl p-4 flex flex-col gap-2 shadow-xs">
                            <div className="flex items-center gap-2 text-[9px]">
                              <span className="bg-[#FEF3C7] text-[#92400E] px-2 py-0.5 rounded-full font-bold">
                                Pilot · unrecognised
                              </span>
                              <span className="text-[#3F463E]">Evidence 88/100 · 2 verifiers</span>
                            </div>
                            <div>
                              <h2 className="text-sm font-extrabold text-[#0C150A]">Biochar · Jaipur, Rajasthan</h2>
                              <p className="text-[11px] text-[#3F463E]">Batch #7 · 3.100 tCO₂e · Vintage 2026</p>
                            </div>
                            <div className="flex items-center justify-between pt-1 border-t border-black/5">
                              <div>
                                <span className="text-base font-black text-[#0C150A]">₹12,400</span>
                                <span className="text-xs text-[#3F463E]"> / tonne</span>
                                <p className="text-[9px] text-[#276A3C] font-bold">Available: 2.790 t</p>
                              </div>
                              <button
                                onClick={() => navigateTo("10_payment")}
                                className="w-9 h-9 rounded-full bg-[#0C150A] text-white flex items-center justify-center hover:scale-105 transition-transform shadow-xs"
                              >
                                <ArrowUpRight size={18} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {renderBottomNav("market")}
                    </div>
                  )}

                  {/* ============================================================== */}
                  {/* SCREEN 10: PAYMENT (Page 10 in Userflow) */}
                  {/* ============================================================== */}
                  {activeScreen === "10_payment" && (
                    <div className="flex-1 flex flex-col justify-between p-5 bg-[#F7F9F6] overflow-y-auto">
                      <div className="flex flex-col gap-3 pt-1">
                        <div className="flex items-center justify-between">
                          <button onClick={() => navigateTo("09_marketplace")} className="p-1">
                            <ChevronLeft size={20} />
                          </button>
                          <h1 className="text-xl font-extrabold text-[#0C150A]">Payment</h1>
                          <span className="text-[9px] bg-[#E2F2DF] text-[#0C150A] px-2 py-0.5 rounded-full font-bold">
                            Sample data
                          </span>
                        </div>
                        <p className="text-xs text-[#3F463E] text-center">
                          You are buying Biochar · Kalol, Gujarat
                        </p>

                        {/* Amount Card */}
                        <div className="bg-white rounded-3xl p-5 border border-black/5 shadow-xs flex flex-col gap-3">
                          <div>
                            <span className="text-xs text-[#3F463E] font-medium">Amount to pay</span>
                            <p className="text-3xl font-black text-[#0C150A] leading-tight">₹55,500</p>
                          </div>

                          <div className="border-y border-black/5 py-2.5 space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-[#3F463E]">5.000 tCO₂e × ₹11,100</span>
                              <b>₹55,500</b>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#3F463E]">Payment processing</span>
                              <b className="text-[#276A3C]">Included</b>
                            </div>
                            <div className="flex justify-between font-extrabold text-sm pt-1 border-t border-black/5">
                              <span>Total</span>
                              <span>₹55,500</span>
                            </div>
                          </div>

                          <div>
                            <p className="text-xs font-bold text-[#3F463E] mb-1.5">Payment method</p>
                            <div className="space-y-1.5">
                              <div
                                onClick={() => setPaymentMethod("upi")}
                                className={`cursor-pointer p-3 rounded-2xl border-2 flex items-center justify-between transition-all ${
                                  paymentMethod === "upi" ? "border-[#0C150A] bg-[#E2F2DF]" : "border-black/10 bg-[#F7F9F6]"
                                }`}
                              >
                                <div>
                                  <p className="text-xs font-extrabold text-[#0C150A]">UPI / Bank transfer</p>
                                  <p className="text-[10px] text-[#3F463E]">Instant, in India</p>
                                </div>
                                {paymentMethod === "upi" && (
                                  <span className="w-5 h-5 rounded-full bg-[#0C150A] text-white flex items-center justify-center text-[10px]">
                                    ✓
                                  </span>
                                )}
                              </div>

                              <div
                                onClick={() => setPaymentMethod("card")}
                                className={`cursor-pointer p-3 rounded-2xl border-2 flex items-center justify-between transition-all ${
                                  paymentMethod === "card" ? "border-[#0C150A] bg-[#E2F2DF]" : "border-black/10 bg-[#F7F9F6]"
                                }`}
                              >
                                <div>
                                  <p className="text-xs font-extrabold text-[#0C150A]">International card</p>
                                  <p className="text-[10px] text-[#3F463E]">For buyers outside India</p>
                                </div>
                                {paymentMethod === "card" && (
                                  <span className="w-5 h-5 rounded-full bg-[#0C150A] text-white flex items-center justify-center text-[10px]">
                                    ✓
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="bg-[#FEF3C7]/60 border border-[#FEF3C7] rounded-xl p-2.5">
                            <p className="text-[10px] text-[#92400E] leading-relaxed">
                              Pilot unit. Not recognised by a carbon registry. Your retirement certificate will say so.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 pb-2 flex flex-col gap-1 text-center">
                        <button
                          onClick={() => setShowDodoModal(true)}
                          className="w-full h-13 rounded-full bg-[#0C150A] text-white font-extrabold text-base shadow-md hover:bg-black transition-colors"
                        >
                          Pay with Dodo
                        </button>
                        <p className="text-[10px] text-[#3F463E]">Secured by Dodo Payments</p>
                      </div>
                    </div>
                  )}

                  {/* ============================================================== */}
                  {/* SCREEN 11: SOLANA SETTLEMENT & CERTIFICATE (Page 11 in Userflow) */}
                  {/* ============================================================== */}
                  {activeScreen === "11_certificate" && (
                    <div className="flex-1 flex flex-col justify-between p-5 bg-[#F7F9F6] overflow-y-auto">
                      <div className="flex flex-col gap-3 pt-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h1 className="text-xl font-extrabold text-[#0C150A]">Recording on Solana</h1>
                            <p className="text-[11px] text-[#3F463E]">Settlement complete (sample)</p>
                          </div>
                          <span className="text-[9px] bg-[#E2F2DF] text-[#0C150A] px-2 py-0.5 rounded-full font-bold">
                            Sample data
                          </span>
                        </div>

                        <p className="text-[11px] font-mono text-[#276A3C] font-bold">
                          Tx 5ayYk…2z21 · Block 250,231
                        </p>
                        <div className="grid grid-cols-3 gap-1">
                          <div className="h-1 rounded-full bg-[#0C150A]" />
                          <div className="h-1 rounded-full bg-[#0C150A]" />
                          <div className="h-1 rounded-full bg-[#0C150A]" />
                        </div>

                        {/* Certificate Card */}
                        <div className="bg-white text-[#0C150A] rounded-3xl p-4 border border-black/10 shadow-xs flex flex-col gap-2.5">
                          <h2 className="text-center text-xs font-black tracking-widest text-[#0C150A] border-b border-black/10 pb-1.5">
                            RETIREMENT CERTIFICATE
                          </h2>

                          <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between">
                              <span className="text-[#3F463E]">Buyer</span>
                              <b>Sample buyer</b>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#3F463E]">Asset</span>
                              <b>Biochar Batch #3</b>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#3F463E]">Amount</span>
                              <b>5.000 tCO₂e</b>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#3F463E]">Price</span>
                              <b>₹55,500</b>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#3F463E]">Date</span>
                              <b>12 Oct 2026</b>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#3F463E]">Blockchain</span>
                              <b>Solana · Devnet</b>
                            </div>
                            <div className="flex justify-between items-center pt-1 border-t border-black/5">
                              <span className="text-[#3F463E]">Status</span>
                              <span className="text-[9px] bg-[#FEF3C7] text-[#92400E] font-bold px-2 py-0.5 rounded-full">
                                Pilot · not registry-recognised
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 pt-1.5 border-t border-black/5">
                            <div className="w-12 h-12 bg-black rounded-lg p-1 flex items-center justify-center shrink-0">
                              <div className="w-full h-full bg-white grid grid-cols-3 gap-0.5 p-0.5">
                                <div className="bg-black" />
                                <div className="bg-white" />
                                <div className="bg-black" />
                                <div className="bg-black" />
                                <div className="bg-black" />
                                <div className="bg-white" />
                                <div className="bg-white" />
                                <div className="bg-black" />
                                <div className="bg-black" />
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-[#0C150A]">Verify certificate</p>
                              <p className="text-[9px] text-[#3F463E] font-mono">[your-domain]/verify/…</p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setShowCertificateModal(true)}
                            className="h-10 rounded-2xl bg-white border border-black/10 text-[#0C150A] font-bold text-xs hover:bg-black/5 transition-colors"
                          >
                            View certificate
                          </button>
                          <button
                            onClick={() => setShowSolanaTxModal(true)}
                            className="h-10 rounded-2xl bg-white border border-black/10 text-[#0C150A] font-bold text-xs hover:bg-black/5 transition-colors"
                          >
                            View on explorer
                          </button>
                        </div>
                      </div>

                      <div className="pt-2 pb-2">
                        <button
                          onClick={() => navigateTo("12_portfolio")}
                          className="w-full h-13 rounded-full bg-[#0C150A] text-white font-extrabold text-base shadow-md hover:bg-black transition-colors"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ============================================================== */}
                  {/* SCREEN 12: PORTFOLIO (Page 12 in Userflow) */}
                  {/* ============================================================== */}
                  {activeScreen === "12_portfolio" && (
                    <div className="flex-1 flex flex-col justify-between bg-[#F7F9F6] pb-20 overflow-y-auto">
                      <div className="p-5 pt-3 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <h1 className="text-2xl font-extrabold text-[#0C150A]">Portfolio</h1>
                          <span className="text-[9px] bg-[#E2F2DF] text-[#0C150A] px-2 py-0.5 rounded-full font-bold">
                            Sample data
                          </span>
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex items-center gap-1.5">
                          {(["holdings", "history", "impact"] as const).map((tab) => (
                            <button
                              key={tab}
                              onClick={() => setPortfolioTab(tab)}
                              className={`px-3 py-1 rounded-full text-xs font-bold capitalize transition-colors ${
                                portfolioTab === tab
                                  ? "bg-[#0C150A] text-white"
                                  : "bg-white border border-black/5 text-[#3F463E] hover:bg-black/5"
                              }`}
                            >
                              {tab}
                            </button>
                          ))}
                        </div>

                        <div>
                          <span className="text-[11px] text-[#3F463E]">Total units</span>
                          <p className="text-3xl font-black text-[#0C150A] leading-tight">8.000 tCO₂e</p>
                          <p className="text-xs text-[#3F463E]">5.000 retired · 3.000 held · pilot units</p>
                        </div>

                        {/* TAB 1: HOLDINGS */}
                        {portfolioTab === "holdings" && (
                          <div className="space-y-2 mt-1">
                            <h2 className="text-xs font-extrabold text-[#0C150A]">Holdings</h2>

                            <div
                              onClick={() => setShowCertificateModal(true)}
                              className="cursor-pointer p-3 rounded-2xl bg-white border border-black/5 flex items-center justify-between shadow-xs hover:border-black/20"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-[#0C150A] flex items-center justify-center text-white">
                                  <Leaf size={16} />
                                </div>
                                <div>
                                  <p className="text-xs font-extrabold text-[#0C150A]">Biochar · Kalol, Gujarat</p>
                                  <p className="text-[10px] text-[#3F463E]">Batch #3 · bought ₹55,500</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-black text-[#0C150A]">5.000 t</p>
                                <span className="text-[9px] bg-[#E2F2DF] text-[#276A3C] font-bold px-2 py-0.5 rounded-full">
                                  Retired
                                </span>
                              </div>
                            </div>

                            <div
                              onClick={() => navigateTo("09_marketplace")}
                              className="cursor-pointer p-3 rounded-2xl bg-white border border-black/5 flex items-center justify-between shadow-xs hover:border-black/20"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-[#0C150A] flex items-center justify-center text-white">
                                  <Leaf size={16} />
                                </div>
                                <div>
                                  <p className="text-xs font-extrabold text-[#0C150A]">Biochar · Jaipur, Rajasthan</p>
                                  <p className="text-[10px] text-[#3F463E]">Batch #7 · bought ₹37,200</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-black text-[#0C150A]">3.000 t</p>
                                <span className="text-[9px] bg-black/5 text-[#3F463E] font-bold px-2 py-0.5 rounded-full">
                                  Held
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-white border border-black/5 mt-2">
                              <div>
                                <span className="text-[10px] text-[#3F463E]">Total units</span>
                                <p className="text-sm font-black text-[#0C150A]">8.000 tCO₂e</p>
                              </div>
                              <div>
                                <span className="text-[10px] text-[#3F463E]">Total spent</span>
                                <p className="text-sm font-black text-[#0C150A]">₹92,700</p>
                              </div>
                            </div>

                            <p className="text-[10px] text-[#3F463E] leading-relaxed">
                              Pilot units are not registry-recognised and have no market price.
                            </p>
                          </div>
                        )}

                        {/* TAB 2: HISTORY */}
                        {portfolioTab === "history" && (
                          <div className="space-y-2 mt-1">
                            <h2 className="text-xs font-extrabold text-[#0C150A]">Solana Devnet History</h2>
                            {[
                              { title: "Retired 5.000 tCO₂e", batch: "Batch #3 · Kalol", date: "12 Oct 2026", hash: "5ayYk...2z21", status: "Settled" },
                              { title: "Purchased 5.000 tCO₂e", batch: "Dodo Payments ₹55,500", date: "12 Oct 2026", hash: "9xVq...78bL", status: "Paid" },
                              { title: "Purchased 3.000 tCO₂e", batch: "Batch #7 · Jaipur", date: "09 Oct 2026", hash: "3mnP...49wZ", status: "Held" },
                              { title: "Producer Payout Received", batch: "Batch #2 (₹22,000)", date: "04 Oct 2026", hash: "UPI-4921-992", status: "Credited" },
                            ].map((item, idx) => (
                              <div key={idx} className="p-3 rounded-2xl bg-white border border-black/5 flex items-center justify-between text-xs shadow-xs">
                                <div>
                                  <p className="font-extrabold text-[#0C150A]">{item.title}</p>
                                  <p className="text-[10px] text-[#3F463E]">{item.batch}</p>
                                  <p className="font-mono text-[9px] text-[#276A3C]">{item.hash}</p>
                                </div>
                                <div className="text-right">
                                  <span className="text-[9px] bg-[#E2F2DF] text-[#276A3C] font-bold px-2 py-0.5 rounded-full block mb-1">
                                    {item.status}
                                  </span>
                                  <span className="text-[9px] text-[#3F463E]">{item.date}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* TAB 3: IMPACT */}
                        {portfolioTab === "impact" && (
                          <div className="space-y-2 mt-1">
                            <h2 className="text-xs font-extrabold text-[#0C150A]">Ecological Impact</h2>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="p-3 rounded-2xl bg-[#E2F2DF] border border-[#276A3C]/20 flex flex-col justify-between">
                                <span className="text-xl font-black text-[#276A3C]">8.0 t</span>
                                <span className="text-[10px] font-bold text-[#0C150A]">CO₂ Sequestered</span>
                              </div>
                              <div className="p-3 rounded-2xl bg-white border border-black/5 flex flex-col justify-between">
                                <span className="text-xl font-black text-[#0C150A]">34,400</span>
                                <span className="text-[10px] font-medium text-[#3F463E]">Km Car Offset</span>
                              </div>
                              <div className="p-3 rounded-2xl bg-white border border-black/5 flex flex-col justify-between">
                                <span className="text-xl font-black text-[#0C150A]">2,400 kg</span>
                                <span className="text-[10px] font-medium text-[#3F463E]">Biochar in Soil</span>
                              </div>
                              <div className="p-3 rounded-2xl bg-[#E2F2DF] border border-[#276A3C]/20 flex flex-col justify-between">
                                <span className="text-xl font-black text-[#276A3C]">+18%</span>
                                <span className="text-[10px] font-bold text-[#0C150A]">Water Retention</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {renderBottomNav("portfolio")}
                    </div>
                  )}

                  {/* ============================================================== */}
                  {/* SCREEN 13: PROFILE (Page 13 in Userflow) */}
                  {/* ============================================================== */}
                  {activeScreen === "13_profile" && (
                    <div className="flex-1 flex flex-col justify-between bg-[#F7F9F6] pb-20 overflow-y-auto">
                      <div className="p-5 pt-3 flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-[#0C150A] text-[#E2F2DF] flex items-center justify-center font-black text-base shadow-xs">
                            RP
                          </div>
                          <div>
                            <h1 className="text-lg font-extrabold text-[#0C150A]">Ramesh Patel</h1>
                            <p className="text-xs text-[#3F463E]">+91 98765 43210</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] bg-[#E2F2DF] text-[#0C150A] px-2.5 py-0.5 rounded-full font-bold">
                            Phone verified
                          </span>
                          <span className="text-[10px] bg-[#E2F2DF] text-[#0C150A] px-2.5 py-0.5 rounded-full font-bold">
                            ID check complete
                          </span>
                        </div>

                        {/* Menu Items */}
                        <div className="space-y-1.5 mt-1">
                          {[
                            { id: "account", icon: User, title: "Account settings" },
                            { id: "payouts", icon: Briefcase, title: "Payouts and payments", sub: "UPI · rameshp@upi" },
                            { id: "privacy", icon: Lock, title: "Privacy and security" },
                            { id: "language", icon: Globe, title: "Language", sub: `Current: ${lang.toUpperCase()}` },
                            { id: "offline_queue", icon: RefreshCw, title: "Offline queue", sub: "0 photos waiting to upload" },
                            { id: "support", icon: HelpCircle, title: "Support" },
                          ].map((item, idx) => {
                            const IconComp = item.icon;
                            return (
                              <div
                                key={idx}
                                onClick={() => setActiveProfileSheet(item.id)}
                                className="cursor-pointer p-3 rounded-2xl bg-white border border-black/5 hover:border-black/20 flex items-center justify-between transition-all shadow-xs"
                              >
                                <div className="flex items-center gap-2.5">
                                  <span className="w-7 h-7 rounded-full bg-[#E2F2DF] text-[#0C150A] flex items-center justify-center">
                                    <IconComp size={14} />
                                  </span>
                                  <div>
                                    <p className="text-xs font-extrabold text-[#0C150A]">{item.title}</p>
                                    {item.sub && <p className="text-[10px] text-[#3F463E]">{item.sub}</p>}
                                  </div>
                                </div>
                                <ChevronRight size={14} className="text-[#3F463E]" />
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {renderBottomNav("profile")}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Apple Home Indicator Bar */}
            <div className="w-full h-5 flex items-center justify-center pb-2 select-none z-30">
              <div className="w-32 h-1 bg-black/20 rounded-full" />
            </div>
          </div>
        </div>

      {/* ============================================================== */}
      {/* MODALS & DRAWERS */}
      {/* ============================================================== */}

      {/* 1. In-App Camera Viewfinder Modal */}
      <AnimatePresence>
        {showCameraModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0C150A] text-white rounded-3xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-3.5 border border-white/10"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera size={16} className="text-[#35C46A]" />
                  <h3 className="text-sm font-extrabold">Evidence Camera Viewfinder</h3>
                </div>
                <button onClick={() => setShowCameraModal(false)} className="p-1">
                  <X size={16} />
                </button>
              </div>

              <div className="relative aspect-4/3 rounded-2xl bg-black border border-white/20 overflow-hidden flex flex-col justify-between p-3">
                <div className="flex justify-between items-center text-[9px] text-white/70 font-mono">
                  <span>GPS: 23.2798° N, 72.4922° E</span>
                  <span className="text-[#35C46A] font-bold">LOCK 3D</span>
                </div>
                
                <div className="self-center border border-white/40 w-28 h-28 rounded-lg flex items-center justify-center">
                  <div className="w-2 h-2 bg-[#35C46A] rounded-full animate-ping" />
                </div>

                <div className="flex justify-between items-center text-[8px] text-[#A6E3B8] font-mono bg-black/60 px-2 py-0.5 rounded-md">
                  <span>Timestamp: 2026-10-12 18:25 UTC</span>
                  <span>Ed25519 Keystore</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setEvidencePhotosCount((c) => Math.min(6, c + 1));
                  setShowCameraModal(false);
                  playHapticSound("shutter");
                }}
                className="w-full h-11 rounded-2xl bg-[#35C46A] text-[#0C150A] font-extrabold text-xs shadow-md"
              >
                Capture & Sign with Device Key
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Equipment Picker Modal */}
      <AnimatePresence>
        {showEquipmentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white text-[#0C150A] rounded-3xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-3 border border-black/10"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold">Select Kiln / Reactor</h3>
                <button onClick={() => setShowEquipmentModal(false)} className="p-1">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2">
                {[
                  { name: "Retort kiln", desc: "25–30% yield · High purity biochar" },
                  { name: "Kon-Tiki flame curtain", desc: "15–22% yield · Field batch operation" },
                  { name: "Continuous pyrolysis drum", desc: "30–35% yield · Industrial automation" },
                  { name: "Gasifier unit", desc: "Combined syngas energy + biochar output" },
                ].map((eq) => (
                  <div
                    key={eq.name}
                    onClick={() => {
                      setEquipmentType(eq.name);
                      setShowEquipmentModal(false);
                      playHapticSound("tap");
                    }}
                    className={`cursor-pointer p-3 rounded-2xl border transition-all ${
                      equipmentType === eq.name
                        ? "bg-[#E2F2DF] border-[#0C150A]"
                        : "bg-[#F7F9F6] border-black/10 hover:bg-black/5"
                    }`}
                  >
                    <p className="text-xs font-extrabold text-[#0C150A]">{eq.name}</p>
                    <p className="text-[10px] text-[#3F463E]">{eq.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Evidence Audit Dossier Modal */}
      <AnimatePresence>
        {showEvidenceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white text-[#0C150A] rounded-3xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-3 border border-black/10 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-black/10 pb-2">
                <div>
                  <h3 className="text-sm font-extrabold text-[#0C150A]">Evidence Audit Dossier</h3>
                  <p className="text-[10px] text-[#276A3C]">Batch #3 · Kalol, Gujarat</p>
                </div>
                <button onClick={() => setShowEvidenceModal(false)} className="p-1">
                  <X size={16} />
                </button>
              </div>

              <div className="bg-[#F7F9F6] rounded-2xl p-3 border border-black/5">
                <span className="text-[10px] font-bold text-[#0C150A] block mb-1">
                  1. Geotagged Site Photos (3/6 Verified)
                </span>
                <div className="grid grid-cols-3 gap-1 mt-1">
                  <div className="h-12 rounded-lg bg-[#E2F2DF] border border-black/5 flex flex-col items-center justify-center text-[8px] text-center p-1">
                    <span>Feedstock Pile</span>
                    <span className="text-[#276A3C] font-bold">✓ Signed</span>
                  </div>
                  <div className="h-12 rounded-lg bg-[#E2F2DF] border border-black/5 flex flex-col items-center justify-center text-[8px] text-center p-1">
                    <span>Kiln Operation</span>
                    <span className="text-[#276A3C] font-bold">✓ Signed</span>
                  </div>
                  <div className="h-12 rounded-lg bg-[#E2F2DF] border border-black/5 flex flex-col items-center justify-center text-[8px] text-center p-1">
                    <span>Biochar Output</span>
                    <span className="text-[#276A3C] font-bold">✓ Signed</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#F7F9F6] rounded-2xl p-3 border border-black/5">
                <div className="flex justify-between items-center text-[10px] font-bold text-[#0C150A] mb-1">
                  <span>2. Reactor Thermocouple Log</span>
                  <span className="text-[#276A3C] font-mono text-[9px]">550°C (4.2h)</span>
                </div>
                <div className="h-10 w-full bg-[#E2F2DF] rounded-lg flex items-end px-2 py-1 gap-1">
                  {[20, 45, 75, 90, 92, 91, 88, 85, 60, 30].map((h, i) => (
                    <div key={i} style={{ height: `${h}%` }} className="flex-1 bg-[#0C150A] rounded-xs" />
                  ))}
                </div>
              </div>

              <div className="bg-[#F7F9F6] rounded-2xl p-3 border border-black/5 text-xs">
                <span className="text-[10px] font-bold text-[#0C150A] block mb-1">
                  3. Lab Assay · Carbon Fraction
                </span>
                <div className="flex justify-between text-[10px] text-[#3F463E] py-0.5">
                  <span>Elemental Carbon (Corg)</span>
                  <b className="text-[#0C150A]">78.4%</b>
                </div>
                <div className="flex justify-between text-[10px] text-[#3F463E] py-0.5">
                  <span>H:C Organic Ratio</span>
                  <b className="text-[#276A3C]">0.42 (&lt; 0.70 limit)</b>
                </div>
              </div>

              <div className="bg-[#F7F9F6] rounded-2xl p-3 border border-black/5 text-xs">
                <span className="text-[10px] font-bold text-[#0C150A] block mb-1">
                  4. Verifier Signatures
                </span>
                <div className="flex justify-between text-[10px] py-0.5 border-b border-black/5">
                  <span>Gujarat Carbon Audit Council</span>
                  <span className="text-[#276A3C] font-bold">✓ Approved</span>
                </div>
                <div className="flex justify-between text-[10px] py-0.5">
                  <span>Global MRV Alliance</span>
                  <span className="text-[#92400E] font-bold">● In Review</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowEvidenceModal(false);
                  navigateTo("07_zk_proof");
                }}
                className="w-full h-11 rounded-full bg-[#0C150A] text-white font-extrabold text-xs shadow-md"
              >
                Proceed to Zero-Knowledge Proof
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. High-Fidelity Retirement Certificate Modal */}
      <AnimatePresence>
        {showCertificateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#FBFDFB] text-[#0C150A] rounded-3xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-3 border-4 border-[#0C150A]"
            >
              <div className="flex justify-between items-center border-b border-black/10 pb-2">
                <div className="flex items-center gap-2">
                  <AtmosIcon name="mk" size={22} className="text-[#0C150A]" />
                  <span className="font-extrabold text-xs uppercase tracking-wider text-[#0C150A]">
                    Atmos Retirement Certificate
                  </span>
                </div>
                <button onClick={() => setShowCertificateModal(false)} className="text-black/60">
                  <X size={16} />
                </button>
              </div>

              <div className="text-center py-1">
                <p className="text-[9px] text-[#3F463E] uppercase font-bold tracking-widest">
                  Officially Retired On Solana Devnet
                </p>
                <p className="text-2xl font-black text-[#0C150A] mt-0.5">5.000 tCO₂e</p>
                <p className="text-xs text-[#276A3C] font-extrabold">Permanent Biochar Carbon Removal</p>
              </div>

              <div className="space-y-1 text-xs bg-[#F7F9F6] p-3 rounded-2xl border border-black/5">
                <div className="flex justify-between">
                  <span className="text-[#3F463E]">Batch</span>
                  <b>Biochar Batch #3 (Kalol)</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#3F463E]">Solana Tx</span>
                  <b className="font-mono text-[9px]">5ayYk…2z21</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#3F463E]">Methodology</span>
                  <b>ATMOS-BIOCHAR-PILOT-v1</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#3F463E]">Certificate ID</span>
                  <b className="font-mono text-[9px]">ATMOS-CERT-2026-003</b>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  onClick={() => alert("Retirement Certificate PDF downloaded to your device!")}
                  className="flex-1 h-10 rounded-full bg-[#0C150A] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Download size={13} /> Download PDF
                </button>
                <button
                  onClick={() => alert("Verification URL copied to clipboard: https://atmos.eco/verify/5ayYk2z21")}
                  className="h-10 px-3.5 rounded-full border border-black/10 font-bold text-xs flex items-center justify-center"
                >
                  <Share2 size={13} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. Dodo Payments Checkout Modal */}
      <AnimatePresence>
        {showDodoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white text-[#0C150A] rounded-3xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-3.5 border border-black/10 font-['Inter',sans-serif]"
            >
              <div className="flex items-center justify-between border-b border-black/10 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#0C150A] text-white flex items-center justify-center text-xs font-black">
                    D
                  </span>
                  <h3 className="text-sm font-extrabold">Dodo Payments Gateway</h3>
                </div>
                <button onClick={() => setShowDodoModal(false)} className="p-1 text-black/60">
                  <X size={16} />
                </button>
              </div>

              <div className="text-center py-1">
                <p className="text-xs text-[#3F463E]">Amount Due</p>
                <p className="text-2xl font-black text-[#0C150A]">₹55,500</p>
                <p className="text-[10px] text-[#276A3C] font-bold">5.000 tCO₂e Biochar · Kalol</p>
              </div>

              <div className="bg-[#F7F9F6] p-3 rounded-2xl border border-black/5 flex flex-col items-center gap-1.5">
                <div className="w-24 h-24 bg-black rounded-xl p-1 flex items-center justify-center">
                  <div className="w-full h-full bg-white grid grid-cols-4 gap-0.5 p-1">
                    <div className="bg-black col-span-2 row-span-2" />
                    <div className="bg-black" />
                    <div className="bg-black" />
                    <div className="bg-white" />
                    <div className="bg-black" />
                    <div className="bg-black col-span-2" />
                  </div>
                </div>
                <p className="text-[10px] font-bold text-[#3F463E]">Scan with GPay, PhonePe, Paytm, or BHIM</p>
              </div>

              <button
                onClick={() => {
                  setShowDodoModal(false);
                  navigateTo("11_certificate");
                }}
                className="w-full h-11 rounded-full bg-[#0C150A] text-white font-extrabold text-xs shadow-md hover:bg-black transition-colors"
              >
                Simulate Instant Payment
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. Profile Sub-Sheets */}
      <AnimatePresence>
        {activeProfileSheet && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white text-[#0C150A] rounded-3xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-3 border border-black/10"
            >
              <div className="flex items-center justify-between border-b border-black/10 pb-2">
                <h3 className="text-sm font-extrabold text-[#0C150A] capitalize">
                  {activeProfileSheet.replace("_", " ")}
                </h3>
                <button onClick={() => setActiveProfileSheet(null)} className="p-1">
                  <X size={16} />
                </button>
              </div>

              {activeProfileSheet === "account" && (
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-2xl bg-[#F7F9F6] border border-black/5">
                    <span className="text-[#3F463E] block text-[10px]">Producer Name</span>
                    <b className="text-sm text-[#0C150A]">Ramesh Patel</b>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-[#F7F9F6] border border-black/5">
                    <span className="text-[#3F463E] block text-[10px]">Farm Site Coordinates</span>
                    <b>23.2798° N, 72.4922° E (Kalol, Gujarat)</b>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-[#F7F9F6] border border-black/5">
                    <span className="text-[#3F463E] block text-[10px]">Aadhaar XML Status</span>
                    <b className="text-[#276A3C]">✓ Verified Offline (No Storage)</b>
                  </div>
                </div>
              )}

              {activeProfileSheet === "payouts" && (
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-2xl bg-[#F7F9F6] border border-black/5">
                    <span className="text-[#3F463E] block text-[10px]">Active UPI VPA</span>
                    <b className="text-sm text-[#276A3C]">rameshp@upi</b>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-[#F7F9F6] border border-black/5">
                    <span className="text-[#3F463E] block text-[10px]">Total Payouts Received</span>
                    <b className="text-base text-[#0C150A]">₹22,000</b>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-[#F7F9F6] border border-black/5">
                    <span className="text-[#3F463E] block text-[10px]">Settlement Schedule</span>
                    <b>Instant on Solana Smart Contract Execution</b>
                  </div>
                </div>
              )}

              {activeProfileSheet === "privacy" && (
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-2xl bg-[#F7F9F6] border border-black/5">
                    <span className="text-[#3F463E] block text-[10px]">Device Ed25519 Public Key</span>
                    <b className="font-mono text-[9px] text-[#276A3C] break-all">
                      AtmoS7x89K2lm99QwLa771vM2kZ18bQs8XfVjC3982KLmN5v
                    </b>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-[#F7F9F6] border border-black/5">
                    <span className="text-[#3F463E] block text-[10px]">Zero-Knowledge Prover</span>
                    <b className="text-[#276A3C]">Local WebAssembly Circuit Active</b>
                  </div>
                </div>
              )}

              {activeProfileSheet === "language" && (
                <div className="space-y-1.5 text-xs">
                  {[
                    { code: "en", name: "English" },
                    { code: "hi", name: "हिन्दी (Hindi)" },
                    { code: "gu", name: "ગુજરાતી (Gujarati)" },
                  ].map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLang(l.code as any);
                        setActiveProfileSheet(null);
                        playHapticSound("tap");
                      }}
                      className={`w-full text-left p-2.5 rounded-2xl border transition-colors ${
                        lang === l.code
                          ? "bg-[#0C150A] text-white font-bold"
                          : "bg-[#F7F9F6] border-black/5 hover:bg-black/5"
                      }`}
                    >
                      {l.name}
                    </button>
                  ))}
                </div>
              )}

              {activeProfileSheet === "offline_queue" && (
                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-2xl bg-[#E2F2DF] text-[#0C150A] font-bold text-center">
                    ✓ All offline evidence photos have synced with Solana!
                  </div>
                  <p className="text-[10px] text-[#3F463E] leading-relaxed">
                    Photos captured without cellular data are saved in local encrypted SQLite and uploaded automatically upon reconnection.
                  </p>
                </div>
              )}

              {activeProfileSheet === "support" && (
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-2xl bg-[#F7F9F6] border border-black/5">
                    <span className="text-[#3F463E] block text-[10px]">MRV Methodology Documentation</span>
                    <b className="text-[#276A3C]">ATMOS-BIOCHAR-PILOT-v1 Specification</b>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-[#F7F9F6] border border-black/5">
                    <span className="text-[#3F463E] block text-[10px]">Verifier Helpline</span>
                    <b>support@atmos.eco · +91 79 4000 2300</b>
                  </div>
                </div>
              )}

              <button
                onClick={() => setActiveProfileSheet(null)}
                className="w-full h-10 rounded-full bg-[#F1F1F1] text-[#0C150A] font-bold text-xs hover:bg-[#E2F2DF] transition-colors"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. Solana Explorer Modal */}
      <AnimatePresence>
        {showSolanaTxModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0C150A] text-white rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4 border border-white/10 font-['Inter',sans-serif]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#35C46A] animate-ping" />
                  <h3 className="text-sm font-extrabold text-white">Solana On-Chain Record</h3>
                </div>
                <button
                  onClick={() => setShowSolanaTxModal(false)}
                  className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white"
                >
                  ✕
                </button>
              </div>

              <div className="bg-white/5 rounded-2xl p-3.5 font-mono text-xs flex flex-col gap-2">
                <div>
                  <span className="text-white/50 text-[10px]">Program ID:</span>
                  <p className="text-[#35C46A] text-[10px] break-all">AtmoSReg11111111111111111111111111111111111</p>
                </div>
                <div>
                  <span className="text-white/50 text-[10px]">Transaction Signature:</span>
                  <p className="text-white text-[10px] break-all">
                    5ayYk98X2z21QwLa771vM2kZ18bQs8XfVjC3982KLmN5v
                  </p>
                </div>
                <div>
                  <span className="text-white/50 text-[10px]">Block Height:</span>
                  <p className="text-white text-[10px]">250,231 (FINALIZED)</p>
                </div>
                <div>
                  <span className="text-white/50 text-[10px]">Proof Commitment:</span>
                  <p className="text-[#35C46A] text-[10px]">zk_79a2b1c…</p>
                </div>
              </div>

              <button
                onClick={() => setShowSolanaTxModal(false)}
                className="w-full h-11 rounded-full bg-[#35C46A] text-[#0C150A] font-extrabold text-xs"
              >
                Close Explorer
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 8. Notification Modal */}
      <AnimatePresence>
        {showNotificationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white text-[#0C150A] rounded-3xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-3 border border-black/10"
            >
              <div className="flex items-center justify-between border-b border-black/10 pb-2">
                <div className="flex items-center gap-2">
                  <AtmosIcon name="bl" size={16} />
                  <h3 className="text-sm font-extrabold">Notifications</h3>
                </div>
                <button onClick={() => setShowNotificationModal(false)} className="p-1">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-2xl bg-[#E2F2DF] border border-black/5">
                  <p className="font-extrabold text-[#0C150A]">Batch #2 Credits Issued</p>
                  <p className="text-[10px] text-[#3F463E]">18.000 tCO₂e minted on Solana Devnet</p>
                </div>
                <div className="p-3 rounded-2xl bg-[#F7F9F6] border border-black/5">
                  <p className="font-extrabold text-[#0C150A]">UPI Payout Received</p>
                  <p className="text-[10px] text-[#3F463E]">₹22,000 credited to rameshp@upi</p>
                </div>
                <div className="p-3 rounded-2xl bg-[#F7F9F6] border border-black/5">
                  <p className="font-extrabold text-[#0C150A]">Batch #3 Auditor Assigned</p>
                  <p className="text-[10px] text-[#3F463E]">Gujarat Carbon Audit Council in review</p>
                </div>
              </div>

              <button
                onClick={() => setShowNotificationModal(false)}
                className="w-full h-10 rounded-full bg-[#0C150A] text-white font-extrabold text-xs"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
