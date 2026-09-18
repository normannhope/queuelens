import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { readSession } from "@/lib/auth";
import { runAnalysisForHub } from "@/lib/runAnalysis";

// Manual "Analyze now" button in the developer dashboard. Rate-limited to
// once per 20s per hub so a business can't rack up Claude API spend by
// mashing the button.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await readSession("business");
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const hub = await db.hub.findUnique({ where: { id: params.id }, include: { business: { select: { plan: true } } } });
  if (!hub || hub.businessId !== session.sub) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (hub.lastAnalyzedAt && Date.now() - hub.lastAnalyzedAt.getTime() < 20_000) {
    return NextResponse.json({ error: "Just analyzed — wait a few seconds." }, { status: 429 });
  }

  try {
    const reading = await runAnalysisForHub(hub);
    return NextResponse.json({ reading });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message || "Analysis failed" }, { status: 502 });
  }
}
