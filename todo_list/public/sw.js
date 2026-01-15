const CACHE_NAME = 'todo-static-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/vite.svg',
  '/Background.jpg'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = event.request.url;
  
  // Skip non-http(s) requests (chrome-extension, etc.)
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return;
  }

  // navigation requests: serve index.html from cache (app shell)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // for other requests: try cache first, then network
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(res => {
        // optionally cache newly fetched resources
        if (!res || res.status !== 200 || res.type !== 'basic') return res;
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return res;
      }).catch(() => {
        // fallback to cached root image for images
        if (event.request.destination === 'image') return caches.match('/vite.svg');
        return null;
      });
    })
  );
});

// allow skipWaiting via message from the page
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Handle Web Push events
self.addEventListener('push', (event) => {
  try {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'New Todo';
    const options = {
      body: data.body || 'A new task was created',
      icon: data.icon || '/PWA-192.png',
      badge: data.badge || '/PWA-192.png',
      data: {
        url: data.url || '/',
        ...data
      }
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
    // fallback if payload isn't JSON
    event.waitUntil(self.registration.showNotification('New Todo', {
      body: 'A new task was created',
    }));
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification && event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// Attempt to resubscribe if the push subscription changes (edge case)
self.addEventListener('pushsubscriptionchange', async (event) => {
  try {
    const applicationServerKey = self.applicationServerKey || undefined;
    const subscription = await self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
    // Notify clients to persist new subscription
    const allClients = await clients.matchAll({ includeUncontrolled: true });
    for (const client of allClients) {
      client.postMessage({ type: 'PUSH_SUBSCRIPTION_CHANGED', payload: subscription });
    }
  } catch (e) {
    // ignore
  }
});
