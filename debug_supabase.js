// Script para testar conectividade real com Supabase
console.log('🔍 Iniciando diagnóstico do Supabase...');

async function diagnosticarSupabase() {
    try {
        // 1. Verificar se Supabase está carregado
        if (!window.supabase) {
            console.error('❌ window.supabase não está definido!');
            return false;
        }
        
        if (!window.SUPABASE_CONFIG) {
            console.error('❌ SUPABASE_CONFIG não está definido!');
            return false;
        }
        
        console.log('✅ Supabase client disponível');
        console.log('✅ Config disponível:', {
            url: window.SUPABASE_CONFIG.url,
            hasKey: !!window.SUPABASE_CONFIG.key
        });
        
        // 2. Criar cliente e testar conexão
        const supabase = window.supabase.createClient(
            window.SUPABASE_CONFIG.url,
            window.SUPABASE_CONFIG.key
        );
        
        console.log('🔌 Testando conexão básica...');
        
        // 3. Testar consulta simples
        const { data: usuarios, error: userError } = await supabase
            .from('usuarios')
            .select('id, nome')
            .limit(5);
            
        if (userError) {
            console.error('❌ Erro ao buscar usuários:', userError);
            return false;
        }
        
        console.log('✅ Usuários encontrados:', usuarios);
        
        if (!usuarios || usuarios.length === 0) {
            console.error('❌ PROBLEMA: Tabela usuarios existe mas está vazia!');
            return false;
        }
        
        // 4. Testar outras tabelas críticas
        const tabelas = [
            'protocolos_treinamento',
            'usuario_plano_treino', 
            'planejamento_semanal',
            'protocolo_treinos',
            'exercicios'
        ];
        
        for (const tabela of tabelas) {
            console.log(`🔍 Testando tabela: ${tabela}`);
            
            const { data, error } = await supabase
                .from(tabela)
                .select('*')
                .limit(1);
                
            if (error) {
                console.error(`❌ Erro na tabela ${tabela}:`, error);
                return false;
            }
            
            console.log(`✅ Tabela ${tabela}:`, data?.length || 0, 'registros encontrados');
            
            if (!data || data.length === 0) {
                console.warn(`⚠️ Tabela ${tabela} está vazia!`);
            }
        }
        
        // 5. Testar consulta específica do dia
        const userId = usuarios[0].id;
        const hoje = new Date();
        const diaSemana = hoje.getDay();
        const ano = hoje.getFullYear();
        const semana = getWeekNumber(hoje);
        
        console.log(`🔍 Testando planejamento para hoje: userId=${userId}, dia=${diaSemana}, ano=${ano}, semana=${semana}`);
        
        const { data: planejamentoHoje, error: planError } = await supabase
            .from('planejamento_semanal')
            .select('*')
            .eq('usuario_id', userId)
            .eq('ano', ano)
            .eq('semana', semana)
            .eq('dia_semana', diaSemana);
            
        if (planError) {
            console.error('❌ Erro ao buscar planejamento de hoje:', planError);
            return false;
        }
        
        if (!planejamentoHoje || planejamentoHoje.length === 0) {
            console.error('❌ PROBLEMA: Nenhum planejamento encontrado para hoje!');
            console.log('💡 Dados necessários:', { userId, diaSemana, ano, semana });
            return false;
        }
        
        console.log('✅ Planejamento de hoje:', planejamentoHoje[0]);
        
        // 6. Testar protocolo ativo do usuário
        console.log(`🔍 Testando protocolo ativo do usuário ${userId}...`);
        
        const { data: planoUsuario, error: planoError } = await supabase
            .from('usuario_plano_treino')
            .select('*, protocolos_treinamento(*)')
            .eq('usuario_id', userId)
            .eq('status', 'ativo');
            
        if (planoError) {
            console.error('❌ Erro ao buscar plano do usuário:', planoError);
            return false;
        }
        
        if (!planoUsuario || planoUsuario.length === 0) {
            console.error('❌ PROBLEMA: Usuário não possui protocolo ativo!');
            return false;
        }
        
        console.log('✅ Protocolo ativo:', planoUsuario[0]);
        
        console.log('🎉 DIAGNÓSTICO CONCLUÍDO: Supabase está funcionando corretamente!');
        return true;
        
    } catch (error) {
        console.error('💥 ERRO CRÍTICO no diagnóstico:', error);
        return false;
    }
}

// Função auxiliar para calcular número da semana
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// Disponibilizar globalmente
window.diagnosticarSupabase = diagnosticarSupabase;

console.log('💡 Execute: window.diagnosticarSupabase() no console para diagnosticar o Supabase');