/**
 * 🏋️ SERVIÇO DE TREINOS - Workout Service
 * 
 * FUNÇÃO: Gerenciar todas as operações relacionadas aos treinos e exercícios.
 * 
 * RESPONSABILIDADES:
 * - Buscar protocolos de treino e exercícios do banco de dados
 * - Calcular pesos sugeridos baseados no 1RM do usuário
 * - Salvar execuções de séries (individual e em lote com otimização)
 * - Marcar treinos como concluídos no planejamento semanal
 * - Validar dados de execução antes de salvar
 * - Implementar retry logic para falhas de rede
 * - Gerenciar chunking para inserções em massa (PostgreSQL limits)
 * 
 * FUNÇÕES PRINCIPAIS:
 * - fetchProximoTreino(): Busca próximo treino baseado no planejamento
 * - carregarPesosSugeridos(): Calcula pesos usando percentual do 1RM
 * - salvarExecucoesEmLote(): Salva múltiplas séries com retry e validação
 * - marcarTreinoConcluido(): Atualiza status no planejamento semanal
 * 
 * OTIMIZAÇÕES:
 * - Chunking automático para evitar limits do PostgreSQL
 * - Retry exponential backoff para falhas de rede
 * - Validação robusta de dados para evitar corrupção
 * - Fuso horário correto (America/Sao_Paulo)
 */

import { query, insert, update } from './supabaseService.js';
import { nowUtcISO, getDateInSP, nowInSaoPaulo } from '../utils/dateUtils.js';
// Compatibilidade com código legado
const toSaoPauloDateString = (date) => getDateInSP(date);
// import removido para compatibilidade com browser tradicional
// Utilize window.WeeklyPlanService diretamente quando necessário

// Buscar próximo treino do usuário
export async function fetchProximoTreino(userId, protocoloId, semanaAtual = 1) {
    // Primeiro verificar o plano semanal do usuário
    const weekPlan = window.WeeklyPlanService ? await window.WeeklyPlanService.getPlan(userId) : null;
    const today = new Date().getDay();
    
    if (weekPlan && weekPlan[today] && 
        weekPlan[today] !== 'folga' && 
        weekPlan[today] !== 'cardio') {
        
        const tipoTreino = weekPlan[today];
        const diaSemana = { 'A': 1, 'B': 2, 'C': 3, 'D': 4 }[tipoTreino];
        
        const { data: treino } = await query('protocolo_treinos', {
            select: '*, exercicios(*)',
            eq: {
                protocolo_id: protocoloId,
                dia_semana: diaSemana,
                semana_referencia: semanaAtual
            },
            limit: 1,
            single: true
        });
        
        if (treino) return treino;
    }
    
    // Se não houver plano ou treino para hoje, buscar próximo disponível
    const { data: execucoes } = await query('execucao_exercicio_usuario', {
        select: 'protocolo_treino_id',
        eq: { usuario_id: userId }
    });
    
    const treinosRealizados = [...new Set((execucoes || []).map(e => e.protocolo_treino_id))];
    
    const queryOptions = {
        select: '*, exercicios(*)',
        eq: { protocolo_id: protocoloId },
        order: { column: 'tipo_atividade', ascending: true },
        limit: 1
    };
    
    // Se há treinos realizados, buscar o próximo não realizado
    if (treinosRealizados.length > 0) {
        const { data: proximoTreino } = await query('protocolo_treinos', {
            ...queryOptions,
            not: { id: `in.(${treinosRealizados.join(',')})` }
        });
        
        if (proximoTreino && proximoTreino.length > 0) {
            return proximoTreino[0];
        }
    }
    
    // Se todos foram realizados ou não há execuções, retornar o primeiro
    const { data: primeiroTreino } = await query('protocolo_treinos', {
        ...queryOptions,
        eq: { 
            protocolo_id: protocoloId
        }
    });
    
    return primeiroTreino && primeiroTreino.length > 0 ? primeiroTreino[0] : null;
}

