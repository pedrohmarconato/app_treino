// integration/setupHome.js - Script de integração final para a home
import { setupHomeReactivity, HomeAnimations, stateNotifier } from '../utils/reactiveUI.js';
import { carregarDashboard, recarregarDashboard } from '../feature/dashboard.js';
import { MetricsWidget } from '../components/MetricsWidget.js';
import AppState from '../state/appState.js';

// Classe principal para gerenciar a home
export class HomeManager {
    constructor() {
        this.isInitialized = false;
        this.metricsWidget = null;
        this.refreshInterval = null;
        this.animationTimeouts = [];
    }

    // Inicializar home completa
    async init() {
        if (this.isInitialized) {
            console.log('[HomeManager] Já inicializado, pulando...');
            return;
        }

        console.log('[HomeManager] 🚀 Inicializando home completa...');

        try {
            // 1. Verificar se usuário está logado
            const currentUser = AppState.get('currentUser');
            if (!currentUser) {
                console.error('[HomeManager] Usuário não encontrado');
                return;
            }

            // 2. Configurar sistema reativo
            this.setupReactiveSystem();

            // 3. Carregar dados do dashboard
            await this.loadDashboardData();

            // 4. Configurar componentes avançados
            await this.setupAdvancedComponents();

            // 5. Configurar animações
            this.setupAnimations();

            // 6. Configurar atualizações automáticas
            this.setupAutoRefresh();

            // 7. Configurar event listeners
            this.setupEventListeners();

            this.isInitialized = true;
            console.log('[HomeManager] ✅ Home inicializada com sucesso!');

            // Notificar sucesso
            if (window.showNotification) {
                window.showNotification(`Bem-vindo, ${currentUser.nome}! 👋`, 'success');
            }

        } catch (error) {
            console.error('[HomeManager] Erro na inicialização:', error);
            
            // Fallback para inicialização básica
            await this.initBasicFallback();
        }
    }

    // Configurar sistema reativo
    setupReactiveSystem() {
        console.log('[HomeManager] Configurando sistema reativo...');
        
        try {
            setupHomeReactivity();
            stateNotifier.setup();
            console.log('[HomeManager] ✅ Sistema reativo configurado');
        } catch (error) {
            console.error('[HomeManager] Erro no sistema reativo:', error);
        }
    }

    // Carregar dados do dashboard
    async loadDashboardData() {
        console.log('[HomeManager] Carregando dados do dashboard...');
        
        try {
            await carregarDashboard();
            console.log('[HomeManager] ✅ Dashboard carregado');
        } catch (error) {
            console.warn('[HomeManager] Erro ao carregar dashboard:', error);
            // Continuar mesmo com erro
        }
    }

    // Configurar componentes avançados
    async setupAdvancedComponents() {
        console.log('[HomeManager] Configurando componentes avançados...');

        try {
            // Widget de métricas avançado (se container existir)
            const advancedContainer = document.getElementById('metrics-advanced-container');
            if (advancedContainer) {
                this.metricsWidget = new MetricsWidget('metrics-advanced-container');
                await this.metricsWidget.init();
                console.log('[HomeManager] ✅ Widget de métricas avançado inicializado');
            }

            // Configurar tooltips
            this.setupTooltips();

            // Configurar ações contextuais
            this.setupContextualActions();

        } catch (error) {
            console.error('[HomeManager] Erro nos componentes avançados:', error);
        }
    }

    // Configurar animações
    setupAnimations() {
        console.log('[HomeManager] Configurando animações...');

        try {
            // Sequência de animações de entrada
            this.animationTimeouts.push(
                setTimeout(() => HomeAnimations.animateCurrentWorkout(), 200),
                setTimeout(() => HomeAnimations.animateWeekIndicators(), 400),
                setTimeout(() => HomeAnimations.animateMetrics(), 600)
            );

            // Configurar animações de hover
            this.setupHoverAnimations();

            console.log('[HomeManager] ✅ Animações configuradas');
        } catch (error) {
            console.error('[HomeManager] Erro nas animações:', error);
        }
    }

