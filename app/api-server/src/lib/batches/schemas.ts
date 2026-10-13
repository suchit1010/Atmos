import { PublicKey } from "@solana/web3.js";
import { z } from "zod";

const ISO_WITH_ZONE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/;

/** An ISO 8601 time with an explicit zone, normalised to UTC with milliseconds. */
export const isoTime = z
  .string()
  .max(40)
  .refine((v) => ISO_WITH_ZONE.test(v) && !Number.isNaN(Date.parse(v)), "must be an ISO 8601 time with a zone")
  .transform((v) => new Date(v).toISOString());

export const walletField = z
  .string()
  .min(32)
  .max(44)
  .refine((v) => {
    try {
      return new PublicKey(v).toBytes().length === 32;
    } catch {
      return false;
    }
  }, "not a valid Solana address");

export const MAX_PHOTO_BYTES = 700_000;
export const MAX_PHOTOS = 4;

const photoSchema = z.object({
  kind: z.enum(["mid", "end"]),
  mime: z.enum(["image/jpeg", "image/png"]),
  /** Base64 of the image bytes, without a data: prefix. */
  dataBase64: z.string().min(8).max(Math.ceil((MAX_PHOTO_BYTES * 4) / 3) + 8),
  capturedAt: isoTime.optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});

export const createBatchSchema = z.object({
  /** Chosen by the phone, so a retry after a lost connection never creates a second batch. */
  clientBatchId: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/),
  startedAt: isoTime,
  submittedAt: isoTime,
  feedstock: z.enum(["mixed-crop-residue", "woody-residue"]),
  volumeL: z.number().positive().max(5000),
  moisturePct: z.number().min(0).max(100).optional(),
  touchTestPassed: z.boolean().optional(),
  payoutWallet: walletField.optional(),
  photos: z.array(photoSchema).max(MAX_PHOTOS),
});
export type CreateBatchBody = z.infer<typeof createBatchSchema>;

export const producerSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  farmPoint: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }),
  areaHectares: z.number().positive().max(10_000).optional(),
  kilnVolumeL: z.number().positive().max(100_000).optional(),
  wallet: walletField.optional(),
});
export type ProducerBody = z.infer<typeof producerSchema>;

export const reviewSchema = z.object({
  decision: z.enum(["accept", "reject"]),
  note: z.string().trim().max(500).optional(),
});

export const registryIssueSchema = z.object({
  /** Share of the computed tonnes that the simulated registry issues, from 0 to 1. */
  issuedFraction: z.number().min(0).max(1).optional(),
});
