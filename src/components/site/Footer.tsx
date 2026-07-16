import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-coffee text-himwhite">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="flex items-center gap-2.5 font-display text-2xl font-semibold">
            <svg width="30" height="30" viewBox="0 0 100 100" aria-hidden="true">
              <ellipse cx="50" cy="50" rx="34" ry="43" transform="rotate(-18 50 50)" fill="#C8A951" />
              <path d="M28 64 L42 40 L50 51 L60 32 L74 56" fill="none" stroke="#2B1B14" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Him<span className="text-gold">Bean</span>
          </p>
          <p className="mt-3 max-w-xs text-sm text-himwhite/70">
            Himalayan origin coffee, crafted for the modern world. Brewed Above Ordinary.
          </p>
        </div>
        <nav aria-label="Visit">
          <p className="eyebrow mb-4">Visit</p>
          <ul className="space-y-2 text-sm text-himwhite/80">
            <li><Link href="/menu" className="hover:text-gold">Menu</Link></li>
            <li><Link href="/reservations" className="hover:text-gold">Reserve a table</Link></li>
            <li><Link href="/locations" className="hover:text-gold">Store locator</Link></li>
            <li><Link href="/gift-cards" className="hover:text-gold">Gift cards</Link></li>
          </ul>
        </nav>
        <nav aria-label="Shop">
          <p className="eyebrow mb-4">Shop</p>
          <ul className="space-y-2 text-sm text-himwhite/80">
            <li><Link href="/shop" className="hover:text-gold">Whole beans</Link></li>
            <li><Link href="/shop" className="hover:text-gold">Cold brew bottles</Link></li>
            <li><Link href="/subscribe" className="hover:text-gold">Subscription</Link></li>
            <li><Link href="/shop" className="hover:text-gold">Brew kits</Link></li>
          </ul>
        </nav>
        <div>
          <p className="eyebrow mb-4">Flagship</p>
          <p className="text-sm text-himwhite/80">Mon–Sat · 7:00 – 21:00<br />Sun · 8:00 – 20:00</p>
          <p className="mt-4 text-sm text-himwhite/80">12 Lantern Row, Kathmandu<br />+977-1-555-0142</p>
        </div>
      </div>
      <div className="border-t border-himwhite/10 py-6 text-center text-xs text-himwhite/50">
        © {new Date().getFullYear()} HimBean Coffee Pvt. Ltd. · From the Himalayas to the World ·{" "}
        <Link href="/about" className="hover:text-gold">About</Link> ·{" "}
        <Link href="/careers" className="hover:text-gold">Careers</Link> ·{" "}
        <Link href="/wholesale" className="hover:text-gold">Wholesale</Link> ·{" "}
        <Link href="/faq" className="hover:text-gold">FAQ</Link> ·{" "}
        <Link href="/privacy" className="hover:text-gold">Privacy</Link> ·{" "}
        <Link href="/terms" className="hover:text-gold">Terms</Link>
      </div>
    </footer>
  );
}
