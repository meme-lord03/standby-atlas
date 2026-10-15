// AUS Standby Atlas service worker: works offline after the first visit.
const VERSION = "atlas-v1";
const SHELL = ["./", "./index.html", "./config.js", "./manifest.webmanifest", "./data/schedule.json",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png"];
// Libraries and fonts from other sites, cached so the map and type work offline too.
const EXTRA = [
  "https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/topojson/3.0.2/topojson.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/datamaps/0.5.9/datamaps.usa.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/datamaps/0.5.9/datamaps.world.hires.min.js",
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js",
  "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Atkinson+Hyperlegible:wght@400;700&family=JetBrains+Mono:wght@500;700&display=swap"
];

self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    await c.addAll(SHELL);
    await Promise.all(EXTRA.map(u => fetch(u, { mode: "no-cors" }).then(r => c.put(u, r)).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== VERSION) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.hostname.endsWith("supabase.co")) return; // sync traffic is never cached

  // Schedule counts: try the network first so you get the newest numbers, fall back to the saved copy.
  if (url.origin === location.origin && url.pathname.endsWith("/data/schedule.json")) {
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put("./data/schedule.json", copy)); return r; })
      .catch(() => caches.match("./data/schedule.json")));
    return;
  }
  // App pages: show the saved copy instantly, refresh it in the background.
  if (url.origin === location.origin) {
    e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => {
      const net = fetch(req).then(r => { if (r.ok) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); } return r; }).catch(() => hit || caches.match("./index.html"));
      return hit || net;
    }));
    return;
  }
  // Libraries and fonts: saved copy first, network if missing.
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); return r; })));
});
