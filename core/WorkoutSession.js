/**
 * WorkoutSession.js - Gerenciador principal da sessão de treino
 * 
 * Responsabilidades:
 * - Garantir que o DOM está pronto antes de qualquer operação
 * - Coordenar a inicialização de todos os componentes
 * - Gerenciar o ciclo de vida da sessão de treino
 */

export class WorkoutSession {
    constructor() {
        this.isInitialized = false;
        this.components = new Map();
        this.currentWorkout = null;
        this.exerciciosExecutados = [];
        this.timers = new Map();
        
        // Bind methods
        this.init = this.init.bind(this);
        this.render = this.render.bind(this);
        this.destroy = this.destroy.bind(this);
    }
    
    /**
     * Inicializa a sessão de treino
     * @param {Object} workout - Dados do treino
     * @param {Object} options - Opções de inicialização
     */
    async init(workout, options = {}) {
        if (this.isInitialized) {
            console.warn('[WorkoutSession] Já inicializado');
            return;
        }
        
        try {
            console.log('[WorkoutSession] Iniciando sessão...');
            
            // 1. Validar dados do treino
            if (!workout || !workout.exercicios || workout.exercicios.length === 0) {
                throw new Error('Dados do treino inválidos ou incompletos');
            }
            
            this.currentWorkout = workout;
            
            // 2. Garantir que o DOM está pronto
            await this.waitForDOM();
            
            // 3. Renderizar template base
            await this.renderTemplate();
            
            // 4. Inicializar componentes na ordem correta
            await this.initializeComponents();
            
            // 5. Restaurar estado se houver
            if (options.restore) {
                await this.restoreState(options.restoreData);
            }
            
            // 6. Iniciar timers
            this.startTimers();
            
            this.isInitialized = true;
            console.log('[WorkoutSession] ✅ Sessão inicializada com sucesso');
            
        } catch (error) {
            console.error('[WorkoutSession] ❌ Erro na inicialização:', error);
            throw error;
        }
    }
    
    /**
     * Aguarda o DOM estar completamente carregado
     */
    async waitForDOM() {
        if (document.readyState === 'complete') {
            return Promise.resolve();
        }
        
        return new Promise((resolve) => {
            const handler = () => {
                if (document.readyState === 'complete') {
                    document.removeEventListener('readystatechange', handler);
                    resolve();
                }
            };
            document.addEventListener('readystatechange', handler);
        });
    }
    
    /**
     * Renderiza o template base do treino
     */
    async renderTemplate() {
        const container = document.getElementById('app');
        if (!container) {
            throw new Error('Container principal #app não encontrado');
        }
        
        // Verificar se já existe uma tela de workout
        let workoutScreen = document.getElementById('workout-screen');
        
        if (!workoutScreen) {
            // Importar e renderizar template
            const { workoutTemplate } = await import('../templates/workoutExecution.js');
            
            if (typeof workoutTemplate !== 'function') {
                throw new Error('Template de workout não é uma função válida');
            }
            
            // Criar elemento da tela
            workoutScreen = document.createElement('div');
            workoutScreen.id = 'workout-screen';
            workoutScreen.className = 'screen active';
            workoutScreen.innerHTML = workoutTemplate();
            
            // Limpar container e adicionar nova tela
            container.innerHTML = '';
            container.appendChild(workoutScreen);
        }
        
        // Garantir que está visível
        workoutScreen.style.display = 'block';
        workoutScreen.classList.add('active');
        
        // Aguardar próximo frame para garantir renderização
        await new Promise(resolve => requestAnimationFrame(resolve));
    }
    
    /**
     * Inicializa todos os componentes necessários
     */
    async initializeComponents() {
        // 1. Header e informações básicas
        await this.initializeHeader();
        
        // 2. Container de exercícios
        await this.initializeExercises();
        
        // 3. Sistema de modais
        await this.initializeModals();
        
        // 4. Event listeners
        this.setupEventListeners();
    }
    
