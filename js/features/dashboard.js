// js/features/dashboard.js - Dashboard simplificado sem duplicatas
import AppState from '../state/appState.js';
import { fetchMetricasUsuario } from '../services/userService.js';
import WeeklyPlanService from '../../services/weeklyPlanningService.js';
import { showNotification } from '../ui/notifications.js';

// Mapear tipos de treino para emojis
const TREINO_EMOJIS = {
    'Peito': '💪', 'Costas': '🔙', 'Pernas': '🦵', 
    'Ombro e Braço': '🎯', 'Ombro': '🎯', 'Braço': '🎯', 
    'Cardio': '🏃', 'cardio': '🏃', 'folga': '😴',
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
            // preCarregarExerciciosTreino() - DESABILITADO: usando implementação unificada
        ]);

        configurarBotaoIniciar();
        configurarEventListeners();
        
        console.log('[carregarDashboard] ✅ Dashboard carregado com sucesso!');
        
        // Verificar se há inconsistência entre dados (debug)
        const currentWorkout = AppState.get('currentWorkout');
        if (currentWorkout) {
            console.log('[carregarDashboard] 🔍 Estado final currentWorkout:', {
                tipo: currentWorkout.tipo,
                concluido: currentWorkout.concluido,
                totalExecucoes: currentWorkout.totalExecucoes,
                criterio: currentWorkout.criterioUtilizado
            });
            
            // Se detectar inconsistência, agendar uma nova verificação
            if (currentWorkout.totalExecucoes > 0 && !currentWorkout.concluido) {
                console.log('[carregarDashboard] ⚠️ Detectada possível inconsistência, reagendando verificação...');
                setTimeout(() => {
                    forcarAtualizacaoStatus();
                }, 2000);
            }
        }
        
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
        
        // Primeiro tenta buscar do WeeklyPlanningService (database)
        let weekPlan = null;
        if (window.WeeklyPlanService) {
            try {
                weekPlan = await window.WeeklyPlanService.getActiveWeeklyPlan(currentUser.id);
            } catch (error) {
                console.warn('[carregarIndicadoresSemana] Erro ao buscar do database:', error);
            }
        }
        
        // Fallback para localStorage e AppState
        if (!weekPlan) {
            weekPlan = getWeekPlan(currentUser.id) || AppState.get('weekPlan');
        }
        
        const container = document.getElementById('week-indicators');
        if (!container) return;

        const hoje = new Date().getDay();
        let html = '';

        // Buscar status de conclusão para todos os dias da semana
        const statusSemana = {};
        if (window.WeeklyPlanService?.verificarTreinoConcluido && currentUser) {
            // Por enquanto só verificar o dia de hoje
            try {
                const statusHoje = await window.WeeklyPlanService.verificarTreinoConcluido(currentUser.id);
                statusSemana[hoje] = statusHoje;
                console.log('[carregarIndicadoresSemana] Status de hoje:', statusHoje);
            } catch (error) {
                console.log(`[carregarIndicadoresSemana] Erro ao verificar status de hoje:`, error);
            }
        }

        for (let i = 0; i < 7; i++) {
            const diaPlan = weekPlan ? weekPlan[i] : null;
            const isToday = i === hoje;
            
            // Verificar se treino está realmente concluído
            const statusDia = statusSemana[i];
            let isCompleted = false;
            if (statusDia && statusDia.concluido) {
                isCompleted = true;
                console.log(`[carregarIndicadoresSemana] Dia ${i} está concluído:`, statusDia);
            }
            
            // TESTE TEMPORÁRIO: Forçar terça-feira (dia 2) como concluído
            if (i === 2 && diaPlan && diaPlan.tipo !== 'folga') {
                isCompleted = true;
                console.log(`[carregarIndicadoresSemana] TESTE: Forçando terça-feira como concluída`);
            }
            
            let dayType = 'Folga';
            let dayClass = 'day-indicator';
            
            if (diaPlan) {
                dayType = formatarTipoDia(diaPlan);
                // Adicionar emoji baseado no tipo e status
                let emoji = TREINO_EMOJIS[dayType] || TREINO_EMOJIS[diaPlan.tipo] || '🏋️';
                
                // Se concluído (usando status real), mostrar emoji de sucesso
                if (statusDia && statusDia.concluido) {
                    emoji = '✅';
                    dayClass += ' workout-completed';
                }
                
                // Se é folga, adicionar classe específica
                if (diaPlan.tipo === 'folga' || dayType.toLowerCase().includes('folga')) {
                    dayClass += ' folga';
                }
                
                dayType = `${emoji} ${dayType}`;
            } else {
                // Dia sem planejamento - provavelmente folga
                dayClass += ' folga';
            }
            
            if (isToday) dayClass += ' today';
            if (isCompleted) dayClass += ' completed';
            
            // Log para debug
            if (isCompleted || isToday) {
                console.log(`[carregarIndicadoresSemana] Dia ${i} (${DIAS_SEMANA[i]}):`, {
                    dayClass,
                    isCompleted,
                    isToday,
                    statusDia,
                    dayType
                });
            }

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
        
        // Verificar se treino de hoje está concluído
        let statusConclusao = { concluido: false };
        if (window.WeeklyPlanService?.verificarTreinoConcluido) {
            try {
                statusConclusao = await window.WeeklyPlanService.verificarTreinoConcluido(currentUser.id);
            } catch (error) {
                console.warn('[carregarTreinoAtual] Erro ao verificar conclusão:', error);
            }
        }
        
        // Primeiro tenta buscar do WeeklyPlanningService (database)
        let weekPlan = null;
        if (window.WeeklyPlanService) {
            try {
                weekPlan = await window.WeeklyPlanService.getActiveWeeklyPlan(currentUser.id);
            } catch (error) {
                console.warn('[carregarTreinoAtual] Erro ao buscar do database:', error);
            }
        }
        
        // Fallback para localStorage e AppState
        if (!weekPlan) {
            weekPlan = getWeekPlan(currentUser.id) || AppState.get('weekPlan');
        }
        const hoje = new Date().getDay();
        
        let treinoDoDia = null;
        
        if (weekPlan && weekPlan[hoje]) {
            const planHoje = weekPlan[hoje];
            treinoDoDia = {
                tipo: typeof planHoje === 'string' ? planHoje : (planHoje.tipo || planHoje.tipo_atividade),
                nome: formatarTipoDia(planHoje),
                numero_treino: planHoje.numero_treino,
                concluido: statusConclusao.concluido,
                data_conclusao: statusConclusao.data_conclusao,
                totalExecucoes: statusConclusao.totalExecucoes,
                exerciciosUnicos: statusConclusao.exerciciosUnicos,
                criterioUtilizado: statusConclusao.criterioUtilizado,
                protocolo_id: planHoje.protocolo_id
            };
        }
        
        atualizarUITreinoAtual(treinoDoDia);
        AppState.set('currentWorkout', treinoDoDia);
        
        console.log('[carregarTreinoAtual] ✅ Treino atual:', treinoDoDia?.nome || 'Nenhum');
        console.log('[carregarTreinoAtual] 🔍 Status conclusão:', { 
            concluido: treinoDoDia?.concluido, 
            totalExecucoes: treinoDoDia?.totalExecucoes,
            criterio: treinoDoDia?.criterioUtilizado
        });
        
    } catch (error) {
        console.error('[carregarTreinoAtual] Erro:', error);
        atualizarUITreinoAtual(null);
    }
}

