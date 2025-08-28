// Modal de Planejamento Template - Estrutura corrigida

export const modalPlanejamentoTemplate = () => `
    <div id="modalPlanejamentoLegacy" class="modal-overlay" style="display: none !important; position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; background: rgba(0,0,0,0.9) !important; z-index: 9999 !important; align-items: flex-start !important; justify-content: center !important; overflow-y: auto !important; padding: 20px !important; box-sizing: border-box !important; visibility: hidden !important; opacity: 0 !important;">
        <div class="modal-content-wrapper" style="background: #1a1a1a; border-radius: 16px; width: 100%; max-width: 900px; min-height: 90vh; position: relative; border: 1px solid #333; box-shadow: 0 20px 40px rgba(0,0,0,0.8);">
        <div id="planning-screen" class="planning-screen-content" style="width: 100%; height: 100%; background: #1a1a1a; position: relative; overflow: visible; display: block !important; color: white;">
        
        
        <button class="back-button btn-back" onclick="window.fecharModalPlanejamento();">
            <svg class="back-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 18l-6-6 6-6"/>
            </svg>
        </button>
        
        <div class="planning-header">
            <div class="header-content">
                <div class="page-info">
                    <h1 class="page-title">Planejamento Semanal</h1>
                    <p class="page-subtitle">Configure seus treinos da semana</p>
                </div>
            </div>
        </div>
        
        <div class="planning-content">
            <div class="planning-main">
                <div class="section-header">
                    <h2>Dias da Semana</h2>
                </div>
                <div class="week-days-grid">
                    <div class="day-card" onclick="abrirSeletorTreino('segunda', 'Segunda-feira')" id="card-segunda">
                        <div class="day-header">
                            <span class="day-name">SEG</span>
                            <span class="day-full">Segunda</span>
                        </div>
                        <div class="day-content" id="dia-1-content">
                            <div class="empty-slot">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M12 5v14m-7-7h14"/>
                                </svg>
                                <span>Adicionar</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="day-card" onclick="abrirSeletorTreino('terca', 'Terça-feira')" id="card-terca">
                        <div class="day-header">
                            <span class="day-name">TER</span>
                            <span class="day-full">Terça</span>
                        </div>
                        <div class="day-content" id="dia-2-content">
                            <div class="empty-slot">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M12 5v14m-7-7h14"/>
                                </svg>
                                <span>Adicionar</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="day-card" onclick="abrirSeletorTreino('quarta', 'Quarta-feira')" id="card-quarta">
                        <div class="day-header">
                            <span class="day-name">QUA</span>
                            <span class="day-full">Quarta</span>
                        </div>
                        <div class="day-content" id="dia-3-content">
                            <div class="empty-slot">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M12 5v14m-7-7h14"/>
                                </svg>
                                <span>Adicionar</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="day-card" onclick="abrirSeletorTreino('quinta', 'Quinta-feira')" id="card-quinta">
                        <div class="day-header">
                            <span class="day-name">QUI</span>
                            <span class="day-full">Quinta</span>
                        </div>
                        <div class="day-content" id="dia-4-content">
                            <div class="empty-slot">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M12 5v14m-7-7h14"/>
                                </svg>
                                <span>Adicionar</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="day-card" onclick="abrirSeletorTreino('sexta', 'Sexta-feira')" id="card-sexta">
                        <div class="day-header">
                            <span class="day-name">SEX</span>
                            <span class="day-full">Sexta</span>
                        </div>
                        <div class="day-content" id="dia-5-content">
                            <div class="empty-slot">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M12 5v14m-7-7h14"/>
                                </svg>
                                <span>Adicionar</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="day-card" onclick="abrirSeletorTreino('sabado', 'Sábado')" id="card-sabado">
                        <div class="day-header">
                            <span class="day-name">SAB</span>
                            <span class="day-full">Sábado</span>
                        </div>
                        <div class="day-content" id="dia-6-content">
                            <div class="empty-slot">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M12 5v14m-7-7h14"/>
                                </svg>
                                <span>Adicionar</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="day-card" onclick="abrirSeletorTreino('domingo', 'Domingo')" id="card-domingo">
                        <div class="day-header">
                            <span class="day-name">DOM</span>
                            <span class="day-full">Domingo</span>
                        </div>
                        <div class="day-content" id="dia-0-content">
                            <div class="empty-slot">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M12 5v14m-7-7h14"/>
                                </svg>
                                <span>Adicionar</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="planning-metrics">
                    <div class="metrics-grid">
                        <div class="metric-card">
                            <div class="metric-icon">📅</div>
                            <div class="metric-value" id="planned-days">0</div>
                            <div class="metric-label">Dias Planejados</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-icon">🏋️</div>
                            <div class="metric-value" id="workout-count">0</div>
                            <div class="metric-label">Treinos</div>
                        </div>
                    </div>
                </div>
                
                <div class="validation-message" id="validationMessage"></div>
            </div>
        </div>
        
        <div class="action-button-container">
            <button class="btn-primary save-btn" id="confirm-plan-btn" onclick="salvarPlanejamento()" disabled>
                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20,6 9,17 4,12"/>
                </svg>
                <span>Salvar Plano</span>
            </button>
        </div>
        </div>
    </div>
    </div>
    
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

export const modalPlanejamentoStyles = `
/* Modal Overlay - Base */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    z-index: 200000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    box-sizing: border-box;
}

