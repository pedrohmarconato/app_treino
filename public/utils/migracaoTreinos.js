// Utilitário para migração de treinos executados
import TreinoExecutadoService from '../services/treinoExecutadoService.js';
import { supabase } from '../services/supabaseService.js';

export class MigracaoTreinos {
    
    // Verificar status da migração
    static async verificarStatusMigracao(userId) {
        try {
            console.log('[MigracaoTreinos] Verificando status da migração...');
            
            // Contar execuções não migradas
            const { data: execucoesNaoMigradas } = await supabase
                .from('execucao_exercicio_usuario')
                .select('id, data_execucao')
                .eq('usuario_id', userId)

            
            // Contar sessões já criadas
            const { data: sessoesExistentes } = await supabase
                // .from('treino_executado') // DESATIVADO: tabela inexistente
                .select('id, data_treino')
                .eq('usuario_id', userId);
            
            const status = {
                execucoes_nao_migradas: execucoesNaoMigradas?.length || 0,
                sessoes_existentes: sessoesExistentes?.length || 0,
                precisa_migracao: (execucoesNaoMigradas?.length || 0) > 0,
                datas_nao_migradas: [...new Set(execucoesNaoMigradas?.map(e => e.data_execucao.split('T')[0]) || [])],
                datas_migradas: [...new Set(sessoesExistentes?.map(s => s.data_treino) || [])]
            };
            
            console.log('[MigracaoTreinos] Status:', status);
            return { success: true, data: status };
            
        } catch (error) {
            console.error('[MigracaoTreinos] Erro ao verificar status:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Migrar treinos de um período específico
    static async migrarPeriodo(userId, dataInicio, dataFim, opcoes = {}) {
        try {
            console.log(`[MigracaoTreinos] Iniciando migração: ${dataInicio} a ${dataFim}`);
            
            const resultado = {
                total_execucoes: 0,
                sessoes_criadas: 0,
                execucoes_migradas: 0,
                erros: [],
                detalhes: []
            };
            
            // Buscar execuções do período
            const { data: execucoes } = await supabase
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
                .gte('data_execucao', dataInicio)
                .lte('data_execucao', dataFim + 'T23:59:59')
                .is('treino_executado_id', null)
                .order('data_execucao');
            
            if (!execucoes || execucoes.length === 0) {
                console.log('[MigracaoTreinos] Nenhuma execução para migrar no período');
                return { success: true, data: resultado };
            }
            
            resultado.total_execucoes = execucoes.length;
            
            // Agrupar por data e grupo muscular
            const grupos = this.agruparExecucoes(execucoes);
            
            // Migrar cada grupo
            for (const [chave, grupo] of Object.entries(grupos)) {
                try {
                    const sessaoResult = await this.criarSessaoDoGrupo(userId, grupo, opcoes);
                    
                    if (sessaoResult.success) {
                        resultado.sessoes_criadas++;
                        resultado.execucoes_migradas += grupo.execucoes.length;
                        resultado.detalhes.push({
                            data: grupo.data_treino,
                            grupo_muscular: grupo.grupo_muscular,
                            execucoes: grupo.execucoes.length,
                            sessao_id: sessaoResult.data.id
                        });
                        
                        console.log(`[MigracaoTreinos] ✅ Migrado: ${chave} (${grupo.execucoes.length} exercícios)`);
                    } else {
                        resultado.erros.push(`${chave}: ${sessaoResult.error}`);
                        console.error(`[MigracaoTreinos] ❌ Erro em ${chave}:`, sessaoResult.error);
                    }
                    
                } catch (error) {
                    resultado.erros.push(`${chave}: ${error.message}`);
                    console.error(`[MigracaoTreinos] ❌ Exceção em ${chave}:`, error);
                }
            }
            
            console.log('[MigracaoTreinos] ✅ Migração concluída:', resultado);
            return { success: true, data: resultado };
            
        } catch (error) {
            console.error('[MigracaoTreinos] Erro na migração:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Agrupar execuções por data e grupo muscular
    static agruparExecucoes(execucoes) {
        const grupos = {};
        
        execucoes.forEach(exec => {
            const data = exec.data_execucao.split('T')[0];
            const grupo = exec.exercicios?.grupo_muscular || 'Geral';
            const tipo = exec.exercicios?.tipo_atividade || grupo;
            const chave = `${data}_${grupo}`;
            
            if (!grupos[chave]) {
                grupos[chave] = {
                    data_treino: data,
                    grupo_muscular: grupo,
                    tipo_atividade: tipo,
                    execucoes: [],
                    data_inicio: exec.data_execucao,
                    data_fim: exec.data_execucao
                };
            }
            
            grupos[chave].execucoes.push(exec);
            
            // Atualizar horários
            if (exec.data_execucao < grupos[chave].data_inicio) {
                grupos[chave].data_inicio = exec.data_execucao;
            }
            if (exec.data_execucao > grupos[chave].data_fim) {
                grupos[chave].data_fim = exec.data_execucao;
            }
        });
        
        return grupos;
    }
    
    // Criar sessão de treino a partir de um grupo
    static async criarSessaoDoGrupo(userId, grupo, opcoes = {}) {
        try {
            // Calcular duração
            const inicio = new Date(grupo.data_inicio);
            const fim = new Date(grupo.data_fim);
            const duracaoMinutos = Math.max(1, Math.round((fim - inicio) / (1000 * 60)));
            
            // Criar sessão
            const sessaoResult = await TreinoExecutadoService.criarSessaoTreino({
                usuario_id: userId,
                data_treino: grupo.data_treino,
                grupo_muscular: grupo.grupo_muscular,
                tipo_atividade: grupo.tipo_atividade,
                protocolo_treino_id: grupo.execucoes[0]?.protocolo_treino_id,
                concluido: true,
                data_inicio: grupo.data_inicio,
                data_fim: grupo.data_fim,
                duracao_minutos: duracaoMinutos,
                observacoes: opcoes.observacoes || `Migrado automaticamente - ${grupo.execucoes.length} exercícios`
            });
            
            if (!sessaoResult.success) {
                return sessaoResult;
            }
            
            // Associar execuções à sessão
            const execucaoIds = grupo.execucoes.map(e => e.id);
            
            const { error: updateError } = await supabase
                .from('execucao_exercicio_usuario')
                .update({ treino_executado_id: sessaoResult.data.id })
                .in('id', execucaoIds);
            
            if (updateError) {
                console.error('[MigracaoTreinos] Erro ao associar execuções:', updateError);
                return { success: false, error: updateError.message };
            }
            
            return sessaoResult;
            
        } catch (error) {
            console.error('[MigracaoTreinos] Erro ao criar sessão:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Migrar automaticamente últimos N dias
    static async migrarUltimosDias(userId, dias = 30) {
        const dataFim = new Date().toISOString().split('T')[0];
        const dataInicio = new Date();
        dataInicio.setDate(dataInicio.getDate() - dias);
        const dataInicioStr = dataInicio.toISOString().split('T')[0];
        
        return await this.migrarPeriodo(userId, dataInicioStr, dataFim);
    }
    
    // Interface para mostrar progresso da migração
    static async mostrarProgressoMigracao(userId, callback) {
        try {
            const statusResult = await this.verificarStatusMigracao(userId);
            
            if (!statusResult.success) {
                return statusResult;
            }
            
            const status = statusResult.data;
            
            if (!status.precisa_migracao) {
                callback({ fase: 'completo', mensagem: 'Nenhuma migração necessária' });
                return { success: true, data: { migracoes_necessarias: false } };
            }
            
            callback({ 
                fase: 'iniciando', 
                mensagem: `Encontradas ${status.execucoes_nao_migradas} execuções para migrar` 
            });
            
            // Migrar por períodos menores para melhor controle
            const datas = status.datas_nao_migradas.sort();
            let migradas = 0;
            
            for (let i = 0; i < datas.length; i += 7) { // Migrar semana por semana
                const lote = datas.slice(i, i + 7);
                const dataInicio = lote[0];
                const dataFim = lote[lote.length - 1];
                
                callback({
                    fase: 'migrando',
                    progresso: Math.round((i / datas.length) * 100),
                    mensagem: `Migrando período ${dataInicio} a ${dataFim}...`
                });
                
                const resultado = await this.migrarPeriodo(userId, dataInicio, dataFim);
                
                if (resultado.success) {
                    migradas += resultado.data.execucoes_migradas;
                } else {
                    callback({
                        fase: 'erro',
                        mensagem: `Erro na migração: ${resultado.error}`
                    });
                    return resultado;
                }
            }
            
            callback({
                fase: 'completo',
                progresso: 100,
                mensagem: `Migração concluída! ${migradas} execuções migradas.`
            });
            
            return { success: true, data: { execucoes_migradas: migradas } };
            
        } catch (error) {
            callback({
                fase: 'erro',
                mensagem: `Erro na migração: ${error.message}`
            });
            return { success: false, error: error.message };
        }
    }
}

export default MigracaoTreinos;