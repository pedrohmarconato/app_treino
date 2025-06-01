// Modal de Planejamento Template

export const modalPlanejamentoTemplate = () => `
    <div class="planning-page-container" id="modalPlanejamento">
        <div class="planning-container">
            <div class="planning-header">
                <div class="header-top">
                    <h2>📅 Planejamento Semanal</h2>
                    <button class="btn-close" onclick="window.mostrarTela('home-screen');">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <p class="header-subtitle">Toque nos dias para configurar seus treinos</p>
            </div>
            
            <div class="planning-content">
                <div class="week-calendar-mobile">
                    <div class="day-card" onclick="abrirSeletorTreino('segunda', 'Segunda-feira')">
                        <div class="day-header">
                            <span class="day-name">Segunda</span>
                            <span class="day-number">1</span>
                        </div>
                        <div class="day-content">
                            <div class="empty-slot">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="8" x2="12" y2="16"></line>
                                    <line x1="8" y1="12" x2="16" y2="12"></line>
                                </svg>
                                <span>Adicionar treino</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="day-card" onclick="abrirSeletorTreino('terca', 'Terça-feira')">
                        <div class="day-header">
                            <span class="day-name">Terça</span>
                            <span class="day-number">2</span>
                        </div>
                        <div class="day-content">
                            <div class="empty-slot">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="8" x2="12" y2="16"></line>
                                    <line x1="8" y1="12" x2="16" y2="12"></line>
                                </svg>
                                <span>Adicionar treino</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="day-card" onclick="abrirSeletorTreino('quarta', 'Quarta-feira')">
                        <div class="day-header">
                            <span class="day-name">Quarta</span>
                            <span class="day-number">3</span>
                        </div>
                        <div class="day-content">
                            <div class="empty-slot">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="8" x2="12" y2="16"></line>
                                    <line x1="8" y1="12" x2="16" y2="12"></line>
                                </svg>
                                <span>Adicionar treino</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="day-card" onclick="abrirSeletorTreino('quinta', 'Quinta-feira')">
                        <div class="day-header">
                            <span class="day-name">Quinta</span>
                            <span class="day-number">4</span>
                        </div>
                        <div class="day-content">
                            <div class="empty-slot">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="8" x2="12" y2="16"></line>
                                    <line x1="8" y1="12" x2="16" y2="12"></line>
                                </svg>
                                <span>Adicionar treino</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="day-card" onclick="abrirSeletorTreino('sexta', 'Sexta-feira')">
                        <div class="day-header">
                            <span class="day-name">Sexta</span>
                            <span class="day-number">5</span>
                        </div>
                        <div class="day-content">
                            <div class="empty-slot">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="8" x2="12" y2="16"></line>
                                    <line x1="8" y1="12" x2="16" y2="12"></line>
                                </svg>
                                <span>Adicionar treino</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="day-card" onclick="abrirSeletorTreino('sabado', 'Sábado')">
                        <div class="day-header">
                            <span class="day-name">Sábado</span>
                            <span class="day-number">6</span>
                        </div>
                        <div class="day-content">
                            <div class="empty-slot">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="8" x2="12" y2="16"></line>
                                    <line x1="8" y1="12" x2="16" y2="12"></line>
                                </svg>
                                <span>Adicionar treino</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="day-card" onclick="abrirSeletorTreino('domingo', 'Domingo')">
                        <div class="day-header">
                            <span class="day-name">Domingo</span>
                            <span class="day-number">7</span>
                        </div>
                        <div class="day-content">
                            <div class="empty-slot">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="8" x2="12" y2="16"></line>
                                    <line x1="8" y1="12" x2="16" y2="12"></line>
                                </svg>
                                <span>Adicionar treino</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="planning-footer">
                <div class="validation-message" id="validationMessage"></div>
                <div class="footer-actions">
                    <button class="btn-cancel" onclick="window.mostrarTela('home-screen');">Cancelar</button>
                    <button class="btn-save" onclick="salvarPlanejamento()">Salvar Planejamento</button>
                </div>
            </div>
        </div>
    </div>
    

`;

