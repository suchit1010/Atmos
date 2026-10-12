import { NextResponse } from "next/server";
import { MRVService } from "@/services/mrv.service";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (id) {
    const batch = MRVService.getBatchById(id);
    if (!batch) return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    return NextResponse.json({ batch });
  }

  const batches = MRVService.getAllBatches();
  return NextResponse.json({ batches });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, batchId, stepNumber, telemetry, photoDataUri, newState } = body;

    if (action === "capture-step") {
      const updated = MRVService.captureStepEvidence(batchId, stepNumber, telemetry, photoDataUri);
      return NextResponse.json({ success: true, batch: updated });
    }

    if (action === "transition-state") {
      const updated = MRVService.transitionState(batchId, newState);
      return NextResponse.json({ success: true, batch: updated });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