.modal-content {
    background: var(--bg-primary);
    border-radius: var(--radius-lg);
    max-width: 95vw;
    max-height: 95vh;
    width: 100%;
    overflow-y: auto;
    position: relative;
    border: 1px solid var(--border-color);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
}

/* Small Modal Content for Popups */
.modal-content-small {
    background: var(--bg-card);
    border-radius: var(--radius-lg);
    max-width: 400px;
    width: 90vw;
    max-height: 80vh;
    overflow-y: auto;
    position: relative;
    border: 1px solid var(--border-color);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
}

/* Popup Header */
.popup-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px 16px;
    border-bottom: 1px solid var(--border-color);
}

.popup-header h3 {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
}

.close-btn {
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    font-size: 18px;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: var(--transition);
}

.close-btn:hover {
    background: #dc2626;
    transform: scale(1.05);
}

/* Popup Body */
.popup-body {
    padding: 20px 24px 24px;
}

/* Treino Options Grid */
.treino-options-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.treino-option {
    background: var(--bg-secondary);
    border: 2px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: 16px;
    cursor: pointer;
    transition: var(--transition);
    display: flex;
    align-items: center;
    gap: 12px;
}

.treino-option:hover {
    border-color: var(--accent-green);
    background: var(--accent-green-bg);
    transform: translateY(-1px);
}

.treino-option.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: var(--bg-muted);
}

.treino-option.disabled:hover {
    transform: none;
    border-color: var(--border-color);
    background: var(--bg-muted);
}

.option-emoji {
    font-size: 1.5rem;
    flex-shrink: 0;
}

.option-info {
    flex: 1;
}

.option-name {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 4px;
}

.option-description {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-bottom: 2px;
}

.option-status {
    font-size: 0.75rem;
    color: #ef4444;
    font-weight: 500;
}

/* Planning Screen - Estrutura padronizada seguindo o app */
.planning-screen-content {
    background: transparent;
    min-height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
    padding: 0;
    margin: 0;
}

/* Back Button padronizado seguindo home.js */
.back-button {
    position: absolute;
    top: 20px;
    left: 20px;
    z-index: 100;
    width: 40px;
    height: 40px;
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: var(--transition);
}

.back-button:hover {
    background: var(--accent-green);
    border-color: var(--accent-green);
}

.back-button:hover .back-icon {
    stroke: var(--bg-primary);
}

.back-icon {
    width: 20px;
    height: 20px;
    stroke: var(--text-secondary);
    transition: var(--transition);
}

/* Header padronizado seguindo home.js */
.planning-header {
    background: linear-gradient(135deg, var(--bg-secondary) 0%, #1e1e1e 100%);
    padding: 60px 24px 24px 24px;
    border-bottom: 1px solid var(--border-color);
    border-radius: 16px 16px 0 0;
    position: relative;
    z-index: 10;
}

.header-content {
    max-width: 1200px;
    margin: 0 auto;
    text-align: center;
}

.page-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
}

