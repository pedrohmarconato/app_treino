// templates/home.js - Template da tela home COMPLETO
// import homeService from '../services/homeService.js'; // Temporariamente comentado para debug
import { getWorkoutIcon, getActionIcon, getNavigationIcon, getAchievementIcon } from '../utils/icons.js';
import { ContextualWorkoutButton } from '../components/ContextualWorkoutButton.js';

export const homeTemplate = () => `
    <div id="home-screen" class="screen">
        <!-- Header Moderno -->
        <header class="app-header">
            <div class="header-container">
                <!-- User Avatar -->
                <div class="header-avatar">
                    <div class="avatar-wrapper">
                        <img id="user-avatar" src="pedro.png" alt="Avatar" class="avatar-img">
                        <span class="avatar-status"></span>
                    </div>
                </div>
                
                <!-- Logo Central -->
                <div class="header-logo">
                    <img src="./icons/logo.png" alt="App Treino" class="logo-img">
                </div>
                
                <!-- Ações -->
                <div class="header-actions">
                    <button class="action-btn" onclick="logout()" title="Sair">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="action-icon">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                            <polyline points="16,17 21,12 16,7"/>
                            <line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                    </button>
                </div>
            </div>
        </header>

        <!-- Home Content Principal - ESTRUTURA CORRIGIDA -->
        <div class="home-content">
            <!-- Semana de Treinos -->
            <div class="training-plan">
                <div class="section-header">
                    <h2>Semana de Treinos</h2>
                    <div class="header-actions">
                        <div class="week-selector" id="week-selector">
                            <button class="btn-icon week-nav" id="week-prev" onclick="window.navegarSemana(-1)">
                                ${getNavigationIcon('back')}
                            </button>
                            <div class="current-week-info" id="current-week-info">
                                <span class="week-number" id="week-number">Semana 1</span>
                                <span class="week-status" id="week-status">Ativa</span>
                            </div>
                            <button class="btn-icon week-nav" id="week-next" onclick="window.navegarSemana(1)">
                                ${getNavigationIcon('forward')}
                            </button>
                        </div>
                        <button class="btn-secondary btn-edit" onclick="window.abrirPlanejamentoParaUsuarioAtual()">
                            ${getActionIcon('edit')}
                            <span class="btn-text">Editar</span>
                        </button>
                    </div>
                </div>
                
                <!-- Carrossel Infinito de Dias da Semana -->
                <div class="week-carousel-container">
                    <button class="carousel-nav carousel-prev" onclick="window.navigateCarousel(-1)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>
                    
                    <div class="week-carousel" id="week-carousel">
                        <!-- Preenchido dinamicamente pelo carrossel infinito -->
                    </div>
                    
                    <button class="carousel-nav carousel-next" onclick="window.navigateCarousel(1)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </button>
                    
                    <div class="carousel-dots" id="carousel-dots">
                        <!-- Indicadores de posição -->
                    </div>
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
                                            ${getNavigationIcon('calendar')}
                                            <span id="workout-exercises">Carregando exercícios...</span>
                                        </div>
                                        <div class="meta-item">
                                            ${getActionIcon('timer')}
                                            <span id="workout-duration">45-60 min</span>
                                        </div>
                                    </div>
                                </div>

                            </div>
                            <div class="workout-action">
                                <button id="contextual-workout-btn" class="contextual-workout-btn btn-loading">
                                    <div class="btn-content">
                                        <div class="btn-main">
                                            <span class="btn-icon" aria-hidden="true">⏳</span>
                                            <span class="btn-text">Carregando...</span>
                                        </div>
                                    </div>
                                </button>
                            </div>
                            
                            <!-- Seção de Preparação -->
                            <div class="workout-preparation">
                                <div class="preparation-tips">
                                    <div class="tip-item">
                                        <div class="tip-icon">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                                            </svg>
                                        </div>
                                        <span class="tip-text">Aquecimento <strong>5-10min</strong></span>
                                    </div>
                                    <div class="tip-item">
                                        <div class="tip-icon">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                                                <polyline points="14 2 14 8 20 8"/>
                                            </svg>
                                        </div>
                                        <span class="tip-text">Registre <strong>cada série</strong></span>
                                    </div>
                                    <div class="tip-item">
                                        <div class="tip-icon">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                                            </svg>
                                        </div>
                                        <span class="tip-text">Foco na <strong>forma</strong></span>
                                    </div>
                                </div>
                                
                                <div class="workout-preview" id="workout-preview">
                                    <div class="preview-header">
                                        <span class="preview-label">Grupos Musculares</span>
                                    </div>
                                    <div class="muscle-groups" id="muscle-groups">
                                        <div class="muscle-chip">Carregando...</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Conteúdo Expandido do Treino -->
                <div class="current-workout-card expandable-card" id="current-workout-card">
                    <div class="workout-expand-header">
                        <div class="expand-info">
                            <span class="expand-badge" id="workout-type">Detalhes</span>
                            <h4 class="expand-title">Lista de Exercícios</h4>
                        </div>
                        
                        <button class="expand-btn" id="workout-toggle" onclick="toggleWorkoutCard()">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
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





            <!-- Week Overview Section -->
            <div class="week-overview">
                <div class="week-indicators" id="week-indicators">
                    <!-- Week day indicators will be populated by dashboard.js -->
                </div>
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
        from { transform: scale(1); opacity: 0.5; }
        to { transform: scale(1.1); opacity: 0.8; }
    }

    /* Header content moved to header-redesign.css for better organization */

    .user-section {
        display: flex;
        align-items: center;
        gap: 8px;
        justify-self: start;
    }

    .user-avatar-small {
        width: 45px;
        height: 45px;
        border-radius: 12px;
        overflow: hidden;
        border: 2px solid var(--neon-primary);
        box-shadow: var(--shadow-neon);
        position: relative;
    }

    .avatar-glow {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: radial-gradient(circle, var(--neon-primary) 0%, transparent 70%);
        opacity: 0.3;
        animation: pulse-status 2s ease-in-out infinite;
    }

    @keyframes pulse-status {
        0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0, 255, 136, 0.4); }
        50% { transform: scale(1.1); box-shadow: 0 0 0 8px rgba(0, 255, 136, 0); }
    }

    .logo-section {
        display: flex;
        align-items: center;
        justify-self: center;
    }

    .header-logo {
        width: 90px;
        height: 90px;
        opacity: 1;
        filter: drop-shadow(0 0 15px rgba(207, 255, 4, 0.7));
        transition: all 0.3s ease;
    }

    .header-logo:hover {
        opacity: 1;
        filter: drop-shadow(0 0 12px rgba(207, 255, 4, 0.6));
        transform: scale(1.1);
    }

    .actions-section {
        display: flex;
        align-items: center;
        gap: 12px;
        justify-self: end;
    }

    .logout-button {
        position: relative;
        width: 45px;
        height: 45px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .logout-button:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: translateY(-2px);
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
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
        font-size: 1.25rem;
        font-weight: 600;
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
        font-size: 1.5rem;
        font-weight: 700;
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
        font-size: 1.75rem;
        font-weight: 700;
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
        gap: 10px;
        max-width: 100%;
    }

    .day-indicator {
        aspect-ratio: 1.2;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: var(--bg-secondary);
        border-radius: 12px;
        border: 1px solid transparent;
        transition: all 0.2s ease;
        cursor: pointer;
        position: relative;
        padding: 8px 4px;
        min-height: 72px;
    }

    .day-indicator:hover {
        border-color: var(--border-light);
        transform: translateY(-1px);
    }

    .day-indicator.today {
        border-color: var(--neon-primary);
        background: rgba(207, 255, 4, 0.08);
    }

    .day-indicator.completed {
        background: rgba(39, 174, 96, 0.12);
        border-color: var(--neon-success);
    }

    .day-indicator.cancelled {
        background: rgba(231, 76, 60, 0.12);
        border-color: #e74c3c;
    }

    .day-indicator.folga {
        background: rgba(52, 152, 219, 0.12);
        border-color: #3498db;
    }

    .day-label {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-secondary);
        margin-bottom: 4px;
        text-transform: uppercase;
        letter-spacing: 0.02em;
    }

    .day-indicator.today .day-label {
        color: var(--neon-primary);
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

    .day-indicator.completed .day-name,
    .day-indicator.workout-completed .day-name,
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
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 100%;
    }

    .day-indicator.today .day-type {
        color: var(--text-primary);
        font-weight: 600;
    }

    .day-indicator.completed .day-type,
    .day-indicator.workout-completed .day-type,
    .day-indicator.folga .day-type {
        color: var(--text-primary);
        font-weight: 500;
    }

    .day-indicator.cancelled .day-type {
        color: var(--text-muted);
        font-weight: 400;
    }

    .empty-day {
        border: 1px dashed var(--border-color);
        background: transparent;
    }

    .empty-day .day-type {
        color: var(--text-secondary);
        font-style: italic;
    }

    /* Status visual simplificado */
    .day-status {
        width: 6px;
        height: 6px;
        background: var(--border-color);
        border-radius: 50%;
        margin: 4px auto 0;
        transition: all 0.2s ease;
    }

    .day-indicator.completed .day-status {
        background: var(--neon-success);
    }

    .day-indicator.today .day-status {
        background: var(--neon-primary);
    }

    .day-indicator.cancelled .day-status {
        background: #e74c3c;
    }

    .day-indicator.folga .day-status {
        background: #3498db;
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

    .workout-expand-header {
        display: flex;
        align-items: center;
        padding: 28px;
        gap: 24px;
        position: relative;
        z-index: 1;
        border-bottom: 1px solid var(--border-color);
    }

    .expand-info {
        flex: 1;
    }

    .expand-badge {
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

    .expand-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--text-primary);
        margin: 8px 0;
        text-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
    }

    .expand-btn {
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

    .expand-btn::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: radial-gradient(circle, var(--accent-green-glow) 0%, transparent 70%);
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    .expand-btn:hover {
        border-color: var(--accent-green);
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
    }

    .expand-btn:hover::before {
        opacity: 1;
    }

    .expand-btn .expand-icon {
        width: 20px;
        height: 20px;
        stroke: var(--text-primary);
        transition: var(--transition);
    }

    .expand-btn.expanded .expand-icon {
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
        background: var(--bg-primary);
        border-color: var(--accent-green);
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
            flex-direction: row;
            gap: 12px;
            align-items: center;
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
            gap: 6px;
        }

        .day-indicator {
            padding: 8px 2px;
            min-height: 64px;
            font-size: 0.85rem;
        }

        .day-label {
            font-size: 0.7rem;
            margin-bottom: 2px;
        }

        .day-name {
            font-size: 0.65rem;
            margin-bottom: 4px;
        }

        .day-type {
            font-size: 0.65rem;
            margin-top: 1px;
        }

        .day-status {
            width: 5px;
            height: 5px;
            margin: 2px auto 0;
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

    /* ===== ESTILOS PARA MODAL DE HISTÓRICO ===== */
    
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    .modal-content {
        background: var(--bg-primary);
        border-radius: var(--radius-lg);
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        border: 1px solid var(--border-color);
        transform: translate(-50%, -50%) scale(0.95);
        transition: transform 0.3s ease;
        position: fixed;
        top: 50%;
        left: 50%;
    }

    .workout-history-modal {
        max-width: 700px;
    }

    .modal-header {
        padding: 24px 24px 16px;
        border-bottom: 1px solid var(--border-color);
    }

    .workout-history-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
    }

    .history-title-section h2 {
        margin: 0 0 8px 0;
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--text-primary);
    }

    .history-subtitle {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.875rem;
        color: var(--text-secondary);
    }

    .day-name {
        font-weight: 600;
        color: var(--accent-green);
    }

    .separator {
        color: var(--text-muted);
    }

    .btn-close {
        background: none;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 8px;
        border-radius: var(--radius-sm);
        transition: all 0.3s ease;
    }

    .btn-close:hover {
        background: var(--bg-secondary);
        color: var(--text-primary);
    }

    .modal-body {
        padding: 24px;
    }

    .stats-overview {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 16px;
        margin-bottom: 32px;
    }

    .stat-card {
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        padding: 20px;
        text-align: center;
        transition: all 0.3s ease;
    }

    .stat-card:hover {
        border-color: var(--accent-green-border);
        transform: translateY(-2px);
    }

    .stat-icon {
        margin: 0 auto 12px;
        width: 48px;
        height: 48px;
        background: var(--accent-green-bg);
        border-radius: var(--radius-full);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--accent-green);
    }

    .stat-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: 4px;
    }

    .stat-label {
        font-size: 0.75rem;
        color: var(--text-secondary);
        text-transform: uppercase;
        font-weight: 600;
        letter-spacing: 0.5px;
    }

    .performance-stat .stat-icon.good {
        background: rgba(0, 255, 136, 0.1);
        color: #00ff88;
    }

    .performance-stat .stat-value.good {
        color: #00ff88;
    }

    .exercises-history h3 {
        margin: 0 0 20px 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-primary);
    }

    .exercises-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .exercise-card-history {
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        overflow: hidden;
        transition: all 0.3s ease;
    }

    .exercise-card-history:hover {
        border-color: var(--accent-green-border);
    }

    .exercise-header-history {
        padding: 16px 20px 12px;
        border-bottom: 1px solid var(--border-color);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .exercise-header-history h4 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary);
    }

    .exercise-equipment {
        font-size: 0.75rem;
        color: var(--text-muted);
        text-transform: uppercase;
        font-weight: 600;
    }

    .series-list {
        padding: 16px 20px;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .serie-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 12px;
        background: var(--bg-primary);
        border-radius: var(--radius-sm);
        border: 1px solid var(--border-light);
    }

    .serie-number {
        background: var(--accent-green);
        color: var(--bg-primary);
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        font-weight: 700;
    }

    .serie-weight {
        font-weight: 600;
        color: var(--text-primary);
        min-width: 60px;
    }

    .serie-reps {
        color: var(--text-secondary);
        font-weight: 500;
    }

    .no-data {
        text-align: center;
        color: var(--text-muted);
        font-style: italic;
        padding: 40px 20px;
    }

    /* Responsividade do modal */
    @media (max-width: 768px) {
        .modal-content {
            width: 95%;
            max-height: 90vh;
        }

        .stats-overview {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
        }

        .stat-card {
            padding: 16px;
        }

        .modal-body {
            padding: 16px;
        }

        .modal-header {
            padding: 16px 16px 12px;
        }
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
        border-left: 4px solid var(--accent-green);
        transition: all 0.3s ease;
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
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

// Global reference for contextual button instance
let contextualWorkoutButtonInstance = null;

// Função para inicializar a home com dados dinâmicos
export async function inicializarHome() {
    try {
        console.log('[templates/home.js] Inicializando home...');
        
        // Aguardar um pouco para garantir que o template foi renderizado
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Inicializar animações
        initializeHomeAnimations();

        // === INICIALIZAÇÃO DO BOTÃO CONTEXTUAL ===
        await initializeContextualWorkoutButton();
        
        // Chamar o homeService
        // await homeService.inicializarHome();
        
        console.log('[templates/home.js] ✓ Home inicializada com sucesso');
        
    } catch (error) {
        console.error('[templates/home.js] ✗ Erro ao inicializar home:', error);
    }
}

/**
 * Inicializa o botão contextual de treino
 */
async function initializeContextualWorkoutButton() {
    try {
        console.log('[templates/home.js] 🔄 Inicializando ContextualWorkoutButton...');
        
        const buttonElement = document.getElementById('contextual-workout-btn');
        if (!buttonElement) {
            console.error('[templates/home.js] ❌ Elemento #contextual-workout-btn não encontrado');
            return;
        }
        
        // Limpar instância anterior se existir
        if (contextualWorkoutButtonInstance) {
            contextualWorkoutButtonInstance.destroy();
        }
        
        // Criar nova instância do botão contextual
        contextualWorkoutButtonInstance = new ContextualWorkoutButton(buttonElement, {
            updateInterval: 5000, // 5 segundos
            enableAutoUpdate: true,
            showProgress: true,
            showTimeElapsed: true
        });
        
        // Aguardar inicialização
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('[templates/home.js] ✅ ContextualWorkoutButton inicializado com sucesso');
        
        // Configurar evento global de mudança de estado
        document.addEventListener('workout-button-state-change', handleWorkoutButtonStateChange);
        
    } catch (error) {
        console.error('[templates/home.js] ❌ Erro ao inicializar ContextualWorkoutButton:', error);
        
        // Fallback: configurar botão simples
        setupFallbackWorkoutButton();
    }
}

/**
 * Manipula mudanças de estado do botão contextual
 */
function handleWorkoutButtonStateChange(event) {
    const { newState, data, oldState } = event.detail;
    
    console.log('[templates/home.js] Estado do botão alterado:', {
        de: oldState,
        para: newState,
        dados: data
    });
    
    // Atualizar outros elementos da UI baseado no estado
    updateWorkoutUIElements(newState, data);
}

/**
 * Atualiza elementos da UI baseado no estado do botão
 */
function updateWorkoutUIElements(state, data) {
    try {
        // Atualizar nome do treino
        const workoutNameEl = document.getElementById('workout-name');
        if (workoutNameEl) {
            switch (state) {
                case 'start':
                    workoutNameEl.textContent = 'Preparando seu treino';
                    break;
                case 'resume':
                    workoutNameEl.textContent = data.workoutName || 'Treino em Andamento';
                    break;
                case 'complete':
                    workoutNameEl.textContent = 'Treino Concluído';
                    break;
                case 'rest':
                    workoutNameEl.textContent = 'Dia de Descanso';
                    break;
                case 'error':
                    workoutNameEl.textContent = 'Erro no Cache';
                    break;
                default:
                    workoutNameEl.textContent = 'Carregando...';
            }
        }
        
        // Atualizar informações de exercícios
        const exercisesEl = document.getElementById('workout-exercises');
        if (exercisesEl) {
            if (state === 'resume' && data.totalExercises) {
                exercisesEl.textContent = `${data.exercisesCompleted}/${data.totalExercises} exercícios`;
            } else if (state === 'complete') {
                exercisesEl.textContent = 'Treino finalizado';
            } else if (state === 'rest') {
                exercisesEl.textContent = 'Dia de folga';
            } else {
                exercisesEl.textContent = 'Carregando exercícios...';
            }
        }
        
        console.log('[templates/home.js] UI atualizada para estado:', state);
        
    } catch (error) {
        console.error('[templates/home.js] Erro ao atualizar UI:', error);
    }
}

/**
 * Configuração de fallback para o botão em caso de erro
 */
function setupFallbackWorkoutButton() {
    try {
        console.log('[templates/home.js] ⚠️ Configurando botão de fallback');
        
        const buttonElement = document.getElementById('contextual-workout-btn');
        if (!buttonElement) return;
        
        // Resetar classes
        buttonElement.className = 'btn-primary btn-glow';
        buttonElement.innerHTML = `
            <span class="btn-text">Iniciar Treino</span>
            ${getActionIcon('play', 'active')}
        `;
        
        // Configurar listener básico
        buttonElement.onclick = () => {
            if (typeof window.iniciarTreino === 'function') {
                window.iniciarTreino();
            } else {
                console.warn('[templates/home.js] window.iniciarTreino não disponível');
                if (window.showNotification) {
                    window.showNotification('Função de iniciar treino não disponível', 'warning');
                }
            }
        };
        
        console.log('[templates/home.js] ✅ Botão de fallback configurado');
        
    } catch (error) {
        console.error('[templates/home.js] Erro ao configurar fallback:', error);
    }
}

/**
 * Força atualização do botão contextual
 */
export function forceUpdateContextualButton() {
    if (contextualWorkoutButtonInstance) {
        contextualWorkoutButtonInstance.forceUpdate();
        console.log('[templates/home.js] Força atualização do botão contextual');
    }
}

/**
 * Limpa recursos do botão contextual
 */
export function cleanupContextualButton() {
    if (contextualWorkoutButtonInstance) {
        contextualWorkoutButtonInstance.destroy();
        contextualWorkoutButtonInstance = null;
        console.log('[templates/home.js] Recursos do botão contextual limpos');
    }
    
    document.removeEventListener('workout-button-state-change', handleWorkoutButtonStateChange);
}

// REMOVIDO: toggleWorkoutCard - delegado para workoutToggle.js
// A função global window.toggleWorkoutCard é definida em workoutToggle.js

// Disponibilizar funções globalmente
window.inicializarHome = inicializarHome;
window.initializeHomeAnimations = initializeHomeAnimations;
window.forceUpdateContextualButton = forceUpdateContextualButton;
window.cleanupContextualButton = cleanupContextualButton;
window.getContextualButtonInstance = () => contextualWorkoutButtonInstance;