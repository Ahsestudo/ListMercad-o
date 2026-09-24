/**
 * Cache de recursos estáticos do PWA.
 * Atualize CACHE ao publicar alterações para descartar versões antigas.
 * Este service worker não implementa notificações push em segundo plano.
 */
const CACHE = 'listmercadao-v3-organizado-1';
const ASSETS = [
  './', './index.html', './manifest.json', './assets/css/style.css',
  './assets/js/app.js', './assets/js/tarefas-plus.js',
  './assets/icons/icon-192.png', './assets/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Armazene apenas respostas bem-sucedidas da mesma origem.
        if (response.ok && new URL(event.request.url).origin === self.location.origin) {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE).then((cache) => cache.put(event.request, copy)));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then(
        (cached) => cached || (event.request.mode === 'navigate' ? caches.match('./index.html') : Response.error())
      ))
  );
});
