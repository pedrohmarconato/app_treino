/**
 * 🏠 APP PRINCIPAL - Ponto de entrada da aplicação
 * 
 * FUNÇÃO: Arquivo de inicialização principal que configura a aplicação de treinos.
 * 
 * RESPONSABILIDADES:
 * - Inicializar o estado global da aplicação (AppState)
 * - Carregar e configurar todas as funcionalidades principais
 * - Configurar navegação entre telas (login, dashboard, workout, planning)
 * - Integrar protocolos de treino com Supabase
 * - Gerenciar cache e sincronização offline
 * 
 * ARQUITETURA:
 * - Carrega features: planning.js, workout.js, dashboard.js
 * - Configura serviços: navigation, notifications, protocol integration
 * - Expõe funções globais necessárias para o funcionamento da UI
 * 
 * IMPORTANTE: Este arquivo é carregado pelo index.html e deve manter 
 * compatibilidade com browsers sem suporte total a ES6 modules.
 */
import AppState from '../state/appState.js';
// Importar apenas o que é necessário, resto será acessado via window
import '../feature/planning.js';
import { mostrarTela, logout } from '../ui/navigation.js';
import { showNotification } from '../ui/notifications.js';
// DESABILITADO - workoutExecution.js estava bugado, usando workout.js
// import '../feature/workoutExecution.js';
import '../feature/workout.js';
import { initializeProtocol } from '../integration/protocolIntegration.js';
import { integrationService } from '../services/integrationService.js';
// Importar funções de localStorage para disponibilizar globalmente
import '../utils/weekPlanStorage.js';
// Importar weeklyPlanningService para disponibilizar WeeklyPlanService globalmente
import '../services/weeklyPlanningService.js';
// CRÍTICO: Importar e disponibilizar DisposicaoInicioModal globalmente
import DisposicaoInicioModal from '../components/disposicaoInicioModal.js';

// Verificar dependências críticas
function checkDependencies() {
    const errors = [];
    
    if (!window.supabase) errors.push('Supabase não está carregado!');
    if (!window.SUPABASE_CONFIG) errors.push('Configuração do Supabase não encontrada!');
    if (!window.SUPABASE_CONFIG?.url || !window.SUPABASE_CONFIG?.key) {
        errors.push('Configuração do Supabase incompleta!');
    }
    
    if (errors.length > 0) {
        console.error('❌ Erros de dependência:', errors);
        errors.forEach(error => showNotification(error, 'error'));
        return false;
    }
    
    return true;
}

import { initTemplates, renderTemplate as renderTemplateModule } from '../templates/index.js';

// Inicializar aplicação
async function initApp() {
    console.log('[initApp] 🚀 INICIANDO APLICAÇÃO...');
    
    if (!checkDependencies()) {
        console.error('❌ Falha na verificação de dependências');
        // FALLBACK: Tentar renderizar algo básico mesmo assim
        const app = document.getElementById('app');
        if (app) {
            app.innerHTML = `
                <div style="padding: 20px; color: white; background: #ff0000;">
                    <h1>ERRO: Dependências não carregadas</h1>
                    <p>Verifique se o Supabase está configurado corretamente.</p>
                </div>
            `;
        }
        return;
    }
    
    try {
        console.log('[initApp] ✅ Dependências verificadas');
        // 1. Inicializar sistema de templates se ainda não estiver
        if (!window.renderTemplate) {
            console.log('[initApp] 🔧 Inicializando sistema de templates...');
            try {
                await initTemplates();
                // Expor função renderTemplate globalmente caso initTemplates não o faça (edge-case)
                if (!window.renderTemplate && renderTemplateModule) {
                    window.renderTemplate = renderTemplateModule;
                }
                console.log('[initApp] ✅ Sistema de templates inicializado');
            } catch (tplErr) {
                console.error('[initApp] ❌ Falha ao inicializar templates:', tplErr);
            }
        }
        
        // 1. Aguardar módulos carregarem
        console.log('[initApp] ⏳ Aguardando módulos carregarem...');
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // 2. Configurar funções globais
        console.log('[initApp] 🔧 Configurando funções globais...');
        setupGlobalFunctions();
        console.log('[initApp] ✅ Funções globais configuradas');
        
        // 2. Inicializar protocolo
        console.log('[initApp] 🔄 Inicializando protocolo...');
        await initializeProtocol();
        console.log('[initApp] ✅ Protocolo inicializado');
        
        // 3. Iniciar na tela de login
        console.log('[initApp] 🔑 Iniciando tela de login...');
        if (window.initLogin) {
            await window.initLogin();
            console.log('[initApp] ✅ Login inicializado');
        } else {
            console.error('[initApp] ❌ window.initLogin não está definido');
            // FALLBACK: Renderizar login diretamente
            if (window.renderTemplate) {
                console.log('[initApp] 🔄 Tentando renderTemplate login como fallback...');
                window.renderTemplate('login');
            } else {
                throw new Error('Nem window.initLogin nem window.renderTemplate estão definidos');
            }
        }
        
        // 4. Configurar debug (desenvolvimento)
        console.log('[initApp] 🔧 Configurando sistema de debug...');
        setupDebugSystem();
        console.log('[initApp] ✅ Debug configurado');
        
        console.log('[initApp] 🎉 APLICAÇÃO INICIALIZADA COM SUCESSO!');
        
    } catch (error) {
        console.error('❌ Erro crítico na inicialização:', error);
        console.error('Stack trace:', error.stack);
        showNotification('Erro crítico ao iniciar aplicação: ' + error.message, 'error');
        
        // FALLBACK: Tentar renderizar tela de erro
        const app = document.getElementById('app');
        if (app) {
            app.innerHTML = `
                <div style="padding: 20px; color: white; background: #333;">
                    <h1>Erro na Inicialização</h1>
                    <p><strong>Erro:</strong> ${error.message}</p>
                    <p>Verifique o console para mais detalhes.</p>
                    <button onclick="location.reload()" style="padding: 10px; margin-top: 10px;">Recarregar Página</button>
                </div>
            `;
        }
    }
}

