// Script para criar dados de teste para o planejamento semanal
// Execute no console do navegador após fazer login

async function criarDadosTeste() {
    console.log('🚀 Iniciando criação de dados de teste...');
    
    // Dados para a semana 23 de 2025 (semana atual)
    const dadosTeste = [
        {
            usuario_id: 1,
            ano: 2025,
            semana: 23,
            dia_semana: 1, // Segunda
            tipo_atividade: 'Peito',
            numero_treino: 1,
            concluido: false
        },
        {
            usuario_id: 1,
            ano: 2025,
            semana: 23,
            dia_semana: 2, // Terça
            tipo_atividade: 'Costas',
            numero_treino: 2,
            concluido: false
        },
        {
            usuario_id: 1,
            ano: 2025,
            semana: 23,
            dia_semana: 3, // Quarta
            tipo_atividade: 'Pernas',
            numero_treino: 3,
            concluido: false
        },
        {
            usuario_id: 1,
            ano: 2025,
            semana: 23,
            dia_semana: 4, // Quinta
            tipo_atividade: 'Ombro',
            numero_treino: 4,
            concluido: false
        },
        {
            usuario_id: 1,
            ano: 2025,
            semana: 23,
            dia_semana: 5, // Sexta
            tipo_atividade: 'Braço',
            numero_treino: 5,
            concluido: false
        },
        {
            usuario_id: 1,
            ano: 2025,
            semana: 23,
            dia_semana: 6, // Sábado
            tipo_atividade: 'Cardio',
            numero_treino: null,
            concluido: false
        },
        {
            usuario_id: 1,
            ano: 2025,
            semana: 23,
            dia_semana: 7, // Domingo
            tipo_atividade: 'Pernas',
            numero_treino: 3,
            concluido: false
        }
    ];
    
    try {
        console.log('📋 Dados que serão inseridos:', dadosTeste);
        
        // Primeiro, deletar dados existentes da semana se houver
        console.log('🗑️ Deletando dados existentes da semana 23...');
        const { error: deleteError } = await window.supabase
            .from('planejamento_semanal')
            .delete()
            .eq('usuario_id', 1)
            .eq('ano', 2025)
            .eq('semana', 23);
            
        if (deleteError) {
            console.warn('⚠️ Erro ao deletar dados existentes (pode ser normal se não houver dados):', deleteError.message);
        } else {
            console.log('✅ Dados existentes deletados');
        }
        
        // Inserir novos dados
        console.log('📤 Inserindo novos dados...');
        const { data, error } = await window.supabase
            .from('planejamento_semanal')
            .insert(dadosTeste)
            .select();
            
        if (error) {
            console.error('❌ Erro ao inserir dados:', error);
            return { success: false, error: error.message };
        }
        
        console.log('✅ Dados inseridos com sucesso:', data);
        console.log('🎉 Dados de teste criados! Total de registros:', data.length);
        
        // Verificar se os dados foram inseridos corretamente
        console.log('🔍 Verificando dados inseridos...');
        const { data: verificacao, error: errorVerificacao } = await window.supabase
            .from('planejamento_semanal')
            .select('*')
            .eq('usuario_id', 1)
            .eq('ano', 2025)
            .eq('semana', 23)
            .order('dia_semana', { ascending: true });
            
        if (errorVerificacao) {
            console.error('❌ Erro na verificação:', errorVerificacao);
        } else {
            console.log('✅ Verificação concluída. Dados encontrados:', verificacao);
        }
        
        return { success: true, data };
        
    } catch (error) {
        console.error('❌ Erro crítico:', error);
        return { success: false, error: error.message };
    }
}

// Função para verificar se existe cliente Supabase
function verificarSupabase() {
    if (!window.supabase) {
        console.error('❌ Supabase não está carregado! Faça login primeiro.');
        return false;
    }
    
    if (!window.SUPABASE_CONFIG) {
        console.error('❌ Configuração do Supabase não encontrada!');
        return false;
    }
    
    console.log('✅ Supabase disponível');
    return true;
}

// Executar automaticamente
if (verificarSupabase()) {
    criarDadosTeste().then(resultado => {
        if (resultado.success) {
            console.log('🎊 SUCESSO! Dados de teste criados com sucesso!');
            console.log('💡 Agora você pode testar o dashboard e o planejamento semanal');
        } else {
            console.error('💥 FALHA! Erro ao criar dados de teste:', resultado.error);
        }
    });
} else {
    console.log('💡 Execute este script após fazer login no sistema');
}

// Exportar funções para uso manual se necessário
window.criarDadosTeste = criarDadosTeste;
window.verificarSupabase = verificarSupabase;