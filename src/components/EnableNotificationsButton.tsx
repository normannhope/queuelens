"use client";
import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64Safe);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

// The one-time "turn on alerts for this device" action. Two separate
// permissions are actually being asked for behind this one button:
// installing the service worker (needed at all for push) and the browser's
// notification permission prompt. On iPhone/iPad, Safari only allows this
// AFTER the site has been added to the home screen (Share → Add to Home
// Screen) — there's no way to detect that state reliably, so we just say
// so up front rather than fail silently.
export function EnableNotificationsButton() {
  const [status, setStatus] = useState<"idle" | "working" | "on" | "unsupported" | "denied" | "error">("idle");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    navigator.serviceWorker.getRegistration().then(async (reg) => {
      const sub = await reg?.pushManager.getSubscription();
      if (sub) setStatus("on");
    });
  }, []);

  async function enable() {
    setStatus("working");
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setStatus("denied");
        return;
      }
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) throw new Error("Push isn't configured yet (missing VAPID key).");
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      setStatus("on");
    } catch (e) {
      console.error(e);
      setStatus("error");
    }
  }

  if (status === "unsupported") {
    return (
      <p className="text-sm text-ink/60 dark:text-paper/60">
        This browser doesn't support push here. On iPhone/iPad: open this site, tap Share → <strong>Add to Home Screen</strong> first, then open it from the home screen icon and try again.
      </p>
    );
  }
  if (status === "on") {
    return <p className="text-sm text-status-empty">Notifications are on for this device ✓</p>;
  }
  return (
    <div>
      <button onClick={enable} disabled={status === "working"} className="btn-primary">
        {status === "working" ? "Enabling…" : "Enable notifications on this device"}
      </button>
      {status === "denied" && (
        <p className="mt-2 text-sm text-status-long">Blocked — check your browser's site permissions and try again.</p>
      )}
      {status === "error" && <p className="mt-2 text-sm text-status-long">Something went wrong — try again.</p>}
      <p className="mt-2 text-xs text-ink/50 dark:text-paper/50">
        On iPhone/iPad, add this site to your home screen first (Share → Add to Home Screen), then enable from there.
      </p>
    </div>
  );
}
