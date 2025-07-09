/**
 * 🔄 COMPONENTE CONTEXTUAL - Botão Inteligente de Treino
 * 
 * FUNÇÃO: Botão que adapta automaticamente seu estado baseado no contexto atual.
 * 
 * RESPONSABILIDADES:
 * - Detectar se há treino em andamento e mostrar "Continuar Treino"
 * - Quando não há treino em andamento, mostrar "Iniciar Treino"
 * - Integrar com workoutStateManager para recuperação de sessões
 * - Atualizar automaticamente baseado em mudanças de estado
 * - Fornecer feedback visual sobre ações disponíveis
 * - Navegar adequadamente para workout.js ou mostrar modal de recuperação
 * 
 * ESTADOS DO BOTÃO:
 * - "Iniciar Treino": Quando não há treino em cache
 * - "Continuar Treino": Quando há treino em andamento detectado
 * - "Carregando...": Durante verificação de estado
 * - "Disabled": Quando há erro ou dados inconsistentes
 * 
 * INTEGRAÇÃO:
 * - workoutStateManager: Para detectar treinos em andamento
 * - AppState: Para monitorar mudanças de estado
 * - navigation: Para redirecionar adequadamente
 * 
 * EVENTOS: Escuta mudanças de cache e atualiza estado automaticamente
 */

import AppState from '../state/appState.js';

export class ContextualWorkoutButton {
    constructor(element, options = {}) {
        this.element = this.validateElement(element);
        this.options = {
            updateInterval: 5000, // 5 segundos
            enableAutoUpdate: true,
            showProgress: true,
            showTimeElapsed: true,
            ...options
        };
        
        // Estados do botão
        this.buttonStates = {
            loading: {
                text: 'Carregando...',
                className: 'btn-loading',
                icon: '⏳',
                action: null,
                subtitle: 'Verificando dados',
                disabled: true,
                context: 'Processando estado do treino'
            },
            
            start: {
                text: 'Iniciar Treino',
                className: 'btn-primary',
                icon: '▶️',
                action: 'startWorkout',
                subtitle: null,
                disabled: false,
                context: 'Nenhum treino em andamento'
            },
            
            resume: {
                text: 'Voltar ao Treino',
                className: 'btn-resume',
                icon: '🔄',
                action: 'resumeWorkout',
                subtitle: '{progress}% concluído • {timeElapsed}',
                disabled: false,
                context: 'Treino pausado detectado'
            },
            
            complete: {
                text: 'Treino Concluído',
                className: 'btn-success',
                icon: '✅',
                action: 'viewResults',
                subtitle: 'Finalizado hoje',
                disabled: true,
                context: 'Treino finalizado hoje'
            },
            
            rest: {
                text: 'Dia de Descanso',
                className: 'btn-neutral',
                icon: '😴',
                action: null,
                subtitle: 'Hoje é folga',
                disabled: true,
                context: 'Dia de descanso programado'
            },
            
            error: {
                text: 'Erro no Cache',
                className: 'btn-error',
                icon: '⚠️',
                action: 'clearCache',
                subtitle: 'Toque para limpar',
                disabled: false,
                context: 'Dados corrompidos detectados'
            }
        };
        
        // Estado atual
        this.currentState = 'loading';
        this.stateData = null;
        this.updateInterval = null;
        this.eventListeners = new Map();
        
        // Bind methods
        this.handleClick = this.handleClick.bind(this);
        this.updateState = this.updateState.bind(this);
        this.onCacheUpdate = this.onCacheUpdate.bind(this);
        
        this.initialize();
    }

    /**
     * Valida o elemento do botão
     */
    validateElement(element) {
        if (typeof element === 'string') {
            const el = document.getElementById(element) || document.querySelector(element);
            if (!el) {
                throw new Error(`Elemento não encontrado: ${element}`);
            }
            return el;
        }
        
        if (!(element instanceof HTMLElement)) {
            throw new Error('Elemento deve ser HTMLElement ou seletor válido');
        }
        
        return element;
    }

