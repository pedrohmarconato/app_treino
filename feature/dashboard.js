/**
 * 🏠 TELA PRINCIPAL - Dashboard do Usuário
 *
 * FUNÇÃO: Exibir visão geral completa do progresso e status do usuário.
 *
 * RESPONSABILIDADES:
 * - Mostrar resumo da semana atual de treinos (A, B, C, D, Folga, Cardio)
 * - Exibir métricas de progresso (treinos concluídos, séries, carga total)
 * - Renderizar calendário visual com status de cada dia
 * - Detectar e mostrar treinos em andamento (botão "Continuar Treino")
 * - Fornecer acesso rápido a funcionalidades (Iniciar Treino, Planejamento)
 * - Sincronizar dados offline quando voltar online
 *
 * COMPONENTES PRINCIPAIS:
 * - Header com dados do usuário e notificações
 * - Widget de semana atual com indicadores visuais
 * - Card de métricas com estatísticas de progresso
 * - Botão contextual de treino (Iniciar/Continuar)
 * - Lista de treinos recentes e próximos
 *
 * DADOS CARREGADOS:
 * - Planejamento semanal atual do usuário
 * - Métricas de progresso (semana/mês)
 * - Status de treinos executados
 * - Cache de treinos em andamento
 *
 * NAVEGAÇÃO: Ponto central que direciona para workout.js e planning.js
 */
import AppState from '../state/appState.js';
import {
  obterSemanaAtivaUsuario,
  carregarStatusSemanas,
  buscarExerciciosTreinoDia,
} from '../services/weeklyPlanningService.js';
import { fetchMetricasUsuario } from '../services/userService.js';
import { getWorkoutIcon, getActionIcon, workoutTypeMap } from '../utils/icons.js';
import WeeklyPlanService from '../services/weeklyPlanningService.js';
// Import removido para compatibilidade com browser tradicional
// Use window.WeeklyPlanService.metodo() para acessar métodos
// Se precisar de funções globais, atribua manualmente abaixo
import homeService from '../services/homeService.js';
import { showNotification } from '../ui/notifications.js';
import { supabase, query } from '../services/supabaseService.js';
// Removido: import TreinoExecutadoService - serviço obsoleto

// Mapear tipos de treino para ícones
const TREINO_ICONS = {
  Peito: 'peito',
  Costas: 'costas',
  Pernas: 'pernas',
  'Ombro e Braço': 'ombros',
  Ombro: 'ombros',
  Braço: 'bracos',
  Cardio: 'cardio',
  cardio: 'cardio',
  folga: 'descanso',
  A: 'peito',
  B: 'costas',
  C: 'pernas',
  D: 'ombros',
};

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// Função auxiliar para formatar nome do treino
function formatarNomeTreino(treino) {
  if (!treino) return 'Sem treino';

  switch (treino.tipo) {
    case 'folga':
      return 'Dia de Folga';
    case 'cardio':
      return 'Treino Cardiovascular';
    default:
      return `Treino ${treino.tipo}`;
  }
}

// Função principal para carregar dashboard
// SISTEMA DE CACHE GLOBAL - CARREGA UMA VEZ E USA SEMPRE
let dadosGlobaisCache = {
  dados: null,
  timestamp: 0,
  usuario_id: null,
  semanaAtual: null,
  semanaExibida: null,
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Função para limpar cache e forçar recarregamento
function limparCacheGlobal() {
  console.log('[limparCacheGlobal] 🧹 Limpando cache global...');
  dadosGlobaisCache = {
    dados: null,
    timestamp: 0,
    usuario_id: null,
    semanaAtual: null,
    semanaExibida: null,
  };

  // IMPORTANTE: Limpar também o localStorage para forçar nova busca
  try {
    // Limpar todos os caches relacionados ao planejamento
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.includes('weekly-plan') || key.includes('planejamento') || key.includes('cache')) {
        localStorage.removeItem(key);
        console.log('[limparCacheGlobal] Removido do localStorage:', key);
      }
    });
  } catch (e) {
    console.warn('[limparCacheGlobal] Erro ao limpar localStorage:', e);
  }
}

// Disponibilizar globalmente para debug
window.limparCacheGlobal = limparCacheGlobal;
window.dadosGlobaisCache = dadosGlobaisCache;

// Função para garantir que o card expandível sempre existe (fallback)
function garantirCardExpandivelExiste() {
  console.log('[garantirCardExpandivelExiste] 🔧 Garantindo estrutura do card expandível...');

  // Verificar se os elementos necessários existem
  const elementos = {
    card: document.getElementById('current-workout-card'),
    content: document.getElementById('expandable-content'),
    toggle: document.getElementById('workout-toggle'),
    exercisesList: document.getElementById('workout-exercises-list'),
  };

  console.log('[garantirCardExpandivelExiste] Elementos encontrados:', elementos);

  // Se todos existem, não precisa fazer nada
  if (elementos.card && elementos.content && elementos.toggle && elementos.exercisesList) {
    console.log('[garantirCardExpandivelExiste] ✅ Todos os elementos já existem');

    // Garantir que o conteúdo da lista seja adequado quando não há treino
    if (elementos.exercisesList) {
      elementos.exercisesList.innerHTML = `
                <div class="no-exercises-message info">
                    <div class="message-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="16" x2="12" y2="12"/>
                            <line x1="12" y1="8" x2="12.01" y2="8"/>
                        </svg>
                    </div>
                    <p class="message-text">Nenhum treino configurado para hoje. Configure seu planejamento semanal.</p>
                </div>
            `;
    }
    return;
  }

  // Se faltam elementos, algo está muito errado - vamos reportar
  console.error(
    '[garantirCardExpandivelExiste] ❌ Elementos obrigatórios não encontrados no template!'
  );
  console.error('[garantirCardExpandivelExiste] Esta é a estrutura esperada:');
  console.error('- #current-workout-card (card)');
  console.error('- #expandable-content (content)');
  console.error('- #workout-toggle (toggle)');
  console.error('- #workout-exercises-list (exercisesList)');

  // Listar todos os IDs disponíveis para debug
  const todosOsIds = Array.from(document.querySelectorAll('[id]')).map((el) => el.id);
  console.error('[garantirCardExpandivelExiste] IDs disponíveis na página:', todosOsIds);
}

// Carregar TODOS os dados necessários de uma vez
async function carregarDadosCompletos(semanaTarget = null) {
  try {
    const currentUser = AppState.get('currentUser');
    if (!currentUser || !currentUser.id) {
      console.error('[carregarDadosCompletos] Usuário não encontrado');
      return null;
    }

    console.log('[carregarDadosCompletos] 🚀 Carregando todos os dados...');

    // Verificar cache
    const agora = Date.now();
    if (
      dadosGlobaisCache.dados &&
      dadosGlobaisCache.usuario_id === currentUser.id &&
      agora - dadosGlobaisCache.timestamp < CACHE_DURATION
    ) {
      console.log('[carregarDadosCompletos] ✅ Usando cache existente');
      return dadosGlobaisCache.dados;
    }

    // MUDANÇA: Primeiro buscar semana do protocolo do usuário
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const semanaAtual = WeeklyPlanService.getWeekNumber(hoje); // semana civil como fallback

    // Buscar semana ativa do protocolo do usuário PRIMEIRO
    const semanaAtiva = await obterSemanaAtivaUsuario(currentUser.id);

    // Buscar também a semana_atual diretamente do usuario_plano_treino
    const { data: planoUsuario } = await supabase
      .from('usuario_plano_treino')
      .select('semana_atual')
      .eq('usuario_id', currentUser.id)
      .eq('status', 'ativo')
      .single();

    const semanaProtocolo = planoUsuario?.semana_atual || semanaAtiva?.semana_treino || 1;

    console.log(
      '[carregarDadosCompletos] 🔄 NOVA LÓGICA: Semana civil:',
      semanaAtual,
      '| Semana protocolo:',
      semanaProtocolo
    );

    // Determinar range de semanas a carregar baseado na SEMANA DO PROTOCOLO
    const semanareferencia = semanaTarget || semanaProtocolo;
    const semanaMin = Math.max(1, semanareferencia - 5);
    const semanaMax = Math.min(53, semanareferencia + 5);

    console.log(
      `[carregarDadosCompletos] Carregando semanas ${semanaMin} a ${semanaMax} (target PROTOCOLO: ${semanareferencia})`
    );

    // Fazer UMA consulta para buscar dados de múltiplas semanas (range expandido)
    // IMPORTANTE: Usar semana_treino (protocolo) ao invés de semana (calendário)
    const { data: planejamentos, error } = await supabase
      .from('planejamento_semanal')
      .select('*')
      .eq('usuario_id', currentUser.id)
      .eq('ano', anoAtual)
      .gte('semana_treino', semanaMin)
      .lte('semana_treino', semanaMax)
      .order('semana_treino', { ascending: true })
      .order('dia_semana', { ascending: true });

    if (error) {
      console.error('[carregarDadosCompletos] Erro na consulta:', error);
      return null;
    }

    // Organizar dados por semana do protocolo
    const dadosPorSemana = {};
    if (planejamentos && planejamentos.length > 0) {
      planejamentos.forEach((p) => {
        // IMPORTANTE: Usar semana_treino como chave ao invés de semana
        const semanaChave = p.semana_treino || p.semana;
        if (!dadosPorSemana[semanaChave]) {
          dadosPorSemana[semanaChave] = {};
        }
        // Converter dia_semana (1-7) para índice JS (0-6) usando WeeklyPlanService
        const diaJS = WeeklyPlanService.dbToDay(p.dia_semana);
        dadosPorSemana[semanaChave][diaJS] = {
          tipo: p.tipo_atividade,
          tipo_atividade: p.tipo_atividade,
          concluido: p.concluido,
          semana_referencia: p.semana_referencia,
          semana_calendario: p.semana,
          semana_protocolo: p.semana_treino,
          id: p.id,
        };
      });
    }

    // MUDANÇA: semanaAtiva já foi buscada acima, usar semanaProtocolo como fonte de verdade
    const dados = {
      planejamentos: dadosPorSemana,
      semanaAtual: semanaAtual, // semana civil para referência
      semanaAtiva: semanaProtocolo, // semana do protocolo como fonte de verdade
      semanaProtocolo: semanaProtocolo, // adicionando explicitamente
      anoAtual: anoAtual,
      usuario_id: currentUser.id,
    };

    // Salvar no cache
    dadosGlobaisCache = {
      dados: dados,
      timestamp: agora,
      usuario_id: currentUser.id,
      semanaAtual: semanaAtual, // semana civil
      semanaExibida: semanaProtocolo, // semana do protocolo como fonte de verdade
    };

    console.log('[carregarDadosCompletos] ✅ Dados carregados:', dados);
    return dados;
  } catch (error) {
    console.error('[carregarDadosCompletos] ❌ Erro crítico:', error);
    return null;
  }
}

// REMOVIDO - função complexa desnecessária
// Agora usamos apenas carregarIndicadoresSemana diretamente

// NAVEGAÇÃO INSTANTÂNEA USANDO CACHE
function navegarSemana(direcao) {
  try {
    console.log(`[navegarSemana] Navegando ${direcao > 0 ? 'próxima' : 'anterior'} semana`);

    if (!dadosGlobaisCache.dados) {
      console.warn('[navegarSemana] Cache não carregado, ignorando navegação');
      return;
    }

    const semanaAtual = dadosGlobaisCache.semanaExibida || dadosGlobaisCache.dados.semanaAtual;
    const novaSemana = semanaAtual + direcao;

    // Verificar limites de semana válidos (1-53)
    if (novaSemana < 1 || novaSemana > 53) {
      showNotification('Semana inválida', 'warning');
      return;
    }

    // Se não temos dados para esta semana, recarregar cache expandido
    if (!dadosGlobaisCache.dados.planejamentos[novaSemana]) {
      console.log(`[navegarSemana] Semana ${novaSemana} não está no cache, expandindo...`);
      carregarDadosCompletos(novaSemana).then(() => {
        renderizarIndicadoresDoCache(novaSemana);
        atualizarSeletorSemanas();
      });
      dadosGlobaisCache.semanaExibida = novaSemana;
      return;
    }

    console.log(`[navegarSemana] ⚡ NAVEGAÇÃO INSTANTÂNEA para semana ${novaSemana}`);

    // Atualizar semana exibida no cache
    dadosGlobaisCache.semanaExibida = novaSemana;

    // Renderizar indicadores instantaneamente do cache
    renderizarIndicadoresDoCache(novaSemana);

    // Atualizar seletor
    atualizarSeletorSemanas();

    console.log(`[navegarSemana] ✅ Navegação para semana ${novaSemana} concluída`);
  } catch (error) {
    console.error('[navegarSemana] ❌ ERRO:', error);
    showNotification('Erro ao navegar entre semanas', 'error');
  }
}

// RENDERIZAR INDICADORES DIRETAMENTE DO CACHE - INSTANTÂNEO
function renderizarIndicadoresDoCache(semana) {
  try {
    const container = document.getElementById('week-indicators');
    if (!container || !dadosGlobaisCache.dados) {
      console.warn('[renderizarIndicadoresDoCache] Container ou cache não disponível');
      return;
    }

    const weekPlan = dadosGlobaisCache.dados.planejamentos[semana] || {};
    const hoje = new Date();
    const diaAtual = hoje.getDay();

    console.log(`[renderizarIndicadoresDoCache] ⚡ Renderizando semana ${semana} do cache`);
    console.log(
      `[renderizarIndicadoresDoCache] 📅 Hoje é: ${hoje.toLocaleDateString('pt-BR')} - Dia da semana: ${diaAtual} (0=Dom, 1=Seg, 2=Ter...)`
    );

    // Verificar se há múltiplos dias sendo marcados como "hoje"
    let diasMarcadosComoHoje = 0;

    let html = '';
    for (let i = 0; i < 7; i++) {
      const diaPlan = weekPlan[i];
      // Marcar como "hoje" apenas se estamos visualizando a semana do protocolo atual
      // CORREÇÃO TEMPORÁRIA: Forçar apenas domingo (0) como hoje se detectarmos problema
      let isToday = i === diaAtual && semana === dadosGlobaisCache.dados.semanaProtocolo;

      // Se hoje é domingo (0) mas terça (2) também está sendo marcada, corrigir
      if (diaAtual === 0 && i === 2 && isToday) {
        console.warn(
          `[renderizarIndicadoresDoCache] ⚠️ Corrigindo: Terça estava sendo marcada como hoje, mas hoje é domingo`
        );
        isToday = false;
      }

      const isCompleted = diaPlan?.concluido || false;

      if (isToday) {
        diasMarcadosComoHoje++;
        console.log(
          `[renderizarIndicadoresDoCache] 🔍 Dia ${i} (${DIAS_SEMANA[i]}) marcado como HOJE`
        );
      }

      // Determinar tipo e classe do dia
      let dayType = 'Configure';
      let dayClass = 'day-indicator';
      let muscleIcon = '';
      let muscleGroup = '';

      if (diaPlan && diaPlan.tipo) {
        const tipoTreino = diaPlan.tipo;
        muscleGroup = tipoTreino;

        switch (tipoTreino.toLowerCase()) {
          case 'folga':
          case 'descanso':
            dayType = 'Folga';
            dayClass += ' rest-day';
            muscleIcon = getMuscleGroupSVG('folga');
            break;
          case 'cardio':
          case 'cardiovascular':
            dayType = 'Cardio';
            dayClass += ' cardio-day';
            muscleIcon = getMuscleGroupSVG('cardio');
            break;
          default:
            // Treino de força - usar SVG do grupo muscular
            dayType = diaPlan.tipo;
            dayClass += ' workout-day';
            muscleIcon = getMuscleGroupSVG(diaPlan.tipo);
            break;
        }
      }

      // Classes adicionais baseadas no estado
      if (!diaPlan || dayType === 'Configure') {
        // Sem treino planejado - CINZA
        dayClass += ' no-plan';
      } else if (isCompleted) {
        // Treino executado - VERDE NEON
        dayClass += ' completed';
      } else {
        // Treino programado - AMARELO NEON
        dayClass += ' planned';
      }

      // Dia atual sempre tem destaque especial
      // CORREÇÃO: Garantir que apenas o dia correto tenha a classe today
      if (isToday && i === diaAtual) {
        dayClass += ' today';
      } else if (dayClass.includes('today')) {
        // Remover classe today se foi adicionada incorretamente
        dayClass = dayClass.replace(' today', '');
      }

      html += `
                <div class="${dayClass}" data-day="${i}" onclick="handleDayClick(${i}, ${isCompleted})">
                    <div class="day-name">${DIAS_SEMANA[i]}</div>
                    <div class="day-content">
                        <div class="muscle-icon-wrapper">
                            ${muscleIcon}
                        </div>
                        <div class="day-type">${dayType}</div>
                    </div>
                </div>
            `;
    }

    // Renderizar conteúdo dos dias
    container.innerHTML = html;

    // Adicionar estrutura do carrossel para mobile
    if (window.innerWidth <= 768) {
      // Verificar se já existe wrapper
      if (!container.parentElement.classList.contains('week-carousel-container')) {
        // Criar wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'week-carousel-container';

        // Mover o container para dentro do wrapper
        container.parentNode.insertBefore(wrapper, container);
        wrapper.appendChild(container);

        // Adicionar botões de navegação
        const prevButton = document.createElement('button');
        prevButton.className = 'carousel-nav prev';
        prevButton.setAttribute('onclick', 'navigateCarousel("prev")');
        prevButton.setAttribute('aria-label', 'Dia anterior');
        prevButton.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                `;
        wrapper.appendChild(prevButton);

        const nextButton = document.createElement('button');
        nextButton.className = 'carousel-nav next';
        nextButton.setAttribute('onclick', 'navigateCarousel("next")');
        nextButton.setAttribute('aria-label', 'Próximo dia');
        nextButton.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                `;
        wrapper.appendChild(nextButton);

        // Adicionar dots
        const dotsContainer = document.createElement('div');
        dotsContainer.className = 'carousel-dots';
        dotsContainer.id = 'carousel-dots';

        for (let i = 0; i < 7; i++) {
          const dot = document.createElement('button');
          dot.className = i === 0 ? 'carousel-dot active' : 'carousel-dot';
          dot.setAttribute('onclick', `goToDay(${i})`);
          dot.setAttribute('aria-label', `Ir para ${DIAS_SEMANA[i]}`);
          dotsContainer.appendChild(dot);
        }
        wrapper.appendChild(dotsContainer);
      }

      // Inicializar observador de scroll
      setTimeout(() => {
        initializeCarouselObserver();
      }, 50);
    }

    console.log(`[renderizarIndicadoresDoCache] ✅ Semana ${semana} renderizada instantaneamente`);

    if (diasMarcadosComoHoje > 1) {
      console.error(
        `[renderizarIndicadoresDoCache] ⚠️ PROBLEMA: ${diasMarcadosComoHoje} dias marcados como HOJE!`
      );
    }

    // Auto-scroll para o dia atual no mobile
    if (window.innerWidth <= 768 && semana === dadosGlobaisCache.dados.semanaProtocolo) {
      setTimeout(() => {
        centralizarDiaNoCarrossel(diaAtual);
        updateCarouselDots(diaAtual);
      }, 100);
    }
  } catch (error) {
    console.error('[renderizarIndicadoresDoCache] ❌ Erro:', error);
  }
}

// Função auxiliar para obter SVG do grupo muscular
function getMuscleGroupSVG(grupo) {
  const muscleGroups = {
    Peito: {
      svg: '/assets/muscle-groups/peito/chest-full.svg',
    },
    Costas: {
      svg: '/assets/muscle-groups/costas/lats.svg',
    },
    Pernas: {
      svg: '/assets/muscle-groups/pernas/quads.svg',
    },
    Ombro: {
      svg: '/assets/muscle-groups/costas/traps.svg',
    },
    Braço: {
      svg: '/assets/muscle-groups/braco/biceps.svg',
    },
    'Ombro e Braço': {
      svg: '/assets/muscle-groups/braco/biceps.svg',
    },
    Cardio: {
      svg: '/SVG_MUSCLE/cardio.svg',
    },
    cardio: {
      svg: '/SVG_MUSCLE/cardio.svg',
    },
    folga: {
      svg: '/SVG_MUSCLE/folga.svg',
    },
    descanso: {
      svg: '/SVG_MUSCLE/folga.svg',
    },
  };

  const config = muscleGroups[grupo];
  if (!config) {
    return `<span class="default-icon">${getWorkoutIcon(TREINO_ICONS[grupo] || 'peito', 'small')}</span>`;
  }

  return `<img 
        src="${config.svg}" 
        alt="${grupo}" 
        class="muscle-svg-icon"
        onerror="this.style.display='none';"
    />`;
}

