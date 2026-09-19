import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const kind = req.nextUrl.searchParams.get("kind") === "customer" ? "customer" : "business";
  const session = await readSession(kind);
  if (!session) return NextResponse.json({ account: null });

  if (kind === "business") {
    const business = await db.business.findUnique({
      where: { id: session.sub },
      select: { id: true, name: true, email: true, plan: true, apiKey: true, createdAt: true },
    });
    return NextResponse.json({ account: business });
  } else {
    const customer = await db.customer.findUnique({
      where: { id: session.sub },
      select: { id: true, email: true },
    });
    return NextResponse.json({ account: customer });
  }
}
