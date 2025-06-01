// js/features/dashboard.js - VERSÃO CORRIGIDA
// Lógica do dashboard/home

import AppState from '../state/appState.js';
import { fetchMetricasUsuario } from '../services/userService.js';
import { fetchExerciciosTreino, fetchDadosIndicadores } from '../services/workoutService.js';
import { getWeekPlan } from '../utils/weekPlanStorage.js';
import { weeklyPlanManager } from '../hooks/useWeeklyPlan.js';
import { showNotification } from '../ui/notifications.js';
import { iniciarTreino } from './workout.js';

// Carregar dados do dashboard
export async function carregarDashboard() {
    console.log('[carregarDashboard] Iniciando carregamento...');
    
    try {
        const currentUser = AppState.get('currentUser');
        if (!currentUser) {
            console.warn('[carregarDashboard] Usuário não definido');
            return;
        }

        console.log('[carregarDashboard] Carregando para usuário:', currentUser.nome);

        // 1. Carregar dados básicos (sem dependência do weeklyPlanManager)
        await carregarIndicadores();
        await carregarMetricas();
        
        console.log('[carregarDashboard] Indicadores e métricas carregados');
        
        // 2. Verificar se há plano semanal no estado
        let weekPlan = AppState.get('weekPlan');
        
        if (!weekPlan) {
            // Tentar carregar do localStorage como fallback
            weekPlan = getWeekPlan(currentUser.id);
            if (weekPlan) {
                AppState.set('weekPlan', weekPlan);
                console.log('[carregarDashboard] Plano carregado do localStorage');
            }
        }
        
        // 3. Atualizar UI com plano semanal (se disponível)
        if (weekPlan) {
            atualizarUIComPlanoSemanal(weekPlan);
            console.log('[carregarDashboard] UI atualizada com plano semanal');
        }
        
        // 4. Carregar treino de hoje (simplificado)
        await carregarProximoTreinoFromPlan();
        
        // 5. Configurar botão de iniciar
        configurarBotaoIniciar();
        
        console.log('[carregarDashboard] Dashboard carregado com sucesso!');
        
    } catch (error) {
        console.error('[carregarDashboard] Erro:', error);
        showNotification('Alguns dados podem não estar atualizados', 'warning');
        
        // Mesmo com erro, tentar configurar o básico
        try {
            configurarBotaoIniciar();
            atualizarIndicadorSemana();
        } catch (fallbackError) {
            console.error('[carregarDashboard] Erro no fallback:', fallbackError);
        }
    }
}

// Função corrigida para carregar próximo treino
async function carregarProximoTreinoFromPlan() {
    try {
        const currentUser = AppState.get('currentUser');
        const weekPlan = AppState.get('weekPlan');
        
        if (!weekPlan) {
            updateElement('next-workout-name', 'Configure seu planejamento');
            updateElement('workout-exercises', 'Nenhum treino configurado');
            return;
        }
        
        // Determinar treino de hoje
        const hoje = new Date().getDay();
        const treinoDoDia = weekPlan[hoje];
        
        if (!treinoDoDia) {
            updateElement('next-workout-name', 'Nenhum treino hoje');
            updateElement('workout-exercises', 'Dia livre');
            return;
        }
        
        if (treinoDoDia.tipo === 'folga') {
            updateElement('next-workout-name', 'Dia de Folga');
            updateElement('workout-exercises', 'Descanso');
            AppState.set('currentWorkout', { tipo: 'folga', nome: 'Dia de Folga' });
            return;
        }
        
        if (treinoDoDia.tipo === 'Cardio') {
            updateElement('next-workout-name', 'Cardio');
            updateElement('workout-exercises', 'Exercícios cardiovasculares');
            AppState.set('currentWorkout', { tipo: 'cardio', nome: 'Cardio' });
            return;
        }
        
        // Treino muscular
        updateElement('next-workout-name', `Treino ${treinoDoDia.tipo}`);
        updateElement('workout-exercises', 'Treino de força');
        
        AppState.set('currentWorkout', {
            tipo: 'treino',
            nome: `Treino ${treinoDoDia.tipo}`,
            grupo_muscular: treinoDoDia.tipo
        });
        
        console.log('[carregarProximoTreinoFromPlan] Treino configurado:', treinoDoDia);
        
    } catch (error) {
        console.error('[carregarProximoTreinoFromPlan] Erro:', error);
        updateElement('next-workout-name', 'Erro ao carregar treino');
        updateElement('workout-exercises', '');
    }
}

