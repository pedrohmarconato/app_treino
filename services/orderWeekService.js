// c:/Users/Bem Vindo/app_treino/services/orderWeekService.js
import { query } from './supabaseService.js'; // Assumindo que supabaseService.js está no mesmo diretório 'services'

/**
 * Fetches distinct muscle group types from the user's weekly plan.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Array<string>>} - A list of unique muscle groups.
 */
export async function fetchTiposTreinoMuscular(userId) {
    if (!userId) {
        console.error('fetchTiposTreinoMuscular (orderWeekService): userId é obrigatório');
        return [];
    }
    try {
        const { data, error } = await query('v_plano_usuario_semana', {
            select: 'grupo_muscular',
            eq: { usuario_id: userId }
        });

        if (error) {
            console.error(`Erro ao buscar tipos de treino muscular (orderWeekService) para usuário ${userId}:`, error.message);
            return [];
        }
        // Ensure data is an array and map, then create a Set for uniqueness
        return [...new Set(Array.isArray(data) ? data.map(item => item.grupo_muscular) : [])];
    } catch (e) {
        console.error('Exceção em fetchTiposTreinoMuscular (orderWeekService):', e);
        return [];
    }
}

/**
 * Fetches distinct combinations of grupo_muscular, dia_semana, and tipo_atividade
 * from v_plano_usuario_semana for a given user.
 * Intended for use by the OrderWeekPage.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Array<{grupo_muscular: string, dia_semana: string, tipo_atividade: string}>>}
 */
export async function getDadosPlanoSemanalParaOrderPage(userId) {
    if (!userId) {
        console.error('getDadosPlanoSemanalParaOrderPage: userId é obrigatório');
        return [];
    }

    try {
        const { data, error } = await query('v_plano_usuario_semana', {
            select: 'grupo_muscular, dia_semana, tipo_atividade',
            eq: { usuario_id: userId },
            // A cláusula ORDER BY pode ser útil aqui se a ordem for importante para a OrderWeekPage.
            // order: 'dia_semana.asc', // Exemplo, se 'dia_semana' tiver uma ordem definida
        });

        if (error) {
            console.error(`Erro ao buscar dados da v_plano_usuario_semana (orderWeekService) para usuário ${userId}:`, error.message);
            return [];
        }

        return data || [];
    } catch (e) {
        console.error('Exceção em getDadosPlanoSemanalParaOrderPage (orderWeekService):', e);
        return [];
    }
}
