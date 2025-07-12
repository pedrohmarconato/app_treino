/**
 * 🔧 DEBUG E TESTE DA FINALIZAÇÃO DE TREINO
 * 
 * Ferramentas para diagnosticar e testar o sistema de finalização
 */

/**
 * Função principal de debug
 */
window.debugWorkoutCompletion = async function() {
    console.log('🔧 === INICIANDO DEBUG DE FINALIZAÇÃO ===');
    
    try {
        // 1. Importar serviço
        const { WorkoutCompletionService } = await import('../services/workoutCompletionService.js');
        
        // 2. Executar diagnóstico
        await WorkoutCompletionService.diagnosticarEstadoTreino();
        
        // 3. Verificar dados necessários
        const currentUser = AppState?.get('currentUser');
        const execucoesCache = AppState?.get('execucoesCache') || [];
        
        if (!currentUser) {
            console.error('❌ PROBLEMA CRÍTICO: Usuário não encontrado no AppState');
            console.log('💡 Soluções:');
            console.log('   1. Fazer login novamente');
            console.log('   2. Verificar se AppState.set("currentUser", user) foi chamado');
            return false;
        }
        
        if (execucoesCache.length === 0) {
            console.error('❌ PROBLEMA: Nenhuma execução encontrada no cache');
            console.log('💡 Soluções:');
            console.log('   1. Executar pelo menos uma série de exercício');
            console.log('   2. Verificar se AppState.set("execucoesCache", [...]) está funcionando');
            return false;
        }
        
        // 4. Testar salvamento individual
        console.log('🧪 Testando salvamento de uma execução...');
        const primeiraExecucao = execucoesCache[0];
        console.log('Dados da primeira execução:', primeiraExecucao);
        
        // 5. Verificar conexão com Supabase
        console.log('🗄️ Testando conexão com Supabase...');
        try {
            const { supabase } = await import('../services/supabaseService.js');
            const { data, error } = await supabase.from('usuarios').select('id').eq('id', currentUser.id).single();
            
            if (error) {
                console.error('❌ Erro na consulta Supabase:', error);
                return false;
            } else {
                console.log('✅ Conexão Supabase OK');
            }
        } catch (error) {
            console.error('❌ Erro ao importar Supabase:', error);
            return false;
        }
        
        console.log('✅ Debug concluído - sistema parece estar funcionando');
        return true;
        
    } catch (error) {
        console.error('❌ Erro no debug:', error);
        return false;
    }
};

/**
 * Testar finalização simulada
 */
window.testWorkoutCompletion = async function() {
    console.log('🧪 === TESTE DE FINALIZAÇÃO SIMULADA ===');
    
    try {
        // Verificar se há dados para testar
        const execucoesCache = AppState?.get('execucoesCache') || [];
        const currentUser = AppState?.get('currentUser');
        
        if (!currentUser || execucoesCache.length === 0) {
            console.error('❌ Não há dados suficientes para testar');
            console.log('Use debugWorkoutCompletion() primeiro');
            return false;
        }
        
        // Importar e executar
        const { WorkoutCompletionService } = await import('../services/workoutCompletionService.js');
        
        console.log('🚀 Iniciando teste de finalização...');
        const resultado = await WorkoutCompletionService.finalizarTreino({
            teste: true,
            observacoes: 'Teste de debug'
        });
        
        console.log('📊 Resultado do teste:', resultado);
        
        if (resultado.sucesso) {
            console.log('✅ TESTE PASSOU - Finalização funcionando!');
        } else {
            console.log('⚠️ TESTE FALHOU - Verificar erros acima');
        }
        
        return resultado.sucesso;
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
        return false;
    }
};

/**
 * Simular dados de treino para teste
 */
