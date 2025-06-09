// js/features/dashboard.js - Dashboard completo com dados reais
import AppState from '../state/appState.js';
import { fetchMetricasUsuario } from '../services/userService.js';
import WeeklyPlanService, { 
    carregarStatusSemanas, 
    obterSemanaAtivaUsuario 
} from '../services/weeklyPlanningService.js';
import homeService from '../services/homeService.js';
import { showNotification } from '../ui/notifications.js';

// Mapear tipos de treino para emojis
const TREINO_EMOJIS = {
    'Peito': '💪',
    'Costas': '🔙', 
    'Pernas': '🦵',
    'Ombro': '🎯',
    'Ombro e Braço': '💪',
    'Braço': '💪',
    'Cardio': '🏃',
    'folga': '😴',
    'A': '💪',
    'B': '🔙',
    'C': '🦵',
    'D': '🎯'
};

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// Função auxiliar para formatar nome do treino
function formatarNomeTreino(treino) {
    if (!treino) return 'Sem treino';
    
    switch(treino.tipo) {
        case 'folga':
            return 'Dia de Folga';
        case 'cardio':
            return 'Treino Cardiovascular';
        default:
            return `Treino ${treino.tipo}`;
    }
}

// Função principal para carregar dashboard
// Variáveis de estado para navegação de semanas
let semanaAtualExibida = null;
let statusSemanasCache = [];

// Carregar seletor de semanas
async function carregarSeletorSemanas() {
    try {
        const currentUser = AppState.get('currentUser');
        if (!currentUser || !currentUser.id) return;

        // Buscar semana ativa
        const semanaAtiva = await obterSemanaAtivaUsuario(currentUser.id);
        if (semanaAtiva) {
            semanaAtualExibida = semanaAtiva;
        }

        // Buscar status de todas as semanas
        statusSemanasCache = await carregarStatusSemanas(currentUser.id);

        // Atualizar interface do seletor
        atualizarSeletorSemanas();

        console.log('[carregarSeletorSemanas] ✅ Seletor carregado:', semanaAtiva);
    } catch (error) {
        console.error('[carregarSeletorSemanas] Erro:', error);
    }
}

// Navegar entre semanas
async function navegarSemana(direcao) {
    try {
        const currentUser = AppState.get('currentUser');
        if (!currentUser || !currentUser.id) return;

        if (!semanaAtualExibida) {
            showNotification('Carregando informações das semanas...', 'info');
            return;
        }

        const novaSemana = semanaAtualExibida.semana_treino + direcao;
        
        // Verificar se a semana existe no cache
        const semanaInfo = statusSemanasCache.find(s => s.semana_treino === novaSemana);
        if (!semanaInfo) {
            showNotification('Semana não disponível', 'warning');
            return;
        }

        // Atualizar semana exibida
        semanaAtualExibida = semanaInfo;

        // Atualizar interface
        atualizarSeletorSemanas();

        // Recarregar dados da nova semana
        // Note: Aqui você pode implementar carregamento de dados específicos da semana
        showNotification(`Visualizando semana ${novaSemana}`, 'info');

        console.log('[navegarSemana] Navegado para semana:', novaSemana);
    } catch (error) {
        console.error('[navegarSemana] Erro:', error);
        showNotification('Erro ao navegar entre semanas', 'error');
    }
}

