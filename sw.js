const CACHE_NAME = 'meal-tracker-v1';

// Install - cache the main files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cache main files
      return Promise.all([
        cache.add('/meal-tracker/'),
        cache.add('/meal-tracker/index.html'),
        cache.add('/meal-tracker/manifest.json')
      ]).catch(err => {
        // If specific paths fail, just continue
        console.log('Some assets may not be offline-available', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch - serve from network first, fall back to cache
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.includes(self.location.origin)) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed - try cache
        return caches.match(event.request).then(response => {
          if (response) {
            return response;
          }
          // If not in cache, serve index.html for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/meal-tracker/index.html');
          }
          return new Response('Offline - try refreshing', { status: 503 });
        });
      })
  );
});
