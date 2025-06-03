// js/features/dashboard.js - Dashboard simplificado sem duplicatas
import AppState from '../state/appState.js';
import { fetchMetricasUsuario } from '../services/userService.js';
import { getWeekPlan } from '../../utils/weekPlanStorage.js';
import { showNotification } from '../ui/notifications.js';

// Mapear tipos de treino para emojis
const TREINO_EMOJIS = {
    'Peito': '💪', 'Costas': '🔙', 'Pernas': '🦵', 'Ombro': '🎯',
    'Ombro e Braço': '💪', 'Braço': '💪', 'Cardio': '🏃', 'folga': '😴',
    'A': '💪', 'B': '🔙', 'C': '🦵', 'D': '🎯'
};

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// Função principal para carregar dashboard
export async function carregarDashboard() {
    console.log('[carregarDashboard] Iniciando carregamento...');
    
    try {
        const currentUser = AppState.get('currentUser');
        if (!currentUser) {
            console.warn('[carregarDashboard] Usuário não definido');
            return;
        }

        console.log('[carregarDashboard] Carregando para usuário:', currentUser.nome);

        // Executar carregamentos em paralelo
        await Promise.all([
            carregarIndicadoresSemana(),
            carregarTreinoAtual(),
            carregarMetricasUsuario(),
            carregarPlanejamentoSemanal()
        ]);

        configurarBotaoIniciar();
        configurarEventListeners();
        
        console.log('[carregarDashboard] ✅ Dashboard carregado com sucesso!');
        
    } catch (error) {
        console.error('[carregarDashboard] Erro:', error);
        showNotification('Alguns dados podem não estar atualizados', 'warning');
        configurarBotaoIniciar();
    }
}

