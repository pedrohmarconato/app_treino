/**
 * 🔍 DIAGNÓSTICO E CORREÇÃO DO PROBLEMA DE FINALIZAÇÃO DE TREINO
 * 
 * Este arquivo contém funções para diagnosticar e corrigir problemas
 * relacionados à finalização de treino e exibição do modal de conclusão.
 */

// Função para diagnosticar o problema
export function diagnosticarProblemaFinalizacao() {
    console.log('\n🔍 === DIAGNÓSTICO DO PROBLEMA DE FINALIZAÇÃO ===');
    
    // 1. Verificar se o app está em modo de treino
    const workoutStartTime = AppState.get('workoutStartTime');
    const currentWorkout = AppState.get('currentWorkout');
    const execucoesCache = AppState.get('execucoesCache') || [];
    
    console.log('📊 Estado atual:');
    console.log(`  - Treino iniciado: ${workoutStartTime ? 'SIM' : 'NÃO'}`);
    console.log(`  - Treino atual: ${currentWorkout ? 'SIM' : 'NÃO'}`);
    console.log(`  - Execuções: ${execucoesCache.length}`);
    
    // 2. Verificar se as funções necessárias existem
    console.log('🔧 Funções disponíveis:');
    console.log(`  - finalizarTreino: ${typeof window.finalizarTreino === 'function' ? 'OK' : 'AUSENTE'}`);
    console.log(`  - WorkoutCompletionService: ${typeof window.WorkoutCompletionService === 'object' ? 'OK' : 'AUSENTE'}`);
    console.log(`  - showNotification: ${typeof window.showNotification === 'function' ? 'OK' : 'AUSENTE'}`);
    
    // 3. Verificar DOM elements
    console.log('🎯 Elementos DOM:');
    const workoutCompletion = document.getElementById('workout-completion');
    const btnFinish = document.getElementById('btn-finish');
    console.log(`  - Modal conclusão: ${workoutCompletion ? 'OK' : 'AUSENTE'}`);
    console.log(`  - Botão finalizar: ${btnFinish ? 'OK' : 'AUSENTE'}`);
    
    // 4. Verificar se há erros anteriores
    console.log('💾 Estados salvos:');
    const completionState = localStorage.getItem('workout_completion_state');
    const errorState = localStorage.getItem('workout_error_state');
    console.log(`  - Estado conclusão: ${completionState ? 'PRESENTE' : 'AUSENTE'}`);
    console.log(`  - Estado erro: ${errorState ? 'PRESENTE' : 'AUSENTE'}`);
    
    // 5. Verificar se há console errors
    console.log('⚠️ Possíveis problemas:');
    const problemas = [];
    
    if (!workoutStartTime) {
        problemas.push('Treino não foi iniciado corretamente');
    }
    
    if (execucoesCache.length === 0) {
        problemas.push('Nenhuma execução registrada');
    }
    
    if (typeof window.finalizarTreino !== 'function') {
        problemas.push('Função finalizarTreino não está disponível');
    }
    
    if (!workoutCompletion) {
        problemas.push('Modal de conclusão não existe no DOM');
    }
    
    if (problemas.length > 0) {
        console.log('❌ Problemas encontrados:');
        problemas.forEach(problema => console.log(`  - ${problema}`));
    } else {
        console.log('✅ Nenhum problema óbvio encontrado');
    }
    
    console.log('=== FIM DO DIAGNÓSTICO ===\n');
    
    return {
        temTreino: !!workoutStartTime,
        temExecucoes: execucoesCache.length > 0,
        temFuncoes: typeof window.finalizarTreino === 'function',
        temModal: !!workoutCompletion,
        problemas
    };
}

// Função para testar a finalização manualmente
export async function testarFinalizacaoManual() {
    console.log('\n🧪 === TESTE MANUAL DE FINALIZAÇÃO ===');
    
    const diagnostico = diagnosticarProblemaFinalizacao();
    
    if (!diagnostico.temTreino) {
        console.log('❌ Não é possível testar - treino não iniciado');
        return false;
    }
    
    try {
        console.log('🚀 Iniciando teste de finalização...');
        
        // Tentar finalizar usando o serviço
        const { WorkoutCompletionService } = await import('./services/workoutCompletionService.js');
        
        const resultado = await WorkoutCompletionService.finalizarTreino({
            teste: true,
            timestamp: new Date().toISOString()
        });
        
        console.log('📊 Resultado do teste:', resultado);
        
        if (resultado.sucesso) {
            console.log('✅ Teste bem-sucedido!');
            return true;
        } else {
            console.log('⚠️ Teste com problemas:', resultado.erro);
            return false;
        }
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
        return false;
    }
}