    /**
     * Inicializa o botão contextual
     */
    async initialize() {
        try {
            console.log('[ContextualWorkoutButton] Inicializando...');
            
            // Setup eventos
            this.setupEventListeners();
            
            // Verificar estado inicial
            await this.updateStateFromCache();
            
            // Iniciar atualizações periódicas
            if (this.options.enableAutoUpdate) {
                this.startPeriodicUpdates();
            }
            
            // Setup cross-tab sync
            this.setupCrossTabSync();
            
            console.log('[ContextualWorkoutButton] ✅ Inicializado com sucesso');
            
        } catch (error) {
            console.error('[ContextualWorkoutButton] ❌ Erro na inicialização:', error);
            this.setState('error', { errorMessage: error.message });
        }
    }

    /**
     * Atualiza estado baseado no cache
     */
    async updateStateFromCache() {
        try {
            console.log('[ContextualWorkoutButton] 🔍 Verificando estado do cache...');
            
            // Verificar se há treino ativo usando apenas AppState
            const [workoutState, isWorkoutActive] = await Promise.all([
                this.getWorkoutStateFromCache(),
                this.checkAppStateWorkout()
            ]);
            const hasActiveWorkout = !!workoutState;
            
            console.log('[ContextualWorkoutButton] Estado detectado:', {
                hasActiveWorkout,
                hasWorkoutState: !!workoutState,
                isWorkoutActive,
                stateValid: workoutState ? this.validateWorkoutState(workoutState) : false
            });
            
            // Verificar se treino foi concluído hoje
            const completionStatus = await this.checkTodayCompletion();
            
            if (completionStatus.completed) {
                this.setState('complete', completionStatus);
                return;
            }
            
            // Verificar se é dia de descanso
            const restDayStatus = await this.checkRestDay();
            if (restDayStatus.isRestDay) {
                this.setState('rest', restDayStatus);
                return;
            }
            
            // Determinar estado baseado no cache com lógica mais rigorosa
            if (hasActiveWorkout && workoutState && this.validateWorkoutState(workoutState)) {
                // Verificar se há realmente progresso para mostrar botão de resume
                const hasRealProgress = workoutState.exerciciosExecutados && workoutState.exerciciosExecutados.length > 0;
                
                if (hasRealProgress) {
                    const progressData = this.calculateProgress(workoutState);
                    this.setState('resume', { ...workoutState, ...progressData });
                    console.log('[ContextualWorkoutButton] Estado definido como RESUME - progresso real detectado');
                } else {
                    // Não limpar imediatamente, apenas mostrar START
                    console.log('[ContextualWorkoutButton] Cache existe mas sem progresso real - mostrando START');
                    this.setState('start');
                }
            } else {
                // Verificar melhor se há cache corrompido
                if (workoutState && !this.validateWorkoutState(workoutState)) {
                    console.log('[ContextualWorkoutButton] Cache corrompido detectado');
                    this.setState('error', { 
                        errorType: 'corrupt_cache',
                        errorMessage: 'Dados do treino corrompidos'
                    });
                } else {
                    console.log('[ContextualWorkoutButton] Nenhum cache válido - estado START');
                    this.setState('start');
                }
            }
            
        } catch (error) {
            console.error('[ContextualWorkoutButton] Erro ao verificar cache:', error);
            this.setState('error', { 
                errorType: 'cache_error',
                errorMessage: error.message
            });
        }
    }

    /**
     * Verifica status do AppState
     */
    checkAppStateWorkout() {
        return AppState.get('isWorkoutActive') || false;
    }

    /**
     * Verifica se treino foi concluído hoje
     */
    async checkTodayCompletion() {
        try {
            const currentUser = AppState.get('currentUser');
            if (!currentUser || !window.WeeklyPlanService?.verificarTreinoConcluido) {
                return { completed: false };
            }
            
            const status = await window.WeeklyPlanService.verificarTreinoConcluido(currentUser.id);
            return {
                completed: status.concluido || false,
                completionTime: status.data_conclusao,
                workoutType: status.tipo_treino
            };
            
        } catch (error) {
            console.warn('[ContextualWorkoutButton] Erro ao verificar conclusão:', error);
            return { completed: false };
        }
    }

