import { pgTable, text, timestamp, uuid, decimal, boolean, index, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { assetsTable } from "./assets";

/**
 * Payments table - Tracks all payment transactions
 */
export const paymentsTable = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    buyerId: uuid("buyer_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => assetsTable.id, { onDelete: "cascade" }),
    quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(), // Tokens to purchase
    amount: decimal("amount", { precision: 15, scale: 2 }).notNull(), // Total price
    currency: text("currency", { enum: ["INR", "USDC", "USD"] }).default("INR"),
    paymentMethod: text("payment_method", {
      enum: ["dodo", "umbra-private", "direct"],
    }).notNull(),
    status: text("status", {
      enum: ["pending", "processing", "completed", "failed", "cancelled"],
    }).default("pending"),
    dodoSessionId: text("dodo_session_id"), // From Dodo Payments
    dodoCheckoutUrl: text("dodo_checkout_url"),
    umbraCommitment: text("umbra_commitment"), // For private payments
    umbraProof: text("umbra_proof"),
    transactionHash: text("transaction_hash"), // Solana tx hash
    retiredAt: timestamp("retired_at"), // When credits were retired
    isRetired: boolean("is_retired").default(false),
    webhookSignature: text("webhook_signature"), // For verification
    metadata: text("metadata"), // JSON: additional data
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    buyerIdIdx: index("payments_buyer_id_idx").on(table.buyerId),
    assetIdIdx: index("payments_asset_id_idx").on(table.assetId),
    statusIdx: index("payments_status_idx").on(table.status),
    dodoSessionIdx: index("payments_dodo_session_idx").on(table.dodoSessionId),
    transactionIdx: index("payments_transaction_hash_idx").on(table.transactionHash),
  }),
);

export const insertPaymentSchema = createInsertSchema(paymentsTable)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial({
    dodoSessionId: true,
    dodoCheckoutUrl: true,
    umbraCommitment: true,
    umbraProof: true,
    transactionHash: true,
    retiredAt: true,
    webhookSignature: true,
    metadata: true,
  });

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof paymentsTable.$inferSelect;
