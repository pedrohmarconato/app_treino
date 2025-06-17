// services/workoutProtocolService.js - Protocolo completo funcionando
import { query, insert, update } from './supabaseService.js';
import { WeightCalculatorService } from './weightCalculatorService.js';
import WeeklyPlanService from './weeklyPlanningService.js';
import AppState from '../state/appState.js';

export class WorkoutProtocolService {
    
    /**
     * Carregar treino completo para execução
     */
    static async carregarTreinoParaExecucao(userId) {
        try {
            console.log('[WorkoutProtocol] Carregando treino para execução:', userId);
            
            // 1. Buscar protocolo ativo do usuário
            const { data: planoUsuario } = await query('usuario_plano_treino', {
                select: '*, protocolos_treinamento(*)',
                eq: { usuario_id: userId, status: 'ativo' },
                single: true
            });
            
            if (!planoUsuario) {
                throw new Error('Usuário não possui protocolo ativo');
            }
            
            // CORREÇÃO: Usar sempre a semana do plano do usuário, não do calendário
            // O calendário pode estar em uma semana diferente da progressão do usuário
            const hoje = new Date();
            const { data: calendarioHoje } = await query('d_calendario', {
                eq: { data_completa: hoje.toISOString().split('T')[0] },
                single: true
            });
            
            const semanaAtual = planoUsuario.semana_atual || 1;
            
            console.log(`[WorkoutProtocol] 📊 DIAGNÓSTICO COMPLETO DE SEMANAS (CORRIGIDO):`, {
                hoje: hoje.toISOString().split('T')[0],
                calendarioHoje: calendarioHoje,
                semanaCalendario: calendarioHoje?.semana_treino,
                semanaPlano: planoUsuario.semana_atual,
                semanaFinal: semanaAtual,
                observacao: 'USANDO_SEMANA_DO_PLANO_NAO_CALENDARIO',
                planoUsuario: planoUsuario
            });
            
            // 2. Buscar planejamento semanal (qual treino fazer hoje)
            const { data: planejamentoHoje } = await this.buscarTreinoDeHoje(userId, semanaAtual);
            
            if (!planejamentoHoje || planejamentoHoje.tipo === 'folga') {
                return {
                    tipo: 'folga',
                    nome: 'Dia de Folga',
                    exercicios: [],
                    semana_atual: semanaAtual
                };
            }
            
            if (planejamentoHoje.tipo === 'cardio') {
                return {
                    tipo: 'cardio', 
                    nome: 'Treino Cardiovascular',
                    exercicios: [],
                    semana_atual: semanaAtual
                };
            }
            
            // 3. Usar protocolo_id do planejamento (garantindo consistência)
            const protocoloId = planejamentoHoje.protocolo_treinamento_id || planoUsuario.protocolo_treinamento_id;
            
            console.log('[WorkoutProtocolService] 🔍 Parâmetros para buscar exercícios:', {
                userId,
                tipoAtividade: planejamentoHoje.tipo_atividade,
                protocoloId,
                semanaAtual,
                planejamentoHoje
            });
            
            const exerciciosComPesos = await WeightCalculatorService.calcularPesosTreino(
                userId,
                planejamentoHoje.tipo_atividade,
                protocoloId,
                semanaAtual
            );
            
            // 4. Adicionar dados de execuções anteriores
            const exerciciosCompletos = await Promise.all(
                exerciciosComPesos.map(async (exercicio) => {
                    const execucoesAnteriores = await this.buscarExecucoesAnteriores(
                        userId, 
                        exercicio.exercicio_id,
                        semanaAtual
                    );
                    
                    return {
                        ...exercicio,
                        execucoes_anteriores: execucoesAnteriores,
                        series_executadas: 0,
                        status: 'pendente' // 'pendente', 'em_andamento', 'concluido'
                    };
                })
            );
            
            const treinoCompleto = {
                tipo: 'treino',
                nome: `Treino ${planejamentoHoje.tipo_atividade || 'Força'}`,
                tipo_atividade: planejamentoHoje.tipo_atividade,
                semana_atual: semanaAtual,
                protocolo_id: planoUsuario.protocolo_treinamento_id,
                exercicios: exerciciosCompletos,
                data_inicio: new Date().toISOString(),
                status: 'ativo'
            };
            
            console.log(`[WorkoutProtocol] ✅ Treino carregado: ${exerciciosCompletos.length} exercícios`);
            return treinoCompleto;
            
        } catch (error) {
            console.error('[WorkoutProtocol] Erro ao carregar treino:', error);
            throw error;
        }
    }
    