// Atualizar UI do treino atual
function atualizarUITreinoAtual(treino) {
    console.log('[atualizarUITreinoAtual] 🎯 Recebendo treino:', treino);
    
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
            elements.progressCircle.style.strokeDashoffset = '226.08';
        }
        return;
    }
    
    // Verificar se treino está concluído
    const treinoConcluido = treino.concluido;
    console.log('[atualizarUITreinoAtual] 🔍 Treino concluído?', treinoConcluido, {
        totalExecucoes: treino.totalExecucoes,
        criterio: treino.criterioUtilizado
    });
    
    // Configurar baseado no tipo e status de conclusão
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
            if (treinoConcluido) {
                updateElement(elements.exercises, '✅ Cardio Concluído • ' + formatarDataConclusao(treino.data_conclusao));
                updateElement(elements.btnText, '✅ Treino Concluído');
                updateElement(elements.progressText, '🎉');
            } else {
                updateElement(elements.exercises, 'Exercícios aeróbicos • 30-45min');
                updateElement(elements.btnText, 'Iniciar Cardio');
                updateElement(elements.progressText, '🏃');
            }
            break;
            
        default:
            const emoji = TREINO_EMOJIS[treino.tipo] || '🏋️';
            updateElement(elements.type, `Treino ${treino.tipo}`);
            updateElement(elements.name, `Treino ${treino.tipo}`);
            if (treinoConcluido) {
                const detalheConclusao = treino.totalExecucoes ? 
                    `${treino.exerciciosUnicos} exercícios • ${treino.totalExecucoes} séries` : 
                    formatarDataConclusao(treino.data_conclusao);
                
                updateElement(elements.exercises, `✅ ${treino.tipo} Concluído • ` + detalheConclusao);
                updateElement(elements.btnText, '✅ Treino Concluído');
                updateElement(elements.progressText, '🎉');
            } else {
                updateElement(elements.exercises, `Força • ${treino.tipo} • ~45min`);
                updateElement(elements.btnText, 'Iniciar Treino');
                updateElement(elements.progressText, emoji);
            }
            break;
    }
    
    // Atualizar botão de ação baseado no status
    const startWorkoutBtn = document.getElementById('start-workout-btn');
    if (startWorkoutBtn) {
        if (treinoConcluido) {
            startWorkoutBtn.classList.add('completed');
            startWorkoutBtn.disabled = false; // Mantém habilitado para dar opções
            startWorkoutBtn.style.opacity = '1';
            startWorkoutBtn.style.cursor = 'pointer';
            
            // Criar menu de opções para treino concluído
            startWorkoutBtn.onclick = () => {
                mostrarOpcoesTrienoConcluido(treino);
            };
        } else {
            startWorkoutBtn.classList.remove('completed');
            startWorkoutBtn.disabled = false;
            startWorkoutBtn.style.opacity = '1';
            startWorkoutBtn.style.cursor = 'pointer';
            startWorkoutBtn.onclick = window.iniciarTreino;
        }
    }
    
    // Simular progresso semanal
    const hoje = new Date().getDay();
    const progressoSemanal = Math.min((hoje / 7) * 100, 100);
    
    if (elements.progressCircle && treino.tipo !== 'folga') {
        const circumference = 226.08; // 2 * PI * radius (36)
        const offset = circumference - (progressoSemanal / 100) * circumference;
        elements.progressCircle.style.strokeDashoffset = offset.toString();
        
        if (treino.tipo === 'cardio' || treino.tipo === 'Cardio') {
            updateElement(elements.progressText, `${Math.round(progressoSemanal)}%`);
        }
    }
}

