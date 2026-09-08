const CACHE_NAME = 'docuhighlight-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/material-theme.css',
  './css/app.css',
  './css/print.css',
  './js/vendor/jszip.min.js',
  './js/vendor/mammoth.browser.min.js',
  './js/vendor/xlsx.full.min.js',
  './js/vendor/pdf.min.js',
  './js/vendor/pdf.worker.min.js',
  './js/vendor/alpine.min.js',
  './js/blob-manager.js',
  './js/highlighter.js',
  './js/parser.js',
  './js/app.js'
];

// Install Event - Pre-cache core shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell and vendor assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up stale caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Stale-While-Revalidate / Cache-First strategy
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Ignore blob: or data: URIs
  if (event.request.url.startsWith('blob:') || event.request.url.startsWith('data:')) return;

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          // If response is valid, update cache asynchronously (Stale-While-Revalidate)
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // Network failed, return cached response if available
          return cachedResponse;
        });

        // Return cached response immediately if present, otherwise wait for network fetch
        return cachedResponse || fetchPromise;
      });
    })
  );
});
