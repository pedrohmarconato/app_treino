/**
 * 🔧 CORREÇÃO DE DUPLICATAS NO PLANEJAMENTO SEMANAL
 * 
 * Este script corrige o problema de múltiplas linhas na tabela planejamento_semanal
 * que está causando erro 406 e impedindo o carregamento dos exercícios
 */

import { supabase } from './services/supabaseService.js';

export async function corrigirDuplicatasPlanejamento() {
    console.log('\n🔧 === CORREÇÃO DE DUPLICATAS NO PLANEJAMENTO ===');
    
    try {
        // 1. Buscar todas as duplicatas
        console.log('🔍 Buscando duplicatas...');
        
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
            return false;
        }
        
        console.log(`📊 Encontradas ${duplicatas.length} linhas para o mesmo dia`);
        
        if (duplicatas.length <= 1) {
            console.log('✅ Nenhuma duplicata encontrada');
            return true;
        }
        
        // 2. Manter apenas a mais recente (primeiro da lista)
        const planejamentoManter = duplicatas[0];
        const planejamentosRemover = duplicatas.slice(1);
        
        console.log('📋 Planejamento a manter:', {
            id: planejamentoManter.id,
            treino: planejamentoManter.treino,
            created_at: planejamentoManter.created_at
        });
        
        console.log(`🗑️ Planejamentos a remover: ${planejamentosRemover.length}`);
        
        // 3. Remover duplicatas
        for (const planejamento of planejamentosRemover) {
            console.log(`🗑️ Removendo planejamento ID ${planejamento.id}...`);
            
            const { error: errorRemover } = await supabase
                .from('planejamento_semanal')
                .delete()
                .eq('id', planejamento.id);
                
            if (errorRemover) {
                console.error(`❌ Erro ao remover planejamento ${planejamento.id}:`, errorRemover);
            } else {
                console.log(`✅ Planejamento ${planejamento.id} removido`);
            }
        }
        
        // 4. Verificar se a correção funcionou
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
            return false;
        }
        
        console.log(`✅ Verificação concluída: ${verificacao.length} linha(s) restante(s)`);
        
        if (verificacao.length === 1) {
            console.log('🎉 Correção bem-sucedida!');
            return true;
        } else {
            console.log('⚠️ Ainda há problemas na tabela');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Erro geral na correção:', error);
        return false;
    }
}

// Função para verificar duplicatas em geral
export async function verificarDuplicatasGerais() {
    console.log('\n🔍 === VERIFICAÇÃO GERAL DE DUPLICATAS ===');
    
    try {
        const { data: duplicatas, error } = await supabase
            .from('planejamento_semanal')
            .select('usuario_id, ano, semana_treino, dia_semana, COUNT(*) as count')
            .eq('usuario_id', 3)
            .group('usuario_id, ano, semana_treino, dia_semana')
            .having('COUNT(*) > 1');
            
        if (error) {
            console.error('❌ Erro na verificação geral:', error);
            return [];
        }
        
        console.log(`📊 Encontradas ${duplicatas.length} grupos com duplicatas`);
        
        duplicatas.forEach(grupo => {
            console.log(`📋 Duplicata: Usuário ${grupo.usuario_id}, Ano ${grupo.ano}, Semana ${grupo.semana_treino}, Dia ${grupo.dia_semana} - ${grupo.count} linhas`);
        });
        
        return duplicatas;
        
    } catch (error) {
        console.error('❌ Erro na verificação geral:', error);
        return [];
    }
}

// Função para testar se o treino funciona após correção
export async function testarTreinoAposCorrecao() {
    console.log('\n🧪 === TESTE DO TREINO APÓS CORREÇÃO ===');
    
    try {
        // Tentar buscar exercícios do dia usando o método corrigido
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

// Executar correção automaticamente
export async function executarCorrecaoCompleta() {
    console.log('\n🚀 === CORREÇÃO COMPLETA DO PROBLEMA ===');
    
    // 1. Verificar duplicatas gerais
    await verificarDuplicatasGerais();
    
    // 2. Corrigir duplicatas específicas
    const correcaoOK = await corrigirDuplicatasPlanejamento();
    
    if (!correcaoOK) {
        console.log('❌ Correção falhou');
        return false;
    }
    
    // 3. Testar se funciona
    const testeOK = await testarTreinoAposCorrecao();
    
    if (testeOK) {
        console.log('🎉 PROBLEMA CORRIGIDO COM SUCESSO!');
        console.log('✅ Agora o treino pode ser iniciado e finalizado normalmente');
        return true;
    } else {
        console.log('⚠️ Correção parcial - pode haver outros problemas');
        return false;
    }
}

// Expor globalmente para uso no console
window.corrigirDuplicatasPlanejamento = corrigirDuplicatasPlanejamento;
window.verificarDuplicatasGerais = verificarDuplicatasGerais;
window.testarTreinoAposCorrecao = testarTreinoAposCorrecao;
window.executarCorrecaoCompleta = executarCorrecaoCompleta;

export default {
    corrigirDuplicatasPlanejamento,
    verificarDuplicatasGerais,
    testarTreinoAposCorrecao,
    executarCorrecaoCompleta
};