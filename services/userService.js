// js/services/userService.js
// Serviço para gerenciar usuários e suas métricas

import { query, insert, update } from './supabaseService.js';

// Buscar todos os usuários ativos
export async function fetchUsuarios() {
    console.log('[fetchUsuarios] Iniciando busca de usuários...');
    
    try {
        // TESTE 1: Buscar todos os usuários primeiro
        console.log('[fetchUsuarios] Buscando todos os usuários...');
        const { data: todosUsuarios, error: erroTodos } = await query('usuarios');
        
        if (erroTodos) {
            console.error('[fetchUsuarios] Erro ao buscar todos os usuários:', erroTodos);
            return [];
        }
        
        console.log('[fetchUsuarios] Todos os usuários encontrados:', todosUsuarios);
        
        // Se não encontrou nenhum usuário, pode ser problema de conexão ou tabela vazia
        if (!todosUsuarios || todosUsuarios.length === 0) {
            console.warn('[fetchUsuarios] Nenhum usuário encontrado na tabela');
            
            // RETORNAR usuários mock para teste
            console.log('[fetchUsuarios] Retornando usuários mock para teste');
            return [
                { id: 1, nome: 'Pedro', status: 'ativo' },
                { id: 2, nome: 'Japa', status: 'ativo' }
            ];
        }
        
        // Filtrar usuários ativos
        const usuariosAtivos = todosUsuarios.filter(user => user.status === 'ativo');
        console.log('[fetchUsuarios] Usuários ativos encontrados:', usuariosAtivos);
        
        return usuariosAtivos.sort((a, b) => a.nome.localeCompare(b.nome));
        
    } catch (error) {
        console.error('[fetchUsuarios] Erro geral:', error);
        
        // EM CASO DE ERRO, RETORNAR DADOS MOCK
        console.log('[fetchUsuarios] Retornando dados mock devido ao erro');
        return [
            { id: 1, nome: 'Pedro', status: 'ativo' },
            { id: 2, nome: 'Japa', status: 'ativo' }
        ];
    }
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
    console.log('[fetchProtocoloAtivoUsuario] Buscando protocolo para usuário:', userId);
    
    const { data: planoAtivo } = await query('usuario_plano_treino', {
        select: '*, protocolos_treinamento(*)',
        eq: { 
            usuario_id: userId,
            status: 'ativo'
        },
        single: true
    });
    
    // Se não houver plano ativo, retornar protocolo mock
    if (!planoAtivo) {
        console.log('[fetchProtocoloAtivoUsuario] Nenhum plano ativo encontrado, retornando mock');
        return {
            id: 1,
            usuario_id: userId,
            protocolo_treinamento_id: 1,
            semana_atual: 1,
            status: 'ativo',
            protocolos_treinamento: {
                id: 1,
                nome: 'Protocolo Padrão'
            },
            nome_protocolo: 'Protocolo Padrão'
        };
    }
    
    return {
        ...planoAtivo,
        nome_protocolo: planoAtivo?.protocolos_treinamento?.nome || 'Protocolo Padrão'
    };
}

// Buscar grupos musculares disponíveis da tabela exercicios
export async function fetchTiposTreinoMuscular(userId) {
    console.log('[fetchTiposTreinoMuscular] Buscando grupos musculares da tabela exercicios para usuário:', userId);

    const { data, error } = await query('exercicios', { 
        select: 'grupo_muscular'
    });

    if (error) {
        console.error('[fetchTiposTreinoMuscular] Erro ao buscar grupos musculares:', error.message);
        return [];
    }

    if (!data || data.length === 0) {
        console.warn('[fetchTiposTreinoMuscular] Nenhum exercício encontrado na tabela exercicios');
        return [];
    }

    // Extrair os valores de grupo_muscular e garantir que sejam únicos
    const gruposUnicos = [...new Set(data.map(item => item.grupo_muscular).filter(gm => gm))];
    console.log('[fetchTiposTreinoMuscular] Grupos musculares únicos encontrados:', gruposUnicos);
    return gruposUnicos;
}

export async function upsert(table, data, options = {}) {
    try {
        const { data: result, error } = await supabase
            .from(table)
            .upsert(data, options)
            .select();
        
        if (error) throw error;
        return { data: result, error: null };
    } catch (error) {
        console.error(`Erro ao fazer upsert em ${table}:`, error);
        return { data: null, error };
    }
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