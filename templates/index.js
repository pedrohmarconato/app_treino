// templates/index.js - Sistema de templates ATUALIZADO com novo home
import { modalPlanejamentoTemplate, modalPlanejamentoStyles } from './modals.js';
import { loginTemplate, loginStyles } from './login.js';
import { homeTemplate, homeStyles } from './home.js';
import { workoutTemplate, workoutStyles } from './workout.js';
import OrderWeekPage, { orderWeekStyles } from './OrderWeekPage.js';
import { MetricsWidget, metricsWidgetStyles } from '../components/MetricsWidget.js';

// Exportar componentes globalmente
window.modalPlanejamentoTemplate = modalPlanejamentoTemplate;
window.modalPlanejamentoStyles = modalPlanejamentoStyles;
window.MetricsWidget = MetricsWidget;

// Função principal para renderizar templates
export function renderTemplate(templateName, container = 'app') {
    console.log('[renderTemplate] Renderizando template:', templateName);
    
    const containerEl = typeof container === 'string' 
        ? document.getElementById(container) 
        : container;
    
    if (!containerEl) {
        console.error(`[renderTemplate] Container ${container} não encontrado`);
        return;
    }
    
    try {
        switch(templateName) {
            case 'login':
                console.log('[renderTemplate] Renderizando login');
                containerEl.innerHTML = loginTemplate();
                break;
                
            case 'home':
                console.log('[renderTemplate] Renderizando home NOVA');
                containerEl.innerHTML = homeTemplate();
                
                // NOVO: Inicializar componentes avançados da home
                setTimeout(() => {
                    initializeHomeComponents();
                }, 100);
                break;
                
            case 'workout':
                console.log('[renderTemplate] Renderizando workout');
                containerEl.innerHTML = workoutTemplate();
                break;
                
            case 'orderWeek':
                console.log('[renderTemplate] Renderizando orderWeek');
                containerEl.innerHTML = '';
                const root = document.createElement('div');
                root.id = 'order-week-root';
                containerEl.appendChild(root);
                
                const currentUser = window.AppState?.get('currentUser');
                if (!currentUser) {
                    console.warn('[renderTemplate] Usuário não logado, redirecionando para login');
                    setTimeout(() => renderTemplate('login'), 100);
                    return;
                }
                
                // Redirecionar para home por enquanto
                console.log('[renderTemplate] Redirecionando OrderWeek para Home temporariamente');
                setTimeout(() => {
                    renderTemplate('home');
                    if (window.showNotification) {
                        window.showNotification('Redirecionado para home. OrderWeek em desenvolvimento.', 'info');
                    }
                }, 500);
                break;
                
            case 'planejamentoSemanalPage':
                console.log('[renderTemplate] Renderizando planejamentoSemanalPage');
                containerEl.innerHTML = window.modalPlanejamentoTemplate();
                break;
                
            default:
                console.error(`[renderTemplate] Template ${templateName} não encontrado`);
                
                if (templateName !== 'home') {
                    console.log('[renderTemplate] Fallback: renderizando home');
                    renderTemplate('home');
                }
        }
        
        console.log(`[renderTemplate] ✅ Template ${templateName} renderizado com sucesso`);
        
    } catch (error) {
        console.error(`[renderTemplate] Erro ao renderizar template ${templateName}:`, error);
        
        if (templateName !== 'login') {
            console.log('[renderTemplate] Fallback por erro: renderizando login');
            setTimeout(() => renderTemplate('login'), 500);
        }
    }
}

