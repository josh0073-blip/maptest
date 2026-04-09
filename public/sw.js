const CACHE_NAME = 'fm-vendor-map-shell-v2';
const STATIC_URLS = ['/', '/index.html', '/manifest.webmanifest', '/pwa-icon.svg', '/pwa-192.png', '/pwa-512.png'];
const BUILD_MANIFEST_PATHS = ['/.vite/manifest.json', '/manifest.json'];

async function readBuildManifest() {
  for (const manifestPath of BUILD_MANIFEST_PATHS) {
    try {
      const response = await fetch(manifestPath, { cache: 'no-store' });
      if (!response.ok) {
        continue;
      }

      const manifest = await response.json();
      const urls = new Set();

      for (const entry of Object.values(manifest)) {
        if (!entry || typeof entry !== 'object') continue;
        if (entry.file) urls.add(`/${entry.file}`);
        if (Array.isArray(entry.css)) {
          for (const cssFile of entry.css) urls.add(`/${cssFile}`);
        }
        if (Array.isArray(entry.assets)) {
          for (const assetFile of entry.assets) urls.add(`/${assetFile}`);
        }
      }

      return Array.from(urls);
    } catch (error) {
      continue;
    }
  }

  return [];
}

async function cacheUrlList(cache, urls) {
  for (const url of urls) {
    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (response && response.ok) {
        await cache.put(url, response.clone());
      }
    } catch (error) {
      // Ignore individual cache misses so one missing asset does not block install.
    }
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const buildAssets = await readBuildManifest();
    await cacheUrlList(cache, [...STATIC_URLS, ...buildAssets]);
    self.skipWaiting();
  })());
});

self.addEventListener('message', (event) => {
  if (!event || !event.data || typeof event.data !== 'object') {
    return;
  }

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => {
      if (key === CACHE_NAME) {
        return undefined;
      }
      return caches.delete(key);
    }));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const networkResponse = await fetch(event.request);
        const cache = await caches.open(CACHE_NAME);
        cache.put('/index.html', networkResponse.clone());
        return networkResponse;
      } catch (error) {
        const cached = await caches.match('/index.html');
        return cached || caches.match('/');
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) {
      return cached;
    }

    try {
      const networkResponse = await fetch(event.request);
      const cache = await caches.open(CACHE_NAME);
      cache.put(event.request, networkResponse.clone());
      return networkResponse;
    } catch (error) {
      return cached;
    }
  })());
});
