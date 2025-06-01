// templates/index.js - VERSÃO CORRIGIDA
// Arquivo principal que exporta todos os templates

import { modalPlanejamentoTemplate, modalPlanejamentoStyles } from './modals.js';
window.modalPlanejamentoTemplate = modalPlanejamentoTemplate;
window.modalPlanejamentoStyles = modalPlanejamentoStyles;
import { loginTemplate, loginStyles } from './login.js';
import { initLoginScreen } from '../feature/login.js';
window.initLogin = initLoginScreen;
import { homeTemplate, homeStyles } from './home.js';
import { workoutTemplate, workoutStyles } from './workout.js';
import OrderWeekPage, { orderWeekStyles } from './OrderWeekPage.js';

// Função para renderizar um template no DOM
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
                console.log('[renderTemplate] Renderizando home');
                containerEl.innerHTML = homeTemplate();
                
                // CORREÇÃO: Inicializar home após renderização
                setTimeout(() => {
                    console.log('[renderTemplate] Inicializando home screen...');
                    if (window.initializeHomeScreen) {
                        window.initializeHomeScreen();
                    } else {
                        // Fallback: carregar dashboard diretamente
                        const currentUser = window.AppState?.get('currentUser');
                        if (currentUser && window.carregarDashboard) {
                            console.log('[renderTemplate] Carregando dashboard como fallback...');
                            window.carregarDashboard();
                        }
                    }
                }, 200);
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
                
                // CORREÇÃO: Verificar se é realmente necessário renderizar OrderWeek
                const currentUser = window.AppState?.get('currentUser');
                if (!currentUser) {
                    console.warn('[renderTemplate] Usuário não logado, redirecionando para login');
                    setTimeout(() => renderTemplate('login'), 100);
                    return;
                }
                
                // Por enquanto, redirecionar OrderWeek para Home
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
                
                // Fallback: renderizar home
                if (templateName !== 'home') {
                    console.log('[renderTemplate] Fallback: renderizando home');
                    renderTemplate('home');
                }
        }
        
        console.log(`[renderTemplate] Template ${templateName} renderizado com sucesso`);
        
    } catch (error) {
        console.error(`[renderTemplate] Erro ao renderizar template ${templateName}:`, error);
        
        // Fallback em caso de erro
        if (templateName !== 'login') {
            console.log('[renderTemplate] Fallback por erro: renderizando login');
            setTimeout(() => renderTemplate('login'), 500);
        }
    }
}

// Função para adicionar páginas customizadas ao DOM
export function addCustomPages() {
    // Placeholder para futuras páginas customizadas
}

// Função para injetar estilos específicos dos templates
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
    `;
    
    document.head.appendChild(styleElement);
    console.log('[injectTemplateStyles] Estilos dos templates injetados');
}

// Função para inicializar o sistema de templates
export function initTemplates() {
    console.log('[initTemplates] Inicializando sistema de templates...');
    
    // Injeta os estilos dos templates
    injectTemplateStyles();
    
    // Renderiza a tela inicial (login)
    renderTemplate('login');
    
    // Adicionar função global para inicializar home
    window.initializeHomeScreen = function() {
        console.log('[initializeHomeScreen] Inicializando tela home...');
        
        try {
            const currentUser = window.AppState?.get('currentUser');
            
            if (!currentUser) {
                console.warn('[initializeHomeScreen] Nenhum usuário logado, redirecionando para login');
                setTimeout(() => renderTemplate('login'), 500);
                return;
            }
            
            console.log('[initializeHomeScreen] Inicializando para usuário:', currentUser.nome);
            
            // Atualizar informações do usuário na UI
            const userNameEl = document.getElementById('user-name');
            if (userNameEl) {
                userNameEl.textContent = currentUser.nome;
            }
            
            const userImages = {
                'Pedro': 'pedro.png',
                'Japa': 'japa.png'
            };
            
            const avatarEl = document.getElementById('user-avatar');
            if (avatarEl) {
                avatarEl.src = userImages[currentUser.nome] || 'pedro.png';
            }
            
            // Carregar dashboard
            setTimeout(async () => {
                try {
                    if (window.carregarDashboard) {
                        console.log('[initializeHomeScreen] Carregando dashboard...');
                        await window.carregarDashboard();
                        console.log('[initializeHomeScreen] Dashboard carregado com sucesso');
                    } else {
                        console.warn('[initializeHomeScreen] window.carregarDashboard não disponível');
                        
                        // Configurar elementos básicos
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
                    }
                } catch (error) {
                    console.error('[initializeHomeScreen] Erro ao carregar dashboard:', error);
                }
            }, 300);
            
            console.log('[initializeHomeScreen] Inicialização da home concluída');
            
        } catch (error) {
            console.error('[initializeHomeScreen] Erro:', error);
        }
    };
    
    console.log('[initTemplates] Sistema de templates inicializado');
}

// Exporta templates individuais para uso direto
export {
    loginTemplate,
    homeTemplate,
    workoutTemplate,
    workoutStyles,
};