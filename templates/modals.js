export const modalPlanejamentoTemplate = () => `
    <div id="modalPlanejamento" class="modal-planning" style="display: none;">
        <div class="planning-container">
            <!-- Header fixo -->
            <div class="planning-header">
                <div class="header-top">
                    <h2>📅 Planejamento Semanal</h2>
                    <button class="btn-close" onclick="fecharModalPlanejamento()">
                        <svg viewBox="0 0 24 24" width="24" height="24">
                            <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>
                <p class="header-subtitle">Arraste os treinos para organizar sua semana</p>
            </div>
            
            <!-- Área de conteúdo scrollável -->
            <div class="planning-content">
                <!-- Treinos disponíveis -->
                <div class="available-workouts">
                    <h3>Treinos Disponíveis</h3>
                    <div class="workouts-grid" id="listaTreinosDisponiveis">
                        <!-- Será preenchido dinamicamente -->
                    </div>
                </div>
                
                <!-- Calendário semanal -->
                <div class="weekly-calendar">
                    <h3>Sua Semana</h3>
                    <div class="days-container">
                        <div class="day-column" data-dia="1">
                            <div class="day-header">
                                <span class="day-name">Segunda</span>
                                <span class="day-date">28</span>
                            </div>
                            <div class="drop-zone" data-dia="1">
                                <div class="drop-placeholder">
                                    <svg viewBox="0 0 24 24" width="32" height="32">
                                        <path fill="currentColor" opacity="0.3" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
                                    </svg>
                                    <span>Adicionar treino</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="day-column" data-dia="2">
                            <div class="day-header">
                                <span class="day-name">Terça</span>
                                <span class="day-date">29</span>
                            </div>
                            <div class="drop-zone" data-dia="2">
                                <div class="drop-placeholder">
                                    <svg viewBox="0 0 24 24" width="32" height="32">
                                        <path fill="currentColor" opacity="0.3" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
                                    </svg>
                                    <span>Adicionar treino</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="day-column" data-dia="3">
                            <div class="day-header">
                                <span class="day-name">Quarta</span>
                                <span class="day-date">30</span>
                            </div>
                            <div class="drop-zone" data-dia="3">
                                <div class="drop-placeholder">
                                    <svg viewBox="0 0 24 24" width="32" height="32">
                                        <path fill="currentColor" opacity="0.3" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
                                    </svg>
                                    <span>Adicionar treino</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="day-column" data-dia="4">
                            <div class="day-header">
                                <span class="day-name">Quinta</span>
                                <span class="day-date">31</span>
                            </div>
                            <div class="drop-zone" data-dia="4">
                                <div class="drop-placeholder">
                                    <svg viewBox="0 0 24 24" width="32" height="32">
                                        <path fill="currentColor" opacity="0.3" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
                                    </svg>
                                    <span>Adicionar treino</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="day-column" data-dia="5">
                            <div class="day-header">
                                <span class="day-name">Sexta</span>
                                <span class="day-date">1</span>
                            </div>
                            <div class="drop-zone" data-dia="5">
                                <div class="drop-placeholder">
                                    <svg viewBox="0 0 24 24" width="32" height="32">
                                        <path fill="currentColor" opacity="0.3" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
                                    </svg>
                                    <span>Adicionar treino</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="day-column" data-dia="6">
                            <div class="day-header">
                                <span class="day-name">Sábado</span>
                                <span class="day-date">2</span>
                            </div>
                            <div class="drop-zone" data-dia="6">
                                <div class="drop-placeholder">
                                    <svg viewBox="0 0 24 24" width="32" height="32">
                                        <path fill="currentColor" opacity="0.3" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
                                    </svg>
                                    <span>Adicionar treino</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="day-column" data-dia="0">
                            <div class="day-header">
                                <span class="day-name">Domingo</span>
                                <span class="day-date">3</span>
                            </div>
                            <div class="drop-zone" data-dia="0">
                                <div class="drop-placeholder">
                                    <svg viewBox="0 0 24 24" width="32" height="32">
                                        <path fill="currentColor" opacity="0.3" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
                                    </svg>
                                    <span>Adicionar treino</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Footer fixo -->
            <div class="planning-footer">
                <div class="validation-message" id="plan-validation-message"></div>
                <div class="footer-actions">
                    <button class="btn-cancel" onclick="fecharModalPlanejamento()">Cancelar</button>
                    <button class="btn-save" id="confirm-plan-btn" onclick="salvarPlanejamentoSemanal()" disabled>
                        Salvar Planejamento
                    </button>
                </div>
            </div>
        </div>
    </div>
`;

