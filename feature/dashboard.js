// js/features/dashboard.js - Dashboard completo com dados reais
import AppState from '../state/appState.js';
import { fetchMetricasUsuario } from '../services/userService.js';
import { getWeekPlan } from '../utils/weekPlanStorage.js';
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

// Função principal para carregar dashboard
export async function carregarDashboard() {
    console.log('[carregarDashboard] Iniciando carregamento completo...');
    
    try {
        const currentUser = AppState.get('currentUser');
        if (!currentUser) {
            console.warn('[carregarDashboard] Usuário não definido');
            return;
        }

        console.log('[carregarDashboard] Carregando para usuário:', currentUser.nome);

        // Executar carregamentos em paralelo para melhor performance
        await Promise.all([
            carregarIndicadoresSemana(),
            carregarTreinoAtual(),
            carregarMetricasUsuario(),
            carregarPlanejamentoSemanal()
        ]);

        // Configurar funcionalidades
        configurarBotaoIniciar();
        configurarEventListeners();
        
        console.log('[carregarDashboard] ✅ Dashboard carregado com sucesso!');
        
    } catch (error) {
        console.error('[carregarDashboard] Erro:', error);
        showNotification('Alguns dados podem não estar atualizados', 'warning');
        
        // Fallback para configuração básica
        configurarBotaoIniciar();
    }
}

// Carregar e renderizar indicadores da semana
async function carregarIndicadoresSemana() {
    try {
        const currentUser = AppState.get('currentUser');
        const weekPlan = getWeekPlan(currentUser.id) || AppState.get('weekPlan');
        
        const container = document.getElementById('week-indicators');
        if (!container) {
            console.warn('[carregarIndicadoresSemana] Container não encontrado');
            return;
        }

        const hoje = new Date().getDay();
        let html = '';

        for (let i = 0; i < 7; i++) {
            const diaPlan = weekPlan ? weekPlan[i] : null;
            const isToday = i === hoje;
            const isCompleted = i < hoje; // Simplificado: dias anteriores como concluídos
            
            let dayType = 'Folga';
            let dayClass = 'day-indicator';
            
            if (diaPlan) {
                if (typeof diaPlan === 'string') {
                    dayType = diaPlan === 'folga' ? 'Folga' : 
                             diaPlan === 'cardio' ? 'Cardio' : 
                             `Treino ${diaPlan}`;
                } else if (diaPlan.tipo) {
                    dayType = diaPlan.tipo === 'folga' ? 'Folga' :
                             diaPlan.tipo === 'Cardio' ? 'Cardio' :
                             `Treino ${diaPlan.tipo}`;
                }
            }
            
            if (isToday) dayClass += ' today';
            if (isCompleted) dayClass += ' completed';
            
            html += `
                <div class="${dayClass}">
                    <div class="day-name">${DIAS_SEMANA[i]}</div>
                    <div class="day-type">${dayType}</div>
                </div>
            `;
        }
        
        container.innerHTML = html;
        console.log('[carregarIndicadoresSemana] ✅ Indicadores da semana renderizados');
        
    } catch (error) {
        console.error('[carregarIndicadoresSemana] Erro:', error);
    }
}

