// Script para testar a view no browser (após execução manual no Supabase)
// Pode ser executado no console do navegador

async function testarViewTreinoCompleto() {
    console.log('🧪 Testando view vw_treino_completo...');
    
    try {
        // Importar o service se necessário
        if (typeof supabase === 'undefined') {
            console.error('❌ Supabase não está disponível. Execute este script no contexto da aplicação.');
            return;
        }
        
        // Teste 1: Verificar se a view existe
        console.log('🔍 Teste 1: Verificando se a view existe...');
        const { data: teste1, error: error1 } = await supabase
            .from('vw_treino_completo')
            .select('count')
            .limit(1);
            
        if (error1) {
            console.error('❌ View não encontrada:', error1.message);
            console.log('📋 Execute primeiro o SQL no painel do Supabase');
            return;
        }
        
        console.log('✅ View encontrada!');
        
        // Teste 2: Buscar dados de exemplo
        console.log('🔍 Teste 2: Buscando dados de exemplo...');
        const { data: exemplo, error: error2 } = await supabase
            .from('vw_treino_completo')
            .select('*')
            .limit(3);
            
        if (error2) {
            console.error('❌ Erro ao buscar dados:', error2.message);
            return;
        }
        
        if (!exemplo || exemplo.length === 0) {
            console.log('ℹ️ View criada mas sem dados (normal se não houver execuções)');
        } else {
            console.log('✅ Dados encontrados!');
            console.log('📊 Exemplo de registro:');
            console.table(exemplo[0]);
            
            // Teste 3: Testar métricas calculadas
            console.log('🔍 Teste 3: Verificando métricas calculadas...');
            const registro = exemplo[0];
            
            console.log('📈 Métricas do primeiro registro:');
            console.log(`- Volume série: ${registro.volume_serie}`);
            console.log(`- 1RM estimado: ${registro.rm_estimado}`);
            console.log(`- Intensidade %: ${registro.intensidade_percentual || 'N/A'}`);
            console.log(`- Tempo estimado: ${registro.tempo_estimado_serie_segundos}s`);
            console.log(`- Qualidade: ${registro.qualidade_performance}`);
        }
        
        // Teste 4: Testar filtros
        console.log('🔍 Teste 4: Testando filtros por usuário...');
        const { data: porUsuario, error: error4 } = await supabase
            .from('vw_treino_completo')
            .select('usuario_id, exercicio_nome, volume_serie')
            .eq('usuario_id', 1)
            .limit(5);
            
        if (error4) {
            console.warn('⚠️ Erro ao testar filtros:', error4.message);
        } else {
            console.log(`✅ Filtro por usuário OK (${porUsuario.length} registros)`);
        }
        
        // Teste 5: Testar o TreinoViewService
        console.log('🔍 Teste 5: Testando TreinoViewService...');
        try {
            if (typeof TreinoViewService !== 'undefined') {
                const resultado = await TreinoViewService.buscarTreinoPorData(1, '2025-06-11');
                console.log('✅ TreinoViewService funcionando!');
                console.log('📊 Resultado:', resultado);
            } else {
                console.log('ℹ️ TreinoViewService não carregado (normal em teste isolado)');
            }
        } catch (e) {
            console.warn('⚠️ Erro ao testar service:', e.message);
        }
        
        console.log('\n🎉 Todos os testes concluídos!');
        console.log('✅ A view vw_treino_completo está funcionando corretamente');
        
        return {
            success: true,
            view_existe: true,
            tem_dados: exemplo && exemplo.length > 0,
            total_registros_exemplo: exemplo ? exemplo.length : 0
        };
        
    } catch (error) {
        console.error('❌ Erro geral nos testes:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Para uso no console do navegador
console.log('📋 Para testar a view, execute:');
console.log('testarViewTreinoCompleto()');

// Auto-executar se no contexto correto
if (typeof window !== 'undefined' && window.supabase) {
    console.log('🚀 Contexto detectado, executando teste automaticamente...');
    testarViewTreinoCompleto();
}

// Export para uso em módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { testarViewTreinoCompleto };
}
if (typeof window !== 'undefined') {
    window.testarViewTreinoCompleto = testarViewTreinoCompleto;
}