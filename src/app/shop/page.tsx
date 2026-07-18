import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/fx/Reveal";

export const metadata = {
  title: "Shop Beans — HimBean",
  description:
    "Whole beans, cold brew bottles, capsules, and brew kits from Himalayan smallholder farms — roasted in Kathmandu, shipped within 48 hours of roasting.",
  openGraph: { title: "Shop HimBean — Take the Mountain Home", images: ["/og.jpg"] },
};

const PRODUCTS = [
  { slug: "nuwakot-washed", name: "Nuwakot Washed", note: "Citrus, caramel, white floral — our brightest cup.", price: 19.5, origin: "1,600 M · NUWAKOT", img: "/images/retail-nuwakot-washed.jpg", tag: "Single origin" },
  { slug: "gulmi-natural", name: "Gulmi Natural", note: "Strawberry, jasmine, raw cacao — sun-dried on raised beds.", price: 21, origin: "1,800 M · GULMI", img: "/images/retail-gulmi-natural.jpg", tag: "Single origin" },
  { slug: "himalayan-espresso", name: "Himalayan Espresso", note: "Built for milk — dark chocolate, toasted hazelnut.", price: 19.5, origin: "BLEND · 250 G", img: "/images/retail-himalayan-espresso.jpg", tag: "House blend" },
  { slug: "cold-brew-bottles", name: "Cold Brew Bottles", note: "Ready to drink, 18-hour steep. Four-pack of 330 ml.", price: 16, origin: "330 ML × 4 · RTD", img: "/images/retail-coldbrew.jpg", tag: "Ready to drink" },
  { slug: "capsules", name: "Compostable Capsules", note: "Nespresso-compatible, fully compostable. Box of 20.", price: 14, origin: "20 CAPS · SIGNATURE", img: "/images/retail-capsules.jpg", tag: "Capsules" },
  { slug: "pourover-kit", name: "Pour-Over Starter Kit", note: "Dripper, filters, and a 250 g bag — everything for the first cup.", price: 42, origin: "KIT · GIFT-READY", img: "/images/retail-pourover-kit.jpg", tag: "Brew kit" },
  { slug: "gift-box", name: "The Summit Gift Box", note: "Two origins, a mug, and tasting notes in a walnut-toned box.", price: 58, origin: "GIFT · TWO ORIGINS", img: "/images/retail-giftbox.jpg", tag: "Gift" },
  { slug: "gift-card", name: "Gift Card", note: "Digital or physical, any amount. Redeemable in store and online.", price: 25, origin: "FROM $25", img: "/images/retail-giftcard.jpg", tag: "Gift" },
  { slug: "coffee-club", name: "Coffee Club Membership", note: "A rotating origin, delivered monthly. Pause any time.", price: 24, origin: "MONTHLY · FREE SHIP", img: "/images/retail-coffeeclub.jpg", tag: "Subscription", href: "/subscribe" },
];

export default function ShopPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 pb-28 pt-40">
      <Reveal>
        <p className="eyebrow">Take the mountain home</p>
        <h1 className="mt-2 text-4xl sm:text-5xl">Shop Beans</h1>
        <p className="mt-4 max-w-xl opacity-70">
          Everything is roasted in Kathmandu and shipped within 48 hours of the roast — the
          date is printed on every bag.
        </p>
      </Reveal>
      <div className="mt-12 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
        {PRODUCTS.map((p) => (
          <Reveal key={p.slug}>
            <article className="card overflow-hidden">
              <div className="relative aspect-[4/3]">
                <Image src={p.img} alt={p.name} fill className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" />
                <span className="absolute left-3 top-3 rounded-full bg-coffee/80 px-3 py-1 font-button text-[10px] uppercase tracking-[0.15em] text-himwhite backdrop-blur">
                  {p.tag}
                </span>
              </div>
              <div className="p-6">
                <p className="font-button text-[10px] uppercase tracking-[0.2em] text-[#786C63]">{p.origin}</p>
                <h2 className="mt-1 font-display text-xl">{p.name}</h2>
                <p className="mt-2 text-sm opacity-70">{p.note}</p>
                <div className="mt-5 flex items-center justify-between">
                  <span className="font-display text-lg">${p.price.toFixed(2)}</span>
                  <Link
                    href={p.href ?? "/menu"}
                    className="btn-line !px-4 !py-2 text-xs"
                  >
                    {p.href ? "Join the club" : "Order at the bar"}
                  </Link>
                </div>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
      <p className="mt-10 text-sm opacity-50">
        Online cart for retail goods ships with the next release — today, every item here can
        be added to a pickup order from the <Link href="/menu" className="underline">menu</Link>,
        or bought at the bar on Lantern Row.
      </p>
    </div>
  );
}
