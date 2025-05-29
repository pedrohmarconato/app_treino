// Template da tela home
export const homeTemplate = () => `
    <div id="home-screen" class="screen">
        <button class="back-button" onclick="logout()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 18l-6-6 6-6"/>
            </svg>
        </button>
        <div class="home-header">
            <div class="header-content">
                <div class="user-info">
                    <div class="user-avatar-small">
                        <img id="user-avatar" class="avatar-img" src="pedro.png" alt="Avatar" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
                    </div>
                    <div class="user-greeting">
                        <h4>Olá! Bem-vindo ao Cyclo</h4>
                        <p id="user-name">Usuário</p>
                    </div>
                </div>
                <button class="btn-icon" onclick="logout()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 21H5M12 19l-7-7 7-7"/>
                    </svg>
                </button>
            </div>
        </div>

        <div class="home-content">
            <!-- Grid de Usuários movido da tela de login -->
            <div class="users-grid" id="users-grid">
                <!-- Usuários serão carregados dinamicamente -->
            </div>

            <!-- Semana de Treinos -->
            <div class="training-plan">
                <div class="section-header">
                    <h2>Semana de Treinos</h2>
                    <button class="btn-secondary" onclick="mostrarModalPlanejamento()">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 5v14m-7-7h14"/>
                        </svg>
                        Editar
                    </button>
                </div>
                
                <div class="week-indicator">
                    <div class="day-pill">Dom</div>
                    <div class="day-pill">Seg</div>
                    <div class="day-pill">Ter</div>
                    <div class="day-pill">Qua</div>
                    <div class="day-pill">Qui</div>
                    <div class="day-pill">Sex</div>
                    <div class="day-pill">Sáb</div>
                </div>

                <div class="progress-card">
                    <div class="progress-header">
                        <div class="progress-info">
                            <h3 id="workout-type-label">Treino do Dia</h3>
                            <h2 id="next-workout-name">Carregando...</h2>
                            <div class="progress-meta">
                                <span id="workout-week">Semana 1</span>
                                <span>•</span>
                                <span id="workout-exercises">0 exercícios</span>
                            </div>
                        </div>
                        <div class="progress-visual">
                            <svg class="progress-ring" viewBox="0 0 100 100">
                                <circle class="progress-ring-bg" cx="50" cy="50" r="40"/>
                                <circle class="progress-ring-progress" cx="50" cy="50" r="40"
                                        stroke-dasharray="251.2"
                                        stroke-dashoffset="25.12"/>
                            </svg>
                            <div class="progress-percentage">0%</div>
                        </div>
                    </div>
                    <button class="btn-primary" id="start-workout-btn">
                        Iniciar Treino
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                    </button>
                </div>
            </div>

            <!-- Ordem Customizada da Semana -->
            <div class="custom-week-section">
                <div class="section-header">
                    <h2>Ordem da Semana</h2>
                    <button class="btn-secondary" onclick="window.renderTemplate && window.renderTemplate('orderWeek')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        Organizar
                    </button>
                </div>
                <ul id="custom-week-list" class="custom-week-list">
                    <!-- Lista será preenchida dinamicamente -->
                </ul>
            </div>

            <!-- Metrics Section -->
            <div class="metrics-section">
                <h2>Métricas de Performance</h2>
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-value" id="completed-workouts">0</div>
                        <div class="metric-label">Treinos</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value" id="current-week">1</div>
                        <div class="metric-label">Semana</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value" id="progress-percentage">0%</div>
                        <div class="metric-label">Progresso</div>
                    </div>
                </div>

                <!-- Metrics Detail -->
                <div class="metrics-detail">
                    <div class="metric-comparison">
                        <h4>Comparação Semanal</h4>
                        <div class="comparison-bars">
                            <div class="user-bar">
                                <span>Você</span>
                                <div class="bar-container">
                                    <div class="bar" id="user-progress-bar" style="width: 0%"></div>
                                </div>
                                <span id="user-workouts">0</span>
                            </div>
                            <div class="user-bar">
                                <span>Média</span>
                                <div class="bar-container">
                                    <div class="bar" style="width: 60%; background: var(--text-secondary)"></div>
                                </div>
                                <span>3</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal de Planejamento Semanal -->
        <div id="modal-planejamento" class="modal-overlay" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Planejamento Semanal</h2>
                    <button class="btn-close" onclick="fecharModalPlanejamento()">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                
                <div class="modal-body">
                    <p class="modal-description">
                        Configure seu planejamento semanal de treinos. Cada treino (A, B, C, D) deve aparecer apenas uma vez na semana.
                    </p>
                    
                    <form id="form-planejamento">
                        <div class="dias-grid">
                            <div class="dia-card">
                                <label class="dia-label">Domingo</label>
                                <select name="0" class="dia-select" required>
                                    <option value="">Selecione...</option>
                                    <option value="A">💪 Treino A - Peito/Tríceps</option>
                                    <option value="B">🔙 Treino B - Costas/Bíceps</option>
                                    <option value="C">🦵 Treino C - Pernas</option>
                                    <option value="D">🎯 Treino D - Ombros/Abdômen</option>
                                    <option value="cardio">🏃 Cardio</option>
                                    <option value="folga">😴 Folga</option>
                                </select>
                            </div>
                            
                            <div class="dia-card">
                                <label class="dia-label">Segunda</label>
                                <select name="1" class="dia-select" required>
                                    <option value="">Selecione...</option>
                                    <option value="A">💪 Treino A - Peito/Tríceps</option>
                                    <option value="B">🔙 Treino B - Costas/Bíceps</option>
                                    <option value="C">🦵 Treino C - Pernas</option>
                                    <option value="D">🎯 Treino D - Ombros/Abdômen</option>
                                    <option value="cardio">🏃 Cardio</option>
                                    <option value="folga">😴 Folga</option>
                                </select>
                            </div>
                            
                            <div class="dia-card">
                                <label class="dia-label">Terça</label>
                                <select name="2" class="dia-select" required>
                                    <option value="">Selecione...</option>
                                    <option value="A">💪 Treino A - Peito/Tríceps</option>
                                    <option value="B">🔙 Treino B - Costas/Bíceps</option>
                                    <option value="C">🦵 Treino C - Pernas</option>
                                    <option value="D">🎯 Treino D - Ombros/Abdômen</option>
                                    <option value="cardio">🏃 Cardio</option>
                                    <option value="folga">😴 Folga</option>
                                </select>
                            </div>
                            
                            <div class="dia-card">
                                <label class="dia-label">Quarta</label>
                                <select name="3" class="dia-select" required>
                                    <option value="">Selecione...</option>
                                    <option value="A">💪 Treino A - Peito/Tríceps</option>
                                    <option value="B">🔙 Treino B - Costas/Bíceps</option>
                                    <option value="C">🦵 Treino C - Pernas</option>
                                    <option value="D">🎯 Treino D - Ombros/Abdômen</option>
                                    <option value="cardio">🏃 Cardio</option>
                                    <option value="folga">😴 Folga</option>
                                </select>
                            </div>
                            
                            <div class="dia-card">
                                <label class="dia-label">Quinta</label>
                                <select name="4" class="dia-select" required>
                                    <option value="">Selecione...</option>
                                    <option value="A">💪 Treino A - Peito/Tríceps</option>
                                    <option value="B">🔙 Treino B - Costas/Bíceps</option>
                                    <option value="C">🦵 Treino C - Pernas</option>
                                    <option value="D">🎯 Treino D - Ombros/Abdômen</option>
                                    <option value="cardio">🏃 Cardio</option>
                                    <option value="folga">😴 Folga</option>
                                </select>
                            </div>
                            
                            <div class="dia-card">
                                <label class="dia-label">Sexta</label>
                                <select name="5" class="dia-select" required>
                                    <option value="">Selecione...</option>
                                    <option value="A">💪 Treino A - Peito/Tríceps</option>
                                    <option value="B">🔙 Treino B - Costas/Bíceps</option>
                                    <option value="C">🦵 Treino C - Pernas</option>
                                    <option value="D">🎯 Treino D - Ombros/Abdômen</option>
                                    <option value="cardio">🏃 Cardio</option>
                                    <option value="folga">😴 Folga</option>
                                </select>
                            </div>
                            
                            <div class="dia-card">
                                <label class="dia-label">Sábado</label>
                                <select name="6" class="dia-select" required>
                                    <option value="">Selecione...</option>
                                    <option value="A">💪 Treino A - Peito/Tríceps</option>
                                    <option value="B">🔙 Treino B - Costas/Bíceps</option>
                                    <option value="C">🦵 Treino C - Pernas</option>
                                    <option value="D">🎯 Treino D - Ombros/Abdômen</option>
                                    <option value="cardio">🏃 Cardio</option>
                                    <option value="folga">😴 Folga</option>
                                </select>
                            </div>
                        </div>
                        
                        <div id="plan-validation" class="plan-validation"></div>
                        
                        <div class="modal-actions">
                            <button type="button" class="btn-secondary" onclick="fecharModalPlanejamento()">
                                Cancelar
                            </button>
                            <button type="submit" id="confirm-plan-btn" class="btn-primary" disabled>
                                Salvar Planejamento
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
`;

