const V='dutybuddy-294af921';
const CORE=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-180.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET')return; const u=new URL(r.url);
  if(u.hostname==='api.anthropic.com')return;
  if(u.origin===location.origin){
    // app files: open instantly from the phone, refresh quietly when online
    e.respondWith(caches.open(V).then(c=>c.match(r,{ignoreSearch:true}).then(hit=>{
      const net=fetch(r).then(res=>{if(res.ok)c.put(r,res.clone()); return res;}).catch(()=>hit);
      return hit||net;
    })));
    return;
  }
  // fonts and the Excel/PDF readers: keep a copy after first use so they also work offline
  e.respondWith(caches.open(V).then(c=>c.match(r).then(hit=>hit||fetch(r).then(res=>{if(res.ok||res.type==='opaque')c.put(r,res.clone()); return res;}).catch(()=>hit))));
});
