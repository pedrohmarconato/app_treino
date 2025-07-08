/**
 * performanceTestSuite.js - Performance Testing for Cache Operations
 * Tests localStorage quota, performance targets, and graceful degradation
 */

import TreinoCacheService from '../services/treinoCacheService.js';
import AppState from '../state/appState.js';

export class PerformanceTestSuite {
    constructor() {
        this.testResults = [];
        this.performanceTargets = {
            cacheWrite: 100, // ms
            cacheRead: 50,   // ms
            cacheValidate: 10, // ms
            uiUpdate: 16,    // ms (60fps)
            modalOpen: 300   // ms
        };
        this.mockData = this.generateMockWorkoutData();
    }

    /**
     * Executa suite completa de performance
     */
    async runCompletePerformanceSuite() {
        console.log('⚡ [PerformanceTestSuite] Iniciando testes de performance...');
        
        try {
            // Testes de cache
            await this.testCacheOperationsPerformance();
            await this.testStorageQuotaLimits();
            await this.testConcurrentOperations();
            
            // Testes de UI
            await this.testUIResponsiveness();
            await this.testModalPerformance();
            
            // Testes de memória
            await this.testMemoryUsage();
            
            // Testes de degração
            await this.testGracefulDegradation();
            
            return this.generatePerformanceReport();
            
        } catch (error) {
            console.error('🔥 [PerformanceTestSuite] Erro crítico nos testes:', error);
            throw error;
        }
    }

    /**
     * TESTE 1: Performance das operações de cache
     */
    async testCacheOperationsPerformance() {
        const testName = 'Cache Operations Performance';
        console.log(`⚡ [PerformanceTestSuite] Executando: ${testName}`);
        
        const iterations = 100;
        const operations = {
            write: [],
            read: [],
            validate: [],
            clear: []
        };
        
        try {
            // Warm up
            await TreinoCacheService.saveWorkoutState(this.mockData);
            await TreinoCacheService.getWorkoutState();
            
            for (let i = 0; i < iterations; i++) {
                // Test WRITE performance
                const writeStart = performance.now();
                await TreinoCacheService.saveWorkoutState({
                    ...this.mockData,
                    iteration: i,
                    timestamp: Date.now()
                });
                operations.write.push(performance.now() - writeStart);
                
                // Test READ performance
                const readStart = performance.now();
                const data = await TreinoCacheService.getWorkoutState();
                operations.read.push(performance.now() - readStart);
                
                // Test VALIDATE performance
                const validateStart = performance.now();
                TreinoCacheService.validateState(data);
                operations.validate.push(performance.now() - validateStart);
                
                // Test CLEAR performance (every 10 iterations)
                if (i % 10 === 0) {
                    const clearStart = performance.now();
                    await TreinoCacheService.clearWorkoutState();
                    operations.clear.push(performance.now() - clearStart);
                }
            }
            
            // Calculate statistics
            const stats = {};
            Object.keys(operations).forEach(op => {
                const times = operations[op];
                if (times.length > 0) {
                    stats[op] = {
                        avg: times.reduce((a, b) => a + b, 0) / times.length,
                        min: Math.min(...times),
                        max: Math.max(...times),
                        p50: this.percentile(times, 50),
                        p95: this.percentile(times, 95),
                        p99: this.percentile(times, 99)
                    };
                }
            });
            
            // Check against targets
            const withinTargets = {
                write: stats.write.p95 < this.performanceTargets.cacheWrite,
                read: stats.read.p95 < this.performanceTargets.cacheRead,
                validate: stats.validate.p95 < this.performanceTargets.cacheValidate
            };
            
            const allWithinTargets = Object.values(withinTargets).every(Boolean);
            
            this.testResults.push({
                name: testName,
                passed: allWithinTargets,
                metrics: stats,
                targets: this.performanceTargets,
                compliance: withinTargets,
                details: `${iterations} iterations per operation`
            });
            
            console.log(`${allWithinTargets ? '✅' : '❌'} ${testName}`);
            console.log(`   Write P95: ${stats.write.p95.toFixed(2)}ms (target: ${this.performanceTargets.cacheWrite}ms)`);
            console.log(`   Read P95: ${stats.read.p95.toFixed(2)}ms (target: ${this.performanceTargets.cacheRead}ms)`);
            console.log(`   Validate P95: ${stats.validate.p95.toFixed(2)}ms (target: ${this.performanceTargets.cacheValidate}ms)`);
            
        } catch (error) {
            console.error(`❌ [PerformanceTestSuite] Erro em ${testName}:`, error);
            this.testResults.push({
                name: testName,
                passed: false,
                error: error.message
            });
        }
    }

