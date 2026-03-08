/**
 * serviceWorker.js — Кэш-первый SW для офлайн-работы
 */

var CACHE_NAME  = 'spamton-v1';
var CACHE_FIRST = [
    '/css/auth.css',
    '/css/index.css',
    '/css/deltaruneSavefile.css',
    '/css/library.css',
    '/css/collections.css',
    '/css/admin.css',
    '/css/enhancements.css',
    '/fonts/determination-mono-web-font/',
    '/js/editorCore.js',
    '/js/extraFunctions.js',
    '/js/generateInput.js',
    '/js/siteEnhancements.js',
    '/js/editorEnhancements.js',
    '/js/translations/translationManager.js',
    '/js/translations/uiFormLabels.js',
];

self.addEventListener('install', function (e) {
    e.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return Promise.allSettled(
                CACHE_FIRST.map(function (url) {
                    return cache.add(url).catch(function () {});
                })
            );
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', function (e) {
    e.waitUntil(
        caches.keys().then(function (keys) {
            return Promise.all(
                keys.filter(function (k) { return k !== CACHE_NAME; })
                    .map(function (k) { return caches.delete(k); })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', function (e) {
    var req = e.request;
    if (req.method !== 'GET') return;

    var url = new URL(req.url);

    // Не кэшируем API и supabase
    if (url.pathname.startsWith('/api/') || url.host.indexOf('supabase') >= 0) {
        e.respondWith(fetch(req));
        return;
    }

    // CSS / JS / Fonts → cache-first
    if (/\.(css|js|woff2?|ttf|eot)$/.test(url.pathname)) {
        e.respondWith(
            caches.match(req).then(function (cached) {
                return cached || fetch(req).then(function (res) {
                    return caches.open(CACHE_NAME).then(function (cache) {
                        cache.put(req, res.clone());
                        return res;
                    });
                });
            })
        );
        return;
    }

    // HTML → network-first
    if (req.headers.get('accept') && req.headers.get('accept').indexOf('text/html') >= 0) {
        e.respondWith(
            fetch(req)
                .then(function (res) {
                    return caches.open(CACHE_NAME).then(function (cache) {
                        cache.put(req, res.clone());
                        return res;
                    });
                })
                .catch(function () {
                    return caches.match(req).then(function (c) {
                        return c || caches.match('/404.html');
                    });
                })
        );
        return;
    }

    // Images → cache-first
    e.respondWith(
        caches.match(req).then(function (cached) {
            return cached || fetch(req);
        })
    );
});
