/* App de prevención: guarda la app en el teléfono para que abra aunque no haya señal. */
const VERSION = 'pv-202611070135';
const BASE = ['./', 'index.html', 'manifest.webmanifest', 'favicon.png', 'apple-touch-icon.png', 'icono-192.png', 'icono-512.png', 'logo-carga.jpg'];
const CDN = /^(https:\/\/(cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|unpkg\.com)\/)/;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(BASE.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;                                   // envíos al sistema: nunca se tocan
  if (url.origin === location.origin) {
    if (url.pathname.includes('/panel/')) return;                     // el panel no se guarda
    // primero internet (para recibir actualizaciones); sin señal, lo guardado
    e.respondWith(fetch(req).then(r => {
      if (r.ok) { const cp = r.clone(); caches.open(VERSION).then(c => c.put(req.mode === 'navigate' ? 'index.html' : req, cp)); }
      return r;
    }).catch(() => caches.match(req.mode === 'navigate' ? 'index.html' : req, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
    return;
  }
  if (CDN.test(req.url)) {                                            // mapa y lector de códigos: se guardan al usarlos
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { const cp = r.clone(); caches.open(VERSION).then(c => c.put(req, cp)); return r; })));
  }
});
