import { PageHero } from "@/components/site/PageHero";

export const metadata = {
  title: "Careers — HimBean",
  description: "Join the team building the future of Nepalese coffee. Open roles in barista, kitchen, management, and creative.",
  openGraph: {
    title: "Build the Future of Nepalese Coffee.",
    description: "Careers at HimBean — hospitality, craftsmanship, and purpose.",
    images: ["/og.jpg"],
  },
};

const ROLES = ["Barista", "Shift Supervisor", "Kitchen Team", "Pastry Chef", "Café Manager", "Marketing & Creative"];

export default function CareersPage() {
  return (
    <>
      <PageHero eyebrow="Careers" title="Build the Future of Nepalese Coffee." />
      <div className="mx-auto max-w-2xl px-6 pb-16 text-lg leading-relaxed opacity-85">
        <p>Great coffee is made by people who care.</p>
        <p className="mt-5">
          At HimBean, we&rsquo;re building more than a café — we&rsquo;re building a team
          dedicated to hospitality, craftsmanship, and sharing Nepal&rsquo;s coffee with the
          world.
        </p>
        <p className="mt-5">
          Whether you&rsquo;re behind the espresso machine, in the kitchen, or welcoming
          guests, every role helps create an experience people remember.
        </p>
        <p className="mt-5">
          If you&rsquo;re curious, committed, and passionate about learning, we&rsquo;d love
          to hear from you.
        </p>
      </div>
      <div className="mx-auto max-w-2xl px-6 pb-28">
        <p className="font-button text-xs uppercase tracking-[0.2em] text-[#786C63]">Current opportunities</p>
        <ul className="mt-4 divide-y" style={{ borderColor: "var(--line)" }}>
          {ROLES.map((r) => (
            <li key={r} className="flex items-center justify-between py-4">
              <span className="font-display text-xl">{r}</span>
              <a href="mailto:careers@himbean.com" className="btn-line">Apply</a>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-center">
          <a href="mailto:careers@himbean.com" className="text-alpine underline dark:text-gold">careers@himbean.com</a>
        </p>
      </div>
    </>
  );
}
