import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, createSessionCookie } from "@/lib/auth";

const schema = z.object({
  kind: z.enum(["business", "customer"]),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1).optional(), // business only
});

export async function POST(req: NextRequest) {
  const body = schema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { kind, email, password, name } = body.data;
  const passwordHash = await hashPassword(password);

  try {
    if (kind === "business") {
      const business = await db.business.create({
        data: { email, passwordHash, name: name || email.split("@")[0] },
      });
      await createSessionCookie({ sub: business.id, kind: "business" });
      return NextResponse.json({ id: business.id });
    } else {
      const customer = await db.customer.create({ data: { email, passwordHash } });
      await createSessionCookie({ sub: customer.id, kind: "customer" });
      return NextResponse.json({ id: customer.id });
    }
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "That email is already registered." }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}
