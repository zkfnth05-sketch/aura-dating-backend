
self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received.');

  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    console.log('[Service Worker] Push event, but no data. Using default.');
    data = {
      title: 'Aura',
      body: '새로운 소식이 도착했습니다!',
      url: '/'
    };
  }
  
  const title = data.title || 'Aura';
  const options = {
    body: data.body || '새로운 소식을 확인해보세요.',
    icon: '/icon.svg',
    badge: '/icon.svg',
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click Received.');

  event.notification.close();

  const urlToOpen = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      return clients.openWindow(urlToOpen);
    })
  );
});
