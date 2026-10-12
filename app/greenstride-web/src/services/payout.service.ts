import { PaymentSplitRule } from "./types";

export interface SettlementReceipt {
  receiptId: string;
  upiReference: string;
  solanaTxSignature: string;
  batchNumber: number;
  producerName: string;
  upiId: string;
  amountINR: number;
  amountUSDC: number;
  biomassSuppliedKg: number;
  totalBatchBiomassKg: number;
  carbonOffsetTonnes: number;
  settledAt: string;
  taxHsnCode: string;
}

export const PayoutService = {
  calculatePaymentSplit(totalAmountINR: number): PaymentSplitRule[] {
    return [
      {
        role: "FARMER_PRODUCER",
        percentage: 55,
        amountINR: (totalAmountINR * 55) / 100,
        recipientDescription: "Smallholder Farmers & Kiln Operators (Direct UPI/USDC)",
      },
      {
        role: "AGGREGATOR",
        percentage: 15,
        amountINR: (totalAmountINR * 15) / 100,
        recipientDescription: "Village Aggregator & Biomass Logistics Hub",
      },
      {
        role: "VERIFIER",
        percentage: 7,
        amountINR: (totalAmountINR * 7) / 100,
        recipientDescription: "Independent Verifiers (Earthood / TÜV)",
      },
      {
        role: "REGISTRY",
        percentage: 5,
        amountINR: (totalAmountINR * 5) / 100,
        recipientDescription: "On-Chain Assurance Reserve & Insurance Fund",
      },
      {
        role: "ATMOS_PROTOCOL",
        percentage: 18,
        amountINR: (totalAmountINR * 18) / 100,
        recipientDescription: "Atmos Protocol Infrastructure & Sentinel Satellite AI",
      },
    ];
  },

  async settleUpiPayout(
    batchId: string,
    upiId: string,
    amountINR: number,
    biomassKg: number = 2000
  ): Promise<SettlementReceipt> {
    const reference = `UPI ••••${Math.floor(1000 + Math.random() * 9000)}`;
    const txSig = `4Nkp${Math.random().toString(36).substring(2, 8)}9eXF`;

    const receipt: SettlementReceipt = {
      receiptId: `REC_ATMOS_${Date.now()}`,
      upiReference: reference,
      solanaTxSignature: txSig,
      batchNumber: 2,
      producerName: "Ramesh Patel",
      upiId,
      amountINR,
      amountUSDC: Math.round(amountINR / 83.2),
      biomassSuppliedKg: biomassKg,
      totalBatchBiomassKg: 10000,
      carbonOffsetTonnes: 3.6,
      settledAt: new Date().toISOString(),
      taxHsnCode: "998319 (Climate Verification)",
    };

    return receipt;
  },
};
