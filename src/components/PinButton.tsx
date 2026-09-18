"use client";
import { useState } from "react";

export function PinButton({ hubId }: { hubId: string }) {
  const [state, setState] = useState<"idle" | "saving" | "pinned" | "signin">("idle");

  async function pin() {
    setState("saving");
    const res = await fetch("/api/pins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hubId }),
    });
    if (res.status === 401) {
      setState("signin");
      return;
    }
    setState(res.ok ? "pinned" : "idle");
  }

  if (state === "signin") {
    return (
      <a href={`/account/login?next=/directory`} className="text-sm text-cyan underline">
        Sign in to pin
      </a>
    );
  }
  if (state === "pinned") {
    return <span className="text-sm text-status-empty">Pinned ✓</span>;
  }
  return (
    <button onClick={pin} disabled={state === "saving"} className="btn-ghost !px-3 !py-1.5 text-sm">
      {state === "saving" ? "Pinning…" : "Pin"}
    </button>
  );
}
