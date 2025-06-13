// js/services/workoutService.js
// Serviço para gerenciar treinos e exercícios

import { query, insert, update } from './supabaseService.js';
// import removido para compatibilidade com browser tradicional
// Utilize window.WeeklyPlanService diretamente quando necessário

// Buscar próximo treino do usuário
export async function fetchProximoTreino(userId, protocoloId, semanaAtual = 1) {
    // Primeiro verificar o plano semanal do usuário
    const weekPlan = await WeeklyPlanService.obterPlanejamento(userId);
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
    
    let queryOptions = {
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
        select: `
            id,
            protocolo_id,
            exercicio_id,
            semana_referencia,
            dia_semana,
            percentual_1rm_base,
            percentual_1rm_min,
            percentual_1rm_max,
            series,
            repeticoes_alvo,
            tempo_descanso,
            ordem_exercicio,
            observacoes,
            exercicios!inner (
                id,
                nome,
                grupo_muscular,
                equipamento,
                tempo_descanso_padrao
            )
        `,
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
        console.log('[workoutService] carregarPesosSugeridos chamado (usando cálculo dinâmico)');
        
        // NOTA: A tabela pesos_usuario foi substituída por cálculo dinâmico
        // Os pesos são calculados em tempo real pelo WeightCalculatorService
        // Esta função mantém compatibilidade com a interface existente
        
        return { 
            data: {
                usuario_id: userId,
                protocolo_treino_id: protocoloTreinoId,
                status: 'ativo',
                fonte: 'calculo_dinamico',
                observacao: 'Pesos calculados dinamicamente baseados em 1RM'
            }, 
            error: null 
        };
        
    } catch (error) {
        console.error('[workoutService] Erro ao buscar pesos sugeridos:', error);
        return { data: null, error: error.message };
    }
}

// Salvar execução de exercício
export async function salvarExecucaoExercicio(dados) {
    const { data, error } = await insert('execucao_exercicio_usuario', {
        usuario_id: dados.usuario_id,
        protocolo_treino_id: dados.protocolo_treino_id,
        exercicio_id: dados.exercicio_id,
        data_execucao: dados.data_execucao || new Date().toISOString(),
        peso_utilizado: dados.peso_utilizado,
        repeticoes: dados.repeticoes_realizadas,
        serie_numero: dados.serie_numero,
        falhou: dados.falhou || false,
        observacoes: dados.observacoes || null
    });
    
    return !error;
}

// Buscar execuções de um exercício
export async function fetchExecucoesExercicio(userId, protocoloTreinoId, exercicioId) {
    const hoje = new Date().toISOString().split('T')[0];
    
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
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const semana = WeeklyPlanService.getWeekNumber(hoje);
        const diaSemana = hoje.getDay() === 0 ? 7 : hoje.getDay(); // Converter para formato DB
        
        const { error } = await update('planejamento_semanal', 
            { 
                concluido: true, 
                data_conclusao: new Date().toISOString() 
            },
            {
                eq: { 
                    usuario_id: userId, 
                    ano, 
                    semana, 
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