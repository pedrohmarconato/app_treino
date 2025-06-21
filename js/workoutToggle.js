// Função para expandir/contrair o card principal do treino
window.toggleWorkoutCard = function() {
    console.log('[toggleWorkoutCard] 🔍 Função chamada!');
    
    const card = document.getElementById('current-workout-card');
    const expandableContent = document.getElementById('expandable-content');
    const toggleBtn = document.getElementById('workout-toggle');
    const topActionArea = document.getElementById('top-action-area');
    
    if (!card || !expandableContent || !toggleBtn) {
        console.error('[toggleWorkoutCard] ❌ Elementos necessários não encontrados!');
        return;
    }
    
    const isExpanded = card.classList.contains('expanded');
    
    console.log('[toggleWorkoutCard] Estado atual:', {
        isExpanded,
        cardClasses: card.className,
        toggleClasses: toggleBtn.className
    });
    
    if (isExpanded) {
        // Contrair
        console.log('[toggleWorkoutCard] 📤 Contraindo...');
        expandableContent.style.display = 'none';
        card.classList.remove('expanded');
        toggleBtn.classList.remove('expanded');
        
        if (topActionArea) {
            topActionArea.classList.remove('hidden');
        }
    } else {
        // Expandir
        console.log('[toggleWorkoutCard] 📥 Expandindo...');
        expandableContent.style.display = 'block';
        card.classList.add('expanded');
        toggleBtn.classList.add('expanded');
        
        if (topActionArea) {
            topActionArea.classList.add('hidden');
        }
        
        // Sincronizar dados
        syncWorkoutData();
    }
};

// Função para sincronizar dados
function syncWorkoutData() {
    console.log('[syncWorkoutData] 🔄 Iniciando sincronização...');
    
    try {
        const currentUser = window.AppState?.get('currentUser');
        if (!currentUser) {
            console.warn('[syncWorkoutData] ❌ Usuário não encontrado');
            return;
        }

        loadTodayWorkoutExercises(currentUser.id);
    } catch (error) {
        console.error('[syncWorkoutData] ❌ Erro:', error);
    }
}

// Função para carregar exercícios
async function loadTodayWorkoutExercises(userId) {
    const container = document.getElementById('workout-exercises-list');
    if (!container) return;

    // Mostrar loading com novo design
    container.innerHTML = `
        <div class="exercises-loading-state">
            <div class="pulse-loader">
                <div class="pulse-circle"></div>
                <div class="pulse-circle"></div>
                <div class="pulse-circle"></div>
            </div>
            <p class="loading-text">Carregando exercícios...</p>
        </div>
    `;

    try {
        // Usar controller centralizado
        const { carregarExerciciosParaExpandir } = await import('../controllers/workoutController.js');
        const workoutData = await carregarExerciciosParaExpandir(userId);
        
        if (!workoutData || !workoutData.data) {
            showNoExercisesMessage('Nenhum treino configurado para hoje.');
            return;
        }
        
        const exercises = workoutData.data;
        const planejamento = workoutData.planejamento;
        
        if (planejamento?.tipo_atividade === 'folga') {
            showNoExercisesMessage('Hoje é dia de descanso! 😴', 'info');
            return;
        }
        
        if (planejamento?.tipo_atividade === 'cardio') {
            showNoExercisesMessage('Treino de cardio configurado! 🏃‍♂️', 'info');
            return;
        }
        
        if (!exercises || exercises.length === 0) {
            showNoExercisesMessage('Nenhum exercício encontrado para este treino.');
            return;
        }
        
        displayExercisesFromProtocol(exercises, planejamento);
    } catch (error) {
        console.error('[loadTodayWorkoutExercises] Erro:', error);
        showNoExercisesMessage('Erro ao carregar exercícios: ' + error.message);
    }
}

