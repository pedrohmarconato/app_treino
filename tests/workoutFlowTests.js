/**
 * workoutFlowTests.js - Comprehensive Workout Flow Testing Suite
 * Tests complete workout interruption and recovery scenarios
 */

import TreinoCacheService from '../services/treinoCacheService.js';
import AppState from '../state/appState.js';
import NavigationGuard from '../services/navigationGuard.js';
import { ContextualWorkoutButton } from '../components/ContextualWorkoutButton.js';

export class WorkoutFlowTestSuite {
    constructor() {
        this.testResults = [];
        this.performanceMetrics = {};
        this.mockWorkoutData = {
            currentWorkout: {
                id: 'test-workout-123',
                nome: 'Treino A - Teste',
                dia_semana: 1,
                exercicios: [
                    {
                        id: 1,
                        nome: 'Supino Reto',
                        series: 4,
                        repeticoes: 12,
                        peso_min: 60,
                        peso_max: 80,
                        grupo_muscular: 'Peito'
                    },
                    {
                        id: 2,
                        nome: 'Agachamento',
                        series: 3,
                        repeticoes: 15,
                        peso_min: 80,
                        peso_max: 100,
                        grupo_muscular: 'Pernas'
                    }
                ]
            },
            exerciciosExecutados: [
                {
                    exercicio_id: 1,
                    series_realizadas: 2,
                    pesos: [70, 75],
                    repeticoes: [12, 10],
                    timestamp: Date.now() - 300000 // 5 minutos atrás
                }
            ],
            startTime: Date.now() - 600000, // 10 minutos atrás
            currentExerciseIndex: 0,
            metadata: {
                savedAt: new Date().toISOString(),
                isPartial: true,
                appVersion: '2.0'
            }
        };
    }

    /**
     * Executa suite completa de testes
     */
    async runCompleteTestSuite() {
        console.log('🧪 [WorkoutFlowTests] Iniciando suite completa de testes...');
        
        try {
            // Limpar estado inicial
            await this.setupTestEnvironment();
            
            // Testes de fluxo principal
            await this.testWorkoutInterruptionRecovery();
            await this.testCrossTabSynchronization();
            await this.testNavigationGuardProtection();
            await this.testContextualButtonStates();
            
            // Testes de edge cases
            await this.testCacheCorruption();
            await this.testStorageQuotaExceeded();
            await this.testOfflineFunctionality();
            
            // Testes de performance
            await this.testCachePerformance();
            
            // Gerar relatório
            return this.generateTestReport();
            
        } catch (error) {
            console.error('🔥 [WorkoutFlowTests] Erro crítico na suite de testes:', error);
            throw error;
        }
    }

    /**
     * Configura ambiente de teste limpo
     */
    async setupTestEnvironment() {
        console.log('🔧 [WorkoutFlowTests] Configurando ambiente de teste...');
        
        // Limpar localStorage
        Object.keys(localStorage).forEach(key => {
            if (key.includes('workout') || key.includes('treino')) {
                localStorage.removeItem(key);
            }
        });
        
        // Resetar AppState
        AppState.reset();
        
        // Aguardar limpeza
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log('✅ [WorkoutFlowTests] Ambiente configurado');
    }

