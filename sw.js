// Service Worker para App Treino
// Versão: 1.0.0

const CACHE_NAME = 'app-treino-v1';
const CACHE_VERSION = '1.0.0';

// Arquivos essenciais para cache (offline-first)
const CORE_FILES = [
  '/',
  '/index.html',
  '/styles.css',
  '/config.js',
  '/favicon.png',
  '/manifest.json',
  '/icons/icon-144x144.png'
];

// Arquivos de funcionalidades (cache when needed)
const FEATURE_FILES = [
  '/feature/dashboard.js',
  '/feature/login.js',
  '/feature/planning.js',
  '/feature/workout.js',
  '/feature/workoutExecution.js',
  '/services/integrationService.js',
  '/services/weightCalculatorService.js',
  '/services/workoutProtocolService.js',
  '/components/MetricsWidget.js',
  '/hooks/useWeeklyPlan.js',
  '/utils/reactiveUI.js',
  '/utils/weekPlanStorage.js'
];

// URLs que sempre precisam de rede (não cachear)
const NETWORK_ONLY = [
  '/api/',
  'supabase.co',
  'googleapis.com'
];

// Install Event - Cache recursos essenciais
self.addEventListener('install', event => {
  console.log('[SW] Instalando Service Worker v' + CACHE_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Cacheando arquivos essenciais');
        return cache.addAll(CORE_FILES);
      })
      .then(() => {
        console.log('[SW] ✅ Arquivos essenciais cacheados');
        return self.skipWaiting(); // Ativa imediatamente
      })
      .catch(error => {
        console.error('[SW] ❌ Erro ao cachear arquivos essenciais:', error);
      })
  );
});

// Activate Event - Limpa caches antigos
self.addEventListener('activate', event => {
  console.log('[SW] Ativando Service Worker v' + CACHE_VERSION);
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] 🗑️ Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] ✅ Service Worker ativado');
        return self.clients.claim(); // Controla todas as abas
      })
  );
});

// Fetch Event - Estratégia de cache
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Ignorar requisições não-HTTP
  if (!event.request.url.startsWith('http')) {
    return;
  }
  
  // Network-only para APIs específicas
  if (NETWORK_ONLY.some(pattern => url.href.includes(pattern))) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // Estratégia Cache-First para recursos estáticos
  if (isStaticResource(event.request)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }
  
  // Estratégia Network-First para pages/data
  event.respondWith(networkFirst(event.request));
});

// Cache-First Strategy
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Cache hit - retorna do cache
      return cachedResponse;
    }
    
    // Cache miss - busca da rede e cacheia
    const networkResponse = await fetch(request);
    
    if (networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('[SW] Erro cache-first:', error);
    
    // Se for um recurso de imagem/ícone ausente, retorna uma resposta vazia
    if (request.url.includes('favicon') || request.url.includes('icon-')) {
      return new Response('', { status: 404, statusText: 'Not Found' });
    }
    
    // Fallback para página offline se disponível
    if (request.destination === 'document') {
      const fallback = await caches.match('/');
      if (fallback) return fallback;
    }
    
    throw error;
  }
}

// Network-First Strategy
async function networkFirst(request) {
  try {
    // Tenta buscar da rede primeiro
    const networkResponse = await fetch(request);
    
    if (networkResponse.status === 200) {
      // Sucesso - cacheia a resposta
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.warn('[SW] Network falhou, tentando cache:', error.message);
    
    // Network falhou - tenta buscar do cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallbacks específicos
    if (request.destination === 'document') {
      const fallback = await caches.match('/');
      if (fallback) return fallback;
    }
    
    throw error;
  }
}

// Verifica se é recurso estático
function isStaticResource(request) {
  const url = new URL(request.url);
  
  // Extensões de arquivos estáticos
  const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2'];
  
  return staticExtensions.some(ext => url.pathname.endsWith(ext)) ||
         CORE_FILES.includes(url.pathname) ||
         FEATURE_FILES.includes(url.pathname);
}

// Background Sync para upload de dados offline
self.addEventListener('sync', event => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'workout-data-sync') {
    event.waitUntil(syncWorkoutData());
  }
  
  if (event.tag === 'planning-data-sync') {
    event.waitUntil(syncPlanningData());
  }
});

