"use client";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

// The one motion primitive used across the marketing/public pages: content
// rests fully visible (never parked at opacity:0 waiting on a trigger —
// screenshots and slow connections must still show something), and animates
// in gently as it enters view. Kept deliberately restrained per the design
// brief: one orchestrated feel, not scattered effects everywhere.
export function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
