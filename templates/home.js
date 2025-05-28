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



                    </button>


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

            <!-- Semana Customizada -->
            <div class="custom-week-section">
                <h2>Semana de Treinos</h2>
                <ul id="custom-week-list"></ul>
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
    </div>
`;

// Estilos específicos da tela home
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
`;