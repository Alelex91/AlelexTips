
const CACHE_NAME = 'neotip-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/index.tsx',
  '/manifest.json',
  'https://img.icons8.com/neon/512/matrix.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
