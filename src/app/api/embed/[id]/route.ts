import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Public read API a business embeds into their own site/app. `id` is the
// hub's slug (readable identity, not the internal cuid) so URLs look clean:
// GET /api/embed/oslo-central-bakery-x9k2
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const hub = await db.hub.findUnique({
    where: { slug: params.id },
    include: { business: { select: { plan: true } } },
  });
  if (!hub || !hub.isPublic) {
    return NextResponse.json({ error: "Not found or not public" }, { status: 404 });
  }
  return NextResponse.json(
    {
      name: hub.name,
      level: hub.latestLevel ?? "UNKNOWN",
      // Both of these are business-controlled (Settings → Analysis
      // intelligence, Standard/Professional only) — a business that doesn't
      // want an exact headcount shown publicly can turn it off without
      // hiding the queue status itself.
      count: hub.showPeopleCount ? hub.latestCount : null,
      waitMin: hub.showWaitMinutes ? hub.latestWaitMin : null,
      summary: hub.latestSummary,
      updatedAt: hub.lastAnalyzedAt,
      // The Free plan's distribution deal extends to the embed widget, not
      // just the hosted hub page — see widget.js/route.ts.
      poweredByRequired: hub.business.plan === "FREE",
    },
    { headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "s-maxage=60" } },
  );
}
