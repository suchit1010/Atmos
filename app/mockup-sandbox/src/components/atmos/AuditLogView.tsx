import React, { useState } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import {
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Cpu,
  Terminal,
  Search,
  Filter,
  Flame,
  Zap,
} from "lucide-react";

interface AuditEntry {
  id: string;
  timestamp: string;
  eventType: "ZK_PROOF_ANCHOR" | "SATELLITE_MRV_PASS" | "TOKEN_MINTED" | "TOKEN_RETIRED";
  projectId: string;
  details: string;
  slot: number;
  txHash: string;
  verifier: string;
}

const INITIAL_LOGS: AuditEntry[] = [
  {
    id: "log-901",
    timestamp: "2 mins ago",
    eventType: "TOKEN_MINTED",
    projectId: "proj-sundarbans-mangrove-01",
    details: "Minted 25.0 tCO₂e SPL Carbon Token to 8xMt...Atm1 | Quality Grade: S",
    slot: 298105210,
    txHash: "4xYqK9ZcQn5J2mG7T8sL1vB3wR6dE9fP0aO2iU4yH7kX",
    verifier: "Solana Devnet Token Program",
  },
  {
    id: "log-900",
    timestamp: "8 mins ago",
    eventType: "ZK_PROOF_ANCHOR",
    projectId: "proj-araku-agroforestry-02",
    details: "Groth16 Zero-Knowledge Proof anchored via Memo Program PDA. Hash: 0x9f83...8912",
    slot: 298105150,
    txHash: "2bWpL4VcXm8N1kH9J3sF5tA7yE0dG2rT6uQ8iO4pZ1vK",
    verifier: "Atmos ZK Verifier (Groth16 BN254)",
  },
  {
    id: "log-899",
    timestamp: "19 mins ago",
    eventType: "SATELLITE_MRV_PASS",
    projectId: "proj-nilgiri-biochar-03",
    details: "Sentinel-2 L2A Band 8/4 NDVI analysis completed (+0.89). Fraud risk: LOW. AI Confidence: 99.1%",
    slot: 298105020,
    txHash: "5jKm3XvP8Lq2N4tZ1wR6sA7yB0dE9fG4uH8iO2pT5vC",
    verifier: "Claude Haiku 4.5 Multi-Agent Engine",
  },
  {
    id: "log-898",
    timestamp: "45 mins ago",
    eventType: "TOKEN_RETIRED",
    projectId: "proj-sundarbans-mangrove-01",
    details: "Burned 10.0 tCO₂e permanently. Soulbound Certificate #ATMOS-CERT-9481 issued to Vanguard ESG.",
    slot: 298104890,
    txHash: "3mZk8P4QvL9dE1aB6cT2wR7yU0iO5nS8fH4jG2xK1vP",
    verifier: "Atmos Retirement Registry",
  },
];

export const AuditLogView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");

  const filteredLogs = INITIAL_LOGS.filter((log) => {
    const matchesSearch =
      log.projectId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.txHash.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = selectedFilter === "ALL" || log.eventType === selectedFilter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-950 to-slate-900 border border-cyan-500/30 p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">Cryptographic Proof & MRV Audit Ledger</h2>
                <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/40">
                  Immutable Audit Trail
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Real-time cryptographic consensus log verifying all satellite scans, zero-knowledge proofs, and Solana transactions.
              </p>
            </div>
          </div>

          <div className="bg-slate-900/80 px-4 py-2.5 rounded-xl border border-slate-800 text-xs">
            <div className="text-[10px] text-slate-400 uppercase">Solana Slot Height</div>
            <div className="font-mono text-emerald-400 font-bold">#298,105,210</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search hash, project, or event..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
        </div>

        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {["ALL", "TOKEN_MINTED", "ZK_PROOF_ANCHOR", "SATELLITE_MRV_PASS", "TOKEN_RETIRED"].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedFilter(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedFilter === type
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-white"
              }`}
            >
              {type === "ALL" ? "All Events" : type.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger Feed */}
      <Card className="bg-slate-900/80 border-slate-800 text-slate-100 shadow-xl">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <CardTitle className="text-sm font-semibold text-white">Event Log Stream</CardTitle>
          </div>
          <span className="text-xs text-slate-400">{filteredLogs.length} events found</span>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 text-xs transition-all space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        log.eventType === "TOKEN_MINTED"
                          ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                          : log.eventType === "ZK_PROOF_ANCHOR"
                          ? "border-cyan-500/40 text-cyan-400 bg-cyan-500/10"
                          : log.eventType === "TOKEN_RETIRED"
                          ? "border-rose-500/40 text-rose-400 bg-rose-500/10"
                          : "border-purple-500/40 text-purple-400 bg-purple-500/10"
                      }`}
                    >
                      {log.eventType.replace(/_/g, " ")}
                    </Badge>
                    <span className="font-semibold text-white">{log.projectId}</span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                    <span className="font-mono">Slot #{log.slot.toLocaleString()}</span>
                    <span>•</span>
                    <span>{log.timestamp}</span>
                  </div>
                </div>

                <p className="text-slate-300 font-mono text-[11px] leading-relaxed">{log.details}</p>

                <div className="pt-2 border-t border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-slate-500" />
                    <span>Attested by: <span className="text-slate-300">{log.verifier}</span></span>
                  </div>

                  <a
                    href={`https://explorer.solana.com/tx/${log.txHash}?cluster=devnet`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-cyan-400 hover:text-cyan-300 self-end sm:self-auto"
                  >
                    Tx: {log.txHash.slice(0, 10)}...{log.txHash.slice(-6)}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
