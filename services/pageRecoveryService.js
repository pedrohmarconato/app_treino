/**
 * 🔄 SERVIÇO DE RECOVERY PÓS-REFRESH - Page Recovery Service
 *
 * FUNÇÃO: Detectar refresh da página e retomar estado correto automaticamente
 * Resolve o problema do usuário precisar voltar manualmente após refresh
 *
 * RESPONSABILIDADES:
 * - Detectar quando página foi recarregada
 * - Identificar último estado válido (home, treino, etc.)
 * - Redirecionar automaticamente para tela correta
 * - Recarregar dados necessários (dashboard, etc.)
 * - Tratar casos especiais (treino em andamento, etc.)
 *
 * COMPORTAMENTO:
 * - Se estava na home -> volta para home e recarrega dashboard
 * - Se estava em treino -> oferece recovery ou volta home
 * - Se finalizou treino -> volta home e recarrega dashboard
 * - Se houve erro -> oferece retry ou volta home
 */

import { nowUtcISO } from '../utils/dateUtils.js';

export class PageRecoveryService {
  static RECOVERY_KEY = 'page_recovery_state';
  static SESSION_KEY = 'recovery_session_id';

  /**
   * Salvar estado atual da página para recovery
   */
  static saveCurrentState(tela, dadosExtras = {}) {
    try {
      const estado = {
        tela: tela,
        timestamp: nowUtcISO(),
        session_id: this.getSessionId(),
        user_id: AppState.get('currentUser')?.id,

        // Dados específicos da tela
        dados: {
          ...dadosExtras,
          url: window.location.href,
          treino_ativo: !!AppState.get('currentWorkout'),
          tem_cache: (AppState.get('execucoesCache') || []).length > 0,
        },

        // Flags de controle
        needs_dashboard_reload: tela === 'home-screen',
        needs_workout_recovery: tela === 'workout-screen',

        version: '2.0',
      };

      localStorage.setItem(this.RECOVERY_KEY, JSON.stringify(estado));

      console.log('[PageRecovery] 💾 Estado salvo:', { tela, dados: dadosExtras });
    } catch (error) {
      console.error('[PageRecovery] Erro ao salvar estado:', error);
    }
  }

  /**
   * Recuperar estado após refresh e aplicar automaticamente
   */
  static async restoreStateAfterRefresh() {
    try {
      const estadoSalvo = localStorage.getItem(this.RECOVERY_KEY);

      if (!estadoSalvo) {
        console.log('[PageRecovery] 📭 Nenhum estado para recuperar');
        return { recovered: false, reason: 'no_state' };
      }

      const estado = JSON.parse(estadoSalvo);

      // Verificar se é da mesma sessão
      if (!this.isValidSession(estado)) {
        console.log('[PageRecovery] 🗑️ Estado de sessão diferente, limpando...');
        this.clearRecoveryState();
        return { recovered: false, reason: 'different_session' };
      }

      // Verificar se não é muito antigo (mais de 1 hora)
      const ageSMinutes = this.getStateAgeMinutes(estado);
      if (ageSMinutes > 60) {
        console.log('[PageRecovery] ⏰ Estado muito antigo, limpando...');
        this.clearRecoveryState();
        return { recovered: false, reason: 'too_old' };
      }

      console.log('[PageRecovery] 🔄 Recuperando estado:', {
        tela: estado.tela,
        idade_minutos: ageSMinutes,
        usuario: estado.user_id,
      });

      // Aplicar recovery baseado na tela
      const resultado = await this.applyRecovery(estado);

      // Limpar estado após aplicar (sucesso ou falha)
      this.clearRecoveryState();

      return resultado;
    } catch (error) {
      console.error('[PageRecovery] Erro no recovery:', error);
      this.clearRecoveryState();
      return { recovered: false, reason: 'error', error: error.message };
    }
  }

  /**
   * Aplicar recovery baseado no tipo de tela
   */
  static async applyRecovery(estado) {
    const { tela, dados } = estado;

    switch (tela) {
      case 'home-screen':
        return await this.recoverHomeScreen(dados);

      case 'workout-screen':
        return await this.recoverWorkoutScreen(dados);

      case 'treino-finalizado':
        return await this.recoverFinishedWorkout(dados);

      default:
        return await this.recoverGenericScreen(tela, dados);
    }
  }

