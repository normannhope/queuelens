import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPassword, createSessionCookie } from "@/lib/auth";

const schema = z.object({
  kind: z.enum(["business", "customer"]),
  email: z.string().email(),
  password: z.string(),
});

export async function POST(req: NextRequest) {
  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { kind, email, password } = body.data;

  const account =
    kind === "business"
      ? await db.business.findUnique({ where: { email } })
      : await db.customer.findUnique({ where: { email } });

  if (!account || !(await verifyPassword(password, account.passwordHash))) {
    return NextResponse.json({ error: "Wrong email or password." }, { status: 401 });
  }

  await createSessionCookie({ sub: account.id, kind });
  return NextResponse.json({ id: account.id });
}
