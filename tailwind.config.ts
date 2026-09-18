import type { Config } from "tailwindcss";

// Queue Lens design tokens.
// Concept: optics + motion. A deep teal-charcoal ground (not pure black —
// avoids the generic "near-black + one neon pop" AI-default look) with two
// working accents: amber (queue signal — "go now") and cyan (the "lens/AI"
// read). Semantic status colors are separate from both accents.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0E1716", // ground, teal-tinted charcoal (not pure black)
          soft: "#152220",
          line: "#24342F",
        },
        paper: {
          DEFAULT: "#FAF8F3", // light-mode ground: warm off-white, not stark white
          soft: "#F1EDE3",
        },
        amber: { DEFAULT: "#F2A93B", soft: "#FCE2B0" }, // "go now" / queue signal
        cyan: { DEFAULT: "#5FCFC4", soft: "#C9EDE8" },  // lens / AI read
        status: {
          empty: "#5FCFC4",
          short: "#8FBF6B",
          medium: "#F2A93B",
          long: "#E2604F",
        },
      },
      fontFamily: {
        display: ["var(--font-bricolage)", "Georgia", "serif"],
        body: ["var(--font-plex)", "system-ui", "sans-serif"],
        mono: ["var(--font-plex-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
export default config;