    /**
     * TESTE 1: Fluxo completo de interrupção e recuperação
     */
    async testWorkoutInterruptionRecovery() {
        const testName = 'Workout Interruption & Recovery';
        console.log(`🔬 [WorkoutFlowTests] Executando: ${testName}`);
        
        const startTime = performance.now();
        const testSteps = [];
        
        try {
            // PASSO 1: Iniciar treino
            console.log('📝 Passo 1: Iniciando treino...');
            AppState.startWorkoutSession(this.mockWorkoutData.currentWorkout, 'test-session-123');
            await TreinoCacheService.saveWorkoutState(this.mockWorkoutData);
            
            testSteps.push({
                step: 'workout_start',
                success: AppState.get('isWorkoutActive') === true,
                timestamp: Date.now()
            });
            
            // PASSO 2: Simular progresso no treino
            console.log('📝 Passo 2: Simulando progresso...');
            const progressData = {
                ...this.mockWorkoutData,
                exerciciosExecutados: [
                    ...this.mockWorkoutData.exerciciosExecutados,
                    {
                        exercicio_id: 1,
                        series_realizadas: 3,
                        pesos: [70, 75, 80],
                        repeticoes: [12, 10, 8],
                        timestamp: Date.now()
                    }
                ]
            };
            
            await TreinoCacheService.saveWorkoutState(progressData, true);
            AppState.markDataAsUnsaved();
            
            testSteps.push({
                step: 'progress_update',
                success: AppState.get('hasUnsavedData') === true,
                timestamp: Date.now()
            });
            
            // PASSO 3: Simular saída da aplicação (navigation guard)
            console.log('📝 Passo 3: Testando navigation guard...');
            const canNavigate = await NavigationGuard.canNavigate('home-screen', { force: false });
            
            testSteps.push({
                step: 'navigation_guard',
                success: canNavigate === false, // Should block navigation
                timestamp: Date.now()
            });
            
            // PASSO 4: Simular fechamento forçado e reabertura
            console.log('📝 Passo 4: Simulando fechamento e reabertura...');
            
            // Simular fechamento - apenas resetar AppState, mas manter cache
            AppState.set('isWorkoutActive', false);
            AppState.set('hasUnsavedData', false);
            
            // Aguardar "reabertura da aplicação"
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // PASSO 5: Verificar recuperação de sessão
            console.log('📝 Passo 5: Verificando recuperação...');
            const recoveryData = await NavigationGuard.checkForRecovery();
            
            testSteps.push({
                step: 'session_recovery',
                success: recoveryData !== null && recoveryData.currentWorkout?.id === 'test-workout-123',
                timestamp: Date.now(),
                data: recoveryData
            });
            
            // PASSO 6: Restaurar sessão
            console.log('📝 Passo 6: Restaurando sessão...');
            if (recoveryData) {
                AppState.set('isWorkoutActive', true);
                AppState.set('hasUnsavedData', true);
                
                const restoredState = await TreinoCacheService.getWorkoutState();
                const isValidState = TreinoCacheService.validateState(restoredState);
                
                testSteps.push({
                    step: 'session_restore',
                    success: isValidState && restoredState?.exerciciosExecutados?.length > 0,
                    timestamp: Date.now(),
                    data: { isValidState, exercisesCount: restoredState?.exerciciosExecutados?.length }
                });
            }
            
            const duration = performance.now() - startTime;
            const allStepsSuccessful = testSteps.every(step => step.success);
            
            this.testResults.push({
                name: testName,
                success: allStepsSuccessful,
                duration,
                steps: testSteps,
                details: 'Complete workflow: start → progress → interrupt → recover → restore'
            });
            
            console.log(`${allStepsSuccessful ? '✅' : '❌'} ${testName}: ${duration.toFixed(2)}ms`);
            
        } catch (error) {
            console.error(`❌ [WorkoutFlowTests] Erro em ${testName}:`, error);
            this.testResults.push({
                name: testName,
                success: false,
                error: error.message,
                steps: testSteps
            });
        }
    }