    /**
     * Verifica se é dia de descanso
     */
    async checkRestDay() {
        try {
            const currentUser = AppState.get('currentUser');
            if (!currentUser || !window.WorkoutProtocolService?.carregarTreinoParaExecucao) {
                return { isRestDay: false };
            }
            
            const workout = await window.WorkoutProtocolService.carregarTreinoParaExecucao(currentUser.id);
            
            return {
                isRestDay: workout?.tipo === 'folga',
                workoutType: workout?.tipo,
                programmedActivity: workout?.nome
            };
            
        } catch (error) {
            console.warn('[ContextualWorkoutButton] Erro ao verificar dia de descanso:', error);
            return { isRestDay: false };
        }
    }

    /**
     * Calcula progresso do treino
     */
    calculateProgress(workoutState) {
        if (!workoutState || !workoutState.currentWorkout) {
            return { progress: 0, timeElapsed: '0 min', exercisesCompleted: 0 };
        }
        
        try {
            const { currentWorkout, exerciciosExecutados = [], startTime } = workoutState;
            
            // Calcular progresso baseado em SÉRIES completadas
            const totalExercises = currentWorkout.exercicios?.length || 0;
            
            // Contar quantos exercícios únicos já tiveram pelo menos uma série executada
            const exerciciosUnicos = new Set();
            exerciciosExecutados.forEach(exec => {
                if (exec.exercicio_id) {
                    exerciciosUnicos.add(exec.exercicio_id);
                }
            });
            
            const uniqueExercisesCompleted = exerciciosUnicos.size;
            
            // Calcular progresso total de séries
            let totalSeries = 0;
            const completedSeries = exerciciosExecutados.length;
            
            // Calcular total de séries esperadas
            currentWorkout.exercicios?.forEach(ex => {
                totalSeries += (ex.series || 3); // Default 3 séries se não especificado
            });
            
            // Progresso pode ser calculado de duas formas:
            // 1. Por exercícios únicos completados (para o botão contextual)
            // 2. Por séries totais (para mostrar progresso detalhado)
            const progressByExercises = totalExercises > 0 
                ? Math.round((uniqueExercisesCompleted / totalExercises) * 100) 
                : 0;
            
            const progressBySeries = totalSeries > 0 
                ? Math.round((completedSeries / totalSeries) * 100) 
                : 0;
            
            // Calcular tempo decorrido
            const elapsed = startTime ? Date.now() - startTime : 0;
            const timeElapsed = this.formatDuration(Math.round(elapsed / 60000));
            
            console.log('[ContextualWorkoutButton] Progresso calculado:', {
                uniqueExercisesCompleted,
                totalExercises,
                completedSeries,
                totalSeries,
                progressByExercises,
                progressBySeries
            });
            
            return {
                progress: progressByExercises, // Usar progresso por exercícios para o botão
                progressBySeries, // Adicional para uso futuro
                timeElapsed,
                exercisesCompleted: uniqueExercisesCompleted,
                seriesCompleted: completedSeries,
                totalExercises,
                totalSeries,
                workoutName: currentWorkout.nome || 'Treino em Andamento'
            };
            
        } catch (error) {
            console.error('[ContextualWorkoutButton] Erro ao calcular progresso:', error);
            return { progress: 0, timeElapsed: '0 min', exercisesCompleted: 0 };
        }
    }

    /**
     * Formata duração em minutos
     */
    formatDuration(minutes) {
        if (minutes <= 0) return '< 1 min';
        if (minutes < 60) return `${minutes} min`;
        
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        
        if (remainingMinutes === 0) {
            return `${hours}h`;
        }
        
        return `${hours}h ${remainingMinutes}min`;
    }

    /**
     * Define novo estado do botão
     */
    setState(stateName, customData = {}) {
        if (!this.buttonStates[stateName]) {
            console.warn(`[ContextualWorkoutButton] Estado inválido: ${stateName}`);
            return;
        }
        
        const oldState = this.currentState;
        this.currentState = stateName;
        this.stateData = customData;
        
        console.log(`[ContextualWorkoutButton] Estado alterado: ${oldState} → ${stateName}`);
        
        // Renderizar novo estado
        this.render();
        
        // Emitir evento de mudança
        this.emitStateChange(stateName, customData, oldState);
    }

