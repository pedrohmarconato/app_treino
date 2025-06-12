// templates/home.js - Template da tela home COMPLETO
// import homeService from '../services/homeService.js'; // Temporariamente comentado para debug

export const homeTemplate = () => `
    <div id="home-screen" class="screen">
        <!-- Header Moderno -->
        <div class="home-header">
            <div class="header-content">
                <div class="user-info">
                    <div class="user-avatar-wrapper">
                        <div class="user-avatar-small">
                            <img id="user-avatar" src="pedro.png" alt="Avatar">
                            <div class="avatar-status-indicator"></div>
                        </div>
                    </div>
                    <div class="user-greeting">
                        <h4>Bom dia,</h4>
                        <p id="user-name">Atleta</p>
                    </div>
                </div>
                <div class="app-logo-secondary">
                    <div class="brand-logos-mini">
    <img src="./icons/logo.png" alt="Logo" class="secondary-logo main-logo" style="height: 90px; width: auto; max-width: 80vw;">
</div>
                </div>
                <div class="header-actions">
                    <button class="notification-btn">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                        </svg>
                        <span class="notification-badge pulse"></span>
                    </button>
                    <button class="btn-icon logout-btn" onclick="logout()">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                            <polyline points="16,17 21,12 16,7"/>
                            <line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>

        <!-- Home Content Principal - ESTRUTURA CORRIGIDA -->
        <div class="home-content">
            <!-- Semana de Treinos -->
            <div class="training-plan">
                <div class="section-header">
                    <h2>Semana de Treinos</h2>
                    <div class="header-actions">
                        <div class="week-selector" id="week-selector">
                            <button class="btn-icon week-nav" id="week-prev" onclick="window.navegarSemana(-1)">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M15 18l-6-6 6-6"/>
                                </svg>
                            </button>
                            <div class="current-week-info" id="current-week-info">
                                <span class="week-number" id="week-number">Semana 1</span>
                                <span class="week-status" id="week-status">Ativa</span>
                            </div>
                            <button class="btn-icon week-nav" id="week-next" onclick="window.navegarSemana(1)">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M9 18l6-6-6-6"/>
                                </svg>
                            </button>
                        </div>
                        <button class="btn-secondary btn-edit" onclick="window.abrirPlanejamentoParaUsuarioAtual()">
                            <svg class="edit-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="m18.5 2.5 1 1-10 10-4 1 1-4 10-10z"/>
                            </svg>
                            <span class="btn-text">Editar</span>
                        </button>
                    </div>
                </div>
                
                <!-- Indicadores da Semana -->
                <div class="week-indicators" id="week-indicators">
                    <!-- Preenchido dinamicamente -->
                </div>

                <!-- Card de Treino do Dia -->
                <div class="workout-card-wrapper">
                    <div class="workout-card">
                        <div class="workout-card-bg"></div>
                        <div class="workout-card-content">
                            <div class="workout-header">
                                <div class="workout-info">
                                    <span class="workout-label">TREINO DE HOJE</span>
                                    <h1 id="workout-name">Preparando seu treino</h1>
                                    <div class="workout-meta">
                                        <div class="meta-item">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                                <line x1="16" y1="2" x2="16" y2="6"/>
                                                <line x1="8" y1="2" x2="8" y2="6"/>
                                                <line x1="3" y1="10" x2="21" y2="10"/>
                                            </svg>
                                            <span id="workout-exercises">Carregando exercícios...</span>
                                        </div>
                                        <div class="meta-item">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <circle cx="12" cy="12" r="10"/>
                                                <polyline points="12 6 12 12 16 14"/>
                                            </svg>
                                            <span id="workout-duration">45-60 min</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="workout-visual">
                                    <div class="progress-circle">
                                        <svg class="progress-ring" width="120" height="120">
                                            <circle class="progress-ring-bg" cx="60" cy="60" r="54" stroke-width="8" fill="none"/>
                                            <circle class="progress-ring-progress" cx="60" cy="60" r="54" stroke-width="8" fill="none"/>
                                        </svg>
                                        <div class="progress-text">
                                            <span class="progress-value" id="progress-percentage">0</span>
                                            <span class="progress-label">%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="workout-action">
                                <button id="start-workout-btn" class="btn-primary btn-glow" onclick="window.iniciarTreino()">
                                    <span class="btn-text">Iniciar Treino</span>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polygon points="5 3 19 12 5 21 5 3"/>
                                    </svg>
                                </button>
                                <!-- Botão Ver Todos e painel expandido -->
                                <button id="expand-exercises" class="btn-secondary" style="margin-top:12px;" onclick="window.toggleExercises()">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M3 12h18m-9-9v18"/>
                                    </svg>
                                    <span>Ver todos</span>
                                </button>
                                <div id="exercises-expanded" style="display:none;"></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Conteúdo Expandido do Treino -->
                <div class="current-workout-card expandable-card" id="current-workout-card">
                    <div class="workout-header-modern">
                        <div class="workout-info-section">
                            <div class="workout-badge-container">
                                <span class="workout-type-badge" id="workout-type">Detalhes do Treino</span>
                            </div>
                            <h3 class="workout-title">Exercícios do Treino</h3>
                            <p class="workout-subtitle">Expandir para ver detalhes</p>
                        </div>
                        
                        <button class="expand-toggle-modern" id="workout-toggle" onclick="toggleWorkoutCard()">
                            <svg class="expand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M6 9l6 6 6-6"/>
                            </svg>
                        </button>
                    </div>

                    <!-- Conteúdo Expandido do Treino -->
                    <div class="expandable-content" id="expandable-content" style="display: none;">
                        <div class="workout-details">
                            <div class="workout-exercises-list" id="workout-exercises-list">
                                <div class="loading-exercises">
                                    <div class="loading-spinner"></div>
                                    <p>Carregando exercícios...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div> <!-- Fechamento current-workout-card -->
            </div> <!-- Fechamento training-plan -->

            <!-- Semana de Treino -->
            <div class="week-overview">
                <div class="section-header">
                    <h2>Semana de Treino</h2>
                    <span class="week-label" id="current-week">Semana 1</span>
                </div>
                <div class="week-indicators" id="week-indicators">
                    <!-- Preenchido dinamicamente pelo dashboard.js -->
                </div>
            </div>

            <!-- Métricas Rápidas -->
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                        </svg>
                    </div>
                    <div class="metric-content">
                        <h3>Treinos Completos</h3>
                        <div class="metric-value">
                            <span id="completed-workouts">0</span>
                            <span class="metric-trend positive">+0 esta semana</span>
                        </div>
                    </div>
                    <div class="metric-progress">
                        <div class="mini-progress-circle">
                            <svg width="40" height="40">
                                <circle cx="20" cy="20" r="16" stroke-width="4" fill="none" class="mini-progress-bg"/>
                                <circle cx="20" cy="20" r="16" stroke-width="4" fill="none" class="mini-progress-fill" style="--progress: 0;"/>
                            </svg>
                        </div>
                    </div>
                </div>

                <div class="metric-card">
                    <div class="metric-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                        </svg>
                    </div>
                    <div class="metric-content">
                        <h3>Consistência</h3>
                        <div class="metric-value">
                            <span>0%</span>
                            <span class="metric-trend positive">Começando!</span>
                        </div>
                    </div>
                    <div class="metric-progress">
                        <div class="mini-progress-circle">
                            <svg width="40" height="40">
                                <circle cx="20" cy="20" r="16" stroke-width="4" fill="none" class="mini-progress-bg"/>
                                <circle cx="20" cy="20" r="16" stroke-width="4" fill="none" class="mini-progress-fill" style="--progress: 0;"/>
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="quick-actions">
                <button class="action-chip active">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <line x1="12" y1="8" x2="12" y2="16"/>
                        <line x1="8" y1="12" x2="16" y2="12"/>
                    </svg>
                    <span>Novo Treino</span>
                </button>
                <button class="action-chip">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    <span>Progresso</span>
                </button>
                <button class="action-chip">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                        <polyline points="10 9 9 9 8 9"/>
                    </svg>
                    <span>Histórico</span>
                </button>
            </div>
        </div> <!-- Fechamento home-content -->
    </div>
`;