// Configurar funções globais essenciais
function setupGlobalFunctions() {
    // === NAVEGAÇÃO ===
    window.mostrarTela = (tela) => {
        mostrarTela(tela);
    };
    
    window.voltarParaHome = () => {
        mostrarTela('home-screen');
    };
    
    window.logout = logout;
    
    // === COMPONENTES CRÍTICOS ===
    // Disponibilizar DisposicaoInicioModal globalmente
    window.DisposicaoInicioModal = DisposicaoInicioModal;
    console.log('[APP] ✅ DisposicaoInicioModal disponibilizado globalmente');

    // === PERSISTÊNCIA DE TREINO ===
    // workoutPersistence.js foi removido - funcionalidade integrada em workoutExecution.js
    
    // === LOGIN ===
    window.initLogin = async () => {
        const { initLoginScreen } = await import('../feature/login.js');
        return initLoginScreen();
    };
    
    // === DASHBOARD ===
    window.carregarDashboard = async () => {
        try {
            // Verificar se há usuário antes de carregar dashboard
            const currentUser = AppState.get('currentUser');
            if (!currentUser || !currentUser.id) {
                console.error('[app.js] ❌ Tentativa de carregar dashboard sem usuário válido');
                showNotification('Usuário não está logado. Faça login novamente.', 'error');
                
                if (window.renderTemplate) {
                    window.renderTemplate('login');
                }
                return;
            }
            
            const { carregarDashboard } = await import('../feature/dashboard.js');
            await carregarDashboard();
        } catch (error) {
            console.error('[app.js] Erro no dashboard:', {
                message: error?.message,
                stack: error?.stack,
                name: error?.name,
                fullError: error
            });
            showNotification('Erro ao carregar dashboard: ' + (error?.message || 'Erro desconhecido'), 'error');
        }
    };
    
    // === PLANEJAMENTO ===
    window.salvarPlanejamento = async () => {
        try {
            await window.salvarPlanejamentoSemanal();
        } catch (error) {
            console.error('[app.js] Erro ao salvar planejamento:', error);
            showNotification('Erro ao salvar planejamento', 'error');
        }
    };
    
    // As funções já estão disponíveis via window no planning.js
    // Apenas verificar se estão carregadas
    if (!window.inicializarPlanejamento) {
        console.warn('[app.js] inicializarPlanejamento ainda não carregada');
    }
    if (!window.fecharModalPlanejamento) {
        console.warn('[app.js] fecharModalPlanejamento ainda não carregada');
    }
    
    // Função de debug para testar indicadores da semana
    window.testarIndicadoresSemana = async () => {
        console.log('[DEBUG] Testando carregamento dos indicadores da semana...');
        const { carregarIndicadoresSemana } = await import('../feature/dashboard.js');
        await carregarIndicadoresSemana();
    };
    
    // Funções do seletor de treino (já definidas em feature/planning.js)
    // Garantir que estão disponíveis globalmente
    
    // === HOME SCREEN AVANÇADA ===
    window.initializeHomeScreen = async function() {
        console.log('[app.js] Inicializando home screen avançada...');
        
        try {
            const currentUser = AppState.get('currentUser');
            
            if (!currentUser || !currentUser.id) {
                console.error('[app.js] ❌ Usuário não logado ou sem ID');
                console.log('[app.js] currentUser atual:', currentUser);
                console.log('[app.js] Estado completo do AppState:', AppState.state);
                
                showNotification('Usuário não está logado. Redirecionando...', 'warning');
                setTimeout(() => {
                    if (window.renderTemplate) {
                        window.renderTemplate('login');
                    }
                }, 500);
                return;
            }
            
            console.log('[app.js] ✅ Usuário válido encontrado:', currentUser.nome, `(ID: ${currentUser.id})`);
            
            // Usar serviço de integração
            const success = await integrationService.initialize();
            
            if (success) {
                console.log('[app.js] ✅ Home screen inicializada com integração completa');
            } else {
                console.warn('[app.js] ⚠️ Home screen inicializada com funcionalidade limitada');
                setupBasicHomeElements(currentUser);
            }
            // Carregar card de progressão da semana
            try {
                const { mostrarProgressaoSemana } = await import('../feature/progressaoSemana.js');
                mostrarProgressaoSemana(currentUser.id);
            } catch(progressErr) {
                console.warn('[app.js] Não foi possível carregar progressão da semana:', progressErr);
            }
            
            setupHomeEventListeners(); // Adiciona listeners após a inicialização da home
            
        } catch (error) {
            console.error('[app.js] Erro na inicialização da home:', error);
            setupBasicHomeElements(AppState.get('currentUser'));
            setupHomeEventListeners(); // Adiciona listeners mesmo em caso de erro, se elementos básicos foram configurados
        }
    };
    
    // === PLANEJAMENTO SEMANAL ===
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
    
    // === EDIÇÃO DE PLANEJAMENTO ===
    window.editarPlanejamentoSemanal = async () => {
        const currentUser = AppState.get('currentUser');
        if (currentUser && currentUser.id) {
            try {
                const { abrirEdicaoPlanejamento } = await import('../feature/planning.js');
                await abrirEdicaoPlanejamento(currentUser.id);
            } catch (error) {
                console.error('[app.js] Erro ao abrir edição de planejamento:', error);
                showNotification('Erro ao abrir edição de planejamento', 'error');
            }
        } else {
            showNotification('Faça login para editar o planejamento.', 'error');
        }
    };
    
    // === TREINO ===
    // Note: window.iniciarTreino is now defined in protocolIntegration.js
    // This allows the proper flow with disposition modal and workout execution
}

