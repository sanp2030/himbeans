/** Decorative atmosphere: steam wisps + slow-drifting beans.
 * Server component (zero JS); pure CSS animation on transform/opacity only.
 * aria-hidden; fully disabled by prefers-reduced-motion via [data-fx]. */

export function Steam({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden data-fx className={`pointer-events-none absolute flex gap-2 ${className}`}>
      {[0, 1, 2].map((i) => (
        <span key={i}
          className="block h-14 w-1.5 rounded-full bg-[var(--ink)] opacity-0 blur-[6px]"
          style={{ animation: `fx-steam 3.4s ease-out ${i * 1.1}s infinite` }} />
      ))}
    </span>
  );
}

export function Condensation({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden data-fx className={`pointer-events-none absolute inset-x-3 bottom-2 flex justify-around ${className}`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} className="h-1.5 w-1.5 rounded-full bg-white/70 blur-[1px]"
          style={{ animation: `fx-condense ${2.6 + i * 0.4}s ease-in-out ${i * 0.3}s infinite` }} />
      ))}
    </span>
  );
}

const BEAN = "M12 2c4 0 7 4 7 10s-3 10-7 10-7-4-7-10S8 2 12 2Zm0 3c-1.6 2.2-1.6 11.8 0 14";

export function AmbientBeans() {
  const beans = [
    { top: "18%", left: "72%", size: 26, dur: 11, delay: 0, opacity: 0.14 },
    { top: "38%", left: "86%", size: 18, dur: 14, delay: 2, opacity: 0.1 },
    { top: "64%", left: "78%", size: 22, dur: 12, delay: 4, opacity: 0.12 },
    { top: "30%", left: "8%", size: 16, dur: 15, delay: 1, opacity: 0.08 },
  ];
  return (
    <div aria-hidden data-fx className="pointer-events-none absolute inset-0 overflow-hidden">
      {beans.map((b, i) => (
        <svg key={i} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
          className="absolute text-gold"
          style={{ top: b.top, left: b.left, width: b.size, height: b.size, opacity: b.opacity,
                   animation: `fx-drift ${b.dur}s ease-in-out ${b.delay}s infinite` }}>
          <path d={BEAN} strokeLinecap="round" />
        </svg>
      ))}
    </div>
  );
}
