// Serviço para gerenciar finalização manual de treinos
import { supabase } from './supabaseService.js';
import TreinoExecutladoService from './treinoExecutadoService.js';

export class TreinoFinalizacaoService {
    
    // Finalizar treino manualmente
    static async finalizarTreino(userId, opcoes = {}) {
        try {
            const {
                protocolo_treino_id = null,
                grupo_muscular = null,
                observacoes = null,
                avaliacao = null // dados da avaliação do usuário
            } = opcoes;
            
            console.log(`[TreinoFinalizacaoService] Iniciando finalização manual para usuário ${userId}`);
            
            const hoje = new Date();
            const dataHoje = hoje.toISOString().split('T')[0];
            
            // Verificar se já existe treino finalizado hoje
            const jaFinalizado = await this.verificarTreinoJaFinalizado(userId, dataHoje, grupo_muscular);
            
            if (jaFinalizado.finalizado) {
                return {
                    success: false,
                    erro: 'TREINO_JA_FINALIZADO',
                    mensagem: 'Treino já foi finalizado hoje',
                    data_finalizacao: jaFinalizado.data_conclusao
                };
            }
            
            // Buscar dados para finalização
            const dadosTreino = await this.coletarDadosFinalizacao(userId, protocolo_treino_id, grupo_muscular);
            
            if (!dadosTreino.execucoes || dadosTreino.execucoes.length === 0) {
                return {
                    success: false,
                    erro: 'SEM_EXECUCOES',
                    mensagem: 'Nenhuma execução encontrada para finalizar'
                };
            }
            
            // Criar ou atualizar sessão na nova estrutura
            const sessaoResult = await this.criarSessaoTreino(userId, dadosTreino, observacoes);
            
            if (!sessaoResult.success) {
                return sessaoResult;
            }
            
            // Atualizar planejamento_semanal com avaliação
            const planejamentoResult = await this.atualizarPlanejamentoSemanal(userId, dadosTreino, hoje, avaliacao);
            
            if (!planejamentoResult.success) {
                console.warn('[TreinoFinalizacaoService] Erro ao atualizar planejamento:', planejamentoResult.error);
                // Não falhar a finalização por erro no planejamento
            }
            
            // Associar execuções à sessão
            if (sessaoResult.data?.id) {
                await this.associarExecucoesSessao(dadosTreino.execucoes, sessaoResult.data.id);
            }
            
            const resultado = {
                success: true,
                sessao_id: sessaoResult.data?.id,
                execucoes_finalizadas: dadosTreino.execucoes.length,
                grupo_muscular: dadosTreino.grupo_muscular,
                tipo_finalizacao: 'manual',
                data_finalizacao: hoje.toISOString(),
                planejamento_atualizado: planejamentoResult.success,
                avaliacao_salva: !!avaliacao
            };
            
            console.log('[TreinoFinalizacaoService] ✅ Treino finalizado com sucesso:', resultado);
            
            return resultado;
            
        } catch (error) {
            console.error('[TreinoFinalizacaoService] Erro ao finalizar treino:', error);
            return {
                success: false,
                erro: 'ERRO_FINALIZACAO',
                mensagem: error.message
            };
        }
    }
    
    // Verificar se treino já foi finalizado hoje
    static async verificarTreinoJaFinalizado(userId, data, grupoMuscular = null) {
        try {
            const hoje = new Date();
            const ano = hoje.getFullYear();
            const semana = this.calcularSemana(hoje);
            const diaSemana = hoje.getDay();
            
            // Verificar no planejamento_semanal
            const { data: planejamento } = await supabase
                .from('planejamento_semanal')
                .select('concluido, data_conclusao, tipo_atividade')
                .eq('usuario_id', userId)
                .eq('ano', ano)
                .eq('semana', semana)
                .eq('dia_semana', diaSemana)
                .single();
            
            // Verificar na nova estrutura
            // let query = supabase
            //     .from('treino_executado') // DESATIVADO: tabela inexistente
                .select('id, concluido, data_fim, grupo_muscular')
                .eq('usuario_id', userId)
                .eq('data_treino', data)
                .eq('concluido', true);
                
            if (grupoMuscular) {
                query = query.eq('grupo_muscular', grupoMuscular);
            }
            
            const { data: sessoes } = await query;
            
            const finalizadoPlanejamento = planejamento?.concluido || false;
            const finalizadoSessao = sessoes && sessoes.length > 0;
            
            return {
                finalizado: finalizadoPlanejamento || finalizadoSessao,
                data_conclusao: planejamento?.data_conclusao || sessoes?.[0]?.data_fim,
                fonte: finalizadoPlanejamento ? 'planejamento' : (finalizadoSessao ? 'sessao' : 'nenhuma')
            };
            
        } catch (error) {
            console.error('[TreinoFinalizacaoService] Erro ao verificar finalização:', error);
            return { finalizado: false, erro: error.message };
        }
    }
    
