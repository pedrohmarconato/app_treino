/**
 * 🏋️ TEMPLATE DE CARD DE EXERCÍCIO - Exercise Card Template
 * 
 * FUNÇÃO: Renderizar interface completa para execução individual de exercícios durante treinos.
 * 
 * RESPONSABILIDADES:
 * - Exibir informações completas do exercício (nome, grupo, equipamento)
 * - Mostrar dados do protocolo (séries, repetições, descanso, intensidade)
 * - Apresentar sugestões de peso baseadas em 1RM e histórico
 * - Gerenciar interface de execução de séries com inputs interativos
 * - Fornecer controles para ajuste de peso e repetições
 * - Exibir histórico da última execução do exercício
 * - Implementar validação e confirmação de séries
 * - Aplicar estilos responsivos e acessíveis
 * 
 * COMPONENTES DO CARD:
 * - Header: nome, grupo muscular, equipamento, contador de exercícios
 * - Protocolo: estatísticas do protocolo (séries, reps, descanso, %1RM)
 * - Pesos: sugestões mínimo, base e máximo calculadas
 * - Histórico: dados da última execução (peso, reps, data)
 * - Observações: notas técnicas do protocolo quando disponíveis
 * - Séries: interface para execução com inputs de peso/reps
 * - Ações: botões para histórico e conclusão do exercício
 * 
 * FUNCIONALIDADES INTERATIVAS:
 * - Botões +/- para ajuste rápido de valores
 * - Confirmação visual de séries completadas
 * - Progresso dinâmico de séries executadas
 * - Validação de dados antes da confirmação
 * - Estados visuais para séries concluídas
 * 
 * INTEGRAÇÃO: Usado pelo workout.js durante execução de treinos
 */

// templates/exerciseCard.js - Template para card de exercício individual
export function exerciseCardTemplate(exercicio, index, total) {
    const pesos = exercicio.pesos_sugeridos || {};
    const execucoesAnteriores = exercicio.execucoes_anteriores || [];
    const ultimaExecucao = execucoesAnteriores[0];
    
    return `
        <div class="exercise-card" data-exercise-id="${exercicio.exercicio_id}" id="exercise-${exercicio.exercicio_id}">
            <!-- Header do Exercício -->
            <div class="exercise-header">
                <div class="exercise-info">
                    <h3 class="exercise-name">${exercicio.exercicio_nome}</h3>
                    <div class="exercise-details">
                        <span class="exercise-group">${exercicio.exercicio_grupo}</span>
                        <span class="exercise-equipment">${exercicio.exercicio_equipamento}</span>
                    </div>
                </div>
                <div class="exercise-counter">
                    ${index + 1}/${total}
                </div>
            </div>

            <!-- Informações do Protocolo -->
            <div class="protocol-info">
                <div class="protocol-stats">
                    <div class="stat-item">
                        <span class="stat-label">Séries</span>
                        <span class="stat-value">${exercicio.series}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Reps Alvo</span>
                        <span class="stat-value">${exercicio.repeticoes_alvo}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Descanso</span>
                        <span class="stat-value">${exercicio.tempo_descanso}s</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Intensidade</span>
                        <span class="stat-value">${exercicio.percentual_1rm_base}%</span>
                    </div>
                </div>
                
                <!-- Pesos Sugeridos -->
                <div class="weight-suggestions">
                    <h4>Pesos Sugeridos</h4>
                    <div class="weight-range">
                        <div class="weight-item min">
                            <span class="weight-label">Mín</span>
                            <span class="weight-value">${pesos.peso_minimo || 0}kg</span>
                        </div>
                        <div class="weight-item base">
                            <span class="weight-label">Base</span>
                            <span class="weight-value">${pesos.peso_base || 0}kg</span>
                        </div>
                        <div class="weight-item max">
                            <span class="weight-label">Máx</span>
                            <span class="weight-value">${pesos.peso_maximo || 0}kg</span>
                        </div>
                    </div>
                </div>

                <!-- Última Execução -->
                ${ultimaExecucao ? `
                    <div class="last-execution">
                        <h4>Última Execução</h4>
                        <div class="execution-data">
                            <span>${ultimaExecucao.peso_utilizado}kg × ${ultimaExecucao.repeticoes} reps</span>
                            <span class="execution-date">${window.dateUtils ? window.dateUtils.formatInSP(ultimaExecucao.data_execucao, 'dd/MM/yyyy') : new Date(ultimaExecucao.data_execucao).toLocaleDateString('pt-BR')}</span>
                        </div>
                    </div>
                ` : ''}
            </div>

            <!-- Observações do Protocolo -->
            ${exercicio.observacoes ? `
                <div class="exercise-notes">
                    <h4>Observações Técnicas</h4>
                    <p>${exercicio.observacoes}</p>
                </div>
            ` : ''}

            <!-- Container de Séries -->
            <div class="series-container">
                <div class="series-header">
                    <h4>Execução das Séries</h4>
                    <div class="series-progress">
                        <span id="series-progress-${exercicio.exercicio_id}">0/${exercicio.series}</span>
                    </div>
                </div>
                
                <div class="series-list" id="series-list-${exercicio.exercicio_id}">
                    ${generateSeriesList(exercicio)}
                </div>
                
                <button class="btn-add-series" onclick="adicionarSerie(${exercicio.exercicio_id})" 
                        id="add-series-btn-${exercicio.exercicio_id}" 
                        ${exercicio.series_executadas >= exercicio.series ? 'style="display:none"' : ''}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 5v14m-7-7h14"/>
                    </svg>
                    Adicionar Série
                </button>
            </div>

            <!-- Ações do Exercício -->
            <div class="exercise-actions">
                <button class="btn-secondary exercise-action" onclick="mostrarHistorico(${exercicio.exercicio_id})">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    Histórico
                </button>
                
                <button class="btn-primary exercise-action" onclick="concluirExercicio(${exercicio.exercicio_id})"
                        id="complete-exercise-btn-${exercicio.exercicio_id}" disabled>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 6L9 17l-5-5"/>
                    </svg>
                    Concluir Exercício
                </button>
            </div>
        </div>
    `;
}

