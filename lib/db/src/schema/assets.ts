import { pgTable, text, timestamp, uuid, decimal, integer, index, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { projectsTable } from "./projects";

/**
 * Assets table - Minted carbon credit tokens
 */
export const assetsTable = pgTable(
  "assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projectsTable.id, { onDelete: "cascade" }),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // Tonnes CO2
    grade: text("grade", { enum: ["S", "A", "B", "C", "D"] }).notNull(),
    pricePerTonne: decimal("price_per_tonne", { precision: 10, scale: 2 }).notNull(),
    vintage: text("vintage").notNull(), // Year of reduction (2024, 2025, etc.)
    methodology: text("methodology").notNull(), // VERRA, Gold Standard, etc.
    mintAddress: text("mint_address").notNull(), // SPL token mint
    totalSupply: decimal("total_supply", { precision: 20, scale: 0 }).notNull(),
    circulatingSupply: decimal("circulating_supply", { precision: 20, scale: 0 }).notNull(),
    retiredSupply: decimal("retired_supply", { precision: 20, scale: 0 }).default("0"),
    status: text("status", { enum: ["active", "retired", "retired_partial"] }).default("active"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    projectIdIdx: index("assets_project_id_idx").on(table.projectId),
    statusIdx: index("assets_status_idx").on(table.status),
    mintIdx: index("assets_mint_idx").on(table.mintAddress),
  }),
);

export const insertAssetSchema = createInsertSchema(assetsTable)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial({
    retiredSupply: true,
  });

export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type Asset = typeof assetsTable.$inferSelect;