// Sincronizar dados de treino offline
async function syncWorkoutData() {
  try {
    console.log('[SW] Sincronizando dados de treino...');
    
    // Buscar dados pendentes do IndexedDB/localStorage
    const pendingWorkouts = await getPendingWorkouts();
    
    for (const workout of pendingWorkouts) {
      try {
        // Enviar para o servidor
        await fetch('/api/workouts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(workout)
        });
        
        // Remover da fila local
        await removePendingWorkout(workout.id);
        console.log('[SW] ✅ Treino sincronizado:', workout.id);
        
      } catch (error) {
        console.error('[SW] ❌ Erro ao sincronizar treino:', workout.id, error);
      }
    }
    
  } catch (error) {
    console.error('[SW] Erro na sincronização de treinos:', error);
  }
}

// Sincronizar dados de planejamento offline
async function syncPlanningData() {
  try {
    console.log('[SW] Sincronizando dados de planejamento...');
    
    const pendingPlans = await getPendingPlans();
    
    for (const plan of pendingPlans) {
      try {
        await fetch('/api/planning', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(plan)
        });
        
        await removePendingPlan(plan.id);
        console.log('[SW] ✅ Planejamento sincronizado:', plan.id);
        
      } catch (error) {
        console.error('[SW] ❌ Erro ao sincronizar planejamento:', plan.id, error);
      }
    }
    
  } catch (error) {
    console.error('[SW] Erro na sincronização de planejamentos:', error);
  }
}

// Push Notifications
self.addEventListener('push', event => {
  console.log('[SW] Push notification recebida');
  
  let data = {};
  if (event.data) {
    data = event.data.json();
  }
  
  const options = {
    title: data.title || 'App Treino',
    body: data.body || 'Hora do seu treino!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    image: data.image,
    data: data.data,
    actions: [
      {
        action: 'start-workout',
        title: 'Iniciar Treino',
        icon: '/icons/icon-96x96.png'
      },
      {
        action: 'dismiss',
        title: 'Dispensar',
        icon: '/icons/icon-96x96.png'
      }
    ],
    requireInteraction: true,
    silent: false,
    vibrate: [200, 100, 200]
  };
  
  event.waitUntil(
    self.registration.showNotification(options.title, options)
  );
});

// Notification Click
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'start-workout') {
    // Abrir app e iniciar treino
    event.waitUntil(
      clients.openWindow('/?action=start-workout')
    );
  } else if (event.action === 'dismiss') {
    // Apenas fechar notificação
    return;
  } else {
    // Click na notificação (não na ação)
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Helpers para IndexedDB/localStorage
async function getPendingWorkouts() {
  // Implementar busca de treinos pendentes
  return JSON.parse(localStorage.getItem('pendingWorkouts') || '[]');
}

async function removePendingWorkout(id) {
  const pending = await getPendingWorkouts();
  const filtered = pending.filter(w => w.id !== id);
  localStorage.setItem('pendingWorkouts', JSON.stringify(filtered));
}

async function getPendingPlans() {
  return JSON.parse(localStorage.getItem('pendingPlans') || '[]');
}

async function removePendingPlan(id) {
  const pending = await getPendingPlans();
  const filtered = pending.filter(p => p.id !== id);
  localStorage.setItem('pendingPlans', JSON.stringify(filtered));
}

// Mensagens do cliente
self.addEventListener('message', event => {
  console.log('[SW] Mensagem recebida:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
  
  if (event.data && event.data.type === 'CACHE_WORKOUT') {
    // Cachear dados de treino específicos
    cacheWorkoutData(event.data.workout);
  }
});

async function cacheWorkoutData(workout) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = new Response(JSON.stringify(workout), {
      headers: { 'Content-Type': 'application/json' }
    });
    await cache.put(`/workout-data/${workout.id}`, response);
    console.log('[SW] ✅ Dados de treino cacheados:', workout.id);
  } catch (error) {
    console.error('[SW] Erro ao cachear treino:', error);
  }
}