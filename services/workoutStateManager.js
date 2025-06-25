// Gerenciador de Estado de Treino com Persistência Otimizada
import TreinoCacheService from './treinoCacheService.js';
import { storageMonitor } from './storageMonitor.js';
import { tabSyncService } from './tabSyncService.js';

class WorkoutStateManager {
    constructor() {
        this.CACHE_KEYS = {
            EXECUCOES: 'treino_execucoes_temp',
            ESTADO: 'treino_estado_temp',
            CRONOMETRO: 'treino_tempo_temp',
            UNIFIED: 'treino_unified_state'
        };
        
        this.EXPIRATION_TIME = 24 * 60 * 60 * 1000; // 24 horas
        this.THROTTLE_DELAY = 5000; // 5 segundos
        
        this.throttleTimer = null;
        this.pendingState = null;
        this.lastSaveTime = 0;
        
        // Configurar listeners automaticamente
        this.setupEventListeners();
    }
    
    /**
     * Configura listeners para salvar estado automaticamente
     */
    setupEventListeners() {
        // Salvar antes de sair da página
        window.addEventListener('beforeunload', (e) => {
            this.saveStateImmediate();
            // Se há mudanças não salvas, avisar o usuário
            if (this.hasPendingChanges()) {
                e.preventDefault();
                e.returnValue = 'Você tem um treino em andamento. Deseja realmente sair?';
            }
        });
        
        // Salvar quando a página perde visibilidade
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.saveStateImmediate();
            }
        });
        
        // Salvar periodicamente (backup a cada 30 segundos)
        setInterval(() => {
            if (this.hasPendingChanges()) {
                this.saveStateThrottled();
            }
        }, 30000);
        
        console.log('[WorkoutStateManager] Event listeners configurados');
    }
    
    /**
     * Verifica se há um treino em andamento
     */
    async verificarTreinoEmAndamento() {
        try {
            const estado = this.recuperarEstadoCompleto();
            
            if (!estado) {
                return null;
            }
            
            // Verificar expiração
            if (this.isExpired(estado.timestamp)) {
                console.log('[WorkoutStateManager] Estado expirado, limpando cache');
                this.limparTudo();
                return null;
            }
            
            // Verificar integridade
            if (!this.validateState(estado)) {
                console.warn('[WorkoutStateManager] Estado inválido encontrado - limpando cache');
                // Limpar estado inválido para evitar problemas futuros
                this.limparTudo();
                return null;
            }
            
            // Verificação adicional: se tem menos de 1 execução, considerar como não iniciado
            const numExecucoes = estado.execucoes?.length || 0;
            if (numExecucoes === 0) {
                console.log('[WorkoutStateManager] Estado sem execuções reais - limpando');
                this.limparTudo();
                return null;
            }
            
            console.log('[WorkoutStateManager] Treino válido em andamento encontrado:', {
                exerciciosExecutados: numExecucoes,
                ultimaAtividade: new Date(estado.timestamp).toLocaleString(),
                exercicioAtual: estado.estadoAtual?.currentExerciseIndex || 0
            });
            
            return estado;
            
        } catch (error) {
            console.error('[WorkoutStateManager] Erro ao verificar treino:', error);
            return null;
        }
    }
    
    /**
     * Salva estado do treino com throttle
     */
    saveStateThrottled(state) {
        // Atualizar estado pendente
        this.pendingState = state || this.getCurrentState();
        
        // Cancelar timer anterior se existir
        if (this.throttleTimer) {
            clearTimeout(this.throttleTimer);
        }
        
        // Agendar novo salvamento
        this.throttleTimer = setTimeout(() => {
            this.saveStateImmediate(this.pendingState);
            this.pendingState = null;
        }, this.THROTTLE_DELAY);
    }
    
    /**
     * Salva estado imediatamente (sem throttle)
     */
    saveStateImmediate(state) {
        try {
            const stateToSave = state || this.getCurrentState();
            
            if (!stateToSave) {
                console.warn('[WorkoutStateManager] Nenhum estado para salvar');
                return false;
            }
            
            // Verificar se tem conteúdo real antes de salvar
            const hasRealContent = stateToSave.execucoes && stateToSave.execucoes.length > 0;
            if (!hasRealContent) {
                console.log('[WorkoutStateManager] Ignorando salvamento - sem execuções reais');
                return false;
            }
            
            // Adicionar timestamp
            stateToSave.timestamp = Date.now();
            stateToSave.lastSaveTime = new Date().toISOString();
            
            // Salvar estado unificado
            localStorage.setItem(this.CACHE_KEYS.UNIFIED, JSON.stringify(stateToSave));
            
            // Manter compatibilidade com sistema antigo
            if (stateToSave.execucoes) {
                localStorage.setItem(this.CACHE_KEYS.EXECUCOES, JSON.stringify(stateToSave.execucoes));
            }
            if (stateToSave.estadoAtual) {
                localStorage.setItem(this.CACHE_KEYS.ESTADO, JSON.stringify(stateToSave.estadoAtual));
            }
            if (stateToSave.cronometro) {
                localStorage.setItem(this.CACHE_KEYS.CRONOMETRO, JSON.stringify(stateToSave.cronometro));
            }
            
            this.lastSaveTime = Date.now();
            console.log('[WorkoutStateManager] Estado salvo:', {
                execucoes: stateToSave.execucoes?.length || 0,
                timestamp: new Date(stateToSave.timestamp).toLocaleString()
            });
            
            // Notificar outras abas sobre mudança de estado
            if (tabSyncService && tabSyncService.isMaster) {
                tabSyncService.notifyAction('STATE_SAVED', {
                    timestamp: stateToSave.timestamp,
                    execucoesCount: stateToSave.execucoes?.length || 0
                });
            }
            
            // Verificar uso de storage após salvar
            const storageStatus = storageMonitor.checkStorageQuota();
            
            // Se storage está crítico, tentar limpar dados antigos
            if (storageStatus && storageStatus.status === 'critical') {
                console.warn('[WorkoutStateManager] Storage crítico detectado, iniciando limpeza...');
                const cleanedCount = storageMonitor.attemptCleanup();
                if (cleanedCount > 0) {
                    console.log(`[WorkoutStateManager] ${cleanedCount} itens antigos removidos`);
                }
            }
            
            return true;
            
        } catch (error) {
            console.error('[WorkoutStateManager] Erro ao salvar estado:', error);
            return false;
        }
    }
    
    /**
     * Recupera o estado atual do AppState
     */
    getCurrentState() {
        if (!window.AppState) {
            return null;
        }
        
        return {
            execucoes: window.AppState.get('execucoesCache') || [],
            estadoAtual: {
                currentExerciseIndex: window.AppState.get('currentExerciseIndex') || 0,
                completedSeries: window.AppState.get('completedSeries') || 0,
                currentWorkout: window.AppState.get('currentWorkout'),
                currentExercises: window.AppState.get('currentExercises'),
                currentUser: window.AppState.get('currentUser')
            },
            cronometro: {
                restTime: window.AppState.get('restTime'),
                restTimerInterval: !!window.AppState.get('restTimerInterval'),
                // Garantir que workoutStartTime seja sempre um número
                workoutStartTime: Number(window.AppState.get('workoutStartTime')) || null
            }
        };
    }
    
    /**
     * Recupera estado completo do cache
     */
    recuperarEstadoCompleto() {
        try {
            // Tentar recuperar estado unificado primeiro
            const unifiedState = localStorage.getItem(this.CACHE_KEYS.UNIFIED);
            if (unifiedState) {
                return JSON.parse(unifiedState);
            }
            
            // Fallback: montar estado a partir de caches individuais
            const execucoes = localStorage.getItem(this.CACHE_KEYS.EXECUCOES);
            const estado = localStorage.getItem(this.CACHE_KEYS.ESTADO);
            const cronometro = localStorage.getItem(this.CACHE_KEYS.CRONOMETRO);
            
            if (!execucoes && !estado) {
                return null;
            }
            
            return {
                execucoes: execucoes ? JSON.parse(execucoes) : [],
                estadoAtual: estado ? JSON.parse(estado) : {},
                cronometro: cronometro ? JSON.parse(cronometro) : {},
                timestamp: Date.now() // Assumir timestamp atual para compatibilidade
            };
            
        } catch (error) {
            console.error('[WorkoutStateManager] Erro ao recuperar estado:', error);
            return null;
        }
    }
    
    /**
     * Restaura estado no AppState
     */
    restaurarEstado(estado) {
        if (!window.AppState || !estado) {
            return false;
        }
        
        try {
            // Restaurar execuções
            if (estado.execucoes) {
                window.AppState.set('execucoesCache', estado.execucoes);
            }
            
            // Restaurar estado do treino
            if (estado.estadoAtual) {
                const { estadoAtual } = estado;
                if (estadoAtual.currentExerciseIndex !== undefined) {
                    window.AppState.set('currentExerciseIndex', estadoAtual.currentExerciseIndex);
                }
                if (estadoAtual.completedSeries !== undefined) {
                    window.AppState.set('completedSeries', estadoAtual.completedSeries);
                }
                if (estadoAtual.currentWorkout) {
                    window.AppState.set('currentWorkout', estadoAtual.currentWorkout);
                }
                if (estadoAtual.currentExercises) {
                    window.AppState.set('currentExercises', estadoAtual.currentExercises);
                }
                if (estadoAtual.currentUser) {
                    window.AppState.set('currentUser', estadoAtual.currentUser);
                }
            }
            
            // Restaurar cronômetro
            if (estado.cronometro) {
                const { cronometro } = estado;
                console.log('[WorkoutStateManager] Restaurando cronometro:', cronometro);
                
                if (cronometro.workoutStartTime) {
                    // Garantir que seja um número válido
                    const startTime = Number(cronometro.workoutStartTime);
                    if (!isNaN(startTime) && startTime > 0) {
                        window.AppState.set('workoutStartTime', startTime);
                        console.log('[WorkoutStateManager] workoutStartTime restaurado:', startTime);
                    } else {
                        console.warn('[WorkoutStateManager] workoutStartTime inválido:', cronometro.workoutStartTime);
                    }
                }
                if (cronometro.restTime !== undefined) {
                    window.AppState.set('restTime', cronometro.restTime);
                }
            }
            
            console.log('[WorkoutStateManager] Estado restaurado com sucesso');
            return true;
            
        } catch (error) {
            console.error('[WorkoutStateManager] Erro ao restaurar estado:', error);
            return false;
        }
    }
    
    /**
     * Verifica se o estado está expirado
     */
    isExpired(timestamp) {
        if (!timestamp) return true;
        return (Date.now() - timestamp) > this.EXPIRATION_TIME;
    }
    
    /**
     * Valida integridade do estado
     */
    validateState(state) {
        if (!state || typeof state !== 'object') {
            return false;
        }
        
        // Para ser considerado válido, DEVE ter execuções reais
        // Apenas ter estado sem execuções não é suficiente
        const hasExecutions = state.execucoes && state.execucoes.length > 0;
        
        // Se não tem execuções, não é um treino válido em andamento
        if (!hasExecutions) {
            console.log('[WorkoutStateManager] Estado sem execuções - considerado inválido');
            return false;
        }
        
        // Verificar se tem dados mínimos necessários
        const hasValidState = state.estadoAtual && 
                            typeof state.estadoAtual === 'object' &&
                            state.estadoAtual.currentWorkout;
        
        return hasExecutions && hasValidState;
    }
    
    /**
     * Verifica se há mudanças pendentes
     */
    hasPendingChanges() {
        const currentState = this.getCurrentState();
        return currentState && 
               currentState.execucoes && 
               currentState.execucoes.length > 0;
    }
    
    /**
     * Limpa todo o cache
     */
    limparTudo() {
        Object.values(this.CACHE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        
        // Cancelar timer pendente
        if (this.throttleTimer) {
            clearTimeout(this.throttleTimer);
            this.throttleTimer = null;
        }
        
        this.pendingState = null;
        console.log('[WorkoutStateManager] Cache limpo');
    }
    
    /**
     * Salva estado quando série é confirmada
     */
    onSerieConfirmada(dadosSerie) {
        console.log('[WorkoutStateManager] Série confirmada, salvando estado');
        this.saveStateThrottled();
    }
    
    /**
     * Salva estado quando muda de exercício
     */
    onExercicioMudou(novoIndex) {
        console.log('[WorkoutStateManager] Exercício mudou, salvando estado imediatamente');
        this.saveStateImmediate();
    }
    
    /**
     * Salva estado quando cronômetro inicia
     */
    onCronometroIniciado(tempoDescanso) {
        const state = this.getCurrentState();
        if (state && state.cronometro) {
            state.cronometro.restTime = tempoDescanso;
            state.cronometro.restStartTime = Date.now();
        }
        this.saveStateThrottled(state);
    }
    
    /**
     * Debug do estado atual
     */
    debug() {
        const estado = this.recuperarEstadoCompleto();
        const isExpired = estado ? this.isExpired(estado.timestamp) : null;
        const isValid = estado ? this.validateState(estado) : false;
        
        console.log('[WorkoutStateManager] Debug:', {
            estado,
            isExpired,
            isValid,
            hasPendingChanges: this.hasPendingChanges(),
            lastSaveTime: this.lastSaveTime ? new Date(this.lastSaveTime).toLocaleString() : 'Nunca'
        });
        
        return { estado, isExpired, isValid };
    }
}

// Exportar instância única
export const workoutStateManager = new WorkoutStateManager();

// Expor globalmente para debug
window.workoutStateManager = workoutStateManager;

export default WorkoutStateManager;