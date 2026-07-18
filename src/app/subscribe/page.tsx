import { SubscribeForm } from "@/components/shop/SubscribeForm";

export const metadata = {
  title: "Subscribe — HimBean",
  description: "A rotating Himalayan single origin, roasted to order and delivered monthly. Pause or cancel any time.",
  openGraph: { title: "The HimBean Coffee Club", images: ["/og.jpg"] },
};

export default function SubscribePage() {
  return (
    <div className="mx-auto max-w-2xl px-6 pb-28 pt-40">
      <p className="eyebrow">The Coffee Club</p>
      <h1 className="mt-2 text-4xl sm:text-5xl">One origin a month, from the mountains.</h1>
      <p className="mt-5 text-lg leading-relaxed opacity-75">
        Every month we pick one lot from our eleven partner farms, roast it to order, and
        ship it with tasting notes and the story of the family who grew it. $24/month,
        free shipping, pause or cancel whenever you like.
      </p>
      <SubscribeForm />
    </div>
  );
}
