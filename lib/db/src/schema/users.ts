import { pgTable, text, timestamp, boolean, uuid, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Users table - Core user identity and KYC tracking
 */
export const usersTable = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    phone: text("phone").unique().notNull(),
    email: text("email").unique(),
    walletAddress: text("wallet_address").unique(),
    walletPublicKey: text("wallet_public_key"), // Solana public key (base58)
    role: text("role", { enum: ["producer", "buyer", "admin"] }).default("producer"),
    kycStatus: text("kyc_status", {
      enum: ["not_started", "pending", "verified", "rejected"],
    }).default("not_started"),
    kycAadhaar: text("kyc_aadhaar_status", {
      enum: ["not_started", "pending", "verified"],
    }).default("not_started"),
    kycPan: text("kyc_pan_status", {
      enum: ["not_started", "pending", "verified"],
    }).default("not_started"),
    kycFarmDoc: text("kyc_farm_doc_status", {
      enum: ["not_started", "pending", "verified"],
    }).default("not_started"),
    authProvider: text("auth_provider", {
      enum: ["phone", "google", "apple"],
    }).default("phone"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    phoneIdx: index("users_phone_idx").on(table.phone),
    emailIdx: index("users_email_idx").on(table.email),
    walletIdx: index("users_wallet_idx").on(table.walletAddress),
    kycIdx: index("users_kyc_status_idx").on(table.kycStatus),
  }),
);

export const insertUserSchema = createInsertSchema(usersTable)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial({
    email: true,
    walletAddress: true,
    walletPublicKey: true,
    kycAadhaar: true,
    kycPan: true,
    kycFarmDoc: true,
  });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
