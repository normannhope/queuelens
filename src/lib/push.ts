import webpush from "web-push";
import { db } from "@/lib/db";

// Free, standards-based Web Push — no third-party email/SMS service, no
// per-message cost. VAPID keys are generated once, for free, with
// `npx web-push generate-vapid-keys` (see .env.example) and identify your
// server to the browser vendor's own push service (Google's for Chrome,
// Mozilla's for Firefox, Apple's for Safari/iOS — Claude never talks to a
// paid intermediary). This is also why "add to home screen" matters on
// iOS: Safari only allows push notifications for a site that's been
// installed as a home-screen app, not for an ordinary open tab.
let configured = false;
function ensureConfigured() {
  if (configured) return;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) {
    console.warn("VAPID keys not set — push notifications are disabled until they are.");
    return;
  }
  webpush.setVapidDetails(`mailto:${process.env.VAPID_CONTACT_EMAIL || "hello@quelens.com"}`, pub, priv);
  configured = true;
}

export async function sendQueueAlertPush(customerId: string, title: string, body: string, url: string) {
  ensureConfigured();
  if (!configured) return;

  const subs = await db.pushSubscription.findMany({ where: { customerId } });
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title, body, url }),
      );
    } catch (err: any) {
      // 410/404 means the browser revoked this subscription (uninstalled,
      // permissions reset, etc) — clean it up rather than retrying forever.
      if (err?.statusCode === 410 || err?.statusCode === 404) {
        await db.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      } else {
        console.error("Push send failed:", err?.statusCode, err?.body);
      }
    }
  }
}
