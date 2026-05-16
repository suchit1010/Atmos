import { Router } from "express";
import { mintCarbonCredit, anchorProofOnSolana, getConnection, getPayer } from "../lib/solana";

const router = Router();

// POST /api/assets/mint
// Mint a carbon credit SPL token on Solana devnet
router.post("/assets/mint", async (req, res) => {
  const { projectId, recipientAddress, co2Amount, grade } = req.body;

  if (!projectId || !co2Amount) {
    res.status(400).json({ error: "projectId and co2Amount are required" });
    return;
  }

  try {
    const recipient = recipientAddress || getPayer().publicKey.toBase58();

    const result = await mintCarbonCredit(projectId, recipient, co2Amount, grade || "B");

    res.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    req.log.error({ err: err.message }, "Failed to mint carbon credit");
    res.status(500).json({
      error: "Failed to mint carbon credit",
      message: err.message,
    });
  }
});

// POST /api/proofs/anchor
// Anchor a ZK proof hash on-chain via Solana memo program
router.post("/proofs/anchor", async (req, res) => {
  const { proofHash, projectId, co2Amount } = req.body;

  if (!proofHash || !projectId) {
    res.status(400).json({ error: "proofHash and projectId are required" });
    return;
  }

  try {
    const result = await anchorProofOnSolana(proofHash, co2Amount || 0, projectId);

    res.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    req.log.error({ err: err.message }, "Failed to anchor proof on Solana");
    res.status(500).json({
      error: "Failed to anchor proof on Solana",
      message: err.message,
    });
  }
});

// GET /api/solana/payer
// Get the current payer public key (for testing)
router.get("/solana/payer", (_req, res) => {
  try {
    const payer = getPayer();
    const connection = getConnection();
    res.json({
      publicKey: payer.publicKey.toBase58(),
      rpc: connection.rpcEndpoint,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
