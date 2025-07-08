// Sistema de Analytics e Logs para Treinos
class WorkoutAnalytics {
    constructor() {
        this.EVENTS_KEY = 'workout_analytics_events';
        this.SESSION_KEY = 'workout_analytics_session';
        this.BUFFER_KEY = 'workout_analytics_buffer';
        this.maxEvents = 1000; // Limitar eventos armazenados
        
        // Configurações do buffer
        this.BUFFER_SIZE = 20; // Enviar quando tiver 20 eventos
        this.BUFFER_TIME = 30000; // Ou após 30 segundos
        this.eventBuffer = [];
        this.bufferTimer = null;
        
        // Tipos de eventos
        this.EVENT_TYPES = {
            TREINO_INICIADO: 'treino_iniciado',
            TREINO_PAUSADO: 'treino_pausado',
            TREINO_RETOMADO: 'treino_retomado',
            TREINO_FINALIZADO: 'treino_finalizado',
            TREINO_ABANDONADO: 'treino_abandonado',
            EXERCICIO_INICIADO: 'exercicio_iniciado',
            EXERCICIO_COMPLETADO: 'exercicio_completado',
            SERIE_COMPLETADA: 'serie_completada',
            SERIE_FALHADA: 'serie_falhada',
            DESCANSO_INICIADO: 'descanso_iniciado',
            DESCANSO_PULADO: 'descanso_pulado',
            CACHE_RECUPERADO: 'cache_recuperado',
            ERRO_SINCRONIZACAO: 'erro_sincronizacao'
        };
        
        // Iniciar sessão
        this.startSession();
        
        // Carregar buffer existente do sessionStorage
        this.loadBuffer();
        
        // Configurar flush automático
        this.setupAutoFlush();
    }
    
    /**
     * Inicia uma nova sessão de analytics
     */
    startSession() {
        this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.sessionStart = Date.now();
        
        localStorage.setItem(this.SESSION_KEY, JSON.stringify({
            id: this.sessionId,
            start: this.sessionStart,
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            online: navigator.onLine
        }));
    }
    
