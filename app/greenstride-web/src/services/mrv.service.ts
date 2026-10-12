import { MRVBatch, BatchStep, SensorTelemetry, BatchLifecycleState } from "./types";

// Initial seed batch state matching the Stitch designs (#1, #2, #3)
let batchesStore: MRVBatch[] = [
  {
    id: "batch_atmos_003",
    batchNumber: 3,
    producerId: "prod_ramesh_patel_gujarat_001",
    producerName: "Ramesh Patel",
    projectType: "BIOCHAR",
    feedstockType: "Cotton Stalk & Groundnut Shells",
    biomassKg: 10000,
    verifiedTonnesCO2e: 18.0,
    state: "CAPTURING",
    createdAt: "2026-10-10T08:30:00Z",
    updatedAt: new Date().toISOString(),
    totalEscrowAmountINR: 200000,
    producerShareINR: 22000,
    payoutStatus: "PENDING_ESCROW",
    steps: [
      {
        stepNumber: 1,
        name: "Feedstock",
        nameHindi: "बायोमास वजन",
        description: "Weighing and moisture check of agricultural crop residue",
        requiredPhotos: 2,
        status: "COMPLETED",
        completedAt: "2026-10-10T10:15:00Z",
      },
      {
        stepNumber: 2,
        name: "Pyrolysis Temp",
        nameHindi: "भट्टी का तापमान",
        description: "Verify kiln pyrolysis core reaches > 800°C for high-carbon permanence",
        requiredPhotos: 1,
        status: "COMPLETED",
        completedAt: "2026-10-10T14:40:00Z",
      },
      {
        stepNumber: 3,
        name: "Quenching",
        nameHindi: "ठंडा करना",
        description: "Water quenching to freeze porosity and carbon crystallite structure",
        requiredPhotos: 1,
        status: "COMPLETED",
        completedAt: "2026-10-11T09:20:00Z",
      },
      {
        stepNumber: 4,
        name: "Bagging",
        nameHindi: "बोरी में पैकिंग",
        description: "Filled sacks with tamper-evident serial QR label tags",
        requiredPhotos: 2,
        status: "ACTIVE",
      },
      {
        stepNumber: 5,
        name: "Lab report",
        nameHindi: "प्रयोगशाला रिपोर्ट",
        description: "Independent lab report showing > 75% elemental organic carbon",
        requiredPhotos: 1,
        status: "PENDING",
      },
      {
        stepNumber: 6,
        name: "Soil application",
        nameHindi: "खेत में उपयोग",
        description: "GPS-tagged biochar dispersal into agricultural soil for 100+ yr permanence",
        requiredPhotos: 1,
        status: "PENDING",
      },
    ],
  },
  {
    id: "batch_atmos_002",
    batchNumber: 2,
    producerId: "prod_ramesh_patel_gujarat_001",
    producerName: "Ramesh Patel",
    projectType: "BIOCHAR",
    feedstockType: "Paddy Stubble & Mustard Straw",
    biomassKg: 10000,
    verifiedTonnesCO2e: 18.0,
    state: "SETTLED",
    createdAt: "2026-09-15T08:00:00Z",
    updatedAt: "2026-09-28T16:00:00Z",
    solanaMintAddress: "AtmoSCarb982...cNFT771",
    solanaTxSignature: "4Nkp87vX2gP9eXFQwLa771vM2kZ18bQs8XfVjC3982KLmN5v",
    zkProofHash: "0x89f81a7b8e192c019284fae71bc9",
    totalEscrowAmountINR: 200000,
    producerShareINR: 22000,
    payoutStatus: "PAID_UPI",
    upiReference: "UPI ••••4821",
    steps: [
      { stepNumber: 1, name: "Feedstock", nameHindi: "बायोमास वजन", description: "Crop residue", requiredPhotos: 2, status: "VERIFIED" },
      { stepNumber: 2, name: "Pyrolysis Temp", nameHindi: "भट्टी तापमान", description: "Core > 800°C", requiredPhotos: 1, status: "VERIFIED" },
      { stepNumber: 3, name: "Quenching", nameHindi: "ठंडा करना", description: "Water quenching", requiredPhotos: 1, status: "VERIFIED" },
      { stepNumber: 4, name: "Bagging", nameHindi: "बोरी पैकिंग", description: "Serial tags", requiredPhotos: 2, status: "VERIFIED" },
      { stepNumber: 5, name: "Lab report", nameHindi: "लैब रिपोर्ट", description: "Organic C 82%", requiredPhotos: 1, status: "VERIFIED" },
      { stepNumber: 6, name: "Soil application", nameHindi: "खेत उपयोग", description: "Applied to plot 4B", requiredPhotos: 1, status: "VERIFIED" },
    ],
  },
];

export const MRVService = {
  getAllBatches(): MRVBatch[] {
    return batchesStore;
  },

  getBatchById(id: string): MRVBatch | undefined {
    return batchesStore.find((b) => b.id === id);
  },

  getLatestActiveBatch(): MRVBatch {
    return batchesStore[0];
  },

  captureStepEvidence(
    batchId: string,
    stepNumber: number,
    telemetry: SensorTelemetry,
    photoDataUri?: string
  ): MRVBatch {
    const batch = batchesStore.find((b) => b.id === batchId);
    if (!batch) throw new Error("Batch not found");

    const stepIndex = batch.steps.findIndex((s) => s.stepNumber === stepNumber);
    if (stepIndex === -1) throw new Error("Step not found");

    batch.steps[stepIndex] = {
      ...batch.steps[stepIndex],
      status: "COMPLETED",
      completedAt: new Date().toISOString(),
      evidencePhotoUrl: photoDataUri || "/stitch/screen2_performance.png",
      telemetry,
    };

    // If next step exists, mark it as ACTIVE
    if (stepIndex + 1 < batch.steps.length) {
      batch.steps[stepIndex + 1].status = "ACTIVE";
    }

    // Check if all steps completed
    const allDone = batch.steps.every((s) => s.status === "COMPLETED" || s.status === "VERIFIED");
    if (allDone) {
      batch.state = "EVIDENCE_COMPLETE";
    }

    batch.updatedAt = new Date().toISOString();
    return batch;
  },

  transitionState(batchId: string, newState: BatchLifecycleState): MRVBatch {
    const batch = batchesStore.find((b) => b.id === batchId);
    if (!batch) throw new Error("Batch not found");
    batch.state = newState;
    batch.updatedAt = new Date().toISOString();
    return batch;
  },
};