// Função para mostrar mensagem quando não há exercícios
function showNoExercisesMessage(message = 'Nenhum exercício programado para hoje', type = 'warning') {
    const container = document.getElementById('workout-exercises-list');
    if (!container) return;

    const icons = {
        info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
        warning: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
        error: '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>'
    };

    container.innerHTML = `
        <div class="no-exercises-message ${type}">
            <div class="message-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    ${icons[type] || icons.warning}
                </svg>
            </div>
            <p class="message-text">${message}</p>
        </div>
    `;
}

// Função para exibir exercícios
function displayExercisesFromProtocol(exercises, planejamento) {
    const container = document.getElementById('workout-exercises-list');
    if (!container) return;

    const headerHtml = `
        <div class="exercises-header">
            <h4>Treino ${planejamento?.tipo_atividade || 'de Força'}</h4>
            <p class="exercises-count">${exercises.length} exercício${exercises.length !== 1 ? 's' : ''} • Semana ${planejamento?.semana_treino || 'N/A'}</p>
        </div>
    `;

    const exercisesHtml = exercises.map((exercise, index) => {
        const nome = exercise.nome || exercise.exercicio_nome || 'Exercício sem nome';
        const grupo = exercise.grupo_muscular || exercise.exercicio_grupo || 'N/A';
        const equipamento = exercise.equipamento || exercise.exercicio_equipamento || 'N/A';
        
        const pesoBase = exercise.peso_base || exercise.peso || 0;
        const pesoMin = exercise.peso_min || pesoBase;
        const pesoMax = exercise.peso_max || pesoBase;
        const pesoDisplay = pesoMin !== pesoMax ? `${pesoMin}-${pesoMax}kg` : `${pesoBase}kg`;
        
        const series = exercise.series || exercise.num_series || 3;
        const repeticoes = exercise.repeticoes || exercise.repeticoes_alvo || exercise.reps || 10;
        const descanso = exercise.tempo_descanso || exercise.rest_time || 90;
        const observacoes = exercise.observacoes || exercise.obs || exercise.notes || '';

        return `
            <div class="exercise-card">
                <div class="exercise-header">
                    <div class="exercise-number">${index + 1}</div>
                    <div class="exercise-info">
                        <h4 class="exercise-name">${nome}</h4>
                        <p class="exercise-muscle">${grupo}</p>
                    </div>
                </div>
                
                <div class="exercise-details">
                    <div class="exercise-weight">
                        <span class="label">Peso</span>
                        <span class="value">${pesoDisplay}</span>
                    </div>
                    <div class="exercise-sets">
                        <span class="label">Séries</span>
                        <span class="value">${series}x${repeticoes}</span>
                    </div>
                    <div class="exercise-rest">
                        <span class="label">Descanso</span>
                        <span class="value">${descanso}s</span>
                    </div>
                    <div class="exercise-equipment">
                        <span class="label">Equipamento</span>
                        <span class="equipment-tag">${equipamento}</span>
                    </div>
                </div>
                
                ${observacoes ? `
                    <div class="exercise-notes">
                        <strong>Observações:</strong> ${observacoes}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');

    const footerHtml = `
        <div class="exercises-footer">
            <p class="rm-info">💡 Pesos calculados baseados na sua 1RM e progressão da semana ${planejamento?.semana_treino || 'N/A'}</p>
        </div>
    `;

    container.innerHTML = headerHtml + `<div class="exercises-grid">${exercisesHtml}</div>` + footerHtml;
}

// Disponibilizar globalmente
window.displayExercisesFromProtocol = displayExercisesFromProtocol;

// Inicializar quando DOM carregar
document.addEventListener('DOMContentLoaded', function() {
    const topActionArea = document.getElementById('top-action-area');
    const expandableContent = document.getElementById('expandable-content');
    
    if (topActionArea && expandableContent) {
        if (expandableContent.style.display !== 'none') {
            topActionArea.classList.add('hidden');
        } else {
            topActionArea.classList.remove('hidden');
        }
    }
});

console.log('🎯 Workout Toggle System carregado!');