// Gerar lista inicial de séries
function generateSeriesList(exercicio) {
    const pesos = exercicio.pesos_sugeridos || {};
    const pesoSugerido = pesos.peso_base || 0;
    const repsAlvo = exercicio.repeticoes_alvo || 10;
    
    let html = '';
    
    // Criar primeira série automaticamente
    html += generateSeriesItem(exercicio.exercicio_id, 1, pesoSugerido, repsAlvo);
    
    return html;
}

// Gerar item individual de série
function generateSeriesItem(exercicioId, serieNumero, pesoSugerido = 0, repsAlvo = 10) {
    return `
        <div class="series-item" id="series-${exercicioId}-${serieNumero}">
            <div class="series-number">${serieNumero}</div>
            
            <!-- Input de Peso -->
            <div class="input-group">
                <label class="input-label">Peso (kg)</label>
                <div class="input-wrapper">
                    <button class="input-btn" onclick="ajustarValor('peso-${exercicioId}-${serieNumero}', -2.5)">-</button>
                    <input type="number" 
                           class="series-input" 
                           id="peso-${exercicioId}-${serieNumero}" 
                           value="${pesoSugerido}"
                           step="0.5" 
                           min="0" 
                           max="500"
                           inputmode="decimal"
                           pattern="[0-9]*"
                           placeholder="0">
                    <button class="input-btn" onclick="ajustarValor('peso-${exercicioId}-${serieNumero}', 2.5)">+</button>
                </div>
            </div>
            
            <!-- Input de Repetições -->
            <div class="input-group">
                <label class="input-label">Repetições</label>
                <div class="input-wrapper">
                    <button class="input-btn" onclick="ajustarValor('reps-${exercicioId}-${serieNumero}', -1)">-</button>
                    <input type="number" 
                           class="series-input" 
                           id="reps-${exercicioId}-${serieNumero}" 
                           value="${repsAlvo}"
                           step="1" 
                           min="0"
                           inputmode="numeric"
                           pattern="[0-9]*" 
                           max="50"
                           placeholder="0">
                    <button class="input-btn" onclick="ajustarValor('reps-${exercicioId}-${serieNumero}', 1)">+</button>
                </div>
            </div>
            
            <!-- Botão de Confirmar -->
            <button class="btn-confirm-series" 
                    id="confirm-${exercicioId}-${serieNumero}" 
                    onclick="confirmarSerie(${exercicioId}, ${serieNumero})">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 6L9 17l-5-5"/>
                </svg>
            </button>
            
            <!-- Resultado da Série (hidden inicialmente) -->
            <div class="series-result hidden" id="result-${exercicioId}-${serieNumero}">
                <div class="result-data">
                    <span class="result-weight">0kg</span>
                    <span class="result-reps">×0</span>
                </div>
                <div class="result-status success">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 6L9 17l-5-5"/>
                    </svg>
                </div>
            </div>
        </div>
    `;
}

