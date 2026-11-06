/* Offline-Cache: App-Hülle + Kursinhalte. Bei jedem Deploy VERSION erhöhen. */
const VERSION = 'lc-v1';
const CORE = ['./', './index.html', './style.css', './app.js', './manifest.webmanifest', './icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    await c.addAll(CORE).catch(() => {});
    try {
      const idx = await (await fetch('kurse/index.json', { cache: 'no-store' })).json();
      await c.addAll(['kurse/index.json', ...idx.kurse.map(f => 'kurse/' + f)]);
    } catch (e) {}
    self.skipWaiting();
  })());
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== VERSION) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith((async () => {
    const c = await caches.open(VERSION);
    const url = new URL(e.request.url);
    const key = url.origin + url.pathname;            // Cache-Buster ignorieren
    try {
      const net = await fetch(e.request, { cache: 'no-store' });
      if (net && net.ok) c.put(key, net.clone());
      return net;
    } catch (err) {
      return (await c.match(key)) || (await c.match('./index.html')) ||
        new Response('offline', { status: 503 });
    }
  })());
});