window.simularDadosTreino = function() {
    console.log('🎭 Simulando dados de treino...');
    
    // Simular usuário
    const usuarioTeste = {
        id: 1,
        nome: 'Teste',
        email: 'teste@teste.com'
    };
    
    // Simular execuções
    const execucoesTeste = [
        {
            exercicio_id: 1,
            exercicio_nome: 'Supino',
            peso_utilizado: 80,
            repeticoes_realizadas: 10,
            series_numero: 1,
            usuario_id: 1,
            created_at: new Date().toISOString()
        },
        {
            exercicio_id: 1,
            exercicio_nome: 'Supino',
            peso_utilizado: 80,
            repeticoes_realizadas: 8,
            series_numero: 2,
            usuario_id: 1,
            created_at: new Date().toISOString()
        },
        {
            exercicio_id: 2,
            exercicio_nome: 'Leg Press',
            peso_utilizado: 120,
            repeticoes_realizadas: 12,
            series_numero: 1,
            usuario_id: 1,
            created_at: new Date().toISOString()
        }
    ];
    
    // Simular treino atual
    const treinoTeste = {
        id: 1,
        grupo_muscular: 'Peito',
        tipo_atividade: 'Treino',
        protocolo_id: 1
    };
    
    // Definir no AppState
    if (window.AppState) {
        AppState.set('currentUser', usuarioTeste);
        AppState.set('execucoesCache', execucoesTeste);
        AppState.set('currentWorkout', treinoTeste);
        AppState.set('workoutStartTime', Date.now() - (30 * 60 * 1000)); // 30 min atrás
        
        console.log('✅ Dados simulados definidos no AppState');
        console.log('📊 Execuções simuladas:', execucoesTeste.length);
        console.log('👤 Usuário:', usuarioTeste.nome);
        console.log('💪 Treino:', treinoTeste.grupo_muscular);
        
        return true;
    } else {
        console.error('❌ AppState não encontrado');
        return false;
    }
};

/**
 * Limpar dados de teste
 */
window.limparDadosTeste = function() {
    console.log('🧹 Limpando dados de teste...');
    
    if (window.AppState) {
        AppState.set('currentUser', null);
        AppState.set('execucoesCache', []);
        AppState.set('currentWorkout', null);
        AppState.set('workoutStartTime', null);
        
        console.log('✅ Dados limpos do AppState');
    }
    
    // Limpar localStorage de debug
    localStorage.removeItem('workout_completion_state');
    localStorage.removeItem('workout_error_state');
    
    console.log('✅ LocalStorage limpo');
};

/**
 * Verificar recovery
 */
window.checkWorkoutRecovery = async function() {
    console.log('🔄 Verificando recovery...');
    
    try {
        const { WorkoutCompletionService } = await import('../services/workoutCompletionService.js');
        const recovery = await WorkoutCompletionService.verificarRecoveryPendente();
        
        if (recovery) {
            console.log('📋 Recovery encontrado:', recovery);
        } else {
            console.log('✅ Nenhum recovery pendente');
        }
        
        return recovery;
        
    } catch (error) {
        console.error('❌ Erro ao verificar recovery:', error);
        return null;
    }
};

/**
 * Mostrar modal de sucesso de teste
 */
window.testSuccessModal = async function() {
    console.log('🎉 Testando modal de sucesso...');
    
    try {
        const { WorkoutSuccessModal } = await import('../components/workoutSuccessModal.js');
        
        const dadosTeste = {
            tempo_total_minutos: 45,
            total_series: 12,
            peso_total_levantado: 1250.5,
            repeticoes_totais: 96,
            exercicios_unicos: 4,
            grupo_muscular: 'Peito'
        };
        
        await WorkoutSuccessModal.mostrar(dadosTeste);
        console.log('✅ Modal de sucesso exibido');
        
    } catch (error) {
        console.error('❌ Erro ao testar modal:', error);
    }
};

// Mensagem de carregamento
console.log('🔧 Debug tools carregadas!');
console.log('📋 Funções disponíveis:');
console.log('  • debugWorkoutCompletion() - Diagnóstico completo');
console.log('  • testWorkoutCompletion() - Teste de finalização');
console.log('  • simularDadosTreino() - Simular dados para teste');
console.log('  • limparDadosTeste() - Limpar dados simulados');
console.log('  • checkWorkoutRecovery() - Verificar recovery');
console.log('  • testSuccessModal() - Testar modal de sucesso');

export default {
    debugWorkoutCompletion: window.debugWorkoutCompletion,
    testWorkoutCompletion: window.testWorkoutCompletion,
    simularDadosTreino: window.simularDadosTreino,
    limparDadosTeste: window.limparDadosTeste,
    checkWorkoutRecovery: window.checkWorkoutRecovery,
    testSuccessModal: window.testSuccessModal
};