  /**
   * Recovery para tela home
   */
  static async recoverHomeScreen(dados) {
    try {
      console.log('[PageRecovery] 🏠 Recuperando home screen...');

      // Navegar para home
      const navigation = await import('../ui/navigation.js');
      navigation.mostrarTela('home-screen');

      // Recarregar dashboard após um delay
      setTimeout(async () => {
        if (window.carregarDashboard) {
          try {
            console.log('[PageRecovery] 📊 Recarregando dashboard...');
            await window.carregarDashboard();

            // Mostrar notificação discreta
            if (window.showNotification) {
              window.showNotification('Dashboard atualizado', 'info', false, 2000);
            }
          } catch (error) {
            console.error('[PageRecovery] Erro ao recarregar dashboard:', error);
          }
        }
      }, 500);

      return {
        recovered: true,
        tela: 'home-screen',
        action: 'dashboard_reloaded',
      };
    } catch (error) {
      console.error('[PageRecovery] Erro no recovery da home:', error);
      return { recovered: false, error: error.message };
    }
  }

  /**
   * Recovery para tela de treino
   */
  static async recoverWorkoutScreen(dados) {
    try {
      console.log('[PageRecovery] 🏋️ Verificando recovery de treino...');

      // Verificar se há treino ativo para recuperar
      const workoutCache = await import('./treinoCacheService.js');
      const hasActiveWorkout = await workoutCache.TreinoCacheService.hasActiveWorkout();

      if (hasActiveWorkout && dados.tem_cache) {
        console.log('[PageRecovery] 💪 Treino ativo detectado, oferecendo recovery...');

        // Mostrar modal de recovery
        this.showWorkoutRecoveryModal(dados);

        return {
          recovered: true,
          tela: 'workout-recovery',
          action: 'recovery_modal_shown',
        };
      } else {
        console.log('[PageRecovery] 📱 Sem treino ativo, redirecionando para home...');
        return await this.recoverHomeScreen(dados);
      }
    } catch (error) {
      console.error('[PageRecovery] Erro no recovery do treino:', error);
      return await this.recoverHomeScreen(dados);
    }
  }

  /**
   * Recovery para treino recém-finalizado
   */
  static async recoverFinishedWorkout(dados) {
    try {
      console.log('[PageRecovery] 🏁 Recuperando pós-finalização...');

      // Ir direto para home e recarregar dashboard
      const result = await this.recoverHomeScreen(dados);

      // Mostrar mensagem de sucesso se não mostrou ainda
      setTimeout(() => {
        if (window.showNotification) {
          window.showNotification('Treino finalizado com sucesso!', 'success', false, 3000);
        }
      }, 1000);

      return {
        ...result,
        action: 'post_workout_recovery',
      };
    } catch (error) {
      console.error('[PageRecovery] Erro no recovery pós-treino:', error);
      return await this.recoverHomeScreen(dados);
    }
  }

  /**
   * Recovery genérico para outras telas
   */
  static async recoverGenericScreen(tela, dados) {
    try {
      console.log('[PageRecovery] 🔄 Recovery genérico para:', tela);

      const navigation = await import('../ui/navigation.js');

      // Tentar navegar para a tela salva
      if (typeof navigation.mostrarTela === 'function') {
        navigation.mostrarTela(tela);

        return {
          recovered: true,
          tela: tela,
          action: 'generic_recovery',
        };
      } else {
        // Fallback para home
        return await this.recoverHomeScreen(dados);
      }
    } catch (error) {
      console.error('[PageRecovery] Erro no recovery genérico:', error);
      return await this.recoverHomeScreen(dados);
    }
  }

