import { NextResponse } from "next/server";
import { MarketplaceService } from "@/services/marketplace.service";

export async function GET() {
  const orders = MarketplaceService.getOrders();
  return NextResponse.json({ orders });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, buyerName, tonnes, pricePerTonneINR, orderId, beneficiary } = body;

    if (action === "create-order") {
      const order = MarketplaceService.createOrder(buyerName, tonnes, pricePerTonneINR);
      return NextResponse.json({ success: true, order });
    }

    if (action === "retire") {
      const order = MarketplaceService.retireCredits(orderId, beneficiary);
      return NextResponse.json({ success: true, order });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
