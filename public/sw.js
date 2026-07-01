// CineArch Service Worker — Offline-first for the set
const CACHE = 'cinearch-v1';

// App shell assets to cache on install
const PRECACHE = [
  '/',
  '/index.html',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Don't intercept Supabase API or external requests
  if (!url.origin.includes(self.location.origin)) return;

  // Supabase auth/data: network first, fall back to cache
  if (url.pathname.startsWith('/rest/') || url.pathname.startsWith('/auth/')) {
    event.respondWith(
      fetch(request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Static assets: cache first
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(res => {
        // Cache JS/CSS/fonts
        if (
          res.ok &&
          (request.url.includes('/assets/') || request.url.includes('fonts.g'))
        ) {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(request, clone));
        }
        return res;
      });
    }).catch(() => caches.match('/index.html'))
  );
});