// Função para configurar event listeners da tela home
function setupHomeEventListeners() {
    console.log('[app.js] Configurando event listeners da home...');
    const startWorkoutButton = document.getElementById('start-workout-btn');
    if (startWorkoutButton) {
        startWorkoutButton.removeEventListener('click', window.iniciarTreino); // Remover listener antigo para evitar duplicidade
        startWorkoutButton.addEventListener('click', window.iniciarTreino);
        console.log('[app.js] Event listener adicionado ao botão #start-workout-btn.');
    } else {
        console.warn('[app.js] Botão #start-workout-btn não encontrado no DOM para adicionar event listener.');
    }
}

// Configurar elementos básicos da home (fallback)
function setupBasicHomeElements(user) {
    if (!user) return;
    
    try {
        const startBtn = document.getElementById('start-workout-btn');
        if (startBtn) {
            startBtn.disabled = false;
            startBtn.onclick = () => {
                const workout = AppState.get('currentWorkout');
                if (workout) {
                    switch(workout.tipo) {
                        case 'cardio':
                            showNotification('Hora do cardio! 🏃‍♂️', 'info');
                            break;
                        default:
                            if (window.iniciarTreino) {
                                window.iniciarTreino();
                            } else {
                                showNotification('Sistema de treino carregando...', 'info');
                            }
                            break;
                    }
                } else {
                    if (window.abrirPlanejamentoParaUsuarioAtual) {
                        window.abrirPlanejamentoParaUsuarioAtual();
                    } else {
                        showNotification('Configure seu planejamento primeiro', 'warning');
                    }
                }
            };
        }
        
        // Configurar informações básicas do usuário
        updateElement('user-name', user.nome);
        
        const userImages = { 'Pedro': 'pedro.png', 'Japa': 'japa.png', 'Vini': 'vini.png' };
        const avatarEl = document.getElementById('user-avatar');
        if (avatarEl) {
            avatarEl.src = userImages[user.nome] || 'pedro.png';
            avatarEl.alt = user.nome;
        }
        
        // Valores padrão
        updateElement('workout-name', 'Configure Treino');
        updateElement('completed-workouts', '0');
        updateElement('current-week', '1');
        updateElement('progress-percentage', '0%');
        
        console.log('[setupBasicHomeElements] ✅ Elementos básicos configurados');
        
    } catch (error) {
        console.error('[setupBasicHomeElements] Erro:', error);
    }
}

