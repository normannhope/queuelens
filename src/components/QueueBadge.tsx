const META: Record<string, { label: string; className: string }> = {
  EMPTY: { label: "No line", className: "bg-status-empty/15 text-status-empty" },
  SHORT: { label: "Short line", className: "bg-status-short/15 text-status-short" },
  MEDIUM: { label: "Moderate line", className: "bg-status-medium/15 text-status-medium" },
  LONG: { label: "Long line", className: "bg-status-long/15 text-status-long" },
  UNKNOWN: { label: "Status unknown", className: "bg-ink-line/40 text-ink/60 dark:text-paper/50" },
};

export function QueueBadge({ level, waitMin }: { level: string | null | undefined; waitMin?: number | null }) {
  const meta = META[level || "UNKNOWN"] ?? META.UNKNOWN;
  const pulsing = level === "MEDIUM" || level === "LONG"; // draw the eye to the statuses worth acting on
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-all duration-300 ${meta.className} ${
        pulsing ? "shadow-[0_0_14px_-3px_currentColor]" : ""
      }`}
    >
      <span className="relative flex h-2 w-2">
        {pulsing && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />}
        <span className="relative inline-flex h-2 w-2 rounded-full bg-current shadow-[0_0_8px_currentColor]" />
      </span>
      {meta.label}
      {waitMin != null && <span className="opacity-70">· ~{waitMin} min</span>}
    </span>
  );
}
