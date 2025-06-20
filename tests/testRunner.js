/**
 * testRunner.js - Test Suite Orchestrator
 * Executes all test suites and generates comprehensive reports
 */

import WorkoutFlowTestSuite from './workoutFlowTests.js';
import AccessibilityValidator from './accessibilityValidator.js';
import PerformanceTestSuite from './performanceTestSuite.js';
import OfflineTestSuite from './offlineTestSuite.js';

export class TestRunner {
    constructor() {
        this.testSuites = {
            workoutFlow: new WorkoutFlowTestSuite(),
            accessibility: new AccessibilityValidator(),
            performance: new PerformanceTestSuite(),
            offline: new OfflineTestSuite()
        };
        
        this.reports = {};
        this.startTime = null;
        this.endTime = null;
    }

    /**
     * Executa todos os testes obrigatórios da ETAPA 7
     */
    async runMandatoryTests() {
        console.log('🧪 [TestRunner] Iniciando bateria completa de testes obrigatórios...\n');
        
        this.startTime = performance.now();
        
        try {
            // TESTE 1: Complete Workout Interruption Recovery
            console.log('📋 TESTE OBRIGATÓRIO 1: Complete Workout Interruption Recovery');
            console.log('   Cenário: Iniciar treino → Sair → Voltar (dados preservados)');
            this.reports.workoutInterruption = await this.testWorkoutInterruptionRecovery();
            
            // TESTE 2: Cross-tab session recovery
            console.log('\n📋 TESTE OBRIGATÓRIO 2: Cross-tab Session Recovery');
            console.log('   Cenário: Treino em andamento → Fechar aba → Reabrir (recuperação automática)');
            this.reports.crossTabRecovery = await this.testCrossTabRecovery();
            
            // TESTE 3: Storage quota handling
            console.log('\n📋 TESTE OBRIGATÓRIO 3: Storage Quota Handling');
            console.log('   Cenário: Cache cheio → Salvamento (graceful degradation)');
            this.reports.storageQuota = await this.testStorageQuotaHandling();
            
            // TESTE 4: Complete offline functionality
            console.log('\n📋 TESTE OBRIGATÓRIO 4: Complete Offline Functionality');
            console.log('   Cenário: Sem internet → Funcionamento offline completo');
            this.reports.offlineFunctionality = await this.testOfflineFunctionality();
            
            // TESTE 5: Accessibility validation
            console.log('\n📋 TESTE OBRIGATÓRIO 5: Accessibility Validation');
            console.log('   Cenário: Navegação por teclado → Todos os modais acessíveis');
            this.reports.accessibility = await this.testAccessibilityCompliance();
            
            this.endTime = performance.now();
            
            return this.generateComprehensiveReport();
            
        } catch (error) {
            console.error('🔥 [TestRunner] Erro crítico durante execução dos testes:', error);
            this.endTime = performance.now();
            throw error;
        }
    }

    /**
     * TESTE OBRIGATÓRIO 1: Interrupção e recuperação completa de treino
     */
    async testWorkoutInterruptionRecovery() {
        console.log('   🔄 Executando teste de interrupção e recuperação...');
        
        try {
            const suite = this.testSuites.workoutFlow;
            await suite.setupTestEnvironment();
            
            // Executar cenário específico de interrupção
            await suite.testWorkoutInterruptionRecovery();
            
            const report = suite.generateTestReport();
            const passed = report.results.every(test => test.success);
            
            console.log(`   ${passed ? '✅ APROVADO' : '❌ REPROVADO'}: Interrupção e recuperação`);
            
            if (!passed) {
                const failedTests = report.results.filter(test => !test.success);
                console.log('   📋 Testes que falharam:');
                failedTests.forEach(test => {
                    console.log(`      - ${test.name}: ${test.error || 'Falha não especificada'}`);
                });
            }
            
            return {
                name: 'Workout Interruption Recovery',
                passed,
                report,
                requirement: 'Dados preservados durante interrupção'
            };
            
        } catch (error) {
            console.log(`   ❌ ERRO: ${error.message}`);
            return {
                name: 'Workout Interruption Recovery',
                passed: false,
                error: error.message,
                requirement: 'Dados preservados durante interrupção'
            };
        }
    }

