// js/app.js - App principal com protocolo completo integrado
import AppState from '../state/appState.js';

import { inicializarPlanejamento, fecharModalPlanejamento, salvarPlanejamentoSemanal } from '../feature/planning.js';
import { mostrarTela, logout } from '../ui/navigation.js';
import { showNotification } from '../ui/notifications.js';
import { initializeProtocol } from '../integration/protocolIntegration.js';

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
        errors.forEach(error => showNotification(error, 'error'));
        return false;
    }
    
    console.log('✅ Todas as dependências carregadas com sucesso');
    return true;
}

// Inicializar aplicação
async function initApp() {
    console.log('[app.js] 🚀 Iniciando aplicação com protocolo completo...');
    
    // Verificar dependências críticas
    if (!checkDependencies()) {
        console.error('❌ Falha na verificação de dependências');
        showNotification('Erro ao carregar dependências', 'error');
        return;
    }
    
    try {
        // 1. Configurar funções globais básicas
        setupGlobalFunctions();
        console.log('✅ Funções globais configuradas');
        
        // 2. Inicializar protocolo completo
        await initializeProtocol();
        console.log('✅ Protocolo inicializado');
        
        // 3. Verificar se há usuário salvo
        const savedUserId = localStorage.getItem('lastUserId');
        if (savedUserId) {
            console.log('📱 Usuário anterior encontrado:', savedUserId);
        }
        
        // 4. Iniciar na tela de login
        if (window.initLogin) {
            await window.initLogin();
            console.log('✅ Tela de login inicializada');
        } else {
            throw new Error('window.initLogin não está definido');
        }
        
        // 5. Configurar system de debug (desenvolvimento)
        setupDebugSystem();
        
        console.log('[app.js] ✅ Aplicação inicializada com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro crítico na inicialização:', error);
        showNotification('Erro crítico ao iniciar aplicação', 'error');
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

    // Função para abrir planejamento semanal
    window.abrirPlanejamentoParaUsuarioAtual = () => {
        const currentUser = AppState.get('currentUser');
        if (currentUser && currentUser.id) {
            if (window.renderTemplate) {
                window.renderTemplate('planejamentoSemanalPage');
                setTimeout(() => {
                    if (window.inicializarPlanejamento) {
                        window.inicializarPlanejamento(currentUser.id);
                    }
                }, 100);
            }
        } else {
            showNotification('Faça login para acessar o planejamento.', 'error');
        }
    };

    // NOVA: Função para inicializar home com protocolo
    window.initializeHomeScreen = async function() {
        console.log('[app.js] Inicializando home screen com protocolo...');
        
        try {
            const currentUser = AppState.get('currentUser');
            
            if (!currentUser) {
                console.warn('[app.js] Nenhum usuário logado, redirecionando para login');
                setTimeout(() => {
                    if (window.renderTemplate) {
                        window.renderTemplate('login');
                    }
                }, 500);
                return;
            }
            
            console.log('[app.js] Inicializando para usuário:', currentUser.nome);
            
            // Atualizar informações do usuário na UI
            updateUserInfo(currentUser);
            
            // Carregar dashboard com dados do protocolo
            setTimeout(async () => {
                try {
                    if (window.carregarDashboard) {
                        console.log('[app.js] Carregando dashboard...');
                        await window.carregarDashboard();
                        console.log('[app.js] Dashboard carregado com sucesso');
                    }
                    
                    // Verificar e carregar treino de hoje
                    await loadTodaysWorkout(currentUser.id);
                    
                } catch (error) {
                    console.error('[app.js] Erro ao carregar dashboard:', error);
                    setupBasicHomeElements(currentUser);
                }
            }, 200);
            
            console.log('[app.js] Home screen inicializada com protocolo');
            
        } catch (error) {
            console.error('[app.js] Erro na inicialização da home:', error);
        }
    };

    // Adicionar estilos de animação
    addAnimationStyles();
}

// Função para carregar treino de hoje
async function loadTodaysWorkout(userId) {
    try {
        // Usar o serviço do protocolo para carregar treino de hoje
        if (window.WorkoutProtocolService) {
            const treino = await window.WorkoutProtocolService.carregarTreinoParaExecucao(userId);
            
            // Salvar no estado
            AppState.set('currentWorkout', treino);
            
            // Atualizar UI do botão de treino
            updateWorkoutButton(treino);
            
            console.log('[app.js] ✅ Treino de hoje carregado:', treino.nome);
        }
        
    } catch (error) {
        console.error('[app.js] Erro ao carregar treino de hoje:', error);
    }
}

// Atualizar botão de treino baseado no tipo
function updateWorkoutButton(treino) {
    const startBtn = document.getElementById('start-workout-btn');
    const btnText = document.getElementById('btn-text');
    const workoutName = document.getElementById('workout-name');
    const workoutType = document.getElementById('workout-type');
    
    if (!startBtn) return;
    
    startBtn.disabled = false;
    
    switch(treino.tipo) {
        case 'folga':
            if (btnText) btnText.textContent = 'Dia de Descanso';
            if (workoutName) workoutName.textContent = 'Dia de Folga';
            if (workoutType) workoutType.textContent = 'Descanso';
            startBtn.onclick = () => {
                showNotification('Hoje é dia de descanso! 😴 Aproveite para se recuperar.', 'info');
            };
            break;
            
        case 'cardio':
            if (btnText) btnText.textContent = 'Iniciar Cardio';
            if (workoutName) workoutName.textContent = 'Treino Cardiovascular';
            if (workoutType) workoutType.textContent = 'Cardio';
            startBtn.onclick = () => {
                showNotification('Hora do cardio! 🏃‍♂️ Configure seu equipamento.', 'success');
            };
            break;
            
        case 'treino':
            if (btnText) btnText.textContent = 'Iniciar Treino';
            if (workoutName) workoutName.textContent = treino.nome;
            if (workoutType) workoutType.textContent = `Semana ${treino.semana_atual}`;
            startBtn.onclick = () => {
                // Usar a função global de iniciar treino
                if (window.iniciarTreino) {
                    window.iniciarTreino();
                } else {
                    showNotification('Sistema de treino carregando...', 'info');
                }
            };
            break;
            
        default:
            if (btnText) btnText.textContent = 'Configurar Treino';
            if (workoutName) workoutName.textContent = 'Configure seu planejamento';
            if (workoutType) workoutType.textContent = 'Setup';
            startBtn.onclick = () => {
                window.abrirPlanejamentoParaUsuarioAtual();
            };
            break;
    }
}

// Atualizar informações do usuário
function updateUserInfo(user) {
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
}

// Configurar elementos básicos da home se falhar
function setupBasicHomeElements(user) {
    const startBtn = document.getElementById('start-workout-btn');
    if (startBtn) {
        startBtn.disabled = false;
        startBtn.onclick = () => {
            showNotification('Sistema básico ativo. Configure seu planejamento primeiro.', 'warning');
            window.abrirPlanejamentoParaUsuarioAtual();
        };
    }
    
    updateUserInfo(user);
    updateElement('workout-name', 'Configure Treino');
    updateElement('completed-workouts', '0');
    updateElement('current-week', '1');
    updateElement('progress-percentage', '0%');
}

// Configurar sistema de debug (apenas desenvolvimento)
function setupDebugSystem() {
    if (!window.location.hostname.includes('localhost') && 
        !window.location.hostname.includes('127.0.0.1')) {
        return; // Só em desenvolvimento
    }
    
    // Ferramentas de debug
    window.debugApp = {
        state: () => AppState,
        functions: () => Object.keys(window).filter(key => typeof window[key] === 'function'),
        dependencies: () => ({
            supabase: !!window.supabase,
            config: !!window.SUPABASE_CONFIG,
            renderTemplate: !!window.renderTemplate,
            protocolo: !!window.iniciarTreino
        }),
        clearCache: () => {
            localStorage.clear();
            sessionStorage.clear();
            console.log('🧹 Cache limpo');
        },
        testProtocol: () => {
            if (window.testarProtocolo) {
                window.testarProtocolo();
            } else {
                console.log('❌ Função de teste do protocolo não disponível');
            }
        },
        simulateTreino: async () => {
            const currentUser = AppState.get('currentUser');
            if (!currentUser) {
                console.log('❌ Nenhum usuário logado');
                return;
            }
            
            if (window.iniciarTreino) {
                console.log('🏋️ Simulando início de treino...');
                await window.iniciarTreino();
            } else {
                console.log('❌ Função iniciarTreino não disponível');
            }
        }
    };
    
    console.log('[app.js] 🔧 Sistema de debug configurado (desenvolvimento)');
    console.log('💡 Use window.debugApp para acessar ferramentas de debug');
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

// Event listeners principais
document.addEventListener('DOMContentLoaded', () => {
    console.log('[app.js] 📄 DOM carregado');
    
    // Aguardar templates carregarem com timeout
    const initTimeout = setTimeout(() => {
        console.log('[app.js] ⏰ Iniciando após timeout...');
        initApp();
    }, 300);
    
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
        showNotification('Erro de função não encontrada. Recarregue a página.', 'error');
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
            showNotification('Erro de conexão com o banco de dados', 'error');
            event.preventDefault();
            return;
        }
    }
});

// Função auxiliar para atualizar elementos
function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

// Exportar estado global para debugging (apenas em desenvolvimento)
if (typeof window !== 'undefined') {
    window.AppState = AppState;
}

console.log('[app.js] 📦 Módulo app.js carregado com protocolo completo!');