// Atualizar interface do seletor de semanas
function atualizarSeletorSemanas() {
  try {
    if (!dadosGlobaisCache.dados) return;

    // Usar semana do protocolo, não semana do calendário
    const semanaExibida =
      dadosGlobaisCache.semanaExibida ||
      dadosGlobaisCache.dados.semanaProtocolo ||
      dadosGlobaisCache.dados.semanaAtiva;
    const weekNumber = document.getElementById('week-number');
    const weekStatus = document.getElementById('week-status');

    if (weekNumber) {
      weekNumber.textContent = `Semana ${semanaExibida}`;
    }

    if (weekStatus) {
      let statusText = 'Ativa';
      let statusClass = 'atual';
      let statusIcon = getWorkoutIcon('achievements.star');

      // Semana do protocolo é sempre a semana atual para o usuário
      if (semanaExibida !== dadosGlobaisCache.dados.semanaProtocolo) {
        statusText = 'Inativa';
        statusClass = 'inativa';
        statusIcon = getWorkoutIcon('navigation.calendar');
      }

      weekStatus.innerHTML = `${statusIcon} ${statusText}`;
      weekStatus.className = `week-status ${statusClass}`;
    }

    // Controlar botões de navegação baseado no cache
    const weekPrev = document.getElementById('week-prev');
    const weekNext = document.getElementById('week-next');
    const weekToday = document.getElementById('week-today');

    if (weekPrev) {
      const temSemanaAnterior = dadosGlobaisCache.dados.planejamentos[semanaExibida - 1];
      weekPrev.disabled = !temSemanaAnterior;
      weekPrev.innerHTML = `${getWorkoutIcon('navigation.back')}`;
      weekPrev.title = temSemanaAnterior ? 'Semana anterior' : 'Não há semana anterior';
    }

    if (weekNext) {
      const temProximaSemana = dadosGlobaisCache.dados.planejamentos[semanaExibida + 1];
      weekNext.disabled = !temProximaSemana;
      weekNext.innerHTML = `${getWorkoutIcon('navigation.forward')}`;
      weekNext.title = temProximaSemana ? 'Próxima semana' : 'Não há próxima semana';
    }

    // Botão "Hoje" - mostrar apenas se não estiver na semana atual do protocolo
    if (weekToday) {
      const isCurrentWeek = semanaExibida === dadosGlobaisCache.dados.semanaProtocolo;
      weekToday.style.display = isCurrentWeek ? 'none' : 'inline-block';
      weekToday.innerHTML = `${getWorkoutIcon('navigation.home')}`;
      weekToday.title = 'Voltar para semana atual';
      weekToday.className = 'week-today-btn';
    }
  } catch (error) {
    console.error('[atualizarSeletorSemanas] Erro:', error);
  }
}

// Configurar navegação entre semanas
function configurarNavegacaoSemanas() {
  try {
    console.log('[configurarNavegacaoSemanas] Configurando botões de navegação...');

    // Botão Hoje
    const weekToday = document.getElementById('week-today');
    if (weekToday) {
      weekToday.onclick = voltarParaSemanaAtual;
      console.log('[configurarNavegacaoSemanas] ✅ Botão "Hoje" configurado');
    }

    // Botão Anterior
    const weekPrev = document.getElementById('week-prev');
    if (weekPrev) {
      weekPrev.onclick = () => navegarSemana(-1);
      console.log('[configurarNavegacaoSemanas] ✅ Botão "Anterior" configurado');
    }

    // Botão Próximo
    const weekNext = document.getElementById('week-next');
    if (weekNext) {
      weekNext.onclick = () => navegarSemana(1);
      console.log('[configurarNavegacaoSemanas] ✅ Botão "Próximo" configurado');
    }
  } catch (error) {
    console.error('[configurarNavegacaoSemanas] Erro:', error);
  }
}

// Carregar dados dinâmicos da home usando homeService
async function carregarDadosDinamicosHome(ano = null, semana = null) {
  try {
    const currentUser = AppState.get('currentUser');
    if (!currentUser || !currentUser.id) return;

    console.log('[carregarDadosDinamicosHome] Carregando dados dinâmicos...');

    // Usar o homeService para carregar e atualizar dados
    // TODO: Atualizar homeService para aceitar ano/semana específicos
    const dados = await homeService.carregarDadosHome(currentUser.id);
    homeService.atualizarUIHome(dados);

    console.log('[carregarDadosDinamicosHome] ✅ Dados dinâmicos carregados');
  } catch (error) {
    console.error('[carregarDadosDinamicosHome] Erro:', error);
    // Não propagar erro para não quebrar o dashboard
  }
}

// Função para limpar todos os caches do dashboard
function limparCachesDashboard() {
  console.log('[limparCachesDashboard] Limpando cache global...');

  // Limpar cache global
  dadosGlobaisCache = {
    dados: null,
    timestamp: 0,
    usuario_id: null,
    semanaAtual: null,
    semanaExibida: null,
  };

  // Limpar cache do WeeklyPlanService se disponível
  if (WeeklyPlanService.clearCache) {
    WeeklyPlanService.clearCache();
  }

  console.log('[limparCachesDashboard] ✅ Cache global limpo');
}

// Voltar para a semana atual
function voltarParaSemanaAtual() {
  try {
    if (!dadosGlobaisCache.dados) {
      console.warn('[voltarParaSemanaAtual] Cache não disponível');
      return;
    }

    // Usar semana do protocolo como padrão
    const semanaAtual =
      dadosGlobaisCache.dados.semanaProtocolo ||
      dadosGlobaisCache.dados.semanaAtiva ||
      dadosGlobaisCache.dados.semanaAtual;
    console.log(
      `[voltarParaSemanaAtual] ⚡ Voltando para semana atual do protocolo: ${semanaAtual}`
    );

    // Atualizar semana exibida
    dadosGlobaisCache.semanaExibida = semanaAtual;

    // Renderizar indicadores do cache
    renderizarIndicadoresDoCache(semanaAtual);

    // Atualizar seletor
    atualizarSeletorSemanas();

    console.log(`[voltarParaSemanaAtual] ✅ Voltou para semana atual: ${semanaAtual}`);
  } catch (error) {
    console.error('[voltarParaSemanaAtual] ❌ Erro:', error);
  }
}

// Exportar função para debug
export {
  navegarSemana,
  limparCachesDashboard,
  voltarParaSemanaAtual,
  renderizarIndicadoresDoCache,
  carregarDadosCompletos,
  carregarDashboard as recarregarDashboard,
};

// Disponibilizar funções globalmente para debug
window.navegarSemana = navegarSemana;
window.voltarParaSemanaAtual = voltarParaSemanaAtual;
window.limparCachesDashboard = limparCachesDashboard;
window.carregarDadosCompletos = carregarDadosCompletos;
window.atualizarMetricasTempoReal = atualizarMetricasTempoReal;
window.recarregarDashboardLegacy = recarregarDashboardLegacy;
window.atualizarSeletorSemanas = atualizarSeletorSemanas;

// Função para iniciar treino (fallback)
window.iniciarTreinoSimples = async function () {
  console.log('[iniciarTreinoSimples] ⚠️ ATENÇÃO: Versão SIMPLIFICADA sendo chamada!');
  console.log('[iniciarTreinoSimples] Isso indica que workout.js não foi carregado corretamente');

  const currentUser = AppState.get('currentUser');
  if (!currentUser) {
    showNotification('Faça login primeiro', 'error');
    return;
  }

  // Verificar se há treino para hoje
  const hoje = new Date().getDay();
  const semanaAtual = dadosGlobaisCache?.dados?.semanaProtocolo || 1;
  const treinoHoje = dadosGlobaisCache?.dados?.planejamentos?.[semanaAtual]?.[hoje];

  if (!treinoHoje) {
    showNotification('Nenhum treino planejado para hoje', 'info');
    return;
  }

  if (treinoHoje.tipo === 'folga') {
    showNotification('Hoje é dia de descanso!', 'info');
    return;
  }

  if (treinoHoje.tipo === 'cardio') {
    showNotification('Treino de cardio - Em desenvolvimento', 'info');
    return;
  }

  showNotification(`Iniciando treino de ${treinoHoje.tipo}`, 'success');

  // Tentar navegar para tela de treino
  if (window.mostrarTela) {
    window.mostrarTela('workout-screen');
  } else {
    console.error('Função mostrarTela não encontrada');
  }
};

// Se não existe iniciarTreino, usar nossa versão simples
// IMPORTANTE: Não sobrescrever se já existe uma versão completa (ex: do workout.js)
if (!window.iniciarTreino) {
  console.log('[dashboard.js] Registrando iniciarTreinoSimples como fallback');
  window.iniciarTreino = window.iniciarTreinoSimples;
} else {
  console.log('[dashboard.js] window.iniciarTreino já existe, mantendo versão atual');
}

// Função para inicializar a página home - CORRIGIDA para usar HomeService
window.initializeHomePage = async function () {
  console.log('[initializeHomePage] Inicializando página home (versão corrigida)...');

  try {
    const currentUser = AppState.get('currentUser');
    if (!currentUser) {
      console.error('[initializeHomePage] Usuário não encontrado');
      return false;
    }

    // Usar HomeService que já funciona corretamente
    const { inicializarHome } = await import('../services/homeService.js');
    await inicializarHome();

    console.log('[initializeHomePage] ✅ Página home inicializada com sucesso via HomeService!');
    return true;
  } catch (error) {
    console.error('[initializeHomePage] ❌ Erro ao inicializar:', error);

    // Fallback: tentar carregamento básico
    try {
      console.log('[initializeHomePage] Tentando fallback básico...');
      const currentUser = AppState.get('currentUser');

      // Atualizar pelo menos o nome do usuário
      const userNameEl = document.getElementById('user-name');
      if (userNameEl && currentUser) {
        userNameEl.textContent = currentUser.nome || 'Usuário';
      }

      // Remover loading se houver
      const loadingElements = document.querySelectorAll('.loading, [data-loading="true"]');
      loadingElements.forEach((el) => {
        el.style.display = 'none';
        el.removeAttribute('data-loading');
      });

      console.log('[initializeHomePage] Fallback aplicado');
      return true;
    } catch (fallbackError) {
      console.error('[initializeHomePage] ❌ Erro no fallback:', fallbackError);
      return false;
    }
  }
};

// Função de teste completo do sistema
window.testeCompletoSistema = async function () {
  console.log('🧪 [testeCompletoSistema] TESTE COMPLETO DO DASHBOARD OTIMIZADO');

  const resultados = {
    sintaxe: true,
    funcoes: {},
    navegacao: {},
    cache: {},
  };

  try {
    // 1. Testar se as funções principais existem
    console.log('1️⃣ Testando existência das funções...');

    const funcoesEssenciais = [
      'carregarDadosCompletos',
      'navegarSemana',
      'voltarParaSemanaAtual',
      'renderizarIndicadoresDoCache',
      'limparCachesDashboard',
    ];

    funcoesEssenciais.forEach((funcao) => {
      resultados.funcoes[funcao] = typeof window[funcao] === 'function';
      console.log(`   ${resultados.funcoes[funcao] ? '✅' : '❌'} ${funcao}`);
    });

    // 2. Testar cache
    console.log('2️⃣ Testando sistema de cache...');
    resultados.cache.temCache = !!dadosGlobaisCache.dados;
    resultados.cache.usuario = dadosGlobaisCache.usuario_id;
    resultados.cache.timestamp = dadosGlobaisCache.timestamp;

    console.log(`   Cache carregado: ${resultados.cache.temCache ? '✅' : '❌'}`);
    if (resultados.cache.temCache) {
      console.log(`   Usuário: ${resultados.cache.usuario}`);
      console.log(`   Timestamp: ${new Date(resultados.cache.timestamp).toLocaleString()}`);
    }

    // 3. Testar navegação se cache disponível
    if (resultados.cache.temCache) {
      console.log('3️⃣ Testando navegação...');

      const semanaOriginal = dadosGlobaisCache.semanaExibida;
      console.log(`   Semana original: ${semanaOriginal}`);

      // Tentar navegar para próxima semana
      try {
        navegarSemana(1);
        resultados.navegacao.proxima = dadosGlobaisCache.semanaExibida === semanaOriginal + 1;
        console.log(`   Navegação próxima: ${resultados.navegacao.proxima ? '✅' : '❌'}`);

        // Voltar para original
        navegarSemana(-1);
        resultados.navegacao.voltar = dadosGlobaisCache.semanaExibida === semanaOriginal;
        console.log(`   Voltar: ${resultados.navegacao.voltar ? '✅' : '❌'}`);
      } catch (error) {
        console.log(`   ❌ Erro na navegação: ${error.message}`);
        resultados.navegacao.erro = error.message;
      }
    }

    // 4. Resumo final
    console.log('📊 RESUMO DO TESTE:');
    const todasFuncoesOk = Object.values(resultados.funcoes).every(Boolean);
    const navegacaoOk = resultados.navegacao.proxima && resultados.navegacao.voltar;

    console.log(`   Funções: ${todasFuncoesOk ? '✅' : '❌'}`);
    console.log(`   Cache: ${resultados.cache.temCache ? '✅' : '❌'}`);
    console.log(`   Navegação: ${navegacaoOk ? '✅' : '❌'}`);

    const sistemaOk = todasFuncoesOk && resultados.cache.temCache && navegacaoOk;

    if (sistemaOk) {
      console.log('🎉 SISTEMA COMPLETAMENTE FUNCIONAL!');
      showNotification('🎉 Dashboard otimizado 100% funcional!', 'success');
    } else {
      console.log('⚠️ Sistema com problemas');
      showNotification('⚠️ Sistema com problemas', 'warning');
    }

    return resultados;
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    showNotification('❌ Erro no teste: ' + error.message, 'error');
    return { ...resultados, erro: error.message };
  }
};

// Função de teste para verificar o sistema
window.testarDashboardOtimizado = function () {
  console.log('🧪 [testarDashboardOtimizado] TESTANDO SISTEMA OTIMIZADO');

  const resultado = {
    cache: !!dadosGlobaisCache.dados,
    timestamp: dadosGlobaisCache.timestamp,
    usuario: dadosGlobaisCache.usuario_id,
    semanaAtual: dadosGlobaisCache.dados?.semanaAtual,
    semanaExibida: dadosGlobaisCache.semanaExibida,
    totalSemanas: Object.keys(dadosGlobaisCache.dados?.planejamentos || {}).length,
    navegacaoRapida: true,
    sintaxeOk: true, // Se chegou até aqui, a sintaxe está OK
  };

  console.log('📊 Status do Cache Global:', resultado);

  if (resultado.cache) {
    console.log('✅ Sistema funcionando com CACHE GLOBAL!');
    console.log('⚡ Navegação INSTANTÂNEA habilitada!');
    showNotification('✅ Dashboard otimizado funcionando!', 'success');
  } else {
    console.log('❌ Cache não carregado - Execute carregarDadosCompletos() primeiro');
    showNotification('⚠️ Cache não carregado', 'warning');
  }

  return resultado;
};

// Função para recarregar dados
window.recarregarDadosDashboard = async function () {
  console.log('🔄 [recarregarDadosDashboard] Recarregando dados...');

  try {
    // Limpar cache
    limparCachesDashboard();

    // Recarregar dados
    const dados = await carregarDadosCompletos();

    if (dados) {
      console.log('✅ Dados recarregados com sucesso!');
      showNotification('✅ Dados recarregados!', 'success');

      // Renderizar interface
      const semanaExibir = dados.semanaAtiva || dados.semanaAtual;
      renderizarIndicadoresDoCache(semanaExibir);
      atualizarSeletorSemanas();

      return dados;
    } else {
      console.log('❌ Falha ao recarregar dados');
      showNotification('❌ Falha ao recarregar', 'error');
      return null;
    }
  } catch (error) {
    console.error('[recarregarDadosDashboard] Erro:', error);
    showNotification('❌ Erro: ' + error.message, 'error');
    return null;
  }
};

export async function carregarDashboard() {
  console.log('[carregarDashboard] 🚀 INICIANDO carregamento com cache global...');

  // MUDANÇA: Limpar cache para usar nova lógica de semana do protocolo
  limparCacheGlobal();

  try {
    const currentUser = AppState.get('currentUser');
    if (!currentUser || !currentUser.id) {
      console.error('[carregarDashboard] ❌ Usuário não está definido ou sem ID');
      showNotification('Usuário não está logado. Faça login novamente.', 'error');
      return;
    }

    console.log(
      '[carregarDashboard] ✅ Carregando para usuário:',
      currentUser.nome,
      `(ID: ${currentUser.id})`
    );

    // 1. CARREGAR TODOS OS DADOS DE UMA VEZ
    const dados = await carregarDadosCompletos();
    if (!dados) {
      console.error('[carregarDashboard] ❌ Falha ao carregar dados');
      showNotification('Erro ao carregar dados do planejamento', 'error');
      return;
    }

    // 2. RENDERIZAR INTERFACE DO CACHE
    const semanaExibir = dados.semanaAtiva || dados.semanaAtual;
    dadosGlobaisCache.semanaExibida = semanaExibir;

    // Renderizar indicadores instantaneamente do cache
    renderizarIndicadoresDoCache(semanaExibir);

    // Atualizar seletor
    atualizarSeletorSemanas();

    // 3. CARREGAR TREINO ATUAL
    await carregarTreinoAtualDoCache();

    // 4. CARREGAR EXERCÍCIOS IMEDIATAMENTE (CRÍTICO!)
    await carregarExerciciosDoDia();

    // 5. CONFIGURAR FUNCIONALIDADES
    configurarBotaoIniciar();
    configurarEventListeners();
    configurarNavegacaoSemanas();

    // 6. CARREGAR DADOS ADICIONAIS (PODE SER ASYNC)
    setTimeout(async () => {
      try {
        console.log('[carregarDashboard] 🎮 Carregando dados adicionais...');

        // DESABILITADO: workoutController estava sobrescrevendo os dados já carregados
        // const { atualizarTodoTreinoUI } = await import('../controllers/workoutController.js');
        // await atualizarTodoTreinoUI(currentUser.id);

        // Carregar outros dados se necessário
        await Promise.all([carregarEstatisticasAvancadas(), carregarDadosDinamicosHome()]);

        console.log('[carregarDashboard] ✅ Dados adicionais carregados com sucesso');
      } catch (error) {
        console.warn('[carregarDashboard] Erro em carregamentos secundários:', error);

        // Fallback para sistema antigo se houver erro
        console.log('[carregarDashboard] 🔄 Usando fallback...');
        await Promise.all([
          carregarMetricasUsuario(),
          // carregarExerciciosDoDia() já foi chamado antes
          // carregarTreinoAtualDoCache() já foi chamado antes
        ]);
      }
    }, 100);

    console.log('[carregarDashboard] ✅ Dashboard carregado com CACHE GLOBAL!');
  } catch (error) {
    console.error('[carregarDashboard] ❌ ERRO CRÍTICO:', error);
    showNotification('Erro crítico ao carregar dashboard: ' + error.message, 'error');
  }
}

// CARREGAR TREINO ATUAL DO CACHE GLOBAL
async function carregarTreinoAtualDoCache() {
  try {
    if (!dadosGlobaisCache.dados) {
      console.warn('[carregarTreinoAtualDoCache] Cache não disponível');
      return;
    }

    const hoje = new Date();
    const diaAtual = hoje.getDay();
    const semanaProtocolo = dadosGlobaisCache.dados.semanaAtiva; // agora é sempre a semana do protocolo
    console.log(
      '[carregarTreinoAtualDoCache] 🔄 NOVA LÓGICA: Usando semana do protocolo:',
      semanaProtocolo
    );

    // Buscar treino de hoje no cache usando semana do protocolo
    const planejamentoSemana = dadosGlobaisCache.dados.planejamentos[semanaProtocolo];
    const treinoHoje = planejamentoSemana?.[diaAtual];

    console.log('[carregarTreinoAtualDoCache] 🔍 DEBUG COMPLETO:');
    console.log('  - Dia atual (JS):', diaAtual, '(0=Dom, 1=Seg...)');
    console.log('  - Semana protocolo:', semanaProtocolo);
    console.log(
      '  - Planejamentos disponíveis:',
      Object.keys(dadosGlobaisCache.dados.planejamentos)
    );
    console.log('  - Planejamento da semana:', planejamentoSemana);
    console.log('  - Treino de hoje:', treinoHoje);

    // Debug extra: mostrar todos os treinos da semana
    if (planejamentoSemana) {
      console.log('  - Treinos da semana completa:');
      Object.keys(planejamentoSemana).forEach((dia) => {
        console.log(`    Dia ${dia}: ${planejamentoSemana[dia]?.tipo_atividade || 'vazio'}`);
      });
    }

    if (!treinoHoje) {
      console.warn('[carregarTreinoAtualDoCache] Nenhum treino encontrado para hoje');
      atualizarUITreinoAtual(null);
      AppState.set('currentWorkout', null);
      AppState.set('currentExercises', []); // Limpar exercícios quando não há treino

      // MUDANÇA: Garantir que o card expandível sempre existe, mesmo sem treino
      garantirCardExpandivelExiste();
      return;
    }

    // Formatar treino
    const treinoFormatado = {
      tipo: treinoHoje.tipo_atividade || treinoHoje.tipo,
      nome: formatarNomeTreino(treinoHoje),
      grupo_muscular: treinoHoje.tipo_atividade || treinoHoje.tipo,
      concluido: treinoHoje.concluido,
      id: treinoHoje.protocolo_treinamento_id || treinoHoje.id, // Adicionar ID do protocolo para o workout
      protocolo_treinamento_id: treinoHoje.protocolo_treinamento_id,
    };

    // Atualizar UI e AppState
    atualizarUITreinoAtual(treinoFormatado);
    AppState.set('currentWorkout', treinoFormatado);

    // MUDANÇA: Garantir que o card expandível sempre existe, mesmo com treino
    garantirCardExpandivelExiste();

    console.log(
      '[carregarTreinoAtualDoCache] ✅ Treino atual carregado do cache:',
      treinoFormatado.nome
    );
  } catch (error) {
    console.error('[carregarTreinoAtualDoCache] ❌ Erro:', error);
    atualizarUITreinoAtual(null);
    AppState.set('currentWorkout', null);
    AppState.set('currentExercises', []); // Limpar exercícios em caso de erro
  }
}

