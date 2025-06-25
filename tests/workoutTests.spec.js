// Testes Unitários para Funcionalidades de Treino
import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { workoutStateManager } from '../services/workoutStateManager.js';
import { offlineSyncService } from '../services/offlineSyncService.js';

describe('WorkoutStateManager', () => {
    beforeEach(() => {
        // Limpar localStorage antes de cada teste
        localStorage.clear();
        jest.clearAllMocks();
    });
    
    describe('coletarTodasExecucoes', () => {
        test('deve coletar execuções do cache corretamente', () => {
            const execucoes = [
                {
                    exercicio_id: 'ex1',
                    serie_numero: 1,
                    peso_utilizado: 50,
                    repeticoes_realizadas: 12
                },
                {
                    exercicio_id: 'ex1',
                    serie_numero: 2,
                    peso_utilizado: 50,
                    repeticoes_realizadas: 10
                }
            ];
            
            // Simular estado
            const state = {
                execucoes,
                estadoAtual: { currentExerciseIndex: 0 },
                timestamp: Date.now()
            };
            
            workoutStateManager.saveStateImmediate(state);
            const recuperado = workoutStateManager.recuperarEstadoCompleto();
            
            expect(recuperado.execucoes).toHaveLength(2);
            expect(recuperado.execucoes[0].exercicio_id).toBe('ex1');
            expect(recuperado.execucoes[1].serie_numero).toBe(2);
        });
        
        test('deve retornar array vazio se não houver execuções', () => {
            const state = {
                execucoes: [],
                estadoAtual: {},
                timestamp: Date.now()
            };
            
            workoutStateManager.saveStateImmediate(state);
            const recuperado = workoutStateManager.recuperarEstadoCompleto();
            
            expect(recuperado.execucoes).toHaveLength(0);
        });
    });
    
    describe('cálculo de tempo de descanso', () => {
        test('deve calcular média de tempo de descanso corretamente', () => {
            const execucoes = [
                { tempo_descanso: 60 },
                { tempo_descanso: 90 },
                { tempo_descanso: 60 },
                { tempo_descanso: 0 }, // Deve ser ignorado
                { tempo_descanso: null } // Deve ser ignorado
            ];
            
            const temposValidos = execucoes
                .filter(e => e.tempo_descanso && e.tempo_descanso > 0)
                .map(e => e.tempo_descanso);
            
            const media = temposValidos.reduce((a, b) => a + b, 0) / temposValidos.length;
            
            expect(temposValidos).toHaveLength(3);
            expect(media).toBe(70); // (60 + 90 + 60) / 3
        });
        
        test('deve usar tempo padrão se não houver histórico', () => {
            const execucoes = [];
            const tempoPadrao = 60;
            
            const temposValidos = execucoes
                .filter(e => e.tempo_descanso && e.tempo_descanso > 0)
                .map(e => e.tempo_descanso);
            
            const tempoFinal = temposValidos.length > 0 
                ? temposValidos.reduce((a, b) => a + b, 0) / temposValidos.length
                : tempoPadrao;
            
            expect(tempoFinal).toBe(60);
        });
    });
    
    describe('validação de expiração', () => {
        test('deve considerar estado expirado após 24h', () => {
            const timestampAntigo = Date.now() - (25 * 60 * 60 * 1000); // 25 horas atrás
            const isExpired = workoutStateManager.isExpired(timestampAntigo);
            
            expect(isExpired).toBe(true);
        });
        
        test('deve considerar estado válido dentro de 24h', () => {
            const timestampRecente = Date.now() - (23 * 60 * 60 * 1000); // 23 horas atrás
            const isExpired = workoutStateManager.isExpired(timestampRecente);
            
            expect(isExpired).toBe(false);
        });
    });
    
    describe('throttle de salvamento', () => {
        jest.useFakeTimers();
        
        test('deve atrasar salvamento com throttle', () => {
            const spy = jest.spyOn(workoutStateManager, 'saveStateImmediate');
            
            // Múltiplas chamadas rápidas
            workoutStateManager.saveStateThrottled({ test: 1 });
            workoutStateManager.saveStateThrottled({ test: 2 });
            workoutStateManager.saveStateThrottled({ test: 3 });
            
            // Não deve ter salvado ainda
            expect(spy).not.toHaveBeenCalled();
            
            // Avançar tempo
            jest.advanceTimersByTime(5000);
            
            // Deve ter salvado apenas uma vez com último estado
            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy).toHaveBeenCalledWith({ test: 3 });
        });
        
        jest.useRealTimers();
    });
});

describe('OfflineSyncService', () => {
    beforeEach(() => {
        localStorage.clear();
        offlineSyncService.clearSyncQueue();
    });
    
    test('deve adicionar dados à fila quando offline', async () => {
        // Simular offline
        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            value: false
        });
        offlineSyncService.isOnline = false;
        
        const dados = [
            { exercicio_id: 'ex1', peso: 50 }
        ];
        
        await offlineSyncService.addToSyncQueue(dados, 'execucoes');
        
        const status = offlineSyncService.getSyncStatus();
        expect(status.pendingCount).toBe(1);
        expect(status.hasPendingSync).toBe(true);
    });
    
    test('deve processar fila quando voltar online', async () => {
        // Adicionar item offline
        offlineSyncService.isOnline = false;
        await offlineSyncService.addToSyncQueue({ test: true }, 'execucoes');
        
        // Simular volta online
        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            value: true
        });
        offlineSyncService.isOnline = true;
        
        // Mock da função de sync
        const syncSpy = jest.spyOn(offlineSyncService, 'syncExecucoes')
            .mockResolvedValue(true);
        
        await offlineSyncService.processPendingSync();
        
        expect(syncSpy).toHaveBeenCalled();
        
        const status = offlineSyncService.getSyncStatus();
        expect(status.pendingCount).toBe(0);
    });
});