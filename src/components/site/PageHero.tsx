/** Shared secondary-page header. Per critique: the nav label ("About") stays in the
 * navigation where visitors expect it; the page itself opens with a more memorable,
 * voice-driven headline ("Born in the Himalayas") — same pattern across every page. */
export function PageHero({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mx-auto max-w-3xl px-6 pb-16 pt-40 text-center">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-3 text-4xl sm:text-5xl">{title}</h1>
    </div>
  );
}
