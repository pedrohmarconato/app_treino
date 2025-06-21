// js/ui/navigation.js - VERSÃO CORRIGIDA
// Sistema de navegação e controle de telas

import AppState from '../state/appState.js';

// Mapeamento de telas para templates
const screenTemplateMap = {
    'login-screen': 'login',
    'home-screen': 'home',  // IMPORTANTE: mantém mapeamento para compatibilidade
    'workout-screen': 'workout',
    'planejamentoSemanal': 'planejamentoSemanalPage'
};

// Mostrar tela específica
export function mostrarTela(telaId) {
    console.log('[mostrarTela] Navegando para:', telaId);
    
    // Cleanup da tela anterior antes de navegar
    onScreenLeave();
    
    // Se estiver usando o sistema de templates
    if (window.renderTemplate) {
        const templateName = screenTemplateMap[telaId] || telaId;
        console.log('[mostrarTela] Renderizando template:', templateName);
        
        try {
            window.renderTemplate(templateName);
            
            // Executar callbacks pós-renderização
            setTimeout(() => {
                onScreenRendered(telaId, templateName);
            }, 100);
        } catch (error) {
            console.error('[mostrarTela] Erro ao renderizar template:', error);
            
            // Fallback: tentar sistema antigo
            fallbackToOldSystem(telaId);
        }
    } else {
        console.log('[mostrarTela] Sistema de templates não disponível, usando fallback');
        fallbackToOldSystem(telaId);
    }
}

// Sistema antigo como fallback
function fallbackToOldSystem(telaId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    const screen = document.getElementById(telaId);
    if (screen) {
        screen.classList.add('active');
        onScreenRendered(telaId);
    } else {
        console.error('[fallbackToOldSystem] Tela não encontrada:', telaId);
        
        // Último recurso: recarregar a página
        setTimeout(() => {
            console.log('[fallbackToOldSystem] Recarregando página como último recurso...');
            window.location.reload();
        }, 1000);
    }
}

// Callback executado antes de sair de uma tela (cleanup)
function onScreenLeave() {
    try {
        // Detectar tela atual antes de sair
        const currentScreen = document.querySelector('.screen.active');
        if (!currentScreen) return;
        
        const currentScreenId = currentScreen.id;
        console.log('[onScreenLeave] Saindo da tela:', currentScreenId);
        
        switch(currentScreenId) {
            case 'home-screen':
                // Limpar listeners do Supabase para mudanças em tempo real
                if (window.limparEventListeners) {
                    console.log('[onScreenLeave] Limpando listeners da home screen...');
                    window.limparEventListeners();
                }
                break;
                
            case 'workout-screen':
                // Cleanup da tela de treino se necessário
                console.log('[onScreenLeave] Cleanup da workout screen...');
                break;
                
            case 'planejamentoSemanal':
                // Cleanup da tela de planejamento se necessário
                console.log('[onScreenLeave] Cleanup da planning screen...');
                break;
                
            default:
                // Nenhum cleanup específico necessário
                break;
        }
        
    } catch (error) {
        console.error('[onScreenLeave] Erro durante cleanup:', error);
    }
}

// Refetch workouts quando foca na tela home (equivalente ao useFocusEffect)
async function refetchOnHomeFocus() {
    try {
        console.log('[refetchOnHomeFocus] 🔄 Recarregando dados da home screen...');
        
        const currentUser = AppState.get('currentUser');
        if (!currentUser || !currentUser.id) {
            console.warn('[refetchOnHomeFocus] ❌ Usuário não está definido');
            return;
        }

        // Aguardar um pouco para garantir que a tela foi totalmente renderizada
        await new Promise(resolve => setTimeout(resolve, 100));

        // Importar função de fetch workouts
        const fetchWorkouts = window.fetchWorkouts || await importFetchWorkouts();
        
        if (fetchWorkouts) {
            // Executar refetch dos workouts
            await fetchWorkouts();
            console.log('[refetchOnHomeFocus] ✅ Workouts recarregados com sucesso');
        } else {
            console.warn('[refetchOnHomeFocus] ⚠️ Função fetchWorkouts não disponível');
        }
        
    } catch (error) {
        console.error('[refetchOnHomeFocus] ❌ Erro ao refetch:', error);
    }
}