// Atualizar interface do seletor de semanas
function atualizarSeletorSemanas() {
    try {
        if (!semanaAtualExibida) return;

        const weekNumber = document.getElementById('week-number');
        const weekStatus = document.getElementById('week-status');
        const weekPrev = document.getElementById('week-prev');
        const weekNext = document.getElementById('week-next');

        if (weekNumber) {
            weekNumber.textContent = `Semana ${semanaAtualExibida.semana_treino}`;
        }

        if (weekStatus) {
            let statusText = 'Inativa';
            let statusClass = 'inativa';

            if (semanaAtualExibida.eh_semana_atual) {
                statusText = 'Atual';
                statusClass = 'atual';
            } else if (semanaAtualExibida.eh_semana_ativa) {
                statusText = 'Ativa';
                statusClass = 'ativa';
            } else if (semanaAtualExibida.semana_programada) {
                statusText = 'Programada';
                statusClass = 'programada';
            }

            weekStatus.textContent = statusText;
            weekStatus.className = `week-status ${statusClass}`;
        }

        // Habilitar/desabilitar botões de navegação
        if (weekPrev) {
            const temSemanaAnterior = statusSemanasCache.some(s => 
                s.semana_treino === semanaAtualExibida.semana_treino - 1
            );
            weekPrev.disabled = !temSemanaAnterior;
        }

        if (weekNext) {
            const temProximaSemana = statusSemanasCache.some(s => 
                s.semana_treino === semanaAtualExibida.semana_treino + 1
            );
            weekNext.disabled = !temProximaSemana;
        }

    } catch (error) {
        console.error('[atualizarSeletorSemanas] Erro:', error);
    }
}

// Carregar dados dinâmicos da home usando homeService
async function carregarDadosDinamicosHome() {
    try {
        const currentUser = AppState.get('currentUser');
        if (!currentUser || !currentUser.id) return;

        console.log('[carregarDadosDinamicosHome] Carregando dados dinâmicos...');
        
        // Usar o homeService para carregar e atualizar dados
        const dados = await homeService.carregarDadosHome(currentUser.id);
        homeService.atualizarUIHome(dados);
        
        console.log('[carregarDadosDinamicosHome] ✅ Dados dinâmicos carregados');
    } catch (error) {
        console.error('[carregarDadosDinamicosHome] Erro:', error);
        // Não propagar erro para não quebrar o dashboard
    }
}

// Exportar função para debug
export { carregarIndicadoresSemana, navegarSemana, carregarSeletorSemanas, carregarDadosDinamicosHome };

export async function carregarDashboard() {
    console.log('[carregarDashboard] Iniciando carregamento completo...');
    
    try {
        const currentUser = AppState.get('currentUser');
        if (!currentUser || !currentUser.id) {
            console.error('[carregarDashboard] ❌ Usuário não está definido ou sem ID');
            console.log('[carregarDashboard] Estado atual:', { currentUser });
            
            // Tentar recarregar usuário se não existe
            if (window.initLogin) {
                console.log('[carregarDashboard] Redirecionando para login...');
                setTimeout(() => {
                    window.initLogin();
                }, 100);
                return;
            }
            
            showNotification('Usuário não está logado. Faça login novamente.', 'error');
            return;
        }

        console.log('[carregarDashboard] ✅ Carregando para usuário:', currentUser.nome, `(ID: ${currentUser.id})`);

        // Executar carregamentos em paralelo para melhor performance
        await Promise.all([
            carregarIndicadoresSemana(),
            carregarTreinoAtual(),
            carregarMetricasUsuario(),
            carregarExerciciosDoDia(),
            carregarEstatisticasAvancadas(),
            carregarSeletorSemanas(),
            carregarDadosDinamicosHome() // NOVO: Carregar dados dinâmicos
        ]);

        // Configurar funcionalidades
        configurarBotaoIniciar();
        configurarEventListeners();
        
        console.log('[carregarDashboard] ✅ Dashboard carregado com sucesso!');
        
    } catch (error) {
        console.error('[carregarDashboard] ❌ ERRO CRÍTICO:', error);
        showNotification('Erro crítico ao carregar dashboard: ' + error.message, 'error');
        
        // Não fazer fallback - se há erro, deve ser corrigido
        throw error;
    }
}

