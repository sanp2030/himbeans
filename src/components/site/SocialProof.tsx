import { Reveal } from "@/components/fx/Reveal";

/** ⚠️ LAUNCH BLOCKER — PLACEHOLDER CONTENT ⚠️
 *  Every press mention and review below is INVENTED for layout purposes.
 *  Publishing fabricated press coverage ("As featured in Monocle") or fake
 *  reviews on a live site is false advertising and legally actionable in
 *  most jurisdictions. Before go-live you MUST either:
 *    (a) replace with real press quotes + real customer reviews you have
 *        permission to use, or
 *    (b) remove <SocialProof /> from page.tsx until you have them.
 *  This is tracked in docs/RELEASE_GATE.md. */

const PRESS = [
  { name: "Condé Nast Traveller", quote: "One of Asia's most exciting new café openings" },
  { name: "Monocle", quote: "The café redefining what Nepalese coffee can be" },
  { name: "Lonely Planet", quote: "A must-visit for any coffee lover in Kathmandu" },
  { name: "Food & Wine", quote: "Altitude-grown beans with extraordinary character" },
  { name: "The Guardian", quote: "Nepal's specialty coffee moment has arrived" },
];

const REVIEWS = [
  {
    name: "Priya M.",
    location: "London",
    rating: 5,
    text: "The Altitude 8848 changed how I think about coffee. Nothing I've had in London comes close — the wild honey and brown butter note is unlike anything I've tried.",
    date: "March 2025",
  },
  {
    name: "James T.",
    location: "New York",
    rating: 5,
    text: "Came for one cup, stayed for three hours. The pour-over flight is worth booking a flight for. Genuinely one of the top five coffee experiences of my life.",
    date: "February 2025",
  },
  {
    name: "Aiko S.",
    location: "Tokyo",
    rating: 5,
    text: "As someone who works in specialty coffee in Japan, I was skeptical. I was wrong. The sourcing story is real, the execution is precise, and the Silk Road Pistachio Latte is extraordinary.",
    date: "January 2025",
  },
];

function Stars({ n }: { n: number }) {
  return (
    <span aria-label={`${n} out of 5 stars`} className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 12 12" className={`h-3.5 w-3.5 ${i < n ? "fill-[#C8A951]" : "fill-current opacity-20"}`}>
          <path d="M6 0l1.5 4H12L8.5 7l1.5 4L6 9l-4 2 1.5-4L0 4h4.5z" />
        </svg>
      ))}
    </span>
  );
}

export function SocialProof() {
  return (
    <>
      {/* Press bar */}
      <section aria-label="Press" className="border-y py-10" style={{ borderColor: "var(--line)" }}>
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-center font-button text-xs uppercase tracking-[0.25em] text-[#786C63]">
            As featured in
          </p>
          <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {PRESS.map((p) => (
              <li key={p.name}>
                <span
                  className="font-display text-sm font-semibold opacity-40 transition-opacity duration-300 hover:opacity-80"
                  title={p.quote}
                >
                  {p.name}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Reviews */}
      <section aria-label="Guest reviews" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <p className="eyebrow">What guests say</p>
            <h2 className="mt-2 text-4xl">
              Words from people who&apos;ve sat with us.
            </h2>
          </Reveal>
          <ul className="mt-12 grid gap-6 md:grid-cols-3">
            {REVIEWS.map((r) => (
              <li key={r.name}>
                <Reveal>
                  <article className="card flex h-full flex-col justify-between p-7">
                    <div>
                      <Stars n={r.rating} />
                      <blockquote className="mt-4 font-display text-[1.05rem] italic leading-relaxed opacity-85">
                        &ldquo;{r.text}&rdquo;
                      </blockquote>
                    </div>
                    <footer className="mt-6 flex items-center justify-between border-t pt-4" style={{ borderColor: "var(--line)" }}>
                      <div>
                        <p className="font-semibold text-sm">{r.name}</p>
                        <p className="text-xs opacity-50">{r.location}</p>
                      </div>
                      <time className="text-xs opacity-40">{r.date}</time>
                    </footer>
                  </article>
                </Reveal>
              </li>
            ))}
          </ul>
          <Reveal>
            <p className="mt-10 text-center text-sm opacity-50">
              4.9 · 847 reviews across Google and TripAdvisor
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
