// Modal de Planejamento Template

export const modalPlanejamentoTemplate = () => `
    <div class="planning-page-container" id="modalPlanejamento">
        <div class="planning-container">
            <div class="planning-header">
                <div class="header-top">
                    <div class="header-left">
                        <button class="btn-back" onclick="window.mostrarTela('home-screen');">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M15 18l-6-6 6-6"/>
                            </svg>
                        </button>
                        <div class="header-text">
                            <h2>Planejamento Semanal</h2>
                            <p class="header-subtitle">Configure seus treinos da semana</p>
                        </div>
                    </div>
                    <div class="planning-stats">
                        <div class="stat-badge">
                            <span class="stat-number" id="planned-days">0</span>
                            <span class="stat-label">dias</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="planning-content">
                <!-- Resumo Semanal -->
                <div class="week-summary">
                    <div class="summary-cards">
                        <div class="summary-card">
                            <div class="card-icon">🏋️</div>
                            <div class="card-content">
                                <span class="card-value" id="total-exercises">0</span>
                                <span class="card-label">exercícios</span>
                            </div>
                        </div>
                        <div class="summary-card">
                            <div class="card-icon">⏱️</div>
                            <div class="card-content">
                                <span class="card-value" id="total-duration">0min</span>
                                <span class="card-label">duração</span>
                            </div>
                        </div>
                        <div class="summary-card">
                            <div class="card-icon">🎯</div>
                            <div class="card-content">
                                <span class="card-value" id="weekly-goal">4</span>
                                <span class="card-label">meta</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Calendar dos Dias -->
                <div class="week-calendar-modern">
                    <div class="day-card compact" onclick="abrirSeletorTreino('segunda', 'Segunda-feira')" id="card-segunda">
                        <div class="day-name">SEG</div>
                        <div class="day-content" id="dia-segunda-content">
                            <div class="add-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                            </div>
                        </div>
                    </div>
                    
                    <div class="day-card compact" onclick="abrirSeletorTreino('terca', 'Terça-feira')" id="card-terca">
                        <div class="day-name">TER</div>
                        <div class="day-content" id="dia-terca-content">
                            <div class="add-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                            </div>
                        </div>
                    </div>
                    
                    <div class="day-card compact" onclick="abrirSeletorTreino('quarta', 'Quarta-feira')" id="card-quarta">
                        <div class="day-name">QUA</div>
                        <div class="day-content" id="dia-quarta-content">
                            <div class="add-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                            </div>
                        </div>
                    </div>
                    
                    <div class="day-card compact" onclick="abrirSeletorTreino('quinta', 'Quinta-feira')" id="card-quinta">
                        <div class="day-name">QUI</div>
                        <div class="day-content" id="dia-quinta-content">
                            <div class="add-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                            </div>
                        </div>
                    </div>
                    
                    <div class="day-card compact" onclick="abrirSeletorTreino('sexta', 'Sexta-feira')" id="card-sexta">
                        <div class="day-name">SEX</div>
                        <div class="day-content" id="dia-sexta-content">
                            <div class="add-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                            </div>
                        </div>
                    </div>
                    
                    <div class="day-card compact" onclick="abrirSeletorTreino('sabado', 'Sábado')" id="card-sabado">
                        <div class="day-name">SAB</div>
                        <div class="day-content" id="dia-sabado-content">
                            <div class="add-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                            </div>
                        </div>
                    </div>
                    
                    <div class="day-card compact" onclick="abrirSeletorTreino('domingo', 'Domingo')" id="card-domingo">
                        <div class="day-name">DOM</div>
                        <div class="day-content" id="dia-domingo-content">
                            <div class="add-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="planning-footer">
                <div class="validation-message" id="validationMessage"></div>
                <div class="footer-actions">
                    <button class="btn-secondary" onclick="window.mostrarTela('home-screen');">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M15 18l-6-6 6-6"/>
                        </svg>
                        Voltar
                    </button>
                    <button class="btn-primary" onclick="salvarPlanejamento()">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20,6 9,17 4,12"/>
                        </svg>
                        Salvar Plano
                    </button>
                </div>
            </div>
        </div>
    </div>
    

`;

