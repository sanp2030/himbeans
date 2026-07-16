import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

/** CSP note: analytics domains are explicitly allowlisted (GA4 + PostHog).
 *  They only load when their env keys are set (see Analytics.tsx), but the
 *  CSP must permit them or the scripts are silently blocked. */
const ANALYTICS_SCRIPT = "https://www.googletagmanager.com https://us.i.posthog.com https://us-assets.i.posthog.com";
const ANALYTICS_CONNECT = "https://www.google-analytics.com https://analytics.google.com https://us.i.posthog.com";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  turbopack: { root: process.cwd() },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
    formats: ["image/avif", "image/webp"],
  },
  poweredByHeader: false,
  compress: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              `script-src 'self' 'unsafe-inline' ${ANALYTICS_SCRIPT}`,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https://images.unsplash.com https://www.google-analytics.com",
              "font-src 'self'",
              `connect-src 'self' ${ANALYTICS_CONNECT}`,
              "worker-src 'self'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default withSerwist(nextConfig);
