/**
 * NavigationGuard.js - Sistema Inteligente de Controle de Navegação
 * Protege dados de treino durante navegação com modais contextuais
 */

import AppState from '../state/appState.js';
import TreinoCacheService from './treinoCacheService.js';
import { SaveExitModal } from '../components/SaveExitModal.js';
import { SessionRecoveryModal } from '../components/SessionRecoveryModal.js';
import { ComponentConfig } from '../templates/COMPONENT_CONFIG.js';

export class NavigationGuard {
  constructor() {
    this.isProcessing = false;
    this.pendingNavigation = null;
    this.config = {
      enableModalConfirmation: true,
      autoSaveBeforeExit: true,
      sessionTimeoutMs: ComponentConfig.cache.ttl,
      debugMode: false,
    };

    // Bind methods
    this.handleBeforeUnload = this.handleBeforeUnload.bind(this);
    this.handlePopState = this.handlePopState.bind(this);

    this.setupBrowserEvents();
  }

  /**
   * Verifica se pode navegar para uma rota específica
   * @param {string} targetRoute - Rota de destino
   * @param {Object} options - Opções da navegação
   * @returns {Promise<boolean>} Se a navegação pode prosseguir
   */
  static async canNavigate(targetRoute = null, options = {}) {
    try {
      const guard = NavigationGuard.getInstance();
      return await guard._canNavigate(targetRoute, options);
    } catch (error) {
      console.error('[NavigationGuard] Erro em canNavigate:', error);
      return NavigationGuard._fallbackCanNavigate();
    }
  }

  /**
   * Implementação interna do canNavigate
   */
  async _canNavigate(targetRoute, options = {}) {
    if (this.isProcessing) {
      console.log('[NavigationGuard] Navegação já em processamento, aguardando...');
      return false;
    }

    this.isProcessing = true;
    this.pendingNavigation = { targetRoute, options, timestamp: Date.now() };

    try {
      // Log da tentativa de navegação
      this._logNavigation('attempt', targetRoute, options);

      // Verificar estado do workout
      const workoutStatus = await this._checkWorkoutStatus();

      if (!workoutStatus.hasActiveWorkout) {
        this._logNavigation('allowed', targetRoute, 'No active workout');
        return true;
      }

      // Se há treino ativo, decidir se precisa de confirmação
      const needsConfirmation = this._needsConfirmation(targetRoute, options, workoutStatus);

      if (!needsConfirmation) {
        this._logNavigation('allowed', targetRoute, 'No confirmation needed');
        return true;
      }

      // Exibir modal de confirmação
      const userDecision = await this._showConfirmationModal(workoutStatus);

      return await this._processUserDecision(userDecision, workoutStatus);
    } finally {
      this.isProcessing = false;
      this.pendingNavigation = null;
    }
  }

  /**
   * Verifica status do workout atual
   */
  async _checkWorkoutStatus() {
    const [appStateActive, cacheActive, workoutState] = await Promise.all([
      AppState.get('isWorkoutActive'),
      TreinoCacheService.hasActiveWorkout(),
      TreinoCacheService.getWorkoutState(),
    ]);

    const hasUnsavedData = AppState.get('hasUnsavedData') || false;
    const isSessionValid = workoutState && TreinoCacheService.validateState(workoutState);

    return {
      hasActiveWorkout: appStateActive || cacheActive,
      hasUnsavedData,
      isSessionValid,
      workoutState,
      metadata: {
        appStateActive,
        cacheActive,
        lastActivity: workoutState?.metadata?.savedAt,
      },
    };
  }

  /**
   * Determina se é necessária confirmação para a navegação
   */
  _needsConfirmation(targetRoute, options, workoutStatus) {
    // Não precisa de confirmação se o modal está desabilitado
    if (!this.config.enableModalConfirmation || options.force) {
      return false;
    }

    // Não precisa de confirmação se não há dados não salvos
    if (!workoutStatus.hasUnsavedData && !workoutStatus.isSessionValid) {
      return false;
    }

    // Navegação interna do workout não precisa de confirmação
    if (targetRoute && targetRoute.includes('workout')) {
      return false;
    }

    return true;
  }

