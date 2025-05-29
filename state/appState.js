// js/state/appState.js
// Estado global da aplicação centralizado

class AppStateManager {
    constructor() {
        this.state = {
            currentUser: null,
            currentProtocol: null,
            currentWorkout: null,
            currentExercises: [],
            currentExerciseIndex: 0,
            workoutStartTime: null,
            completedSeries: 0,
            timerInterval: null,
            restStartTime: null,
            restTime: 0,
            pesosSugeridos: {},
            isResting: false,
            weekPlan: null,
            users: []
        };
        
        this.listeners = new Map();
    }
    
    // Getter genérico
    get(key) {
        return this.state[key];
    }
    
    // Setter com notificação de mudanças
    set(key, value) {
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
        Object.keys(this.state).forEach(key => {
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
    
    // Verifica se há usuário logado
    get isLoggedIn() {
        return this.state.currentUser !== null;
    }
    
    // Verifica se há treino em andamento
    get isWorkoutActive() {
        return this.state.currentWorkout !== null && this.state.workoutStartTime !== null;
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