    /**
     * Renderiza o botão com estado atual
     */
    render() {
        const state = this.buttonStates[this.currentState];
        const data = this.stateData || {};
        
        // Atualizar classes CSS
        this.updateClasses(state);
        
        // Atualizar conteúdo
        this.updateContent(state, data);
        
        // Atualizar atributos
        this.updateAttributes(state, data);
        
        console.log(`[ContextualWorkoutButton] Renderizado: ${this.currentState}`);
    }

    /**
     * Atualiza classes CSS do botão
     */
    updateClasses(state) {
        // Remover classes antigas
        this.element.className = this.element.className
            .split(' ')
            .filter(cls => !cls.startsWith('btn-'))
            .join(' ');
        
        // Adicionar novas classes
        this.element.classList.add('contextual-workout-btn', state.className);
        
        if (state.disabled) {
            this.element.classList.add('btn-disabled');
        }
    }

    /**
     * Atualiza conteúdo do botão
     */
    updateContent(state, data) {
        const subtitle = this.processSubtitle(state.subtitle, data);
        
        this.element.innerHTML = `
            <div class="btn-content">
                <div class="btn-main">
                    <span class="btn-icon" aria-hidden="true">${state.icon}</span>
                    <span class="btn-text">${state.text}</span>
                </div>
                ${subtitle ? `<div class="btn-subtitle">${subtitle}</div>` : ''}
            </div>
        `;
    }

    /**
     * Processa subtitle com placeholder substitution
     */
    processSubtitle(subtitle, data) {
        if (!subtitle || !this.options.showProgress) return null;
        
        return subtitle
            .replace('{progress}', data.progress || 0)
            .replace('{timeElapsed}', data.timeElapsed || '0 min')
            .replace('{exercisesCompleted}', data.exercisesCompleted || 0)
            .replace('{totalExercises}', data.totalExercises || 0);
    }

    /**
     * Atualiza atributos do botão
     */
    updateAttributes(state, data) {
        // Disabled state
        this.element.disabled = state.disabled;
        
        // ARIA attributes
        this.element.setAttribute('aria-label', state.context);
        this.element.setAttribute('aria-describedby', `contextual-btn-desc-${this.currentState}`);
        
        // Data attributes
        this.element.setAttribute('data-state', this.currentState);
        this.element.setAttribute('data-action', state.action || '');
        
        // Title tooltip
        const tooltip = data.workoutName 
            ? `${state.context} - ${data.workoutName}`
            : state.context;
        this.element.setAttribute('title', tooltip);
    }

    /**
     * Manipula clique no botão
     */
    async handleClick(event) {
        event.preventDefault();
        
        const state = this.buttonStates[this.currentState];
        
        if (state.disabled || !state.action) {
            console.log(`[ContextualWorkoutButton] Clique ignorado - estado ${this.currentState}`);
            return;
        }
        
        console.log(`[ContextualWorkoutButton] Executando ação: ${state.action}`);
        
        // Mostrar estado de carregamento
        const originalState = this.currentState;
        const originalData = { ...this.stateData };
        this.setState('loading');
        
        try {
            await this.executeAction(state.action);
        } catch (error) {
            console.error('[ContextualWorkoutButton] Erro ao executar ação:', error);
            
            // Restaurar estado original
            this.setState(originalState, originalData);
            
            // Mostrar erro ao usuário
            if (window.showNotification) {
                window.showNotification(`Erro: ${error.message}`, 'error');
            }
            
            // Definir estado de erro temporariamente
            setTimeout(() => {
                this.setState('error', { 
                    errorType: 'action_error',
                    errorMessage: error.message
                });
            }, 100);
        }
    }

    /**
     * Executa ação baseada no estado
     */
    async executeAction(action) {
        switch (action) {
            case 'startWorkout':
                await this.startWorkout();
                break;
                
            case 'resumeWorkout':
                await this.resumeWorkout();
                break;
                
            case 'viewResults':
                this.viewResults();
                break;
                
            case 'clearCache':
                await this.clearCache();
                break;
                
            default:
                console.warn(`[ContextualWorkoutButton] Ação não implementada: ${action}`);
        }
    }

    /**
     * Inicia novo treino
     */
    async startWorkout() {
        try {
            if (window.iniciarTreino) {
                await window.iniciarTreino();
            } else {
                throw new Error('Método iniciarTreino não disponível');
            }
        } catch (error) {
            console.error('[ContextualWorkoutButton] Erro ao iniciar treino:', error);
            throw error;
        }
    }

