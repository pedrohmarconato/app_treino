// 🔧 CORREÇÃO DE DUPLICATAS - VERSÃO CONSOLE
// Cole este código no console do navegador enquanto o app está aberto

(async function corrigirDuplicatasPlanejamento() {
    console.log('\n🔧 === CORREÇÃO DE DUPLICATAS NO PLANEJAMENTO ===');
    
    // Verificar se supabase está disponível
    if (typeof supabase === 'undefined') {
        console.error('❌ Supabase não está disponível. Execute no contexto do app.');
        return;
    }
    
    try {
        // 1. Buscar duplicatas
        console.log('🔍 Verificando duplicatas...');
        
        const { data: duplicatas, error: errorDuplicatas } = await supabase
            .from('planejamento_semanal')
            .select('*')
            .eq('usuario_id', 3)
            .eq('ano', 2025)
            .eq('semana_treino', 1)
            .eq('dia_semana', 3)
            .order('id', { ascending: false });
            
        if (errorDuplicatas) {
            console.error('❌ Erro ao buscar duplicatas:', errorDuplicatas);
            return;
        }
        
        console.log(`📊 Encontradas ${duplicatas.length} linhas para o mesmo dia`);
        
        if (duplicatas.length <= 1) {
            console.log('✅ Nenhuma duplicata encontrada');
            
            // Testar se o treino funciona
            await testarTreino();
            return;
        }
        
        // 2. Mostrar duplicatas
        console.log('📋 Duplicatas encontradas:');
        duplicatas.forEach((item, index) => {
            console.log(`  ${index + 1}. ID: ${item.id}, Treino: ${item.treino}, Criado: ${new Date(item.created_at).toLocaleString()}`);
        });
        
        // 3. Remover duplicatas (manter apenas a mais recente)
        const planejamentoManter = duplicatas[0];
        const planejamentosRemover = duplicatas.slice(1);
        
        console.log(`📋 Mantendo planejamento ID ${planejamentoManter.id} (${planejamentoManter.treino})`);
        console.log(`🗑️ Removendo ${planejamentosRemover.length} duplicatas...`);
        
        for (const planejamento of planejamentosRemover) {
            console.log(`   Removendo ID ${planejamento.id}...`);
            
            const { error: errorRemover } = await supabase
                .from('planejamento_semanal')
                .delete()
                .eq('id', planejamento.id);
                
            if (errorRemover) {
                console.error(`   ❌ Erro ao remover ${planejamento.id}:`, errorRemover);
            } else {
                console.log(`   ✅ Removido ${planejamento.id}`);
            }
        }
        
        // 4. Verificar correção
        console.log('🔍 Verificando correção...');
        
        const { data: verificacao, error: errorVerificacao } = await supabase
            .from('planejamento_semanal')
            .select('*')
            .eq('usuario_id', 3)
            .eq('ano', 2025)
            .eq('semana_treino', 1)
            .eq('dia_semana', 3);
            
        if (errorVerificacao) {
            console.error('❌ Erro na verificação:', errorVerificacao);
            return;
        }
        
        console.log(`✅ Verificação concluída: ${verificacao.length} linha(s) restante(s)`);
        
        if (verificacao.length === 1) {
            console.log('🎉 Correção bem-sucedida!');
            
            // Testar se o treino funciona agora
            await testarTreino();
            
        } else {
            console.log('⚠️ Ainda há problemas na tabela');
        }
        
    } catch (error) {
        console.error('❌ Erro geral na correção:', error);
    }
})();

// Função para testar se o treino funciona
async function testarTreino() {
    console.log('\n🧪 === TESTE DO TREINO ===');
    
    try {
        // Usar o método corrigido
        const { data: planejamento, error } = await supabase
            .from('planejamento_semanal')
            .select('*')
            .eq('usuario_id', 3)
            .eq('ano', 2025)
            .eq('semana_treino', 1)
            .eq('dia_semana', 3)
            .order('id', { ascending: false })
            .limit(1);
            
        if (error) {
            console.error('❌ Erro no teste:', error);
            return false;
        }
        
        const planejamentoUnico = planejamento?.[0];
        
        if (!planejamentoUnico) {
            console.log('❌ Nenhum planejamento encontrado');
            return false;
        }
        
        console.log('✅ Planejamento encontrado:', {
            id: planejamentoUnico.id,
            treino: planejamentoUnico.treino,
            exercicios: planejamentoUnico.exercicios?.length || 0
        });
        
        if (planejamentoUnico.exercicios && planejamentoUnico.exercicios.length > 0) {
            console.log('🎉 Treino pode ser iniciado normalmente!');
            console.log('✅ Agora o problema de finalização deve estar resolvido');
            console.log('🔄 Recarregue a página do app para testar');
            return true;
        } else {
            console.log('⚠️ Planejamento sem exercícios');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
        return false;
    }
}

console.log('🚀 Script de correção carregado. Execute a correção automaticamente ou use testarTreino() para verificar.');