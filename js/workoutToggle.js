// Função para expandir/contrair o card principal do treino
window.toggleWorkoutCard = function() {
    const card = document.getElementById('current-workout-card');
    const expandableContent = document.getElementById('expandable-content');
    const toggleBtn = document.getElementById('workout-toggle');
    const topActionArea = document.getElementById('top-action-area');
    
    if (!card || !expandableContent || !toggleBtn) return;
    
    const isExpanded = expandableContent.style.display !== 'none';
    
    if (isExpanded) {
        // Contrair
        expandableContent.style.display = 'none';
        card.classList.remove('expanded');
        toggleBtn.classList.remove('expanded');
        
        // Mostrar botão do topo quando reduzido
        if (topActionArea) {
            topActionArea.classList.remove('hidden');
        }
    } else {
        // Expandir
        expandableContent.style.display = 'block';
        card.classList.add('expanded');
        toggleBtn.classList.add('expanded');
        
        // Ocultar botão do topo quando expandido
        if (topActionArea) {
            topActionArea.classList.add('hidden');
        }
        
        // Sincronizar dados principais com os dados expandidos
        syncWorkoutData();
    }
};

// Função para sincronizar dados entre versão compacta e expandida
async function syncWorkoutData() {
    console.log('Sincronizando dados do treino...');
    
    try {
        // Buscar dados do treino atual
        const currentUser = window.AppState?.get('currentUser');
        if (!currentUser) {
            console.warn('Usuário não encontrado para carregar exercícios');
            return;
        }

        // Buscar treino do dia atual
        await loadTodayWorkoutExercises(currentUser.id);
        
    } catch (error) {
        console.error('Erro ao sincronizar dados do treino:', error);
        showNoExercisesMessage();
    }
}