    /**
     * Buscar qual treino fazer hoje usando JOIN com protocolo do usuário
     */
    static async buscarTreinoDeHoje(userId, semanaProtocolo = null) {
        try {
            // Validar userId
            if (!userId) {
                console.warn('[WorkoutProtocol] userId não fornecido para buscarTreinoDeHoje');
                return { data: null, error: 'userId é obrigatório' };
            }
            
            const hoje = new Date();
            const diaSemana = hoje.getDay(); // 0=domingo, 1=segunda...
            const diaDb = WeeklyPlanService.dayToDb(diaSemana); // Converter para formato DB
            const ano = hoje.getFullYear();
            // CORREÇÃO: Usar semana do protocolo se fornecida, senão usar semana do calendário
            const semana = semanaProtocolo || this.getWeekNumber(hoje);
            
            console.log(`[WorkoutProtocol] Buscando treino para: userId=${userId}, dia=${diaDb}, ano=${ano}, semana=${semana} (protocolo: ${semanaProtocolo ? 'sim' : 'não'})`);
            
            // Usar tabela planejamento_semanal diretamente para evitar múltiplos registros
            const { data: planejamento, error } = await query('planejamento_semanal', {
                eq: {
                    usuario_id: parseInt(userId),
                    ano: ano,
                    semana: semana,
                    dia_semana: diaDb
                },
                single: true
            });
            
            if (error) {
                console.error('[WorkoutProtocol] Erro ao buscar planejamento:', error);
                return { data: null, error: error.message };
            }
            
            if (!planejamento) {
                console.warn(`[WorkoutProtocol] Nenhum planejamento encontrado para hoje`);
                // Retornar folga como padrão
                return { 
                    data: {
                        tipo_atividade: 'folga',
                        concluido: false
                    } 
                };
            }
            
            console.log('[WorkoutProtocol] ✅ Planejamento encontrado:', planejamento);
            return { data: planejamento, error: null };
            
        } catch (error) {
            console.error('[WorkoutProtocol] Erro em buscarTreinoDeHoje:', error);
            return { data: null, error: error.message };
        }
    }
    
    /**
     * Executar série de um exercício
     */
    static async executarSerie(userId, dadosExecucao) {
        try {
            console.log('[WorkoutProtocol] Executando série:', dadosExecucao);
            
            const {
                exercicio_id,
                protocolo_treino_id,
                peso_utilizado,
                repeticoes_realizadas,
                serie_numero,
                observacoes
            } = dadosExecucao;
            
            // 1. Validar dados
            if (!peso_utilizado || !repeticoes_realizadas) {
                throw new Error('Peso e repetições são obrigatórios');
            }
            
            // 2. Salvar execução no banco
            const { data: execucao, error } = await insert('execucao_exercicio_usuario', {
                usuario_id: userId,
                protocolo_treino_id: protocolo_treino_id,
                exercicio_id: exercicio_id,
                data_execucao: new Date().toISOString(),
                peso_utilizado: parseFloat(peso_utilizado),
                repeticoes: parseInt(repeticoes_realizadas),
                serie_numero: serie_numero || 1,
                falhou: parseInt(repeticoes_realizadas) < (dadosExecucao.repeticoes_alvo || 8),
                observacoes: observacoes || null
            });
            
            if (error) {
                throw new Error(`Erro ao salvar execução: ${error.message}`);
            }
            
            // 3. Verificar se deve atualizar 1RM
            await this.verificarAtualizacao1RM(userId, exercicio_id, peso_utilizado, repeticoes_realizadas);
            
            // 4. Retornar dados da execução
            const resultado = {
                id: execucao[0]?.id,
                peso_utilizado: parseFloat(peso_utilizado),
                repeticoes_realizadas: parseInt(repeticoes_realizadas),
                serie_numero: serie_numero,
                data_execucao: new Date().toISOString(),
                sucesso: true
            };
            
            console.log('[WorkoutProtocol] ✅ Série executada:', resultado);
            return resultado;
            
        } catch (error) {
            console.error('[WorkoutProtocol] Erro ao executar série:', error);
            throw error;
        }
    }
    
