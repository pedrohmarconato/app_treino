// Teste simples para debug da função buscarExerciciosTreinoDia
console.log('🧪 TESTE: Iniciando teste da função buscarExerciciosTreinoDia');

// Simular carregamento dos módulos necessários
import { supabase } from './services/supabaseService.js';

// Função de teste
async function testarBuscarExercicios() {
    const userId = 1; // Pedro
    
    console.log('🧪 TESTE: Iniciando busca para usuário:', userId);
    
    try {
        // 1. Verificar data atual e dia da semana
        const hoje = new Date();
        const diaSemana = hoje.getDay();
        const ano = hoje.getFullYear();
        const primeiroDiaAno = new Date(ano, 0, 1);
        const diasPassados = Math.floor((hoje - primeiroDiaAno) / (24 * 60 * 60 * 1000));
        const numeroSemana = Math.ceil((diasPassados + primeiroDiaAno.getDay() + 1) / 7);
        
        console.log('🧪 TESTE: Data atual:', {
            hoje: hoje.toISOString(),
            diaSemana,
            ano,
            numeroSemana
        });
        
        // 2. Buscar planejamento
        const { data: planejamento, error: planejamentoError } = await supabase
            .from('planejamento_semanal')
            .select('*')
            .eq('usuario_id', userId)
            .eq('ano', ano)
            .eq('semana', numeroSemana)
            .eq('dia_semana', diaSemana)
            .single();
            
        console.log('🧪 TESTE: Planejamento encontrado:', planejamento);
        console.log('🧪 TESTE: Erro do planejamento:', planejamentoError);
        
        if (!planejamento) {
            console.log('❌ TESTE: Nenhum planejamento encontrado para hoje');
            return;
        }
        
        // 3. Buscar protocolo do usuário
        const { data: usuarioPlano, error: planoError } = await supabase
            .from('usuario_plano_treino')
            .select('protocolo_treinamento_id, semana_atual')
            .eq('usuario_id', userId)
            .eq('status', 'ativo')
            .single();
            
        console.log('🧪 TESTE: Plano do usuário:', usuarioPlano);
        console.log('🧪 TESTE: Erro do plano:', planoError);
        
        if (!usuarioPlano) {
            console.log('❌ TESTE: Plano do usuário não encontrado');
            return;
        }
        
        // 4. Buscar protocolo treinos
        const { data: protocoloTreinos, error: protocoloError } = await supabase
            .from('protocolo_treinos')
            .select('*')
            .eq('protocolo_id', usuarioPlano.protocolo_treinamento_id)
            .eq('semana_referencia', usuarioPlano.semana_atual)
            .eq('numero_treino', planejamento.numero_treino)
            .order('ordem_exercicio', { ascending: true });
            
        console.log('🧪 TESTE: Protocolo treinos:', protocoloTreinos);
        console.log('🧪 TESTE: Erro do protocolo:', protocoloError);
        
        console.log('✅ TESTE: Teste concluído com sucesso!');
        return protocoloTreinos;
        
    } catch (error) {
        console.error('❌ TESTE: Erro crítico:', error);
    }
}

// Executar teste quando a página carregar
if (typeof window !== 'undefined') {
    window.testarBuscarExercicios = testarBuscarExercicios;
    console.log('🧪 TESTE: Função disponível em window.testarBuscarExercicios()');
}

export { testarBuscarExercicios };