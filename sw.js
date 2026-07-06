// The Practice Room — Service Worker
const CACHE = 'practice-room-v58';
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
  if (url.hostname.includes('supabase.co') ||
      url.hostname.includes('supabase.io') ||
      url.hostname.includes('jsdelivr.net') ||
      url.hostname.includes('cdn.')) return;

  if (event.request.mode === 'navigate') {
    // HTML pages: ALWAYS network (no-store so no intermediary cache serves a
    // stale page), and we never write HTML into the SW cache. The only cache
    // fallback is when the device is genuinely offline. This guarantees a
    // deployed change is visible on the next page load — no stale-HTML dance.
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .catch(() => caches.match(event.request) || caches.match('/'))
    );
    return;
  }

  // Critical shared app scripts: NETWORK-FIRST. These are loaded by every page
  // and change often; cache-first served them a deploy behind (the classic
  // "I shipped the fix but the button does nothing" bug). They revalidate
  // cheaply via ETag, so always go to network and only fall back to cache when
  // genuinely offline.
  const NETWORK_FIRST = ['/shared-header.js', '/shared-comments.js', '/data.js', '/email-templates.mjs', '/lessons-render.js', '/shared-achievements.js', '/book-render.js', '/shared-member-modal.js', '/shared-streak.js', '/shared-practice-autolog.js'];
  if (NETWORK_FIRST.includes(url.pathname)) {
    event.respondWith(
      fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(event.request, clone));
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
          caches.open(CACHE).then(c => c.put(event.request, clone));
        }
        return response;
      });
      return cached || networkFetch;
    })
  );
});