    /**
     * TESTE 2: Limites de quota de storage
     */
    async testStorageQuotaLimits() {
        const testName = 'Storage Quota Limits';
        console.log(`⚡ [PerformanceTestSuite] Executando: ${testName}`);
        
        try {
            // Calcular uso atual
            const initialUsage = this.calculateStorageUsage();
            
            // Gerar dados grandes para testar limites
            const largeData = this.generateLargeWorkoutData();
            const dataSize = JSON.stringify(largeData).length;
            
            let quotaExceeded = false;
            let gracefulDegradation = false;
            let maxDataSize = 0;
            
            // Testar até encontrar limite
            for (let multiplier = 1; multiplier <= 100; multiplier++) {
                try {
                    const testData = {
                        ...largeData,
                        multiplier,
                        padding: 'x'.repeat(dataSize * multiplier)
                    };
                    
                    await TreinoCacheService.saveWorkoutState(testData);
                    maxDataSize = JSON.stringify(testData).length;
                    
                } catch (error) {
                    if (error.name === 'QuotaExceededError' || 
                        error.message.includes('quota') ||
                        error.message.includes('storage')) {
                        quotaExceeded = true;
                        
                        // Testar se há fallback graceful
                        try {
                            // Tentar salvar dados menores
                            await TreinoCacheService.saveWorkoutState(this.mockData);
                            gracefulDegradation = true;
                        } catch (fallbackError) {
                            gracefulDegradation = false;
                        }
                        break;
                    }
                    throw error;
                }
            }
            
            const finalUsage = this.calculateStorageUsage();
            
            this.testResults.push({
                name: testName,
                passed: quotaExceeded && gracefulDegradation,
                metrics: {
                    initialUsage,
                    finalUsage,
                    maxDataSize,
                    quotaExceeded,
                    gracefulDegradation
                },
                details: 'Storage quota handling and graceful degradation'
            });
            
            console.log(`${quotaExceeded && gracefulDegradation ? '✅' : '❌'} ${testName}`);
            console.log(`   Max data size: ${(maxDataSize / 1024).toFixed(2)}KB`);
            console.log(`   Quota exceeded: ${quotaExceeded}`);
            console.log(`   Graceful degradation: ${gracefulDegradation}`);
            
        } catch (error) {
            console.error(`❌ [PerformanceTestSuite] Erro em ${testName}:`, error);
            this.testResults.push({
                name: testName,
                passed: false,
                error: error.message
            });
        }
    }

