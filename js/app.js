// js/app.js - VERSÃO CORRIGIDA PARA NAVEGAÇÃO
// Arquivo principal - inicialização e orquestração

import AppState from '../state/appState.js';
import { carregarDashboard } from '../feature/dashboard.js';
import { inicializarPlanejamento, fecharModalPlanejamento, salvarPlanejamentoSemanal } from '../feature/planning.js';
import { mostrarTela, logout } from '../ui/navigation.js';
import { showNotification } from '../ui/notifications.js';

// Verificar se todas as dependências estão carregadas
function checkDependencies() {
    const errors = [];
    
    if (!window.supabase) {
        errors.push('Supabase não está carregado!');
    }
    
    if (!window.SUPABASE_CONFIG) {
        errors.push('Configuração do Supabase não encontrada!');
    }
    
    if (!window.SUPABASE_CONFIG?.url || !window.SUPABASE_CONFIG?.key) {
        errors.push('Configuração do Supabase incompleta!');
    }
    
    if (errors.length > 0) {
        console.error('Erros de dependência:', errors);
        if (window.showNotification) {
            errors.forEach(error => showNotification(error, 'error'));
        }
        return false;
    }
    
    console.log('✅ Todas as dependências carregadas com sucesso');
    return true;
}

// Inicializar aplicação
async function initApp() {
    console.log('[app.js] 🚀 Iniciando aplicação...');
    
    // Verificar dependências críticas
    if (!checkDependencies()) {
        console.error('❌ Falha na verificação de dependências');
        showNotification('Erro ao carregar dependências', 'error');
        return;
    }
    
    try {
        // Configurar funções globais
        setupGlobalFunctions();
        console.log('✅ Funções globais configuradas');
        
        // Verificar se há usuário salvo
        const savedUserId = localStorage.getItem('lastUserId');
        if (savedUserId) {
            console.log('📱 Usuário anterior encontrado:', savedUserId);
        }
        
        // Iniciar na tela de login
        if (window.initLogin) {
            await window.initLogin();
            console.log('✅ Tela de login inicializada');
        } else {
            throw new Error('window.initLogin não está definido');
        }
        
    } catch (error) {
        console.error('❌ Erro crítico na inicialização:', error);
        if (window.showNotification) {
            showNotification('Erro crítico ao iniciar aplicação', 'error');
        }
    }
}

// Configurar funções globais para compatibilidade com templates
function setupGlobalFunctions() {
    // Navegação - CORRIGIDA
    window.mostrarTela = (tela) => {
        console.log('[app.js] Navegando via window.mostrarTela para:', tela);
        mostrarTela(tela);
    };
    
    window.voltarParaHome = () => {
        console.log('[app.js] Voltando para home via window.voltarParaHome');
        mostrarTela('home-screen');
    };
    
    window.logout = logout;
    
    // Dashboard - CORRIGIDA
    window.carregarDashboard = async () => {
        console.log('[app.js] Carregando dashboard via window.carregarDashboard');
        try {
            await carregarDashboard();
            console.log('[app.js] Dashboard carregado com sucesso');
        } catch (error) {
            console.error('[app.js] Erro ao carregar dashboard:', error);
            showNotification('Erro ao carregar dados do dashboard', 'warning');
        }
    };
    
    // Login
    window.initLogin = async () => {
        const { initLoginScreen } = await import('../feature/login.js');
        return initLoginScreen();
    };
    
    // Planejamento - CORRIGIDA
    window.salvarPlanejamento = async () => {
        console.log('[app.js] Salvando planejamento via window.salvarPlanejamento');
        try {
            await salvarPlanejamentoSemanal();
            console.log('[app.js] Planejamento salvo com sucesso');
        } catch (error) {
            console.error('[app.js] Erro ao salvar planejamento:', error);
            showNotification('Erro ao salvar planejamento', 'error');
        }
    };
    
    window.inicializarPlanejamento = inicializarPlanejamento;
    window.fecharModalPlanejamento = fecharModalPlanejamento;

    // Ordem da semana
    window.mostrarOrdemSemana = (usuarioId) => {
        if (window.renderTemplate) {
            window.renderTemplate('orderWeek');
        }
    };

    // Funções para planejamento mobile (serão definidas quando o template for carregado)
    window.abrirSeletorTreino = window.abrirSeletorTreino || function() {
        console.warn('abrirSeletorTreino ainda não foi definida');
    };
    
    window.fecharSeletorTreino = window.fecharSeletorTreino || function() {
        console.warn('fecharSeletorTreino ainda não foi definida');
    };

    // NOVA: Função para forçar renderização da home
    window.forcarRenderizacaoHome = () => {
        console.log('[app.js] Forçando renderização da home...');
        
        setTimeout(() => {
            if (window.renderTemplate) {
                console.log('[app.js] Renderizando template home');
                window.renderTemplate('home');
                
                // Aguardar renderização e carregar dashboard
                setTimeout(async () => {
                    console.log('[app.js] Carregando dashboard após renderização forçada');
                    if (window.carregarDashboard) {
                        await window.carregarDashboard();
                    }
                }, 300);
            } else {
                console.error('[app.js] window.renderTemplate não disponível para forçar renderização');
            }
        }, 100);
    };

    // Adicionar estilos de animação
    addAnimationStyles();
}