// Função helper para formatar data de conclusão
function formatarDataConclusao(dataString) {
    if (!dataString) return '';
    
    try {
        const data = new Date(dataString);
        const agora = new Date();
        const diffMs = agora - data;
        const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutos = Math.floor(diffMs / (1000 * 60));
        
        if (diffMinutos < 60) {
            return `há ${diffMinutos}min`;
        } else if (diffHoras < 24) {
            return `há ${diffHoras}h`;
        } else {
            return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        }
    } catch (error) {
        return 'hoje';
    }
}

// Mostrar opções para treino concluído
function mostrarOpcoesTrienoConcluido(treino) {
    const currentUser = AppState.get('currentUser');
    if (!currentUser) return;
    
    const detalhes = treino.totalExecucoes ? 
        `${treino.exerciciosUnicos} exercícios realizados\n${treino.totalExecucoes} séries executadas\nCritério: ${treino.criterioUtilizado}` :
        'Treino marcado como concluído';
    
    const opcoes = [
        '✅ Ver Resumo do Treino',
        '🔄 Refazer Treino (resetar)',
        '❌ Cancelar'
    ];
    
    if (window.showNotification) {
        // Usar um modal personalizado se disponível
        const escolha = confirm(
            `🎉 Treino ${treino.tipo} Concluído!\n\n${detalhes}\n\nDeseja refazer o treino? Isso irá resetar o status de conclusão.`
        );
        
        if (escolha) {
            refazerTreinoHoje(currentUser.id, treino);
        }
    } else {
        // Fallback simples
        if (confirm(`Treino ${treino.tipo} já concluído. Refazer?`)) {
            refazerTreinoHoje(currentUser.id, treino);
        }
    }
}

