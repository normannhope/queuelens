import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { readSession } from "@/lib/auth";

// The one "subscribe" path that isn't a Stripe Payment Link redirect — the
// Free plan costs nothing, so there's nothing for Stripe to collect. Free
// hubs are always public and carry the Queue Lens badge (enforced in
// api/hubs/route.ts and api/hubs/[id]/route.ts, not just this route) — that's
// the trade for free analysis, not an oversight.
export async function POST() {
  const session = await readSession("business");
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const business = await db.business.update({
    where: { id: session.sub },
    data: { plan: "FREE", planRenewsAt: null },
  });
  // Free hubs are always public — api/hubs/route.ts already enforces this
  // for hubs created *after* switching to Free, but a hub created earlier
  // (under NONE or a paid plan) keeps whatever isPublic it already had
  // unless we flip it here too. Without this, switching to Free silently
  // does nothing for existing hubs.
  await db.hub.updateMany({ where: { businessId: session.sub }, data: { isPublic: true } });
  return NextResponse.json({ ok: true, plan: business.plan });
}