    /**
     * Resume treino do cache
     */
    async resumeWorkout() {
        try {
            const workoutState = await this.getWorkoutStateFromCache();
            
            if (window.resumeWorkout) {
                await window.resumeWorkout(workoutState);
            } else if (window.workoutExecutionManager?.resumeFromCache) {
                await window.workoutExecutionManager.resumeFromCache(workoutState);
            } else {
                throw new Error('Método resumeWorkout não disponível');
            }
        } catch (error) {
            console.error('[ContextualWorkoutButton] Erro ao resumir treino:', error);
            throw error;
        }
    }

    /**
     * Visualiza resultados
     */
    viewResults() {
        console.log('[ContextualWorkoutButton] Visualizando resultados do treino');
        // Implementar visualização de resultados
        if (window.showNotification) {
            window.showNotification('Visualização de resultados em desenvolvimento', 'info');
        }
    }

    /**
     * Limpa cache corrompido
     */
    async clearCache() {
        try {
            this.clearWorkoutStateFromCache();
            AppState.resetWorkout();
            
            if (window.showNotification) {
                window.showNotification('Cache limpo com sucesso', 'success');
            }
            
            // Atualizar estado
            setTimeout(() => this.updateStateFromCache(), 500);
            
        } catch (error) {
            console.error('[ContextualWorkoutButton] Erro ao limpar cache:', error);
            throw error;
        }
    }

    /**
     * Configura event listeners
     */
    setupEventListeners() {
        this.element.addEventListener('click', this.handleClick);
        
        // AppState listeners
        const unsubscribe = AppState.subscribe('isWorkoutActive', this.onCacheUpdate);
        this.eventListeners.set('appState', unsubscribe);
        
        // Listener para cache updates via AppState
        const unsubscribeCacheUpdate = AppState.subscribe('workoutCacheUpdated', this.onCacheUpdate);
        this.eventListeners.set('cacheUpdate', unsubscribeCacheUpdate);
        
        // Listener para evento customizado
        const cacheUpdateHandler = (event) => {
            console.log('[ContextualWorkoutButton] Evento workout-cache-updated recebido:', event.detail);
            this.onCacheUpdate();
        };
        document.addEventListener('workout-cache-updated', cacheUpdateHandler);
        this.eventListeners.set('customEvent', () => {
            document.removeEventListener('workout-cache-updated', cacheUpdateHandler);
        });
    }

    /**
     * Callback para mudanças no cache/AppState
     */
    onCacheUpdate() {
        console.log('[ContextualWorkoutButton] Cache atualizado, verificando estado...');
        setTimeout(() => this.updateStateFromCache(), 100);
    }

    /**
     * Inicia atualizações periódicas
     */
    startPeriodicUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        this.updateInterval = setInterval(() => {
            this.updateStateFromCache();
        }, this.options.updateInterval);
        
        console.log(`[ContextualWorkoutButton] Atualizações periódicas ativadas (${this.options.updateInterval}ms)`);
    }

    /**
     * Setup sincronização cross-tab
     */
    setupCrossTabSync() {
        window.addEventListener('storage', (event) => {
            if (event.key && event.key.includes('workout')) {
                console.log('[ContextualWorkoutButton] Storage event detectado, atualizando...');
                setTimeout(() => this.updateStateFromCache(), 200);
            }
        });
    }

    /**
     * Emite evento de mudança de estado
     */
    emitStateChange(newState, data, oldState) {
        const event = new CustomEvent('workout-button-state-change', {
            detail: { newState, data, oldState, element: this.element }
        });
        
        this.element.dispatchEvent(event);
        document.dispatchEvent(event);
    }

    /**
     * Para atualizações e limpa recursos
     */
    destroy() {
        // Parar atualizações
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        // Remover event listeners
        this.element.removeEventListener('click', this.handleClick);
        
        this.eventListeners.forEach((unsubscribe) => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        });
        
        this.eventListeners.clear();
        
        console.log('[ContextualWorkoutButton] Destruído');
    }

    /**
     * Obtém estado do treino do cache local
     */
    async getWorkoutStateFromCache() {
        try {
            const data = localStorage.getItem('workout_state');
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('[ContextualWorkoutButton] Erro ao obter estado do cache:', error);
            return null;
        }
    }

    /**
     * Valida estado do treino
     */
    validateWorkoutState(state) {
        if (!state || typeof state !== 'object') return false;
        return !!(state.currentWorkout && state.exerciciosExecutados);
    }

    /**
     * Limpa estado do treino do cache
     */
    clearWorkoutStateFromCache() {
        try {
            localStorage.removeItem('workout_state');
            sessionStorage.removeItem('workout_session');
        } catch (error) {
            console.error('[ContextualWorkoutButton] Erro ao limpar cache:', error);
        }
    }

    /**
     * Força atualização manual
     */
    async forceUpdate() {
        console.log('[ContextualWorkoutButton] Força atualização solicitada');
        await this.updateStateFromCache();
    }

    /**
     * Obtém estado atual para debug
     */
    getDebugInfo() {
        return {
            currentState: this.currentState,
            stateData: this.stateData,
            options: this.options,
            element: this.element,
            hasUpdateInterval: !!this.updateInterval
        };
    }
}

