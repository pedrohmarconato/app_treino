// Serviço para gerenciar sessões de treino executadas
import { supabase } from './supabaseService.js';
import { nowInSaoPaulo, toSaoPauloDateString, toSaoPauloISOString } from '../utils/timezoneUtils.js';

// AVISO: Todas as operações com 'treino_executado' foram desativadas por ausência da tabela.
export class TreinoExecutadoService {
    
    // Criar nova sessão de treino
    static async criarSessaoTreino(dados) {
        try {
            const { data, error } = await supabase
                // .from('treino_executado') // DESATIVADO: tabela inexistente
                .insert({
                    usuario_id: dados.usuario_id,
                    data_treino: dados.data_treino || toSaoPauloDateString(new Date()),
                    grupo_muscular: dados.grupo_muscular,
                    tipo_atividade: dados.tipo_atividade,
                    protocolo_treino_id: dados.protocolo_treino_id,
                    ano: dados.ano || new Date().getFullYear(),
                    semana: dados.semana,
                    dia_semana: dados.dia_semana,
                    data_inicio: nowInSaoPaulo(),
                    observacoes: dados.observacoes
                })
                .select()
                .single();
                
            // DESATIVADO: Não criar sessão pois tabela não existe
            return { success: false, error: 'Operação desativada: tabela treino_executado não existe.' };
        } catch (error) {
            return { success: false, error: 'Operação desativada: tabela treino_executado não existe.' };
        }
    }
    