  /**
   * Mostrar modal de recovery de treino
   */
  static showWorkoutRecoveryModal(dados) {
    if (!window.showNotification) return;

    const modal = window.showNotification(
      `
            <div style="text-align: center;">
                <h3 style="margin: 0 0 10px 0;">🏋️ Treino em Andamento</h3>
                <p style="margin: 0 0 15px 0;">Detectamos que você tinha um treino em andamento.</p>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button onclick="window.recoverWorkout()" class="btn-primary" style="background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">
                        Continuar Treino
                    </button>
                    <button onclick="window.discardWorkout()" class="btn-secondary" style="background: #6b7280; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">
                        Descartar
                    </button>
                </div>
            </div>
            `,
      'info',
      true // persistent
    );

    // Funções para os botões
    window.recoverWorkout = async () => {
      if (modal && modal.remove) modal.remove();

      try {
        const navigation = await import('../ui/navigation.js');
        navigation.mostrarTela('workout-screen');

        // Tentar recuperar estado do treino
        if (window.workoutExecutionManager && window.workoutExecutionManager.restoreFromCache) {
          await window.workoutExecutionManager.restoreFromCache();
        }

        window.showNotification('Treino recuperado!', 'success', false, 2000);
      } catch (error) {
        console.error('[PageRecovery] Erro ao recuperar treino:', error);
        window.showNotification('Erro ao recuperar treino', 'error');
      }
    };

    window.discardWorkout = async () => {
      if (modal && modal.remove) modal.remove();

      try {
        // Limpar cache de treino
        const workoutCache = await import('./treinoCacheService.js');
        await workoutCache.TreinoCacheService.clearWorkoutState();

        // Ir para home
        const navigation = await import('../ui/navigation.js');
        navigation.mostrarTela('home-screen');

        if (window.carregarDashboard) {
          setTimeout(() => window.carregarDashboard(), 500);
        }

        window.showNotification('Treino descartado', 'info', false, 2000);
      } catch (error) {
        console.error('[PageRecovery] Erro ao descartar treino:', error);
      }
    };
  }

  /**
   * Gerar ou obter ID da sessão
   */
  static getSessionId() {
    let sessionId = sessionStorage.getItem(this.SESSION_KEY);

    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem(this.SESSION_KEY, sessionId);
    }

    return sessionId;
  }

  /**
   * Verificar se estado é da sessão atual
   */
  static isValidSession(estado) {
    const currentSessionId = this.getSessionId();
    return estado.session_id === currentSessionId;
  }

  /**
   * Calcular idade do estado em minutos
   */
  static getStateAgeMinutes(estado) {
    const agora = new Date();
    const timestampSalvo = new Date(estado.timestamp);
    return Math.floor((agora - timestampSalvo) / 60000);
  }

  /**
   * Limpar estado de recovery
   */
  static clearRecoveryState() {
    localStorage.removeItem(this.RECOVERY_KEY);
  }

  /**
   * Configurar hooks automáticos
   */
  static setupAutoHooks() {
    // Hook no mostrarTela para salvar estado
    if (window.originalMostrarTela) return; // Já configurado

    try {
      const navigation = import('../ui/navigation.js');
      navigation.then((nav) => {
        if (nav.mostrarTela) {
          window.originalMostrarTela = nav.mostrarTela;

          nav.mostrarTela = (tela, ...args) => {
            // Salvar estado antes de navegar
            this.saveCurrentState(tela, { navigation_args: args });

            // Chamar função original
            return window.originalMostrarTela(tela, ...args);
          };
        }
      });
    } catch (error) {
      console.error('[PageRecovery] Erro ao configurar hooks:', error);
    }

    // Hook no finalizarTreino
    if (window.originalFinalizarTreino) return;

    if (window.finalizarTreino) {
      window.originalFinalizarTreino = window.finalizarTreino;

      window.finalizarTreino = async (...args) => {
        // Salvar estado de finalização
        this.saveCurrentState('treino-finalizado', { finalization_data: args });

        // Chamar função original
        return await window.originalFinalizarTreino(...args);
      };
    }
  }
}

// Auto-inicialização
if (typeof window !== 'undefined') {
  // Configurar hooks automaticamente
  document.addEventListener('DOMContentLoaded', () => {
    PageRecoveryService.setupAutoHooks();

    // Executar recovery após 1 segundo (aguardar inicialização)
    setTimeout(async () => {
      const result = await PageRecoveryService.restoreStateAfterRefresh();
      console.log('[PageRecovery] Resultado do recovery automático:', result);
    }, 1000);
  });

  // Expor globalmente para debug
  window.PageRecoveryService = PageRecoveryService;
}

export default PageRecoveryService;
