// services/protocolService.js
// Centraliza todas as consultas ao Supabase para protocolos, treinos e exercícios
import { supabase } from '../app.js';

export async function fetchProximoTreino(userId, protocoloId) {
    try {
        const { data, error } = await supabase
            .from('treinos')
            .select('*')
            .eq('usuario_id', userId)
            .eq('protocolo_id', protocoloId)
            .order('data', { ascending: true });
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao buscar próximo treino:', error);
        return null;
    }
}

export async function fetchExerciciosTreino(numeroTreino, protocoloId) {
    try {
        const { data, error } = await supabase
            .from('exercicios')
            .select('*')
            .eq('numero_treino', numeroTreino)
            .eq('protocolo_id', protocoloId)
            .order('ordem');
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao buscar exercícios do treino:', error);
        return [];
    }
}

// Salva ordem customizada da semana no backend
export async function saveSemanaOrdemBackend(userId, ordem) {
    try {
        const { data, error } = await supabase
            .from('usuario_ordem_semana')
            .upsert({ usuario_id: userId, ordem, updated_at: new Date().toISOString() }, { onConflict: ['usuario_id'] });
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao salvar ordem da semana:', error);
        return null;
    }
}

// Carrega ordem customizada da semana do backend
export async function loadSemanaOrdemBackend(userId) {
    try {
        const { data, error } = await supabase
            .from('usuario_ordem_semana')
            .select('ordem')
            .eq('usuario_id', userId)
            .single();
        if (error) throw error;
        return data ? data.ordem : null;
    } catch (error) {
        console.error('Erro ao carregar ordem da semana:', error);
        return null;
    }
}

export async function salvarExecucaoExercicio(dados) {
    try {
        const { data, error } = await supabase
            .from('execucoes')
            .insert([dados]);
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao salvar execução:', error);
        return null;
    }
}

export async function fetchDadosIndicadores() {
    try {
        const { data, error } = await supabase
            .from('indicadores')
            .select('*');
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao buscar indicadores:', error);
        return [];
    }
}

export async function fetchGruposMuscularesTreinos() {
    try {
        const { data, error } = await supabase
            .rpc('buscar_grupos_musculares_treinos');
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao buscar grupos musculares:', error);
        return [];
    }
}
