"use client";
import { useEffect, useState } from "react";
import { DevHeader } from "@/components/DevHeader";
import { QueueBadge } from "@/components/QueueBadge";
import { useAccount } from "@/lib/useAccount";

type Hub = {
  id: string;
  name: string;
  slug: string;
  webcamUrl: string;
  instructions: string | null;
  isPublic: boolean;
  latestLevel: string | null;
  latestWaitMin: number | null;
  latestSummary: string | null;
  lastAnalyzedAt: string | null;
};
type Analysis = { id: string; level: string; waitMin: number | null; summary: string; createdAt: string };

export default function HubDetailPage({ params }: { params: { id: string } }) {
  const { account, loading } = useAccount("business");
  const [hub, setHub] = useState<Hub | null>(null);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [siteUrl, setSiteUrl] = useState("");

  useEffect(() => setSiteUrl(window.location.origin), []);

  async function load() {
    const res = await fetch(`/api/hubs/${params.id}`);
    if (res.ok) {
      const d = await res.json();
      setHub(d.hub);
      setAnalyses(d.analyses);
    }
  }
  useEffect(() => {
    if (account) load();
  }, [account]);

  if (loading) return null;
  if (!account) {
    if (typeof window !== "undefined") window.location.href = "/developer/login";
    return null;
  }
  if (!hub) return null;

  async function togglePublic() {
    if (!hub) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/hubs/${hub.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic: !hub.isPublic }),
    });
    setBusy(false);
    if (res.ok) load();
  }

  async function analyzeNow() {
    if (!hub) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/hubs/${hub.id}/analyze`, { method: "POST" });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setError(data.error || "Analysis failed.");
    load();
  }

  const embedUrl = `${siteUrl}/api/embed/${hub.slug}`;
  const widgetSnippet = `<script src="${siteUrl}/api/embed/${hub.slug}/widget.js" async></script>`;

  return (
    <main>
      <DevHeader account={account} kind="business" links={[{ href: "/developer", label: "Hubs" }, { href: "/developer/billing", label: "Billing" }]} />
      <section className="container-page max-w-2xl pb-20">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl font-semibold">{hub.name}</h1>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={hub.isPublic} onChange={togglePublic} disabled={busy} />
            Public (in directory + embeddable)
          </label>
        </div>

        <div className="card mt-6">
          <div className="flex items-center justify-between">
            <QueueBadge level={hub.latestLevel} waitMin={hub.latestWaitMin} />
            <button onClick={analyzeNow} disabled={busy} className="btn-ghost !px-3 !py-1.5 text-sm">
              {busy ? "Working…" : "Analyze now"}
            </button>
          </div>
          {hub.latestSummary && <p className="mt-3 text-sm text-ink/70 dark:text-paper/70">{hub.latestSummary}</p>}
          {error && <p className="mt-2 text-sm text-status-long">{error}</p>}
          <p className="mt-2 text-xs text-ink/40 dark:text-paper/40">Watching: {hub.webcamUrl}</p>
        </div>

        {hub.isPublic && (
          <div className="card mt-6">
            <h2 className="font-display text-lg font-medium">Embed on your own site</h2>
            <p className="mt-1 text-sm text-ink/60 dark:text-paper/60">Drop this where you want the live badge to show:</p>
            <pre className="mt-3 overflow-x-auto rounded-lg bg-ink px-4 py-3 font-mono text-xs text-paper dark:bg-black">
              {widgetSnippet}
            </pre>
            <p className="mt-3 text-sm text-ink/60 dark:text-paper/60">Or read it as JSON:</p>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-ink px-4 py-3 font-mono text-xs text-paper dark:bg-black">
              GET {embedUrl}
            </pre>
          </div>
        )}

        {analyses.length > 0 && (
          <div className="card mt-6">
            <h2 className="font-display text-lg font-medium">History</h2>
            <ul className="mt-3 divide-y divide-ink/10 dark:divide-paper/10">
              {analyses.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-ink/50 dark:text-paper/50">{new Date(a.createdAt).toLocaleString()}</span>
                  <QueueBadge level={a.level} waitMin={a.waitMin} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </main>
  );
}