// Função para atualizar UI com plano semanal
function atualizarUIComPlanoSemanal(weekPlan) {
    try {
        // Atualizar indicador da semana
        const today = new Date().getDay();
        const dayElements = document.querySelectorAll('.day-modern');
        
        dayElements.forEach((dayEl, index) => {
            const dayPlan = weekPlan[index];
            const typeEl = dayEl.querySelector('.day-type');
            const indicatorEl = dayEl.querySelector('.day-indicator');
            
            if (dayPlan && typeEl) {
                if (dayPlan.tipo === 'folga') {
                    typeEl.textContent = 'Folga';
                } else if (dayPlan.tipo === 'Cardio') {
                    typeEl.textContent = 'Cardio';
                } else {
                    typeEl.textContent = `Treino ${dayPlan.tipo}`;
                }
            }
            
            if (indicatorEl) {
                indicatorEl.classList.remove('active', 'completed');
                
                if (index === today) {
                    indicatorEl.classList.add('active');
                } else if (index < today && dayPlan?.concluido) {
                    indicatorEl.classList.add('completed');
                }
            }
        });
        
        console.log('[atualizarUIComPlanoSemanal] UI da semana atualizada');
        
    } catch (error) {
        console.error('[atualizarUIComPlanoSemanal] Erro:', error);
    }
}

// Função melhorada para configurar botão
function configurarBotaoIniciar() {
    const startBtn = document.getElementById('start-workout-btn');
    if (!startBtn) {
        console.warn('[configurarBotaoIniciar] Botão start-workout-btn não encontrado');
        return;
    }
    
    const workout = AppState.get('currentWorkout');
    
    if (workout) {
        startBtn.disabled = false;
        startBtn.onclick = () => {
            if (workout.tipo === 'folga') {
                showNotification('Hoje é dia de descanso! 😴', 'info');
            } else if (workout.tipo === 'cardio') {
                showNotification('Hora do cardio! 🏃‍♂️', 'info');
            } else {
                // Iniciar treino de força (implementar depois)
                showNotification('Treino de força em desenvolvimento 💪', 'info');
            }
        };
        console.log('[configurarBotaoIniciar] Botão configurado para:', workout.tipo);
    } else {
        startBtn.disabled = true;
        startBtn.onclick = () => {
            showNotification('Configure seu planejamento primeiro', 'warning');
        };
        console.log('[configurarBotaoIniciar] Botão desabilitado - sem treino');
    }
}

// Carregar métricas do usuário (usando dados do AppState)
async function carregarMetricas() {
    try {
        const metricas = AppState.get('userMetrics'); // Ler métricas do AppState
        
        if (!metricas) {
            console.warn('Métricas do usuário não encontradas no AppState. Tentando buscar...');
            // Fallback, embora o ideal é que carregarIndicadores já tenha populado
            const currentUser = AppState.get('currentUser');
            if (currentUser) {
                const fallbackMetricas = await fetchMetricasUsuario(currentUser.id);
                AppState.set('userMetrics', fallbackMetricas); // Salva para evitar re-busca imediata
                updateElement('completed-workouts', fallbackMetricas.treinosConcluidos || 0);
                updateElement('current-week', fallbackMetricas.semanaAtual || 1);
                updateElement('progress-percentage', `${fallbackMetricas.progresso || 0}%`);
                
                // Atualizar anel de progresso
                const progressRing = document.querySelector('.progress-ring-progress');
                if (progressRing) {
                    const circumference = 2 * Math.PI * 40;
                    const offset = circumference - ((fallbackMetricas.progresso || 0) / 100) * circumference;
                    progressRing.style.strokeDashoffset = offset;
                }
                
                const userProgressBar = document.getElementById('user-progress-bar');
                if (userProgressBar) {
                    userProgressBar.style.width = `${((fallbackMetricas.treinosConcluidos || 0) / 4) * 100}%`;
                }
                
                updateElement('user-workouts', fallbackMetricas.treinosConcluidos || 0);
                return;
            } else {
                console.error('Não foi possível buscar métricas: usuário não definido.');
                // Definir valores padrão em caso de erro grave
                updateElement('completed-workouts', '0');
                updateElement('current-week', '1');
                updateElement('progress-percentage', '0%');
                return;
            }
        }
        
        // Atualizar elementos da UI com dados do AppState
        updateElement('completed-workouts', metricas.total_treinos_realizados || metricas.treinosConcluidos || 0);
        updateElement('current-week', metricas.semana_atual || metricas.semanaAtual || 1);
        updateElement('progress-percentage', `${metricas.percentual_progresso || metricas.progresso || 0}%`);
        
        // Atualizar anel de progresso
        const progressRing = document.querySelector('.progress-ring-progress');
        if (progressRing) {
            const circumference = 2 * Math.PI * 40;
            const offset = circumference - ((metricas.percentual_progresso || metricas.progresso || 0) / 100) * circumference;
            progressRing.style.strokeDashoffset = offset;
        }
        
        // Atualizar barras de comparação
        const userProgressBar = document.getElementById('user-progress-bar');
        if (userProgressBar) {
            userProgressBar.style.width = `${((metricas.total_treinos_realizados || metricas.treinosConcluidos || 0) / 4) * 100}%`;
        }
        
        updateElement('user-workouts', metricas.total_treinos_realizados || metricas.treinosConcluidos || 0);
        
    } catch (error) {
        console.error('Erro ao carregar métricas:', error);
        // Definir valores padrão em caso de erro
        updateElement('completed-workouts', '0');
        updateElement('current-week', '1');
        updateElement('progress-percentage', '0%');
    }
}

