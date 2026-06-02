import { pgTable, text, timestamp, uuid, integer, decimal, index, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

/**
 * Projects table - Carbon reduction projects
 */
export const projectsTable = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: text("type", {
      enum: [
        "biochar",
        "solar",
        "ev",
        "agroforestry",
        "reforestation",
        "methane",
        "water",
        "wind",
        "energy",
      ],
    }).notNull(),
    description: text("description"),
    location: text("location").notNull(), // JSON: { latitude, longitude, state, country }
    landBoundaryPolygon: text("land_boundary_polygon"), // GeoJSON polygon
    metadata: text("metadata").notNull(), // JSON: project-specific data (biomass, capacity, etc.)
    status: text("status", {
      enum: ["draft", "verifying", "verified", "minted", "sold"],
    }).default("draft"),
    verificationStatus: text("verification_status", {
      enum: ["not_started", "pending", "verified", "rejected"],
    }).default("not_started"),
    verificationResult: text("verification_result"), // JSON: AI verification output
    satImage: text("sat_image"), // URL to satellite imagery
    co2Reduction: decimal("co2_reduction", { precision: 10, scale: 2 }), // Tonnes CO2
    verificationConfidence: integer("verification_confidence"), // 0-100%
    verificationGrade: text("verification_grade", {
      enum: ["S", "A", "B", "C", "D"],
    }), // Carbon standard grade
    fraudRisk: text("fraud_risk", { enum: ["low", "medium", "high"] }), // AI assessment
    zkProofHash: text("zk_proof_hash"), // Proof hash from ZK verification
    mintAddress: text("mint_address"), // SPL token mint address
    tokenSupply: decimal("token_supply", { precision: 20, scale: 0 }), // Total tokens minted
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("projects_user_id_idx").on(table.userId),
    statusIdx: index("projects_status_idx").on(table.status),
    verificationIdx: index("projects_verification_idx").on(table.verificationStatus),
    typeIdx: index("projects_type_idx").on(table.type),
  }),
);

export const insertProjectSchema = createInsertSchema(projectsTable)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial({
    description: true,
    satImage: true,
    co2Reduction: true,
    verificationConfidence: true,
    verificationGrade: true,
    fraudRisk: true,
    zkProofHash: true,
    mintAddress: true,
    tokenSupply: true,
    verificationResult: true,
    landBoundaryPolygon: true,
  });

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projectsTable.$inferSelect;
