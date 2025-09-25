// AI Gallery Service Worker
// Version: 1.0.0

const CACHE_NAME = 'ai-gallery-v1.0.0';
const STATIC_CACHE = 'ai-gallery-static-v1';
const DYNAMIC_CACHE = 'ai-gallery-dynamic-v1';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/manifest.json',
  // External resources that are critical
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Files to cache on first access
const DYNAMIC_FILES = [
  // Unsplash images will be cached dynamically when accessed
];

// Install event - cache static files
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      console.log('Service Worker: Caching static files');
      return cache.addAll(STATIC_FILES.map(url => {
        return new Request(url, { cache: 'reload' });
      }));
    }).then(() => {
      console.log('Service Worker: Static files cached successfully');
      return self.skipWaiting();
    }).catch(error => {
      console.error('Service Worker: Failed to cache static files', error);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activated successfully');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle different types of requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Handle static assets
  if (isStaticAsset(url)) {
    event.respondWith(handleStaticAssetRequest(request));
    return;
  }

  // Handle API requests
  if (isApiRequest(url)) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle image requests
  if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request));
    return;
  }

  // Default: cache-first strategy
  event.respondWith(handleDefaultRequest(request));
});

// Handle navigation requests (HTML pages)
async function handleNavigationRequest(request) {
  try {
    // Try network first for navigation
    const response = await fetch(request);
    return response;
  } catch (error) {
    // If offline, serve cached index.html
    console.log('Service Worker: Serving cached navigation for', request.url);
    const cache = await caches.open(STATIC_CACHE);
    return cache.match('/index.html') || cache.match('/');
  }
}

// Handle static assets (CSS, JS)
async function handleStaticAssetRequest(request) {
  // Cache first strategy for static assets
  const cache = await caches.open(STATIC_CACHE);
  let response = await cache.match(request);
  
  if (response) {
    return response;
  }

  try {
    response = await fetch(request);
    // Cache successful responses
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('Service Worker: Static asset not available offline', request.url);
    // Could return a fallback asset here
    throw error;
  }
}

// Handle API requests
async function handleApiRequest(request) {
  try {
    // Always try network first for API calls
    const response = await fetch(request);
    
    // Cache successful GET requests
    if (request.method === 'GET' && response.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // If offline, try to serve from cache
    if (request.method === 'GET') {
      const cache = await caches.open(DYNAMIC_CACHE);
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        console.log('Service Worker: Serving cached API response for', request.url);
        return cachedResponse;
      }
    }
    throw error;
  }
}

// Handle image requests with fallback
async function handleImageRequest(request) {
  // Try cache first for images
  const cache = await caches.open(DYNAMIC_CACHE);
  let response = await cache.match(request);
  
  if (response) {
    return response;
  }

  try {
    response = await fetch(request);
    // Cache successful responses
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('Service Worker: Image not available offline', request.url);
    // Return a fallback image
    return createFallbackImage();
  }
}

// Handle default requests
async function handleDefaultRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  try {
    const response = await fetch(request);
    // Cache successful responses
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Try to serve from cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Utility functions
function isStaticAsset(url) {
  return url.pathname.endsWith('.css') || 
         url.pathname.endsWith('.js') || 
         url.pathname.endsWith('.json') ||
         url.hostname === 'cdnjs.cloudflare.com';
}

function isApiRequest(url) {
  return url.pathname.startsWith('/api/') || 
         url.hostname !== self.location.hostname;
}

function isImageRequest(request) {
  return request.destination === 'image' ||
         /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(request.url);
}

// Create fallback image for offline scenarios
function createFallbackImage() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
      <rect width="400" height="300" fill="#1a1a25"/>
      <rect x="50" y="50" width="300" height="200" fill="none" stroke="#00d9ff" stroke-width="2" stroke-dasharray="5,5"/>
      <circle cx="150" cy="120" r="20" fill="#00d9ff" opacity="0.5"/>
      <path d="M100 180 L150 130 L200 160 L250 120 L300 140" stroke="#00d9ff" stroke-width="2" fill="none"/>
      <text x="200" y="220" text-anchor="middle" fill="#666" font-family="Arial" font-size="14">
        Image unavailable offline
      </text>
    </svg>
  `;
  
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  return new Response(blob, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'no-cache'
    }
  });
}

// Handle background sync for when connection is restored
self.addEventListener('sync', event => {
  console.log('Service Worker: Background sync triggered', event.tag);
  
  if (event.tag === 'gallery-sync') {
    event.waitUntil(syncGalleryData());
  }
});

// Sync gallery data when online
async function syncGalleryData() {
  try {
    // Get any pending data from IndexedDB or localStorage
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_GALLERY_DATA',
        payload: { status: 'syncing' }
      });
    });
    
    console.log('Service Worker: Gallery data sync completed');
  } catch (error) {
    console.error('Service Worker: Gallery data sync failed', error);
  }
}

// Handle push notifications (if needed in the future)
self.addEventListener('push', event => {
  console.log('Service Worker: Push message received');
  
  const options = {
    body: event.data ? event.data.text() : 'New update available!',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Explore',
        icon: '/action-explore.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/action-close.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('AI Gallery', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Notification click received');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // Just close, no action needed
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Send message to clients
self.addEventListener('message', event => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'gallery-update') {
    event.waitUntil(checkForGalleryUpdates());
  }
});

// Check for gallery updates
async function checkForGalleryUpdates() {
  try {
    // This would typically check a remote API for updates
    console.log('Service Worker: Checking for gallery updates');
    
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'GALLERY_UPDATE_CHECK',
        payload: { hasUpdates: false }
      });
    });
  } catch (error) {
    console.error('Service Worker: Failed to check for updates', error);
  }
}

console.log('Service Worker: Loaded successfully');