    /**
     * Finalizar exercício completo
     */
    static async finalizarExercicio(userId, exercicioId) {
        try {
            // Buscar todas as séries executadas hoje para este exercício
            const hoje = new Date().toISOString().split('T')[0];
            const { data: execucoes } = await query('execucao_exercicio_usuario', {
                eq: {
                    usuario_id: userId,
                    exercicio_id: exercicioId
                },
                gte: { data_execucao: `${hoje}T00:00:00` },
                lte: { data_execucao: `${hoje}T23:59:59` }
            });
            
            const totalSeries = execucoes?.length || 0;
            const pesoMedio = execucoes?.reduce((sum, e) => sum + e.peso_utilizado, 0) / totalSeries;
            const repsTotal = execucoes?.reduce((sum, e) => sum + e.repeticoes, 0);
            
            console.log(`[WorkoutProtocol] ✅ Exercício finalizado: ${totalSeries} séries, peso médio: ${pesoMedio?.toFixed(1)}kg`);
            
            return {
                exercicio_id: exercicioId,
                series_realizadas: totalSeries,
                peso_medio: Math.round(pesoMedio * 10) / 10,
                repeticoes_total: repsTotal,
                concluido: true
            };
            
        } catch (error) {
            console.error('[WorkoutProtocol] Erro ao finalizar exercício:', error);
            throw error;
        }
    }
    
    /**
     * Finalizar treino completo
     */
    static async finalizarTreino(userId, dadosTreino) {
        try {
            console.log('[WorkoutProtocol] Finalizando treino:', dadosTreino);
            
            const {
                exercicios_realizados,
                tempo_total,
                observacoes
            } = dadosTreino;
            
            // 1. Calcular estatísticas do treino
            const totalExercicios = exercicios_realizados.length;
            const totalSeries = exercicios_realizados.reduce((sum, ex) => sum + ex.series_realizadas, 0);
            const pesoTotal = exercicios_realizados.reduce((sum, ex) => 
                sum + (ex.peso_medio * ex.series_realizadas), 0
            );
            
            // 2. Marcar treino como concluído no planejamento semanal
            await this.marcarTreinoComoConcluido(userId);
            
            // 3. Verificar se pode avançar de semana
            const podeAvancar = await this.verificarProgressaoSemanal(userId);
            
            const resultado = {
                treino_concluido: true,
                data_conclusao: new Date().toISOString(),
                estatisticas: {
                    exercicios_realizados: totalExercicios,
                    series_total: totalSeries,
                    peso_total: Math.round(pesoTotal),
                    tempo_total: tempo_total
                },
                proxima_acao: podeAvancar ? 'semana_avancada' : 'continuar_semana',
                observacoes: observacoes
            };
            
            console.log('[WorkoutProtocol] ✅ Treino finalizado:', resultado);
            return resultado;
            
        } catch (error) {
            console.error('[WorkoutProtocol] Erro ao finalizar treino:', error);
            throw error;
        }
    }
    
    /**
     * Verificar se deve atualizar 1RM baseado na execução
     */
    static async verificarAtualizacao1RM(userId, exercicioId, peso, reps) {
        try {
            // Só atualizar se fez 1-5 reps (range de força)
            if (reps < 1 || reps > 5) return;
            
            // Calcular novo 1RM baseado na execução
            const novo1RM = WeightCalculatorService.calcular1RMPorExecucao(peso, reps);
            if (!novo1RM) return;
            
            // Buscar 1RM atual
            const { data: rmAtual } = await query('usuario_1rm', {
                eq: {
                    usuario_id: userId,
                    exercicio_id: exercicioId,
                    status: 'ativo'
                },
                order: { column: 'data_teste', ascending: false },
                limit: 1
            });
            
            // Só atualizar se o novo 1RM for significativamente maior (>2.5kg)
            const rmAtualData = rmAtual && rmAtual.length > 0 ? rmAtual[0] : null;
            if (!rmAtualData || novo1RM > (rmAtualData.rm_calculado + 2.5)) {
                await insert('usuario_1rm', {
                    usuario_id: userId,
                    exercicio_id: exercicioId,
                    peso_teste: peso,
                    repeticoes_teste: reps,
                    rm_calculado: novo1RM,
                    data_teste: new Date().toISOString().split('T')[0],
                    status: 'ativo'
                });
                
                console.log(`[WorkoutProtocol] ✅ 1RM atualizado: ${novo1RM}kg (anterior: ${rmAtualData?.rm_calculado || 'N/A'}kg)`);
            }
            
        } catch (error) {
            console.error('[WorkoutProtocol] Erro ao verificar 1RM:', error);
        }
    }
    
