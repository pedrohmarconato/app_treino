// Monitor de uso do localStorage
class StorageMonitor {
  constructor() {
    this.WARNING_THRESHOLD_MB = 4;
    this.CRITICAL_THRESHOLD_MB = 5;
    this.lastCheckTime = 0;
    this.CHECK_INTERVAL = 60000; // Check every minute max
  }

  /**
   * Calcula o tamanho total do localStorage
   */
  calculateStorageSize() {
    let totalSize = 0;

    try {
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          const value = localStorage.getItem(key);
          // Tamanho em bytes (considera UTF-16)
          totalSize += (key.length + value.length) * 2;
        }
      }
    } catch (error) {
      console.error('[StorageMonitor] Erro ao calcular tamanho:', error);
    }

    return totalSize;
  }

  /**
   * Verifica quota de storage e emite alertas
   */
  checkStorageQuota() {
    // Throttle para não verificar muito frequentemente
    const now = Date.now();
    if (now - this.lastCheckTime < this.CHECK_INTERVAL) {
      return;
    }
    this.lastCheckTime = now;

    const totalBytes = this.calculateStorageSize();
    const totalMB = totalBytes / (1024 * 1024);

    // Análise detalhada por chave
    const analysis = this.analyzeStorageUsage();

    if (totalMB >= this.CRITICAL_THRESHOLD_MB) {
      console.error(`[StorageMonitor] ⚠️ CRÍTICO: localStorage usando ${totalMB.toFixed(2)}MB!`);
      console.table(analysis.top10);

      // Tentar limpar dados antigos automaticamente
      this.attemptCleanup();

      // Notificar usuário
      if (window.showNotification) {
        window.showNotification(
          'Espaço de armazenamento crítico! Alguns dados antigos foram limpos.',
          'warning'
        );
      }
    } else if (totalMB >= this.WARNING_THRESHOLD_MB) {
      console.warn(`[StorageMonitor] ⚠️ AVISO: localStorage usando ${totalMB.toFixed(2)}MB`);
      console.table(analysis.top10);
    }

    return {
      totalBytes,
      totalMB,
      status:
        totalMB >= this.CRITICAL_THRESHOLD_MB
          ? 'critical'
          : totalMB >= this.WARNING_THRESHOLD_MB
            ? 'warning'
            : 'ok',
      analysis,
    };
  }

  /**
   * Analisa uso detalhado do storage
   */
  analyzeStorageUsage() {
    const items = [];

    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        const value = localStorage.getItem(key);
        const sizeBytes = (key.length + value.length) * 2;

        items.push({
          key,
          sizeBytes,
          sizeKB: (sizeBytes / 1024).toFixed(2),
          sizeMB: (sizeBytes / 1024 / 1024).toFixed(3),
          preview: value.substring(0, 50) + (value.length > 50 ? '...' : ''),
        });
      }
    }

    // Ordenar por tamanho
    items.sort((a, b) => b.sizeBytes - a.sizeBytes);

    // Categorizar por tipo
    const categories = {
      workout: items.filter((i) => i.key.includes('workout') || i.key.includes('treino')),
      analytics: items.filter((i) => i.key.includes('analytics') || i.key.includes('events')),
      cache: items.filter((i) => i.key.includes('cache') || i.key.includes('temp')),
      sync: items.filter((i) => i.key.includes('sync') || i.key.includes('pending')),
      other: items.filter(
        (i) =>
          !i.key.includes('workout') &&
          !i.key.includes('treino') &&
          !i.key.includes('analytics') &&
          !i.key.includes('events') &&
          !i.key.includes('cache') &&
          !i.key.includes('temp') &&
          !i.key.includes('sync') &&
          !i.key.includes('pending')
      ),
    };

    return {
      top10: items.slice(0, 10),
      categories,
      totalItems: items.length,
    };
  }

  /**
   * Tenta limpar dados antigos
   */
  attemptCleanup() {
    console.log('[StorageMonitor] Iniciando limpeza automática...');

    const keysToCheck = [];
    const now = Date.now();
    const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

    // Verificar cada chave
    for (const key in localStorage) {
      if (!localStorage.hasOwnProperty(key)) continue;

      // Pular chaves críticas
      if (key.includes('user_') || key.includes('auth_')) continue;

      try {
        const value = localStorage.getItem(key);
        const parsed = JSON.parse(value);

        // Verificar se tem timestamp
        const timestamp = parsed.timestamp || parsed.savedAt || parsed.createdAt;
        if (timestamp && now - new Date(timestamp).getTime() > WEEK_MS) {
          keysToCheck.push({
            key,
            age: Math.floor((now - new Date(timestamp).getTime()) / (24 * 60 * 60 * 1000)),
          });
        }
      } catch (e) {
        // Não é JSON ou não tem timestamp
      }
    }

    // Remover os mais antigos
    keysToCheck.sort((a, b) => b.age - a.age);
    const toRemove = keysToCheck.slice(0, 5); // Remover até 5 itens antigos

    toRemove.forEach((item) => {
      console.log(`[StorageMonitor] Removendo ${item.key} (${item.age} dias)`);
      localStorage.removeItem(item.key);
    });

    if (toRemove.length > 0) {
      console.log(`[StorageMonitor] ${toRemove.length} itens antigos removidos`);

      // Limpar também dados expirados específicos
      if (window.offlineSyncService) {
        window.offlineSyncService.cleanupExpiredDLQ();
      }
      if (window.workoutAnalytics) {
        window.workoutAnalytics.cleanup(30); // Manter 30 dias
      }
    }

    return toRemove.length;
  }

  /**
   * Obtém estatísticas de uso
   */
  getStats() {
    const size = this.calculateStorageSize();
    const analysis = this.analyzeStorageUsage();

    return {
      totalMB: (size / 1024 / 1024).toFixed(2),
      itemCount: analysis.totalItems,
      largestKey: analysis.top10[0]?.key || 'N/A',
      largestSizeMB: analysis.top10[0]?.sizeMB || '0',
      categories: Object.entries(analysis.categories).map(([name, items]) => ({
        name,
        count: items.length,
        sizeMB: (items.reduce((sum, i) => sum + i.sizeBytes, 0) / 1024 / 1024).toFixed(2),
      })),
    };
  }

  /**
   * Comando útil para console
   */
  static inspectStorage() {
    const monitor = new StorageMonitor();
    const stats = monitor.getStats();

    console.log('📊 localStorage Status:');
    console.log(`Total: ${stats.totalMB}MB em ${stats.itemCount} itens`);
    console.log(`Maior item: ${stats.largestKey} (${stats.largestSizeMB}MB)`);
    console.log('\nPor categoria:');
    console.table(stats.categories);

    const analysis = monitor.analyzeStorageUsage();
    console.log('\nTop 10 maiores:');
    console.table(analysis.top10);

    return stats;
  }
}

// Exportar instância única
export const storageMonitor = new StorageMonitor();

// Expor globalmente para debug
window.storageMonitor = storageMonitor;
window.inspectStorage = StorageMonitor.inspectStorage;

export default StorageMonitor;
