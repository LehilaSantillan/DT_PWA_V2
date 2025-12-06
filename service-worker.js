// Nombre del caché principal
const CACHE_STATIC_NAME = 'static-v1';
const CACHE_DYNAMIC_NAME = 'dynamic-v1';
const CACHE_INMUTABLE_NAME = 'inmutable-v1';

// Recursos estáticos que se almacenarán en Cache First (Cache First)
const APP_SHELL = [
    '/',
    '/index.html',
    '/page1.html',
    '/styles.css',
    '/manifest.json',
    // Rutas de iconos, ajusta según tu estructura de carpetas
    '/images/icon.png', 
    // Asegúrate de incluir cualquier archivo JS principal
];

// Recursos que no cambiarán, como librerías CDN (Cache First)
const APP_SHELL_INMUTABLE = [
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
    // ... cualquier otro CDN (Bootstrap, jQuery, etc.)
];

// Función para guardar en caché
function actualizaCacheDinamico(dynamicCache, request, response) {
    if (response.ok) {
        return caches.open(dynamicCache).then(cache => {
            cache.put(request, response.clone());
            return response.clone();
        });
    } else {
        return response;
    }
}


// --- 1. INSTALACIÓN ---
self.addEventListener('install', e => {

    const cacheStatic = caches.open(CACHE_STATIC_NAME).then(cache => 
        cache.addAll(APP_SHELL)
    );

    const cacheInmutable = caches.open(CACHE_INMUTABLE_NAME).then(cache => 
        cache.addAll(APP_SHELL_INMUTABLE)
    );

    e.waitUntil(Promise.all([cacheStatic, cacheInmutable]));

});

// --- 2. ACTIVACIÓN (Limpieza de cachés antiguas) ---
self.addEventListener('activate', e => {
    
    const respuesta = caches.keys().then(keys => {

        keys.forEach(key => {

            if (key !== CACHE_STATIC_NAME && key.includes('static')) {
                return caches.delete(key);
            }
            if (key !== CACHE_DYNAMIC_NAME && key.includes('dynamic')) {
                return caches.delete(key);
            }
        });
    });

    e.waitUntil(respuesta);
});

// --- 3. ESTRATEGIAS DE CACHÉ (FETCH) ---
self.addEventListener('fetch', e => {

    // 1. CACHE FIRST (Para recursos estáticos: APP_SHELL y APP_SHELL_INMUTABLE)
    // Intenta buscar en caché primero. Si no está, ve a la red.
    const respuesta = caches.match(e.request).then(res => {

        if (res) {
            // Si lo encontramos en caché estática o inmutable, lo devolvemos
            return res;
        } else {
            // Si NO está en caché, vamos a la red
            return fetch(e.request).then(newRes => {
                // Y lo guardamos en caché dinámica (Cache Dynamic)
                return actualizaCacheDinamico(CACHE_DYNAMIC_NAME, e.request, newRes);
            });
        }
    });


    // 2. NETWORK FIRST (Para APIs o datos que deben estar actualizados)
    /*
    const respuesta = fetch(e.request).then(res => {
        // Guarda la nueva respuesta en caché dinámica si es exitosa
        return actualizaCacheDinamico(CACHE_DYNAMIC_NAME, e.request, res);
    }).catch(err => {
        // Si falla la red, busca en caché
        return caches.match(e.request);
    });
    */

    e.respondWith(respuesta);
});


// --- 4. CONFIGURACIÓN DE PUSH NOTIFICATIONS ---
// Necesitarás un servidor para la lógica de las notificaciones, 
// pero esta es la estructura básica del Service Worker.
self.addEventListener('push', e => {
    // Aquí manejarías el mensaje de la notificación
    const data = e.data.json(); 
    
    const title = data.title || 'Nueva Notificación';
    const options = {
        body: data.body || 'Tienes un nuevo mensaje.',
        icon: '/images/icons/icon.png', // Usa un icono de tu manifest
        badge: '/images/icons/badge.png', // Un icono más pequeño para algunos SO
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/' // URL a abrir al hacer clic
        }
    };
    
    e.waitUntil(self.registration.showNotification(title, options));
});

// Maneja el clic en la notificación
self.addEventListener('notificationclick', e => {
    const notificacion = e.notification;
    const action = e.action;

    if (action === 'close') {
        notificacion.close();
    } else {
        const url = notificacion.data.url || '/';
        e.waitUntil(
            clients.openWindow(url)
        );
    }
});