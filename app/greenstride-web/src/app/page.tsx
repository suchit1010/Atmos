"use client";

import React, { useState, useEffect } from "react";
import { AtmosMobileExperience } from "../components/AtmosMobileExperience";

export default function HomePage() {
  const [scale, setScale] = useState(1);

  // Auto-scale to ensure the 390x844 iPhone frame fits 100% on screen vertically & horizontally without cutoff
  useEffect(() => {
    const handleResize = () => {
      const availHeight = window.innerHeight - 32; // 16px padding top & bottom
      const availWidth = window.innerWidth - 24;  // 12px padding sides
      const scaleH = availHeight / 844;
      const scaleW = availWidth / 390;
      const targetScale = Math.min(1, Math.min(scaleH, scaleW));
      setScale(Math.max(0.65, targetScale));
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <main className="fixed inset-0 w-screen h-screen overflow-hidden bg-[#F7F9F6] flex items-center justify-center select-none">
      {/* Subtle Ambient Glow */}
      <div className="absolute w-[500px] h-[500px] bg-[#35C46A]/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Perfectly Centered & Auto-Scaled Phone Container */}
      <div
        className="relative transition-transform duration-200 ease-out origin-center shrink-0 flex items-center justify-center"
        style={{
          transform: `scale(${scale})`,
          width: 390,
          height: 844,
        }}
      >
        <AtmosMobileExperience />
      </div>
    </main>
  );
}