    // Coletar dados para finalização
    static async coletarDadosFinalizacao(userId, protocoloTreinoId, grupoMuscular) {
        try {
            const hoje = new Date();
            const dataHoje = hoje.toISOString().split('T')[0];
            const hojeInicio = `${dataHoje}T00:00:00`;
            const hojeAtual = hoje.toISOString();
            
            // Buscar execuções do dia
            let query = supabase
                .from('execucao_exercicio_usuario')
                .select(`
                    *,
                    exercicios (
                        nome,
                        grupo_muscular,
                        tipo_atividade
                    )
                `)
                .eq('usuario_id', userId)
                .gte('data_execucao', hojeInicio)
                .lte('data_execucao', hojeAtual)
                .order('data_execucao');
                
            if (protocoloTreinoId) {
                query = query.eq('protocolo_treino_id', protocoloTreinoId);
            }
            
            const { data: execucoes } = await query;
            
            if (!execucoes || execucoes.length === 0) {
                return { execucoes: [] };
            }
            
            // Determinar grupo muscular principal
            const grupoDetectado = grupoMuscular || 
                this.determinarGrupoMuscularPrincipal(execucoes) || 
                'Treino Geral';
            
            // Calcular métricas
            const primeiraExecucao = execucoes[0];
            const ultimaExecucao = execucoes[execucoes.length - 1];
            const duracaoMinutos = Math.max(1, Math.round(
                (new Date(ultimaExecucao.data_execucao) - new Date(primeiraExecucao.data_execucao)) / (1000 * 60)
            ));
            
            const pesoTotal = execucoes.reduce((total, exec) => 
                total + ((exec.peso_utilizado || 0) * (exec.repeticoes || 0)), 0
            );
            
            return {
                execucoes,
                grupo_muscular: grupoDetectado,
                tipo_atividade: primeiraExecucao.exercicios?.tipo_atividade || grupoDetectado,
                protocolo_treino_id: protocoloTreinoId || primeiraExecucao.protocolo_treino_id,
                data_inicio: primeiraExecucao.data_execucao,
                data_fim: ultimaExecucao.data_execucao,
                duracao_minutos: duracaoMinutos,
                peso_total: pesoTotal,
                total_exercicios: new Set(execucoes.map(e => e.exercicio_id)).size,
                total_series: execucoes.length
            };
            
        } catch (error) {
            console.error('[TreinoFinalizacaoService] Erro ao coletar dados:', error);
            return { execucoes: [], erro: error.message };
        }
    }
    
    // Determinar grupo muscular principal do treino
    static determinarGrupoMuscularPrincipal(execucoes) {
        const grupos = {};
        
        execucoes.forEach(exec => {
            const grupo = exec.exercicios?.grupo_muscular || 'Geral';
            grupos[grupo] = (grupos[grupo] || 0) + 1;
        });
        
        return Object.entries(grupos)
            .sort(([,a], [,b]) => b - a)[0]?.[0];
    }
    
