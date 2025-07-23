// Serviço para gerenciar finalização manual de treinos
import { supabase } from './supabaseService.js';
import WeeklyPlanService from './weeklyPlanningService.js';
import { nowInSaoPaulo, toSaoPauloDateString, toSaoPauloISOString } from '../utils/timezoneUtils.js';

class TreinoFinalizacaoService {
    
    // Finalizar treino manualmente com dados básicos
    static async finalizarTreino(
        userId, 
        { 
            pre_workout = null, // escala 0-5: nível de ENERGIA antes
            post_workout = null, // escala 0-5: nível de FADIGA depois
            observacoes = null,
            forcarFinalizacao = false
        } = {}
    ) {
        try {
            console.log('[TreinoFinalizacao] Iniciando finalização para usuário:', userId);
            console.log('[TreinoFinalizacao] Parâmetros:', { pre_workout, post_workout, observacoes, forcarFinalizacao });
            
            // Obter informações básicas do planejamento atual
            const dadosPlanejamento = await this.obterDadosPlanejamentoAtual(userId);
            
            if (!dadosPlanejamento.success) {
                throw new Error(dadosPlanejamento.error);
            }
            
            const { ano, semana, diaSemana, planejamento } = dadosPlanejamento.data;
            
            // Verificar se treino já foi concluído
            if (planejamento?.concluido && !forcarFinalizacao) {
                return {
                    success: false,
                    erro: 'Treino já foi concluído hoje',
                    codigo: 'TREINO_JA_CONCLUIDO'
                };
            }
            
            // Buscar semana_treino da d_calendario para a data atual
            const dataAtual = toSaoPauloDateString(nowInSaoPaulo());
            const { data: calendarioHoje, error: calendarioError } = await supabase
                .from('d_calendario')
                .select('semana_treino')
                .eq('data_completa', dataAtual)
                .single();
            
            if (calendarioError) {
                console.error('[TreinoFinalizacao] Erro ao buscar semana_treino:', calendarioError);
                // Continuar sem a semana_treino se houver erro
            }
            
            // Preparar dados da atualização
            const dadosAtualizacao = {
                concluido: true,
                data_conclusao: toSaoPauloISOString(nowInSaoPaulo()),
                pre_workout,
                post_workout,
                observacoes,
                semana_treino: calendarioHoje?.semana_treino || null
            };
            
            // Remover campos nulos para não sobrescrever dados existentes desnecessariamente
            Object.keys(dadosAtualizacao).forEach(key => {
                if (dadosAtualizacao[key] === null) {
                    delete dadosAtualizacao[key];
                }
            });
            
            console.log('[TreinoFinalizacao] Dados para atualização:', dadosAtualizacao);
            
            // Atualizar planejamento semanal
            const { error: updateError, data: planejamentoAtualizado } = await supabase
                .from('planejamento_semanal')
                .update(dadosAtualizacao)
                .eq('usuario_id', userId)
                .eq('ano', ano)
                .eq('semana_treino', semana)
                .eq('dia_semana', diaSemana)
                .select()
                .single();
            
            if (updateError) {
                console.error('[TreinoFinalizacao] Erro ao atualizar planejamento:', updateError);
                throw updateError;
            }
            
            console.log('[TreinoFinalizacao] Planejamento atualizado:', planejamentoAtualizado);
            
            // Obter contagem de execuções do dia (se houver)
            const execucoes = await this.contarExecucoesDia(userId);
            
            const resultado = {
                success: true,
                mensagem: 'Treino finalizado com sucesso',
                sessao_id: planejamentoAtualizado.id,
                execucoes_finalizadas: execucoes.count || 0,
                dados_planejamento: planejamentoAtualizado,
                pre_workout: planejamentoAtualizado.pre_workout,
                post_workout: planejamentoAtualizado.post_workout
            };
            
            console.log('[TreinoFinalizacao] Resultado final:', resultado);
            return resultado;
            
        } catch (error) {
            console.error('[TreinoFinalizacao] Erro na finalização:', error);
            return {
                success: false,
                erro: error.message || 'Erro interno',
                codigo: 'ERRO_FINALIZACAO'
            };
        }
    }
    
    // Obter dados do planejamento atual (dia, semana, ano)
    static async obterDadosPlanejamentoAtual(userId) {
        try {
            const agora = nowInSaoPaulo();
            const { ano, semana } = WeeklyPlanService.getCurrentWeek();
            const diaSemana = (agora instanceof Date ? agora : new Date(agora)).getDay();
            
            console.log('[TreinoFinalizacao] Buscando planejamento:', { userId, ano, semana, diaSemana });
            
            // Buscar planejamento atual
            const { data: planejamento, error } = await supabase
                .from('planejamento_semanal')
                .select('*')
                .eq('usuario_id', userId)
                .eq('ano', ano)
                .eq('semana_treino', semana)
                .eq('dia_semana', diaSemana)
                .single();
            
            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
                console.error('[TreinoFinalizacao] Erro ao buscar planejamento:', error);
                throw error;
            }
            
            return {
                success: true,
                data: {
                    ano,
                    semana,
                    diaSemana,
                    planejamento: planejamento || null
                }
            };
            
        } catch (error) {
            console.error('[TreinoFinalizacao] Erro ao obter dados do planejamento:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Contar execuções do dia atual
    static async contarExecucoesDia(userId) {
        try {
            const dataHoje = toSaoPauloDateString(nowInSaoPaulo());
            
            const { count, error } = await supabase
                .from('execucao_exercicio_usuario')
                .select('*', { count: 'exact', head: true })
                .eq('usuario_id', userId)
                .gte('data_execucao', `${dataHoje}T00:00:00`)
                .lt('data_execucao', `${dataHoje}T23:59:59`);
            
            if (error) {
                console.warn('[TreinoFinalizacao] Erro ao contar execuções (não crítico):', error);
                return { count: 0 };
            }
            
            return { count: count || 0 };
            
        } catch (error) {
            console.warn('[TreinoFinalizacao] Erro ao contar execuções (não crítico):', error);
            return { count: 0 };
        }
    }
    
    // Verificar status de conclusão atual
    static async verificarStatusConclusao(userId) {
        try {
            const dadosPlanejamento = await this.obterDadosPlanejamentoAtual(userId);
            
            if (!dadosPlanejamento.success) {
                return {
                    success: false,
                    error: dadosPlanejamento.error
                };
            }
            
            const { planejamento } = dadosPlanejamento.data;
            
            return {
                success: true,
                concluido: planejamento?.concluido || false,
                data_conclusao: planejamento?.data_conclusao || null,
                pre_workout: planejamento?.pre_workout || null,
                post_workout: planejamento?.post_workout || null,
                observacoes: planejamento?.observacoes_finalizacao || null
            };
            
        } catch (error) {
            console.error('[TreinoFinalizacao] Erro ao verificar status:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

export default TreinoFinalizacaoService;