// Configurar sistema de debug (desenvolvimento)
function setupDebugSystem() {
    if (!window.location.hostname.includes('localhost') && 
        !window.location.hostname.includes('127.0.0.1')) {
        return; // Só em desenvolvimento
    }
    
    window.debugApp = {
        // Estado da aplicação
        state: () => ({
            appState: AppState,
            currentUser: AppState.get('currentUser'),
            weekPlan: AppState.get('weekPlan'),
            currentWorkout: AppState.get('currentWorkout')
        }),
        
        // Funções disponíveis
        functions: () => Object.keys(window).filter(key => 
            typeof window[key] === 'function' && key.startsWith('iniciar') || 
            key.startsWith('carregar') || key.startsWith('mostrar')
        ),
        
        // Status das dependências
        dependencies: () => ({
            supabase: !!window.supabase,
            config: !!window.SUPABASE_CONFIG,
            renderTemplate: !!window.renderTemplate,
            protocolo: !!window.iniciarTreino,
            dashboard: !!window.carregarDashboard,
            planning: !!window.inicializarPlanejamento
        }),
        
        // Integração
        integration: () => integrationService.getStatus(),
        metrics: () => integrationService.getPerformanceMetrics(),
        
        // Utilidades
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
        },
        
        forceReload: () => {
            console.log('🔄 Forçando reload da aplicação...');
            window.location.reload();
        },
        
        // Limpeza e reinicialização
        cleanup: () => {
            integrationService.cleanup();
            console.log('🧹 Serviços limpos');
        },
        
        reinit: async () => {
            console.log('🔄 Reinicializando serviços...');
            await integrationService.reinitialize();
            console.log('✅ Serviços reinicializados');
        }
    };
    
    console.log('[app.js] 🔧 Sistema de debug configurado');
    console.log('💡 Use window.debugApp para acessar ferramentas de debug');
    console.log('🔍 Comandos úteis:');
    console.log('  - window.debugApp.state() - Ver estado atual');
    console.log('  - window.debugApp.dependencies() - Verificar dependências');
    console.log('  - window.debugApp.integration() - Status da integração');
    console.log('  - window.debugApp.clearCache() - Limpar cache');
    console.log('  - window.debugApp.reinit() - Reinicializar serviços');
}

// Event listeners principais
document.addEventListener('DOMContentLoaded', () => {
    console.log('[app.js] 📄 DOM carregado, iniciando diagnóstico...');
    
    // Diagnóstico inicial
    console.log('[app.js] 🔍 Diagnóstico:');
    console.log('  - window.renderTemplate:', !!window.renderTemplate);
    console.log('  - window.SUPABASE_CONFIG:', !!window.SUPABASE_CONFIG);
    console.log('  - window.supabase:', !!window.supabase);
    console.log('  - document.getElementById("app"):', !!document.getElementById('app'));
    
    // Aguardar templates carregarem
    const initTimeout = setTimeout(() => {
        console.log('[app.js] ⏰ Iniciando após timeout de 300ms...');
        initApp();
    }, 300);
    
    // Verificar se templates já estão carregados
    if (window.renderTemplate) {
        clearTimeout(initTimeout);
        console.log('[app.js] ⚡ Templates já carregados, iniciando imediatamente');
        initApp();
    } else {
        console.log('[app.js] ⏳ Templates não carregados ainda, aguardando timeout...');
    }
});

// Tratamento de erros global otimizado
window.addEventListener('error', (event) => {
    // Filtrar erros de desenvolvimento e extensões
    if (event.filename && (
        event.filename.includes('localhost') || 
        event.filename.includes('127.0.0.1') ||
        event.filename.includes('chrome-extension') ||
        event.filename.includes('moz-extension')
    )) {
        return;
    }
    
    console.error('🔥 Erro global:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        error: event.error
    });
    
    // Mostrar notificação apenas para erros críticos
    if (event.message && event.message.includes('is not defined')) {
        showNotification('Erro de função não encontrada. Recarregue a página.', 'error');
    }
});

// Tratamento de promises rejeitadas
window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Promise rejeitada:', event.reason);
    
    // Tratar erros específicos
    if (event.reason && event.reason.message) {
        const message = event.reason.message;
        
        if (message.includes('Failed to fetch')) {
            console.warn('⚠️ Erro de rede ignorado');
            event.preventDefault();
            return;
        }
        
        if (message.includes('Supabase')) {
            console.error('💾 Erro do Supabase:', message);
            showNotification('Erro de conexão com o banco de dados', 'error');
            event.preventDefault();
            return;
        }
        
        if (message.includes('NetworkError')) {
            console.warn('⚠️ Erro de rede ignorado');
            event.preventDefault();
            return;
        }
    }
});

