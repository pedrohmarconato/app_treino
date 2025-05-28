// Template da tela de treino
export const workoutTemplate = () => `
    <div id="workout-screen" class="screen">
        <button class="back-button" onclick="voltarParaHome()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 18l-6-6 6-6"/>
            </svg>
        </button>
        
        <div class="workout-container">
            <div class="workout-header">
                <h1 id="workout-title">Carregando...</h1>
                <p id="workout-subtitle" class="text-secondary"></p>
                <div class="progress-bar-container">
                    <div class="progress-bar" id="workout-progress-bar"></div>
                </div>
            </div>

            <div id="exercise-list" class="exercise-list">
                <!-- Exercícios serão carregados dinamicamente -->
            </div>

            <!-- Timer Container -->
            <div id="timer-container" class="timer-container" style="display: none;">
                <h3>Tempo de Descanso</h3>
                <div class="timer-circle">
                    <svg class="timer-svg" viewBox="0 0 200 200">
                        <circle class="timer-circle-bg" cx="100" cy="100" r="90"></circle>
                        <circle class="timer-circle-progress" cx="100" cy="100" r="90"
                                stroke-dasharray="565.48"
                                stroke-dashoffset="0"></circle>
                    </svg>
                    <div class="timer-display" id="timer-display">00:00</div>
                </div>
                <button class="btn-secondary" id="skip-rest-btn" onclick="pularDescanso()">
                    Pular Descanso
                </button>
            </div>

            <!-- Completion Container -->
            <div id="completion-container" class="completion-container" style="display: none;">
                <div class="completion-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 6L9 17l-5-5"/>
                    </svg>
                </div>
                <h2>Treino Concluído!</h2>
                <p>Parabéns! Você completou todos os exercícios.</p>
                
                <div class="workout-summary">
                    <div class="summary-item">
                        <span class="summary-label">Duração</span>
                        <span class="summary-value" id="workout-duration">00:00</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Exercícios</span>
                        <span class="summary-value" id="total-exercises">0</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Séries</span>
                        <span class="summary-value" id="total-series">0</span>
                    </div>
                </div>

                <button class="btn-primary" onclick="finalizarTreino()">
                    Finalizar Treino
                </button>
            </div>
        </div>
    </div>
`;

// Template para um exercício individual
export const exerciseItemTemplate = (exercise, index, total) => `
    <div class="exercise-card" data-exercise-id="${exercise.id}">
        <div class="exercise-header">
            <div class="exercise-info">
                <h3>${exercise.exercicio_nome}</h3>
                <p>${exercise.exercicio_grupo} • ${exercise.exercicio_equipamento}</p>
            </div>
            <div class="exercise-counter">
                ${index + 1}/${total}
            </div>
        </div>

        <div class="series-container">
            <div class="series-header">
                <span>Série</span>
                <span>Peso (kg)</span>
                <span>Repetições</span>
                <span></span>
            </div>
            <div id="series-list-${exercise.id}" class="series-list">
                <!-- Séries serão adicionadas dinamicamente -->
            </div>
        </div>

        <button class="btn-add-series" onclick="adicionarSerie(${exercise.id})">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14m-7-7h14"/>
            </svg>
            Adicionar Série
        </button>
    </div>
`;

// Template para uma série individual
export const seriesItemTemplate = (exerciseId, seriesNumber) => `
    <div class="series-row" id="series-${exerciseId}-${seriesNumber}">
        <span class="series-number">${seriesNumber}</span>
        <div class="series-input-group">
            <div class="input-wrapper">
                <button class="input-btn" onclick="ajustarPeso(${exerciseId}, ${seriesNumber}, -2.5)">-</button>
                <input type="number" class="series-input" id="peso-${exerciseId}-${seriesNumber}" 
                       value="0" step="2.5" min="0">
                <button class="input-btn" onclick="ajustarPeso(${exerciseId}, ${seriesNumber}, 2.5)">+</button>
            </div>
        </div>
        <div class="series-input-group">
            <div class="input-wrapper">
                <button class="input-btn" onclick="ajustarReps(${exerciseId}, ${seriesNumber}, -1)">-</button>
                <input type="number" class="series-input" id="reps-${exerciseId}-${seriesNumber}" 
                       value="0" step="1" min="0">
                <button class="input-btn" onclick="ajustarReps(${exerciseId}, ${seriesNumber}, 1)">+</button>
            </div>
        </div>
        <button class="btn-confirm-series" id="confirm-${exerciseId}-${seriesNumber}" 
                onclick="confirmarSerie(${exerciseId}, ${seriesNumber})">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 6L9 17l-5-5"/>
            </svg>
        </button>
    </div>
`;

