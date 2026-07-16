import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { NewsletterForm } from "@/components/site/NewsletterForm";
import { SocialProof } from "@/components/site/SocialProof";
import { Reveal } from "@/components/fx/Reveal";
import { TiltCard } from "@/components/fx/TiltCard";
import { AmbientBeans } from "@/components/fx/Ambient";

export const revalidate = 300;

async function getSignatures() {
  try {
    return await db.product.findMany({
      where: { isFeatured: true, isActive: true },
      take: 4,
      select: { id: true, slug: true, name: true, description: true, price: true, badge: true, nudge: true },
    });
  } catch {
    return [];
  }
}

const BADGE_LABELS: Record<string, { label: string; cls: string }> = {
  BEST_SELLER: { label: "⭐ Best Seller", cls: "pill-star" },
  POPULAR: { label: "🔥 Popular", cls: "pill-fire" },
  SEASONAL: { label: "❄️ Seasonal", cls: "pill-snow" },
  STRONG: { label: "☕ Strong", cls: "pill-bolt" },
  BARISTA_FAVORITE: { label: "⭐ Barista Favorite", cls: "pill-leaf" },
};

const retail = [
  { name: "Signature Roast", note: "Everyday balance — cocoa, red apple, brown sugar. 250 g.", price: 18, origin: "1,650 M · KASKI" },
  { name: "Himalayan Espresso", note: "Built for milk — dark chocolate, toasted hazelnut. 250 g.", price: 19.5, origin: "1,800 M · GULMI" },
  { name: "Cold Brew Bottles", note: "Ready to drink, 18-hour steep. Four-pack.", price: 16, origin: "330 ML · RTD" },
];

