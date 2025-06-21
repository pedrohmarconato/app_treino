// screens/WorkoutScreen.js
// Tela de execução de treino refatorada usando BaseComponent

import BaseComponent from '../core/BaseComponent.js';
import AppState from '../state/appState.js';
import eventBus, { SystemEvents } from '../core/EventBus.js';
import modalManager from '../core/ModalManager.js';
import WorkoutProtocolService from '../services/workoutProtocolService.js';
import { showNotification } from '../ui/notifications.js';
import { exerciseCardTemplate } from '../templates/workoutExecution.js';

export class WorkoutScreen extends BaseComponent {
    constructor() {
        super('#workout-screen');
        
        // Subsistemas
        this.exerciseManager = null;
        this.timerManager = null;
        this.persistenceManager = null;
        
        // Estado do treino
        this.currentWorkout = null;
        this.currentExerciseIndex = 0;
        this.exercisesCompleted = [];
        this.startTime = null;
        this.sessionId = null;
        
        // Elementos do DOM (cacheados)
        this.elements = {};
    }
    
    /**
     * Verifica dependências necessárias
     */
    async checkDependencies() {
        // Verificar Supabase
        if (!window.supabase) {
            throw new Error('Supabase não está carregado');
        }
        
        // Verificar usuário logado
        const currentUser = AppState.get('currentUser');
        if (!currentUser || !currentUser.id) {
            throw new Error('Nenhum usuário logado');
        }
        
        // Verificar se há treino carregado
        this.currentWorkout = AppState.get('currentWorkout');
        if (!this.currentWorkout) {
            throw new Error('Nenhum treino carregado');
        }
        
        console.log('[WorkoutScreen] ✅ Dependências verificadas');
    }
    
    /**
     * Executado quando componente é montado
     */
    async onMount() {
        console.log('[WorkoutScreen] Montando tela de treino...');
        
        try {
            // 1. Cachear elementos do DOM
            this.cacheElements();
            
            // 2. Inicializar subsistemas
            await this.initializeSubsystems();
            
            // 3. Configurar UI inicial
            this.setupUI();
            
            // 4. Configurar event listeners
            this.setupEventListeners();
            
            // 5. Verificar se deve recuperar sessão
            const shouldRecover = await this.checkForRecovery();
            
            if (shouldRecover) {
                await this.recoverSession();
            } else {
                await this.startNewSession();
            }
            
            // 6. Emitir evento de treino iniciado
            eventBus.emit(SystemEvents.WORKOUT_STARTED, {
                workout: this.currentWorkout,
                sessionId: this.sessionId
            });
            
            console.log('[WorkoutScreen] ✅ Tela montada com sucesso');
            
        } catch (error) {
            console.error('[WorkoutScreen] ❌ Erro ao montar:', error);
            showNotification(`Erro ao iniciar treino: ${error.message}`, 'error');
            throw error;
        }
    }
    
    /**
     * Executado quando componente é desmontado
     */
    async onUnmount() {
        console.log('[WorkoutScreen] Desmontando tela de treino...');
        
        try {
            // 1. Pausar timers
            if (this.timerManager) {
                this.timerManager.stop();
            }
            
            // 2. Salvar estado atual
            if (this.persistenceManager) {
                await this.persistenceManager.saveState(this.getState());
            }
            
            // 3. Emitir evento
            eventBus.emit(SystemEvents.WORKOUT_PAUSED, {
                workout: this.currentWorkout,
                sessionId: this.sessionId,
                progress: this.getProgress()
            });
            
            console.log('[WorkoutScreen] ✅ Tela desmontada');
            
        } catch (error) {
            console.error('[WorkoutScreen] ❌ Erro ao desmontar:', error);
        }
    }
    
    /**
     * Cacheia elementos do DOM para performance
     */
    cacheElements() {
        this.elements = {
            // Container principal
            exercisesContainer: this.querySelector('#exercises-expanded'),
            
            // Informações do treino
            workoutName: this.querySelector('#workout-name'),
            workoutTitle: this.querySelector('#workout-title'),
            currentWeek: this.querySelector('#current-week'),
            muscleGroups: this.querySelector('#muscle-groups'),
            
            // Progresso
            progressBar: this.querySelector('#workout-progress'),
            totalExercises: this.querySelector('#total-exercises'),
            currentExerciseNumber: this.querySelector('#current-exercise-number'),
            
            // Timer
            timerDisplay: this.querySelector('#workout-timer-display') || 
                          this.querySelector('#workout-timer'),
            
            // Botões
            exitButton: this.querySelector('#exit-workout'),
            pauseButton: this.querySelector('#pause-workout')
        };
        
        // Verificar elementos críticos
        if (!this.elements.exercisesContainer) {
            throw new Error('Container de exercícios não encontrado');
        }
        
        console.log('[WorkoutScreen] ✅ Elementos cacheados');
    }
    
