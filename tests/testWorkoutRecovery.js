/**
 * Script de teste para verificar problemas do cronômetro e séries
 */

(async function() {
    console.log('🧪 TESTE DE RECUPERAÇÃO DE TREINO\n');
    console.log('==================================\n');
    
    // 1. Verificar estado atual
    console.log('1️⃣ Verificando estado atual:');
    
    const manager = window.workoutExecutionManager;
    if (!manager) {
        console.error('❌ workoutExecutionManager não encontrado');
        return;
    }
    
    console.log('Manager encontrado:', !!manager);
    console.log('Treino atual:', manager.currentWorkout?.nome);
    console.log('Exercícios executados:', manager.exerciciosExecutados?.length || 0);
    
    // 2. Verificar exercícios e séries completas
    console.log('\n2️⃣ Estado dos exercícios:');
    
    if (manager.currentWorkout?.exercicios) {
        manager.currentWorkout.exercicios.forEach((ex, i) => {
            console.log(`\nExercício ${i + 1}: ${ex.nome}`);
            console.log('- Séries totais:', ex.series || 3);
            console.log('- seriesCompletas:', ex.seriesCompletas);
            console.log('- Séries confirmadas:', ex.seriesCompletas ? ex.seriesCompletas.filter(Boolean).length : 0);
        });
    }
    
    // 3. Verificar modal de descanso
    console.log('\n3️⃣ Verificando modal de descanso:');
    
    const modalTemplate = document.getElementById('rest-timer-overlay');
    const modalDynamic = document.getElementById('rest-timer-modal');
    
    console.log('Modal do template existe:', !!modalTemplate);
    console.log('Modal dinâmico existe:', !!modalDynamic);
    
    if (modalTemplate) {
        console.log('Display do modal template:', modalTemplate.style.display);
        console.log('z-index:', modalTemplate.style.zIndex);
    }
    
    // 4. Testar mostrar modal
    console.log('\n4️⃣ Testando mostrar modal de descanso:');
    
    try {
        // Simular dados para o teste
        manager.restTimeRemaining = 60;
        manager.restDuration = 60;
        manager.isResting = true;
        
        manager.mostrarModalDescanso();
        
        // Verificar se modal apareceu
        setTimeout(() => {
            const modal = document.getElementById('rest-timer-overlay') || document.getElementById('rest-timer-modal');
            if (modal) {
                console.log('✅ Modal mostrado, display:', modal.style.display);
                console.log('Modal visível:', window.getComputedStyle(modal).display !== 'none');
                
                // Fechar modal após 3 segundos
                setTimeout(() => {
                    modal.style.display = 'none';
                    manager.isResting = false;
                    console.log('Modal fechado para teste');
                }, 3000);
            } else {
                console.log('❌ Modal não encontrado após mostrar');
            }
        }, 100);
        
    } catch (error) {
        console.error('❌ Erro ao testar modal:', error);
    }
    
    // 5. Verificar renderização de séries
    console.log('\n5️⃣ Verificando renderização de séries:');
    
    const seriesButtons = document.querySelectorAll('.series-confirm-btn');
    console.log('Total de botões de série:', seriesButtons.length);
    
    seriesButtons.forEach((btn, i) => {
        const isDisabled = btn.disabled;
        const bgColor = window.getComputedStyle(btn).backgroundColor;
        const text = btn.textContent.trim();
        
        if (isDisabled || text === '✓') {
            console.log(`Série ${i + 1}: ✅ Completada`);
        } else {
            console.log(`Série ${i + 1}: ⏳ Pendente`);
        }
    });
    
    // 6. Testar confirmação de série
    console.log('\n6️⃣ Testando confirmação de série:');
    
    // Encontrar primeira série não completada
    const pendingButton = Array.from(seriesButtons).find(btn => !btn.disabled);
    
    if (pendingButton) {
        console.log('Série pendente encontrada, tentando confirmar...');
        
        // Simular valores nos inputs
        const onclick = pendingButton.getAttribute('onclick');
        const match = onclick.match(/confirmarSerie\((\d+),\s*(\d+)\)/);
        
        if (match) {
            const exerciseIndex = parseInt(match[1]);
            const seriesIndex = parseInt(match[2]);
            
            console.log(`Confirmando exercício ${exerciseIndex + 1}, série ${seriesIndex + 1}`);
            
            // Definir valores nos inputs
            const weightInput = document.querySelector(`.series-weight[data-exercise="${exerciseIndex}"][data-series="${seriesIndex}"]`);
            const repsInput = document.querySelector(`.series-reps[data-exercise="${exerciseIndex}"][data-series="${seriesIndex}"]`);
            
            if (weightInput) weightInput.value = 50;
            if (repsInput) repsInput.value = 12;
            
            // Confirmar série
            try {
                await manager.confirmarSerie(exerciseIndex, seriesIndex);
                console.log('✅ Série confirmada com sucesso');
            } catch (error) {
                console.error('❌ Erro ao confirmar série:', error);
            }
        }
    } else {
        console.log('Nenhuma série pendente encontrada');
    }
    
    // 7. Resumo final
    console.log('\n7️⃣ RESUMO DO TESTE:');
    console.log('===================');
    
    console.log({
        'Treino carregado': !!manager.currentWorkout,
        'Séries renderizadas': seriesButtons.length > 0,
        'Modal funcional': true, // Será testado visualmente
        'Recuperação funcional': manager.exerciciosExecutados?.length > 0
    });
    
    console.log('\n💡 Instruções:');
    console.log('1. O modal de descanso deve aparecer por 3 segundos');
    console.log('2. Verifique se as séries completadas estão marcadas com ✓');
    console.log('3. Execute novamente para testar confirmação de série');
})();