// VERSÃO SIMPLIFICADA - USA APENAS O CACHE GLOBAL
// Esta função agora só existe para compatibilidade, mas usa o cache global
async function carregarIndicadoresSemana(ano = null, semana = null) {
  console.log('[carregarIndicadoresSemana] ⚡ USANDO CACHE GLOBAL');

  if (!dadosGlobaisCache.dados) {
    console.warn('[carregarIndicadoresSemana] Cache não disponível, carregando dados...');
    await carregarDadosCompletos();
  }

  const semanaParaExibir =
    semana || dadosGlobaisCache.semanaExibida || dadosGlobaisCache.dados?.semanaAtual;
  if (semanaParaExibir) {
    renderizarIndicadoresDoCache(semanaParaExibir);
  } else {
    console.warn('[carregarIndicadoresSemana] Não foi possível determinar semana para exibir');
  }
}

// VERSÃO SIMPLIFICADA - USA APENAS O CACHE GLOBAL
async function carregarTreinoAtual() {
  console.log('[carregarTreinoAtual] ⚡ USANDO CACHE GLOBAL');

  if (!dadosGlobaisCache.dados) {
    console.warn('[carregarTreinoAtual] Cache não disponível');
    return;
  }

  await carregarTreinoAtualDoCache();
}

// Atualizar UI do treino atual
function atualizarUITreinoAtual(treino) {
  const workoutTypeEl = document.getElementById('workout-type');
  const workoutNameEl = document.getElementById('workout-name');
  const workoutExercisesEl = document.getElementById('workout-exercises');
  const btnTextEl = document.getElementById('btn-text');
  const progressTextEl = document.getElementById('workout-progress-text');
  const progressCircleEl = document.getElementById('workout-progress-circle');

  if (!treino) {
    // Sem treino configurado
    updateElement(workoutTypeEl, 'Configure');
    updateElement(workoutNameEl, 'Nenhum treino configurado');
    updateElement(workoutExercisesEl, 'Configure seu planejamento');
    updateElement(btnTextEl, 'Configurar Planejamento');
    updateElement(progressTextEl, '0%');

    if (progressCircleEl) {
      progressCircleEl.style.strokeDashoffset = '251.2';
    }
    return;
  }

  // Configurar baseado no tipo de treino
  switch (treino.tipo) {
    case 'folga':
      updateElement(workoutTypeEl, 'Descanso');
      updateElement(workoutNameEl, 'Dia de Folga');
      updateElement(workoutExercisesEl, 'Repouso e recuperação');
      updateElement(btnTextEl, 'Dia de Descanso');
      updateElement(progressTextEl, '😴');
      break;

    case 'cardio':
    case 'Cardio':
      updateElement(workoutTypeEl, 'Cardio');
      updateElement(workoutNameEl, 'Treino Cardiovascular');
      updateElement(workoutExercisesEl, 'Exercícios aeróbicos • 30-45min');
      updateElement(btnTextEl, 'Iniciar Cardio');
      updateElement(progressTextEl, getWorkoutIcon('cardio', 'small'));
      break;

    default: {
      // Treino de força
      const grupoMuscular = treino.tipo;
      const icon = getWorkoutIcon(TREINO_ICONS[grupoMuscular] || 'peito', 'small');
      updateElement(workoutTypeEl, `Treino ${grupoMuscular}`);
      updateElement(workoutNameEl, `Treino ${grupoMuscular}`);
      updateElement(workoutExercisesEl, `Força • ${grupoMuscular} • ~45min`);
      updateElement(btnTextEl, 'Iniciar Treino');
      updateElement(progressTextEl, icon);
      break;
    }
  }

  // Simular progresso baseado no dia da semana
  const hoje = new Date().getDay();
  const progressoSemanal = Math.min((hoje / 7) * 100, 100);

  if (progressCircleEl && treino.tipo !== 'folga') {
    const offset = 251.2 - (progressoSemanal / 100) * 251.2;
    progressCircleEl.style.strokeDashoffset = offset.toString();

    if (treino.tipo === 'cardio' || treino.tipo === 'Cardio') {
      updateElement(progressTextEl, `${Math.round(progressoSemanal)}%`);
    }
  }
}

// Carregar métricas do usuário
async function carregarMetricasUsuario() {
  try {
    const currentUser = AppState.get('currentUser');

    if (!currentUser || !currentUser.id) {
      console.error('[carregarMetricasUsuario] ❌ currentUser é null ou sem ID');
      console.log('[carregarMetricasUsuario] currentUser atual:', currentUser);
      throw new Error('Usuário não está definido para carregar métricas');
    }

    // Tentar buscar métricas reais do banco
    let metricas = null;
    try {
      // Primeiro tentar do WorkoutProtocolService
      const { WorkoutProtocolService } = await import('../services/workoutProtocolService.js');
      const estatisticas = await WorkoutProtocolService.obterEstatisticasUsuario(currentUser.id);

      if (estatisticas) {
        metricas = {
          treinosConcluidos: estatisticas.total_treinos_realizados || 0,
          semanaAtual: estatisticas.semana_atual || 1,
          progresso: estatisticas.percentual_progresso || 0,
        };
        console.log('[carregarMetricasUsuario] ✅ Métricas carregadas do Supabase:', metricas);
      }
    } catch (error) {
      console.warn('[carregarMetricasUsuario] Erro ao buscar do WorkoutProtocolService:', error);

      // Fallback para userService
      try {
        metricas = await fetchMetricasUsuario(currentUser.id);
        console.log('[carregarMetricasUsuario] ✅ Métricas carregadas do userService:', metricas);
      } catch (fallbackError) {
        console.warn('[carregarMetricasUsuario] Erro no fallback userService:', fallbackError);
      }
    }

    // Se não conseguiu carregar, é um erro real
    if (!metricas) {
      console.error(
        '[carregarMetricasUsuario] ❌ FALHA: Não foi possível carregar métricas do Supabase'
      );
      throw new Error('Não foi possível carregar métricas do usuário do banco de dados');
    }

    // Atualizar elementos da UI
    updateElement('completed-workouts', metricas.treinosConcluidos || 0);
    updateElement('current-week', metricas.semanaAtual || 1);
    updateElement('progress-percentage', `${Math.round(metricas.progresso || 0)}%`);

    // Atualizar barra de progresso do usuário
    const userProgressBar = document.getElementById('user-progress-bar');
    if (userProgressBar) {
      const progressWidth = Math.min((metricas.treinosConcluidos / 4) * 100, 100);
      userProgressBar.style.width = `${progressWidth}%`;
    }

    updateElement('user-workouts', metricas.treinosConcluidos || 0);

    // Salvar métricas no estado
    AppState.set('userMetrics', metricas);

    console.log('[carregarMetricasUsuario] ✅ Métricas carregadas:', metricas);
  } catch (error) {
    console.error('[carregarMetricasUsuario] ❌ ERRO CRÍTICO:', error);
    showNotification('Erro ao carregar métricas do usuário: ' + error.message, 'error');
    throw error; // Propagar o erro
  }
}

// Carregar e renderizar planejamento semanal
async function carregarPlanejamentoSemanal() {
  try {
    const currentUser = AppState.get('currentUser');

    if (!currentUser || !currentUser.id) {
      console.error('[carregarPlanejamentoSemanal] ❌ currentUser é null ou sem ID');
      console.log('[carregarPlanejamentoSemanal] currentUser atual:', currentUser);
      throw new Error('Usuário não está definido para carregar planejamento semanal');
    }

    const container = document.getElementById('weekly-plan-list');
    if (!container) {
      // Container não existe na nova estrutura da home - usar indicadores da semana em vez disso
      console.log(
        '[carregarPlanejamentoSemanal] Container weekly-plan-list não encontrado - usando indicadores da semana'
      );
      return;
    }

    // Usar serviço unificado para buscar planejamento
    const weekPlan = await WeeklyPlanService.getPlan(currentUser.id);
    const hoje = new Date();
    const diaAtual = hoje.getDay();

    console.log('[carregarPlanejamentoSemanal] Plano semanal:', weekPlan);

    if (!weekPlan) {
      container.innerHTML = `
                <div class="plan-item">
                    <div class="plan-day">Planejamento</div>
                    <div class="plan-activity">Não configurado</div>
                    <div class="plan-status pending">Configure</div>
                </div>
            `;
      return;
    }

    let html = '';

    for (let i = 0; i < 7; i++) {
      const diaPlan = weekPlan[i];
      const isToday = i === diaAtual;
      const isCompleted = diaPlan?.concluido || false;

      let atividade = 'Sem Plano';
      let statusClass = 'pending';
      let statusText = 'Pendente';

      if (diaPlan) {
        if (diaPlan.categoria === 'folga') {
          atividade = 'Folga';
        } else if (diaPlan.categoria === 'cardio') {
          atividade = 'Treino Cardiovascular';
        } else if (diaPlan.categoria === 'treino') {
          atividade = `Treino ${diaPlan.tipo}`;
        } else {
          atividade = 'Treino';
        }
      }

      if (isCompleted) {
        statusClass = 'completed';
        statusText = 'Concluído';
      } else if (isToday) {
        statusClass = 'today';
        statusText = 'Hoje';
      } else if (diaPlan) {
        statusClass = 'pending';
        statusText = 'Planejado';
      }

      html += `
                <div class="plan-item">
                    <div class="plan-day">${DIAS_SEMANA[i]}</div>
                    <div class="plan-activity">${atividade}</div>
                    <div class="plan-status ${statusClass}">${statusText}</div>
                </div>
            `;
    }

    container.innerHTML = html;
    console.log('[carregarPlanejamentoSemanal] ✅ Planejamento semanal carregado do Supabase');
  } catch (error) {
    console.error('[carregarPlanejamentoSemanal] ❌ ERRO CRÍTICO:', error);

    const container = document.getElementById('weekly-plan-list');
    if (container) {
      container.innerHTML = `
                <div class="plan-item">
                    <div class="plan-day">Erro</div>
                    <div class="plan-activity">${error.message}</div>
                    <div class="plan-status pending">❌</div>
                </div>
            `;
    }

    showNotification('Erro ao carregar planejamento semanal: ' + error.message, 'error');
    // Não propagar erro para não quebrar o dashboard todo
  }
}

// Carregar exercícios do dia com informações detalhadas
async function carregarExerciciosDoDia() {
  let container;
  try {
    const currentUser = AppState.get('currentUser');

    if (!currentUser || !currentUser.id) {
      console.error('[carregarExerciciosDoDia] ❌ currentUser é null ou sem ID');
      return;
    }

    container = document.getElementById('workout-exercises-list');
    if (!container) {
      console.warn('[carregarExerciciosDoDia] Container workout-exercises-list não encontrado');
      return;
    }

    // Usar nossa nova implementação para buscar exercícios
    const resultado = await buscarExerciciosTreinoDia(currentUser.id);

    console.log('[carregarExerciciosDoDia] 📊 Resultado da busca:', resultado);

    if (resultado.error) {
      console.log('[carregarExerciciosDoDia] ⚠️', resultado.error);
      mostrarMensagemExercicios(resultado.error, 'warning', container);
      AppState.set('currentExercises', []); // Limpar exercícios em caso de erro
      return;
    }

    if (resultado.message) {
      console.log('[carregarExerciciosDoDia] 📝', resultado.message);
      mostrarMensagemExercicios(resultado.message, 'info', container);
      AppState.set('currentExercises', []); // Limpar exercícios quando há mensagem
      return;
    }

    if (resultado.data && resultado.data.length > 0) {
      console.log('[carregarExerciciosDoDia] ✅ Exercícios encontrados:', resultado.data.length);

      // IMPORTANTE: Salvar exercícios no AppState para o iniciarTreino
      AppState.set('currentExercises', resultado.data);
      console.log('[carregarExerciciosDoDia] 💾 Exercícios salvos no AppState');

      // Expandir automaticamente o card quando há exercícios
      const expandableContent = document.getElementById('expandable-content');
      if (expandableContent) {
        expandableContent.style.display = 'block';

        // Atualizar ícone do toggle também
        const toggleButton = document.getElementById('workout-toggle');
        const expandIcon = toggleButton?.querySelector('.expand-icon');
        if (expandIcon) {
          expandIcon.style.transform = 'rotate(180deg)';
        }

        console.log('[carregarExerciciosDoDia] Card de treino expandido automaticamente');
      }

      renderizarExercicios(resultado.data, resultado.planejamento, container);
      return;
    }

    // Fallback: mostrar mensagem de nenhum exercício encontrado
    mostrarMensagemExercicios('Nenhum exercício encontrado para hoje', 'info', container);

    // Limpar exercícios do AppState quando não há exercícios
    AppState.set('currentExercises', []);
  } catch (error) {
    console.error('[carregarExerciciosDoDia] ❌ ERRO:', error);
    if (container) {
      mostrarMensagemExercicios('Erro ao carregar exercícios', 'error', container);
    }
    AppState.set('currentExercises', []); // Limpar exercícios em caso de erro
  }
}

// Carregar estatísticas avançadas do usuário
async function carregarEstatisticasAvancadas() {
  try {
    const currentUser = AppState.get('currentUser');

    if (!currentUser || !currentUser.id) {
      console.warn('[carregarEstatisticasAvancadas] ❌ currentUser não definido');
      return;
    }

    // Buscar estatísticas do Supabase
    const { query } = await import('../services/supabaseService.js');

    // 1. Buscar execuções recentes
    const { data: execucoesRecentes } = await query('execucao_exercicio_usuario', {
      eq: { usuario_id: currentUser.id },
      order: { column: 'data_execucao', ascending: false },
      limit: 10,
    });

    // 2. Buscar estatísticas de 1RM (usando tabela direta)
    const { data: estatisticas1RM } = await query('usuario_1rm', {
      eq: { usuario_id: currentUser.id, status: 'ativo' },
      order: { column: 'data_teste', ascending: false },
    });

    // 3. Buscar exercícios para calcular progressão por grupo
    const { data: exercicios1RM } = await query('usuario_1rm', {
      eq: { usuario_id: currentUser.id, status: 'ativo' },
      select: '*, exercicios(grupo_muscular)',
    });

    // 4. Calcular estatísticas da semana atual
    const hoje = new Date();
    const inicioSemana = new Date(hoje.setDate(hoje.getDate() - hoje.getDay()));
    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(fimSemana.getDate() + 6);

    const { data: execucoesSemana } = await query('execucao_exercicio_usuario', {
      eq: { usuario_id: currentUser.id },
      gte: { data_execucao: inicioSemana.toISOString() },
      lte: { data_execucao: fimSemana.toISOString() },
    });

    // Processar e exibir estatísticas
    processarEstatisticasAvancadas({
      execucoesRecentes: execucoesRecentes || [],
      estatisticas1RM: estatisticas1RM || [],
      exercicios1RM: exercicios1RM || [],
      execucoesSemana: execucoesSemana || [],
    });

    console.log('[carregarEstatisticasAvancadas] ✅ Estatísticas avançadas carregadas');
  } catch (error) {
    console.error('[carregarEstatisticasAvancadas] ❌ Erro:', error);
    // Não propagar erro para não quebrar o dashboard
  }
}

// Processar e exibir estatísticas avançadas
function processarEstatisticasAvancadas(dados) {
  try {
    const { execucoesRecentes, estatisticas1RM, exercicios1RM, execucoesSemana } = dados;

    // Atualizar métricas da semana
    atualizarMetricasSemana(execucoesSemana);

    // Atualizar progresso de 1RM
    atualizarProgresso1RM(estatisticas1RM);

    // Atualizar progressão por grupos musculares (calculada localmente)
    atualizarProgressaoGrupos(exercicios1RM);

    // Atualizar atividade recente
    atualizarAtividadeRecente(execucoesRecentes);
  } catch (error) {
    console.error('[processarEstatisticasAvancadas] Erro:', error);
  }
}

// Atualizar métricas da semana
function atualizarMetricasSemana(execucoesSemana) {
  try {
    const totalExerciciosSemana = execucoesSemana.length;
    const pesoTotalSemana = execucoesSemana.reduce(
      (total, exec) => total + exec.peso_utilizado * exec.repeticoes,
      0
    );
    const diasTreinados = new Set(
      execucoesSemana.map((exec) => new Date(exec.data_execucao).toDateString())
    ).size;

    // Atualizar elementos se existirem
    updateElement('weekly-exercises-count', totalExerciciosSemana);
    updateElement('weekly-volume', `${Math.round(pesoTotalSemana)}kg`);
    updateElement('weekly-training-days', diasTreinados);

    // Atualizar progresso semanal no card principal
    const progressPercentage = Math.min((diasTreinados / 4) * 100, 100);
    const progressCircle = document.getElementById('workout-progress-circle');
    if (progressCircle) {
      const offset = 251.2 - (progressPercentage / 100) * 251.2;
      progressCircle.style.strokeDashoffset = offset.toString();
    }
  } catch (error) {
    console.error('[atualizarMetricasSemana] Erro:', error);
  }
}

// Atualizar progresso de 1RM
function atualizarProgresso1RM(estatisticas1RM) {
  try {
    if (!estatisticas1RM || estatisticas1RM.length === 0) return;

    // Encontrar maior 1RM
    const maior1RM = Math.max(...estatisticas1RM.map((stat) => stat.rm_calculado || 0));

    // Calcular ganho médio baseado nos dados disponíveis
    const exerciciosComRM = estatisticas1RM.length;

    updateElement('max-1rm', `${maior1RM}kg`);
    updateElement('exercises-with-progress', exerciciosComRM);
  } catch (error) {
    console.error('[atualizarProgresso1RM] Erro:', error);
  }
}

// Atualizar progressão por grupos musculares
function atualizarProgressaoGrupos(exercicios1RM) {
  try {
    if (!exercicios1RM || exercicios1RM.length === 0) return;

    // Agrupar por grupo muscular
    const gruposMus = {};
    exercicios1RM.forEach((exercicio) => {
      const grupo = exercicio.exercicios?.grupo_muscular || 'Outros';
      if (!gruposMus[grupo]) {
        gruposMus[grupo] = [];
      }
      gruposMus[grupo].push(exercicio.rm_calculado);
    });

    // Simples atualização de estatísticas
    const totalGrupos = Object.keys(gruposMus).length;
    updateElement('muscle-groups-count', totalGrupos);
  } catch (error) {
    console.error('[atualizarProgressaoGrupos] Erro:', error);
  }
}

// Atualizar atividade recente
function atualizarAtividadeRecente(execucoesRecentes) {
  try {
    const container = document.getElementById('recent-activity');
    if (!container || !execucoesRecentes || execucoesRecentes.length === 0) return;

    let html = '';
    execucoesRecentes.slice(0, 5).forEach((execucao) => {
      const dataExecucao = new Date(execucao.data_execucao);
      const diasAtras = Math.floor((new Date() - dataExecucao) / (1000 * 60 * 60 * 24));
      const tempoRelativo =
        diasAtras === 0 ? 'Hoje' : diasAtras === 1 ? 'Ontem' : `${diasAtras} dias atrás`;

      html += `
                <div class="activity-item">
                    <div class="activity-icon">${getActionIcon('weight')}</div>
                    <div class="activity-content">
                        <div class="activity-description">
                            ${execucao.peso_utilizado}kg × ${execucao.repeticoes} reps
                        </div>
                        <div class="activity-time">${tempoRelativo}</div>
                    </div>
                    <div class="activity-success ${execucao.falhou ? 'failed' : 'success'}">
                        ${execucao.falhou ? getActionIcon('warning') : getActionIcon('checkFilled')}
                    </div>
                </div>
            `;
    });

    container.innerHTML = html;
  } catch (error) {
    console.error('[atualizarAtividadeRecente] Erro:', error);
  }
}

