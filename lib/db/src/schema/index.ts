/**
 * ATMOS Database Schema
 * ═══════════════════════════════════════════════════════════════════════════
 * Complete Drizzle ORM schema for carbon credit platform on Solana
 * 
 * Tables:
 * - users: Core user identity and KYC tracking
 * - projects: Carbon reduction projects
 * - assets: Minted carbon credit SPL tokens
 * - payments: Payment transactions
 * - settlements: Final settlement records on Solana
 * - holdings: User portfolio of carbon credits
 */

export * from "./users";
export * from "./projects";
export * from "./assets";
export * from "./payments";
export * from "./settlements";
export * from "./holdings";