// Refazer treino de hoje
async function refazerTreinoHoje(userId, treino) {
    try {
        if (window.showNotification) {
            window.showNotification('🔄 Resetando treino...', 'info');
        }
        
        // Chamar função de reset
        if (window.WeeklyPlanService?.resetarTreinoHoje) {
            const resultado = await window.WeeklyPlanService.resetarTreinoHoje(userId, 'Refazer treino solicitado pelo usuário');
            
            if (resultado.sucesso) {
                if (window.showNotification) {
                    window.showNotification('✅ Treino resetado! Você pode iniciar novamente.', 'success');
                }
                
                // Recarregar dashboard
                setTimeout(() => {
                    carregarDashboard();
                }, 1000);
                
            } else {
                throw new Error(resultado.erro || 'Erro desconhecido ao resetar');
            }
        } else {
            throw new Error('Serviço de reset não disponível');
        }
        
    } catch (error) {
        console.error('[refazerTreinoHoje] Erro:', error);
        if (window.showNotification) {
            window.showNotification('❌ Erro ao resetar treino: ' + error.message, 'error');
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
        
        // Primeiro tenta buscar do WeeklyPlanningService (database)
        let weekPlan = null;
        if (window.WeeklyPlanService) {
            try {
                weekPlan = await window.WeeklyPlanService.getActiveWeeklyPlan(currentUser.id);
            } catch (error) {
                console.warn('[carregarPlanejamentoSemanal] Erro ao buscar do database:', error);
            }
        }
        
        // Fallback para localStorage e AppState
        if (!weekPlan) {
            weekPlan = getWeekPlan(currentUser.id) || AppState.get('weekPlan');
        }
        
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
    const startBtn = document.getElementById('floating-start-workout-btn');
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
    
    AppState.subscribe('planSaved', () => {
        console.log('[dashboard] Novo plano salvo, recarregando dados...');
        setTimeout(() => {
            carregarDashboard();
        }, 500); // Delay para garantir que a base de dados foi atualizada
    });
    
    AppState.subscribe('workoutCompleted', () => {
        console.log('[dashboard] Treino concluído, recarregando dashboard...');
        setTimeout(() => {
            carregarDashboard();
        }, 1000); // Delay maior para garantir que o banco foi atualizado
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
               diaPlan;
    }
    
    if (diaPlan && (diaPlan.tipo || diaPlan.tipo_atividade)) {
        const tipo = diaPlan.tipo || diaPlan.tipo_atividade;
        return tipo === 'folga' ? 'Folga' :
               tipo.toLowerCase() === 'cardio' ? 'Cardio' :
               tipo;
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

// Função para forçar atualização de status de conclusão
export async function forcarAtualizacaoStatus() {
    console.log('[forcarAtualizacaoStatus] 🔄 Forçando atualização de status...');
    
    const currentUser = AppState.get('currentUser');
    if (!currentUser) return;
    
    // Verificar status de conclusão em tempo real
    if (window.WeeklyPlanService?.verificarTreinoConcluido) {
        try {
            const statusAtual = await window.WeeklyPlanService.verificarTreinoConcluido(currentUser.id);
            console.log('[forcarAtualizacaoStatus] 📊 Status real atual:', statusAtual);
            
            // Forçar reload completo se necessário
            await carregarDashboard();
            
        } catch (error) {
            console.error('[forcarAtualizacaoStatus] Erro:', error);
        }
    }
}

// Função para pré-carregar exercícios do treino (em background)
async function preCarregarExerciciosTreino() {
    try {
        console.log('[preCarregarExerciciosTreino] 🏋️‍♂️ INICIANDO carregamento dos exercícios do treino do dia...');
        
        const currentUser = AppState.get('currentUser');
        if (!currentUser) {
            console.log('[preCarregarExerciciosTreino] ❌ CurrentUser não encontrado');
            return;
        }
        
        console.log('[preCarregarExerciciosTreino] 👤 Usuário encontrado:', currentUser.id, currentUser.nome);

        // Usar nossa nova função para buscar exercícios do dia atual
        console.log('[preCarregarExerciciosTreino] 🔍 Verificando WeeklyPlanService:', WeeklyPlanService);
        console.log('[preCarregarExerciciosTreino] 🔍 Verificando se função existe:', typeof WeeklyPlanService.buscarExerciciosTreinoDia);
        
        if (typeof WeeklyPlanService.buscarExerciciosTreinoDia !== 'function') {
            console.error('[preCarregarExerciciosTreino] ❌ Função buscarExerciciosTreinoDia não encontrada no WeeklyPlanService');
            mostrarMensagemExercicios('Função de busca não disponível', 'error');
            return;
        }
        
        console.log('[preCarregarExerciciosTreino] 🚀 Chamando função...');
        const resultado = await WeeklyPlanService.buscarExerciciosTreinoDia(currentUser.id);
        
        console.log('[preCarregarExerciciosTreino] 📊 Resultado da busca:', resultado);
        
        if (resultado.error) {
            console.log('[preCarregarExerciciosTreino] ⚠️', resultado.error);
            mostrarMensagemExercicios(resultado.error, 'warning');
            return;
        }
        
        if (resultado.message) {
            console.log('[preCarregarExerciciosTreino] 📝', resultado.message);
            mostrarMensagemExercicios(resultado.message, 'info');
            return;
        }
        
        if (resultado.data && resultado.data.length > 0) {
            console.log('[preCarregarExerciciosTreino] ✅ Exercícios encontrados:', resultado.data.length);
            renderizarExercicios(resultado.data, resultado.planejamento);
            
            // Cache para uso posterior
            window._cachedWorkoutData = resultado;
        } else {
            mostrarMensagemExercicios('Nenhum exercício encontrado para hoje', 'info');
        }

    } catch (error) {
        console.error('[preCarregarExerciciosTreino] ❌ Erro ao carregar exercícios:', error);
        mostrarMensagemExercicios('Erro ao carregar exercícios', 'error');
    }
}

// Renderizar lista de exercícios na interface
function renderizarExercicios(exercicios, planejamento) {
    const container = document.getElementById('workout-exercises-list');
    if (!container) return;
    
    const tipoTreino = planejamento?.tipo_atividade || 'Treino';
    const numeroTreino = planejamento?.numero_treino || '';
    
    let html = `
        <div class="exercises-header">
            <h4>🏋️‍♂️ ${tipoTreino} ${numeroTreino ? `- Treino ${numeroTreino}` : ''}</h4>
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
                
                ${exercicio.equipamento ? `
                    <div class="exercise-equipment">
                        <span class="equipment-tag">${exercicio.equipamento}</span>
                    </div>
                ` : ''}
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
    
    // Atualizar contagem de exercícios no subtitle
    const subtitleEl = document.getElementById('workout-exercises');
    if (subtitleEl) {
        subtitleEl.textContent = `${exercicios.length} exercício${exercicios.length !== 1 ? 's' : ''} programado${exercicios.length !== 1 ? 's' : ''}`;
    }
    
    console.log('[renderizarExercicios] ✅ Exercícios renderizados na interface');
}

// Mostrar mensagem quando não há exercícios
function mostrarMensagemExercicios(mensagem, tipo = 'info') {
    const container = document.getElementById('workout-exercises-list');
    if (!container) return;
    
    const iconMap = {
        'info': '📝',
        'warning': '⚠️', 
        'error': '❌'
    };
    
    container.innerHTML = `
        <div class="no-exercises-message ${tipo}">
            <div class="message-icon">${iconMap[tipo] || '📝'}</div>
            <p class="message-text">${mensagem}</p>
        </div>
    `;
    
    // Atualizar subtitle
    const subtitleEl = document.getElementById('workout-exercises');
    if (subtitleEl) {
        subtitleEl.textContent = mensagem;
    }
}

// Exportar para compatibilidade global
window.carregarDashboard = carregarDashboard;
window.recarregarDashboard = recarregarDashboard;
window.forcarAtualizacaoStatus = forcarAtualizacaoStatus;

// Função debug para teste manual
window.debugTreinoStatus = async () => {
    console.log('🔍 DEBUGGING TREINO STATUS...');
    const user = AppState.get('currentUser');
    if (!user) {
        console.log('❌ Usuário não encontrado');
        return;
    }
    
    console.log('👤 Usuário:', user.nome);
    
    if (window.WeeklyPlanService?.verificarTreinoConcluido) {
        const status = await window.WeeklyPlanService.verificarTreinoConcluido(user.id);
        console.log('📊 Status real do banco:', status);
    }
    
    const currentWorkout = AppState.get('currentWorkout');
    console.log('🎯 CurrentWorkout do AppState:', currentWorkout);
    
    console.log('🔄 Forçando atualização...');
    await forcarAtualizacaoStatus();
    
    console.log('✅ Debug concluído!');
};