// templates/home.js - Template da tela home COMPLETO
// import homeService from '../services/homeService.js'; // Temporariamente comentado para debug
import { getWorkoutIcon, getActionIcon, getNavigationIcon, getAchievementIcon } from '../utils/icons.js';

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
                                <button id="start-workout-btn" class="btn-primary btn-glow" onclick="window.iniciarTreino()">
                                    <span class="btn-text">Iniciar Treino</span>
                                    ${getActionIcon('play', 'active')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Card de Treino Expandível Remodelado -->
                <div class="workout-expandable-card" id="current-workout-card">
                    <div class="workout-card-header" onclick="toggleWorkoutCard()">
                        <div class="workout-header-content">
                            <div class="workout-type-indicator">
                                <span class="workout-type-badge" id="workout-type">Treino A</span>
                                <div class="workout-badge-glow"></div>
                            </div>
                            <div class="workout-header-info">
                                <h3 class="workout-card-title">Exercícios do Treino</h3>
                                <p class="workout-card-subtitle">
                                    <span id="total-exercises-count">0</span> exercícios • 
                                    <span id="estimated-duration">45-60</span> min
                                </p>
                            </div>
                        </div>
                        
                        <div class="expand-button-wrapper">
                            <button class="expand-toggle-btn" id="workout-toggle">
                                <svg class="expand-icon" viewBox="0 0 24 24" fill="none">
                                    <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <!-- Conteúdo Expandível -->
                    <div class="workout-expandable-content" id="expandable-content">
                        <div class="exercises-container" id="workout-exercises-list">
                            <div class="exercises-loading-state">
                                <div class="pulse-loader">
                                    <div class="pulse-circle"></div>
                                    <div class="pulse-circle"></div>
                                    <div class="pulse-circle"></div>
                                </div>
                                <p class="loading-text">Carregando exercícios...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div> <!-- Fechamento training-plan -->





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

    /* Week Selector - Design Moderno */
    .week-selector {
        display: flex;
        align-items: center;
        gap: 16px;
        background: linear-gradient(135deg, var(--bg-card) 0%, rgba(255,255,255,0.02) 100%);
        border-radius: 20px;
        padding: 20px 24px;
        border: 1px solid var(--border-color);
        box-shadow: 
            0 8px 32px rgba(0,0,0,0.12),
            0 2px 8px rgba(0,0,0,0.08),
            inset 0 1px 0 rgba(255,255,255,0.05);
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        backdrop-filter: blur(20px);
        position: relative;
        overflow: hidden;
    }

    .week-selector::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent);
        transition: left 0.6s ease;
    }

    .week-selector:hover::before {
        left: 100%;
    }

    .week-selector:hover {
        border-color: var(--border-light);
        box-shadow: 
            0 12px 40px rgba(0,0,0,0.15),
            0 4px 12px rgba(0,0,0,0.1),
            inset 0 1px 0 rgba(255,255,255,0.08);
        transform: translateY(-1px);
    }

    .week-nav {
        width: 48px !important;
        height: 48px !important;
        padding: 0 !important;
        background: linear-gradient(135deg, var(--bg-secondary) 0%, rgba(255,255,255,0.05) 100%) !important;
        border: 1px solid var(--border-color) !important;
        border-radius: 16px !important;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: hidden;
        backdrop-filter: blur(10px);
        cursor: pointer;
    }

    .week-nav::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        background: linear-gradient(135deg, var(--accent-primary), var(--neon-primary));
        border-radius: 50%;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        transform: translate(-50%, -50%);
        z-index: 0;
    }

    .week-nav:hover::before {
        width: 120%;
        height: 120%;
    }

    .week-nav:hover {
        background: transparent !important;
        border-color: var(--accent-primary) !important;
        transform: scale(1.08) translateY(-1px);
        box-shadow: 
            0 8px 25px rgba(52, 152, 219, 0.4),
            0 3px 10px rgba(0,0,0,0.1);
    }

    .week-nav:hover svg {
        stroke: white !important;
        transform: scale(1.1);
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
    }

    .week-nav:active {
        transform: scale(0.96) translateY(0px);
        transition: all 0.1s ease;
    }

    .week-nav svg {
        width: 20px !important;
        height: 20px !important;
        stroke: var(--text-secondary);
        transition: all 0.3s ease;
        position: relative;
        z-index: 1;
        filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));
    }

    .week-nav:disabled {
        opacity: 0.4;
        cursor: not-allowed;
        background: var(--bg-secondary) !important;
        transform: none !important;
        box-shadow: none !important;
    }

    .week-nav:disabled::before {
        display: none;
    }

    .week-nav:disabled:hover {
        background: var(--bg-secondary) !important;
        border-color: var(--border-color) !important;
        transform: none !important;
        box-shadow: none !important;
    }

    .week-nav:disabled:hover svg {
        stroke: var(--text-secondary) !important;
        transform: none !important;
        filter: none !important;
    }

    .current-week-info {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        min-width: 120px;
        flex: 1;
    }

    .week-number {
        font-size: 1.2rem;
        font-weight: 800;
        color: var(--text-primary);
        letter-spacing: -0.02em;
        text-shadow: 0 2px 8px rgba(255, 255, 255, 0.15);
    }

    .week-status {
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--accent-green);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        padding: 6px 12px;
        border-radius: 12px;
        background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.05));
        border: 1px solid rgba(34, 197, 94, 0.3);
        backdrop-filter: blur(10px);
        box-shadow: 
            0 2px 8px rgba(34, 197, 94, 0.2),
            inset 0 1px 0 rgba(255,255,255,0.1);
        position: relative;
        overflow: hidden;
    }

    .week-status::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.1), transparent);
        transition: left 0.6s ease;
    }

    .week-status:hover::before {
        left: 100%;
    }

    .week-status.programada {
        background: linear-gradient(135deg, rgba(0, 255, 0, 0.15), rgba(0, 255, 0, 0.05));
        color: #00ff88;
        border-color: rgba(0, 255, 0, 0.3);
        box-shadow: 
            0 2px 8px rgba(0, 255, 0, 0.2),
            inset 0 1px 0 rgba(255,255,255,0.1);
    }

    .week-status.inativa {
        background: linear-gradient(135deg, var(--bg-primary), rgba(255,255,255,0.02));
        color: var(--text-muted);
        border-color: var(--border-color);
        box-shadow: 
            0 2px 8px rgba(0,0,0,0.1),
            inset 0 1px 0 rgba(255,255,255,0.02);
    }

    .week-status.atual {
        background: linear-gradient(135deg, var(--accent-green), rgba(34, 197, 94, 0.8));
        color: var(--bg-primary);
        border-color: var(--accent-green);
        box-shadow: 
            0 4px 16px rgba(34, 197, 94, 0.4),
            inset 0 1px 0 rgba(255,255,255,0.2);
        font-weight: 700;
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
        gap: 10px;
        max-width: 100%;
        padding: 12px;
        background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.005) 100%);
        border-radius: 18px;
        backdrop-filter: blur(8px);
        border: 1px solid rgba(255,255,255,0.05);
        box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    }

    .day-indicator {
        aspect-ratio: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        background: linear-gradient(135deg, var(--bg-secondary) 0%, rgba(255,255,255,0.015) 100%);
        border-radius: 14px;
        border: 1px solid var(--border-color);
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        cursor: pointer;
        position: relative;
        padding: 6px 3px 4px;
        min-height: 68px;
        overflow: hidden;
        backdrop-filter: blur(8px);
        box-shadow: 
            0 1px 8px rgba(0,0,0,0.06),
            0 0.5px 2px rgba(0,0,0,0.03),
            inset 0 0.5px 0 rgba(255,255,255,0.02);
    }

    .day-indicator::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
        transition: left 0.6s ease;
    }

    .day-indicator:hover::before {
        left: 100%;
    }

    .day-indicator:hover {
        border-color: var(--border-light);
        transform: translateY(-2px) scale(1.015);
        box-shadow: 
            0 4px 20px rgba(0,0,0,0.1),
            0 2px 8px rgba(0,0,0,0.06),
            inset 0 1px 0 rgba(255,255,255,0.04);
    }

    .day-indicator:active {
        transform: translateY(-1px) scale(0.98);
        transition: all 0.1s ease;
    }

    .day-indicator.today {
        border: 2px solid var(--neon-primary);
        background: linear-gradient(135deg, rgba(207, 255, 4, 0.15) 0%, rgba(207, 255, 4, 0.05) 100%);
        box-shadow: 
            0 8px 32px rgba(207, 255, 4, 0.25),
            0 4px 16px rgba(0,0,0,0.08),
            inset 0 1px 0 rgba(255,255,255,0.1);
        animation: todayPulse 3s ease-in-out infinite;
        transform: scale(1.08);
        z-index: 10;
    }

    @keyframes todayPulse {
        0%, 100% { 
            box-shadow: 
                0 8px 32px rgba(207, 255, 4, 0.25),
                0 4px 16px rgba(0,0,0,0.08),
                inset 0 1px 0 rgba(255,255,255,0.1);
        }
        50% { 
            box-shadow: 
                0 12px 40px rgba(207, 255, 4, 0.35),
                0 6px 20px rgba(0,0,0,0.1),
                inset 0 1px 0 rgba(255,255,255,0.15);
        }
    }

    .day-indicator.completed {
        background: linear-gradient(135deg, rgba(34, 197, 94, 0.28) 0%, rgba(34, 197, 94, 0.1) 100%);
        border: 2px solid var(--neon-success);
        box-shadow: 
            0 0 25px rgba(34, 197, 94, 0.9),
            0 0 45px rgba(34, 197, 94, 0.6),
            0 0 12px rgba(34, 197, 94, 1),
            0 4px 20px rgba(34, 197, 94, 0.3),
            0 2px 8px rgba(0,0,0,0.08),
            inset 0 1px 0 rgba(255,255,255,0.1);
        animation: completedGlow 2s ease-in-out infinite alternate;
    }

    @keyframes completedGlow {
        0% { 
            box-shadow: 
                0 0 25px rgba(34, 197, 94, 0.9),
                0 0 45px rgba(34, 197, 94, 0.6),
                0 0 12px rgba(34, 197, 94, 1),
                0 4px 20px rgba(34, 197, 94, 0.3),
                0 2px 8px rgba(0,0,0,0.08),
                inset 0 1px 0 rgba(255,255,255,0.1);
        }
        100% { 
            box-shadow: 
                0 0 35px rgba(34, 197, 94, 1),
                0 0 55px rgba(34, 197, 94, 0.7),
                0 0 18px rgba(34, 197, 94, 1),
                0 6px 24px rgba(34, 197, 94, 0.4),
                0 3px 10px rgba(0,0,0,0.1),
                inset 0 1px 0 rgba(255,255,255,0.15);
        }
    }

    .day-indicator.completed::after {
        content: '✓';
        position: absolute;
        top: 8px;
        right: 8px;
        width: 18px;
        height: 18px;
        background: var(--neon-success);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: 700;
        color: white;
        box-shadow: 0 2px 8px rgba(34, 197, 94, 0.4);
    }

    .day-indicator.cancelled {
        background: linear-gradient(135deg, rgba(231, 76, 60, 0.15) 0%, rgba(231, 76, 60, 0.05) 100%);
        border: 2px solid #e74c3c;
        box-shadow: 
            0 8px 32px rgba(231, 76, 60, 0.2),
            0 4px 16px rgba(0,0,0,0.08),
            inset 0 1px 0 rgba(255,255,255,0.05);
        opacity: 0.7;
    }

    .day-indicator.cancelled::after {
        content: '✕';
        position: absolute;
        top: 8px;
        right: 8px;
        width: 18px;
        height: 18px;
        background: #e74c3c;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: 700;
        color: white;
        box-shadow: 0 2px 8px rgba(231, 76, 60, 0.4);
    }

    .day-indicator.folga {
        background: linear-gradient(135deg, rgba(52, 152, 219, 0.15) 0%, rgba(52, 152, 219, 0.05) 100%);
        border: 2px solid #3498db;
        box-shadow: 
            0 8px 32px rgba(52, 152, 219, 0.2),
            0 4px 16px rgba(0,0,0,0.08),
            inset 0 1px 0 rgba(255,255,255,0.08);
    }

    .day-indicator.folga::after {
        content: '🏖️';
        position: absolute;
        top: 8px;
        right: 8px;
        width: 18px;
        height: 18px;
        background: #3498db;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 8px;
        box-shadow: 0 2px 8px rgba(52, 152, 219, 0.4);
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
        text-shadow: 0 1px 4px rgba(207, 255, 4, 0.3);
    }

    .day-name {
        font-size: 0.58rem;
        font-weight: 600;
        color: var(--text-secondary);
        margin-bottom: 2px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        text-shadow: 0 1px 2px rgba(0,0,0,0.08);
        opacity: 0.85;
        line-height: 0.9;
    }

    .day-indicator.today .day-name {
        color: var(--neon-primary);
        font-weight: 800;
        text-shadow: 0 2px 6px rgba(207, 255, 4, 0.4);
    }

    .day-indicator.completed .day-name,
    .day-indicator.workout-completed .day-name,
    .day-indicator.folga .day-name {
        color: var(--text-primary);
        font-weight: 700;
    }

    .day-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1px;
        flex: 1;
        width: 100%;
        min-height: 0;
    }

    .day-icon {
        width: 13px !important;
        height: 13px !important;
        margin: 1px 0;
        filter: drop-shadow(0 1px 2px rgba(0,0,0,0.08));
        transition: all 0.25s ease;
        opacity: 0.9;
        flex-shrink: 0;
    }

    .day-indicator:hover .day-icon {
        transform: scale(1.1);
        filter: drop-shadow(0 4px 8px rgba(0,0,0,0.15));
    }

    .day-indicator.today .day-icon {
        filter: drop-shadow(0 2px 8px rgba(207, 255, 4, 0.4));
    }

    .day-indicator.completed .day-icon {
        filter: drop-shadow(0 2px 8px rgba(34, 197, 94, 0.4));
    }

    .day-type {
        font-size: 0.52rem;
        font-weight: 500;
        color: var(--text-secondary);
        text-align: center;
        line-height: 0.9;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 100%;
        text-shadow: 0 1px 1px rgba(0,0,0,0.04);
        opacity: 0.9;
        margin-top: 1px;
    }

    .day-indicator.today .day-type {
        color: var(--text-primary);
        font-weight: 700;
        text-shadow: 0 1px 4px rgba(207, 255, 4, 0.2);
    }

    .day-indicator.completed .day-type,
    .day-indicator.workout-completed .day-type,
    .day-indicator.folga .day-type {
        color: var(--text-primary);
        font-weight: 600;
    }

    .day-indicator.cancelled .day-type {
        color: var(--text-muted);
        font-weight: 500;
        opacity: 0.8;
    }

    .empty-day {
        border: 2px dashed var(--border-color);
        background: linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.01) 100%);
        opacity: 0.6;
    }

    .empty-day .day-type {
        color: var(--text-muted);
        font-style: italic;
        font-weight: 500;
    }

    /* Status visual moderno - pequeno indicador no canto */
    .day-status {
        position: absolute;
        bottom: 8px;
        left: 50%;
        transform: translateX(-50%);
        width: 20px;
        height: 3px;
        background: var(--border-color);
        border-radius: 2px;
        transition: all 0.3s ease;
        opacity: 0.5;
    }

    .day-indicator.completed .day-status {
        background: linear-gradient(90deg, var(--neon-success), rgba(34, 197, 94, 0.6));
        box-shadow: 0 1px 4px rgba(34, 197, 94, 0.4);
        opacity: 1;
    }

    .day-indicator.today .day-status {
        background: linear-gradient(90deg, var(--neon-primary), rgba(207, 255, 4, 0.6));
        box-shadow: 0 1px 4px rgba(207, 255, 4, 0.4);
        opacity: 1;
        animation: statusPulse 2s ease-in-out infinite;
    }

    @keyframes statusPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
    }

    .day-indicator.cancelled .day-status {
        background: linear-gradient(90deg, #e74c3c, rgba(231, 76, 60, 0.6));
        box-shadow: 0 1px 4px rgba(231, 76, 60, 0.4);
        opacity: 0.8;
    }

    .day-indicator.folga .day-status {
        background: linear-gradient(90deg, #3498db, rgba(52, 152, 219, 0.6));
        box-shadow: 0 1px 4px rgba(52, 152, 219, 0.4);
        opacity: 1;
    }

    /* Estilos específicos para ícones otimizados */
    .workout-icon {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        stroke: var(--text-secondary);
        fill: none;
        color: var(--text-secondary);
    }

    .day-indicator:hover .workout-icon {
        stroke: var(--text-primary);
        color: var(--text-primary);
        transform: scale(1.1);
    }

    .day-indicator.today .workout-icon {
        stroke: var(--neon-primary);
        color: var(--neon-primary);
        filter: drop-shadow(0 0 8px rgba(207, 255, 4, 0.4));
    }

    .day-indicator.completed .workout-icon {
        stroke: var(--neon-success);
        color: var(--neon-success);
        filter: drop-shadow(0 0 8px rgba(34, 197, 94, 0.4));
    }

    .day-indicator.folga .workout-icon {
        stroke: #3498db;
        color: #3498db;
        filter: drop-shadow(0 0 8px rgba(52, 152, 219, 0.4));
    }

    .day-indicator.cancelled .workout-icon {
        stroke: var(--text-muted);
        color: var(--text-muted);
        opacity: 0.6;
    }

    .rest-icon {
        opacity: 0.8;
    }

    .day-indicator.folga .rest-icon {
        opacity: 1;
        animation: restPulse 4s ease-in-out infinite;
    }

    @keyframes restPulse {
        0%, 100% { 
            opacity: 1;
            transform: scale(1);
        }
        50% { 
            opacity: 0.7;
            transform: scale(0.95);
        }
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

    /* Card de Treino Expandível Remodelado */
    .workout-expandable-card {
        background: var(--bg-card);
        border-radius: var(--radius-lg);
        overflow: hidden;
        margin-top: 24px;
        border: 1px solid var(--border-color);
        transition: var(--transition);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }

    .workout-expandable-card:hover {
        border-color: var(--border-light);
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
    }

    .workout-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 24px;
        cursor: pointer;
        position: relative;
        background: linear-gradient(135deg, var(--bg-card) 0%, rgba(42, 42, 42, 0.5) 100%);
    }

    .workout-header-content {
        display: flex;
        align-items: center;
        gap: 20px;
        flex: 1;
    }

    .workout-type-indicator {
        position: relative;
    }

    .workout-type-badge {
        display: inline-flex;
        align-items: center;
        background: linear-gradient(135deg, var(--accent-green-bg) 0%, rgba(207, 255, 4, 0.05) 100%);
        color: var(--accent-green);
        padding: 8px 16px;
        border-radius: var(--radius-full);
        font-size: 0.875rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        border: 1px solid var(--accent-green-border);
        position: relative;
        z-index: 2;
    }

    .workout-badge-glow {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 100%;
        height: 100%;
        background: var(--accent-green);
        border-radius: var(--radius-full);
        filter: blur(20px);
        opacity: 0.2;
        z-index: 1;
    }

    .workout-header-info {
        flex: 1;
    }

    .workout-card-title {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--text-primary);
        margin: 0 0 4px 0;
        letter-spacing: -0.02em;
    }

    .workout-card-subtitle {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin: 0;
        display: flex;
        align-items: center;
        gap: 4px;
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

    /* Botão de Expansão */
    .expand-button-wrapper {
        position: relative;
    }

    .expand-toggle-btn {
        width: 40px;
        height: 40px;
        border-radius: var(--radius-md);
        background: var(--bg-elevated);
        border: 1px solid var(--border-color);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: var(--transition);
        position: relative;
        overflow: hidden;
    }

    .expand-toggle-btn::before {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at center, var(--accent-green-glow) 0%, transparent 70%);
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    .expand-toggle-btn:hover {
        background: var(--bg-secondary);
        border-color: var(--accent-green-border);
        transform: scale(1.05);
    }

    .expand-toggle-btn:hover::before {
        opacity: 0.3;
    }

    .expand-toggle-btn:active {
        transform: scale(0.95);
    }

    .expand-icon {
        width: 20px;
        height: 20px;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        color: var(--text-secondary);
    }

    .expand-toggle-btn:hover .expand-icon {
        color: var(--accent-green);
    }

    .workout-expandable-card.expanded .expand-icon {
        transform: rotate(180deg);
    }

    /* Conteúdo Expandível */
    .workout-expandable-content {
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .workout-expandable-card.expanded .workout-expandable-content {
        max-height: 2000px;
    }

    .exercises-container {
        padding: 24px;
        border-top: 1px solid var(--border-color);
        background: rgba(24, 24, 24, 0.3);
    }

    /* Estado de Carregamento */
    .exercises-loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px;
        gap: 20px;
    }

    .pulse-loader {
        display: flex;
        gap: 8px;
    }

    .pulse-circle {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--accent-green);
        opacity: 0.3;
        animation: pulse 1.4s ease-in-out infinite;
    }

    .pulse-circle:nth-child(1) {
        animation-delay: 0s;
    }

    .pulse-circle:nth-child(2) {
        animation-delay: 0.2s;
    }

    .pulse-circle:nth-child(3) {
        animation-delay: 0.4s;
    }

    @keyframes pulse {
        0%, 80%, 100% {
            opacity: 0.3;
            transform: scale(1);
        }
        40% {
            opacity: 1;
            transform: scale(1.2);
        }
    }

    .loading-text {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin: 0;
    }

    .workout-action-section {
        padding: 24px 28px 28px;
        position: relative;
        z-index: 1;
    }


    /* Estilos para os exercícios dentro do card expandível */
    .exercises-header {
        margin-bottom: 20px;
        padding-bottom: 16px;
        border-bottom: 1px solid var(--border-color);
    }

    .exercises-header h4 {
        font-size: 1.125rem;
        font-weight: 700;
        color: var(--text-primary);
        margin: 0 0 4px 0;
    }

    .exercises-count {
        font-size: 0.875rem;
        color: var(--text-secondary);
    }

    .exercises-grid {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .exercise-card {
        background: var(--bg-elevated);
        border-radius: var(--radius-md);
        padding: 20px;
        border: 1px solid var(--border-color);
        transition: var(--transition);
    }

    .exercise-card:hover {
        border-color: var(--border-light);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .exercise-header {
        display: flex;
        align-items: flex-start;
        gap: 16px;
        margin-bottom: 16px;
    }

    .exercise-number {
        width: 32px;
        height: 32px;
        background: var(--accent-green-bg);
        color: var(--accent-green);
        border-radius: var(--radius-sm);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 0.875rem;
        flex-shrink: 0;
    }

    .exercise-info {
        flex: 1;
    }

    .exercise-name {
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0 0 4px 0;
    }

    .exercise-muscle {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin: 0;
    }

    .exercise-details {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 12px;
        margin-bottom: 12px;
    }

    .exercise-details > div {
        background: var(--bg-card);
        padding: 12px;
        border-radius: var(--radius-sm);
        border: 1px solid var(--border-color);
    }

    .exercise-details .label {
        display: block;
        font-size: 0.75rem;
        color: var(--text-secondary);
        margin-bottom: 4px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .exercise-details .value {
        display: block;
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary);
    }

    .equipment-tag {
        display: inline-block;
        padding: 4px 8px;
        background: var(--bg-secondary);
        color: var(--text-secondary);
        border-radius: var(--radius-sm);
        font-size: 0.75rem;
        font-weight: 500;
    }

    .exercise-notes {
        background: var(--bg-card);
        padding: 12px;
        border-radius: var(--radius-sm);
        border-left: 3px solid var(--accent-green);
        font-size: 0.875rem;
        color: var(--text-secondary);
        line-height: 1.5;
    }

    .exercise-notes strong {
        color: var(--text-primary);
    }

    .exercises-footer {
        margin-top: 20px;
        padding-top: 16px;
        border-top: 1px solid var(--border-color);
        text-align: center;
    }

    .rm-info {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin: 0;
    }

    /* Mensagem quando não há exercícios */
    .no-exercises-message {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 20px;
        text-align: center;
        gap: 16px;
    }

    .no-exercises-message .message-icon {
        width: 48px;
        height: 48px;
        color: var(--text-secondary);
        opacity: 0.5;
    }

    .no-exercises-message .message-icon svg {
        width: 100%;
        height: 100%;
    }

    .no-exercises-message.info .message-icon {
        color: var(--accent-green);
        opacity: 0.7;
    }

    .no-exercises-message.warning .message-icon {
        color: #f59e0b;
        opacity: 0.7;
    }

    .no-exercises-message.error .message-icon {
        color: var(--neon-danger);
        opacity: 0.7;
    }

    .message-text {
        font-size: 1rem;
        color: var(--text-secondary);
        margin: 0;
        max-width: 300px;
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
            gap: 6px;
            padding: 8px;
        }

        .day-indicator {
            padding: 5px 2px 3px;
            min-height: 58px;
            border-radius: 11px;
            aspect-ratio: 1;
            box-shadow: 
                0 1px 6px rgba(0,0,0,0.06),
                0 0.5px 1px rgba(0,0,0,0.03),
                inset 0 0.5px 0 rgba(255,255,255,0.015);
        }

        .day-indicator:hover {
            transform: translateY(-1px) scale(1.01);
            box-shadow: 
                0 4px 16px rgba(0,0,0,0.10),
                0 2px 6px rgba(0,0,0,0.06),
                inset 0 1px 0 rgba(255,255,255,0.04);
        }

        .day-indicator.completed::after,
        .day-indicator.cancelled::after,
        .day-indicator.folga::after {
            width: 12px;
            height: 12px;
            top: 4px;
            right: 4px;
            font-size: 6px;
        }

        .day-name {
            font-size: 0.52rem;
            margin-bottom: 1px;
            font-weight: 600;
            letter-spacing: 0.03em;
            line-height: 0.85;
        }

        .day-icon {
            width: 9px !important;
            height: 9px !important;
            margin: 0.5px 0;
        }

        .day-type {
            font-size: 0.46rem;
            font-weight: 500;
            line-height: 0.85;
            letter-spacing: 0.02em;
        }

        .day-status {
            width: 12px;
            height: 2px;
            bottom: 4px;
        }

        .week-selector {
            padding: 12px 16px;
            border-radius: 14px;
            margin-bottom: 20px;
        }

        .week-nav {
            width: 36px !important;
            height: 36px !important;
            border-radius: 10px !important;
        }

        .week-nav svg {
            width: 14px !important;
            height: 14px !important;
        }

        .week-number {
            font-size: 0.95rem;
            font-weight: 700;
        }

        .week-status {
            font-size: 0.65rem;
            padding: 3px 8px;
            border-radius: 8px;
            letter-spacing: 0.04em;
        }

        .current-week-info {
            min-width: 100px;
            gap: 3px;
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

    /* Otimização específica para iPhone 13 e dispositivos similares (390px) */
    @media (max-width: 390px) {
        .week-indicators {
            gap: 4px;
            padding: 6px;
        }

        .day-indicator {
            padding: 4px 2px 2px;
            min-height: 56px;
            border-radius: 9px;
        }

        .day-indicator.today {
            transform: scale(1.08);
        }

        .day-indicator.completed::after,
        .day-indicator.cancelled::after,
        .day-indicator.folga::after {
            width: 8px;
            height: 8px;
            top: 2px;
            right: 2px;
            font-size: 4px;
        }

        .day-name {
            font-size: 0.48rem;
            margin-bottom: 1px;
            font-weight: 600;
            line-height: 0.8;
        }

        .day-icon {
            width: 8px !important;
            height: 8px !important;
            margin: 0.5px 0;
        }

        .day-type {
            font-size: 0.42rem;
            font-weight: 500;
            line-height: 0.8;
        }

        .day-status {
            width: 10px;
            height: 1.5px;
            bottom: 3px;
        }

        .week-selector {
            padding: 10px 14px;
            border-radius: 12px;
            margin-bottom: 18px;
            gap: 12px;
        }

        .week-nav {
            width: 32px !important;
            height: 32px !important;
            border-radius: 8px !important;
        }

        .week-nav svg {
            width: 12px !important;
            height: 12px !important;
        }

        .week-number {
            font-size: 0.9rem;
            font-weight: 700;
        }

        .week-status {
            font-size: 0.6rem;
            padding: 2px 6px;
            border-radius: 6px;
        }

        .current-week-info {
            min-width: 90px;
            gap: 2px;
        }
    }

    /* Otimização para iPhone SE e telas extra pequenas (375px e menor) */
    @media (max-width: 375px) {
        .week-indicators {
            gap: 4px;
        }

        .day-indicator {
            padding: 3px 1px 2px;
            min-height: 52px;
            border-radius: 7px;
        }

        .day-indicator.today {
            transform: scale(1.08);
        }

        .day-indicator.completed::after,
        .day-indicator.cancelled::after,
        .day-indicator.folga::after {
            width: 7px;
            height: 7px;
            top: 1px;
            right: 1px;
            font-size: 3px;
        }

        .day-name {
            font-size: 0.44rem;
            margin-bottom: 0.5px;
            font-weight: 600;
            line-height: 0.75;
        }

        .day-icon {
            width: 7px !important;
            height: 7px !important;
            margin: 0.5px 0;
        }

        .day-type {
            font-size: 0.38rem;
            font-weight: 500;
            line-height: 0.75;
        }

        .day-status {
            width: 8px;
            height: 1px;
            bottom: 2px;
        }

        .week-selector {
            padding: 8px 12px;
            border-radius: 10px;
            margin-bottom: 16px;
            gap: 10px;
        }

        .week-nav {
            width: 28px !important;
            height: 28px !important;
            border-radius: 6px !important;
        }

        .week-nav svg {
            width: 10px !important;
            height: 10px !important;
        }

        .week-number {
            font-size: 0.85rem;
            font-weight: 700;
        }

        .week-status {
            font-size: 0.55rem;
            padding: 1px 5px;
            border-radius: 5px;
        }

        .current-week-info {
            min-width: 80px;
            gap: 1px;
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

    /* Otimizações para telas muito pequenas (iPhone SE, iPhone 13 mini e menores) */
    @media (max-width: 375px) {
        .week-indicators {
            gap: 4px;
            padding: 0;
        }

        .day-indicator {
            padding: 8px 2px 6px;
            min-height: 60px;
            border-radius: 10px;
            font-size: 0.75rem;
        }

        .day-indicator .day-name {
            font-size: 0.65rem;
            font-weight: 600;
            margin-bottom: 2px;
        }

        .day-indicator .day-label {
            font-size: 0.7rem;
            margin-bottom: 1px;
        }

        .day-indicator .day-type {
            font-size: 0.6rem;
            line-height: 1.1;
            max-width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .day-indicator .day-status {
            font-size: 0.55rem;
            padding: 1px 4px;
            border-radius: 6px;
        }

        .day-indicator .day-icon,
        .day-indicator .workout-icon,
        .day-indicator .rest-icon {
            width: 14px;
            height: 14px;
        }

        .day-indicator.completed::after,
        .day-indicator.cancelled::after,
        .day-indicator.folga::after {
            width: 10px;
            height: 10px;
            top: 3px;
            right: 3px;
            font-size: 5px;
        }

        .day-indicator:hover {
            transform: translateY(-1px) scale(1.005);
        }

        /* Ajustar containers para telas muito pequenas */
        .home-content {
            padding: 8px 12px 16px 12px;
        }

        .week-overview {
            padding: 0 12px 16px;
        }

        .training-plan {
            padding: 12px 12px 16px 12px;
        }

        .home-header {
            padding: 16px 12px;
        }
    }

    /* Otimizações para telas extra pequenas (Android antigos, iPhone 5/SE 1ª geração) */
    @media (max-width: 360px) {
        .week-indicators {
            gap: 2px;
        }

        .day-indicator {
            padding: 6px 1px 4px;
            min-height: 56px;
            border-radius: 8px;
        }

        .day-indicator .day-name {
            font-size: 0.6rem;
            margin-bottom: 1px;
        }

        .day-indicator .day-label {
            font-size: 0.65rem;
            margin-bottom: 0;
        }

        .day-indicator .day-type {
            font-size: 0.55rem;
            line-height: 1.0;
        }

        .day-indicator .day-status {
            font-size: 0.5rem;
            padding: 1px 3px;
            border-radius: 4px;
        }

        .day-indicator .day-icon,
        .day-indicator .workout-icon,
        .day-indicator .rest-icon {
            width: 12px;
            height: 12px;
        }

        .day-indicator.completed::after,
        .day-indicator.cancelled::after,
        .day-indicator.folga::after {
            width: 8px;
            height: 8px;
            top: 2px;
            right: 2px;
            font-size: 4px;
        }

        /* Reduzir ainda mais os paddings dos containers */
        .home-content {
            padding: 6px 10px 14px 10px;
        }

        .week-overview {
            padding: 0 10px 14px;
        }

        .training-plan {
            padding: 10px 10px 14px 10px;
        }

        .home-header {
            padding: 14px 10px;
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

    /* ========== MOBILE OPTIMIZATIONS (icons hidden) ========== */
    @media (max-width: 420px) {
        .day-indicator .day-icon,
        .day-indicator .workout-icon,
        .day-indicator .rest-icon {
            display: none !important;
        }
        .day-content {
            gap: 2px;
        }
        .day-indicator {
            padding: 5px 2px 4px;
        }
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
        
        console.log('[templates/home.js] ✓ Home inicializada com sucesso');
        
    } catch (error) {
        console.error('[templates/home.js] ✗ Erro ao inicializar home:', error);
    }
}

// REMOVIDO: toggleWorkoutCard - delegado para workoutToggle.js
// A função global window.toggleWorkoutCard é definida em workoutToggle.js

// Disponibilizar funções globalmente
window.inicializarHome = inicializarHome;
window.initializeHomeAnimations = initializeHomeAnimations;

// Fallback: registrar window.iniciarTreino caso ainda não exista
if (!window.iniciarTreino) {
    window.iniciarTreino = async () => {
        try {
            // Se já existir o manager carregado, apenas iniciar
            if (window.workoutExecutionManager?.iniciarTreino) {
                return window.workoutExecutionManager.iniciarTreino();
            }
            // Importar módulo de execução dinamicamente
            const module = await import('../feature/workoutExecution.js');
            const manager = module.workoutExecutionManager || module.default || module;
            if (manager?.iniciarTreino) {
                window.workoutExecutionManager = manager;
                return manager.iniciarTreino();
            }
            console.error('[home.js] ❌ Não foi possível carregar workoutExecutionManager');
        } catch (err) {
            console.error('[home.js] ❌ Erro ao importar workoutExecution.js:', err);
            if (window.showNotification) {
                window.showNotification('Erro ao carregar tela de treino', 'error');
            }
        }
    };
}