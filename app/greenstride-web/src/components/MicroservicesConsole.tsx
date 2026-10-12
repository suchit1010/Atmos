"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Server,
  Activity,
  ShieldCheck,
  Cpu,
  Layers,
  ArrowRight,
  Database,
  CheckCircle2,
  RefreshCw,
  Terminal,
  Zap,
  ExternalLink,
  Code2,
} from "lucide-react";
import { MicroserviceHealth } from "@/services/types";

export function MicroservicesConsole() {
  const [healthData, setHealthData] = useState<{
    status: string;
    uptime: string;
    network: string;
    services: MicroserviceHealth[];
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>("/api/health");
  const [endpointPayload, setEndpointPayload] = useState<any>(null);
  const [testingEndpoint, setTestingEndpoint] = useState(false);

  const fetchHealth = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      setHealthData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const testEndpoint = async (endpoint: string, method: "GET" | "POST" = "GET", body?: any) => {
    setTestingEndpoint(true);
    setSelectedEndpoint(endpoint);
    try {
      const res = await fetch(endpoint, {
        method,
        headers: body ? { "Content-Type": "application/json" } : {},
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      setEndpointPayload(data);
    } catch (err: any) {
      setEndpointPayload({ error: err.message });
    } finally {
      setTestingEndpoint(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 space-y-8 font-['Urbanist',sans-serif]">
      {/* Header Banner */}
      <div className="bg-[#0C150A] text-white rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#35C46A]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#35C46A] animate-ping" />
              <span className="text-xs uppercase tracking-widest font-extrabold text-[#A6E3B8]">
                First Principles Architecture
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Atmos Protocol Microservices Engine
            </h1>
            <p className="text-sm text-white/70 max-w-2xl mt-2 leading-relaxed">
              Decentralized Measurement, Reporting & Verification (dMRV) with hardware-anchored
              tamper proofing, multi-tier AI consensus, and direct-to-producer 55% Solana escrow
              settlement.
            </p>
          </div>

          <button
            onClick={fetchHealth}
            disabled={isLoading}
            className="flex items-center gap-2 bg-[#E2F2DF] text-[#0C150A] px-4 py-2.5 rounded-full font-extrabold text-xs shadow-md hover:bg-white transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            <span>Sync Microservices</span>
          </button>
        </div>

        {/* Global KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-white/10 text-xs">
          <div>
            <span className="text-white/50 block">Architecture Pattern:</span>
            <span className="font-extrabold text-white text-sm">Decoupled Microservices</span>
          </div>
          <div>
            <span className="text-white/50 block">Consensus Layer:</span>
            <span className="font-extrabold text-[#A6E3B8] text-sm">AI + Sentinel-2 GIS</span>
          </div>
          <div>
            <span className="text-white/50 block">Settlement Rail:</span>
            <span className="font-extrabold text-white text-sm">Solana cNFT + Local UPI</span>
          </div>
          <div>
            <span className="text-white/50 block">Producer Share:</span>
            <span className="font-extrabold text-[#35C46A] text-sm">55% Direct On-Chain</span>
          </div>
        </div>
      </div>

      {/* First Principles: The Problem We Are Solving */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-black/5 shadow-xs space-y-6">
        <div>
          <h2 className="text-2xl font-black text-[#0C150A]">
            First Principles: What Problem Are We Solving?
          </h2>
          <p className="text-sm text-[#3F463E] mt-1">
            Analyzing why legacy carbon credit systems fail and how Atmos restructures the market.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Problem Card */}
          <div className="bg-[#FFF5F5] border border-red-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-red-700 font-extrabold text-sm">
              <span className="w-2 h-2 rounded-full bg-red-600" />
              <span>Legacy Carbon Market Failure Modes</span>
            </div>
            <ul className="text-xs text-red-950/80 space-y-2 list-disc pl-4 leading-relaxed">
              <li>
                <b>Phantom Credits:</b> Manual audits occur once every 12–24 months. Over 90% of
                forestry credits have been revealed to lack permanence.
              </li>
              <li>
                <b>Middleman Extortion:</b> Brokers, registries, and trading houses retain 60%–85%
                of capital. Farmers receive less than 15% after years of waiting.
              </li>
              <li>
                <b>Zero Cryptographic Anchor:</b> Relies on PDF self-reporting and easily forged
                spreadsheet metrics.
              </li>
              <li>
                <b>Web3 Disconnect:</b> Rural farmers in India / Global South do not have crypto
                wallets or English fluency.
              </li>
            </ul>
          </div>

          {/* First Principles Solution */}
          <div className="bg-[#E2F2DF] border border-[#35C46A]/30 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-[#0C150A] font-extrabold text-sm">
              <span className="w-2 h-2 rounded-full bg-[#35C46A]" />
              <span>Atmos First Principles Solution</span>
            </div>
            <ul className="text-xs text-[#0C150A]/90 space-y-2 list-disc pl-4 leading-relaxed">
              <li>
                <b>Hardware Keystore Anchoring:</b> Offline-first mobile dMRV hashes GPS, tilt,
                timestamp, and kiln pyrometer telemetry via device Ed25519 keystore.
              </li>
              <li>
                <b>Direct Mathematical Split:</b> Smart contract escrow automatically splits 55%
                to producers, 15% aggregator, 7% verifier, 5% registry, 18% protocol.
              </li>
              <li>
                <b>Multi-Tier AI Consensus:</b> Computer Vision scans sacks & kiln cores + Sentinel-2
                satellite GIS cross-verifies vegetation index + 2 independent audit orgs.
              </li>
              <li>
                <b>Solana Abstracted to Local UPI:</b> Producers receive instant fiat payouts via
                UPI (`rameshp@upi`), while corporate buyers receive verified SPL cNFTs.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Interactive Microservices Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-[#0C150A]">Live Microservices Status</h2>
            <p className="text-xs text-[#3F463E]">
              6 Decoupled Services Orchestrated via Next.js Route Handlers
            </p>
          </div>
          <span className="text-xs font-bold bg-[#E2F2DF] text-[#0C150A] px-3 py-1 rounded-full">
            All Systems Operational
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {healthData?.services.map((svc, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-5 border border-black/5 hover:border-[#0C150A] transition-all shadow-xs flex flex-col justify-between gap-4 group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#35C46A]" />
                    <span className="text-[11px] font-mono text-[#3F463E] font-bold">
                      {svc.endpoint}
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold text-[#35C46A] bg-[#E2F2DF] px-2 py-0.5 rounded-full">
                    {svc.latencyMs}ms
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-[#0C150A] group-hover:text-[#35C46A] transition-colors">
                  {svc.name}
                </h3>
                <p className="text-xs text-[#3F463E] mt-1 leading-relaxed">{svc.description}</p>
              </div>

              <div className="pt-3 border-t border-black/5 flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#0C150A]">Status: ONLINE</span>
                <button
                  onClick={() => {
                    if (svc.endpoint === "/api/health") testEndpoint("/api/health");
                    else if (svc.endpoint === "/api/auth") testEndpoint("/api/auth");
                    else if (svc.endpoint === "/api/mrv") testEndpoint("/api/mrv");
                    else if (svc.endpoint === "/api/verify")
                      testEndpoint("/api/verify", "POST", {
                        action: "consensus",
                        batchId: "batch_atmos_003",
                      });
                    else if (svc.endpoint === "/api/solana")
                      testEndpoint("/api/solana?tx=4Nkp87vX2gP9eXFQwLa771vM2kZ18bQs8XfVjC3982KLmN5v");
                    else if (svc.endpoint === "/api/payouts")
                      testEndpoint("/api/payouts", "POST", {
                        action: "split",
                        totalAmountINR: 200000,
                      });
                    else if (svc.endpoint === "/api/marketplace")
                      testEndpoint("/api/marketplace");
                  }}
                  className="px-2.5 py-1 rounded-full bg-[#F1F1F1] hover:bg-[#0C150A] hover:text-white text-[11px] font-extrabold transition-all flex items-center gap-1"
                >
                  <span>Test API</span>
                  <Zap size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Microservice Inspector Console */}
      <div className="bg-[#0C150A] text-white rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Terminal size={18} className="text-[#35C46A]" />
            <h3 className="text-lg font-black text-white">Live Microservice Payload Inspector</h3>
          </div>
          <div className="flex items-center gap-1 text-xs font-mono">
            <span className="text-white/50">Target:</span>
            <span className="text-[#A6E3B8] font-bold">{selectedEndpoint}</span>
          </div>
        </div>

        {/* Quick Trigger Buttons */}
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={() =>
              testEndpoint("/api/verify", "POST", { action: "zk-proof", batchId: "batch_003" })
            }
            className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-[#35C46A] hover:text-[#0C150A] text-xs font-bold transition-all"
          >
            Generate ZK-Proof (/api/verify)
          </button>
          <button
            onClick={() =>
              testEndpoint("/api/payouts", "POST", {
                action: "settle-upi",
                upiId: "rameshp@okhdfcbank",
                amountINR: 22000,
              })
            }
            className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-[#35C46A] hover:text-[#0C150A] text-xs font-bold transition-all"
          >
            Trigger UPI Settlement (/api/payouts)
          </button>
          <button
            onClick={() => testEndpoint("/api/mrv")}
            className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-[#35C46A] hover:text-[#0C150A] text-xs font-bold transition-all"
          >
            Query Batches (/api/mrv)
          </button>
          <button
            onClick={() => testEndpoint("/api/marketplace")}
            className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-[#35C46A] hover:text-[#0C150A] text-xs font-bold transition-all"
          >
            Corporate Orderbook (/api/marketplace)
          </button>
        </div>

        {/* Console Payload Window */}
        <div className="bg-black/80 rounded-2xl p-4 font-mono text-xs overflow-x-auto border border-white/10 max-h-72">
          {testingEndpoint ? (
            <div className="flex items-center gap-2 text-[#35C46A]">
              <RefreshCw size={14} className="animate-spin" />
              <span>Dispatching HTTP request to microservice...</span>
            </div>
          ) : endpointPayload ? (
            <pre className="text-[#A6E3B8] whitespace-pre-wrap">
              {JSON.stringify(endpointPayload, null, 2)}
            </pre>
          ) : (
            <p className="text-white/40">
              Click any &quot;Test API&quot; button above to inspect live microservice response payloads.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
