import Anthropic from "@anthropic-ai/sdk";
import sharp from "sharp";
import type { QueueLevel } from "@prisma/client";

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

export async function analyzeQueue(
  webcamUrl: string,
  instructions?: string | null,
  model: string = "claude-haiku-4-5",
  recentHistory?: RecentReading[],
): Promise<QueueReading> {
  const { data, mediaType } = await fetchAndShrinkSnapshot(webcamUrl);

  const trendBlock =
    recentHistory && recentHistory.length > 0
      ? [
          "Recent readings for this same location, oldest first (use these only to judge the trend — rising, falling, or steady — and to sanity-check your count; the image in front of you is always the source of truth for the current level):",
          ...recentHistory.map((r) => `- ${r.minutesAgo} min ago: ${r.level}${r.count != null ? `, ~${r.count} people` : ""}`),
        ].join("\n")
      : null;

  const prompt = [
    "You are analyzing a single still frame from a public webcam to estimate a queue/line/crowd status for a real customer deciding whether to go right now.",
    instructions ? `Business-provided context: ${instructions}` : null,
    "Be conservative and calibrated, not trigger-happy. Most frames of most businesses most of the time show no meaningful line — default toward EMPTY or SHORT unless the image clearly shows an actual queue or crowd. Do not count: staff, people just walking past, people browsing shelves/seated at tables, or anyone not clearly waiting in a line or holding area. A single ambiguous shape, a shadow, or a shot that's too dark/blurry to be sure is NOT evidence of a line.",
    "Use this headcount-to-level scale as your default, and only deviate if the specific business context above says otherwise: 0 people waiting = EMPTY. 1-3 = SHORT. 4-8 = MEDIUM. 9+ or a line clearly out the door = LONG.",
    "Estimate a rough wait time in minutes from the headcount (assume ~2 minutes served per person unless the scene or context suggests a faster/slower business), and pick the level as one of exactly: \"EMPTY\", \"SHORT\", \"MEDIUM\", \"LONG\".",
    "If the image is unclear, dark, empty of any queue-relevant content, or you genuinely cannot tell, use \"UNKNOWN\" and null counts — never guess with false confidence just to fill in a number.",
    trendBlock,
    "Reply with ONLY a JSON object: {\"level\": string, \"count\": number|null, \"waitMin\": number|null, \"summary\": string (max 100 chars, plain language for a customer deciding whether to go now)}",
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
