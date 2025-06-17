// integration/protocolIntegration.js - Integração final do protocolo no app
import workoutExecutionManager from '../feature/workoutExecution.js';
import WorkoutProtocolService from '../services/workoutProtocolService.js';
import { WeightCalculatorService } from '../services/weightCalculatorService.js';
import { exerciseCardStyles } from '../templates/exerciseCard.js';

// Classe para integrar o protocolo completo no app
export class ProtocolIntegration {
    
    // Inicializar sistema completo
    static async init() {
        console.log('[ProtocolIntegration] 🚀 Inicializando protocolo completo...');
        
        try {
            // 1. Injetar estilos dos exercícios
            this.injectExerciseStyles();
            
            // 2. Configurar funções globais
            this.setupGlobalFunctions();
            
            // 3. Configurar event listeners
            this.setupEventListeners();
            
            // 4. Atualizar dashboard com protocolo
            this.integrateWithDashboard();
            
            console.log('[ProtocolIntegration] ✅ Protocolo integrado com sucesso!');
            
        } catch (error) {
            console.error('[ProtocolIntegration] Erro na integração:', error);
        }
    }
    
    // Injetar estilos dos exercícios
    static injectExerciseStyles() {
        const styleId = 'exercise-card-styles';
        
        // Remove estilos anteriores se existirem
        const existingStyles = document.getElementById(styleId);
        if (existingStyles) {
            existingStyles.remove();
        }
        
        // Cria novo elemento de estilo
        const styleElement = document.createElement('style');
        styleElement.id = styleId;
        styleElement.textContent = `
            ${exerciseCardStyles}
            
            /* Estilos adicionais para treino */
            .workout-container {
                max-width: 900px;
                margin: 0 auto;
                padding: 20px;
                min-height: 100vh;
            }
            
            .workout-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: var(--bg-card);
                padding: 24px;
                border-radius: var(--radius-lg);
                margin-bottom: 24px;
                border: 1px solid var(--border-color);
            }
            
            .workout-info h1 {
                font-size: 1.75rem;
                font-weight: 700;
                color: var(--text-primary);
                margin-bottom: 8px;
            }
            
            .workout-meta {
                display: flex;
                gap: 8px;
                align-items: center;
                font-size: 0.875rem;
                color: var(--text-secondary);
            }
            
            .workout-progress-circle {
                width: 80px;
                height: 80px;
                position: relative;
            }
            
            .workout-progress-circle svg {
                width: 100%;
                height: 100%;
                transform: rotate(-90deg);
            }
            
            .progress-bg {
                fill: none;
                stroke: var(--bg-secondary);
                stroke-width: 6;
            }
            
            .progress-fill {
                fill: none;
                stroke: var(--accent-green);
                stroke-width: 6;
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
                font-size: 1rem;
                font-weight: 600;
                color: var(--accent-green);
            }
            
            .timer-container {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                backdrop-filter: blur(4px);
            }
            
            .timer-container.hidden {
                display: none;
            }
            
            .timer-content {
                background: var(--bg-card);
                padding: 40px;
                border-radius: var(--radius-lg);
                text-align: center;
                border: 1px solid var(--border-color);
                max-width: 400px;
                width: 90%;
            }
            
            .timer-content h3 {
                font-size: 1.25rem;
                margin-bottom: 24px;
                color: var(--text-primary);
            }
            
            .timer-circle {
                width: 200px;
                height: 200px;
                margin: 0 auto 24px;
                position: relative;
            }
            
            .timer-svg {
                width: 100%;
                height: 100%;
                transform: rotate(-90deg);
            }
            
            .timer-circle-bg {
                fill: none;
                stroke: var(--bg-secondary);
                stroke-width: 8;
            }
            
            .timer-circle-progress {
                fill: none;
                stroke: var(--accent-green);
                stroke-width: 8;
                stroke-linecap: round;
                transition: stroke-dashoffset 1s linear;
            }
            
            .timer-display {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 2.5rem;
                font-weight: 700;
                color: var(--accent-green);
                font-variant-numeric: tabular-nums;
            }
            
            .timer-controls {
                display: flex;
                gap: 12px;
                justify-content: center;
            }
            
            .btn-tertiary {
                background: var(--bg-secondary);
                color: var(--text-primary);
                border: 1px solid var(--border-color);
                padding: 12px 20px;
                border-radius: var(--radius-md);
                cursor: pointer;
                transition: all 0.2s ease;
                font-weight: 500;
            }
            
            .btn-tertiary:hover {
                background: var(--bg-primary);
                border-color: var(--accent-green);
            }
            
            .completion-container {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: var(--bg-primary);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                padding: 20px;
            }
            
            .completion-container.hidden {
                display: none;
            }
            
            .completion-content {
                text-align: center;
                max-width: 500px;
                width: 100%;
            }
            
            .completion-icon {
                width: 80px;
                height: 80px;
                background: var(--accent-green);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 24px;
                animation: completionPulse 1s ease-in-out;
            }
            
            .completion-icon svg {
                width: 40px;
                height: 40px;
                stroke: var(--bg-primary);
                stroke-width: 3;
            }
            
            @keyframes completionPulse {
                0% { transform: scale(0); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
            }
            
            .completion-content h2 {
                font-size: 2rem;
                margin-bottom: 12px;
                color: var(--text-primary);
            }
            
            .completion-content p {
                color: var(--text-secondary);
                margin-bottom: 32px;
                font-size: 1.125rem;
            }
            
            .summary-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 16px;
                margin-bottom: 32px;
            }
            
            .summary-item {
                background: var(--bg-card);
                padding: 20px;
                border-radius: var(--radius-md);
                border: 1px solid var(--border-color);
                display: flex;
                align-items: center;
                gap: 16px;
            }
            
            .summary-icon {
                font-size: 2rem;
                opacity: 0.8;
            }
            
            .summary-value {
                font-size: 1.5rem;
                font-weight: 700;
                color: var(--accent-green);
                margin-bottom: 4px;
            }
            
            .summary-label {
                font-size: 0.875rem;
                color: var(--text-secondary);
            }
            
            .completion-actions {
                display: flex;
                gap: 12px;
                justify-content: center;
            }
            
            /* Responsive */
            @media (max-width: 768px) {
                .workout-header {
                    flex-direction: column;
                    gap: 16px;
                    text-align: center;
                }
                
                .summary-grid {
                    grid-template-columns: 1fr;
                }
                
                .completion-actions {
                    flex-direction: column;
                }
                
                .timer-content {
                    padding: 24px;
                }
                
                .timer-circle {
                    width: 150px;
                    height: 150px;
                }
                
                .timer-display {
                    font-size: 2rem;
                }
            }
        `;
        
        document.head.appendChild(styleElement);
        console.log('[ProtocolIntegration] ✅ Estilos injetados');
    }
    
