import { PageHero } from "@/components/site/PageHero";

export const metadata = {
  title: "About — HimBean",
  description: "HimBean was founded to make Nepal one of the world's most respected coffee origins. We work directly with local farmers, roasting every harvest with respect for its origin.",
  openGraph: {
    title: "Born in the Himalayas. Crafted for the World.",
    description: "The story behind HimBean and Nepal's remarkable specialty coffee.",
    images: ["/og.jpg"],
  },
};

export default function AboutPage() {
  return (
    <>
      <PageHero eyebrow="About" title="Born in the Himalayas. Crafted for the World." />
      <div className="mx-auto max-w-2xl px-6 pb-28 text-lg leading-relaxed opacity-85">
        <p>Most people know Nepal for its mountains.</p>
        <p className="mt-5">Few know it produces some of the world&rsquo;s most remarkable specialty coffee.</p>
        <p className="mt-5">
          High in the Himalayan foothills, cool mountain air, rich soils, and patient
          cultivation create coffees with exceptional sweetness, clarity, and character. Yet
          for decades, Nepal remained one of specialty coffee&rsquo;s most overlooked origins.
        </p>
        <p className="mt-5 font-display text-2xl">HimBean was founded to change that.</p>
        <p className="mt-5">
          We work directly with local farmers, roast every harvest with respect for its
          origin, and serve every cup as a celebration of the people and landscapes behind it.
        </p>
        <p className="mt-5">Our ambition isn&rsquo;t simply to serve great coffee.</p>
        <p className="mt-2 font-display text-2xl text-alpine dark:text-gold">
          It&rsquo;s to make Nepal one of the world&rsquo;s most respected coffee origins.
        </p>
      </div>
    </>
  );
}
