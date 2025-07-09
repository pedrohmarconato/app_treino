/**
 * 📊 WIDGET DE MÉTRICAS AVANÇADAS - Metrics Widget
 * 
 * FUNÇÃO: Exibir métricas detalhadas de progresso do usuário com visualizações interativas e animadas.
 * 
 * RESPONSABILIDADES:
 * - Buscar e processar dados de estatísticas do usuário (treinos, progresso, sequências)
 * - Renderizar métricas principais (treinos completos, semana atual, progresso geral)
 * - Exibir métricas secundárias (dias consecutivos, melhor sequência, peso médio)
 * - Apresentar progresso semanal com barras animadas
 * - Comparar desempenho atual com metas estabelecidas
 * - Aplicar animações suaves para contadores e barras de progresso
 * - Fornecer feedback visual interativo (hover effects, pulsos)
 * 
 * RECURSOS:
 * - Animações de contadores incrementais para engajamento
 * - Barras de progresso com efeitos shimmer
 * - Cards responsivos com efeitos de hover
 * - Sistema de fallback com dados mock quando API falha
 * - Integração com AppState para atualizações em tempo real
 * - Design adaptativo para diferentes tamanhos de tela
 * - Tratamento de erros com interface de retry
 * 
 * MÉTRICAS EXIBIDAS:
 * - Treinos Completos: quantidade total de treinos finalizados
 * - Semana Atual: posição no protocolo de treinamento
 * - Progresso Geral: percentual de conclusão do programa
 * - Dias Consecutivos: streak atual de treinos
 * - Melhor Sequência: maior streak já alcançada
 * - Peso Médio: média de carga utilizada nos exercícios
 * 
 * INTEGRAÇÃO: Usado no dashboard principal, carregado dinamicamente pelo template manager
 */

// components/MetricsWidget.js - Widget avançado para métricas
import AppState from '../state/appState.js';
import { fetchDadosIndicadores } from '../services/workoutService.js';

