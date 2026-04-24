const CACHE_NAME = 'jampa-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/assets/css/style.css',
  '/assets/js/main.js',
  '/assets/js/state.js',
  '/assets/js/storage.js',
  '/assets/js/utils.js',
  '/assets/js/views/admin.js',
  '/assets/js/views/driver.js',
  '/assets/js/views/login.js',
  '/assets/images/logo.png',
  '/assets/images/cacamba.png'
];

// Instalação e Cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Ativação e Limpeza de Cache antigo
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    })
  );
});

// Estratégia: Network First, falling back to cache
// Ideal para apps que precisam de dados atualizados mas devem funcionar offline
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
