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
function syncWorkoutData() {
    // Função simplificada - sem elementos de estatísticas removidos
    console.log('Workout data synchronized');
}

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