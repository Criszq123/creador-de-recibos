/**
 * SW.JS - SERVICE WORKER PARA MODO 100% OFFLINE / PWA
 * Pre-cachea el app shell y recursos locales para permitir el uso sin conexión a internet.
 */

const CACHE_NAME = 'recibos-pwa-v5';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './assets/icon.svg',
  './assets/watermark-default.svg',
  './css/app.css',
  './css/receipt-print.css',
  './js/libs/html2canvas.min.js',
  './js/libs/jspdf.umd.min.js',
  './js/utils/helpers.js',
  './js/number-to-words.js',
  './js/models/receipt.js',
  './js/services/storage-service.js',
  './js/services/share-service.js',
  './js/services/pdf-service.js',
  './js/views/receipt-view.js',
  './js/views/form-view.js',
  './js/views/settings-modal-view.js',
  './js/app.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Solo procesar peticiones HTTP/HTTPS GET locales
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // Almacenar en caché si es una petición válida
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // En caso de fallo de red total, si es navegación devolver index.html en caché
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