    /**
     * TESTE 3: Operações concorrentes
     */
    async testConcurrentOperations() {
        const testName = 'Concurrent Operations';
        console.log(`⚡ [PerformanceTestSuite] Executando: ${testName}`);
        
        try {
            const concurrentCount = 20;
            const operations = [];
            
            const startTime = performance.now();
            
            // Executar operações simultâneas
            for (let i = 0; i < concurrentCount; i++) {
                operations.push(
                    TreinoCacheService.saveWorkoutState({
                        ...this.mockData,
                        concurrentId: i,
                        timestamp: Date.now() + i
                    })
                );
            }
            
            // Aguardar todas as operações
            const results = await Promise.allSettled(operations);
            const totalTime = performance.now() - startTime;
            
            const successful = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;
            
            // Verificar integridade final dos dados
            const finalData = await TreinoCacheService.getWorkoutState();
            const dataIntegrity = finalData !== null && TreinoCacheService.validateState(finalData);
            
            const passed = successful > 0 && dataIntegrity && totalTime < 1000; // 1 segundo para 20 operações
            
            this.testResults.push({
                name: testName,
                passed,
                metrics: {
                    totalTime,
                    successful,
                    failed,
                    dataIntegrity,
                    avgTimePerOperation: totalTime / concurrentCount
                },
                details: `${concurrentCount} concurrent cache operations`
            });
            
            console.log(`${passed ? '✅' : '❌'} ${testName}`);
            console.log(`   Total time: ${totalTime.toFixed(2)}ms`);
            console.log(`   Successful: ${successful}/${concurrentCount}`);
            console.log(`   Data integrity: ${dataIntegrity}`);
            
        } catch (error) {
            console.error(`❌ [PerformanceTestSuite] Erro em ${testName}:`, error);
            this.testResults.push({
                name: testName,
                passed: false,
                error: error.message
            });
        }
    }

    /**
     * TESTE 4: Responsividade da UI
     */
    async testUIResponsiveness() {
        const testName = 'UI Responsiveness';
        console.log(`⚡ [PerformanceTestSuite] Executando: ${testName}`);
        
        try {
            const uiOperations = [];
            
            // Criar elemento de teste
            const testElement = document.createElement('div');
            testElement.id = 'performance-test-element';
            testElement.innerHTML = `
                <button id="test-btn">Test Button</button>
                <div id="test-content">Content</div>
                <input id="test-input" type="text" />
            `;
            document.body.appendChild(testElement);
            
            // Teste 1: Atualização de texto
            const textUpdateStart = performance.now();
            for (let i = 0; i < 100; i++) {
                document.getElementById('test-content').textContent = `Updated ${i}`;
            }
            uiOperations.push({
                name: 'text_update',
                time: performance.now() - textUpdateStart
            });
            
            // Teste 2: Manipulação de classes CSS
            const classToggleStart = performance.now();
            const button = document.getElementById('test-btn');
            for (let i = 0; i < 100; i++) {
                button.classList.toggle('active');
            }
            uiOperations.push({
                name: 'class_toggle',
                time: performance.now() - classToggleStart
            });
            
            // Teste 3: Event handling
            let eventCount = 0;
            const eventHandler = () => { eventCount++; };
            const input = document.getElementById('test-input');
            input.addEventListener('input', eventHandler);
            
            const eventStart = performance.now();
            for (let i = 0; i < 50; i++) {
                const event = new Event('input', { bubbles: true });
                input.dispatchEvent(event);
            }
            const eventTime = performance.now() - eventStart;
            
            uiOperations.push({
                name: 'event_handling',
                time: eventTime,
                eventsProcessed: eventCount
            });
            
            // Cleanup
            input.removeEventListener('input', eventHandler);
            document.body.removeChild(testElement);
            
            // Verificar se todas as operações estão dentro do target (16ms para 60fps)
            const allWithinTarget = uiOperations.every(op => 
                op.time < this.performanceTargets.uiUpdate * 10 // 10x mais permissivo para batch operations
            );
            
            this.testResults.push({
                name: testName,
                passed: allWithinTarget,
                operations: uiOperations,
                target: this.performanceTargets.uiUpdate,
                details: 'UI update performance for 60fps target'
            });
            
            console.log(`${allWithinTarget ? '✅' : '❌'} ${testName}`);
            uiOperations.forEach(op => {
                console.log(`   ${op.name}: ${op.time.toFixed(2)}ms`);
            });
            
        } catch (error) {
            console.error(`❌ [PerformanceTestSuite] Erro em ${testName}:`, error);
            this.testResults.push({
                name: testName,
                passed: false,
                error: error.message
            });
        }
    }

