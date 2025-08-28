export const workoutTemplate = () => `
    <div id="workout-screen" class="screen workout-screen">
        <!-- Header Flutuante -->
        <div class="workout-header-float">
            <button class="back-button-float" onclick="document.getElementById('exit-confirmation-overlay').style.display = 'flex'">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
            </button>
            <div class="workout-timer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                </svg>
                <span id="workout-timer-display">00:00</span>
            </div>
            <div class="workout-brand-mini">
                <img src="./icons/ff.png" alt="FF" class="workout-logo-mini">
                <img src="./icons/forca.png" alt="Força" class="workout-logo-mini">
            </div>
        </div>

        <!-- Progress Bar -->
        <div class="workout-progress-container">
            <div class="workout-progress-bar">
                <div id="workout-progress" class="workout-progress-fill"></div>
                <div class="progress-glow"></div>
            </div>
            <div class="workout-progress-info">
                <span class="progress-current" id="current-exercise-number">1</span>
                <span class="progress-separator">/</span>
                <span class="progress-total" id="total-exercises">8</span>
                <span class="progress-label">exercícios</span>
            </div>
        </div>

        <!-- Container Principal -->
        <div class="workout-content">
            <!-- Informações do Treino -->
            <div class="workout-info-card">
                <div class="workout-info-bg"></div>
                <div class="workout-info-content">
                    <h1 id="workout-name" class="workout-title">Treino A - Peito e Tríceps</h1>
                    <div class="workout-meta-pills">
                        <div class="meta-pill">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                            <span>Semana <span id="current-week">1</span></span>
                        </div>
                        <div class="meta-pill">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                <circle cx="12" cy="7" r="4"/>
                            </svg>
                            <span id="muscle-groups">Peito, Tríceps</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Container de Exercícios -->
            <div id="exercises-container" class="exercises-container">
                <!-- Exercícios serão renderizados aqui -->
            </div>
        </div>

        <!-- Timer de Descanso (Overlay) -->
        <div id="rest-timer-overlay" class="rest-timer-overlay" style="display: none;">
            <div class="rest-timer-content">
                <div class="rest-timer-bg"></div>
                <h2 class="rest-timer-title">Tempo de Descanso</h2>
                <div class="rest-timer-circle">
                    <svg class="rest-progress-ring" width="200" height="200" viewBox="0 0 200 200">
                        <defs>
                            <linearGradient id="rest-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" style="stop-color: #3b82f6"/>
                                <stop offset="100%" style="stop-color: #06b6d4"/>
                            </linearGradient>
                        </defs>
                        <circle class="rest-progress-bg" cx="100" cy="100" r="85" stroke-width="12" fill="none"/>
                        <circle class="rest-progress-fill" cx="100" cy="100" r="85" stroke-width="12" fill="none"/>
                    </svg>
                    <div class="rest-timer-text">
                        <span id="rest-timer-display" class="rest-time">00:00</span>
                    </div>
                </div>
                <div class="rest-timer-actions">
                    <button id="skip-rest" class="btn-rest-skip">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="5 4 15 12 5 20 5 4"/>
                            <line x1="19" y1="5" x2="19" y2="19"/>
                        </svg>
                        <span>Pular Descanso</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Tela de Conclusão -->
        <div id="workout-completion" class="workout-completion-overlay" style="display: none;">
            <div class="completion-content">
                <div class="completion-animation">
                    <div class="trophy-container">
                        <svg class="trophy-icon" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2M12 2v17M12 19c-4 0-6-2-6-6V2h12v11c0 4-2 6-6 6Z"/>
                            <path d="M12 19h0"/>
                        </svg>
                        <div class="confetti"></div>
                    </div>
                </div>
                <h1 class="completion-title">Treino Concluído!</h1>
                <p class="completion-subtitle">Parabéns pela dedicação!</p>
                
                <div class="completion-stats">
                    <div class="stat-card">
                        <div class="stat-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12 6 12 12 16 14"/>
                            </svg>
                        </div>
                        <div class="stat-info">
                            <span class="stat-value" id="total-time">45:32</span>
                            <span class="stat-label">Tempo Total</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                            </svg>
                        </div>
                        <div class="stat-info">
                            <span class="stat-value" id="total-exercises-completed">8</span>
                            <span class="stat-label">Exercícios</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                <line x1="12" y1="8" x2="12" y2="16"/>
                                <line x1="8" y1="12" x2="16" y2="12"/>
                            </svg>
                        </div>
                        <div class="stat-info">
                            <span class="stat-value" id="total-series">32</span>
                            <span class="stat-label">Séries Completas</span>
                        </div>
                    </div>
                </div>

                <div class="completion-actions">
                    <button onclick="window.finalizarTreino()" class="btn-primary btn-finish">
                        <span>Finalizar</span>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="9 18 15 12 9 6"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>

        <!-- Modal de Confirmação de Saída -->
        <div id="exit-confirmation-overlay" class="exit-confirmation-overlay" style="
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.9);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 20000;
            backdrop-filter: blur(8px);
        ">
            <div class="exit-confirmation-modal" style="
                background: var(--bg-secondary, #2a2a2a);
                border-radius: 12px;
                padding: 32px;
                width: 90%;
                max-width: 450px;
                text-align: center;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                border: 1px solid var(--border-color, #444);
            ">
                <div style="
                    font-size: 3rem;
                    margin-bottom: 16px;
                ">⚠️</div>
                
                <h2 style="
                    margin: 0 0 16px 0;
                    color: var(--text-primary, #fff);
                    font-size: 1.5rem;
                    font-weight: 700;
                ">Confirmar Saída</h2>
                
                <p style="
                    margin: 0 0 24px 0;
                    color: var(--text-secondary, #ccc);
                    font-size: 1rem;
                    line-height: 1.5;
                ">Você tem certeza que deseja sair? Todo o progresso do treinamento atual será perdido e você terá que recomeçar novamente.</p>
                
                <div class="exit-confirmation-checkbox" style="
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 32px;
                    padding: 16px;
                    background: var(--bg-primary, #1a1a1a);
                    border-radius: 8px;
                    border: 1px solid var(--border-color, #444);
                ">
                    <input type="checkbox" id="confirm-exit-checkbox" onchange="
                        const btn = document.getElementById('exit-confirm-btn');
                        if (this.checked) {
                            btn.disabled = false;
                            btn.style.opacity = '1';
                            btn.style.cursor = 'pointer';
                        } else {
                            btn.disabled = true;
                            btn.style.opacity = '0.5';
                            btn.style.cursor = 'not-allowed';
                        }
                    " style="
                        width: 20px;
                        height: 20px;
                        accent-color: var(--accent-green, #10b981);
                        cursor: pointer;
                    ">
                    <label for="confirm-exit-checkbox" style="
                        color: var(--text-primary, #fff);
                        font-size: 0.9rem;
                        cursor: pointer;
                        flex: 1;
                        text-align: left;
                    ">Entendo que perderei todo o progresso</label>
                </div>
                
                <div class="exit-confirmation-actions" style="
                    display: flex;
                    gap: 16px;
                    justify-content: center;
                ">
                    <button id="exit-cancel-btn" class="btn-cancel" onclick="document.getElementById('exit-confirmation-overlay').style.display='none'" style="
                        background: var(--bg-primary, #1a1a1a);
                        color: var(--text-primary, #fff);
                        border: 2px solid var(--border-color, #444);
                        padding: 12px 24px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 600;
                        transition: all 0.2s ease;
                        font-size: 1rem;
                    " onmouseover="this.style.background='var(--border-color, #444)'" onmouseout="this.style.background='var(--bg-primary, #1a1a1a)'">Cancelar</button>
                    
                    <button id="exit-confirm-btn" class="btn-exit" disabled onclick="
                        const checkbox = document.getElementById('confirm-exit-checkbox');
                        if (checkbox && checkbox.checked) {
                            if (window.voltarParaHome) {
                                window.voltarParaHome();
                            } else {
                                window.location.href = '#home';
                            }
                        }
                    " style="
                        background: #dc2626;
                        color: #fff;
                        border: 2px solid #dc2626;
                        padding: 12px 24px;
                        border-radius: 8px;
                        cursor: not-allowed;
                        font-weight: 600;
                        transition: all 0.2s ease;
                        font-size: 1rem;
                        opacity: 0.5;
                    ">Sair mesmo assim</button>
                </div>
            </div>
        </div>
    </div>
`;

