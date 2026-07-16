"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const links = [
  { href: "/menu", label: "Menu" },
  { href: "/shop", label: "Shop Beans" },
  { href: "/about", label: "Origin" },
  { href: "/subscribe", label: "Subscribe" },
  { href: "/account/orders", label: "My Orders" },
];

function Mark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <ellipse cx="50" cy="50" rx="34" ry="43" transform="rotate(-18 50 50)" fill="currentColor" />
      <path d="M28 64 L42 40 L50 51 L60 32 L74 56" fill="none" stroke="var(--bg)" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [dark, setDark] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
        scrolled ? "bg-[var(--bg)]/90 py-3 shadow-[0_1px_0_var(--line)] backdrop-blur-md" : "bg-transparent py-5"
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6" aria-label="Main">
        <Link href="/" className="flex items-center gap-2.5 font-display text-xl font-semibold">
          <Mark />
          Him<span className="text-[#846C2A] dark:text-gold">Bean</span>
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="nav-link font-button text-sm opacity-80 transition-colors hover:text-alpine hover:opacity-100 dark:hover:text-gold">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setDark((d) => !d)}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            className="rounded-full border p-2"
            style={{ borderColor: "var(--line)" }}
          >
            {dark ? "☀" : "☾"}
          </button>
          <Link href="/menu" className="btn-green hidden !px-5 !py-2.5 sm:inline-flex">
            Order ahead
          </Link>
          <button
            className="rounded-full border p-2 md:hidden"
            style={{ borderColor: "var(--line)" }}
            aria-expanded={open}
            aria-label="Open menu"
            onClick={() => setOpen((o) => !o)}
          >
            ☰
          </button>
        </div>
      </nav>

      {open && (
        <ul className="space-y-1 bg-[var(--bg)] px-6 pb-6 pt-2 md:hidden">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="block rounded-lg px-3 py-3 hover:bg-coffee/5 dark:hover:bg-himwhite/10" onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            </li>
          ))}
          <li><Link href="/menu" className="btn-green mt-2 w-full">Order ahead</Link></li>
        </ul>
      )}
    </header>
  );
}