  /**
   * Exibe modal de confirmação apropriado
   */
  async _showConfirmationModal(workoutStatus) {
    try {
      const modal = new SaveExitModal(workoutStatus.workoutState);
      const result = await modal.show();

      this._logNavigation('modal-result', null, result);
      return result;
    } catch (error) {
      console.error('[NavigationGuard] Erro ao exibir modal:', error);

      // Fallback para confirm nativo
      const proceed = confirm('Você tem um treino em andamento. Deseja realmente sair?');
      return proceed ? 'exit-no-save' : 'cancel';
    }
  }

  /**
   * Processa decisão do usuário
   */
  async _processUserDecision(decision, workoutStatus) {
    switch (decision) {
      case 'save-exit':
        await this.saveAndExit(workoutStatus);
        this._logNavigation('allowed', null, 'User chose save-exit');
        return true;

      case 'exit-no-save':
        await this.discardAndExit(workoutStatus);
        this._logNavigation('allowed', null, 'User chose exit-no-save');
        return true;

      case 'cancel':
      default:
        this._logNavigation('blocked', null, 'User cancelled');
        return false;
    }
  }

  /**
   * Salva dados e permite saída
   */
  async saveAndExit(workoutStatus) {
    try {
      console.log('[NavigationGuard] Salvando dados antes da saída...');

      if (workoutStatus?.workoutState) {
        await TreinoCacheService.saveWorkoutState(workoutStatus.workoutState, true);
      }

      // Manter flags de treino ativo para permitir recuperação
      AppState.set('isWorkoutActive', true);
      AppState.set('hasUnsavedData', false);

      console.log('[NavigationGuard] ✅ Dados salvos com sucesso');
    } catch (error) {
      console.error('[NavigationGuard] ❌ Erro ao salvar dados:', error);
      throw error;
    }
  }

  /**
   * Descarta dados e permite saída
   */
  async discardAndExit(workoutStatus) {
    try {
      console.log('[NavigationGuard] Descartando dados do treino...');

      await TreinoCacheService.clearWorkoutState();
      AppState.set('isWorkoutActive', false);
      AppState.set('hasUnsavedData', false);

      console.log('[NavigationGuard] ✅ Dados descartados');
    } catch (error) {
      console.error('[NavigationGuard] ❌ Erro ao descartar dados:', error);
      throw error;
    }
  }

  /**
   * Verifica se há sessão para recuperar no startup
   */
  static async checkForRecovery() {
    try {
      const workoutState = await TreinoCacheService.getWorkoutState();

      if (!workoutState || !TreinoCacheService.validateState(workoutState)) {
        return null;
      }

      // Verificar se a sessão não é muito antiga
      const sessionAge = Date.now() - new Date(workoutState.metadata?.savedAt || 0).getTime();
      const maxAge = ComponentConfig.cache.ttl;

      if (sessionAge > maxAge) {
        console.log('[NavigationGuard] Sessão expirada, limpando cache');
        await TreinoCacheService.clearWorkoutState();
        return null;
      }

      return workoutState;
    } catch (error) {
      console.error('[NavigationGuard] Erro ao verificar recovery:', error);
      return null;
    }
  }

  /**
   * Exibe modal de recuperação de sessão
   */
  static async showRecoveryModal(sessionData) {
    try {
      const modal = new SessionRecoveryModal(sessionData);
      const result = await modal.show();

      console.log('[NavigationGuard] Recovery modal result:', result);

      switch (result) {
        case 'recover':
          AppState.set('isWorkoutActive', true);
          AppState.set('hasUnsavedData', true);
          return { action: 'recover', data: sessionData };

        case 'discard':
          await TreinoCacheService.clearWorkoutState();
          AppState.set('isWorkoutActive', false);
          AppState.set('hasUnsavedData', false);
          return { action: 'discard', data: null };

        case 'cancel':
        default:
          return { action: 'cancel', data: sessionData };
      }
    } catch (error) {
      console.error('[NavigationGuard] Erro no recovery modal:', error);
      return { action: 'cancel', data: null };
    }
  }

