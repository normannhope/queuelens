"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wordmark } from "./Logo";
import type { Account } from "@/lib/useAccount";

export function DevHeader({ account, kind, links }: { account: Account; kind: "business" | "customer"; links: { href: string; label: string }[] }) {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind }) });
    router.push("/");
  }
  return (
    <header className="container-page flex flex-wrap items-center justify-between gap-4 py-6">
      <Link href="/">
        <Wordmark className="text-lg" />
      </Link>
      {account && (
        <nav className="flex items-center gap-4 text-sm">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-ink/70 hover:text-ink dark:text-paper/70 dark:hover:text-paper">
              {l.label}
            </Link>
          ))}
          <span className="text-ink/40 dark:text-paper/40">{account.email}</span>
          <button onClick={logout} className="btn-ghost !px-3 !py-1.5">
            Sign out
          </button>
        </nav>
      )}
    </header>
  );
}