// Estilos específicos da tela home - ATUALIZADOS
export const homeStyles = `
    /* Home Screen */
    .home-header {
        background: var(--bg-secondary);
        padding: 20px 24px;
        border-bottom: 1px solid var(--border-color);
    }

    .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        max-width: 1200px;
        margin: 0 auto;
    }

    .user-info {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .user-avatar-small {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        overflow: hidden;
        border: 2px solid var(--border-color);
    }

    .user-greeting h4 {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin-bottom: 2px;
    }

    .user-greeting p {
        font-size: 1rem;
        font-weight: 600;
    }

    .home-content {
        max-width: 1200px;
        margin: 0 auto;
        padding: 24px;
    }

    .training-plan {
        background: var(--bg-card);
        border-radius: var(--radius-lg);
        padding: 24px;
        margin-bottom: 24px;
        border: 1px solid var(--border-color);
    }

    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
    }

    .section-header h2 {
        font-size: 1.25rem;
        margin-bottom: 4px;
    }

    .week-indicator {
        display: flex;
        gap: 8px;
        margin-bottom: 24px;
        overflow-x: auto;
        padding-bottom: 8px;
    }

    .day-pill {
        flex-shrink: 0;
        padding: 8px 16px;
        background: var(--bg-secondary);
        border-radius: var(--radius-full);
        font-size: 0.875rem;
        font-weight: 500;
        transition: all 0.2s ease;
        border: 2px solid transparent;
    }

    .day-pill.active {
        background: var(--accent-green);
        color: var(--bg-primary);
        border-color: var(--accent-green);
    }

    .day-pill.completed {
        background: var(--bg-primary);
        border-color: var(--accent-green);
        color: var(--accent-green);
    }

    .progress-card {
        background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
        border-radius: var(--radius-lg);
        padding: 24px;
        border: 1px solid var(--border-color);
    }

    .progress-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
    }

    .progress-info h3 {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin-bottom: 4px;
    }

    .progress-info h2 {
        font-size: 1.5rem;
        margin-bottom: 8px;
    }

    .progress-meta {
        display: flex;
        gap: 8px;
        font-size: 0.875rem;
        color: var(--text-secondary);
    }

    .progress-visual {
        position: relative;
        width: 80px;
        height: 80px;
    }

    .progress-ring {
        width: 100%;
        height: 100%;
        transform: rotate(-90deg);
    }

    .progress-ring-bg {
        fill: none;
        stroke: var(--bg-secondary);
        stroke-width: 8;
    }

    .progress-ring-progress {
        fill: none;
        stroke: var(--accent-green);
        stroke-width: 8;
        stroke-linecap: round;
        transition: stroke-dashoffset 0.5s ease;
    }

    .progress-percentage {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 1.25rem;
        font-weight: 600;
    }

    /* Custom Week Section */
    .custom-week-section {
        background: var(--bg-card);
        border-radius: var(--radius-lg);
        padding: 24px;
        margin-bottom: 24px;
        border: 1px solid var(--border-color);
    }

    .custom-week-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: grid;
        gap: 12px;
    }

    .custom-week-item {
        padding: 12px 16px;
        background: var(--bg-secondary);
        border-radius: var(--radius-md);
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.875rem;
    }

    .custom-week-item strong {
        color: var(--accent-green);
        min-width: 80px;
    }

    .metrics-section {
        margin-top: 32px;
    }

    .metrics-section h2 {
        font-size: 1.125rem;
        margin-bottom: 16px;
    }

    .metrics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 16px;
        margin-bottom: 24px;
    }

    .metric-card {
        background: var(--bg-card);
        border-radius: var(--radius-md);
        padding: 20px;
        text-align: center;
        border: 1px solid var(--border-color);
    }

    .metric-value {
        font-size: 2rem;
        font-weight: 700;
        color: var(--accent-green);
        margin-bottom: 4px;
    }

    .metric-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
    }

    .metrics-detail {
        margin-top: 24px;
    }

    .metric-comparison {
        background: var(--bg-card);
        border-radius: var(--radius-md);
        padding: 16px;
        margin-bottom: 12px;
        border: 1px solid var(--border-color);
    }

    .metric-comparison h4 {
        font-size: 0.875rem;
        margin-bottom: 12px;
    }

    .comparison-bars {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .user-bar {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .user-bar span {
        min-width: 80px;
        font-size: 0.875rem;
    }

    .bar-container {
        flex: 1;
        height: 20px;
        background: var(--bg-secondary);
        border-radius: var(--radius-full);
        overflow: hidden;
    }

    .bar {
        height: 100%;
        background: var(--accent-green);
        transition: width 0.5s ease;
    }

    /* Modal Styles */
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        backdrop-filter: blur(4px);
    }

    .modal-content {
        background: var(--bg-primary);
        border-radius: var(--radius-lg);
        width: 90%;
        max-width: 800px;
        max-height: 90vh;
        overflow-y: auto;
        position: relative;
        z-index: 1000000;
        border: 1px solid var(--border-color);
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 24px;
        border-bottom: 1px solid var(--border-color);
    }

    .modal-header h2 {
        font-size: 1.5rem;
        margin: 0;
    }

    .btn-close {
        background: none;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 8px;
        border-radius: var(--radius-sm);
        transition: all 0.2s ease;
    }

    .btn-close:hover {
        background: var(--bg-secondary);
        color: var(--text-primary);
    }

    .btn-close svg {
        width: 20px;
        height: 20px;
    }

    .modal-body {
        padding: 24px;
    }

    .modal-description {
        color: var(--text-secondary);
        margin-bottom: 24px;
        line-height: 1.5;
    }

    .dias-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
        margin-bottom: 24px;
    }

    .dia-card {
        background: var(--bg-secondary);
        border-radius: var(--radius-md);
        padding: 16px;
        transition: all 0.2s ease;
        border: 2px solid transparent;
    }

    .dia-card.error {
        border-color: #ef4444;
        background: rgba(239, 68, 68, 0.1);
    }

    .dia-label {
        display: block;
        font-weight: 600;
        margin-bottom: 8px;
        color: var(--text-primary);
    }

    .dia-select {
        width: 100%;
        padding: 12px;
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        color: var(--text-primary);
        font-size: 0.875rem;
        transition: all 0.2s ease;
    }

    .dia-select:focus {
        outline: none;
        border-color: var(--accent-green);
        box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
    }

    .dia-select.changed {
        animation: selectChanged 0.4s ease;
    }

    @keyframes selectChanged {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }

    .plan-validation {
        margin: 16px 0;
        padding: 12px;
        border-radius: var(--radius-sm);
        font-size: 0.875rem;
        line-height: 1.4;
        opacity: 0;
        transform: translateY(-10px);
        transition: all 0.3s ease;
    }

    .plan-validation.show {
        opacity: 1;
        transform: translateY(0);
    }

    .plan-validation.success {
        background: rgba(16, 185, 129, 0.1);
        border: 1px solid var(--accent-green);
        color: var(--accent-green);
    }

    .plan-validation.error {
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid #ef4444;
        color: #ef4444;
    }

    .modal-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        margin-top: 24px;
        padding-top: 24px;
        border-top: 1px solid var(--border-color);
    }

    .btn-secondary {
        padding: 12px 24px;
        background: var(--bg-secondary);
        color: var(--text-primary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.875rem;
    }

    .btn-secondary:hover {
        background: var(--bg-primary);
        border-color: var(--accent-green);
    }

    .btn-secondary svg {
        width: 16px;
        height: 16px;
    }

    .btn-primary {
        padding: 12px 24px;
        background: var(--accent-green);
        color: white;
        border: none;
        border-radius: var(--radius-sm);
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.875rem;
        font-weight: 500;
    }

    .btn-primary:disabled {
        background: var(--bg-secondary);
        color: var(--text-secondary);
        cursor: not-allowed;
        opacity: 0.5;
    }

    .btn-primary:not(:disabled):hover {
        background: var(--accent-green-dark);
        transform: translateY(-1px);
    }

    .btn-primary svg {
        width: 16px;
        height: 16px;
    }
`;