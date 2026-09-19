// Queue Lens mark: an aperture ring (the "lens" / AI-vision read) whose
// opening is a small receding row of bars — a queue seen in perspective,
// shrinking toward a vanishing point. Reads at favicon size as a ring with
// a notch; reads at full size as "a camera watching a line." A soft glow
// drop-shadow gives it a bit of HUD/optics presence at header size.
export function Logo({ className = "h-8 w-8", monochrome = false }: { className?: string; monochrome?: boolean }) {
  const ring = monochrome ? "currentColor" : "var(--logo-ring, #5FCFC4)";
  const bar = monochrome ? "currentColor" : "var(--logo-bar, #F2A93B)";
  return (
    <svg
      viewBox="0 0 48 48"
      className={`${className} ${monochrome ? "" : "drop-shadow-[0_0_6px_rgba(95,207,196,0.5)]"}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="24" cy="24" r="19" stroke={ring} strokeWidth="3.4" />
      <circle cx="24" cy="24" r="19" stroke={ring} strokeWidth="3.4" strokeDasharray="2 6" opacity="0.5" />
      <rect x="14" y="27" width="3.2" height="9" rx="1" fill={bar} />
      <rect x="19" y="23" width="3.2" height="13" rx="1" fill={bar} />
      <rect x="24" y="19" width="3.2" height="17" rx="1" fill={bar} />
      <rect x="29" y="15.5" width="3.2" height="20.5" rx="1" fill={bar} />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display font-semibold tracking-tight ${className}`}>
      <Logo />
      <span>
        Queue
        <span className="bg-gradient-to-r from-cyan to-amber bg-clip-text text-transparent">Lens</span>
      </span>
    </span>
  );
}
