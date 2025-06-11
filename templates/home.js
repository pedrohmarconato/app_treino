// templates/home.js - Template da tela home COMPLETO
// import homeService from '../services/homeService.js'; // Temporariamente comentado para debug

export const homeTemplate = () => `
    <div id="home-screen" class="screen">
        <button class="back-button btn-back" onclick="logout()">
            <svg class="back-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 18l-6-6 6-6"/>
            </svg>
        </button>
        
        <div class="home-header">
            <div class="header-content">
                <div class="user-info">
                    <div class="user-avatar-small">
                        <img id="user-avatar" class="avatar-img" src="pedro.png" alt="Avatar">
                        <div class="avatar-status"></div>
                    </div>
                    <div class="user-greeting">
                        <h4>Olá! Bem-vindo 👋</h4>
                        <p id="user-name">Usuário</p>
                    </div>
                </div>
                <div class="header-actions">
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

                <!-- Card do Treino Atual Expansível -->
                <div class="current-workout-card expandable-card" id="current-workout-card">
                    <!-- Cabeçalho com Progress Circle -->
                    <div class="workout-header-modern">
                        <div class="workout-info-section">
                            <div class="workout-badge-container">
                                <span class="workout-type-badge" id="workout-type">Carregando...</span>
                            </div>
                            <h3 class="workout-title" id="workout-name">Preparando seu treino</h3>
                            <p class="workout-subtitle" id="workout-exercises">Carregando exercícios...</p>
                        </div>
                        
                        <div class="workout-progress-section">
                            <div class="progress-circle-container">
                                <svg class="progress-circle" width="80" height="80" viewBox="0 0 80 80">
                                    <circle 
                                        cx="40" 
                                        cy="40" 
                                        r="36" 
                                        stroke="var(--border-color)" 
                                        stroke-width="4" 
                                        fill="none"
                                    />
                                    <circle 
                                        id="workout-progress-circle"
                                        cx="40" 
                                        cy="40" 
                                        r="36" 
                                        stroke="var(--accent-green)" 
                                        stroke-width="4" 
                                        fill="none"
                                        stroke-linecap="round"
                                        stroke-dasharray="226.08"
                                        stroke-dashoffset="226.08"
                                        transform="rotate(-90 40 40)"
                                        style="filter: drop-shadow(0 0 6px var(--accent-green-glow))"
                                    />
                                </svg>
                                <div class="progress-text">
                                    <span id="workout-progress-text">0%</span>
                                </div>
                            </div>
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
                    
                    
                </div>
            </div>

            
            </div> <!-- Fechamento training-plan -->

        </div> <!-- Fechamento home-content -->
        
        <!-- Floating Bottom Navigation Bar -->
        <div class="floating-bottom-nav" id="floating-bottom-nav">
            <div class="bottom-nav-container">
                <button class="floating-action-btn" id="start-workout-btn" onclick="window.iniciarTreino()">
                    <div class="fab-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <polygon points="8,5 19,12 8,19"/>
                        </svg>
                    </div>
                    <span class="fab-text" id="fab-btn-text">Iniciar Treino</span>
                </button>
            </div>
        </div>
    </div>
`;

