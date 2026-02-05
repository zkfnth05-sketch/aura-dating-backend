
// Listen for push events from the server
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || "Aura";
  const options = {
    body: data.body || "새로운 알림이 있습니다.",
    icon: data.icon || "/icon.svg",
    data: {
      url: data.url || '/' // The URL to open when the notification is clicked
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // Close the notification

  const urlToOpen = new URL(event.notification.data.url || '/', self.location.origin).href;

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((windowClients) => {
      // Check if there's already a window open with the target URL
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If not, check if any window is open and navigate it
      if (windowClients.length > 0 && 'navigate' in windowClients[0]) {
          return windowClients[0].navigate(urlToOpen).then(client => client.focus());
      }
      
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
