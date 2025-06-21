/**
 * Verificar estado visual das séries após recuperação
 */

(function() {
    console.log('🔍 VERIFICANDO ESTADO VISUAL DAS SÉRIES\n');
    console.log('======================================\n');
    
    // 1. Verificar todos os botões de série
    const seriesButtons = document.querySelectorAll('.series-confirm-btn');
    console.log(`Total de botões de série encontrados: ${seriesButtons.length}\n`);
    
    // 2. Analisar cada botão
    const analysis = [];
    
    seriesButtons.forEach((btn, index) => {
        const onclick = btn.getAttribute('onclick');
        const match = onclick?.match(/confirmarSerie\((\d+),\s*(\d+)\)/);
        
        if (match) {
            const exerciseIndex = parseInt(match[1]);
            const seriesIndex = parseInt(match[2]);
            
            const state = {
                exercicio: exerciseIndex + 1,
                serie: seriesIndex + 1,
                disabled: btn.disabled,
                texto: btn.textContent.trim(),
                backgroundColor: window.getComputedStyle(btn).backgroundColor,
                isCompleted: btn.disabled || btn.textContent.trim() === '✓'
            };
            
            analysis.push(state);
        }
    });
    
    // 3. Agrupar por exercício
    console.log('📊 Estado das séries por exercício:\n');
    
    const byExercise = {};
    analysis.forEach(item => {
        if (!byExercise[item.exercicio]) {
            byExercise[item.exercicio] = [];
        }
        byExercise[item.exercicio].push(item);
    });
    
    // 4. Mostrar estado de cada exercício
    Object.keys(byExercise).forEach(exNum => {
        const series = byExercise[exNum];
        const completed = series.filter(s => s.isCompleted).length;
        const total = series.length;
        
        console.log(`Exercício ${exNum}: ${completed}/${total} séries completas`);
        
        series.forEach(s => {
            const status = s.isCompleted ? '✅' : '⏳';
            const color = s.isCompleted ? 'verde' : 'amarelo';
            console.log(`  - Série ${s.serie}: ${status} (${color})`);
        });
        
        console.log('');
    });
    
    // 5. Verificar dados do manager
    console.log('📝 Dados do WorkoutExecutionManager:\n');
    
    const manager = window.workoutExecutionManager;
    if (manager?.currentWorkout?.exercicios) {
        manager.currentWorkout.exercicios.forEach((ex, i) => {
            const seriesCompletas = ex.seriesCompletas || [];
            const completedCount = seriesCompletas.filter(Boolean).length;
            
            console.log(`${ex.nome}:`);
            console.log(`  - Array seriesCompletas: [${seriesCompletas.join(', ')}]`);
            console.log(`  - Séries completadas: ${completedCount}/${ex.series || 3}`);
            console.log('');
        });
    }
    
    // 6. Testar atualização visual
    console.log('🎯 Para testar a atualização visual:\n');
    console.log('1. Execute: testConfirmSeries(0, 0) para confirmar exercício 1, série 1');
    console.log('2. Execute: testConfirmSeries(0, 1) para confirmar exercício 1, série 2');
    console.log('3. E assim por diante...\n');
    
    // Função auxiliar para teste
    window.testConfirmSeries = async function(exerciseIndex, seriesIndex) {
        try {
            // Definir valores de teste
            const weightInput = document.querySelector(`.series-weight[data-exercise="${exerciseIndex}"][data-series="${seriesIndex}"]`);
            const repsInput = document.querySelector(`.series-reps[data-exercise="${exerciseIndex}"][data-series="${seriesIndex}"]`);
            
            if (weightInput) weightInput.value = 50;
            if (repsInput) repsInput.value = 12;
            
            // Confirmar
            await window.workoutExecutionManager.confirmarSerie(exerciseIndex, seriesIndex);
            
            console.log(`✅ Série ${seriesIndex + 1} do exercício ${exerciseIndex + 1} confirmada!`);
            console.log('Modal de descanso deve aparecer em seguida...');
            
        } catch (error) {
            console.error('❌ Erro:', error);
        }
    };
    
    // 7. Resumo
    const totalButtons = analysis.length;
    const completedButtons = analysis.filter(a => a.isCompleted).length;
    const percentage = totalButtons > 0 ? Math.round((completedButtons / totalButtons) * 100) : 0;
    
    console.log('📈 RESUMO GERAL:');
    console.log('================');
    console.log(`Total de séries: ${totalButtons}`);
    console.log(`Séries completadas: ${completedButtons}`);
    console.log(`Progresso: ${percentage}%`);
    
    if (completedButtons === 0) {
        console.log('\n⚠️ Nenhuma série marcada como completa!');
        console.log('Isso pode indicar que o estado não foi recuperado corretamente.');
    }
})();