import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.AUTH_URL ?? "https://himbean.coffee";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/pos/", "/api/", "/checkout/", "/account/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