    /**
     * TESTE 5: Performance de modais
     */
    async testModalPerformance() {
        const testName = 'Modal Performance';
        console.log(`⚡ [PerformanceTestSuite] Executando: ${testName}`);
        
        try {
            const modalMetrics = [];
            
            // Testar diferentes tipos de modal
            const modalTypes = ['simple', 'complex', 'with-animations'];
            
            for (const type of modalTypes) {
                const modal = this.createTestModal(type);
                
                // Teste abertura
                const openStart = performance.now();
                modal.style.display = 'flex';
                modal.style.visibility = 'visible';
                modal.style.opacity = '1';
                
                // Forçar reflow
                modal.offsetHeight;
                
                const openTime = performance.now() - openStart;
                
                // Teste fechamento
                const closeStart = performance.now();
                modal.style.opacity = '0';
                modal.style.visibility = 'hidden';
                modal.style.display = 'none';
                
                // Forçar reflow
                modal.offsetHeight;
                
                const closeTime = performance.now() - closeStart;
                
                modalMetrics.push({
                    type,
                    openTime,
                    closeTime,
                    totalTime: openTime + closeTime
                });
                
                // Cleanup
                document.body.removeChild(modal);
            }
            
            const avgOpenTime = modalMetrics.reduce((sum, m) => sum + m.openTime, 0) / modalMetrics.length;
            const maxOpenTime = Math.max(...modalMetrics.map(m => m.openTime));
            
            const withinTarget = maxOpenTime < this.performanceTargets.modalOpen;
            
            this.testResults.push({
                name: testName,
                passed: withinTarget,
                metrics: {
                    avgOpenTime,
                    maxOpenTime,
                    modalMetrics
                },
                target: this.performanceTargets.modalOpen,
                details: 'Modal open/close performance'
            });
            
            console.log(`${withinTarget ? '✅' : '❌'} ${testName}`);
            console.log(`   Avg open time: ${avgOpenTime.toFixed(2)}ms`);
            console.log(`   Max open time: ${maxOpenTime.toFixed(2)}ms (target: ${this.performanceTargets.modalOpen}ms)`);
            
        } catch (error) {
            console.error(`❌ [PerformanceTestSuite] Erro em ${testName}:`, error);
            this.testResults.push({
                name: testName,
                passed: false,
                error: error.message
            });
        }
    }

    /**
     * TESTE 6: Uso de memória
     */
    async testMemoryUsage() {
        const testName = 'Memory Usage';
        console.log(`⚡ [PerformanceTestSuite] Executando: ${testName}`);
        
        try {
            const initialMemory = this.getMemoryUsage();
            
            // Criar múltiplas instâncias para testar vazamentos
            const instances = [];
            const iterations = 50;
            
            for (let i = 0; i < iterations; i++) {
                // Simular criação de componentes
                const data = {
                    ...this.mockData,
                    id: i,
                    largeArray: new Array(1000).fill(Math.random())
                };
                
                await TreinoCacheService.saveWorkoutState(data);
                instances.push(data);
                
                // Limpar a cada 10 iterações
                if (i % 10 === 0) {
                    await TreinoCacheService.clearWorkoutState();
                }
            }
            
            // Forçar garbage collection se disponível
            if (window.gc) {
                window.gc();
            }
            
            const finalMemory = this.getMemoryUsage();
            const memoryIncrease = finalMemory.used - initialMemory.used;
            const memoryIncreasePercent = (memoryIncrease / initialMemory.used) * 100;
            
            // Considerar aceitável se o aumento for menor que 50%
            const memoryWithinLimits = memoryIncreasePercent < 50;
            
            this.testResults.push({
                name: testName,
                passed: memoryWithinLimits,
                metrics: {
                    initialMemory,
                    finalMemory,
                    memoryIncrease,
                    memoryIncreasePercent: memoryIncreasePercent.toFixed(2)
                },
                details: `Memory usage after ${iterations} operations`
            });
            
            console.log(`${memoryWithinLimits ? '✅' : '❌'} ${testName}`);
            console.log(`   Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB (${memoryIncreasePercent.toFixed(2)}%)`);
            
        } catch (error) {
            console.error(`❌ [PerformanceTestSuite] Erro em ${testName}:`, error);
            this.testResults.push({
                name: testName,
                passed: false,
                error: error.message
            });
        }
    }