// Configurar botão de iniciar treino
function configurarBotaoIniciar() {
  const startBtn =
    document.getElementById('contextual-workout-btn') ||
    document.getElementById('start-workout-btn');
  if (!startBtn) {
    console.warn(
      '[configurarBotaoIniciar] Nenhum botão de treino encontrado (#contextual-workout-btn ou #start-workout-btn)'
    );
    return;
  }

  const workout = AppState.get('currentWorkout');

  startBtn.onclick = () => {
    if (!workout) {
      // Sem treino - abrir planejamento
      if (window.abrirPlanejamentoParaUsuarioAtual) {
        window.abrirPlanejamentoParaUsuarioAtual();
      } else {
        showNotification('Configure seu planejamento primeiro', 'warning');
      }
      return;
    }

    // Com treino - usar a função global iniciarTreinoComDisposicao
    if (window.iniciarTreinoComDisposicao) {
      window.iniciarTreinoComDisposicao();
    } else {
      showNotification('Sistema de treino carregando...', 'info');
    }
  };

  // Habilitar/desabilitar baseado no estado
  startBtn.disabled = false;

  console.log(
    '[configurarBotaoIniciar] ✅ Botão configurado para:',
    workout?.tipo || 'configuração'
  );
}

// Configurar event listeners
// Variável para evitar múltiplos registros de listeners
let listenersConfigured = false;
let debounceTimer = null;
const supabaseChannel = null;

// Configurar listener do Supabase para mudanças em tempo real
// DESABILITADO: Realtime do Supabase foi desativado para evitar erros de WebSocket
/*
async function configurarSupabaseListener() {
    try {
        const currentUser = AppState.get('currentUser');
        if (!currentUser || !currentUser.id) {
            console.warn('[configurarSupabaseListener] ❌ Usuário não está definido');
            return;
        }

        // Importar supabase
        const { supabase } = await import('../services/supabaseService.js');
        
        // Remover canal anterior se existir
        if (supabaseChannel) {
            console.log('[configurarSupabaseListener] 🗑️ Removendo canal anterior');
            supabase.removeChannel(supabaseChannel);
        }

        // Criar novo canal para mudanças na planejamento_semanal
        supabaseChannel = supabase
            .channel('planejamento_semanal_changes')
            .on('postgres_changes', 
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'planejamento_semanal',
                    filter: `usuario_id=eq.${currentUser.id}`
                }, 
                (payload) => {
                    console.log('[configurarSupabaseListener] 📡 Mudança detectada na planejamento_semanal:', payload);
                    
                    // Debounce para evitar múltiplas chamadas
                    if (debounceTimer) {
                        clearTimeout(debounceTimer);
                    }
                    
                    debounceTimer = setTimeout(() => {
                        fetchWorkouts();
                    }, 500);
                }
            )
            .subscribe((status) => {
                console.log('[configurarSupabaseListener] 📡 Status da subscription:', status);
            });

        console.log('[configurarSupabaseListener] ✅ Listener Supabase configurado para usuário:', currentUser.id);

    } catch (error) {
        console.error('[configurarSupabaseListener] ❌ Erro ao configurar listener:', error);
    }
}
*/

// Função para buscar workouts (adaptada para o contexto atual)
async function fetchWorkouts() {
  try {
    console.log('[fetchWorkouts] 🔄 Recarregando workouts...');

    const currentUser = AppState.get('currentUser');
    if (!currentUser || !currentUser.id) {
      console.warn('[fetchWorkouts] ❌ Usuário não está definido');
      return;
    }

    // Como as tabelas workouts/weekly_plan não existem, vamos atualizar os dados do planejamento atual
    console.log('[fetchWorkouts] 🔄 Atualizando dados do planejamento semanal...');

    // Buscar plano semanal atual do usuário - usando exportações de compatibilidade primeiro
    let planAtual = null;
    try {
      // Método prioritário: Usar exportação de compatibilidade (mais confiável)
      const { getActiveWeeklyPlan } = await import('../services/weeklyPlanningService.js');
      planAtual = await getActiveWeeklyPlan(currentUser.id);
      console.log('[fetchWorkouts] ✅ Plano carregado via exportação de compatibilidade');
    } catch (error) {
      console.error('[fetchWorkouts] ❌ Erro ao buscar plano semanal:', error.message);
    }

    // Atualizar estado com plano atualizado
    if (planAtual) {
      AppState.set('weekPlan', planAtual);
      console.log('[fetchWorkouts] ✅ Plano semanal atualizado:', planAtual);
    }

    // Recarregar componentes relevantes se estivermos na tela home
    const homeScreen = document.getElementById('home-screen');
    if (homeScreen && homeScreen.classList.contains('active')) {
      await carregarIndicadoresSemana();
      await carregarTreinoAtual();
      await carregarExerciciosDoDia();
    }

    console.log('[fetchWorkouts] ✅ Dados atualizados com sucesso!');
  } catch (error) {
    console.error('[fetchWorkouts] ❌ Erro ao recarregar workouts:', error);
  }
}

// Função para limpar listeners (para uso em cleanup)
async function limparEventListeners() {
  try {
    // DESABILITADO: Realtime do Supabase foi desativado
    /*
        if (supabaseChannel) {
            console.log('[limparEventListeners] 🗑️ Removendo canal Supabase...');
            const { supabase } = await import('../services/supabaseService.js');
            supabase.removeChannel(supabaseChannel);
            supabaseChannel = null;
        }
        */

    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }

    listenersConfigured = false;
    console.log('[limparEventListeners] ✅ Event listeners limpos');
  } catch (error) {
    console.error('[limparEventListeners] ❌ Erro ao limpar listeners:', error);
  }
}

// Configurar listener para visibilidade da página (equivalente ao useFocusEffect)
function configurarVisibilityListener() {
  try {
    // Listener para mudança de visibilidade da página
    document.addEventListener('visibilitychange', () => {
      // Só refetch se a página ficou visível e estamos na home screen
      if (!document.hidden) {
        const homeScreen = document.getElementById('home-screen');
        if (homeScreen && homeScreen.classList.contains('active')) {
          console.log(
            '[configurarVisibilityListener] 👁️ Página voltou ao foco, refetchando dados...'
          );

          // Debounce para evitar execuções muito frequentes
          if (debounceTimer) {
            clearTimeout(debounceTimer);
          }

          debounceTimer = setTimeout(() => {
            fetchWorkouts();
          }, 300);
        }
      }
    });

    // Listener para quando a janela volta ao foco
    window.addEventListener('focus', () => {
      const homeScreen = document.getElementById('home-screen');
      if (homeScreen && homeScreen.classList.contains('active')) {
        console.log(
          '[configurarVisibilityListener] 🔄 Janela voltou ao foco, refetchando dados...'
        );

        // Debounce para evitar execuções muito frequentes
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }

        debounceTimer = setTimeout(() => {
          fetchWorkouts();
        }, 300);
      }
    });

    console.log('[configurarVisibilityListener] ✅ Visibility listeners configurados');
  } catch (error) {
    console.error(
      '[configurarVisibilityListener] ❌ Erro ao configurar visibility listeners:',
      error
    );
  }
}

function configurarEventListeners() {
  if (listenersConfigured) {
    console.log('[configurarEventListeners] Listeners já configurados, pulando...');
    return;
  }

  // Listener para mudanças no estado com debounce
  AppState.subscribe('weekPlan', (newPlan) => {
    console.log('[dashboard] Plano semanal atualizado, recarregando...');

    // Debounce para evitar execuções muito frequentes
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
      // Verificar se estamos na tela home antes de recarregar
      const homeScreen = document.getElementById('home-screen');
      if (homeScreen && homeScreen.classList.contains('active')) {
        // Recarregar indicadores da semana para refletir mudanças automaticamente
        carregarIndicadoresSemana();
        carregarPlanejamentoSemanal();
      }
    }, 300); // Reduzido para resposta mais rápida
  });

  AppState.subscribe('currentUser', (newUser) => {
    if (newUser) {
      console.log('[dashboard] Usuário alterado, recarregando dashboard...');
      carregarDashboard();
    }
  });

  // Configurar listener Supabase para mudanças na weekly_plan
  // DESABILITADO: Realtime do Supabase foi desativado para evitar erros de WebSocket
  // configurarSupabaseListener();

  // Configurar listener para quando a página volta ao foco (equivalente ao useFocusEffect)
  configurarVisibilityListener();

  listenersConfigured = true;
  console.log('[configurarEventListeners] ✅ Event listeners configurados');

  // Atualizar a cada minuto para mostrar progresso do dia
  setInterval(() => {
    const progressTextEl = document.getElementById('workout-progress-text');
    const workout = AppState.get('currentWorkout');

    if (progressTextEl && workout && workout.tipo !== 'folga') {
      const agora = new Date();
      const hoje = agora.getDay();
      const horaAtual = agora.getHours();

      // Simular progresso do dia (6h às 22h = 100%)
      const progressoDia = Math.min(Math.max(((horaAtual - 6) / 16) * 100, 0), 100);

      if (workout.tipo !== 'cardio' && workout.tipo !== 'Cardio') {
        const progressCircleEl = document.getElementById('workout-progress-circle');
        if (progressCircleEl) {
          const offset = 251.2 - (progressoDia / 100) * 251.2;
          progressCircleEl.style.strokeDashoffset = offset.toString();
        }
        progressTextEl.textContent = `${Math.round(progressoDia)}%`;
      }
    }
  }, 60000); // A cada minuto

  console.log('[configurarEventListeners] ✅ Event listeners configurados');
}

// Função auxiliar para atualizar elementos
function updateElement(element, value) {
  if (!element) return;

  if (typeof element === 'string') {
    const el = document.getElementById(element);
    if (el) el.textContent = value;
  } else {
    element.textContent = value;
  }
}

// Função para atualizar métricas em tempo real (pode ser chamada externamente)
function atualizarMetricasTempoReal(novasMetricas) {
  try {
    updateElement('completed-workouts', novasMetricas.treinosConcluidos || 0);
    updateElement('current-week', novasMetricas.semanaAtual || 1);
    updateElement('progress-percentage', `${Math.round(novasMetricas.progresso || 0)}%`);

    const userProgressBar = document.getElementById('user-progress-bar');
    if (userProgressBar) {
      const progressWidth = Math.min((novasMetricas.treinosConcluidos / 4) * 100, 100);
      userProgressBar.style.width = `${progressWidth}%`;
    }

    updateElement('user-workouts', novasMetricas.treinosConcluidos || 0);

    AppState.set('userMetrics', novasMetricas);

    console.log('[atualizarMetricasTempoReal] ✅ Métricas atualizadas:', novasMetricas);
  } catch (error) {
    console.error('[atualizarMetricasTempoReal] Erro:', error);
  }
}

// Função para forçar reload completo do dashboard
function recarregarDashboardLegacy() {
  console.log('[recarregarDashboard] Forçando reload completo...');
  carregarDashboard();
}

// Função de teste para verificar se fetchWorkouts funciona
window.testFetchWorkouts = async function () {
  console.log('[testFetchWorkouts] 🧪 TESTANDO FUNÇÃO fetchWorkouts');

  try {
    const currentUser = AppState.get('currentUser');
    if (!currentUser || !currentUser.id) {
      console.error('[testFetchWorkouts] ❌ Usuário não encontrado');
      if (window.showNotification) {
        window.showNotification('❌ Faça login primeiro', 'error');
      }
      return { success: false, error: 'Usuário não encontrado' };
    }

    console.log('[testFetchWorkouts] 👤 Usuário:', currentUser.id);

    // Chamar a função fetchWorkouts
    await fetchWorkouts();

    console.log('[testFetchWorkouts] ✅ fetchWorkouts executou sem erros');
    if (window.showNotification) {
      window.showNotification('✅ fetchWorkouts funcionando!', 'success');
    }

    return { success: true };
  } catch (error) {
    console.error('[testFetchWorkouts] ❌ ERRO:', error);
    if (window.showNotification) {
      window.showNotification('❌ Erro no fetchWorkouts: ' + error.message, 'error');
    }
    return { success: false, error: error.message };
  }
};

// Exportar para compatibilidade
window.carregarDashboard = carregarDashboard;
window.recarregarDashboard = carregarDashboard;
window.carregarIndicadoresSemana = carregarIndicadoresSemana;
window.limparEventListeners = limparEventListeners;
window.fetchWorkouts = fetchWorkouts;
window.buscarResumoTreinoCompleto = buscarResumoTreinoCompleto;

// Função global para navegação de semanas
window.navegarSemana = navegarSemana;

// Função global para carregar dados dinâmicos
window.carregarDadosDinamicosHome = carregarDadosDinamicosHome;

// Verificar se treino foi concluído usando a mesma lógica do workoutExecution
async function verificarTreinoConcluido(userId, dayIndex, ano = null, semana = null) {
  try {
    console.log(
      `[verificarTreinoConcluido] 🔍 Verificando conclusão do dia ${dayIndex} (${DIAS_SEMANA[dayIndex]}) para usuário:`,
      userId
    );

    // Se não especificado, usar semana atual
    if (!ano || !semana) {
      const hoje = new Date();
      ano = hoje.getFullYear();
      semana = WeeklyPlanService.getWeekNumber(hoje);
    }

    console.log(`[verificarTreinoConcluido] 📅 Verificando para semana ${semana}/${ano}`);

    // Validar parâmetros antes da query
    const validatedUserId = parseInt(userId);
    const validatedAno = parseInt(ano);
    const validatedSemana = parseInt(semana);
    const validatedDiaSemana = WeeklyPlanService.dayToDb(dayIndex);

    console.log('[verificarTreinoConcluido] Parâmetros validados:', {
      userId: validatedUserId,
      ano: validatedAno,
      semana: validatedSemana,
      dia_semana: validatedDiaSemana,
      dayIndex: dayIndex,
    });

    // Buscar planejamento específico do dia no banco usando a mesma lógica do workoutExecution
    const { data: planejamentoArray, error } = await query('planejamento_semanal', {
      select: 'concluido, data_conclusao, tipo_atividade',
      eq: {
        usuario_id: validatedUserId,
        ano: validatedAno,
        semana_treino: validatedSemana,
        dia_semana: validatedDiaSemana,
      },
    });

    const planejamentoDia =
      planejamentoArray && planejamentoArray.length > 0 ? planejamentoArray[0] : null;

    if (error) {
      console.warn(
        `[verificarTreinoConcluido] ⚠️ Erro ao buscar planejamento do dia ${dayIndex}:`,
        error.message
      );
      return false;
    }

    if (!planejamentoDia) {
      console.log(
        `[verificarTreinoConcluido] ⚠️ Nenhum planejamento encontrado para o dia ${dayIndex} (${DIAS_SEMANA[dayIndex]})`
      );
      return false;
    }

    // VERIFICAR O STATUS NO PLANEJAMENTO_SEMANAL usando a mesma lógica
    // O campo 'concluido' na tabela planejamento_semanal é a fonte da verdade
    const concluido = Boolean(planejamentoDia.concluido);

    console.log(
      `[verificarTreinoConcluido] 📊 ANÁLISE DO DIA ${dayIndex} (${DIAS_SEMANA[dayIndex]}):`,
      {
        planejamento: planejamentoDia,
        concluido: concluido,
        data_conclusao: planejamentoDia.data_conclusao,
        tipo_atividade: planejamentoDia.tipo_atividade,
        logica: 'BASEADA_NO_PLANEJAMENTO_SEMANAL',
      }
    );

    return concluido;
  } catch (error) {
    console.error(`[verificarTreinoConcluido] ❌ Erro no dia ${dayIndex}:`, error);
    return false;
  }
}

// ===== HISTÓRICO DE TREINOS =====

// ===== FUNÇÕES DO CARROSSEL PREMIUM =====

// Função para centralizar o dia no carrossel mobile - iOS Optimized
function centralizarDiaNoCarrossel(dayIndex) {
  if (window.innerWidth > 768) return; // Só no mobile

  const container = document.querySelector('.week-indicators');
  const dayElements = container?.querySelectorAll('.day-indicator');

  if (!container || !dayElements || !dayElements[dayIndex]) return;

  const dayElement = dayElements[dayIndex];
  const containerWidth = container.offsetWidth;
  const dayWidth = dayElement.offsetWidth;
  const dayLeft = dayElement.offsetLeft;

  // Calcular posição para centralizar o dia
  const scrollPosition = dayLeft - containerWidth / 2 + dayWidth / 2;

  // iOS fix - usar scrollLeft diretamente se scrollTo não funcionar bem
  if ('scrollBehavior' in document.documentElement.style) {
    container.scrollTo({
      left: scrollPosition,
      behavior: 'smooth',
    });
  } else {
    // Fallback para iOS antigo
    smoothScrollTo(container, scrollPosition, 300);
  }
}

// Smooth scroll polyfill para iOS
function smoothScrollTo(element, target, duration) {
  const start = element.scrollLeft;
  const change = target - start;
  const startTime = performance.now();

  function animateScroll(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Easing function
    const easeInOutCubic = (progress) => {
      return progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    };

    element.scrollLeft = start + change * easeInOutCubic(progress);

    if (progress < 1) {
      requestAnimationFrame(animateScroll);
    }
  }

  requestAnimationFrame(animateScroll);
}

// Atualizar indicadores dots
function updateCarouselDots(activeIndex) {
  const dots = document.querySelectorAll('.carousel-dot');
  dots.forEach((dot, index) => {
    dot.classList.toggle('active', index === activeIndex);
  });
}

// Navegar no carrossel com botões
window.navigateCarousel = function (direction) {
  const container = document.querySelector('.week-indicators');
  if (!container) return;

  const dayElements = container.querySelectorAll('.day-indicator');
  const containerWidth = container.offsetWidth;
  const scrollLeft = container.scrollLeft;

  // Encontrar o dia mais próximo do centro
  let closestIndex = 0;
  let closestDistance = Infinity;

  dayElements.forEach((day, index) => {
    const dayCenter = day.offsetLeft + day.offsetWidth / 2;
    const containerCenter = scrollLeft + containerWidth / 2;
    const distance = Math.abs(dayCenter - containerCenter);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  });

  // Calcular próximo índice
  let targetIndex = closestIndex;
  if (direction === 'next' && closestIndex < 6) {
    targetIndex = closestIndex + 1;
  } else if (direction === 'prev' && closestIndex > 0) {
    targetIndex = closestIndex - 1;
  }

  // Centralizar no dia alvo
  centralizarDiaNoCarrossel(targetIndex);
  updateCarouselDots(targetIndex);
};

// Ir direto para um dia específico
window.goToDay = function (dayIndex) {
  centralizarDiaNoCarrossel(dayIndex);
  updateCarouselDots(dayIndex);
};

// Observador de scroll para atualizar dots - iOS Optimized
function initializeCarouselObserver() {
  const container = document.querySelector('.week-indicators');
  if (!container) return;

  let scrollTimeout;
  let isScrolling = false;
  let scrollEndTimer;

  // Função para forçar snap no iOS
  function forceSnapToClosest() {
    const containerWidth = container.offsetWidth;
    const scrollLeft = container.scrollLeft;
    const dayElements = container.querySelectorAll('.day-indicator');

    let closestIndex = 0;
    let closestDistance = Infinity;

    // Encontrar o dia mais próximo do centro
    dayElements.forEach((day, index) => {
      const dayLeft = day.offsetLeft;
      const dayWidth = day.offsetWidth;
      const dayCenter = dayLeft + dayWidth / 2;
      const containerCenter = scrollLeft + containerWidth / 2;
      const distance = Math.abs(dayCenter - containerCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    // Centralizar no dia mais próximo
    centralizarDiaNoCarrossel(closestIndex);
    updateCarouselDots(closestIndex);
  }

  // Scroll listener otimizado para iOS
  container.addEventListener(
    'scroll',
    () => {
      if (!isScrolling) {
        container.classList.add('scrolling');
        isScrolling = true;
      }

      clearTimeout(scrollTimeout);
      clearTimeout(scrollEndTimer);

      scrollTimeout = setTimeout(() => {
        container.classList.remove('scrolling');
        isScrolling = false;
        updateActiveDay();
      }, 150);

      // iOS fix - forçar snap após parar de scrollar
      scrollEndTimer = setTimeout(() => {
        if (!isScrolling) {
          forceSnapToClosest();
        }
      }, 200);
    },
    { passive: true }
  );

  // IntersectionObserver para detectar dia central
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
          entry.target.classList.add('in-view');
        } else {
          entry.target.classList.remove('in-view');
        }
      });
    },
    {
      root: container,
      rootMargin: '0px -33.333%',
      threshold: [0.5],
    }
  );

  const dayElements = container.querySelectorAll('.day-indicator');
  dayElements.forEach((day, index) => {
    observer.observe(day);
    // Adicionar índice para animação dos dots
    const dot = document.querySelectorAll('.carousel-dot')[index];
    if (dot) {
      dot.style.setProperty('--dot-index', index);
    }
  });

  // Touch events melhorados para iOS
  let touchStartX = 0;
  let touchEndX = 0;
  let touchStartTime = 0;
  let isTouching = false;

  container.addEventListener(
    'touchstart',
    (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartTime = Date.now();
      isTouching = true;
    },
    { passive: true }
  );

  container.addEventListener(
    'touchmove',
    (e) => {
      // Prevenir scroll vertical durante swipe horizontal
      if (isTouching) {
        const touchX = e.changedTouches[0].screenX;
        const diffX = Math.abs(touchX - touchStartX);
        if (diffX > 10) {
          e.preventDefault();
        }
      }
    },
    { passive: false }
  );

  container.addEventListener(
    'touchend',
    (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const touchEndTime = Date.now();
      const timeDiff = touchEndTime - touchStartTime;
      isTouching = false;

      // Se foi um toque rápido (tap), não fazer nada
      if (timeDiff < 150 && Math.abs(touchEndX - touchStartX) < 10) {
        return;
      }

      // Após soltar, forçar snap
      setTimeout(() => {
        forceSnapToClosest();
      }, 100);
    },
    { passive: true }
  );
}

