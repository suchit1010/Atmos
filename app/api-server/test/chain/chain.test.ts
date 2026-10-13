import { describe, expect, it } from "vitest";
import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createMintToInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  ChainSendError,
  MEMO_PROGRAM_ID,
  MemoryPayoutStore,
  PayoutPendingError,
  anchorEvidence,
  createPayoutMint,
  memoInstruction,
  parsePayoutMemo,
  payTranche,
  payoutKey,
  verifyAnchor,
  type ChainClient,
} from "../../src/lib/chain";
import { FlakyClient, SimChainClient } from "./sim-client";

const HASH = "a".repeat(64);

function setup() {
  const client = new SimChainClient();
  const authority = Keypair.generate();
  client.fund(authority.publicKey, 10);
  return { client, authority, store: new MemoryPayoutStore() };
}

async function withMint() {
  const ctx = setup();
  const { mint, decimals } = await createPayoutMint(ctx.client, ctx.authority);
  return { ...ctx, mint, decimals };
}

describe("evidence anchor", () => {
  it("anchors a hash and verifies a match", async () => {
    const { client, authority } = setup();
    const anchored = await anchorEvidence(client, authority, "b1", HASH);
    const result = await verifyAnchor(client, anchored.signature, {
      batchId: "b1",
      hash: HASH,
      authority: authority.publicKey.toBase58(),
    });
    expect(result.status).toBe("match");
    expect(result.onChain?.hash).toBe(HASH);
    expect(result.onChain?.signer).toBe(authority.publicKey.toBase58());
  });

  it("reports a mismatch when the expected hash differs", async () => {
    const { client, authority } = setup();
    const anchored = await anchorEvidence(client, authority, "b1", HASH);
    const result = await verifyAnchor(client, anchored.signature, {
      batchId: "b1",
      hash: "b".repeat(64),
      authority: authority.publicKey.toBase58(),
    });
    expect(result.status).toBe("mismatch");
    expect(result.onChain?.hash).toBe(HASH);
  });

  it("reports a mismatch when the batch id differs", async () => {
    const { client, authority } = setup();
    const anchored = await anchorEvidence(client, authority, "b1", HASH);
    const result = await verifyAnchor(client, anchored.signature, {
      batchId: "b2",
      hash: HASH,
      authority: authority.publicKey.toBase58(),
    });
    expect(result.status).toBe("mismatch");
  });

  it("never counts an anchor from another signer, even with a matching hash", async () => {
    const { client } = setup();
    const impostor = Keypair.generate();
    client.fund(impostor.publicKey, 1);
    const anchored = await anchorEvidence(client, impostor, "b1", HASH);
    const result = await verifyAnchor(client, anchored.signature, {
      batchId: "b1",
      hash: HASH,
      authority: Keypair.generate().publicKey.toBase58(),
    });
    expect(result.status).toBe("wrong_signer");
  });

  it("reports not_found for an unknown signature", async () => {
    const { client, authority } = setup();
    const result = await verifyAnchor(client, "1".repeat(64), {
      batchId: "b1",
      hash: HASH,
      authority: authority.publicKey.toBase58(),
    });
    expect(result.status).toBe("not_found");
  });

  it("reports malformed when the memo is not ATMOS1", async () => {
    const { client, authority } = setup();
    const tx = new Transaction().add(memoInstruction(authority.publicKey, "hello world"));
    const sent = await client.send(tx, [authority]);
    const result = await verifyAnchor(client, sent.signature, {
      batchId: "b1",
      hash: HASH,
      authority: authority.publicKey.toBase58(),
    });
    expect(result.status).toBe("malformed");
  });

  it("uses the first parseable ATMOS1 memo when a transaction has several", async () => {
    const { client, authority } = setup();
    const tx = new Transaction().add(
      memoInstruction(authority.publicKey, "noise"),
      memoInstruction(authority.publicKey, `ATMOS1|b1|${HASH}`),
    );
    const sent = await client.send(tx, [authority]);
    const result = await verifyAnchor(client, sent.signature, {
      batchId: "b1",
      hash: HASH,
      authority: authority.publicKey.toBase58(),
    });
    expect(result.status).toBe("match");
  });

  it("fails definitively when the authority has no lamports", async () => {
    const { client } = setup();
    const broke = Keypair.generate();
    await expect(anchorEvidence(client, broke, "b1", HASH)).rejects.toMatchObject({
      name: "ChainSendError",
      definitive: true,
    });
  });
});