    /**
     * TESTE 7: Degradação graciosa
     */
    async testGracefulDegradation() {
        const testName = 'Graceful Degradation';
        console.log(`⚡ [PerformanceTestSuite] Executando: ${testName}`);
        
        try {
            const degradationTests = [];
            
            // Teste 1: localStorage indisponível
            const originalSetItem = localStorage.setItem;
            localStorage.setItem = () => {
                throw new Error('localStorage not available');
            };
            
            try {
                await TreinoCacheService.saveWorkoutState(this.mockData);
                degradationTests.push({
                    scenario: 'localStorage_unavailable',
                    passed: false,
                    issue: 'Should have thrown error'
                });
            } catch (error) {
                degradationTests.push({
                    scenario: 'localStorage_unavailable',
                    passed: true,
                    handled: 'Error properly caught'
                });
            }
            
            localStorage.setItem = originalSetItem;
            
            // Teste 2: Dados corrompidos
            localStorage.setItem('workoutSession_v2', 'invalid json data');
            
            try {
                const corruptData = await TreinoCacheService.getWorkoutState();
                degradationTests.push({
                    scenario: 'corrupted_data',
                    passed: corruptData === null,
                    result: corruptData
                });
            } catch (error) {
                degradationTests.push({
                    scenario: 'corrupted_data',
                    passed: true,
                    handled: 'Corruption handled gracefully'
                });
            }
            
            // Teste 3: Quota excedida (simulado)
            const originalSetItem2 = localStorage.setItem;
            localStorage.setItem = (key, value) => {
                if (key.includes('workout')) {
                    const error = new Error('QuotaExceededError');
                    error.name = 'QuotaExceededError';
                    throw error;
                }
                return originalSetItem2.call(localStorage, key, value);
            };
            
            try {
                await TreinoCacheService.saveWorkoutState(this.mockData);
                degradationTests.push({
                    scenario: 'quota_exceeded',
                    passed: false,
                    issue: 'Should have handled quota error'
                });
            } catch (error) {
                degradationTests.push({
                    scenario: 'quota_exceeded',
                    passed: error.name === 'QuotaExceededError',
                    handled: 'Quota error properly thrown'
                });
            }
            
            localStorage.setItem = originalSetItem2;
            
            // Teste 4: Navegador sem suporte
            const originalJSON = JSON.stringify;
            JSON.stringify = undefined;
            
            try {
                await TreinoCacheService.saveWorkoutState(this.mockData);
                degradationTests.push({
                    scenario: 'no_json_support',
                    passed: false,
                    issue: 'Should have failed without JSON'
                });
            } catch (error) {
                degradationTests.push({
                    scenario: 'no_json_support',
                    passed: true,
                    handled: 'JSON unavailability handled'
                });
            }
            
            JSON.stringify = originalJSON;
            
            const allPassed = degradationTests.every(test => test.passed);
            
            this.testResults.push({
                name: testName,
                passed: allPassed,
                tests: degradationTests,
                details: 'Graceful handling of various failure scenarios'
            });
            
            console.log(`${allPassed ? '✅' : '❌'} ${testName}`);
            degradationTests.forEach(test => {
                console.log(`   ${test.scenario}: ${test.passed ? '✅' : '❌'}`);
            });
            
        } catch (error) {
            console.error(`❌ [PerformanceTestSuite] Erro em ${testName}:`, error);
            this.testResults.push({
                name: testName,
                passed: false,
                error: error.message
            });
        }
    }

