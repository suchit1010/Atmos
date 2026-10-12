import { describe, expect, it } from "vitest";
import { getPayer, getExplorerUrl, mintCarbonCredit } from "../src/lib/solana";

const runLiveSmoke = process.env.RUN_SOLANA_SMOKE === "1";

describe.skipIf(!runLiveSmoke)("solana mint smoke", () => {
  it(
    "mints a carbon token on devnet and returns a usable explorer URL",
    async () => {
      if (!process.env.SOLANA_WALLET_PRIVATE_KEY) {
        throw new Error("SOLANA_WALLET_PRIVATE_KEY is required for live smoke tests");
      }

      process.env.SOLANA_NETWORK = process.env.SOLANA_NETWORK || "devnet";
      process.env.SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";

      const payer = getPayer();
      const projectId = `smoke-${Date.now()}`;

      const result = await mintCarbonCredit(projectId, payer.publicKey.toBase58(), 0.01, "A");

      expect(result.mintAddress).toMatch(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/);
      expect(result.tokenAccount).toMatch(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/);
      expect(result.txHash).toMatch(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/);
      expect(getExplorerUrl(result.txHash)).toContain("explorer.solana.com/tx/");
    },
    120000,
  );
});