    /**
     * TESTE OBRIGATÓRIO 2: Recuperação cross-tab
     */
    async testCrossTabRecovery() {
        console.log('   🔄 Executando teste de recuperação cross-tab...');
        
        try {
            const suite = this.testSuites.workoutFlow;
            
            // Simular abertura em nova aba
            await suite.testCrossTabSynchronization();
            
            const report = suite.generateTestReport();
            const crossTabTest = report.results.find(test => 
                test.name === 'Cross-Tab Synchronization'
            );
            
            const passed = crossTabTest ? crossTabTest.success : false;
            
            console.log(`   ${passed ? '✅ APROVADO' : '❌ REPROVADO'}: Recuperação cross-tab`);
            
            return {
                name: 'Cross-Tab Recovery',
                passed,
                details: crossTabTest,
                requirement: 'Recuperação automática ao reabrir aba'
            };
            
        } catch (error) {
            console.log(`   ❌ ERRO: ${error.message}`);
            return {
                name: 'Cross-Tab Recovery',
                passed: false,
                error: error.message,
                requirement: 'Recuperação automática ao reabrir aba'
            };
        }
    }

    /**
     * TESTE OBRIGATÓRIO 3: Handling de quota de storage
     */
    async testStorageQuotaHandling() {
        console.log('   🔄 Executando teste de quota de storage...');
        
        try {
            const suite = this.testSuites.performance;
            
            await suite.testStorageQuotaLimits();
            
            const report = suite.generatePerformanceReport();
            const quotaTest = report.results.find(test => 
                test.name === 'Storage Quota Limits'
            );
            
            const passed = quotaTest ? quotaTest.passed : false;
            
            console.log(`   ${passed ? '✅ APROVADO' : '❌ REPROVADO'}: Handling de quota`);
            
            if (quotaTest && quotaTest.metrics) {
                console.log(`   📊 Quota exceeded: ${quotaTest.metrics.quotaExceeded}`);
                console.log(`   📊 Graceful degradation: ${quotaTest.metrics.gracefulDegradation}`);
            }
            
            return {
                name: 'Storage Quota Handling',
                passed,
                details: quotaTest,
                requirement: 'Graceful degradation com cache cheio'
            };
            
        } catch (error) {
            console.log(`   ❌ ERRO: ${error.message}`);
            return {
                name: 'Storage Quota Handling',
                passed: false,
                error: error.message,
                requirement: 'Graceful degradation com cache cheio'
            };
        }
    }

    /**
     * TESTE OBRIGATÓRIO 4: Funcionalidade offline completa
     */
    async testOfflineFunctionality() {
        console.log('   🔄 Executando teste de funcionalidade offline...');
        
        try {
            const suite = this.testSuites.offline;
            
            // Executar cenários críticos offline
            await suite.setupOfflineEnvironment();
            await suite.testOfflineCacheOperations();
            await suite.testOfflineWorkoutFlow();
            await suite.restoreOnlineEnvironment();
            
            const report = suite.generateOfflineReport();
            const offlineCapabilities = report.capabilities;
            
            const passed = offlineCapabilities.fullOfflineWorkflow && 
                          offlineCapabilities.dataPersistence;
            
            console.log(`   ${passed ? '✅ APROVADO' : '❌ REPROVADO'}: Funcionalidade offline`);
            console.log(`   📊 Fluxo completo offline: ${offlineCapabilities.fullOfflineWorkflow ? '✅' : '❌'}`);
            console.log(`   📊 Persistência de dados: ${offlineCapabilities.dataPersistence ? '✅' : '❌'}`);
            console.log(`   📊 Score offline: ${report.summary.offlineScore}/100`);
            
            return {
                name: 'Complete Offline Functionality',
                passed,
                report,
                capabilities: offlineCapabilities,
                requirement: 'Funcionamento completo sem internet'
            };
            
        } catch (error) {
            console.log(`   ❌ ERRO: ${error.message}`);
            return {
                name: 'Complete Offline Functionality',
                passed: false,
                error: error.message,
                requirement: 'Funcionamento completo sem internet'
            };
        }
    }

    /**
     * TESTE OBRIGATÓRIO 5: Conformidade de acessibilidade
     */
    async testAccessibilityCompliance() {
        console.log('   🔄 Executando validação de acessibilidade...');
        
        try {
            const suite = this.testSuites.accessibility;
            
            // Focar em modais e navegação por teclado
            await suite.validateModalAccessibility();
            await suite.validateKeyboardNavigation();
            
            const report = suite.generateAccessibilityReport();
            const wcagLevel = report.summary.wcagLevel;
            const passed = wcagLevel === 'AA' || wcagLevel === 'A';
            
            console.log(`   ${passed ? '✅ APROVADO' : '❌ REPROVADO'}: Acessibilidade`);
            console.log(`   📊 Nível WCAG: ${wcagLevel}`);
            console.log(`   📊 Taxa de sucesso: ${report.summary.successRate}`);
            console.log(`   📊 Violações críticas: ${report.violations.critical}`);
            console.log(`   📊 Violações sérias: ${report.violations.serious}`);
            
            return {
                name: 'Accessibility Compliance',
                passed,
                report,
                wcagLevel,
                requirement: 'Navegação por teclado e modais acessíveis'
            };
            
        } catch (error) {
            console.log(`   ❌ ERRO: ${error.message}`);
            return {
                name: 'Accessibility Compliance',
                passed: false,
                error: error.message,
                requirement: 'Navegação por teclado e modais acessíveis'
            };
        }
    }

