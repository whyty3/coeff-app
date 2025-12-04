// Minimal Service Worker to satisfy PWA install criteria
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  // Just pass requests through (Network Only strategy)
  // This ensures we always get fresh data for the risk engine
  e.respondWith(fetch(e.request));
});