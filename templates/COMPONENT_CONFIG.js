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
  