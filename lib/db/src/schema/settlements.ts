import { pgTable, text, timestamp, uuid, decimal, index, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { paymentsTable } from "./payments";

/**
 * Settlements table - Records final transaction on Solana
 */
export const settlementsTable = pgTable(
  "settlements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    paymentId: uuid("payment_id")
      .notNull()
      .references(() => paymentsTable.id, { onDelete: "cascade" }),
    transactionHash: text("transaction_hash").notNull().unique(),
    blockNumber: text("block_number").notNull(),
    slot: decimal("slot", { precision: 20, scale: 0 }).notNull(),
    status: text("status", {
      enum: ["pending", "confirmed", "finalized", "failed"],
    }).default("pending"),
    confirmations: decimal("confirmations", { precision: 10, scale: 0 }).default("0"),
    fromAddress: text("from_address").notNull(),
    toAddress: text("to_address").notNull(),
    amount: decimal("amount", { precision: 20, scale: 0 }).notNull(), // In lamports or SPL smallest unit
    fee: decimal("fee", { precision: 20, scale: 0 }), // Transaction fee
    tokenMint: text("token_mint"), // SPL token mint address
    memo: text("memo"), // Transaction memo
    metadata: text("metadata"), // JSON: additional settlement data
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    paymentIdIdx: index("settlements_payment_id_idx").on(table.paymentId),
    transactionIdx: index("settlements_transaction_hash_idx").on(table.transactionHash),
    statusIdx: index("settlements_status_idx").on(table.status),
  }),
);

export const insertSettlementSchema = createInsertSchema(settlementsTable)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial({
    fee: true,
    tokenMint: true,
    memo: true,
    metadata: true,
  });

export type InsertSettlement = z.infer<typeof insertSettlementSchema>;
export type Settlement = typeof settlementsTable.$inferSelect;
