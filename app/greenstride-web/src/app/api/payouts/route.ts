import { NextResponse } from "next/server";
import { PayoutService } from "@/services/payout.service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, totalAmountINR, batchId, upiId, biomassKg } = body;

    if (action === "split") {
      const split = PayoutService.calculatePaymentSplit(totalAmountINR || 200000);
      return NextResponse.json({ totalAmountINR: totalAmountINR || 200000, split });
    }

    if (action === "settle-upi") {
      const receipt = await PayoutService.settleUpiPayout(
        batchId || "batch_atmos_002",
        upiId || "rameshp@okhdfcbank",
        body.amountINR || 22000,
        biomassKg || 2000
      );
      return NextResponse.json({ success: true, receipt });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