describe("tranche payout", () => {
  it("creates a mint with 2 decimals and funds the authority", async () => {
    const { client, authority, mint, decimals } = await withMint();
    expect(decimals).toBe(2);
    expect(await client.getTokenBalance(authority.publicKey, mint)).toBe(100_000_000n);
  });

  it("pays exactly the amount and the authority balance falls by the same amount", async () => {
    const { client, authority, store, mint, decimals } = await withMint();
    const recipient = Keypair.generate().publicKey;
    const before = await client.getTokenBalance(authority.publicKey, mint);
    const { record, replayed } = await payTranche({
      client, store, authority, mint, decimals, recipient, batchId: "b1", tranche: 1, amountMinor: 862,
    });
    expect(replayed).toBe(false);
    expect(record.status).toBe("confirmed");
    expect(record.key).toBe(payoutKey("b1", 1));
    expect(await client.getTokenBalance(recipient, mint)).toBe(862n);
    expect(await client.getTokenBalance(authority.publicKey, mint)).toBe(before - 862n);
  });

  it("builds one transaction: memo, then create-ata, then transfer-checked", async () => {
    const { client, authority, store, mint, decimals } = await withMint();
    const seen: Transaction[] = [];
    const spy: ChainClient = {
      network: client.network,
      send: (tx, signers) => {
        seen.push(tx);
        return client.send(tx, signers);
      },
      getMemoTx: (s) => client.getMemoTx(s),
      getTokenBalance: (o, m) => client.getTokenBalance(o, m),
      minRentExempt: (n) => client.minRentExempt(n),
    };
    await payTranche({
      client: spy, store, authority, mint, decimals, recipient: Keypair.generate().publicKey,
      batchId: "b1", tranche: 1, amountMinor: 862,
    });
    expect(seen).toHaveLength(1);
    const programs = seen[0]?.instructions.map((ix) => ix.programId.toBase58());
    expect(programs).toEqual([
      MEMO_PROGRAM_ID.toBase58(),
      ASSOCIATED_TOKEN_PROGRAM_ID.toBase58(),
      TOKEN_PROGRAM_ID.toBase58(),
    ]);
  });

  it("writes a payout memo that parses back to the same values", async () => {
    const { client, authority, store, mint, decimals } = await withMint();
    const { record } = await payTranche({
      client, store, authority, mint, decimals, recipient: Keypair.generate().publicKey,
      batchId: "b7", tranche: 1, amountMinor: 500,
    });
    const tx = await client.getMemoTx(record.signature ?? "");
    expect(tx?.memos.map(parsePayoutMemo)).toEqual([{ batchId: "b7", tranche: 1, amountMinor: 500 }]);
  });

  it("replays without sending another transaction", async () => {
    const { client, authority, store, mint, decimals } = await withMint();
    const recipient = Keypair.generate().publicKey;
    const args = { client, store, authority, mint, decimals, recipient, batchId: "b1", tranche: 1 as const, amountMinor: 862 };
    const first = await payTranche(args);
    const sentBefore = client.sentCount;
    const second = await payTranche(args);
    expect(second.replayed).toBe(true);
    expect(second.record.signature).toBe(first.record.signature);
    expect(client.sentCount).toBe(sentBefore);
    expect(await client.getTokenBalance(recipient, mint)).toBe(862n);
  });

  it("pays once when five identical calls run at the same time", async () => {
    const { client, authority, store, mint, decimals } = await withMint();
    const recipient = Keypair.generate().publicKey;
    const sentBefore = client.sentCount;
    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        payTranche({ client, store, authority, mint, decimals, recipient, batchId: "race", tranche: 1, amountMinor: 700 }),
      ),
    );
    expect(results.filter((r) => !r.replayed)).toHaveLength(1);
    expect(client.sentCount - sentBefore).toBe(1);
    expect(await client.getTokenBalance(recipient, mint)).toBe(700n);
  });

  it("pays once when a second server instance shares the store but not memory", async () => {
    // Simulates two serverless instances: the in-process dedupe cannot help, the store claim must.
    const { client, authority, store, mint, decimals } = await withMint();
    const recipient = Keypair.generate().publicKey;
    const slow = new FlakyClient(client);
    const results = await Promise.allSettled([
      payTranche({ client: slow, store, authority, mint, decimals, recipient, batchId: "two", tranche: 1, amountMinor: 300 }),
      payTranche({ client, store: Object.create(store) as MemoryPayoutStore, authority, mint, decimals, recipient, batchId: "two", tranche: 1, amountMinor: 300 }),
    ]);
    expect(results.some((r) => r.status === "fulfilled")).toBe(true);
    expect(await client.getTokenBalance(recipient, mint)).toBe(300n);
  });

  it("refuses to reuse a key with different parameters", async () => {
    const { client, authority, store, mint, decimals } = await withMint();
    const recipient = Keypair.generate().publicKey;
    await payTranche({ client, store, authority, mint, decimals, recipient, batchId: "b1", tranche: 1, amountMinor: 862 });
    await expect(
      payTranche({ client, store, authority, mint, decimals, recipient, batchId: "b1", tranche: 1, amountMinor: 900 }),
    ).rejects.toThrow(/different parameters/);
    await expect(
      payTranche({ client, store, authority, mint, decimals, recipient: Keypair.generate().publicKey, batchId: "b1", tranche: 1, amountMinor: 862 }),
    ).rejects.toThrow(/different parameters/);
  });

  it("releases the claim on a definitive failure so a retry can succeed", async () => {
    const ctx = setup();
    const { mint, decimals } = await createPayoutMint(ctx.client, ctx.authority, { initialSupplyMinor: 100n });
    const recipient = Keypair.generate().publicKey;
    const args = { ...ctx, mint, decimals, recipient, batchId: "b1", tranche: 1 as const, amountMinor: 862 };
    await expect(payTranche(args)).rejects.toMatchObject({ definitive: true });
    expect(await ctx.store.get(payoutKey("b1", 1))).toBeUndefined();
    expect(await ctx.client.getTokenBalance(recipient, mint)).toBe(0n);

    const ata = getAssociatedTokenAddressSync(mint, ctx.authority.publicKey, true);
    await ctx.client.send(
      new Transaction().add(createMintToInstruction(mint, ata, ctx.authority.publicKey, 10_000n)),
      [ctx.authority],
    );
    const retried = await payTranche(args);
    expect(retried.record.status).toBe("confirmed");
    expect(await ctx.client.getTokenBalance(recipient, mint)).toBe(862n);
  });

  it("keeps a pending record after an unknown outcome and refuses to resend", async () => {
    const ctx = await withMint();
    const flaky = new FlakyClient(ctx.client);
    const recipient = Keypair.generate().publicKey;
    const args = { ...ctx, client: flaky, recipient, batchId: "b1", tranche: 1 as const, amountMinor: 862 };
    flaky.failNext = "timeout";
    await expect(payTranche(args)).rejects.toBeInstanceOf(PayoutPendingError);
    const stored = await ctx.store.get(payoutKey("b1", 1));
    expect(stored?.status).toBe("pending");
    const attempts = flaky.sendAttempts;
    await expect(payTranche(args)).rejects.toBeInstanceOf(PayoutPendingError);
    expect(flaky.sendAttempts).toBe(attempts);
    expect(await ctx.client.getTokenBalance(recipient, ctx.mint)).toBe(0n);
  });

  it("creates the recipient token account idempotently across tranches", async () => {
    const { client, authority, store, mint, decimals } = await withMint();
    const recipient = Keypair.generate().publicKey;
    await payTranche({ client, store, authority, mint, decimals, recipient, batchId: "b1", tranche: 1, amountMinor: 862 });
    await payTranche({ client, store, authority, mint, decimals, recipient, batchId: "b1", tranche: 2, amountMinor: 863 });
    expect(await client.getTokenBalance(recipient, mint)).toBe(1725n);
  });

  it("rejects amounts that are not positive safe integers", async () => {
    const { client, authority, store, mint, decimals } = await withMint();
    const recipient = Keypair.generate().publicKey;
    for (const amountMinor of [0, -5, 1.5, Number.MAX_SAFE_INTEGER + 2, Number.NaN]) {
      await expect(
        payTranche({ client, store, authority, mint, decimals, recipient, batchId: "bad", tranche: 1, amountMinor }),
      ).rejects.toBeInstanceOf(RangeError);
    }
  });

  it("ChainSendError carries the definitive flag", () => {
    expect(new ChainSendError("x", true).definitive).toBe(true);
    expect(new ChainSendError("x", false).definitive).toBe(false);
    expect(SystemProgram.programId.toBase58()).toHaveLength(32);
  });
});
