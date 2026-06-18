// Nombre del caché local. Al actualizar esta versión (v1 -> v2), se limpiará la memoria anterior.
const CACHE_NAME = 'todo-ya-cache-v1';

// Recursos básicos que deben guardarse de inmediato al instalar el Service Worker
const urlsToCache = [
  '/',
  '/manifest.json'
];

/**
 * Evento 'install': Ocurre cuando el navegador detecta por primera vez este Service Worker.
 * Abre el almacenamiento en caché y guarda las rutas esenciales especificadas.
 * skipWaiting() fuerza a este SW a activarse sin esperar a que el usuario cierre otras pestañas de la app.
 */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

/**
 * Evento 'activate': Ocurre después de que el SW se instala con éxito y toma el control.
 * Aquí limpiamos versiones antiguas de la caché para liberar espacio en el dispositivo del usuario.
 * self.clients.claim() permite que el SW comience a controlar las páginas activas de inmediato.
 */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Limpiando caché antigua obsoleta');
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

/**
 * Evento 'fetch': Intercepta todas las peticiones de red realizadas por la app.
 * Implementa la estrategia "Stale-While-Revalidate":
 * 1. Si el recurso ya está en la caché, se devuelve instantáneamente para carga inmediata.
 * 2. En paralelo, se hace la petición real a la red para actualizar la caché en segundo plano.
 * 3. Si el recurso no estaba en caché, se descarga de internet y se guarda para la próxima visita.
 */
self.addEventListener('fetch', event => {
  // Solo interceptamos peticiones GET (lecturas) para no interferir con envíos de formularios o APIs POST/PUT
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // El recurso está en caché. Lo devolvemos de inmediato y buscamos la versión más reciente en segundo plano.
          fetch(event.request).then(networkResponse => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse));
            }
          }).catch(err => console.log('Actualización en segundo plano de SW falló:', err));

          return cachedResponse;
        }

        // Si no está en caché, lo solicitamos a la red normalmente
        return fetch(event.request).then(networkResponse => {
          // Verificar respuesta válida antes de guardarla en la caché
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          
          // Clonamos la respuesta porque el flujo de respuesta solo se puede leer una vez
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
          return networkResponse;
        }).catch(() => {
          // Manejo en caso de desconexión total a internet y recurso no pre-guardado
        });
      })
  );
});
