import { PageHero } from "@/components/site/PageHero";

export const metadata = { title: "Privacy Policy — HimBean", description: "How HimBean handles your personal information.", openGraph: { title: "Your Privacy.", images: ["/og.jpg"] } };

export default function PrivacyPage() {
  return (
    <>
      <PageHero eyebrow="Privacy" title="Your Privacy." />
      <div className="mx-auto max-w-2xl px-6 pb-28 text-lg leading-relaxed opacity-85">
        <p>We respect your privacy and collect only the information necessary to provide our services.</p>
        <p className="mt-5">
          This may include your contact details, online orders, reservations, newsletter
          subscriptions, and website analytics.
        </p>
        <p className="mt-5">
          Your information is never sold to third parties and is used only to improve your
          experience, fulfill purchases, and communicate with you when you&rsquo;ve chosen to
          receive updates.
        </p>
      </div>
      <div className="mx-auto max-w-2xl px-6 pb-28">
        <p className="font-button text-sm uppercase tracking-[0.15em] text-[#786C63]">For privacy-related questions, contact</p>
        <a href="mailto:privacy@himbean.com" className="mt-1 block text-alpine underline dark:text-gold">privacy@himbean.com</a>
      </div>
    </>
  );
}