export const modalPlanejamentoStyles = `
/* Planejamento Semanal Page Styles */
.planning-page-container {
    /* anteriormente .modal-planning e .planning-container */
    background: var(--bg-primary);
    width: 100%;
    min-height: calc(100vh - 60px); /* Ajustar conforme altura do nav/header se houver */
    padding: 20px;
    display: flex;
    flex-direction: column;
    /* z-index e position:fixed removidos */
    /* max-width, max-height, overflow:hidden, animation removidos para comportamento de página */
}

/* Mantendo .planning-container para estrutura interna, mas sem ser o container principal da página */
.planning-container {
    background: var(--bg-primary); /* ou var(--bg-card) se preferir um card dentro da página */
    width: 100%;
    max-width: 700px; /* Ajuste para um layout de página, pode ser maior */
    margin: 0 auto; /* Centralizar se max-width for usado */
    border-radius: 12px; /* Opcional */
    display: flex;
    flex-direction: column;
    /* overflow: hidden; /* Removido para permitir scroll da página inteira */
}


.planning-header {
    padding: 20px 24px 16px;
    border-bottom: 1px solid var(--border-color);
}

.header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
}

.planning-header h2 {
    font-size: 1.75rem; /* Aumentar para título de página */
    color: var(--text-primary);
    margin: 0;
}

.btn-close {
    background: none;
    border: none;
    color: var(--text-secondary);
    font-size: 1.5rem;
    cursor: pointer;
    padding: 4px;
}

.btn-close:hover {
    color: var(--text-primary);
}

.header-subtitle {
    font-size: 0.9rem;
    color: var(--text-secondary);
    margin: 0;
}

.planning-content {
    flex-grow: 1;
    /* overflow-y: auto; /* Removido, scroll será da página */
    padding: 16px;
}

.week-calendar-mobile {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px;
}

.day-card {
    background: var(--bg-secondary);
    border-radius: 12px;
    padding: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid var(--border-color);
}

.day-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    border-color: var(--accent-green);
}

.day-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.day-name {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-primary);
}

.day-number {
    font-size: 0.8rem;
    background-color: var(--accent-green);
    color: var(--bg-primary);
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: bold;
}

.day-content .empty-slot {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    padding: 16px 0;
    border: 2px dashed var(--border-color);
    border-radius: 8px;
}

.day-content .empty-slot svg {
    margin-bottom: 8px;
    stroke: var(--text-muted);
}

.day-content .empty-slot span {
    font-size: 0.85rem;
}

.day-content .filled-slot {
    text-align: center;
    padding: 8px 0;
}

.day-content .filled-slot .treino-emoji {
    font-size: 1.8rem;
    display: block;
    margin-bottom: 4px;
}

.day-content .filled-slot .treino-nome {
    font-size: 0.9rem;
    color: var(--text-primary);
    font-weight: 500;
    margin-bottom: 2px;
}

.day-content .filled-slot .treino-tipo {
    font-size: 0.75rem;
    color: var(--text-secondary);
}

.planning-footer {
    padding: 16px 24px;
    border-top: 1px solid var(--border-color);
    background-color: var(--bg-secondary);
    margin-top: auto; /* Empurra o footer para baixo se o conteúdo for curto */
}

.validation-message {
    font-size: 0.85rem;
    margin-bottom: 12px;
    text-align: center;
}

.validation-message.success {
    color: var(--accent-green);
}

.validation-message.error {
    color: #ff6b6b; /* Cor de erro */
}

.footer-actions {
    display: flex;
    gap: 12px;
}

.footer-actions button {
    flex-grow: 1;
    padding: 12px;
    border-radius: 8px;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.btn-cancel {
    background-color: var(--bg-card);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
}

.btn-cancel:hover {
    background-color: var(--bg-card-hover);
}

.btn-save {
    background-color: var(--accent-green);
    color: var(--bg-primary);
    border: none;
}

.btn-save:hover {
    background-color: var(--accent-green-dark);
}

.btn-save:disabled {
    background-color: var(--text-muted);
    cursor: not-allowed;
    opacity: 0.7;
}

/* Estilos para o .treino-popup, .popup-overlay, etc. FORAM REMOVIDOS DAQUI 
   pois o popup correto está em index.html e estilizado por styles.css */

.option-info {
    flex: 1;
}

.option-name {
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 4px;
}

.option-description {
    font-size: 0.875rem;
    color: var(--text-secondary);
}

.option-status {
    font-size: 0.75rem;
    color: #ef4444;
    font-weight: 500;
}

/* Responsivo para telas maiores */
@media (min-width: 768px) {
    .planning-container {
        max-width: 600px;
    }
    
    .week-calendar-mobile {
        grid-template-columns: repeat(2, 1fr);
    }
    
    .popup-content {
        border-radius: 20px;
        max-height: 70vh;
        margin: 20px;
    }
    
    .treino-popup {
        align-items: center;
    }
}

@media (min-width: 1024px) {
    .week-calendar-mobile {
        grid-template-columns: repeat(3, 1fr);
    }
}
`;

export default {};