import { z } from 'zod';

// ─── Auth ─────────────────────────────────────────────
export const SendOTPSchema = z.object({
  phoneNumber: z.string().min(7).max(15),
  countryCode: z.string().min(1).max(4).default('91'),
});

export const VerifyOTPSchema = z.object({
  phoneNumber: z.string().min(7).max(15),
  countryCode: z.string().min(1).max(4),
  otp: z.string().length(6),
  deviceFingerprint: z.string().min(10),
});

// ─── Projects ────────────────────────────────────────
export const EntityTypeSchema = z.enum([
  'biochar','agroforestry','soil_carbon','crop_residue',
  'solar_energy','ev_fleet','building','shipping',
  'aviation','city','individual',
]);

export const LocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const BoundarySchema = z.array(LocationSchema).min(3);

// Entity-specific metadata schemas
export const BiocharMetaSchema = z.object({
  farmerName: z.string().min(2),
  village: z.string().min(2),
  cropType: z.string(),
  residueType: z.string(),
  areaHa: z.number().positive(),
  biomassAvailableTonnes: z.number().positive(),
  biocharYieldTonnes: z.number().positive(),
  processingMethod: z.string(),
  aadhaarLast4: z.string().length(4).optional(),
  mobileNumber: z.string().optional(),
});

export const AgroforestryMetaSchema = z.object({
  farmerName: z.string().min(2),
  areaHa: z.number().positive(),
  treeSpecies: z.array(z.string()).min(1),
  treesPlanted: z.number().positive(),
  plantingDate: z.string(),
  soilType: z.string().optional(),
  irrigationMethod: z.string().optional(),
});

export const SoilCarbonMetaSchema = z.object({
  farmerName: z.string().min(2),
  areaHa: z.number().positive(),
  baselineSoilCarbon: z.number().positive(),
  currentSoilCarbon: z.number().positive(),
  practiceAdopted: z.string(),
  yearsInPractice: z.number().positive(),
});

export const EVFleetMetaSchema = z.object({
  companyName: z.string(),
  fleetSize: z.number().int().positive(),
  vehicleType: z.string(),
  monthlyKmElectric: z.number().positive(),
  baselineFuelType: z.enum(['petrol','diesel','cng']),
  startDate: z.string(),
});

export const BuildingMetaSchema = z.object({
  buildingName: z.string(),
  buildingType: z.string(),
  floorAreaSqFt: z.number().positive(),
  baselineEnergyKwh: z.number().positive(),
  currentEnergyKwh: z.number().positive(),
  measureImplemented: z.string(),
});

export const MetadataSchema = z.union([
  BiocharMetaSchema,
  AgroforestryMetaSchema,
  SoilCarbonMetaSchema,
  EVFleetMetaSchema,
  BuildingMetaSchema,
  z.record(z.string(), z.unknown()), // fallback for other entity types
]);

export const CreateProjectSchema = z.object({
  entityType: EntityTypeSchema,
  name: z.string().min(3).max(255),
  location: LocationSchema,
  boundary: BoundarySchema.optional(),
  areaHa: z.number().positive().optional(),
  metadata: MetadataSchema,
});

// ─── Marketplace ─────────────────────────────────────
export const CreateListingSchema = z.object({
  creditId: z.string().uuid(),
  quantity: z.number().positive(),
  unitPriceInr: z.number().positive(),
});

// ─── Payments ────────────────────────────────────────
export const CreatePaymentSchema = z.object({
  listingId: z.string().uuid(),
  quantity: z.number().positive(),
});

// ─── Retirement ──────────────────────────────────────
export const RetireCreditsSchema = z.object({
  creditId: z.string().uuid(),
  quantity: z.number().positive(),
  organisationName: z.string().optional(),
  esgReference: z.string().optional(),
  makePublic: z.boolean().default(false),
});

// Type exports
export type SendOTPInput      = z.infer<typeof SendOTPSchema>;
export type VerifyOTPInput    = z.infer<typeof VerifyOTPSchema>;
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type CreateListingInput = z.infer<typeof CreateListingSchema>;
export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>;
export type RetireCreditsInput = z.infer<typeof RetireCreditsSchema>;
