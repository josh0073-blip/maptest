const CACHE_NAME = 'fm-vendor-map-root-shell-v1';
const BASE_URL = new URL(self.location.href);
const BASE_PATH = BASE_URL.pathname.replace(/\/sw\.js$/, '/');

function toBaseUrl(relativePath) {
  return new URL(relativePath, BASE_URL).toString();
}

const STATIC_URLS = [
  toBaseUrl('./'),
  toBaseUrl('./index.html'),
  toBaseUrl('./styles.css'),
  toBaseUrl('./public/manifest.webmanifest'),
  toBaseUrl('./public/pwa-icon.svg'),
  toBaseUrl('./public/pwa-192.png'),
  toBaseUrl('./public/pwa-512.png')
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(STATIC_URLS);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => {
      if (key === CACHE_NAME) return undefined;
      return caches.delete(key);
    }));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  if (!requestUrl.pathname.startsWith(BASE_PATH)) return;

  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        return await fetch(event.request);
      } catch (err) {
        return caches.match(toBaseUrl('./index.html'));
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;

    try {
      const response = await fetch(event.request);
      const cache = await caches.open(CACHE_NAME);
      cache.put(event.request, response.clone());
      return response;
    } catch (err) {
      return cached;
    }
  })());
});