export const modalPlanejamentoStyles = `
/* Modal de Planejamento - Mobile First */
.modal-planning {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.9);
    z-index: 999999;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding: 0;
}

.planning-container {
    background: var(--bg-primary);
    width: 100%;
    max-width: 100%;
    height: 90vh;
    border-radius: 24px 24px 0 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
    from {
        transform: translateY(100%);
    }
    to {
        transform: translateY(0);
    }
}

/* Header */
.planning-header {
    background: var(--bg-secondary);
    padding: 20px;
    border-bottom: 1px solid var(--border-color);
    flex-shrink: 0;
}

.header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.planning-header h2 {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
}

.btn-close {
    background: none;
    border: none;
    color: var(--text-secondary);
    padding: 8px;
    cursor: pointer;
    border-radius: 50%;
    transition: all 0.2s ease;
}

.btn-close:hover {
    background: var(--bg-primary);
    color: var(--text-primary);
}

.header-subtitle {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin: 0;
}

/* Content Area */
.planning-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 20px;
    -webkit-overflow-scrolling: touch;
}

/* Available Workouts */
.available-workouts {
    margin-bottom: 32px;
}

.available-workouts h3 {
    font-size: 1rem;
    margin-bottom: 16px;
    color: var(--text-secondary);
}

.workouts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
}

.treino-item {
    background: var(--bg-card);
    border: 2px solid var(--border-color);
    border-radius: 12px;
    padding: 16px;
    cursor: move;
    transition: all 0.2s ease;
    text-align: center;
    touch-action: none;
}

.treino-item:active {
    transform: scale(0.98);
    opacity: 0.8;
}

.treino-item.dragging {
    opacity: 0.5;
    transform: scale(0.95);
    border-color: var(--accent-green);
}

.treino-tipo {
    display: block;
    font-size: 2rem;
    margin-bottom: 8px;
}

.treino-nome {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary);
}

/* Weekly Calendar */
.weekly-calendar h3 {
    font-size: 1rem;
    margin-bottom: 16px;
    color: var(--text-secondary);
}

.days-container {
    display: flex;
    gap: 12px;
    overflow-x: auto;
    padding-bottom: 12px;
    -webkit-overflow-scrolling: touch;
}

.day-column {
    min-width: 140px;
    flex-shrink: 0;
}

.day-header {
    background: var(--bg-card);
    padding: 12px;
    border-radius: 12px 12px 0 0;
    text-align: center;
    border-bottom: 2px solid var(--accent-green);
}

.day-name {
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary);
}

.day-date {
    display: block;
    font-size: 0.75rem;
    color: var(--text-secondary);
    margin-top: 2px;
}

.drop-zone {
    background: var(--bg-secondary);
    min-height: 120px;
    border-radius: 0 0 12px 12px;
    border: 2px dashed var(--border-color);
    border-top: none;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px;
    transition: all 0.2s ease;
}

.drop-zone.drag-over {
    border-color: var(--accent-green);
    background: rgba(168, 255, 0, 0.05);
}

.drop-placeholder {
    text-align: center;
    color: var(--text-muted);
}

.drop-placeholder svg {
    margin-bottom: 4px;
}

.drop-placeholder span {
    display: block;
    font-size: 0.75rem;
}

/* Treino no dia */
.treino-no-dia {
    background: var(--accent-green);
    color: var(--bg-primary);
    padding: 16px 12px;
    border-radius: 8px;
    text-align: center;
    position: relative;
    width: 100%;
}

.treino-no-dia .treino-tipo {
    font-size: 1.5rem;
    margin-bottom: 4px;
}

.treino-no-dia .treino-nome {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--bg-primary);
}

.remover-treino-dia {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 24px;
    height: 24px;
    background: rgba(0, 0, 0, 0.3);
    border: none;
    border-radius: 50%;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
    line-height: 1;
}

/* Footer */
.planning-footer {
    background: var(--bg-secondary);
    padding: 20px;
    border-top: 1px solid var(--border-color);
    flex-shrink: 0;
}

.validation-message {
    margin-bottom: 16px;
    padding: 12px;
    border-radius: 8px;
    font-size: 0.875rem;
    text-align: center;
    display: none;
}

.validation-message.success {
    display: block;
    background: rgba(168, 255, 0, 0.1);
    color: var(--accent-green);
    border: 1px solid var(--accent-green);
}

.validation-message.error {
    display: block;
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border: 1px solid #ef4444;
}

.footer-actions {
    display: flex;
    gap: 12px;
}

.btn-cancel,
.btn-save {
    flex: 1;
    padding: 16px;
    border: none;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-cancel {
    background: var(--bg-primary);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
}

.btn-save {
    background: var(--accent-green);
    color: var(--bg-primary);
}

.btn-save:disabled {
    background: var(--bg-primary);
    color: var(--text-muted);
    cursor: not-allowed;
}

/* Responsive para tablets e desktop */
@media (min-width: 768px) {
    .planning-container {
        max-width: 800px;
        height: 80vh;
        margin: 20px;
        border-radius: 24px;
    }
    
    .workouts-grid {
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    }
    
    .days-container {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        overflow-x: visible;
    }
    
    .day-column {
        min-width: auto;
    }
}

/* Touch feedback para mobile */
@media (hover: none) {
    .treino-item:active {
        background: var(--bg-secondary);
    }
    
    .btn-close:active,
    .btn-cancel:active,
    .btn-save:not(:disabled):active {
        transform: scale(0.95);
    }
}

/* Melhorias de acessibilidade */
.treino-item:focus,
.btn-close:focus,
.btn-cancel:focus,
.btn-save:focus {
    outline: 2px solid var(--accent-green);
    outline-offset: 2px;
}

/* Animações suaves */
.treino-item,
.drop-zone,
.btn-cancel,
.btn-save {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
`;

export default {};