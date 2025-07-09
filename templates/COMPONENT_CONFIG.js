/**
 * ⚙️ CONFIGURAÇÃO DE COMPONENTES - Component Config
 * 
 * FUNÇÃO: Centralizar configurações globais para componentes da aplicação.
 * 
 * RESPONSABILIDADES:
 * - Definir configurações padrão para modais (z-index, animações, opacidade)
 * - Estabelecer parâmetros de cache (intervalos, TTL, compressão)
 * - Configurar metas de performance para operações críticas
 * - Definir configurações de acessibilidade (focus, delays, anúncios)
 * - Centralizar valores que podem ser ajustados sem alterar código
 * - Facilitar testes com configurações customizadas
 * 
 * CATEGORIAS DE CONFIGURAÇÃO:
 * - modals: configurações para sistema modal (z-index base, overlays, animações)
 * - cache: parâmetros de armazenamento local (auto-save, retries, TTL)
 * - performance: metas de tempo para operações (display, cache, restoration)
 * - accessibility: configurações para acessibilidade (focus trap, anúncios)
 * 
 * VALORES CONFIGURÁVEIS:
 * - Durações de animação e timeouts
 * - Intervalos de operações automáticas
 * - Limites de performance e tamanho
 * - Delays para melhor experiência do usuário
 * 
 * INTEGRAÇÃO: Importado por componentes que precisam de configurações centralizadas
 */

// templates/COMPONENT_CONFIG.js
export const ComponentConfig = {
    modals: {
      zIndex: 9999,
      overlayOpacity: 0.8,
      animationDuration: 200,
      focusDelay: 100,
      autoCloseTimeout: null
    },
  
    cache: {
      autoSaveInterval: 30000, // 30 segundos
      maxRetries: 3,
      compressionThreshold: 50000, // 50KB
      ttl: 14400000 // 4 horas
    },
  
    performance: {
      modalDisplayTarget: 50, // ms
      cacheOperationTarget: 100, // ms
      stateRestorationTarget: 200 // ms
    },
  
    accessibility: {
      focusTrapDelay: 100,
      announceDelay: 500,
      keyRepeatDelay: 150
    }
  };
  