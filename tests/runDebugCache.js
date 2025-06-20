// Script para executar debugWorkoutCache e mostrar o resultado formatado

(async function() {
    console.log('🔍 Executando debugWorkoutCache()...\n');
    
    if (typeof debugWorkoutCache === 'function') {
        try {
            const result = await debugWorkoutCache();
            
            // Mostrar resultado formatado
            console.log('\n📊 RESULTADO DO DEBUG:');
            console.log('======================');
            
            if (result) {
                console.log('\n✅ Cache encontrado!');
                console.log('Progresso:', result.summary);
                console.log('\nDetalhes:');
                console.table({
                    'Treino': result.state?.currentWorkout?.nome || 'N/A',
                    'Exercícios executados': result.state?.exerciciosExecutados?.length || 0,
                    'Tempo decorrido': result.summary?.match(/\d+ min/)?.[0] || 'N/A',
                    'Sessão ativa': result.hasActive
                });
            }
        } catch (error) {
            console.error('❌ Erro ao executar debugWorkoutCache:', error);
        }
    } else {
        console.log('⚠️ debugWorkoutCache não está disponível');
        
        // Tentar acessar o cache diretamente
        console.log('\n🔧 Tentando acesso direto ao cache...');
        
        const cacheService = window.TreinoCacheService || window.workoutPersistence;
        if (cacheService) {
            try {
                const state = await cacheService.getWorkoutState();
                const hasActive = await cacheService.hasActiveWorkout();
                
                console.log('\n📦 Estado do Cache:');
                console.log('==================');
                console.log('Tem cache ativo:', hasActive);
                
                if (state) {
                    console.log('\nDados do treino:');
                    console.table({
                        'Nome': state.currentWorkout?.nome,
                        'Tipo': state.currentWorkout?.tipo,
                        'Total exercícios': state.currentWorkout?.exercicios?.length,
                        'Séries executadas': state.exerciciosExecutados?.length,
                        'Índice atual': state.currentExerciseIndex,
                        'Tempo início': new Date(state.startTime).toLocaleTimeString()
                    });
                    
                    if (state.exerciciosExecutados?.length > 0) {
                        console.log('\nÚltimas execuções:');
                        state.exerciciosExecutados.slice(-3).forEach((exec, i) => {
                            console.log(`  ${i + 1}. Exercício ${exec.exercicio_id}, Série ${exec.serie_numero}`);
                        });
                    }
                } else {
                    console.log('❌ Nenhum estado encontrado no cache');
                }
            } catch (error) {
                console.error('❌ Erro ao acessar cache:', error);
            }
        } else {
            console.log('❌ Nenhum serviço de cache disponível');
        }
    }
    
    // Verificar botão
    console.log('\n\n🔘 ESTADO DO BOTÃO:');
    console.log('===================');
    
    const button = document.querySelector('#contextual-workout-btn');
    if (button) {
        const buttonInfo = {
            'Estado (data-state)': button.getAttribute('data-state') || 'N/A',
            'Ação (data-action)': button.getAttribute('data-action') || 'N/A',
            'Texto': button.innerText.replace(/\n/g, ' '),
            'Desabilitado': button.disabled,
            'Classes': button.className
        };
        console.table(buttonInfo);
        
        // Verificar se precisa forçar atualização
        if (!button.getAttribute('data-state') || button.getAttribute('data-state') === 'start') {
            console.log('\n⚠️ Botão não está no estado "resume". Tentando forçar atualização...');
            
            // Disparar evento
            window.dispatchEvent(new CustomEvent('workout-cache-updated', {
                detail: { hasCache: true }
            }));
            
            // Se houver instância do botão
            if (window.contextualWorkoutButton?.forceUpdate) {
                await window.contextualWorkoutButton.forceUpdate();
                console.log('✅ forceUpdate executado');
                
                // Verificar novo estado
                setTimeout(() => {
                    console.log('Novo estado do botão:', button.getAttribute('data-state'));
                }, 500);
            } else {
                console.log('❌ Instância do botão não encontrada (window.contextualWorkoutButton)');
            }
        }
    } else {
        console.log('❌ Botão #contextual-workout-btn não encontrado no DOM');
    }
})();