// Função para forçar exibição do modal
export async function forcarExibicaoModal() {
    console.log('\n🎯 === FORÇAR EXIBIÇÃO DO MODAL ===');
    
    try {
        // Simular dados de treino
        const dadosSimulados = {
            tempo_total_minutos: 45,
            total_series: 12,
            peso_total_levantado: 850,
            repeticoes_totais: 96,
            exercicios_unicos: 4
        };
        
        console.log('📦 Carregando modal de sucesso...');
        
        const { WorkoutSuccessModal } = await import('./components/workoutSuccessModal.js');
        
        console.log('🎉 Exibindo modal...');
        await WorkoutSuccessModal.mostrar(dadosSimulados);
        
        console.log('✅ Modal exibido com sucesso!');
        return true;
        
    } catch (error) {
        console.error('❌ Erro ao exibir modal:', error);
        return false;
    }
}

// Função para corrigir problemas comuns
export function corrigirProblemasComuns() {
    console.log('\n🔧 === CORREÇÃO DE PROBLEMAS COMUNS ===');
    
    const correcoes = [];
    
    // 1. Garantir que funções globais existam
    if (typeof window.finalizarTreino !== 'function') {
        console.log('🔄 Carregando função finalizarTreino...');
        import('./feature/workout.js').then(() => {
            console.log('✅ Função finalizarTreino carregada');
        });
        correcoes.push('Função finalizarTreino carregada');
    }
    
    // 2. Limpar estados de erro
    if (localStorage.getItem('workout_error_state')) {
        console.log('🧹 Limpando estado de erro...');
        localStorage.removeItem('workout_error_state');
        correcoes.push('Estado de erro limpo');
    }
    
    // 3. Verificar modal no DOM
    if (!document.getElementById('workout-completion')) {
        console.log('🔨 Criando modal de conclusão...');
        const modalHtml = `
            <div id="workout-completion" class="modal-overlay" style="display: none;">
                <div class="modal-content">
                    <h2>Treino Concluído!</h2>
                    <p>Parabéns! Você completou seu treino.</p>
                    <button onclick="window.location.href='#home'">Voltar ao Início</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        correcoes.push('Modal de conclusão criado');
    }
    
    // 4. Verificar se há execuções orfãs
    const execucoesTemp = localStorage.getItem('treino_execucoes_temp');
    if (execucoesTemp) {
        console.log('🔄 Restaurando execuções temporárias...');
        try {
            const execucoes = JSON.parse(execucoesTemp);
            AppState.set('execucoesCache', execucoes);
            correcoes.push('Execuções temporárias restauradas');
        } catch (error) {
            console.error('Erro ao restaurar execuções:', error);
        }
    }
    
    console.log(`✅ Correções aplicadas: ${correcoes.length}`);
    correcoes.forEach(correcao => console.log(`  - ${correcao}`));
    
    return correcoes;
}

// Função para salvar backup dos dados antes de finalizar
export function salvarBackupDados() {
    console.log('\n💾 === SALVANDO BACKUP DOS DADOS ===');
    
    const dadosBackup = {
        timestamp: new Date().toISOString(),
        workoutStartTime: AppState.get('workoutStartTime'),
        currentWorkout: AppState.get('currentWorkout'),
        currentUser: AppState.get('currentUser'),
        execucoesCache: AppState.get('execucoesCache') || [],
        restTime: AppState.get('restTime')
    };
    
    const backupKey = `workout_backup_${Date.now()}`;
    localStorage.setItem(backupKey, JSON.stringify(dadosBackup));
    
    console.log(`✅ Backup salvo em: ${backupKey}`);
    console.log(`📊 Dados salvos: ${dadosBackup.execucoesCache.length} execuções`);
    
    return backupKey;
}

// Expor funções globalmente para uso no console
window.diagnosticarProblemaFinalizacao = diagnosticarProblemaFinalizacao;
window.testarFinalizacaoManual = testarFinalizacaoManual;
window.forcarExibicaoModal = forcarExibicaoModal;
window.corrigirProblemasComuns = corrigirProblemasComuns;
window.salvarBackupDados = salvarBackupDados;

export default {
    diagnosticarProblemaFinalizacao,
    testarFinalizacaoManual,
    forcarExibicaoModal,
    corrigirProblemasComuns,
    salvarBackupDados
};