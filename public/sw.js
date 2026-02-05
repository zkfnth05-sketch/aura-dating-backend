// This service worker file is intentionally kept simple for clarity.
// In a real-world application, you might add more logic for caching, etc.

self.addEventListener('push', function(event) {
  // Parse the incoming data. We expect a JSON payload.
  const data = event.data ? event.data.json() : {};
  
  const title = data.title || 'Aura';
  const options = {
    body: data.body || '새로운 알림이 도착했습니다.',
    icon: data.icon || '/icon.svg', // A default icon
    badge: '/icon.svg', // Icon for the notification tray on Android
    data: {
      url: data.url || '/' // The URL to open when the notification is clicked
    }
  };

  // Tell the browser to show the notification.
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  // Close the notification
  event.notification.close();
  
  const urlToOpen = event.notification.data.url || '/';

  // This looks at all open tabs and windows of our app
  // and focuses one if it's already open. Otherwise, it opens a new one.
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(clientList) {
      if (clientList.length > 0) {
        let client = clientList[0];
        // Focus the already-focused window if available
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        client.focus();
        // Navigate to the specified URL
        return client.navigate(urlToOpen);
      }
      // If no window is open, open a new one
      return clients.openWindow(urlToOpen);
    })
  );
});