// Carregar e renderizar indicadores da semana com informações detalhadas
async function carregarIndicadoresSemana() {
    console.log('[carregarIndicadoresSemana] 🚀 INICIANDO carregamento dos indicadores da semana');
    try {
        const currentUser = AppState.get('currentUser');
        
        if (!currentUser || !currentUser.id) {
            console.error('[carregarIndicadoresSemana] ❌ currentUser é null ou sem ID');
            throw new Error('Usuário não está definido para carregar indicadores da semana');
        }
        
        const container = document.getElementById('week-indicators');
        if (!container) {
            console.warn('[carregarIndicadoresSemana] Container não encontrado');
            return;
        }

        // Buscar planejamento semanal
        const weekPlan = await WeeklyPlanService.getPlan(currentUser.id);
        const hoje = new Date();
        const diaAtual = hoje.getDay();
        
        // DEBUG: Log dos dados carregados
        console.log('[DEBUG] Plano carregado:', weekPlan);
        console.log('[DEBUG] Tipo de treino hoje:', weekPlan?.[diaAtual]);
        
        if (!weekPlan) {
            console.warn('[carregarIndicadoresSemana] ⚠️ Nenhum planejamento encontrado');
            renderizarSemanaVazia(container, diaAtual);
            return;
        }
        
        // Renderizar indicadores com dados reais
        let html = '';
        for (let i = 0; i < 7; i++) {
            const diaPlan = weekPlan[i];
            const isToday = i === diaAtual;
            const isCompleted = diaPlan?.concluido || false;
            
            // DEBUG: Log de cada dia
            console.log(`[DEBUG] Dia ${i} (${DIAS_SEMANA[i]}):`, {
                plano: diaPlan,
                tipo_atividade: diaPlan?.tipo_atividade,
                tipo: diaPlan?.tipo,
                concluido: diaPlan?.concluido
            });
            
            // Determinar tipo e classe do dia
            let dayType = 'Configure';
            let dayClass = 'day-indicator';
            let emoji = '';
            
            if (diaPlan) {
                // CORREÇÃO ROBUSTA: Múltiplos fallbacks para garantir dados válidos
                let tipoTreino = diaPlan.tipo_atividade || diaPlan.tipo || diaPlan.categoria || '';
                
                // Limpeza de dados inválidos
                if (!tipoTreino || 
                    tipoTreino === 'undefined' || 
                    tipoTreino === 'null' || 
                    tipoTreino.trim() === '' ||
                    tipoTreino === 'Configure') {
                    tipoTreino = 'folga';
                }
                
                // Log para debug
                console.log(`[DEBUG] Dia ${i} - tipoTreino determinado:`, {
                    tipoTreino,
                    diaPlan,
                    tipo_atividade: diaPlan.tipo_atividade,
                    tipo: diaPlan.tipo,
                    categoria: diaPlan.categoria
                });
                
                switch(tipoTreino.toLowerCase()) {
                    case 'folga':
                    case 'descanso':
                        dayType = 'Folga';
                        dayClass += ' rest-day';
                        emoji = '😴';
                        break;
                    case 'cardio':
                    case 'cardiovascular':
                        dayType = 'Cardio';
                        dayClass += ' cardio-day';
                        emoji = '🏃';
                        break;
                    default:
                        if (tipoTreino && tipoTreino !== 'folga') {
                            // Mostrar o grupo muscular específico
                            dayType = tipoTreino;
                            dayClass += ' workout-day';
                            emoji = TREINO_EMOJIS[tipoTreino] || '🏋️';
                        } else {
                            // Fallback seguro
                            dayType = 'Configure';
                            emoji = '⚙️';
                        }
                        break;
                }
            }
            
            // Adicionar classes de estado
            if (isToday) dayClass += ' today';
            if (isCompleted) dayClass += ' completed';
            
            // Adicionar check para dias concluídos
            const completedCheck = isCompleted ? '<span class="completed-check">✓</span>' : '';
            
            html += `
                <div class="${dayClass}">
                    <div class="day-name">${DIAS_SEMANA[i]}</div>
                    <div class="day-type">
                        ${emoji ? `<span class="day-emoji">${emoji}</span>` : ''}
                        ${dayType}${completedCheck}
                    </div>
                </div>
            `;
        }
        
        container.innerHTML = html;
        console.log('[carregarIndicadoresSemana] ✅ Indicadores carregados com sucesso');
        
    } catch (error) {
        console.error('[carregarIndicadoresSemana] ❌ ERRO:', error);
        showNotification('Erro ao carregar planejamento da semana', 'error');
    }
}

