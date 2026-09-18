"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { DevHeader } from "@/components/DevHeader";
import { QueueBadge } from "@/components/QueueBadge";
import { EnableNotificationsButton } from "@/components/EnableNotificationsButton";
import { useAccount } from "@/lib/useAccount";

type Pin = {
  id: string;
  notifyEnabled: boolean;
  notifyBelowLevel: string;
  hub: { id: string; name: string; slug: string; latestLevel: string | null; latestWaitMin: number | null };
};

const LEVELS = ["EMPTY", "SHORT", "MEDIUM", "LONG"];

export default function AccountPage() {
  const { account, loading } = useAccount("customer");
  const [pins, setPins] = useState<Pin[] | null>(null);

  async function load() {
    const res = await fetch("/api/pins");
    if (res.ok) setPins((await res.json()).pins);
  }
  useEffect(() => {
    if (account) load();
  }, [account]);

  if (loading) return null;
  if (!account) {
    if (typeof window !== "undefined") window.location.href = "/account/login";
    return null;
  }

  async function updatePin(id: string, patch: Partial<Pin>) {
    await fetch(`/api/pins/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    load();
  }
  async function unpin(id: string) {
    await fetch(`/api/pins/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <main>
      <DevHeader account={account} kind="customer" links={[{ href: "/directory", label: "Directory" }]} />
      <section className="container-page pb-20">
        <h1 className="font-display text-3xl font-semibold">Your pinned places</h1>
        <p className="mt-2 text-ink/70 dark:text-paper/70">
          Pin the places you check often, and get a notification the moment a line drops to your threshold —
          straight to this device, no email needed.
        </p>

        <div className="card mt-6">
          <h2 className="font-display text-lg font-medium">Step 1: turn on notifications for this device</h2>
          <p className="mt-1 text-sm text-ink/60 dark:text-paper/60">
            One-time setup, per device. Do this on your phone if that's where you want alerts.
          </p>
          <div className="mt-3">
            <EnableNotificationsButton />
          </div>
        </div>

        {pins && pins.length === 0 && (
          <p className="mt-8 text-ink/60 dark:text-paper/60">
            Nothing pinned yet. <Link href="/directory" className="text-cyan underline">Browse the directory</Link> and pin a few places.
          </p>
        )}

        <div className="mt-8 space-y-3">
          {pins?.map((pin) => (
            <div key={pin.id} className="card flex flex-wrap items-center justify-between gap-4">
              <div>
                <Link href={`/hub/${pin.hub.slug}`} className="font-display text-lg font-medium hover:underline">
                  {pin.hub.name}
                </Link>
                <div className="mt-1">
                  <QueueBadge level={pin.hub.latestLevel} waitMin={pin.hub.latestWaitMin} />
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <label className="flex items-center gap-2">
                  Alert when
                  <select
                    className="field !w-auto !py-1.5"
                    value={pin.notifyBelowLevel}
                    onChange={(e) => updatePin(pin.id, { notifyBelowLevel: e.target.value } as any)}
                  >
                    {LEVELS.map((l) => (
                      <option key={l} value={l}>
                        at or below {l.toLowerCase()}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={pin.notifyEnabled} onChange={(e) => updatePin(pin.id, { notifyEnabled: e.target.checked } as any)} />
                  Enabled
                </label>
                <button onClick={() => unpin(pin.id)} className="text-status-long underline">
                  Unpin
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