    /**
     * Registra um evento
     */
    logEvent(eventType, data = {}) {
        try {
            const event = {
                id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                type: eventType,
                timestamp: new Date().toISOString(),
                sessionId: this.sessionId,
                data: {
                    ...data,
                    online: navigator.onLine,
                    url: window.location.pathname
                }
            };
            
            // Adicionar ao buffer primeiro
            this.eventBuffer.push(event);
            this.saveBuffer();
            
            // Log no console em desenvolvimento
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                console.log('[Analytics]', eventType, data);
            }
            
            // Verificar se deve fazer flush do buffer
            if (this.shouldFlush()) {
                this.flushBuffer();
            }
            
        } catch (error) {
            console.error('[Analytics] Erro ao registrar evento:', error);
        }
    }
    
    /**
     * Logs específicos para treino
     */
    logTreinoIniciado(treino) {
        this.logEvent(this.EVENT_TYPES.TREINO_INICIADO, {
            treinoId: treino.id,
            grupoMuscular: treino.grupo_muscular,
            tipoAtividade: treino.tipo_atividade,
            totalExercicios: treino.exercicios?.length || 0,
            origem: treino.origem || 'normal'
        });
    }
    
    logTreinoPausado(motivo = 'manual') {
        const tempoDecorrido = Date.now() - this.sessionStart;
        this.logEvent(this.EVENT_TYPES.TREINO_PAUSADO, {
            motivo,
            tempoDecorrido,
            exerciciosCompletados: this.getCompletedExercises()
        });
    }
    
    logTreinoRetomado(dadosRecuperados) {
        this.logEvent(this.EVENT_TYPES.TREINO_RETOMADO, {
            exerciciosRecuperados: dadosRecuperados?.execucoes?.length || 0,
            tempoDesdeUltimaSessao: dadosRecuperados?.tempoDecorrido || 0
        });
    }
    
    logTreinoFinalizado(resumo) {
        const tempoTotal = Date.now() - this.sessionStart;
        this.logEvent(this.EVENT_TYPES.TREINO_FINALIZADO, {
            tempoTotal,
            exerciciosCompletados: resumo.exerciciosCompletados,
            seriesCompletadas: resumo.seriesCompletadas,
            pesoTotal: resumo.pesoTotal,
            avaliacaoPostWorkout: resumo.avaliacaoPostWorkout
        });
    }
    
    logSerieCompletada(serie) {
        this.logEvent(this.EVENT_TYPES.SERIE_COMPLETADA, {
            exercicioId: serie.exercicio_id,
            serieNumero: serie.serie_numero,
            peso: serie.peso_utilizado,
            repeticoes: serie.repeticoes_realizadas,
            tempoDescanso: serie.tempo_descanso
        });
    }
    
    logDescansoIniciado(tempo) {
        this.logEvent(this.EVENT_TYPES.DESCANSO_INICIADO, {
            tempoDescanso: tempo
        });
    }
    
    logDescansoPulado(tempoRestante) {
        this.logEvent(this.EVENT_TYPES.DESCANSO_PULADO, {
            tempoRestante
        });
    }
    
    logCacheRecuperado(tamanhoCache) {
        this.logEvent(this.EVENT_TYPES.CACHE_RECUPERADO, {
            execucoesRecuperadas: tamanhoCache,
            timestamp: new Date().toISOString()
        });
    }
    
    /**
     * Obtém métricas de aderência
     */
    getAderenceMetrics(dias = 30) {
        const events = this.getEvents();
        const agora = Date.now();
        const periodo = dias * 24 * 60 * 60 * 1000;
        
        // Filtrar eventos do período
        const eventosPeriodo = events.filter(e => {
            const eventTime = new Date(e.timestamp).getTime();
            return (agora - eventTime) <= periodo;
        });
        
        // Calcular métricas
        const metrics = {
            treinosIniciados: 0,
            treinosFinalizados: 0,
            treinosAbandonados: 0,
            taxaConclusao: 0,
            tempoMedioPorTreino: 0,
            diasComTreino: new Set(),
            seriesCompletadas: 0,
            seriesFalhadas: 0
        };
        
        const temposTreino = [];
        
        eventosPeriodo.forEach(event => {
            const dia = new Date(event.timestamp).toDateString();
            
            switch (event.type) {
                case this.EVENT_TYPES.TREINO_INICIADO:
                    metrics.treinosIniciados++;
                    metrics.diasComTreino.add(dia);
                    break;
                    
                case this.EVENT_TYPES.TREINO_FINALIZADO:
                    metrics.treinosFinalizados++;
                    if (event.data.tempoTotal) {
                        temposTreino.push(event.data.tempoTotal);
                    }
                    break;
                    
                case this.EVENT_TYPES.TREINO_ABANDONADO:
                    metrics.treinosAbandonados++;
                    break;
                    
                case this.EVENT_TYPES.SERIE_COMPLETADA:
                    metrics.seriesCompletadas++;
                    break;
                    
                case this.EVENT_TYPES.SERIE_FALHADA:
                    metrics.seriesFalhadas++;
                    break;
            }
        });
        
        // Calcular taxa de conclusão
        if (metrics.treinosIniciados > 0) {
            metrics.taxaConclusao = (metrics.treinosFinalizados / metrics.treinosIniciados) * 100;
        }
        
        // Calcular tempo médio
        if (temposTreino.length > 0) {
            const soma = temposTreino.reduce((a, b) => a + b, 0);
            metrics.tempoMedioPorTreino = Math.round(soma / temposTreino.length / 60000); // em minutos
        }
        
        metrics.diasComTreino = metrics.diasComTreino.size;
        
        return metrics;
    }
    
    /**
     * Obtém eventos para debug
     */
    getRecentEvents(limit = 50) {
        const events = this.getEvents();
        return events.slice(-limit);
    }
    
    /**
     * Helpers privados
     */
    getEvents() {
        try {
            const data = localStorage.getItem(this.EVENTS_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('[Analytics] Erro ao obter eventos:', error);
            return [];
        }
    }
    
    saveEvents(events) {
        try {
            localStorage.setItem(this.EVENTS_KEY, JSON.stringify(events));
        } catch (error) {
            console.error('[Analytics] Erro ao salvar eventos:', error);
        }
    }
    
    getCompletedExercises() {
        // Implementar conforme estrutura do AppState
        return window.AppState?.get('completedExercises')?.length || 0;
    }
    
    /**
     * Carrega buffer do sessionStorage
     */
    loadBuffer() {
        try {
            const data = sessionStorage.getItem(this.BUFFER_KEY);
            this.eventBuffer = data ? JSON.parse(data) : [];
            console.log(`[Analytics] Buffer carregado com ${this.eventBuffer.length} eventos`);
        } catch (error) {
            console.error('[Analytics] Erro ao carregar buffer:', error);
            this.eventBuffer = [];
        }
    }
    
    /**
     * Salva buffer no sessionStorage
     */
    saveBuffer() {
        try {
            sessionStorage.setItem(this.BUFFER_KEY, JSON.stringify(this.eventBuffer));
        } catch (error) {
            console.error('[Analytics] Erro ao salvar buffer:', error);
        }
    }
    
    /**
     * Verifica se deve fazer flush do buffer
     */
    shouldFlush() {
        return this.eventBuffer.length >= this.BUFFER_SIZE || !navigator.onLine;
    }
    
    /**
     * Configura flush automático do buffer
     */
    setupAutoFlush() {
        // Limpar timer anterior se existir
        if (this.bufferTimer) {
            clearInterval(this.bufferTimer);
        }
        
        // Configurar novo timer
        this.bufferTimer = setInterval(() => {
            if (this.eventBuffer.length > 0) {
                console.log('[Analytics] Flush automático do buffer');
                this.flushBuffer();
            }
        }, this.BUFFER_TIME);
        
        // Flush ao fechar a página
        window.addEventListener('beforeunload', () => {
            this.flushBuffer(true); // Force flush
        });
    }
    
    /**
     * Faz flush do buffer de eventos
     */
    async flushBuffer(force = false) {
        if (this.eventBuffer.length === 0) return;
        
        console.log(`[Analytics] Flush do buffer com ${this.eventBuffer.length} eventos`);
        
        // Se online, enviar para servidor
        if (navigator.onLine) {
            try {
                await this.sendBatchToServer(this.eventBuffer);
                
                // Adicionar ao storage local também
                const events = this.getEvents();
                events.push(...this.eventBuffer);
                
                // Limitar tamanho do histórico
                if (events.length > this.maxEvents) {
                    events.splice(0, events.length - this.maxEvents);
                }
                
                this.saveEvents(events);
                
                // Limpar buffer após sucesso
                this.eventBuffer = [];
                this.saveBuffer();
                
            } catch (error) {
                console.error('[Analytics] Erro ao enviar batch:', error);
                
                // Se falhar e não for force, manter no buffer
                if (!force) {
                    return;
                }
                
                // Se for force ou offline, adicionar ao offlineSync
                this.addToOfflineSync();
            }
        } else {
            // Se offline, adicionar à fila de sincronização
            this.addToOfflineSync();
        }
    }
    
    /**
     * Adiciona eventos à fila de sincronização offline
     */
    addToOfflineSync() {
        // offlineSyncService removido - apenas salvar localmente
        console.log('[Analytics] Salvando eventos offline localmente');
        
        // Adicionar ao storage local
        const events = this.getEvents();
        events.push(...this.eventBuffer);
        
        if (events.length > this.maxEvents) {
            events.splice(0, events.length - this.maxEvents);
        }
        
        this.saveEvents(events);
        
        // Limpar buffer
        this.eventBuffer = [];
        this.saveBuffer();
    }
    
    /**
     * Envia batch de eventos para servidor
     */
    async sendBatchToServer(events) {
        // Implementar envio para servidor de analytics
        // Por enquanto, simular com log
        console.log('[Analytics] Simulando envio de batch:', {
            eventos: events.length,
            sessao: this.sessionId,
            timestamp: new Date().toISOString()
        });
        
        // TODO: Implementar chamada real para API
        // return fetch('/api/analytics/batch', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ events, sessionId: this.sessionId })
        // });
    }
    
    async sendToServer(event) {
        // Método deprecado - usar flushBuffer ao invés
        console.warn('[Analytics] sendToServer está deprecado, use flushBuffer');
    }
    
    /**
     * Limpa dados antigos
     */
    cleanup(diasParaManter = 90) {
        const events = this.getEvents();
        const agora = Date.now();
        const periodo = diasParaManter * 24 * 60 * 60 * 1000;
        
        const eventosRecentes = events.filter(e => {
            const eventTime = new Date(e.timestamp).getTime();
            return (agora - eventTime) <= periodo;
        });
        
        this.saveEvents(eventosRecentes);
        
        console.log('[Analytics] Limpeza concluída:', {
            antes: events.length,
            depois: eventosRecentes.length,
            removidos: events.length - eventosRecentes.length
        });
    }
    
    /**
     * Obtém status do buffer
     */
    getBufferStatus() {
        return {
            eventos: this.eventBuffer.length,
            tamanho: JSON.stringify(this.eventBuffer).length,
            proximo_flush: this.eventBuffer.length >= this.BUFFER_SIZE ? 'iminente' : 
                          this.eventBuffer.length > 0 ? `em ${Math.ceil((this.BUFFER_TIME - (Date.now() % this.BUFFER_TIME)) / 1000)}s` : 
                          'sem eventos',
            online: navigator.onLine
        };
    }
    
    /**
     * Força flush manual do buffer (para debug)
     */
    forceFlush() {
        console.log('[Analytics] Flush manual forçado');
        return this.flushBuffer(true);
    }
}

// Exportar instância única
export const workoutAnalytics = new WorkoutAnalytics();

// Expor globalmente para debug
window.workoutAnalytics = workoutAnalytics;

export default WorkoutAnalytics;