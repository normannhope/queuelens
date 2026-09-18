"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function AuthForm({
  kind,
  mode,
  redirectTo,
}: {
  kind: "business" | "customer";
  mode: "login" | "signup";
  redirectTo: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, email, password, ...(mode === "signup" && kind === "business" ? { name } : {}) }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      return;
    }
    router.push(redirectTo);
  }

  return (
    <form onSubmit={submit} className="card max-w-sm space-y-4">
      {mode === "signup" && kind === "business" && (
        <div>
          <label className="label">Business name</label>
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
      )}
      <div>
        <label className="label">Email</label>
        <input type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div>
        <label className="label">Password</label>
        <input
          type="password"
          className="field"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
      </div>
      {error && <p className="text-sm text-status-long">{error}</p>}
      <button type="submit" disabled={busy} className="btn-primary w-full">
        {busy ? "One sec…" : mode === "login" ? "Sign in" : "Create account"}
      </button>
    </form>
  );
}
