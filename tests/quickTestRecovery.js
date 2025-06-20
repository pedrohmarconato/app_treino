/**
 * Script de teste rápido para o sistema de recuperação
 * Execute este script no console para testar o fluxo completo
 */

// Função principal de teste
async function testRecoverySystem() {
    console.log('🧪 INICIANDO TESTE DO SISTEMA DE RECUPERAÇÃO\n');
    
    const results = {
        preparation: false,
        workoutStart: false,
        progressSave: false,
        buttonUpdate: false,
        recovery: false
    };
    
    try {
        // 1. Preparação
        console.log('1️⃣ Preparando ambiente...');
        
        // Verificar dependências
        const deps = {
            manager: !!window.workoutExecutionManager,
            cache: !!(window.TreinoCacheService || window.workoutPersistence),
            button: !!document.querySelector('#contextual-workout-btn'),
            state: !!window.AppState
        };
        
        console.log('Dependências:', deps);
        
        if (!Object.values(deps).every(v => v)) {
            throw new Error('Dependências faltando. Recarregue a página.');
        }
        
        results.preparation = true;
        console.log('✅ Ambiente preparado\n');
        
        // 2. Criar dados de teste
        console.log('2️⃣ Criando treino de teste...');
        
        const mockWorkout = {
            id: 'test-' + Date.now(),
            nome: 'Treino de Teste - Recovery',
            tipo: 'A',
            exercicios: [
                {
                    id: 'ex1',
                    nome: 'Supino Reto',
                    series: 3,
                    repeticoes: '12',
                    carga: 80,
                    descanso: 60
                },
                {
                    id: 'ex2',
                    nome: 'Desenvolvimento',
                    series: 3,
                    repeticoes: '10',
                    carga: 60,
                    descanso: 60
                },
                {
                    id: 'ex3',
                    nome: 'Tríceps Pulley',
                    series: 3,
                    repeticoes: '15',
                    carga: 40,
                    descanso: 45
                }
            ]
        };
        
        // Simular algumas execuções
        const mockExecutions = [
            {
                exercicio_id: 'ex1',
                serie_numero: 1,
                repeticoes_realizadas: 12,
                carga_utilizada: 80,
                timestamp: Date.now() - 300000, // 5 min atrás
                tempo_descanso: 60
            },
            {
                exercicio_id: 'ex1',
                serie_numero: 2,
                repeticoes_realizadas: 10,
                carga_utilizada: 80,
                timestamp: Date.now() - 180000, // 3 min atrás
                tempo_descanso: 60
            }
        ];
        
        // Criar estado de teste
        const testState = {
            currentWorkout: mockWorkout,
            exerciciosExecutados: mockExecutions,
            currentExerciseIndex: 0,
            startTime: Date.now() - 360000, // 6 minutos atrás
            totalDuration: 360000,
            isActive: true
        };
        
        // Salvar no cache
        if (window.TreinoCacheService) {
            await window.TreinoCacheService.saveWorkoutState(testState);
        } else if (window.workoutPersistence) {
            await window.workoutPersistence.saveWorkoutState(testState);
        } else {
            // Tentar acessar diretamente via localStorage
            localStorage.setItem('workout_state', JSON.stringify(testState));
            localStorage.setItem('workout_cache_timestamp', Date.now().toString());
        }
        console.log('✅ Dados de teste criados e salvos\n');
        
        results.progressSave = true;
        
        // 3. Verificar botão
        console.log('3️⃣ Verificando atualização do botão...');
        
        // Forçar atualização
        if (window.contextualWorkoutButton) {
            await window.contextualWorkoutButton.forceUpdate();
        }
        
        // Aguardar um pouco
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const button = document.querySelector('#contextual-workout-btn');
        const buttonState = button?.getAttribute('data-state');
        const buttonText = button?.innerText;
        
        console.log('Estado do botão:', {
            state: buttonState,
            text: buttonText,
            esperado: 'resume'
        });
        
        if (buttonState === 'resume') {
            results.buttonUpdate = true;
            console.log('✅ Botão atualizado corretamente\n');
        } else {
            console.log('⚠️ Botão não mudou para estado resume\n');
        }
        
        // 4. Testar recuperação
        console.log('4️⃣ Testando recuperação...');
        
        // Verificar se estamos na tela inicial
        const currentScreen = document.querySelector('.screen.active')?.id;
        console.log('Tela atual:', currentScreen);
        
        if (currentScreen !== 'home-screen') {
            // Voltar para home primeiro
            if (window.renderTemplate) {
                await window.renderTemplate('home');
            } else {
                window.location.href = '/';
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Simular clique no botão
        console.log('Simulando clique em "Voltar ao Treino"...');
        
        try {
            if (window.workoutExecutionManager?.resumeFromCache) {
                await window.workoutExecutionManager.resumeFromCache(testState);
                results.recovery = true;
            } else if (window.resumeWorkout) {
                await window.resumeWorkout(testState);
                results.recovery = true;
            } else {
                throw new Error('Função de recuperação não encontrada');
            }
            
            // Aguardar navegação
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Verificar se estamos na tela de workout
            const newScreen = document.querySelector('.screen.active')?.id;
            const workoutVisible = document.querySelector('#workout-screen')?.style.display !== 'none';
            
            console.log('Resultado da navegação:', {
                telaAtual: newScreen,
                workoutVisivel: workoutVisible,
                sucesso: newScreen === 'workout-screen' || workoutVisible
            });
            
            if (newScreen === 'workout-screen' || workoutVisible) {
                console.log('✅ Recuperação bem-sucedida!\n');
            } else {
                console.log('⚠️ Navegação não completou corretamente\n');
                results.recovery = false;
            }
            
        } catch (error) {
            console.error('❌ Erro na recuperação:', error);
            results.recovery = false;
        }
        
        // 5. Relatório final
        console.log('📊 RELATÓRIO FINAL:');
        console.log('==================');
        
        const successCount = Object.values(results).filter(v => v).length;
        const totalTests = Object.keys(results).length;
        
        console.table(results);
        
        console.log(`\nTestes bem-sucedidos: ${successCount}/${totalTests}`);
        
        if (successCount === totalTests) {
            console.log('🎉 TODOS OS TESTES PASSARAM!');
        } else {
            console.log('⚠️ Alguns testes falharam. Verifique os logs acima.');
        }
        
        // Limpar dados de teste
        console.log('\n🧹 Limpando dados de teste...');
        if (window.TreinoCacheService?.clearWorkoutState) {
            await window.TreinoCacheService.clearWorkoutState();
        } else if (window.workoutPersistence?.clearWorkoutState) {
            await window.workoutPersistence.clearWorkoutState();
        } else {
            localStorage.removeItem('workout_state');
            localStorage.removeItem('workout_cache_timestamp');
        }
        
        return results;
        
    } catch (error) {
        console.error('❌ ERRO FATAL NO TESTE:', error);
        return results;
    }
}

// Função para teste manual passo a passo
async function manualTestSteps() {
    console.log('📋 TESTE MANUAL PASSO A PASSO\n');
    
    const steps = [
        {
            name: 'Limpar cache',
            action: async () => {
                localStorage.clear();
                sessionStorage.clear();
                console.log('✅ Cache limpo');
            }
        },
        {
            name: 'Criar treino de teste',
            action: async () => {
                const state = {
                    currentWorkout: {
                        nome: 'Treino Teste',
                        exercicios: [
                            { id: 'ex1', nome: 'Flexão', series: 3 },
                            { id: 'ex2', nome: 'Abdominais', series: 3 }
                        ]
                    },
                    exerciciosExecutados: [
                        { exercicio_id: 'ex1', serie_numero: 1 }
                    ],
                    startTime: Date.now() - 60000,
                    currentExerciseIndex: 0
                };
                if (window.TreinoCacheService) {
                    await window.TreinoCacheService.saveWorkoutState(state);
                } else if (window.workoutPersistence) {
                    await window.workoutPersistence.saveWorkoutState(state);
                } else {
                    localStorage.setItem('workout_state', JSON.stringify(state));
                    localStorage.setItem('workout_cache_timestamp', Date.now().toString());
                }
                console.log('✅ Treino salvo no cache');
            }
        },
        {
            name: 'Atualizar botão',
            action: async () => {
                if (window.contextualWorkoutButton) {
                    await window.contextualWorkoutButton.forceUpdate();
                }
                await new Promise(r => setTimeout(r, 1000));
                const btn = document.querySelector('#contextual-workout-btn');
                console.log('✅ Botão estado:', btn?.getAttribute('data-state'));
            }
        },
        {
            name: 'Testar navegação',
            action: async () => {
                if (window.workoutExecutionManager) {
                    await window.workoutExecutionManager.navegarParaTelaWorkout();
                    console.log('✅ Navegação executada');
                } else {
                    console.log('❌ Manager não disponível');
                }
            }
        },
        {
            name: 'Verificar resultado',
            action: async () => {
                const screen = document.querySelector('#workout-screen');
                const visible = screen && screen.style.display !== 'none';
                console.log(visible ? '✅ Tela de workout visível' : '❌ Tela não visível');
            }
        }
    ];
    
    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        console.log(`\nPasso ${i + 1}: ${step.name}`);
        console.log('Pressione Enter para executar...');
        
        await new Promise(resolve => {
            const handler = (e) => {
                if (e.key === 'Enter') {
                    document.removeEventListener('keypress', handler);
                    resolve();
                }
            };
            document.addEventListener('keypress', handler);
        });
        
        await step.action();
    }
    
    console.log('\n✅ Teste manual concluído!');
}

// Exportar funções globalmente
window.testRecoverySystem = testRecoverySystem;
window.manualTestSteps = manualTestSteps;

// Instruções
console.log('🧪 TESTE DE RECUPERAÇÃO CARREGADO');
console.log('=====================================');
console.log('Use uma das seguintes funções:\n');
console.log('1. testRecoverySystem() - Teste automático completo');
console.log('2. manualTestSteps() - Teste passo a passo interativo');
console.log('\nExemplo: await testRecoverySystem()');