// Detectar mudanças de conectividade
window.addEventListener('online', () => {
    console.log('📶 Conexão restaurada');
    showNotification('Conexão restaurada', 'success');
    
    // Tentar recarregar dados
    if (window.recarregarDashboard) {
        setTimeout(window.recarregarDashboard, 1000);
    }
});

window.addEventListener('offline', () => {
    console.log('📵 Conexão perdida');
    showNotification('Sem conexão com a internet', 'warning');
});

// Função auxiliar para atualizar elementos
function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

// Adicionar estilos de animação globais
function addGlobalStyles() {
    if (document.getElementById('app-global-styles')) return;

    const style = document.createElement('style');
    style.id = 'app-global-styles';
    style.textContent = `
        /* Animações globais */
        @keyframes slideUp {
            from { transform: translate(-50%, 100%); opacity: 0; }
            to { transform: translate(-50%, 0); opacity: 1; }
        }
        
        @keyframes slideDown {
            from { transform: translate(-50%, 0); opacity: 1; }
            to { transform: translate(-50%, 100%); opacity: 0; }
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        /* Classes utilitárias */
        .notification { animation: slideUp 0.3s ease; }
        .notification.hide { animation: slideDown 0.3s ease; }
        .loading-spinner { animation: spin 1s linear infinite; }
        .pulse { animation: pulse 2s infinite; }
        .fade-in { animation: fadeIn 0.5s ease; }
        
        /* Transições suaves */
        .smooth-transition {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* Estados de carregamento */
        .loading-state {
            opacity: 0.6;
            pointer-events: none;
        }
        
        /* Melhorias de acessibilidade */
        .screen-reader-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
        }
    `;
    
    document.head.appendChild(style);
}

// === INTEGRAÇÃO: Salvar Ordem Semana ===
// Função para salvar ordem dos treinos na semana
async function salvarOrdemSemana(userId, ano, semana, ordemArray) {
    try {
        // Implementação básica - atualizar ordem dos treinos
        // Aqui você pode implementar a lógica específica conforme necessário
        console.log('Salvando ordem da semana:', { userId, ano, semana, ordemArray });
        
        // Por enquanto, apenas log - implementar conforme necessidade
        return { success: true };
    } catch (error) {
        console.error('Erro ao salvar ordem da semana:', error);
        throw error;
    }
}

document.addEventListener('click', async (e) => {
    if (e.target && e.target.id === 'salvar-ordem-semana') {
        const currentUser = AppState.get('currentUser');
        if (!currentUser || !currentUser.id) {
            showNotification('Usuário não identificado!', 'error');
            return;
        }
        // Assumindo que semana/ano atuais estão no AppState
        const semana = AppState.get('semanaAtual');
        const ano = AppState.get('anoAtual');
        if (!semana || !ano) {
            showNotification('Semana/ano atuais não encontrados!', 'error');
            return;
        }
        // Coletar ordem atual dos itens do DOM
        const ul = document.getElementById('semana-list-ul');
        if (!ul) {
            showNotification('Lista de dias da semana não encontrada!', 'error');
            return;
        }
        const novaOrdemArray = Array.from(ul.children).map((li, idx) => {
            // Supondo que cada li tem data-index e data-dia_semana original
            const originalDiaSemana = parseInt(li.getAttribute('data-dia_semana')) || (idx + 1);
            return { dia_semana: originalDiaSemana };
        });
        try {
            await salvarOrdemSemana(currentUser.id, ano, semana, novaOrdemArray);
            showNotification('Ordem dos treinos salva com sucesso!', 'success');
        } catch (err) {
            showNotification('Erro ao salvar ordem dos treinos', 'error');
            console.error(err);
        }
    }
});

// Inicializar estilos quando o DOM carregar
document.addEventListener('DOMContentLoaded', addGlobalStyles);

// Exportar estado global para debugging
if (typeof window !== 'undefined') {
    window.AppState = AppState;
}

// Limpar recursos quando a página for descarregada
window.addEventListener('beforeunload', () => {
    console.log('[app.js] 🧹 Limpando recursos antes de descarregar...');
    
    try {
        integrationService.cleanup();
    } catch (error) {
        console.warn('[app.js] Erro ao limpar recursos:', error);
    }
});

console.log('[app.js] 📦 Módulo app.js carregado - VERSÃO LIMPA!');