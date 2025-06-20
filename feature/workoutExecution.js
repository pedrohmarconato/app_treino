// VERSÃO RESTAURADA - BASEADA NO V2 FUNCIONAL
// feature/workoutExecution.js - LAYOUT INTEGRADO
import WorkoutProtocolService from '../services/workoutProtocolService.js';
import AppState from '../state/appState.js';
import { showNotification } from '../ui/notifications.js';
import { workoutTemplate, exerciseCardTemplate } from '../templates/workoutExecution.js';
import TreinoCacheService from '../services/treinoCacheService.js';
import { getActionIcon, getAchievementIcon, getWorkoutIcon } from '../utils/icons.js';
import { nowInSaoPaulo, toSaoPauloDateString, toSaoPauloISOString } from '../utils/timezoneUtils.js';
import { workoutPersistence } from '../services/treinoCacheService.js';

// Importação dinâmica e segura do modal
let DisposicaoInicioModal = null;

// Função para garantir que o modal esteja carregado
async function ensureModalLoaded() {
    console.log('[MODAL LOADER] 🔄 Verificando carregamento do DisposicaoInicioModal...');
    
    if (DisposicaoInicioModal) {
        console.log('[MODAL LOADER] ✅ Modal já carregado via import');
        return DisposicaoInicioModal;
    }
    
    // Verificar se está disponível globalmente
    if (window.DisposicaoInicioModal) {
        console.log('[MODAL LOADER] ✅ Modal encontrado em window.DisposicaoInicioModal');
        DisposicaoInicioModal = window.DisposicaoInicioModal;
        return DisposicaoInicioModal;
    }
    
    // Tentar importação dinâmica
    try {
        console.log('[MODAL LOADER] 🔄 Tentando importação dinâmica...');
        const modalModule = await import('../components/disposicaoInicioModal.js');
        DisposicaoInicioModal = modalModule.default;
        
        // Disponibilizar globalmente para outros usos
        window.DisposicaoInicioModal = DisposicaoInicioModal;
        
        console.log('[MODAL LOADER] ✅ Importação dinâmica bem-sucedida');
        return DisposicaoInicioModal;
    } catch (error) {
        console.error('[MODAL LOADER] ❌ Erro na importação dinâmica:', error);
        throw new Error(`Falha ao carregar DisposicaoInicioModal: ${error.message}`);
    }
}

// Verificação de dependências críticas antes da execução
async function verificarDependenciasCriticas() {
    console.log('[WORKOUT DEPENDENCIES] 🔍 Verificando dependências críticas...');
    
    const verificacoes = {
        DOM: document.readyState === 'complete' || document.readyState === 'interactive',
        body: !!document.body,
        supabase: !!window.supabase,
        AppState: !!AppState,
        workoutPersistence: !!workoutPersistence
    };
    
    console.log('[WORKOUT DEPENDENCIES] 📋 Status das dependências:', verificacoes);
    
    const falhas = Object.entries(verificacoes)
        .filter(([_, status]) => !status)
        .map(([dep]) => dep);
    
    if (falhas.length > 0) {
        console.error('[WORKOUT DEPENDENCIES] ❌ Dependências faltando:', falhas);
        throw new Error(`Dependências críticas não disponíveis: ${falhas.join(', ')}`);
    }
    
    // Verificar e carregar o modal
    try {
        await ensureModalLoaded();
        console.log('[WORKOUT DEPENDENCIES] ✅ Modal carregado com sucesso');
    } catch (error) {
        console.error('[WORKOUT DEPENDENCIES] ❌ Falha ao carregar modal:', error);
        throw error;
    }
    
    console.log('[WORKOUT DEPENDENCIES] ✅ Todas as dependências verificadas');
}

class WorkoutExecutionManager {
    constructor() {
        this.currentWorkout = null;
        this.exerciciosExecutados = [];
        this.startTime = null;
        this.timerInterval = null;
        this.restTimerInterval = null;
        this.autoSaveInterval = null;
        this.currentRestTime = 0;
        this.currentExerciseIndex = 0;
        this.disposicaoInicio = null;
        this.seriesElement = document.getElementById('series-counter'); // Declaração segura
        this.persistence = workoutPersistence;
        this.modalSaidaAtivo = false;
        this.estaEmModoEmergencia = false;
        
        // === ENHANCED PROPERTIES ===
        this.isInitialized = false;
        this.sessionId = null;
        this.lastSaveTime = null;
        this.autoSaveEnabled = true;
        this.autoSaveIntervalMs = 30000; // 30 segundos
        
        // Bind methods para event listeners
        this.handleExit = this.handleExit.bind(this);
        this.autoSave = this.autoSave.bind(this);
        this.handleBeforeUnload = this.handleBeforeUnload.bind(this);
    }

    async iniciarTreino() {
        console.log('[WorkoutExecution] 🔥 MÉTODO INICIAR TREINO CHAMADO - INÍCIO ABSOLUTO');
        console.log('[WorkoutExecution] 📍 Stack trace do chamador:', new Error().stack);
        
        try {
            console.log('[WorkoutExecution] 🚀 Iniciando treino...');
            console.log('[WorkoutExecution] 📋 Estado inicial:', {
                currentWorkout: this.currentWorkout,
                persistence: !!this.persistence,
                DOM_ready: document.readyState
            });
            
            const currentUser = AppState.get('currentUser');
            if (!currentUser) {
                console.error('[WorkoutExecution] ❌ Usuário não encontrado no AppState');
                throw new Error('Usuário não encontrado');
            }
            
            console.log('[WorkoutExecution] 👤 Usuário atual:', currentUser.nome, `(ID: ${currentUser.id})`);

            // Verificar recovery usando NavigationGuard
            try {
                const { checkAndShowRecovery } = await import('../ui/navigation.js');
                const recoveryResult = await checkAndShowRecovery();
                
                if (recoveryResult && recoveryResult.action === 'recover') {
                    console.log('[WorkoutExecution] 🔄 Recuperando treino via NavigationGuard...');
                    await this.recuperarTreinoEmAndamento(recoveryResult.data);
                    console.log('[WorkoutExecution] 🚪 SAINDO DO MÉTODO - TREINO RECUPERADO');
                    return;
                } else if (recoveryResult && recoveryResult.action === 'discard') {
                    console.log('[WorkoutExecution] 🗑️ Descartando dados anteriores e iniciando novo treino');
                    // Dados já foram limpos pelo NavigationGuard
                }
                
            } catch (recoveryError) {
                console.warn('[WorkoutExecution] ⚠️ Erro na verificação de recovery:', recoveryError);
                
                // Fallback: verificar persistence diretamente
                try {
                    const stateRecuperado = await this.persistence.restoreState();
                    if (stateRecuperado) {
                        const desejaRecuperar = await this.confirmarRecuperacao();
                        if (desejaRecuperar) {
                            console.log('[WorkoutExecution] 🔄 Recuperando treino (fallback)...');
                            await this.recuperarTreinoEmAndamento(stateRecuperado);
                            console.log('[WorkoutExecution] 🚪 SAINDO DO MÉTODO - TREINO RECUPERADO (FALLBACK)');
                            return;
                        } else {
                            // Usuário optou por iniciar novo treino
                            if (this.persistence?.clearState) {
                                await this.persistence.clearState();
                            }
                        }
                    }
                } catch (persistenceError) {
                    console.warn('[WorkoutExecution] ⚠️ Erro no fallback de persistence:', persistenceError);
                }
            }

            // Mostrar loading
            if (window.showNotification) {
                window.showNotification('Carregando treino...', 'info');
            }

            // Verificar se treino já está concluído ANTES de carregar dados
            console.log('[WorkoutExecution] 🔍 Verificando status de conclusão...');
            let statusConclusao = { concluido: false };
            if (window.WeeklyPlanService?.verificarTreinoConcluido) {
                try {
                    console.log('[WorkoutExecution] 📞 Chamando WeeklyPlanService.verificarTreinoConcluido...');
                    statusConclusao = await window.WeeklyPlanService.verificarTreinoConcluido(currentUser.id);
                    console.log('[WorkoutExecution] ✅ Status de conclusão obtido:', statusConclusao);
                } catch (error) {
                    console.warn('[WorkoutExecution] ⚠️ Erro ao verificar conclusão:', error);
                }
            } else {
                console.log('[WorkoutExecution] ⚠️ WeeklyPlanService.verificarTreinoConcluido não disponível');
            }
            
            // Bloquear se treino já está concluído
            if (statusConclusao.concluido) {
                console.log('[WorkoutExecution] 🚫 Treino já concluído, bloqueando...');
                if (window.showNotification) {
                    window.showNotification('⚠️ Treino já foi concluído hoje! 🎉', 'warning');
                }
                console.log('[WorkoutExecution] ❌ Tentativa de iniciar treino já concluído bloqueada');
                console.log('[WorkoutExecution] 🚪 SAINDO DO MÉTODO - TREINO JÁ CONCLUÍDO');
                return;
            }

            // Carregar treino do protocolo ANTES da disposição para verificar se há treino
            console.log('[WorkoutExecution] 📊 Carregando treino do protocolo...');
            console.log('[WorkoutExecution] 📞 Chamando WorkoutProtocolService.carregarTreinoParaExecucao...');
            this.currentWorkout = await WorkoutProtocolService.carregarTreinoParaExecucao(currentUser.id);
            console.log('[WorkoutExecution] ✅ Treino carregado do protocolo:', this.currentWorkout);
            
            if (!this.currentWorkout) {
                throw new Error('Nenhum treino encontrado para hoje. Configure seu planejamento semanal primeiro.');
            }

            // Verificar casos especiais ANTES da disposição (não faz sentido perguntar disposição para folga)
            if (this.currentWorkout.tipo === 'folga') {
                showNotification(`Hoje é dia de descanso! ${getWorkoutIcon('descanso', 'small')}`, 'info');
                console.log('[WorkoutExecution] 🚪 SAINDO DO MÉTODO - HOJE É FOLGA');
                return;
            }
            
            if (this.currentWorkout.tipo === 'cardio') {
                showNotification(`Treino de cardio! ${getWorkoutIcon('cardio', 'small')} Configure seu equipamento.`, 'info');
                console.log('[WorkoutExecution] 🚪 SAINDO DO MÉTODO - TREINO DE CARDIO');
                return;
            }

            // Verificar se há exercícios ANTES da disposição
            if (!this.currentWorkout.exercicios || this.currentWorkout.exercicios.length === 0) {
                throw new Error('Nenhum exercício encontrado no treino para hoje');
            }

            // Configurar estado inicial
            this.startTime = Date.now();
            this.exerciciosExecutados = [];
            this.currentExerciseIndex = 0;
            
            // Salvar no estado global e iniciar sessão
            AppState.set('currentWorkout', this.currentWorkout);
            AppState.startWorkoutSession(this.currentWorkout);
            
            // Salvar estado inicial para persistência
            await this.salvarEstadoAtual(true);
            
            console.log(`[WorkoutExecution] ✅ Treino carregado: ${this.currentWorkout.exercicios.length} exercícios`);
            
            // Navegar para tela de workout ANTES de solicitar disposição
            await this.navegarParaTelaWorkout();
            
            // Aguardar um pouco para a tela estar totalmente carregada
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Solicitar disposição inicial APÓS estar na tela de workout
            try {
                console.log('[DEBUG WORKOUT] 🚀 ==> INICIANDO CHAMADA DO MODAL <==');
                console.log('[DEBUG WORKOUT] 📍 Localização antes do modal:', window.location.href);
                console.log('[DEBUG WORKOUT] 📍 Document ready state:', document.readyState);
                console.log('[DEBUG WORKOUT] 📍 Body existe:', !!document.body);
                console.log('[DEBUG WORKOUT] 📍 Elementos no body:', document.body.children.length);
                
                // Verificação adicional do DOM
                await this.verificarEstadoDOM();
                
                // NOVO: Verificar dependências críticas e carregar modal
                await verificarDependenciasCriticas();
                
                // Garantir que o modal está carregado
                const ModalClass = await ensureModalLoaded();
                console.log('[DEBUG WORKOUT] ✅ Modal carregado com sucesso:', !!ModalClass);
                console.log('[DEBUG WORKOUT] 🔍 Modal.solicitar disponível:', typeof ModalClass?.solicitar);
                
                // Verificar se há outros modais abertos
                const existingModals = document.querySelectorAll('.modal-overlay');
                console.log('[DEBUG WORKOUT] 🔍 Modais existentes:', existingModals.length);
                existingModals.forEach((modal, i) => {
                    console.log(`[DEBUG WORKOUT] Modal ${i}:`, {
                        id: modal.id,
                        display: window.getComputedStyle(modal).display,
                        zIndex: window.getComputedStyle(modal).zIndex
                    });
                });
                
                console.log('[DEBUG WORKOUT] ⏰ Chamando DisposicaoInicioModal.solicitar()...');
                const startTime = Date.now();
                
                // Adicionar timeout para detectar travamentos
                const disposicaoPromise = ModalClass.solicitar();
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Modal timeout após 30 segundos')), 30000);
                });
                
                let disposicao;
                try {
                    disposicao = await Promise.race([disposicaoPromise, timeoutPromise]);
                } catch (timeoutError) {
                    console.error('[DEBUG WORKOUT] ⏰ TIMEOUT no modal:', timeoutError);
                    throw timeoutError;
                }
                
                const endTime = Date.now();
                console.log('[DEBUG WORKOUT] ⏱️ Modal retornou após:', endTime - startTime, 'ms');
                console.log('[DEBUG WORKOUT] ✅ Valor retornado pelo modal:', disposicao);
                console.log('[DEBUG WORKOUT] 🔍 Tipo do valor:', typeof disposicao, disposicao === null ? '(NULL)' : '');
                
                if (disposicao !== null) {
                    console.log('[DEBUG WORKOUT] 💾 Salvando disposição:', disposicao);
                    // Salva a disposição inicial
                    await ModalClass.salvarValor(disposicao);
                    console.log('[DEBUG WORKOUT] ✅ Disposição salva com sucesso');
                } else {
                    console.log('[DEBUG WORKOUT] ⚠️ Modal fechado sem valor (disposicao é null)');
                }
                
                console.log('[DEBUG WORKOUT] 🎬 Iniciando renderização do treino...');
                await this.renderizarComSeguranca();
                this.iniciarCronometro();
                
            } catch (dispErr) {
                console.error('[WorkoutExecution] ❌ ERRO ao solicitar disposição:', dispErr);
                console.error('[WorkoutExecution] ❌ Stack trace:', dispErr.stack);
                
                // Mesmo com erro no modal, renderizar treino
                console.log('[WorkoutExecution] 🎬 Renderizando treino apesar do erro no modal...');
                setTimeout(() => {
                    this.renderizarComSeguranca();
                    this.iniciarCronometro();
                }, 100);
            }
            
