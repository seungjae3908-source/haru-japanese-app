const CACHE='haru-language-v03';
const ASSETS=['./','./index.html','./styles.css','./styles-v03.css','./manifest.webmanifest','./src/data.js','./src/storage.js','./src/learning.js','./src/speech.js','./src/diagnostic.js','./src/reading.js','./src/ui.js','./src/main.js'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
    const copy=response.clone();
    caches.open(CACHE).then(cache=>cache.put(event.request,copy));
    return response;
  }).catch(()=>event.request.mode==='navigate'?caches.match('./index.html'):undefined)));
});