// NOVA FUNÇÃO: Inicializar componentes específicos da home
async function initializeHomeComponents() {
    console.log('[initializeHomeComponents] Inicializando componentes da home...');
    
    try {
        const currentUser = window.AppState?.get('currentUser');
        
        if (!currentUser) {
            console.warn('[initializeHomeComponents] Nenhum usuário logado, redirecionando para login');
            setTimeout(() => renderTemplate('login'), 500);
            return;
        }
        
        console.log('[initializeHomeComponents] Inicializando para usuário:', currentUser.nome);
        
        // 1. Atualizar informações do usuário na UI
        updateUserInfo(currentUser);
        
        // 2. Inicializar widget de métricas avançado (se container existir)
        const metricsContainer = document.getElementById('metrics-advanced-container');
        if (metricsContainer) {
            const metricsWidget = new MetricsWidget('metrics-advanced-container');
            await metricsWidget.init();
            
            // Salvar referência para cleanup posterior se necessário
            window.currentMetricsWidget = metricsWidget;
        }
        
        // 3. Carregar dashboard principal
        setTimeout(async () => {
            try {
                if (window.carregarDashboard) {
                    console.log('[initializeHomeComponents] Carregando dashboard...');
                    await window.carregarDashboard();
                    console.log('[initializeHomeComponents] ✅ Dashboard carregado com sucesso');
                } else {
                    console.warn('[initializeHomeComponents] window.carregarDashboard não disponível');
                    setupBasicHomeElements(currentUser);
                }
            } catch (error) {
                console.error('[initializeHomeComponents] Erro ao carregar dashboard:', error);
                setupBasicHomeElements(currentUser);
            }
        }, 200);
        
        // 4. Configurar animações de entrada
        setupHomeAnimations();
        
        console.log('[initializeHomeComponents] ✅ Componentes da home inicializados');
        
    } catch (error) {
        console.error('[initializeHomeComponents] Erro:', error);
    }
}

// Atualizar informações do usuário
function updateUserInfo(user) {
    try {
        const userNameEl = document.getElementById('user-name');
        if (userNameEl) {
            userNameEl.textContent = user.nome;
        }
        
        const userImages = {
            'Pedro': 'pedro.png',
            'Japa': 'japa.png'
        };
        
        const avatarEl = document.getElementById('user-avatar');
        if (avatarEl) {
            avatarEl.src = userImages[user.nome] || 'pedro.png';
            avatarEl.alt = user.nome;
        }
        
        console.log('[updateUserInfo] ✅ Informações do usuário atualizadas:', user.nome);
        
    } catch (error) {
        console.error('[updateUserInfo] Erro:', error);
    }
}

// Configurar elementos básicos da home se o dashboard falhar
function setupBasicHomeElements(user) {
    try {
        const startBtn = document.getElementById('start-workout-btn');
        if (startBtn) {
            startBtn.disabled = false;
            startBtn.onclick = () => {
                const workout = window.AppState?.get('currentWorkout');
                if (workout) {
                    if (workout.tipo === 'folga') {
                        if (window.showNotification) {
                            window.showNotification('Hoje é dia de descanso! 😴', 'info');
                        }
                    } else if (workout.tipo === 'cardio') {
                        if (window.showNotification) {
                            window.showNotification('Hora do cardio! 🏃‍♂️', 'info');
                        }
                    } else {
                        if (window.showNotification) {
                            window.showNotification('Treino de força em desenvolvimento 💪', 'info');
                        }
                    }
                } else {
                    if (window.showNotification) {
                        window.showNotification('Configure seu planejamento primeiro', 'warning');
                    }
                }
            };
        }
        
        // Configurar valores padrão
        updateElement('user-name', user.nome);
        updateElement('workout-name', 'Configurar Treino');
        updateElement('completed-workouts', '0');
        updateElement('current-week', '1');
        updateElement('progress-percentage', '0%');
        
        console.log('[setupBasicHomeElements] ✅ Elementos básicos configurados');
        
    } catch (error) {
        console.error('[setupBasicHomeElements] Erro:', error);
    }
}

