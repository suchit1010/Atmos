import React from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Trophy,
  ShieldAlert,
  Cpu,
  Layers,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Target,
  Zap,
  Globe2,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const HackathonPlaybookModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-950 border border-emerald-500/30 shadow-2xl shadow-emerald-500/10 p-6 md:p-8 text-slate-100">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                  Colosseum Arena Hackathon Strategy & Blindspots
                </h2>
                <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10">
                  Winning Blueprint
                </Badge>
              </div>
              <p className="text-sm text-slate-400 mt-0.5">
                Target Tracks: Climate / RWA • DePIN • Payments • Solana Infrastructure
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
          >
            ✕
          </Button>
        </div>

        {/* Executive Summary */}
        <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-cyan-950/40 border border-emerald-500/20">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-1">
            <Sparkles className="w-4 h-4" />
            Core Winning Thesis for Colosseum Judges
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            Colosseum judges prioritize <strong>real Solana composability</strong>, <strong>frictionless user distribution</strong> (Blinks/Actions),
            and solving <strong>genuine industry market failures</strong> rather than building superficial crypto wrappers.
            Atmos solves the #1 existential crisis in voluntary carbon markets (fraudulent claims, phantom forests, 9-month audit delays) by anchoring
            automated Sentinel-2 satellite MRV directly into <strong>Solana Token-2022</strong> assets settled in sub-seconds.
          </p>
        </div>

        {/* 3 Strategic Pillars */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-2 text-cyan-400 font-medium text-sm mb-2">
              <Cpu className="w-4 h-4" />
              1. Deep Solana Native Stack
            </div>
            <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
              <li><strong>Token-2022</strong> Transfer hooks & soulbound retirement certs</li>
              <li><strong>Solana Actions & Blinks</strong> for 1-click Twitter/web offsets</li>
              <li><strong>Memo Program PDA</strong> anchoring SHA-256 zk-proof state</li>
              <li><strong>Anchor Program</strong> deployed on Solana devnet</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-2 text-emerald-400 font-medium text-sm mb-2">
              <Globe2 className="w-4 h-4" />
              2. DePIN & Satellite MRV
            </div>
            <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
              <li><strong>Sentinel-2 L2A</strong> 10-meter multi-spectral NDVI imagery</li>
              <li><strong>Claude Haiku 4.5</strong> multi-agent verification pipeline</li>
              <li><strong>GeoHash indexing</strong> to cryptographically prevent double-claims</li>
              <li><strong>Automated fraud scoring</strong> via spectral anomaly detection</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-2 text-amber-400 font-medium text-sm mb-2">
              <Zap className="w-4 h-4" />
              3. Dual Settlement Rails
            </div>
            <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
              <li><strong>Crypto Native:</strong> Instant USDC & SOL settlement on Solana</li>
              <li><strong>Enterprise Fiat:</strong> Dodo Payments in 50+ local currencies</li>
              <li>Sub-second token delivery vs traditional 6-18 month carbon registries</li>
              <li>100% verifiable on Solana Explorer with permanent on-chain receipts</li>
            </ul>
          </div>
        </div>

        {/* Critical Blindspots & How Atmos Solves Them */}
        <div className="mt-6">
          <h3 className="text-base font-semibold text-white flex items-center gap-2 mb-3">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            Top 4 Hackathon Blindspots & Atmos Solutions
          </h3>

          <div className="space-y-3">
            <div className="p-3.5 rounded-lg bg-slate-900/60 border border-rose-500/20 flex flex-col md:flex-row gap-3">
              <div className="md:w-1/3">
                <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">Blindspot #1: Phantom Credits</span>
                <p className="text-xs text-slate-400 mt-0.5">Projects claiming credit for trees that burned down or never existed.</p>
              </div>
              <div className="md:w-2/3 border-t md:border-t-0 md:border-l border-slate-800 md:pl-3">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Atmos Solution:
                </span>
                <p className="text-xs text-slate-300 mt-0.5">
                  Automated time-series Sentinel-2 satellite analysis. Credits are only mintable if NIR/Red spectral NDVI
                  exceeds baseline for consecutive quarters, attested by multi-agent AI with on-chain cryptographic signatures.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-900/60 border border-rose-500/20 flex flex-col md:flex-row gap-3">
              <div className="md:w-1/3">
                <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">Blindspot #2: Double-Counting Across Registries</span>
                <p className="text-xs text-slate-400 mt-0.5">Same polygon sold on Verra, Gold Standard, and Solana simultaneously.</p>
              </div>
              <div className="md:w-2/3 border-t md:border-t-0 md:border-l border-slate-800 md:pl-3">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Atmos Solution:
                </span>
                <p className="text-xs text-slate-300 mt-0.5">
                  Hierarchical GeoHash polygon hashing anchored into Solana PDA state accounts. Any overlapping coordinate polygon
                  triggers an immediate smart-contract collision revert before minting can occur.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-900/60 border border-rose-500/20 flex flex-col md:flex-row gap-3">
              <div className="md:w-1/3">
                <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">Blindspot #3: Speculative Hoarding vs Real Offsets</span>
                <p className="text-xs text-slate-400 mt-0.5">Traders treat carbon tokens as memecoins rather than achieving net zero.</p>
              </div>
              <div className="md:w-2/3 border-t md:border-t-0 md:border-l border-slate-800 md:pl-3">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Atmos Solution:
                </span>
                <p className="text-xs text-slate-300 mt-0.5">
                  1-Click On-Chain Retirement Station that burns the SPL token and immediately issues a non-transferable Soulbound
                  Retirement Certificate NFT containing verified project metadata and beneficiary corporate tax identifiers.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-900/60 border border-rose-500/20 flex flex-col md:flex-row gap-3">
              <div className="md:w-1/3">
                <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">Blindspot #4: Wallet Onboarding Friction</span>
                <p className="text-xs text-slate-400 mt-0.5">Corporates with ESG budgets cannot hold crypto keys or buy SOL directly.</p>
              </div>
              <div className="md:w-2/3 border-t md:border-t-0 md:border-l border-slate-800 md:pl-3">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Atmos Solution:
                </span>
                <p className="text-xs text-slate-300 mt-0.5">
                  Seamless Dodo Payments integration allowing credit card and corporate wire checkout in 50+ currencies. The API
                  automatically swaps fiat → USDC → executes the on-chain Solana carbon mint and retirement in the background.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Milestone 0 (M0) Solana Deliverables */}
        <div className="mt-6 p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-400" />
              Milestone 0 (M0) Solana Execution Status
            </h3>
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
              Active on Devnet
            </Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-300">
            <div className="flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Real SPL Token Minting on Solana Devnet (`/api/assets/mint`)</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Memo Program ZK-Proof Hash Anchoring (`/api/proofs/anchor`)</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>On-Chain Token Burn & Soulbound Cert Minting (`/api/assets/retire`)</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Solana Actions & Dialect Blinks Spec (`/api/actions/offset-carbon`)</span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <a
            href="https://colosseum.com/arena/hackathon"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1.5 transition-colors"
          >
            Visit Colosseum Arena Hackathon Portal
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <Button
            onClick={onClose}
            className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs px-6 py-2 rounded-lg"
          >
            Explore Interactive App
          </Button>
        </div>
      </div>
    </div>
  );
};
