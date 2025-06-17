// Função para expandir/contrair exercícios
window.toggleExercises = function() {
    const expandBtn = document.getElementById('expand-exercises');
    const exercisesExpanded = document.getElementById('exercises-expanded');
    const expandText = expandBtn.querySelector('.expand-text');
    
    if (!expandBtn || !exercisesExpanded) return;
    
    const isExpanded = exercisesExpanded.style.display !== 'none';
    
    if (isExpanded) {
        // Contrair
        exercisesExpanded.style.display = 'none';
        expandBtn.classList.remove('expanded');
        expandText.textContent = 'Ver treino completo';
    } else {
        // Expandir
        exercisesExpanded.style.display = 'block';
        expandBtn.classList.add('expanded');
        expandText.textContent = 'Ocultar treino';
        
        // Carregar treino completo se ainda não foi carregado
        loadFullWorkout();
    }
};

// Função para carregar treino completo
function loadFullWorkout() {
    const expandedContainer = document.getElementById('exercises-expanded');
    if (!expandedContainer) return;
    
    // Se já tem conteúdo, não recarregar
    if (expandedContainer.innerHTML.trim()) return;
    
    // Exemplo de treino completo - substituir pela lógica real
    const fullWorkout = `
        <div class="full-workout">
            <h5>Treino Completo - Peito</h5>
            <div class="exercise-item">
                <div class="exercise-name">Supino Reto</div>
                <div class="exercise-details">4 séries × 8-12 reps × 80kg</div>
            </div>
            <div class="exercise-item">
                <div class="exercise-name">Supino Inclinado</div>
                <div class="exercise-details">3 séries × 10-15 reps × 60kg</div>
            </div>
            <div class="exercise-item">
                <div class="exercise-name">Crucifixo</div>
                <div class="exercise-details">3 séries × 12-15 reps × 20kg</div>
            </div>
            <div class="exercise-item">
                <div class="exercise-name">Flexão</div>
                <div class="exercise-details">2 séries × máximo × peso corporal</div>
            </div>
        </div>
    `;
    
    expandedContainer.innerHTML = fullWorkout;
}

// Estilos para o treino completo
const exerciseStyles = `
    .full-workout h5 {
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid var(--border-color);
    }
    
    .exercise-item {
        padding: 8px 0;
        border-bottom: 1px solid var(--border-color);
    }
    
    .exercise-item:last-child {
        border-bottom: none;
    }
    
    .exercise-name {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 2px;
    }
    
    .exercise-details {
        font-size: 0.75rem;
        color: var(--text-secondary);
    }
`;

// Injetar estilos
const styleSheet = document.createElement('style');
styleSheet.textContent = exerciseStyles;
document.head.appendChild(styleSheet);