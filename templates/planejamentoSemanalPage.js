export const planejamentoSemanalPageTemplate = () => `
    <div id="modalPlanejamento" class="modal planning-modal" style="display: flex !important;">
        <div class="modal-content planning-content">
            <div class="modal-header planning-header">
                <h2>Planejamento Semanal</h2>
                <p class="modal-subtitle">Configure seus treinos da semana</p>
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
`;