// Função para carregar exercícios do treino de hoje
async function loadTodayWorkoutExercises(userId) {
    const container = document.getElementById('workout-exercises-list');
    if (!container) return;

    // Mostrar loading
    container.innerHTML = `
        <div class="loading-exercises">
            <div class="loading-spinner"></div>
            <p>Carregando exercícios...</p>
        </div>
    `;

    try {
        // Buscar dados do treino via cache ou localStorage
        let workoutData = window._cachedWorkoutData;

        // Fallback para dados locais
        if (!workoutData && window.getWeekPlan) {
            workoutData = window.getWeekPlan(userId);
        }
        
        // Fallback adicional para AppState
        if (!workoutData && window.AppState) {
            workoutData = window.AppState.get('weekPlan') || window.AppState.get('currentWorkout');
        }

        // Buscar treino do dia atual
        const today = new Date();
        const dayNames = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
        const todayName = dayNames[today.getDay()];
        
        console.log('Dados do treino recebidos:', workoutData);
        console.log('Tipo dos dados:', typeof workoutData, Array.isArray(workoutData));
        console.log('Dia atual:', todayName);
        
        // Verificar se workoutData é um array ou objeto
        let todayWorkout = null;
        
        if (Array.isArray(workoutData)) {
            // Se for array, buscar pelo dia
            todayWorkout = workoutData.find(day => day.dia === todayName);
        } else if (workoutData && typeof workoutData === 'object') {
            // Se for objeto, pode ter estrutura diferente
            if (workoutData.planejamento && Array.isArray(workoutData.planejamento)) {
                todayWorkout = workoutData.planejamento.find(day => day.dia === todayName);
            } else if (workoutData[todayName]) {
                // Se for objeto com chaves dos dias (string)
                todayWorkout = workoutData[todayName];
            } else {
                // Mapear dia da semana para número 
                // Testando diferentes mapeamentos baseados na estrutura encontrada
                const dayNumbers = {
                    'domingo': '6',  // Domingo pode ser 0 ou 6 dependendo do sistema
                    'segunda': '1', 
                    'terca': '2',
                    'quarta': '3',
                    'quinta': '4',
                    'sexta': '5',
                    'sabado': '6'
                };
                
                // Se as chaves são 1-6, ajustar mapeamento
                const keys = Object.keys(workoutData);
                if (keys.includes('1') && keys.includes('2') && !keys.includes('0')) {
                    // Sistema 1-6 (Segunda=1, Terça=2, etc.)
                    dayNumbers.domingo = '7'; // ou pode não existir
                }
                
                const todayNumber = dayNumbers[todayName];
                console.log('Mapeando dia:', todayName, '->', todayNumber);
                
                if (todayNumber && workoutData[todayNumber]) {
                    todayWorkout = workoutData[todayNumber];
                    console.log('Treino encontrado pela chave numérica:', todayWorkout);
                } else {
                    // Tentar encontrar estrutura de dados alternativa
                    console.log('Estrutura de dados não reconhecida:', Object.keys(workoutData));
                    console.log('Dados completos:', workoutData);
                }
            }
        }
        
        console.log('Treino encontrado para hoje:', todayWorkout);
        
        // Se não encontrou dados válidos
        if (!workoutData) {
            showNoExercisesMessage('Dados do treino não disponíveis. Configure seu planejamento semanal.');
            return;
        }
        
        if (!todayWorkout) {
            showNoExercisesMessage('Nenhum treino programado para hoje.');
            return;
        }
        
        if (todayWorkout.tipo === 'folga') {
            showNoExercisesMessage('Hoje é dia de descanso! 😴');
            return;
        }

        if (todayWorkout.tipo === 'cardio') {
            showCardioMessage();
            return;
        }

        // Buscar exercícios do treino
        let exercises = todayWorkout.exercicios || todayWorkout.exercises || [];
        console.log('Exercícios encontrados no treino:', exercises);
        
        // Se não há exercícios na estrutura atual, buscar do Supabase
        if (!exercises || exercises.length === 0) {
            console.log('Buscando exercícios do Supabase para:', todayWorkout.tipo, 'Semana:', todayWorkout.numero_treino);
            
            try {
                // Buscar exercícios usando query do Supabase
                if (window.query) {
                    console.log('Executando query no Supabase...');
                    const result = await window.query('treino_exercicios', {
                        eq: { 
                            grupo_muscular: todayWorkout.tipo,
                            numero_treino: todayWorkout.numero_treino || 1
                        },
                        select: 'exercicio_nome, exercicio_grupo, exercicio_equipamento, series, repeticoes, peso, descanso, observacoes'
                    });
                    
                    console.log('Resultado da query Supabase:', result);
                    
                    if (result.data && result.data.length > 0) {
                        exercises = result.data.map(ex => ({
                            exercicio_nome: ex.exercicio_nome,
                            exercicio_grupo: ex.exercicio_grupo,
                            exercicio_equipamento: ex.exercicio_equipamento,
                            series: ex.series || 3,
                            repeticoes: ex.repeticoes || '12',
                            peso: ex.peso || '0',
                            descanso: ex.descanso || '60',
                            obs: ex.observacoes
                        }));
                        console.log('Exercícios carregados do Supabase:', exercises);
                    } else {
                        console.log('Nenhum exercício encontrado no Supabase');
                        exercises = [];
                    }
                } else {
                    console.log('window.query não disponível');
                    exercises = [];
                }
                
                // Fallback: tentar buscar do WorkoutService
                if ((!exercises || exercises.length === 0) && window.WorkoutService && window.WorkoutService.getExercisesByMuscleGroup) {
                    console.log('Tentando WorkoutService...');
                    exercises = await window.WorkoutService.getExercisesByMuscleGroup(todayWorkout.tipo);
                    console.log('Exercícios carregados do WorkoutService:', exercises);
                }
                
            } catch (error) {
                console.warn('Erro ao buscar exercícios:', error);
                exercises = [];
            }
        }
        
        if (exercises && exercises.length > 0) {
            renderWorkoutExercises(exercises, todayWorkout.tipo);
        } else {
            showNoExercisesMessage(`Exercícios para ${todayWorkout.tipo} não encontrados no banco de dados. Configure os exercícios no sistema de planejamento.`);
        }

    } catch (error) {
        console.error('Erro ao carregar exercícios:', error);
        showNoExercisesMessage('Erro ao carregar exercícios');
    }
}

// Função para renderizar exercícios
function renderWorkoutExercises(exercises, workoutType) {
    const container = document.getElementById('workout-exercises-list');
    if (!container) return;

    const exercisesHTML = exercises.map((exercise, index) => `
        <div class="exercise-item">
            <div class="exercise-header">
                <div class="exercise-info">
                    <h4>${exercise.exercicio_nome || exercise.nome}</h4>
                    <p>${exercise.exercicio_grupo || workoutType} • ${exercise.exercicio_equipamento || 'Livre'}</p>
                </div>
                <div class="exercise-badge">${index + 1}</div>
            </div>
            
            <div class="exercise-sets header">
                <div class="set-number">Série</div>
                <div class="set-weight">Peso (kg)</div>
                <div class="set-reps">Reps</div>
                <div class="set-rest">Descanso</div>
            </div>
            
            ${generateExerciseSets(exercise)}
            
            ${exercise.obs ? `<div class="exercise-notes">${exercise.obs}</div>` : ''}
        </div>
    `).join('');

    container.innerHTML = exercisesHTML;
}

