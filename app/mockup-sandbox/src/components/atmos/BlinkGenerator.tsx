import React, { useState } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import {
  Zap,
  Share2,
  Copy,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  TreePine,
  ShieldCheck,
  Send,
  Globe2,
} from "lucide-react";

export const BlinkGenerator: React.FC = () => {
  const [selectedTier, setSelectedTier] = useState<number>(1);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [txSuccess, setTxSuccess] = useState<string | null>(null);

  const actionUrl = "https://atmos.finance/api/actions/offset-carbon";
  const dialectUrl = `https://dial.to/?action=solana-action:${encodeURIComponent(actionUrl)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(dialectUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExecuteOffset = (tons: number) => {
    setExecuting(true);
    setTxSuccess(null);

    setTimeout(() => {
      setExecuting(false);
      const mockTx = "5bLk" + Math.random().toString(36).substring(2, 12) + "BlinkOffset";
      setTxSuccess(
        `Instant Offset executed via Solana Action! Retired ${tons} tCO₂e. Tx: ${mockTx.slice(0, 8)}...`
      );
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Intro banner */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-950/50 via-slate-900 to-emerald-950/40 border border-purple-500/30 p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-400">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">Solana Actions & Dialect Blinks Hub</h2>
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40">
                  Colosseum Arena Highlight
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Turn any tweet, Discord message, or website link into a 1-click on-chain carbon retirement transaction.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleCopyLink}
              variant="outline"
              size="sm"
              className="border-purple-500/40 text-purple-300 hover:bg-purple-500/10 text-xs"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
              {copied ? "Copied Dialect URL!" : "Copy Shareable Blink"}
            </Button>
            <a
              href={dialectUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-500 text-white"
            >
              Open in Dial.to
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Interactive Blink Card Preview (as seen in Twitter / Dialect) */}
        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            Interactive Blink Card (Live Embed Simulation)
          </h3>

          <div className="rounded-2xl bg-slate-900 border border-slate-700/80 p-5 shadow-2xl overflow-hidden max-w-md mx-auto lg:max-w-none text-slate-100">
            {/* Blink banner image */}
            <div className="relative rounded-xl overflow-hidden aspect-[16/9] bg-gradient-to-br from-emerald-900 via-slate-950 to-teal-900 border border-slate-800 flex items-center justify-center p-6 text-center">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(16,185,129,0.2),transparent_70%)]" />
              <div className="relative z-10 flex flex-col items-center">
                <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mb-2">
                  <TreePine className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-white text-base">Atmos: Real-World Carbon Offset</h4>
                <p className="text-[11px] text-slate-300 mt-1 max-w-xs">
                  Verified by Sentinel-2 multi-spectral satellites & anchored on Solana Devnet.
                </p>
              </div>
              <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur px-2 py-0.5 rounded text-[10px] text-emerald-400 font-mono">
                <ShieldCheck className="w-3 h-3" />
                100% On-Chain Proof
              </div>
            </div>

            {/* Metadata info */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1 text-slate-300 font-medium">
                  <Globe2 className="w-3.5 h-3.5 text-emerald-400" />
                  atmos.finance
                </span>
                <span className="font-mono text-emerald-400">0.05 SOL ≈ 1 Ton CO₂e</span>
              </div>
              <h5 className="font-bold text-white text-sm mt-1">Offset Ecological Footprint in 1-Click</h5>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Retires verified agroforestry & mangrove credits. Generates an instant soulbound retirement NFT in your wallet.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => handleExecuteOffset(1)}
                  disabled={executing}
                  variant="outline"
                  className="bg-slate-950 border-slate-700 hover:border-emerald-500 hover:bg-emerald-500/10 text-xs font-semibold text-white py-2"
                >
                  Offset 1 Ton (0.05 SOL)
                </Button>
                <Button
                  onClick={() => handleExecuteOffset(5)}
                  disabled={executing}
                  variant="outline"
                  className="bg-slate-950 border-slate-700 hover:border-emerald-500 hover:bg-emerald-500/10 text-xs font-semibold text-white py-2"
                >
                  Offset 5 Tons (0.25 SOL)
                </Button>
              </div>

              {/* Custom input */}
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Custom tons (e.g. 10)"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                />
                <Button
                  disabled={!customAmount || executing}
                  onClick={() => handleExecuteOffset(Number(customAmount) || 1)}
                  className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-4"
                >
                  Offset
                </Button>
              </div>
            </div>

            {/* Execution status */}
            {txSuccess && (
              <div className="mt-3 p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-[11px] text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{txSuccess}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Technical Action Specification & Code */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <Share2 className="w-4 h-4 text-cyan-400" />
            Solana Action Manifest Specification
          </h3>

          <Card className="bg-slate-900/80 border-slate-800 text-slate-100">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-mono text-cyan-400">GET /api/actions/offset-carbon</CardTitle>
                <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30">
                  Dialect Standard Compliant
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="bg-slate-950 p-3.5 rounded-xl text-[11px] font-mono text-slate-300 overflow-x-auto border border-slate-800 leading-normal">
{`{
  "icon": "https://atmos.finance/icon.png",
  "title": "Atmos: Instant Verified Carbon Offset",
  "description": "Offset real-world CO₂ backed by Sentinel-2 satellite MRV.",
  "label": "Offset CO₂",
  "links": {
    "actions": [
      {
        "label": "Offset 1 Ton (0.05 SOL)",
        "href": "/api/actions/offset-carbon?amount=1"
      },
      {
        "label": "Offset 5 Tons (0.25 SOL)",
        "href": "/api/actions/offset-carbon?amount=5"
      },
      {
        "label": "Custom Tons",
        "href": "/api/actions/offset-carbon?amount={amount}",
        "parameters": [
          {
            "name": "amount",
            "label": "Enter tons of CO₂ to retire",
            "required": true
          }
        ]
      }
    ]
  }
}`}
              </pre>

              <div className="mt-4 p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-1.5">
                <div className="text-white font-semibold">How It Wins Colosseum:</div>
                <p>
                  Any project, creator, or DAO can post this link on X. Followers can inspect satellite verification and
                  execute an on-chain carbon offset in a single click without ever leaving their social feed!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
