import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import type { PlanId } from "@/lib/plans";

// Stripe Payment Links carry a `client_reference_id` set to the business's
// id (the dashboard's billing page appends it — see billing/page.tsx). When
// checkout completes, Stripe calls this webhook and we flip that business's
// plan on. Configure this URL (https://quelens.com/api/stripe/webhook) in
// the Stripe Dashboard → Developers → Webhooks, listening for
// checkout.session.completed and customer.subscription.deleted.

// Constructed lazily, inside the handler — not at module load — so a
// deploy with no Stripe key yet (this app is designed to work with zero
// paying customers and zero Stripe setup) never crashes the build or the
// function. It only matters once you actually wire up Stripe (see
// HANDOFF.md step 11).
function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-02-24.acacia" });
}

// Maps each Stripe Price id (test mode, created via the Stripe MCP
// connector) to our PlanId, so the webhook knows which plan was bought.
const PRICE_TO_PLAN: Record<string, PlanId> = {
  "price_1UH6tcLAENXmMsjlRgCRKtox": "STARTER",
  "price_1UH6teLAENXmMsjl0vSkw9Qc": "STANDARD",
  "price_1UH6tfLAENXmMsjlFRLwkbNx": "PROFESSIONAL",
};

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe is not configured yet" }, { status: 503 });
  }

  const sig = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig!, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error("Stripe signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const businessId = session.client_reference_id;
    if (!businessId) {
      console.warn("Checkout completed with no client_reference_id — can't attribute plan.");
      return NextResponse.json({ received: true });
    }
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
    const priceId = lineItems.data[0]?.price?.id;
    const plan = priceId ? PRICE_TO_PLAN[priceId] : undefined;

    await db.business.update({
      where: { id: businessId },
      data: {
        plan: plan ?? "STARTER", // falls back to Starter if the price map above isn't filled in yet
        planRenewsAt: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000),
        stripeCustomerId: typeof session.customer === "string" ? session.customer : undefined,
      },
    });
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const business = await db.business.findFirst({ where: { stripeCustomerId: sub.customer as string } });
    if (business) {
      await db.business.update({ where: { id: business.id }, data: { plan: "NONE" } });
      await db.hub.updateMany({ where: { businessId: business.id }, data: { isPublic: false } });
    }
  }

  return NextResponse.json({ received: true });
}
