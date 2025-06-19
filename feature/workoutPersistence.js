// workoutPersistence.js - Sistema Avançado de Persistência de Treinos

export class WorkoutPersistence {
    constructor() {
        this.STATE_KEY = 'workoutSession_v2';
    }

    // Métodos simples de cache usando localStorage diretamente
    async _saveToCache(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error('[WorkoutPersistence] Erro ao salvar cache:', error);
            throw error;
        }
    }

    async _getFromCache(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('[WorkoutPersistence] Erro ao ler cache:', error);
            return null;
        }
    }

    async _clearFromCache(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('[WorkoutPersistence] Erro ao limpar cache:', error);
        }
    }

    /**
     * Salva o estado completo do treino
     * @param {Object} state - Estado atual do workoutExecutionManager
     * @param {Boolean} isPartial - Se é um salvamento parcial (durante o treino)
     */
    async saveState(state, isPartial = false) {
        const stateToSave = {
            ...state,
            metadata: {
                savedAt: new Date().toISOString(),
                isPartial,
                appVersion: '2.0'
            }
        };

        await this._saveToCache(this.STATE_KEY, stateToSave);
        
        if (!isPartial) {
            // Sessão finalizada: delega a syncService
            try {
                const { workoutSyncService } = await import('../services/workoutSyncService.js');
                workoutSyncService.trySendOrQueue(stateToSave);
            } catch (e) {
                console.error('[WorkoutPersistence] Falha ao importar workoutSyncService', e);
            }
        }
    }

    /**
     * Restaura o estado salvo do treino
     * @returns {Promise<Object|null>} Estado recuperado ou null
     */
    async restoreState() {
        const state = await this._getFromCache(this.STATE_KEY);
        if (!state) return null;

        // Valida integridade do estado
        if (this.validateState(state)) {
            return state;
        }
        
        return null;
    }

    /**
     * Sincroniza com o servidor em background
     */
    async syncWithServer(state) {
        try {
            const result = await fetch('/api/sync-workout', {
                method: 'POST',
                body: JSON.stringify(state)
            });
            
            if (result.ok) {
                await this._clearFromCache(this.STATE_KEY);
            }
        } catch (error) {
            console.error('Falha na sincronização:', error);
        }
    }

    /**
     * Limpa o estado salvo (quando treino é finalizado ou cancelado)
     */
    async clearState() {
        try {
            await this._clearFromCache(this.STATE_KEY);
            console.log('[WorkoutPersistence] Estado limpo');
        } catch (error) {
            console.error('[WorkoutPersistence] Erro ao limpar estado:', error);
        }
    }

    // === MÉTODOS DE DEPURAÇÃO ===
    /**
     * Retorna o estado salvo bruto no localStorage para fins de diagnóstico.
     * Útil para verificar se o estado está sendo persistido corretamente.
     * @returns {Object|null}
     */
    debugState() {
        try {
            const raw = localStorage.getItem(this.STATE_KEY);
            if (!raw) {
                console.info('[WorkoutPersistence] Nenhum estado salvo encontrado');
                return null;
            }
            return JSON.parse(raw);
        } catch (e) {
            console.error('[WorkoutPersistence] Erro ao fazer parse do estado salvo:', e);
            return null;
        }
    }

    // Validação do estado recuperado
    validateState(state) {
        const requiredKeys = ['currentWorkout', 'exerciciosExecutados'];
        return requiredKeys.every(key => state[key] !== undefined);
    }
}

// Exporta instância singleton
export const workoutPersistence = new WorkoutPersistence();

// Função global para debug rápido no console
window.debugWorkoutState = () => {
    console.log('[GLOBAL] Estado de treino salvo:', workoutPersistence.debugState());
    return workoutPersistence.debugState();
};
