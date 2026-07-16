import { PageHero } from "@/components/site/PageHero";

export const metadata = {
  title: "FAQ — HimBean",
  description: "Frequently asked questions about HimBean coffee — sourcing, roasting, dairy alternatives, Wi-Fi, gift cards, and international shipping.",
  openGraph: { title: "Questions, Answered.", images: ["/og.jpg"] },
};

const QA = [
  ["Where does your coffee come from?", "We source directly from carefully selected farms across Nepal, where high-altitude growing conditions create coffees with exceptional sweetness, clarity, and complexity."],
  ["Do you roast your own coffee?", "Yes. Every coffee is roasted in small batches to express the unique character of each harvest."],
  ["Can I buy coffee beans?", "Absolutely. Whole beans and freshly ground coffee are available in-store and online."],
  ["Do you offer dairy alternatives?", "Yes. Oat, almond, soy, and coconut milk are available for most beverages."],
  ["Do you have Wi-Fi?", "Yes. Complimentary high-speed Wi-Fi is available for all guests."],
  ["Can I reserve space for meetings or events?", "Yes. Please contact us to discuss private gatherings, workshops, or corporate events."],
  ["Do you ship internationally?", "International shipping is currently limited. Please contact us for the latest availability."],
  ["Do you offer gift cards?", "Yes. Digital and physical gift cards are available."],
];

export default function FaqPage() {
  return (
    <>
      <PageHero eyebrow="FAQ" title="Questions, Answered." />
      <div className="mx-auto max-w-2xl px-6 pb-28">
        <div className="divide-y" style={{ borderColor: "var(--line)" }}>
          {QA.map(([q, a]) => (
            <details key={q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between font-display text-xl">
                {q}
                <span className="font-button text-sm opacity-40 transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 opacity-75">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </>
  );
}
