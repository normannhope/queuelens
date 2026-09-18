import type { Hub } from "@prisma/client";

// Whether a hub's "active hours" window currently includes right now, in the
// hub's own local time (utcOffsetMinutes converts UTC -> local). Hubs with
// scheduling off are always active. Handles overnight windows (e.g. 20 -> 6)
// by wrapping past midnight; a normal daytime window (e.g. 8 -> 22) just
// checks start <= hour < end.
export function isHubActiveNow(hub: Pick<Hub, "activeHoursEnabled" | "activeStartHour" | "activeEndHour" | "utcOffsetMinutes">, at: Date = new Date()): boolean {
  if (!hub.activeHoursEnabled) return true;

  const utcMinutes = at.getUTCHours() * 60 + at.getUTCMinutes();
  const localMinutes = ((utcMinutes + hub.utcOffsetMinutes) % 1440 + 1440) % 1440;
  const localHour = Math.floor(localMinutes / 60);

  const start = hub.activeStartHour;
  const end = hub.activeEndHour;

  if (start === end) return false; // zero-width window = never
  if (start < end) return localHour >= start && localHour < end;
  return localHour >= start || localHour < end; // wraps past midnight
}

// Common UTC offsets to fill a plain dropdown — a full IANA timezone list is
// overkill for "roughly when is this business open."
export const UTC_OFFSETS: { label: string; minutes: number }[] = [
  { label: "UTC−12", minutes: -720 },
  { label: "UTC−11", minutes: -660 },
  { label: "UTC−10", minutes: -600 },
  { label: "UTC−9", minutes: -540 },
  { label: "UTC−8 (US Pacific)", minutes: -480 },
  { label: "UTC−7 (US Mountain)", minutes: -420 },
  { label: "UTC−6 (US Central)", minutes: -360 },
  { label: "UTC−5 (US Eastern)", minutes: -300 },
  { label: "UTC−4", minutes: -240 },
  { label: "UTC−3", minutes: -180 },
  { label: "UTC−2", minutes: -120 },
  { label: "UTC−1", minutes: -60 },
  { label: "UTC+0 (London)", minutes: 0 },
  { label: "UTC+1 (Norway/CET)", minutes: 60 },
  { label: "UTC+2 (CEST/EET)", minutes: 120 },
  { label: "UTC+3", minutes: 180 },
  { label: "UTC+4", minutes: 240 },
  { label: "UTC+5", minutes: 300 },
  { label: "UTC+5:30 (India)", minutes: 330 },
  { label: "UTC+6", minutes: 360 },
  { label: "UTC+7", minutes: 420 },
  { label: "UTC+8", minutes: 480 },
  { label: "UTC+9", minutes: 540 },
  { label: "UTC+10", minutes: 600 },
  { label: "UTC+11", minutes: 660 },
  { label: "UTC+12", minutes: 720 },
  { label: "UTC+13", minutes: 780 },
  { label: "UTC+14", minutes: 840 },
];
