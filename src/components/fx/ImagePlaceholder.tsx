/** Photography slot — holds exact layout space (locked aspect-ratio, zero CLS).
 * Pass `src` once real photography exists for a shot; omitting it keeps the
 * brand-toned placeholder with its shot-spec caption, unchanged from before.
 * See docs/PHOTOGRAPHY_SHOTLIST.md for the full shot list and status. */

import Image from "next/image";

const TONES: Record<string, string> = {
  espresso: "linear-gradient(135deg,#3a2418,#1f130c 60%,#2b1b14)",
  cream: "linear-gradient(135deg,#efe6d6,#e2d4bd)",
  forest: "linear-gradient(135deg,#22513e,#173727)",
  golden: "linear-gradient(120deg,#4a3116,#2b1b14 55%,#5a4020)",
};

export function ImagePlaceholder({
  shot, alt, ratio = "4/3", tone = "espresso", className = "", src, priority = false,
}: {
  shot: string;
  alt: string;
  ratio?: string;
  tone?: keyof typeof TONES;
  className?: string;
  src?: string;      // e.g. "/images/hero-01.jpg" — once set, renders real photography
  priority?: boolean; // pass true only for the hero's above-the-fold image
}) {
  return (
    <figure
      role="img"
      aria-label={alt}
      title={src ? undefined : `Photography slot ${shot} — see docs/PHOTOGRAPHY_SHOTLIST.md`}
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{ aspectRatio: ratio, background: src ? undefined : TONES[tone] }}
    >
      {src ? (
        <Image src={src} alt={alt} fill priority={priority}
          className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
      ) : (
        <>
          <span className="absolute inset-x-0 top-0 h-1/2 bg-[radial-gradient(ellipse_at_top_right,rgba(200,169,81,.22),transparent_60%)]" aria-hidden />
          <figcaption className="absolute bottom-3 left-4 font-button text-[10px] uppercase tracking-[0.22em] text-[#F3EDE2]/50">
            Photography · {shot}
          </figcaption>
        </>
      )}
    </figure>
  );
}