// Configurar animações da home
function setupHomeAnimations() {
    try {
        // Animar entrada das seções
        const sections = document.querySelectorAll('.training-plan, .metrics-section, .weekly-plan-section');
        sections.forEach((section, index) => {
            section.style.opacity = '0';
            section.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                section.style.transition = 'all 0.6s ease-out';
                section.style.opacity = '1';
                section.style.transform = 'translateY(0)';
            }, index * 150);
        });
        
        // Animar entrada dos indicadores da semana
        setTimeout(() => {
            const dayIndicators = document.querySelectorAll('.day-indicator');
            dayIndicators.forEach((indicator, index) => {
                indicator.style.opacity = '0';
                indicator.style.transform = 'scale(0.8)';
                
                setTimeout(() => {
                    indicator.style.transition = 'all 0.4s ease-out';
                    indicator.style.opacity = '1';
                    indicator.style.transform = 'scale(1)';
                }, index * 50);
            });
        }, 300);
        
        // Animar entrada dos cards de métrica
        setTimeout(() => {
            const metricCards = document.querySelectorAll('.metric-card');
            metricCards.forEach((card, index) => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px) scale(0.9)';
                
                setTimeout(() => {
                    card.style.transition = 'all 0.5s ease-out';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0) scale(1)';
                }, index * 100);
            });
        }, 600);
        
        console.log('[setupHomeAnimations] ✅ Animações configuradas');
        
    } catch (error) {
        console.error('[setupHomeAnimations] Erro:', error);
    }
}

// Função para injetar estilos dos templates
export function injectTemplateStyles() {
    const styleId = 'template-styles';
    
    // Remove estilos anteriores se existirem
    const existingStyles = document.getElementById(styleId);
    if (existingStyles) {
        existingStyles.remove();
    }
    
    // Cria novo elemento de estilo
    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = `
        ${loginStyles}
        ${homeStyles}
        ${workoutStyles}
        ${orderWeekStyles}
        ${metricsWidgetStyles}
        
        /* Animações globais adicionais */
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes scaleIn {
            from {
                opacity: 0;
                transform: scale(0.8);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
        }
        
        @keyframes slideInLeft {
            from {
                opacity: 0;
                transform: translateX(-30px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        
        .animate-fade-in-up {
            animation: fadeInUp 0.6s ease-out;
        }
        
        .animate-scale-in {
            animation: scaleIn 0.4s ease-out;
        }
        
        .animate-slide-in-left {
            animation: slideInLeft 0.5s ease-out;
        }
    `;
    
    document.head.appendChild(styleElement);
    console.log('[injectTemplateStyles] ✅ Estilos dos templates injetados');
}

// Função para inicializar o sistema de templates
export function initTemplates() {
    console.log('[initTemplates] Inicializando sistema de templates...');
    
    // Injeta os estilos dos templates
    injectTemplateStyles();
    
    // Renderiza a tela inicial (login)
    renderTemplate('login');
    
    // Configurar função global para inicializar home
    window.initializeHomeScreen = initializeHomeComponents;
    
    // Configurar limpeza de componentes ao navegar
    setupComponentCleanup();
    
    console.log('[initTemplates] ✅ Sistema de templates inicializado');
}

// Configurar limpeza de componentes
function setupComponentCleanup() {
    // Listener para limpeza de widgets ao mudar de tela
    const originalRenderTemplate = window.renderTemplate;
    
    window.renderTemplate = function(templateName, container) {
        // Limpar widgets existentes
        if (window.currentMetricsWidget) {
            try {
                window.currentMetricsWidget.destroy();
                window.currentMetricsWidget = null;
            } catch (error) {
                console.warn('[setupComponentCleanup] Erro ao limpar widget de métricas:', error);
            }
        }
        
        // Chamar função original
        return originalRenderTemplate.call(this, templateName, container);
    };
}

// Função auxiliar para atualizar elementos
function updateElement(id, value) {
    try {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        } else {
            console.warn(`[updateElement] Elemento ${id} não encontrado`);
        }
    } catch (error) {
        console.error(`[updateElement] Erro ao atualizar ${id}:`, error);
    }
}

// Exportar templates individuais
export {
    loginTemplate,
    homeTemplate,
    workoutTemplate,
    workoutStyles,
};