/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import { Serwist } from "serwist";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

/** HimBean service worker — offline-first for the menu, network-first for
 *  everything transactional. Orders/checkout/POS deliberately bypass caching:
 *  a stale order queue is worse than an offline error. */
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Never cache transactional/ops surfaces
    {
      matcher: ({ url }) =>
        url.pathname.startsWith("/api/orders") ||
        url.pathname.startsWith("/api/pos") ||
        url.pathname.startsWith("/api/admin") ||
        url.pathname.startsWith("/api/webhooks") ||
        url.pathname.startsWith("/checkout") ||
        url.pathname.startsWith("/pos") ||
        url.pathname.startsWith("/admin"),
      handler: new (class {
        async handle({ request }: { request: Request }) {
          return fetch(request);
        }
      })() as never,
    },
    ...defaultCache,
  ],
});

serwist.addEventListeners();
