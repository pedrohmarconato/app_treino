// Template do modal de planejamento semanal
export const weekPlanningModalTemplate = () => `
    <div id="modal-planejamento" class="modal" style="display: none;">
        <div class="modal-content modal-planejamento-content">
            <div class="modal-header">
                <h2>📅 Planejamento Semanal</h2>
                <p class="modal-subtitle">Organize seus treinos para a semana</p>
            </div>
            
            <form id="form-planejamento">
                <div class="dias-semana-grid">
                    <div class="dia-card">
                        <h4>Domingo</h4>
                        <select name="0" class="dia-select">
                            <option value="">Selecione</option>
                            <option value="folga">🛋️ Folga</option>
                            <option value="A">💪 Treino A - Peito/Tríceps</option>
                            <option value="B">🔙 Treino B - Costas/Bíceps</option>
                            <option value="C">🦵 Treino C - Pernas</option>
                            <option value="D">🎯 Treino D - Ombros/Abdômen</option>
                            <option value="cardio">🏃 Cardio</option>
                        </select>
                    </div>
                    <div class="dia-card">
                        <h4>Segunda</h4>
                        <select name="1" class="dia-select">
                            <option value="">Selecione</option>
                            <option value="folga">🛋️ Folga</option>
                            <option value="A">💪 Treino A - Peito/Tríceps</option>
                            <option value="B">🔙 Treino B - Costas/Bíceps</option>
                            <option value="C">🦵 Treino C - Pernas</option>
                            <option value="D">🎯 Treino D - Ombros/Abdômen</option>
                            <option value="cardio">🏃 Cardio</option>
                        </select>
                    </div>
                    <div class="dia-card">
                        <h4>Terça</h4>
                        <select name="2" class="dia-select">
                            <option value="">Selecione</option>
                            <option value="folga">🛋️ Folga</option>
                            <option value="A">💪 Treino A - Peito/Tríceps</option>
                            <option value="B">🔙 Treino B - Costas/Bíceps</option>
                            <option value="C">🦵 Treino C - Pernas</option>
                            <option value="D">🎯 Treino D - Ombros/Abdômen</option>
                            <option value="cardio">🏃 Cardio</option>
                        </select>
                    </div>
                    <div class="dia-card">
                        <h4>Quarta</h4>
                        <select name="3" class="dia-select">
                            <option value="">Selecione</option>
                            <option value="folga">🛋️ Folga</option>
                            <option value="A">💪 Treino A - Peito/Tríceps</option>
                            <option value="B">🔙 Treino B - Costas/Bíceps</option>
                            <option value="C">🦵 Treino C - Pernas</option>
                            <option value="D">🎯 Treino D - Ombros/Abdômen</option>
                            <option value="cardio">🏃 Cardio</option>
                        </select>
                    </div>
                    <div class="dia-card">
                        <h4>Quinta</h4>
                        <select name="4" class="dia-select">
                            <option value="">Selecione</option>
                            <option value="folga">🛋️ Folga</option>
                            <option value="A">💪 Treino A - Peito/Tríceps</option>
                            <option value="B">🔙 Treino B - Costas/Bíceps</option>
                            <option value="C">🦵 Treino C - Pernas</option>
                            <option value="D">🎯 Treino D - Ombros/Abdômen</option>
                            <option value="cardio">🏃 Cardio</option>
                        </select>
                    </div>
                    <div class="dia-card">
                        <h4>Sexta</h4>
                        <select name="5" class="dia-select">
                            <option value="">Selecione</option>
                            <option value="folga">🛋️ Folga</option>
                            <option value="A">💪 Treino A - Peito/Tríceps</option>
                            <option value="B">🔙 Treino B - Costas/Bíceps</option>
                            <option value="C">🦵 Treino C - Pernas</option>
                            <option value="D">🎯 Treino D - Ombros/Abdômen</option>
                            <option value="cardio">🏃 Cardio</option>
                        </select>
                    </div>
                    <div class="dia-card">
                        <h4>Sábado</h4>
                        <select name="6" class="dia-select">
                            <option value="">Selecione</option>
                            <option value="folga">🛋️ Folga</option>
                            <option value="A">💪 Treino A - Peito/Tríceps</option>
                            <option value="B">🔙 Treino B - Costas/Bíceps</option>
                            <option value="C">🦵 Treino C - Pernas</option>
                            <option value="D">🎯 Treino D - Ombros/Abdômen</option>
                            <option value="cardio">🏃 Cardio</option>
                        </select>
                    </div>
                </div>
                
                <div id="plan-validation" class="plan-validation"></div>
                
                <div class="modal-actions">
                    <button type="button" class="btn-secondary" onclick="document.getElementById('modal-planejamento').style.display='none'">Cancelar</button>
                    <button type="submit" id="confirm-plan-btn" class="btn-primary" disabled>Salvar Planejamento</button>
                </div>
            </form>
        </div>
    </div>
`;