    /**
     * Gera dados mock para testes
     */
    generateMockWorkoutData() {
        return {
            currentWorkout: {
                id: 'test-workout-456',
                nome: 'Treino Performance Test',
                dia_semana: 1,
                exercicios: Array.from({ length: 10 }, (_, i) => ({
                    id: i + 1,
                    nome: `Exercício ${i + 1}`,
                    series: 4,
                    repeticoes: 12,
                    peso_min: 50 + i * 5,
                    peso_max: 70 + i * 5,
                    grupo_muscular: ['Peito', 'Costas', 'Pernas', 'Ombros'][i % 4]
                }))
            },
            exerciciosExecutados: Array.from({ length: 5 }, (_, i) => ({
                exercicio_id: i + 1,
                series_realizadas: 3,
                pesos: [60, 65, 70],
                repeticoes: [12, 10, 8],
                timestamp: Date.now() - (i * 60000)
            })),
            startTime: Date.now() - 1800000, // 30 minutos atrás
            currentExerciseIndex: 5,
            metadata: {
                savedAt: new Date().toISOString(),
                isPartial: true,
                appVersion: '2.0'
            }
        };
    }

    /**
     * Gera dados grandes para teste de quota
     */
    generateLargeWorkoutData() {
        const baseData = this.generateMockWorkoutData();
        
        // Adicionar dados extras para aumentar o tamanho
        return {
            ...baseData,
            extraData: {
                notes: 'Lorem ipsum '.repeat(1000),
                history: Array.from({ length: 100 }, (_, i) => ({
                    date: new Date(Date.now() - i * 86400000).toISOString(),
                    exercises: Array.from({ length: 20 }, (_, j) => ({
                        name: `Exercise ${j}`,
                        sets: Array.from({ length: 5 }, (_, k) => ({
                            weight: 50 + k * 5,
                            reps: 10 + k,
                            rest: 60 + k * 10
                        }))
                    }))
                }))
            }
        };
    }

    /**
     * Calcula uso de storage
     */
    calculateStorageUsage() {
        let used = 0;
        for (const key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                used += localStorage[key].length + key.length;
            }
        }
        
