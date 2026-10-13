import type { PayoutRecord, PayoutStore } from "../chain";
import type { KvStore } from "../store";

export const PAYOUTS = "payouts";

const adapters = new WeakMap<KvStore, PayoutStore>();

/**
 * One adapter object per store: payTranche shares in-flight attempts by store
 * identity, so building a fresh adapter per call would switch that off.
 */
export function kvPayoutStore(store: KvStore): PayoutStore {
  let adapter = adapters.get(store);
  if (!adapter) {
    adapter = {
      claim: (record: PayoutRecord) => store.insertIfAbsent(PAYOUTS, record.key, record),
      get: (key: string) => store.get<PayoutRecord>(PAYOUTS, key),
      update: (record: PayoutRecord) => store.put(PAYOUTS, record.key, record),
      release: (key: string) => store.delete(PAYOUTS, key),
    };
    adapters.set(store, adapter);
  }
  return adapter;
}
