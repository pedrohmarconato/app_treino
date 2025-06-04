// templates/home.js - Template da tela home COMPLETO
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
                        <img id="user-avatar" class="avatar-img" src="pedro.png" alt="Avatar">
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
            <!-- Semana de Treinos -->
            <div class="training-plan">
                <div class="section-header">
                    <h2>Semana de Treinos</h2>
                    <button class="btn-secondary" onclick="window.editarPlanejamentoSemanal()">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="m18.5 2.5 1 1-10 10-4 1 1-4 10-10z"/>
                        </svg>
                        Editar Plano
                    </button>
                </div>
                
                <!-- Indicadores da Semana -->
                <div class="week-indicators" id="week-indicators">
                    <!-- Preenchido dinamicamente -->
                </div>

                <!-- Card do Treino Atual -->
                <div class="current-workout-card" id="current-workout-card">
                    <div class="workout-header">
                        <div class="workout-info">
                            <span class="workout-type" id="workout-type">Carregando...</span>
                            <h3 id="workout-name">Preparando seu treino</h3>
                            <div class="workout-meta">
                                <span id="workout-exercises">0 exercícios</span>
                                <span>•</span>
                                <span id="workout-duration">~30min</span>
                            </div>
                        </div>
                        <div class="workout-progress">
                            <svg class="progress-circle" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="40" class="progress-bg"/>
                                <circle cx="50" cy="50" r="40" class="progress-fill" id="workout-progress-circle"/>
                            </svg>
                            <div class="progress-text" id="workout-progress-text">0%</div>
                        </div>
                    </div>
                    
                    <button class="btn-primary workout-start-btn" id="start-workout-btn">
                        <span id="btn-text">Iniciar Treino</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                    </button>

                </div>
            </div>

            <!-- Métricas de Performance -->
            <div class="metrics-section">
                <h2>Suas Métricas</h2>
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-icon">🏋️</div>
                        <div class="metric-value" id="completed-workouts">0</div>
                        <div class="metric-label">Treinos Concluídos</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-icon">📅</div>
                        <div class="metric-value" id="current-week">1</div>
                        <div class="metric-label">Semana Atual</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-icon">📈</div>
                        <div class="metric-value" id="progress-percentage">0%</div>
                        <div class="metric-label">Progresso</div>
                    </div>
                </div>

                <!-- Comparação Semanal -->
                <div class="comparison-card">
                    <h4>Comparação Semanal</h4>
                    <div class="comparison-bars">
                        <div class="user-comparison">
                            <span>Você</span>
                            <div class="bar-container">
                                <div class="bar user-bar" id="user-progress-bar"></div>
                            </div>
                            <span id="user-workouts">0</span>
                        </div>
                        <div class="user-comparison">
                            <span>Meta</span>
                            <div class="bar-container">
                                <div class="bar goal-bar"></div>
                            </div>
                            <span>4</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Planejamento Semanal Customizado -->
            
                
                
                    <!-- Preenchido dinamicamente -->
                </div>
            </div>
        </div>
    </div>