// Carregar indicadores competitivos
async function carregarIndicadores() {
    try {
        const currentUser = AppState.get('currentUser');
        if (!currentUser) return;
        
        const dados = await fetchDadosIndicadores(currentUser.id);

        if (dados && dados.estatisticas) {
            // Salvar as estatísticas (métricas) no AppState para serem usadas por carregarMetricas
            AppState.set('userMetrics', dados.estatisticas);
        } else {
            console.warn('Dados de estatísticas não retornados por fetchDadosIndicadores.');
            AppState.set('userMetrics', null); // Limpa para evitar dados obsoletos
        }
        
        // Aqui você pode renderizar os OUTROS indicadores competitivos (comparacao, resumoGrupo)
        // Exemplo: renderizarComparacao(dados.comparacao);
        // Exemplo: renderizarResumoGrupo(dados.resumoGrupo);
        
    } catch (error) {
        console.error('Erro ao carregar indicadores:', error);
        AppState.set('userMetrics', null); // Limpa em caso de erro
    }
}

// Atualizar informações do protocolo
function atualizarInfoProtocolo() {
    const protocol = AppState.get('currentProtocol');
    if (!protocol) return;
    
    const userProtocolEl = document.getElementById('user-protocol');
    if (userProtocolEl) {
        const semanaAtual = protocol.semana_atual || 1;
        const nomeProtocolo = protocol.nome_protocolo || 'Protocolo Padrão';
        userProtocolEl.textContent = `${nomeProtocolo} - Semana ${semanaAtual}`;
    }
}

// Carregar informações do próximo treino (versão legada)
async function carregarProximoTreino() {
    const workout = AppState.get('currentWorkout');
    const protocol = AppState.get('currentProtocol');
    
    if (!workout || !protocol) {
        updateElement('next-workout-name', 'Nenhum treino hoje');
        updateElement('workout-exercises', '0 exercícios');
        return;
    }
    
    // Determinar tipo de treino
    const tipoTreino = obterTipoTreino(workout.dia_semana);
    updateElement('next-workout-name', `Treino ${tipoTreino}`);
    
    // Carregar exercícios do treino
    try {
        const exercicios = await fetchExerciciosTreino(
            workout.numero_treino,
            protocol.protocolo_treinamento_id
        );
        
        AppState.set('currentExercises', exercicios);
        updateElement('workout-exercises', `${exercicios.length} exercícios`);
        
    } catch (error) {
        console.error('Erro ao carregar exercícios:', error);
        updateElement('workout-exercises', '0 exercícios');
    }
}

// Atualizar indicador da semana
function atualizarIndicadorSemana() {
    const weekPlan = AppState.get('weekPlan');
    if (!weekPlan) return;
    
    const today = new Date().getDay();
    const dayPills = document.querySelectorAll('.day-pill');
    
    dayPills.forEach((pill, index) => {
        pill.classList.remove('active', 'completed');
        
        if (weekPlan[index]) {
            const dayPlan = weekPlan[index];
            
            if (dayPlan === 'folga') {
                pill.textContent = 'Folga';
                pill.style.opacity = '0.5';
            } else if (dayPlan === 'cardio') {
                pill.textContent = 'Cardio';
            } else {
                pill.textContent = dayPlan;
            }
            
            if (index === today) {
                pill.classList.add('active');
            } else if (index < today) {
                pill.classList.add('completed');
            }
        }
    });
}

// Renderizar lista customizada da semana
function renderCustomWeekList() {
    const ul = document.getElementById('custom-week-list');
    if (!ul) return;
    
    const semana = getSemanaOrdem();
    ul.innerHTML = '';
    
    semana.forEach(item => {
        const li = document.createElement('li');
        li.className = 'custom-week-item';
        li.innerHTML = `
            <strong>${item.dia}:</strong> 
            <span>${item.tipo}${item.tipo === 'Treino' && item.grupo ? ' (' + item.grupo + ')' : ''}</span>
        `;
        ul.appendChild(li);
    });
}

// Obter ordem da semana
function getSemanaOrdem() {
    const stored = localStorage.getItem('semanaOrdem');
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Erro ao parsear semana ordem:', e);
        }
    }
    
    // Retornar padrão
    return [
        { dia: 'Domingo', tipo: 'Folga', grupo: null },
        { dia: 'Segunda', tipo: 'Treino', grupo: 'A' },
        { dia: 'Terça', tipo: 'Treino', grupo: 'B' },
        { dia: 'Quarta', tipo: 'Cardio', grupo: null },
        { dia: 'Quinta', tipo: 'Treino', grupo: 'C' },
        { dia: 'Sexta', tipo: 'Treino', grupo: 'D' },
        { dia: 'Sábado', tipo: 'Folga', grupo: null }
    ];
}

// Função auxiliar para atualizar elementos
function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    } else {
        console.warn(`[updateElement] Elemento ${id} não encontrado`);
    }
}

// Obter tipo de treino
function obterTipoTreino(diaSemana) {
    const tipos = { 1: 'A', 2: 'B', 3: 'C', 4: 'D' };
    return tipos[diaSemana] || 'A';
}