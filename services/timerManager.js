/**
 * ⏰ GERENCIADOR DE TIMERS - Timer Manager
 *
 * FUNÇÃO: Centralizar e gerenciar todos os timers e cronômetros da aplicação.
 *
 * RESPONSABILIDADES:
 * - Criar e gerenciar múltiplos timers simultâneos
 * - Evitar vazamentos de memória (timers órfãos)
 * - Organizar timers por contexto (workout, rest, global)
 * - Fornecer API consistente para setTimeout/setInterval
 * - Limpar automaticamente timers ao trocar de tela
 * - Pausar/resumir timers quando necessário
 * - Sincronizar timers com mudanças de estado
 *
 * CONTEXTOS SUPORTADOS:
 * - workout: Timers da execução de treino
 * - rest: Cronômetros de descanso entre séries/exercícios
 * - global: Timers gerais da aplicação
 * - ui: Timers de animações e transições
 *
 * FUNCIONALIDADES:
 * - createTimer(): Criar timer com ID único
 * - clearContext(): Limpar todos os timers de um contexto
 * - pauseAll(): Pausar todos os timers ativos
 * - resumeAll(): Retomar timers pausados
 *
 * VANTAGENS: Previne memory leaks, facilita debugging, controle centralizado
 */
class TimerManager {
  constructor() {
    this.activeTimers = new Map(); // id -> timerId
    this.activeIntervals = new Map(); // id -> intervalId
    this.activeListeners = new Map(); // key -> {element, event, handler}
    this.activeTimeouts = new Map(); // id -> timeoutId
  }

  /**
   * Registra um novo interval
   */
  setInterval(id, callback, delay) {
    // Limpar interval anterior se existir
    this.clearInterval(id);

    const intervalId = setInterval(callback, delay);
    this.activeIntervals.set(id, intervalId);

    console.log(`[TimerManager] Interval registrado: ${id}`);
    return intervalId;
  }

  /**
   * Limpa um interval específico
   */
  clearInterval(id) {
    const intervalId = this.activeIntervals.get(id);
    if (intervalId) {
      clearInterval(intervalId);
      this.activeIntervals.delete(id);
      console.log(`[TimerManager] Interval limpo: ${id}`);
    }
  }

  /**
   * Registra um novo timeout
   */
  setTimeout(id, callback, delay) {
    // Limpar timeout anterior se existir
    this.clearTimeout(id);

    const timeoutId = setTimeout(() => {
      callback();
      // Auto-remover após executar
      this.activeTimeouts.delete(id);
    }, delay);

    this.activeTimeouts.set(id, timeoutId);
    console.log(`[TimerManager] Timeout registrado: ${id}`);
    return timeoutId;
  }

  /**
   * Limpa um timeout específico
   */
  clearTimeout(id) {
    const timeoutId = this.activeTimeouts.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.activeTimeouts.delete(id);
      console.log(`[TimerManager] Timeout limpo: ${id}`);
    }
  }

  /**
   * Adiciona um event listener rastreado
   */
  addEventListener(element, event, handler, options) {
    const key = `${element.id || 'window'}_${event}`;

    // Remover listener anterior se existir
    this.removeEventListener(key);

    element.addEventListener(event, handler, options);
    this.activeListeners.set(key, { element, event, handler, options });

    console.log(`[TimerManager] Listener adicionado: ${key}`);
  }

  /**
   * Remove um event listener específico
   */
  removeEventListener(key) {
    const listener = this.activeListeners.get(key);
    if (listener) {
      listener.element.removeEventListener(listener.event, listener.handler, listener.options);
      this.activeListeners.delete(key);
      console.log(`[TimerManager] Listener removido: ${key}`);
    }
  }

  /**
   * Limpa todos os timers e listeners
   */
  clearAll() {
    console.log('[TimerManager] Limpando todos os timers e listeners...');

    // Limpar todos os intervals
    this.activeIntervals.forEach((intervalId, id) => {
      clearInterval(intervalId);
      console.log(`[TimerManager] Interval limpo: ${id}`);
    });
    this.activeIntervals.clear();

    // Limpar todos os timeouts
    this.activeTimeouts.forEach((timeoutId, id) => {
      clearTimeout(timeoutId);
      console.log(`[TimerManager] Timeout limpo: ${id}`);
    });
    this.activeTimeouts.clear();

    // Remover todos os listeners
    this.activeListeners.forEach((listener, key) => {
      listener.element.removeEventListener(listener.event, listener.handler, listener.options);
      console.log(`[TimerManager] Listener removido: ${key}`);
    });
    this.activeListeners.clear();

    console.log('[TimerManager] Limpeza completa finalizada');
  }

  /**
   * Limpa timers de um contexto específico
   */
  clearContext(context) {
    console.log(`[TimerManager] Limpando contexto: ${context}`);

    // Limpar intervals do contexto
    this.activeIntervals.forEach((intervalId, id) => {
      if (id.startsWith(context)) {
        this.clearInterval(id);
      }
    });

    // Limpar timeouts do contexto
    this.activeTimeouts.forEach((timeoutId, id) => {
      if (id.startsWith(context)) {
        this.clearTimeout(id);
      }
    });

    // Remover listeners do contexto
    this.activeListeners.forEach((listener, key) => {
      if (key.startsWith(context)) {
        this.removeEventListener(key);
      }
    });
  }

  /**
   * Obtém status atual
   */
  getStatus() {
    return {
      intervals: this.activeIntervals.size,
      timeouts: this.activeTimeouts.size,
      listeners: this.activeListeners.size,
      total: this.activeIntervals.size + this.activeTimeouts.size + this.activeListeners.size,
    };
  }

  /**
   * Debug - lista todos os timers ativos
   */
  debug() {
    console.log('[TimerManager] Status:', this.getStatus());
    console.log('[TimerManager] Intervals ativos:', Array.from(this.activeIntervals.keys()));
    console.log('[TimerManager] Timeouts ativos:', Array.from(this.activeTimeouts.keys()));
    console.log('[TimerManager] Listeners ativos:', Array.from(this.activeListeners.keys()));
  }
}

// Exportar instância única
export const timerManager = new TimerManager();

// Expor globalmente para debug
window.timerManager = timerManager;

export default TimerManager;
