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

export async function analyzeQueue(
  webcamUrl: string,
  instructions?: string | null,
  model: string = "claude-haiku-4-5",
): Promise<QueueReading> {
  const { data, mediaType } = await fetchAndShrinkSnapshot(webcamUrl);

  const prompt = [
    "You are analyzing a single still frame from a public webcam to estimate a queue/line/crowd status.",
    instructions ? `Business-provided context: ${instructions}` : null,
    "Look at the image and estimate: how many people are waiting in a line or crowded cluster, ",
    "a rough wait-time estimate in minutes (assume ~2 minutes served per person unless the scene suggests otherwise), ",
    'and classify the level as one of exactly: "EMPTY", "SHORT", "MEDIUM", "LONG". ',
    "If the image is unclear, dark, empty of any queue-relevant content, or you cannot tell, use \"UNKNOWN\" and null counts — never guess with false confidence.",
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