    /**
     * Executa performance test específico
     */
    async runPerformanceTest() {
        console.log('⚡ [TestRunner] Executando teste de performance...');
        
        try {
            const suite = this.testSuites.performance;
            const report = await suite.runCompletePerformanceSuite();
            
            console.log(`✅ Performance Test: ${report.summary.grade} (${report.summary.performanceScore}/100)`);
            
            return report;
            
        } catch (error) {
            console.error('❌ [TestRunner] Erro no teste de performance:', error);
            throw error;
        }
    }

    /**
     * Executa teste de flow específico
     */
    async runWorkoutFlowTest() {
        console.log('🔄 [TestRunner] Executando teste de fluxo de treino...');
        
        try {
            const suite = this.testSuites.workoutFlow;
            const report = await suite.runCompleteTestSuite();
            
            console.log(`✅ Workout Flow Test: ${report.summary.successRate} success rate`);
            
            return report;
            
        } catch (error) {
            console.error('❌ [TestRunner] Erro no teste de fluxo:', error);
            throw error;
        }
    }

    /**
     * Gera relatório abrangente
     */
    generateComprehensiveReport() {
        const duration = this.endTime - this.startTime;
        
        // Contar resultados
        const mandatoryTests = Object.values(this.reports);
        const totalMandatory = mandatoryTests.length;
        const passedMandatory = mandatoryTests.filter(test => test.passed).length;
        const failedMandatory = totalMandatory - passedMandatory;
        
        // Calcular score geral
        const mandatoryScore = (passedMandatory / totalMandatory) * 100;
        
        // Determinar status geral
        const overallStatus = passedMandatory === totalMandatory ? 'APROVADO' : 'REPROVADO';
        const statusIcon = overallStatus === 'APROVADO' ? '✅' : '❌';
        
        const comprehensiveReport = {
            summary: {
                overallStatus,
                mandatoryTests: {
                    total: totalMandatory,
                    passed: passedMandatory,
                    failed: failedMandatory,
                    score: mandatoryScore.toFixed(1)
                },
                duration: `${(duration / 1000).toFixed(2)}s`,
                timestamp: new Date().toISOString()
            },
            mandatoryResults: this.reports,
            qualityGates: this.evaluateQualityGates(),
            recommendations: this.generateRecommendations(),
            nextSteps: this.generateNextSteps()
        };
        
        // Log relatório final
        console.log('\n' + '='.repeat(80));
        console.log('📊 RELATÓRIO FINAL - ETAPA 7: Testing & Validation');
        console.log('='.repeat(80));
        console.log(`\n${statusIcon} STATUS GERAL: ${overallStatus}`);
        console.log(`🎯 SCORE DOS TESTES OBRIGATÓRIOS: ${mandatoryScore.toFixed(1)}%`);
        console.log(`⏱️  DURAÇÃO TOTAL: ${(duration / 1000).toFixed(2)}s`);
        
        console.log('\n📋 RESULTADOS DOS TESTES OBRIGATÓRIOS:');
        mandatoryTests.forEach((test, index) => {
            const icon = test.passed ? '✅' : '❌';
            console.log(`   ${index + 1}. ${icon} ${test.name}`);
            console.log(`      Requisito: ${test.requirement}`);
            if (!test.passed && test.error) {
                console.log(`      Erro: ${test.error}`);
            }
        });
        
        console.log('\n🚪 QUALITY GATES:');
        Object.entries(comprehensiveReport.qualityGates).forEach(([gate, result]) => {
            const icon = result.passed ? '✅' : '❌';
            console.log(`   ${icon} ${gate}: ${result.message}`);
        });
        
        console.log('\n💡 RECOMENDAÇÕES PRIORITÁRIAS:');
        comprehensiveReport.recommendations.slice(0, 3).forEach((rec, index) => {
            console.log(`   ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.message}`);
        });
        
        console.log('\n' + '='.repeat(80));
        
        return comprehensiveReport;
    }