// Buscar exercícios de um treino
export async function fetchExerciciosTreino(grupoMuscular, protocoloId) {
    const { data } = await query('protocolo_treinos', {
        select: 'id, protocolo_id, exercicio_id, semana_referencia, dia_semana, percentual_1rm_base, percentual_1rm_min, percentual_1rm_max, series, repeticoes_alvo, tempo_descanso, ordem_exercicio, observacoes, exercicios!inner ( id, nome, grupo_muscular, equipamento, tempo_descanso_padrao )',
        eq: {
            'exercicios.grupo_muscular': grupoMuscular,
            protocolo_id: protocoloId
        },
        order: { column: 'ordem_exercicio', ascending: true }
    });
    
    if (!data) return [];
    
    // Processar e remover duplicatas
    const exerciciosUnicos = data.reduce((acc, item) => {
        const existente = acc.find(e => e.exercicio_id === item.exercicio_id);
        if (!existente) {
            acc.push({
                ...item,
                protocolo_treino_id: item.id,
                exercicio_nome: item.exercicios?.nome || 'Exercício sem nome',
                exercicio_grupo: item.exercicios?.grupo_muscular || 'Grupo não especificado',
                exercicio_equipamento: item.exercicios?.equipamento || 'Equipamento não especificado'
            });
        }
        return acc;
    }, []);
    
    return exerciciosUnicos;
}

// Buscar pesos sugeridos para o usuário usando cálculo dinâmico
export async function carregarPesosSugeridos(userId, protocoloTreinoId) {
    try {
        console.log('[workoutService] carregarPesosSugeridos chamado com:', { userId, protocoloTreinoId });
        
        // Buscar dados do protocolo de treino
        const { data: protocoloTreino, error: protocoloError } = await query('protocolo_treinos', {
            select: 'exercicio_id, percentual_1rm_base, percentual_1rm_min, percentual_1rm_max',
            eq: { id: protocoloTreinoId },
            single: true
        });
        
        if (protocoloError || !protocoloTreino) {
            console.error('[workoutService] Erro ao buscar protocolo:', protocoloError);
            return { data: null, error: protocoloError };
        }
        
        // Buscar 1RM do usuário para o exercício
        const { data: rm1Data } = await query('usuario_1rm', {
            select: 'rm_calculado',
            eq: { 
                usuario_id: userId,
                exercicio_id: protocoloTreino.exercicio_id
            },
            order: { column: 'data_teste', ascending: false },
            limit: 1,
            single: true
        });
        
        const rm1 = rm1Data?.rm_calculado || 0;
        
        // Calcular pesos sugeridos baseados no 1RM e percentuais
        const peso_base = rm1 > 0 ? Math.round(rm1 * (protocoloTreino.percentual_1rm_base || 75) / 100) : 0;
        const peso_minimo = rm1 > 0 ? Math.round(rm1 * (protocoloTreino.percentual_1rm_min || 70) / 100) : 0;
        const peso_maximo = rm1 > 0 ? Math.round(rm1 * (protocoloTreino.percentual_1rm_max || 80) / 100) : 0;
        
        console.log('[workoutService] Pesos calculados:', { rm1, peso_base, peso_minimo, peso_maximo });
        
        return { 
            data: {
                usuario_id: userId,
                protocolo_treino_id: protocoloTreinoId,
                peso_base,
                peso_minimo,
                peso_maximo,
                rm_usado: rm1,
                status: 'ativo',
                fonte: 'calculo_dinamico',
                observacao: `Calculado com ${protocoloTreino.percentual_1rm_base}% do 1RM (${rm1}kg)`
            }, 
            error: null 
        };
        
    } catch (error) {
        console.error('[workoutService] Erro ao calcular pesos sugeridos:', error);
        return { data: null, error: error.message };
    }
}

