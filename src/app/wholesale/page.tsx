import { PageHero } from "@/components/site/PageHero";

export const metadata = {
  title: "Wholesale — HimBean",
  description: "HimBean wholesale: freshly roasted Nepalese specialty coffee for cafés, restaurants, hotels, offices, and retailers.",
  openGraph: {
    title: "Serve Coffee with a Story.",
    description: "HimBean wholesale — altitude-grown Nepalese beans for exceptional partners.",
    images: ["/og.jpg"],
  },
};

const PERKS = [
  "Freshly roasted specialty coffee", "Seasonal single-origin releases",
  "Espresso and filter roast profiles", "Barista training",
  "Brewing consultation", "Ongoing quality support",
];

export default function WholesalePage() {
  return (
    <>
      <PageHero eyebrow="Wholesale" title="Serve Coffee with a Story." />
      <div className="mx-auto max-w-2xl px-6 pb-10 text-lg leading-relaxed opacity-85">
        <p>Exceptional coffee deserves exceptional partners.</p>
        <p className="mt-5">
          HimBean supplies freshly roasted Nepalese specialty coffee to cafés, restaurants,
          hotels, offices, and retailers looking to offer something genuinely distinctive.
        </p>
        <p className="mt-5">
          Every coffee is sourced directly from Himalayan farms and roasted to highlight its
          unique origin and character.
        </p>
      </div>
      <div className="mx-auto max-w-2xl px-6 pb-16">
        <p className="font-button text-xs uppercase tracking-[0.2em] text-[#786C63]">Our wholesale partners receive</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {PERKS.map((perk) => (
            <li key={perk} className="card p-4 text-sm">{perk}</li>
          ))}
        </ul>
      </div>
      <div className="mx-auto max-w-2xl px-6 pb-28 text-center">
        <p className="font-display text-2xl">Let&rsquo;s build something exceptional together.</p>
        <a href="mailto:wholesale@himbean.com" className="btn-green mt-6">wholesale@himbean.com</a>
      </div>
    </>
  );
}