    // Criar sessão na nova estrutura
    static async criarSessaoTreino(userId, dadosTreino, observacoes) {
        try {
            return await TreinoExecutladoService.criarSessaoTreino({
                usuario_id: userId,
                data_treino: new Date().toISOString().split('T')[0],
                grupo_muscular: dadosTreino.grupo_muscular,
                tipo_atividade: dadosTreino.tipo_atividade,
                protocolo_treino_id: dadosTreino.protocolo_treino_id,
                concluido: true,
                data_inicio: dadosTreino.data_inicio,
                data_fim: dadosTreino.data_fim,
                duracao_minutos: dadosTreino.duracao_minutos,
                observacoes: observacoes || `Finalizado ${dadosTreino.total_exercicios} exercícios, ${dadosTreino.total_series} séries`
            });
            
        } catch (error) {
            console.error('[TreinoFinalizacaoService] Erro ao criar sessão:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Atualizar planejamento_semanal
    static async atualizarPlanejamentoSemanal(userId, dadosTreino, dataFinalizacao, avaliacao = null) {
        try {
            const ano = dataFinalizacao.getFullYear();
            const semana = this.calcularSemana(dataFinalizacao);
            const diaSemana = dataFinalizacao.getDay();
            
            const updateData = {
                concluido: true,
                data_conclusao: dataFinalizacao.toISOString(),
                protocolo_treino_id: dadosTreino.protocolo_treino_id
            };
            
            // Adicionar resposta da avaliação se fornecida
            if (avaliacao && avaliacao.qualidade !== undefined) {
                updateData.resposta_avaliacao = JSON.stringify(avaliacao);
            }
            
            const { error } = await supabase
                .from('planejamento_semanal')
                .update(updateData)
                .eq('usuario_id', userId)
                .eq('ano', ano)
                .eq('semana', semana)
                .eq('dia_semana', diaSemana);
            
            if (error) {
                console.error('[TreinoFinalizacaoService] Erro ao atualizar planejamento:', error);
                return { success: false, error: error.message };
            }
            
            console.log('[TreinoFinalizacaoService] ✅ Planejamento semanal atualizado');
            return { success: true };
            
        } catch (error) {
            console.error('[TreinoFinalizacaoService] Erro ao atualizar planejamento:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Associar execuções à sessão
    static async associarExecucoesSessao(execucoes, sessaoId) {
        try {
            const execucaoIds = execucoes.map(e => e.id);
            
            const { error } = await supabase
                .from('execucao_exercicio_usuario')

                .in('id', execucaoIds);
            
            if (error) {
                console.error('[TreinoFinalizacaoService] Erro ao associar execuções:', error);
            } else {
                console.log(`[TreinoFinalizacaoService] ✅ ${execucaoIds.length} execuções associadas à sessão ${sessaoId}`);
            }
            
        } catch (error) {
            console.error('[TreinoFinalizacaoService] Erro ao associar execuções:', error);
        }
    }
    
    // Utilitário para calcular semana do ano
    static calcularSemana(data) {
        const inicioAno = new Date(data.getFullYear(), 0, 1);
        const diasDoAno = Math.floor((data - inicioAno) / (24 * 60 * 60 * 1000));
        return Math.ceil((diasDoAno + inicioAno.getDay() + 1) / 7);
    }
    
    // Interface para mostrar status de finalização
    static async obterStatusFinalizacao(userId) {
        try {
            const hoje = new Date();
            const dataHoje = hoje.toISOString().split('T')[0];
            
            // Verificar se já finalizado
            const jaFinalizado = await this.verificarTreinoJaFinalizado(userId, dataHoje);
            
            if (jaFinalizado.finalizado) {
                return {
                    pode_finalizar: false,
                    ja_finalizado: true,
                    data_finalizacao: jaFinalizado.data_conclusao,
                    fonte: jaFinalizado.fonte
                };
            }
            
            // Buscar execuções do dia para mostrar status atual
            const dadosTreino = await this.coletarDadosFinalizacao(userId);
            
            return {
                pode_finalizar: true,
                ja_finalizado: false,
                execucoes_hoje: dadosTreino.execucoes?.length || 0,
                grupo_muscular: dadosTreino.grupo_muscular,
                total_exercicios: dadosTreino.total_exercicios || 0,
                total_series: dadosTreino.total_series || 0
            };
            
        } catch (error) {
            console.error('[TreinoFinalizacaoService] Erro ao obter status:', error);
            return { 
                pode_finalizar: false, 
                erro: error.message 
            };
        }
    }
}

export default TreinoFinalizacaoService;