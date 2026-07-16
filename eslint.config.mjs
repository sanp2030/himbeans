import { FlatCompat } from "@eslint/eslintrc";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "public/sw.js",
      "public/swe-worker*.js",
      "src/generated/**",
      "next-env.d.ts",
      "postcss.config.mjs",
      "scripts/**",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Server actions / API routes intentionally use `any` for third-party
      // webhook payloads (Stripe, Twilio) before validation narrows them.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];

export default eslintConfig;
