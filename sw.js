// Service Worker: Spiel offline verfügbar machen. Seite und config.js: erst Netz, dann Cache.
const C='iq-trainer-v12';
const CORE=['./','index.html','config.js','manifest.webmanifest','icon.svg','icon-192.png','player.glb','three-shim.js','fonts/bebas-neue-latin.woff2','fonts/nunito-latin.woff2','legal.css','impressum.html','datenschutz.html','lizenzen.html','sfx/catch1.mp3','sfx/catch2.mp3','sfx/catch3.mp3','sfx/dribble1.mp3','sfx/dribble2.mp3','sfx/rim1.mp3','sfx/rim2.mp3','sfx/rim3.mp3','sfx/squeak1.mp3','sfx/squeak2.mp3','sfx/squeak3.mp3','sfx/step1.mp3','sfx/step2.mp3','sfx/swish1.mp3','sfx/swish2.mp3','sfx/swish3.mp3','voice/hit.mp3','voice/hit2.mp3','voice/look.mp3','voice/miss.mp3','voice/nudge.mp3','voice/nudge2.mp3','voice/nudge2_w.mp3','voice/nudge_w.mp3','voice/q_ball.mp3','voice/q_bh.mp3','voice/q_bh_w.mp3','voice/q_def.mp3','voice/q_def_w.mp3','voice/q_free.mp3','voice/q_had.mp3','voice/q_help.mp3','voice/q_opp.mp3','voice/q_opp2.mp3','voice/q_opp2_w.mp3','voice/q_opp_w.mp3','voice/q_pass.mp3','voice/q_safe.mp3','voice/q_thru.mp3','voice/sol.mp3','voice/tap.mp3','voice/time.mp3','https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(CORE)).catch(()=>{}));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||u.hostname==='firestore.googleapis.com')return;
  const page=r.mode==='navigate'||u.pathname.endsWith('.html')||u.pathname.endsWith('/config.js');
  if(page){e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(C).then(c=>c.put(r,cp));return res;}).catch(()=>caches.match(r).then(m=>m||caches.match('./'))));return;}
  e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{if(res.ok||res.type==='opaque'){const cp=res.clone();caches.open(C).then(c=>c.put(r,cp));}return res;})));
});
