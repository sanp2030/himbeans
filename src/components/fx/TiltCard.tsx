"use client";

/** TiltCard — restrained pointer-tracking tilt (max 6°) with a gold light sheen
 *  that follows the cursor. Luxury, not gaming: small angles, slow un-tilt,
 *  rAF-throttled, disabled entirely on touch devices and under reduced motion. */

import { useRef, useCallback } from "react";

export function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef<number>(0);

  const onMove = useCallback((e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;   // 0..1
    const py = (e.clientY - r.top) / r.height;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      el.classList.add("tilting");
      el.style.transform =
        `perspective(900px) rotateY(${(px - 0.5) * 6}deg) rotateX(${(0.5 - py) * 5}deg) translateY(-4px)`;
      el.style.setProperty("--mx", `${px * 100}%`);
      el.style.setProperty("--my", `${py * 100}%`);
    });
  }, []);

  const onLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(frame.current);
    el.classList.remove("tilting");
    el.style.transform = "";
  }, []);

  return (
    <div ref={ref} className={`fx-tilt ${className}`} onPointerMove={onMove} onPointerLeave={onLeave}>
      <span aria-hidden className="tilt-sheen" />
      {children}
    </div>
  );
}