// Helper para importar fetchWorkouts se não estiver disponível globalmente
async function importFetchWorkouts() {
    try {
        // Tentar importar do dashboard
        const dashboardModule = await import('../feature/dashboard.js');
        
        // Se não estiver exportado, tentar acessar via window
        if (window.fetchWorkouts) {
            return window.fetchWorkouts;
        }
        
        // Criar uma versão local se necessário
        return async function() {
            console.log('[importFetchWorkouts] Executando refetch local...');
            
            const currentUser = AppState.get('currentUser');
            if (!currentUser?.id) return;

            // Como não temos tabelas workouts/weekly_plan, vamos atualizar o planejamento semanal
            let planAtualizado = null;
            try {
                const { getActiveWeeklyPlan } = await import('../services/weeklyPlanningService.js');
                planAtualizado = await getActiveWeeklyPlan(currentUser.id);
                console.log('[importFetchWorkouts] ✅ Plano carregado');
            } catch (error) {
                console.error('[importFetchWorkouts] ❌ Erro ao buscar plano:', error.message);
            }
            
            // Atualizar estado
            if (planAtualizado) {
                AppState.set('weekPlan', planAtualizado);
            }
            
            // Recarregar dashboard se a função estiver disponível
            if (window.recarregarDashboard) {
                window.recarregarDashboard();
            }
            
            console.log('[importFetchWorkouts] ✅ Refetch local concluído');
        };
        
    } catch (error) {
        console.error('[importFetchWorkouts] ❌ Erro ao importar fetchWorkouts:', error);
        return null;
    }
}

// Callback executado após renderizar uma tela
function onScreenRendered(telaId, templateName = null) {
    console.log('[onScreenRendered] Tela renderizada:', telaId, 'Template:', templateName);
    
    try {
        switch(telaId) {
            case 'login-screen':
                // Re-renderizar usuários se houver
                const users = AppState.get('users');
                if (users && users.length > 0) {
                    renderUsuarios(users);
                }
                break;
                
            case 'home-screen':
                // CORRIGIDO: Inicializar home screen adequadamente
                console.log('[onScreenRendered] Inicializando tela home...');
                initializeHomeScreen();
                
                // Refetch workouts ao focar na tela home (equivalente ao useFocusEffect)
                refetchOnHomeFocus();
                break;
                
            case 'workout-screen':
                // Preparar tela de treino
                prepareWorkoutScreen();
                break;

            case 'planejamentoSemanal':
                const currentUserForPlanning = AppState.get('currentUser');
                if (currentUserForPlanning && currentUserForPlanning.id) {
                    if (window.inicializarPlanejamento) {
                        console.log(`[onScreenRendered] Initializing planning for user: ${currentUserForPlanning.id}`);
                        window.inicializarPlanejamento(currentUserForPlanning.id);
                    } else {
                        console.error('[onScreenRendered] window.inicializarPlanejamento não encontrado.');
                    }
                    
                    // Inject styles for the planning page
                    if (window.modalPlanejamentoStyles && !document.getElementById('modalPlanejamentoPageStyles')) {
                        const styleTag = document.createElement('style');
                        styleTag.id = 'modalPlanejamentoPageStyles';
                        styleTag.innerHTML = window.modalPlanejamentoStyles;
                        document.head.appendChild(styleTag);
                        console.log('[onScreenRendered] Injected modalPlanejamentoPageStyles.');
                    }
                } else {
                    console.error('[onScreenRendered] Usuário atual não encontrado no AppState para inicializar o planejamento semanal.');
                    if(window.showNotification) window.showNotification('Erro: Usuário não identificado para o planejamento.', 'error');
                    if(window.mostrarTela) window.mostrarTela('login-screen');
                }
                break;
        }
    } catch (error) {
        console.error('[onScreenRendered] Erro no callback:', error);
    }
}

// NOVA FUNÇÃO: Inicializar tela home
function initializeHomeScreen() {
    try {
        const currentUser = AppState.get('currentUser');
        
        if (!currentUser) {
            console.warn('[initializeHomeScreen] Nenhum usuário logado, redirecionando para login');
            setTimeout(() => mostrarTela('login-screen'), 500);
            return;
        }
        
        console.log('[initializeHomeScreen] Inicializando para usuário:', currentUser.nome);
        
        // 1. Atualizar informações do usuário na UI
        updateUserInfo(currentUser);
        
        // 2. Carregar dashboard
        setTimeout(async () => {
            try {
                if (window.carregarDashboard) {
                    console.log('[initializeHomeScreen] Carregando dashboard...');
                    await window.carregarDashboard();
                    console.log('[initializeHomeScreen] Dashboard carregado com sucesso');
                } else {
                    console.warn('[initializeHomeScreen] window.carregarDashboard não disponível');
                    
                    // Fallback: configurar elementos básicos
                    setupBasicHomeElements(currentUser);
                }
            } catch (error) {
                console.error('[initializeHomeScreen] Erro ao carregar dashboard:', error);
                setupBasicHomeElements(currentUser);
            }
        }, 200);
        
        console.log('[initializeHomeScreen] Inicialização da home concluída');
        
    } catch (error) {
        console.error('[initializeHomeScreen] Erro:', error);
    }
}