// Template para cada exercício
export const exerciseCardTemplate = (exercise, index, total) => `
    <div class="exercise-card" data-exercise-index="${index}">
        <div class="exercise-card-header">
            <div class="exercise-number">${index + 1}</div>
            <div class="exercise-info">
                <h3 class="exercise-name">${exercise.nome || 'Exercício'}</h3>
                <p class="exercise-muscle">${exercise.grupo_muscular || ''}</p>
            </div>
            <button class="exercise-info-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
            </button>
        </div>

        ${
          exercise.observacoes
            ? `
        <div class="exercise-notes">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
            </svg>
            <span>${exercise.observacoes}</span>
        </div>
        `
            : ''
        }

        <div class="series-container" id="series-container-${index}">
            ${generateSeriesHTML(exercise)}
        </div>

        ${
          exercise.tempo_descanso
            ? `
        <div class="rest-info">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>Descanso: ${exercise.tempo_descanso}s entre séries</span>
        </div>
        `
            : ''
        }
    </div>
`;

// Template para cada série
function generateSeriesHTML(exercise) {
  const series = [];
  for (let i = 0; i < (exercise.series || 4); i++) {
    series.push(`
            <div class="series-item" data-series-index="${i}">
                <div class="series-number">${i + 1}</div>
                <div class="series-inputs">
                    <div class="input-group">
                        <label>Peso</label>
                        <div class="input-wrapper">
                            <input type="number" 
                                   class="series-weight neon-input" 
                                   placeholder="${exercise.peso_sugerido || '0'}"
                                   step="0.5" 
                                   min="0"
                                   inputmode="decimal"
                                   pattern="[0-9]*">
                            <span class="input-unit">kg</span>
                        </div>
                    </div>
                    <div class="input-group">
                        <label>Reps</label>
                        <div class="input-wrapper">
                            <input type="number" 
                                   class="series-reps neon-input" 
                                   placeholder="${exercise.repeticoes || '12'}"
                                   inputmode="numeric"
                                   pattern="[0-9]*"
                                   min="1" 
                                   max="100">
                            <span class="input-unit">x</span>
                        </div>
                    </div>
                </div>
                <button class="series-confirm-btn" onclick="window.confirmarSerie(${i})">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                </button>
            </div>
        `);
  }
  return series.join('');
}

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
`;

export const seriesItemTemplate = (exerciseId, seriesNumber) => `
<div class="series-row" id="series-${exerciseId}-${seriesNumber}">
<span class="series-number">${seriesNumber}</span>
<div class="series-input-group">
<div class="input-wrapper">
<button class="input-btn" onclick="ajustarPeso(${exerciseId}, ${seriesNumber}, -2.5)">-</button>
<input type="number" class="series-input" id="peso-${exerciseId}-${seriesNumber}" 
value="0" step="2.5" min="0" inputmode="decimal" pattern="[0-9]*">
<button class="input-btn" onclick="ajustarPeso(${exerciseId}, ${seriesNumber}, 2.5)">+</button>
</div>
</div>
<div class="series-input-group">
<div class="input-wrapper">
<button class="input-btn" onclick="ajustarReps(${exerciseId}, ${seriesNumber}, -1)">-</button>
<input type="number" class="series-input" id="reps-${exerciseId}-${seriesNumber}" 
value="0" step="1" min="0" inputmode="numeric" pattern="[0-9]*">
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
                <input type="number" class="series-input" id="peso-${exerciseId}-${seriesNumber}" 
                       value="0" step="2.5" min="0" inputmode="decimal" pattern="[0-9]*">
                <button class="input-btn" onclick="ajustarPeso(${exerciseId}, ${seriesNumber}, 2.5)">+</button>
            </div>
        </div>
        <div class="series-input-group">
            <div class="input-wrapper">
                <button class="input-btn" onclick="ajustarReps(${exerciseId}, ${seriesNumber}, -1)">-</button>
                <input type="number" class="series-input" id="reps-${exerciseId}-${seriesNumber}" 
                       value="0" step="1" min="0" inputmode="numeric" pattern="[0-9]*">
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
