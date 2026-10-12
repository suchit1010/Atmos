import { NextResponse } from "next/server";
import { SolanaService } from "@/services/solana.service";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tx = searchParams.get("tx") || "4Nkp87vX2gP9eXFQwLa771vM2kZ18bQs8XfVjC3982KLmN5v";

  const record = await SolanaService.getTransactionRecord(tx);
  return NextResponse.json(record);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { batchId, tonnesCO2e, zkProofHash } = body;

    const record = await SolanaService.mintCarbonCreditAsset(
      batchId || "batch_atmos_003",
      tonnesCO2e || 18.0,
      zkProofHash || "0x89f81a7b8e192c019284fae71bc9"
    );

    return NextResponse.json({ success: true, record });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
