// Service Worker for GitInsight Application
const CACHE_NAME = 'gitinsight-cache-v1';

// Resources to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/style.min.css',
  '/css/improved-layout.min.css',
  '/js/bundle.min.js',
  '/favicon.svg',
  '/favicon.ico',
  // Add other static assets like images
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - network first with cache fallback strategy
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests and API calls
  if (!event.request.url.startsWith(self.location.origin) || 
      event.request.url.includes('/api/')) {
    return;
  }

  // For HTML documents, always go to network first
  if (event.request.headers.get('Accept').includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the latest version
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clonedResponse);
          });
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(event.request);
        })
    );
    return;
  }

  // For static assets, try cache first, then network
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Not in cache, get from network
        return fetch(event.request)
          .then((response) => {
            // Cache the response for future
            if (response.ok && response.type === 'basic') {
              const clonedResponse = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, clonedResponse);
              });
            }
            return response;
          });
      })
  );
});

// Handle background sync for offline usage
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-repository-data') {
    event.waitUntil(syncRepositoryData());
  }
});

// Function to sync data when coming back online
async function syncRepositoryData() {
  // Get all pending requests from IndexedDB
  const db = await openDatabase();
  const pendingRequests = await getPendingRequests(db);
  
  // Process each pending request
  for (const request of pendingRequests) {
    try {
      // Retry the request
      await fetch(request.url, {
        method: request.method,
        headers: request.headers,
        body: request.body
      });
      
      // Remove from pending if successful
      await removePendingRequest(db, request.id);
    } catch (error) {
      console.error('Sync failed for request:', request, error);
    }
  }
}

// Helper functions for IndexedDB
function openDatabase() {
  return new Promise((resolve, reject) => {
    const dbRequest = indexedDB.open('gitinsight-offline', 1);
    
    dbRequest.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingRequests')) {
        db.createObjectStore('pendingRequests', { keyPath: 'id', autoIncrement: true });
      }
    };
    
    dbRequest.onerror = () => reject(dbRequest.error);
    dbRequest.onsuccess = () => resolve(dbRequest.result);
  });
}

function getPendingRequests(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('pendingRequests', 'readonly');
    const store = transaction.objectStore('pendingRequests');
    const getAllRequest = store.getAll();
    
    getAllRequest.onerror = () => reject(getAllRequest.error);
    getAllRequest.onsuccess = () => resolve(getAllRequest.result);
  });
}

function removePendingRequest(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('pendingRequests', 'readwrite');
    const store = transaction.objectStore('pendingRequests');
    const deleteRequest = store.delete(id);
    
    deleteRequest.onerror = () => reject(deleteRequest.error);
    deleteRequest.onsuccess = () => resolve();
  });
}