// Função auxiliar para renderizar semana vazia
function renderizarSemanaVazia(container, diaAtual) {
    let html = '';
    for (let i = 0; i < 7; i++) {
        const isToday = i === diaAtual;
        html += `
            <div class="day-indicator ${isToday ? 'today' : ''} empty-day">
                <div class="day-name">${DIAS_SEMANA[i]}</div>
                <div class="day-type">Configure</div>
            </div>
        `;
    }
    container.innerHTML = html;
}

// Carregar treino atual do dia
async function carregarTreinoAtual() {
    try {
        const currentUser = AppState.get('currentUser');
        
        if (!currentUser || !currentUser.id) {
            console.error('[carregarTreinoAtual] ❌ currentUser é null ou sem ID');
            atualizarUITreinoAtual(null);
            return;
        }
        
        // Buscar treino do dia com detalhes completos
        const treinoDoDia = await WeeklyPlanService.getTodaysWorkout(currentUser.id);
        
        // DEBUG: Log do treino do dia
        console.log('[DEBUG] Treino do dia:', treinoDoDia);
        console.log('[DEBUG] Tipo atividade:', treinoDoDia?.tipo_atividade);
        
        if (!treinoDoDia) {
            console.warn('[carregarTreinoAtual] Nenhum treino encontrado para hoje');
            atualizarUITreinoAtual(null);
            return;
        }
        
        // Formatar treino com informações completas
        const treinoFormatado = {
            tipo: treinoDoDia.tipo_atividade || treinoDoDia.tipo,
            nome: formatarNomeTreinoCompleto(treinoDoDia),
            grupo_muscular: treinoDoDia.tipo_atividade || treinoDoDia.tipo,
            numero_treino: treinoDoDia.numero_treino,
            exercicios: treinoDoDia.exercicios || [],
            total_exercicios: treinoDoDia.exercicios?.length || 0,
            duracao_estimada: calcularDuracaoEstimada(treinoDoDia.exercicios)
        };
        
        // Atualizar UI do treino atual
        atualizarUITreinoAtualCompleto(treinoFormatado);
        
        // Salvar no estado
        AppState.set('currentWorkout', treinoFormatado);
        
        console.log('[carregarTreinoAtual] ✅ Treino carregado:', treinoFormatado.nome);
        
    } catch (error) {
        console.error('[carregarTreinoAtual] ❌ Erro:', error);
        atualizarUITreinoAtual(null);
        showNotification('Erro ao carregar treino do dia', 'error');
    }
}

// Função auxiliar para formatar nome do treino completo
function formatarNomeTreinoCompleto(treino) {
    if (!treino) return 'Sem treino';
    
    const tipo = treino.tipo_atividade || treino.tipo;
    
    switch(tipo?.toLowerCase()) {
        case 'folga':
            return 'Dia de Folga';
        case 'cardio':
            return 'Treino Cardiovascular';
        default:
            return `Treino ${tipo}`;
    }
}

// Função auxiliar para calcular duração estimada
function calcularDuracaoEstimada(exercicios) {
    if (!exercicios || exercicios.length === 0) return 0;
    
    // Cálculo baseado em: (séries × tempo_descanso) + (séries × 30s execução) por exercício
    const duracaoTotal = exercicios.reduce((total, exercicio) => {
        const series = exercicio.series || 3;
        const descanso = exercicio.tempo_descanso || 60;
        const tempoExecucao = 30; // segundos estimados por série
        
        return total + (series * (descanso + tempoExecucao));
    }, 0);
    
    // Retornar em minutos
    return Math.round(duracaoTotal / 60);
}

