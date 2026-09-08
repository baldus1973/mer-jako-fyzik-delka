const VERSION='0.6.0';
const CACHE_PREFIX='mer-jako-fyzik-delka-';
const CACHE_NAME=`${CACHE_PREFIX}v${VERSION}`;
const APP_SHELL=['./','./index.html','./styles.css','./physics.js','./app.js','./manifest.webmanifest','./icons/icon.svg','./icons/icon-192.png'];
function isInOwnScope(requestUrl){const scopeUrl=new URL(self.registration.scope);const url=new URL(requestUrl);return url.origin===scopeUrl.origin&&url.href.startsWith(scopeUrl.href)}
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{const{request}=event;if(request.method!=='GET'||!isInOwnScope(request.url))return;if(request.mode==='navigate'){event.respondWith((async()=>{try{const fresh=await fetch(request);if(fresh.ok){const cache=await caches.open(CACHE_NAME);cache.put('./index.html',fresh.clone())}return fresh}catch{const cached=await caches.match('./index.html');return cached||Response.error()}})());return}event.respondWith((async()=>{const cached=await caches.match(request);if(cached)return cached;const response=await fetch(request);if(response.ok&&new URL(request.url).origin===self.location.origin){const cache=await caches.open(CACHE_NAME);cache.put(request,response.clone())}return response})())});
