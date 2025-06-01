// js/app.js - VERSÃO CORRIGIDA SEM RETURN ILEGAL
// Arquivo principal - inicialização e orquestração

import AppState from '../state/appState.js';
import { carregarDashboard } from '../feature/dashboard.js';
import { inicializarPlanejamento, fecharModalPlanejamento, removerTreinoDoDia, salvarPlanejamentoSemanal } from '../feature/planning.js';
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
    // Navegação
    window.mostrarTela = mostrarTela;
    window.voltarParaHome = () => mostrarTela('home-screen');
    window.logout = logout;
    
    // Dashboard
    window.carregarDashboard = carregarDashboard;
    
    // Login
    window.initLogin = async () => {
        const { initLoginScreen } = await import('../feature/login.js');
        return initLoginScreen();
    };
    
    // Planejamento - CORREÇÃO PRINCIPAL
    window.salvarPlanejamento = async () => {
        try {
            await salvarPlanejamentoSemanal();
        } catch (error) {
            console.error('Erro ao salvar planejamento:', error);
            showNotification('Erro ao salvar planejamento', 'error');
        }
    };
    
    window.inicializarPlanejamento = inicializarPlanejamento;
    window.fecharModalPlanejamento = fecharModalPlanejamento;
    window.removerTreinoDoDia = removerTreinoDoDia;

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
    `;
    document.head.appendChild(style);
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('[app.js] 📄 DOM carregado');
    
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
        return; // Não mostrar notificação para erros de dev
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
        }
    };
}

console.log('[app.js] 📦 Módulo app.js carregado com sucesso!');