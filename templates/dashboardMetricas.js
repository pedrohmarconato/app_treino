// Dashboard de Métricas - Template da página
// IMPORTANTE: Tela experimental, sem integração com funcionalidades vitais

export const dashboardMetricasTemplate = () => `
    <div id="dashboard-metricas-screen" class="screen">
        <!-- Header do Dashboard -->
        <div class="dashboard-header">
            <div class="header-content">
                <button class="btn-icon back-btn" onclick="window.voltarParaHome()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M15 18l-6-6 6-6"/>
                    </svg>
                </button>
                <h1 class="dashboard-title">Dashboard de Métricas</h1>
            </div>
        </div>
        
        <!-- Conteúdo do Dashboard -->
        <div class="dashboard-content">
            <!-- Overview Cards -->
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-icon">💪</div>
                    <div class="metric-value" id="total-treinos">0</div>
                    <div class="metric-label">Treinos Realizados</div>
                    <div class="metric-trend positive">+0% este mês</div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-icon">📊</div>
                    <div class="metric-value" id="percentual-conclusao">0%</div>
                    <div class="metric-label">Taxa de Conclusão</div>
                    <div class="metric-trend">Últimas 4 semanas</div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-icon">🏋️</div>
                    <div class="metric-value" id="peso-total">0kg</div>
                    <div class="metric-label">Peso Total Levantado</div>
                    <div class="metric-trend positive">+0kg vs semana anterior</div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-icon">⏱️</div>
                    <div class="metric-value" id="tempo-total">0h</div>
                    <div class="metric-label">Tempo Total de Treino</div>
                    <div class="metric-trend">Média: 0min/treino</div>
                </div>
            </div>
            
            <!-- Gráfico de Progresso Semanal -->
            <div class="chart-container">
                <h2 class="section-title">Progresso Semanal</h2>
                <div class="chart-wrapper">
                    <div class="bar-chart" id="weekly-progress-chart">
                        <!-- Barras serão inseridas dinamicamente -->
                    </div>
                    <div class="chart-legend">
                        <div class="legend-item">
                            <span class="legend-color concluido"></span>
                            <span>Concluído</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color planejado"></span>
                            <span>Planejado</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Estatísticas por Grupo Muscular -->
            <div class="muscle-stats-container">
                <h2 class="section-title">Distribuição por Grupo Muscular</h2>
                <div class="muscle-stats-grid" id="muscle-stats">
                    <!-- Estatísticas serão inseridas dinamicamente -->
                </div>
            </div>
            
            <!-- Evolução de 1RM -->
            <div class="rm-evolution-container">
                <h2 class="section-title">Evolução de Força (1RM)</h2>
                <div class="rm-cards-grid" id="rm-evolution">
                    <!-- Cards de evolução serão inseridos dinamicamente -->
                </div>
            </div>
            
            <!-- Histórico Recente -->
            <div class="recent-history-container">
                <h2 class="section-title">Últimos Treinos</h2>
                <div class="history-list" id="recent-workouts">
                    <!-- Lista será inserida dinamicamente -->
                </div>
            </div>
        </div>
        
        <!-- Loading State -->
        <div class="dashboard-loading" id="dashboard-loading">
            <div class="loading-spinner"></div>
            <p>Carregando métricas...</p>
        </div>
    </div>
    
    <style>
    /* Dashboard Styles */
    #dashboard-metricas-screen {
        min-height: 100vh;
        background: var(--bg-primary);
        color: var(--text-primary);
    }
    
    .dashboard-header {
        background: var(--dark-gradient);
        padding: 20px;
        position: sticky;
        top: 0;
        z-index: 100;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    }
    
    .dashboard-header .header-content {
        display: flex;
        align-items: center;
        gap: 16px;
    }
    
    .dashboard-title {
        font-size: 1.5rem;
        font-weight: 700;
        margin: 0;
        background: linear-gradient(135deg, #fff 0%, var(--neon-primary) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    
    .dashboard-content {
        padding: 20px;
        max-width: 1200px;
        margin: 0 auto;
    }
    
    /* Metrics Grid */
    .metrics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
        margin-bottom: 32px;
    }
    
    .metric-card {
        background: var(--bg-card);
        border-radius: 16px;
        padding: 24px;
        text-align: center;
        border: 1px solid var(--border-color);
        transition: all 0.3s ease;
    }
    
    .metric-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        border-color: var(--neon-primary);
    }
    
    .metric-icon {
        font-size: 2.5rem;
        margin-bottom: 12px;
    }
    
    .metric-value {
        font-size: 2rem;
        font-weight: 700;
        color: var(--neon-primary);
        margin-bottom: 8px;
    }
    
    .metric-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin-bottom: 8px;
    }
    
    .metric-trend {
        font-size: 0.75rem;
        color: var(--text-muted);
    }
    
    .metric-trend.positive {
        color: var(--accent-green);
    }
    
    .metric-trend.negative {
        color: var(--neon-danger);
    }
    
    /* Chart Container */
    .chart-container {
        background: var(--bg-card);
        border-radius: 16px;
        padding: 24px;
        margin-bottom: 32px;
        border: 1px solid var(--border-color);
    }
    
    .section-title {
        font-size: 1.25rem;
        font-weight: 600;
        margin-bottom: 20px;
        color: var(--text-primary);
    }
    
    .chart-wrapper {
        position: relative;
        height: 300px;
        margin-bottom: 20px;
    }
    
    .bar-chart {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        height: 100%;
        gap: 8px;
        padding: 0 8px;
    }
    
    .bar-column {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
    }
    
    .bar-wrapper {
        position: relative;
        width: 100%;
        height: 250px;
        display: flex;
        align-items: flex-end;
    }
    
    .bar {
        width: 100%;
        background: var(--neon-primary);
        border-radius: 8px 8px 0 0;
        transition: height 0.5s ease;
        position: relative;
    }
    
    .bar.planejado {
        background: var(--bg-secondary);
        border: 2px solid var(--neon-primary);
    }
    
    .bar-value {
        position: absolute;
        top: -20px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-primary);
    }
    
    .bar-label {
        font-size: 0.75rem;
        color: var(--text-secondary);
        text-align: center;
    }
    
    .chart-legend {
        display: flex;
        justify-content: center;
        gap: 24px;
    }
    
    .legend-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.875rem;
        color: var(--text-secondary);
    }
    
    .legend-color {
        width: 16px;
        height: 16px;
        border-radius: 4px;
    }
    
    .legend-color.concluido {
        background: var(--neon-primary);
    }
    
    .legend-color.planejado {
        background: var(--bg-secondary);
        border: 2px solid var(--neon-primary);
    }
    
    /* Muscle Stats */
    .muscle-stats-container {
        background: var(--bg-card);
        border-radius: 16px;
        padding: 24px;
        margin-bottom: 32px;
        border: 1px solid var(--border-color);
    }
    
    .muscle-stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 16px;
    }
    
    .muscle-stat-item {
        text-align: center;
        padding: 16px;
        background: var(--bg-secondary);
        border-radius: 12px;
        transition: all 0.3s ease;
    }
    
    .muscle-stat-item:hover {
        background: var(--bg-primary);
        border: 1px solid var(--neon-primary);
    }
    
    .muscle-icon {
        font-size: 2rem;
        margin-bottom: 8px;
    }
    
    .muscle-name {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin-bottom: 4px;
    }
    
    .muscle-count {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--neon-primary);
    }
    
    /* RM Evolution */
    .rm-evolution-container {
        background: var(--bg-card);
        border-radius: 16px;
        padding: 24px;
        margin-bottom: 32px;
        border: 1px solid var(--border-color);
    }
    
    .rm-cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
    }
    
    .rm-card {
        background: var(--bg-secondary);
        border-radius: 12px;
        padding: 16px;
        text-align: center;
    }
    
    .exercise-name {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin-bottom: 8px;
    }
    
    .rm-current {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--neon-primary);
        margin-bottom: 4px;
    }
    
    .rm-change {
        font-size: 0.75rem;
        color: var(--accent-green);
    }
    
    .rm-change.negative {
        color: var(--neon-danger);
    }
    
    /* Recent History */
    .recent-history-container {
        background: var(--bg-card);
        border-radius: 16px;
        padding: 24px;
        border: 1px solid var(--border-color);
    }
    
    .history-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    
    .history-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px;
        background: var(--bg-secondary);
        border-radius: 12px;
        transition: all 0.3s ease;
    }
    
    .history-item:hover {
        background: var(--bg-primary);
        transform: translateX(4px);
    }
    
    .history-info {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    
    .history-icon {
        font-size: 1.5rem;
    }
    
    .history-details h4 {
        margin: 0 0 4px 0;
        font-size: 0.95rem;
        color: var(--text-primary);
    }
    
    .history-date {
        font-size: 0.75rem;
        color: var(--text-secondary);
    }
    
    .history-stats {
        text-align: right;
    }
    
    .history-duration {
        font-size: 0.875rem;
        color: var(--text-secondary);
    }
    
    .history-exercises {
        font-size: 0.75rem;
        color: var(--text-muted);
    }
    
    /* Loading State */
    .dashboard-loading {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: var(--bg-primary);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 200;
    }
    
    .dashboard-loading.hidden {
        display: none;
    }
    
    .loading-spinner {
        width: 48px;
        height: 48px;
        border: 3px solid var(--bg-secondary);
        border-top-color: var(--neon-primary);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 16px;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    
    /* Responsive */
    @media (max-width: 768px) {
        .dashboard-content {
            padding: 16px;
        }
        
        .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
        }
        
        .metric-card {
            padding: 16px;
        }
        
        .metric-icon {
            font-size: 2rem;
        }
        
        .metric-value {
            font-size: 1.5rem;
        }
        
        .chart-wrapper {
            height: 250px;
        }
        
        .muscle-stats-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }
    
    @media (max-width: 480px) {
        .metrics-grid {
            grid-template-columns: 1fr;
        }
        
        .dashboard-title {
            font-size: 1.25rem;
        }
        
        .section-title {
            font-size: 1.1rem;
        }
    }
    </style>
`;

// Exportar template
export default dashboardMetricasTemplate;

// Também disponibilizar globalmente para compatibilidade
if (typeof window !== 'undefined') {
    window.dashboardMetricasTemplate = dashboardMetricasTemplate;
}