// Salvar execução de exercício (individual - mantida para compatibilidade)
export async function salvarExecucaoExercicio(dados) {
    try {
        console.log('[salvarExecucaoExercicio] Dados recebidos:', dados);
        
        // Validar dados obrigatórios
        if (!dados.usuario_id || !dados.exercicio_id) {
            console.error('[salvarExecucaoExercicio] Dados obrigatórios faltando:', {
                usuario_id: dados.usuario_id,
                exercicio_id: dados.exercicio_id
            });
            return false;
        }
        
        const dadosParaSalvar = {
            usuario_id: String(dados.usuario_id),
            protocolo_treino_id: dados.protocolo_treino_id || null,
            exercicio_id: dados.exercicio_id,
            data_execucao: dados.data_execucao || nowUtcISO(),
            peso_utilizado: dados.peso_utilizado,
            repeticoes: dados.repeticoes || dados.repeticoes_realizadas,
            serie_numero: dados.serie_numero,
            falhou: dados.falhou || false,
            observacoes: dados.observacoes || null,
            tempo_descanso: dados.tempo_descanso || null
        };
        
        console.log('[salvarExecucaoExercicio] Salvando no banco:', dadosParaSalvar);
        
        const { data, error } = await insert('execucao_exercicio_usuario', dadosParaSalvar);
        
        if (error) {
            console.error('[salvarExecucaoExercicio] Erro do Supabase:', error);
            return false;
        }
        
        console.log('[salvarExecucaoExercicio] Salvo com sucesso:', data);
        return true;
        
    } catch (error) {
        console.error('[salvarExecucaoExercicio] Erro geral:', error);
        return false;
    }
}

// Função auxiliar para validar dados de execução
function validarDadosExecucao(dados) {
    const erros = [];
    
    if (!dados.usuario_id || (typeof dados.usuario_id !== 'string' && typeof dados.usuario_id !== 'number')) {
        erros.push('usuario_id inválido');
    }
    
    if (!dados.exercicio_id || typeof dados.exercicio_id !== 'number') {
        erros.push('exercicio_id inválido');
    }
    
    const peso = parseFloat(dados.peso_utilizado);
    if (isNaN(peso) || peso < 0 || peso > 1000) {
        erros.push(`peso_utilizado inválido: ${dados.peso_utilizado}`);
    }
    
    const reps = parseInt(dados.repeticoes || dados.repeticoes_realizadas);
    if (isNaN(reps) || reps < 0 || reps > 100) {
        erros.push(`repeticoes inválidas: ${dados.repeticoes}`);
    }
    
    const serie = parseInt(dados.serie_numero);
    if (isNaN(serie) || serie < 1 || serie > 10) {
        erros.push(`serie_numero inválido: ${dados.serie_numero}`);
    }
    
    return { valido: erros.length === 0, erros };
}

// Função principal com retry logic
export async function salvarExecucoesEmLote(execucoes, maxRetries = 3) {
    return await salvarExecucoesEmLoteComRetry(execucoes, maxRetries);
}

