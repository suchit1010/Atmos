import { NextResponse } from "next/server";
import { AuthService } from "@/services/auth.service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "send-otp") {
      const res = await AuthService.sendOtp(body.phoneNumber);
      return NextResponse.json(res);
    }

    if (action === "verify-otp") {
      const res = await AuthService.verifyOtp(body.phoneNumber, body.code);
      return NextResponse.json(res);
    }

    if (action === "update-payout") {
      const res = await AuthService.updatePayoutMethod(body.upiId, body.solanaWallet);
      return NextResponse.json({ success: true, session: res });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Auth error" }, { status: 400 });
  }
}

export async function GET() {
  const session = AuthService.getSession();
  return NextResponse.json({ session });
}