// Estilos específicos da tela home - DESIGN SÓBRIO COM NEON SELETIVO
export const homeStyles = `
    /* Variáveis de Design Moderno */
    :root {
        --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        --secondary-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        --success-gradient: linear-gradient(135deg, #13f1fc 0%, #0470dc 100%);
        --dark-gradient: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        
        --neon-primary: #CFFF04;
        --neon-secondary: #f093fb;
        --neon-success: #00ff88;
        --neon-danger: #ff0080;
        
        --bg-primary: #101010;
        --bg-secondary: #181818;
        --bg-card: #232323;
        --bg-elevated: #2a2a2a;
        --border-color: #333333;
        --border-light: #444444;
        --text-primary: #ffffff;
        --text-secondary: #a8a8a8;
        --text-muted: #666666;
        
        --shadow-neon: 0 0 20px rgba(207, 255, 4, 0.5);
        --shadow-card: 0 10px 40px rgba(0, 0, 0, 0.3);
        --shadow-hover: 0 15px 50px rgba(0, 0, 0, 0.4);
        --shadow-glow: 0 0 20px rgba(207, 255, 4, 0.3);
        --shadow-glow-strong: 0 0 30px rgba(207, 255, 4, 0.6);
        
        --accent-green: #CFFF04;
        --accent-green-soft: #B3FF00;
        --accent-green-bg: rgba(207, 255, 4, 0.1);
        --accent-green-border: rgba(207, 255, 4, 0.3);
        --accent-green-glow: rgba(207, 255, 4, 0.4);
        
        --radius-sm: 8px;
        --radius-md: 12px;
        --radius-lg: 16px;
        --radius-full: 9999px;
        --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        --animation-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
    }
    
    /* Header Moderno */
    .home-header {
        background: var(--dark-gradient);
        padding: 24px;
        position: relative;
        overflow: hidden;
    }

    .home-header::before {
        content: '';
        position: absolute;
        top: -50%;
        right: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(circle, rgba(207, 255, 4, 0.1) 0%, transparent 70%);
        animation: pulse-bg 4s ease-in-out infinite;
    }

    @keyframes pulse-bg {
        0%, 100% { transform: scale(1); opacity: 0.5; }
        50% { transform: scale(1.1); opacity: 0.8; }
    }

    .header-content {
        position: relative;
        z-index: 1;
        display: flex;
        align-items: center;
        justify-content: space-between;
        max-width: 1200px;
        margin: 0 auto;
    }

    .user-info {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .user-avatar-wrapper {
        position: relative;
    }

    .user-avatar-small {
        width: 48px;
        height: 48px;
        border-radius: 16px;
        overflow: hidden;
        border: 2px solid var(--neon-primary);
        box-shadow: var(--shadow-neon);
        position: relative;
    }

    .avatar-status-indicator {
        position: absolute;
        bottom: -2px;
        right: -2px;
        width: 16px;
        height: 16px;
        background: var(--neon-success);
        border-radius: 50%;
        border: 3px solid var(--bg-primary);
        animation: pulse-status 2s ease-in-out infinite;
    }

    @keyframes pulse-status {
        0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0, 255, 136, 0.4); }
        50% { transform: scale(1.1); box-shadow: 0 0 0 8px rgba(0, 255, 136, 0); }
    }

    .header-actions {
        display: flex;
        align-items: center;
        gap: 12px;
    }


    @keyframes pulse-glow {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
    }


    .user-greeting h4 {
        font-size: 0.875rem;
        color: rgba(255, 255, 255, 0.7);
        margin-bottom: 4px;
        letter-spacing: 0.5px;
    }

    .user-greeting p {
        font-size: 1.125rem;
        font-weight: 700;
        background: linear-gradient(135deg, #fff 0%, var(--neon-primary) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .notification-btn {
        position: relative;
        width: 48px;
        height: 48px;
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .notification-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: translateY(-2px);
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
    }

    .notification-badge {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 10px;
        height: 10px;
        background: var(--neon-danger);
        border-radius: 50%;
        border: 2px solid var(--bg-primary);
    }

    .notification-badge.pulse {
        animation: pulse-notification 2s ease-in-out infinite;
    }

    @keyframes pulse-notification {
        0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 0, 128, 0.4); }
        50% { transform: scale(1.2); box-shadow: 0 0 0 10px rgba(255, 0, 128, 0); }
    }

    /* Home Content - ESPAÇAMENTO OTIMIZADO */
    .home-content {
        max-width: 1200px;
        margin: 0 auto;
        padding: 16px 24px 24px 24px; /* Reduzido padding-top de 24px para 16px */
        display: flex;
        flex-direction: column;
        gap: 20px; /* Reduzido gap de 32px para 20px */
    }

    /* Training Plan Section - ESPAÇAMENTO OTIMIZADO */
    .training-plan {
        background: var(--bg-card);
        border-radius: var(--radius-lg);
        padding: 16px 24px 24px 24px; /* Reduzido padding-top de 24px para 16px */
        border: 1px solid var(--border-color);
        box-shadow: var(--shadow-sm);
    }

    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px; /* Reduzido de 24px para 16px */
        flex-wrap: wrap;
        gap: 12px;
    }

    .section-header h2 {
        font-size: 1.375rem;
        font-weight: 700;
        color: var(--text-primary);
    }

    .header-actions {
        display: flex;
        align-items: center;
        gap: 16px;
    }

    /* Week Selector */
    .week-selector {
        display: flex;
        align-items: center;
        gap: 12px;
        background: var(--bg-card);
        border-radius: var(--radius-md);
        padding: 8px 16px;
        border: 1px solid var(--border-color);
    }

    .week-nav {
        width: 32px !important;
        height: 32px !important;
        padding: 6px !important;
        background: transparent !important;
        border: 1px solid var(--border-color) !important;
        border-radius: var(--radius-md) !important;
        transition: var(--transition) !important;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .week-nav:hover {
        background: var(--bg-elevated) !important;
        border-color: var(--border-light) !important;
    }

    .week-nav:hover svg {
        stroke: var(--accent-green) !important;
    }

    .week-nav svg {
        width: 16px !important;
        height: 16px !important;
        stroke: var(--text-secondary);
        transition: var(--transition);
    }

    .week-nav:disabled {
        opacity: 0.4;
        cursor: not-allowed;
        background: transparent !important;
    }

    .week-nav:disabled:hover {
        background: transparent !important;
        border-color: var(--border-color) !important;
    }

    .current-week-info {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        min-width: 80px;
    }

    .week-number {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-primary);
    }

    .week-status {
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--text-secondary);
        padding: 2px 8px;
        border-radius: var(--radius-sm);
        background: var(--accent-green-bg);
        color: var(--accent-green);
    }

    .week-status.programada {
        background: rgba(0, 255, 0, 0.1);
        color: #00ff00;
    }

    .week-status.inativa {
        background: var(--bg-primary);
        color: var(--text-secondary);
    }

    .week-status.atual {
        background: var(--accent-green);
        color: var(--bg-primary);
    }

    /* Botões reestilizados */
    .btn-edit {
        padding: 8px 12px !important;
        font-size: 0.875rem !important;
        min-height: 36px !important;
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .edit-icon {
        width: 16px !important;
        height: 16px !important;
    }

    .btn-text {
        font-weight: 500;
    }

    .btn-back {
        width: 36px !important;
        height: 36px !important;
        padding: 8px !important;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--bg-secondary) !important;
        border: 1px solid var(--border-color) !important;
        border-radius: var(--radius-md) !important;
        transition: var(--transition) !important;
    }

    .btn-back:hover {
        background: var(--accent-green) !important;
        border-color: var(--accent-green) !important;
    }

    .btn-back:hover .back-icon {
        stroke: var(--bg-primary) !important;
    }

    .back-icon {
        width: 18px !important;
        height: 18px !important;
        stroke: var(--text-secondary);
        transition: var(--transition);
    }

    /* Workout Card Moderno */
    .workout-card-wrapper {
        padding: 24px;
        margin-top: -40px;
        margin-bottom: 60px;
        position: relative;
        z-index: 2;
    }

    .workout-card {
        background: var(--bg-card);
        border-radius: 24px;
        overflow: hidden;
        position: relative;
        box-shadow: var(--shadow-card);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .workout-card:hover {
        transform: translateY(-5px);
        box-shadow: var(--shadow-hover);
    }

    .workout-card-bg {
        position: absolute;
        inset: 0;
        background: var(--primary-gradient);
        opacity: 0.1;
    }

    .workout-card-bg::before {
        content: '';
        position: absolute;
        top: -50%;
        right: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(circle, var(--neon-primary) 0%, transparent 70%);
        opacity: 0.3;
        animation: rotate-bg 20s linear infinite;
    }

    @keyframes rotate-bg {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }

    .workout-card-content {
        position: relative;
        padding: 32px;
        z-index: 1;
    }

    .workout-label {
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        color: var(--neon-primary);
        display: inline-block;
        padding: 4px 12px;
        background: rgba(207, 255, 4, 0.1);
        border-radius: 20px;
        margin-bottom: 12px;
    }

    .workout-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
    }

    .workout-info h1 {
        font-size: 1.75rem;
        font-weight: 800;
        margin-bottom: 16px;
        background: linear-gradient(135deg, #fff 0%, rgba(255, 255, 255, 0.8) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .workout-meta {
        display: flex;
        gap: 24px;
        margin-bottom: 24px;
    }

    .meta-item {
        display: flex;
        align-items: center;
        gap: 8px;
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.875rem;
    }

    .meta-item svg {
        color: var(--neon-primary);
    }

    /* Progress Circle Moderno */
    .progress-circle {
        position: relative;
        width: 120px;
        height: 120px;
    }

    .progress-ring {
        transform: rotate(-90deg);
    }

    .progress-ring-bg {
        stroke: rgba(255, 255, 255, 0.1);
    }

    .progress-ring-progress {
        stroke: var(--neon-primary);
        stroke-dasharray: 339.292;
        stroke-dashoffset: 339.292;
        transition: stroke-dashoffset 1s ease;
        filter: drop-shadow(0 0 10px var(--neon-primary));
    }

    .progress-text {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
    }

    .progress-value {
        font-size: 2rem;
        font-weight: 800;
        color: var(--neon-primary);
        text-shadow: 0 0 20px rgba(207, 255, 4, 0.5);
    }

    .progress-label {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.5);
        margin-top: -4px;
    }

    /* Botão Primário Neon */
    .btn-primary {
        background: linear-gradient(135deg, var(--neon-primary) 0%, #0470dc 100%);
        color: var(--bg-primary);
        border: none;
        padding: 16px 32px;
        border-radius: 16px;
        font-weight: 700;
        font-size: 1rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 12px;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
    }

    .btn-primary::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: translate(-50%, -50%);
        transition: width 0.6s, height 0.6s;
    }

    .btn-primary:hover::before {
        width: 300px;
        height: 300px;
    }

    .btn-primary.btn-glow {
        box-shadow: 0 4px 20px rgba(207, 255, 4, 0.4);
    }

    .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 30px rgba(207, 255, 4, 0.6);
    }

    .btn-text {
        position: relative;
        z-index: 1;
    }

    .btn-primary svg {
        position: relative;
        z-index: 1;
    }

    /* Week Overview Moderno */
    .week-overview {
        padding: 0 24px 24px;
        margin-top: 60px;
    }

    .week-indicators {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 12px;
    }

    .day-indicator {
        text-align: center;
        padding: 16px 8px;
        background: var(--bg-secondary);
        border-radius: 16px;
        transition: all 0.3s ease;
        cursor: pointer;
        position: relative;
        overflow: hidden;
    }

    .day-indicator::before {
        content: '';
        position: absolute;
        inset: 0;
        background: var(--primary-gradient);
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    .day-indicator:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
    }

    .day-indicator.today {
        border: 2px solid var(--neon-primary);
        box-shadow: inset 0 0 20px rgba(207, 255, 4, 0.2);
    }

    .day-indicator.completed .day-status {
        background: var(--neon-success);
        box-shadow: 0 0 10px var(--neon-success);
    }

    .day-label {
        font-size: 0.75rem;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.5);
        position: relative;
        z-index: 1;
    }

    .day-status {
        width: 8px;
        height: 8px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        margin: 8px auto 0;
        position: relative;
        z-index: 1;
        transition: all 0.3s ease;
    }


    .day-name {
        font-size: 0.7rem;
        font-weight: 500;
        color: var(--text-muted);
        margin-bottom: 6px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .day-indicator.today .day-name {
        color: var(--text-secondary);
        font-weight: 600;
    }

    /* Texto para treino concluído */
    .day-indicator.completed .day-name,
    .day-indicator.workout-completed .day-name {
        color: var(--text-secondary);
    }

    /* Texto para folga */
    .day-indicator.folga .day-name {
        color: var(--text-secondary);
    }

    .day-type {
        font-size: 0.7rem;
        font-weight: 500;
        color: var(--text-secondary);
        text-align: center;
        margin-top: 2px;
        line-height: 1.3;
    }

    .day-indicator.today .day-type {
        color: var(--text-primary);
        font-weight: 600;
    }

    /* Texto para treino concluído */
    .day-indicator.completed .day-type,
    .day-indicator.workout-completed .day-type {
        color: var(--text-primary);
        font-weight: 500;
    }

    /* Texto para folga */
    .day-indicator.folga .day-type {
        color: var(--text-primary);
        font-weight: 500;
    }

    /* Texto para cancelado */
    .day-indicator.cancelled .day-type {
        color: var(--text-muted);
        font-weight: 400;
    }


    .empty-day {
        border: 2px dashed var(--border-color);
        background: transparent;
    }

    .empty-day .day-type {
        color: var(--text-secondary);
        font-style: italic;
    }

    /* ===== WORKOUT CARD - Estilo Login ===== */
    .current-workout-card {
        background: var(--bg-card);
        border-radius: var(--radius-lg);
        border: 1px solid var(--border-color);
        position: relative;
        overflow: hidden;
        transition: var(--transition);
        box-shadow: var(--shadow-md);
        margin-bottom: 24px;
    }

    .current-workout-card:hover {
        border-color: var(--border-light);
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg);
    }

    .workout-header-modern {
        display: flex;
        align-items: center;
        padding: 28px;
        gap: 24px;
        position: relative;
        z-index: 1;
        border-bottom: 1px solid var(--border-color);
    }

    .workout-info-section {
        flex: 1;
    }

    .workout-badge-container {
        margin-bottom: 12px;
    }

    .workout-type-badge {
        display: inline-block;
        background: var(--bg-secondary);
        color: var(--text-secondary);
        padding: 6px 12px;
        border-radius: var(--radius-md);
        font-size: 0.75rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border: 1px solid var(--border-color);
    }


    .workout-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--text-primary);
        margin: 8px 0;
        text-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
    }

    .workout-subtitle {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin: 0;
    }

    .workout-progress-section {
        position: relative;
    }

    .progress-circle-container {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .progress-circle {
        filter: drop-shadow(0 0 10px var(--accent-green-glow));
        transition: var(--transition);
    }

    .progress-text {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
    }

    .progress-text span {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--accent-green);
        text-shadow: 0 0 10px var(--accent-green-glow);
    }

    .expand-toggle-modern {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: var(--bg-secondary);
        border: 2px solid var(--border-color);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: var(--transition);
        position: relative;
        overflow: hidden;
    }

    .expand-toggle-modern::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: radial-gradient(circle at center, var(--accent-green-glow) 0%, transparent 70%);
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    .expand-toggle-modern:hover {
        border-color: var(--accent-green);
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
    }

    .expand-toggle-modern:hover::before {
        opacity: 1;
    }

    .expand-toggle-modern .expand-icon {
        width: 20px;
        height: 20px;
        stroke: var(--text-primary);
        transition: var(--transition);
    }

    .expand-toggle-modern.expanded .expand-icon {
        transform: rotate(180deg);
        stroke: var(--accent-green);
    }

    .workout-action-section {
        padding: 24px 28px 28px;
        position: relative;
        z-index: 1;
    }


    .expandable-card {
        cursor: pointer;
    }

    /* ===== FLOATING BOTTOM NAVIGATION ===== */
    .floating-bottom-nav {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 1000;
        padding: 20px;
        background: linear-gradient(to top, 
            rgba(16, 16, 16, 0.95) 0%, 
            rgba(16, 16, 16, 0.8) 70%, 
            transparent 100%);
        backdrop-filter: blur(20px);
        transition: var(--transition);
        pointer-events: none;
    }

    .bottom-nav-container {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        justify-content: center;
        align-items: center;
        pointer-events: auto;
    }

    .floating-action-btn {
        background: var(--accent-green);
        border: none;
        border-radius: var(--radius-md);
        padding: 16px 32px;
        display: flex;
        align-items: center;
        gap: 12px;
        cursor: pointer;
        transition: var(--transition);
        box-shadow: var(--shadow-md);
        position: relative;
        overflow: hidden;
        min-height: 56px;
        font-weight: 600;
        color: var(--bg-primary);
    }


    .floating-action-btn:hover {
        background: var(--accent-green-soft);
        transform: translateY(-2px);
        box-shadow: var(--shadow-glow);
    }

    .floating-action-btn:active {
        transform: translateY(-2px) scale(1.02);
    }

    .fab-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        transition: var(--transition);
    }

    .fab-icon svg {
        width: 20px;
        height: 20px;
        stroke: var(--bg-primary);
        fill: var(--bg-primary);
        transition: var(--transition);
    }

    .fab-text {
        font-size: 1rem;
        color: var(--bg-primary);
        font-weight: 600;
        z-index: 1;
    }


    /* Disabled state */
    .floating-action-btn:disabled {
        background: var(--bg-card);
        color: var(--text-muted);
        cursor: not-allowed;
        transform: none;
        box-shadow: var(--shadow-sm);
        animation: none;
    }

    .floating-action-btn:disabled .fab-icon {
        background: rgba(255, 255, 255, 0.1);
    }

    .floating-action-btn:disabled .fab-icon svg {
        stroke: var(--text-muted);
        fill: var(--text-muted);
    }

    .floating-action-btn:disabled .fab-text {
        color: var(--text-muted);
    }

    /* Hide on scroll (optional) */
    .floating-bottom-nav.hidden {
        transform: translateY(100%);
        opacity: 0;
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
        .floating-bottom-nav {
            padding: 16px 20px 24px;
        }
        
        .floating-action-btn {
            padding: 14px 28px;
            min-height: 52px;
            font-size: 0.9rem;
        }
        
        .fab-icon {
            width: 28px;
            height: 28px;
        }
        
        .fab-icon svg {
            width: 18px;
            height: 18px;
        }
    }

    @media (max-width: 480px) {
        .floating-bottom-nav {
            padding: 14px 16px 20px;
        }
        
        .floating-action-btn {
            padding: 12px 24px;
            min-height: 48px;
            font-size: 0.85rem;
            gap: 10px;
        }
        
        .fab-icon {
            width: 26px;
            height: 26px;
        }
        
        .fab-icon svg {
            width: 16px;
            height: 16px;
        }
    }

    .expandable-card.expanded {
        border-color: #00ff00;
        box-shadow: 0 0 30px rgba(0, 255, 0, 0.2);
    }

    .current-workout-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: radial-gradient(circle at top right, rgba(0, 255, 0, 0.1) 0%, transparent 60%);
        opacity: 0.3;
        transition: opacity 0.3s ease;
    }

    .expandable-card.expanded::before {
        opacity: 0.6;
    }

    /* Header Compacto */
    .workout-header-compact {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 24px 16px;
        position: relative;
        z-index: 1;
    }

    .workout-info-compact {
        flex: 1;
    }

    .expand-toggle {
        background: none;
        border: 2px solid #333;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s ease;
        margin-left: 16px;
    }

    .expand-toggle:hover {
        border-color: #00ff00;
        background: rgba(0, 255, 0, 0.1);
    }

    .expand-toggle .expand-icon {
        width: 20px;
        height: 20px;
        stroke: #fff;
        transition: all 0.3s ease;
    }

    .expand-toggle.expanded .expand-icon {
        transform: rotate(180deg);
        stroke: #00ff00;
    }

    .workout-type {
        display: inline-block;
        background: linear-gradient(45deg, #00ff00, #00cc00);
        color: #000;
        padding: 6px 16px;
        border-radius: var(--radius-full);
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        margin-bottom: 12px;
        box-shadow: 0 0 15px rgba(0, 255, 0, 0.3);
        text-shadow: none;
    }

    .workout-info-compact h3 {
        font-size: 1.25rem;
        font-weight: 700;
        color: #fff;
        margin: 0;
        text-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
    }

    .workout-meta {
        display: flex;
        gap: 8px;
        font-size: 0.875rem;
        color: var(--text-secondary);
        align-items: center;
    }


    /* Botão Iniciar Treino no Topo */
    .top-action-area {
        padding: 20px 24px 16px;
        display: flex;
        justify-content: center;
        position: relative;
        z-index: 2;
        border-bottom: 1px solid #333;
        background: rgba(0, 0, 0, 0.2);
    }

    .workout-start-btn-top {
        width: 100%;
        max-width: 280px;
        min-height: 48px;
        font-size: 1rem;
        padding: 12px 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        border-radius: var(--radius-full);
        box-sizing: border-box;
        transition: all 0.3s ease;
        background: linear-gradient(45deg, #00ff00, #00cc00);
        color: #000;
        border: none;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
        cursor: pointer;
    }

    .workout-start-btn-top:hover {
        transform: translateY(-2px);
        box-shadow: 0 0 30px rgba(0, 255, 0, 0.5);
        background: linear-gradient(45deg, #00ff00, #00ff00);
    }

    .workout-start-btn-top:active {
        transform: translateY(0);
    }

    /* Estado oculto do botão do topo */
    .top-action-area.hidden {
        display: none;
    }

    .workout-start-btn-top svg {
        width: 20px;
        height: 20px;
        stroke: #000;
    }

    @media (max-width: 480px) {
        .workout-start-btn-top {
            font-size: 0.9rem;
            min-height: 44px;
            padding: 10px 20px;
            max-width: 95vw;
        }
        .workout-start-btn-top svg {
            width: 18px;
            height: 18px;
        }
    }

    .workout-start-btn-top:disabled {
        background: #333;
        color: #666;
        cursor: not-allowed;
        box-shadow: none;
    }

    .workout-start-btn-top:disabled svg {
        opacity: 0.5;
        stroke: #666;
    }


    /* Conteúdo Expansível */
    .expandable-content {
        border-top: 1px solid #333;
        background: rgba(0, 0, 0, 0.2);
        animation: slideDown 0.4s ease;
    }

    @keyframes slideDown {
        from {
            opacity: 0;
            max-height: 0;
        }
        to {
            opacity: 1;
            max-height: 1000px;
        }
    }

    .workout-details {
        padding: 24px;
    }

    /* Exercícios Expandidos */
    .workout-exercises-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .loading-exercises {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 32px;
        color: var(--text-secondary);
    }

    .loading-spinner {
        width: 24px;
        height: 24px;
        border: 2px solid var(--border-color);
        border-top: 2px solid var(--accent-green);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 12px;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    .exercise-item {
        background: var(--bg-secondary);
        border-radius: var(--radius-md);
        padding: 16px;
        border: 1px solid var(--border-color);
        transition: all 0.3s ease;
    }

    .exercise-item:hover {
        background: rgba(207, 255, 4, 0.05);
        border-color: rgba(207, 255, 4, 0.2);
        transform: translateY(-2px);
        box-shadow: var(--shadow-glow);
    }

    .exercise-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;
    }

    .exercise-info h4 {
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0 0 4px 0;
    }

    .exercise-info p {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin: 0;
    }

    .exercise-badge {
        background: var(--accent-green);
        color: var(--bg-primary);
        padding: 4px 12px;
        border-radius: var(--radius-full);
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
    }

    .exercise-sets {
        display: grid;
        grid-template-columns: auto 1fr 1fr 1fr;
        gap: 8px;
        align-items: center;
        margin-bottom: 8px;
        font-size: 0.875rem;
    }

    .exercise-sets.header {
        color: var(--text-secondary);
        font-weight: 600;
        border-bottom: 1px solid var(--border-color);
        padding-bottom: 8px;
        margin-bottom: 12px;
    }

    .exercise-sets:not(.header):hover {
        background: rgba(207, 255, 4, 0.1);
        border-radius: var(--radius-sm);
        margin: 0 -8px;
        padding: 0 8px;
    }

    .set-number {
        text-align: center;
        font-weight: 600;
        color: var(--accent-green);
        min-width: 32px;
    }

    .set-weight,
    .set-reps,
    .set-rest {
        text-align: center;
        color: var(--text-primary);
    }

    .exercise-notes {
        background: rgba(207, 255, 4, 0.1);
        border: 1px solid rgba(207, 255, 4, 0.2);
        border-radius: var(--radius-sm);
        padding: 12px;
        margin-top: 12px;
        font-size: 0.875rem;
        color: var(--text-secondary);
        font-style: italic;
    }

    .no-exercises {
        text-align: center;
        padding: 32px;
        color: var(--text-secondary);
    }

    /* Secondary Logo Styles */
    .app-logo-secondary {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .secondary-logo {
        width: 28px;
        height: 28px;
        opacity: 0.8;
        filter: drop-shadow(0 0 6px rgba(207, 255, 4, 0.3));
        transition: all 0.3s ease;
    }

    .secondary-logo:hover {
        opacity: 1;
        filter: drop-shadow(0 0 12px rgba(207, 255, 4, 0.6));
        transform: scale(1.1);
    }

    @media (max-width: 768px) {
        .app-logo-secondary {
            order: -1;
            margin-right: auto;
        }
        
        .secondary-logo {
            width: 24px;
            height: 24px;
        }
    }

    .no-exercises svg {
        width: 48px;
        height: 48px;
        margin-bottom: 16px;
        opacity: 0.5;
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

    /* Exercises Preview Integrated */
    .exercises-preview-integrated {
        margin: 16px 0;
        position: relative;
        z-index: 1;
        background: var(--bg-secondary);
        border-radius: var(--radius-md);
        border: 1px solid var(--border-color);
        overflow: hidden;
    }

    .exercises-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        border-bottom: 1px solid var(--border-color);
        background: var(--bg-primary);
    }

    .exercises-header h4 {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
    }

    .btn-expand {
        display: flex;
        align-items: center;
        gap: 6px;
        background: none;
        border: none;
        color: var(--accent-green);
        cursor: pointer;
        padding: 4px 8px;
        border-radius: var(--radius-sm);
        transition: var(--transition);
        font-size: 0.75rem;
        font-weight: 500;
    }

    .btn-expand:hover {
        background: var(--accent-green-bg);
    }

    .expand-icon {
        width: 16px;
        height: 16px;
        transition: transform 0.3s ease;
    }

    .btn-expand.expanded .expand-icon {
        transform: rotate(180deg);
    }

    .exercises-list {
        padding: 12px 16px;
    }

    .exercises-expanded {
        padding: 16px;
        background: var(--bg-primary);
        border-top: 1px solid var(--border-color);
        animation: slideDown 0.3s ease;
    }

    @keyframes slideDown {
        from {
            opacity: 0;
            max-height: 0;
        }
        to {
            opacity: 1;
            max-height: 500px;
        }
    }

    .exercises-preview {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .exercise-preview-card {
        background: var(--bg-secondary);
        border-radius: var(--radius-md);
        padding: 16px;
        border: 1px solid var(--border-color);
        transition: var(--transition);
    }

    .exercise-preview-card:hover {
        background: var(--bg-primary);
        border-color: var(--accent-green);
    }

    .exercise-preview-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
    }

    .exercise-name {
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary);
    }

    .exercise-group {
        font-size: 0.875rem;
        color: var(--text-secondary);
    }

    .exercise-rm-info {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.875rem;
    }

    .rm-badge {
        background: var(--accent-green);
        color: var(--bg-primary);
        padding: 2px 8px;
        border-radius: var(--radius-sm);
        font-weight: 600;
    }

    .exercise-preview-details {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 12px;
        margin-top: 12px;
    }

    .exercise-detail {
        text-align: center;
    }

    .exercise-detail-label {
        font-size: 0.75rem;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 4px;
    }

    .exercise-detail-value {
        font-size: 1rem;
        font-weight: 600;
        color: var(--accent-green);
    }

    /* Novos estilos para exercícios detalhados */
    .rest-day-card {
        background: linear-gradient(135deg, var(--accent-green-bg) 0%, var(--bg-secondary) 100%);
        border-color: var(--accent-green);
    }

    .rest-day-suggestions {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        margin-top: 16px;
    }

    .suggestion-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px;
        background: var(--bg-primary);
        border-radius: var(--radius-sm);
        font-size: 0.875rem;
        color: var(--text-secondary);
    }

    .suggestion-icon {
        font-size: 1.2rem;
    }

    .cardio-badge {
        background: linear-gradient(45deg, #ff6b6b, #ff8e8e);
        color: white;
        padding: 2px 8px;
        border-radius: var(--radius-sm);
        font-weight: 600;
        font-size: 0.75rem;
    }

    .workout-summary-card {
        background: linear-gradient(135deg, var(--accent-green-bg) 0%, var(--bg-secondary) 100%);
        border-color: var(--accent-green);
        margin-bottom: 20px;
    }

    .workout-summary-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        margin-top: 16px;
    }

    .summary-stat {
        text-align: center;
        padding: 12px;
        background: var(--bg-primary);
        border-radius: var(--radius-md);
    }

    .stat-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--accent-green);
        margin-bottom: 4px;
    }

    .stat-label {
        font-size: 0.75rem;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .exercise-number {
        background: var(--accent-green);
        color: var(--bg-primary);
        padding: 2px 6px;
        border-radius: var(--radius-sm);
        font-size: 0.75rem;
        font-weight: 600;
        margin-right: 8px;
    }

    .first-exercise {
        border-color: var(--accent-green);
        box-shadow: 0 0 0 1px var(--accent-green-bg);
    }

    .exercise-weight-range {
        margin: 16px 0;
        padding: 12px;
        background: var(--bg-primary);
        border-radius: var(--radius-md);
    }

    .weight-indicator {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;
    }

    .weight-min, .weight-max {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-secondary);
        min-width: 40px;
    }

    .weight-bar {
        flex: 1;
        height: 8px;
        background: var(--bg-secondary);
        border-radius: var(--radius-full);
        position: relative;
        overflow: hidden;
    }

    .weight-range-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--accent-green) 0%, var(--accent-green-dark) 100%);
        border-radius: var(--radius-full);
        transition: width 0.5s ease;
    }

    .weight-target {
        position: absolute;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 12px;
        height: 12px;
        background: var(--accent-green);
        border-radius: 50%;
        border: 2px solid var(--bg-primary);
        box-shadow: 0 0 0 2px var(--accent-green);
    }

    .weight-target-label {
        text-align: center;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--accent-green);
    }

    .exercise-progress {
        margin: 12px 0;
        padding: 8px 12px;
        background: var(--bg-primary);
        border-radius: var(--radius-md);
        border-left: 3px solid var(--accent-green);
    }

    .progress-item {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .progress-icon {
        font-size: 1.1rem;
    }

    .progress-text {
        font-size: 0.875rem;
        color: var(--text-secondary);
    }

    .exercise-tips {
        display: flex;
        gap: 16px;
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid var(--border-color);
    }

    .tip-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.75rem;
        color: var(--text-secondary);
    }

    .tip-icon {
        font-size: 1rem;
    }

    .error-card {
        background: linear-gradient(135deg, #ff6b6b20 0%, var(--bg-secondary) 100%);
        border-color: #ff6b6b;
    }

    .error-actions {
        margin-top: 12px;
        text-align: center;
    }

    /* Responsividade para exercícios detalhados */
    @media (max-width: 768px) {
        .rest-day-suggestions {
            grid-template-columns: 1fr;
        }

        .workout-summary-stats {
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
        }

        .summary-stat {
            padding: 8px;
        }

        .stat-value {
            font-size: 1.25rem;
        }

        .exercise-tips {
            flex-direction: column;
            gap: 8px;
        }

        .weight-indicator {
            gap: 8px;
        }

        .weight-min, .weight-max {
            min-width: 35px;
            font-size: 0.75rem;
        }
    }


    /* Metrics Grid Moderno */
    .metrics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 20px;
        padding: 0 24px 24px;
    }

    .metric-card {
        background: var(--bg-card);
        border-radius: 20px;
        padding: 24px;
        display: flex;
        align-items: center;
        gap: 16px;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
    }

    .metric-card::before {
        content: '';
        position: absolute;
        top: -2px;
        left: -2px;
        right: -2px;
        bottom: -2px;
        background: var(--primary-gradient);
        border-radius: 20px;
        opacity: 0;
        z-index: -1;
        transition: opacity 0.3s ease;
    }

    .metric-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }

    .metric-card:hover::before {
        opacity: 0.1;
    }

    .metric-icon {
        width: 48px;
        height: 48px;
        background: rgba(207, 255, 4, 0.1);
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .metric-icon svg {
        color: var(--neon-primary);
    }

    .metric-content {
        flex: 1;
    }

    .metric-content h3 {
        font-size: 0.875rem;
        color: rgba(255, 255, 255, 0.7);
        margin-bottom: 8px;
    }

    .metric-value {
        display: flex;
        align-items: baseline;
        gap: 8px;
    }

    .metric-value > span:first-child {
        font-size: 1.5rem;
        font-weight: 800;
    }

    .metric-trend {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.5);
    }

    .metric-trend.positive {
        color: var(--neon-success);
    }

    /* Mini Progress Circles */
    .mini-progress-circle {
        position: relative;
        width: 40px;
        height: 40px;
    }

    .mini-progress-circle svg {
        transform: rotate(-90deg);
    }

    .mini-progress-bg {
        stroke: rgba(255, 255, 255, 0.1);
    }

    .mini-progress-fill {
        stroke: var(--neon-primary);
        stroke-dasharray: 100.531;
        stroke-dashoffset: calc(100.531 - (100.531 * var(--progress) / 100));
        transition: stroke-dashoffset 1s ease;
    }

    /* Quick Actions */
    .quick-actions {
        display: flex;
        gap: 12px;
        padding: 0 24px;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
    }

    .quick-actions::-webkit-scrollbar {
        display: none;
    }

    .action-chip {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 20px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 24px;
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.875rem;
        font-weight: 600;
        white-space: nowrap;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .action-chip:hover {
        background: rgba(255, 255, 255, 0.1);
        transform: translateY(-2px);
    }

    .action-chip.active {
        background: rgba(207, 255, 4, 0.1);
        border-color: var(--neon-primary);
        color: var(--neon-primary);
    }

    .action-chip svg {
        width: 16px;
        height: 16px;
    }

    /* Animações de Entrada */
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .workout-card-wrapper {
        animation: fadeInUp 0.6s ease var(--animation-bounce);
    }

    .week-overview {
        animation: fadeInUp 0.8s ease var(--animation-bounce) 0.1s both;
    }

    .metrics-grid {
        animation: fadeInUp 1s ease var(--animation-bounce) 0.2s both;
    }

    .quick-actions {
        animation: fadeInUp 1.2s ease var(--animation-bounce) 0.3s both;
    }

    /* Ripple Effect for Buttons */
    .ripple-effect {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.5);
        transform: scale(0);
        animation: ripple-animation 0.6s ease-out;
        pointer-events: none;
    }

    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }

    /* Notification Styles */
    .notification-toast {
        position: fixed;
        top: 24px;
        right: 24px;
        background: var(--bg-card);
        border-radius: 16px;
        padding: 16px 24px;
        box-shadow: var(--shadow-card);
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 300px;
        transform: translateX(400px);
        animation: slide-in 0.3s ease forwards;
        z-index: 1000;
    }

    @keyframes slide-in {
        to {
            transform: translateX(0);
        }
    }

    .notification-toast.success {
        border-left: 4px solid var(--neon-success);
    }

    .notification-toast.error {
        border-left: 4px solid var(--neon-danger);
    }

    .notification-toast.info {
        border-left: 4px solid var(--neon-primary);
    }

    /* Responsive Design - ESPAÇAMENTO OTIMIZADO */
    @media (max-width: 768px) {
        .home-header {
            padding: 20px 16px;
        }
        
        .home-content {
            padding: 8px 16px 16px 16px;
            gap: 12px;
        }
        
        .training-plan {
            padding: 12px 16px 16px 16px;
        }
        
        .section-header {
            margin-bottom: 12px;
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
        }

        .header-actions {
            flex-direction: column;
            gap: 8px;
        }

        .week-selector {
            padding: 6px 12px;
            gap: 8px;
        }

        .week-nav {
            width: 28px !important;
            height: 28px !important;
            padding: 4px !important;
        }

        .week-nav svg {
            width: 14px !important;
            height: 14px !important;
        }

        .current-week-info {
            min-width: 70px;
        }

        .week-number {
            font-size: 0.8rem;
        }

        .week-status {
            font-size: 0.7rem;
            padding: 1px 6px;
        }

        .workout-card-wrapper {
            padding: 20px 16px;
            margin-top: -30px;
        }

        .workout-card-content {
            padding: 24px;
        }

        .workout-info h1 {
            font-size: 1.5rem;
        }

        .workout-header {
            flex-direction: column;
            gap: 24px;
        }

        .progress-circle {
            margin: 0 auto;
        }

        .metrics-grid {
            grid-template-columns: 1fr;
            padding: 0 16px 20px;
        }

        .week-overview {
            padding: 0 16px 20px;
        }

        .week-indicators {
            gap: 8px;
        }

        .day-indicator {
            padding: 12px 4px;
        }

        .quick-actions {
            padding: 0 16px;
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
    
    /* ========================================
       MODAL DE PLANEJAMENTO SEMANAL - CSS ADICIONAL
       ======================================== */
       
    /* Garantir que o modal seja sempre visível quando ativo */
    .planning-modal-overlay {
        pointer-events: auto !important;
        visibility: visible !important;
        opacity: 1 !important;
    }
    
    .planning-modal-container {
        pointer-events: auto !important;
        visibility: visible !important;
    }
    
    .planning-modal-content {
        pointer-events: auto !important;
        visibility: visible !important;
        opacity: 1 !important;
        z-index: 3001 !important;
    }
    
    /* Garantir que elementos filhos sejam visíveis */
    .planning-modal-content * {
        visibility: visible !important;
        opacity: 1 !important;
    }
    
    /* Melhorar responsividade do modal */
    @media (max-width: 768px) {
        .planning-modal-content {
            width: 95vw !important;
            max-width: 95vw !important;
            padding: 16px !important;
            border-radius: 12px !important;
        }
        
        .days-grid {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 8px !important;
        }
        
        .day-card-modal {
            padding: 12px 8px !important;
            font-size: 0.8rem !important;
        }
    }
    
    @media (max-width: 480px) {
        .planning-modal-content {
            width: 98vw !important;
            max-width: 98vw !important;
            padding: 12px !important;
            margin: 10px !important;
        }
        
        .planning-modal-header h1 {
            font-size: 1.4rem !important;
        }
        
        .planning-modal-actions {
            flex-direction: column !important;
        }
        
        .planning-modal-actions button {
            width: 100% !important;
            min-width: unset !important;
        }
    }

    /* Adicionar elemento de loading para dados dinâmicos */
    .loading-placeholder {
        background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-primary) 50%, var(--bg-secondary) 75%);
        background-size: 200% 100%;
        animation: loading 1.5s infinite;
        border-radius: var(--radius-sm);
        height: 1.2em;
        width: 60%;
    }

    @keyframes loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
    }

    /* ===== ESTILOS PARA LISTA DE EXERCÍCIOS ===== */
    
    .exercises-header {
        padding: 16px 0;
        border-bottom: 1px solid var(--border-color);
        margin-bottom: 16px;
    }
    
    .exercises-header h4 {
        margin: 0 0 4px 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--text-primary);
    }
    
    .exercises-count {
        margin: 0;
        font-size: 0.875rem;
        color: var(--text-secondary);
    }
    
    .exercises-grid {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    
    .exercise-card {
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        padding: 16px;
        transition: all 0.3s ease;
        border-left: 4px solid var(--accent-green);
    }
    
    .exercise-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-glow);
        border-color: var(--accent-green);
    }
    
    .exercise-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
    }
    
    .exercise-number {
        width: 32px;
        height: 32px;
        background: var(--accent-green);
        color: var(--bg-primary);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 0.875rem;
        box-shadow: var(--shadow-glow);
    }
    
    .exercise-info {
        flex: 1;
    }
    
    .exercise-name {
        margin: 0 0 2px 0;
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary);
    }
    
    .exercise-muscle {
        margin: 0;
        font-size: 0.8rem;
        color: var(--accent-green);
        font-weight: 500;
    }
    
    .exercise-details {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        margin-bottom: 12px;
    }
    
    .exercise-sets,
    .exercise-reps,
    .exercise-weight,
    .exercise-rest {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }
    
    .exercise-details .label {
        font-size: 0.75rem;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-weight: 500;
    }
    
    .exercise-details .value {
        font-size: 0.95rem;
        font-weight: 600;
        color: var(--text-primary);
    }
    
    .exercise-weight .range {
        font-size: 0.8rem;
        color: var(--text-secondary);
        font-weight: 400;
    }
    
    .exercise-equipment {
        margin-top: 8px;
    }
    
    .equipment-tag {
        display: inline-block;
        background: var(--accent-yellow);
        color: var(--bg-primary);
        padding: 2px 8px;
        border-radius: var(--radius-sm);
        font-size: 0.75rem;
        font-weight: 600;
    }
    
    .exercises-footer {
        padding: 16px 0;
        border-top: 1px solid var(--border-color);
        margin-top: 16px;
    }
    
    .rm-info {
        margin: 0;
        font-size: 0.8rem;
        color: var(--text-secondary);
        text-align: center;
        font-style: italic;
    }
    
    /* Mensagem quando não há exercícios */
    .no-exercises-message {
        text-align: center;
        padding: 32px 16px;
        border-radius: var(--radius-lg);
        background: var(--bg-secondary);
        border: 1px dashed var(--border-color);
    }
    
    .no-exercises-message.info {
        border-color: var(--accent-green);
        background: var(--accent-green-bg);
    }
    
    .no-exercises-message.warning {
        border-color: var(--accent-yellow);
        background: rgba(255, 229, 0, 0.1);
    }
    
    .no-exercises-message.error {
        border-color: #ff6b6b;
        background: rgba(255, 107, 107, 0.1);
    }
    
    .message-icon {
        font-size: 2rem;
        margin-bottom: 8px;
    }
    
    .message-text {
        margin: 0;
        font-size: 0.95rem;
        color: var(--text-secondary);
    }
    
    /* Responsividade para exercícios */
    @media (max-width: 768px) {
        .exercise-details {
            grid-template-columns: 1fr;
            gap: 8px;
        }
        
        .exercise-card {
            padding: 12px;
        }
        
        .exercises-header {
            padding: 12px 0;
        }
    }
`;

