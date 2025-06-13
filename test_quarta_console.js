// Script para testar quarta-feira no console do navegador
// Cole este código no console da aplicação

async function testarQuartaFeira(userId = 1, dataQuarta = '2025-06-11') {
    console.log(`🔍 Testando quarta-feira: ${dataQuarta} para usuário ${userId}`);
    
    try {
        // 1. Testar view vw_treino_completo
        console.log('\n1️⃣ Testando view vw_treino_completo...');
        const { data: viewData, error: viewError } = await supabase
            .from('vw_treino_completo')
            .select('*')
            .eq('usuario_id', userId)
            .eq('data_treino', dataQuarta);
            
        console.log('View - Error:', viewError);
        console.log('View - Data:', viewData?.length || 0, 'registros');
        if (viewData?.length > 0) {
            console.table(viewData.slice(0, 3));
        }
        
        // 2. Testar tabela execucao_exercicio_usuario
        console.log('\n2️⃣ Testando tabela execucao_exercicio_usuario...');
        const { data: tabelaData, error: tabelaError } = await supabase
            .from('execucao_exercicio_usuario')
            .select('id, usuario_id, exercicio_id, data_execucao, peso_utilizado, repeticoes')
            .eq('usuario_id', userId)
            .gte('data_execucao', dataQuarta + 'T00:00:00')
            .lt('data_execucao', dataQuarta + 'T23:59:59');
            
        console.log('Tabela - Error:', tabelaError);
        console.log('Tabela - Data:', tabelaData?.length || 0, 'registros');
        if (tabelaData?.length > 0) {
            console.table(tabelaData.slice(0, 3));
        }
        
        // 3. Verificar planejamento
        console.log('\n3️⃣ Verificando planejamento...');
        const dataObj = new Date(dataQuarta);
        const ano = dataObj.getFullYear();
        const semana = getWeekNumber(dataObj);
        const diaSemana = dataObj.getDay();
        
        console.log(`Calculado - Ano: ${ano}, Semana: ${semana}, Dia: ${diaSemana}`);
        
        const { data: planData, error: planError } = await supabase
            .from('planejamento_semanal')
            .select('*')
            .eq('usuario_id', userId)
            .eq('ano', ano)
            .eq('semana', semana)
            .eq('dia_semana', diaSemana);
            
        console.log('Planejamento - Error:', planError);
        console.log('Planejamento - Data:', planData);
        
        // 4. Testar com diferentes formatos de data
        console.log('\n4️⃣ Testando formatos de data...');
        
        const formatosTeste = [
            dataQuarta,
            dataQuarta + 'T00:00:00',
            dataQuarta + 'T00:00:00.000Z'
        ];
        
        for (const formato of formatosTeste) {
            const { data: teste } = await supabase
                .from('execucao_exercicio_usuario')
                .select('id, data_execucao')
                .eq('usuario_id', userId)
                .gte('data_execucao', formato)
                .limit(1);
                
            console.log(`Formato ${formato}: ${teste?.length || 0} registros`);
        }
        
        // 5. Verificar todas as datas disponíveis
        console.log('\n5️⃣ Verificando todas as datas disponíveis...');
        const { data: todasDatas } = await supabase
            .from('execucao_exercicio_usuario')
            .select('data_execucao')
            .eq('usuario_id', userId)
            .order('data_execucao', { ascending: false })
            .limit(20);
            
        if (todasDatas?.length > 0) {
            const datasUnicas = [...new Set(todasDatas.map(d => d.data_execucao.split('T')[0]))];
            console.log('Datas com treinos:', datasUnicas);
            
            const temQuarta = datasUnicas.includes(dataQuarta);
            console.log(`Quarta-feira (${dataQuarta}) está presente:`, temQuarta);
        }
        
        // 6. Testar TreinoViewService se disponível
        console.log('\n6️⃣ Testando TreinoViewService...');
        if (typeof TreinoViewService !== 'undefined') {
            try {
                const resultado = await TreinoViewService.buscarTreinoPorData(userId, dataQuarta);
                console.log('TreinoViewService resultado:', resultado);
            } catch (e) {
                console.error('TreinoViewService erro:', e);
            }
        } else {
            console.log('TreinoViewService não disponível');
        }
        
        return {
            view_registros: viewData?.length || 0,
            tabela_registros: tabelaData?.length || 0,
            planejamento_existe: !!planData?.length,
            planejamento_grupo: planData?.[0]?.tipo_atividade
        };
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
        return { erro: error.message };
    }
}

// Função auxiliar para cálculo de semana
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

console.log('🚀 Script de teste carregado!');
console.log('📋 Execute: testarQuartaFeira()');
console.log('📋 Ou com data específica: testarQuartaFeira(1, "2025-06-11")');

// Auto-executar se quiser
// testarQuartaFeira();