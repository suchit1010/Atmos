import bs58 from "bs58";
import {
  Connection,
  SendTransactionError,
  TransactionExpiredBlockheightExceededError,
  type Keypair,
  type PublicKey,
  type Transaction,
} from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { MEMO_PROGRAM_ID } from "./memo";
import { ChainSendError, type ChainClient, type MemoTx, type SentTx } from "./types";

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** RPC-backed client. Not exercised in the offline test suite: see scripts/devnet-smoke.ts. */
export function createRpcClient(rpcUrl: string, network = "devnet"): ChainClient {
  const connection = new Connection(rpcUrl, "confirmed");

  return {
    network,

    async send(tx: Transaction, signers: Keypair[]): Promise<SentTx> {
      const payer = signers[0];
      if (!payer) throw new ChainSendError("no signer supplied", true);

      // Phase 1: nothing has left this process yet, so any failure here is definitive.
      let raw: Buffer;
      let blockhash: string;
      let lastValidBlockHeight: number;
      try {
        ({ blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed"));
        tx.feePayer = payer.publicKey;
        tx.recentBlockhash = blockhash;
        tx.sign(...signers);
        raw = tx.serialize();
      } catch (err) {
        throw new ChainSendError(`could not prepare the transaction: ${messageOf(err)}`, true, err);
      }
      const firstSignature = tx.signatures[0]?.signature;
      if (!firstSignature) throw new ChainSendError("transaction was not signed", true);
      const signature = bs58.encode(firstSignature);

      // Phase 2: submit. A rejected preflight can never land; a dropped connection might have.
      try {
        await connection.sendRawTransaction(raw, { preflightCommitment: "confirmed", maxRetries: 3 });
      } catch (err) {
        throw new ChainSendError(messageOf(err), err instanceof SendTransactionError, err);
      }

      // Phase 3: confirm.
      try {
        const result = await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");
        if (result.value.err) {
          throw new ChainSendError(`transaction failed: ${JSON.stringify(result.value.err)}`, true);
        }
        return { signature, slot: result.context.slot };
      } catch (err) {
        if (err instanceof ChainSendError) throw err;
        if (err instanceof TransactionExpiredBlockheightExceededError) {
          // web3.js does not re-check the signature when the block height runs out, and a lost
          // websocket notification would look the same as a transaction that never landed.
          // Ask the cluster directly before declaring it dead, or a retry could pay twice.
          let found: Awaited<ReturnType<Connection["getSignatureStatuses"]>>["value"][number] = null;
          try {
            found = (await connection.getSignatureStatuses([signature], { searchTransactionHistory: true })).value[0] ?? null;
          } catch (lookupErr) {
            throw new ChainSendError(
              `blockhash expired and the signature lookup failed: ${messageOf(lookupErr)}`,
              false,
              lookupErr,
            );
          }
          if (found) {
            if (found.err) throw new ChainSendError(`transaction failed: ${JSON.stringify(found.err)}`, true);
            if (found.confirmationStatus === "confirmed" || found.confirmationStatus === "finalized") {
              return { signature, slot: found.slot };
            }
          }
          throw new ChainSendError(messageOf(err), true, err);
        }
        throw new ChainSendError(messageOf(err), false, err);
      }
    },

    async getMemoTx(signature: string): Promise<MemoTx | null> {
      const parsed = await connection.getParsedTransaction(signature, {
        maxSupportedTransactionVersion: 0,
        commitment: "confirmed",
      });
      if (!parsed) return null;
      const memos: string[] = [];
      for (const ix of parsed.transaction.message.instructions) {
        if (!ix.programId.equals(MEMO_PROGRAM_ID)) continue;
        if ("parsed" in ix && typeof ix.parsed === "string") memos.push(ix.parsed);
        else if ("data" in ix) memos.push(Buffer.from(bs58.decode(ix.data)).toString("utf8"));
      }
      const feePayer = parsed.transaction.message.accountKeys[0];
      return {
        signature,
        slot: parsed.slot,
        blockTime: parsed.blockTime ?? null,
        signer: feePayer ? feePayer.pubkey.toBase58() : "",
        memos,
        err: parsed.meta?.err ?? null,
      };
    },

    async getTokenBalance(owner: PublicKey, mint: PublicKey): Promise<bigint> {
      const ata = getAssociatedTokenAddressSync(mint, owner, true);
      try {
        const balance = await connection.getTokenAccountBalance(ata, "confirmed");
        return BigInt(balance.value.amount);
      } catch (err) {
        if (/could not find account|invalid param/i.test(messageOf(err))) return 0n;
        throw err;
      }
    },

    minRentExempt(space: number): Promise<number> {
      return connection.getMinimumBalanceForRentExemption(space);
    },
  };
}
