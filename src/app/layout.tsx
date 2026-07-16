import type { Metadata } from "next";
// sandbox
import "./globals.css";
import { Analytics } from "@/components/site/Analytics";
import "@/lib/env"; // fail fast on invalid environment in production
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { CartUI } from "@/components/cart/CartUI";

const playfair={variable:""};
const inter={variable:""};
const poppins={variable:""};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.AUTH_URL ?? "https://himbean.coffee"),
  title: { default: "HimBean — Coffee, elevated by the Himalayas", template: "%s · HimBean" },
  description:
    "Himalayan origin coffee, crafted for the modern world. Altitude-grown, small-batch roasted in Kathmandu. Order ahead, shop beans, or subscribe.",
  openGraph: { type: "website", siteName: "HimBean", images: ["/og.jpg"] },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
  manifest: "/manifest.webmanifest",
};

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "CafeOrCoffeeShop",
  name: "HimBean",
  slogan: "Coffee, elevated by the Himalayas",
  servesCuisine: "Coffee, Bakery",
  priceRange: "$$",
  address: { "@type": "PostalAddress", streetAddress: "12 Lantern Row", addressLocality: "Kathmandu", addressCountry: "NP" },
  openingHours: "Mo-Sa 07:00-21:00",
  acceptsReservations: "True",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${playfair.variable} ${inter.variable} ${poppins.variable}`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-gold focus:px-5 focus:py-2 focus:text-coffee">
          Skip to content
        </a>
        <Navbar />
        <main id="main">{children}</main>
        <CartUI />
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
