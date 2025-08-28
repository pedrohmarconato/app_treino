// core/NavigationManager.js
// Sistema de navegação coordenado para SPA

import AppState from '../state/appState.js';
import eventBus from './EventBus.js';

export class NavigationManager {
  constructor() {
    this.currentScreen = null;
    this.screens = new Map();
    this.navigationGuards = [];
    this.isNavigating = false;
    this.history = [];
    this.maxHistorySize = 10;
  }

  /**
   * Registra uma tela no sistema
   */
  registerScreen(name, screen) {
    console.log(`[NavigationManager] Registering screen: ${name}`);
    this.screens.set(name, screen);
  }

  /**
   * Adiciona guard de navegação
   */
  addNavigationGuard(guard) {
    this.navigationGuards.push(guard);
  }

  /**
   * Navega para uma tela
   */
  async navigate(screenName, options = {}) {
    // Prevenir navegação dupla
    if (this.isNavigating) {
      console.warn('[NavigationManager] Navigation already in progress');
      return false;
    }

    // Verificar se é a mesma tela
    if (this.currentScreen === screenName && !options.force) {
      console.log('[NavigationManager] Already on screen:', screenName);
      return true;
    }

    console.log(`[NavigationManager] Navigating to: ${screenName}`);
    this.isNavigating = true;

    try {
      // 1. Verificar se tela existe
      if (!this.screens.has(screenName)) {
        throw new Error(`Screen not registered: ${screenName}`);
      }

      // 2. Executar guards
      const canNavigate = await this.checkNavigationGuards(screenName, options);
      if (!canNavigate) {
        console.log('[NavigationManager] Navigation cancelled by guard');
        return false;
      }

      // 3. Emitir evento before-navigate
      eventBus.emit('before-navigate', {
        from: this.currentScreen,
        to: screenName,
        options,
      });

      // 4. Desmontar tela atual
      if (this.currentScreen && this.screens.has(this.currentScreen)) {
        console.log(`[NavigationManager] Unmounting current screen: ${this.currentScreen}`);
        const currentScreenComponent = this.screens.get(this.currentScreen);

        try {
          await currentScreenComponent.unmount();
        } catch (error) {
          console.error('[NavigationManager] Error unmounting screen:', error);
        }
      }

      // 5. Renderizar template
      await this.renderTemplate(screenName, options);

      // 6. Aguardar DOM estabilizar
      await this.waitForDOMStability();

      // 7. Montar nova tela
      const screen = this.screens.get(screenName);
      console.log(`[NavigationManager] Mounting new screen: ${screenName}`);
      await screen.mount();

      // 8. Atualizar estado
      const previousScreen = this.currentScreen;
      this.currentScreen = screenName;

      // 9. Adicionar ao histórico
      this.addToHistory({
        screen: screenName,
        timestamp: Date.now(),
        options,
      });

      // 10. Emitir evento after-navigate
      eventBus.emit('after-navigate', {
        from: previousScreen,
        to: screenName,
        options,
      });

      console.log(`[NavigationManager] ✅ Navigation complete: ${screenName}`);
      return true;
    } catch (error) {
      console.error('[NavigationManager] Navigation error:', error);
      eventBus.emit('navigation-error', { error, screenName });

      // Tentar recuperar
      if (this.currentScreen) {
        await this.recoverCurrentScreen();
      }

      return false;
    } finally {
      this.isNavigating = false;
    }
  }

  /**
   * Verifica guards de navegação
   */
  async checkNavigationGuards(screenName, options) {
    for (const guard of this.navigationGuards) {
      try {
        const canNavigate = await guard({
          from: this.currentScreen,
          to: screenName,
          options,
        });

        if (!canNavigate) {
          return false;
        }
      } catch (error) {
        console.error('[NavigationManager] Guard error:', error);
        // Em caso de erro no guard, permitir navegação
      }
    }

    return true;
  }

  /**
   * Renderiza template da tela
   */
  async renderTemplate(screenName, options) {
    console.log(`[NavigationManager] Rendering template: ${screenName}`);

    // Mapear nome da tela para template se necessário
    const templateName = this.getTemplateName(screenName);

    // Verificar se sistema de templates está disponível
    if (!window.renderTemplate) {
      throw new Error('Template system not available');
    }

    // Renderizar template
    try {
      await window.renderTemplate(templateName, options);
    } catch (error) {
      console.error('[NavigationManager] Template render error:', error);
      throw new Error(`Failed to render template: ${templateName}`);
    }
  }

