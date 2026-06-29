const CACHE_NAME = 'casa-expenses-v4';
const STATIC_ASSETS = [
  './fonts/Fraunces-Regular.woff2',
  './fonts/Fraunces-SemiBold.woff2',
  './fonts/Inter-Regular.woff2',
  './fonts/Inter-Medium.woff2',
  './fonts/Inter-SemiBold.woff2',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
];
const APP_SHELL = ['./', './index.html', './styles.css', './app.js', './manifest.json'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll([...STATIC_ASSETS, ...APP_SHELL])));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const isAppShell = APP_SHELL.some((path) => event.request.url.endsWith(path.replace('./', '/')));

  if (isAppShell) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
