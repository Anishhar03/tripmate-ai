const CACHE="tripmate-ai-v1";
const CORE=["/tripmate-ai/","/tripmate-ai/app.js","/tripmate-ai/src/styles.css","/tripmate-ai/public/manifest.webmanifest","/tripmate-ai/public/favicon.svg","/tripmate-ai/public/lucide.min.js","/tripmate-ai/public/kyoto.jpg","/tripmate-ai/public/lisbon.jpg","/tripmate-ai/public/cappadocia.jpg","/tripmate-ai/public/travelers.jpg"];
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)))});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))))});
self.addEventListener("fetch",event=>{if(event.request.method!=="GET")return;event.respondWith(fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response}).catch(()=>caches.match(event.request).then(cached=>cached||caches.match("/tripmate-ai/"))))});