    // Configurar funções globais
    static setupGlobalFunctions() {
        // Função principal para iniciar treino
        window.iniciarTreino = async function() {
            await workoutExecutionManager.iniciarTreino();
        };
        
        // Funções auxiliares
        window.voltarParaHome = function() {
            workoutExecutionManager.resetarEstado();
            if (window.renderTemplate) {
                window.renderTemplate('home');
            }
        };
        
        // Funções de cálculo de peso (para uso em outros módulos)
        window.calcularPesosSugeridos = async function(userId, exercicioId, semanaAtual) {
            return await WeightCalculatorService.calcularPesosExercicio(userId, exercicioId, semanaAtual, 1, 1);
        };
        
        // Função para obter estatísticas
        window.obterEstatisticasProtocolo = async function(userId) {
            return await WorkoutProtocolService.obterEstatisticasUsuario(userId);
        };
        
        console.log('[ProtocolIntegration] ✅ Funções globais configuradas');
    }
    
    // Configurar event listeners
    static setupEventListeners() {
        // Listener para mudanças de usuário
        if (window.AppState) {
            window.AppState.subscribe('currentUser', (newUser) => {
                if (newUser) {
                    console.log('[ProtocolIntegration] Usuário alterado, recarregando protocolo...');
                    this.loadUserProtocolData(newUser.id);
                }
            });
        }
        
        // Listener para teclas de atalho
        document.addEventListener('keydown', (e) => {
            // ESC para voltar da tela de treino
            if (e.key === 'Escape' && workoutExecutionManager.currentWorkout) {
                window.voltarParaHome();
            }
            
            // Espaço para pular descanso
            if (e.code === 'Space' && workoutExecutionManager.restTimerInterval) {
                e.preventDefault();
                window.pularDescanso();
            }
        });
        
        console.log('[ProtocolIntegration] ✅ Event listeners configurados');
    }
    
    // Integrar com dashboard
    static integrateWithDashboard() {
        // Substituir função original de carregarDashboard para incluir dados do protocolo
        const originalCarregarDashboard = window.carregarDashboard;
        
        window.carregarDashboard = async function() {
            try {
                // Carregar dashboard original
                if (originalCarregarDashboard) {
                    await originalCarregarDashboard();
                }
                
                // Adicionar dados do protocolo
                await ProtocolIntegration.enrichDashboardWithProtocol();
                
            } catch (error) {
                console.error('[ProtocolIntegration] Erro ao integrar dashboard:', error);
            }
        };
        
        console.log('[ProtocolIntegration] ✅ Dashboard integrado');
    }
    
