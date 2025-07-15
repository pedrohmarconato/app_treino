/**
 * 🗂️ GERENCIADOR DE ESTADO GLOBAL - AppState
 * 
 * FUNÇÃO: Centralizar e gerenciar todo o estado da aplicação de forma reativa.
 * 
 * RESPONSABILIDADES:
 * - Armazenar dados globais: usuário atual, treino em execução, exercícios
 * - Gerenciar cache de execuções de treino para sincronização posterior
 * - Manter estado da navegação entre semanas e exercícios
 * - Fornecer sistema reativo com observers para mudanças de estado
 * - Validar dados antes de armazenar (evitar corrupção de estado)
 * 
 * DADOS PRINCIPAIS:
 * - currentUser: Dados do usuário logado
 * - currentWorkout: Treino em execução (protocolo, exercícios)
 * - execucoesCache: Séries executadas (aguardando sincronização)
 * - weekPlan: Planejamento semanal do usuário
 * - navigation: Estado da navegação (semana atual, exercício atual)
 * 
 * PADRÃO: Singleton reativo - uma única instância com sistema de observadores
 */

class AppStateManager {
    constructor() {
        this.state = {
            currentUser: null,
            currentWorkout: null,
            currentExercises: [],
            currentExerciseIndex: 0,
            completedSeries: 0,
            execucoesCache: [],
            weekPlan: null,
            userMetrics: null,
            weekNavigation: {
                currentWeek: null,
                viewingWeek: null,
                isViewingCurrent: true
            },
            // === WORKOUT PERSISTENCE FLAGS ===
            isWorkoutActive: false,
            hasUnsavedData: false,
            workoutStartTime: null,
            lastWorkoutSave: null,
            workoutSessionId: null,
            workoutTimerInterval: null,
            timerInterval: null,
            restTime: 0
        };
        
        this.listeners = new Map();
    }
    
    // Getter genérico
    get(key) {
        return this.state[key];
    }
    
    // Setter com notificação de mudanças
    set(key, value) {
        // Validação especial para workoutStartTime
        if (key === 'workoutStartTime' && value !== null && value !== undefined) {
            const numValue = Number(value);
            if (isNaN(numValue) || numValue <= 0) {
                console.error('[AppState] Tentativa de definir workoutStartTime inválido:', value, 'tipo:', typeof value);
                return;
            }
            value = numValue;
        }
        
        const oldValue = this.state[key];
        this.state[key] = value;
        this.notify(key, value, oldValue);
    }
    
    // Atualização parcial de objetos
    update(key, updates) {
        if (typeof this.state[key] === 'object' && !Array.isArray(this.state[key])) {
            this.set(key, { ...this.state[key], ...updates });
        } else {
            this.set(key, updates);
        }
    }
    
    // Método para debug - retorna todo o estado
    getAll() {
        return { ...this.state };
    }
    
    // Sistema de observadores
    subscribe(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
        }
        this.listeners.get(key).add(callback);
        
