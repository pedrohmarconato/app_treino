// js/services/userService.js
// Serviço para gerenciar usuários e suas métricas

import { query, insert, update } from './supabaseService.js';

// Buscar todos os usuários ativos
export async function fetchUsuarios() {
    const { data, error } = await query('usuarios', {
        eq: { status: 'ativo' },
        order: { column: 'nome', ascending: true }
    });
    
    return data || [];
}

// Buscar 1RM do usuário para um exercício específico
export async function fetch1RMUsuario(userId, exercicioId) {
    const { data } = await query('usuario_1rm', {
        eq: { 
            usuario_id: userId,
            exercicio_id: exercicioId,
            status: 'ativo'
        },
        order: { column: 'data_teste', ascending: false },
        limit: 1,
        single: true
    });
    
    return data ? data.rm_calculado : null;
}

// Buscar métricas do usuário
export async function fetchMetricasUsuario(userId) {
    const { data } = await query('v_estatisticas_usuarios', {
        eq: { usuario_id: userId },
        single: true
    });
    
    if (!data) {
        return {
            treinosConcluidos: 0,
            semanaAtual: 1,
            progresso: 0
        };
    }
    
    return {
        treinosConcluidos: data.total_treinos || 0,
        semanaAtual: data.semana_atual || 1,
        progresso: data.percentual_progresso || 0
    };
}

// Buscar protocolo ativo do usuário
export async function fetchProtocoloAtivoUsuario(userId) {
    const { data: planoAtivo } = await query('usuario_plano_treino', {
        select: '*, protocolos_treinamento(*)',
        eq: { 
            usuario_id: userId,
            status: 'ativo'
        },
        single: true
    });
    
    // Se não houver plano ativo, criar um novo
    if (!planoAtivo) {
        const { data: novoPlano } = await insert('usuario_plano_treino', {
            usuario_id: userId,
            protocolo_treinamento_id: 1, // Protocolo padrão
            semana_atual: 1,
            status: 'ativo'
        });
        
        if (novoPlano && novoPlano[0]) {
            // Buscar o protocolo relacionado
            const { data: protocolo } = await query('protocolos_treinamento', {
                eq: { id: novoPlano[0].protocolo_treinamento_id },
                single: true
            });
            
            return {
                ...novoPlano[0],
                protocolos_treinamento: protocolo,
                nome_protocolo: protocolo?.nome || 'Protocolo Padrão'
            };
        }
    }
    
    return {
        ...planoAtivo,
        nome_protocolo: planoAtivo?.protocolos_treinamento?.nome || 'Protocolo Padrão'
    };
}

// Salvar teste de 1RM
export async function salvar1RMUsuario(userId, exercicioId, pesoTeste, repeticoesTeste) {
    // Calcular 1RM usando fórmula de Epley
    const rmCalculado = pesoTeste * (1 + repeticoesTeste / 30);
    
    const { data, error } = await insert('usuario_1rm', {
        usuario_id: userId,
        exercicio_id: exercicioId,
        peso_teste: pesoTeste,
        repeticoes_teste: repeticoesTeste,
        rm_calculado: rmCalculado.toFixed(2),
        data_teste: new Date().toISOString().split('T')[0],
        status: 'ativo'
    });
    
    return { data, error };
}

// Buscar histórico de treinos do usuário
export async function fetchHistoricoTreinos(userId, limit = 10) {
    const { data } = await query('execucao_exercicio_usuario', {
        select: `
            *,
            exercicios (nome, grupo_muscular),
            protocolo_treinos (numero_treino, dia_semana)
        `,
        eq: { usuario_id: userId },
        order: { column: 'data_execucao', ascending: false },
        limit
    });
    
    return data || [];
}

// Buscar comparação entre usuários
export async function fetchComparacaoUsuarios() {
    const { data } = await query('v_comparativo_usuarios', {
        order: { column: 'exercicio', ascending: true }
    });
    
    return data || [];
}

// Buscar resumo por grupo muscular
export async function fetchResumoGrupoMuscular(nomeUsuario) {
    const { data } = await query('v_resumo_grupo_muscular', {
        eq: { usuario: nomeUsuario }
    });
    
    return data || [];
}