export const planejamentoSemanalPageTemplate = () => `
    <div id="modalPlanejamento" class="modal planning-modal" style="display: flex !important;">
        <div class="modal-content planning-content">
            <div class="modal-header planning-header">
                <h2>Planejamento Semanal</h2>
                <p class="modal-subtitle">Configure seus treinos da semana</p>
                <div id="planning-status-indicator" class="planning-status-indicator" style="display: none;">
                    <div class="status-badge"></div>
                    <span class="status-text"></span>
                </div>
                <button class="modal-close" onclick="fecharModalPlanejamento()">×</button>
            </div>
            
            <div class="modal-body planning-body">
                <div class="dias-semana-container">
                    <h3 class="section-title">Dias da Semana</h3>
                    <div class="dias-lista">
                        ${['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((dia, index) => `
                            <div class="dia-item" id="dia-${index + 1}">
                                <span class="dia-label">${dia.toUpperCase()}</span>
                                <div class="dia-content" id="dia-${index + 1}-content">
                                    <button class="btn-adicionar" onclick="abrirSeletorTreino(${index + 1}, '${dia}')">
                                        <svg viewBox="0 0 24 24" width="16" height="16">
                                            <path fill="currentColor" d="M12 5v14m-7-7h14"/>
                                        </svg>
                                        Adicionar
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="planning-stats">
                    <div class="stat-card">
                        <div class="stat-icon">📅</div>
                        <div class="stat-value" id="planned-days">0</div>
                        <div class="stat-label">DIAS PLANEJADOS</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">💪</div>
                        <div class="stat-value" id="workout-count">0</div>
                        <div class="stat-label">TREINOS</div>
                    </div>
                </div>
            </div>
            
            <div class="modal-footer planning-footer">
                <button class="btn-primary btn-salvar" id="btn-salvar-plano" onclick="salvarPlanejamento()">
                    Salvar Plano
                </button>
            </div>
        </div>
    </div>
    
    <!-- Popup Seletor de Treino -->
    <div id="seletorTreinoPopup" class="modal-overlay" style="display: none;">
        <div class="modal-content-small">
            <div class="popup-header">
                <h3 id="popup-day-title">Selecionar Treino</h3>
                <button class="close-btn" onclick="fecharSeletorTreino()">×</button>
            </div>
            <div class="popup-body">
                <div id="treino-options" class="treino-options-grid">
                </div>
            </div>
        </div>
    </div>

    <style>
        /* Status badges para o planejamento */
        .planning-status-indicator {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            border-radius: var(--radius-md);
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            margin: 8px 0;
        }

        .status-badge {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            font-size: 12px;
            font-weight: 600;
        }

        .status-badge.info {
            background: rgba(59, 130, 246, 0.1);
            color: #3b82f6;
            border: 1px solid #3b82f6;
        }

        .status-badge.success {
            background: rgba(34, 197, 94, 0.1);
            color: #22c55e;
            border: 1px solid #22c55e;
        }

        .status-badge.warning {
            background: rgba(245, 158, 11, 0.1);
            color: #f59e0b;
            border: 1px solid #f59e0b;
        }

        .status-text {
            font-size: 0.875rem;
            color: var(--text-primary);
            font-weight: 500;
        }

        /* Modo edição indicator */
        .planning-mode-indicator {
            background: var(--accent-green-bg);
            color: var(--accent-green);
            padding: 12px 16px;
            border-radius: var(--radius-md);
            border: 1px solid var(--accent-green);
            margin-bottom: 16px;
            font-size: 0.875rem;
            font-weight: 500;
        }

        /* Validation message styles */
        .validation-message {
            padding: 12px 16px;
            border-radius: var(--radius-md);
            margin: 16px 0;
            font-size: 0.875rem;
            border: 1px solid;
        }

        .validation-message.success {
            background: rgba(34, 197, 94, 0.1);
            color: #22c55e;
            border-color: #22c55e;
        }

        .validation-message.error {
            background: rgba(239, 68, 68, 0.1);
            color: #ef4444;
            border-color: #ef4444;
        }

        .validation-message.info {
            background: rgba(59, 130, 246, 0.1);
            color: #3b82f6;
            border-color: #3b82f6;
        }
    </style>
`;