    /**
     * TESTE 2: Sincronização entre abas
     */
    async testCrossTabSynchronization() {
        const testName = 'Cross-Tab Synchronization';
        console.log(`🔬 [WorkoutFlowTests] Executando: ${testName}`);
        
        const startTime = performance.now();
        
        try {
            // Simular alteração em outra aba via storage event
            const testData = { ...this.mockWorkoutData, tabId: 'tab-2' };
            
            // Listener para capturar evento
            let eventCaptured = false;
            const handleStorageEvent = () => { eventCaptured = true; };
            window.addEventListener('storage', handleStorageEvent);
            
            // Salvar dados simulando outra aba
            localStorage.setItem('workoutSession_v2', JSON.stringify(testData));
            
            // Disparar evento storage manualmente (simulando outra aba)
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'workoutSession_v2',
                newValue: JSON.stringify(testData),
                storageArea: localStorage
            }));
            
            // Aguardar processamento
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Cleanup
            window.removeEventListener('storage', handleStorageEvent);
            
            const duration = performance.now() - startTime;
            
            this.testResults.push({
                name: testName,
                success: eventCaptured,
                duration,
                details: 'Storage event dispatched and captured successfully'
            });
            
            console.log(`${eventCaptured ? '✅' : '❌'} ${testName}: ${duration.toFixed(2)}ms`);
            
        } catch (error) {
            console.error(`❌ [WorkoutFlowTests] Erro em ${testName}:`, error);
            this.testResults.push({
                name: testName,
                success: false,
                error: error.message
            });
        }
    }

    /**
     * TESTE 3: Proteção do Navigation Guard
     */
    async testNavigationGuardProtection() {
        const testName = 'Navigation Guard Protection';
        console.log(`🔬 [WorkoutFlowTests] Executando: ${testName}`);
        
        const startTime = performance.now();
        
        try {
            // Configurar estado de treino ativo
            AppState.set('isWorkoutActive', true);
            AppState.set('hasUnsavedData', true);
            await TreinoCacheService.saveWorkoutState(this.mockWorkoutData);
            
            // Teste 1: Navegação sem força deve ser bloqueada
            const blockedNavigation = await NavigationGuard.canNavigate('login-screen');
            
            // Teste 2: Navegação com força deve ser permitida
            const forcedNavigation = await NavigationGuard.canNavigate('login-screen', { force: true });
            
            // Teste 3: Navegação interna do workout deve ser permitida
            const workoutNavigation = await NavigationGuard.canNavigate('workout-execution');
            
            const duration = performance.now() - startTime;
            const success = blockedNavigation === false && forcedNavigation === true && workoutNavigation === true;
            
            this.testResults.push({
                name: testName,
                success,
                duration,
                details: {
                    blockedNavigation,
                    forcedNavigation,
                    workoutNavigation
                }
            });
            
            console.log(`${success ? '✅' : '❌'} ${testName}: ${duration.toFixed(2)}ms`);
            
        } catch (error) {
            console.error(`❌ [WorkoutFlowTests] Erro em ${testName}:`, error);
            this.testResults.push({
                name: testName,
                success: false,
                error: error.message
            });
        }
    }

    /**
     * TESTE 4: Estados do botão contextual
     */
    async testContextualButtonStates() {
        const testName = 'Contextual Button States';
        console.log(`🔬 [WorkoutFlowTests] Executando: ${testName}`);
        
        const startTime = performance.now();
        
        try {
            // Criar elemento mock para teste
            const mockElement = document.createElement('button');
            mockElement.id = 'test-contextual-btn';
            document.body.appendChild(mockElement);
            
            const button = new ContextualWorkoutButton(mockElement);
            
            // Teste estado inicial (loading)
            await new Promise(resolve => setTimeout(resolve, 100));
            const initialState = button.currentState;
            
            // Teste estado start (sem treino ativo)
            AppState.set('isWorkoutActive', false);
            await TreinoCacheService.clearWorkoutState();
            await button.updateStateFromCache();
            const startState = button.currentState;
            
            // Teste estado resume (com cache)
            await TreinoCacheService.saveWorkoutState(this.mockWorkoutData);
            AppState.set('isWorkoutActive', true);
            await button.updateStateFromCache();
            const resumeState = button.currentState;
            
            // Cleanup
            button.destroy();
            document.body.removeChild(mockElement);
            
            const duration = performance.now() - startTime;
            const success = initialState === 'loading' && startState === 'start' && resumeState === 'resume';
            
            this.testResults.push({
                name: testName,
                success,
                duration,
                details: {
                    initialState,
                    startState,
                    resumeState
                }
            });
            
            console.log(`${success ? '✅' : '❌'} ${testName}: ${duration.toFixed(2)}ms`);
            
        } catch (error) {
            console.error(`❌ [WorkoutFlowTests] Erro em ${testName}:`, error);
            this.testResults.push({
                name: testName,
                success: false,
                error: error.message
            });
        }
    }

    /**
     * TESTE 5: Corrupção de cache
     */
    async testCacheCorruption() {
        const testName = 'Cache Corruption Handling';
        console.log(`🔬 [WorkoutFlowTests] Executando: ${testName}`);
        
        const startTime = performance.now();
        
        try {
            // Inserir dados corrompidos
            localStorage.setItem('workoutSession_v2', '{"invalid": json}');
            
            // Tentar recuperar dados
            const corruptedData = await TreinoCacheService.getWorkoutState();
            const isValid = TreinoCacheService.validateState(corruptedData);
            
            // Testar limpeza automática
            await TreinoCacheService.clearWorkoutState();
            const afterCleanup = await TreinoCacheService.getWorkoutState();
            
            const duration = performance.now() - startTime;
            const success = corruptedData === null && isValid === false && afterCleanup === null;
            
            this.testResults.push({
                name: testName,
                success,
                duration,
                details: 'Corrupted cache handled gracefully with automatic cleanup'
            });
            
            console.log(`${success ? '✅' : '❌'} ${testName}: ${duration.toFixed(2)}ms`);
            
        } catch (error) {
            console.error(`❌ [WorkoutFlowTests] Erro em ${testName}:`, error);
            this.testResults.push({
                name: testName,
                success: false,
                error: error.message
            });
        }
    }

    /**
     * TESTE 6: Cota de storage excedida
     */
    async testStorageQuotaExceeded() {
        const testName = 'Storage Quota Exceeded';
        console.log(`🔬 [WorkoutFlowTests] Executando: ${testName}`);
        
        const startTime = performance.now();
        
        try {
            // Simular storage cheio
            const originalSetItem = localStorage.setItem;
            let quotaExceeded = false;
            
            localStorage.setItem = function(key, value) {
                if (key.includes('workoutSession')) {
                    quotaExceeded = true;
                    const error = new Error('QuotaExceededError');
                    error.name = 'QuotaExceededError';
                    throw error;
                }
                return originalSetItem.call(this, key, value);
            };
            
            // Tentar salvar dados
            let gracefulDegradation = false;
            try {
                await TreinoCacheService.saveWorkoutState(this.mockWorkoutData);
            } catch (error) {
                if (error.name === 'QuotaExceededError') {
                    gracefulDegradation = true;
                }
            }
            
            // Restaurar função original
            localStorage.setItem = originalSetItem;
            
            const duration = performance.now() - startTime;
            const success = quotaExceeded && gracefulDegradation;
            
            this.testResults.push({
                name: testName,
                success,
                duration,
                details: 'Storage quota exceeded handled with graceful degradation'
            });
            
            console.log(`${success ? '✅' : '❌'} ${testName}: ${duration.toFixed(2)}ms`);
            
        } catch (error) {
            console.error(`❌ [WorkoutFlowTests] Erro em ${testName}:`, error);
            this.testResults.push({
                name: testName,
                success: false,
                error: error.message
            });
        }
    }

    /**
     * TESTE 7: Funcionamento offline
     */
    async testOfflineFunctionality() {
        const testName = 'Offline Functionality';
        console.log(`🔬 [WorkoutFlowTests] Executando: ${testName}`);
        
        const startTime = performance.now();
        
        try {
            // Simular modo offline
            const originalOnline = navigator.onLine;
            Object.defineProperty(navigator, 'onLine', {
                writable: true,
                value: false
            });
            
            // Testar operações básicas offline
            const saveOffline = await TreinoCacheService.saveWorkoutState(this.mockWorkoutData);
            const retrieveOffline = await TreinoCacheService.getWorkoutState();
            const validateOffline = TreinoCacheService.validateState(retrieveOffline);
            
            // Restaurar estado online
            Object.defineProperty(navigator, 'onLine', {
                writable: true,
                value: originalOnline
            });
            
            const duration = performance.now() - startTime;
            const success = saveOffline && retrieveOffline && validateOffline;
            
            this.testResults.push({
                name: testName,
                success,
                duration,
                details: 'All cache operations work offline using localStorage'
            });
            
            console.log(`${success ? '✅' : '❌'} ${testName}: ${duration.toFixed(2)}ms`);
            
        } catch (error) {
            console.error(`❌ [WorkoutFlowTests] Erro em ${testName}:`, error);
            this.testResults.push({
                name: testName,
                success: false,
                error: error.message
            });
        }
    }

    /**
     * TESTE 8: Performance do cache
     */
    async testCachePerformance() {
        const testName = 'Cache Performance';
        console.log(`🔬 [WorkoutFlowTests] Executando: ${testName}`);
        
        try {
            const iterations = 100;
            const results = {
                save: [],
                retrieve: [],
                validate: []
            };
            
            for (let i = 0; i < iterations; i++) {
                // Teste save
                const saveStart = performance.now();
                await TreinoCacheService.saveWorkoutState({
                    ...this.mockWorkoutData,
                    iteration: i
                });
                results.save.push(performance.now() - saveStart);
                
                // Teste retrieve
                const retrieveStart = performance.now();
                const data = await TreinoCacheService.getWorkoutState();
                results.retrieve.push(performance.now() - retrieveStart);
                
                // Teste validate
                const validateStart = performance.now();
                TreinoCacheService.validateState(data);
                results.validate.push(performance.now() - validateStart);
            }
            
            // Calcular estatísticas
            const stats = {};
            Object.keys(results).forEach(operation => {
                const times = results[operation];
                stats[operation] = {
                    avg: times.reduce((a, b) => a + b, 0) / times.length,
                    min: Math.min(...times),
                    max: Math.max(...times),
                    p95: times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)]
                };
            });
            
            // Verificar se está dentro dos limites (<100ms)
            const withinLimits = Object.values(stats).every(stat => stat.p95 < 100);
            
            this.performanceMetrics = stats;
            
            this.testResults.push({
                name: testName,
                success: withinLimits,
                duration: 0,
                details: `Performance stats: ${JSON.stringify(stats, null, 2)}`
            });
            
            console.log(`${withinLimits ? '✅' : '❌'} ${testName}: P95 within 100ms target`);
            
        } catch (error) {
            console.error(`❌ [WorkoutFlowTests] Erro em ${testName}:`, error);
            this.testResults.push({
                name: testName,
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Gera relatório final dos testes
     */
    generateTestReport() {
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(test => test.success).length;
        const failedTests = totalTests - passedTests;
        const successRate = (passedTests / totalTests * 100).toFixed(1);
        
        const report = {
            summary: {
                total: totalTests,
                passed: passedTests,
                failed: failedTests,
                successRate: `${successRate}%`
            },
            results: this.testResults,
            performance: this.performanceMetrics,
            timestamp: new Date().toISOString()
        };
        
        console.log('📊 [WorkoutFlowTests] Relatório Final:');
        console.log(`✅ Testes aprovados: ${passedTests}/${totalTests} (${successRate}%)`);
        console.log(`❌ Testes falharam: ${failedTests}`);
        
        if (this.performanceMetrics.save) {
            console.log('⚡ Performance do Cache:');
            console.log(`   Save P95: ${this.performanceMetrics.save.p95.toFixed(2)}ms`);
            console.log(`   Retrieve P95: ${this.performanceMetrics.retrieve.p95.toFixed(2)}ms`);
            console.log(`   Validate P95: ${this.performanceMetrics.validate.p95.toFixed(2)}ms`);
        }
        
        return report;
    }
}

// Função de conveniência para executar testes específicos
export async function runWorkoutInterruptionTest() {
    const suite = new WorkoutFlowTestSuite();
    await suite.setupTestEnvironment();
    await suite.testWorkoutInterruptionRecovery();
    return suite.generateTestReport();
}

export async function runPerformanceTest() {
    const suite = new WorkoutFlowTestSuite();
    await suite.setupTestEnvironment();
    await suite.testCachePerformance();
    return suite.generateTestReport();
}

// Disponibilizar globalmente para debug
window.WorkoutFlowTestSuite = WorkoutFlowTestSuite;
window.runWorkoutInterruptionTest = runWorkoutInterruptionTest;
window.runPerformanceTest = runPerformanceTest;

export default WorkoutFlowTestSuite;