.page-title {
    font-size: 1.875rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
    line-height: 1.2;
}

.page-subtitle {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin: 0;
    line-height: 1.4;
}

/* Content seguindo padrão do home */
.planning-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 24px;
    flex: 1;
    display: flex;
    flex-direction: column;
}

.planning-main {
    background: var(--bg-card);
    border-radius: var(--radius-lg);
    padding: 24px;
    border: 1px solid var(--border-color);
    box-shadow: var(--shadow-sm);
    flex: 1;
}

/* Section Header seguindo padrão do home */
.section-header {
    margin-bottom: 24px;
}

.section-header h2 {
    font-size: 1.375rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
    text-align: center;
}

/* Week Days Grid */
.week-days-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 16px;
    margin-bottom: 32px;
    padding: 0 8px;
}

/* Day Cards */
.day-card {
    background: var(--bg-secondary);
    border: 2px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: 20px 16px;
    cursor: pointer;
    transition: var(--transition);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    min-height: 120px;
    position: relative;
    box-shadow: var(--shadow-sm);
}

.day-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    border-color: var(--accent-green);
    background: var(--accent-green-bg);
}

.day-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 16px;
    gap: 4px;
}

.day-name {
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--accent-green);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    line-height: 1;
}

.day-full {
    font-size: 0.75rem;
    color: var(--text-secondary);
    font-weight: 500;
    line-height: 1;
}

/* Day Content States */
.day-content {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    width: 100%;
}

.empty-slot {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    opacity: 0.7;
    transition: var(--transition);
    padding: 12px;
    border: 2px dashed var(--border-color);
    border-radius: var(--radius-sm);
    background: rgba(255, 255, 255, 0.02);
}

.empty-slot svg {
    stroke: var(--text-secondary);
    transition: var(--transition);
    width: 24px;
    height: 24px;
}

.empty-slot span {
    font-size: 0.8rem;
    color: var(--text-secondary);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.day-card:hover .empty-slot {
    opacity: 1;
    border-color: var(--accent-green);
    background: var(--accent-green-bg);
}

.day-card:hover .empty-slot svg {
    stroke: var(--accent-green);
    transform: scale(1.1);
}

.day-card:hover .empty-slot span {
    color: var(--accent-green);
}

/* Filled workout states */
.treino-assigned {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    width: 100%;
    position: relative;
}

.treino-emoji {
    font-size: 1.5rem;
    margin-bottom: 4px;
}

.treino-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
}

.treino-name {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1.1;
    margin-bottom: 2px;
}

.treino-type {
    font-size: 0.65rem;
    color: var(--text-secondary);
    font-weight: 500;
}

.remove-treino {
    position: absolute;
    top: -8px;
    right: -8px;
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: var(--transition);
    z-index: 2;
}

.remove-treino:hover {
    background: #dc2626;
    transform: scale(1.1);
}

/* Completed states */
.day-card.completed {
    background: var(--accent-green-bg);
    border-color: var(--accent-green);
    opacity: 0.8;
}

.day-card.completed .day-name {
    color: var(--accent-green);
}

.day-card.completed .treino-name {
    color: var(--accent-green);
}

.completed-badge {
    position: absolute;
    top: 4px;
    right: 4px;
    color: var(--accent-green);
    font-size: 1rem;
    font-weight: bold;
}

/* Planning Metrics seguindo padrão das métricas do home */
.planning-metrics {
    margin-bottom: 24px;
}

.metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 16px;
}

.metric-card {
    background: var(--bg-secondary);
    border-radius: var(--radius-lg);
    padding: 20px;
    text-align: center;
    border: 1px solid var(--border-color);
    transition: var(--transition);
    position: relative;
    overflow: hidden;
}

.metric-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, var(--accent-green-bg) 0%, transparent 60%);
    opacity: 0;
    transition: opacity 0.3s ease;
}

.metric-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    border-color: var(--accent-green);
}

.metric-card:hover::before {
    opacity: 1;
}

.metric-icon {
    font-size: 2rem;
    margin-bottom: 8px;
    position: relative;
    z-index: 1;
}