// Atualizar dia ativo baseado no scroll
function updateActiveDay() {
  const container = document.querySelector('.week-indicators');
  if (!container) return;

  const dayElements = container.querySelectorAll('.day-indicator');
  const containerWidth = container.offsetWidth;
  const scrollLeft = container.scrollLeft;

  let closestIndex = 0;
  let closestDistance = Infinity;

  dayElements.forEach((day, index) => {
    const dayCenter = day.offsetLeft + day.offsetWidth / 2;
    const containerCenter = scrollLeft + containerWidth / 2;
    const distance = Math.abs(dayCenter - containerCenter);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  });

  updateCarouselDots(closestIndex);
}

// Suporte a teclado
document.addEventListener('keydown', (e) => {
  if (window.innerWidth > 768) return;

  const container = document.querySelector('.week-indicators');
  if (!container || !container.contains(document.activeElement)) return;

  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    navigateCarousel('prev');
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    navigateCarousel('next');
  }
});

// Handler para clique nos dias da semana
window.handleDayClick = async function (dayIndex, isCompleted) {
  console.log(`[handleDayClick] Clicou no dia ${dayIndex}, concluído: ${isCompleted}`);

  // Centralizar o dia clicado no carrossel mobile
  centralizarDiaNoCarrossel(dayIndex);

  const currentUser = AppState.get('currentUser');
  if (!currentUser?.id) {
    showNotification('Usuário não encontrado', 'error');
    return;
  }

  try {
    showNotification('Carregando informações do treino...', 'info');

    // Usar a nova função com as views
    // Obter a semana atual sendo exibida
    // IMPORTANTE: Usar semanaExibida quando navegando entre semanas
    const semanaAUsar =
      dadosGlobaisCache?.semanaExibida ||
      dadosGlobaisCache?.dados?.semanaAtiva ||
      WeeklyPlanService.getWeekNumber(new Date());

    const resumoCompleto = await buscarResumoTreinoCompleto(currentUser.id, dayIndex, semanaAUsar);

    if (resumoCompleto) {
      console.log('[handleDayClick] ✅ Resumo encontrado:', resumoCompleto);

      // Se for folga ou cardio, usar modal específico
      if (
        resumoCompleto.resumo.tipo_atividade === 'folga' ||
        resumoCompleto.resumo.tipo_atividade === 'cardio'
      ) {
        mostrarModalResumoPlanejado(
          {
            tipo: resumoCompleto.resumo.tipo_atividade,
            data: new Date(),
            exercicios: [],
          },
          dayIndex
        );
      } else {
        // Usar o novo modal unificado
        resumoCompleto.dia_index = dayIndex;
        mostrarModalResumoUnificado(resumoCompleto);
      }
    } else {
      // Fallback para buscar histórico antigo (compatibilidade)
      console.log('[handleDayClick] Sem dados nas views, tentando busca antiga...');

      const historico = await buscarHistoricoTreino(currentUser.id, dayIndex);

      if (historico) {
        console.log('[handleDayClick] ✅ Histórico antigo encontrado:', historico);
        if (historico.multiplos_grupos) {
          mostrarSeletorGrupoMuscular(historico, dayIndex);
        } else {
          mostrarModalHistorico(historico, dayIndex);
        }
      } else {
        // Fallback removido a pedido: não mostrar resumo planejado
        showNotification('Nenhum treino configurado para este dia', 'info');
      }
    }
  } catch (error) {
    console.error('[handleDayClick] Erro:', error);
    showNotification('Erro ao carregar histórico do treino', 'error');
  }
};

// Função para abrir modal de edição rápida de um dia
window.abrirEdicaoRapidaDia = async function (dayIndex) {
  console.log(`[abrirEdicaoRapidaDia] Abrindo edição para dia ${dayIndex}`);

  const currentUser = AppState.get('currentUser');
  if (!currentUser?.id) {
    showNotification('Usuário não encontrado', 'error');
    return;
  }

  try {
    // Obter dados do planejamento para o dia específico
    const dadosCompletos = await carregarDadosCompletos(currentUser.id);

    if (!dadosCompletos?.planejamento) {
      showNotification('Planejamento não encontrado', 'error');
      return;
    }

    // Encontrar o planejamento para o dia específico
    const diaConfig = dadosCompletos.planejamento.find((p) => p.dia_semana === dayIndex + 1);

    if (!diaConfig) {
      showNotification('Configuração do dia não encontrada', 'error');
      return;
    }

    // Preparar dados para o modal
    const config = {
      tipo: diaConfig.tipo_atividade?.toLowerCase() || 'folga',
      concluido: diaConfig.concluido || false,
      data_conclusao: diaConfig.data_conclusao,
    };

    // Callback para salvar alterações
    const onSave = async (novoTipo) => {
      try {
        showNotification('Salvando alteração...', 'info');

        // Atualizar via WeeklyPlanService
        await WeeklyPlanService.updateDay(currentUser.id, dayIndex, { tipo: novoTipo });

        showNotification('Dia atualizado com sucesso!', 'success');

        // Recarregar dados do dashboard
        if (typeof carregarDadosDinamicosHome === 'function') {
          await carregarDadosDinamicosHome();
        }
      } catch (error) {
        console.error('[abrirEdicaoRapidaDia] Erro ao salvar:', error);
        showNotification('Erro ao salvar alteração: ' + error.message, 'error');
      }
    };

    // Abrir modal de edição rápida
    if (window.openQuickEditModal) {
      window.openQuickEditModal(dayIndex, config, onSave);
    } else {
      showNotification('Modal de edição não disponível', 'error');
    }
  } catch (error) {
    console.error('[abrirEdicaoRapidaDia] Erro:', error);
    showNotification('Erro ao carregar dados do dia', 'error');
  }
};

// Buscar grupo muscular planejado para um dia específico
async function buscarGrupoMuscularPlanejado(userId, dataAlvo) {
  try {
    const ano = dataAlvo.getFullYear();
    const semana = WeeklyPlanService.getWeekNumber(dataAlvo);
    const diaSemana = WeeklyPlanService.dayToDb(dataAlvo.getDay());

    // Usar a função query do supabaseService que já tem autenticação configurada
    const { query } = await import('../services/supabaseService.js');
    const { data: planejamentoArray, error } = await query('planejamento_semanal', {
      select: 'tipo_atividade',
      eq: {
        usuario_id: userId,
        ano: ano,
        semana_treino: semana,
        dia_semana: diaSemana,
      },
    });

    if (error || !planejamentoArray || planejamentoArray.length === 0) {
      console.log('[buscarGrupoMuscularPlanejado] Nenhum planejamento encontrado para este dia');
      return null;
    }

    return planejamentoArray[0].tipo_atividade;
  } catch (error) {
    console.error('[buscarGrupoMuscularPlanejado] Erro:', error);
    return null;
  }
}

// Nova função para buscar resumo do treino usando as views
async function buscarResumoTreinoCompleto(userId, dayIndex, semanaExibida) {
  try {
    const anoAtual = new Date().getFullYear();
    const diaSemana = WeeklyPlanService.dayToDb(dayIndex);

    console.log('[buscarResumoTreinoCompleto] Buscando resumo:', {
      userId,
      ano: anoAtual,
      semana: semanaExibida,
      dia_semana: diaSemana,
    });

    // Buscar resumo do dia
    const { data: resumoDia, error: resumoError } = await supabase
      .from('v_resumo_dia_semana')
      .select('*')
      .eq('usuario_id', userId)
      .eq('ano', anoAtual)
      .eq('semana', semanaExibida)
      .eq('dia_semana', diaSemana)
      .limit(1)
      .maybeSingle(); // evita erro 406 quando múltiplas linhas

    if (resumoError && resumoError.code !== 'PGRST116') {
      console.error('[buscarResumoTreinoCompleto] Erro ao buscar resumo:', resumoError);
      return null;
    }

    if (!resumoDia) {
      console.log('[buscarResumoTreinoCompleto] Nenhum treino encontrado para o dia');
      return null;
    }

    // Buscar detalhes dos exercícios
    const { data: exercicios, error: exerciciosError } = await supabase
      .from('v_resumo_treino_dia')
      .select('*')
      .eq('usuario_id', userId)
      .eq('ano', anoAtual)
      .eq('semana', semanaExibida)
      .eq('dia_semana', diaSemana)
      .order('ordem_exercicio');

    if (exerciciosError) {
      console.error('[buscarResumoTreinoCompleto] Erro ao buscar exercícios:', exerciciosError);
      return null;
    }

    return {
      resumo: resumoDia,
      exercicios: exercicios || [],
      dayIndex,
    };
  } catch (error) {
    console.error('[buscarResumoTreinoCompleto] Erro:', error);
    return null;
  }
}