        // Retorna função para cancelar inscrição
        return () => {
            const callbacks = this.listeners.get(key);
            if (callbacks) {
                callbacks.delete(callback);
            }
        };
    }
    
    notify(key, newValue, oldValue) {
        const callbacks = this.listeners.get(key);
        if (callbacks) {
            callbacks.forEach(callback => {
                callback(newValue, oldValue);
            });
        }
    }
    
    // Resetar estado
    reset() {
        console.log('[AppState] Resetando estado...');
        const keys = Object.keys(this.state);
        console.log('[AppState] Chaves a resetar:', keys);
        
        keys.forEach(key => {
            if (key === 'users') {
                this.set(key, []); // Mantém array vazio para usuários
            } else if (Array.isArray(this.state[key])) {
                this.set(key, []);
            } else if (typeof this.state[key] === 'object') {
                this.set(key, null);
            } else if (typeof this.state[key] === 'number') {
                this.set(key, 0);
            } else if (typeof this.state[key] === 'boolean') {
                this.set(key, false);
            } else {
                this.set(key, null);
            }
        });
        
        console.log('[AppState] Estado resetado:', this.getAll());
    }
    
    // Resetar apenas estado do treino
    resetWorkout() {
        this.set('currentWorkout', null);
        this.set('currentExercises', []);
        this.set('currentExerciseIndex', 0);
        this.set('workoutStartTime', null);
        this.set('completedSeries', 0);
        this.set('restTime', 0);
        this.set('isResting', false);
        this.set('pesosSugeridos', {});
        
        // Reset workout persistence flags
        this.set('isWorkoutActive', false);
        this.set('hasUnsavedData', false);
        this.set('lastWorkoutSave', null);
        this.set('workoutSessionId', null);
        
        if (this.state.timerInterval) {
            clearInterval(this.state.timerInterval);
            this.set('timerInterval', null);
        }
    }
    
    // Getters convenientes
    get currentUser() { return this.state.currentUser; }
    get currentProtocol() { return this.state.currentProtocol; }
    get currentWorkout() { return this.state.currentWorkout; }
    get currentExercises() { return this.state.currentExercises; }
    get currentExerciseIndex() { return this.state.currentExerciseIndex; }
    get weekPlan() { return this.state.weekPlan; }
    get users() { return this.state.users; }
    
    // Week Navigation getters
    get weekNavigation() { return this.state.weekNavigation; }
    get currentWeek() { return this.state.weekNavigation.currentWeek; }
    get viewingWeek() { return this.state.weekNavigation.viewingWeek; }
    get isViewingCurrentWeek() { return this.state.weekNavigation.isViewingCurrent; }
    
    // Verifica se há usuário logado
    get isLoggedIn() {
        return this.state.currentUser !== null;
    }
    
    // Verifica se há treino em andamento
    get isWorkoutActive() {
        return this.state.isWorkoutActive;
    }

    // === WORKOUT PERSISTENCE HELPERS ===
    
    /**
     * Marca workout como ativo e define flags relacionadas
     */
    startWorkoutSession(workoutData = null, sessionId = null) {
        this.set('isWorkoutActive', true);
        this.set('hasUnsavedData', false);
        this.set('workoutStartTime', Date.now());
        this.set('workoutSessionId', sessionId || this.generateSessionId());
        
        if (workoutData) {
            this.set('currentWorkout', workoutData);
        }
        
        console.log('[AppState] Workout session iniciada:', this.state.workoutSessionId);
    }
    
    /**
     * Marca dados como não salvos
     */
    markDataAsUnsaved() {
        if (this.state.isWorkoutActive) {
            this.set('hasUnsavedData', true);
        }
    }
    
    /**
     * Marca dados como salvos e atualiza timestamp
     */
    markDataAsSaved() {
        this.set('hasUnsavedData', false);
        this.set('lastWorkoutSave', Date.now());
    }
    
    /**
     * Finaliza sessão de workout
     */
    endWorkoutSession() {
        this.set('isWorkoutActive', false);
        this.set('hasUnsavedData', false);
        this.set('lastWorkoutSave', Date.now());
        
        console.log('[AppState] Workout session finalizada:', this.state.workoutSessionId);
    }
    
    /**
     * Gera ID único para sessão
     */
    generateSessionId() {
        return `workout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Obtém informações da sessão atual
     */
    getWorkoutSessionInfo() {
        return {
            isActive: this.state.isWorkoutActive,
            hasUnsavedData: this.state.hasUnsavedData,
            sessionId: this.state.workoutSessionId,
            startTime: this.state.workoutStartTime,
            lastSave: this.state.lastWorkoutSave,
            duration: this.state.workoutStartTime ? Date.now() - this.state.workoutStartTime : 0
        };
    }
    
    // Métodos para navegação de semanas
    setCurrentWeek(ano, semana) {
        this.update('weekNavigation', {
            currentWeek: { ano, semana }
        });
    }
    
    setViewingWeek(ano, semana) {
        const isCurrentWeek = this.state.weekNavigation.currentWeek && 
                              this.state.weekNavigation.currentWeek.ano === ano && 
                              this.state.weekNavigation.currentWeek.semana === semana;
        
        this.update('weekNavigation', {
            viewingWeek: { ano, semana },
            isViewingCurrent: isCurrentWeek
        });
    }
    
    goToCurrentWeek() {
        if (this.state.weekNavigation.currentWeek) {
            this.setViewingWeek(
                this.state.weekNavigation.currentWeek.ano,
                this.state.weekNavigation.currentWeek.semana
            );
        }
    }
}

// Instância única (Singleton)
const AppState = new AppStateManager();

// Exporta a instância
export default AppState;

// Também exporta funções auxiliares para compatibilidade
export const getState = (key) => AppState.get(key);
export const setState = (key, value) => AppState.set(key, value);
export const updateState = (key, updates) => AppState.update(key, updates);
export const subscribeToState = (key, callback) => AppState.subscribe(key, callback);
export const resetState = () => AppState.reset();
export const resetWorkoutState = () => AppState.resetWorkout();