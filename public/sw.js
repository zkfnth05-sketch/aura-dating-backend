// Define the cache name and assets to cache
const CACHE_NAME = 'aura-cache-v1';
const urlsToCache = [
  '/',
  '/offline.html',
  '/icon.svg'
];

// Install the service worker and cache assets
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate the service worker and clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Intercept fetch requests
self.addEventListener('fetch', event => {
  // Only handle navigation requests for offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // First, try to use the navigation preload response if it's supported
          const preloadResponse = await event.preloadResponse;
          if (preloadResponse) {
            return preloadResponse;
          }

          // Always try the network first
          const networkResponse = await fetch(event.request);
          return networkResponse;
        } catch (error) {
          // catch is only triggered if the network fails
          console.log('Fetch failed; returning offline page instead.', error);

          const cache = await caches.open(CACHE_NAME);
          const cachedResponse = await cache.match('/offline.html');
          return cachedResponse;
        }
      })()
    );
  } else {
    // For non-navigation requests, use a cache-first strategy
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          return response || fetch(event.request);
        })
    );
  }
});


// Listen for push notifications
self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : { title: 'Aura', body: '새로운 알림이 도착했습니다.', tag: 'default' };
  const title = data.title;
  const options = {
    body: data.body,
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: data.tag || 'default', // Add a tag to group notifications
    renotify: true, // Re-notify if a new notification with the same tag arrives
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // If a window is already open, focus it
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