// Mostrar modal unificado de resumo do treino
function mostrarModalResumoUnificado(resumoCompleto) {
  console.log('[mostrarModalResumoUnificado] Exibindo resumo:', resumoCompleto);

  const { resumo, exercicios, dayIndex } = resumoCompleto;
  const dayName = DIAS_SEMANA[dayIndex];
  const isExecutado = resumo.status_treino === 'executado';

  // Formatar tempo
  const tempoFormatado = resumo.tempo_formatado || '0h 0min';

  // Criar HTML dos exercícios
  let exerciciosHtml = '';
  exercicios.forEach((ex, index) => {
    const isExecutadoClass =
      ex.status_treino === 'executado' ? 'exercicio-executado' : 'exercicio-planejado';

    let detalhesHtml = '';
    if (ex.status_treino === 'executado') {
      // Treino executado - mostrar séries detalhadas
      detalhesHtml = `
                <div class="exercise-details-clean">
                    <div class="detail-item-clean">
                        <span class="detail-label-clean">Executado:</span>
                        <span class="detail-value-clean ${isExecutadoClass}">${ex.series_detalhadas || `${ex.series_total} séries`}</span>
                    </div>
                    <div class="detail-item-clean">
                        <span class="detail-label-clean">Volume:</span>
                        <span class="detail-value-clean">${Math.round(ex.volume_total_kg)} kg</span>
                    </div>
                </div>
            `;
    } else {
      // Treino planejado - mostrar sugestões
      detalhesHtml = `
                <div class="exercise-details-clean">
                    <div class="detail-item-clean">
                        <span class="detail-label-clean">Séries:</span>
                        <span class="detail-value-clean">${ex.series_total}</span>
                    </div>
                    <div class="detail-item-clean">
                        <span class="detail-label-clean">Repetições:</span>
                        <span class="detail-value-clean">${ex.repeticoes_total}</span>
                    </div>
                    <div class="detail-item-clean">
                        <span class="detail-label-clean">Peso sugerido:</span>
                        <span class="detail-value-clean">${ex.peso_planejado?.toFixed(1) || '0'} kg</span>
                    </div>
                    <div class="detail-item-clean">
                        <span class="detail-label-clean">Descanso:</span>
                        <span class="detail-value-clean">${ex.tempo_descanso}s</span>
                    </div>
                </div>
            `;
    }

    exerciciosHtml += `
            <div class="exercise-card-clean ${isExecutadoClass}">
                <div class="exercise-header-clean">
                    <h4 class="exercise-name-clean">${index + 1}. ${ex.exercicio_nome}</h4>
                    <span class="exercise-equipment-clean">${ex.equipamento || ''}</span>
                </div>
                ${detalhesHtml}
            </div>
        `;
  });

  // Criar estatísticas baseadas no status
  let estatisticasHtml = '';
  if (isExecutado) {
    estatisticasHtml = `
            <div class="history-stats-grid-clean">
                <div class="stat-item-clean">
                    <div class="stat-label-clean">Total de Exercícios</div>
                    <div class="stat-value-clean">${resumo.total_exercicios}</div>
                </div>
                <div class="stat-item-clean">
                    <div class="stat-label-clean">Volume Total</div>
                    <div class="stat-value-clean">${resumo.volume_total_kg} kg</div>
                </div>
                <div class="stat-item-clean">
                    <div class="stat-label-clean">Tempo de Treino</div>
                    <div class="stat-value-clean">${tempoFormatado}</div>
                </div>
                <div class="stat-item-clean">
                    <div class="stat-label-clean">Total de Repetições</div>
                    <div class="stat-value-clean">${resumo.total_repeticoes}</div>
                </div>
            </div>
        `;
  } else {
    estatisticasHtml = `
            <div class="info-banner-clean">
                <span class="info-icon-clean">📋</span>
                <span>Treino planejado - ${resumo.total_exercicios} exercícios programados</span>
            </div>
        `;
  }

  const statusBadge = isExecutado
    ? '<span class="status-badge-executado">✅ Executado</span>'
    : '<span class="status-badge-planejado">📅 Planejado</span>';

  const modal = `
        <div id="modal-resumo-unificado" class="modal-overlay-clean" onclick="fecharModalResumoUnificado(event)">
            <div class="modal-content-clean workout-summary-modal" onclick="event.stopPropagation()">
                <div class="modal-header-clean">
                    <div class="workout-history-header-clean">
                        <div class="history-title-section-clean">
                            <h2 class="modal-title-clean">💪 ${resumo.tipo_atividade}</h2>
                            <div class="history-subtitle-clean">
                                <span class="day-badge-clean">${dayName}</span>
                                ${statusBadge}
                            </div>
                        </div>
                        <div class="modal-actions-clean">
                            <button class="edit-btn-clean" onclick="fecharModalResumoUnificado(); window.abrirEdicaoRapidaDia(${resumo.dia_index || 0});" title="Editar tipo de treino">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                                </svg>
                            </button>
                            <button class="close-btn-clean" onclick="fecharModalResumoUnificado()">×</button>
                        </div>
                    </div>
                </div>
                <div class="modal-body-clean">
                    ${estatisticasHtml}
                    <div class="history-exercises-section-clean">
                        <h3 class="section-title-clean">Exercícios ${isExecutado ? 'Realizados' : 'Programados'}</h3>
                        <div class="exercises-list-clean">
                            ${exerciciosHtml}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

  // Adicionar estilos específicos
  const styles = `
        <style>
            /* Modal Overlay com Glassmorphism */
            #modal-resumo-unificado.modal-overlay-clean {
                animation: fadeInOverlay 0.3s ease-out;
                background: rgba(0, 0, 0, 0.85);
                backdrop-filter: blur(10px);
            }
            
            /* Modal Content com design moderno */
            #modal-resumo-unificado .modal-content-clean {
                background: linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 100%);
                border: 1px solid rgba(255, 255, 255, 0.1);
                box-shadow: 
                    0 20px 60px rgba(0, 0, 0, 0.5),
                    0 0 100px rgba(168, 255, 0, 0.05),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1);
                animation: slideInModal 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            
            /* Header aprimorado */
            #modal-resumo-unificado .modal-header-clean {
                background: linear-gradient(135deg, rgba(168, 255, 0, 0.08) 0%, transparent 70%);
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                position: relative;
                overflow: hidden;
            }
            
            #modal-resumo-unificado .modal-header-clean::before {
                content: '';
                position: absolute;
                top: -50%;
                right: -50%;
                width: 200%;
                height: 200%;
                background: radial-gradient(circle, rgba(168, 255, 0, 0.03) 0%, transparent 70%);
                animation: pulse 4s ease-in-out infinite;
            }
            
            /* Título com efeito de gradiente */
            #modal-resumo-unificado .modal-title-clean {
                background: linear-gradient(135deg, #ffffff 0%, #cccccc 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                text-shadow: 0 2px 20px rgba(255, 255, 255, 0.1);
            }
            
            /* Badges aprimorados */
            #modal-resumo-unificado .day-badge-clean {
                background: linear-gradient(135deg, #a8ff00 0%, #7acc00 100%);
                box-shadow: 
                    0 4px 15px rgba(168, 255, 0, 0.3),
                    inset 0 1px 0 rgba(255, 255, 255, 0.3);
                transition: all 0.3s ease;
            }
            
            #modal-resumo-unificado .day-badge-clean:hover {
                transform: translateY(-2px);
                box-shadow: 
                    0 6px 20px rgba(168, 255, 0, 0.4),
                    inset 0 1px 0 rgba(255, 255, 255, 0.3);
            }
            
            /* Cards de exercícios com glassmorphism */
            .exercise-card-clean {
                background: rgba(255, 255, 255, 0.03);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 16px;
                padding: 20px;
                margin-bottom: 16px;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
                overflow: hidden;
            }
            
            .exercise-card-clean::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: linear-gradient(90deg, transparent, #a8ff00, transparent);
                transform: translateX(-100%);
                transition: transform 0.6s ease;
            }
            
            .exercise-card-clean:hover {
                transform: translateY(-4px);
                border-color: rgba(168, 255, 0, 0.3);
                box-shadow: 
                    0 10px 30px rgba(0, 0, 0, 0.3),
                    0 0 30px rgba(168, 255, 0, 0.1);
            }
            
            .exercise-card-clean:hover::before {
                transform: translateX(100%);
            }
            
            /* Estados específicos dos exercícios */
            .exercicio-executado {
                background: linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.05) 100%);
                border: 1px solid rgba(76, 175, 80, 0.3);
            }
            
            .exercicio-executado::before {
                background: linear-gradient(90deg, transparent, #4caf50, transparent);
            }
            
            .exercicio-planejado {
                background: linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(255, 152, 0, 0.05) 100%);
                border: 1px solid rgba(255, 152, 0, 0.3);
            }
            
            .exercicio-planejado::before {
                background: linear-gradient(90deg, transparent, #ff9800, transparent);
            }
            
            /* Badges de status aprimorados */
            .status-badge-executado {
                background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
                color: white;
                padding: 6px 16px;
                border-radius: 20px;
                font-size: 0.85em;
                font-weight: 600;
                box-shadow: 
                    0 4px 15px rgba(76, 175, 80, 0.3),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2);
                transition: all 0.3s ease;
            }
            
            .status-badge-planejado {
                background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
                color: white;
                padding: 6px 16px;
                border-radius: 20px;
                font-size: 0.85em;
                font-weight: 600;
                box-shadow: 
                    0 4px 15px rgba(255, 152, 0, 0.3),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2);
                transition: all 0.3s ease;
            }
            
            /* Grid de estatísticas aprimorado */
            .history-stats-grid-clean {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
                gap: 16px;
                margin-bottom: 24px;
            }
            
            .stat-item-clean {
                background: rgba(255, 255, 255, 0.03);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                padding: 20px;
                text-align: center;
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }
            
            .stat-item-clean::after {
                content: '';
                position: absolute;
                top: -2px;
                left: -2px;
                right: -2px;
                bottom: -2px;
                background: linear-gradient(45deg, #a8ff00, #4caf50, #2196f3, #a8ff00);
                border-radius: 12px;
                opacity: 0;
                z-index: -1;
                transition: opacity 0.3s ease;
            }
            
            .stat-item-clean:hover {
                transform: translateY(-4px);
                border-color: rgba(168, 255, 0, 0.3);
            }
            
            .stat-item-clean:hover::after {
                opacity: 0.3;
                animation: gradientRotate 3s linear infinite;
            }
            
            .stat-label-clean {
                color: #999;
                font-size: 0.85rem;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 8px;
            }
            
            .stat-value-clean {
                color: #fff;
                font-size: 1.8rem;
                font-weight: 700;
                background: linear-gradient(135deg, #a8ff00 0%, #7acc00 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
            
            /* Info banner aprimorado */
            .info-banner-clean {
                background: linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(33, 150, 243, 0.05) 100%);
                border: 1px solid rgba(33, 150, 243, 0.3);
                padding: 16px 20px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 24px;
                backdrop-filter: blur(10px);
                transition: all 0.3s ease;
            }
            
            .info-banner-clean:hover {
                border-color: rgba(33, 150, 243, 0.5);
                box-shadow: 0 4px 20px rgba(33, 150, 243, 0.2);
            }
            
            .info-icon-clean {
                font-size: 1.4em;
                filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
            }
            
            /* Detalhes dos exercícios aprimorados */
            .exercise-details-clean {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                gap: 12px;
                margin-top: 16px;
            }
            
            .detail-item-clean {
                background: rgba(255, 255, 255, 0.02);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 8px;
                padding: 12px;
                transition: all 0.2s ease;
            }
            
            .detail-item-clean:hover {
                background: rgba(255, 255, 255, 0.04);
                border-color: rgba(168, 255, 0, 0.2);
            }
            
            .detail-label-clean {
                color: #888;
                font-size: 0.75rem;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                display: block;
                margin-bottom: 4px;
            }
            
            .detail-value-clean {
                color: #fff;
                font-size: 0.95rem;
                font-weight: 600;
                display: block;
            }
            
            /* Container de ações do modal */
            .modal-actions-clean {
                display: flex;
                gap: 8px;
                align-items: center;
            }
            
            /* Botão de editar */
            #modal-resumo-unificado .edit-btn-clean {
                background: rgba(168, 255, 0, 0.15);
                border: 1px solid rgba(168, 255, 0, 0.3);
                color: #a8ff00;
                width: 40px;
                height: 40px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                cursor: pointer;
            }
            
            #modal-resumo-unificado .edit-btn-clean:hover {
                background: rgba(168, 255, 0, 0.25);
                border-color: rgba(168, 255, 0, 0.5);
                color: #7acc00;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(168, 255, 0, 0.3);
            }
            
            #modal-resumo-unificado .edit-btn-clean svg {
                width: 16px;
                height: 16px;
                stroke-width: 2;
            }
            
            /* Botão de fechar aprimorado */
            #modal-resumo-unificado .close-btn-clean {
                background: rgba(255, 255, 255, 0.08);
                border: 1px solid rgba(255, 255, 255, 0.15);
                color: #ccc;
                width: 40px;
                height: 40px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                cursor: pointer;
            }
            
            #modal-resumo-unificado .close-btn-clean:hover {
                background: rgba(255, 71, 87, 0.2);
                border-color: rgba(255, 71, 87, 0.4);
                color: #ff4757;
                transform: rotate(90deg) scale(1.1);
            }
            
            /* Animações */
            @keyframes fadeInOverlay {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slideInModal {
                from { 
                    opacity: 0;
                    transform: translateY(30px) scale(0.95);
                }
                to { 
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }
            
            @keyframes pulse {
                0%, 100% { transform: scale(1); opacity: 0.3; }
                50% { transform: scale(1.5); opacity: 0.1; }
            }
            
            @keyframes gradientRotate {
                0% { filter: hue-rotate(0deg); }
                100% { filter: hue-rotate(360deg); }
            }
            
            /* Responsividade */
            @media (max-width: 768px) {
                .history-stats-grid-clean {
                    grid-template-columns: repeat(2, 1fr);
                }
                
                .exercise-details-clean {
                    grid-template-columns: 1fr;
                }
                
                .stat-value-clean {
                    font-size: 1.5rem;
                }
            }
        </style>
    `;

  // Inserir modal e estilos
  document.body.insertAdjacentHTML('beforeend', modal);
  document.body.insertAdjacentHTML('beforeend', styles);
}

// Fechar modal unificado
window.fecharModalResumoUnificado = function (event) {
  if (!event || event.target.classList.contains('modal-overlay-clean')) {
    const modal = document.getElementById('modal-resumo-unificado');
    if (modal) {
      modal.remove();
    }
  }
};

// Mostrar modal de resumo do treino planejado
function mostrarModalResumoPlanejado(treinoPlanejado, dayIndex) {
  console.log('[mostrarModalResumoPlanejado] Exibindo resumo:', treinoPlanejado);

  const { tipo, data, exercicios } = treinoPlanejado;
  const dayName = DIAS_SEMANA[dayIndex];
  const dataFormatada = data.toLocaleDateString('pt-BR');

  // Carregar CSS do modal enhanced se não estiver carregado
  if (!document.querySelector('link[href*="modal-enhanced.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'modal-enhanced.css';
    document.head.appendChild(link);
  }

  // Se for folga ou cardio
  if (tipo === 'folga' || tipo === 'cardio') {
    const tipoFormatado = tipo === 'folga' ? 'Dia de Descanso' : 'Treino Cardiovascular';
    const tipoClass = tipo === 'folga' ? 'rest' : 'cardio';

    // Usar SVG para cardio
    const iconHTML =
      tipo === 'cardio'
        ? `<div class="modal-muscle-icon-wrapper">
                  <img src="/SVG_MUSCLE/cardio.svg" class="modal-muscle-icon" alt="Cardio">
               </div>`
        : '<div class="empty-icon">😴</div>';

    const modal = `
            <div id="modal-resumo" class="modal-overlay-clean" onclick="fecharModalResumo(event)">
                <div class="modal-content-clean workout-summary-modal" onclick="event.stopPropagation()">
                    <div class="modal-header-clean ${tipoClass}">
                        <div class="workout-history-header-clean">
                            <div class="history-title-section-clean">
                                <h2 class="modal-title-clean" data-text="${tipoFormatado}">${tipoFormatado}</h2>
                                <div class="history-subtitle-clean">
                                    <span class="day-badge-clean">${dayName}</span>
                                    <span class="separator" style="color: #666;">•</span>
                                    <span class="date-clean">${dataFormatada}</span>
                                </div>
                            </div>
                            <button class="btn-close-clean" onclick="fecharModalResumo()">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                    <line x1="18" y1="6" x2="6" y2="18"/>
                                    <line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    
                    <div class="modal-body-clean">
                        <div class="empty-state-clean">
                            ${iconHTML}
                            <h3>${tipoFormatado}</h3>
                            <p>${tipo === 'folga' ? 'Aproveite para descansar e se recuperar!' : 'Escolha sua atividade cardiovascular preferida.'}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

    document.body.insertAdjacentHTML('beforeend', modal);

    // Importar estilos do cleanModal se ainda não carregados
    if (!document.querySelector('style[data-modal-styles="clean"]')) {
      import('../components/cleanModal.js');
    }
    return;
  }

  // Modal para treino com exercícios
  const totalExercicios = exercicios.length;
  const totalSeries = exercicios.reduce((total, ex) => total + (ex.series || 3), 0);

  const exerciciosHTML = exercicios
    .map((ex) => {
      const exercicio = ex.exercicios || {};
      return `
            <div class="exercise-planned-item">
                <div class="exercise-header">
                    <div class="exercise-info">
                        <h4 class="exercise-name">${exercicio.nome || 'Exercício'}</h4>
                        <span class="exercise-muscle">${exercicio.grupo_muscular || tipo}${exercicio.equipamento ? ' • ' + exercicio.equipamento : ''}</span>
                    </div>
                    <div class="exercise-status planned">
                        <span>Planejado</span>
                    </div>
                </div>
                
                <div class="exercise-details">
                    <div class="detail-item">
                        <span class="detail-label">Séries:</span>
                        <span class="detail-value">${ex.series || 3}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Repetições:</span>
                        <span class="detail-value">${ex.repeticoes_alvo || 10}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Descanso:</span>
                        <span class="detail-value">${ex.tempo_descanso || 60}s</span>
                    </div>
                </div>
                
                ${
                  ex.observacoes
                    ? `
                    <div class="exercise-notes">
                        <span class="notes-icon">💡</span>
                        <span>${ex.observacoes}</span>
                    </div>
                `
                    : ''
                }
            </div>
        `;
    })
    .join('');

  // Obter SVG do grupo muscular
  const muscleIconHTML = getMuscleGroupSVG(tipo);

  const modal = `
        <div id="modal-resumo" class="modal-overlay-clean" onclick="fecharModalResumo(event)">
            <div class="modal-content-clean workout-summary-modal" onclick="event.stopPropagation()">
                <div class="modal-header-clean">
                    <div class="workout-history-header-clean">
                        <div class="history-title-section-clean">
                            <h2 class="modal-title-clean" data-text="Treino ${tipo}">Treino ${tipo}</h2>
                            <div class="history-subtitle-clean">
                                <span class="day-badge-clean">${dayName}</span>
                                <span class="separator" style="color: #666;">•</span>
                                <span class="date-clean">${dataFormatada}</span>
                                <span class="separator" style="color: #666;">•</span>
                                <span class="muscle-badge-clean">${tipo}</span>
                            </div>
                        </div>
                        <button class="btn-close-clean" onclick="fecharModalResumo()">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div class="modal-body-clean">
                    <!-- Ícone do grupo muscular -->
                    <div class="modal-muscle-icon-wrapper">
                        ${muscleIconHTML}
                    </div>
                    
                    <div class="workout-summary-stats">
                        <div class="stat-card">
                            <span class="stat-value">${totalExercicios}</span>
                            <span class="stat-label">Exercícios</span>
                        </div>
                        <div class="stat-card">
                            <span class="stat-value">${totalSeries}</span>
                            <span class="stat-label">Séries Totais</span>
                        </div>
                        <div class="stat-card">
                            <span class="stat-value">${Math.round(totalSeries * 2.5)}</span>
                            <span class="stat-label">Min. Estimado</span>
                        </div>
                    </div>
                    
                    <div class="exercises-planned-list">
                        ${exerciciosHTML}
                    </div>
                </div>
            </div>
        </div>
        
        <style>
            /* Modal overlay e conteúdo com glassmorphism */
            #modal-resumo.modal-overlay-clean {
                animation: fadeInOverlay 0.3s ease-out;
                background: rgba(0, 0, 0, 0.85);
                backdrop-filter: blur(10px);
            }
            
            #modal-resumo .modal-content-clean {
                background: linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 100%);
                border: 1px solid rgba(255, 255, 255, 0.1);
                box-shadow: 
                    0 20px 60px rgba(0, 0, 0, 0.5),
                    0 0 100px rgba(33, 150, 243, 0.05),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1);
                animation: slideInModal 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            
            /* Empty state aprimorado */
            .empty-state-clean {
                text-align: center;
                padding: 60px 20px;
                animation: fadeIn 0.6s ease-out;
            }
            
            .empty-icon {
                font-size: 5rem;
                margin-bottom: 20px;
                filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.3));
                animation: bounceIn 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            }
            
            .empty-state-clean h3 {
                color: #fff;
                font-size: 1.8rem;
                font-weight: 700;
                margin-bottom: 12px;
                background: linear-gradient(135deg, #ffffff 0%, #cccccc 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
            
            .empty-state-clean p {
                color: #999;
                font-size: 1.1rem;
                line-height: 1.6;
            }
            
            /* Badge de músculo aprimorado */
            .muscle-badge-clean {
                background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
                color: white;
                padding: 6px 16px;
                border-radius: 20px;
                font-size: 0.75rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                box-shadow: 
                    0 4px 15px rgba(33, 150, 243, 0.3),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2);
                transition: all 0.3s ease;
            }
            
            .muscle-badge-clean:hover {
                transform: translateY(-2px);
                box-shadow: 
                    0 6px 20px rgba(33, 150, 243, 0.4),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2);
            }
            
            /* Grid de estatísticas aprimorado */
            .workout-summary-stats {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 20px;
                margin-bottom: 32px;
            }
            
            .stat-card {
                background: rgba(255, 255, 255, 0.03);
                backdrop-filter: blur(10px);
                padding: 24px;
                border-radius: 16px;
                text-align: center;
                border: 1px solid rgba(255, 255, 255, 0.1);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
                overflow: hidden;
            }
            
            .stat-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: linear-gradient(90deg, transparent, #2196f3, transparent);
                transform: translateX(-100%);
                transition: transform 0.6s ease;
            }
            
            .stat-card:hover {
                transform: translateY(-6px);
                border-color: rgba(33, 150, 243, 0.3);
                box-shadow: 
                    0 16px 40px rgba(0, 0, 0, 0.3),
                    0 0 30px rgba(33, 150, 243, 0.1);
            }
            
            .stat-card:hover::before {
                transform: translateX(100%);
            }
            
            .stat-value {
                display: block;
                font-size: 2.2rem;
                font-weight: 800;
                background: linear-gradient(135deg, #2196f3 0%, #64b5f6 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                margin-bottom: 8px;
                letter-spacing: -1px;
            }
            
            .stat-label {
                font-size: 0.85rem;
                color: #888;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                font-weight: 600;
            }
            
            /* Lista de exercícios planejados */
            .exercises-planned-list {
                display: flex;
                flex-direction: column;
                gap: 20px;
            }
            
            .exercise-planned-item {
                background: rgba(255, 255, 255, 0.03);
                backdrop-filter: blur(10px);
                border-radius: 16px;
                padding: 24px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
                overflow: hidden;
            }
            
            .exercise-planned-item::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 0;
                height: 0;
                background: radial-gradient(circle, rgba(33, 150, 243, 0.1) 0%, transparent 70%);
                transition: all 0.5s ease;
                transform: translate(-50%, -50%);
            }
            
            .exercise-planned-item:hover {
                border-color: rgba(33, 150, 243, 0.3);
                transform: translateY(-4px);
                box-shadow: 
                    0 12px 32px rgba(0, 0, 0, 0.3),
                    0 0 40px rgba(33, 150, 243, 0.08);
            }
            
            .exercise-planned-item:hover::after {
                width: 300px;
                height: 300px;
            }
            
            /* Cabeçalho do exercício */
            .exercise-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 20px;
                gap: 16px;
            }
            
            .exercise-info {
                flex: 1;
            }
            
            .exercise-name {
                color: #fff;
                font-size: 1.2rem;
                font-weight: 700;
                margin: 0 0 8px 0;
                letter-spacing: -0.3px;
            }
            
            .exercise-muscle {
                color: #888;
                font-size: 0.9rem;
                font-weight: 500;
            }
            
            .exercise-status {
                background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
                color: white;
                padding: 6px 14px;
                border-radius: 16px;
                font-size: 0.8rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
            }
            
            /* Detalhes do exercício */
            .exercise-details {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 16px;
                margin-bottom: 16px;
            }
            
            .detail-item {
                background: rgba(255, 255, 255, 0.02);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 12px;
                padding: 16px;
                text-align: center;
                transition: all 0.2s ease;
            }
            
            .detail-item:hover {
                background: rgba(255, 255, 255, 0.04);
                border-color: rgba(33, 150, 243, 0.2);
                transform: translateY(-2px);
            }
            
            .detail-label {
                color: #888;
                font-size: 0.75rem;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                display: block;
                margin-bottom: 6px;
            }
            
            .detail-value {
                color: #fff;
                font-size: 1.3rem;
                font-weight: 700;
                display: block;
            }
            
            /* Notas do exercício */
            .exercise-notes {
                background: rgba(255, 193, 7, 0.1);
                border: 1px solid rgba(255, 193, 7, 0.2);
                border-radius: 12px;
                padding: 12px 16px;
                display: flex;
                align-items: center;
                gap: 12px;
                color: #ffc107;
                font-size: 0.9rem;
                line-height: 1.5;
            }
            
            .notes-icon {
                font-size: 1.2rem;
                filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
            }
            
            /* Botão de fechar aprimorado */
            #modal-resumo .btn-close-clean {
                background: rgba(255, 255, 255, 0.08);
                border: 1px solid rgba(255, 255, 255, 0.15);
                color: #ccc;
                width: 40px;
                height: 40px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                cursor: pointer;
            }
            
            #modal-resumo .btn-close-clean:hover {
                background: rgba(255, 71, 87, 0.2);
                border-color: rgba(255, 71, 87, 0.4);
                color: #ff4757;
                transform: rotate(90deg) scale(1.1);
            }
            
            /* Animações */
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes bounceIn {
                0% { transform: scale(0.3); opacity: 0; }
                50% { transform: scale(1.05); }
                70% { transform: scale(0.9); }
                100% { transform: scale(1); opacity: 1; }
            }
            
            /* Responsividade */
            @media (max-width: 768px) {
                .workout-summary-stats {
                    grid-template-columns: 1fr;
                    gap: 16px;
                }
                
                .exercise-details {
                    grid-template-columns: 1fr;
                    gap: 12px;
                }
                
                .stat-value {
                    font-size: 1.8rem;
                }
                
                .exercise-header {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 12px;
                }
            }
            
            .exercise-details {
                display: flex;
                gap: 24px;
                margin-top: 16px;
                padding-top: 16px;
                border-top: 1px solid var(--border-color);
            }
            
            .detail-item {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            
            .detail-label {
                font-size: 0.75rem;
                color: var(--text-secondary);
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
            
            .detail-value {
                font-size: 1.125rem;
                font-weight: 600;
                color: var(--text-primary);
            }
            
            .exercise-notes {
                margin-top: 16px;
                padding: 12px;
                background: var(--bg-primary);
                border-radius: var(--radius-sm);
                display: flex;
                gap: 8px;
                align-items: flex-start;
                font-size: 0.875rem;
                color: var(--text-secondary);
            }
            
            .notes-icon {
                flex-shrink: 0;
            }
            
            .exercise-status.planned {
                background: var(--bg-secondary);
                color: var(--text-secondary);
            }
        </style>
    `;

  document.body.insertAdjacentHTML('beforeend', modal);

  // Importar estilos do cleanModal se ainda não carregados
  if (!document.querySelector('style[data-modal-styles="clean"]')) {
    import('../components/cleanModal.js');
  }
}

// Fechar modal de resumo
window.fecharModalResumo = function (event) {
  if (event && event.target !== event.currentTarget) return;

  const modal = document.getElementById('modal-resumo');
  if (modal) {
    modal.style.animation = 'fadeOut 0.3s ease-out forwards';
    setTimeout(() => {
      modal.remove();
    }, 300);
  }
};

// Adicionar animação de fadeOut se não existir
if (!document.querySelector('style[data-fadeout-animation]')) {
  const fadeOutStyle = `
        <style data-fadeout-animation>
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        </style>
    `;
  document.head.insertAdjacentHTML('beforeend', fadeOutStyle);
}

// Função auxiliar para obter número da semana
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

