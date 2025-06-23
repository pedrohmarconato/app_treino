// Script de debug para descobrir os IDs reais das tabelas do banco
import { supabase } from './services/supabaseService.js';

async function debugDatabaseIds() {
    console.log('🔍 INVESTIGAÇÃO COMPLETA DAS TABELAS DO BANCO DE DADOS');
    console.log('===========================================================');
    
    try {
        // 1. EXERCÍCIOS - mostrar todos os IDs e nomes
        console.log('\n📋 TABELA: exercicios');
        console.log('─'.repeat(50));
        const { data: exercicios, error: errorEx } = await supabase
            .from('exercicios')
            .select('id, nome, grupo_muscular, equipamento')
            .order('id');
            
        if (errorEx) {
            console.error('❌ Erro ao buscar exercícios:', errorEx);
        } else {
            console.log(`✅ Encontrados ${exercicios?.length || 0} exercícios:`);
            exercicios?.forEach(ex => {
                console.log(`  ID: ${ex.id} | Nome: ${ex.nome} | Grupo: ${ex.grupo_muscular} | Equipamento: ${ex.equipamento}`);
            });
        }
        
        // 2. PROTOCOLOS DE TREINAMENTO
        console.log('\n🏋️ TABELA: protocolos_treinamento');
        console.log('─'.repeat(50));
        const { data: protocolos, error: errorProt } = await supabase
            .from('protocolos_treinamento')
            .select('id, nome, descricao, total_semanas, dias_por_semana')
            .order('id');
            
        if (errorProt) {
            console.error('❌ Erro ao buscar protocolos:', errorProt);
        } else {
            console.log(`✅ Encontrados ${protocolos?.length || 0} protocolos:`);
            protocolos?.forEach(prot => {
                console.log(`  ID: ${prot.id} | Nome: ${prot.nome} | Semanas: ${prot.total_semanas} | Dias/Semana: ${prot.dias_por_semana}`);
            });
        }
        
        // 3. PROTOCOLO_TREINOS (relaciona protocolo com exercícios)
        console.log('\n🔗 TABELA: protocolo_treinos');
        console.log('─'.repeat(50));
        const { data: protocoloTreinos, error: errorPT } = await supabase
            .from('protocolo_treinos')
            .select(`
                id, 
                protocolo_id, 
                exercicio_id, 
                semana_referencia, 
                tipo_atividade,
                series,
                repeticoes_alvo,
                percentual_1rm_base,
                exercicios(nome, grupo_muscular)
            `)
            .order('protocolo_id, semana_referencia, exercicio_id')
            .limit(20);
            
        if (errorPT) {
            console.error('❌ Erro ao buscar protocolo_treinos:', errorPT);
        } else {
            console.log(`✅ Encontrados ${protocoloTreinos?.length || 0} registros (amostra):`);
            protocoloTreinos?.forEach(pt => {
                console.log(`  ID: ${pt.id} | Protocolo: ${pt.protocolo_id} | Exercício: ${pt.exercicio_id} (${pt.exercicios?.nome}) | Semana: ${pt.semana_referencia} | Tipo: ${pt.tipo_atividade}`);
            });
        }
        
        // 4. USUÁRIOS
        console.log('\n👥 TABELA: usuarios');
        console.log('─'.repeat(50));
        const { data: usuarios, error: errorUsers } = await supabase
            .from('usuarios')
            .select('id, nome, status')
            .order('id');
            
        if (errorUsers) {
            console.error('❌ Erro ao buscar usuários:', errorUsers);
        } else {
            console.log(`✅ Encontrados ${usuarios?.length || 0} usuários:`);
            usuarios?.forEach(user => {
                console.log(`  ID: ${user.id} | Nome: ${user.nome} | Status: ${user.status}`);
            });
        }
        
        // 5. PLANOS ATIVOS DOS USUÁRIOS
        console.log('\n📋 TABELA: usuario_plano_treino');
        console.log('─'.repeat(50));
        const { data: planos, error: errorPlanos } = await supabase
            .from('usuario_plano_treino')
            .select(`
                id, 
                usuario_id, 
                protocolo_treinamento_id, 
                semana_atual, 
                status,
                usuarios(nome),
                protocolos_treinamento(nome)
            `)
            .eq('status', 'ativo')
            .order('usuario_id');
            
        if (errorPlanos) {
            console.error('❌ Erro ao buscar planos:', errorPlanos);
        } else {
            console.log(`✅ Encontrados ${planos?.length || 0} planos ativos:`);
            planos?.forEach(plano => {
                console.log(`  ID: ${plano.id} | Usuário: ${plano.usuarios?.nome} (${plano.usuario_id}) | Protocolo: ${plano.protocolos_treinamento?.nome} (${plano.protocolo_treinamento_id}) | Semana: ${plano.semana_atual}`);
            });
        }
        
        // 6. ANÁLISE DE COMBINAÇÕES VÁLIDAS
        console.log('\n🎯 ANÁLISE DE COMBINAÇÕES VÁLIDAS');
        console.log('─'.repeat(50));
        
        if (exercicios && protocolos && protocoloTreinos) {
            console.log('📊 RESUMO PARA CRIAÇÃO DE SQL:');
            console.log(`  • ${exercicios.length} exercícios disponíveis (IDs: ${exercicios.map(e => e.id).join(', ')})`);
            console.log(`  • ${protocolos.length} protocolos disponíveis (IDs: ${protocolos.map(p => p.id).join(', ')})`);
            console.log(`  • ${protocoloTreinos.length} relações protocolo-exercício (amostra)`);
            
            // Mostrar grupos musculares únicos
            const gruposUnicos = [...new Set(exercicios.map(e => e.grupo_muscular))];
            console.log(`  • Grupos musculares: ${gruposUnicos.join(', ')}`);
            
            // Mostrar semanas disponíveis
            const semanasUnicas = [...new Set(protocoloTreinos.map(pt => pt.semana_referencia))];
            console.log(`  • Semanas disponíveis: ${semanasUnicas.join(', ')}`);
        }
        
        console.log('\n✅ INVESTIGAÇÃO CONCLUÍDA!');
        console.log('===========================================================');
        
    } catch (error) {
        console.error('💥 ERRO GERAL na investigação:', error);
    }
}

// Executar automaticamente se estiver no browser
if (typeof window !== 'undefined') {
    window.debugDatabaseIds = debugDatabaseIds;
    console.log('🔧 Script carregado! Execute debugDatabaseIds() no console para investigar o banco.');
}

export default debugDatabaseIds;