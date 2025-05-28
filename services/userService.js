// services/userService.js
// Funções relacionadas a dados e métricas do usuário
import { supabase } from '../app.js';

export async function fetchUsuarios() {
    try {
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('status', 'ativo')
            .order('nome');
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        return [];
    }
}

export async function fetch1RMUsuario(userId, exercicioId) {
    try {
        const { data, error } = await supabase
            .from('metricas_1rm')
            .select('*')
            .eq('usuario_id', userId)
            .eq('exercicio_id', exercicioId)
            .single();
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao buscar 1RM:', error);
        return null;
    }
}

export async function fetchMetricasUsuario(userId) {
    try {
        const { data, error } = await supabase
            .from('metricas')
            .select('*')
            .eq('usuario_id', userId);
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao buscar métricas:', error);
        return [];
    }
}
