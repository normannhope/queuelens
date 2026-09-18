import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

// Minimal cookie-session auth for two separate account kinds (business /
// customer). Deliberately not NextAuth — fewer moving parts for a first
// deploy, easy to replace later if you want Google/BankID login etc.

const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET || "dev-secret-change-me");

export type SessionKind = "business" | "customer";
export type Session = { sub: string; kind: SessionKind };

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}
export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export async function createSessionCookie(session: Session) {
  const token = await new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
  const name = session.kind === "business" ? "qlens_biz" : "qlens_cust";
  cookies().set(name, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSessionCookie(kind: SessionKind) {
  cookies().delete(kind === "business" ? "qlens_biz" : "qlens_cust");
}

export async function readSession(kind: SessionKind): Promise<Session | null> {
  const name = kind === "business" ? "qlens_biz" : "qlens_cust";
  const token = cookies().get(name)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.kind !== kind) return null;
    return payload as unknown as Session;
  } catch {
    return null;
  }
}