// Configurar elementos básicos da home se o dashboard falhar
function setupBasicHomeElements(user) {
    try {
        // Configurar botão de início
        const startBtn = document.getElementById('start-workout-btn');
        if (startBtn) {
            startBtn.disabled = false;
            startBtn.onclick = () => {
                const workout = AppState.get('currentWorkout');
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
        
        // Configurar elementos básicos
        updateElement('user-name', user.nome);
        updateElement('next-workout-name', 'Treino do Dia');
        updateElement('completed-workouts', '0');
        updateElement('current-week', '1');
        updateElement('progress-percentage', '0%');
        
        console.log('[setupBasicHomeElements] Elementos básicos configurados');
        
    } catch (error) {
        console.error('[setupBasicHomeElements] Erro:', error);
    }
}

// Atualizar informações do usuário na UI
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
        }
        
        console.log('[updateUserInfo] Informações do usuário atualizadas:', user.nome);
        
    } catch (error) {
        console.error('[updateUserInfo] Erro:', error);
    }
}

// Preparar tela de treino
function prepareWorkoutScreen() {
    try {
        const workout = AppState.get('currentWorkout');
        if (workout) {
            const workoutTitle = document.getElementById('workout-title');
            if (workoutTitle) {
                const tipoTreino = obterTipoTreino(workout.dia_semana);
                workoutTitle.textContent = `Treino ${tipoTreino}`;
            }
        }
        
        console.log('[prepareWorkoutScreen] Tela de treino preparada');
        
    } catch (error) {
        console.error('[prepareWorkoutScreen] Erro:', error);
    }
}

// Renderizar lista de usuários
function renderUsuarios(usuarios) {
    try {
        const container = document.getElementById('users-grid');
        if (!container) {
            console.warn('[renderUsuarios] Container users-grid não encontrado');
            return;
        }
        
        container.innerHTML = '';
        
        usuarios.forEach(user => {
            const userImages = {
                'Pedro': 'pedro.png',
                'Japa': 'japa.png'
            };
            
            const card = document.createElement('div');
            card.className = 'user-card';
            card.innerHTML = `
                <div class="user-avatar">
                    <img src="${userImages[user.nome] || 'pedro.png'}" 
                         alt="${user.nome}">
                </div>
                <h3>${user.nome}</h3>
                <p>Atleta Premium</p>
            `;
            
            card.addEventListener('click', () => {
                if (window.selecionarUsuario) {
                    window.selecionarUsuario(user);
                }
            });
            
            container.appendChild(card);
        });
        
        console.log('[renderUsuarios] Usuários renderizados:', usuarios.length);
        
    } catch (error) {
        console.error('[renderUsuarios] Erro:', error);
    }
}

// Navegar para tela anterior
export function voltarParaHome() {
    mostrarTela('home-screen');
}

// Fazer logout
export function logout() {
    try {
        AppState.reset();
        mostrarTela('login-screen');
        
        if (window.showNotification) {
            window.showNotification('Logout realizado com sucesso', 'info');
        }
        
        console.log('[logout] Logout realizado');
        
    } catch (error) {
        console.error('[logout] Erro no logout:', error);
    }
}

// Tornar logout acessível globalmente
window.logout = logout;

// Obter tipo de treino baseado no dia da semana
function obterTipoTreino(diaSemana) {
    const tipos = { 1: 'A', 2: 'B', 3: 'C', 4: 'D' };
    return tipos[diaSemana] || 'A';
}

// Verificar se pode navegar (útil para prevenir navegação durante treino)
export function canNavigate() {
    const isWorkoutActive = AppState.get('isWorkoutActive');
    
    if (isWorkoutActive) {
        return confirm('Você tem um treino em andamento. Deseja realmente sair?');
    }
    
    return true;
}

// Adicionar botão de ordem da semana após login
export function adicionarBotaoOrdemSemana() {
    try {
        let bar = document.querySelector('.bottom-nav, .bottom-bar, .bottomnavigator, #bottom-nav');
        
        if (!bar) {
            bar = document.createElement('div');
            bar.className = 'bottom-nav';
            bar.innerHTML = '<div class="nav-items"></div>';
            document.body.appendChild(bar);
        }
        
        const navItems = bar.querySelector('.nav-items') || bar;
        
        if (!navItems.querySelector('#order-week-btn')) {
            const btn = document.createElement('button');
            btn.id = 'order-week-btn';
            btn.className = 'nav-item';
            btn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"/>
                </svg>
                <span>Ordem</span>
            `;
            btn.onclick = () => {
                if (window.renderTemplate) {
                    window.renderTemplate('orderWeek');
                }
            };
            navItems.appendChild(btn);
        }
        
        console.log('[adicionarBotaoOrdemSemana] Botão adicionado');
        
    } catch (error) {
        console.error('[adicionarBotaoOrdemSemana] Erro:', error);
    }
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