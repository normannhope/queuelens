import Anthropic from "@anthropic-ai/sdk";
import sharp from "sharp";
import type { QueueLevel } from "@prisma/client";
import { SUBJECTS, type Subject } from "@/lib/subjects";

// This is the actual "AI queue analysis" step: fetch one frame from the
// hub's public webcam snapshot URL, shrink it (this is the main lever on
// cost — see lib/plans.ts for the math), hand it to Claude with vision, and
// get back a structured read. This must run server-side on a schedule — a
// claude.ai Artifact can't fetch an arbitrary external image URL or run on
// a timer, which is the whole reason this is a real deployed app and not
// just a page on claude.ai (see the handoff notes).

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export type QueueReading = {
  level: QueueLevel;
  count: number | null;
  waitMin: number | null;
  summary: string;
};

async function fetchAndShrinkSnapshot(url: string): Promise<{ data: string; mediaType: string }> {
  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`Snapshot fetch failed: HTTP ${res.status}`);
  const raw = Buffer.from(await res.arrayBuffer());
  if (raw.byteLength > 15 * 1024 * 1024) throw new Error("Snapshot too large (>15MB)");

  // Downsize to max 800px on the long edge, re-encode as JPEG. Counting
  // people in a queue doesn't need full camera resolution, and every extra
  // pixel is extra tokens billed on every single call — this one line is
  // most of what keeps the per-analysis cost tiny at high frequency.
  const resized = await sharp(raw)
    .resize({ width: 800, height: 800, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 78 })
    .toBuffer();

  return { data: resized.toString("base64"), mediaType: "image/jpeg" };
}

// A trimmed slice of recent readings, oldest first — only ever passed for
// hubs with useTrendLearning on (Standard/Professional). Kept tiny
// (level + count + a relative timestamp) since it rides along on every
// single analysis call and directly adds to cost.
export type RecentReading = { level: QueueLevel; count: number | null; minutesAgo: number };

// What to look for and how to score it varies a lot by subject — a person
// standing in a line and a car queuing for a ferry are visually nothing
// alike, and a single generic "count people in a line" prompt either misses
// vehicle queues entirely or over-fires on normal foot traffic. Each subject
// gets its own definition of what counts, its own count-to-level scale
// (vehicle queues run "longer" before feeling long), and its own wait-time
// assumption.
function subjectGuidance(subject: Subject, instructions?: string | null): string {
  if (subject === "VEHICLES") {
    return [
      "You are counting VEHICLES (cars, vans, trucks, campers) queuing or waiting in line — for example at a ferry terminal, toll booth, border crossing, drive-thru, or car wash lane.",
      "Count vehicles that are stopped or moving slowly in a queuing lane. Do not count vehicles that are parked, driving past freely with no queue, or in a lane clearly not meant for waiting.",
      "Headcount-to-level scale (vehicles), your default unless the business context below overrides it: 0 vehicles queuing = EMPTY. 1-5 = SHORT. 6-15 = MEDIUM. 16+ or a queue stretching out of the lot/onto the road = LONG.",
      "Estimate wait time assuming roughly 1-2 minutes to board/process per vehicle unless the scene or context suggests otherwise.",
    ].join(" ") + (instructions ? ` Business-provided context: ${instructions}` : "");
  }
  if (subject === "CUSTOM") {
    return [
      "The business has described exactly what to look for and count below — treat that description as the primary source of truth for what counts as EMPTY/SHORT/MEDIUM/LONG.",
      instructions ? `Business-provided instructions: ${instructions}` : "No specific instructions were given — use your best judgment on what a queue/crowd would mean for this scene.",
      "If the instructions don't cover a specific level, judge it by how full/busy the scene looks relative to what's described.",
    ].join(" ");
  }
  // PEOPLE (default)
  return [
    "You are counting PEOPLE waiting in a line, queue, or crowded cluster — for example at a counter, entrance, or waiting room.",
    "Do not count: staff, people just walking past, people browsing shelves or seated at tables, or anyone not clearly waiting in a line or holding area.",
    "Headcount-to-level scale (people), your default unless the business context below overrides it: 0 people waiting = EMPTY. 1-3 = SHORT. 4-8 = MEDIUM. 9+ or a line clearly out the door = LONG.",
    "Estimate wait time assuming roughly 2 minutes served per person unless the scene or context suggests a faster/slower business.",
  ].join(" ") + (instructions ? ` Business-provided context: ${instructions}` : "");
}

export async function analyzeQueue(
  webcamUrl: string,
  instructions?: string | null,
  model: string = "claude-haiku-4-5",
  recentHistory?: RecentReading[],
  subject: Subject = "PEOPLE",
): Promise<QueueReading> {
  const { data, mediaType } = await fetchAndShrinkSnapshot(webcamUrl);
  const unit = SUBJECTS[subject].unit || "whatever the instructions describe";

  const trendBlock =
    recentHistory && recentHistory.length > 0
      ? [
          "Recent readings for this same location, oldest first (use these only to judge the trend — rising, falling, or steady — and to sanity-check your count; the image in front of you is always the source of truth for the current level):",
          ...recentHistory.map((r) => `- ${r.minutesAgo} min ago: ${r.level}${r.count != null ? `, ~${r.count} ${unit}` : ""}`),
        ].join("\n")
      : null;

  const prompt = [
    "You are analyzing a single still frame from a public webcam to estimate a queue status for a real customer deciding whether to go right now.",
    subjectGuidance(subject, instructions),
    "Be conservative and calibrated, not trigger-happy — only report a busy level when the image clearly shows what's described above. A single ambiguous shape, a shadow, or a shot too dark/blurry to be sure is NOT evidence of a queue. But equally, don't undercount what's plainly visible just to be safe — if the scene clearly shows a real queue, report it.",
    "Pick the level as one of exactly: \"EMPTY\", \"SHORT\", \"MEDIUM\", \"LONG\".",
    "If the image is unclear, dark, empty of any queue-relevant content, or you genuinely cannot tell, use \"UNKNOWN\" and null counts — never guess with false confidence just to fill in a number.",
    trendBlock,
    `Reply with ONLY a JSON object: {"level": string, "count": number|null (count of ${unit}), "waitMin": number|null, "summary": string (max 100 chars, plain language for a customer deciding whether to go now, referring to what's queuing as "${unit}" if relevant)}`,
  ]
    .filter(Boolean)
    .join("\n");

  const msg = await anthropic.messages.create({
    model,
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType as any, data } },
          { type: "text", text: prompt },
        ],
      },
    ],
  });

  const text = msg.content.find((b) => b.type === "text")?.text ?? "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Claude did not return parseable JSON: " + text.slice(0, 200));
  const parsed = JSON.parse(jsonMatch[0]);

  const level: QueueLevel = ["EMPTY", "SHORT", "MEDIUM", "LONG", "UNKNOWN"].includes(parsed.level)
    ? parsed.level
    : "UNKNOWN";

  return {
    level,
    count: typeof parsed.count === "number" ? parsed.count : null,
    waitMin: typeof parsed.waitMin === "number" ? parsed.waitMin : null,
    summary: typeof parsed.summary === "string" ? parsed.summary.slice(0, 200) : "No summary returned.",
  };
}