// Função utilitária para criação rápida
export function createContextualWorkoutButton(elementSelector, options = {}) {
    return new ContextualWorkoutButton(elementSelector, options);
}

// CSS Injection para estilos do botão
function injectButtonStyles() {
    if (document.getElementById('contextual-workout-btn-styles')) return;
    
    const styles = `
        .contextual-workout-btn {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 56px;
            padding: 12px 24px;
            border: none;
            border-radius: 12px;
            font-family: inherit;
            font-weight: 600;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            overflow: hidden;
            user-select: none;
        }

        .contextual-workout-btn .btn-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            z-index: 1;
        }

        .contextual-workout-btn .btn-main {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .contextual-workout-btn .btn-icon {
            font-size: 1.25rem;
        }

        .contextual-workout-btn .btn-text {
            font-size: 1rem;
            font-weight: 600;
        }

        .contextual-workout-btn .btn-subtitle {
            font-size: 0.875rem;
            opacity: 0.8;
            font-weight: 500;
        }

        /* Estados específicos */
        .btn-primary {
            background: linear-gradient(45deg, var(--accent-primary, #a8ff00), var(--accent-primary-dark, #8de000));
            color: #000;
        }

        .btn-primary:hover:not(.btn-disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(168, 255, 0, 0.3);
        }

        .btn-resume {
            background: linear-gradient(45deg, #00bcd4, #0097a7);
            color: white;
        }

        .btn-resume:hover:not(.btn-disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 188, 212, 0.3);
        }

        .btn-success {
            background: linear-gradient(45deg, #4caf50, #388e3c);
            color: white;
        }

        .btn-neutral {
            background: var(--bg-secondary, #2a2a2a);
            color: var(--text-secondary, #aaa);
            border: 1px solid var(--border-color, #333);
        }

        .btn-error {
            background: linear-gradient(45deg, #f44336, #d32f2f);
            color: white;
        }

        .btn-error:hover:not(.btn-disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(244, 67, 54, 0.3);
        }

        .btn-loading {
            background: var(--bg-secondary, #2a2a2a);
            color: var(--text-primary, #fff);
            border: 1px solid var(--border-color, #333);
        }

        .btn-loading .btn-icon {
            animation: spin 1s linear infinite;
        }

        .btn-disabled {
            opacity: 0.5;
            cursor: not-allowed;
            pointer-events: none;
        }

        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        /* Responsive */
        @media (max-width: 640px) {
            .contextual-workout-btn {
                min-height: 48px;
                padding: 10px 20px;
            }
            
            .contextual-workout-btn .btn-text {
                font-size: 0.875rem;
            }
            
            .contextual-workout-btn .btn-subtitle {
                font-size: 0.75rem;
            }
        }
    `;
    
    const styleSheet = document.createElement('style');
    styleSheet.id = 'contextual-workout-btn-styles';
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}

// Auto-inject styles
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectButtonStyles);
    } else {
        injectButtonStyles();
    }
}

// Disponibilizar globalmente
window.ContextualWorkoutButton = ContextualWorkoutButton;
window.createContextualWorkoutButton = createContextualWorkoutButton;

export default ContextualWorkoutButton;