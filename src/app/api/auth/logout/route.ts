import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { kind } = await req.json();
  clearSessionCookie(kind === "business" ? "business" : "customer");
  return NextResponse.json({ ok: true });
}