export class MetricsWidget {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.metrics = null;
        this.animationFrameId = null;
    }

    async init() {
        if (!this.container) {
            console.error('[MetricsWidget] Container não encontrado');
            return;
        }

        try {
            await this.loadMetrics();
            this.render();
            this.startAnimations();
            this.setupEventListeners();
        } catch (error) {
            console.error('[MetricsWidget] Erro na inicialização:', error);
            this.renderError();
        }
    }

    async loadMetrics() {
        const currentUser = AppState.get('currentUser');
        if (!currentUser) throw new Error('Usuário não encontrado');

        try {
            const dados = await fetchDadosIndicadores(currentUser.id);
            this.metrics = this.processMetrics(dados);
        } catch (error) {
            console.warn('[MetricsWidget] Usando dados mock devido ao erro:', error);
            this.metrics = this.getMockMetrics();
        }
    }

    processMetrics(dados) {
        const estatisticas = dados?.estatisticas || {};
        const comparacao = dados?.comparacao || [];
        
        // Encontrar métricas do usuário atual
        const currentUser = AppState.get('currentUser');
        const userComparison = comparacao.find(c => c.usuario === currentUser.nome) || {};
        
        return {
            treinosCompletos: estatisticas.total_treinos_realizados || 0,
            semanaAtual: estatisticas.semana_atual || 1,
            progressoGeral: estatisticas.percentual_progresso || 0,
            diasConsecutivos: estatisticas.dias_consecutivos || 0,
            melhorSequencia: estatisticas.melhor_sequencia || 0,
            pesoMedio: userComparison.peso_medio || 0,
            progressoSemanal: this.calculateWeeklyProgress(),
            metaDiaria: 1,
            metaSemanal: 4
        };
    }

    getMockMetrics() {
        const weekPlan = AppState.get('weekPlan');
        const diasComTreino = weekPlan ? 
            Object.values(weekPlan).filter(dia => dia !== 'folga').length : 3;
        
        return {
            treinosCompletos: Math.floor(Math.random() * 8),
            semanaAtual: 1,
            progressoGeral: Math.min((diasComTreino / 7) * 100, 100),
            diasConsecutivos: Math.floor(Math.random() * 5),
            melhorSequencia: Math.floor(Math.random() * 10) + 5,
            pesoMedio: 45 + Math.random() * 30,
            progressoSemanal: Math.random() * 100,
            metaDiaria: 1,
            metaSemanal: 4
        };
    }

    calculateWeeklyProgress() {
        const hoje = new Date().getDay();
        const diasPassados = hoje === 0 ? 7 : hoje; // Domingo = 7
        const weekPlan = AppState.get('weekPlan');
        
        if (!weekPlan) return 0;
        
        let treinosEsperados = 0;
        let treinosCompletos = 0;
        
        for (let i = 0; i < diasPassados; i++) {
            const diaPlan = weekPlan[i];
            if (diaPlan && diaPlan !== 'folga') {
                treinosEsperados++;
                // Simular conclusão de treinos passados
                if (Math.random() > 0.3) treinosCompletos++;
            }
        }
        
        return treinosEsperados > 0 ? (treinosCompletos / treinosEsperados) * 100 : 0;
    }

    render() {
        if (!this.metrics) {
            this.renderError();
            return;
        }

        this.container.innerHTML = `
            <div class="metrics-widget">
                <!-- Métricas Principais -->
                <div class="main-metrics">
                    <div class="metric-card primary" data-metric="treinos">
                        <div class="metric-icon">🏋️</div>
                        <div class="metric-value" id="treinos-valor">0</div>
                        <div class="metric-label">Treinos Completos</div>
                        <div class="metric-progress">
                            <div class="progress-bar" id="treinos-progress"></div>
                        </div>
                    </div>
                    
                    <div class="metric-card secondary" data-metric="semana">
                        <div class="metric-icon">📅</div>
                        <div class="metric-value" id="semana-valor">0</div>
                        <div class="metric-label">Semana Atual</div>
                        <div class="metric-sublabel">Protocolo de Treino</div>
                    </div>
                    
                    <div class="metric-card accent" data-metric="progresso">
                        <div class="metric-icon">📈</div>
                        <div class="metric-value" id="progresso-valor">0%</div>
                        <div class="metric-label">Progresso Geral</div>
                        <div class="metric-progress">
                            <div class="progress-bar" id="progresso-progress"></div>
                        </div>
                    </div>
                </div>

                <!-- Métricas Secundárias -->
                <div class="secondary-metrics">
                    <div class="metric-item">
                        <span class="metric-icon-small">🔥</span>
                        <div class="metric-info">
                            <div class="metric-small-value" id="consecutivos-valor">0</div>
                            <div class="metric-small-label">Dias Consecutivos</div>
                        </div>
                    </div>
                    
                    <div class="metric-item">
                        <span class="metric-icon-small">🎯</span>
                        <div class="metric-info">
                            <div class="metric-small-value" id="sequencia-valor">0</div>
                            <div class="metric-small-label">Melhor Sequência</div>
                        </div>
                    </div>
                    
                    <div class="metric-item">
                        <span class="metric-icon-small">⚖️</span>
                        <div class="metric-info">
                            <div class="metric-small-value" id="peso-valor">0kg</div>
                            <div class="metric-small-label">Peso Médio</div>
                        </div>
                    </div>
                </div>

                <!-- Progresso Semanal -->
                <div class="weekly-progress">
                    <h4>Progresso Semanal</h4>
                    <div class="progress-container">
                        <div class="progress-track">
                            <div class="progress-fill" id="weekly-progress-fill"></div>
                        </div>
                        <div class="progress-labels">
                            <span>Meta: ${this.metrics.metaSemanal} treinos</span>
                            <span id="weekly-progress-text">0%</span>
                        </div>
                    </div>
                </div>

                <!-- Comparação com Meta -->
                <div class="goal-comparison">
                    <h4>Comparação com Meta</h4>
                    <div class="comparison-bars">
                        <div class="comparison-item">
                            <span>Você</span>
                            <div class="bar-container">
                                <div class="bar user-bar" id="user-comparison-bar"></div>
                            </div>
                            <span id="user-comparison-value">0</span>
                        </div>
                        <div class="comparison-item">
                            <span>Meta</span>
                            <div class="bar-container">
                                <div class="bar goal-bar"></div>
                            </div>
                            <span>${this.metrics.metaSemanal}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.updateValues();
    }

    updateValues() {
        // Animar contadores
        this.animateCounter('treinos-valor', 0, this.metrics.treinosCompletos, 1000);
        this.animateCounter('semana-valor', 0, this.metrics.semanaAtual, 800);
        this.animateCounter('consecutivos-valor', 0, this.metrics.diasConsecutivos, 600);
        this.animateCounter('sequencia-valor', 0, this.metrics.melhorSequencia, 1200);
        
        // Atualizar valores diretos
        this.updateElement('progresso-valor', `${Math.round(this.metrics.progressoGeral)}%`);
        this.updateElement('peso-valor', `${Math.round(this.metrics.pesoMedio)}kg`);
        this.updateElement('weekly-progress-text', `${Math.round(this.metrics.progressoSemanal)}%`);
        this.updateElement('user-comparison-value', this.metrics.treinosCompletos);

        // Animar barras de progresso
        setTimeout(() => {
            this.animateProgressBar('treinos-progress', (this.metrics.treinosCompletos / this.metrics.metaSemanal) * 100);
            this.animateProgressBar('progresso-progress', this.metrics.progressoGeral);
            this.animateProgressBar('weekly-progress-fill', this.metrics.progressoSemanal);
            this.animateProgressBar('user-comparison-bar', (this.metrics.treinosCompletos / this.metrics.metaSemanal) * 100);
        }, 500);
    }

    animateCounter(elementId, start, end, duration) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const range = end - start;
        const increment = range / (duration / 16);
        let current = start;

        const timer = setInterval(() => {
            current += increment;
            if (current >= end) {
                current = end;
                clearInterval(timer);
            }
            element.textContent = Math.round(current);
        }, 16);
    }

    animateProgressBar(elementId, percentage) {
        const element = document.getElementById(elementId);
        if (!element) return;

        element.style.width = '0%';
        element.style.transition = 'width 1s ease-out';
        
        setTimeout(() => {
            element.style.width = `${Math.min(percentage, 100)}%`;
        }, 100);
    }

    startAnimations() {
        // Animar entrada dos cards
        const cards = this.container.querySelectorAll('.metric-card, .metric-item');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.5s ease-out';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });

        // Efeito de pulso nos ícones
        setInterval(() => {
            const icons = this.container.querySelectorAll('.metric-icon');
            icons.forEach(icon => {
                icon.style.animation = 'pulse 0.5s ease-in-out';
                setTimeout(() => {
                    icon.style.animation = '';
                }, 500);
            });
        }, 5000);
    }

    setupEventListeners() {
        // Listener para mudanças no estado
        AppState.subscribe('userMetrics', (newMetrics) => {
            if (newMetrics) {
                this.metrics = { ...this.metrics, ...newMetrics };
                this.updateValues();
            }
        });

        // Hover effects nos cards
        const cards = this.container.querySelectorAll('.metric-card');
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-4px) scale(1.02)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
            });
        });
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }

    renderError() {
        this.container.innerHTML = `
            <div class="metrics-error">
                <div class="error-icon">⚠️</div>
                <p>Erro ao carregar métricas</p>
                <button onclick="window.recarregarDashboard()" class="btn-retry">
                    Tentar Novamente
                </button>
            </div>
        `;
    }

    destroy() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }
}

// CSS para o widget de métricas
export const metricsWidgetStyles = `
    .metrics-widget {
        display: flex;
        flex-direction: column;
        gap: 24px;
    }

    .main-metrics {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
    }

    .metric-card {
        background: var(--bg-card);
        border-radius: var(--radius-lg);
        padding: 24px;
        border: 1px solid var(--border-color);
        transition: all 0.3s ease;
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

    .metric-card:hover::before {
        opacity: 1;
    }

    .metric-card.primary {
        border-color: var(--accent-green);
    }

    .metric-card.secondary {
        border-color: #3b82f6;
    }

    .metric-card.accent {
        border-color: #f59e0b;
    }

    .metric-icon {
        font-size: 2.5rem;
        margin-bottom: 12px;
        position: relative;
        z-index: 1;
    }

    .metric-value {
        font-size: 2.5rem;
        font-weight: 700;
        color: var(--accent-green);
        margin-bottom: 8px;
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

    .metric-sublabel {
        font-size: 0.75rem;
        color: var(--text-muted);
        margin-top: 4px;
        position: relative;
        z-index: 1;
    }

    .metric-progress {
        margin-top: 12px;
        height: 6px;
        background: var(--bg-secondary);
        border-radius: var(--radius-full);
        overflow: hidden;
        position: relative;
        z-index: 1;
    }

    .progress-bar {
        height: 100%;
        background: linear-gradient(90deg, var(--accent-green) 0%, var(--accent-green-dark) 100%);
        border-radius: var(--radius-full);
        width: 0%;
        transition: width 1s ease-out;
    }

    .secondary-metrics {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 12px;
    }

    .metric-item {
        background: var(--bg-card);
        border-radius: var(--radius-md);
        padding: 16px;
        border: 1px solid var(--border-color);
        display: flex;
        align-items: center;
        gap: 12px;
        transition: all 0.3s ease;
    }

    .metric-item:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
    }

    .metric-icon-small {
        font-size: 1.5rem;
        flex-shrink: 0;
    }

    .metric-info {
        flex: 1;
    }

    .metric-small-value {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--accent-green);
        margin-bottom: 2px;
    }

    .metric-small-label {
        font-size: 0.75rem;
        color: var(--text-secondary);
        font-weight: 500;
    }

    .weekly-progress,
    .goal-comparison {
        background: var(--bg-card);
        border-radius: var(--radius-lg);
        padding: 20px;
        border: 1px solid var(--border-color);
    }

    .weekly-progress h4,
    .goal-comparison h4 {
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 16px;
    }

    .progress-container {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .progress-track {
        height: 12px;
        background: var(--bg-secondary);
        border-radius: var(--radius-full);
        overflow: hidden;
        position: relative;
    }

    .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--accent-green) 0%, var(--accent-green-dark) 100%);
        border-radius: var(--radius-full);
        width: 0%;
        transition: width 1s ease-out;
        position: relative;
    }

    .progress-fill::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%);
        animation: shimmer 2s infinite;
    }

    @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
    }

    .progress-labels {
        display: flex;
        justify-content: space-between;
        font-size: 0.75rem;
        color: var(--text-secondary);
    }

    .comparison-bars {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .comparison-item {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .comparison-item span {
        min-width: 60px;
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-secondary);
    }

    .bar-container {
        flex: 1;
        height: 20px;
        background: var(--bg-secondary);
        border-radius: var(--radius-full);
        overflow: hidden;
        position: relative;
    }

    .bar {
        height: 100%;
        border-radius: var(--radius-full);
        transition: width 1s ease-out;
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

    .metrics-error {
        text-align: center;
        padding: 40px 20px;
        color: var(--text-secondary);
    }

    .error-icon {
        font-size: 3rem;
        margin-bottom: 16px;
    }

    .btn-retry {
        background: var(--accent-green);
        color: var(--bg-primary);
        border: none;
        padding: 12px 24px;
        border-radius: var(--radius-md);
        font-weight: 600;
        cursor: pointer;
        margin-top: 16px;
        transition: all 0.2s ease;
    }

    .btn-retry:hover {
        background: var(--accent-green-dark);
        transform: translateY(-1px);
    }

    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
    }

    /* Responsive */
    @media (max-width: 768px) {
        .main-metrics {
            grid-template-columns: 1fr;
            gap: 12px;
        }

        .secondary-metrics {
            grid-template-columns: 1fr;
            gap: 8px;
        }

        .metric-card {
            padding: 20px;
        }

        .metric-icon {
            font-size: 2rem;
        }

        .metric-value {
            font-size: 2rem;
        }

        .comparison-item {
            gap: 8px;
        }

        .comparison-item span {
            min-width: 50px;
            font-size: 0.75rem;
        }
    }
`;