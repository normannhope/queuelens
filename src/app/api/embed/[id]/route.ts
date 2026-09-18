import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Public read API a business embeds into their own site/app. `id` is the
// hub's slug (readable identity, not the internal cuid) so URLs look clean:
// GET /api/embed/oslo-central-bakery-x9k2
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const hub = await db.hub.findUnique({ where: { slug: params.id } });
  if (!hub || !hub.isPublic) {
    return NextResponse.json({ error: "Not found or not public" }, { status: 404 });
  }
  return NextResponse.json(
    {
      name: hub.name,
      level: hub.latestLevel ?? "UNKNOWN",
      count: hub.latestCount,
      waitMin: hub.latestWaitMin,
      summary: hub.latestSummary,
      updatedAt: hub.lastAnalyzedAt,
    },
    { headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "s-maxage=60" } },
  );
}
