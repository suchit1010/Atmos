import { useEffect, useState } from "react";
import { subscribeToSettlement, Settlement, fetchSettlementById } from "@/server/settlement";

export interface UseSettlementOptions {
  interval?: number;
  enabled?: boolean;
}

/**
 * Hook for fetching and subscribing to settlement updates
 */
export function useSettlement(settlementId: string | undefined, options: UseSettlementOptions = {}) {
  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const [loading, setLoading] = useState(!settlementId);
  const [error, setError] = useState<string | null>(null);

  const { interval = 3000, enabled = true } = options;

  useEffect(() => {
    if (!settlementId || !enabled) return;

    setLoading(true);

    // Initial load
    const loadInitial = async () => {
      try {
        const data = await fetchSettlementById(settlementId);
        setSettlement(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load settlement");
      } finally {
        setLoading(false);
      }
    };

    loadInitial();

    // Subscribe to updates
    const unsubscribe = subscribeToSettlement(settlementId, (updated) => {
      setSettlement(updated);
    }, interval);

    return () => unsubscribe();
  }, [settlementId, interval, enabled]);

  return { settlement, loading, error };
}

/**
 * Hook for getting the status message and color of a settlement
 */
export function useSettlementStatus(settlement: Settlement | null | undefined) {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case "settled":
        return "#10b981"; // green
      case "minted":
        return "#3b82f6"; // blue
      case "credit_received":
        return "#f59e0b"; // amber
      case "pending":
        return "#6b7280"; // gray
      case "failed":
        return "#ef4444"; // red
      default:
        return "#6b7280";
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case "credit_received":
        return "💳 Credit Received";
      case "minted":
        return "🪙 Asset Minted";
      case "settled":
        return "✅ Settled";
      case "pending":
        return "⏳ Pending";
      case "failed":
        return "❌ Failed";
      default:
        return "Unknown";
    }
  };

  return {
    color: getStatusColor(settlement?.status),
    label: getStatusLabel(settlement?.status),
    emoji: settlement?.status === "settled" ? "✅" : settlement?.status === "minted" ? "🪙" : settlement?.status === "credit_received" ? "💳" : "⏳",
  };
}