// Estilos específicos da tela de treino
export const workoutStyles = `
    .workout-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 24px;
    }

    .workout-header {
        text-align: center;
        margin-bottom: 32px;
    }

    .workout-header h1 {
        font-size: 1.75rem;
        margin-bottom: 8px;
    }

    .progress-bar-container {
        height: 8px;
        background: var(--bg-secondary);
        border-radius: var(--radius-full);
        overflow: hidden;
        margin-top: 16px;
    }

    .progress-bar {
        height: 100%;
        background: var(--accent-green);
        transition: width 0.5s ease;
        width: 0%;
    }

    .exercise-list {
        display: flex;
        flex-direction: column;
        gap: 24px;
    }

    .exercise-card {
        background: var(--bg-card);
        border-radius: var(--radius-lg);
        padding: 24px;
        border: 1px solid var(--border-color);
    }

    .exercise-header {
        display: flex;
        justify-content: space-between;
        align-items: start;
        margin-bottom: 20px;
    }

    .exercise-info h3 {
        font-size: 1.125rem;
        margin-bottom: 4px;
    }

    .exercise-info p {
        color: var(--text-secondary);
        font-size: 0.875rem;
    }

    .exercise-counter {
        background: var(--bg-secondary);
        padding: 4px 12px;
        border-radius: var(--radius-full);
        font-size: 0.875rem;
        font-weight: 500;
    }

    .series-container {
        margin-bottom: 16px;
    }

    .series-header {
        display: grid;
        grid-template-columns: 60px 1fr 1fr 60px;
        gap: 12px;
        padding: 12px 0;
        border-bottom: 1px solid var(--border-color);
        font-size: 0.875rem;
        color: var(--text-secondary);
        font-weight: 500;
    }

    .series-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-top: 12px;
    }

    .series-row {
        display: grid;
        grid-template-columns: 60px 1fr 1fr 60px;
        gap: 12px;
        align-items: center;
        padding: 8px;
        background: var(--bg-secondary);
        border-radius: var(--radius-md);
        transition: all 0.2s ease;
    }

    .series-row.completed {
        background: rgba(16, 185, 129, 0.1);
        border: 1px solid var(--accent-green);
    }

    .series-number {
        text-align: center;
        font-weight: 600;
        color: var(--accent-green);
    }

    .series-input-group {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .input-wrapper {
        display: flex;
        align-items: center;
        background: var(--bg-primary);
        border-radius: var(--radius-sm);
        overflow: hidden;
        flex: 1;
    }

    .series-input {
        width: 100%;
        padding: 8px;
        background: transparent;
        border: none;
        color: var(--text-primary);
        text-align: center;
        font-size: 1rem;
        font-weight: 500;
    }

    .input-btn {
        padding: 8px 12px;
        background: transparent;
        border: none;
        color: var(--accent-green);
        cursor: pointer;
        font-size: 1.125rem;
        font-weight: 600;
        transition: all 0.2s ease;
    }

    .input-btn:hover {
        background: rgba(16, 185, 129, 0.1);
    }

    .btn-confirm-series {
        padding: 8px;
        background: var(--accent-green);
        color: white;
        border: none;
        border-radius: var(--radius-sm);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
    }

    .btn-confirm-series:disabled {
        background: var(--bg-primary);
        cursor: not-allowed;
        opacity: 0.5;
    }

    .btn-confirm-series svg {
        width: 20px;
        height: 20px;
    }

    .btn-add-series {
        width: 100%;
        padding: 12px;
        background: transparent;
        border: 2px dashed var(--border-color);
        border-radius: var(--radius-md);
        color: var(--text-secondary);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: all 0.2s ease;
    }

    .btn-add-series:hover {
        border-color: var(--accent-green);
        color: var(--accent-green);
    }

    .btn-add-series svg {
        width: 20px;
        height: 20px;
    }

    /* Timer Container */
    .timer-container {
        padding: 32px;
        text-align: center;
        max-width: 400px;
        margin: 40px auto;
        background: var(--bg-card);
        border-radius: var(--radius-lg);
    }

    .timer-container h3 {
        margin-bottom: 24px;
        font-size: 1.25rem;
    }

    .timer-circle {
        width: 200px;
        height: 200px;
        margin: 0 auto 24px;
        position: relative;
    }

    .timer-svg {
        transform: rotate(-90deg);
        width: 100%;
        height: 100%;
    }

    .timer-circle-bg {
        fill: none;
        stroke: var(--bg-secondary);
        stroke-width: 8;
    }

    .timer-circle-progress {
        fill: none;
        stroke: var(--accent-green);
        stroke-width: 8;
        stroke-linecap: round;
        transition: stroke-dashoffset 0.1s linear;
    }

    .timer-display {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 2.5rem;
        font-weight: 700;
        color: var(--accent-green);
    }

    /* Completion Container */
    .completion-container {
        text-align: center;
        padding: 48px 24px;
        max-width: 500px;
        margin: 0 auto;
    }

    .completion-icon {
        width: 80px;
        height: 80px;
        margin: 0 auto 24px;
        background: var(--accent-green);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .completion-icon svg {
        width: 48px;
        height: 48px;
        stroke: white;
        stroke-width: 3;
    }

    .completion-container h2 {
        font-size: 2rem;
        margin-bottom: 8px;
    }

    .completion-container p {
        color: var(--text-secondary);
        margin-bottom: 32px;
    }

    .workout-summary {
        display: flex;
        justify-content: center;
        gap: 32px;
        margin-bottom: 32px;
    }

    .summary-item {
        text-align: center;
    }

    .summary-label {
        display: block;
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin-bottom: 4px;
    }

    .summary-value {
        display: block;
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--accent-green);
    }
`;