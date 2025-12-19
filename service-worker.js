self.addEventListener('install', e => {
  e.waitUntil(
    caches.open('listmercadao-v1').then(cache => {
      return cache.addAll([
        './',
        './index.html',
        './assets/css/style.css',
        './assets/js/app.js'
      ]);
    })
  );
});
