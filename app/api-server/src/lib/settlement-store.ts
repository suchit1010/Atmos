/**
 * In-memory settlement store for tracking payment and credit events.
 * In production, this should be replaced with a database.
 */

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

class SettlementStore {
  private settlements = new Map<string, Settlement>();
  private settlementsByEventId = new Map<string, string>();
  private settlementsByDodoId = new Map<string, string>();

  /**
   * Create or update a settlement record
   */
  upsert(settlement: Partial<Settlement> & { id: string; assetId: string }): Settlement {
    const existing = this.settlements.get(settlement.id);
    const now = Date.now();

    const record: Settlement = {
      ...existing,
      ...settlement,
      id: settlement.id,
      assetId: settlement.assetId,
      status: settlement.status ?? existing?.status ?? "pending",
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    this.settlements.set(settlement.id, record);

    if (settlement.webhookEventId) {
      this.settlementsByEventId.set(settlement.webhookEventId, settlement.id);
    }

    if (typeof settlement.dodoPaymentId === 'string' && settlement.dodoPaymentId.trim()) {
      this.settlementsByDodoId.set(settlement.dodoPaymentId, settlement.id);
    }

    return record;
  }

  /**
   * Get settlement by Dodo payment id
   */
  getByDodoPaymentId(dodoPaymentId: string): Settlement | undefined {
    const settlementId = this.settlementsByDodoId.get(dodoPaymentId);
    return settlementId ? this.settlements.get(settlementId) : undefined;
  }

  /**
   * Get a settlement by ID
   */
  get(id: string): Settlement | undefined {
    return this.settlements.get(id);
  }

  /**
   * Get all settlements
   */
  getAll(): Settlement[] {
    return Array.from(this.settlements.values());
  }

  /**
   * Check if we've already processed a webhook event
   */
  hasProcessedEvent(eventId: string): boolean {
    return this.settlementsByEventId.has(eventId);
  }

  /**
   * Get settlement by webhook event ID
   */
  getByEventId(eventId: string): Settlement | undefined {
    const settlementId = this.settlementsByEventId.get(eventId);
    return settlementId ? this.settlements.get(settlementId) : undefined;
  }

  /**
   * Get settlements by status
   */
  getByStatus(status: Settlement["status"]): Settlement[] {
    return Array.from(this.settlements.values()).filter((s) => s.status === status);
  }

  /**
   * Clear all settlements (for testing)
   */
  clear(): void {
    this.settlements.clear();
    this.settlementsByEventId.clear();
  }

  /**
   * Get store size (for debugging)
   */
  size(): number {
    return this.settlements.size;
  }
}

// Singleton instance
export const settlementStore = new SettlementStore();

export default settlementStore;
