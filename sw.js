/* el_Pomiary – service worker (praca offline) */
const VERSION = 'el-pomiary-v1.3.2';
const ASSETS = [
  './', './index.html', './manifest.webmanifest', './css/tokens.css', './css/bundle.css', './css/app.css',
  './js/model.js', './js/db.js', './js/export.js', './js/app.js',
  './lib/exceljs.min.js', './lib/jspdf.umd.min.js', './lib/jspdf.plugin.autotable.min.js', './fonts/fonts.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
self.addEventListener('message', e => { if (e.data === 'skipWaiting') self.skipWaiting(); });