export const modalPlanejamentoStyles = `
/* Planejamento Semanal - Design Moderno */
.planning-page-container {
    background: var(--bg-primary);
    width: 100%;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

.planning-container {
    background: var(--bg-primary);
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
}


.planning-header {
    padding: 24px;
    background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
    border-bottom: 1px solid var(--border-color);
    position: sticky;
    top: 0;
    z-index: 10;
    backdrop-filter: blur(10px);
}

.header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 1;
}

.btn-back {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-full);
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
    cursor: pointer;
    transition: var(--transition);
}

.btn-back:hover {
    background: var(--accent-green);
    color: var(--bg-primary);
    border-color: var(--accent-green);
}

.header-text h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 4px 0;
}

.header-subtitle {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin: 0;
}

.planning-stats {
    display: flex;
    gap: 8px;
}

.stat-badge {
    background: var(--accent-green-bg);
    border: 1px solid var(--accent-green);
    border-radius: var(--radius-md);
    padding: 8px 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 60px;
}

.stat-number {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--accent-green);
    line-height: 1;
}

.stat-label {
    font-size: 0.75rem;
    color: var(--accent-green);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.planning-content {
    flex: 1;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 24px;
}

/* Resumo Semanal */
.week-summary {
    margin-bottom: 8px;
}

.summary-cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
}

.summary-card {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    transition: var(--transition);
}

.summary-card:hover {
    border-color: var(--accent-green);
    box-shadow: var(--shadow-sm);
}

.card-icon {
    font-size: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: var(--accent-green-bg);
    border-radius: var(--radius-md);
}

.card-content {
    display: flex;
    flex-direction: column;
}

.card-value {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--accent-green);
    line-height: 1;
}

.card-label {
    font-size: 0.75rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-top: 2px;
}

/* Calendar Moderno */
.week-calendar-modern {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 12px;
    max-width: 800px;
    margin: 0 auto;
}

.day-card.compact {
    background: var(--bg-card);
    border: 2px solid var(--border-color);
    border-radius: var(--radius-lg);
    padding: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    min-height: 80px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    position: relative;
}

.day-card.compact:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    border-color: var(--accent-green);
    background: var(--accent-green-bg);
}

/* Estados dos cards */
.day-card.completed {
    background: #fef3c7;
    border-color: #f59e0b;
    color: #92400e;
}

.day-card.cancelled {
    background: #fee2e2;
    border-color: #ef4444;
    color: #dc2626;
}

.day-card.completed:hover,
.day-card.cancelled:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
}

.day-name {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-primary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 8px;
}

.day-card.completed .day-name {
    color: #92400e;
}

.day-card.cancelled .day-name {
    color: #dc2626;
}


.day-content {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 4px;
}

.add-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: 2px dashed var(--border-color);
    border-radius: var(--radius-md);
    transition: var(--transition);
    opacity: 0.6;
}

.add-icon svg {
    stroke: var(--text-secondary);
    transition: var(--transition);
}

.day-card.compact:hover .add-icon {
    border-color: var(--accent-green);
    opacity: 1;
}

.day-card.compact:hover .add-icon svg {
    stroke: var(--accent-green);
}

/* Conteúdo quando preenchido */
.muscle-group {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-primary);
    text-align: center;
    line-height: 1.2;
}

.day-card.completed .muscle-group {
    color: #92400e;
}

.day-card.cancelled .muscle-group {
    color: #dc2626;
}

.day-card.cancelled .muscle-group {
    text-decoration: line-through;
    opacity: 0.7;
}

.filled-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    width: 100%;
    gap: 4px;
}

.workout-emoji {
    font-size: 1.25rem;
    display: block;
}

.workout-name {
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1.1;
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
}

.rest-state {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: #6366f120;
    border-radius: var(--radius-md);
    font-size: 1rem;
}

.planning-footer {
    padding: 24px;
    border-top: 1px solid var(--border-color);
    background: var(--bg-secondary);
    margin-top: auto;
    position: sticky;
    bottom: 0;
    backdrop-filter: blur(10px);
}

.validation-message {
    font-size: 0.875rem;
    margin-bottom: 16px;
    text-align: center;
    padding: 12px;
    border-radius: var(--radius-md);
    font-weight: 500;
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

.validation-message:empty {
    display: none;
}

.footer-actions {
    display: flex;
    gap: 16px;
}

.footer-actions button {
    flex: 1;
    padding: 14px 20px;
    border-radius: var(--radius-lg);
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: var(--transition);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 48px;
}

.btn-secondary {
    background: var(--bg-card);
    color: var(--text-primary);
    border: 2px solid var(--border-color);
}

.btn-secondary:hover {
    background: var(--bg-primary);
    border-color: var(--accent-green);
    color: var(--accent-green);
}

.btn-primary {
    background: var(--accent-green);
    color: var(--bg-primary);
    border: 2px solid var(--accent-green);
}

.btn-primary:hover {
    background: var(--accent-green-dark);
    border-color: var(--accent-green-dark);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
}

.btn-primary:disabled {
    background: var(--text-secondary);
    border-color: var(--text-secondary);
    cursor: not-allowed;
    opacity: 0.7;
    transform: none;
}

.btn-secondary svg,
.btn-primary svg {
    width: 18px;
    height: 18px;
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

/* Responsive Design */
@media (max-width: 768px) {
    .planning-header {
        padding: 20px 16px;
    }
    
    .planning-content {
        padding: 16px;
        gap: 20px;
    }
    
    .header-left {
        gap: 12px;
    }
    
    .header-text h2 {
        font-size: 1.25rem;
    }
    
    .summary-cards {
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
    }
    
    .summary-card {
        padding: 12px;
        flex-direction: column;
        gap: 8px;
        text-align: center;
    }
    
    .card-icon {
        width: 32px;
        height: 32px;
        font-size: 1.25rem;
    }
    
    .week-calendar-modern {
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
    }
    
    .day-card.compact {
        padding: 10px;
        min-height: 70px;
    }
    
    .day-name {
        font-size: 0.7rem;
        margin-bottom: 6px;
    }
    
    .add-icon {
        width: 24px;
        height: 24px;
    }
    
    .muscle-group {
        font-size: 0.7rem;
    }
    
    .planning-footer {
        padding: 16px;
    }
    
    .footer-actions {
        gap: 12px;
    }
    
    .footer-actions button {
        padding: 12px 16px;
        font-size: 0.9rem;
    }
}

@media (min-width: 769px) {
    .week-calendar-modern {
        grid-template-columns: repeat(7, 1fr);
        gap: 12px;
    }
}

@media (min-width: 1024px) {
    .planning-container {
        max-width: 900px;
    }
    
    .summary-cards {
        max-width: 600px;
        margin: 0 auto;
    }
}
`;

export default {};