    /**
     * Avalia quality gates
     */
    evaluateQualityGates() {
        const gates = {};
        
        // Gate 1: Todos os testes obrigatórios passaram
        const allMandatoryPassed = Object.values(this.reports).every(test => test.passed);
        gates.allMandatoryPassed = {
            passed: allMandatoryPassed,
            message: allMandatoryPassed ? 
                'Todos os testes obrigatórios aprovados' : 
                'Alguns testes obrigatórios falharam'
        };
        
        // Gate 2: Funcionalidade offline completa
        const offlineReport = this.reports.offlineFunctionality;
        const offlineComplete = offlineReport?.passed || false;
        gates.offlineFunctionality = {
            passed: offlineComplete,
            message: offlineComplete ?
                'Funcionalidade offline completa' :
                'Funcionalidade offline incompleta'
        };
        
        // Gate 3: Acessibilidade mínima (WCAG A)
        const accessibilityReport = this.reports.accessibility;
        const accessibilityMinimum = accessibilityReport?.wcagLevel === 'A' || 
                                   accessibilityReport?.wcagLevel === 'AA';
        gates.accessibilityMinimum = {
            passed: accessibilityMinimum,
            message: accessibilityMinimum ?
                `Acessibilidade WCAG ${accessibilityReport?.wcagLevel} atingida` :
                'Acessibilidade mínima não atingida'
        };
        
        // Gate 4: Dados preservados durante interrupção
        const interruptionReport = this.reports.workoutInterruption;
        const dataPreserved = interruptionReport?.passed || false;
        gates.dataPreservation = {
            passed: dataPreserved,
            message: dataPreserved ?
                'Dados preservados durante interrupção' :
                'Falha na preservação de dados'
        };
        
        return gates;
    }

    /**
     * Gera recomendações baseadas nos resultados
     */
    generateRecommendations() {
        const recommendations = [];
        
        // Analisar cada teste obrigatório
        Object.values(this.reports).forEach(test => {
            if (!test.passed) {
                switch (test.name) {
                    case 'Workout Interruption Recovery':
                        recommendations.push({
                            priority: 'critical',
                            category: 'Data Persistence',
                            message: 'Corrigir falhas na preservação de dados durante interrupção'
                        });
                        break;
                    case 'Cross-Tab Recovery':
                        recommendations.push({
                            priority: 'high',
                            category: 'Session Management',
                            message: 'Implementar recuperação automática entre abas'
                        });
                        break;
                    case 'Storage Quota Handling':
                        recommendations.push({
                            priority: 'medium',
                            category: 'Storage Management',
                            message: 'Melhorar handling de quota de storage excedida'
                        });
                        break;
                    case 'Complete Offline Functionality':
                        recommendations.push({
                            priority: 'critical',
                            category: 'Offline Support',
                            message: 'Garantir funcionalidade completa sem internet'
                        });
                        break;
                    case 'Accessibility Compliance':
                        recommendations.push({
                            priority: 'high',
                            category: 'Accessibility',
                            message: 'Corrigir violações de acessibilidade em modais e navegação'
                        });
                        break;
                }
            }
        });
        
        // Recomendações gerais
        recommendations.push({
            priority: 'low',
            category: 'Enhancement',
            message: 'Considerar implementação de service worker para melhor experiência offline'
        });
        
        recommendations.push({
            priority: 'low',
            category: 'Monitoring',
            message: 'Implementar telemetria para monitorar performance em produção'
        });
        
        return recommendations.sort((a, b) => {
            const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    }

    /**
     * Gera próximos passos
     */
    generateNextSteps() {
        const allPassed = Object.values(this.reports).every(test => test.passed);
        
        if (allPassed) {
            return [
                'Sistema aprovado em todos os testes obrigatórios',
                'Pronto para deployment em produção',
                'Implementar monitoramento de performance',
                'Configurar alertas para métricas críticas'
            ];
        } else {
            const failedTests = Object.values(this.reports)
                .filter(test => !test.passed)
                .map(test => test.name);
            
            return [
                `Corrigir falhas nos testes: ${failedTests.join(', ')}`,
                'Re-executar suite completa de testes',
                'Validar correções em ambiente de teste',
                'Agendar nova rodada de QA'
            ];
        }
    }
}

// Funções de conveniência para execução rápida
export async function runMandatoryTests() {
    const runner = new TestRunner();
    return await runner.runMandatoryTests();
}

export async function runPerformanceTest() {
    const runner = new TestRunner();
    return await runner.runPerformanceTest();
}

export async function runAccessibilityTest() {
    const runner = new TestRunner();
    const suite = runner.testSuites.accessibility;
    return await suite.runCompleteAccessibilityValidation();
}

export async function runOfflineTest() {
    const runner = new TestRunner();
    const suite = runner.testSuites.offline;
    return await suite.runCompleteOfflineTestSuite();
}

// Disponibilizar globalmente para debug e execução manual
window.TestRunner = TestRunner;
window.runMandatoryTests = runMandatoryTests;
window.runPerformanceTest = runPerformanceTest;
window.runAccessibilityTest = runAccessibilityTest;
window.runOfflineTest = runOfflineTest;

export default TestRunner;