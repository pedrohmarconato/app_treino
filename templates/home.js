// templates/home.js - Template da tela home COMPLETO
import homeService from '../services/homeService.js';

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
                    <!-- Botão Iniciar Treino (Topo - Apenas quando reduzido) -->
                    <div class="top-action-area" id="top-action-area">
                        <button class="btn-primary workout-start-btn-top" id="start-workout-btn" onclick="window.abrirPlanejamentoParaUsuarioAtual()">
                            <span id="btn-text">Iniciar Treino</span>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M5 12h14M12 5l7 7-7 7"/>
                            </svg>
                        </button>
                    </div>

                    <!-- Cabeçalho Sempre Visível -->
                    <div class="workout-header-compact">
                        <div class="workout-info-compact">
                            <span class="workout-type" id="workout-type">Carregando...</span>
                            <h3 id="workout-name">Preparando seu treino</h3>
                        </div>
                        <button class="expand-toggle" id="workout-toggle" onclick="toggleWorkoutCard()">
                            <svg class="expand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M6 9l6 6 6-6"/>
                            </svg>
                        </button>
                    </div>
                    
                    
                    <!-- Conteúdo Expansível -->
                    <div class="expandable-content" id="expandable-content" style="display: none;">
                        <div class="workout-details">
                            <div class="workout-meta">
                                <span id="workout-exercises">0 exercícios</span>
                                <span>•</span>
                                <span id="workout-duration">~30min</span>
                            </div>
                        </div>
                    

                    <!-- Exercícios de Hoje Integrados -->
                    <div class="exercises-preview-integrated" id="exercises-preview">
                        <div class="exercises-header">
                            <h4>Exercícios de Hoje</h4>
                            <button class="btn-expand" id="expand-exercises" onclick="toggleExercises()">
                                <span class="expand-text">Ver treino completo</span>
                                <svg class="expand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M6 9l6 6 6-6"/>
                                </svg>
                            </button>
                        </div>
                        <div class="exercises-list" id="exercises-list">
                            <!-- Preenchido dinamicamente com exercícios -->
                        </div>
                        <div class="exercises-expanded" id="exercises-expanded" style="display: none;">
                            <!-- Treino completo expandido -->
                        </div>
                    </div>

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
            
            </div> <!-- Fechamento training-plan -->

        </div> <!-- Fechamento home-content -->
    </div>
`;

// Estilos específicos da tela home - ATUALIZADOS E MELHORADOS
export const homeStyles = `
    /* Home Header - ESPAÇAMENTO OTIMIZADO */
    .home-header {
        background: linear-gradient(135deg, var(--bg-secondary) 0%, #1e1e1e 100%);
        padding: 16px 24px; /* Reduzido padding de 20px para 16px */
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
        background: var(--bg-secondary);
        border-radius: var(--radius-lg);
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
        background: var(--accent-green) !important;
        border-color: var(--accent-green) !important;
    }

    .week-nav:hover svg {
        stroke: var(--bg-primary) !important;
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

    /* Week Indicators - Design System Neon - ESPAÇAMENTO OTIMIZADO */
    .week-indicators {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 12px;
        margin-bottom: 16px; /* Reduzido de 24px para 16px */
    }

    .day-indicator {
        background: #1a1a1a;
        border-radius: var(--radius-lg);
        padding: 16px 12px;
        text-align: center;
        transition: all 0.3s ease;
        border: 2px solid #333;
        position: relative;
        overflow: hidden;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
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

    /* Estados dos Dias - Sistema Neon */
    .day-indicator.today {
        border-color: #00ff00;
        background: rgba(0, 255, 0, 0.1);
        box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
    }

    .day-indicator.completed {
        background: rgba(0, 255, 0, 0.15);
        border-color: #00ff00;
        color: #00ff00;
        box-shadow: 0 0 15px rgba(0, 255, 0, 0.4);
    }

    .day-indicator.cancelled {
        background: rgba(255, 0, 64, 0.15);
        border-color: #ff0040;
        color: #ff0040;
        box-shadow: 0 0 15px rgba(255, 0, 64, 0.4);
    }

    .day-indicator.cancelled .day-type {
        text-decoration: line-through;
        opacity: 0.8;
    }

    .day-indicator.pending {
        background: #1a1a1a;
        border-color: #333;
        color: #999;
    }

    .day-indicator:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(0, 255, 0, 0.2);
    }

    .day-name {
        font-size: 0.8rem;
        font-weight: 700;
        color: #fff;
        margin-bottom: 6px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        position: relative;
        z-index: 1;
    }

    .day-indicator.completed .day-name {
        color: #00ff00;
        text-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
    }

    .day-indicator.cancelled .day-name {
        color: #ff0040;
        text-shadow: 0 0 10px rgba(255, 0, 64, 0.5);
    }

    .day-indicator.pending .day-name {
        color: #999;
    }

    .day-type {
        font-size: 0.75rem;
        font-weight: 500;
        color: #fff;
        position: relative;
        z-index: 1;
        text-align: center;
        margin-top: 4px;
        line-height: 1.2;
    }

    .day-indicator.completed .day-type {
        color: #00ff00;
        font-weight: 600;
    }

    .day-indicator.cancelled .day-type {
        color: #ff0040;
        font-weight: 600;
    }

    .day-indicator.pending .day-type {
        color: #666;
        font-style: italic;
    }

    .empty-day {
        border: 2px dashed var(--border-color);
        background: transparent;
    }

    .empty-day .day-type {
        color: var(--text-secondary);
        font-style: italic;
    }

    /* Current Workout Card - Expansível */
    .current-workout-card {
        background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%);
        border-radius: var(--radius-lg);
        border: 2px solid #333;
        position: relative;
        overflow: hidden;
        transition: all 0.3s ease;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
    }

    .expandable-card {
        cursor: pointer;
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

// Disponibilizar função globalmente
window.inicializarHome = inicializarHome;