    /**
     * Inicializa o header com informações do treino
     */
    async initializeHeader() {
        const elements = {
            workoutName: document.getElementById('workout-name'),
            currentWeek: document.getElementById('current-week'),
            muscleGroups: document.getElementById('muscle-groups'),
            totalExercises: document.getElementById('total-exercises'),
            timerDisplay: document.getElementById('workout-timer-display')
        };
        
        // Verificar elementos críticos
        if (!elements.workoutName || !elements.timerDisplay) {
            throw new Error('Elementos críticos do header não encontrados');
        }
        
        // Atualizar informações
        elements.workoutName.textContent = this.currentWorkout.nome || 'Treino';
        
        if (elements.currentWeek) {
            elements.currentWeek.textContent = `Semana ${this.currentWorkout.semana_atual || 1}`;
        }
        
        if (elements.muscleGroups && this.currentWorkout.exercicios) {
            const grupos = [...new Set(
                this.currentWorkout.exercicios
                    .map(ex => ex.grupo_muscular)
                    .filter(Boolean)
            )].join(', ');
            elements.muscleGroups.textContent = grupos || 'Treino';
        }
        
        if (elements.totalExercises) {
            elements.totalExercises.textContent = this.currentWorkout.exercicios.length;
        }
        
        // Salvar referências
        this.components.set('header', elements);
    }
    
    /**
     * Inicializa o container de exercícios
     */
    async initializeExercises() {
        // Procurar container
        const container = this.findExercisesContainer();
        
        if (!container) {
            throw new Error('Container de exercícios não encontrado no template');
        }
        
        // Garantir visibilidade
        container.style.display = 'block';
        
        // Limpar conteúdo anterior
        container.innerHTML = '';
        
        // Renderizar cada exercício
        this.currentWorkout.exercicios.forEach((exercicio, index) => {
            const card = this.createExerciseCard(exercicio, index);
            container.appendChild(card);
        });
        
        // Salvar referência
        this.components.set('exercisesContainer', container);
        
        // Atualizar contador se existir
        const summaryCount = document.getElementById('summary-exercise-count');
        if (summaryCount) {
            summaryCount.textContent = `${this.currentWorkout.exercicios.length} ex`;
        }
    }
    
    /**
     * Procura o container de exercícios
     */
    findExercisesContainer() {
        const ids = ['exercises-expanded', 'exercises-container'];
        
        for (const id of ids) {
            const element = document.getElementById(id);
            if (element) {
                return element;
            }
        }
        
        return null;
    }
    
    /**
     * Cria um card de exercício
     */
    createExerciseCard(exercicio, index) {
        const card = document.createElement('div');
        card.id = `exercise-card-${index}`;
        card.className = 'exercise-card';
        card.innerHTML = this.renderExerciseCard(exercicio, index);
        
        // Adicionar event listeners para os botões de série
        this.setupSeriesListeners(card, exercicio, index);
        
        return card;
    }
    
    /**
     * Renderiza o HTML de um exercício
     */
    renderExerciseCard(exercicio, index) {
        const numSeries = exercicio.series || 3;
        const repsAlvo = exercicio.repeticoes_alvo || exercicio.repeticoes || '12';
        const pesoSugerido = exercicio.peso_sugerido || exercicio.carga || 0;
        
        return `
            <div class="exercise-header">
                <h3>${exercicio.nome}</h3>
                <span class="exercise-info">${numSeries}x${repsAlvo} - ${pesoSugerido}kg</span>
            </div>
            <div class="series-container">
                ${this.renderSeries(exercicio, index, numSeries, repsAlvo, pesoSugerido)}
            </div>
        `;
    }
    
    /**
     * Renderiza as séries de um exercício
     */
    renderSeries(exercicio, exerciseIndex, numSeries, repsAlvo, pesoSugerido) {
        let html = '';
        
        for (let i = 0; i < numSeries; i++) {
            const isCompleted = exercicio.seriesCompletas && exercicio.seriesCompletas[i];
            
            html += `
                <div class="series-item ${isCompleted ? 'completed' : ''}" data-series="${i}">
                    <span class="series-number">${i + 1}</span>
                    <input type="number" class="series-weight" 
                           data-exercise="${exerciseIndex}" 
                           data-series="${i}"
                           value="${pesoSugerido}" 
                           ${isCompleted ? 'disabled' : ''}>
                    <span>kg x</span>
                    <input type="number" class="series-reps" 
                           data-exercise="${exerciseIndex}" 
                           data-series="${i}"
                           value="${repsAlvo}" 
                           ${isCompleted ? 'disabled' : ''}>
                    <button class="series-confirm-btn ${isCompleted ? 'completed' : ''}"
                            data-exercise="${exerciseIndex}"
                            data-series="${i}"
                            ${isCompleted ? 'disabled' : ''}>
                        ${isCompleted ? '✓' : 'OK'}
                    </button>
                </div>
            `;
        }
        
        return html;
    }
    
