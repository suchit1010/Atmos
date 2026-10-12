import { CarbonOrder } from "./types";

let ordersStore: CarbonOrder[] = [
  {
    id: "ord_stripe_climate_001",
    buyerName: "Stripe Climate & Frontier Fund",
    buyerLogo: "https://stripe.com/favicon.ico",
    tonnesPurchased: 18.0,
    pricePerTonneINR: 11111,
    totalPriceINR: 200000,
    pricePerTonneUSDC: 133.5,
    solanaEscrowAccount: "EscrowStripe1111111111111111111111111111111",
    status: "FUNDED",
    createdAt: "2026-10-11T12:00:00Z",
  },
  {
    id: "ord_microsoft_002",
    buyerName: "Microsoft Carbon Removal Portfolio",
    tonnesPurchased: 50.0,
    pricePerTonneINR: 12500,
    totalPriceINR: 625000,
    pricePerTonneUSDC: 150.0,
    solanaEscrowAccount: "EscrowMSFT11111111111111111111111111111111111",
    status: "RETIRED",
    retirementBeneficiary: "Microsoft Datacenter EMEA Scope 3 Neutrality",
    retirementCertificateId: "CERT_ATMOS_MSFT_2026_094",
    createdAt: "2026-09-20T10:00:00Z",
  },
];

export const MarketplaceService = {
  getOrders(): CarbonOrder[] {
    return ordersStore;
  },

  createOrder(buyerName: string, tonnes: number, pricePerTonneINR: number = 11111): CarbonOrder {
    const newOrder: CarbonOrder = {
      id: `ord_${Date.now()}`,
      buyerName,
      tonnesPurchased: tonnes,
      pricePerTonneINR,
      totalPriceINR: tonnes * pricePerTonneINR,
      pricePerTonneUSDC: Math.round(pricePerTonneINR / 83.2),
      solanaEscrowAccount: `Escrow${Math.random().toString(36).substring(2, 10)}111111111111111111111111111111`,
      status: "FUNDED",
      createdAt: new Date().toISOString(),
    };
    ordersStore.unshift(newOrder);
    return newOrder;
  },

  retireCredits(orderId: string, beneficiary: string): CarbonOrder {
    const order = ordersStore.find((o) => o.id === orderId);
    if (!order) throw new Error("Order not found");

    order.status = "RETIRED";
    order.retirementBeneficiary = beneficiary;
    order.retirementCertificateId = `CERT_ATMOS_RET_${Date.now().toString(16).toUpperCase()}`;
    return order;
  },
};