// Estilos específicos para o card de exercício
export const exerciseCardStyles = `
    .exercise-card {
        background: var(--bg-card);
        border-radius: var(--radius-lg);
        padding: 24px;
        margin-bottom: 24px;
        border: 1px solid var(--border-color);
        transition: all 0.3s ease;
    }

    .exercise-card:hover {
        border-color: var(--accent-green);
        box-shadow: 0 8px 32px rgba(168, 255, 0, 0.1);
    }

    .exercise-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 20px;
    }

    .exercise-name {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: 8px;
    }

    .exercise-details {
        display: flex;
        gap: 16px;
        font-size: 0.875rem;
        color: var(--text-secondary);
    }

    .exercise-counter {
        background: var(--accent-green);
        color: var(--bg-primary);
        padding: 8px 16px;
        border-radius: var(--radius-full);
        font-size: 0.875rem;
        font-weight: 600;
    }

    .protocol-info {
        background: var(--bg-secondary);
        border-radius: var(--radius-md);
        padding: 20px;
        margin-bottom: 20px;
    }

    .protocol-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
        gap: 16px;
        margin-bottom: 20px;
    }

    .stat-item {
        text-align: center;
    }

    .stat-label {
        display: block;
        font-size: 0.75rem;
        color: var(--text-secondary);
        margin-bottom: 4px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .stat-value {
        display: block;
        font-size: 1.125rem;
        font-weight: 700;
        color: var(--accent-green);
    }

    .weight-suggestions h4,
    .last-execution h4 {
        font-size: 0.875rem;
        color: var(--text-primary);
        margin-bottom: 12px;
        font-weight: 600;
    }

    .weight-range {
        display: flex;
        gap: 12px;
        justify-content: space-between;
    }

    .weight-item {
        flex: 1;
        text-align: center;
        padding: 12px;
        background: var(--bg-primary);
        border-radius: var(--radius-sm);
        border: 1px solid var(--border-color);
    }

    .weight-item.base {
        border-color: var(--accent-green);
        background: var(--accent-green-bg);
    }

    .weight-label {
        display: block;
        font-size: 0.75rem;
        color: var(--text-secondary);
        margin-bottom: 4px;
    }

    .weight-value {
        display: block;
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary);
    }

    .weight-item.base .weight-value {
        color: var(--accent-green);
    }

    .last-execution {
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid var(--border-color);
    }

    .execution-data {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.875rem;
    }

    .execution-date {
        color: var(--text-secondary);
    }

    .exercise-notes {
        background: var(--bg-primary);
        border-radius: var(--radius-md);
        padding: 16px;
        margin-bottom: 20px;
        border-left: 4px solid var(--accent-green);
    }

    .exercise-notes h4 {
        font-size: 0.875rem;
        color: var(--accent-green);
        margin-bottom: 8px;
        font-weight: 600;
    }

    .exercise-notes p {
        font-size: 0.875rem;
        line-height: 1.5;
        color: var(--text-secondary);
        margin: 0;
    }

    .series-container {
        margin-bottom: 20px;
    }

    .series-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
    }

    .series-header h4 {
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary);
    }

    .series-progress {
        font-size: 0.875rem;
        color: var(--text-secondary);
        background: var(--bg-secondary);
        padding: 4px 12px;
        border-radius: var(--radius-full);
    }

    .series-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 16px;
    }

    .series-item {
        display: grid;
        grid-template-columns: 40px 1fr 1fr 60px;
        gap: 12px;
        align-items: end;
        padding: 16px;
        background: var(--bg-secondary);
        border-radius: var(--radius-md);
        transition: all 0.3s ease;
    }

    .series-item.completed {
        background: var(--accent-green-bg);
        border: 1px solid var(--accent-green);
    }

    .series-number {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background: var(--accent-green);
        color: var(--bg-primary);
        border-radius: 50%;
        font-weight: 600;
        font-size: 0.875rem;
    }

    .input-group {
        display: flex;
        flex-direction: column;
    }

    .input-label {
        font-size: 0.75rem;
        color: var(--text-secondary);
        margin-bottom: 8px;
        font-weight: 500;
    }

    .input-wrapper {
        display: flex;
        align-items: center;
        background: var(--bg-primary);
        border-radius: var(--radius-sm);
        overflow: hidden;
        border: 1px solid var(--border-color);
    }

    .input-wrapper:focus-within {
        border-color: var(--accent-green);
        box-shadow: 0 0 0 2px var(--accent-green-bg);
    }

    .series-input {
        flex: 1;
        padding: 12px;
        background: transparent;
        border: none;
        color: var(--text-primary);
        text-align: center;
        font-size: 1rem;
        font-weight: 600;
        outline: none;
    }

    .input-btn {
        padding: 12px;
        background: transparent;
        border: none;
        color: var(--accent-green);
        cursor: pointer;
        font-size: 1.125rem;
        font-weight: 600;
        transition: all 0.2s ease;
        min-width: 40px;
    }

    .input-btn:hover {
        background: var(--accent-green-bg);
    }

    .btn-confirm-series {
        width: 48px;
        height: 48px;
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

    .btn-confirm-series:hover {
        background: var(--accent-green-dark);
        transform: scale(1.05);
    }

    .btn-confirm-series:disabled {
        background: var(--bg-primary);
        color: var(--text-secondary);
        cursor: not-allowed;
        transform: none;
    }

    .btn-confirm-series svg {
        width: 20px;
        height: 20px;
    }

    .series-result {
        display: flex;
        align-items: center;
        gap: 8px;
        background: var(--accent-green-bg);
        padding: 8px 12px;
        border-radius: var(--radius-sm);
        border: 1px solid var(--accent-green);
    }

    .series-result.hidden {
        display: none;
    }

    .result-data {
        flex: 1;
        display: flex;
        gap: 8px;
        font-size: 0.875rem;
        font-weight: 600;
    }

    .result-weight {
        color: var(--accent-green);
    }

    .result-reps {
        color: var(--text-primary);
    }

    .result-status svg {
        width: 16px;
        height: 16px;
        color: var(--accent-green);
    }

    .btn-add-series {
        width: 100%;
        padding: 16px;
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
        font-size: 0.875rem;
        font-weight: 500;
    }

    .btn-add-series:hover {
        border-color: var(--accent-green);
        color: var(--accent-green);
        background: var(--accent-green-bg);
    }

    .btn-add-series svg {
        width: 20px;
        height: 20px;
    }

    .exercise-actions {
        display: flex;
        gap: 12px;
    }

    .exercise-action {
        flex: 1;
        padding: 14px 20px;
        border-radius: var(--radius-md);
        font-size: 0.875rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: all 0.2s ease;
    }

    .exercise-action svg {
        width: 18px;
        height: 18px;
    }

    .exercise-action:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .exercise-action:not(:disabled):hover {
        transform: translateY(-1px);
    }

    /* Responsive */
    @media (max-width: 768px) {
        .exercise-card {
            padding: 16px;
        }

        .protocol-stats {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
        }

        .weight-range {
            flex-direction: column;
            gap: 8px;
        }

        .series-item {
            grid-template-columns: 1fr;
            gap: 16px;
        }

        .series-number {
            justify-self: center;
        }

        .exercise-actions {
            flex-direction: column;
        }
    }
`;

export { generateSeriesItem };