"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { DevHeader } from "@/components/DevHeader";
import { useAccount } from "@/lib/useAccount";

export default function NewHubPage() {
  const { account, loading } = useAccount("business");
  const router = useRouter();
  const [form, setForm] = useState({ name: "", address: "", category: "", webcamUrl: "", instructions: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (loading) return null;
  if (!account) {
    if (typeof window !== "undefined") window.location.href = "/developer/login";
    return null;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/hubs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setError(data.error || "Something went wrong.");
    router.push(`/developer/hubs/${data.hub.id}`);
  }

  return (
    <main>
      <DevHeader account={account} kind="business" links={[{ href: "/developer", label: "Hubs" }, { href: "/developer/billing", label: "Billing" }]} />
      <section className="container-page pb-20">
        <h1 className="mb-2 font-display text-3xl font-semibold">Add a hub</h1>
        <p className="mb-6 max-w-lg text-ink/70 dark:text-paper/70">
          The webcam URL must point directly at an image (a JPG/PNG snapshot endpoint), not a viewer page —
          many public webcams expose one at a URL ending in something like <code>/snapshot.jpg</code>.
        </p>
        <form onSubmit={submit} className="card max-w-lg space-y-4">
          <div>
            <label className="label">Name</label>
            <input className="field" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Address (optional)</label>
            <input className="field" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div>
            <label className="label">Category (optional)</label>
            <input
              className="field"
              placeholder="Bakery, clinic, barbershop…"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Webcam snapshot URL</label>
            <input
              type="url"
              className="field"
              required
              placeholder="https://example.com/cams/lobby/snapshot.jpg"
              value={form.webcamUrl}
              onChange={(e) => setForm({ ...form, webcamUrl: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Instructions for the AI (optional)</label>
            <textarea
              className="field"
              rows={3}
              placeholder="e.g. Only count people past the red line; ignore staff behind the counter."
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
            />
          </div>
          {error && <p className="text-sm text-status-long">{error}</p>}
          <button disabled={busy} className="btn-primary w-full">
            {busy ? "Creating…" : "Create hub"}
          </button>
        </form>
      </section>
    </main>
  );
}