    // Configurar atualizações automáticas
    setupAutoRefresh() {
        console.log('[HomeManager] Configurando atualizações automáticas...');

        // Atualizar dados a cada 5 minutos
        this.refreshInterval = setInterval(async () => {
            try {
                console.log('[HomeManager] Atualizando dados automaticamente...');
                await this.refreshData();
            } catch (error) {
                console.error('[HomeManager] Erro na atualização automática:', error);
            }
        }, 5 * 60 * 1000); // 5 minutos

        // Atualizar progresso circular a cada minuto
        setInterval(() => {
            this.updateTimeBasedProgress();
        }, 60 * 1000); // 1 minuto

        console.log('[HomeManager] ✅ Atualizações automáticas configuradas');
    }

    // Configurar event listeners
    setupEventListeners() {
        console.log('[HomeManager] Configurando event listeners...');

        try {
            // Listener para mudanças de foco da janela
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden) {
                    console.log('[HomeManager] Página voltou ao foco, atualizando...');
                    this.refreshData();
                }
            });

            // Listener para redimensionamento
            window.addEventListener('resize', () => {
                this.handleResize();
            });

            // Listeners para teclado (atalhos)
            document.addEventListener('keydown', (e) => {
                this.handleKeyboard(e);
            });

            console.log('[HomeManager] ✅ Event listeners configurados');
        } catch (error) {
            console.error('[HomeManager] Erro nos event listeners:', error);
        }
    }

    // Configurar tooltips
    setupTooltips() {
        const elementsWithTooltips = [
            { id: 'completed-workouts', text: 'Total de treinos concluídos esta semana' },
            { id: 'current-week', text: 'Semana atual do seu protocolo' },
            { id: 'progress-percentage', text: 'Seu progresso geral no protocolo' },
            { id: 'start-workout-btn', text: 'Clique para iniciar o treino de hoje' }
        ];

        elementsWithTooltips.forEach(({ id, text }) => {
            const element = document.getElementById(id);
            if (element) {
                element.title = text;
                element.setAttribute('data-tooltip', text);
            }
        });
    }

    // Configurar ações contextuais
    setupContextualActions() {
        // Clique duplo nas métricas para refresh
        const metricCards = document.querySelectorAll('.metric-card');
        metricCards.forEach(card => {
            card.addEventListener('dblclick', () => {
                this.refreshData();
                if (window.showNotification) {
                    window.showNotification('Dados atualizados! 🔄', 'info');
                }
            });
        });

        // Clique longo nos indicadores da semana
        const dayIndicators = document.querySelectorAll('.day-indicator');
        dayIndicators.forEach((indicator, index) => {
            let pressTimer;
            
            indicator.addEventListener('mousedown', () => {
                pressTimer = setTimeout(() => {
                    this.showDayDetails(index);
                }, 1000);
            });
            
            indicator.addEventListener('mouseup', () => {
                clearTimeout(pressTimer);
            });
            
            indicator.addEventListener('mouseleave', () => {
                clearTimeout(pressTimer);
            });
        });
    }

    // Configurar animações de hover
    setupHoverAnimations() {
        // Efeito nos cards de métrica
        const metricCards = document.querySelectorAll('.metric-card');
        metricCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-4px) scale(1.02)';
                card.style.boxShadow = '0 12px 40px rgba(168, 255, 0, 0.2)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
                card.style.boxShadow = '';
            });
        });

        // Efeito no card do treino atual
        const workoutCard = document.getElementById('current-workout-card');
        if (workoutCard) {
            workoutCard.addEventListener('mouseenter', () => {
                workoutCard.style.transform = 'scale(1.01)';
            });
            
            workoutCard.addEventListener('mouseleave', () => {
                workoutCard.style.transform = 'scale(1)';
            });
        }
    }

    // Atualizar dados
    async refreshData() {
        try {
            console.log('[HomeManager] Atualizando dados...');
            
            // Recarregar dashboard
            await recarregarDashboard();
            
            // Atualizar widget de métricas se existir
            if (this.metricsWidget) {
                await this.metricsWidget.loadMetrics();
                this.metricsWidget.updateValues();
            }
            
            console.log('[HomeManager] ✅ Dados atualizados');
            
        } catch (error) {
            console.error('[HomeManager] Erro ao atualizar dados:', error);
        }
    }

    // Atualizar progresso baseado no tempo
    updateTimeBasedProgress() {
        const now = new Date();
        const hour = now.getHours();
        
        // Simular progresso do dia (6h às 22h = 100%)
        const dayProgress = Math.min(Math.max((hour - 6) / 16 * 100, 0), 100);
        
        // Atualizar progresso circular se for um dia de treino
        const workout = AppState.get('currentWorkout');
        if (workout && workout.tipo !== 'folga') {
            HomeAnimations.animateCircularProgress('workout-progress-circle', dayProgress);
            
            const progressText = document.getElementById('workout-progress-text');
            if (progressText && workout.tipo !== 'cardio') {
                progressText.textContent = `${Math.round(dayProgress)}%`;
            }
        }
    }

    // Lidar com redimensionamento
    handleResize() {
        // Reajustar layouts se necessário
        if (this.metricsWidget) {
            // Reposicionar elementos do widget se necessário
        }
    }

    // Lidar com atalhos de teclado
    handleKeyboard(e) {
        // Ctrl/Cmd + R: Refresh manual
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            this.refreshData();
            return;
        }

        // Espaço: Iniciar treino
        if (e.code === 'Space' && !e.target.matches('input, textarea')) {
            e.preventDefault();
            const startBtn = document.getElementById('start-workout-btn');
            if (startBtn && !startBtn.disabled) {
                startBtn.click();
            }
        }

        // P: Abrir planejamento
        if (e.key === 'p' && !e.target.matches('input, textarea')) {
            if (window.abrirPlanejamentoParaUsuarioAtual) {
                window.abrirPlanejamentoParaUsuarioAtual();
            }
        }
    }

    // Mostrar detalhes do dia
    showDayDetails(dayIndex) {
        const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const dayName = daysOfWeek[dayIndex];
        
        const weekPlan = AppState.get('weekPlan');
        const dayPlan = weekPlan ? weekPlan[dayIndex] : null;
        
        let message = `${dayName}: `;
        if (dayPlan) {
            if (typeof dayPlan === 'string') {
                message += dayPlan === 'folga' ? 'Dia de Folga' : 
                          dayPlan === 'cardio' ? 'Cardio' : 
                          `Treino ${dayPlan}`;
            } else if (dayPlan.tipo) {
                message += dayPlan.tipo === 'folga' ? 'Dia de Folga' :
                          dayPlan.tipo === 'Cardio' ? 'Cardio' :
                          `Treino ${dayPlan.tipo}`;
            }
        } else {
            message += 'Não configurado';
        }
        
        if (window.showNotification) {
            window.showNotification(message, 'info');
        }
    }

    // Inicialização básica em caso de erro
    async initBasicFallback() {
        console.log('[HomeManager] Iniciando fallback básico...');
        
        try {
            // Configurar botão básico
            const startBtn = document.getElementById('start-workout-btn');
            if (startBtn) {
                startBtn.disabled = false;
                startBtn.onclick = () => {
                    if (window.showNotification) {
                        window.showNotification('Sistema em modo básico. Algumas funcionalidades podem estar limitadas.', 'warning');
                    }
                };
            }
            
            // Configurar valores padrão
            const currentUser = AppState.get('currentUser');
            if (currentUser) {
                const userNameEl = document.getElementById('user-name');
                if (userNameEl) userNameEl.textContent = currentUser.nome;
            }
            
            console.log('[HomeManager] ✅ Fallback básico configurado');
            
        } catch (error) {
            console.error('[HomeManager] Erro no fallback básico:', error);
        }
    }

    // Destruir instância
    destroy() {
        console.log('[HomeManager] Destruindo instância...');
        
        // Limpar timeouts
        this.animationTimeouts.forEach(timeout => clearTimeout(timeout));
        this.animationTimeouts = [];
        
        // Limpar intervalos
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
        
        // Destruir widget de métricas
        if (this.metricsWidget) {
            this.metricsWidget.destroy();
            this.metricsWidget = null;
        }
        
        this.isInitialized = false;
        console.log('[HomeManager] ✅ Instância destruída');
    }
}

// Instância global do gerenciador
export const homeManager = new HomeManager();

// Função global para inicializar a home
window.initializeHomeComplete = async function() {
    await homeManager.init();
};

// Função global para destruir a home
window.destroyHome = function() {
    homeManager.destroy();
};

// Exportar para uso em outros módulos
export default homeManager;