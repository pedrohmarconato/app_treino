// Template da tela de treino - NOVO DESIGN FLUIDO
export const workoutTemplate = () => `
    <div id="workout-screen" class="screen dark-bg">
        <button class="back-button" onclick="voltarParaHome()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 18l-6-6 6-6"/>
            </svg>
        </button>
        <div class="workout-container">
            <div class="progress-bar">
                <div class="progress-fill" id="workout-progress-fill" style="width: 0%"></div>
            </div>
            <div id="exercise-card" class="exercise-card">
                <!-- Conteúdo dinâmico do exercício atual será inserido aqui -->
            </div>
        </div>
        <div class="rest-timer-overlay" id="rest-timer-overlay" style="display:none;">
            <div class="rest-timer-card">
                <div class="rest-timer-circle">
                    <svg viewBox="0 0 120 120">
                        <circle class="timer-bg" cx="60" cy="60" r="54"/>
                        <circle class="timer-progress" id="rest-timer-progress" cx="60" cy="60" r="54"/>
                    </svg>
                    <div class="rest-timer-display" id="rest-timer-display">00:00</div>
                </div>
                <button class="skip-rest-btn" onclick="pularDescanso()">Pular descanso</button>
            </div>
        </div>
    </div>
`;

// Template do exercício dinâmico, apenas UM por vez
export const exerciseCardTemplate = (exercise, serieAtual, totalSeries, concluido) => `
    <span class="badge">${exercise.categoria || 'Treino'}</span>
    <h2 class="exercise-name">${exercise.nome}</h2>
    <div class="series-indicator">
        ${Array.from({length: totalSeries}).map((_,i) => `
            <span class="series-dot${i < serieAtual ? ' done' : ''}${i === serieAtual ? ' active' : ''}"></span>
        `).join('')}
        <span class="series-label">Série ${serieAtual+1} de ${totalSeries}</span>
    </div>
    <div class="details">
        <span>Repetições: ${exercise.repeticoes}</span>
        <span>Peso: ${exercise.peso}</span>
        <span>Descanso: ${exercise.descanso}s</span>
    </div>
    ${exercise.obs ? `<div class="notes">${exercise.obs}</div>` : ''}
    ${!concluido ? `<button class="finish-set-btn" onclick="concluirSerie()">Concluir Série</button>` : `<button class="next-exercise-btn" onclick="proximoExercicio()">Próximo Exercício</button>`}
`;

// Estilos específicos do novo layout (mantendo identidade visual do app)
export const workoutStyles = `
    body, .dark-bg {
        background: linear-gradient(135deg, #181818 0%, #232323 100%) !important;
        color: #fff;
        font-family: 'Urbanist', 'Inter', Arial, sans-serif;
    }
    .workout-container {
        max-width: 430px;
        margin: 0 auto;
        padding: 28px 0 0 0;
        border-radius: 20px;
        box-shadow: 0 10px 32px rgba(0,0,0,0.15);
    }
    .progress-bar {
        width: 90%;
        margin: 0 auto 24px auto;
        background: #232323;
        height: 8px;
        border-radius: 5px;
        overflow: hidden;
    }
    .progress-fill {
        background: linear-gradient(90deg, #00ff57, #00d26a);
        height: 100%;
        border-radius: 5px;
        transition: width 0.4s;
    }
    .exercise-card {
        background: #181818;
        border-radius: 16px;
        padding: 32px 24px 24px 24px;
        box-shadow: 0 4px 18px rgba(0,0,0,0.18);
        text-align: center;
        margin-bottom: 32px;
    }
    .badge {
        background: #00ff57;
        color: #181818;
        border-radius: 999px;
        padding: 6px 18px;
        font-weight: bold;
        text-transform: uppercase;
        font-size: 0.9rem;
        margin-bottom: 14px;
        display: inline-block;
    }
    .exercise-name {
        font-size: 2rem;
        font-weight: 700;
        margin: 8px 0 18px 0;
        color: #fff;
    }
    .series-indicator {
        margin-bottom: 18px;
    }
    .series-dot {
        width: 16px; height: 16px; border-radius: 50%; background: #333; display: inline-block; margin: 0 4px;
    }
    .series-dot.done { background: #00ff57; }
    .series-dot.active { border: 2px solid #00ff57; }
    .series-label {
        display: block;
        margin-top: 8px;
        color: #aaa;
        font-size: 1rem;
        font-weight: 500;
    }
    .details {
        display: flex;
        justify-content: center;
        gap: 18px;
        margin-bottom: 12px;
        font-size: 1.1rem;
    }
    .notes {
        background: #232323;
        color: #b5ffb1;
        padding: 10px;
        border-radius: 8px;
        margin: 10px 0 18px 0;
        font-style: italic;
        font-size: 1rem;
    }
    .finish-set-btn, .next-exercise-btn {
        background: #00ff57;
        color: #181818;
        border: none;
        border-radius: 999px;
        padding: 16px 38px;
        font-size: 1.2rem;
        font-weight: bold;
        margin-top: 18px;
        cursor: pointer;
        transition: background 0.2s;
    }
    .finish-set-btn:hover, .next-exercise-btn:hover {
        background: #00e04b;
    }
    .rest-timer-overlay {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(24,24,24,0.95);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    }
    .rest-timer-card {
        background: #232323;
        border-radius: 18px;
        padding: 36px 32px;
        box-shadow: 0 6px 32px rgba(0,0,0,0.20);
        text-align: center;
    }
    .rest-timer-circle {
        margin: 0 auto 18px auto;
        width: 120px; height: 120px;
        position: relative;
    }
    .timer-bg {
        fill: none;
        stroke: #333;
        stroke-width: 12;
    }
    .timer-progress {
        fill: none;
        stroke: #00ff57;
        stroke-width: 12;
        stroke-linecap: round;
        stroke-dasharray: 339.29;
        stroke-dashoffset: 0;
        transition: stroke-dashoffset 0.5s;
    }
    .rest-timer-display {
        position: absolute;
        top: 0; left: 0; width: 100%; height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2.1rem;
        font-weight: 700;
        color: #00ff57;
    }
    .skip-rest-btn {
        margin-top: 18px;
        background: transparent;
        color: #00ff57;
        border: 2px solid #00ff57;
        border-radius: 999px;
        padding: 10px 30px;
        font-size: 1rem;
        font-weight: bold;
        cursor: pointer;
        transition: background 0.2s, color 0.2s;
    }
    .skip-rest-btn:hover {
        background: #00ff57;
        color: #181818;
    }
    @media (max-width: 600px) {
        .workout-container {
            padding: 12px 0 0 0;
        }
        .exercise-card {
            padding: 18px 6px 16px 6px;
        }
    }
`;

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

// Additional workout styles merged into main workoutStyles above