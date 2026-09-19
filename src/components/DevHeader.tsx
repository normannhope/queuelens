"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wordmark } from "./Logo";
import { ProductTour } from "./ProductTour";
import type { Account } from "@/lib/useAccount";

// Business accounts get two extras beyond whatever page-specific links are
// passed in: a "Plans" link back to the feature/plan overview (previously
// only visible signed out — logging in was a one-way door into "Your
// hubs"), and the replayable product tour button. Both live here, once,
// so every business page picks them up automatically.
export function DevHeader({ account, kind, links }: { account: Account; kind: "business" | "customer"; links: { href: string; label: string }[] }) {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind }) });
    router.push("/");
  }
  const allLinks = kind === "business" ? [...links, { href: "/developer/about", label: "Plans" }] : links;
  return (
    <header className="container-page flex flex-wrap items-center justify-between gap-4 py-6">
      <Link href="/">
        <Wordmark className="text-lg" />
      </Link>
      {account && (
        <nav className="flex items-center gap-4 text-sm">
          {allLinks.map((l) => (
            <Link key={l.href} href={l.href} className="text-ink/70 hover:text-ink dark:text-paper/70 dark:hover:text-paper">
              {l.label}
            </Link>
          ))}
          {kind === "business" && <ProductTour plan={account.plan} />}
          <span className="text-ink/40 dark:text-paper/40">{account.email}</span>
          <button onClick={logout} className="btn-ghost !px-3 !py-1.5">
            Sign out
          </button>
        </nav>
      )}
    </header>
  );
}