// Estilos específicos da tela home - DESIGN SÓBRIO COM NEON SELETIVO
export const homeStyles = `
    /* ===== SOBER DESIGN SYSTEM ===== */
    
    /* Variáveis CSS para Design Sóbrio */
    :root {
        --bg-primary: #0a0a0a;
        --bg-secondary: #151515;
        --bg-card: #1a1a1a;
        --bg-elevated: #202020;
        --border-color: #2a2a2a;
        --border-light: #333333;
        --text-primary: #ffffff;
        --text-secondary: #888888;
        --text-muted: #666666;
        
        /* Neon apenas para elementos importantes */
        --accent-green: #00ff88;
        --accent-green-soft: #00cc6a;
        --accent-green-bg: rgba(0, 255, 136, 0.08);
        --accent-green-border: rgba(0, 255, 136, 0.2);
        
        /* Status Colors */
        --success: #00ff88;
        --warning: #ffaa00;
        --error: #ff4444;
        --info: #44aaff;
        
        /* Shadows mais sutis */
        --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.4);
        --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.3);
        --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.2);
        --shadow-glow: 0 0 20px rgba(0, 255, 136, 0.2);
        
        --radius-sm: 8px;
        --radius-md: 12px;
        --radius-lg: 16px;
        --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    /* Home Header - Estilo Login */
    .home-header {
        background: var(--bg-card);
        padding: 24px;
        border-bottom: 1px solid var(--border-color);
        position: sticky;
        top: 0;
        z-index: 100;
        backdrop-filter: blur(20px);
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
        width: 56px;
        height: 56px;
        border-radius: 50%;
        overflow: hidden;
        border: 2px solid var(--border-light);
        position: relative;
        transition: var(--transition);
    }

    .user-avatar-small:hover {
        border-color: var(--accent-green);
        box-shadow: var(--shadow-glow);
    }

    .avatar-status {
        position: absolute;
        bottom: 2px;
        right: 2px;
        width: 12px;
        height: 12px;
        background: var(--success);
        border: 2px solid var(--bg-card);
        border-radius: 50%;
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
        color: var(--text-secondary);
        margin-bottom: 2px;
        font-weight: 400;
    }

    .user-greeting p {
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--text-primary);
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

    /* Week Indicators - Estados Específicos */
    .week-indicators {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 8px;
        margin-bottom: 24px;
        padding: 16px;
        background: var(--bg-secondary);
        border-radius: var(--radius-md);
        border: 1px solid var(--border-color);
    }

    /* Estado padrão - Treino a fazer: SEM NADA */
    .day-indicator {
        background: var(--bg-primary);
        border-radius: var(--radius-sm);
        padding: 14px 8px;
        text-align: center;
        transition: all 0.2s ease;
        border: 1px solid var(--border-color);
        position: relative;
        cursor: pointer;
    }

    .day-indicator:hover {
        background: var(--bg-card);
        border-color: var(--border-color);
    }

    /* Hoje - Simples sem neon */
    .day-indicator.today {
        border-color: var(--text-secondary);
        background: var(--bg-card);
    }

    /* Treino Concluído - Sombra Neon Verde */
    .day-indicator.completed,
    .day-indicator.workout-completed {
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        box-shadow: 0 0 15px rgba(0, 255, 100, 0.4);
    }

    /* Folga - Sombra Neon Amarela Discreta */
    .day-indicator.folga {
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        box-shadow: 0 0 10px rgba(255, 229, 0, 0.3);
    }

    /* Cancelado - Sem neon */
    .day-indicator.cancelled {
        background: var(--bg-primary);
        border-color: var(--text-muted);
        opacity: 0.4;
    }

    .day-indicator.cancelled .day-type {
        text-decoration: line-through;
        opacity: 0.6;
    }

    /* Pendente/A fazer - Sem nada */
    .day-indicator.pending {
        background: var(--bg-primary);
        border-color: var(--border-color);
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


    /* Responsive Design - ESPAÇAMENTO OTIMIZADO */
    @media (max-width: 768px) {
        .home-header {
            padding: 12px 16px; /* Reduzido header padding em mobile */
        }
        
        .home-content {
            padding: 8px 16px 16px 16px; /* Reduzido padding-top para 8px em mobile */
            gap: 12px; /* Reduzido gap para 12px em mobile */
        }
        
        .training-plan {
            padding: 12px 16px 16px 16px; /* Reduzido padding em mobile */
        }
        
        .section-header {
            margin-bottom: 12px; /* Reduzido em mobile */
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

// Função para inicializar a home com dados dinâmicos
export async function inicializarHome() {
    try {
        console.log('[templates/home.js] Inicializando home...');
        
        // Aguardar um pouco para garantir que o template foi renderizado
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Chamar o homeService
        await homeService.inicializarHome();
        
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