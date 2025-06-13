// services/integrationService.js - Serviço de integração consolidado
// Substitui homeService.js e outras duplicatas

import AppState from '../state/appState.js';
import { carregarDashboard, recarregarDashboard } from '../feature/dashboard.js';
import { reactiveUI, setupHomeReactivity, HomeAnimations, stateNotifier } from '../utils/reactiveUI.js';
import { weeklyPlanManager } from '../hooks/useWeeklyPlan.js';

/**
 * Serviço principal de integração da aplicação
 * Consolida funcionalidades de dashboard, reactive UI e home manager
 */
class IntegrationService {
    constructor() {
        this.isInitialized = false;
        this.activeComponents = new Map();
        this.eventListeners = [];
        this.initTime = null;
    }

    /**
     * Inicializar serviço completo
     */
    async initialize() {
        if (this.isInitialized) {
            console.log('[IntegrationService] Já inicializado');
            return;
        }

        console.log('[IntegrationService] 🚀 Inicializando integração completa...');

        try {
            // 1. Verificar usuário atual
            const currentUser = AppState.get('currentUser');
            if (!currentUser) {
                console.warn('[IntegrationService] Nenhum usuário logado');
                return false;
            }

            // 2. Inicializar sistema reativo
            await this.initializeReactiveSystem();

            // 3. Inicializar weekly plan manager
            await this.initializeWeeklyPlan(currentUser.id);

            // 4. Carregar dashboard
            await this.loadDashboard();

            // 5. Configurar componentes avançados
            await this.setupAdvancedComponents();

            // 6. Configurar listeners globais
            this.setupGlobalListeners();

            this.isInitialized = true;
            this.initTime = Date.now();
            console.log('[IntegrationService] ✅ Integração inicializada com sucesso!');

            return true;

        } catch (error) {
            console.error('[IntegrationService] Erro na inicialização:', error);
            return false;
        }
    }

    /**
     * Inicializar sistema reativo
     */
    async initializeReactiveSystem() {
        try {
            if (!reactiveUI.isInitialized) {
                reactiveUI.init();
            }
            
            setupHomeReactivity();
            stateNotifier.setup();
            
            console.log('[IntegrationService] ✅ Sistema reativo inicializado');
            
        } catch (error) {
            console.error('[IntegrationService] Erro no sistema reativo:', error);
        }
    }

    /**
     * Inicializar weekly plan manager
     */
    async initializeWeeklyPlan(userId) {
        try {
            const result = await weeklyPlanManager.initialize(userId);
            
            if (result.needsPlanning) {
                console.log('[IntegrationService] ⚠️ Usuário precisa configurar planejamento');
                // Não redirecionar automaticamente, deixar para o usuário decidir
            } else {
                console.log('[IntegrationService] ✅ Plano semanal carregado');
                AppState.set('weekPlan', result.plan);
            }
            
            return result;
            
        } catch (error) {
            console.error('[IntegrationService] Erro no weekly plan:', error);
            return { needsPlanning: true };
        }
    }

    /**
     * Carregar dashboard
     */
    async loadDashboard() {
        try {
            await carregarDashboard();
            console.log('[IntegrationService] ✅ Dashboard carregado');
            
        } catch (error) {
            console.warn('[IntegrationService] Erro no dashboard:', error);
            // Não é crítico, continuar
        }
    }

    /**
     * Configurar componentes avançados
     */
    async setupAdvancedComponents() {
        try {
            // Widget de métricas avançado (se disponível)
            if (window.MetricsWidget) {
                const metricsContainer = document.getElementById('metrics-advanced-container');
                if (metricsContainer) {
                    const metricsWidget = new window.MetricsWidget('metrics-advanced-container');
                    await metricsWidget.init();
                    
                    this.activeComponents.set('metricsWidget', metricsWidget);
                    console.log('[IntegrationService] ✅ MetricsWidget inicializado');
                }
            }

            // Configurar animações de entrada
            this.setupEntryAnimations();

        } catch (error) {
            console.error('[IntegrationService] Erro nos componentes avançados:', error);
        }
    }

    /**
     * Configurar animações de entrada
     */
    setupEntryAnimations() {
        try {
            // Animar componentes principais
            setTimeout(() => HomeAnimations.animateCurrentWorkout(), 200);
            setTimeout(() => HomeAnimations.animateWeekIndicators(), 400);
            setTimeout(() => HomeAnimations.animateMetrics(), 600);

            console.log('[IntegrationService] ✅ Animações configuradas');

        } catch (error) {
            console.error('[IntegrationService] Erro nas animações:', error);
        }
    }

