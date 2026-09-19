"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DevHeader } from "@/components/DevHeader";
import { useAccount } from "@/lib/useAccount";
import { SUBJECTS, type Subject } from "@/lib/subjects";

export default function NewHubPage() {
  const { account, loading } = useAccount("business");
  const router = useRouter();
  const [form, setForm] = useState<{
    name: string;
    address: string;
    category: string;
    webcamUrl: string;
    instructions: string;
    subjectType: Subject;
    isPublic: boolean;
  }>({ name: "", address: "", category: "", webcamUrl: "", instructions: "", subjectType: "PEOPLE", isPublic: false });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [webcamStatus, setWebcamStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");

  if (loading) return null;
  if (!account) {
    if (typeof window !== "undefined") window.location.href = "/developer/login";
    return null;
  }

  const isFreePlan = account.plan === "FREE";

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
      <DevHeader account={account} kind="business" links={[{ href: "/developer", label: "Hubs" }, { href: "/developer/settings", label: "Settings" }]} />
      <section className="container-page pb-20">
        <h1 className="mb-2 font-display text-3xl font-semibold">Add a hub</h1>
        <p className="mb-2 max-w-lg text-ink/70 dark:text-paper/70">
          The webcam URL must point directly at an image (a JPG/PNG snapshot endpoint), not a viewer page —
          many public webcams expose one at a URL ending in something like <code>/snapshot.jpg</code>.
        </p>
        <p className="mb-6 max-w-lg text-sm text-ink/50 dark:text-paper/50">
          Not sure where to find that, or don't have a webcam yet?{" "}
          <Link href="/developer/setup-guide" className="text-cyan underline">
            Read the setup guide
          </Link>
          .
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
            <label className="label">What are you monitoring?</label>
            <div className="grid gap-2 sm:grid-cols-3">
              {(Object.entries(SUBJECTS) as [Subject, typeof SUBJECTS[Subject]][]).map(([id, s]) => (
                <button
                  type="button"
                  key={id}
                  onClick={() => setForm({ ...form, subjectType: id })}
                  className={`rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${
                    form.subjectType === id
                      ? "border-cyan bg-cyan/10"
                      : "border-ink/15 hover:bg-ink/5 dark:border-paper/15 dark:hover:bg-paper/10"
                  }`}
                >
                  <span className="block font-medium">{s.label}</span>
                  <span className="mt-0.5 block text-xs text-ink/50 dark:text-paper/50">{s.hint}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Webcam snapshot URL</label>
            <input
              type="url"
              className="field"
              required
              placeholder="https://example.com/cams/lobby/snapshot.jpg"
              value={form.webcamUrl}
              onChange={(e) => {
                setForm({ ...form, webcamUrl: e.target.value });
                setWebcamStatus(e.target.value ? "loading" : "idle");
              }}
            />
            {form.webcamUrl && (
              <div className="mt-2 overflow-hidden rounded-lg border border-ink/10 dark:border-paper/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={form.webcamUrl}
                  src={form.webcamUrl}
                  alt="Webcam preview"
                  className="block h-32 w-full object-cover bg-ink/5 dark:bg-paper/5"
                  onLoad={() => setWebcamStatus("ok")}
                  onError={() => setWebcamStatus("error")}
                />
                <p
                  className={`px-2.5 py-1.5 text-xs ${
                    webcamStatus === "error" ? "text-status-long" : "text-ink/50 dark:text-paper/50"
                  }`}
                >
                  {webcamStatus === "error"
                    ? "Couldn't load an image from this URL — make sure it points directly at a JPG/PNG, not a viewer page."
                    : webcamStatus === "ok"
                      ? "Looks good — this is roughly what Claude will see."
                      : "Loading preview…"}
                </p>
              </div>
            )}
          </div>
          <div>
            <label className="label">
              Instructions for the AI {form.subjectType === "CUSTOM" ? "" : "(optional)"}
            </label>
            <textarea
              className="field"
              rows={3}
              required={form.subjectType === "CUSTOM"}
              placeholder={
                form.subjectType === "VEHICLES"
                  ? "e.g. Only count cars in the left two lanes; ignore the drop-off area on the right."
                  : form.subjectType === "CUSTOM"
                    ? "Describe exactly what to count in this frame, and what EMPTY/SHORT/MEDIUM/LONG should mean."
                    : "e.g. Only count people past the red line; ignore staff behind the counter."
              }
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
            />
          </div>
          <div className="rounded-xl border border-ink/15 p-4 dark:border-paper/15">
            <label className={`flex items-start justify-between gap-4 text-sm ${isFreePlan ? "opacity-70" : ""}`}>
              <span>
                <span className="font-medium">Make this hub public</span>
                <span className="mt-0.5 block text-xs text-ink/50 dark:text-paper/50">
                  {isFreePlan
                    ? "Required on the Free plan — every Free hub is public and lists in the directory, in exchange for free analysis."
                    : "Public hubs join the directory and unlock the embed snippet. Leave this off to keep it private — visible only to you — until you're ready; you can flip it anytime from the hub's settings."}
                </span>
              </span>
              <input
                type="checkbox"
                checked={isFreePlan || form.isPublic}
                disabled={isFreePlan}
                onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
                className="mt-0.5 h-4 w-4 shrink-0"
              />
            </label>
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
