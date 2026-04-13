const CACHE_NAME = 'autogestion-v1'
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
]

// Install event - cachear archivos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  )
})

// Activate event - limpiar caches viejos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', event => {
  // Solo cachear GET requests
  if (event.request.method !== 'GET') {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // No cachear respuestas no-OK
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response
        }

        // Clonar la respuesta
        const responseToCache = response.clone()
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseToCache)
          })

        return response
      })
      .catch(() => {
        // Fallback a cache si offline
        return caches.match(event.request)
      })
  )
})