// Buscar histórico de treino específico (nova versão com treino_executado)
async function buscarHistoricoTreino(userId, dayIndex) {
  try {
    // Usar a semana que está sendo exibida, não a semana atual
    const semanaExibida = dadosGlobaisCache.semanaExibida || dadosGlobaisCache.dados?.semanaAtual;
    const anoAtual = new Date().getFullYear();

    // Calcular data da semana sendo visualizada
    const hoje = new Date();
    const semanaAtual = WeeklyPlanService.getWeekNumber(hoje);
    const diferencaSemanas = semanaExibida - semanaAtual;

    const dataBase = new Date(hoje.getTime() + diferencaSemanas * 7 * 24 * 60 * 60 * 1000);
    // Calcular corretamente a data alvo baseada no dia da semana
    const diasParaAjustar = dayIndex - dataBase.getDay();
    const dataAlvo = new Date(dataBase.getTime() + diasParaAjustar * 24 * 60 * 60 * 1000);
    const dataAlvoStr = dataAlvo.toISOString().split('T')[0];

    console.log(`[buscarHistoricoTreino] Buscando treino para dia ${dayIndex} (${dataAlvoStr})`);

    // DESATIVADO: Busca na nova tabela treino_executado (tabela inexistente)
    // const sessaoResult = await TreinoExecutadoService.buscarSessaoPorData(userId, dataAlvoStr);
    // if (sessaoResult.success && sessaoResult.data.length > 0) {
    //     const sessao = sessaoResult.data[0]; // Primeira sessão do dia
    //     console.log('[buscarHistoricoTreino] ✅ Sessão encontrada na nova estrutura:', sessao);
    //     return {
    //         sessao,
    //         execucoes: sessao.execucao_exercicio_usuario || [],
    //         exerciciosSugeridos: [], // TODO: buscar do protocolo se necessário
    //         dayIndex,
    //         data_treino: dataAlvo,
    //         fonte: 'treino_executado'
    //     };
    // }

    // Primeiro, buscar qual grupo muscular foi planejado para este dia
    const grupoMuscularPlanejado = await buscarGrupoMuscularPlanejado(userId, dataAlvo);
    console.log('[buscarHistoricoTreino] Grupo muscular planejado:', grupoMuscularPlanejado);

    // Buscar usando a view otimizada
    console.log('[buscarHistoricoTreino] Buscando dados na view otimizada...');

    const { TreinoViewService } = await import('../services/treinoViewService.js');

    // Primeiro tenta com o grupo planejado, depois sem filtro se não encontrar
    let resultadoView = await TreinoViewService.buscarTreinoPorData(
      userId,
      dataAlvoStr,
      grupoMuscularPlanejado
    );
    console.log('[buscarHistoricoTreino] Resultado da busca com grupo específico:', {
      success: resultadoView.success,
      hasData: !!resultadoView.data,
      grupoUsado: grupoMuscularPlanejado,
    });

    // Se não encontrou com grupo específico E há grupo planejado, tenta sem filtro
    if ((!resultadoView.success || !resultadoView.data) && grupoMuscularPlanejado) {
      console.log(
        '[buscarHistoricoTreino] Não encontrado com grupo específico, tentando busca geral...'
      );
      resultadoView = await TreinoViewService.buscarTreinoPorData(userId, dataAlvoStr, null);
      console.log('[buscarHistoricoTreino] Resultado da busca geral:', {
        success: resultadoView.success,
        hasData: !!resultadoView.data,
      });
    }

    // Se ainda não encontrou e não havia grupo planejado, tenta busca geral
    if ((!resultadoView.success || !resultadoView.data) && !grupoMuscularPlanejado) {
      console.log('[buscarHistoricoTreino] Tentando busca geral sem grupo planejado...');
      resultadoView = await TreinoViewService.buscarTreinoPorData(userId, dataAlvoStr, null);
      console.log('[buscarHistoricoTreino] Resultado final da busca geral:', {
        success: resultadoView.success,
        hasData: !!resultadoView.data,
      });
    }

    if (resultadoView.success && resultadoView.data) {
      console.log('[buscarHistoricoTreino] ✅ Dados encontrados na view:', resultadoView.data);

      // Verificar se há múltiplos grupos musculares
      if (resultadoView.data.multiplos_grupos) {
        console.log('[buscarHistoricoTreino] ⚠️ Múltiplos grupos encontrados, mostrando seletor');
        return {
          multiplos_grupos: true,
          grupos_disponiveis: resultadoView.data.grupos,
          data_treino: dataAlvo,
          dayIndex,
          fonte: 'view_otimizada_multiplos',
        };
      }

      return {
        sessao: {
          data_treino: resultadoView.data.data_treino,
          grupo_muscular: resultadoView.data.grupo_muscular,
          metricas: resultadoView.data.metricas,
          protocolo_treino_id: resultadoView.data.planejamento.protocolo_id,
        },
        execucoes: resultadoView.data.exercicios.flatMap((ex) =>
          ex.series.map((serie) => ({
            exercicio_id: ex.exercicio_id,
            exercicios: {
              nome: ex.nome,
              grupo_muscular: ex.grupo_muscular,
              tipo_atividade: ex.grupo_muscular,
            },
            serie_numero: serie.serie_numero,
            peso_utilizado: serie.peso,
            repeticoes: serie.repeticoes,
            falhou: serie.falhou,
            volume_serie: serie.volume,
            rm_estimado: serie.rm_estimado,
            intensidade_percentual: serie.intensidade,
          }))
        ),
        exerciciosSugeridos: [],
        dayIndex,
        data_treino: dataAlvo,
        fonte: 'view_otimizada',
        metricas_avancadas: resultadoView.data.metricas,
        grupo_planejado: grupoMuscularPlanejado,
      };
    }

    // Fallback: tentar busca direta mais simples se view falhou
    console.log('[buscarHistoricoTreino] View não retornou dados, tentando busca direta...');

    try {
      const { data: execucoesDiretas, error: errorDireto } = await supabase
        .from('execucao_exercicio_usuario')
        .select(
          'id, usuario_id, exercicio_id, data_execucao, peso_utilizado, repeticoes, serie_numero, falhou'
        )
        .eq('usuario_id', userId)
        .gte('data_execucao', dataAlvoStr + 'T00:00:00')
        .lt('data_execucao', dataAlvoStr + 'T23:59:59');

      if (errorDireto) {
        console.error('[buscarHistoricoTreino] Erro na busca direta:', errorDireto);
      } else if (execucoesDiretas && execucoesDiretas.length > 0) {
        console.log(
          '[buscarHistoricoTreino] ✅ Encontradas execuções diretas:',
          execucoesDiretas.length
        );

        // Buscar detalhes dos exercícios separadamente
        const exercicioIds = [...new Set(execucoesDiretas.map((e) => e.exercicio_id))];
        const { data: exerciciosDetalhes } = await supabase
          .from('exercicios')
          .select('id, nome, grupo_muscular')
          .in('id', exercicioIds);

        // Mapear exercícios
        const exerciciosMap = {};
        (exerciciosDetalhes || []).forEach((ex) => {
          exerciciosMap[ex.id] = ex;
        });

        // Combinar dados
        const execucoesCompletas = execucoesDiretas.map((exec) => ({
          ...exec,
          exercicios: exerciciosMap[exec.exercicio_id] || {
            nome: 'Exercício desconhecido',
            grupo_muscular: 'Geral',
          },
        }));

        return {
          execucoes: execucoesCompletas,
          exerciciosSugeridos: [],
          dayIndex,
          data_treino: dataAlvo,
          fonte: 'busca_direta',
        };
      }
    } catch (errorFallback) {
      console.error('[buscarHistoricoTreino] Erro no fallback:', errorFallback);
    }

    // Se não há execuções, verificar se há planejamento para mostrar
    const grupoMuscularPlanejadoFinal = await buscarGrupoMuscularPlanejado(userId, dataAlvo);

    if (grupoMuscularPlanejadoFinal) {
      console.log('[buscarHistoricoTreino] 📋 Buscando exercícios sugeridos para planejamento');

      // Buscar exercícios sugeridos do protocolo para este dia
      let exerciciosSugeridosProtocolo = [];
      try {
        // Passar a semana exibida para buscar exercícios corretos
        const exerciciosResult = await buscarExerciciosTreinoDia(userId, dataAlvo, semanaExibida);
        if (exerciciosResult?.data && exerciciosResult.data.length > 0) {
          exerciciosSugeridosProtocolo = exerciciosResult.data;
          console.log(
            '[buscarHistoricoTreino] ✅ Exercícios sugeridos encontrados:',
            exerciciosSugeridosProtocolo.length
          );
        }
      } catch (errorExercicios) {
        console.warn(
          '[buscarHistoricoTreino] ⚠️ Erro ao buscar exercícios sugeridos:',
          errorExercicios
        );
      }

      console.log('[buscarHistoricoTreino] 📋 Retornando dados do planejamento sem execuções');
      return {
        planejamento: {
          tipo_atividade: grupoMuscularPlanejadoFinal,
          data: dataAlvoStr,
        },
        execucoes: [],
        exerciciosSugeridos: exerciciosSugeridosProtocolo,
        dayIndex,
        data_treino: dataAlvo,
        fonte: 'planejamento_apenas',
        semExecucoes: true,
      };
    }

    console.log('[buscarHistoricoTreino] ❌ Nenhum treino encontrado para este dia');
    return null;
  } catch (error) {
    console.error('[buscarHistoricoTreino] Erro:', error);
    throw error;
  }
}

