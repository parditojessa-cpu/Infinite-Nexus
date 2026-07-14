/// <reference lib="webworker" />
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheFirst, StaleWhileRevalidate, NetworkOnly } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";

declare let self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);

// Static assets: fonts, images, icons
registerRoute(
  ({ request }) => request.destination === "image" || request.destination === "font",
  new CacheFirst({
    cacheName: "static-assets",
    plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 })],
  })
);

// Safe-to-show-stale GET API calls (dashboards, course lists, etc.)
registerRoute(
  ({ url, request }) =>
    request.method === "GET" &&
    url.pathname.startsWith("/api/") &&
    !url.pathname.startsWith("/api/auth"),
  new StaleWhileRevalidate({
    cacheName: "api-cache",
    plugins: [new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 5 * 60 })],
  })
);

// Auth + all mutations: never cache, always hit network
registerRoute(
  ({ url, request }) => url.pathname.startsWith("/api/auth") || request.method !== "GET",
  new NetworkOnly()
);

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