// Função para inicializar animações e efeitos
export const initializeHomeAnimations = () => {
    // Animar o círculo de progresso
    setTimeout(() => {
        const progressCircle = document.querySelector('.progress-ring-progress');
        if (progressCircle) {
            const progressValue = parseInt(document.getElementById('progress-percentage')?.textContent || '0');
            const circumference = 2 * Math.PI * 54; // raio = 54
            const offset = circumference - (progressValue / 100) * circumference;
            progressCircle.style.strokeDasharray = circumference;
            progressCircle.style.strokeDashoffset = offset;
            progressCircle.style.stroke = 'var(--neon-primary)';
            progressCircle.style.filter = 'drop-shadow(0 0 10px var(--neon-primary))';
        }

        // Animar mini círculos de progresso
        document.querySelectorAll('.mini-progress-fill').forEach(circle => {
            const progress = circle.style.getPropertyValue('--progress');
            if (progress) {
                const circumference = 2 * Math.PI * 16; // raio = 16
                const offset = circumference - (parseInt(progress) / 100) * circumference;
                circle.style.strokeDasharray = circumference;
                circle.style.strokeDashoffset = offset;
                circle.style.stroke = 'var(--neon-primary)';
            }
        });
    }, 500);

    // Adicionar efeito ripple aos botões
    document.querySelectorAll('button, .action-chip').forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple-effect');
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    });

    // Marcar dia atual
    const today = new Date().getDay();
    const dayIndicator = document.querySelector(`.day-indicator[data-day="${today}"]`);
    if (dayIndicator) {
        dayIndicator.classList.add('today');
    }

    // Atualizar saudação baseada no horário
    const updateGreeting = () => {
        const hour = new Date().getHours();
        const greetingEl = document.querySelector('.user-greeting h4');
        if (greetingEl) {
            if (hour < 12) {
                greetingEl.textContent = 'Bom dia,';
            } else if (hour < 18) {
                greetingEl.textContent = 'Boa tarde,';
            } else {
                greetingEl.textContent = 'Boa noite,';
            }
        }
    };
    updateGreeting();

    // Sistema de notificações
    window.showNotification = (message, type = 'info') => {
        const notification = document.createElement('div');
        notification.className = `notification-toast ${type}`;
        notification.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                ${type === 'success' ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>' : 
                  type === 'error' ? '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>' :
                  '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'}
            </svg>
            <span>${message}</span>
        `;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slide-in 0.3s ease reverse';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    };
};

// Função para inicializar a home com dados dinâmicos
export async function inicializarHome() {
    try {
        console.log('[templates/home.js] Inicializando home...');
        
        // Aguardar um pouco para garantir que o template foi renderizado
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Inicializar animações
        initializeHomeAnimations();
        
        // Chamar o homeService
        // await homeService.inicializarHome();
        
        console.log('[templates/home.js] ✅ Home inicializada com sucesso');
        
    } catch (error) {
        console.error('[templates/home.js] ❌ Erro ao inicializar home:', error);
    }
}

// Função para expandir/contrair o card de treino
export function toggleWorkoutCard() {
    const expandableContent = document.getElementById('expandable-content');
    const toggleButton = document.getElementById('workout-toggle');
    const expandIcon = toggleButton?.querySelector('.expand-icon');
    
    if (!expandableContent) return;
    
    const isExpanded = expandableContent.style.display !== 'none';
    
    if (isExpanded) {
        // Contrair
        expandableContent.style.display = 'none';
        if (expandIcon) {
            expandIcon.style.transform = 'rotate(0deg)';
        }
    } else {
        // Expandir
        expandableContent.style.display = 'block';
        if (expandIcon) {
            expandIcon.style.transform = 'rotate(180deg)';
        }
    }
    
    console.log('[toggleWorkoutCard] Card de treino', isExpanded ? 'contraído' : 'expandido');
}

// Disponibilizar funções globalmente
window.inicializarHome = inicializarHome;
window.toggleWorkoutCard = toggleWorkoutCard;
window.initializeHomeAnimations = initializeHomeAnimations;