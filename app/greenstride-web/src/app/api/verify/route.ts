import { NextResponse } from "next/server";
import { OracleService } from "@/services/oracle.service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, batchId, biomassKg, yieldTonnes } = body;

    if (action === "consensus") {
      const result = await OracleService.runConsensusVerification(batchId || "batch_atmos_003");
      return NextResponse.json(result);
    }

    if (action === "zk-proof") {
      const result = await OracleService.generateZkProof(
        batchId || "batch_atmos_003",
        biomassKg || 10000,
        yieldTonnes || 18.0
      );
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