        return {
            used,
            usedMB: (used / 1024 / 1024).toFixed(2),
            // Estimativa baseada em navegadores típicos (5-10MB)
            estimated_total: 5 * 1024 * 1024,
            usage_percent: ((used / (5 * 1024 * 1024)) * 100).toFixed(2)
        };
    }

    /**
     * Obtém uso de memória (se disponível)
     */
    getMemoryUsage() {
        if (performance.memory) {
            return {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            };
        }
        
        // Fallback: estimativa baseada em objetos criados
        return {
            used: document.querySelectorAll('*').length * 1000, // Estimativa grosseira
            total: 50 * 1024 * 1024, // 50MB estimado
            limit: 100 * 1024 * 1024 // 100MB estimado
        };
    }

    /**
     * Cria modal de teste
     */
    createTestModal(type) {
        const modal = document.createElement('div');
        modal.className = `test-modal modal-${type}`;
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;
        
        let content = '<div style="background: white; padding: 20px; border-radius: 8px;">';
        
        switch (type) {
            case 'simple':
                content += '<p>Simple modal content</p>';
                break;
            case 'complex':
                content += `
                    <h2>Complex Modal</h2>
                    ${Array.from({ length: 50 }, (_, i) => `<p>Line ${i + 1}</p>`).join('')}
                `;
                break;
            case 'with-animations':
                content += `
                    <div style="animation: fadeIn 0.3s ease;">
                        <p>Animated modal</p>
                    </div>
                `;
                modal.style.transition = 'opacity 0.3s ease';
                break;
        }
        
        content += '</div>';
        modal.innerHTML = content;
        
        document.body.appendChild(modal);
        return modal;
    }

    /**
     * Calcula percentil
     */
    percentile(arr, p) {
        const sorted = arr.slice().sort((a, b) => a - b);
        const index = (p / 100) * (sorted.length - 1);
        
        if (Math.floor(index) === index) {
            return sorted[index];
        }
        
        const lower = sorted[Math.floor(index)];
        const upper = sorted[Math.ceil(index)];
        return lower + (upper - lower) * (index - Math.floor(index));
    }

    /**
     * Gera relatório de performance
     */
    generatePerformanceReport() {
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(test => test.passed).length;
        const failedTests = totalTests - passedTests;
        const successRate = (passedTests / totalTests * 100).toFixed(1);
        
        // Calcular score de performance
        let performanceScore = 0;
        const weights = {
            'Cache Operations Performance': 30,
            'Storage Quota Limits': 20,
            'Concurrent Operations': 15,
            'UI Responsiveness': 15,
            'Modal Performance': 10,
            'Memory Usage': 5,
            'Graceful Degradation': 5
        };
        
        this.testResults.forEach(test => {
            if (test.passed) {
                performanceScore += weights[test.name] || 5;
            }
        });
        
        const grade = performanceScore >= 90 ? 'A' :
                      performanceScore >= 80 ? 'B' :
                      performanceScore >= 70 ? 'C' :
                      performanceScore >= 60 ? 'D' : 'F';
        
        const report = {
            summary: {
                total: totalTests,
                passed: passedTests,
                failed: failedTests,
                successRate: `${successRate}%`,
                performanceScore,
                grade
            },
            results: this.testResults,
            targets: this.performanceTargets,
            timestamp: new Date().toISOString(),
            recommendations: this.generatePerformanceRecommendations()
        };
        
        console.log('⚡ [PerformanceTestSuite] Relatório Final:');
        console.log(`✅ Testes aprovados: ${passedTests}/${totalTests} (${successRate}%)`);
        console.log(`🎯 Score de Performance: ${performanceScore}/100 (${grade})`);
        
        // Log métricas principais
        const cacheTest = this.testResults.find(t => t.name === 'Cache Operations Performance');
        if (cacheTest && cacheTest.metrics) {
            console.log('📊 Métricas de Cache:');
            console.log(`   Write P95: ${cacheTest.metrics.write.p95.toFixed(2)}ms`);
            console.log(`   Read P95: ${cacheTest.metrics.read.p95.toFixed(2)}ms`);
            console.log(`   Validate P95: ${cacheTest.metrics.validate.p95.toFixed(2)}ms`);
        }
        
        return report;
    }

    /**
     * Gera recomendações de performance
     */
    generatePerformanceRecommendations() {
        const recommendations = [];
        
        this.testResults.forEach(test => {
            if (!test.passed) {
                switch (test.name) {
                    case 'Cache Operations Performance':
                        recommendations.push({
                            priority: 'high',
                            category: 'Cache Performance',
                            message: 'Otimizar operações de cache para atingir targets de performance'
                        });
                        break;
                    case 'Storage Quota Limits':
                        recommendations.push({
                            priority: 'medium',
                            category: 'Storage Management',
                            message: 'Implementar limpeza automática de dados antigos'
                        });
                        break;
                    case 'UI Responsiveness':
                        recommendations.push({
                            priority: 'high',
                            category: 'UI Performance',
                            message: 'Otimizar updates de UI para manter 60fps'
                        });
                        break;
                    case 'Memory Usage':
                        recommendations.push({
                            priority: 'medium',
                            category: 'Memory Management',
                            message: 'Investigar vazamentos de memória e otimizar garbage collection'
                        });
                        break;
                }
            }
        });
        
        return recommendations;
    }
}

// Funções de conveniência
export async function runCachePerformanceTest() {
    const suite = new PerformanceTestSuite();
    await suite.testCacheOperationsPerformance();
    return suite.generatePerformanceReport();
}

export async function runStorageQuotaTest() {
    const suite = new PerformanceTestSuite();
    await suite.testStorageQuotaLimits();
    return suite.generatePerformanceReport();
}

// Disponibilizar globalmente
window.PerformanceTestSuite = PerformanceTestSuite;
window.runCachePerformanceTest = runCachePerformanceTest;
window.runStorageQuotaTest = runStorageQuotaTest;

export default PerformanceTestSuite;