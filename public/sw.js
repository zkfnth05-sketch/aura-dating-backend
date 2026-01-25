const CACHE_NAME = 'aura-cache-v1';
const urlsToCache = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icon.svg'
];

// On install, cache the offline page and other core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// On activate, clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
                 .map(name => caches.delete(name))
      );
    })
  );
});

// On fetch, use network first, then cache, then offline page
self.addEventListener('fetch', event => {
  // We only want to handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // If we get a valid response, cache it and return it
        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then(cache => {
            // Only cache successful GET requests
            if (response.status === 200) {
              cache.put(event.request, responseToCache);
            }
          });
        return response;
      })
      .catch(() => {
        // If the network fails, try the cache
        return caches.match(event.request)
          .then(cachedResponse => {
            // If we have a cached response, return it
            if (cachedResponse) {
              return cachedResponse;
            }
            // For navigation requests, if cache also fails, return the offline fallback page
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
            // For other requests, we don't have a fallback, so we let the browser handle the error.
            return new Response("Network error and not in cache", {
              status: 408,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});