    /**
     * Configura listeners para os botões de série
     */
    setupSeriesListeners(card, exercicio, exerciseIndex) {
        const buttons = card.querySelectorAll('.series-confirm-btn:not(.completed)');
        
        buttons.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const seriesIndex = parseInt(btn.dataset.series);
                await this.confirmSeries(exerciseIndex, seriesIndex);
            });
        });
    }
    
    /**
     * Confirma a execução de uma série
     */
    async confirmSeries(exerciseIndex, seriesIndex) {
        const exercicio = this.currentWorkout.exercicios[exerciseIndex];
        if (!exercicio) return;
        
        // Inicializar array se necessário
        if (!exercicio.seriesCompletas) {
            exercicio.seriesCompletas = [];
        }
        
        // Evitar duplicação
        if (exercicio.seriesCompletas[seriesIndex]) return;
        
        // Capturar dados
        const weightInput = document.querySelector(
            `.series-weight[data-exercise="${exerciseIndex}"][data-series="${seriesIndex}"]`
        );
        const repsInput = document.querySelector(
            `.series-reps[data-exercise="${exerciseIndex}"][data-series="${seriesIndex}"]`
        );
        
        const peso = parseFloat(weightInput?.value) || 0;
        const reps = parseInt(repsInput?.value) || 0;
        
        // Salvar execução
        this.exerciciosExecutados.push({
            exercicio_id: exercicio.id,
            exercicio_nome: exercicio.nome,
            serie_numero: seriesIndex + 1,
            peso_utilizado: peso,
            repeticoes: reps,
            timestamp: new Date().toISOString()
        });
        
        // Marcar como completa
        exercicio.seriesCompletas[seriesIndex] = true;
        
        // Atualizar UI
        const btn = document.querySelector(
            `.series-confirm-btn[data-exercise="${exerciseIndex}"][data-series="${seriesIndex}"]`
        );
        if (btn) {
            btn.textContent = '✓';
            btn.classList.add('completed');
            btn.disabled = true;
        }
        
        // Desabilitar inputs
        if (weightInput) weightInput.disabled = true;
        if (repsInput) repsInput.disabled = true;
        
        // Salvar estado
        await this.saveState();
        
        // Verificar se deve mostrar descanso
        const totalSeries = exercicio.series || 3;
        const completedSeries = exercicio.seriesCompletas.filter(Boolean).length;
        
        if (completedSeries < totalSeries) {
            // Descanso entre séries
            await this.showRestTimer(exercicio.tempo_descanso || 60);
        } else {
            // Exercício completo
            const isLastExercise = exerciseIndex >= this.currentWorkout.exercicios.length - 1;
            
            if (!isLastExercise) {
                // Descanso entre exercícios
                await this.showRestTimer(90); // Tempo extra entre exercícios
            } else {
                // Treino completo
                await this.completeWorkout();
            }
        }
    }
    
    /**
     * Mostra o timer de descanso
     */
    async showRestTimer(duration) {
        const modal = document.getElementById('rest-timer-overlay');
        if (!modal) {
            console.error('[WorkoutSession] Modal de descanso não encontrado');
            return;
        }
        
        // Configurar modal
        modal.style.display = 'flex';
        
        let remaining = duration;
        const display = document.getElementById('rest-timer-display');
        const skipBtn = document.getElementById('skip-rest');
        
        if (!display) return;
        
        // Atualizar display
        const updateDisplay = () => {
            const minutes = Math.floor(remaining / 60);
            const seconds = remaining % 60;
            display.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        };
        
        updateDisplay();
        
        // Timer
        const interval = setInterval(() => {
            remaining--;
            updateDisplay();
            
            if (remaining <= 0) {
                clearInterval(interval);
                modal.style.display = 'none';
            }
        }, 1000);
        
        // Skip button
        if (skipBtn) {
            const skipHandler = () => {
                clearInterval(interval);
                modal.style.display = 'none';
                skipBtn.removeEventListener('click', skipHandler);
            };
            skipBtn.addEventListener('click', skipHandler);
        }
        
        // Salvar referência do timer
        this.timers.set('rest', interval);
    }
    
    /**
     * Inicializa o sistema de modais
     */
    async initializeModals() {
        // Verificar se modais existem no DOM
        const modals = {
            rest: document.getElementById('rest-timer-overlay'),
            completion: document.getElementById('workout-completion')
        };
        
        // Se não existirem, adicionar ao DOM
        if (!modals.rest) {
            await this.createRestModal();
        }
        
        this.components.set('modals', modals);
    }
    
    /**
     * Cria o modal de descanso se não existir
     */
    async createRestModal() {
        const modal = document.createElement('div');
        modal.id = 'rest-timer-overlay';
        modal.className = 'rest-timer-overlay';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.9);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        modal.innerHTML = `
            <div class="rest-timer-content" style="
                background: #2a2a2a;
                padding: 32px;
                border-radius: 16px;
                text-align: center;
                min-width: 300px;
            ">
                <h2 style="color: white; margin: 0 0 24px 0;">Tempo de Descanso</h2>
                <div id="rest-timer-display" style="
                    font-size: 3rem;
                    color: #a8ff00;
                    font-weight: bold;
                    margin: 24px 0;
                ">0:00</div>
                <button id="skip-rest" style="
                    background: #a8ff00;
                    color: black;
                    border: none;
                    padding: 12px 32px;
                    border-radius: 8px;
                    font-weight: bold;
                    cursor: pointer;
                ">Pular Descanso</button>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    /**
     * Configura event listeners globais
     */
    setupEventListeners() {
        // Botão voltar
        const backBtn = document.querySelector('.back-button-float');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.handleExit());
        }
    }
    
    /**
     * Inicia os timers
     */
    startTimers() {
        // Timer principal do treino
        const startTime = Date.now();
        
        const updateTimer = () => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            
            const display = document.getElementById('workout-timer-display');
            if (display) {
                display.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
        };
        
        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        this.timers.set('main', interval);
    }
    
    /**
     * Salva o estado atual
     */
    async saveState() {
        const state = {
            workout: this.currentWorkout,
            executions: this.exerciciosExecutados,
            timestamp: Date.now()
        };
        
        try {
            localStorage.setItem('workout_state', JSON.stringify(state));
            console.log('[WorkoutSession] Estado salvo');
        } catch (error) {
            console.error('[WorkoutSession] Erro ao salvar estado:', error);
        }
    }
    
    /**
     * Restaura estado salvo
     */
    async restoreState(data) {
        if (!data) return;
        
        this.currentWorkout = data.workout;
        this.exerciciosExecutados = data.executions || [];
        
        // Re-renderizar com estado restaurado
        await this.initializeExercises();
    }
    
    /**
     * Completa o treino
     */
    async completeWorkout() {
        console.log('[WorkoutSession] Treino completo!');
        
        // Parar timers
        this.stopTimers();
        
        // Mostrar modal de conclusão ou navegar
        if (window.showNotification) {
            window.showNotification('Treino concluído com sucesso!', 'success');
        }
        
        // Limpar estado
        localStorage.removeItem('workout_state');
        
        // Navegar para home após delay
        setTimeout(() => {
            this.navigateHome();
        }, 2000);
    }
    
    /**
     * Lida com saída do treino
     */
    async handleExit() {
        if (confirm('Deseja salvar o progresso antes de sair?')) {
            await this.saveState();
        }
        this.navigateHome();
    }
    
    /**
     * Navega para home
     */
    navigateHome() {
        this.destroy();
        
        if (window.renderTemplate) {
            window.renderTemplate('home');
        } else {
            window.location.href = '/';
        }
    }
    
    /**
     * Para todos os timers
     */
    stopTimers() {
        this.timers.forEach((interval) => {
            clearInterval(interval);
        });
        this.timers.clear();
    }
    
    /**
     * Destrói a sessão e limpa recursos
     */
    destroy() {
        console.log('[WorkoutSession] Destruindo sessão...');
        
        // Parar timers
        this.stopTimers();
        
        // Limpar componentes
        this.components.clear();
        
        // Resetar estado
        this.isInitialized = false;
        this.currentWorkout = null;
        this.exerciciosExecutados = [];
    }
}

// Exportar classe
export { WorkoutSession };
export default WorkoutSession;