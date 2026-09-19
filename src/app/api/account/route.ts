import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { readSession } from "@/lib/auth";

// Self-service account edits for the business side — currently just the
// display name. Email is deliberately not editable here: it's the sign-in
// identity, and changing it needs a verification step we haven't built.
const updateSchema = z.object({ name: z.string().min(1).max(120) });

export async function PATCH(req: NextRequest) {
  const session = await readSession("business");
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = updateSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.issues[0]?.message }, { status: 400 });

  const business = await db.business.update({
    where: { id: session.sub },
    data: { name: body.data.name },
    select: { id: true, name: true, email: true, plan: true, apiKey: true, createdAt: true },
  });
  return NextResponse.json({ account: business });
}