// Salvar múltiplas execuções em lote (otimizado com chunking e retry)
async function salvarExecucoesEmLoteComRetry(execucoes, maxRetries = 3, tentativa = 1) {
    try {
        console.log(`[salvarExecucoesEmLote] Tentativa ${tentativa}/${maxRetries} - Salvando ${execucoes.length} execuções em lote`);
        
        // Validar que temos execuções para salvar
        if (!execucoes || execucoes.length === 0) {
            console.log('[salvarExecucoesEmLote] Nenhuma execução para salvar');
            return { sucesso: true, salvos: 0, erros: [], dadosNaoSalvos: [] };
        }
        
        // Configurar tamanho do chunk (PostgreSQL suporta até 1000 por vez)
        const CHUNK_SIZE = 1000;
        const chunks = [];
        
        // Dividir em chunks
        for (let i = 0; i < execucoes.length; i += CHUNK_SIZE) {
            chunks.push(execucoes.slice(i, i + CHUNK_SIZE));
        }
        
        console.log(`[salvarExecucoesEmLote] Dividido em ${chunks.length} chunks`);
        
        let totalSalvos = 0;
        const errosDetalhados = [];
        const dadosNaoSalvos = [];
        
        // Processar cada chunk
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            console.log(`[salvarExecucoesEmLote] Processando chunk ${i + 1}/${chunks.length} com ${chunk.length} itens`);
            
            // Validar e transformar dados do chunk
            const dadosValidados = chunk
                .map(dados => {
                    const validacao = validarDadosExecucao(dados);
                    if (!validacao.valido) {
                        console.error('[salvarExecucoesEmLote] Dados inválidos:', validacao.erros, dados);
                        return null;
                    }
                    return {
                        usuario_id: String(dados.usuario_id),
                        protocolo_treino_id: dados.protocolo_treino_id || null,
                        exercicio_id: parseInt(dados.exercicio_id),
                        data_execucao: dados.data_execucao || nowUtcISO(),
                        peso_utilizado: parseFloat(dados.peso_utilizado),
                        repeticoes: parseInt(dados.repeticoes || dados.repeticoes_realizadas),
                        serie_numero: parseInt(dados.serie_numero),
                        falhou: Boolean(dados.falhou),
                        observacoes: dados.observacoes || null
                    };
                })
                .filter(Boolean);
            
            if (dadosValidados.length === 0) {
                console.warn(`[salvarExecucoesEmLote] Chunk ${i + 1} não tem dados válidos`);
                dadosNaoSalvos.push(...chunk);
                continue;
            }
            
            // Tentar inserir o chunk com tratamento robusto
            try {
                const { data, error, status } = await insert('execucao_exercicio_usuario', dadosValidados);
            
                if (error) {
                    console.error(`[salvarExecucoesEmLote] Erro no chunk ${i + 1}:`, error);
                    
                    // Verificar se é erro parcial (status 207)
                    if (status === 207 && error.details?.failed_rows) {
                        // Alguns registros falharam
                        const falhas = error.details.failed_rows;
                        const sucessos = dadosValidados.length - falhas.length;
                        totalSalvos += sucessos;
                        
                        errosDetalhados.push({
                            chunk: i + 1,
                            tentativa,
                            tipo: 'parcial',
                            mensagem: `${falhas.length} registros falharam no chunk ${i + 1}`,
                            detalhes: falhas
                        });
                        
                        // Mapear falhas de volta para dados originais
                        const dadosOriginaisFalhas = falhas.map(indice => chunk[indice]).filter(Boolean);
                        dadosNaoSalvos.push(...dadosOriginaisFalhas);
                    } else {
                        // Falha total do chunk - será retentado
                        errosDetalhados.push({
                            chunk: i + 1,
                            tentativa,
                            tipo: 'total',
                            mensagem: error.message || `Erro ao salvar chunk ${i + 1}`,
                            error: error
                        });
                        
                        // Todo o chunk falhou
                        dadosNaoSalvos.push(...chunk);
                    }
                } else {
                    // Sucesso total do chunk
                    totalSalvos += data?.length || dadosValidados.length;
                    console.log(`[salvarExecucoesEmLote] Chunk ${i + 1} salvo com sucesso: ${dadosValidados.length} registros`);
                }
            } catch (networkError) {
                console.error(`[salvarExecucoesEmLote] Erro de rede no chunk ${i + 1}:`, networkError);
                errosDetalhados.push({
                    chunk: i + 1,
                    tentativa,
                    tipo: 'network',
                    mensagem: `Erro de rede no chunk ${i + 1}: ${networkError.message}`,
                    error: networkError
                });
                dadosNaoSalvos.push(...chunk);
            }
        }
        
        // Determinar status geral
        const sucessoParcial = totalSalvos > 0 && totalSalvos < execucoes.length;
        const sucessoTotal = totalSalvos === execucoes.length;
        
        // Se há dados não salvos e ainda temos tentativas, retry
        if (dadosNaoSalvos.length > 0 && tentativa < maxRetries) {
            // Verificar se são apenas erros de rede/temporários
            const temErrosRecuperaveis = errosDetalhados.some(erro => 
                erro.tipo === 'network' || erro.tipo === 'total'
            );
            
            if (temErrosRecuperaveis) {
                console.log(`[salvarExecucoesEmLote] ${dadosNaoSalvos.length} dados não salvos. Tentando novamente em ${tentativa * 2}s...`);
                
                // Aguardar com backoff exponencial
                await new Promise(resolve => setTimeout(resolve, tentativa * 2000));
                
                // Retry apenas com dados que falharam
                return await salvarExecucoesEmLoteComRetry(dadosNaoSalvos, maxRetries, tentativa + 1);
            }
        }
        
        console.log('[salvarExecucoesEmLote] Resultado final:', {
            tentativa,
            total: execucoes.length,
            salvos: totalSalvos,
            falhas: dadosNaoSalvos.length,
            chunks: chunks.length
        });
        
        return {
            sucesso: sucessoTotal,
            sucessoParcial,
            salvos: totalSalvos,
            erros: errosDetalhados.map(e => e.mensagem),
            errosDetalhados,
            dadosNaoSalvos: dadosNaoSalvos.length > 0 ? dadosNaoSalvos : null,
            tentativasRealizadas: tentativa
        };
        
    } catch (error) {
        console.error('[salvarExecucoesEmLote] Erro geral:', error);
        return { 
            sucesso: false, 
            salvos: 0, 
            erros: [error.message || 'Erro inesperado ao salvar execuções'],
            dadosNaoSalvos: execucoes
        };
    }
}