// Função atualizada para UI do treino atual com informações completas
function atualizarUITreinoAtualCompleto(treino) {
    const workoutTypeEl = document.getElementById('workout-type');
    const workoutNameEl = document.getElementById('workout-name');
    const workoutExercisesEl = document.getElementById('workout-exercises');
    const btnTextEl = document.getElementById('btn-text');
    const progressTextEl = document.getElementById('workout-progress-text');
    const progressCircleEl = document.getElementById('workout-progress-circle');
    
    if (!treino) {
        // Fallback para função original se não há treino
        atualizarUITreinoAtual(null);
        return;
    }
    
    // Configurar baseado no tipo de treino
    switch(treino.tipo?.toLowerCase()) {
        case 'folga':
            updateElement(workoutTypeEl, 'Descanso');
            updateElement(workoutNameEl, 'Dia de Folga');
            updateElement(workoutExercisesEl, 'Repouso e recuperação');
            updateElement(btnTextEl, 'Dia de Descanso');
            updateElement(progressTextEl, '😴');
            break;
            
        case 'cardio':
            updateElement(workoutTypeEl, 'Cardio');
            updateElement(workoutNameEl, 'Treino Cardiovascular');
            updateElement(workoutExercisesEl, 'Exercícios aeróbicos • 30-45min');
            updateElement(btnTextEl, 'Iniciar Cardio');
            updateElement(progressTextEl, '🏃');
            break;
            
        default:
            // Treino de força com informações detalhadas
            const grupoMuscular = treino.grupo_muscular;
            const emoji = TREINO_EMOJIS[grupoMuscular] || '🏋️';
            
            updateElement(workoutTypeEl, `Treino ${grupoMuscular}`);
            updateElement(workoutNameEl, treino.nome);
            updateElement(workoutExercisesEl, 
                `${treino.total_exercicios} exercícios • ${treino.duracao_estimada}min • ${grupoMuscular}`
            );
            updateElement(btnTextEl, 'Iniciar Treino');
            updateElement(progressTextEl, emoji);
            break;
    }
    
    // Atualizar progresso circular se necessário
    if (progressCircleEl && treino.tipo?.toLowerCase() !== 'folga') {
        const hoje = new Date().getDay();
        const progressoSemanal = Math.min((hoje / 7) * 100, 100);
        const offset = 251.2 - (progressoSemanal / 100) * 251.2;
        progressCircleEl.style.strokeDashoffset = offset.toString();
        
        if (treino.tipo?.toLowerCase() === 'cardio') {
            updateElement(progressTextEl, `${Math.round(progressoSemanal)}%`);
        }
    }
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
    switch(treino.tipo) {
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
            updateElement(progressTextEl, '🏃');
            break;
            
        default:
            // Treino de força
            const grupoMuscular = treino.tipo;
            const emoji = TREINO_EMOJIS[grupoMuscular] || '🏋️';
            updateElement(workoutTypeEl, `Treino ${grupoMuscular}`);
            updateElement(workoutNameEl, `Treino ${grupoMuscular}`);
            updateElement(workoutExercisesEl, `Força • ${grupoMuscular} • ~45min`);
            updateElement(btnTextEl, 'Iniciar Treino');
            updateElement(progressTextEl, emoji);
            break;
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
                    progresso: estatisticas.percentual_progresso || 0
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
            console.error('[carregarMetricasUsuario] ❌ FALHA: Não foi possível carregar métricas do Supabase');
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
            console.log('[carregarPlanejamentoSemanal] Container weekly-plan-list não encontrado - usando indicadores da semana');
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
    try {
        const currentUser = AppState.get('currentUser');
        
        if (!currentUser || !currentUser.id) {
            console.error('[carregarExerciciosDoDia] ❌ currentUser é null ou sem ID');
            return;
        }
        
        const container = document.getElementById('exercises-preview');
        if (!container) {
            console.warn('[carregarExerciciosDoDia] Container não encontrado');
            return;
        }

        // Buscar treino completo com exercícios e pesos
        const treinoCompleto = await WeeklyPlanService.getTodaysWorkoutWithWeights(currentUser.id);
        
        console.log('[DEBUG] Treino completo com exercícios:', treinoCompleto);
        
        if (!treinoCompleto || treinoCompleto.tipo === 'folga') {
            renderizarDiaDescanso(container);
            return;
        }
        
        if (treinoCompleto && treinoCompleto.tipo === 'cardio') {
            renderizarTreinoCardio(container);
            return;
        }
        
        // Treino de força - mostrar exercícios com grupo muscular
        if (!treinoCompleto.exercicios || treinoCompleto.exercicios.length === 0) {
            renderizarSemExercicios(container);
            return;
        }
        
        // Renderizar header com grupo muscular
        const grupoMuscular = treinoCompleto.tipo_atividade || treinoCompleto.tipo || 'Força';
        let html = `
            <div class="exercises-section-header">
                <h3 class="exercises-title">
                    ${TREINO_EMOJIS[grupoMuscular] || '🏋️'} Treino de ${grupoMuscular}
                </h3>
                <span class="exercises-count">${treinoCompleto.exercicios.length} exercícios</span>
            </div>
            <div class="exercises-list">
        `;
        
        // Renderizar cada exercício
        treinoCompleto.exercicios.forEach((exercicio, index) => {
            html += renderizarExercicioCard(exercicio, index);
        });
        
        html += '</div>';
        
        container.innerHTML = html;
        console.log('[carregarExerciciosDoDia] ✅ Exercícios carregados:', treinoCompleto.exercicios.length);
        
    } catch (error) {
        console.error('[carregarExerciciosDoDia] ❌ ERRO:', error);
        showNotification('Erro ao carregar exercícios', 'error');
    }
}

// Função para renderizar card de exercício individual
function renderizarExercicioCard(exercicio, index) {
    const pesos = exercicio.pesos_sugeridos;
    const percentuais = pesos?.percentuais || { base: 70, min: 65, max: 75 };
    const pesoBase = pesos?.peso_base || 0;
    const pesoMin = pesos?.peso_minimo || 0;
    const pesoMax = pesos?.peso_maximo || 0;
    
    return `
        <div class="exercise-preview-card ${index === 0 ? 'first-exercise' : ''}">
            <div class="exercise-preview-header">
                <div>
                    <div class="exercise-name">
                        <span class="exercise-number">${index + 1}.</span>
                        ${exercicio.exercicio_nome}
                    </div>
                    <div class="exercise-group">
                        ${exercicio.exercicio_grupo} • ${exercicio.exercicio_equipamento}
                    </div>
                </div>
                <div class="exercise-rm-info">
                    <span class="rm-badge">${percentuais.base}% 1RM</span>
                </div>
            </div>
            
            <div class="exercise-weight-range">
                <div class="weight-indicator">
                    <span class="weight-min">${pesoMin}kg</span>
                    <div class="weight-bar">
                        <div class="weight-range-fill" 
                             style="width: ${pesoMax > pesoMin ? ((pesoBase - pesoMin) / (pesoMax - pesoMin)) * 100 : 50}%">
                        </div>
                        <div class="weight-target" 
                             style="left: ${pesoMax > pesoMin ? ((pesoBase - pesoMin) / (pesoMax - pesoMin)) * 100 : 50}%">
                        </div>
                    </div>
                    <span class="weight-max">${pesoMax}kg</span>
                </div>
                <div class="weight-target-label">Alvo: ${pesoBase}kg</div>
            </div>
            
            <div class="exercise-preview-details">
                <div class="exercise-detail">
                    <div class="exercise-detail-label">Séries</div>
                    <div class="exercise-detail-value">${exercicio.series || 3}</div>
                </div>
                <div class="exercise-detail">
                    <div class="exercise-detail-label">Repetições</div>
                    <div class="exercise-detail-value">${exercicio.repeticoes_alvo || 10}</div>
                </div>
                <div class="exercise-detail">
                    <div class="exercise-detail-label">Descanso</div>
                    <div class="exercise-detail-value">${Math.floor((exercicio.tempo_descanso || 60) / 60)}min</div>
                </div>
                <div class="exercise-detail">
                    <div class="exercise-detail-label">Volume</div>
                    <div class="exercise-detail-value">
                        ${Math.round(pesoBase * (exercicio.series || 3) * (exercicio.repeticoes_alvo || 10))}kg
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Funções auxiliares de renderização
function renderizarDiaDescanso(container) {
    container.innerHTML = `
        <div class="exercise-preview-card rest-day-card">
            <div class="exercise-preview-header">
                <div>
                    <div class="exercise-name">Dia de Descanso</div>
                    <div class="exercise-group">Recuperação muscular ativa</div>
                </div>
                <div class="exercise-rm-info">
                    <span class="rest-icon">😴</span>
                </div>
            </div>
            <div class="rest-day-suggestions">
                <div class="suggestion-item">
                    <span class="suggestion-icon">🧘</span>
                    <span>Alongamento leve</span>
                </div>
                <div class="suggestion-item">
                    <span class="suggestion-icon">🚶</span>
                    <span>Caminhada relaxante</span>
                </div>
                <div class="suggestion-item">
                    <span class="suggestion-icon">💧</span>
                    <span>Hidratação adequada</span>
                </div>
                <div class="suggestion-item">
                    <span class="suggestion-icon">😴</span>
                    <span>8+ horas de sono</span>
                </div>
            </div>
        </div>
    `;
}

function renderizarTreinoCardio(container) {
    const cardioSuggestions = [
        { name: 'Esteira', duration: '20-30min', intensity: 'Moderada', calories: '200-300' },
        { name: 'Bicicleta', duration: '25-35min', intensity: 'Moderada', calories: '250-350' },
        { name: 'Elíptico', duration: '20-25min', intensity: 'Moderada-Alta', calories: '220-320' },
        { name: 'Remo', duration: '15-20min', intensity: 'Alta', calories: '180-280' }
    ];
    
    let html = '';
    cardioSuggestions.forEach(cardio => {
        html += `
            <div class="exercise-preview-card">
                <div class="exercise-preview-header">
                    <div>
                        <div class="exercise-name">${cardio.name}</div>
                        <div class="exercise-group">Exercício Cardiovascular</div>
                    </div>
                    <div class="exercise-rm-info">
                        <span class="cardio-badge">${cardio.intensity}</span>
                    </div>
                </div>
                <div class="exercise-preview-details">
                    <div class="exercise-detail">
                        <div class="exercise-detail-label">Duração</div>
                        <div class="exercise-detail-value">${cardio.duration}</div>
                    </div>
                    <div class="exercise-detail">
                        <div class="exercise-detail-label">Intensidade</div>
                        <div class="exercise-detail-value">${cardio.intensity}</div>
                    </div>
                    <div class="exercise-detail">
                        <div class="exercise-detail-label">Calorias</div>
                        <div class="exercise-detail-value">${cardio.calories}</div>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function renderizarSemExercicios(container) {
    container.innerHTML = `
        <div class="exercise-preview-card error-card">
            <div class="exercise-preview-header">
                <div>
                    <div class="exercise-name">Nenhum exercício encontrado</div>
                    <div class="exercise-group">Configure seu protocolo de treino</div>
                </div>
                <div class="exercise-rm-info">
                    <span>⚠️</span>
                </div>
            </div>
            <div class="error-actions">
                <button class="btn-secondary" onclick="window.location.reload()">
                    Recarregar
                </button>
            </div>
        </div>
    `;
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
            limit: 10
        });
        
        // 2. Buscar estatísticas de 1RM (usando tabela direta)
        const { data: estatisticas1RM } = await query('usuario_1rm', {
            eq: { usuario_id: currentUser.id, status: 'ativo' },
            order: { column: 'data_teste', ascending: false }
        });
        
        // 3. Buscar exercícios para calcular progressão por grupo
        const { data: exercicios1RM } = await query('usuario_1rm', {
            eq: { usuario_id: currentUser.id, status: 'ativo' },
            select: '*, exercicios(grupo_muscular)'
        });
        
        // 4. Calcular estatísticas da semana atual
        const hoje = new Date();
        const inicioSemana = new Date(hoje.setDate(hoje.getDate() - hoje.getDay()));
        const fimSemana = new Date(inicioSemana);
        fimSemana.setDate(fimSemana.getDate() + 6);
        
        const { data: execucoesSemana } = await query('execucao_exercicio_usuario', {
            eq: { usuario_id: currentUser.id },
            gte: { data_execucao: inicioSemana.toISOString() },
            lte: { data_execucao: fimSemana.toISOString() }
        });
        
        // Processar e exibir estatísticas
        processarEstatisticasAvancadas({
            execucoesRecentes: execucoesRecentes || [],
            estatisticas1RM: estatisticas1RM || [],
            exercicios1RM: exercicios1RM || [],
            execucoesSemana: execucoesSemana || []
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
        const pesoTotalSemana = execucoesSemana.reduce((total, exec) => total + (exec.peso_utilizado * exec.repeticoes), 0);
        const diasTreinados = new Set(execucoesSemana.map(exec => 
            new Date(exec.data_execucao).toDateString()
        )).size;
        
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
        const maior1RM = Math.max(...estatisticas1RM.map(stat => stat.rm_calculado || 0));
        
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
        exercicios1RM.forEach(exercicio => {
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
        execucoesRecentes.slice(0, 5).forEach(execucao => {
            const dataExecucao = new Date(execucao.data_execucao);
            const diasAtras = Math.floor((new Date() - dataExecucao) / (1000 * 60 * 60 * 24));
            const tempoRelativo = diasAtras === 0 ? 'Hoje' : 
                                diasAtras === 1 ? 'Ontem' : 
                                `${diasAtras} dias atrás`;
            
            html += `
                <div class="activity-item">
                    <div class="activity-icon">🏋️</div>
                    <div class="activity-content">
                        <div class="activity-description">
                            ${execucao.peso_utilizado}kg × ${execucao.repeticoes} reps
                        </div>
                        <div class="activity-time">${tempoRelativo}</div>
                    </div>
                    <div class="activity-success ${execucao.falhou ? 'failed' : 'success'}">
                        ${execucao.falhou ? '⚠️' : '✅'}
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
    const startBtn = document.getElementById('start-workout-btn');
    if (!startBtn) {
        console.warn('[configurarBotaoIniciar] Botão não encontrado');
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
        
        // Com treino - usar a função global iniciarTreino
        if (window.iniciarTreino) {
            window.iniciarTreino();
        } else {
            showNotification('Sistema de treino carregando...', 'info');
        }
    };
    
    // Habilitar/desabilitar baseado no estado
    startBtn.disabled = false;
    
    console.log('[configurarBotaoIniciar] ✅ Botão configurado para:', workout?.tipo || 'configuração');
}

// Configurar event listeners
// Variável para evitar múltiplos registros de listeners
let listenersConfigured = false;
let debounceTimer = null;
let supabaseChannel = null;

// Configurar listener do Supabase para mudanças em tempo real
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
        if (supabaseChannel) {
            console.log('[limparEventListeners] 🗑️ Removendo canal Supabase...');
            const { supabase } = await import('../services/supabaseService.js');
            supabase.removeChannel(supabaseChannel);
            supabaseChannel = null;
        }
        
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
                    console.log('[configurarVisibilityListener] 👁️ Página voltou ao foco, refetchando dados...');
                    
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
                console.log('[configurarVisibilityListener] 🔄 Janela voltou ao foco, refetchando dados...');
                
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
        console.error('[configurarVisibilityListener] ❌ Erro ao configurar visibility listeners:', error);
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
    configurarSupabaseListener();
    
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
            const progressoDia = Math.min(Math.max((horaAtual - 6) / 16 * 100, 0), 100);
            
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
export function atualizarMetricasTempoReal(novasMetricas) {
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
export function recarregarDashboard() {
    console.log('[recarregarDashboard] Forçando reload completo...');
    carregarDashboard();
}

// Função de teste para verificar se fetchWorkouts funciona
window.testFetchWorkouts = async function() {
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
window.recarregarDashboard = recarregarDashboard;
window.carregarIndicadoresSemana = carregarIndicadoresSemana;
window.limparEventListeners = limparEventListeners;
window.fetchWorkouts = fetchWorkouts;

// Função global para navegação de semanas
window.navegarSemana = navegarSemana;

// Função global para carregar dados dinâmicos
window.carregarDadosDinamicosHome = carregarDadosDinamicosHome;