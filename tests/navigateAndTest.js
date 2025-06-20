/**
 * Script para navegar para a tela correta e testar o botão
 */

(async function() {
    console.log('🧭 Verificando navegação e botão contextual...\n');
    
    // 1. Verificar tela atual
    const currentScreen = document.querySelector('.screen.active');
    const allScreens = Array.from(document.querySelectorAll('.screen')).map(s => ({
        id: s.id,
        active: s.classList.contains('active'),
        visible: window.getComputedStyle(s).display !== 'none'
    }));
    
    console.log('📱 Tela atual:', currentScreen?.id || 'Nenhuma');
    console.log('📋 Todas as telas:');
    console.table(allScreens);
    
    // 2. Verificar se estamos na tela de workout
    const isOnWorkout = currentScreen?.id === 'workout-screen' || 
                       document.querySelector('#workout-screen')?.style.display !== 'none';
    
    if (isOnWorkout) {
        console.log('✅ Já estamos na tela de workout');
        console.log('ℹ️ O botão contextual só aparece na tela inicial (home)');
        
        // Mostrar opções
        console.log('\n🎯 OPÇÕES:');
        console.log('1. Para voltar à tela inicial e ver o botão:');
        console.log('   window.location.href = "/";');
        console.log('\n2. Para salvar e sair do treino atual:');
        console.log('   await workoutExecutionManager.salvarESair();');
        
        // Verificar estado do treino atual
        if (window.workoutExecutionManager) {
            const state = window.workoutExecutionManager.getState();
            console.log('\n📊 Estado do treino atual:');
            console.table({
                'Treino': state.currentWorkout?.nome,
                'Exercícios executados': state.exerciciosExecutados?.length,
                'Tempo decorrido': state.totalDuration ? Math.round(state.totalDuration / 60000) + ' min' : 'N/A',
                'Ativo': state.isActive
            });
        }
    } else {
        console.log('❌ Não estamos na tela de workout');
        
        // 3. Procurar o botão em outras telas
        console.log('\n🔍 Procurando botão contextual...');
        
        const button = document.querySelector('#contextual-workout-btn');
        const buttonInHome = document.querySelector('#home-screen #contextual-workout-btn');
        const anyButton = document.querySelector('[data-action="resumeWorkout"], [data-action="startWorkout"]');
        
        console.log('Botão encontrado:', {
            '#contextual-workout-btn': !!button,
            'No home-screen': !!buttonInHome,
            'Qualquer botão de treino': !!anyButton
        });
        
        // 4. Se não estamos na home, navegar
        if (currentScreen?.id !== 'home-screen') {
            console.log('\n🏠 Navegando para tela inicial...');
            
            if (window.renderTemplate) {
                await window.renderTemplate('home');
            } else {
                window.location.href = '/';
            }
            
            // Aguardar navegação
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Verificar novamente
            const newButton = document.querySelector('#contextual-workout-btn');
            if (newButton) {
                console.log('✅ Botão encontrado após navegação!');
                
                // Verificar estado
                const buttonState = {
                    'Estado': newButton.getAttribute('data-state'),
                    'Texto': newButton.innerText.replace(/\n/g, ' '),
                    'Ação': newButton.getAttribute('data-action')
                };
                console.table(buttonState);
                
                // Se o botão estiver em "start" mas temos cache, forçar atualização
                if (buttonState.Estado === 'start' || !buttonState.Estado) {
                    console.log('\n🔄 Forçando atualização do botão...');
                    
                    // Tentar criar instância se não existir
                    if (!window.contextualWorkoutButton && window.ContextualWorkoutButton) {
                        window.contextualWorkoutButton = new window.ContextualWorkoutButton(newButton);
                        console.log('✅ Nova instância criada');
                    }
                    
                    // Forçar atualização
                    if (window.contextualWorkoutButton?.forceUpdate) {
                        await window.contextualWorkoutButton.forceUpdate();
                        
                        // Aguardar e verificar
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        
                        console.log('Novo estado:', newButton.getAttribute('data-state'));
                    }
                }
            }
        }
    }
    
    // 5. Resumo final
    console.log('\n📝 RESUMO:');
    console.log('===========');
    
    const cacheService = window.TreinoCacheService || window.workoutPersistence;
    if (cacheService) {
        const hasCache = await cacheService.hasActiveWorkout();
        const state = await cacheService.getWorkoutState();
        
        console.log('Cache ativo:', hasCache);
        console.log('Treino no cache:', state?.currentWorkout?.nome || 'N/A');
        console.log('Progresso:', state?.exerciciosExecutados?.length || 0, 'séries');
    }
    
    console.log('\n💡 PRÓXIMOS PASSOS:');
    if (isOnWorkout) {
        console.log('1. Você está no treino. Para testar o botão de recuperação:');
        console.log('   - Salve e saia: await workoutExecutionManager.salvarESair()');
        console.log('   - Ou volte à home: window.location.href = "/"');
    } else {
        console.log('1. Verifique se o botão apareceu na tela inicial');
        console.log('2. Se aparecer "Voltar ao Treino", clique para testar');
        console.log('3. Se aparecer "Iniciar Treino", execute:');
        console.log('   await testRecoverySystem()');
    }
})();