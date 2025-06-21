/**
 * Script de diagnóstico para o fluxo de recuperação de treino
 * Executa no console do navegador
 */

// Função de diagnóstico completa
window.diagnoseRecoveryFlow = async function() {
    console.log('=== DIAGNÓSTICO DO FLUXO DE RECUPERAÇÃO DE TREINO ===');
    console.log('Timestamp:', new Date().toISOString());
    
    const results = {
        timestamp: new Date().toISOString(),
        checks: {}
    };
    
    // 1. Verificar se há dados salvos
    console.log('\n1. VERIFICANDO DADOS SALVOS...');
    try {
        const hasActive = await TreinoCacheService.hasActiveWorkout();
        const workoutState = await TreinoCacheService.getWorkoutState();
        const localStorage1 = localStorage.getItem('workoutSession_v2');
        const localStorage2 = localStorage.getItem('treino_em_andamento');
        
        results.checks.savedData = {
            hasActiveWorkout: hasActive,
            hasWorkoutState: !!workoutState,
            workoutStateValid: workoutState ? TreinoCacheService.validateState(workoutState) : false,
            localStorage_v2: !!localStorage1,
            localStorage_legacy: !!localStorage2,
            exercisesCount: workoutState?.exerciciosExecutados?.length || 0
        };
        
        console.log('✅ Dados salvos:', results.checks.savedData);
        
        if (workoutState) {
            console.log('📋 Estado do workout:', workoutState);
        }
    } catch (error) {
        console.error('❌ Erro ao verificar dados salvos:', error);
        results.checks.savedData = { error: error.message };
    }
    
    // 2. Verificar o botão contextual
    console.log('\n2. VERIFICANDO BOTÃO CONTEXTUAL...');
    try {
        const button = document.getElementById('contextual-workout-btn');
        const buttonInstance = window.getContextualButtonInstance ? window.getContextualButtonInstance() : null;
        
        results.checks.contextualButton = {
            buttonExists: !!button,
            buttonVisible: button ? window.getComputedStyle(button).display !== 'none' : false,
            buttonDisabled: button ? button.disabled : null,
            buttonState: button ? button.getAttribute('data-state') : null,
            buttonAction: button ? button.getAttribute('data-action') : null,
            instanceExists: !!buttonInstance,
            instanceState: buttonInstance ? buttonInstance.currentState : null
        };
        
        console.log('✅ Estado do botão:', results.checks.contextualButton);
        
        if (buttonInstance) {
            console.log('📋 Debug info do botão:', buttonInstance.getDebugInfo());
        }
    } catch (error) {
        console.error('❌ Erro ao verificar botão:', error);
        results.checks.contextualButton = { error: error.message };
    }
    
    // 3. Verificar funções globais
    console.log('\n3. VERIFICANDO FUNÇÕES GLOBAIS...');
    results.checks.globalFunctions = {
        resumeWorkout: typeof window.resumeWorkout,
        workoutExecutionManager: !!window.workoutExecutionManager,
        resumeFromCache: window.workoutExecutionManager ? typeof window.workoutExecutionManager.resumeFromCache : 'N/A',
        renderTemplate: typeof window.renderTemplate,
        mostrarTela: typeof window.mostrarTela
    };
    console.log('✅ Funções globais:', results.checks.globalFunctions);
    
    // 4. Simular clique no botão
    console.log('\n4. SIMULANDO CLIQUE NO BOTÃO...');
    try {
        const button = document.getElementById('contextual-workout-btn');
        if (button && button.getAttribute('data-state') === 'resume') {
            console.log('🖱️ Simulando clique...');
            
            // Adicionar listener temporário para debug
            const tempListener = (e) => {
                console.log('🎯 Evento de clique capturado:', {
                    target: e.target,
                    currentTarget: e.currentTarget,
                    defaultPrevented: e.defaultPrevented,
                    propagationStopped: e.cancelBubble
                });
            };
            
            button.addEventListener('click', tempListener, true);
            
            // Simular clique
            const clickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window
            });
            
            button.dispatchEvent(clickEvent);
            
            // Remover listener temporário
            setTimeout(() => {
                button.removeEventListener('click', tempListener, true);
            }, 100);
            
            results.checks.clickSimulation = {
                success: true,
                buttonState: button.getAttribute('data-state')
            };
            
            console.log('✅ Clique simulado');
        } else {
            results.checks.clickSimulation = {
                success: false,
                reason: button ? 'Botão não está em estado resume' : 'Botão não encontrado'
            };
            console.log('⚠️ Não foi possível simular clique:', results.checks.clickSimulation.reason);
        }
    } catch (error) {
        console.error('❌ Erro ao simular clique:', error);
        results.checks.clickSimulation = { error: error.message };
    }
    
    // 5. Testar resumeWorkout diretamente
    console.log('\n5. TESTANDO resumeWorkout DIRETAMENTE...');
    try {
        const workoutState = await TreinoCacheService.getWorkoutState();
        
        if (workoutState && window.resumeWorkout) {
            console.log('🔄 Chamando resumeWorkout com estado salvo...');
            
            // Interceptar console para capturar logs
            const originalLog = console.log;
            const originalError = console.error;
            const logs = [];
            
            console.log = (...args) => {
                logs.push({ type: 'log', args });
                originalLog.apply(console, args);
            };
            
            console.error = (...args) => {
                logs.push({ type: 'error', args });
                originalError.apply(console, args);
            };
            
            try {
                const result = await window.resumeWorkout(workoutState);
                results.checks.resumeWorkoutDirect = {
                    success: true,
                    result: result,
                    logs: logs
                };
                console.log('✅ resumeWorkout executado com sucesso');
            } catch (error) {
                results.checks.resumeWorkoutDirect = {
                    success: false,
                    error: error.message,
                    stack: error.stack,
                    logs: logs
                };
                console.error('❌ Erro em resumeWorkout:', error);
            } finally {
                // Restaurar console
                console.log = originalLog;
                console.error = originalError;
            }
        } else {
            results.checks.resumeWorkoutDirect = {
                success: false,
                reason: !workoutState ? 'Sem estado salvo' : 'resumeWorkout não disponível'
            };
        }
    } catch (error) {
        console.error('❌ Erro ao testar resumeWorkout:', error);
        results.checks.resumeWorkoutDirect = { error: error.message };
    }
    
    // 6. Verificar navegação
    console.log('\n6. VERIFICANDO NAVEGAÇÃO...');
    try {
        const currentScreen = document.querySelector('.screen.active');
        const workoutScreen = document.querySelector('#workout-screen');
        
        results.checks.navigation = {
            currentScreen: currentScreen ? currentScreen.id : 'none',
            workoutScreenExists: !!workoutScreen,
            workoutScreenVisible: workoutScreen ? window.getComputedStyle(workoutScreen).display !== 'none' : false,
            allScreens: Array.from(document.querySelectorAll('.screen')).map(s => ({
                id: s.id,
                visible: window.getComputedStyle(s).display !== 'none',
                active: s.classList.contains('active')
            }))
        };
        
        console.log('✅ Estado da navegação:', results.checks.navigation);
    } catch (error) {
        console.error('❌ Erro ao verificar navegação:', error);
        results.checks.navigation = { error: error.message };
    }
    
    // 7. Verificar event listeners
    console.log('\n7. VERIFICANDO EVENT LISTENERS...');
    try {
        const button = document.getElementById('contextual-workout-btn');
        if (button) {
            // Usar Chrome DevTools API se disponível
            if (window.getEventListeners) {
                const listeners = getEventListeners(button);
                results.checks.eventListeners = {
                    click: listeners.click ? listeners.click.length : 0,
                    allEvents: Object.keys(listeners)
                };
            } else {
                // Fallback: testar se há resposta ao clique
                let clickHandled = false;
                const testHandler = () => { clickHandled = true; };
                button.addEventListener('click', testHandler);
                button.click();
                button.removeEventListener('click', testHandler);
                
                results.checks.eventListeners = {
                    hasClickHandler: clickHandled,
                    note: 'getEventListeners não disponível - teste básico realizado'
                };
            }
            
            console.log('✅ Event listeners:', results.checks.eventListeners);
        }
    } catch (error) {
        console.error('❌ Erro ao verificar event listeners:', error);
        results.checks.eventListeners = { error: error.message };
    }
    
    // Resumo final
    console.log('\n=== RESUMO DO DIAGNÓSTICO ===');
    console.log(results);
    
    // Recomendações
    console.log('\n=== RECOMENDAÇÕES ===');
    
    if (!results.checks.savedData?.hasActiveWorkout) {
        console.log('⚠️ Não há treino ativo salvo. Execute um treino e salve antes de testar a recuperação.');
    }
    
    if (results.checks.contextualButton?.buttonState !== 'resume') {
        console.log('⚠️ O botão não está no estado "resume". Verifique se há dados salvos válidos.');
    }
    
    if (!results.checks.globalFunctions?.resumeWorkout) {
        console.log('❌ Função resumeWorkout não está disponível globalmente. Verifique o carregamento do workoutExecution.js');
    }
    
    if (results.checks.resumeWorkoutDirect?.success === false) {
        console.log('❌ Falha ao executar resumeWorkout. Verifique os logs de erro acima.');
    }
    
    return results;
};

