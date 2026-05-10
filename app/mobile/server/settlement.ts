/**
 * Settlement API helpers for fetching payment and settlement status
 */

const API_BASE = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api";

export interface Settlement {
  id: string;
  assetId: string;
  status: "pending" | "credit_received" | "minted" | "settled" | "failed";
  grantId?: string;
  creditAmount?: number;
  dodoPaymentId?: string;
  solanaSignature?: string;
  webhookEventId?: string;
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, unknown>;
}

/**
 * Fetch all settlements or filter by status
 */
export async function fetchSettlements(status?: string): Promise<{ settlements: Settlement[]; count: number }> {
  const url = new URL(`${API_BASE}/payments/settlements`);
  if (status) url.searchParams.append("status", status);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch settlements: ${res.status}`);
  }

  return res.json();
}

/**
 * Fetch a specific settlement by ID
 */
export async function fetchSettlementById(settlementId: string): Promise<Settlement> {
  const res = await fetch(`${API_BASE}/payments/settlements/${settlementId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error("Settlement not found");
    }
    throw new Error(`Failed to fetch settlement: ${res.status}`);
  }

  return res.json();
}

/**
 * Poll for settlement updates at an interval
 */
export function subscribeToSettlement(
  settlementId: string,
  onUpdate: (settlement: Settlement) => void,
  interval = 3000,
): () => void {
  const timer = setInterval(async () => {
    try {
      const settlement = await fetchSettlementById(settlementId);
      onUpdate(settlement);
    } catch (error) {
      console.warn("Settlement poll error:", error);
    }
  }, interval);

  return () => clearInterval(timer);
}
