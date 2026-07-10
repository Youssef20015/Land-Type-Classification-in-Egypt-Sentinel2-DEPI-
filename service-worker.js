const CACHE_NAME = 'globeclass-pwa-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/classify/index.html',
    '/static/css/style.css',
    '/static/js/app.js',
    '/static/js/globe.js',
    '/static/js/i18n.js',
    '/static/js/models-carousel.js',
    '/static/js/legacy-tabs.js',
    '/static/images/app-icon.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        }).catch(err => console.log('Manifest caching failed:', err))
    );
});

self.addEventListener('fetch', (event) => {
    // Only cache GET requests
    if (event.request.method !== 'GET') return;
    
    // Attempt to return from cache, else fetch from network
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        }).catch(() => {
            // Offline fallback could potentially go here if network and cache fail
            console.log('Fetch failed, offline?');
        })
    );
});
