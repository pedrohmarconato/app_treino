/**
 * 🎨 SISTEMA DE TEMPLATES - Template Manager
 * 
 * FUNÇÃO: Centralizar e organizar todos os templates HTML das telas da aplicação.
 * 
 * RESPONSABILIDADES:
 * - Importar e exportar templates de todas as telas (login, home, workout, planning)
 * - Organizar estilos CSS específicos de cada template
 * - Fornecer interface unificada para o sistema de navegação
 * - Garantir carregamento eficiente e reutilização de templates
 * - Manter estrutura modular para facilitar manutenção
 * - Validar templates antes de retornar (evitar HTML quebrado)
 * 
 * TEMPLATES INCLUÍDOS:
 * - loginTemplate: Tela de autenticação com formulário
 * - homeTemplate: Dashboard principal com métricas e navegação
 * - workoutTemplate: Interface de execução de treino
 * - modalPlanejamentoTemplate: Modal de configuração semanal
 * - exerciseCardTemplate: Card individual de exercício
 * 
 * ESTILOS:
 * - Cada template pode ter CSS específico associado
 * - Estilos são injetados dinamicamente quando template é usado
 * - Sistema evita conflitos de CSS entre diferentes telas
 * 
 * INTEGRAÇÃO: Usado por navigation.js para renderizar telas
 */
import { modalPlanejamentoTemplate, modalPlanejamentoStyles } from './modals.js';
import { loginTemplate, loginStyles } from './login.js';
import { homeTemplate, homeStyles } from './home.js';
import { workoutTemplate } from './workout.js';
import { workoutStyles } from './workout.js';
import { planejamentoSemanalPageTemplate } from './planejamentoSemanalPage.js';
import { MetricsWidget, metricsWidgetStyles } from '../components/MetricsWidget.js';

// Exportar componentes globalmente
window.modalPlanejamentoTemplate = modalPlanejamentoTemplate;
window.modalPlanejamentoStyles = modalPlanejamentoStyles;
window.planejamentoSemanalPageTemplate = planejamentoSemanalPageTemplate;
window.MetricsWidget = MetricsWidget;

