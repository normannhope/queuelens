const META: Record<string, { label: string; className: string }> = {
  EMPTY: { label: "No line", className: "bg-status-empty/15 text-status-empty" },
  SHORT: { label: "Short line", className: "bg-status-short/15 text-status-short" },
  MEDIUM: { label: "Moderate line", className: "bg-status-medium/15 text-status-medium" },
  LONG: { label: "Long line", className: "bg-status-long/15 text-status-long" },
  UNKNOWN: { label: "Status unknown", className: "bg-ink-line/40 text-ink/60 dark:text-paper/50" },
};

export function QueueBadge({ level, waitMin }: { level: string | null | undefined; waitMin?: number | null }) {
  const meta = META[level || "UNKNOWN"] ?? META.UNKNOWN;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${meta.className}`}>
      <span className="h-2 w-2 rounded-full bg-current" />
      {meta.label}
      {waitMin != null && <span className="opacity-70">· ~{waitMin} min</span>}
    </span>
  );
}
