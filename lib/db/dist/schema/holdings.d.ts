import { z } from "zod/v4";
/**
 * Holdings table - User's carbon credit portfolio
 * Tracks balance of each asset type per user (including encrypted Umbra holdings)
 */
export declare const holdingsTable: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "holdings";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "holdings";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        userId: import("drizzle-orm/pg-core").PgColumn<{
            name: "user_id";
            tableName: "holdings";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        assetId: import("drizzle-orm/pg-core").PgColumn<{
            name: "asset_id";
            tableName: "holdings";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        balance: import("drizzle-orm/pg-core").PgColumn<{
            name: "balance";
            tableName: "holdings";
            dataType: "string";
            columnType: "PgNumeric";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        acquiredAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "acquired_at";
            tableName: "holdings";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        encryptedBalance: import("drizzle-orm/pg-core").PgColumn<{
            name: "encrypted_balance";
            tableName: "holdings";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        umbraPublicKey: import("drizzle-orm/pg-core").PgColumn<{
            name: "umbra_public_key";
            tableName: "holdings";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        isEncrypted: import("drizzle-orm/pg-core").PgColumn<{
            name: "is_encrypted";
            tableName: "holdings";
            dataType: "string";
            columnType: "PgText";
            data: "yes" | "no";
            driverParam: string;
            notNull: false;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: ["yes", "no"];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        metadata: import("drizzle-orm/pg-core").PgColumn<{
            name: "metadata";
            tableName: "holdings";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        updatedAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "updated_at";
            tableName: "holdings";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
export declare const insertHoldingSchema: z.ZodObject<{
    userId: z.ZodUUID;
    metadata: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    assetId: z.ZodUUID;
    balance: z.ZodString;
    acquiredAt: z.ZodDate;
    encryptedBalance: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    umbraPublicKey: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    isEncrypted: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
        yes: "yes";
        no: "no";
    }>>>;
}, {
    out: {};
    in: {};
}>;
export type InsertHolding = z.infer<typeof insertHoldingSchema>;
export type Holding = typeof holdingsTable.$inferSelect;
//# sourceMappingURL=holdings.d.ts.map