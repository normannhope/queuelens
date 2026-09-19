"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { DevHeader } from "@/components/DevHeader";
import { QueueBadge } from "@/components/QueueBadge";
import { Reveal } from "@/components/Reveal";
import { BusinessLanding } from "@/components/BusinessLanding";
import { useAccount } from "@/lib/useAccount";
import { PLANS } from "@/lib/plans";

type Hub = {
  id: string;
  name: string;
  slug: string;
  isPublic: boolean;
  latestLevel: string | null;
  latestWaitMin: number | null;
  lastAnalyzedAt: string | null;
};

export default function DeveloperDashboard() {
  const { account, loading } = useAccount("business");
  const [hubs, setHubs] = useState<Hub[] | null>(null);

  useEffect(() => {
    if (account) fetch("/api/hubs").then((r) => r.json()).then((d) => setHubs(d.hubs || []));
  }, [account]);

  if (loading) return null;
  if (!account) return <BusinessLanding />;

  const plan = account.plan && account.plan !== "NONE" ? PLANS[account.plan as keyof typeof PLANS] : null;
  const atHubLimit = !!plan && !!hubs && hubs.length >= plan.maxHubs;

  return (
    <main>
      <DevHeader
        account={account}
        kind="business"
        links={[
          { href: "/developer", label: "Hubs" },
          { href: "/developer/settings", label: "Settings" },
        ]}
      />
      <section className="container-page pb-20">
        <Reveal>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="font-display text-3xl font-semibold">Your hubs</h1>
            {!plan ? (
              <Link href="/developer/settings" className="btn-primary">
                Pick a plan to start
              </Link>
            ) : atHubLimit ? (
              <a href="/developer/settings" className="btn-ghost text-sm">
                At your hub limit — upgrade for more
              </a>
            ) : (
              <Link href="/developer/hubs/new" className="btn-primary">
                + New hub
              </Link>
            )}
          </div>

          {plan && (
            <p className="mt-2 text-sm text-ink/60 dark:text-paper/60">
              {plan.label} plan · analysis every {plan.minIntervalMinutes} min · {hubs ? hubs.length : "…"}/{plan.maxHubs} hub
              {plan.maxHubs === 1 ? "" : "s"} used
            </p>
          )}
        </Reveal>

        {!hubs ? null : hubs.length === 0 ? (
          <Reveal delay={0.05}>
            <p className="mt-10 text-ink/60 dark:text-paper/60">
              No hubs yet. {plan ? "Create your first one." : "Pick a plan, then add your first hub."}
            </p>
          </Reveal>
        ) : (
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {hubs.map((hub, i) => (
              <Reveal key={hub.id} delay={0.04 * i}>
                <motion.div whileHover={{ y: -3, scale: 1.015 }} transition={{ duration: 0.18, ease: "easeOut" }}>
                  <Link href={`/developer/hubs/${hub.id}`} className="card block hover:border-cyan/50 hover:shadow-lg">
                    <div className="flex items-center justify-between">
                      <p className="font-display text-lg font-medium">{hub.name}</p>
                      <span className={`text-xs ${hub.isPublic ? "text-status-empty" : "text-ink/40 dark:text-paper/40"}`}>
                        {hub.isPublic ? "Public" : "Private"}
                      </span>
                    </div>
                    <div className="mt-3">
                      <QueueBadge level={hub.latestLevel} waitMin={hub.latestWaitMin} />
                    </div>
                  </Link>
                </motion.div>
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