    /**
     * Inicializa subsistemas
     */
    async initializeSubsystems() {
        // Importar e inicializar subsistemas dinamicamente
        const [
            { ExerciseManager },
            { TimerManager },
            { PersistenceManager }
        ] = await Promise.all([
            import('../managers/ExerciseManager.js'),
            import('../managers/TimerManager.js'),
            import('../managers/PersistenceManager.js')
        ]);
        
        this.exerciseManager = new ExerciseManager(this.elements.exercisesContainer);
        this.timerManager = new TimerManager(this.elements.timerDisplay);
        this.persistenceManager = new PersistenceManager('workout');
        
        // Registrar como filhos para lifecycle management
        this.registerChild('exercises', this.exerciseManager);
        this.registerChild('timer', this.timerManager);
        this.registerChild('persistence', this.persistenceManager);
        
        console.log('[WorkoutScreen] ✅ Subsistemas inicializados');
    }
    
    /**
     * Configura UI inicial
     */
    setupUI() {
        const workout = this.currentWorkout;
        
        // Atualizar informações do treino
        this.updateElement('#workout-name', workout.nome || 'Treino do Dia');
        this.updateElement('#workout-title', workout.nome || 'Treino do Dia');
        this.updateElement('#current-week', workout.semana_atual || '1');
        
        // Grupos musculares
        const grupos = this.extractMuscleGroups(workout.exercicios);
        this.updateElement('#muscle-groups', grupos);
        
        // Total de exercícios
        const totalExercises = workout.exercicios.length;
        this.updateElement('#total-exercises', totalExercises.toString());
        this.updateElement('#current-exercise-number', '1');
        
        // Reset progress bar
        if (this.elements.progressBar) {
            this.elements.progressBar.style.width = '0%';
        }
        
        console.log('[WorkoutScreen] ✅ UI configurada');
    }
    
    /**
     * Configura event listeners
     */
    setupEventListeners() {
        // Botão de sair
        if (this.elements.exitButton) {
            this.addEventListener(this.elements.exitButton, 'click', () => this.handleExit());
        }
        
        // Botão de pausar
        if (this.elements.pauseButton) {
            this.addEventListener(this.elements.pauseButton, 'click', () => this.handlePause());
        }
        
        // Listeners de eventos do sistema
        const unsubscribeExerciseComplete = eventBus.on(SystemEvents.EXERCISE_COMPLETED, 
            (data) => this.onExerciseCompleted(data)
        );
        
        const unsubscribeSeriesComplete = eventBus.on(SystemEvents.SERIES_COMPLETED,
            (data) => this.onSeriesCompleted(data)
        );
        
        // Guardar unsubscribe functions para cleanup
        this.eventUnsubscribers = [
            unsubscribeExerciseComplete,
            unsubscribeSeriesComplete
        ];
        
        console.log('[WorkoutScreen] ✅ Event listeners configurados');
    }
    
    /**
     * Verifica se deve recuperar sessão anterior
     */
    async checkForRecovery() {
        try {
            const savedState = await this.persistenceManager.loadState();
            
            if (!savedState) return false;
            
            // Verificar se é o mesmo treino
            if (savedState.workoutId !== this.currentWorkout.id) return false;
            
            // Verificar se não está muito antigo (máx 2 horas)
            const elapsed = Date.now() - savedState.timestamp;
            if (elapsed > 2 * 60 * 60 * 1000) return false;
            
            // Verificar se tem progresso real
            if (!savedState.exercisesCompleted || savedState.exercisesCompleted.length === 0) {
                return false;
            }
            
            return true;
            
        } catch (error) {
            console.error('[WorkoutScreen] Erro ao verificar recovery:', error);
            return false;
        }
    }
    
    /**
     * Recupera sessão anterior
     */
    async recoverSession() {
        console.log('[WorkoutScreen] Recuperando sessão anterior...');
        
        try {
            const savedState = await this.persistenceManager.loadState();
            
            // Restaurar estado
            this.sessionId = savedState.sessionId;
            this.startTime = savedState.startTime;
            this.currentExerciseIndex = savedState.currentExerciseIndex || 0;
            this.exercisesCompleted = savedState.exercisesCompleted || [];
            
            // Renderizar exercícios
            await this.renderExercises();
            
            // Destacar exercício atual
            this.highlightCurrentExercise();
            
            // Atualizar progresso
            this.updateProgress();
            
            // Iniciar timer do ponto salvo
            this.timerManager.start(this.startTime);
            
            showNotification('Treino restaurado com sucesso!', 'success');
            
        } catch (error) {
            console.error('[WorkoutScreen] Erro ao recuperar sessão:', error);
            showNotification('Erro ao recuperar treino. Iniciando novo...', 'warning');
            await this.startNewSession();
        }
    }
    
