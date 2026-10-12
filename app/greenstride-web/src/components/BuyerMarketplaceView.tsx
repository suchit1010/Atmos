"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Download,
  Building2,
  Leaf,
  Layers,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { CarbonOrder } from "@/services/types";

export function BuyerMarketplaceView() {
  const [orders, setOrders] = useState<CarbonOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<CarbonOrder | null>(null);
  const [buyerName, setBuyerName] = useState("Shopify Sustainability Fund");
  const [tonnes, setTonnes] = useState(18.0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/marketplace");
      const data = await res.json();
      if (data.orders) {
        setOrders(data.orders);
        if (!selectedOrder && data.orders.length > 0) {
          setSelectedOrder(data.orders[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCreateOrder = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-order",
          buyerName,
          tonnes,
          pricePerTonneINR: 11111,
        }),
      });
      const data = await res.json();
      if (data.order) {
        setSelectedOrder(data.order);
        fetchOrders();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetire = async (orderId: string) => {
    try {
      const res = await fetch("/api/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "retire",
          orderId,
          beneficiary: "Corporate ESG Scope 3 Carbon Neutrality Program",
        }),
      });
      const data = await res.json();
      if (data.order) {
        setSelectedOrder(data.order);
        setShowCertificateModal(true);
        fetchOrders();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 space-y-8 font-['Urbanist',sans-serif]">
      {/* Header Banner */}
      <div className="bg-[#0C150A] text-white rounded-3xl p-8 border border-white/10 shadow-2xl flex flex-wrap items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#35C46A] animate-pulse" />
            <span className="text-xs uppercase tracking-widest font-extrabold text-[#A6E3B8]">
              Corporate Carbon Removal Escrow
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">
            Atmos Carbon Credit Marketplace
          </h1>
          <p className="text-sm text-white/70 max-w-xl mt-2 leading-relaxed">
            Institutional buyers directly fund verified smallholder biochar batches on Solana. 100%
            permanence, Zero broker markups, instant on-chain retirement certificates.
          </p>
        </div>

        <div className="bg-white/10 rounded-2xl p-4 border border-white/10 text-center">
          <p className="text-xs text-white/60">Average Price Per Tonne</p>
          <p className="text-3xl font-black text-[#A6E3B8]">₹11,111</p>
          <p className="text-[11px] text-white/50">~$133.50 USDC / tonne CO₂e</p>
        </div>
      </div>

      {/* Main Grid: Create Order & Orderbook */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Escrow Checkout Form */}
        <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs space-y-5">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#0C150A]" />
            <h2 className="text-lg font-black text-[#0C150A]">Deposit Escrow to Producer</h2>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-[#0C150A] block mb-1">Corporate Buyer Name</label>
              <input
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-[#F1F1F1] border-2 border-transparent focus:border-[#0C150A] font-bold text-[#0C150A] outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-[#0C150A] block mb-1">
                Tonnes of CO₂e Removal (Biochar)
              </label>
              <input
                type="number"
                min="1"
                max="500"
                value={tonnes}
                onChange={(e) => setTonnes(parseFloat(e.target.value) || 1)}
                className="w-full h-11 px-3.5 rounded-xl bg-[#F1F1F1] border-2 border-transparent focus:border-[#0C150A] font-black text-[#0C150A] text-lg outline-none"
              />
            </div>

            {/* Price Calculation Card */}
            <div className="bg-[#E2F2DF] rounded-2xl p-4 space-y-2">
              <div className="flex justify-between text-[#0C150A]">
                <span>Escrow Total (INR):</span>
                <b className="text-base font-black">₹{(tonnes * 11111).toLocaleString()}</b>
              </div>
              <div className="flex justify-between text-[#3F463E]">
                <span>Solana USDC Escrow:</span>
                <b>~${Math.round((tonnes * 11111) / 83.2).toLocaleString()} USDC</b>
              </div>
              <div className="flex justify-between text-[#3F463E] pt-1 border-t border-black/5 text-[11px]">
                <span>Producer 55% Guaranteed:</span>
                <b className="text-[#0C150A]">
                  ₹{Math.round(((tonnes * 11111) * 0.55)).toLocaleString()}
                </b>
              </div>
            </div>

            <button
              onClick={handleCreateOrder}
              disabled={isSubmitting}
              className="w-full h-12 rounded-full bg-[#0C150A] text-white font-extrabold text-sm shadow-md hover:bg-black transition-all flex items-center justify-center gap-2"
            >
              <span>Deposit Escrow on Solana</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Right: Active Carbon Credit Orders */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-black/5 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-[#0C150A]">Settled & Active Orders</h2>
              <p className="text-xs text-[#3F463E]">
                Direct Smart Contract Commitments on Solana
              </p>
            </div>
            <span className="text-xs font-bold bg-[#E2F2DF] text-[#0C150A] px-3 py-1 rounded-full">
              {orders.length} Active Orders
            </span>
          </div>

          <div className="space-y-3">
            {orders.map((ord) => (
              <div
                key={ord.id}
                className="bg-[#F1F1F1] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 border border-transparent hover:border-[#0C150A] transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#0C150A]" />
                    <b className="text-sm font-extrabold text-[#0C150A]">{ord.buyerName}</b>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        ord.status === "RETIRED"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-[#E2F2DF] text-[#0C150A]"
                      }`}
                    >
                      {ord.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#3F463E]">
                    {ord.tonnesPurchased} t CO₂e · Total: ₹{ord.totalPriceINR.toLocaleString()} (~$
                    {ord.pricePerTonneUSDC * ord.tonnesPurchased} USDC)
                  </p>
                  <p className="text-[11px] font-mono text-[#3F463E]/70 truncate max-w-md">
                    Escrow: {ord.solanaEscrowAccount}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {ord.status === "RETIRED" ? (
                    <button
                      onClick={() => {
                        setSelectedOrder(ord);
                        setShowCertificateModal(true);
                      }}
                      className="px-3.5 py-2 rounded-full bg-[#0C150A] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs"
                    >
                      <span>View Certificate</span>
                      <ExternalLink size={12} />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRetire(ord.id)}
                      className="px-3.5 py-2 rounded-full bg-[#35C46A] text-[#0C150A] text-xs font-extrabold flex items-center gap-1.5 shadow-xs hover:bg-[#2fb05e] transition-colors"
                    >
                      <span>Retire Credits</span>
                      <Sparkles size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Retirement Certificate Modal */}
      <AnimatePresence>
        {showCertificateModal && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-xl w-full border-4 border-[#0C150A] shadow-2xl relative space-y-6"
            >
              <div className="flex items-center justify-between border-b border-black/10 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#0C150A] text-[#E2F2DF] flex items-center justify-center font-bold">
                    🌿
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-[#0C150A]">
                      Certificate of Carbon Retirement
                    </h3>
                    <p className="text-[11px] text-[#3F463E]">
                      Solana On-Chain Cryptographic Registry
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCertificateModal(false)}
                  className="w-8 h-8 rounded-full bg-[#F1F1F1] flex items-center justify-center text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="bg-[#E2F2DF] rounded-2xl p-5 space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#3F463E]">Certificate ID:</span>
                  <b className="font-mono text-[#0C150A]">
                    {selectedOrder.retirementCertificateId || "CERT_ATMOS_MSFT_2026_094"}
                  </b>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#3F463E]">Retired For:</span>
                  <b className="text-[#0C150A]">{selectedOrder.buyerName}</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#3F463E]">Tonnes Permanently Sequestered:</span>
                  <b className="text-[#0C150A] text-sm">{selectedOrder.tonnesPurchased} t CO₂e</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#3F463E]">Durability Class:</span>
                  <b className="text-[#0C150A]">Biochar Pyro-Matrix (&gt;100 Years)</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#3F463E]">Producer Village:</span>
                  <b className="text-[#0C150A]">Gujarat Agro Kiln Cluster #2</b>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => alert("Downloading Cryptographic PDF Certificate...")}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#F1F1F1] text-xs font-bold text-[#0C150A] hover:bg-[#E2F2DF] transition-colors"
                >
                  <Download size={14} />
                  <span>Download PDF Certificate</span>
                </button>
                <button
                  onClick={() => setShowCertificateModal(false)}
                  className="px-6 py-2.5 rounded-full bg-[#0C150A] text-white text-xs font-bold"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
