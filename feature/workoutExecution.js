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
        
        // === REST TIMER PROPERTIES ===
        this.isResting = false;
        this.restStartTime = null;
        this.restDuration = 60; // Default 60 segundos
        this.restTimeRemaining = 0;
        this.lastCompletedExercise = null;
        this.restTimerModal = null;
        this.disposicaoInicio = null;
        this.seriesElement = document.getElementById('series-counter'); // Declaração segura
        this.persistence = workoutPersistence;
        this.modalSaidaAtivo = false;
        this.estaEmModoEmergencia = false;
        
        // === ENHANCED PROPERTIES ===
        this.isInitialized = false;
        this.sessionId = null;
        this.lastSaveTime = null;
        
        // === REST TIMER CONFIG ===
        this.restTimerConfig = {
            defaultRestTime: 60, // 60 segundos padrão
            showCountdown: true,
            allowSkip: true,
            playSound: true,
            vibrate: true,
            autoAdvance: false // Se deve avançar automaticamente após o descanso
        };
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

            // Verificar recovery com lógica mais robusta
            try {
                console.log('[WorkoutExecution] 🔍 Verificando recovery...');
                
                // Primeiro, tentar o sistema moderno
                const { checkForRecovery } = await import('../services/navigationGuard.js');
                const sessionData = await checkForRecovery();
                
                if (sessionData && this.persistence.validateState(sessionData)) {
                    console.log('[WorkoutExecution] 📋 Sessão válida encontrada');
                    
                    // Mostrar modal apenas se há progresso real
                    const hasRealProgress = sessionData.exerciciosExecutados && sessionData.exerciciosExecutados.length > 0;
                    
                    if (hasRealProgress) {
                        const { showRecoveryModal } = await import('../services/navigationGuard.js');
                        const recoveryResult = await showRecoveryModal(sessionData);
                
                        if (recoveryResult && recoveryResult.action === 'recover') {
                            console.log('[WorkoutExecution] 🔄 Recuperando treino...');
                            await this.recuperarTreinoEmAndamento(sessionData);
                            console.log('[WorkoutExecution] 🚪 SAINDO DO MÉTODO - TREINO RECUPERADO');
                            return;
                        } else if (recoveryResult && recoveryResult.action === 'discard') {
                            console.log('[WorkoutExecution] 🗑️ Descartando dados anteriores');
                            await this.persistence.clearState();
                        }
                    } else {
                        console.log('[WorkoutExecution] ⚠️ Sessão sem progresso real, limpando cache');
                        await this.persistence.clearState();
                    }
                }
                
            } catch (recoveryError) {
                console.warn('[WorkoutExecution] ⚠️ Erro na verificação de recovery:', recoveryError);
                
                // Fallback mais simples: apenas limpar cache corrompido
                try {
                    await this.persistence.clearState();
                } catch (clearError) {
                    console.error('[WorkoutExecution] Erro ao limpar cache:', clearError);
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
            console.log(`[WorkoutExecution] 📞 Chamando WorkoutProtocolService.carregarTreinoParaExecucao para usuário ID: ${currentUser.id}`);
            this.currentWorkout = await WorkoutProtocolService.carregarTreinoParaExecucao(currentUser.id);
            console.log(`[WorkoutExecution] ✅ Treino carregado para usuário ${currentUser.nome} (ID: ${currentUser.id}):`, this.currentWorkout);
            
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
            
            // Para recovery, usar validação mais permissiva
            const isValidForRecovery = workoutState ? TreinoCacheService.validateState(workoutState, { 
                requireExecutions: false, 
                forRecovery: true 
            }) : false;
            
            // Verificar se tem algum progresso real
            const hasProgress = workoutState?.exerciciosExecutados?.length > 0;
            
            return {
                hasCache: isValidForRecovery && workoutState,
                data: workoutState,
                isValid: isValidForRecovery,
                hasProgress
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
        console.log('[WorkoutManager] 🔄 Resumindo workout do cache', cacheData);
        
        try {
            // 0. Verificar se cacheData existe
            if (!cacheData) {
                console.error('[WorkoutManager] ❌ Dados do cache são null/undefined');
                throw new Error('Nenhum dado de cache fornecido');
            }
            
            // 1. Validar dados do cache com opções para recovery
            const isValid = TreinoCacheService.validateState(cacheData, { 
                requireExecutions: false, 
                forRecovery: true 
            });
            
            if (!isValid) {
                console.error('[WorkoutManager] ❌ Dados do cache inválidos:', cacheData);
                throw new Error('Dados do cache inválidos');
            }
            
            console.log('[WorkoutManager] ✅ Cache validado, restaurando estado...');
            
            // 2. Restaurar estado completo
            await this.restoreCompleteState(cacheData);
            
            // 3. Ajustar timers para tempo decorrido
            this.adjustTimersForElapsedTime(cacheData);
            
            // 4. Navegar para tela de workout
            console.log('[WorkoutManager] 📱 Navegando para tela de workout...');
            await this.navegarParaTelaWorkout();
            
            // Aguardar um momento para garantir que a tela foi carregada
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // 5. Renderizar estado restaurado
            console.log('[WorkoutManager] 🎨 Renderizando estado restaurado...');
            await this.renderizarComSeguranca();
            
            // 6. Iniciar cronômetro se necessário
            if (!this.timerInterval) {
                this.iniciarCronometro();
            }
            
            // 7. Reativar proteções
            this.activateWorkoutProtection();
            
            // 8. Marcar como inicializado
            this.isInitialized = true;
            
            console.log('[WorkoutManager] ✅ Workout resumido com sucesso');
            
            // Mostrar notificação de sucesso
            if (window.showNotification) {
                window.showNotification('Treino restaurado com sucesso!', 'success');
            }
            
            return true;
            
        } catch (error) {
            console.error('[WorkoutManager] ❌ Erro ao resumir workout:', error);
            console.error('[WorkoutManager] Stack trace:', error.stack);
            
            // Mostrar erro ao usuário
            if (window.showNotification) {
                window.showNotification(`Erro ao recuperar treino: ${error.message}`, 'error');
            }
            
            // Não limpar cache automaticamente - deixar usuário decidir
            return false;
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
        // Tentar obter timestamp de várias fontes possíveis
        const possibleTimestamp = cacheData.metadata?.savedAt || 
                                cacheData.timestamp || 
                                cacheData.startTime ||
                                Date.now();
        
        // Validar e criar data
        let savedTime;
        try {
            savedTime = new Date(possibleTimestamp);
            // Verificar se a data é válida
            if (isNaN(savedTime.getTime())) {
                console.warn('[WorkoutManager] Timestamp inválido, usando tempo atual');
                savedTime = new Date();
            }
        } catch (error) {
            console.warn('[WorkoutManager] Erro ao criar data, usando tempo atual:', error);
            savedTime = new Date();
        }
        
        const now = new Date();
        const elapsedMs = now - savedTime;
        
        console.log('[WorkoutManager] Ajustando timers:', {
            savedTime: savedTime.toISOString(),
            elapsedSinceCache: Math.round(elapsedMs / 1000) + 's',
            originalTimestamp: possibleTimestamp
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
        
        // Notificar ContextualWorkoutButton sobre mudança
        this.notifyContextualButtons();
    }

    /**
     * Notifica ContextualWorkoutButtons sobre mudança de estado
     */
    notifyContextualButtons() {
        console.log('[WorkoutExecution] 📢 Notificando botões contextuais...');
        
        // Emitir evento customizado
        const event = new CustomEvent('workout-cache-updated', {
            detail: { 
                hasWorkout: true,
                exercisesCount: this.exerciciosExecutados?.length || 0,
                timestamp: Date.now()
            }
        });
        document.dispatchEvent(event);
        
        // Atualizar via AppState para trigger listeners
        AppState.set('workoutCacheUpdated', Date.now());
        
        // Forçar atualização se botão global existir
        if (window.contextualWorkoutButton?.forceUpdate) {
            window.contextualWorkoutButton.forceUpdate();
        }
        
        // Buscar todos os botões e forçar atualização
        const buttons = document.querySelectorAll('[data-contextual-workout-button]');
        buttons.forEach(btn => {
            if (btn._contextualButton?.forceUpdate) {
                btn._contextualButton.forceUpdate();
            }
        });
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
        
        // Mostrar indicador de carregamento
        this.mostrarIndicadorCarregamento();
        
        try {
            // 1. Primeiro, garantir que a tela de workout existe
            let workoutScreen = document.querySelector('#workout-screen');
            
            if (!workoutScreen) {
                console.log('[WorkoutExecution] 🔨 Criando tela de workout...');
                workoutScreen = await this.criarEPrepararTelaWorkout();
            }
            
            // 2. Esconder todas as outras telas
            console.log('[WorkoutExecution] 🎭 Ocultando outras telas...');
            document.querySelectorAll('.screen').forEach(screen => {
                if (screen.id !== 'workout-screen') {
                    screen.classList.remove('active');
                    screen.style.display = 'none';
                }
            });
            
            // 3. Mostrar tela de workout
            console.log('[WorkoutExecution] 📺 Exibindo tela de workout...');
            workoutScreen.style.display = 'block';
            workoutScreen.classList.add('active', 'screen');
            
            // 4. Aguardar um momento para garantir que o DOM está pronto
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // 5. Verificar se a navegação funcionou
            const isVisible = workoutScreen.offsetParent !== null;
            if (!isVisible) {
                throw new Error('Tela de workout não está visível após navegação');
            }
            
            console.log('[WorkoutExecution] ✅ Navegação bem-sucedida');
            
            // 6. Remover indicador de carregamento
            this.removerIndicadorCarregamento();
            
            // 7. Tentar métodos de navegação do sistema se disponíveis (sem bloquear)
            this.tentarNavegacaoSistema();
            
            return true;
            
        } catch (error) {
            console.error('[WorkoutExecution] ❌ Erro na navegação:', error);
            this.removerIndicadorCarregamento();
            
            // Mostrar erro ao usuário
            if (window.showNotification) {
                window.showNotification('Erro ao navegar para o treino. Tentando método alternativo...', 'warning');
            }
            
            // Último recurso
            this.navegacaoManualComFeedback();
        }
    }
    
    /**
     * Cria e prepara a tela de workout
     */
    async criarEPrepararTelaWorkout() {
        const appContainer = document.getElementById('app') || document.body;
        
        // Verificar se já existe
        let workoutScreen = document.querySelector('#workout-screen');
        if (workoutScreen) {
            return workoutScreen;
        }
        
        // Criar nova tela
        workoutScreen = document.createElement('div');
        workoutScreen.id = 'workout-screen';
        workoutScreen.className = 'screen workout-screen';
        
        // Importar template se disponível
        if (window.workoutTemplate && typeof window.workoutTemplate === 'function') {
            workoutScreen.innerHTML = window.workoutTemplate();
        } else {
            console.warn('[WorkoutExecution] workoutTemplate não encontrado, usando template de fallback');
            
            // Template completo de fallback baseado no workoutTemplate original
            workoutScreen.innerHTML = `
                <div id="workout-screen" class="workout-screen">
                    <!-- Header Flutuante -->
                    <div class="workout-header-float">
                        <button class="back-button-float" onclick="workoutExecutionManager.voltarParaHome()">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M19 12H5M12 19l-7-7 7-7"/>
                            </svg>
                        </button>
                        <div class="workout-timer">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12 6 12 12 16 14"/>
                            </svg>
                            <span id="workout-timer-display">00:00</span>
                        </div>
                        <button class="menu-button-float">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="3" y1="12" x2="21" y2="12"/>
                                <line x1="3" y1="6" x2="21" y2="6"/>
                                <line x1="3" y1="18" x2="21" y2="18"/>
                            </svg>
                        </button>
                    </div>

                    <!-- Progress Bar -->
                    <div class="workout-progress-container">
                        <div class="workout-progress-bar">
                            <div id="workout-progress" class="workout-progress-fill"></div>
                        </div>
                        <div class="workout-progress-info">
                            <span class="progress-current" id="current-exercise-number">1</span>
                            <span class="progress-separator">/</span>
                            <span class="progress-total" id="total-exercises">0</span>
                            <span class="progress-label">exercícios</span>
                        </div>
                    </div>

                    <!-- Container Principal -->
                    <div class="workout-content">
                        <div class="workout-info-card">
                            <h1 id="workout-name" class="workout-title">Carregando...</h1>
                            <div class="workout-meta-pills">
                                <span id="current-week"></span>
                                <span id="muscle-groups"></span>
                            </div>
                        </div>
                        
                        <!-- Container de Exercícios -->
                        <div id="exercises-container" class="exercises-container"></div>
                    </div>
                </div>
            `;
        }
        
        appContainer.appendChild(workoutScreen);
        
        // Carregar CSS se necessário
        this.garantirCSSCarregado();
        
        return workoutScreen;
    }
    
    /**
     * Garante que o CSS está carregado
     */
    garantirCSSCarregado() {
        if (!document.querySelector('#workout-execution-css')) {
            const link = document.createElement('link');
            link.id = 'workout-execution-css';
            link.rel = 'stylesheet';
            link.href = './styles/workoutExecution.css';
            document.head.appendChild(link);
        }
    }
    
    /**
     * Mostra indicador de carregamento
     */
    mostrarIndicadorCarregamento() {
        const existing = document.querySelector('.workout-loading-indicator');
        if (existing) return;
        
        const loader = document.createElement('div');
        loader.className = 'workout-loading-indicator';
        loader.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 20px 40px;
                border-radius: 8px;
                z-index: 10000;
                text-align: center;
            ">
                <div style="margin-bottom: 10px;">Carregando treino...</div>
                <div style="
                    width: 40px;
                    height: 40px;
                    border: 3px solid #333;
                    border-top-color: #a8ff00;
                    border-radius: 50%;
                    margin: 0 auto;
                    animation: spin 1s linear infinite;
                "></div>
            </div>
            <style>
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            </style>
        `;
        document.body.appendChild(loader);
    }
    
    /**
     * Remove indicador de carregamento
     */
    removerIndicadorCarregamento() {
        const loader = document.querySelector('.workout-loading-indicator');
        if (loader) {
            loader.remove();
        }
    }
    
    /**
     * Tenta navegação usando métodos do sistema (não bloqueante)
     */
    tentarNavegacaoSistema() {
        // Tentar renderTemplate em background
        if (window.renderTemplate && typeof window.renderTemplate === 'function') {
            try {
                const result = window.renderTemplate('workout');
                // Verificar se é uma Promise
                if (result && typeof result.catch === 'function') {
                    result.catch(err => {
                        console.log('[WorkoutExecution] renderTemplate falhou (não crítico):', err);
                    });
                }
            } catch (err) {
                console.log('[WorkoutExecution] renderTemplate erro síncrono (não crítico):', err);
            }
        }
    }
    
    /**
     * Navegação manual com feedback
     */
    navegacaoManualComFeedback() {
        try {
            this.navegacaoManual();
            
            // Notificar sucesso após pequeno delay
            setTimeout(() => {
                if (window.showNotification) {
                    window.showNotification('Treino carregado!', 'success');
                }
            }, 500);
        } catch (error) {
            console.error('[WorkoutExecution] ❌ Falha total na navegação:', error);
            if (window.showNotification) {
                window.showNotification('Erro ao carregar treino. Por favor, recarregue a página.', 'error');
            }
        }
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
        
        try {
            // Esconder todas as telas
            document.querySelectorAll('.screen').forEach(screen => {
                screen.classList.remove('active');
                screen.style.display = 'none';
            });
            
            // Procurar tela de workout
            let workoutScreen = document.querySelector('#workout-screen');
            
            // Se não existir, criar usando o novo método
            if (!workoutScreen) {
                console.log('[WorkoutExecution] Criando tela de workout...');
                workoutScreen = this.criarEPrepararTelaWorkout();
                
                // Se ainda não existir, tentar método antigo
                if (!workoutScreen) {
                    workoutScreen = this.criarTelaWorkoutDinamica();
                }
            }
            
            // Mostrar a tela
            if (workoutScreen) {
                workoutScreen.style.display = 'block';
                workoutScreen.classList.add('active', 'screen');
                console.log('[WorkoutExecution] ✅ Tela de workout ativada manualmente');
                
                // Garantir que o CSS está carregado
                this.garantirCSSCarregado();
            } else {
                throw new Error('Não foi possível criar/encontrar a tela de workout');
            }
        } catch (error) {
            console.error('[WorkoutExecution] ❌ Erro na navegação manual:', error);
            throw error;
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
            // Só avisar sobre elementos críticos, não sobre elementos opcionais
            if (id === 'workout-timer' || id === 'workout-timer-display') {
                console.warn(`[WorkoutExecution] Elemento crítico não encontrado: ${id}`);
            }
        }
    }

    // Inicia o cronômetro do treino
    iniciarCronometro() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        // Se startTime já existe (recovery), manter; senão, criar novo
        if (!this.startTime) {
            this.startTime = Date.now();
            console.log(`[WorkoutExecution] Timer iniciado com novo startTime: ${this.startTime}`);
        } else {
            console.log(`[WorkoutExecution] Timer continuando de startTime existente: ${this.startTime}`);
        }
        
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

    // === REST TIMER METHODS ===

    /**
     * Inicia cronômetro de descanso após completar uma série
     * @param {number} restTime - Tempo de descanso em segundos (opcional)
     * @param {Object} exerciseInfo - Informações do exercício completado
     */
    iniciarCronometroDescanso(restTime = null, exerciseInfo = {}) {
        // Determinar tempo de descanso
        this.restDuration = restTime || exerciseInfo.tempo_descanso || this.restTimerConfig.defaultRestTime;
        this.restTimeRemaining = this.restDuration;
        this.isResting = true;
        this.restStartTime = Date.now();
        this.lastCompletedExercise = exerciseInfo;

        console.log(`[WorkoutExecution] 🛌 Iniciando descanso de ${this.restDuration}s após ${exerciseInfo.exercicio_nome || 'exercício'}`);

        // Limpar timer anterior se existir
        if (this.restTimerInterval) {
            clearInterval(this.restTimerInterval);
        }

        // Mostrar modal de descanso
        this.mostrarModalDescanso();

        // Iniciar countdown
        this.restTimerInterval = setInterval(() => {
            this.restTimeRemaining--;
            this.atualizarDisplayDescanso();

            // Verificar se terminou
            if (this.restTimeRemaining <= 0) {
                this.finalizarDescanso();
            }
        }, 1000);

        // Salvar estado do descanso
        this.salvarEstadoDescanso();
    }

    /**
     * Finaliza o período de descanso
     */
    finalizarDescanso() {
        console.log('[WorkoutExecution] ✅ Descanso finalizado');

        // Limpar timer
        if (this.restTimerInterval) {
            clearInterval(this.restTimerInterval);
            this.restTimerInterval = null;
        }

        // Resetar estado
        this.isResting = false;
        this.restTimeRemaining = 0;
        this.restStartTime = null;

        // Fechar modal
        this.fecharModalDescanso();

        // Tocar som/vibrar se configurado
        this.notificarFimDescanso();

        // Auto-avançar se configurado
        if (this.restTimerConfig.autoAdvance) {
            this.proximoExercicio();
        }
    }

    /**
     * Pula o descanso atual
     */
    pularDescanso() {
        if (!this.isResting) return;

        console.log('[WorkoutExecution] ⏭️ Descanso pulado pelo usuário');
        this.finalizarDescanso();
    }

    /**
     * Adiciona tempo extra ao descanso
     * @param {number} extraSeconds - Segundos extras a adicionar
     */
    adicionarTempoDescanso(extraSeconds = 30) {
        if (!this.isResting) return;

        this.restTimeRemaining += extraSeconds;
        this.restDuration += extraSeconds;
        
        console.log(`[WorkoutExecution] ⏰ Adicionados ${extraSeconds}s ao descanso`);
        this.atualizarDisplayDescanso();
    }

    /**
     * Mostra modal de cronômetro de descanso
     */
    mostrarModalDescanso() {
        console.log('[WorkoutExecution] 📺 Mostrando modal de descanso...');
        
        // Primeiro tentar usar o modal do template se existir
        let modal = document.getElementById('rest-timer-overlay');
        
        if (modal) {
            // Usar modal existente do template
            console.log('[WorkoutExecution] ✅ Usando modal do template');
            modal.style.display = 'flex';
            
            // Atualizar texto da motivação
            const motivationEl = document.getElementById('motivation-text');
            if (motivationEl) {
                motivationEl.textContent = this.getMotivationalMessage();
            }
            
            // Atualizar display inicial
            this.atualizarDisplayDescanso();
            
            // Adicionar event listeners
            const skipBtn = document.getElementById('skip-rest');
            if (skipBtn && !skipBtn.hasListener) {
                skipBtn.addEventListener('click', () => this.finalizarDescanso());
                skipBtn.hasListener = true;
            }
        } else {
            // Criar modal dinamicamente se template não existir
            console.log('[WorkoutExecution] 🔨 Criando modal dinamicamente');
            
            const modalHTML = `
                <div id="rest-timer-modal" class="modal-overlay rest-timer-modal" style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.9);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    backdrop-filter: blur(8px);
                ">
                    <div class="rest-timer-content" style="
                        background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
                        border-radius: 24px;
                        padding: 32px;
                        text-align: center;
                        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                        border: 1px solid #333;
                        width: 90%;
                        max-width: 400px;
                    ">
                        <div class="rest-icon" style="
                            font-size: 4rem;
                            margin-bottom: 20px;
                            color: #00bcd4;
                            animation: pulse 2s infinite;
                        ">🛌</div>
                        
                        <h2 style="
                            margin: 0 0 12px 0;
                            color: #fff;
                            font-size: 1.75rem;
                            font-weight: 700;
                        ">Tempo de Descanso</h2>
                        
                        <p id="rest-exercise-name" style="
                            margin: 0 0 32px 0;
                            color: #aaa;
                            font-size: 1rem;
                        ">${this.lastCompletedExercise?.exercicio_nome || 'Série completada'}</p>
                        
                        <div class="rest-timer-display" style="
                            position: relative;
                            margin-bottom: 32px;
                        ">
                            <div class="timer-circle" style="
                                width: 150px;
                                height: 150px;
                                border-radius: 50%;
                                background: conic-gradient(#00bcd4 0deg, #333 0deg);
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                margin: 0 auto 20px;
                                position: relative;
                                box-shadow: 0 0 30px rgba(0, 188, 212, 0.3);
                            ">
                                <div class="timer-inner" style="
                                    width: 130px;
                                    height: 130px;
                                    background: #1a1a1a;
                                    border-radius: 50%;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                ">
                                    <span id="rest-timer-display" style="
                                        font-size: 2rem;
                                        font-weight: 700;
                                        color: #00bcd4;
                                        font-family: monospace;
                                    ">${this.formatTime(this.restTimeRemaining)}</span>
                                </div>
                            </div>
                            
                            <div id="rest-progress-text" style="
                                color: #aaa;
                                font-size: 0.9rem;
                            ">${this.restTimeRemaining}s restantes</div>
                        </div>
                        
                        <div class="rest-actions" style="
                            display: flex;
                            gap: 12px;
                            justify-content: center;
                        ">
                            <button id="add-time-btn" class="rest-btn" style="
                                background: #333;
                                border: 1px solid #555;
                                color: #fff;
                                padding: 12px 24px;
                                border-radius: 12px;
                                cursor: pointer;
                                font-size: 0.95rem;
                                transition: all 0.2s;
                                font-weight: 600;
                            ">+30s</button>
                            
                            <button id="skip-rest-btn" class="rest-btn" style="
                                background: linear-gradient(45deg, #a8ff00, #8de000);
                                border: none;
                                color: #000;
                                padding: 12px 32px;
                                border-radius: 12px;
                                cursor: pointer;
                                font-size: 0.95rem;
                                font-weight: 700;
                                transition: all 0.2s;
                                box-shadow: 0 4px 15px rgba(168, 255, 0, 0.3);
                            ">Pular Descanso</button>
                        </div>
                        
                        <div class="rest-motivation" style="
                            margin-top: 32px;
                            padding-top: 24px;
                            border-top: 1px solid #333;
                        ">
                            <p id="motivation-text" style="
                                margin: 0;
                                color: #888;
                                font-size: 0.9rem;
                                font-style: italic;
                                line-height: 1.5;
                            ">${this.getMotivationalMessage()}</p>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHTML);
            modal = document.getElementById('rest-timer-modal');

            // Adicionar event listeners
            document.getElementById('skip-rest-btn')?.addEventListener('click', () => this.finalizarDescanso());
            document.getElementById('add-time-btn')?.addEventListener('click', () => this.adicionarTempoDescanso(30));
        }
        
        this.restTimerModal = modal;

        // Adicionar estilos de hover
        this.addRestTimerStyles();
        
        console.log('[WorkoutExecution] ✅ Modal de descanso ativo');
    }

    /**
     * Fecha modal de descanso
     */
    fecharModalDescanso() {
        // Tentar fechar modal do template
        const templateModal = document.getElementById('rest-timer-overlay');
        if (templateModal) {
            templateModal.style.display = 'none';
        }
        
        // Tentar fechar modal dinâmico
        const dynamicModal = document.getElementById('rest-timer-modal');
        if (dynamicModal) {
            dynamicModal.remove();
        }
        
        this.restTimerModal = null;
    }

    /**
     * Atualiza display do cronômetro de descanso
     */
    atualizarDisplayDescanso() {
        // Tentar atualizar ambos os tipos de display (template e dinâmico)
        const timeDisplays = [
            document.getElementById('rest-timer-display'),  // Modal do template
            document.getElementById('rest-time-display')    // Modal dinâmico
        ];
        
        const progressText = document.getElementById('rest-progress-text');
        const timerCircle = document.querySelector('.timer-circle');
        
        // Para o modal do template, precisamos atualizar elementos específicos
        const templateTimerText = document.querySelector('.rest-time');
        const templateLabel = document.querySelector('.rest-label');

        // Atualizar displays de tempo
        timeDisplays.forEach(display => {
            if (display) {
                display.textContent = this.formatTime(this.restTimeRemaining);
            }
        });
        
        // Atualizar display do template se existir
        if (templateTimerText) {
            templateTimerText.textContent = this.formatTime(this.restTimeRemaining);
        }
        
        if (templateLabel) {
            templateLabel.textContent = 'segundos';
        }

        if (progressText) {
            progressText.textContent = `${this.restTimeRemaining}s restantes`;
        }

        // Atualizar progresso circular
        if (timerCircle) {
            const progress = ((this.restDuration - this.restTimeRemaining) / this.restDuration) * 360;
            timerCircle.style.background = `conic-gradient(#00bcd4 ${progress}deg, #333 ${progress}deg)`;
        }
        
        // Para o modal do template, atualizar o SVG circle
        const progressFill = document.querySelector('.rest-progress-fill');
        if (progressFill) {
            const radius = progressFill.getAttribute('r') || 70; // pegar raio do elemento
            const circumference = 2 * Math.PI * radius;
            const progress = (this.restTimeRemaining / this.restDuration);
            const dashoffset = circumference * (1 - progress);
            
            progressFill.style.strokeDasharray = `${circumference}`;
            progressFill.style.strokeDashoffset = `${dashoffset}`;
            progressFill.style.stroke = this.restTimeRemaining <= 10 ? '#ff4757' : '#00bcd4';
            progressFill.style.transition = 'stroke-dashoffset 0.5s ease-in-out';
        }

        // Mudar cor quando restam poucos segundos
        if (this.restTimeRemaining <= 10) {
            timeDisplays.forEach(display => {
                if (display) {
                    display.style.color = '#ff4757';
                }
            });
            
            if (templateTimerText) {
                templateTimerText.style.color = '#ff4757';
            }
            
            if (timerCircle) {
                const progress = ((this.restDuration - this.restTimeRemaining) / this.restDuration) * 360;
                timerCircle.style.background = `conic-gradient(#ff4757 ${progress}deg, #333 ${progress}deg)`;
            }
        }
    }

    /**
     * Formata tempo em MM:SS
     * @param {number} seconds - Segundos para formatar
     * @returns {string} Tempo formatado
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    /**
     * Retorna mensagem motivacional aleatória
     * @returns {string} Mensagem motivacional
     */
    getMotivationalMessage() {
        const messages = [
            "Respire fundo e prepare-se para a próxima série!",
            "Descanse bem, a próxima série será melhor ainda!",
            "Hidrate-se e foque no próximo desafio!",
            "Você está indo muito bem! Continue assim!",
            "Cada série te deixa mais forte!",
            "Mantenha o foco e a determinação!",
            "Descanso merecido! Logo voltamos com tudo!",
            "Aproveite para regular a respiração!",
            "Mente forte, corpo forte!",
            "Você consegue! Só mais algumas séries!"
        ];
        
        return messages[Math.floor(Math.random() * messages.length)];
    }

    /**
     * Notifica fim do descanso
     */
    notificarFimDescanso() {
        // Som
        if (this.restTimerConfig.playSound) {
            this.playNotificationSound();
        }

        // Vibração
        if (this.restTimerConfig.vibrate && navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
        }

        // Notificação visual
        if (window.showNotification) {
            window.showNotification('✅ Descanso finalizado! Próxima série.', 'success');
        }
    }

    /**
     * Toca som de notificação
     */
    playNotificationSound() {
        try {
            // Criar tom usando Web Audio API
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.warn('[WorkoutExecution] Erro ao tocar som:', error);
        }
    }

    /**
     * Salva estado do descanso no cache
     */
    salvarEstadoDescanso() {
        if (!this.isResting) return;

        const restState = {
            isResting: this.isResting,
            restStartTime: this.restStartTime,
            restDuration: this.restDuration,
            restTimeRemaining: this.restTimeRemaining,
            lastCompletedExercise: this.lastCompletedExercise
        };

        try {
            localStorage.setItem('workoutRestState', JSON.stringify(restState));
        } catch (error) {
            console.warn('[WorkoutExecution] Erro ao salvar estado de descanso:', error);
        }
    }

    /**
     * Restaura estado do descanso do cache
     */
    restaurarEstadoDescanso() {
        try {
            const restStateRaw = localStorage.getItem('workoutRestState');
            if (!restStateRaw) return false;

            const restState = JSON.parse(restStateRaw);
            
            // Verificar se não é muito antigo (máximo 5 minutos)
            const elapsed = Date.now() - restState.restStartTime;
            if (elapsed > 5 * 60 * 1000) {
                localStorage.removeItem('workoutRestState');
                return false;
            }

            // Calcular tempo restante
            const timeElapsed = Math.floor(elapsed / 1000);
            const timeRemaining = Math.max(0, restState.restDuration - timeElapsed);

            if (timeRemaining > 0) {
                this.restDuration = restState.restDuration;
                this.restTimeRemaining = timeRemaining;
                this.isResting = true;
                this.restStartTime = restState.restStartTime;
                this.lastCompletedExercise = restState.lastCompletedExercise;

                console.log(`[WorkoutExecution] 🔄 Restaurando descanso: ${timeRemaining}s restantes`);
                
                this.mostrarModalDescanso();
                this.iniciarCronometroDescanso(timeRemaining);
                
                return true;
            } else {
                localStorage.removeItem('workoutRestState');
                return false;
            }
        } catch (error) {
            console.warn('[WorkoutExecution] Erro ao restaurar estado de descanso:', error);
            localStorage.removeItem('workoutRestState');
            return false;
        }
    }

    /**
     * Limpa estado de descanso do cache
     */
    limparEstadoDescanso() {
        localStorage.removeItem('workoutRestState');
    }

    /**
     * Adiciona estilos CSS para o timer de descanso
     */
    addRestTimerStyles() {
        if (document.getElementById('rest-timer-styles')) return;

        const styles = `
            <style id="rest-timer-styles">
                .rest-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                }
                
                #add-time-btn:hover {
                    background: #444;
                    border-color: #666;
                }
                
                #skip-rest-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(168, 255, 0, 0.3);
                }
                
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                
                .rest-timer-modal.ending .timer-circle {
                    animation: pulse 1s infinite;
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
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

        // Capturar dados da série (peso e repetições)
        const pesoInput = document.querySelector(`input.series-weight[data-exercise="${exerciseIndex}"][data-series="${seriesIndex}"]`);
        const repsInput = document.querySelector(`input.series-reps[data-exercise="${exerciseIndex}"][data-series="${seriesIndex}"]`);
        
        const peso = parseFloat(pesoInput?.value) || 0;
        const reps = parseInt(repsInput?.value) || 0;
        
        // Salvar execução no array
        const execucao = {
            exercicio_id: exercicio.id,
            exercicio_nome: exercicio.nome,
            peso_utilizado: peso,
            repeticoes: reps,
            serie_numero: seriesIndex + 1,
            exercicio_index: exerciseIndex,
            timestamp: new Date().toISOString(),
            tempo_descanso: exercicio.tempo_descanso || this.restTimerConfig.defaultRestTime
        };
        
        this.exerciciosExecutados.push(execucao);
        console.log(`[WorkoutExecution] Execução salva:`, execucao);
        
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
        
        // Verificar se deve iniciar cronômetro de descanso
        const isLastSeriesOfExercise = seriesCompletadas >= totalSeries;
        const isLastExercise = exerciseIndex >= (this.currentWorkout.exercicios.length - 1);
        const isLastSeriesOfWorkout = isLastSeriesOfExercise && isLastExercise;
        
        if (isLastSeriesOfExercise) {
            console.log(`[WorkoutExecution] Exercício ${exerciseIndex + 1} completo!`);
            
            // Marcar exercício como completo visualmente
            const exerciseCard = document.getElementById(`exercise-card-${exerciseIndex}`);
            if (exerciseCard) {
                exerciseCard.style.opacity = '0.7';
                exerciseCard.style.border = '2px solid #4CAF50';
            }
            
            // Atualizar progresso geral
            this.atualizarProgresso();
            
            // Se é o último exercício, não iniciar descanso
            if (isLastSeriesOfWorkout) {
                console.log(`[WorkoutExecution] 🎉 Treino completado! Não há descanso.`);
                if (window.showNotification) {
                    window.showNotification('🎉 Treino completado!', 'success');
                }
                return;
            }
            
            // Descanso entre exercícios (tempo extra)
            const restTime = (exercicio.tempo_descanso || this.restTimerConfig.defaultRestTime) + 30; // +30s entre exercícios
            this.iniciarCronometroDescanso(restTime, {
                ...execucao,
                isExerciseComplete: true,
                nextExercise: this.currentWorkout.exercicios[exerciseIndex + 1]?.nome
            });
            
        } else {
            // Descanso entre séries
            const restTime = exercicio.tempo_descanso || this.restTimerConfig.defaultRestTime;
            this.iniciarCronometroDescanso(restTime, execucao);
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
            
            // Notificar ContextualWorkoutButton sobre mudança
            this.notifyContextualButtons();
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
            
            // CRÍTICO: Restaurar estado ANTES de renderizar
            if (state) {
                console.log('[WorkoutExecution] 🔄 Restaurando estado do treino...');
                
                // Restaurar dados do treino
                this.currentWorkout = state.currentWorkout || null;
                this.exerciciosExecutados = state.exerciciosExecutados || [];
                this.startTime = state.startTime || Date.now();
                
                // Se não há currentWorkout válido, tentar buscar dados atuais
                if (!this.currentWorkout && window.AppState) {
                    this.currentWorkout = window.AppState.get('currentWorkout');
                    console.log('[WorkoutExecution] 📋 Usando currentWorkout do AppState:', !!this.currentWorkout);
                }
                
                console.log('[WorkoutExecution] ✅ Estado restaurado:', {
                    hasCurrentWorkout: !!this.currentWorkout,
                    exerciciosCount: this.exerciciosExecutados.length,
                    startTime: this.startTime
                });
            }
            
            // Renderizar com estado recuperado
            await this.renderizarComSeguranca();
            this.iniciarCronometro();
            
            // Tentar restaurar cronômetro de descanso se existir
            setTimeout(() => {
                const restoreSuccess = this.restaurarEstadoDescanso();
                if (restoreSuccess) {
                    console.log('[WorkoutExecution] 🛌 Cronômetro de descanso restaurado');
                }
            }, 1000); // Delay para garantir que o DOM esteja pronto
            
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
            
            // Limpar também estado de descanso
            this.limparEstadoDescanso();
            
            // Fechar modal de descanso se estiver aberto
            this.fecharModalDescanso();
            
            // Parar cronômetros de descanso
            if (this.restTimerInterval) {
                clearInterval(this.restTimerInterval);
                this.restTimerInterval = null;
            }
            
            // Resetar flags de descanso
            this.isResting = false;
            this.restTimeRemaining = 0;
            this.restStartTime = null;
            
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
        if (!this.currentWorkout?.exercicios) {
            // Fallback para dados parciais de recovery
            if (this.exerciciosExecutados && this.exerciciosExecutados.length > 0) {
                const exerciciosUnicos = new Set(this.exerciciosExecutados.map(e => e.exercicio_id)).size;
                const totalEstimado = Math.max(exerciciosUnicos * 3, this.exerciciosExecutados.length + 1);
                const percentual = Math.round((this.exerciciosExecutados.length / totalEstimado) * 100);
                console.log(`[WorkoutExecution] Progresso (fallback): ${percentual}% (${this.exerciciosExecutados.length}/${totalEstimado})`);
                return;
            }
            return;
        }
        
        const total = this.currentWorkout.exercicios.length * 3; // 3 séries por exercício em média
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
        console.log('[WorkoutExecution] 💾 Salvando treino antes de sair...');
        
        try {
            // Forçar salvamento completo (não parcial)
            await this.salvarEstadoAtual(true);
            
            // Aguardar um momento para garantir que o cache foi atualizado
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Notificar botões contextuais
            this.notifyContextualButtons();
            
            console.log('[WorkoutExecution] ✅ Treino salvo com sucesso');
            
            // Mostrar notificação de sucesso
            if (window.showNotification) {
                window.showNotification('Treino salvo com sucesso!', 'success');
            }
            
        } catch (error) {
            console.error('[WorkoutExecution] ❌ Erro ao salvar treino:', error);
            if (window.showNotification) {
                window.showNotification('Erro ao salvar treino', 'error');
            }
        }
        
        this.fecharModalSaida();
        
        // Aguardar um pouco antes de navegar para garantir que tudo foi processado
        setTimeout(() => {
            this.navegarParaHomeDiretamente();
        }, 300);
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
        
        // Navegar para home usando sistema de templates
        try {
            if (window.renderTemplate) {
                window.renderTemplate('home');
            } else if (window.navigateTo) {
                window.navigateTo('home');
            } else {
                // Último recurso: tentar mostrar tela de home
                const homeScreen = document.getElementById('home-screen');
                if (homeScreen) {
                    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
                    homeScreen.classList.add('active');
                } else {
                    console.warn('[WorkoutExecution] Fallback: recarregando página');
                    window.location.href = '/';
                }
            }
        } catch (error) {
            console.error('[WorkoutExecution] Erro na navegação para home:', error);
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

// Função de debug para verificar estado do cache
window.debugWorkoutCache = async function() {
    console.log('[DEBUG CACHE] 🔍 Iniciando verificação completa do cache...');
    
    try {
        const state = await TreinoCacheService.getWorkoutState();
        const hasActive = await TreinoCacheService.hasActiveWorkout();
        const isValid = state ? TreinoCacheService.validateState(state) : false;
        
        console.log('[DEBUG CACHE] Estado encontrado:', state);
        console.log('[DEBUG CACHE] hasActiveWorkout:', hasActive);
        console.log('[DEBUG CACHE] validateState:', isValid);
        
        if (state) {
            console.log('[DEBUG CACHE] Detalhes:', {
                exerciciosExecutados: state.exerciciosExecutados?.length || 0,
                currentWorkout: !!state.currentWorkout,
                isCompleted: state.isCompleted,
                finalizado: state.finalizado,
                metadata: state.metadata,
                startTime: state.startTime ? new Date(state.startTime).toLocaleString() : 'N/A'
            });
            
            if (state.exerciciosExecutados?.length > 0) {
                console.log('[DEBUG CACHE] Primeiros exercícios executados:', 
                    state.exerciciosExecutados.slice(0, 3));
            }
        }
        
        // Verificar localStorage diretamente
        const rawV2 = localStorage.getItem('workoutSession_v2');
        const rawLegacy = localStorage.getItem('treino_em_andamento');
        
        console.log('[DEBUG CACHE] localStorage workoutSession_v2:', rawV2 ? 'EXISTE' : 'NULL');
        console.log('[DEBUG CACHE] localStorage treino_em_andamento:', rawLegacy ? 'EXISTE' : 'NULL');
        
        // Verificar ContextualWorkoutButton
        const buttons = document.querySelectorAll('.contextual-workout-btn');
        if (buttons.length > 0) {
            console.log('[DEBUG CACHE] Botões contextuais encontrados:', buttons.length);
            buttons.forEach((btn, idx) => {
                console.log(`[DEBUG CACHE] Botão ${idx + 1}:`, {
                    state: btn.getAttribute('data-state'),
                    text: btn.textContent.trim(),
                    disabled: btn.disabled
                });
            });
        }
        
        return { state, hasActive, isValid };
        
    } catch (error) {
        console.error('[DEBUG CACHE] Erro durante verificação:', error);
        return null;
    }
};

// Função para testar recuperação manual
window.testResumeWorkout = async function() {
    console.log('[TEST RESUME] 🧪 Testando recuperação manual do treino...');
    
    try {
        const state = await TreinoCacheService.getWorkoutState();
        
        if (!state) {
            console.error('[TEST RESUME] ❌ Nenhum estado encontrado no cache');
            return false;
        }
        
        console.log('[TEST RESUME] ✅ Estado encontrado:', state);
        
        // Testar resumeFromCache diretamente
        const result = await window.workoutExecutionManager.resumeFromCache(state);
        
        console.log('[TEST RESUME] Resultado:', result);
        return result;
        
    } catch (error) {
        console.error('[TEST RESUME] ❌ Erro:', error);
        return false;
    }
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