// Buscar execuções de um exercício
export async function fetchExecucoesExercicio(userId, protocoloTreinoId, exercicioId) {
    const hoje = toSaoPauloDateString(new Date());
    
    const { data, error } = await query('execucao_exercicio_usuario', {
        eq: {
            usuario_id: userId,
            protocolo_treino_id: protocoloTreinoId,
            exercicio_id: exercicioId
        },
        gte: { data_execucao: `${hoje}T00:00:00` },
        lte: { data_execucao: `${hoje}T23:59:59` }
    });
    
    return { data: data || [], error };
}

// Marcar treino como concluído usando planejamento_semanal
export async function marcarTreinoConcluido(userId) {
    try {
        // Obter semana do protocolo ao invés da semana do calendário
        const { data: planoUsuario } = await query('usuario_plano_treino', {
            select: 'semana_atual',
            eq: { usuario_id: userId, status: 'ativo' },
            single: true
        });
        
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const semana = planoUsuario?.semana_atual || 1; // CORREÇÃO: usar semana do protocolo
        const diaSemana = window.WeeklyPlanService ? window.WeeklyPlanService.dayToDb(hoje.getDay()) : hoje.getDay(); // Converter para formato DB
        
        const { error } = await update('planejamento_semanal', 
            { 
                concluido: true, 
                data_conclusao: nowInSaoPaulo() 
            },
            {
                eq: { 
                    usuario_id: userId, 
                    ano, 
                    semana_treino: semana, 
                    dia_semana: diaSemana 
                }
            }
        );
        
        return { error };
        
    } catch (error) {
        console.error('[workoutService] Erro ao marcar treino concluído:', error);
        return { error: error.message };
    }
}

// Buscar grupos musculares dos treinos
export async function fetchGruposMuscularesTreinos() {
    const { data } = await query('exercicios', {
        select: 'grupo_muscular',
        order: { column: 'grupo_muscular', ascending: true }
    });
    
    return data || [];
}

// Buscar dados para indicadores
export async function fetchDadosIndicadores(userId) {
    // Buscar comparação entre usuários
    const { data: comparacao } = await query('v_comparativo_usuarios', {});
    
    // Buscar estatísticas do usuário
    const { data: estatisticas } = await query('v_estatisticas_usuarios', {
        eq: { usuario_id: userId },
        single: true
    });
    
    // Buscar resumo por grupo muscular
    const { data: resumoGrupo } = await query('v_resumo_grupo_muscular', {
        eq: { usuario: userId } // Corrigido de usuario_id para usuario
    });
    
    return {
        comparacao: comparacao || [],
        estatisticas: estatisticas || null,
        resumoGrupo: resumoGrupo || []
    };
}