/**
 * Atmos Protocol - First Principles Types & Data Architecture
 * Decentralized Measurement, Reporting, and Verification (dMRV) on Solana
 */

export type ProjectType = "BIOCHAR" | "REFORESTATION" | "SOIL_CARBON" | "CLEAN_MOBILITY";

export type StepStatus = "PENDING" | "ACTIVE" | "COMPLETED" | "VERIFIED" | "REJECTED";

export interface GeoLocation {
  latitude: number;
  longitude: number;
  altitudeMeters: number;
  accuracyMeters: number;
  timestamp: string;
}

export interface SensorTelemetry {
  gps: GeoLocation;
  headingDegrees: number;
  deviceTiltDegrees: number;
  pyrometerTemperatureC?: number;
  moisturePercentage?: number;
  deviceKeySignature: string;
  hardwareKeystoreId: string;
  blake3Hash: string;
}

export interface BatchStep {
  stepNumber: number;
  name: string;
  nameHindi: string;
  description: string;
  requiredPhotos: number;
  status: StepStatus;
  completedAt?: string;
  evidencePhotoUrl?: string;
  telemetry?: SensorTelemetry;
}

export type BatchLifecycleState =
  | "DRAFT"
  | "CAPTURING"
  | "EVIDENCE_COMPLETE"
  | "IN_VERIFICATION"
  | "APPROVED"
  | "CREDITS_ISSUED"
  | "ESCROW_PAID"
  | "SETTLED";

export interface MRVBatch {
  id: string;
  batchNumber: number;
  producerId: string;
  producerName: string;
  projectType: ProjectType;
  feedstockType: string;
  biomassKg: number;
  verifiedTonnesCO2e: number;
  state: BatchLifecycleState;
  createdAt: string;
  updatedAt: string;
  steps: BatchStep[];
  solanaMintAddress?: string;
  solanaTxSignature?: string;
  zkProofHash?: string;
  totalEscrowAmountINR: number;
  producerShareINR: number;
  payoutStatus: "UNPAID" | "PENDING_ESCROW" | "PAID_UPI" | "PAID_USDC";
  upiReference?: string;
}

export interface PaymentSplitRule {
  role: "FARMER_PRODUCER" | "AGGREGATOR" | "VERIFIER" | "REGISTRY" | "ATMOS_PROTOCOL";
  percentage: number;
  amountINR: number;
  recipientDescription: string;
}

export interface VerificationConsensus {
  batchId: string;
  aiComputerVisionScore: number; // 0 - 100
  aiModelVersion: string;
  pyrometerOcrMatch: boolean;
  satelliteSentinel2Passed: boolean;
  ndviVarianceIndex: number;
  verifier1Approved: boolean;
  verifier1Name: string;
  verifier2Approved: boolean;
  verifier2Name: string;
  zkSnarkProofVerified: boolean;
  consensusAchieved: boolean;
  finalConfidenceRating: "HIGH" | "MEDIUM" | "FLAGGED";
}

export interface CarbonOrder {
  id: string;
  buyerName: string;
  buyerLogo?: string;
  tonnesPurchased: number;
  pricePerTonneINR: number;
  totalPriceINR: number;
  pricePerTonneUSDC: number;
  solanaEscrowAccount: string;
  status: "OPEN" | "FUNDED" | "SETTLED" | "RETIRED";
  retirementBeneficiary?: string;
  retirementCertificateId?: string;
  createdAt: string;
}

export interface MicroserviceHealth {
  name: string;
  status: "ONLINE" | "DEGRADED" | "OFFLINE";
  latencyMs: number;
  endpoint: string;
  description: string;
}