            console.log('[WorkoutExecution] 🎉 MÉTODO INICIAR TREINO CONCLUÍDO COM SUCESSO - FIM');
            
        } catch (error) {
            console.error('[WorkoutExecution] ❌ Erro ao iniciar treino:', error);
            if (window.showNotification) {
                window.showNotification('Erro ao carregar treino: ' + error.message, 'error');
            }
        }
    }

    // === ENHANCED WORKOUT MANAGER METHODS ===

    /**
     * Método principal para iniciar workout (substitui iniciarTreino)
     * Implementa verificação de cache, modal de recuperação e auto-save
     */
    async startWorkout() {
        console.log('[WorkoutManager] 🚀 STARTING WORKOUT - Enhanced Method');
        
        try {
            // 1. Verificar cache existente
            const cacheCheck = await this.checkExistingCache();
            
            if (cacheCheck.hasCache) {
                // 2. Mostrar modal de recuperação se necessário
                const recoveryDecision = await this.handleCacheRecovery(cacheCheck.data);
                
                if (recoveryDecision === 'recover') {
                    return await this.resumeFromCache(cacheCheck.data);
                } else if (recoveryDecision === 'discard') {
                    await TreinoCacheService.clearWorkoutState();
                }
                // Se 'cancel', continua com novo treino
            }
            
            // 3. Inicializar novo treino
            await this.initializeNewWorkout();
            
            // 4. Ativar auto-save e navigation guard
            this.activateWorkoutProtection();
            
            console.log('[WorkoutManager] ✅ Workout iniciado com sucesso');
            return true;
            
        } catch (error) {
            console.error('[WorkoutManager] ❌ Erro ao iniciar workout:', error);
            
            // Fallback para método antigo
            console.log('[WorkoutManager] 🔄 Usando método legacy como fallback');
            return await this.iniciarTreino();
        }
    }

    /**
     * Verifica se há cache existente
     */
    async checkExistingCache() {
        try {
            const workoutState = await TreinoCacheService.getWorkoutState();
            const hasActiveWorkout = await TreinoCacheService.hasActiveWorkout();
            
            return {
                hasCache: hasActiveWorkout && workoutState,
                data: workoutState,
                isValid: workoutState ? TreinoCacheService.validateState(workoutState) : false
            };
            
        } catch (error) {
            console.error('[WorkoutManager] Erro ao verificar cache:', error);
            return { hasCache: false, data: null, isValid: false };
        }
    }

    /**
     * Manipula recuperação de cache com modal
     */
    async handleCacheRecovery(cacheData) {
        try {
            const { SessionRecoveryModal } = await import('../components/SessionRecoveryModal.js');
            const modal = new SessionRecoveryModal(cacheData);
            const result = await modal.show();
            
            console.log('[WorkoutManager] Recovery modal result:', result);
            return result;
            
        } catch (error) {
            console.error('[WorkoutManager] Erro no modal de recovery:', error);
            
            // Fallback para confirm simples
            const recover = confirm('Foi encontrado um treino em andamento. Deseja continuar?');
            return recover ? 'recover' : 'discard';
        }
    }

    /**
     * Inicializa novo treino
     */
    async initializeNewWorkout() {
        const currentUser = AppState.get('currentUser');
        if (!currentUser) {
            throw new Error('Usuário não encontrado');
        }

        // Verificar se treino já foi concluído
        const statusConclusao = await this.checkWorkoutCompletion(currentUser.id);
        if (statusConclusao.concluido) {
            throw new Error('Treino já foi concluído hoje');
        }

        // Carregar treino do protocolo
        this.currentWorkout = await WorkoutProtocolService.carregarTreinoParaExecucao(currentUser.id);
        if (!this.currentWorkout) {
            throw new Error('Nenhum treino encontrado para hoje');
        }

        // Verificar casos especiais
        if (this.currentWorkout.tipo === 'folga') {
            throw new Error('Hoje é dia de descanso');
        }
        
        if (this.currentWorkout.tipo === 'cardio') {
            throw new Error('Treino de cardio detectado');
        }

        if (!this.currentWorkout.exercicios || this.currentWorkout.exercicios.length === 0) {
            throw new Error('Nenhum exercício encontrado no treino');
        }

        // Configurar estado inicial
        this.startTime = Date.now();
        this.exerciciosExecutados = [];
        this.currentExerciseIndex = 0;
        this.sessionId = AppState.generateSessionId();
        
        // Atualizar AppState
        AppState.set('currentWorkout', this.currentWorkout);
        AppState.startWorkoutSession(this.currentWorkout, this.sessionId);
        
        // Navegar para tela de workout
        await this.navegarParaTelaWorkout();
        
        // Salvar estado inicial
        await this.saveCurrentState(true);
        
        // Solicitar disposição inicial
        await this.requestInitialDisposition();
        
        // Renderizar treino
        await this.renderizarComSeguranca();
        this.iniciarCronometro();
        
        this.isInitialized = true;
    }

    /**
     * Ativa proteções do workout (auto-save, navigation guard)
     */
    activateWorkoutProtection() {
        // Ativar auto-save
        if (this.autoSaveEnabled) {
            this.startAutoSave();
        }
        
        // Adicionar listener para beforeunload
        window.addEventListener('beforeunload', this.handleBeforeUnload);
        
        console.log('[WorkoutManager] Proteções ativadas');
    }

    /**
     * Auto-save a cada intervalo configurado
     */
    startAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        
        this.autoSaveInterval = setInterval(async () => {
            try {
                await this.autoSave();
            } catch (error) {
                console.error('[WorkoutManager] Erro no auto-save:', error);
            }
        }, this.autoSaveIntervalMs);
        
        console.log('[WorkoutManager] Auto-save ativado:', this.autoSaveIntervalMs + 'ms');
    }

    /**
     * Executa auto-save se houver mudanças
     */
    async autoSave() {
        if (!this.isInitialized || !this.currentWorkout) {
            return;
        }
        
        try {
            const currentState = this.getState();
            await TreinoCacheService.saveWorkoutState(currentState, true);
            
            this.lastSaveTime = Date.now();
            AppState.markDataAsSaved();
            
            console.log('[WorkoutManager] Auto-save executado');
            
        } catch (error) {
            console.error('[WorkoutManager] Erro no auto-save:', error);
        }
    }

    /**
     * Manipula saída com modal de confirmação
     */
    async handleExit() {
        if (this.modalSaidaAtivo) {
            console.log('[WorkoutManager] Modal de saída já está ativo');
            return false;
        }
        
        this.modalSaidaAtivo = true;
        
        try {
            // 1. Pausar timers
            this.pauseTimers();
            
            // 2. Mostrar SaveExitModal
            const { SaveExitModal } = await import('../components/SaveExitModal.js');
            const modal = new SaveExitModal(this.getState());
            const userChoice = await modal.show();
            
            // 3. Processar escolha do usuário
            return await this.processExitChoice(userChoice);
            
        } catch (error) {
            console.error('[WorkoutManager] Erro no handleExit:', error);
            return false;
        } finally {
            this.modalSaidaAtivo = false;
        }
    }

    /**
     * Pausa todos os timers
     */
    pauseTimers() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        if (this.restTimerInterval) {
            clearInterval(this.restTimerInterval);
        }
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
    }

    /**
     * Resume timers
     */
    resumeTimers() {
        this.iniciarCronometro();
        if (this.autoSaveEnabled) {
            this.startAutoSave();
        }
    }

    /**
     * Processa escolha de saída do usuário
     */
    async processExitChoice(choice) {
        switch (choice) {
            case 'save-exit':
                await this.saveAndExit();
                return true;
                
            case 'exit-no-save':
                await this.discardAndExit();
                return true;
                
            case 'cancel':
            default:
                this.resumeTimers();
                return false;
        }
    }

    /**
     * Salva dados e sai
     */
    async saveAndExit() {
        try {
            await this.saveCurrentState(false); // Save completo
            this.cleanup();
            this.navegarParaHomeDiretamente();
            
        } catch (error) {
            console.error('[WorkoutManager] Erro ao salvar e sair:', error);
            throw error;
        }
    }

    /**
     * Descarta dados e sai
     */
    async discardAndExit() {
        try {
            await TreinoCacheService.clearWorkoutState();
            AppState.resetWorkout();
            this.cleanup();
            this.navegarParaHomeDiretamente();
            
        } catch (error) {
            console.error('[WorkoutManager] Erro ao descartar e sair:', error);
            throw error;
        }
    }

    /**
     * Recupera workout do cache
     */
    async resumeFromCache(cacheData) {
        console.log('[WorkoutManager] 🔄 Resumindo workout do cache');
        
        try {
            // 1. Validar dados do cache
            if (!TreinoCacheService.validateState(cacheData)) {
                throw new Error('Dados do cache inválidos');
            }
            
            // 2. Restaurar estado completo
            await this.restoreCompleteState(cacheData);
            
            // 3. Ajustar timers para tempo decorrido
            this.adjustTimersForElapsedTime(cacheData);
            
            // 4. Navegar para tela de workout
            await this.navegarParaTelaWorkout();
            
            // 5. Renderizar estado restaurado
            await this.renderizarComSeguranca();
            
            // 6. Reativar proteções
            this.activateWorkoutProtection();
            
            console.log('[WorkoutManager] ✅ Workout resumido com sucesso');
            return true;
            
        } catch (error) {
            console.error('[WorkoutManager] ❌ Erro ao resumir workout:', error);
            
            // Em caso de erro, limpar cache e iniciar novo
            await TreinoCacheService.clearWorkoutState();
            return await this.startWorkout();
        }
    }

    /**
     * Restaura estado completo do cache
     */
    async restoreCompleteState(cacheData) {
        this.currentWorkout = cacheData.currentWorkout;
        this.exerciciosExecutados = cacheData.exerciciosExecutados || [];
        this.currentExerciseIndex = cacheData.currentExerciseIndex || 0;
        this.startTime = cacheData.startTime || Date.now();
        this.sessionId = cacheData.metadata?.sessionId || AppState.generateSessionId();
        
        // Atualizar AppState
        AppState.set('currentWorkout', this.currentWorkout);
        AppState.startWorkoutSession(this.currentWorkout, this.sessionId);
        AppState.set('hasUnsavedData', true); // Dados recuperados não foram salvos
        
        this.isInitialized = true;
        
        console.log('[WorkoutManager] Estado restaurado:', {
            workout: this.currentWorkout?.nome,
            exerciciosExecutados: this.exerciciosExecutados.length,
            sessionId: this.sessionId
        });
    }

    /**
     * Ajusta timers para tempo decorrido
     */
    adjustTimersForElapsedTime(cacheData) {
        const savedTime = new Date(cacheData.metadata?.savedAt || cacheData.timestamp);
        const now = new Date();
        const elapsedMs = now - savedTime;
        
        console.log('[WorkoutManager] Ajustando timers:', {
            savedTime: savedTime.toISOString(),
            elapsedSinceCache: Math.round(elapsedMs / 1000) + 's'
        });
        
        // Iniciar cronômetro considerando tempo total
        this.iniciarCronometro();
    }

    /**
     * Obtém estado atual do manager
     */
    getState() {
        return {
            currentWorkout: this.currentWorkout,
            exerciciosExecutados: this.exerciciosExecutados,
            currentExerciseIndex: this.currentExerciseIndex,
            startTime: this.startTime,
            sessionId: this.sessionId,
            timestamp: Date.now(),
            metadata: {
                sessionId: this.sessionId,
                savedAt: new Date().toISOString(),
                version: '2.0',
                isPartial: true
            }
        };
    }

    /**
     * Salva estado atual
     */
    async saveCurrentState(isPartial = true) {
        const state = this.getState();
        state.metadata.isPartial = isPartial;
        
        await TreinoCacheService.saveWorkoutState(state, isPartial);
        
        if (isPartial) {
            AppState.markDataAsUnsaved();
        } else {
            AppState.markDataAsSaved();
        }
        
        this.lastSaveTime = Date.now();
    }

    /**
     * Verifica se treino foi concluído
     */
    async checkWorkoutCompletion(userId) {
        try {
            if (window.WeeklyPlanService?.verificarTreinoConcluido) {
                return await window.WeeklyPlanService.verificarTreinoConcluido(userId);
            }
            return { concluido: false };
        } catch (error) {
            console.warn('[WorkoutManager] Erro ao verificar conclusão:', error);
            return { concluido: false };
        }
    }

    /**
     * Solicita disposição inicial (se disponível)
     */
    async requestInitialDisposition() {
        try {
            await ensureModalLoaded();
            const ModalClass = await ensureModalLoaded();
            
            if (ModalClass?.solicitar) {
                const disposicao = await ModalClass.solicitar();
                if (disposicao !== null) {
                    await ModalClass.salvarValor(disposicao);
                }
            }
        } catch (error) {
            console.warn('[WorkoutManager] Erro ao solicitar disposição:', error);
            // Não é crítico, continua sem disposição
        }
    }

    /**
     * Manipula evento beforeunload
     */
    handleBeforeUnload(event) {
        if (this.isInitialized && this.currentWorkout) {
            const message = 'Você tem um treino em andamento. Os dados podem ser perdidos.';
            event.preventDefault();
            event.returnValue = message;
            return message;
        }
    }

    /**
     * Cleanup completo do manager
     */
    cleanup() {
        // Parar todos os timers
        this.pauseTimers();
        
        // Remover event listeners
        window.removeEventListener('beforeunload', this.handleBeforeUnload);
        
        // Reset de propriedades
        this.isInitialized = false;
        this.sessionId = null;
        this.lastSaveTime = null;
        this.modalSaidaAtivo = false;
        
        // Finalizar sessão no AppState
        AppState.endWorkoutSession();
        
        console.log('[WorkoutManager] Cleanup completo executado');
    }

    async navegarParaTelaWorkout() {
        console.log('[WorkoutExecution] 📱 Navegando para tela de workout...');
        console.log('[WorkoutExecution] 🔍 Estado antes da navegação:', {
            renderTemplate: typeof window.renderTemplate,
            mostrarTela: typeof window.mostrarTela,
            currentURL: window.location.href,
            bodyChildren: document.body.children.length
        });
        
        try {
            // Tentar o sistema novo primeiro
            if (window.renderTemplate && typeof window.renderTemplate === 'function') {
                console.log('[WorkoutExecution] 📞 Chamando renderTemplate("workout")...');
                await window.renderTemplate('workout');
                
                // Verificar se a navegação funcionou
                console.log('[WorkoutExecution] ⏳ Aguardando elemento #workout-screen...');
                await this.aguardarElemento('#workout-screen', 3000);
                console.log('[WorkoutExecution] ✅ Navegação via renderTemplate bem-sucedida');
                console.log('[WorkoutExecution] 🔍 URL após renderTemplate:', window.location.href);
                return;
            } else {
                console.log('[WorkoutExecution] ⚠️ renderTemplate não disponível');
            }
        } catch (error) {
            console.warn('[WorkoutExecution] ⚠️ Falha no renderTemplate:', error);
            console.warn('[WorkoutExecution] Stack trace:', error.stack);
        }
        
        try {
            // Fallback para sistema antigo
            if (window.mostrarTela && typeof window.mostrarTela === 'function') {
                console.log('[WorkoutExecution] Usando mostrarTela como fallback...');
                window.mostrarTela('workout-screen');
                
                // Verificar se funcionou
                await this.aguardarElemento('#workout-screen', 3000);
                console.log('[WorkoutExecution] ✅ Navegação via mostrarTela bem-sucedida');
                return;
            }
        } catch (error) {
            console.warn('[WorkoutExecution] ⚠️ Falha no mostrarTela:', error);
        }
        
        // Último recurso: navegação manual
        console.log('[WorkoutExecution] 🔧 Usando navegação manual...');
        this.navegacaoManual();
    }
    
    async aguardarElemento(selector, timeout = 3000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const checkElement = () => {
                const element = document.querySelector(selector);
                if (element) {
                    resolve(element);
                    return;
                }
                
                if (Date.now() - startTime > timeout) {
                    reject(new Error(`Timeout aguardando elemento: ${selector}`));
                    return;
                }
                
                setTimeout(checkElement, 100);
            };
            
            checkElement();
        });
    }
    
    navegacaoManual() {
        console.log('[WorkoutExecution] 🔧 Executando navegação manual...');
        
        // Esconder todas as telas
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
            screen.style.display = 'none';
        });
        
        // Procurar tela de workout
        let workoutScreen = document.querySelector('#workout-screen');
        
        // Se não existir, criar dinamicamente
        if (!workoutScreen) {
            console.log('[WorkoutExecution] Criando tela de workout dinamicamente...');
            workoutScreen = this.criarTelaWorkoutDinamica();
        }
        
        // Mostrar a tela
        if (workoutScreen) {
            workoutScreen.style.display = 'block';
            workoutScreen.classList.add('active', 'screen');
            console.log('[WorkoutExecution] ✅ Tela de workout ativada manualmente');
        } else {
            throw new Error('Não foi possível criar/encontrar a tela de workout');
        }
    }
    
    criarTelaWorkoutDinamica() {
        const appContainer = document.getElementById('app') || document.body;
        
        // Criar elemento da tela
        const workoutScreen = document.createElement('div');
        workoutScreen.id = 'workout-screen';
        workoutScreen.className = 'screen workout-screen';
        workoutScreen.innerHTML = workoutTemplate();
        
        // Adicionar ao container
        appContainer.appendChild(workoutScreen);
        
        // Carregar CSS se necessário
        this.carregarWorkoutCSS();
        
        return workoutScreen;
    }
    
    carregarWorkoutCSS() {
        // Verificar se CSS já foi carregado
        if (document.querySelector('#workout-execution-css')) {
            return;
        }
        
        const link = document.createElement('link');
        link.id = 'workout-execution-css';
        link.rel = 'stylesheet';
        link.href = './styles/workoutExecution.css';
        document.head.appendChild(link);
    }
    
    renderizarComSeguranca() {
        console.log('[WorkoutExecution] 🎨 Renderizando treino com segurança...');
        
        try {
            // 1. Popular elementos do template
            this.popularElementosDoTemplate();
            
            // 2. Encontrar container para os exercícios
            const exerciseContainer = this.encontrarContainerExercicios();
            
            if (!exerciseContainer) {
                console.error('[WorkoutExecution] ❌ Container não encontrado, criando fallback');
                this.criarContainerNaRaiz();
                return;
            }
            
            // 3. Renderizar exercícios
            this.renderizarExerciciosNoContainer(exerciseContainer);
            // Destacar e rolar para o exercício atual (se houver)
            this.destacarExercicioAtual();
            
            // 4. Atualizar progresso
            this.atualizarProgresso();
            
            // 5. Iniciar cronômetro
            this.iniciarCronometro();
            
            console.log('[WorkoutExecution] ✅ Renderização completa');
            
        } catch (error) {
            console.error('[WorkoutExecution] ❌ Erro na renderização segura:', error);
            this.criarContainerNaRaiz();
            // Iniciar cronômetro mesmo com erro
            this.iniciarCronometro();
        }
    }

    // Atualiza um elemento do DOM com o valor fornecido
    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        } else {
            console.warn(`[WorkoutExecution] Elemento não encontrado: ${id}`);
        }
    }

    // Inicia o cronômetro do treino
    iniciarCronometro() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.startTime = this.startTime || Date.now();
        
        this.timerInterval = setInterval(() => {
            const elapsed = Date.now() - this.startTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            const timerElement = document.getElementById('workout-timer-display') || 
                                document.getElementById('workout-timer');
            if (timerElement) {
                timerElement.textContent = timeString;
            }
        }, 1000);
    }

    popularElementosDoTemplate() {
        console.log('[WorkoutExecution] \ud83d\udd27 Populando elementos do template...');
        
        const workout = this.currentWorkout;
        if (!workout) {
            console.warn('[WorkoutExecution] ⚠️ currentWorkout está null, usando dados padrão');
            this.updateElement('workout-name', 'Treino do Dia');
            this.updateElement('workout-title', 'Treino do Dia');
            this.updateElement('current-week', '1');
            this.updateElement('muscle-groups', 'Treino de Força');
            return;
        }
        
        const nome = workout.nome || 'Treino do Dia';
        const semana = workout.semana_atual || 1;
        
        // Elementos de informação do treino
        this.updateElement('workout-name', nome);
        this.updateElement('workout-title', nome);
        this.updateElement('current-week', semana.toString());
        
        // Grupos musculares
        if (workout.exercicios && workout.exercicios.length > 0) {
            const grupos = workout.exercicios
                .map(ex => ex.exercicios?.grupo_muscular || ex.grupo_muscular || '')
                .filter((grupo, index, array) => grupo && array.indexOf(grupo) === index)
                .join(', ');
            
            this.updateElement('muscle-groups', grupos || 'Treino de Força');
        }
        
        // Total de exercícios
        this.updateElement('total-exercises', workout.exercicios.length.toString());
        this.updateElement('current-exercise-number', '1');
        
        // Reset progress bar
        const progressEl = document.getElementById('workout-progress');
        if (progressEl) {
            progressEl.style.width = '0%';
        }
        
        console.log('[WorkoutExecution] ✅ Elementos do template populados');
    }

    encontrarContainerExercicios() {
        // destaca o container existente
        
    }

    // Destaca o exercício atual no UI
    destacarExercicioAtual() {
        const index = this.currentExerciseIndex || 0;
        const card = document.getElementById(`exercise-card-${index}`);
        if (card) {
            document.querySelectorAll('.exercise-card').forEach(el => el.classList.remove('current-exercise'));
            card.classList.add('current-exercise');
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    encontrarContainerExercicios() {
        const containers = [
            'exercises-container',
            'container-exercicios',
            'workout-exercises'
        ];
        
        for (const id of containers) {
            const container = document.getElementById(id);
            if (container) return container;
        }
        
        return null;
    }

    async confirmarSerie(exerciseIndex, seriesIndex) {
        console.log(`[WorkoutExecution] Confirmando série ${seriesIndex + 1} do exercício ${exerciseIndex + 1}`);
        
        const exercicio = this.currentWorkout.exercicios[exerciseIndex];
        if (!exercicio) return;
        
        // Verificar se série já foi confirmada para evitar duplicação
        if (!exercicio.seriesCompletas) {
            exercicio.seriesCompletas = [];
        }
        
        if (exercicio.seriesCompletas[seriesIndex]) {
            console.log(`[WorkoutExecution] Série ${seriesIndex + 1} já confirmada`);
            return;
        }
        
        exercicio.seriesCompletas[seriesIndex] = true;
        
        // Atualizar visual do botão
        const btn = document.querySelector(`[onclick*="confirmarSerie(${exerciseIndex}, ${seriesIndex})"]`);
        if (btn) {
            btn.style.background = '#4CAF50';
            btn.style.color = 'white';
            btn.textContent = '✓';
            btn.disabled = true;
            btn.style.cursor = 'not-allowed';
        }
        
        // Salvar progresso
        await this.salvarEstadoAtual();
        
        // Verificar se todas as séries foram completadas
        const totalSeries = exercicio.series || 3;
        const seriesCompletadas = exercicio.seriesCompletas.filter(Boolean).length;
        
        if (seriesCompletadas >= totalSeries) {
            console.log(`[WorkoutExecution] Exercício ${exerciseIndex + 1} completo!`);
            
            // Marcar exercício como completo visualmente
            const exerciseCard = document.getElementById(`exercise-card-${exerciseIndex}`);
            if (exerciseCard) {
                exerciseCard.style.opacity = '0.7';
                exerciseCard.style.border = '2px solid #4CAF50';
            }
            
            // Atualizar progresso geral
            this.atualizarProgresso();
        }
    }

    async voltarParaHome() {
        console.log('[WorkoutExecution] Tentativa de voltar para home...');
        
        try {
            // Usar método enhanced handleExit
            const exitAllowed = await this.handleExit();
            
            if (exitAllowed) {
                console.log('[WorkoutExecution] Saída autorizada via handleExit');
            } else {
                console.log('[WorkoutExecution] Saída cancelada pelo usuário');
            }
            
        } catch (error) {
            console.error('[WorkoutExecution] Erro na navegação enhanced:', error);
            
            // Fallback para navegação com NavigationGuard
            try {
                const { safeNavigate } = await import('../ui/navigation.js');
                const success = await safeNavigate('home-screen');
                
                if (success) {
                    console.log('[WorkoutExecution] Navegação para home autorizada (fallback)');
                    
                    // Parar cronômetro se estiver rodando
                    if (this.timerInterval) {
                        clearInterval(this.timerInterval);
                        this.timerInterval = null;
                    }
                }
                
            } catch (fallbackError) {
                console.error('[WorkoutExecution] Erro no fallback de navegação:', fallbackError);
                this.voltarParaHomeLegacy();
            }
        }
    }
    
    /**
     * Método legacy de voltar para home (mantido para compatibilidade)
     */
    voltarParaHomeLegacy() {
        console.log('[WorkoutExecution] Usando navegação legacy...');
        
        // Verificar se há treino ativo
        const isWorkoutActive = this.currentWorkout && this.timerInterval;
        const hasProgress = this.exerciciosExecutados && this.exerciciosExecutados.length > 0;
        
        if (isWorkoutActive || hasProgress) {
            console.log('[WorkoutExecution] Treino em andamento detectado, mostrando modal...');
            this.mostrarModalSaida();
            return; // Não navegar ainda, aguardar decisão do usuário
        }
        
        // Se não há treino ativo, navegar diretamente
        this.navegarParaHomeDiretamente();
    }

    async finalizarTreino() {
        console.log('[WorkoutExecution] Finalizando treino...');
        
        try {
            // Parar cronômetro
            if (this.timerInterval) {
                clearInterval(this.timerInterval);
            }
            
            // Calcular dados do treino
            const duracao = Math.round((Date.now() - this.startTime) / 60000);
            
            // Salvar no Supabase
            if (window.WorkoutProtocolService?.salvarTreinoConcluido) {
                await window.WorkoutProtocolService.salvarTreinoConcluido({
                    workout: this.currentWorkout,
                    duracao,
                    exerciciosExecutados: this.exerciciosExecutados
                });
            }
            
            // Limpar cache e estado
            await this.limparEstadoPersistido();
            
            // Mostrar modal de conclusão
            if (window.showModalTreinoSalvo) {
                window.showModalTreinoSalvo();
            }
            
            // Voltar para home após delay
            setTimeout(() => this.navegarParaHomeDiretamente(), 2000);
            
        } catch (error) {
            console.error('[WorkoutExecution] Erro ao finalizar treino:', error);
            if (window.showNotification) {
                window.showNotification('Erro ao salvar treino', 'error');
            }
        }
    }

    // NOVOS MÉTODOS DE BACKUP LOCAL
    async saveLocalProgress() {
        try {
            const state = {
                exercicios: this.exercicios,
                currentIndex: this.currentExerciseIndex,
                timer: this.timer?.getState?.() || null,
                timestamp: Date.now(),
                version: 'local_v1'
            };
            localStorage.setItem('workoutLocalBackup', JSON.stringify(state));
            console.log('[Workout] Progresso salvo localmente');
        } catch (e) {
            console.warn('[Workout] Erro ao salvar localmente:', e);
        }
    }

    loadLocalProgress() {
        try {
            const saved = localStorage.getItem('workoutLocalBackup');
            if (!saved) return null;
            
            const parsed = JSON.parse(saved);
            
            // Validar dados e tempo (max 24h)
            if (!parsed || (Date.now() - parsed.timestamp) > 86400000) {
                localStorage.removeItem('workoutLocalBackup');
                return null;
            }
            
            return parsed;
        } catch (e) {
            console.warn('[Workout] Erro ao carregar backup local:', e);
            return null;
        }
    }

    // Salva o estado atual do treino (método legacy - use saveCurrentState)
    async salvarEstadoAtual(forceSave = false) {
        if (!this.currentWorkout || !this.persistence) return;
        
        try {
            // Usar método enhanced se estiver inicializado
            if (this.isInitialized) {
                return await this.saveCurrentState(!forceSave);
            }
            
            // Fallback para método legacy
            const state = {
                currentWorkout: this.currentWorkout,
                exerciciosExecutados: this.exerciciosExecutados,
                currentExerciseIndex: this.currentExerciseIndex,
                startTime: this.startTime,
                timestamp: Date.now()
            };
            
            await this.persistence.saveState(state, forceSave);
            
            // Marcar como não salvo no AppState se não for forceSave
            if (!forceSave) {
                AppState.markDataAsUnsaved();
            } else {
                AppState.markDataAsSaved();
            }
            
            console.log('[WorkoutExecution] Estado do treino salvo (legacy)');
        } catch (error) {
            console.error('[WorkoutExecution] Erro ao salvar estado do treino:', error);
        }
    }

    // VERIFICAÇÃO AO INICIAR (BACKUP)
    async iniciarTreino_backup() {
        // ... código existente ...
        
        const localProgress = this.loadLocalProgress();
        if (localProgress && !this.carregandoTreinoRemoto) {
            if (confirm('Deseja continuar o treino incompleto salvo localmente?')) {
                this.exercicios = localProgress.exercicios || [];
                this.currentExerciseIndex = localProgress.currentIndex || 0;
                if (localProgress.timer && this.timer?.setState) {
                    this.timer.setState(localProgress.timer);
                }
                console.log('[Workout] Progresso local carregado');
            } else {
                localStorage.removeItem('workoutLocalBackup');
            }
        }
        
        // ... código existente ...
    }

    // Método para verificar estado do DOM antes de exibir modais
    async verificarEstadoDOM() {
        console.log('[WorkoutExecution] 🔍 Verificando estado do DOM...');
        
        try {
            // Verificar elementos essenciais
            const body = document.body;
            const head = document.head;
            
            console.log('[WorkoutExecution] 📊 DOM Status:', {
                body: !!body,
                head: !!head,
                readyState: document.readyState,
                bodyChildren: body?.children?.length || 0,
                headChildren: head?.children?.length || 0,
                location: window.location.href
            });
            
            // Verificar se há CSS carregado
            const stylesheets = document.styleSheets.length;
            console.log('[WorkoutExecution] 🎨 Stylesheets carregadas:', stylesheets);
            
            // Verificar se há elementos com problemas de CSS
            if (body) {
                const computedStyle = window.getComputedStyle(body);
                console.log('[WorkoutExecution] 🎨 Body styles:', {
                    overflow: computedStyle.overflow,
                    position: computedStyle.position,
                    zIndex: computedStyle.zIndex
                });
            }
            
            // Verificar se há JavaScript carregado
            console.log('[WorkoutExecution] 📜 JavaScript global objects:', {
                DisposicaoInicioModal: typeof DisposicaoInicioModal,
                showNotification: typeof window.showNotification,
                renderTemplate: typeof window.renderTemplate
            });
            
            return true;
            
        } catch (error) {
            console.error('[WorkoutExecution] ❌ Erro na verificação do DOM:', error);
            return false;
        }
    }

    criarContainerNaRaiz() {
        console.log('[WorkoutExecution] Criando container do treino...');
        
        // Limpar conteúdo existente
        const app = document.getElementById('app') || document.body;
        app.innerHTML = '';
        
        // Criar container principal
        const container = document.createElement('div');
        container.id = 'workout-container';
        container.style.cssText = `
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #fff;
        `;
        
        // Cabeçalho do treino
        container.innerHTML = `
            <header style="margin-bottom: 30px; border-bottom: 1px solid #333; padding-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <button onclick="workoutExecutionManager.voltarParaHome()" 
                            style="background: #a8ff00; 
                                   color: #000; 
                                   border: none; 
                                   padding: 8px 16px; 
                                   border-radius: 6px; 
                                   cursor: pointer; 
                                   font-weight: 600;">
                        ← Voltar
                    </button>
                    <h1 id="workout-title" style="margin: 0; font-size: 1.5rem;"></h1>
                    <div id="workout-timer" style="background: #2a2a2a; 
                                                padding: 8px 16px; 
                                                border-radius: 6px; 
                                                font-family: monospace;">
                        0:00
                    </div>
                </div>
                <div id="workout-meta" style="margin-top: 15px; color: #aaa; font-size: 0.9rem;">
                    <span id="current-week"></span>
                    <span id="muscle-groups" style="margin-left: 10px;"></span>
                </div>
            </header>
            <main id="exercises-container"></main>
        `;
        
        app.appendChild(container);
        
        // Inicializar elementos
        this.seriesElement = document.getElementById('series-counter');
        
        // Renderizar exercícios no container principal
        const exercisesContainer = document.getElementById('exercises-container');
        if (exercisesContainer) {
            this.renderizarExerciciosNoContainer(exercisesContainer);
        }
        
        console.log('[WorkoutExecution] Container do treino criado');
        return container;
    }

    renderizarExerciciosNoContainer(container) {
        if (!this.currentWorkout?.exercicios) {
            console.warn('Dados do treino não encontrados');
            return;
        }

        container.innerHTML = '';
        
        this.currentWorkout.exercicios.forEach((exercicio, index) => {
            const card = this.criarCardExercicioFuncional(exercicio, index);
            if (card) {
                container.appendChild(card);
            }
        });
    }

    // TEMPLATE REDESENHADO COM DESIGN SYSTEM DO PROJETO
    criarCardExercicioFuncional(exercicio, exerciseIndex) {
        const div = document.createElement('div');
        div.className = 'exercise-card';
        div.dataset.exerciseIndex = exerciseIndex;
        
        const pesos = exercicio.pesos_sugeridos || {};
        const pesoSugerido = pesos.peso_base || pesos.peso_minimo || 20;
        const repsAlvo = exercicio.repeticoes_alvo || 10;
        const numSeries = exercicio.series || 3;
        const equipamento = exercicio.exercicio_equipamento || exercicio.equipamento || '';
        const grupo = exercicio.exercicio_grupo || exercicio.grupo_muscular || 'Geral';
        
        div.innerHTML = `
            <div class="exercise-card-content" style="
                background: var(--bg-card);
                border-radius: var(--radius-lg);
                padding: 24px;
                margin-bottom: 24px;
                border: 1px solid var(--border-color);
                transition: var(--transition);
                position: relative;
                overflow: hidden;
            ">
                <!-- Header do Exercício -->
                <div class="exercise-header" style="
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 20px;
                ">
                    <div class="exercise-info" style="flex: 1;">
                        <h3 class="exercise-name" style="
                            color: var(--text-primary);
                            font-size: 1.25rem;
                            font-weight: 700;
                            margin-bottom: 8px;
                            line-height: 1.2;
                        ">${exercicio.exercicio_nome || exercicio.nome}</h3>
                        
                        <div class="exercise-details" style="
                            display: flex;
                            gap: 16px;
                            flex-wrap: wrap;
                            margin-bottom: 12px;
                        ">
                            <span class="detail-item" style="
                                color: var(--text-secondary);
                                font-size: 0.875rem;
                                display: flex;
                                align-items: center;
                                gap: 4px;
                            ">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"/>
                                    <polyline points="12,6 12,12 16,14"/>
                                </svg>
                                ${grupo}
                            </span>
                            
                            ${equipamento ? `
                                <span class="detail-item" style="
                                    color: var(--text-secondary);
                                    font-size: 0.875rem;
                                    display: flex;
                                    align-items: center;
                                    gap: 4px;
                                ">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M7 8h10M7 16h10M8 12h8"/>
                                    </svg>
                                    ${equipamento}
                                </span>
                            ` : ''}
                        </div>
                        
                        <!-- Stats do Protocolo -->
                        <div class="exercise-stats" style="
                            display: flex;
                            gap: 24px;
                            margin-top: 16px;
                        ">
                            <div class="stat-item" style="text-align: center;">
                                <div style="
                                    color: var(--accent-primary);
                                    font-size: 1.125rem;
                                    font-weight: 700;
                                    line-height: 1;
                                ">${numSeries}</div>
                                <div style="
                                    color: var(--text-secondary);
                                    font-size: 0.75rem;
                                    font-weight: 500;
                                    text-transform: uppercase;
                                    letter-spacing: 0.05em;
                                    margin-top: 2px;
                                ">Séries</div>
                            </div>
                            
                            <div class="stat-item" style="text-align: center;">
                                <div style="
                                    color: var(--accent-primary);
                                    font-size: 1.125rem;
                                    font-weight: 700;
                                    line-height: 1;
                                ">${repsAlvo}</div>
                                <div style="
                                    color: var(--text-secondary);
                                    font-size: 0.75rem;
                                    font-weight: 500;
                                    text-transform: uppercase;
                                    letter-spacing: 0.05em;
                                    margin-top: 2px;
                                ">Reps</div>
                            </div>
                            
                            <div class="stat-item" style="text-align: center;">
                                <div style="
                                    color: var(--accent-primary);
                                    font-size: 1.125rem;
                                    font-weight: 700;
                                    line-height: 1;
                                ">${pesoSugerido}kg</div>
                                <div style="
                                    color: var(--text-secondary);
                                    font-size: 0.75rem;
                                    font-weight: 500;
                                    text-transform: uppercase;
                                    letter-spacing: 0.05em;
                                    margin-top: 2px;
                                ">Sugerido</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Exercise Counter -->
                    <div class="exercise-counter" style="
                        background: linear-gradient(45deg, var(--accent-primary), var(--accent-primary-dark));
                        color: #000000;
                        padding: 8px 16px;
                        border-radius: var(--radius-full);
                        font-size: 0.875rem;
                        font-weight: 700;
                        margin-left: 16px;
                        box-shadow: var(--shadow-glow);
                        min-width: 48px;
                        text-align: center;
                    ">${exerciseIndex + 1}</div>
                </div>
                
                <!-- Container de Séries -->
                <div class="series-container" style="margin-bottom: 20px;">
                    <div class="series-header" style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 16px;
                        padding-bottom: 8px;
                        border-bottom: 1px solid var(--border-color);
                    ">
                        <h4 style="
                            color: var(--text-primary);
                            font-size: 1rem;
                            font-weight: 600;
                            margin: 0;
                        ">Execução das Séries</h4>
                        
                        <div class="series-progress-badge" style="
                            background: var(--bg-secondary);
                            color: var(--text-secondary);
                            padding: 4px 12px;
                            border-radius: var(--radius-full);
                            font-size: 0.875rem;
                            font-weight: 600;
                            border: 1px solid var(--border-color);
                        ">
                            <span class="series-progress">0/${numSeries}</span>
                        </div>
                    </div>
                    
                    <div class="series-list">
                        ${this.gerarSeriesHTMLFuncional(exercicio, exerciseIndex, numSeries, repsAlvo, pesoSugerido, exercicio.series_executadas || 0)}
                    </div>
                </div>
                
                <!-- Progresso Visual -->
                <div class="exercise-progress-bar" style="
                    height: 4px;
                    background: var(--bg-secondary);
                    border-radius: var(--radius-sm);
                    overflow: hidden;
                    margin-bottom: 16px;
                ">
                    <div class="progress-fill" style="
                        height: 100%;
                        width: 0%;
                        background: linear-gradient(90deg, var(--accent-primary), var(--accent-primary-dark));
                        transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                        box-shadow: 0 0 8px rgba(255, 229, 0, 0.5);
                    "></div>
                </div>
                
                <!-- Ações do Exercício -->
                <div class="exercise-actions" style="
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                ">
                    <button class="btn-secondary exercise-action" style="
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        font-size: 0.875rem;
                        padding: 12px 16px;
                    " onclick="alert('Histórico em desenvolvimento')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12,6 12,12 16,14"/>
                        </svg>
                        Histórico
                    </button>
                </div>
            </div>
        `;
        
        return div;
    }

    // MÉTODO DE GERAÇÃO DE SÉRIES COM DESIGN SYSTEM DO PROJETO
    gerarSeriesHTMLFuncional(exercicio, exerciseIndex, numSeries, repsTarget, suggestedWeight, seriesExecutadas = 0) {
        let html = '';
        
        for (let i = 0; i < numSeries; i++) {
            const isCompleted = i < seriesExecutadas;
            html += `
                <div class="series-item ${isCompleted ? 'series-completed' : ''}" data-series-index="${i}" data-exercise-index="${exerciseIndex}" 
                     style="
                        display: grid;
                        grid-template-columns: 40px 1fr 60px;
                        gap: 16px;
                        align-items: center;
                        background: var(--bg-secondary);
                        border: 1px solid var(--border-color);
                        border-radius: var(--radius-md);
                        padding: 16px;
                        margin-bottom: 12px;
                        transition: var(--transition);
                        position: relative;
                        overflow: hidden;
                     ">
                    
                    <!-- Número da Série -->
                    <div class="series-number" style="
                        width: 32px;
                        height: 32px;
                        background: linear-gradient(45deg, var(--accent-primary), var(--accent-primary-dark));
                        color: #000000;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: 700;
                        font-size: 0.875rem;
                        box-shadow: var(--shadow-glow);
                    ">${i + 1}</div>
                    
                    <!-- Inputs de Peso e Repetições -->
                    <div class="series-inputs" style="
                        display: grid;
                        grid-template-columns: 1fr auto 1fr;
                        gap: 12px;
                        align-items: center;
                    ">
                        <!-- Input de Peso -->
                        <div class="input-group" style="position: relative;">
                            <label style="
                                position: absolute;
                                top: -8px;
                                left: 12px;
                                background: var(--bg-secondary);
                                color: var(--text-secondary);
                                font-size: 0.75rem;
                                font-weight: 500;
                                padding: 0 8px;
                                z-index: 1;
                            ">Peso (kg)</label>
                            
                            <div class="input-wrapper" style="
                                display: flex;
                                align-items: center;
                                background: var(--bg-primary);
                                border: 1px solid var(--border-color);
                                border-radius: var(--radius-sm);
                                overflow: hidden;
                                transition: var(--transition);
                            ">
                                <button class="input-btn" type="button" onclick="this.nextElementSibling.stepDown()" style="
                                    padding: 12px;
                                    background: transparent;
                                    border: none;
                                    color: var(--accent-primary);
                                    cursor: pointer;
                                    font-size: 1.125rem;
                                    font-weight: 600;
                                    transition: var(--transition);
                                    min-width: 40px;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                ">−</button>
                                
                                <input type="number" 
                                       class="series-weight series-input" 
                                       value="${suggestedWeight || ''}"
                                       placeholder="0"
                                       step="0.5" 
                                       min="0"
                                       max="500"
                                       inputmode="decimal"
                                       pattern="[0-9]*"
                                       style="
                                        flex: 1;
                                        padding: 12px 8px;
                                        background: transparent;
                                        border: none;
                                        color: var(--text-primary);
                                        text-align: center;
                                        font-size: 1rem;
                                        font-weight: 600;
                                        outline: none;
                                       ">
                                
                                <button class="input-btn" type="button" onclick="this.previousElementSibling.stepUp()" style="
                                    padding: 12px;
                                    background: transparent;
                                    border: none;
                                    color: var(--accent-primary);
                                    cursor: pointer;
                                    font-size: 1.125rem;
                                    font-weight: 600;
                                    transition: var(--transition);
                                    min-width: 40px;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                ">+</button>
                            </div>
                        </div>
                        
                        <!-- Separador -->
                        <span style="
                            color: var(--text-secondary);
                            font-size: 1.125rem;
                            font-weight: 600;
                        ">×</span>
                        
                        <!-- Input de Repetições -->
                        <div class="input-group" style="position: relative;">
                            <label style="
                                position: absolute;
                                top: -8px;
                                left: 12px;
                                background: var(--bg-secondary);
                                color: var(--text-secondary);
                                font-size: 0.75rem;
                                font-weight: 500;
                                padding: 0 8px;
                                z-index: 1;
                            ">Repetições</label>
                            
                            <div class="input-wrapper" style="
                                display: flex;
                                align-items: center;
                                background: var(--bg-primary);
                                border: 1px solid var(--border-color);
                                border-radius: var(--radius-sm);
                                overflow: hidden;
                                transition: var(--transition);
                            ">
                                <button class="input-btn" type="button" onclick="this.nextElementSibling.stepDown()" style="
                                    padding: 12px;
                                    background: transparent;
                                    border: none;
                                    color: var(--accent-primary);
                                    cursor: pointer;
                                    font-size: 1.125rem;
                                    font-weight: 600;
                                    transition: var(--transition);
                                    min-width: 40px;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                ">−</button>
                                
                                <input type="number" 
                                       class="series-reps series-input" 
                                       value="${repsTarget || ''}"
                                       placeholder="0"
                                       min="1"
                                       max="50"
                                       inputmode="numeric"
                                       pattern="[0-9]*"
                                       style="
                                        flex: 1;
                                        padding: 12px 8px;
                                        background: transparent;
                                        border: none;
                                        color: var(--text-primary);
                                        text-align: center;
                                        font-size: 1rem;
                                        font-weight: 600;
                                        outline: none;
                                       ">
                                
                                <button class="input-btn" type="button" onclick="this.previousElementSibling.stepUp()" style="
                                    padding: 12px;
                                    background: transparent;
                                    border: none;
                                    color: var(--accent-primary);
                                    cursor: pointer;
                                    font-size: 1.125rem;
                                    font-weight: 600;
                                    transition: var(--transition);
                                    min-width: 40px;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                ">+</button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Botão de Confirmar -->
                    <button class="series-confirm-btn ${isCompleted ? 'btn-success' : 'btn-primary'}" ${isCompleted ? 'disabled' : ''} 
                            onclick="workoutExecutionManager.confirmarSerie(${exerciseIndex}, ${i})"
                            style="
                                width: 48px;
                                height: 48px;
                                background: linear-gradient(45deg, var(--accent-primary), var(--accent-primary-dark));
                                color: #000000;
                                border: none;
                                border-radius: var(--radius-md);
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-weight: 700;
                                font-size: 1.125rem;
                                transition: var(--transition);
                                box-shadow: var(--shadow-glow);
                                position: relative;
                                overflow: hidden;
                            "
                            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='var(--shadow-glow-strong)'"
                            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='var(--shadow-glow)'">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                    </button>
                </div>
            `;
        }
        
        return html;
    }

    // Método para recuperar um treino em andamento a partir do estado salvo
    async recuperarTreinoEmAndamento(state) {
        try {
            await this.navegarParaTelaWorkout();
            
            // Aguardar tela carregar
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Renderizar com estado recuperado
            await this.renderizarComSeguranca();
            this.iniciarCronometro();
            
            // Mostrar notificação de recuperação
            if (window.showNotification) {
                const tempoDecorrido = Math.round((Date.now() - this.startTime) / 60000);
                window.showNotification(
                    `Treino recuperado! Tempo decorrido: ${tempoDecorrido} min`, 
                    'success'
                );
            }
            
            console.log('[WorkoutExecution] ✅ Treino recuperado com sucesso');
            
        } catch (error) {
            console.error('[WorkoutExecution] Erro ao recuperar treino:', error);
            
            // Em caso de erro, limpar estado e iniciar novo treino
            if (this.persistence) {
                await this.persistence.clearState();
            }
            throw new Error('Falha na recuperação. Iniciando novo treino...');
        }
    }

    /**
     * Limpa o estado persistido (ao finalizar ou cancelar treino)
     */
    async limparEstadoPersistido() {
        try {
            if (this.persistence) {
                await this.persistence.clearState();
                console.log('[WorkoutExecution] Estado persistido limpo');
            }
        } catch (error) {
            console.error('[WorkoutExecution] Erro ao limpar estado:', error);
        }
    }

    // NOVOS MÉTODOS DE BACKUP LOCAL
    async saveLocalProgress() {
        try {
            const state = {
                exercicios: this.exercicios,
                currentIndex: this.currentExerciseIndex,
                timer: this.timer?.getState?.() || null,
                timestamp: Date.now(),
                version: 'local_v1'
            };
            localStorage.setItem('workoutLocalBackup', JSON.stringify(state));
            console.log('[Workout] Progresso salvo localmente');
        } catch (e) {
            console.warn('[Workout] Erro ao salvar localmente:', e);
        }
    }

    loadLocalProgress() {
        try {
            const saved = localStorage.getItem('workoutLocalBackup');
            if (!saved) return null;
            
            const parsed = JSON.parse(saved);
            
            // Validar dados e tempo (max 24h)
            if (!parsed || (Date.now() - parsed.timestamp) > 86400000) {
                localStorage.removeItem('workoutLocalBackup');
                return null;
            }
            
            return parsed;
        } catch (e) {
            console.warn('[Workout] Erro ao carregar backup local:', e);
            return null;
        }
    }

    // MODIFICAÇÃO MÍNIMA NO MÉTODO EXISTENTE (BACKUP)
    async salvarESairTreino_backup() {
        // 1. Backup local primeiro (não bloqueante)
        this.saveLocalProgress();
        
        // 2. Mantém fluxo original intacto
        await this.salvarEstadoAtual(false);
        this.voltarParaHome();
    }

    // VERIFICAÇÃO AO INICIAR (BACKUP)
    async iniciarTreino_backup() {
        // ... código existente ...
        
        const localProgress = this.loadLocalProgress();
        if (localProgress && !this.carregandoTreinoRemoto) {
            if (confirm('Deseja continuar o treino incompleto salvo localmente?')) {
                this.exercicios = localProgress.exercicios || [];
                this.currentExerciseIndex = localProgress.currentIndex || 0;
                if (localProgress.timer && this.timer?.setState) {
                    this.timer.setState(localProgress.timer);
                }
                console.log('[Workout] Progresso local carregado');
            } else {
                localStorage.removeItem('workoutLocalBackup');
            }
        }
        
        // ... código existente ...
    }

    // Método para verificar estado do DOM antes de exibir modais
    async verificarEstadoDOM() {
        console.log('[WorkoutExecution] 🔍 Verificando estado do DOM...');
        
        try {
            // Verificar elementos essenciais
            const body = document.body;
            const head = document.head;
            
            console.log('[WorkoutExecution] 📊 DOM Status:', {
                body: !!body,
                head: !!head,
                readyState: document.readyState,
                bodyChildren: body?.children?.length || 0,
                headChildren: head?.children?.length || 0,
                location: window.location.href
            });
            
            // Verificar se há CSS carregado
            const stylesheets = document.styleSheets.length;
            console.log('[WorkoutExecution] 🎨 Stylesheets carregadas:', stylesheets);
            
            // Verificar se há elementos com problemas de CSS
            if (body) {
                const computedStyle = window.getComputedStyle(body);
                console.log('[WorkoutExecution] 🎨 Body styles:', {
                    overflow: computedStyle.overflow,
                    position: computedStyle.position,
                    zIndex: computedStyle.zIndex
                });
            }
            
            // Verificar se há JavaScript carregado
            console.log('[WorkoutExecution] 📜 JavaScript global objects:', {
                DisposicaoInicioModal: typeof DisposicaoInicioModal,
                showNotification: typeof window.showNotification,
                renderTemplate: typeof window.renderTemplate
            });
            
            return true;
            
        } catch (error) {
            console.error('[WorkoutExecution] ❌ Erro na verificação do DOM:', error);
            return false;
        }
    }

    criarContainerNaRaiz() {
        console.log('[WorkoutExecution] Criando container do treino...');
        
        // Limpar conteúdo existente
        const app = document.getElementById('app') || document.body;
        app.innerHTML = '';
        
        // Criar container principal
        const container = document.createElement('div');
        container.id = 'workout-container';
        container.style.cssText = `
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #fff;
        `;
        
        // Cabeçalho do treino
        container.innerHTML = `
            <header style="margin-bottom: 30px; border-bottom: 1px solid #333; padding-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <button onclick="workoutExecutionManager.voltarParaHome()" 
                            style="background: #a8ff00; 
                                   color: #000; 
                                   border: none; 
                                   padding: 8px 16px; 
                                   border-radius: 6px; 
                                   cursor: pointer; 
                                   font-weight: 600;">
                        ← Voltar
                    </button>
                    <h1 id="workout-title" style="margin: 0; font-size: 1.5rem;"></h1>
                    <div id="workout-timer" style="background: #2a2a2a; 
                                                padding: 8px 16px; 
                                                border-radius: 6px; 
                                                font-family: monospace;">
                        0:00
                    </div>
                </div>
                <div id="workout-meta" style="margin-top: 15px; color: #aaa; font-size: 0.9rem;">
                    <span id="current-week"></span>
                    <span id="muscle-groups" style="margin-left: 10px;"></span>
                </div>
            </header>
            <main id="exercises-container"></main>
        `;
        
        app.appendChild(container);
        
        // Inicializar elementos
        this.seriesElement = document.getElementById('series-counter');
        
        // Renderizar exercícios no container principal
        const exercisesContainer = document.getElementById('exercises-container');
        if (exercisesContainer) {
            this.renderizarExerciciosNoContainer(exercisesContainer);
        }
        
        console.log('[WorkoutExecution] Container do treino criado');
        return container;
    }

    renderizarExerciciosNoContainer(container) {
        if (!this.currentWorkout?.exercicios) {
            console.warn('Dados do treino não encontrados');
            return;
        }

        container.innerHTML = '';
        
        this.currentWorkout.exercicios.forEach((exercicio, index) => {
            const card = this.criarCardExercicioFuncional(exercicio, index);
            if (card) {
                container.appendChild(card);
            }
        });
    }

    // MODIFICAÇÃO MÍNIMA NO MÉTODO EXISTENTE (BACKUP)
    async salvarESairTreino_backup() {
        // 1. Backup local primeiro (não bloqueante)
        this.saveLocalProgress();
        
        // 2. Mantém fluxo original intacto
        await this.salvarEstadoAtual(false);
        this.voltarParaHome();
    }

    // Atualiza barra de progresso do treino
    atualizarProgresso() {
        if (!this.currentWorkout?.exercicios) return;
        
        const total = this.currentWorkout.exercicios.length;
        const completados = this.exerciciosExecutados.length;
        const percentual = Math.round((completados / total) * 100);
        
        // Atualizar barra de progresso se existir
        const progressBar = document.getElementById('workout-progress');
        if (progressBar) {
            progressBar.style.width = `${percentual}%`;
        }
        
        // Atualizar contador se existir
        const progressText = document.getElementById('progress-text');
        if (progressText) {
            progressText.textContent = `${completados}/${total} exercícios`;
        }
        
        console.log(`[WorkoutExecution] Progresso: ${percentual}% (${completados}/${total})`);
    }

    // Modal de saída do treino
    mostrarModalSaida() {
        const modalHTML = `
            <div id="modal-saida-treino" class="modal-overlay" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0,0,0,0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
            ">
                <div class="modal-content" style="
                    background: white;
                    padding: 24px;
                    border-radius: 12px;
                    max-width: 400px;
                    width: 90%;
                    text-align: center;
                ">
                    <h3 style="margin: 0 0 16px 0; color: #333;">Sair do Treino</h3>
                    <p style="margin: 0 0 24px 0; color: #666;">
                        Deseja salvar o progresso atual antes de sair?
                    </p>
                    <div style="display: flex; gap: 12px; justify-content: center;">
                        <button onclick="window.workoutExecutionManager.salvarESair()" style="
                            background: #4CAF50;
                            color: white;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 6px;
                            cursor: pointer;
                        ">Salvar e Sair</button>
                        <button onclick="window.workoutExecutionManager.sairSemSalvar()" style="
                            background: #f44336;
                            color: white;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 6px;
                            cursor: pointer;
                        ">Sair sem Salvar</button>
                        <button onclick="window.workoutExecutionManager.fecharModalSaida()" style="
                            background: #ccc;
                            color: #333;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 6px;
                            cursor: pointer;
                        ">Cancelar</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // Modal de treino salvo
    mostrarModalAvisoTreinoSalvo() {
        const modalHTML = `
            <div id="modal-treino-salvo" class="modal-overlay" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0,0,0,0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
            ">
                <div class="modal-content" style="
                    background: white;
                    padding: 24px;
                    border-radius: 12px;
                    max-width: 400px;
                    width: 90%;
                    text-align: center;
                ">
                    <h3 style="margin: 0 0 16px 0; color: #4CAF50;">✅ Treino Salvo!</h3>
                    <p style="margin: 0 0 24px 0; color: #666;">
                        Seu progresso foi salvo com sucesso.
                    </p>
                    <div style="display: flex; gap: 12px; justify-content: center;">
                        <button onclick="window.workoutExecutionManager.continuarTreino()" style="
                            background: #4CAF50;
                            color: white;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 6px;
                            cursor: pointer;
                        ">Continuar Treino</button>
                        <button onclick="window.workoutExecutionManager.voltarParaHome()" style="
                            background: #2196F3;
                            color: white;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 6px;
                            cursor: pointer;
                        ">Ir para Home</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // Modal de conclusão do treino
    mostrarModalConclusao() {
        const modalHTML = `
            <div id="modal-conclusao-treino" class="modal-overlay" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0,0,0,0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
            ">
                <div class="modal-content" style="
                    background: white;
                    padding: 24px;
                    border-radius: 12px;
                    max-width: 400px;
                    width: 90%;
                    text-align: center;
                ">
                    <h3 style="margin: 0 0 16px 0; color: #4CAF50;">🎉 Parabéns!</h3>
                    <p style="margin: 0 0 24px 0; color: #666;">
                        Treino concluído com sucesso!
                    </p>
                    <button onclick="window.workoutExecutionManager.finalizarTreino()" style="
                        background: #4CAF50;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 6px;
                        cursor: pointer;
                        width: 100%;
                    ">Finalizar e Salvar</button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // Métodos de controle dos modais
    fecharModalSaida() {
        const modal = document.getElementById('modal-saida-treino');
        if (modal) modal.remove();
    }

    async salvarESair() {
        await this.salvarEstadoAtual();
        this.fecharModalSaida();
        this.navegarParaHomeDiretamente();
    }

    sairSemSalvar() {
        this.fecharModalSaida();
        this.navegarParaHomeDiretamente();
    }

    continuarTreino() {
        const modal = document.getElementById('modal-treino-salvo');
        if (modal) modal.remove();
    }

    navegarParaHomeDiretamente() {
        console.log('[WorkoutExecution] Navegando para home...');
        
        // Parar cronômetro
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        // Navegar para home
        if (window.navigateTo) {
            window.navigateTo('home');
        } else {
            window.location.href = '/';
        }
    }
}

// ===== GLOBAL BINDINGS =====
window.workoutExecutionManager = new WorkoutExecutionManager();

// === ENHANCED GLOBAL METHODS ===
// Expor métodos enhanced para uso em templates
window.startWorkout = () => window.workoutExecutionManager.startWorkout();
window.resumeWorkout = (cacheData) => window.workoutExecutionManager.resumeFromCache(cacheData);
window.handleWorkoutExit = () => window.workoutExecutionManager.handleExit();

// Funções usadas no HTML
window.confirmarSerie = (exerciseIndex, seriesIndex) => window.workoutExecutionManager.confirmarSerie(exerciseIndex, seriesIndex);
window.voltarParaHome = () => window.workoutExecutionManager.voltarParaHome();

// Função de diagnóstico para testar o modal independentemente
window.testarModalDisposicao = async function() {
    console.log('[TESTE MODAL] 🧪 Iniciando teste independente do modal...');
    
    try {
        // Verificar pré-requisitos
        console.log('[TESTE MODAL] 🔍 Verificando pré-requisitos...');
        await window.workoutExecutionManager.verificarEstadoDOM();
        
        // Testar modal
        console.log('[TESTE MODAL] 🎯 Chamando modal...');
        const resultado = await DisposicaoInicioModal.solicitar();
        
        console.log('[TESTE MODAL] ✅ Modal retornou:', resultado);
        return resultado;
        
    } catch (error) {
        console.error('[TESTE MODAL] ❌ Erro no teste:', error);
        console.error('[TESTE MODAL] Stack:', error.stack);
        return null;
    }
};

// Função de teste para iniciar treino SEM modal (para debug)
window.testarTreinoSemModal = async function() {
    console.log('[TESTE SEM MODAL] 🧪 Iniciando treino pulando o modal...');
    
    try {
        const manager = window.workoutExecutionManager;
        
        // Verificar se há treino carregado
        if (!manager.currentWorkout) {
            console.log('[TESTE SEM MODAL] 📊 Carregando treino...');
            const currentUser = { id: 1, nome: 'Teste' }; // Mock do usuário
            manager.currentWorkout = await WorkoutProtocolService.carregarTreinoParaExecucao(currentUser.id);
        }
        
        if (manager.currentWorkout) {
            console.log('[TESTE SEM MODAL] ✅ Treino carregado, navegando...');
            await manager.navegarParaTelaWorkout();
            
            console.log('[TESTE SEM MODAL] 🎬 Renderizando treino...');
            await manager.renderizarComSeguranca();
            manager.iniciarCronometro();
            
            console.log('[TESTE SEM MODAL] ✅ Teste concluído!');
        } else {
            console.error('[TESTE SEM MODAL] ❌ Nenhum treino encontrado');
        }
        
    } catch (error) {
        console.error('[TESTE SEM MODAL] ❌ Erro:', error);
        console.error('[TESTE SEM MODAL] Stack:', error.stack);
    }
};

// Funções globais para teste dos modais
window.testarModalSaida = () => {
    console.log('[TEST] 🧪 Testando modal de saída...');
    if (window.workoutExecutionManager) {
        window.workoutExecutionManager.mostrarModalSaida();
    } else {
        console.error('[TEST] ❌ workoutExecutionManager não encontrado');
    }
};

window.testarModalTreinoSalvo = () => {
    console.log('[TEST] 🧪 Testando modal de treino salvo...');
    if (window.workoutExecutionManager) {
        window.workoutExecutionManager.mostrarModalAvisoTreinoSalvo();
    } else {
        console.error('[TEST] ❌ workoutExecutionManager não encontrado');
    }
};

window.testarModalConclusao = () => {
    console.log('[TEST] 🧪 Testando modal de conclusão...');
    if (window.workoutExecutionManager) {
        window.workoutExecutionManager.mostrarModalConclusao();
    } else {
        console.error('[TEST] ❌ workoutExecutionManager não encontrado');
    }
};

console.log('[WorkoutExecution] ✅ Funções de teste criadas:');
console.log('  - testarModalSaida()');
console.log('  - testarModalTreinoSalvo()');
console.log('  - testarModalConclusao()');

// Disponibilizar métodos globalmente para uso nos templates HTML
// ASSINATURA RESTAURADA: confirmarSerie(exerciseIndex, seriesIndex)
window.confirmarSerie = (exerciseIndex, seriesIndex) => {
    return window.workoutExecutionManager.confirmarSerie(exerciseIndex, seriesIndex);
};

window.adicionarSerie = (exercicioId) => {
    return window.workoutExecutionManager.adicionarSerie(exercicioId);
};

window.ajustarValor = (inputId, delta) => {
    return window.workoutExecutionManager.ajustarValor(inputId, delta);
};

window.mostrarHistorico = (exercicioId) => {
    return window.workoutExecutionManager.mostrarHistorico(exercicioId);
};

window.concluirExercicio = (exercicioId) => {
    return window.workoutExecutionManager.concluirExercicio(exercicioId);
};