    /**
     * Inicia nova sessão de treino
     */
    async startNewSession() {
        console.log('[WorkoutScreen] Iniciando nova sessão...');
        
        // Gerar novo ID de sessão
        this.sessionId = `workout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.startTime = Date.now();
        this.currentExerciseIndex = 0;
        this.exercisesCompleted = [];
        
        // Solicitar disposição inicial
        await this.requestInitialMood();
        
        // Renderizar exercícios
        await this.renderExercises();
        
        // Destacar primeiro exercício
        this.highlightCurrentExercise();
        
        // Iniciar timer
        this.timerManager.start();
        
        // Salvar estado inicial
        await this.saveState();
    }
    
    /**
     * Solicita disposição inicial do usuário
     */
    async requestInitialMood() {
        try {
            const DisposicaoInicioModal = window.DisposicaoInicioModal;
            
            if (!DisposicaoInicioModal) {
                console.warn('[WorkoutScreen] Modal de disposição não disponível');
                return;
            }
            
            const mood = await modalManager.show(DisposicaoInicioModal);
            
            if (mood !== null) {
                // Salvar disposição
                await DisposicaoInicioModal.salvarValor(mood);
                console.log('[WorkoutScreen] Disposição inicial:', mood);
            }
            
        } catch (error) {
            console.error('[WorkoutScreen] Erro ao solicitar disposição:', error);
            // Não é crítico, continuar sem disposição
        }
    }
    
    /**
     * Renderiza lista de exercícios
     */
    async renderExercises() {
        const container = this.elements.exercisesContainer;
        if (!container) return;
        
        // Limpar container
        container.innerHTML = '';
        
        // Renderizar cada exercício
        this.currentWorkout.exercicios.forEach((exercicio, index) => {
            const card = this.createExerciseCard(exercicio, index);
            container.appendChild(card);
        });
        
        console.log('[WorkoutScreen] ✅ Exercícios renderizados');
    }
    
    /**
     * Cria card de exercício
     */
    createExerciseCard(exercicio, index) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'exercise-card';
        cardDiv.id = `exercise-card-${index}`;
        
        // Usar template se disponível
        if (typeof exerciseCardTemplate === 'function') {
            cardDiv.innerHTML = exerciseCardTemplate(exercicio, index);
        } else {
            // Fallback simples
            cardDiv.innerHTML = `
                <div class="exercise-header">
                    <h3>${exercicio.exercicio_nome || 'Exercício'}</h3>
                    <span class="exercise-sets">${exercicio.series || 3} séries</span>
                </div>
                <div class="exercise-details">
                    <span>Reps: ${exercicio.repeticoes || '10-12'}</span>
                    <span>Descanso: ${exercicio.tempo_descanso || 60}s</span>
                </div>
            `;
        }
        
        // Adicionar listener de clique
        cardDiv.addEventListener('click', () => this.selectExercise(index));
        
        return cardDiv;
    }
    
    /**
     * Destaca exercício atual
     */
    highlightCurrentExercise() {
        // Remover destaque anterior
        this.querySelectorAll('.exercise-card').forEach(card => {
            card.classList.remove('current-exercise');
        });
        
        // Adicionar destaque ao atual
        const currentCard = this.querySelector(`#exercise-card-${this.currentExerciseIndex}`);
        if (currentCard) {
            currentCard.classList.add('current-exercise');
            currentCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    /**
     * Seleciona um exercício
     */
    selectExercise(index) {
        this.currentExerciseIndex = index;
        this.highlightCurrentExercise();
    }
    
    /**
     * Atualiza barra de progresso
     */
    updateProgress() {
        const total = this.currentWorkout.exercicios.length;
        const completed = this.exercisesCompleted.length;
        const percentage = (completed / total) * 100;
        
        if (this.elements.progressBar) {
            this.elements.progressBar.style.width = `${percentage}%`;
        }
        
        this.updateElement('#current-exercise-number', (completed + 1).toString());
    }
    
    /**
     * Manipula conclusão de exercício
     */
    onExerciseCompleted(data) {
        console.log('[WorkoutScreen] Exercício completado:', data);
        
        this.exercisesCompleted.push({
            exerciseIndex: data.exerciseIndex,
            timestamp: Date.now(),
            series: data.series
        });
        
        // Atualizar progresso
        this.updateProgress();
        
        // Salvar estado
        this.saveState();
        
        // Avançar para próximo exercício
        if (this.currentExerciseIndex < this.currentWorkout.exercicios.length - 1) {
            this.currentExerciseIndex++;
            this.highlightCurrentExercise();
        } else {
            // Treino completo
            this.completeWorkout();
        }
    }
    
    /**
     * Manipula conclusão de série
     */
    onSeriesCompleted(data) {
        console.log('[WorkoutScreen] Série completada:', data);
        
        // Iniciar timer de descanso
        if (this.timerManager) {
            this.timerManager.startRestTimer(data.restTime);
        }
        
        // Salvar estado
        this.saveState();
    }
    
    /**
     * Completa o treino
     */
    async completeWorkout() {
        console.log('[WorkoutScreen] Treino completo!');
        
        try {
            // Parar timer
            this.timerManager.stop();
            
            // Calcular dados finais
            const duration = Date.now() - this.startTime;
            
            // Emitir evento
            eventBus.emit(SystemEvents.WORKOUT_COMPLETED, {
                workout: this.currentWorkout,
                sessionId: this.sessionId,
                duration,
                exercisesCompleted: this.exercisesCompleted
            });
            
            // Mostrar modal de conclusão
            // TODO: Implementar CompletionModal
            
            showNotification('Treino concluído com sucesso! 🎉', 'success');
            
            // Limpar cache
            await this.persistenceManager.clearState();
            
            // Navegar para home após delay
            setTimeout(() => {
                eventBus.emit('navigate-to', 'home-screen');
            }, 2000);
            
        } catch (error) {
            console.error('[WorkoutScreen] Erro ao completar treino:', error);
        }
    }
    
    /**
     * Manipula saída do treino
     */
    async handleExit() {
        try {
            // Mostrar modal de confirmação
            const SaveExitModal = await import('../components/SaveExitModal.js');
            const choice = await modalManager.show(SaveExitModal.default, {
                workoutData: this.getState()
            });
            
            switch (choice) {
                case 'save-exit':
                    await this.saveAndExit();
                    break;
                    
                case 'exit-no-save':
                    await this.exitWithoutSave();
                    break;
                    
                case 'cancel':
                default:
                    // Continuar treino
                    break;
            }
            
        } catch (error) {
            console.error('[WorkoutScreen] Erro ao sair:', error);
        }
    }
    
    /**
     * Salva e sai
     */
    async saveAndExit() {
        await this.saveState();
        await this.cleanup();
        eventBus.emit('navigate-to', 'home-screen');
    }
    
    /**
     * Sai sem salvar
     */
    async exitWithoutSave() {
        await this.persistenceManager.clearState();
        await this.cleanup();
        eventBus.emit('navigate-to', 'home-screen');
    }
    
    /**
     * Pausa treino
     */
    handlePause() {
        if (this.timerManager.isPaused()) {
            this.timerManager.resume();
            eventBus.emit(SystemEvents.WORKOUT_RESUMED);
            showNotification('Treino retomado', 'info');
        } else {
            this.timerManager.pause();
            eventBus.emit(SystemEvents.WORKOUT_PAUSED);
            showNotification('Treino pausado', 'info');
        }
    }
    
    /**
     * Salva estado atual
     */
    async saveState() {
        const state = this.getState();
        await this.persistenceManager.saveState(state);
        AppState.set('lastWorkoutSave', Date.now());
    }
    
    /**
     * Obtém estado atual
     */
    getState() {
        return {
            workoutId: this.currentWorkout.id,
            workoutName: this.currentWorkout.nome,
            sessionId: this.sessionId,
            startTime: this.startTime,
            currentExerciseIndex: this.currentExerciseIndex,
            exercisesCompleted: this.exercisesCompleted,
            timestamp: Date.now()
        };
    }
    
    /**
     * Obtém progresso atual
     */
    getProgress() {
        const total = this.currentWorkout.exercicios.length;
        const completed = this.exercisesCompleted.length;
        
        return {
            completed,
            total,
            percentage: Math.round((completed / total) * 100)
        };
    }
    
    /**
     * Extrai grupos musculares únicos
     */
    extractMuscleGroups(exercicios) {
        const grupos = exercicios
            .map(ex => ex.exercicios?.grupo_muscular || ex.grupo_muscular || '')
            .filter((grupo, index, array) => grupo && array.indexOf(grupo) === index);
            
        return grupos.join(', ') || 'Treino de Força';
    }
    
    /**
     * Cleanup adicional
     */
    async cleanup() {
        // Remover event listeners do eventBus
        if (this.eventUnsubscribers) {
            this.eventUnsubscribers.forEach(unsubscribe => unsubscribe());
        }
        
        // Chamar cleanup da classe pai
        super.cleanup();
    }
}

export default WorkoutScreen;