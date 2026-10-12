"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Leaf, Sparkles, CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";

interface Props {
  onComplete?: () => void;
  onSkip?: () => void;
}

export const OnboardingView: React.FC<Props> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Step Towards a Greener Future",
      description:
        "Join a global movement turning everyday movement and ecological conservation into verified carbon reduction assets.",
      tag: "Earth Restoration Mesh",
    },
    {
      title: "Satellite & AI Verified MRV",
      description:
        "Every tree planted and calorie spent is tracked via Sentinel-2 multispectral orbits and validated on Solana Devnet.",
      tag: "100% Cryptographic Proof",
    },
    {
      title: "Trade & Retire SPL Carbon Assets",
      description:
        "Directly fund native agroforestry and receive soulbound non-transferable ESG certificates instantly in your wallet.",
      tag: "Solana Token-2022",
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#3FAF58", "#E2F2DF", "#45A849", "#0C150A"],
      });
      onComplete?.();
    }
  };

  return (
    <div className="w-full h-full bg-white flex flex-col justify-between overflow-hidden relative select-none">
      {/* Top Header */}
      <header className="pt-8 px-7 flex items-center justify-between z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#EBF6EA] flex items-center justify-center text-[#3FAF58] shadow-sm">
            <Leaf className="w-4 h-4 text-[#3FAF58]" />
          </div>
          <span className="text-[19px] font-bold text-[#0C150A] tracking-[-0.02em]">GreenStride</span>
        </div>

        <button
          onClick={onSkip}
          type="button"
          className="text-[14px] font-medium text-[#9BA199] hover:text-[#0C150A] transition-colors"
        >
          Skip
        </button>
      </header>

      {/* Hero Animated Wireframe Earth / Orbit Illustration */}
      <section className="relative flex-1 flex items-center justify-center px-4 overflow-hidden">
        <div className="relative w-[320px] h-[320px] flex items-center justify-center">
          {/* Ambient blur */}
          <div className="absolute inset-8 rounded-full bg-[#F1F8F0] blur-2xl opacity-80 pointer-events-none" />

          {/* Rotating outer orbital ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute inset-4 rounded-full border border-dashed border-[#BDE0BA]/50 flex items-center justify-center pointer-events-none"
          >
            {/* Satellite / node floating */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white shadow-md border-2 border-[#3FAF58] flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-[#3FAF58]" />
            </div>
            <div className="absolute -bottom-2 left-1/3 w-3 h-3 rounded-full bg-[#DCEFD9] border border-[#3FAF58]" />
          </motion.div>

          {/* Intermediate wireframe ring */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
            className="absolute inset-10 rounded-full border border-[#D5EAD2] pointer-events-none"
          />

          {/* Central Globe Body */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative w-[210px] h-[210px] rounded-full bg-gradient-to-tr from-[#EBF7EA] via-[#F4FAF3] to-white border-2 border-[#D3EBD0] shadow-[0_15px_35px_rgba(63,175,88,0.15)] flex items-center justify-center overflow-hidden"
          >
            {/* Latitude / longitude grid arcs */}
            <svg className="absolute inset-0 w-full h-full text-[#A8D8A3]/40" viewBox="0 0 100 100">
              <ellipse cx="50" cy="50" rx="46" ry="18" fill="none" stroke="currentColor" strokeWidth="1" />
              <ellipse cx="50" cy="50" rx="46" ry="34" fill="none" stroke="currentColor" strokeWidth="1" />
              <line x1="50" y1="4" x2="50" y2="96" stroke="currentColor" strokeWidth="1" />
              <line x1="4" y1="50" x2="96" y2="50" stroke="currentColor" strokeWidth="1" />
            </svg>

            {/* Glowing inner core */}
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0.9, 0.6] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#3FAF58]/30 to-[#8CD694]/20 blur-md"
            />

            {/* Leaf centerpiece badge */}
            <div className="relative z-10 w-14 h-14 rounded-2xl bg-white/90 backdrop-blur-sm border border-[#D3EBD0] shadow-md flex items-center justify-center">
              <Leaf className="w-7 h-7 text-[#3FAF58]" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Editorial Content & CTA Section */}
      <footer className="px-7 pb-10 z-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="space-y-3"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF6EA] text-[#3FAF58] text-[11px] font-semibold tracking-wide">
              <Sparkles className="w-3 h-3" />
              {steps[currentStep].tag}
            </div>

            <h2 className="text-[26px] font-extrabold text-[#0C150A] leading-[1.2] tracking-tight">
              {steps[currentStep].title}
            </h2>

            <p className="text-[13px] text-[#727771] leading-relaxed">
              {steps[currentStep].description}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Step Indicator dots */}
        <div className="flex items-center justify-center gap-2 my-6">
          {steps.map((_, idx) => (
            <motion.button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              animate={{
                width: currentStep === idx ? 28 : 8,
                backgroundColor: currentStep === idx ? "#0C150A" : "#D5DCD4",
              }}
              transition={{ duration: 0.3 }}
              className="h-2 rounded-full cursor-pointer focus:outline-none"
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Primary CTA Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleNext}
          className="w-full bg-[#0C150A] hover:bg-[#1A2617] text-white py-4 px-6 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 shadow-lg shadow-black/10 transition-colors"
        >
          <span>{currentStep === steps.length - 1 ? "Get Started" : "Continue"}</span>
          <ArrowRight className="w-4 h-4 text-[#DCEFD9]" />
        </motion.button>
      </footer>
    </div>
  );
};