// Estilos específicos dos modais
export const modalStyles = `
    /* Modal Base */
    .modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        backdrop-filter: blur(4px);
    }

    .modal-content {
        background: var(--bg-card);
        border-radius: var(--radius-lg);
        padding: 32px;
        max-width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: var(--shadow-lg);
        animation: modalSlideIn 0.3s ease-out;
    }

    /* Modal de Planejamento */
    .modal-planejamento-content {
        max-width: 600px;
        width: 90%;
    }

    .modal-header {
        text-align: center;
        margin-bottom: 32px;
    }

    .modal-header h2 {
        font-size: 1.75rem;
        margin-bottom: 8px;
    }

    .modal-subtitle {
        color: var(--text-secondary);
        font-size: 0.875rem;
    }

    .dias-semana-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 12px;
        margin-bottom: 24px;
    }

    .dia-card {
        background: var(--bg-secondary);
        padding: 16px;
        border-radius: var(--radius-md);
        border: 2px solid var(--border-color);
        transition: var(--transition);
    }

    .dia-card.error {
        border-color: #f44336;
        animation: errorShake 0.5s ease-in-out;
    }

    @keyframes errorShake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-4px); }
        75% { transform: translateX(4px); }
    }

    .dia-card h4 {
        font-size: 0.875rem;
        margin-bottom: 8px;
        color: var(--text-primary);
        font-weight: 600;
    }

    .dia-select {
        width: 100%;
        background: var(--bg-primary);
        color: var(--text-primary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        padding: 8px;
        font-size: 0.875rem;
        cursor: pointer;
        transition: var(--transition);
    }

    .dia-select:hover {
        border-color: var(--accent-green);
    }

    .dia-select:focus {
        outline: none;
        border-color: var(--accent-green);
        box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
    }

    .dia-select.changed {
        animation: selectPulse 0.4s ease-out;
    }

    @keyframes selectPulse {
        0% {
            transform: scale(1);
            box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        }
        50% {
            transform: scale(1.02);
            box-shadow: 0 8px 20px rgba(16,185,129,0.4);
        }
        100% {
            transform: scale(1);
            box-shadow: 0 6px 16px rgba(16,185,129,0.25);
        }
    }

    .plan-validation {
        background: var(--bg-secondary);
        padding: 16px;
        border-radius: var(--radius-md);
        margin-bottom: 20px;
        font-size: 0.875rem;
        line-height: 1.6;
        opacity: 0;
        height: 0;
        overflow: hidden;
        transition: all 0.3s ease;
    }

    .plan-validation.show {
        opacity: 1;
        height: auto;
        padding: 16px;
    }

    .plan-validation.error {
        background: rgba(244, 67, 54, 0.1);
        border: 1px solid #f44336;
        color: #f44336;
    }

    .plan-validation.success {
        background: rgba(16, 185, 129, 0.1);
        border: 1px solid var(--accent-green);
        color: var(--accent-green);
    }

    .modal-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
    }

    /* Estilos específicos para o botão de salvar planejamento */
    #confirm-plan-btn {
        background: var(--accent-green) !important;
        color: var(--bg-primary) !important;
        opacity: 1 !important;
        padding: 12px 32px !important;
        border: none !important;
        border-radius: 8px !important;
        font-weight: 500 !important;
        cursor: pointer !important;
        transition: all 0.2s !important;
        font-size: 1rem !important;
    }

    #confirm-plan-btn:disabled {
        background: var(--bg-secondary) !important;
        color: var(--text-muted) !important;
        opacity: 0.5 !important;
        cursor: not-allowed !important;
    }

    #confirm-plan-btn:hover:not(:disabled) {
        background: var(--accent-green-dark) !important;
        transform: translateY(-1px);
        box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
    }

    #modal-planejamento .btn-secondary {
        background: var(--bg-secondary);
        color: var(--text-primary);
        padding: 12px 24px;
        border-radius: var(--radius-full);
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        transition: var(--transition);
        border: none;
    }

    #modal-planejamento .btn-secondary:hover {
        background: var(--bg-card-hover);
    }
`;