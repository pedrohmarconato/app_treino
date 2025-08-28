// core/EventBus.js
// Sistema de eventos global para comunicação entre componentes

export class EventBus {
  constructor() {
    this.events = new Map();
    this.oneTimeEvents = new Map();
    this.eventHistory = [];
    this.maxHistorySize = 50;
    this.debug = false;
  }

  /**
   * Registra listener para evento
   * @returns {Function} Função para remover o listener
   */
  on(event, handler) {
    if (typeof handler !== 'function') {
      throw new Error('Event handler must be a function');
    }

    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }

    this.events.get(event).add(handler);

    if (this.debug) {
      console.log(`[EventBus] Listener added for: ${event}`);
    }

    // Retornar função para remover listener
    return () => this.off(event, handler);
  }

  /**
   * Registra listener que executa apenas uma vez
   */
  once(event, handler) {
    if (typeof handler !== 'function') {
      throw new Error('Event handler must be a function');
    }

    const wrappedHandler = (data) => {
      handler(data);
      this.off(event, wrappedHandler);
    };

    return this.on(event, wrappedHandler);
  }

  /**
   * Remove listener de evento
   */
  off(event, handler) {
    if (this.events.has(event)) {
      this.events.get(event).delete(handler);

      // Remover evento se não há mais listeners
      if (this.events.get(event).size === 0) {
        this.events.delete(event);
      }

      if (this.debug) {
        console.log(`[EventBus] Listener removed for: ${event}`);
      }
    }
  }

  /**
   * Remove todos os listeners de um evento
   */
  offAll(event) {
    if (this.events.has(event)) {
      this.events.delete(event);

      if (this.debug) {
        console.log(`[EventBus] All listeners removed for: ${event}`);
      }
    }
  }

  /**
   * Emite evento para todos os listeners
   */
  emit(event, data) {
    // Adicionar ao histórico
    this.addToHistory(event, data);

    if (this.debug) {
      console.log(`[EventBus] Emitting: ${event}`, data);
    }

    // Executar handlers normais
    if (this.events.has(event)) {
      const handlers = Array.from(this.events.get(event));

      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error(`[EventBus] Error in handler for ${event}:`, error);

          // Emitir evento de erro
          if (event !== 'eventbus-error') {
            this.emit('eventbus-error', {
              originalEvent: event,
              error: error,
              data: data,
            });
          }
        }
      });
    }

    // Verificar listeners esperando por este evento
    this.checkWaitingListeners(event, data);
  }

  /**
   * Emite evento de forma assíncrona
   */
  async emitAsync(event, data) {
    // Adicionar ao histórico
    this.addToHistory(event, data);

    if (this.debug) {
      console.log(`[EventBus] Emitting async: ${event}`, data);
    }

    const results = [];

    if (this.events.has(event)) {
      const handlers = Array.from(this.events.get(event));

      for (const handler of handlers) {
        try {
          const result = await handler(data);
          results.push(result);
        } catch (error) {
          console.error(`[EventBus] Error in async handler for ${event}:`, error);

          // Emitir evento de erro
          if (event !== 'eventbus-error') {
            this.emit('eventbus-error', {
              originalEvent: event,
              error: error,
              data: data,
            });
          }
        }
      }
    }

    return results;
  }

  /**
   * Aguarda por um evento específico
   */
  waitFor(event, timeout = null) {
    return new Promise((resolve, reject) => {
      let timeoutId = null;

      // Configurar timeout se especificado
      if (timeout) {
        timeoutId = setTimeout(() => {
          this.off(event, handler);
          reject(new Error(`Timeout waiting for event: ${event}`));
        }, timeout);
      }

      // Handler que resolve a promise
      const handler = (data) => {
        if (timeoutId) clearTimeout(timeoutId);
        resolve(data);
      };

      // Registrar handler temporário
      this.once(event, handler);
    });
  }

  /**
   * Verifica listeners esperando por eventos
   */
  checkWaitingListeners(event, data) {
    // Implementação futura para sistema de promises esperando eventos
  }

  /**
   * Adiciona evento ao histórico
   */
  addToHistory(event, data) {
    this.eventHistory.push({
      event,
      data,
      timestamp: Date.now(),
    });

    // Limitar tamanho do histórico
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  /**
   * Obtém histórico de eventos
   */
  getHistory(event = null) {
    if (event) {
      return this.eventHistory.filter((entry) => entry.event === event);
    }
    return [...this.eventHistory];
  }

  /**
   * Limpa histórico
   */
  clearHistory() {
    this.eventHistory = [];
  }

  /**
   * Obtém lista de eventos registrados
   */
  getRegisteredEvents() {
    return Array.from(this.events.keys());
  }

  /**
   * Obtém contagem de listeners para um evento
   */
  getListenerCount(event) {
    return this.events.has(event) ? this.events.get(event).size : 0;
  }

  /**
   * Ativa/desativa modo debug
   */
  setDebug(enabled) {
    this.debug = enabled;
  }

  /**
   * Limpa todos os eventos e listeners
   */
  clear() {
    this.events.clear();
    this.oneTimeEvents.clear();
    this.eventHistory = [];

    if (this.debug) {
      console.log('[EventBus] All events and listeners cleared');
    }
  }
}

// Singleton global
const eventBus = new EventBus();

// Eventos padrão do sistema
export const SystemEvents = {
  // Navegação
  BEFORE_NAVIGATE: 'before-navigate',
  AFTER_NAVIGATE: 'after-navigate',
  NAVIGATION_ERROR: 'navigation-error',

  // Autenticação
  USER_LOGGED_IN: 'user-logged-in',
  USER_LOGGED_OUT: 'user-logged-out',
  AUTH_ERROR: 'auth-error',

  // Treino
  WORKOUT_STARTED: 'workout-started',
  WORKOUT_PAUSED: 'workout-paused',
  WORKOUT_RESUMED: 'workout-resumed',
  WORKOUT_COMPLETED: 'workout-completed',
  WORKOUT_ABANDONED: 'workout-abandoned',
  EXERCISE_COMPLETED: 'exercise-completed',
  SERIES_COMPLETED: 'series-completed',

  // Cache e Persistência
  CACHE_UPDATED: 'cache-updated',
  CACHE_CLEARED: 'cache-cleared',
  DATA_SAVED: 'data-saved',
  DATA_LOADED: 'data-loaded',

  // UI
  MODAL_OPENED: 'modal-opened',
  MODAL_CLOSED: 'modal-closed',
  NOTIFICATION_SHOWN: 'notification-shown',
  LOADING_STARTED: 'loading-started',
  LOADING_FINISHED: 'loading-finished',

  // Erros
  ERROR_OCCURRED: 'error-occurred',
  ERROR_HANDLED: 'error-handled',
  EVENTBUS_ERROR: 'eventbus-error',
};

export default eventBus;