// Função para gerar séries do exercício
function generateExerciseSets(exercise) {
    const series = exercise.series || 3;
    const reps = exercise.repeticoes || exercise.reps || '12';
    const weight = exercise.peso || exercise.weight || '0';
    const rest = exercise.descanso || exercise.rest || '60';

    let setsHTML = '';
    for (let i = 1; i <= series; i++) {
        setsHTML += `
            <div class="exercise-sets">
                <div class="set-number">${i}</div>
                <div class="set-weight">${weight}</div>
                <div class="set-reps">${reps}</div>
                <div class="set-rest">${i === series ? '-' : rest + 's'}</div>
            </div>
        `;
    }
    
    return setsHTML;
}

// Função para mostrar mensagem quando não há exercícios
function showNoExercisesMessage(message = 'Nenhum exercício programado para hoje') {
    const container = document.getElementById('workout-exercises-list');
    if (!container) return;

    container.innerHTML = `
        <div class="no-exercises">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="m9 12 2 2 4-4"/>
            </svg>
            <p>${message}</p>
        </div>
    `;
}

// Função para mostrar mensagem de cardio
function showCardioMessage() {
    const container = document.getElementById('workout-exercises-list');
    if (!container) return;

    container.innerHTML = `
        <div class="no-exercises">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 12h18m-9-9v18"/>
            </svg>
            <p>Hoje é dia de cardio! 🏃‍♂️</p>
            <p>Escolha sua atividade cardiovascular preferida</p>
        </div>
    `;
}

// REMOVIDO: Função de exercícios padrão/simulados
// Conforme regra estabelecida: é proibido simular ou inventar dados

// Função para atualizar informações do treino
window.updateWorkoutInfo = function(exerciseCount, duration) {
    const exercisesEl = document.getElementById('workout-exercises');
    const durationEl = document.getElementById('workout-duration');
    
    if (exercisesEl) exercisesEl.textContent = (exerciseCount || '0') + ' exercícios';
    if (durationEl) durationEl.textContent = '~' + (duration || '30') + 'min';
};

// Função para aplicar sistema de cores nos dias
window.updateDayStatus = function(dayId, status) {
    const dayCard = document.getElementById(`card-${dayId}`) || 
                   document.querySelector(`[data-day="${dayId}"]`) ||
                   document.querySelector(`.day-indicator:nth-child(${getDayIndex(dayId)})`);
    
    if (!dayCard) return;
    
    // Remover classes de status anteriores
    dayCard.classList.remove('completed', 'cancelled', 'pending', 'today');
    
    // Adicionar nova classe de status
    switch(status) {
        case 'completed':
            dayCard.classList.add('completed');
            break;
        case 'cancelled':
            dayCard.classList.add('cancelled');
            break;
        case 'today':
            dayCard.classList.add('today');
            break;
        default:
            dayCard.classList.add('pending');
    }
};

// Helper para obter índice do dia
function getDayIndex(dayName) {
    const days = {
        'domingo': 1, 'segunda': 2, 'terca': 3, 'quarta': 4,
        'quinta': 5, 'sexta': 6, 'sabado': 7
    };
    return days[dayName] || 1;
}

// Inicializar quando DOM carregar
document.addEventListener('DOMContentLoaded', function() {
    // Garantir que o botão do topo esteja visível inicialmente (estado reduzido)
    const topActionArea = document.getElementById('top-action-area');
    const expandableContent = document.getElementById('expandable-content');
    
    if (topActionArea && expandableContent) {
        // Se começar expandido, ocultar botão do topo
        if (expandableContent.style.display !== 'none') {
            topActionArea.classList.add('hidden');
        } else {
            // Se começar reduzido, mostrar botão do topo
            topActionArea.classList.remove('hidden');
        }
    }
    
    // Exemplo de uso - simular dados
    setTimeout(() => {
        updateWorkoutInfo(8, 45);
        updateDayStatus('segunda', 'completed');
        updateDayStatus('terca', 'today');
        updateDayStatus('quinta', 'cancelled');
    }, 1000);
});

console.log('🎯 Workout Toggle System carregado - Design Neon ativo!');