    // Enriquecer dashboard com dados do protocolo
    static async enrichDashboardWithProtocol() {
        try {
            const currentUser = window.AppState?.get('currentUser');
            if (!currentUser) return;
            
            // Obter estatísticas do protocolo
            const stats = await WorkoutProtocolService.obterEstatisticasUsuario(currentUser.id);
            
            // Atualizar elementos da UI
            this.updateElement('current-week', stats.semana_atual || 1);
            this.updateElement('completed-workouts', stats.total_treinos_realizados || 0);
            this.updateElement('progress-percentage', `${Math.round(stats.percentual_progresso || 0)}%`);
            
            // Atualizar barra de progresso semanal
            const progressBar = document.getElementById('user-progress-bar');
            if (progressBar) {
                const semanalProgress = ((stats.semana_atual || 1) / 12) * 100;
                progressBar.style.width = `${semanalProgress}%`;
            }
            
            console.log('[ProtocolIntegration] ✅ Dashboard enriquecido com dados do protocolo');
            
        } catch (error) {
            console.error('[ProtocolIntegration] Erro ao enriquecer dashboard:', error);
        }
    }
    
    // Carregar dados do protocolo para um usuário
    static async loadUserProtocolData(userId) {
        try {
            const stats = await WorkoutProtocolService.obterEstatisticasUsuario(userId);
            
            // Salvar no estado global
            if (window.AppState) {
                window.AppState.set('userProtocolStats', stats);
            }
            
            console.log(`[ProtocolIntegration] ✅ Dados do protocolo carregados para usuário ${userId}`);
            
        } catch (error) {
            console.error('[ProtocolIntegration] Erro ao carregar dados do protocolo:', error);
        }
    }
    
    // Função auxiliar para atualizar elementos
    static updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }
    
    // Verificar se protocolo está funcionando
    static async testProtocol(userId) {
        try {
            console.log('[ProtocolIntegration] 🧪 Testando protocolo...');
            
            // Teste 1: Carregar treino
            const treino = await WorkoutProtocolService.carregarTreinoParaExecucao(userId);
            console.log('✅ Teste 1 - Carregar treino:', treino.nome);
            
            // Teste 2: Calcular pesos
            if (treino.exercicios.length > 0) {
                const exercicio = treino.exercicios[0];
                const pesos = await WeightCalculatorService.calcularPesosExercicio(
                    userId, 
                    exercicio.exercicio_id, 
                    treino.semana_atual,
                    treino.semana_referencia,
                    treino.protocolo_id
                );
                console.log('✅ Teste 2 - Calcular pesos:', pesos);
            }
            
            // Teste 3: Obter estatísticas
            const stats = await WorkoutProtocolService.obterEstatisticasUsuario(userId);
            console.log('✅ Teste 3 - Estatísticas:', stats);
            
            console.log('[ProtocolIntegration] ✅ Protocolo funcionando perfeitamente!');
            return true;
            
        } catch (error) {
            console.error('[ProtocolIntegration] ❌ Erro no teste do protocolo:', error);
            return false;
        }
    }
}

// Função para inicializar o protocolo quando o app carrega
export async function initializeProtocol() {
    console.log('[initializeProtocol] 🚀 Inicializando protocolo...');
    
    try {
        await ProtocolIntegration.init();
        console.log('[initializeProtocol] ✅ Protocolo inicializado com sucesso!');
        
        // Teste com usuário atual se disponível
        const currentUser = window.AppState?.get('currentUser');
        if (currentUser) {
            setTimeout(async () => {
                const testResult = await ProtocolIntegration.testProtocol(currentUser.id);
                if (testResult) {
                    if (window.showNotification) {
                        window.showNotification('Protocolo carregado e funcionando! 💪', 'success');
                    }
                }
            }, 2000);
        }
        
    } catch (error) {
        console.error('[initializeProtocol] Erro:', error);
        if (window.showNotification) {
            window.showNotification('Erro ao carregar protocolo. Algumas funcionalidades podem estar limitadas.', 'error');
        }
    }
}

// Função global para testar protocolo
window.testarProtocolo = async function() {
    const currentUser = window.AppState?.get('currentUser');
    if (!currentUser) {
        console.error('Nenhum usuário logado para teste');
        return;
    }
    
    const resultado = await ProtocolIntegration.testProtocol(currentUser.id);
    if (window.showNotification) {
        const mensagem = resultado ? 
            'Protocolo testado com sucesso! ✅' : 
            'Erro no teste do protocolo ❌';
        window.showNotification(mensagem, resultado ? 'success' : 'error');
    }
};

// ✅ EXPORT ÚNICO - removida duplicata
export default ProtocolIntegration;