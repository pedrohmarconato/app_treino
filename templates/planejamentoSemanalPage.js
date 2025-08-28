export const planejamentoSemanalPageTemplate = () => `
    <div id="modalPlanejamento" class="modal planning-modal">
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
                    <div class="section-header">
                        <h3 class="section-title">Dias da Semana</h3>
                        <div class="status-legend">
                            <div class="legend-item">
                                <div class="legend-indicator completed"></div>
                                <span>Concluído</span>
                            </div>
                            <div class="legend-item">
                                <div class="legend-indicator pending"></div>
                                <span>Pendente</span>
                            </div>
                            <div class="legend-item">
                                <div class="legend-indicator blocked"></div>
                                <span>Bloqueado</span>
                            </div>
                            <div class="legend-item">
                                <div class="legend-indicator rest"></div>
                                <span>Folga</span>
                            </div>
                        </div>
                    </div>
                    <div class="dias-lista">
                        ${['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']
                          .map(
                            (dia, index) => `
                            <div class="dia-item" id="dia-${index + 1}" data-day-index="${index + 1}">
                                <div class="dia-header">
                                    <span class="dia-label">${dia.toUpperCase()}</span>
                                    <div class="dia-status-indicator" id="status-${index + 1}">
                                        <div class="status-dot"></div>
                                        <span class="status-text">Carregando...</span>
                                    </div>
                                </div>
                                <div class="dia-content" id="dia-${index + 1}-content">
                                    <button class="btn-adicionar" onclick="abrirSeletorTreino(${index + 1}, '${dia}')" id="btn-${index + 1}">
                                        <svg viewBox="0 0 24 24" width="16" height="16">
                                            <path fill="currentColor" d="M12 5v14m-7-7h14"/>
                                        </svg>
                                        <span class="btn-text">Adicionar</span>
                                    </button>
                                </div>
                                <div class="dia-restriction-overlay" id="overlay-${index + 1}" style="display: none;">
                                    <div class="restriction-icon">🚫</div>
                                    <div class="restriction-text">Não editável</div>
                                </div>
                            </div>
                        `
                          )
                          .join('')}
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
        /* Modal de Planejamento - Hidden by default */
        .modal.planning-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 9999;
            align-items: center;
            justify-content: center;
            overflow-y: auto;
            padding: 20px;
            box-sizing: border-box;
        }
        
        /* Modal visible class */
        .modal.planning-modal.visible {
            display: flex;
        }

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

        /* Status Legend Styles */
        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
        }

        .section-title {
            margin: 0;
            font-size: 1.125rem;
            font-weight: 600;
            color: var(--text-primary);
        }

        .status-legend {
            display: flex;
            gap: 16px;
            align-items: center;
        }

        .legend-item {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 0.75rem;
            color: var(--text-secondary);
        }

        .legend-indicator {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            border: 2px solid;
        }

        .legend-indicator.completed {
            background: rgba(34, 197, 94, 0.2);
            border-color: #22c55e;
        }

        .legend-indicator.pending {
            background: rgba(245, 158, 11, 0.2);
            border-color: #f59e0b;
        }

        .legend-indicator.blocked {
            background: rgba(156, 163, 175, 0.2);
            border-color: #9ca3af;
        }

        .legend-indicator.rest {
            background: rgba(99, 102, 241, 0.2);
            border-color: #6366f1;
        }

        /* Day Status Indicators */
        .dia-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }

        .dia-status-indicator {
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #e5e7eb;
            transition: all 0.2s ease;
        }

        .status-dot.completed {
            background: #22c55e;
            box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
        }

        .status-dot.pending {
            background: #f59e0b;
            box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2);
        }

        .status-dot.blocked {
            background: #9ca3af;
            box-shadow: 0 0 0 2px rgba(156, 163, 175, 0.2);
        }

        .status-dot.rest {
            background: #6366f1;
            box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
        }

        .dia-status-indicator .status-text {
            font-size: 0.75rem;
            color: var(--text-secondary);
            font-weight: 500;
        }

        /* Restriction Overlay Styles */
        .dia-item {
            position: relative;
            transition: all 0.2s ease;
        }

        .dia-restriction-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(156, 163, 175, 0.8);
            border-radius: var(--radius-md);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 8px;
            backdrop-filter: blur(2px);
            z-index: 10;
            transition: all 0.2s ease;
        }

        .restriction-icon {
            font-size: 1.5rem;
            opacity: 0.8;
        }

        .restriction-text {
            font-size: 0.75rem;
            font-weight: 600;
            color: #374151;
            text-align: center;
        }

        /* Enhanced Day Item Styles */
        .dia-item.blocked {
            opacity: 0.7;
            pointer-events: none;
        }

        .dia-item.completed .dia-content {
            background: rgba(34, 197, 94, 0.05);
            border-color: rgba(34, 197, 94, 0.2);
        }

        .dia-item.pending .dia-content {
            background: rgba(245, 158, 11, 0.05);
            border-color: rgba(245, 158, 11, 0.2);
        }

        .dia-item.rest .dia-content {
            background: rgba(99, 102, 241, 0.05);
            border-color: rgba(99, 102, 241, 0.2);
        }
    </style>
`;
