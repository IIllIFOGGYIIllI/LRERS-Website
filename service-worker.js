const CACHE = "lrers-site-v0.3.0";
const ASSETS = ["./","index.html","assets/css/styles.css","assets/js/config.js","assets/js/api.js","assets/js/views.js","assets/js/app.js","assets/img/lrers-icon.png","assets/img/lrers-server-logo.png"];
self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))); });
self.addEventListener("activate", e => e.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))])));
self.addEventListener("fetch", e => { if (e.request.method !== "GET") return; const u=new URL(e.request.url); if (u.origin !== location.origin) return; e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c));return r;}).catch(()=>caches.match(e.request))); });
