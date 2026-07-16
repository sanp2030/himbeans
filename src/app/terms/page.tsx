import { PageHero } from "@/components/site/PageHero";

export const metadata = { title: "Terms & Conditions — HimBean", description: "Terms of use for HimBean website and services.", openGraph: { title: "Terms of Use.", images: ["/og.jpg"] } };

const SECTIONS = [
  ["Orders", "Prices and menu items may change without prior notice."],
  ["Availability", "Some coffees and seasonal products are available only while supplies last."],
  ["Returns", "Packaged coffee may be returned if unopened within our return policy. Prepared food and beverages cannot be returned unless there is a quality concern."],
  ["Intellectual Property", "All photography, branding, logos, illustrations, and website content are the property of HimBean and may not be reproduced without written permission."],
];

export default function TermsPage() {
  return (
    <>
      <PageHero eyebrow="Terms" title="Terms of Use." />
      <div className="mx-auto max-w-2xl px-6 text-lg leading-relaxed opacity-85">
        <p>By visiting HimBean or using our website, you agree to these terms.</p>
      </div>
      <div className="mx-auto max-w-2xl px-6 pb-16 pt-8">
        {SECTIONS.map(([h, p]) => (
          <div key={h} className="border-t py-6" style={{ borderColor: "var(--line)" }}>
            <h2 className="font-display text-xl font-semibold">{h}</h2>
            <p className="mt-2 opacity-75">{p}</p>
          </div>
        ))}
      </div>
      <div className="mx-auto max-w-2xl px-6 pb-28 text-center">
        <p className="font-button text-sm uppercase tracking-[0.15em] text-[#786C63]">
          Questions regarding these terms can be directed to
        </p>
        <a href="mailto:hello@himbean.com" className="text-alpine underline dark:text-gold">hello@himbean.com</a>
      </div>
    </>
  );
}
