/**
 * 🧭 SISTEMA DE NAVEGAÇÃO - Navigation UI
 *
 * FUNÇÃO: Controlar navegação entre telas e gerenciar transições de estado.
 *
 * RESPONSABILIDADES:
 * - Gerenciar navegação entre telas (home, login, workout, planning)
 * - Implementar guards de navegação (verificar autenticação, estado)
 * - Controlar transições suaves com loading states
 * - Manter histórico de navegação para botão "voltar"
 * - Preservar estado durante navegação (não perder dados)
 * - Integrar com workoutStateManager para recuperação
 *
 * TELAS PRINCIPAIS:
 * - login-screen: Autenticação do usuário
 * - home-screen: Dashboard principal
 * - workout-screen: Execução de treinos
 * - planning-screen: Planejamento semanal
 *
 * FUNCIONALIDADES:
 * - mostrarTela(): Navegar para tela específica com validações
 * - voltarParaHome(): Voltar ao dashboard com limpeza de estado
 * - logout(): Limpar sessão e redirecionar para login
 * - navigationGuard(): Verificar permissões antes da navegação
 *
 * INTEGRAÇÃO: AppState, workoutStateManager, authentication
 */

import AppState from '../state/appState.js';

// Mapeamento de telas para templates
const screenTemplateMap = {
  'login-screen': 'login',
  'home-screen': 'home', // IMPORTANTE: mantém mapeamento para compatibilidade
  'workout-screen': 'workout',
  planejamentoSemanal: 'planejamentoSemanalPage',
  'dashboard-metricas-screen': 'dashboardMetricas',
};