// Mostrar seletor quando há múltiplos grupos musculares no mesmo dia
function mostrarSeletorGrupoMuscular(historico, dayIndex) {
  const dayName = DIAS_SEMANA[dayIndex];
  const dataFormatada = historico.data_treino.toLocaleDateString('pt-BR');

  const modalHTML = `
        <div id="modal-seletor-grupo" class="modal-overlay" onclick="fecharModalSeletorGrupo(event)" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            backdrop-filter: blur(10px);
            animation: fadeIn 0.3s ease-out;
        ">
            <div class="modal-content" onclick="event.stopPropagation()" style="
                background: linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 100%);
                border-radius: 24px;
                max-width: 600px;
                width: 90%;
                box-shadow: 
                    0 25px 60px rgba(0, 0, 0, 0.6),
                    0 0 100px rgba(168, 255, 0, 0.05),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.1);
                animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            ">
                <div class="modal-header" style="
                    padding: 28px;
                    background: linear-gradient(135deg, rgba(168, 255, 0, 0.08) 0%, transparent 70%);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    position: relative;
                ">
                    <h3 style="
                        margin: 0 0 8px 0;
                        font-size: 1.6rem;
                        font-weight: 700;
                        background: linear-gradient(135deg, #ffffff 0%, #cccccc 100%);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        letter-spacing: -0.5px;
                    ">🏋️ Múltiplos Treinos - ${dayName}</h3>
                    <span class="modal-date" style="
                        color: #999;
                        font-size: 0.95rem;
                        font-weight: 500;
                    ">${dataFormatada}</span>
                    <button class="modal-close" onclick="fecharModalSeletorGrupo()" style="
                        position: absolute;
                        top: 20px;
                        right: 20px;
                        background: rgba(255, 255, 255, 0.08);
                        border: 1px solid rgba(255, 255, 255, 0.15);
                        color: #ccc;
                        width: 40px;
                        height: 40px;
                        border-radius: 12px;
                        font-size: 24px;
                        cursor: pointer;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">&times;</button>
                </div>
                
                <div class="modal-body" style="
                    padding: 32px;
                ">
                    <p class="selector-message" style="
                        color: #ccc;
                        font-size: 1.05rem;
                        line-height: 1.6;
                        margin-bottom: 28px;
                        text-align: center;
                    ">
                        Foram encontrados treinos de múltiplos grupos musculares neste dia. 
                        Selecione qual grupo você deseja visualizar:
                    </p>
                    
                    <div class="grupos-selector" style="
                        display: grid;
                        gap: 16px;
                    ">
                        ${historico.grupos_disponiveis
                          .map(
                            (grupo) => `
                            <button class="grupo-btn" onclick="selecionarGrupoMuscular('${grupo.grupo_muscular}', ${dayIndex})" style="
                                background: rgba(255, 255, 255, 0.03);
                                backdrop-filter: blur(10px);
                                border: 1px solid rgba(255, 255, 255, 0.1);
                                border-radius: 16px;
                                padding: 20px;
                                cursor: pointer;
                                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                                text-align: left;
                                width: 100%;
                                position: relative;
                                overflow: hidden;
                            ">
                                <div class="grupo-info">
                                    <span class="grupo-nome" style="
                                        display: block;
                                        font-size: 1.3rem;
                                        font-weight: 700;
                                        color: #fff;
                                        margin-bottom: 12px;
                                        background: linear-gradient(135deg, #a8ff00 0%, #7acc00 100%);
                                        -webkit-background-clip: text;
                                        -webkit-text-fill-color: transparent;
                                    ">${grupo.grupo_muscular}</span>
                                    <div class="grupo-stats" style="
                                        display: flex;
                                        gap: 20px;
                                        flex-wrap: wrap;
                                    ">
                                        <span style="
                                            background: rgba(168, 255, 0, 0.1);
                                            border: 1px solid rgba(168, 255, 0, 0.2);
                                            padding: 6px 12px;
                                            border-radius: 8px;
                                            font-size: 0.9rem;
                                            color: #a8ff00;
                                            font-weight: 600;
                                        ">${grupo.total_execucoes} séries</span>
                                        <span style="
                                            background: rgba(33, 150, 243, 0.1);
                                            border: 1px solid rgba(33, 150, 243, 0.2);
                                            padding: 6px 12px;
                                            border-radius: 8px;
                                            font-size: 0.9rem;
                                            color: #2196f3;
                                            font-weight: 600;
                                        ">${grupo.exercicios.length} exercícios</span>
                                        <span style="
                                            background: rgba(255, 152, 0, 0.1);
                                            border: 1px solid rgba(255, 152, 0, 0.2);
                                            padding: 6px 12px;
                                            border-radius: 8px;
                                            font-size: 0.9rem;
                                            color: #ff9800;
                                            font-weight: 600;
                                        ">${Math.round(grupo.metricas.volume_total)}kg volume</span>
                                    </div>
                                </div>
                            </button>
                        `
                          )
                          .join('')}
                    </div>
                </div>
            </div>
        </div>
        
        <style>
            #modal-seletor-grupo .modal-close:hover {
                background: rgba(255, 71, 87, 0.2) !important;
                border-color: rgba(255, 71, 87, 0.4) !important;
                color: #ff4757 !important;
                transform: rotate(90deg) scale(1.1) !important;
            }
            
            #modal-seletor-grupo .grupo-btn:hover {
                transform: translateY(-4px) !important;
                border-color: rgba(168, 255, 0, 0.3) !important;
                box-shadow: 
                    0 12px 32px rgba(0, 0, 0, 0.3),
                    0 0 40px rgba(168, 255, 0, 0.08) !important;
            }
            
            #modal-seletor-grupo .grupo-btn::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: linear-gradient(90deg, transparent, #a8ff00, transparent);
                transform: translateX(-100%);
                transition: transform 0.6s ease;
            }
            
            #modal-seletor-grupo .grupo-btn:hover::before {
                transform: translateX(100%);
            }
        </style>
    `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Selecionar grupo muscular específico
async function selecionarGrupoMuscular(grupoMuscular, dayIndex) {
  try {
    fecharModalSeletorGrupo();
    showNotification(`Carregando treino de ${grupoMuscular}...`, 'info');

    // Buscar apenas o grupo selecionado
    const historico = await buscarHistoricoTreino(currentUser.id, dayIndex);

    // Buscar especificamente esse grupo
    const { TreinoViewService } = await import('../services/treinoViewService.js');
    const hoje = new Date();
    const dataAlvo = new Date(
      hoje.getFullYear(),
      hoje.getMonth(),
      hoje.getDate() - (hoje.getDay() - dayIndex)
    );
    const dataAlvoStr = dataAlvo.toISOString().split('T')[0];

    const resultadoEspecifico = await TreinoViewService.buscarTreinoPorData(
      currentUser.id,
      dataAlvoStr,
      grupoMuscular
    );

    if (resultadoEspecifico.success && resultadoEspecifico.data) {
      const historicoEspecifico = {
        sessao: {
          data_treino: resultadoEspecifico.data.data_treino,
          grupo_muscular: resultadoEspecifico.data.grupo_muscular,
          metricas: resultadoEspecifico.data.metricas,
        },
        execucoes: resultadoEspecifico.data.exercicios.flatMap((ex) =>
          ex.series.map((serie) => ({
            exercicio_id: ex.exercicio_id,
            exercicios: {
              nome: ex.nome,
              grupo_muscular: ex.grupo_muscular,
              tipo_atividade: ex.grupo_muscular,
            },
            serie_numero: serie.serie_numero,
            peso_utilizado: serie.peso,
            repeticoes: serie.repeticoes,
            falhou: serie.falhou,
            volume_serie: serie.volume,
          }))
        ),
        dayIndex,
        data_treino: dataAlvo,
        fonte: 'view_grupo_especifico',
      };

      mostrarModalHistorico(historicoEspecifico, dayIndex);
    } else {
      showNotification('Erro ao carregar treino específico', 'error');
    }
  } catch (error) {
    console.error('[selecionarGrupoMuscular] Erro:', error);
    showNotification('Erro ao carregar treino específico', 'error');
  }
}

// Fechar modal do seletor
function fecharModalSeletorGrupo(event) {
  if (event && event.target !== event.currentTarget) return;
  const modal = document.getElementById('modal-seletor-grupo');
  if (modal) modal.remove();
}

// Mostrar modal com histórico do treino - VERSÃO COMPACTA E RESPONSIVA
function mostrarModalHistorico(historico, dayIndex) {
  console.log('[mostrarModalHistorico] 🚀 Iniciando função com:', { historico, dayIndex });
  const dayName = DIAS_SEMANA[dayIndex];
  const dataFormatada = historico.data_treino.toLocaleDateString('pt-BR');

  // Verificar se é apenas planejamento (sem execuções)
  const somenteplanejamento =
    historico.semExecucoes || (historico.execucoes && historico.execucoes.length === 0);

  // Preparar dados dos exercícios
  const exercicios = historico.exerciciosSugeridos || [];
  console.log('[mostrarModalHistorico] 📋 Exercícios encontrados:', exercicios.length);

  // Determinar o grupo muscular principal
  const grupoMuscular = historico.planejamento?.tipo_atividade || 'Treino';

  // Criar HTML do modal compacto
  const modalHTML = `
        <div id="modal-historico" class="workout-history-modal-overlay">
            <div class="workout-history-modal">
                <!-- Header -->
                <div class="workout-history-header">
                    <div class="header-info">
                        <h3 class="workout-title">${grupoMuscular}</h3>
                        <div class="workout-date">${dayName} • ${dataFormatada}</div>
                        <div class="workout-status ${somenteplanejamento ? 'planned' : 'completed'}">
                            ${somenteplanejamento ? '📅 Planejado' : '✅ Executado'}
                        </div>
                    </div>
                    <button class="workout-close-btn" onclick="fecharModalHistorico()" type="button">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>
                
                <!-- Body -->
                <div class="workout-history-body">
                    ${
                      exercicios.length > 0
                        ? `
                        <div class="exercises-list">
                            ${exercicios
                              .map(
                                (ex, index) => `
                                <div class="exercise-card">
                                    <div class="exercise-header">
                                        <span class="exercise-number">${index + 1}</span>
                                        <div class="exercise-info">
                                            <h4 class="exercise-name">${ex.nome || ex.exercicio_nome || 'Exercício'}</h4>
                                            <span class="exercise-equipment">${ex.equipamento || ex.exercicio_equipamento || 'Livre'}</span>
                                        </div>
                                    </div>
                                    <div class="exercise-stats">
                                        <div class="stat-item">
                                            <span class="stat-value">${Math.round(ex.peso_calculado || ex.peso_base || 0)}</span>
                                            <span class="stat-label">kg</span>
                                        </div>
                                        <div class="stat-item">
                                            <span class="stat-value">${ex.repeticoes || ex.repeticoes_alvo || 0}</span>
                                            <span class="stat-label">reps</span>
                                        </div>
                                        <div class="stat-item">
                                            <span class="stat-value">${ex.series || 3}</span>
                                            <span class="stat-label">séries</span>
                                        </div>
                                        <div class="stat-item">
                                            <span class="stat-value">${Math.round((ex.descanso_sugerido || ex.tempo_descanso || 60) / 60)}</span>
                                            <span class="stat-label">min</span>
                                        </div>
                                    </div>
                                </div>
                            `
                              )
                              .join('')}
                        </div>
                    `
                        : `
                        <div class="no-exercises">
                            <div class="no-exercises-icon">📋</div>
                            <p>Nenhum exercício configurado para este dia</p>
                        </div>
                    `
                    }
                </div>
                
                <!-- Footer com ações -->
                <div class="workout-history-footer">
                    <button class="btn-secondary" onclick="fecharModalHistorico()">Fechar</button>
                    ${
                      somenteplanejamento
                        ? `
                        <button class="btn-primary" onclick="fecharModalHistorico(); window.abrirEdicaoRapidaDia(${dayIndex});">
                            Editar Treino
                        </button>
                    `
                        : ''
                    }
                </div>
            </div>
        </div>
    `;

  // Verificar se já existe um modal e removê-lo
  const modalExistente = document.getElementById('modal-historico');
  if (modalExistente) {
    modalExistente.remove();
  }

  // Adicionar modal ao DOM
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // Adicionar estilos CSS compactos
  if (!document.querySelector('style[data-modal-historico-styles]')) {
    const styles = `
            <style data-modal-historico-styles>
                .workout-history-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    padding: 16px;
                    animation: fadeIn 0.3s ease;
                    backdrop-filter: blur(4px);
                }
                
                .workout-history-modal {
                    background: var(--bg-card);
                    border-radius: 16px;
                    width: 100%;
                    max-width: 500px;
                    max-height: 85vh;
                    display: flex;
                    flex-direction: column;
                    border: 1px solid var(--border-color);
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                    animation: slideUp 0.3s ease-out;
                    overflow: hidden;
                }
                
                .workout-history-header {
                    background: var(--bg-secondary);
                    padding: 20px;
                    border-bottom: 1px solid var(--border-color);
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                }
                
                .workout-title {
                    margin: 0 0 8px 0;
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--text-primary);
                }
                
                .workout-date {
                    font-size: 0.875rem;
                    color: var(--text-secondary);
                    margin-bottom: 8px;
                }
                
                .workout-status {
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    display: inline-block;
                }
                
                .workout-status.planned {
                    background: var(--accent-blue);
                    color: white;
                }
                
                .workout-status.completed {
                    background: var(--accent-green);
                    color: white;
                }
                
                .workout-close-btn {
                    background: var(--bg-primary);
                    border: 1px solid var(--border-color);
                    border-radius: 50%;
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: var(--text-primary);
                    transition: all 0.2s ease;
                }
                
                .workout-close-btn:hover {
                    background: var(--bg-secondary);
                    transform: scale(1.05);
                }
                
                .workout-close-btn svg {
                    width: 18px;
                    height: 18px;
                }
                
                .workout-history-body {
                    flex: 1;
                    overflow-y: auto;
                    padding: 20px;
                }
                
                .exercises-list {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                
                .exercise-card {
                    background: var(--bg-secondary);
                    border-radius: 12px;
                    padding: 16px;
                    border: 1px solid var(--border-color);
                    transition: transform 0.2s ease;
                }
                
                .exercise-card:hover {
                    transform: translateY(-2px);
                }
                
                .exercise-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 12px;
                }
                
                .exercise-number {
                    background: var(--neon-primary);
                    color: var(--bg-primary);
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.875rem;
                    font-weight: 700;
                    flex-shrink: 0;
                }
                
                .exercise-name {
                    margin: 0 0 4px 0;
                    font-size: 1rem;
                    font-weight: 600;
                    color: var(--text-primary);
                }
                
                .exercise-equipment {
                    font-size: 0.8rem;
                    color: var(--text-secondary);
                    font-style: italic;
                }
                
                .exercise-stats {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 12px;
                }
                
                .stat-item {
                    text-align: center;
                    background: var(--bg-primary);
                    padding: 8px;
                    border-radius: 8px;
                }
                
                .stat-value {
                    display: block;
                    font-size: 1rem;
                    font-weight: 700;
                    color: var(--neon-primary);
                }
                
                .stat-label {
                    display: block;
                    font-size: 0.7rem;
                    color: var(--text-secondary);
                    text-transform: uppercase;
                    margin-top: 2px;
                }
                
                .no-exercises {
                    text-align: center;
                    padding: 40px 20px;
                    color: var(--text-secondary);
                }
                
                .no-exercises-icon {
                    font-size: 3rem;
                    margin-bottom: 16px;
                }
                
                .workout-history-footer {
                    padding: 20px;
                    border-top: 1px solid var(--border-color);
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                }
                
                .btn-secondary, .btn-primary {
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border: none;
                }
                
                .btn-secondary {
                    background: var(--bg-secondary);
                    color: var(--text-primary);
                    border: 1px solid var(--border-color);
                }
                
                .btn-primary {
                    background: var(--neon-primary);
                    color: var(--bg-primary);
                }
                
                .btn-secondary:hover {
                    background: var(--bg-primary);
                }
                
                .btn-primary:hover {
                    opacity: 0.9;
                    transform: translateY(-1px);
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes slideUp {
                    from { 
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @media (max-width: 480px) {
                    .workout-history-modal-overlay {
                        padding: 8px;
                        align-items: flex-end;
                    }
                    
                    .workout-history-modal {
                        max-height: 90vh;
                        border-radius: 16px 16px 0 0;
                    }
                    
                    .workout-history-header {
                        padding: 16px;
                    }
                    
                    .workout-title {
                        font-size: 1.25rem;
                    }
                    
                    .workout-history-body {
                        padding: 16px;
                    }
                    
                    .exercise-stats {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 8px;
                    }
                    
                    .workout-history-footer {
                        padding: 16px;
                        flex-direction: column;
                    }
                }
            </style>
        `;
    document.head.insertAdjacentHTML('beforeend', styles);
  }

  // Mostrar modal com animação
  requestAnimationFrame(() => {
    const modal = document.getElementById('modal-historico');
    if (modal) {
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }
  });
}

// Calcular estatísticas do treino
function calcularEstatisticasTreino(historico) {
  const { execucoes = [], exerciciosSugeridos = [] } = historico;

  // Verificar se há execuções para calcular
  if (!execucoes || execucoes.length === 0) {
    return {
      totalPeso: 0,
      totalExercicios: 0,
      duracaoEstimada: 0,
      performance: {
        percentual: 0,
        class: 'poor',
        icon: '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
      },
    };
  }

  // Total de peso levantado
  const totalPeso = execucoes.reduce((total, exec) => {
    return total + (exec.peso_utilizado || 0) * (exec.repeticoes || 0);
  }, 0);

  // Número de exercícios únicos
  const exerciciosUnicos = new Set(execucoes.map((e) => e.exercicio_id));
  const totalExercicios = exerciciosUnicos.size;

  // Duração estimada (aproximação: 3-4 min por série)
  const totalSeries = execucoes.length;
  const duracaoEstimada = Math.round(totalSeries * 3.5);

  // Performance vs sugerido
  const performance = {
    percentual: 100,
    class: 'good',
    icon: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
  };

  if (exerciciosSugeridos.length > 0) {
    const pesoSugerido = exerciciosSugeridos.reduce((total, sug) => {
      return total + (sug.peso_sugerido || 0) * (sug.repeticoes_sugeridas || 0) * (sug.series || 1);
    }, 0);

    if (pesoSugerido > 0) {
      const percentual = Math.round((totalPeso / pesoSugerido) * 100);
      performance.percentual = percentual;

      if (percentual >= 100) {
        performance.class = 'excellent';
        performance.icon =
          '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>';
      } else if (percentual >= 85) {
        performance.class = 'good';
        performance.icon =
          '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>';
      } else if (percentual >= 70) {
        performance.class = 'average';
        performance.icon =
          '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>';
      } else {
        performance.class = 'below';
        performance.icon =
          '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>';
      }
    }
  }

  return {
    totalPeso: totalPeso.toLocaleString('pt-BR'),
    totalExercicios,
    duracaoEstimada,
    performance,
  };
}

// Fechar modal de histórico - VERSÃO SIMPLIFICADA
function fecharModalHistorico(event) {
  if (event && event.target !== event.currentTarget) return;

  const modal = document.getElementById('modal-historico');
  if (modal) {
    // Restaurar scroll do body
    document.body.style.overflow = '';

    // Remover modal com animação
    modal.style.opacity = '0';
    setTimeout(() => {
      modal.remove();
    }, 300);
  }
}

// Tornar função global
window.fecharModalHistorico = fecharModalHistorico;

// Renderizar exercícios do histórico com resumo avançado
function renderizarExerciciosHistorico(historico) {
  const { execucoes = [], exerciciosSugeridos = [] } = historico;

  // Se não há execuções, retornar mensagem vazia
  if (!execucoes || execucoes.length === 0) {
    return '<div class="no-exercises">Nenhum exercício executado</div>';
  }

  // Agrupar execuções por exercício
  const exerciciosAgrupados = {};

  execucoes.forEach((exec) => {
    const exercicioId = exec.exercicio_id;
    if (!exerciciosAgrupados[exercicioId]) {
      exerciciosAgrupados[exercicioId] = {
        nome: exec.exercicios?.nome || 'Exercício',
        grupo_muscular: exec.exercicios?.grupo_muscular || 'Geral',
        equipamento: exec.exercicios?.equipamento || '',
        series: [],
        sugerido: exerciciosSugeridos.find((s) => s.exercicio_id === exercicioId),
        execucaoData: exec.data_execucao,
      };
    }

    exerciciosAgrupados[exercicioId].series.push({
      serie: exec.serie_numero || exerciciosAgrupados[exercicioId].series.length + 1,
      peso: exec.peso_utilizado || 0,
      reps: exec.repeticoes || 0,
      falhou: exec.falhou || false,
      timestamp: new Date(exec.data_execucao || Date.now()),
    });
  });

  // Renderizar HTML com resumo avançado
  return Object.values(exerciciosAgrupados)
    .map((exercicio) => {
      // Calcular métricas do exercício
      const totalPesoExercicio = exercicio.series.reduce(
        (total, serie) => total + serie.peso * serie.reps,
        0
      );

      const pesoMedio =
        exercicio.series.length > 0
          ? exercicio.series.reduce((total, serie) => total + serie.peso, 0) /
            exercicio.series.length
          : 0;

      const seriesCompletadas = exercicio.series.filter((s) => !s.falhou).length;
      const totalSeries = exercicio.series.length;

      // Calcular variação vs sugerido
      let variacaoPercent = 0;
      const pesoSugerido = exercicio.sugerido?.peso_sugerido || exercicio.sugerido?.peso_base || 0;
      if (pesoSugerido > 0 && pesoMedio > 0) {
        variacaoPercent = ((pesoMedio - pesoSugerido) / pesoSugerido) * 100;
      }

      // Calcular tempo estimado do exercício
      const tempoDescanso = exercicio.sugerido?.tempo_descanso || 60;
      const tempoExecucao = totalSeries * 45; // 45s por série
      const tempoDescansoTotal = Math.max(0, totalSeries - 1) * tempoDescanso;
      const tempoTotal = tempoExecucao + tempoDescansoTotal;
      const tempoMinutos = Math.floor(tempoTotal / 60);
      const tempoSegundos = tempoTotal % 60;

      // HTML das séries (colapsível)
      const seriesHTML = exercicio.series
        .map((serie) => {
          const statusClass = serie.falhou ? 'failed' : 'completed';
          const statusIcon = serie.falhou ? '❌' : '✅';

          return `
                <div class="serie-item ${statusClass}">
                    <span class="serie-numero">${serie.serie}ª</span>
                    <span class="serie-peso">${serie.peso}kg</span>
                    <span class="serie-reps">${serie.reps} reps</span>
                    <span class="serie-volume">${(serie.peso * serie.reps).toFixed(1)}kg</span>
                    <span class="serie-status">${statusIcon}</span>
                </div>
            `;
        })
        .join('');

      const exercicioId = `exercise-${Math.random().toString(36).substr(2, 9)}`;

      return `
            <div class="exercise-history-item">
                <div class="exercise-header">
                    <div class="exercise-info">
                        <h4 class="exercise-name">${exercicio.nome}</h4>
                        <span class="exercise-muscle">${exercicio.grupo_muscular}${exercicio.equipamento ? ' • ' + exercicio.equipamento : ''}</span>
                    </div>
                    <div class="exercise-status completed">
                        <span>Concluído</span>
                    </div>
                </div>
                
                <!-- Resumo das Métricas -->
                <div class="exercise-summary-metrics">
                    <div class="metric-card-small">
                        <div class="metric-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M9 12l2 2 4-4"/>
                                <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
                                <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
                                <path d="M3 12h6m6 0h6"/>
                            </svg>
                        </div>
                        <div class="metric-info">
                            <span class="metric-value">${totalPesoExercicio.toFixed(1)} kg</span>
                            <span class="metric-label">Carga Total</span>
                        </div>
                    </div>
                    
                    <div class="metric-card-small">
                        <div class="metric-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12 6 12 12 16 14"/>
                            </svg>
                        </div>
                        <div class="metric-info">
                            <span class="metric-value">${tempoMinutos}:${tempoSegundos.toString().padStart(2, '0')}</span>
                            <span class="metric-label">Tempo Total</span>
                        </div>
                    </div>
                    
                    <div class="metric-card-small">
                        <div class="metric-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                            </svg>
                        </div>
                        <div class="metric-info">
                            <span class="metric-value" style="color: ${variacaoPercent >= 0 ? 'var(--accent-green, #00ff57)' : 'var(--accent-red, #ff4444)'}">${variacaoPercent >= 0 ? '+' : ''}${variacaoPercent.toFixed(1)}%</span>
                            <span class="metric-label">vs Sugerido</span>
                        </div>
                    </div>
                    
                    <div class="metric-card-small">
                        <div class="metric-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                <line x1="12" y1="8" x2="12" y2="16"/>
                                <line x1="8" y1="12" x2="16" y2="12"/>
                            </svg>
                        </div>
                        <div class="metric-info">
                            <span class="metric-value">${seriesCompletadas}/${totalSeries}</span>
                            <span class="metric-label">Séries</span>
                        </div>
                    </div>
                </div>
                
                <!-- Detalhes das Séries (Colapsível) -->
                <div class="series-details-history">
                    <button class="series-toggle-history" onclick="toggleSeriesHistory('${exercicioId}')">
                        <span>Ver Detalhes das Séries</span>
                        <svg class="toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="6 9 12 15 18 9"/>
                        </svg>
                    </button>
                    
                    <div class="series-list-history collapsed" id="series-${exercicioId}">
                        <div class="series-list-header">
                            <span>Série</span>
                            <span>Peso</span>
                            <span>Reps</span>
                            <span>Volume</span>
                            <span>Status</span>
                        </div>
                        ${seriesHTML}
                        ${
                          pesoSugerido > 0
                            ? `
                            <div class="exercise-suggested-compact">
                                <span class="suggested-label">Sugerido:</span>
                                <span class="suggested-value">${pesoSugerido}kg × ${exercicio.sugerido?.repeticoes_sugeridas || exercicio.sugerido?.repeticoes_alvo || '?'} reps</span>
                            </div>
                        `
                            : ''
                        }
                    </div>
                </div>
            </div>
        `;
    })
    .join('');
}

// Função para toggle das séries históricas
window.toggleSeriesHistory = function (exercicioId) {
  const toggle = document.querySelector(`[onclick="toggleSeriesHistory('${exercicioId}')"]`);
  const seriesList = document.getElementById(`series-${exercicioId}`);

  if (seriesList && toggle) {
    const isCollapsed = seriesList.classList.contains('collapsed');

    if (isCollapsed) {
      seriesList.classList.remove('collapsed');
      toggle.classList.add('expanded');
      toggle.querySelector('span').textContent = 'Ocultar Detalhes das Séries';
    } else {
      seriesList.classList.add('collapsed');
      toggle.classList.remove('expanded');
      toggle.querySelector('span').textContent = 'Ver Detalhes das Séries';
    }
  }
};

// Fechar modal de histórico
window.fecharModalHistorico = function (event) {
  if (event && event.target !== event.currentTarget) return;

  const modal = document.getElementById('modal-historico');
  if (modal) {
    modal.classList.remove('show');
    // Restaurar scroll do body
    document.body.style.overflow = '';
    setTimeout(() => {
      modal.remove();
    }, 300);
  }
};

// ===== FUNÇÕES DE RENDERIZAÇÃO DE EXERCÍCIOS =====

// Renderizar lista de exercícios na interface
function renderizarExercicios(exercicios, planejamento, container) {
  if (!container) {
    console.error('[renderizarExercicios] Container não fornecido');
    return;
  }

  const tipoTreino = planejamento?.tipo_atividade || 'Treino';
  const numeroTreino = planejamento?.semana_referencia || '';

  let html = `
        <div class="exercises-header">
            <h4>${getActionIcon('weight')} ${tipoTreino} ${numeroTreino ? '- Treino ' + numeroTreino : ''}</h4>
            <p class="exercises-count">${exercicios.length} exercício${exercicios.length !== 1 ? 's' : ''}</p>
        </div>
        <div class="exercises-grid">
    `;

  exercicios.forEach((exercicio, index) => {
    html += `
            <div class="exercise-card" data-exercise-id="${exercicio.id}">
                <div class="exercise-header">
                    <div class="exercise-number">${index + 1}</div>
                    <div class="exercise-info">
                        <h5 class="exercise-name">${exercicio.nome}</h5>
                        <p class="exercise-muscle">${exercicio.grupo_muscular}</p>
                    </div>
                </div>
                
                <div class="exercise-details">
                    <div class="exercise-sets">
                        <span class="label">Séries:</span>
                        <span class="value">${exercicio.series}</span>
                    </div>
                    <div class="exercise-reps">
                        <span class="label">Repetições:</span>
                        <span class="value">${exercicio.repeticoes}</span>
                    </div>
                    <div class="exercise-weight">
                        <span class="label">Peso:</span>
                        <span class="value">${exercicio.peso_base}kg</span>
                        <span class="range">(${exercicio.peso_min}-${exercicio.peso_max}kg)</span>
                    </div>
                    <div class="exercise-rest">
                        <span class="label">Descanso:</span>
                        <span class="value">${exercicio.tempo_descanso}s</span>
                    </div>
                </div>
                
                ${
                  exercicio.equipamento
                    ? `
                    <div class="exercise-equipment">
                        <span class="equipment-tag">${exercicio.equipamento}</span>
                    </div>
                `
                    : ''
                }
            </div>
        `;
  });

  html += `
        </div>
        <div class="exercises-footer">
            <p class="rm-info">💡 Pesos baseados no seu 1RM atual</p>
        </div>
    `;

  container.innerHTML = html;

  console.log('[renderizarExercicios] ✅ Exercícios renderizados:', exercicios.length);

  // Atualizar grupos musculares na seção de preparação
  atualizarGruposMusculares(exercicios);
}

// Atualizar grupos musculares na seção de preparação
function atualizarGruposMusculares(exercicios) {
  const container = document.getElementById('muscle-groups');
  if (!container) {
    console.log('[atualizarGruposMusculares] Container muscle-groups não encontrado');
    return;
  }

  if (!exercicios || exercicios.length === 0) {
    container.innerHTML = '<div class="muscle-chip">Configure treino</div>';
    console.log('[atualizarGruposMusculares] Nenhum exercício encontrado');
    return;
  }

  // Extrair grupos musculares únicos dos exercícios
  const gruposSet = new Set();

  exercicios.forEach((exercicio) => {
    // Tentar diferentes campos que podem conter o grupo muscular
    const grupo =
      exercicio.grupo_muscular ||
      exercicio.exercicio_grupo ||
      exercicio.tipo_atividade ||
      exercicio.categoria;

    if (grupo && grupo.trim() !== '' && grupo !== 'folga' && grupo !== 'cardio') {
      gruposSet.add(grupo.toLowerCase().trim());
    }
  });

  const gruposMusculares = Array.from(gruposSet);

  if (gruposMusculares.length === 0) {
    container.innerHTML = '<div class="muscle-chip">Treino personalizado</div>';
    console.log('[atualizarGruposMusculares] Nenhum grupo muscular identificado');
    return;
  }

  // Criar HTML para os chips dos grupos musculares
  const html = gruposMusculares.map((grupo) => `<div class="muscle-chip">${grupo}</div>`).join('');

  container.innerHTML = html;

  console.log('[atualizarGruposMusculares] ✅ Grupos musculares atualizados:', gruposMusculares);
}

// Mostrar mensagem quando não há exercícios
function mostrarMensagemExercicios(mensagem, tipo = 'info', container) {
  if (!container) {
    console.error('[mostrarMensagemExercicios] Container não fornecido');
    return;
  }

  const iconMap = {
    info: '📝',
    warning: '⚠️',
    error: '❌',
  };

  container.innerHTML = `
        <div class="no-exercises-message ${tipo}">
            <div class="message-icon">${iconMap[tipo] || '📝'}</div>
            <p class="message-text">${mensagem}</p>
        </div>
    `;

  console.log('[mostrarMensagemExercicios] Mensagem exibida:', mensagem);
}

// Usando handleDayClick existente para mostrar modal de histórico do treino

// Modal de histórico já existe no arquivo - todas as funções estão implementadas ✅

// ============================================
// EFEITO DE SCROLL DO HEADER
// ============================================

// Variáveis para controle do scroll
let lastScrollTop = 0;
const scrollThreshold = 50; // Pixels de scroll para ativar o efeito
let handleScrollReference = null; // Armazenar referência da função handleScroll para poder remover depois

// Função para gerenciar o efeito de scroll do header
function initHeaderScrollEffect() {
  const header = document.querySelector('.home-header');

  if (!header) {
    console.warn('[initHeaderScrollEffect] Header não encontrado');
    return;
  }

  // Função de scroll otimizada com throttle
  let isScrolling = false;

  function handleScroll() {
    if (!isScrolling) {
      window.requestAnimationFrame(() => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        // Adiciona ou remove a classe 'scrolled' baseado na posição do scroll
        if (scrollTop > scrollThreshold) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }

        // Detecta direção do scroll para efeitos adicionais (opcional)
        if (scrollTop > lastScrollTop && scrollTop > 100) {
          // Scrolling down - pode adicionar classe para esconder header
          header.classList.add('scrolling-down');
        } else {
          // Scrolling up
          header.classList.remove('scrolling-down');
        }

        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; // Evita valores negativos
        isScrolling = false;
      });

      isScrolling = true;
    }
  }

  // Armazena referência da função para poder remover depois
  handleScrollReference = handleScroll;

  // Adiciona listener de scroll
  window.addEventListener('scroll', handleScroll, { passive: true });

  // Verifica posição inicial do scroll
  handleScroll();

  console.log('[initHeaderScrollEffect] ✅ Efeito de scroll do header inicializado');
}

// Função para limpar o listener de scroll quando necessário
function cleanupHeaderScrollEffect() {
  if (handleScrollReference) {
    window.removeEventListener('scroll', handleScrollReference);
    handleScrollReference = null;
    console.log('[cleanupHeaderScrollEffect] 🗑️ Listener de scroll removido');
  }
}

// Inicializar o efeito quando o dashboard for carregado
document.addEventListener('DOMContentLoaded', () => {
  // Aguarda um pequeno delay para garantir que o DOM esteja completamente carregado
  setTimeout(() => {
    initHeaderScrollEffect();
  }, 100);
});

// Exportar para uso externo se necessário
window.initHeaderScrollEffect = initHeaderScrollEffect;
window.cleanupHeaderScrollEffect = cleanupHeaderScrollEffect;