// Adicionar estilos de animação
function addAnimationStyles() {
    // Verificar se já foram adicionados
    if (document.getElementById('app-animations')) {
        return;
    }

    const style = document.createElement('style');
    style.id = 'app-animations';
    style.textContent = `
        @keyframes slideUp {
            from {
                transform: translate(-50%, 100%);
                opacity: 0;
            }
            to {
                transform: translate(-50%, 0);
                opacity: 1;
            }
        }
        
        @keyframes slideDown {
            from {
                transform: translate(-50%, 0);
                opacity: 1;
            }
            to {
                transform: translate(-50%, 100%);
                opacity: 0;
            }
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        
        .notification {
            animation: slideUp 0.3s ease;
        }
        
        .notification.hide {
            animation: slideDown 0.3s ease;
        }
        
        .loading-spinner {
            animation: spin 1s linear infinite;
        }
        
        .pulse {
            animation: pulse 2s infinite;
        }
        
        /* NOVO: CSS para debug de navegação */
        .debug-navigation {
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-size: 12px;
            z-index: 10000;
            display: none;
        }
        
        .debug-navigation.show {
            display: block;
        }
    `;
    document.head.appendChild(style);
}

// NOVA: Função de debug para navegação
function debugNavigation(message) {
    if (!window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
        return; // Só em desenvolvimento
    }
    
    let debugEl = document.getElementById('debug-navigation');
    if (!debugEl) {
        debugEl = document.createElement('div');
        debugEl.id = 'debug-navigation';
        debugEl.className = 'debug-navigation';
        document.body.appendChild(debugEl);
    }
    
    debugEl.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    debugEl.classList.add('show');
    
    setTimeout(() => {
        debugEl.classList.remove('show');
    }, 3000);
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('[app.js] 📄 DOM carregado');
    
    // Debug de navegação
    window.debugNavigation = debugNavigation;
    
    // Aguardar templates carregarem com timeout
    const initTimeout = setTimeout(() => {
        console.log('[app.js] ⏰ Iniciando após timeout...');
        initApp();
    }, 200);
    
    // Verificar se templates já estão carregados
    if (window.renderTemplate) {
        clearTimeout(initTimeout);
        console.log('[app.js] ⚡ Templates já carregados, iniciando imediatamente');
        initApp();
    }
});

// Tratamento de erros global
window.addEventListener('error', (event) => {
    console.error('🔥 Erro global capturado:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
    });
    
    // Filtrar erros de desenvolvimento
    if (event.filename && (
        event.filename.includes('localhost') || 
        event.filename.includes('127.0.0.1') ||
        event.filename.includes('chrome-extension')
    )) {
        return;
    }
    
    // Mostrar notificação apenas para erros críticos
    if (event.message && event.message.includes('is not defined')) {
        if (window.showNotification) {
            showNotification('Erro de função não encontrada. Recarregue a página.', 'error');
        }
    }
});

// Tratamento de promises rejeitadas
window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Promise rejeitada:', event.reason);
    
    // Tratar erros específicos do Supabase
    if (event.reason && event.reason.message) {
        if (event.reason.message.includes('Failed to fetch')) {
            console.warn('⚠️ Erro de rede ignorado:', event.reason.message);
            event.preventDefault();
            return;
        }
        
        if (event.reason.message.includes('Supabase')) {
            console.error('💾 Erro do Supabase:', event.reason.message);
            if (window.showNotification) {
                showNotification('Erro de conexão com o banco de dados', 'error');
            }
            event.preventDefault();
            return;
        }
    }
});

// Exportar estado global para debugging (apenas em desenvolvimento)
if (typeof window !== 'undefined') {
    window.AppState = AppState;
    
    // Ferramentas de debug
    window.debugApp = {
        state: () => window.AppState,
        functions: () => Object.keys(window).filter(key => typeof window[key] === 'function'),
        dependencies: () => ({
            supabase: !!window.supabase,
            config: !!window.SUPABASE_CONFIG,
            renderTemplate: !!window.renderTemplate
        }),
        clearCache: () => {
            localStorage.clear();
            sessionStorage.clear();
            console.log('🧹 Cache limpo');
        },
        testFunction: (name) => {
            if (typeof window[name] === 'function') {
                console.log(`✅ Função ${name} está disponível`);
            } else {
                console.log(`❌ Função ${name} NÃO está disponível`);
            }
        },
        forceHome: () => {
            console.log('🏠 Forçando navegação para home...');
            window.forcarRenderizacaoHome();
        }
    };
}

console.log('[app.js] 📦 Módulo app.js carregado com sucesso!');