// Função auxiliar para testar o fluxo completo
window.testFullRecoveryFlow = async function() {
    console.log('=== TESTE COMPLETO DO FLUXO DE RECUPERAÇÃO ===');
    
    try {
        // 1. Criar dados de teste se não existirem
        const hasActive = await TreinoCacheService.hasActiveWorkout();
        
        if (!hasActive) {
            console.log('📝 Criando dados de teste...');
            
            const testState = {
                currentWorkout: {
                    id: 1,
                    nome: 'Treino Teste',
                    exercicios: [
                        { id: 1, nome: 'Supino', series: 3, repeticoes: 10 },
                        { id: 2, nome: 'Remada', series: 3, repeticoes: 12 }
                    ]
                },
                exerciciosExecutados: [
                    {
                        exercicio_id: 1,
                        exercicio_nome: 'Supino',
                        serie_numero: 1,
                        peso_utilizado: 50,
                        repeticoes: 10,
                        timestamp: new Date().toISOString()
                    }
                ],
                startTime: Date.now() - (30 * 60 * 1000), // 30 minutos atrás
                currentExerciseIndex: 0,
                metadata: {
                    savedAt: new Date().toISOString(),
                    sessionId: 'test-' + Date.now()
                }
            };
            
            await TreinoCacheService.saveWorkoutState(testState);
            console.log('✅ Dados de teste criados');
            
            // Aguardar atualização do botão
            console.log('⏳ Aguardando atualização do botão...');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        // 2. Executar diagnóstico
        return await window.diagnoseRecoveryFlow();
        
    } catch (error) {
        console.error('❌ Erro no teste completo:', error);
        return { error: error.message };
    }
};

// Auto-executar se chamado diretamente
if (typeof module === 'undefined') {
    console.log('🚀 Script de diagnóstico carregado. Use:');
    console.log('- diagnoseRecoveryFlow() para diagnóstico completo');
    console.log('- testFullRecoveryFlow() para teste com dados de exemplo');
}