  /**
   * Configura eventos do browser
   */
  setupBrowserEvents() {
    // Interceptar fechamento da aba/janela
    window.addEventListener('beforeunload', this.handleBeforeUnload);

    // Interceptar navegação do histórico
    window.addEventListener('popstate', this.handlePopState);
  }

  /**
   * Manipula evento beforeunload
   */
  handleBeforeUnload(event) {
    const isWorkoutActive = AppState.get('isWorkoutActive');
    const hasUnsavedData = AppState.get('hasUnsavedData');

    if (isWorkoutActive || hasUnsavedData) {
      const message = 'Você tem um treino em andamento. Os dados não salvos serão perdidos.';
      event.preventDefault();
      event.returnValue = message;
      return message;
    }
  }

  /**
   * Manipula navegação do histórico
   */
  async handlePopState(event) {
    if (this.isProcessing) return;

    const canProceed = await this._canNavigate('browser-back', { source: 'popstate' });

    if (!canProceed) {
      // Prevenir navegação restaurando o estado atual
      history.pushState(null, '', location.href);
    }
  }

  /**
   * Log de navegação para debug
   */
  _logNavigation(action, targetRoute, details) {
    if (!this.config.debugMode && !localStorage.getItem('debug-navigation')) {
      return;
    }

    console.log(`[NavigationGuard] ${action.toUpperCase()}:`, {
      targetRoute,
      details,
      timestamp: new Date().toISOString(),
      workoutActive: AppState.get('isWorkoutActive'),
      hasUnsavedData: AppState.get('hasUnsavedData'),
    });
  }

  /**
   * Fallback simples em caso de erro
   */
  static _fallbackCanNavigate() {
    const isWorkoutActive = AppState.get('isWorkoutActive');

    if (isWorkoutActive) {
      return confirm('Você tem um treino em andamento. Deseja realmente sair?');
    }

    return true;
  }

  /**
   * Obtém instância singleton
   */
  static getInstance() {
    if (!NavigationGuard._instance) {
      NavigationGuard._instance = new NavigationGuard();
    }
    return NavigationGuard._instance;
  }

  /**
   * Configurações do guard
   */
  static configure(options = {}) {
    const guard = NavigationGuard.getInstance();
    Object.assign(guard.config, options);
    console.log('[NavigationGuard] Configurado:', guard.config);
  }

  /**
   * Informações de debug
   */
  static getDebugInfo() {
    const guard = NavigationGuard.getInstance();
    return {
      isProcessing: guard.isProcessing,
      pendingNavigation: guard.pendingNavigation,
      config: guard.config,
      appState: {
        isWorkoutActive: AppState.get('isWorkoutActive'),
        hasUnsavedData: AppState.get('hasUnsavedData'),
      },
    };
  }

  /**
   * Cleanup de recursos
   */
  destroy() {
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
    window.removeEventListener('popstate', this.handlePopState);
    NavigationGuard._instance = null;
  }
}

// Funções utilitárias para uso direto
export const canNavigate = NavigationGuard.canNavigate;
export const checkForRecovery = NavigationGuard.checkForRecovery;
export const showRecoveryModal = NavigationGuard.showRecoveryModal;
export const configureGuard = NavigationGuard.configure;
export const getNavigationDebugInfo = NavigationGuard.getDebugInfo;

// Disponibilizar globalmente para debug
window.NavigationGuard = NavigationGuard;
window.getNavigationDebugInfo = getNavigationDebugInfo;

export default NavigationGuard;
