// Service Worker: Spiel offline verfügbar machen. Seite und config.js: erst Netz, dann Cache.
const C='iq-trainer-v6';
const CORE=['./','index.html','config.js','manifest.webmanifest','icon.svg','icon-192.png','player.glb','three-shim.js','fonts/bebas-neue-latin.woff2','fonts/nunito-latin.woff2','legal.css','impressum.html','datenschutz.html','lizenzen.html','https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(CORE)).catch(()=>{}));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||u.hostname==='firestore.googleapis.com')return;
  const page=r.mode==='navigate'||u.pathname.endsWith('.html')||u.pathname.endsWith('/config.js');
  if(page){e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(C).then(c=>c.put(r,cp));return res;}).catch(()=>caches.match(r).then(m=>m||caches.match('./'))));return;}
  e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{if(res.ok||res.type==='opaque'){const cp=res.clone();caches.open(C).then(c=>c.put(r,cp));}return res;})));
});