// Mostrar tela específica
export function mostrarTela(telaId) {
  console.log('[mostrarTela] Navegando para:', telaId);

  // Prevenir scroll issues no mobile
  window.scrollTo(0, 0);
  document.body.style.overflow = 'auto';

  // Debug: verificar estado atual
  console.log('[mostrarTela] Estado atual:', {
    telaId,
    templateMap: screenTemplateMap[telaId],
    renderTemplate: typeof window.renderTemplate,
    currentUser: AppState.get('currentUser'),
  });

  // IMPORTANTE: Remover duplicatas de workout-screen antes de criar nova
  if (telaId === 'workout-screen') {
    const existingScreens = document.querySelectorAll('#workout-screen');
    if (existingScreens.length > 0) {
      console.log(
        `[mostrarTela] Removendo ${existingScreens.length} duplicata(s) de #workout-screen`
      );
      existingScreens.forEach((screen, index) => {
        console.log(`[mostrarTela] Removendo duplicata ${index + 1}`);
        screen.remove();
      });
    }
  }

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

        // Garantir que a tela esteja visível no mobile
        const newScreen = document.getElementById(telaId);
        if (newScreen) {
          newScreen.style.display = 'block';
          newScreen.style.position = 'relative';
          newScreen.style.minHeight = '100vh';
          newScreen.classList.add('active');
        }
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
  document.querySelectorAll('.screen').forEach((screen) => {
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

    switch (currentScreenId) {
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
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Importar função de fetch workouts
    const fetchWorkouts = window.fetchWorkouts || (await importFetchWorkouts());

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
    return async function () {
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
    switch (telaId) {
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
            console.log(
              `[onScreenRendered] Initializing planning for user: ${currentUserForPlanning.id}`
            );
            window.inicializarPlanejamento(currentUserForPlanning.id);
          } else {
            console.error('[onScreenRendered] window.inicializarPlanejamento não encontrado.');
          }

          // Inject styles for the planning page
          if (
            window.modalPlanejamentoStyles &&
            !document.getElementById('modalPlanejamentoPageStyles')
          ) {
            const styleTag = document.createElement('style');
            styleTag.id = 'modalPlanejamentoPageStyles';
            styleTag.innerHTML = window.modalPlanejamentoStyles;
            document.head.appendChild(styleTag);
            console.log('[onScreenRendered] Injected modalPlanejamentoPageStyles.');
          }
        } else {
          console.error(
            '[onScreenRendered] Usuário atual não encontrado no AppState para inicializar o planejamento semanal.'
          );
          if (window.showNotification)
            window.showNotification('Erro: Usuário não identificado para o planejamento.', 'error');
          if (window.mostrarTela) window.mostrarTela('login-screen');
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
        if (window.initializeHomePage) {
          console.log('[initializeHomeScreen] Inicializando página home...');
          await window.initializeHomePage();
          console.log('[initializeHomeScreen] Página home inicializada com sucesso');
        } else if (window.carregarDashboard) {
          console.log('[initializeHomeScreen] Usando carregarDashboard (fallback)...');
          await window.carregarDashboard();
          console.log('[initializeHomeScreen] Dashboard carregado com sucesso');
        } else {
          console.warn('[initializeHomeScreen] Nenhuma função de inicialização disponível');

          // Fallback: configurar elementos básicos
          setupBasicHomeElements(currentUser);
        }
      } catch (error) {
        console.error('[initializeHomeScreen] Erro ao carregar dashboard:', error);
        setupBasicHomeElements(currentUser);
      }
    }, 200);

    // 3. Verificar e mostrar alertas de validação do plano semanal
    setTimeout(async () => {
      try {
        console.log('[initializeHomeScreen] Verificando validação do plano semanal...');
        // Importação dinâmica para evitar problemas de dependência circular
        const { default: WeeklyPlanningValidationService } = await import(
          '../services/weeklyPlanningValidationService.js'
        );

        // Forçar validação imediata com dados reais do banco
        const validationResult = await WeeklyPlanningValidationService.validateWeeklyPlan();

        console.log('[initializeHomeScreen] Resultado da validação:', {
          hasIssues: validationResult.hasIssues,
          issuesCount: validationResult.issues?.length || 0,
          suggestionsCount: validationResult.suggestions?.length || 0,
        });

        if (validationResult.hasIssues && validationResult.needsAttention) {
          console.log('[initializeHomeScreen] 🚨 Treinos perdidos detectados! Mostrando modal...');
          WeeklyPlanningValidationService.showPlanAdjustmentModal(validationResult);
        } else {
          console.log('[initializeHomeScreen] ✅ Nenhum treino perdido detectado');
        }
      } catch (error) {
        console.error('[initializeHomeScreen] Erro na validação do plano semanal:', error);
      }
    }, 1500); // Aguardar um pouco mais para não conflitar com outras modais

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
      Pedro: 'pedro.png',
      Japa: 'japa.png',
      Vini: 'vini.png',
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

    usuarios.forEach((user) => {
      const userImages = {
        Pedro: 'pedro.png',
        Japa: 'japa.png',
        Vini: 'vini.png',
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

// Função auxiliar para forçar navegação para login
function forcarNavegacaoLogin() {
  console.log('[logout] 🆘 Executando fallback de navegação...');

  // Tentar múltiplas abordagens
  const tentativas = [
    () => {
      // Tentativa 1: Verificar se existe elemento login-screen
      const loginScreen = document.getElementById('login-screen');
      if (loginScreen) {
        // Esconder todas as telas
        document.querySelectorAll('.screen').forEach((screen) => {
          screen.classList.remove('active');
        });
        // Mostrar login
        loginScreen.classList.add('active');
        return true;
      }
      return false;
    },
    () => {
      // Tentativa 2: Recriar tela de login básica
      const app = document.getElementById('app');
      if (app) {
        app.innerHTML = `
                    <div id="login-screen" class="screen active">
                        <div class="login-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; background: var(--bg-primary, #101010); color: var(--text-primary, #fff);">
                            <h1 style="margin-bottom: 2rem; color: var(--accent-primary, #CFFF04);">App Treino</h1>
                            <p style="margin-bottom: 1rem;">Logout realizado com sucesso!</p>
                            <button onclick="location.reload()" style="padding: 12px 24px; background: var(--accent-primary, #CFFF04); color: #000; border: none; border-radius: 6px; cursor: pointer;">
                                Fazer Login Novamente
                            </button>
                        </div>
                    </div>
                `;
        return true;
      }
      return false;
    },
    () => {
      // Tentativa 3: Recarregar página
      console.log('[logout] 🔄 Recarregando página como último recurso...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      return true;
    },
  ];

  // Executar tentativas em sequência
  for (let i = 0; i < tentativas.length; i++) {
    try {
      if (tentativas[i]()) {
        console.log(`[logout] ✅ Fallback ${i + 1} executado com sucesso`);
        break;
      }
    } catch (e) {
      console.error(`[logout] ❌ Fallback ${i + 1} falhou:`, e);
    }
  }
}

// Obter tipo de treino baseado no dia da semana
function obterTipoTreino(diaSemana) {
  const tipos = { 1: 'A', 2: 'B', 3: 'C', 4: 'D' };
  return tipos[diaSemana] || 'A';
}

// === ENHANCED NAVIGATION GUARDS ===

/**
 * Verifica se pode navegar usando NavigationGuard inteligente
 * @param {string} targetRoute - Rota de destino
 * @param {Object} options - Opções da navegação
 * @returns {Promise<boolean>} Se a navegação pode prosseguir
 */
export async function canNavigate(targetRoute = null, options = {}) {
  try {
    // Usar NavigationGuard para lógica inteligente
    const { canNavigate: guardCanNavigate } = await import('../services/navigationGuard.js');
    return await guardCanNavigate(targetRoute, options);
  } catch (error) {
    console.error('[Navigation] Erro ao usar NavigationGuard, usando fallback:', error);
    return canNavigateLegacy();
  }
}

/**
 * Intercepta navegação e aplica guards inteligentes
 * @param {string} targetRoute - Rota de destino
 * @param {Object} options - Opções da navegação
 * @returns {Promise<boolean>} Se a navegação foi permitida
 */
export async function navigateWithGuards(targetRoute, options = {}) {
  console.log('[Navigation] Tentativa de navegação para:', targetRoute);

  try {
    const canProceed = await canNavigate(targetRoute, options);

    if (canProceed) {
      console.log('[Navigation] Navegação permitida pelo guard');
      mostrarTela(targetRoute);
      return true;
    } else {
      console.log('[Navigation] Navegação bloqueada pelo guard');
      return false;
    }
  } catch (error) {
    console.error('[Navigation] Erro na navegação com guards:', error);

    // Em caso de erro, usar navegação direta
    console.log('[Navigation] Usando navegação direta como fallback');
    mostrarTela(targetRoute);
    return true;
  }
}

/**
 * Navegação segura - sempre usa guards
 * @param {string} targetRoute - Rota de destino
 * @param {Object} options - Opções da navegação
 */
export async function safeNavigate(targetRoute, options = {}) {
  const success = await navigateWithGuards(targetRoute, options);

  if (!success && !options.silent) {
    console.log('[Navigation] Navegação cancelada pelo usuário');
  }

  return success;
}

/**
 * Força navegação sem guards (usar com cuidado)
 * @param {string} targetRoute - Rota de destino
 */
export function forceNavigate(targetRoute) {
  console.warn('[Navigation] FORÇANDO navegação sem guards para:', targetRoute);
  mostrarTela(targetRoute);
}

/**
 * Verifica se há sessão para recuperar no startup da app
 */
export async function checkAndShowRecovery() {
  try {
    const { checkForRecovery, showRecoveryModal } = await import('../services/navigationGuard.js');

    const sessionData = await checkForRecovery();
    if (!sessionData) {
      return null;
    }

    console.log('[Navigation] Sessão de treino detectada, exibindo modal de recuperação');
    const recoveryResult = await showRecoveryModal(sessionData);

    return recoveryResult;
  } catch (error) {
    console.error('[Navigation] Erro ao verificar recovery:', error);
    return null;
  }
}

/**
 * Configura o sistema de navigation guards
 * @param {Object} config - Configurações
 */
export async function configureNavigation(config = {}) {
  try {
    const { configureGuard } = await import('../services/navigationGuard.js');
    configureGuard(config);
    console.log('[Navigation] Sistema configurado:', config);
  } catch (error) {
    console.error('[Navigation] Erro ao configurar sistema:', error);
  }
}

/**
 * Versão legacy do canNavigate (para compatibilidade)
 */
export function canNavigateLegacy() {
  const isWorkoutActive = AppState.get('isWorkoutActive');

  if (isWorkoutActive) {
    return confirm('Você tem um treino em andamento. Deseja realmente sair?');
  }

  return true;
}

// === BACKWARD COMPATIBILITY ===
// Manter funções antigas para compatibilidade

/**
 * @deprecated Use safeNavigate() ao invés disso
 */
export const navigateWithModal = safeNavigate;

/**
 * @deprecated Use canNavigate() ao invés disso
 */
export const checkWorkoutBeforeNavigate = canNavigate;

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

// ===== FUNÇÕES DE LOGOUT RESTAURADAS =====

// Função principal de logout
export function logout() {
  try {
    console.log('[logout] 🚪 Iniciando logout...');

    // Limpar timers e intervalos ativos
    if (window.timerManager && typeof window.timerManager.clearAll === 'function') {
      window.timerManager.clearAll();
      console.log('[logout] ⏰ Timers limpos');
    }

    // Limpar estado da aplicação
    if (AppState && typeof AppState.reset === 'function') {
      AppState.reset();
      console.log('[logout] 🗂️ Estado da aplicação limpo');
    }

    // Limpar localStorage
    const keysToRemove = [
      'workoutState',
      'currentWorkout',
      'currentExercises',
      'weekPlan',
      'lastSyncTime',
      'userSession',
    ];
    keysToRemove.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`[logout] Erro ao remover ${key}:`, error);
      }
    });
    console.log('[logout] 💾 localStorage limpo');

    // Navegar para tela de login
    setTimeout(() => {
      mostrarTela('login-screen');
      console.log('[logout] ✅ Logout concluído com sucesso');
    }, 200);
  } catch (error) {
    console.error('[logout] ❌ Erro durante logout:', error);

    // Fallback: recarregar página
    setTimeout(() => {
      console.log('[logout] 🔄 Fallback: recarregando página');
      window.location.reload();
    }, 1000);
  }
}

// Função de logout manual como backup
function logoutManual() {
  console.log('[logoutManual] 🔧 Executando logout manual...');

  try {
    // Limpar AppState se disponível
    if (typeof AppState !== 'undefined' && AppState.reset) {
      AppState.reset();
      console.log('[logoutManual] ✅ AppState limpo');
    }

    // Limpar localStorage
    const keys = ['workoutState', 'currentWorkout', 'currentExercises'];
    keys.forEach((key) => localStorage.removeItem(key));
    console.log('[logoutManual] ✅ localStorage limpo');

    // Limpar timers se disponível
    if (window.timerManager && typeof window.timerManager.clearAll === 'function') {
      window.timerManager.clearAll();
      console.log('[logoutManual] ✅ Timers limpos');
    }

    // Navegar para login
    setTimeout(() => {
      if (typeof mostrarTela === 'function') {
        mostrarTela('login-screen');
        console.log('[logoutManual] ✅ Navegação via mostrarTela');
      } else if (window.renderTemplate) {
        window.renderTemplate('login');
        console.log('[logoutManual] ✅ Navegação via renderTemplate');
      } else {
        console.log('[logoutManual] 🔄 Recarregando página como fallback');
        window.location.reload();
      }
    }, 300);
  } catch (error) {
    console.error('[logoutManual] ❌ Erro no logout manual:', error);
    setTimeout(() => window.location.reload(), 1000);
  }
}

// Função auxiliar para executar logout com múltiplas tentativas
function executarLogout() {
  console.log('[executarLogout] 🚪 Iniciando processo de logout...');

  try {
    // Primeira tentativa: usar função logout padrão
    if (typeof logout === 'function') {
      console.log('[executarLogout] 🎯 Usando função logout padrão');
      logout();
      return;
    }

    // Segunda tentativa: usar função global
    if (typeof window.logout === 'function') {
      console.log('[executarLogout] 🎯 Usando função global window.logout');
      window.logout();
      return;
    }

    // Terceira tentativa: execução manual
    console.log('[executarLogout] 🎯 Executando logout manualmente');
    logoutManual();
  } catch (error) {
    console.error('[executarLogout] ❌ Erro ao executar logout:', error);

    // Última tentativa: força brutal
    setTimeout(() => {
      console.log('[executarLogout] 🆘 Forçando logout com recarregamento');
      window.location.reload();
    }, 1000);
  }
}

// Tornar funções acessíveis globalmente
window.logout = logout;
window.executarLogout = executarLogout;
window.logoutManual = logoutManual;

// Export additional functions
export { executarLogout, logoutManual };
