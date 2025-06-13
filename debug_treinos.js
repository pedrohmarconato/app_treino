// Script de debug para diagnóstico de treinos
// Execute no console do navegador para diagnosticar problemas

async function debugTreinosCompleto(userId = 1) {
    console.log('🔍 Iniciando diagnóstico completo...');
    
    try {
        // 1. Testar view vw_treino_completo
        console.log('\n1️⃣ Testando view vw_treino_completo...');
        const { data: viewData, error: viewError } = await supabase
            .from('vw_treino_completo')
            .select('execucao_id, usuario_id, data_treino, grupo_muscular, exercicio_nome, volume_serie')
            .eq('usuario_id', userId)
            .order('data_treino', { ascending: false })
            .limit(10);
            
        if (viewError) {
            console.error('❌ Erro na view:', viewError);
        } else {
            console.log('✅ View funcionando:', viewData?.length || 0, 'registros');
            if (viewData?.length > 0) {
                console.table(viewData.slice(0, 3));
                
                // Listar datas disponíveis
                const datasDisponiveis = [...new Set(viewData.map(d => d.data_treino))];
                console.log('📅 Datas com treinos:', datasDisponiveis);
            }
        }
        
        // 2. Testar execucao_exercicio_usuario diretamente
        console.log('\n2️⃣ Testando tabela execucao_exercicio_usuario...');
        const { data: execData, error: execError } = await supabase
            .from('execucao_exercicio_usuario')
            .select('id, usuario_id, data_execucao, protocolo_treino_id, exercicio_id')
            .eq('usuario_id', userId)
            .order('data_execucao', { ascending: false })
            .limit(10);
            
        if (execError) {
            console.error('❌ Erro na tabela:', execError);
        } else {
            console.log('✅ Tabela funcionando:', execData?.length || 0, 'registros');
            if (execData?.length > 0) {
                console.table(execData.slice(0, 3));
                
                // Converter datas para comparação
                const datasExec = execData.map(e => e.data_execucao.split('T')[0]);
                const datasUnicas = [...new Set(datasExec)];
                console.log('📅 Datas com execuções:', datasUnicas);
            }
        }
        
        // 3. Testar planejamento semanal
        console.log('\n3️⃣ Testando planejamento_semanal...');
        const { data: planData, error: planError } = await supabase
            .from('planejamento_semanal')
            .select('*')
            .eq('usuario_id', userId)
            .order('ano', { ascending: false })
            .order('semana', { ascending: false })
            .limit(10);
            
        if (planError) {
            console.error('❌ Erro no planejamento:', planError);
        } else {
            console.log('✅ Planejamento funcionando:', planData?.length || 0, 'registros');
            if (planData?.length > 0) {
                console.table(planData.slice(0, 5));
            }
        }
        
        // 4. Testar TreinoViewService
        console.log('\n4️⃣ Testando TreinoViewService...');
        if (typeof TreinoViewService !== 'undefined') {
            // Testar com uma data específica
            const datasTeste = viewData?.length > 0 ? 
                [...new Set(viewData.map(d => d.data_treino))].slice(0, 3) : 
                ['2025-06-11', '2025-06-10', '2025-06-09'];
                
            for (const data of datasTeste) {
                console.log(`\n🧪 Testando data: ${data}`);
                
                try {
                    const resultado = await TreinoViewService.buscarTreinoPorData(userId, data);
                    console.log(`   Resultado:`, resultado.success ? '✅' : '❌');
                    
                    if (resultado.success && resultado.data) {
                        console.log(`   Exercícios: ${resultado.data.exercicios?.length || 0}`);
                        console.log(`   Grupo: ${resultado.data.grupo_muscular || 'N/A'}`);
                        console.log(`   Múltiplos grupos: ${resultado.data.multiplos_grupos || false}`);
                    }
                } catch (e) {
                    console.error(`   ❌ Erro:`, e.message);
                }
            }
        } else {
            console.log('⚠️ TreinoViewService não disponível');
        }
        
        // 5. Testar cálculo de semana
        console.log('\n5️⃣ Testando cálculo de semanas...');
        const hoje = new Date();
        const semanaAtual = getWeekNumber ? getWeekNumber(hoje) : 'Função não disponível';
        console.log(`Hoje: ${hoje.toISOString().split('T')[0]}`);
        console.log(`Semana atual: ${semanaAtual}`);
        console.log(`Ano atual: ${hoje.getFullYear()}`);
        
        // Testar dias da semana
        for (let i = 0; i < 7; i++) {
            const data = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - (hoje.getDay() - i));
            const dataStr = data.toISOString().split('T')[0];
            console.log(`Dia ${i}: ${dataStr}`);
        }
        
        console.log('\n🎉 Diagnóstico concluído!');
        return {
            view_funcionando: !viewError,
            view_registros: viewData?.length || 0,
            tabela_funcionando: !execError,
            tabela_registros: execData?.length || 0,
            planejamento_funcionando: !planError,
            planejamento_registros: planData?.length || 0
        };
        
    } catch (error) {
        console.error('❌ Erro geral no diagnóstico:', error);
        return { erro: error.message };
    }
}

// Função auxiliar para semana (caso não exista)
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
}

// Para uso no console
console.log('🚀 Debug script carregado!');
console.log('📋 Execute: debugTreinosCompleto()');

// Auto-executar se em contexto correto
if (typeof window !== 'undefined' && window.supabase) {
    console.log('🎯 Supabase detectado, executando diagnóstico...');
    debugTreinosCompleto();
}

// Export para módulos
if (typeof window !== 'undefined') {
    window.debugTreinosCompleto = debugTreinosCompleto;
}