`;

// Estilos específicos da tela home - ATUALIZADOS E MELHORADOS
export const homeStyles = `
    /* Home Header */
    .home-header {
        background: linear-gradient(135deg, var(--bg-secondary) 0%, #1e1e1e 100%);
        padding: 20px 24px;
        border-bottom: 1px solid var(--border-color);
        position: sticky;
        top: 0;
        z-index: 10;
        backdrop-filter: blur(10px);
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
        width: 48px;
        height: 48px;
        border-radius: 50%;
        overflow: hidden;
        border: 2px solid var(--accent-green);
        position: relative;
    }

    .user-avatar-small::after {
        content: '';
        position: absolute;
        top: -2px;
        left: -2px;
        right: -2px;
        bottom: -2px;
        background: linear-gradient(45deg, var(--accent-green), var(--accent-green-dark));
        border-radius: 50%;
        z-index: -1;
    }

    .user-greeting h4 {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin-bottom: 2px;
        font-weight: 400;
    }

    .user-greeting p {
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--text-primary);
    }

    /* Home Content */
    .home-content {
        max-width: 1200px;
        margin: 0 auto;
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 32px;
    }

    /* Training Plan Section */
    .training-plan {
        background: var(--bg-card);
        border-radius: var(--radius-lg);
        padding: 24px;
        border: 1px solid var(--border-color);
        box-shadow: var(--shadow-sm);
    }

    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
    }

    .section-header h2 {
        font-size: 1.375rem;
        font-weight: 700;
        color: var(--text-primary);
    }

    /* Week Indicators */
    .week-indicators {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 8px;
        margin-bottom: 24px;
    }

    .day-indicator {
        background: var(--bg-secondary);
        border-radius: var(--radius-md);
        padding: 12px 8px;
        text-align: center;
        transition: var(--transition);
        border: 2px solid transparent;
        position: relative;
        overflow: hidden;
    }

    .day-indicator::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, var(--accent-green) 0%, transparent 50%);
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    .day-indicator.today {
        border-color: var(--accent-green);
        background: var(--accent-green-bg);
    }

    .day-indicator.today::before {
        opacity: 0.1;
    }

    .day-indicator.completed {
        background: var(--accent-green);
        color: var(--bg-primary);
    }

    .day-name {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-secondary);
        margin-bottom: 4px;
        text-transform: uppercase;
        position: relative;
        z-index: 1;
    }

    .day-indicator.today .day-name,
    .day-indicator.completed .day-name {
        color: inherit;
    }

    .day-type {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-primary);
        position: relative;
        z-index: 1;
    }

    .day-indicator.completed .day-type {
        color: var(--bg-primary);
    }

    /* Current Workout Card */
    .current-workout-card {
        background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
        border-radius: var(--radius-lg);
        padding: 24px;
        border: 1px solid var(--border-color);
        position: relative;
        overflow: hidden;
    }

    .current-workout-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: radial-gradient(circle at top right, var(--accent-green-bg) 0%, transparent 60%);
        opacity: 0.5;
    }

    .workout-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 20px;
        position: relative;
        z-index: 1;
    }

    .workout-type {
        display: inline-block;
        background: var(--accent-green);
        color: var(--bg-primary);
        padding: 4px 12px;
        border-radius: var(--radius-full);
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 8px;
    }

    .workout-info h3 {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: 8px;
    }

    .workout-meta {
        display: flex;
        gap: 8px;
        font-size: 0.875rem;
        color: var(--text-secondary);
        align-items: center;
    }

    .workout-progress {
        position: relative;
        width: 80px;
        height: 80px;
        flex-shrink: 0;
    }

    .progress-circle {
        width: 100%;
        height: 100%;
        transform: rotate(-90deg);
    }

    .progress-bg {
        fill: none;
        stroke: var(--bg-secondary);
        stroke-width: 8;
    }

    .progress-fill {
        fill: none;
        stroke: var(--accent-green);
        stroke-width: 8;
        stroke-linecap: round;
        stroke-dasharray: 251.2;
        stroke-dashoffset: 251.2;
        transition: stroke-dashoffset 0.5s ease;
    }

    .progress-text {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 1.125rem;
        font-weight: 700;
        color: var(--accent-green);
    }

    .workout-start-btn {
        width: 100%;
        max-width: 320px;
        min-height: 48px;
        position: relative;
        z-index: 1;
        font-size: 1rem;
        padding: 10px 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        border-radius: var(--radius-full);
        margin: 0 auto;
        box-sizing: border-box;
        transition: var(--transition);
    }

    .workout-start-btn svg {
        width: 22px;
        height: 22px;
    }

    @media (max-width: 480px) {
        .workout-start-btn {
            font-size: 0.95rem;
            min-height: 42px;
            padding: 8px 12px;
            max-width: 95vw;
        }
        .workout-start-btn svg {
            width: 18px;
            height: 18px;
        }
    }

    .workout-start-btn:disabled {
        background: var(--bg-secondary);
        color: var(--text-secondary);
        cursor: not-allowed;
    }

    .workout-start-btn:disabled svg {
        opacity: 0.5;
    }

    /* Metrics Section */
    .metrics-section {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .metrics-section h2 {
        font-size: 1.375rem;
        font-weight: 700;
        color: var(--text-primary);
    }

    .metrics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 16px;
    }

    .metric-card {
        background: var(--bg-card);
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

    /* Comparison Card */
    .comparison-card {
        background: var(--bg-card);
        border-radius: var(--radius-lg);
        padding: 20px;
        border: 1px solid var(--border-color);
    }

    .comparison-card h4 {
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 16px;
    }

    .comparison-bars {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .user-comparison {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .user-comparison span {
        min-width: 60px;
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-secondary);
    }

    .bar-container {
        flex: 1;
        height: 24px;
        background: var(--bg-secondary);
        border-radius: var(--radius-full);
        overflow: hidden;
        position: relative;
    }

    .bar {
        height: 100%;
        border-radius: var(--radius-full);
        transition: width 0.5s ease;
        position: relative;
    }

    .user-bar {
        background: linear-gradient(90deg, var(--accent-green) 0%, var(--accent-green-dark) 100%);
        width: 0%;
    }

    .goal-bar {
        background: linear-gradient(90deg, var(--text-secondary) 0%, #666 100%);
        width: 100%;
    }

    /* Weekly Plan Section */
    .weekly-plan-section {
        background: var(--bg-card);
        border-radius: var(--radius-lg);
        padding: 24px;
        border: 1px solid var(--border-color);
    }

    .weekly-plan-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .plan-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        background: var(--bg-secondary);
        border-radius: var(--radius-md);
        transition: var(--transition);
    }

    .plan-item:hover {
        background: var(--bg-primary);
    }

    .plan-day {
        font-weight: 600;
        color: var(--text-primary);
        min-width: 80px;
    }

    .plan-activity {
        flex: 1;
        color: var(--text-secondary);
        text-align: left;
        margin-left: 16px;
    }

    .plan-status {
        font-size: 0.75rem;
        padding: 4px 8px;
        border-radius: var(--radius-sm);
        font-weight: 500;
    }

    .plan-status.completed {
        background: var(--accent-green);
        color: var(--bg-primary);
    }

    .plan-status.today {
        background: var(--accent-green-bg);
        color: var(--accent-green);
    }

    .plan-status.pending {
        background: var(--bg-primary);
        color: var(--text-secondary);
    }

    /* Responsive Design */
    @media (max-width: 768px) {
        .home-content {
            padding: 16px;
            gap: 24px;
        }

        .week-indicators {
            grid-template-columns: repeat(7, 1fr);
            gap: 4px;
        }

        .day-indicator {
            padding: 8px 4px;
        }

        .day-name {
            font-size: 0.625rem;
        }

        .day-type {
            font-size: 0.75rem;
        }

        .workout-header {
            flex-direction: column;
            gap: 16px;
            align-items: center;
            text-align: center;
        }

        .workout-progress {
            width: 60px;
            height: 60px;
        }

        .metrics-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
        }

        .metric-card {
            padding: 16px 12px;
        }

        .metric-icon {
            font-size: 1.5rem;
        }

        .metric-value {
            font-size: 1.5rem;
        }

        .user-comparison {
            gap: 8px;
        }

        .user-comparison span {
            min-width: 50px;
            font-size: 0.75rem;
        }
    }
`;