    // Finalizar sessão de treino
    static async finalizarSessaoTreino(sessaoId, dados = {}) {
        try {
            const { data, error } = await supabase
                // .from('treino_executado') // DESATIVADO: tabela inexistente
                .update({
                    concluido: true,
                    data_fim: nowInSaoPaulo(),
                    duracao_minutos: dados.duracao_minutos,
                    observacoes: dados.observacoes,
                    updated_at: nowInSaoPaulo()
                })
                .eq('id', sessaoId)
                .select()
                .single();
                
            if (error) throw error;
            
            // Marcar planejamento como concluído
            if (data.usuario_id && data.dia_semana !== null) {
                await this.sincronizarPlanejamento(data);
            }
            
            console.log('[TreinoExecutadoService] Sessão finalizada:', data);
            return { success: true, data };
            
        } catch (error) {
            console.error('[TreinoExecutadoService] Erro ao finalizar:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Buscar histórico de treinos
    static async buscarHistoricoTreinos(userId, filtros = {}) {
        try {
            let query = supabase
                // .from('treino_executado') // DESATIVADO: tabela inexistente
                .select('*')
                .eq('usuario_id', userId)
                .eq('concluido', true)
                .order('data_treino', { ascending: false });
                
            // Aplicar filtros
            if (filtros.data_inicio) {
                query = query.gte('data_treino', filtros.data_inicio);
            }
            
            if (filtros.data_fim) {
                query = query.lte('data_treino', filtros.data_fim);
            }
            
            if (filtros.grupo_muscular) {
                query = query.eq('grupo_muscular', filtros.grupo_muscular);
            }
            
            if (filtros.limit) {
                query = query.limit(filtros.limit);
            }
            
            const { data: sessoes, error } = await query;
            
            if (error) throw error;
            
            // Buscar execuções para cada sessão
            if (sessoes && sessoes.length > 0) {
                for (let sessao of sessoes) {
                    const { data: execucoes, error: errorExec } = await supabase
                        .from('execucao_exercicio_usuario')
                        .select(`
                            id,
                            exercicio_id,
                            peso_utilizado,
                            repeticoes,
                            serie_numero,
                            falhou,
                            exercicios (
                                nome,
                                grupo_muscular,
                                equipamento
                            )
                        `)
                        .eq('usuario_id', userId)
                        .eq('data_execucao', sessao.data_treino)

                    
                    if (!errorExec) {
                        sessao.execucao_exercicio_usuario = execucoes;
                    }
                }
            }
            
            return { success: true, data: sessoes };
            
        } catch (error) {
            console.error('[TreinoExecutadoService] Erro ao buscar histórico:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Buscar sessão por data específica
    static async buscarSessaoPorData(userId, data, grupoMuscular = null) {
        try {
            let query = supabase
                // .from('treino_executado') // DESATIVADO: tabela inexistente
                .select(`
                    *
                `)
                .eq('usuario_id', userId)
                .eq('data_treino', data);
                
            if (grupoMuscular) {
                query = query.eq('grupo_muscular', grupoMuscular);
            }
            
            const { data: sessoes, error } = await query;
            
            if (error) throw error;
            
            // Se encontrou sessões, buscar as execuções separadamente
            if (sessoes && sessoes.length > 0) {
                for (let sessao of sessoes) {
                    const { data: execucoes, error: errorExec } = await supabase
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
                        .eq('data_execucao', data)

                    
                    if (!errorExec) {
                        sessao.execucao_exercicio_usuario = execucoes;
                    }
                }
            }
            
            return { success: true, data: sessoes };
            
        } catch (error) {
            console.error('[TreinoExecutladoService] Erro ao buscar sessão:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Migrar execuções existentes para novo sistema
    static async migrarExecucoesExistentes(userId, dataInicio, dataFim) {
        try {
            console.log('[TreinoExecutadoService] Iniciando migração...');
            
            // Buscar execuções sem sessão
            const { data: execucoes } = await supabase
                .from('execucao_exercicio_usuario')
                .select(`
                    *,
                    exercicios (
                        grupo_muscular,
                        tipo_atividade
                    )
                `)
                .eq('usuario_id', userId)
                .gte('data_execucao', dataInicio)
                .lte('data_execucao', dataFim)
                .order('data_execucao', { ascending: false })

                
            if (!execucoes || execucoes.length === 0) {
                console.log('[TreinoExecutladoService] Nenhuma execução para migrar');
                return { success: true, migradas: 0 };
            }
            
            // Agrupar por data e grupo muscular
            const grupos = {};
            
            execucoes.forEach(exec => {
                const data = exec.data_execucao.split('T')[0];
                const grupo = exec.exercicios?.grupo_muscular || 'Geral';
                const chave = `${data}_${grupo}`;
                
                if (!grupos[chave]) {
                    grupos[chave] = {
                        data_treino: data,
                        grupo_muscular: grupo,
                        tipo_atividade: exec.exercicios?.tipo_atividade || grupo,
                        execucoes: []
                    };
                }
                
                grupos[chave].execucoes.push(exec);
            });
            
            let migradas = 0;
            
            // Criar sessões e associar execuções
            for (const [chave, grupo] of Object.entries(grupos)) {
                // Criar sessão
                const sessaoResult = await this.criarSessaoTreino({
                    usuario_id: userId,
                    data_treino: grupo.data_treino,
                    grupo_muscular: grupo.grupo_muscular,
                    tipo_atividade: grupo.tipo_atividade,
                    concluido: true,
                    data_inicio: grupo.execucoes[0].data_execucao,
                    data_fim: grupo.execucoes[grupo.execucoes.length - 1].data_execucao
                });
                
                if (sessaoResult.success) {
                    // Associar execuções à sessão
                    const execucaoIds = grupo.execucoes.map(e => e.id);
                    
                    const { error: updateError } = await supabase
                        .from('execucao_exercicio_usuario')
                        .update({ sessao_treino_id: sessaoResult.data.id })
                        .in('id', execucaoIds);
                        
                    if (updateError) {
                        console.error('Erro ao associar execuções:', updateError);
                    }
                        
                    migradas += grupo.execucoes.length;
                    
                    console.log(`[TreinoExecutladoService] Migrada sessão: ${chave} (${grupo.execucoes.length} exercícios)`);
                }
            }
            
            console.log(`[TreinoExecutladoService] Migração concluída: ${migradas} execuções`);
            return { success: true, migradas };
            
        } catch (error) {
            console.error('[TreinoExecutladoService] Erro na migração:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Sincronizar com planejamento semanal
    static async sincronizarPlanejamento(sessao) {
        try {
            if (!sessao.ano || !sessao.semana || sessao.dia_semana === null) {
                return { success: false, error: 'Dados insuficientes para sincronização' };
            }
            
            await supabase
                .from('planejamento_semanal')
                .update({
                    concluido: true,
                    data_conclusao: sessao.data_fim || nowInSaoPaulo(),
                    protocolo_treino_id: sessao.protocolo_treino_id
                })
                .eq('usuario_id', sessao.usuario_id)
                .eq('ano', sessao.ano)
                .eq('semana', sessao.semana)
                .eq('dia_semana', sessao.dia_semana);
                
            console.log('[TreinoExecutladoService] Planejamento sincronizado');
            return { success: true };
            
        } catch (error) {
            console.error('[TreinoExecutladoService] Erro ao sincronizar:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Estatísticas de treino
    static async obterEstatisticas(userId, periodo = 30) {
        try {
            const dataInicio = new Date();
            dataInicio.setDate(dataInicio.getDate() - periodo);
            
            const { data, error } = await supabase
                // .from('treino_executado') // DESATIVADO: tabela inexistente
                .select('*')
                .eq('usuario_id', userId)
                .eq('concluido', true)
                .gte('data_treino', toSaoPauloDateString(dataInicio));
                
            if (error) throw error;
            
            const stats = {
                total_treinos: data.length,
                peso_total: data.reduce((sum, t) => sum + (t.peso_total || 0), 0),
                grupos_musculares: [...new Set(data.map(t => t.grupo_muscular))].length,
                duracao_media: data.reduce((sum, t) => sum + (t.duracao_minutos || 0), 0) / data.length
            };
            
            return { success: true, data: stats };
            
        } catch (error) {
            console.error('[TreinoExecutladoService] Erro nas estatísticas:', error);
            return { success: false, error: error.message };
        }
    }
}

export default TreinoExecutadoService;