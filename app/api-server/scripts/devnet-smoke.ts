/**
 * One-off check of the Solana half of Atmos against a real cluster.
 *
 *   pnpm --filter @workspace/api-server exec tsx scripts/devnet-smoke.ts
 *
 * Needs network access to a devnet RPC. It was NOT run in the environment this
 * repository was built in (no network), so run it once before demoing.
 *
 * Env: SOLANA_RPC_URL (default devnet), SOLANA_PAYER_SECRET_KEY (base58 or JSON
 * array), ATMOS_TOKEN_MINT (optional: reuse an existing payout mint).
 */
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import {
  MemoryPayoutStore,
  anchorEvidence,
  createPayoutMint,
  createRpcClient,
  explorerAddressUrl,
  explorerTxUrl,
  hashManifest,
  keypairFromSecret,
  payTranche,
  verifyAnchor,
} from "../src/lib/chain";

const rpcUrl = process.env["SOLANA_RPC_URL"] ?? "https://api.devnet.solana.com";
const network = "devnet";

function fail(reason: string): never {
  console.error(`FAIL: ${reason}`);
  process.exit(1);
}

async function main(): Promise<void> {
  const secret = process.env["SOLANA_PAYER_SECRET_KEY"];
  if (!secret) {
    const fresh = Keypair.generate();
    console.log(`New payer public key: ${fresh.publicKey.toBase58()}`);
    console.log(`New payer secret key (base58, keep private): ${bs58.encode(fresh.secretKey)}`);
    console.log(
      "Fund this address with devnet SOL at https://faucet.solana.com (the CLI airdrop is rate limited), " +
        "save the secret as SOLANA_PAYER_SECRET_KEY, then run again.",
    );
    process.exit(2);
  }

  const authority = keypairFromSecret(secret);
  const client = createRpcClient(rpcUrl, network);
  const connectionCheck = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getBalance", params: [authority.publicKey.toBase58()] }),
  });
  const balanceJson = (await connectionCheck.json()) as { result?: { value?: number } };
  const lamports = balanceJson.result?.value ?? 0;
  console.log(`Payer ${authority.publicKey.toBase58()} balance: ${lamports / LAMPORTS_PER_SOL} SOL`);
  if (lamports < 0.05 * LAMPORTS_PER_SOL) fail("payer has less than 0.05 SOL; fund it at https://faucet.solana.com");

  let mint: PublicKey;
  let decimals = 2;
  const existing = process.env["ATMOS_TOKEN_MINT"];
  if (existing) {
    mint = new PublicKey(existing);
    console.log(`Reusing payout mint ${mint.toBase58()}`);
  } else {
    const created = await createPayoutMint(client, authority, { decimals });
    mint = created.mint;
    decimals = created.decimals;
    console.log(`Created payout mint ${mint.toBase58()}. Set ATMOS_TOKEN_MINT=${mint.toBase58()} for the API.`);
  }

  const batchId = `smoke_${Date.now()}`;
  const manifest = { batchId, volumeL: 320, photos: ["x", "y"], note: "devnet smoke test" };
  const hash = hashManifest(manifest);
  const anchored = await anchorEvidence(client, authority, batchId, hash);
  const anchorUrl = explorerTxUrl(anchored.signature, network);
  console.log(`Anchored ${hash.slice(0, 12)}… in slot ${anchored.slot}: ${anchorUrl}`);

  const verified = await verifyAnchor(client, anchored.signature, {
    batchId,
    hash,
    authority: authority.publicKey.toBase58(),
  });
  if (verified.status !== "match") fail(`verifyAnchor returned ${verified.status}, expected match`);

  const recipient = Keypair.generate().publicKey;
  const store = new MemoryPayoutStore();
  const args = { client, store, authority, mint, decimals, recipient, batchId, tranche: 1 as const, amountMinor: 862 };
  const paid = await payTranche(args);
  if (paid.replayed) fail("first payout reported replayed");
  const payoutUrl = explorerTxUrl(paid.record.signature ?? "", network);
  console.log(`Paid tranche 1 (862 minor units): ${payoutUrl}`);

  const again = await payTranche(args);
  if (!again.replayed) fail("second payout with the same key was not a replay");
  const balance = await client.getTokenBalance(recipient, mint);
  if (balance !== 862n) fail(`recipient balance is ${balance}, expected 862`);

  const tampered = await verifyAnchor(client, anchored.signature, {
    batchId,
    hash: hashManifest({ ...manifest, volumeL: 321 }),
    authority: authority.publicKey.toBase58(),
  });
  if (tampered.status !== "mismatch") fail(`altered hash returned ${tampered.status}, expected mismatch`);

  console.log(`Anchor:  ${anchorUrl}`);
  console.log(`Payout:  ${payoutUrl}`);
  console.log(`Mint:    ${explorerAddressUrl(mint.toBase58(), network)}`);
  console.log("PASS");
}

main().catch((err: unknown) => fail(err instanceof Error ? err.message : String(err)));
