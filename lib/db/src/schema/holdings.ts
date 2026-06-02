import { pgTable, text, timestamp, uuid, decimal, index, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { assetsTable } from "./assets";

/**
 * Holdings table - User's carbon credit portfolio
 * Tracks balance of each asset type per user (including encrypted Umbra holdings)
 */
export const holdingsTable = pgTable(
  "holdings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => assetsTable.id, { onDelete: "cascade" }),
    balance: decimal("balance", { precision: 20, scale: 0 }).notNull(), // SPL tokens (in smallest unit)
    acquiredAt: timestamp("acquired_at").notNull(),
    // Privacy: for Umbra-protected holdings
    encryptedBalance: text("encrypted_balance"), // Umbra-encrypted amount
    umbraPublicKey: text("umbra_public_key"), // User's Umbra public key
    isEncrypted: text("is_encrypted", { enum: ["yes", "no"] }).default("no"),
    metadata: text("metadata"), // JSON: acquisition details
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("holdings_user_id_idx").on(table.userId),
    assetIdIdx: index("holdings_asset_id_idx").on(table.assetId),
    userAssetIdx: index("holdings_user_asset_idx").on(table.userId, table.assetId), // Unique per user-asset
  }),
);

export const insertHoldingSchema = createInsertSchema(holdingsTable)
  .omit({ id: true, updatedAt: true })
  .partial({
    encryptedBalance: true,
    umbraPublicKey: true,
    metadata: true,
  });

export type InsertHolding = z.infer<typeof insertHoldingSchema>;
export type Holding = typeof holdingsTable.$inferSelect;