// Carregar indicadores da semana
async function carregarIndicadoresSemana() {
    try {
        const currentUser = AppState.get('currentUser');
        const weekPlan = getWeekPlan(currentUser.id) || AppState.get('weekPlan');
        
        const container = document.getElementById('week-indicators');
        if (!container) return;

        const hoje = new Date().getDay();
        let html = '';

        for (let i = 0; i < 7; i++) {
            const diaPlan = weekPlan ? weekPlan[i] : null;
            const isToday = i === hoje;
            const isCompleted = i < hoje;
            
            let dayType = 'Folga';
            let dayClass = 'day-indicator';
            
            if (diaPlan) {
                dayType = formatarTipoDia(diaPlan);
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
        console.log('[carregarIndicadoresSemana] ✅ Indicadores renderizados');
        
    } catch (error) {
        console.error('[carregarIndicadoresSemana] Erro:', error);
    }
}

// Carregar treino atual
async function carregarTreinoAtual() {
    try {
        const currentUser = AppState.get('currentUser');
        const weekPlan = getWeekPlan(currentUser.id) || AppState.get('weekPlan');
        const hoje = new Date().getDay();
        
        let treinoDoDia = null;
        
        if (weekPlan && weekPlan[hoje]) {
            const planHoje = weekPlan[hoje];
            treinoDoDia = {
                tipo: typeof planHoje === 'string' ? planHoje : planHoje.tipo,
                nome: formatarTipoDia(planHoje)
            };
        }
        
        atualizarUITreinoAtual(treinoDoDia);
        AppState.set('currentWorkout', treinoDoDia);
        
        console.log('[carregarTreinoAtual] ✅ Treino atual:', treinoDoDia?.nome || 'Nenhum');
        
    } catch (error) {
        console.error('[carregarTreinoAtual] Erro:', error);
        atualizarUITreinoAtual(null);
    }
}

// Atualizar UI do treino atual
function atualizarUITreinoAtual(treino) {
    const elements = {
        type: document.getElementById('workout-type'),
        name: document.getElementById('workout-name'),
        exercises: document.getElementById('workout-exercises'),
        btnText: document.getElementById('btn-text'),
        progressText: document.getElementById('workout-progress-text'),
        progressCircle: document.getElementById('workout-progress-circle')
    };
    
    if (!treino) {
        updateElement(elements.type, 'Configure');
        updateElement(elements.name, 'Nenhum treino configurado');
        updateElement(elements.exercises, 'Configure seu planejamento');
        updateElement(elements.btnText, 'Configurar Planejamento');
        updateElement(elements.progressText, '0%');
        
        if (elements.progressCircle) {
            elements.progressCircle.style.strokeDashoffset = '251.2';
        }
        return;
    }
    
    // Configurar baseado no tipo
    switch(treino.tipo) {
        case 'folga':
            updateElement(elements.type, 'Descanso');
            updateElement(elements.name, 'Dia de Folga');
            updateElement(elements.exercises, 'Repouso e recuperação');
            updateElement(elements.btnText, 'Dia de Descanso');
            updateElement(elements.progressText, '😴');
            break;
            
        case 'cardio':
        case 'Cardio':
            updateElement(elements.type, 'Cardio');
            updateElement(elements.name, 'Treino Cardiovascular');
            updateElement(elements.exercises, 'Exercícios aeróbicos • 30-45min');
            updateElement(elements.btnText, 'Iniciar Cardio');
            updateElement(elements.progressText, '🏃');
            break;
            
        default:
            const emoji = TREINO_EMOJIS[treino.tipo] || '🏋️';
            updateElement(elements.type, `Treino ${treino.tipo}`);
            updateElement(elements.name, `Treino ${treino.tipo}`);
            updateElement(elements.exercises, `Força • ${treino.tipo} • ~45min`);
            updateElement(elements.btnText, 'Iniciar Treino');
            updateElement(elements.progressText, emoji);
            break;
    }
    
    // Simular progresso semanal
    const hoje = new Date().getDay();
    const progressoSemanal = Math.min((hoje / 7) * 100, 100);
    
            if (elements.progressCircle && treino.tipo !== 'folga') {
        const offset = 251.2 - (progressoSemanal / 100) * 251.2;
        elements.progressCircle.style.strokeDashoffset = offset.toString();
        
        if (treino.tipo === 'cardio' || treino.tipo === 'Cardio') {
            updateElement(elements.progressText, `${Math.round(progressoSemanal)}%`);
        }
    }
}

// Carregar métricas do usuário
async function carregarMetricasUsuario() {
    try {
        const currentUser = AppState.get('currentUser');
        
        // Tentar buscar métricas reais
        let metricas = null;
        try {
            metricas = await fetchMetricasUsuario(currentUser.id);
        } catch (error) {
            console.warn('[carregarMetricasUsuario] Usando dados mock:', error);
        }
        
        // Usar dados mock se necessário
        if (!metricas) {
            const weekPlan = getWeekPlan(currentUser.id);
            const diasComTreino = weekPlan ? 
                Object.values(weekPlan).filter(dia => dia !== 'folga').length : 3;
            
            metricas = {
                treinosConcluidos: Math.floor(Math.random() * 5),
                semanaAtual: 1,
                progresso: Math.min((diasComTreino / 7) * 100, 100)
            };
        }
        
        // Atualizar UI
        updateElement('completed-workouts', metricas.treinosConcluidos || 0);
        updateElement('current-week', metricas.semanaAtual || 1);
        updateElement('progress-percentage', `${Math.round(metricas.progresso || 0)}%`);
        
        // Atualizar barra de progresso
        const userProgressBar = document.getElementById('user-progress-bar');
        if (userProgressBar) {
            const progressWidth = Math.min((metricas.treinosConcluidos / 4) * 100, 100);
            userProgressBar.style.width = `${progressWidth}%`;
        }
        
        updateElement('user-workouts', metricas.treinosConcluidos || 0);
        AppState.set('userMetrics', metricas);
        
        console.log('[carregarMetricasUsuario] ✅ Métricas carregadas');
        
    } catch (error) {
        console.error('[carregarMetricasUsuario] Erro:', error);
        
        // Valores padrão
        updateElement('completed-workouts', '0');
        updateElement('current-week', '1');
        updateElement('progress-percentage', '0%');
        updateElement('user-workouts', '0');
    }
}

// Carregar planejamento semanal
async function carregarPlanejamentoSemanal() {
    try {
        const currentUser = AppState.get('currentUser');
        const weekPlan = getWeekPlan(currentUser.id) || AppState.get('weekPlan');
        
        const container = document.getElementById('weekly-plan-list');
        if (!container) return;
        
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
            
            let atividade = formatarTipoDia(diaPlan);
            let statusClass = 'pending';
            let statusText = 'Pendente';
            
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
        console.log('[carregarPlanejamentoSemanal] ✅ Planejamento renderizado');
        
    } catch (error) {
        console.error('[carregarPlanejamentoSemanal] Erro:', error);
    }
}

// Configurar botão de iniciar treino
function configurarBotaoIniciar() {
    const startBtn = document.getElementById('start-workout-btn');
    if (!startBtn) return;
    
    const workout = AppState.get('currentWorkout');
    
    startBtn.onclick = () => {
        if (!workout) {
            if (window.abrirPlanejamentoParaUsuarioAtual) {
                window.abrirPlanejamentoParaUsuarioAtual();
            } else {
                showNotification('Configure seu planejamento primeiro', 'warning');
            }
            return;
        }
        
        switch(workout.tipo) {
            case 'folga':
                showNotification('Hoje é dia de descanso! 😴 Aproveite para se recuperar.', 'info');
                break;
                
            case 'cardio':
            case 'Cardio':
                showNotification('Hora do cardio! 🏃‍♂️ Vamos queimar calorias!', 'success');
                break;
                
            default:
                if (window.iniciarTreino) {
                    window.iniciarTreino();
                } else {
                    showNotification(`Vamos treinar ${workout.tipo}! 💪 Em desenvolvimento...`, 'info');
                }
                break;
        }
    };
    
    startBtn.disabled = false;
    console.log('[configurarBotaoIniciar] ✅ Botão configurado para:', workout?.tipo || 'configuração');
}

// Configurar event listeners
function configurarEventListeners() {
    // Listener para mudanças no estado
    AppState.subscribe('weekPlan', () => {
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
    
    // Atualizar progresso a cada minuto
    setInterval(() => {
        const progressTextEl = document.getElementById('workout-progress-text');
        const workout = AppState.get('currentWorkout');
        
        if (progressTextEl && workout && workout.tipo !== 'folga') {
            const agora = new Date();
            const horaAtual = agora.getHours();
            
            // Progresso do dia (6h às 22h = 100%)
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
    }, 60000);
    
    console.log('[configurarEventListeners] ✅ Event listeners configurados');
}

// Funções auxiliares
function formatarTipoDia(diaPlan) {
    if (typeof diaPlan === 'string') {
        return diaPlan === 'folga' ? 'Folga' :
               diaPlan === 'cardio' ? 'Cardio' :
               `Treino ${diaPlan}`;
    }
    
    if (diaPlan && diaPlan.tipo) {
        return diaPlan.tipo === 'folga' ? 'Folga' :
               diaPlan.tipo === 'Cardio' ? 'Cardio' :
               `Treino ${diaPlan.tipo}`;
    }
    
    return 'Folga';
}

function updateElement(element, value) {
    if (!element) return;
    
    if (typeof element === 'string') {
        const el = document.getElementById(element);
        if (el) el.textContent = value;
    } else {
        element.textContent = value;
    }
}

// Funções públicas para atualização externa
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
        
        console.log('[atualizarMetricasTempoReal] ✅ Métricas atualizadas');
        
    } catch (error) {
        console.error('[atualizarMetricasTempoReal] Erro:', error);
    }
}

export function recarregarDashboard() {
    console.log('[recarregarDashboard] Forçando reload completo...');
    carregarDashboard();
}

// Exportar para compatibilidade global
window.carregarDashboard = carregarDashboard;
window.recarregarDashboard = recarregarDashboard;