// js/app.js
// Arquivo principal - inicialização e orquestração

import AppState from './state/appState.js';
import { initLogin } from './features/login.js';
import { carregarDashboard } from './features/dashboard.js';
import { mostrarTela, logout } from './ui/navigation.js';
import { showNotification } from './ui/notifications.js';

// Verificar se todas as dependências estão carregadas
function checkDependencies() {
    if (!window.supabase) {
        console.error('Supabase não está carregado!');
        return false;
    }
    
    if (!window.SUPABASE_CONFIG) {
        console.error('Configuração do Supabase não encontrada!');
        return false;
    }
    
    return true;
}

// Inicializar aplicação
async function initApp() {
    console.log('[app.js] Iniciando aplicação...');
    
    // Verificar dependências
    if (!checkDependencies()) {
        showNotification('Erro ao carregar dependências', 'error');
        return;
    }
    
    // Configurar funções globais para compatibilidade
    setupGlobalFunctions();
    
    // Verificar se há usuário salvo (para auto-login futuro)
    const savedUserId = localStorage.getItem('lastUserId');
    if (savedUserId) {
        // Por enquanto, sempre mostrar tela de login
        console.log('Usuário anterior encontrado:', savedUserId);
    }
    
    // Iniciar na tela de login
    await initLogin();
}

// Configurar funções globais para compatibilidade com templates
function setupGlobalFunctions() {
    // Navegação
    window.mostrarTela = mostrarTela;
    window.voltarParaHome = () => mostrarTela('home-screen');
    window.logout = logout;
    
    // Dashboard
    window.carregarDashboard = carregarDashboard;
    
    // Mostrar ordem da semana
    window.mostrarOrdemSemana = (usuarioId) => {
        if (window.renderTemplate) {
            window.renderTemplate('orderWeek');
        }
    };
    
    // Adicionar estilos de animação
    addAnimationStyles();
}

// Adicionar estilos de animação
function addAnimationStyles() {
    const style = document.createElement('style');
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
        
        .notification {
            animation: slideUp 0.3s ease;
        }
        
        .notification.hide {
            animation: slideDown 0.3s ease;
        }
    `;
    document.head.appendChild(style);
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('[app.js] DOM carregado');
    
    // Aguardar templates carregarem
    setTimeout(() => {
        initApp();
    }, 100);
});

// Tratamento de erros global
window.addEventListener('error', (event) => {
    console.error('Erro global:', event.error);
    
    // Não mostrar notificação para erros de desenvolvimento
    if (!event.filename || event.filename.includes('localhost')) {
        return;
    }
    
    showNotification('Ocorreu um erro inesperado', 'error');
});

// Tratamento de promises rejeitadas
window.addEventListener('unhandledrejection', (event) => {
    console.error('Promise rejeitada:', event.reason);
    
    // Ignorar erros específicos do Supabase que não são críticos
    if (event.reason && event.reason.message && 
        event.reason.message.includes('Failed to fetch')) {
        event.preventDefault();
        return;
    }
});

// Exportar estado global para debugging
window.AppState = AppState;

console.log('[app.js] Módulo carregado com sucesso!');