export default async function HomePage() {
  const signatures = await getSignatures();

  return (
    <>
      {/* ── Hero: cinematic morning at the flagship ───────
           Layered depth: (1) ken-burns light wash, (2) window-light beam,
           (3) ambient beans, (4) staged copy reveal, (5) espresso vignette + steam.
           All motion is transform/opacity only and dies under prefers-reduced-motion. */}
      <section className="relative flex min-h-[94vh] items-center overflow-hidden">
        {/* Full-bleed cinematic background photo — visible at every viewport width,
            fading naturally into the espresso-brown gradient so headline text stays legible. */}
        <div aria-hidden data-fx className="fx-kenburns absolute inset-0">
          <Image src="/images/hero-01.jpg" alt="" fill priority
            className="object-cover object-[center_32%]" sizes="100vw" />
        </div>
        <div aria-hidden className="absolute inset-0"
          style={{ background: "linear-gradient(90deg, var(--bg) 0%, rgba(43,27,20,.55) 38%, rgba(43,27,20,.2) 62%, transparent 100%), linear-gradient(0deg, var(--bg) 0%, transparent 30%, transparent 70%, rgba(43,27,20,.35) 100%)" }} />
        <div aria-hidden className="absolute inset-0"
          style={{ background: "radial-gradient(120% 90% at 78% 12%, rgba(200,169,81,.14), transparent 55%)" }} />
        <div aria-hidden className="absolute -top-24 right-[6%] h-[130%] w-40 rotate-[18deg] bg-gradient-to-b from-gold/15 via-gold/5 to-transparent blur-2xl" />
        <div aria-hidden data-fx className="fx-fog" />
        <div aria-hidden data-fx className="fx-fog2" />
        <AmbientBeans />
        <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-12 px-6 pb-32 pt-40 lg:grid-cols-[1.15fr_.85fr]">
          <div>
            <Reveal><p className="eyebrow">Origin-First Specialty Coffee · Nepal</p></Reveal>
            <Reveal delay={120}>
              <h1 className="mt-4 max-w-[15ch] text-5xl leading-[1.06] sm:text-7xl">
                Coffee, <em className="italic text-alpine dark:text-gold">elevated</em> by the Himalayas.
              </h1>
            </Reveal>
            <Reveal delay={240}>
              <p className="mt-6 max-w-xl text-lg opacity-75">
                Every cup begins with carefully sourced high-altitude beans, roasted in small batches
                to reveal their natural character.
              </p>
            </Reveal>
            <Reveal delay={360}>
            <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/menu" className="btn-green fx-glow">Explore the Menu</Link>
            <Link href="/about" className="btn-line">Discover Our Coffee</Link>
          </div>
          <p className="mt-6 font-button text-sm opacity-70">⭐ 4.8 — rated by Kathmandu coffee lovers</p>
          <dl className="mt-14 flex flex-wrap gap-9 font-button text-xs opacity-70">
            {[["1,650 m", "average farm altitude"], ["11 farms", "direct trade, Nepal"], ["48 hrs", "roast to bar"]].map(([v, l]) => (
              <div key={l}>
                <dt className="font-display text-xl font-semibold text-alpine opacity-100 dark:text-gold">{v}</dt>
                <dd>{l}</dd>
              </div>
            ))}
          </dl>
            </Reveal>
          </div>

        </div>
        <div aria-hidden className="absolute bottom-7 left-1/2 -translate-x-1/2 font-button text-[10px] uppercase tracking-[0.3em] opacity-40">Scroll</div>
      </section>

      {/* ── Signatures ───────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-6 py-24" aria-labelledby="sig-heading">
        <p className="eyebrow">⭐ Signature Collection</p>
        <h2 id="sig-heading" className="mt-2 text-4xl">Only at HimBean</h2>
        <TiltCard className="mt-8 rounded-xl2"><div className="card divide-y px-7 py-1" style={{ borderColor: "var(--line)" }}>
          {signatures.map((p) => (
            <Link key={p.id} href={`/menu#${p.slug}`} className="group grid grid-cols-[1fr_auto] items-baseline gap-x-5 py-5" style={{ borderColor: "var(--line)" }}>
              <h3 className="flex flex-wrap items-baseline gap-2.5 font-display text-xl font-semibold group-hover:text-alpine dark:group-hover:text-gold">
                {p.name}
                {p.badge && BADGE_LABELS[p.badge] && <span className={BADGE_LABELS[p.badge].cls}>{BADGE_LABELS[p.badge].label}</span>}
                {p.nudge && <span className="font-body text-sm font-normal italic opacity-50">({p.nudge})</span>}
              </h3>
              <span className="font-button text-lg font-semibold">{Number(p.price).toFixed(2)}</span>
              <p className="max-w-[52ch] text-sm opacity-60">{p.description}</p>
            </Link>
          ))}
          {signatures.length === 0 && (
            <p className="py-8 text-center text-sm opacity-70">
              The bar is warming up — run <code>pnpm db:seed</code> to load the menu.
            </p>
          )}
        </div></TiltCard>
        <Link href="/menu" className="btn-line mt-8">See the full menu</Link>
      </section>

      {/* ── Retail shelf ─────────────────────────────────── */}
      <section className="bg-coffee py-24 text-himwhite">
        <div className="mx-auto max-w-6xl px-6">
          <p className="eyebrow">Take the mountain home</p>
          <h2 className="mt-2 text-4xl">Beans, bottles, and boxes</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {retail.map((r) => (
              <Link key={r.name} href="/shop" className="rounded-xl2 border border-himwhite/10 bg-himwhite/5 p-8 transition-transform hover:-translate-y-1.5">
                <p className="font-button text-[10px] uppercase tracking-[0.28em] text-gold">{r.origin}</p>
                <h3 className="mt-3 text-2xl">{r.name}</h3>
                <p className="mt-2 text-sm opacity-65">{r.note}</p>
                <p className="mt-5 font-button text-lg font-semibold text-gold">{r.price.toFixed(2)}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Subscription ─────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="flex flex-wrap items-center justify-between gap-8 rounded-xl2 bg-alpine p-12 text-himwhite shadow-lift">
          <div>
            <p className="eyebrow" style={{ color: "rgba(245,243,238,.85)" }}>The Elevation Box</p>
            <h2 className="mt-2 text-3xl">A new altitude, every month</h2>
            <p className="mt-3 max-w-md opacity-85">
              Rotating single-origin lots from our eleven partner farms, shipped within 48 hours of
              roast. Pause or cancel anytime.
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-4xl font-semibold">15<span className="text-base">/mo</span></p>
            <Link href="/subscribe" className="btn-gold mt-3">Start subscription</Link>
          </div>
        </div>
      </section>

      {/* ── Origin story ─────────────────────────────────── */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-24 lg:grid-cols-2">
        <div>
          <p className="eyebrow">Origin</p>
          <h2 className="mt-2 text-4xl">Grown in elevation. Served with elevation.</h2>
          <p className="mt-6 leading-relaxed opacity-78">
            HimBean exists because Nepal&apos;s high valleys grow remarkable coffee the world rarely
            tastes. We buy directly from eleven smallholder farms between 1,400 and 1,900 meters,
            pay above-market rates, and roast in Kathmandu within days of the beans coming down the hill.
          </p>
          <p className="mt-4 leading-relaxed opacity-78">
            No blends that hide the origin. No roast dates older than a week. The mountain is the brand.
          </p>
          <Link href="/about" className="btn-green mt-8">Meet the farms</Link>
        </div>
        <dl className="grid grid-cols-2 gap-5">
          {[["1,650 m", "average farm altitude"], ["11 farms", "direct partnerships"], ["+32%", "above market paid to growers"], ["48 hrs", "roast to bar"]].map(([stat, label]) => (
            <div key={label} className="card p-8 text-center">
              <dt className="font-display text-3xl font-semibold text-alpine dark:text-gold">{stat}</dt>
              <dd className="mt-2 text-sm opacity-65">{label}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── Social proof: press + reviews ────────────────── */}
      <SocialProof />

      {/* ── Newsletter ───────────────────────────────────── */}
      <section className="bg-coffee py-24 text-himwhite">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="eyebrow">The Ridge Report</p>
          <h2 className="mt-2 text-4xl">One email a week. Worth opening.</h2>
          <p className="mt-4 opacity-80">
            New lots on the bar, seasonal drinks before launch, and member pricing on beans. No noise.
          </p>
          <NewsletterForm />
        </div>
      </section>
    </>
  );
}