// Carregar treino atual do dia
async function carregarTreinoAtual() {
    try {
        const currentUser = AppState.get('currentUser');
        const weekPlan = getWeekPlan(currentUser.id) || AppState.get('weekPlan');
        const hoje = new Date().getDay();
        
        let treinoDoDia = null;
        
        if (weekPlan && weekPlan[hoje]) {
            const planHoje = weekPlan[hoje];
            
            if (typeof planHoje === 'string') {
                treinoDoDia = {
                    tipo: planHoje,
                    nome: planHoje === 'folga' ? 'Dia de Folga' :
                          planHoje === 'cardio' ? 'Cardio' :
                          `Treino ${planHoje}`
                };
            } else if (planHoje.tipo) {
                treinoDoDia = {
                    tipo: planHoje.tipo,
                    nome: planHoje.tipo === 'folga' ? 'Dia de Folga' :
                          planHoje.tipo === 'Cardio' ? 'Cardio' :
                          `Treino ${planHoje.tipo}`
                };
            }
        }
        
        // Atualizar UI do treino atual
        atualizarUITreinoAtual(treinoDoDia);
        
        // Salvar no estado
        AppState.set('currentWorkout', treinoDoDia);
        
        console.log('[carregarTreinoAtual] ✅ Treino atual carregado:', treinoDoDia?.nome || 'Nenhum');
        
    } catch (error) {
        console.error('[carregarTreinoAtual] Erro:', error);
        atualizarUITreinoAtual(null);
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
        
        // Tentar buscar métricas reais do banco
        let metricas = null;
        try {
            metricas = await fetchMetricasUsuario(currentUser.id);
        } catch (error) {
            console.warn('[carregarMetricasUsuario] Erro ao buscar do banco, usando dados mock');
        }
        
        // Usar dados mock se não conseguir buscar do banco
        if (!metricas) {
            const weekPlan = getWeekPlan(currentUser.id);
            const diasComTreino = weekPlan ? 
                Object.values(weekPlan).filter(dia => dia !== 'folga').length : 3;
            
            metricas = {
                treinosConcluidos: Math.floor(Math.random() * 5), // 0-4 treinos
                semanaAtual: 1,
                progresso: Math.min((diasComTreino / 7) * 100, 100)
            };
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
        console.error('[carregarMetricasUsuario] Erro:', error);
        
        // Valores padrão em caso de erro
        updateElement('completed-workouts', '0');
        updateElement('current-week', '1');
        updateElement('progress-percentage', '0%');
        updateElement('user-workouts', '0');
    }
}

// Carregar e renderizar planejamento semanal
async function carregarPlanejamentoSemanal() {
    try {
        const currentUser = AppState.get('currentUser');
        const weekPlan = getWeekPlan(currentUser.id) || AppState.get('weekPlan');
        
        const container = document.getElementById('weekly-plan-list');
        if (!container) {
            console.warn('[carregarPlanejamentoSemanal] Container não encontrado');
            return;
        }
        
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
        
        const hoje = new Date().getDay();
        let html = '';
        
        for (let i = 0; i < 7; i++) {
            const diaPlan = weekPlan[i];
            const isToday = i === hoje;
            const isCompleted = i < hoje;
            
            let atividade = 'Folga';
            let statusClass = 'pending';
            let statusText = 'Pendente';
            
            if (diaPlan) {
                if (typeof diaPlan === 'string') {
                    atividade = diaPlan === 'folga' ? 'Folga' :
                               diaPlan === 'cardio' ? 'Cardio' :
                               `Treino ${diaPlan}`;
                } else if (diaPlan.tipo) {
                    atividade = diaPlan.tipo === 'folga' ? 'Folga' :
                               diaPlan.tipo === 'Cardio' ? 'Cardio' :
                               `Treino ${diaPlan.tipo}`;
                }
            }
            
            if (isCompleted) {
                statusClass = 'completed';
                statusText = 'Concluído';
            } else if (isToday) {
                statusClass = 'today';
                statusText = 'Hoje';
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
        console.log('[carregarPlanejamentoSemanal] ✅ Planejamento semanal renderizado');
        
    } catch (error) {
        console.error('[carregarPlanejamentoSemanal] Erro:', error);
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
        
        // Com treino - executar ação baseada no tipo
        switch(workout.tipo) {
            case 'folga':
                showNotification('Hoje é dia de descanso! 😴 Aproveite para se recuperar.', 'info');
                break;
                
            case 'cardio':
            case 'Cardio':
                showNotification('Hora do cardio! 🏃‍♂️ Vamos queimar calorias!', 'success');
                // TODO: Abrir tela de cardio quando implementada
                break;
                
            default:
                // Treino de força
                showNotification(`Vamos treinar ${workout.tipo}! 💪 Em desenvolvimento...`, 'info');
                // TODO: Abrir tela de treino quando implementada
                break;
        }
    };
    
    // Habilitar/desabilitar baseado no estado
    startBtn.disabled = false;
    
    console.log('[configurarBotaoIniciar] ✅ Botão configurado para:', workout?.tipo || 'configuração');
}

// Configurar event listeners
function configurarEventListeners() {
    // Listener para mudanças no estado
    AppState.subscribe('weekPlan', (newPlan) => {
        console.log('[dashboard] Plano semanal atualizado, recarregando...');
        carregarIndicadoresSemana();
        carregarTreinoAtual();
        carregarPlanejamentoSemanal();
    });
    
    AppState.subscribe('currentUser', (newUser) => {
        if (newUser) {
            console.log('[dashboard] Usuário alterado, recarregando dashboard...');
            carregarDashboard();
        }
    });
    
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

// Exportar para compatibilidade
window.carregarDashboard = carregarDashboard;
window.recarregarDashboard = recarregarDashboard;