    /**
     * Buscar execuções anteriores para feedback
     */
    static async buscarExecucoesAnteriores(userId, exercicioId, semanaAtual) {
        try {
            const { data: execucoes } = await query('execucao_exercicio_usuario', {
                eq: {
                    usuario_id: userId,
                    exercicio_id: exercicioId
                },
                order: { column: 'data_execucao', ascending: false },
                limit: 5
            });
            
            return execucoes || [];
            
        } catch (error) {
            console.error('[WorkoutProtocol] Erro ao buscar execuções anteriores:', error);
            return [];
        }
    }
    
    /**
     * Marcar treino como concluído no planejamento semanal
     */
    static async marcarTreinoComoConcluido(userId) {
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const semana = this.getWeekNumber(hoje);
        const diaSemana = WeeklyPlanService.dayToDb(hoje.getDay()); // Converter para formato DB
        
        await update('planejamento_semanal', 
            { 
                concluido: true, 
                data_conclusao: new Date().toISOString() 
            },
            {
                eq: {
                    usuario_id: userId,
                    ano: ano,
                    semana: semana,
                    dia_semana: diaSemana
                }
            }
        );
    }
    
    /**
     * Verificar se pode avançar de semana (lógica para domingo)
     */
    static async verificarProgressaoSemanal(userId) {
        try {
            // Contar treinos concluídos nesta semana
            const hoje = new Date();
            const ano = hoje.getFullYear();
            const semana = this.getWeekNumber(hoje);
            
            const { data: planejamentoSemana } = await query('planejamento_semanal', {
                eq: {
                    usuario_id: userId,
                    ano: ano,
                    semana: semana
                }
            });
            
            const treinosConcluidos = planejamentoSemana?.filter(p => 
                p.concluido && p.tipo_atividade === 'Treino'
            ).length || 0;
            
            // Se hoje é domingo E completou pelo menos 2 treinos, pode avançar
            const isDomingo = hoje.getDay() === 0;
            const podeAvancar = isDomingo && treinosConcluidos >= 2;
            
            if (podeAvancar) {
                await this.avancarSemanaUsuario(userId);
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error('[WorkoutProtocol] Erro ao verificar progressão:', error);
            return false;
        }
    }
    
    /**
     * Avançar usuário para próxima semana
     */
    static async avancarSemanaUsuario(userId) {
        try {
            const { data: planoAtual } = await query('usuario_plano_treino', {
                eq: { usuario_id: userId, status: 'ativo' },
                single: true
            });
            
            if (!planoAtual) return false;
            
            const novaSemana = Math.min((planoAtual.semana_atual || 1) + 1, 12);
            
            await update('usuario_plano_treino',
                { 
                    semana_atual: novaSemana,
                    updated_at: new Date().toISOString()
                },
                { eq: { id: planoAtual.id } }
            );
            
            console.log(`[WorkoutProtocol] ✅ Usuário avançou para semana ${novaSemana}`);
            return true;
            
        } catch (error) {
            console.error('[WorkoutProtocol] Erro ao avançar semana:', error);
            return false;
        }
    }
    
    /**
     * Obter número da semana ISO
     */
    static getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }
    
    /**
     * Obter estatísticas do usuário
     */
    static async obterEstatisticasUsuario(userId) {
        try {
            // Buscar da view existente
            const { data: stats } = await query('v_estatisticas_usuarios', {
                eq: { usuario_id: userId },
                single: true
            });
            
            // Buscar semana atual
            const { data: plano } = await query('usuario_plano_treino', {
                eq: { usuario_id: userId, status: 'ativo' },
                single: true
            });
            
            return {
                ...stats,
                semana_atual: plano?.semana_atual || 1,
                protocolo_id: plano?.protocolo_treinamento_id
            };
            
        } catch (error) {
            console.error('[WorkoutProtocol] Erro ao obter estatísticas:', error);
            return {
                semana_atual: 1,
                total_treinos_realizados: 0,
                percentual_progresso: 0
            };
        }
    }
}

export default WorkoutProtocolService;