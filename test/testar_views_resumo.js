// Arquivo de teste para verificar as views de resumo do treino
// Execute este arquivo no console do navegador para testar

// Importar cliente Supabase se o script for executado como módulo
import { supabase as supabaseClient } from '../services/supabaseService.js';

// Garantir variável supabase no escopo local
const supabase = supabaseClient;

async function testarViewsResumo() {
    console.log('🧪 Iniciando testes das views de resumo...');
    
    try {
        // 1. Testar view de resumo por dia
        console.log('\n📊 Testando v_resumo_dia_semana...');
        const { data: resumoDia, error: erroDia } = await supabase
            .from('v_resumo_dia_semana')
            .select('*')
            .limit(5);
        
        if (erroDia) {
            console.error('❌ Erro na v_resumo_dia_semana:', erroDia);
        } else {
            console.log('✅ v_resumo_dia_semana funcionando:', resumoDia);
        }
        
        // 2. Testar view de treino planejado
        console.log('\n📋 Testando v_treino_planejado...');
        const { data: treinoPlanejado, error: erroPlano } = await supabase
            .from('v_treino_planejado')
            .select('*')
            .limit(5);
        
        if (erroPlano) {
            console.error('❌ Erro na v_treino_planejado:', erroPlano);
        } else {
            console.log('✅ v_treino_planejado funcionando:', treinoPlanejado);
        }
        
        // 3. Testar view de treino executado
        console.log('\n💪 Testando v_treino_executado...');
        const { data: treinoExecutado, error: erroExec } = await supabase
            .from('v_treino_executado')
            .select('*')
            .limit(5);
        
        if (erroExec) {
            console.error('❌ Erro na v_treino_executado:', erroExec);
        } else {
            console.log('✅ v_treino_executado funcionando:', treinoExecutado);
        }
        
        // 4. Testar view unificada
        console.log('\n🔄 Testando v_resumo_treino_dia...');
        const { data: resumoUnificado, error: erroUnif } = await supabase
            .from('v_resumo_treino_dia')
            .select('*')
            .limit(10);
        
        if (erroUnif) {
            console.error('❌ Erro na v_resumo_treino_dia:', erroUnif);
        } else {
            console.log('✅ v_resumo_treino_dia funcionando:', resumoUnificado);
        }
        
        // 5. Testar integração com dashboard
        console.log('\n🎯 Testando integração com dashboard...');
        const currentUser = AppState.get('currentUser');
const hoje = new Date();
const semanaExibida = WeeklyPlanService.getWeekNumber(hoje);
        if (currentUser?.id) {
            const resumo = await buscarResumoTreinoCompleto(currentUser.id, 0, semanaExibida);
            console.log('📊 Resumo completo:', resumo);
        } else {
            console.log('⚠️ Usuário não logado para teste completo');
        }
        
        console.log('\n✅ Testes concluídos! Verifique os resultados acima.');
        
    } catch (error) {
        console.error('❌ Erro geral nos testes:', error);
    }
}

// Função para testar clique em um dia específico
async function testarCliqueDia(dayIndex = 0) {
    console.log(`🖱️ Simulando clique no dia ${dayIndex}...`);
    await handleDayClick(dayIndex, false);
}

// Executar testes
console.log('Para executar os testes, digite:');
console.log('- testarViewsResumo() - Para testar todas as views');
console.log('- testarCliqueDia(0) - Para testar clique na segunda-feira');
console.log('- testarCliqueDia(1) - Para testar clique na terça-feira');
console.log('etc...');

// Disponibilizar funções globalmente no navegador
if (typeof window !== 'undefined') {
    window.testarViewsResumo = testarViewsResumo;
    window.testarCliqueDia = testarCliqueDia;
}