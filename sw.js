// The Practice Room — Service Worker
const CACHE = 'practice-room-v79';
const PRECACHE = [
  '/',
  '/practice-log.html',
  '/style.css',
  '/data.js',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg',
];

// Install: pre-cache static shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// Activate: clear old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch strategy:
//   • Supabase API / CDN calls  → always network (skip cache entirely)
//   • HTML navigation           → network-first, fall back to cache
//   • Everything else (CSS/JS)  → cache-first, update in background
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-GET and Supabase/external API requests
  if (event.request.method !== 'GET') return;
  /* Only http(s) can go in a Cache. A browser extension's own requests come
     through here as chrome-extension:// and reach the cache-first branch at the
     bottom, where cache.put() throws "Request scheme 'chrome-extension' is
     unsupported" as an unhandled rejection on every page load. Nothing to do
     with this app, but it is our service worker throwing it. */
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
  if (url.hostname.includes('supabase.co') ||
      url.hostname.includes('supabase.io') ||
      url.hostname.includes('jsdelivr.net') ||
      url.hostname.includes('cdn.')) return;

  if (event.request.mode === 'navigate') {
    // HTML pages: ALWAYS network (no-store so no intermediary cache serves a
    // stale page), and we never write HTML into the SW cache. The only cache
    // fallback is when the device is genuinely offline. This guarantees a
    // deployed change is visible on the next page load — no stale-HTML dance.
    /* WAS { cache: 'no-store' }, WHICH RE-DOWNLOADED THE WHOLE PAGE EVERY TIME.
       practice-log.html is 2 MB, and no-store forbids the browser from even
       ASKING whether its copy is still good: no If-None-Match, no 304, a full
       transfer on every single refresh.
       Netlify already serves these with `cache-control: public, max-age=0,
       must-revalidate`, which requires the browser to check with the server
       before using a stored copy. So a plain fetch is exactly as fresh - a
       deploy still shows up on the next load - and costs a conditional request
       instead of two megabytes when nothing has changed.
       If a stale page is ever seen after a deploy, this line is the first place
       to look; putting { cache: 'no-store' } back restores the old behaviour. */
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request) || caches.match('/'))
    );
    return;
  }

  // Critical shared app scripts: NETWORK-FIRST. These are loaded by every page
  // and change often; cache-first served them a deploy behind (the classic
  // "I shipped the fix but the button does nothing" bug). They revalidate
  // cheaply via ETag, so always go to network and only fall back to cache when
  // genuinely offline.
  const NETWORK_FIRST = ['/shared-header.js', '/live-session.js', '/shared-comments.js', '/data.js', '/email-templates.mjs', '/lessons-render.js', '/shared-achievements.js', '/book-render.js', '/shared-member-modal.js', '/shared-streak.js', '/shared-practice-autolog.js'];
  if (NETWORK_FIRST.includes(url.pathname)) {
    event.respondWith(
      fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(event.request, clone)).catch(() => {});
        }
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(event.request).then(cached => {
      const networkFetch = fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(event.request, clone)).catch(() => {});
        }
        return response;
      });
      return cached || networkFetch;
    })
  );
});