.metric-value {
    font-size: 2rem;
    font-weight: 700;
    color: var(--accent-green);
    margin-bottom: 4px;
    position: relative;
    z-index: 1;
}

.metric-label {
    font-size: 0.875rem;
    color: var(--text-secondary);
    font-weight: 500;
    position: relative;
    z-index: 1;
}

/* Validation Message */
.validation-message {
    font-size: 0.875rem;
    margin: 16px 0;
    text-align: center;
    padding: 12px;
    border-radius: var(--radius-md);
    font-weight: 500;
    min-height: 20px;
}

.validation-message.success {
    color: var(--accent-green);
    background: var(--accent-green-bg);
    border: 1px solid var(--accent-green);
}

.validation-message.error {
    color: #ef4444;
    background: #fef2f2;
    border: 1px solid #fecaca;
}

.validation-message.info {
    color: #3b82f6;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
}

.validation-message:empty {
    display: none;
}

/* Fixed Action Button seguindo padrão do app */
.action-button-container {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 16px 24px;
    background: var(--bg-primary);
    border-top: 1px solid var(--border-color);
    z-index: 100;
    backdrop-filter: blur(10px);
}

.save-btn {
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: var(--accent-green);
    color: var(--bg-primary);
    border: none;
    border-radius: var(--radius-md);
    padding: 16px 24px;
    font-size: 1.1rem;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    transition: var(--transition);
    box-shadow: var(--shadow-md);
    min-height: 56px;
}

.save-btn:hover:not(:disabled) {
    background: var(--accent-green-dark);
    transform: translateY(-1px);
    box-shadow: var(--shadow-lg);
}

.save-btn:disabled {
    background: var(--text-muted);
    color: var(--text-secondary);
    cursor: not-allowed;
    opacity: 0.6;
    transform: none;
    box-shadow: none;
}

.btn-icon {
    width: 20px;
    height: 20px;
}

/* Responsive Design */
@media (max-width: 480px) {
    .modal-content-wrapper {
        margin: 10px;
        max-width: calc(100vw - 20px);
        min-height: calc(100vh - 20px);
    }
    
    .planning-header {
        padding: 50px 16px 20px 16px;
        border-radius: 16px 16px 0 0;
    }
    
    .page-title {
        font-size: 1.5rem;
    }
    
    .page-subtitle {
        font-size: 0.875rem;
    }
    
    .planning-content {
        padding: 16px;
        padding-bottom: 100px;
    }
    
    .week-days-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        padding: 0 4px;
    }
    
    .day-card {
        padding: 16px 12px;
        min-height: 100px;
    }
    
    .day-name {
        font-size: 0.8rem;
    }
    
    .day-full {
        font-size: 0.7rem;
    }
    
    .empty-slot {
        padding: 8px;
    }
    
    .empty-slot svg {
        width: 20px;
        height: 20px;
    }
    
    .empty-slot span {
        font-size: 0.7rem;
    }
    
    .save-btn {
        padding: 14px 20px;
        font-size: 1rem;
    }
    
    .action-button-container {
        padding: 12px 16px;
    }
    
    .back-button {
        top: 15px;
        left: 15px;
        width: 36px;
        height: 36px;
    }
}

@media (min-width: 481px) and (max-width: 768px) {
    .planning-content {
        padding-bottom: 100px;
    }
    
    .week-days-grid {
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
    }
    
    .day-card {
        min-height: 90px;
    }
}

@media (min-width: 769px) {
    .planning-header {
        padding: 80px 32px 24px 32px;
    }
    
    .planning-content {
        padding: 32px 24px 100px 24px;
        max-width: 800px;
    }
    
    .week-days-grid {
        grid-template-columns: repeat(7, 1fr);
        gap: 16px;
    }
    
    .day-card {
        padding: 20px 16px;
        min-height: 110px;
    }
    
    .save-btn {
        max-width: 300px;
        font-size: 1.125rem;
    }
}

@media (min-width: 1024px) {
    .planning-content {
        max-width: 900px;
    }
    
    .week-days-grid {
        gap: 20px;
    }
    
    .planning-metrics .metrics-grid {
        max-width: 400px;
        margin: 0 auto;
    }
}
`;

export default {};