    /**
     * Configurar listeners globais
     */
    setupGlobalListeners() {
        // Listener para mudanças de usuário
        const userListener = AppState.subscribe('currentUser', async (newUser) => {
            if (newUser) {
                console.log('[IntegrationService] Usuário alterado, reinicializando...');
                await this.reinitialize();
            }
        });

        // Listener para mudanças no plano semanal
        const planListener = AppState.subscribe('weekPlan', (newPlan) => {
            if (newPlan) {
                console.log('[IntegrationService] Plano semanal atualizado');
                this.refreshDashboard();
            }
        });

        // Listener para visibilidade da página
        const visibilityListener = () => {
            if (!document.hidden) {
                console.log('[IntegrationService] Página voltou ao foco, atualizando...');
                this.refreshDashboard();
            }
        };

        document.addEventListener('visibilitychange', visibilityListener);

        // Armazenar listeners para cleanup
        this.eventListeners.push(
            userListener,
            planListener,
            () => document.removeEventListener('visibilitychange', visibilityListener)
        );

        console.log('[IntegrationService] ✅ Listeners globais configurados');
    }

    /**
     * Reinicializar serviço
     */
    async reinitialize() {
        console.log('[IntegrationService] Reinicializando...');
        
        // Limpar estado atual
        this.cleanup();
        
        // Inicializar novamente
        this.isInitialized = false;
        await this.initialize();
    }

    /**
     * Atualizar dashboard
     */
    async refreshDashboard() {
        try {
            await recarregarDashboard();
            console.log('[IntegrationService] ✅ Dashboard atualizado');
            
        } catch (error) {
            console.error('[IntegrationService] Erro ao atualizar dashboard:', error);
        }
    }

    /**
     * Verificar status do serviço
     */
    getStatus() {
        const currentUser = AppState.get('currentUser');
        const weekPlan = AppState.get('weekPlan');
        
        return {
            isInitialized: this.isInitialized,
            hasUser: !!currentUser,
            hasWeekPlan: !!weekPlan,
            activeComponents: Array.from(this.activeComponents.keys()),
            userName: currentUser?.nome || null
        };
    }

    /**
     * Obter métricas de performance
     */
    getPerformanceMetrics() {
        return {
            componentsLoaded: this.activeComponents.size,
            listenersActive: this.eventListeners.length,
            memoryUsage: performance.memory ? {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)
            } : null,
            uptime: this.isInitialized ? Date.now() - this.initTime : 0
        };
    }

    /**
     * Limpar recursos
     */
    cleanup() {
        console.log('[IntegrationService] Limpando recursos...');

        // Limpar componentes ativos
        this.activeComponents.forEach((component, name) => {
            try {
                if (component && typeof component.destroy === 'function') {
                    component.destroy();
                }
                console.log(`[IntegrationService] Componente ${name} limpo`);
            } catch (error) {
                console.warn(`[IntegrationService] Erro ao limpar ${name}:`, error);
            }
        });
        this.activeComponents.clear();

        // Limpar event listeners
        this.eventListeners.forEach(cleanup => {
            try {
                cleanup();
            } catch (error) {
                console.warn('[IntegrationService] Erro ao limpar listener:', error);
            }
        });
        this.eventListeners = [];

        console.log('[IntegrationService] ✅ Recursos limpos');
    }

    /**
     * Destruir serviço
     */
    destroy() {
        console.log('[IntegrationService] Destruindo serviço...');
        
        this.cleanup();
        this.isInitialized = false;
        
        console.log('[IntegrationService] ✅ Serviço destruído');
    }
}

// Instância global
export const integrationService = new IntegrationService();

// Funções de conveniência para compatibilidade
export async function initializeIntegration() {
    return await integrationService.initialize();
}

export function getIntegrationStatus() {
    return integrationService.getStatus();
}

export function cleanupIntegration() {
    integrationService.cleanup();
}

// Função global para inicialização completa da home
window.initializeHomeComplete = async function() {
    const result = await integrationService.initialize();
    
    if (!result) {
        console.warn('[initializeHomeComplete] Falha na inicialização');
        if (window.showNotification) {
            window.showNotification('Erro ao inicializar componentes da home', 'error');
        }
    }
    
    return result;
};

// Função para debug (desenvolvimento)
if (typeof window !== 'undefined' && 
    (window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1'))) {
    
    window.debugIntegration = {
        service: integrationService,
        status: () => integrationService.getStatus(),
        metrics: () => integrationService.getPerformanceMetrics(),
        reinit: () => integrationService.reinitialize(),
        cleanup: () => integrationService.cleanup()
    };
}