// Função principal para renderizar templates
export async function renderTemplate(templateName, container = 'app') {
    console.log('[renderTemplate] Renderizando template:', templateName);
    
    const containerEl = typeof container === 'string' 
        ? document.getElementById(container) 
        : container;
    
    if (!containerEl) {
        console.error(`[renderTemplate] Container ${container} não encontrado`);
        return;
    }
    
    try {
        // Limpar classes .active de todas as telas antes de renderizar nova
        clearActiveScreens();
        
        switch(templateName) {
            case 'login': {
                console.log('[renderTemplate] Renderizando login');
                containerEl.innerHTML = loginTemplate();
                
                // Garantir que a tela de login fique visível
                // Força o DOM a ser atualizado antes de procurar o elemento
                containerEl.offsetHeight; // Força reflow
                const loginScreen = document.getElementById('login-screen');
                if (loginScreen) {
                    loginScreen.classList.add('active');
                    console.log('[renderTemplate] ✅ Classe "active" adicionada à tela login');
                } else {
                    console.warn('[renderTemplate] ⚠️ Elemento #login-screen não encontrado');
                    // Tentar novamente com timeout
                    setTimeout(() => {
                        const loginScreenDelayed = document.getElementById('login-screen');
                        if (loginScreenDelayed) {
                            loginScreenDelayed.classList.add('active');
                            console.log('[renderTemplate] ✅ Classe "active" adicionada à tela login (com delay)');
                        }
                    }, 10);
                }
                break;
            }
                
            case 'home':
                console.log('[renderTemplate] 🏠 Renderizando home NOVA');
                console.log('[renderTemplate] Container:', containerEl);
                console.log('[renderTemplate] homeTemplate disponível:', !!homeTemplate);
                
                try {
                    const htmlContent = homeTemplate();
                    console.log('[renderTemplate] HTML gerado, tamanho:', htmlContent.length);
                    containerEl.innerHTML = htmlContent;
                    console.log('[renderTemplate] ✅ HTML inserido no container');
                    
                    // CORREÇÃO: Garantir que a tela home fique visível
                    // Força o DOM a ser atualizado antes de procurar o elemento
                    containerEl.offsetHeight; // Força reflow
                    const homeScreen = document.getElementById('home-screen');
                    if (homeScreen) {
                        homeScreen.classList.add('active');
                        console.log('[renderTemplate] ✅ Classe "active" adicionada à tela home');
                    } else {
                        console.warn('[renderTemplate] ⚠️ Elemento #home-screen não encontrado');
                        // Debug: listar todos os elementos disponíveis
                        console.log('[renderTemplate] 🔍 Elementos disponíveis:', document.querySelectorAll('[id*="screen"]'));
                        // Tentar novamente com timeout
                        setTimeout(() => {
                            const homeScreenDelayed = document.getElementById('home-screen');
                            if (homeScreenDelayed) {
                                homeScreenDelayed.classList.add('active');
                                console.log('[renderTemplate] ✅ Classe "active" adicionada à tela home (com delay)');
                            }
                        }, 10);
                    }
                    
                    // Inicializar componentes da home
                    setTimeout(() => {
                        console.log('[renderTemplate] Inicializando componentes da home...');
                        initializeHomeComponents();
                    }, 100);
                } catch (error) {
                    console.error('[renderTemplate] ❌ Erro ao renderizar home template:', error);
                    throw error;
                }
                break;
                
            case 'workout': {
                console.log('[renderTemplate] Renderizando workout');
                containerEl.innerHTML = workoutTemplate();
                
                // CORREÇÃO: Garantir que a tela workout fique visível
                // Força o DOM a ser atualizado antes de procurar o elemento
                containerEl.offsetHeight; // Força reflow
                const workoutScreen = document.getElementById('workout-screen');
                if (workoutScreen) {
                    workoutScreen.classList.add('active');
                    console.log('[renderTemplate] ✅ Classe "active" adicionada à tela workout');
                } else {
                    console.warn('[renderTemplate] ⚠️ Elemento #workout-screen não encontrado');
                    // Tentar novamente com timeout
                    setTimeout(() => {
                        const workoutScreenDelayed = document.getElementById('workout-screen');
                        if (workoutScreenDelayed) {
                            workoutScreenDelayed.classList.add('active');
                            console.log('[renderTemplate] ✅ Classe "active" adicionada à tela workout (com delay)');
                        }
                    }, 10);
                }
                break;
            }
                
            case 'orderWeek':
                console.log('[renderTemplate] Redirecionando OrderWeek para Home');
                renderTemplate('home');
                if (window.showNotification) {
                    window.showNotification('Funcionalidade em desenvolvimento', 'info');
                }
                break;
                
            case 'planejamentoSemanalPage': {
                console.log('[renderTemplate] 🚀 Renderizando planejamentoSemanalPage');
                console.log('[renderTemplate] Container:', containerEl);
                console.log('[renderTemplate] planejamentoSemanalPageTemplate disponível:', !!window.planejamentoSemanalPageTemplate);
                
                if (!window.planejamentoSemanalPageTemplate) {
                    console.error('[renderTemplate] ❌ planejamentoSemanalPageTemplate não encontrado!');
                    return;
                }
                
                const planejamentoHTML = window.planejamentoSemanalPageTemplate();
                console.log('[renderTemplate] HTML gerado para planejamento, tamanho:', planejamentoHTML.length);
                console.log('[renderTemplate] Primeiros 200 chars:', planejamentoHTML.substring(0, 200));
                
                containerEl.innerHTML = planejamentoHTML;
                console.log('[renderTemplate] ✅ HTML inserido no container');
                
                // Verificar se o modal foi criado
                setTimeout(() => {
                    const modal = document.getElementById('modalPlanejamento');
                    console.log('[renderTemplate] Modal criado no DOM:', !!modal);
                    if (modal) {
                        console.log('[renderTemplate] Modal encontrado:', {
                            id: modal.id,
                            classList: Array.from(modal.classList),
                            style: modal.style.cssText,
                            computedDisplay: window.getComputedStyle(modal).display,
                            computedPosition: window.getComputedStyle(modal).position,
                            computedZIndex: window.getComputedStyle(modal).zIndex
                        });
                    }
                }, 50);
                
                console.log('[renderTemplate] ✅ Template de planejamento renderizado, aguardando inicialização externa');
                break;
            }
            
            case 'dashboardMetricas': {
                console.log('[renderTemplate] 📊 Renderizando dashboardMetricas');
                
                // Importar template dinamicamente
                const { dashboardMetricasTemplate } = await import('./dashboardMetricas.js');
                
                containerEl.innerHTML = dashboardMetricasTemplate();
                
                // Adicionar classe active à tela
                setTimeout(() => {
                    const dashboardScreen = document.getElementById('dashboard-metricas-screen');
                    if (dashboardScreen) {
                        dashboardScreen.classList.add('active');
                        console.log('[renderTemplate] ✅ Dashboard de métricas renderizado');
                    }
                }, 50);
                
                break;
            }
                
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

// Inicializar componentes específicos da home
async function initializeHomeComponents() {
    console.log('[initializeHomeComponents] 🚀 Inicializando componentes da home...');
    
    try {
        console.log('[initializeHomeComponents] Verificando AppState:', !!window.AppState);
        const currentUser = window.AppState?.get('currentUser');
        
        if (!currentUser) {
            console.warn('[initializeHomeComponents] ❌ Nenhum usuário logado');
            console.log('[initializeHomeComponents] AppState atual:', window.AppState?.state);
            console.log('[initializeHomeComponents] Redirecionando para login em 500ms...');
            setTimeout(() => renderTemplate('login'), 500);
            return;
        }
        
        console.log('[initializeHomeComponents] ✅ Usuário encontrado:', currentUser.nome, 'ID:', currentUser.id);
        
        // 1. Atualizar informações do usuário
        updateUserInfo(currentUser);
        
        // 2. Inicializar widget de métricas se container existir
        const metricsContainer = document.getElementById('metrics-advanced-container');
        if (metricsContainer) {
            try {
                const metricsWidget = new MetricsWidget('metrics-advanced-container');
                await metricsWidget.init();
                window.currentMetricsWidget = metricsWidget;
            } catch (error) {
                console.warn('[initializeHomeComponents] Erro ao inicializar MetricsWidget:', error);
            }
        }
        
        // 3. Configurar botão contextual primeiro
        setupContextualWorkoutButton();
        
        // 4. Carregar dashboard
        setTimeout(async () => {
            try {
                if (window.carregarDashboard) {
                    console.log('[initializeHomeComponents] Carregando dashboard...');
                    await window.carregarDashboard();
                    console.log('[initializeHomeComponents] ✅ Dashboard carregado');
                } else {
                    console.warn('[initializeHomeComponents] window.carregarDashboard não disponível');
                    setupBasicHomeElements(currentUser);
                }
            } catch (error) {
                console.error('[initializeHomeComponents] Erro ao carregar dashboard:', error);
                setupBasicHomeElements(currentUser);
            }
        }, 200);
        
        // 4. Configurar animações modernas
        if (window.initializeHomeAnimations) {
            window.initializeHomeAnimations();
        } else {
            setupHomeAnimations(); // fallback
        }
        
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
            'Japa': 'japa.png',
            'Vini': 'vini.png'
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

// Configurar botão contextual de treino
function setupContextualWorkoutButton() {
    try {
        const contextualBtn = document.getElementById('contextual-workout-btn') || document.getElementById('start-workout-btn');
        if (!contextualBtn) {
            console.warn('[setupContextualWorkoutButton] Nenhum botão contextual encontrado (procurou #contextual-workout-btn e #start-workout-btn)');
            return;
        }
        
        console.log('[setupContextualWorkoutButton] ✅ Botão contextual encontrado, configurando...');
        
        // Remover estado de loading
        contextualBtn.classList.remove('btn-loading');
        contextualBtn.classList.add('btn-primary');
        
        // Atualizar conteúdo do botão
        const btnIcon = contextualBtn.querySelector('.btn-icon');
        const btnText = contextualBtn.querySelector('.btn-text');
        
        if (btnIcon && btnText) {
            btnIcon.textContent = '▶️';
            btnText.textContent = 'Iniciar Treino';
        }
        
        // Configurar evento de clique
        contextualBtn.onclick = () => {
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
                    if (window.iniciarTreinoComDisposicao) {
                        window.iniciarTreinoComDisposicao();
                    } else if (window.showNotification) {
                        window.showNotification('Sistema de treino carregando...', 'info');
                    }
                }
            } else {
                if (window.abrirPlanejamentoParaUsuarioAtual) {
                    window.abrirPlanejamentoParaUsuarioAtual();
                } else if (window.showNotification) {
                    window.showNotification('Configure seu planejamento primeiro', 'warning');
                }
            }
        };
        
        console.log('[setupContextualWorkoutButton] ✅ Botão contextual configurado com sucesso');
        
    } catch (error) {
        console.error('[setupContextualWorkoutButton] Erro:', error);
    }
}

// Configurar elementos básicos da home
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
                        if (window.iniciarTreinoComDisposicao) {
                            window.iniciarTreinoComDisposicao();
                        } else if (window.showNotification) {
                            window.showNotification('Sistema de treino carregando...', 'info');
                        }
                    }
                } else {
                    if (window.abrirPlanejamentoParaUsuarioAtual) {
                        window.abrirPlanejamentoParaUsuarioAtual();
                    } else if (window.showNotification) {
                        window.showNotification('Configure seu planejamento primeiro', 'warning');
                    }
                }
            };
        }
        
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
        
        // Animar indicadores da semana
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
        
        // Animar cards de métrica
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
        ${modalPlanejamentoStyles}
        ${metricsWidgetStyles}
        
        /* Animações globais */
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
        
        .animate-fade-in-up {
            animation: fadeInUp 0.6s ease-out;
        }
        
        .animate-scale-in {
            animation: scaleIn 0.4s ease-out;
        }
    `;
    
    document.head.appendChild(styleElement);
    console.log('[injectTemplateStyles] ✅ Estilos dos templates injetados');
}

// Função para inicializar o sistema de templates
export function initTemplates() {
    console.log('[initTemplates] 🚀 Inicializando sistema de templates...');
    
    // Diagnóstico
    console.log('[initTemplates] 🔍 Diagnóstico:');
    console.log('  - loginTemplate:', !!loginTemplate);
    console.log('  - homeTemplate:', !!homeTemplate);
    console.log('  - workoutTemplate:', !!workoutTemplate);
    console.log('  - document.getElementById("app"):', !!document.getElementById('app'));
    
    try {
        // Injeta os estilos dos templates
        console.log('[initTemplates] 🎨 Injetando estilos...');
        injectTemplateStyles();
        console.log('[initTemplates] ✅ Estilos injetados');
        
        // Renderiza a tela inicial (login)
        console.log('[initTemplates] 🔑 Renderizando login inicial...');
        renderTemplate('login');
        console.log('[initTemplates] ✅ Login renderizado');
        
        // Configurar limpeza de componentes ao navegar
        console.log('[initTemplates] 🧹 Configurando limpeza de componentes...');
        setupComponentCleanup();
        console.log('[initTemplates] ✅ Limpeza configurada');
        
        console.log('[initTemplates] 🎉 Sistema de templates inicializado com sucesso');
        
    } catch (error) {
        console.error('[initTemplates] ❌ Erro ao inicializar templates:', error);
        console.error('[initTemplates] Stack trace:', error.stack);
        
        // Fallback: renderizar algo básico
        const app = document.getElementById('app');
        if (app) {
            app.innerHTML = `
                <div style="padding: 20px; color: white; background: #333; min-height: 100vh;">
                    <h1>Erro no Sistema de Templates</h1>
                    <p><strong>Erro:</strong> ${error.message}</p>
                    <p>O sistema não conseguiu inicializar os templates.</p>
                    <button onclick="location.reload()" style="padding: 10px; margin-top: 10px;">Recarregar Página</button>
                </div>
            `;
        }
    }
}

// Configurar limpeza de componentes
function setupComponentCleanup() {
    // Armazenar referência original
    const originalRenderTemplate = renderTemplate;
    
    // Sobrescrever função global
    window.renderTemplate = function(templateName, container) {
        // Limpar widgets existentes
        if (window.currentMetricsWidget) {
            try {
                window.currentMetricsWidget.destroy();
                window.currentMetricsWidget = null;
            } catch (error) {
                console.warn('[setupComponentCleanup] Erro ao limpar widget:', error);
            }
        }
        
        // Chamar função original
        return originalRenderTemplate(templateName, container);
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

// Função para limpar classes .active de todas as telas
function clearActiveScreens() {
    try {
        const activeScreens = document.querySelectorAll('.screen.active');
        activeScreens.forEach(screen => {
            screen.classList.remove('active');
        });
        console.log(`[clearActiveScreens] ✅ Removidas ${activeScreens.length} classes .active`);
    } catch (error) {
        console.error('[clearActiveScreens] Erro:', error);
    }
}

// Exportar templates individuais
export {
    loginTemplate,
    homeTemplate,
    workoutTemplate,
    workoutStyles,
    planejamentoSemanalPageTemplate,
};