  /**
   * Aguarda DOM estabilizar após renderização
   */
  async waitForDOMStability(maxWait = 1000) {
    const startTime = Date.now();
    let lastChangeTime = Date.now();
    let observer = null;

    return new Promise((resolve) => {
      // Criar observer para detectar mudanças
      observer = new MutationObserver(() => {
        lastChangeTime = Date.now();
      });

      // Observar mudanças no app container
      const appContainer = document.getElementById('app');
      if (appContainer) {
        observer.observe(appContainer, {
          childList: true,
          subtree: true,
        });
      }

      // Verificar estabilidade periodicamente
      const checkStability = () => {
        const now = Date.now();
        const timeSinceLastChange = now - lastChangeTime;
        const totalWaitTime = now - startTime;

        // DOM estável por 100ms ou timeout
        if (timeSinceLastChange > 100 || totalWaitTime > maxWait) {
          if (observer) observer.disconnect();
          resolve();
        } else {
          setTimeout(checkStability, 50);
        }
      };

      // Iniciar verificação após pequeno delay
      setTimeout(checkStability, 50);
    });
  }

  /**
   * Mapeia nome da tela para nome do template
   */
  getTemplateName(screenName) {
    const templateMap = {
      'login-screen': 'login',
      'home-screen': 'home',
      'workout-screen': 'workout',
      'planning-screen': 'planejamentoSemanalPage',
    };

    return templateMap[screenName] || screenName;
  }

  /**
   * Adiciona entrada ao histórico
   */
  addToHistory(entry) {
    this.history.push(entry);

    // Limitar tamanho do histórico
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  /**
   * Navega de volta no histórico
   */
  async goBack() {
    if (this.history.length <= 1) {
      console.log('[NavigationManager] No history to go back');
      return false;
    }

    // Remover entrada atual
    this.history.pop();

    // Pegar entrada anterior
    const previousEntry = this.history[this.history.length - 1];
    if (previousEntry) {
      return await this.navigate(previousEntry.screen, {
        ...previousEntry.options,
        isBack: true,
      });
    }

    return false;
  }

  /**
   * Tenta recuperar tela atual em caso de erro
   */
  async recoverCurrentScreen() {
    if (!this.currentScreen || !this.screens.has(this.currentScreen)) {
      return;
    }

    console.log(`[NavigationManager] Attempting to recover screen: ${this.currentScreen}`);

    try {
      const screen = this.screens.get(this.currentScreen);
      if (!screen.isMounted) {
        await screen.mount();
      }
    } catch (error) {
      console.error('[NavigationManager] Recovery failed:', error);
    }
  }

  /**
   * Obtém tela atual
   */
  getCurrentScreen() {
    return this.currentScreen;
  }

  /**
   * Verifica se está em uma tela específica
   */
  isOnScreen(screenName) {
    return this.currentScreen === screenName;
  }

  /**
   * Força navegação sem guards
   */
  async forceNavigate(screenName, options = {}) {
    console.warn(`[NavigationManager] Force navigating to: ${screenName}`);

    // Temporariamente remover guards
    const guards = this.navigationGuards;
    this.navigationGuards = [];

    try {
      return await this.navigate(screenName, { ...options, force: true });
    } finally {
      // Restaurar guards
      this.navigationGuards = guards;
    }
  }

  /**
   * Recarrega tela atual
   */
  async reload() {
    if (!this.currentScreen) {
      console.warn('[NavigationManager] No current screen to reload');
      return false;
    }

    return await this.navigate(this.currentScreen, { force: true });
  }
}

// Singleton
const navigationManager = new NavigationManager();

// Guards padrão
navigationManager.addNavigationGuard(async ({ from, to }) => {
  // Verificar se há treino em andamento
  const isWorkoutActive = AppState.get('isWorkoutActive');

  if (isWorkoutActive && from === 'workout-screen') {
    const confirmed = confirm('Você tem um treino em andamento. Deseja realmente sair?');
    return confirmed;
  }

  return true;
});

export default navigationManager;
