"use client";
import { useEffect, useState } from "react";

export type Account = { id: string; email: string; name?: string; plan?: string; apiKey?: string } | null;

// Client-side session check. Every /developer/* and /account/* page (besides
// login/signup) uses this, and redirects to sign-in when `account` resolves
// to null. Deliberately simple (no context provider) — this is a small app.
export function useAccount(kind: "business" | "customer") {
  const [account, setAccount] = useState<Account>(undefined as unknown as Account);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/auth/me?kind=${kind}`)
      .then((r) => r.json())
      .then((d) => setAccount(d.account))
      .finally(() => setLoading(false));
  }, [kind]);

  return { account, loading };
}
