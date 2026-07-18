import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Gift Cards — HimBean",
  description: "HimBean gift cards — redeemable online at checkout and at the bar on Lantern Row.",
};

export default function GiftCardsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 pb-28 pt-40">
      <p className="eyebrow">Give the mountain</p>
      <h1 className="mt-2 text-4xl sm:text-5xl">Gift cards.</h1>
      <div className="card mt-10 overflow-hidden sm:flex">
        <div className="relative aspect-[4/3] sm:w-1/2">
          <Image src="/images/retail-giftcard.jpg" alt="HimBean gift card" fill className="object-cover" sizes="(max-width: 640px) 100vw, 50vw" />
        </div>
        <div className="p-8 sm:w-1/2">
          <h2 className="font-display text-2xl">How it works</h2>
          <p className="mt-3 text-sm leading-relaxed opacity-75">
            Gift cards are sold at the bar on Lantern Row in any amount from $25, as a
            printed card or a code. <strong>Redeeming online already works</strong> — enter
            the code at checkout and it covers the order, with any remainder payable by card
            or at pickup.
          </p>
          <p className="mt-3 text-sm opacity-60">
            Online purchase is coming with card payments; we&apos;d rather sell them properly
            than pretend a broken flow works.
          </p>
          <Link href="/menu" className="btn-green mt-6 inline-flex">Use one now — order ahead</Link>
        </div>
      </div>
    </div>
  );
}
