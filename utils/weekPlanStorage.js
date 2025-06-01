// js/utils/weekPlanStorage.js
// Gerenciamento do plano semanal no localStorage

// --- Integração com Supabase ---
import { upsert, query } from '../services/supabaseService.js';

// Salvar plano semanal no Supabase
export async function saveWeekPlanToSupabase(userId, plan) {
    try {
        const now = new Date();
        const year = now.getFullYear();
        const week = getWeekNumber(now);

        const { data, error } = await upsert('planejamento_semanal', {
            usuario_id: userId,
            ano: year,
            semana: week,
            planejamento: plan,
            updated_at: new Date().toISOString()
        }, { onConflict: 'usuario_id,ano,semana' });

        if (error) {
            console.error('Erro ao salvar no Supabase:', error);
            return false;
        }

        console.log('Planejamento salvo no Supabase:', data);
        return true;
    } catch (error) {
        console.error('Erro ao salvar planejamento no Supabase:', error);
        return false;
    }
}

// Buscar plano semanal do Supabase
export async function getWeekPlanFromSupabase(userId) {
    try {
        const now = new Date();
        const year = now.getFullYear();
        const week = getWeekNumber(now);

        const { data, error } = await query('planejamento_semanal', {
            eq: {
                usuario_id: userId,
                ano: year,
                semana: week
            }
            // Não usar 'single: true' para evitar erro 406
        });

        if (error && error.code !== 'PGRST116') { // PGRST116 = not found
            console.error('Erro ao buscar do Supabase:', error);
            return null;
        }

        // Se não houver dados, retorna null
        if (!data || data.length === 0) return null;

        // Se houver apenas um registro, retorna o planejamento
        if (data.length === 1) return data[0].planejamento || null;

        // Se houver múltiplos registros, retorna o mais recente pelo updated_at
        const sorted = data.slice().sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        return sorted[0].planejamento || null;
    } catch (error) {
        console.error('Erro ao buscar planejamento do Supabase:', error);
        return null;
    }
}

// Obter chave da semana atual
function getWeekKey() {
    const now = new Date();
    const year = now.getFullYear();
    const week = getWeekNumber(now);
    return `${year}_${week}`;
}

// Calcular número da semana
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// Verificar se precisa de planejamento semanal
export function needsWeekPlanning(userId) {
    const key = `weekPlan_${userId}_${getWeekKey()}`;
    const plan = localStorage.getItem(key);
    return !plan;
}

// Salvar plano semanal
export function saveWeekPlan(userId, plan) {
    if (!userId) {
        console.error('saveWeekPlan: userId é obrigatório');
        return false;
    }
    
    const key = `weekPlan_${userId}_${getWeekKey()}`;
    try {
        localStorage.setItem(key, JSON.stringify(plan));
        console.log(`Plano semanal salvo para usuário ${userId}:`, plan);
        return true;
    } catch (error) {
        console.error('Erro ao salvar plano semanal:', error);
        return false;
    }
}

// Obter plano semanal
export function getWeekPlan(userId) {
    if (!userId) {
        console.error('getWeekPlan: userId é obrigatório');
        return null;
    }
    
    const key = `weekPlan_${userId}_${getWeekKey()}`;
    try {
        const plan = localStorage.getItem(key);
        return plan ? JSON.parse(plan) : null;
    } catch (error) {
        console.error('Erro ao recuperar plano semanal:', error);
        return null;
    }
}

// Limpar plano semanal
export function clearWeekPlan(userId) {
    if (!userId) {
        console.error('clearWeekPlan: userId é obrigatório');
        return false;
    }
    
    const key = `weekPlan_${userId}_${getWeekKey()}`;
    try {
        localStorage.removeItem(key);
        console.log(`Plano semanal removido para usuário ${userId}`);
        return true;
    } catch (error) {
        console.error('Erro ao remover plano semanal:', error);
        return false;
    }
}

// Obter todos os planos do usuário (histórico)
export function getAllUserWeekPlans(userId) {
    const plans = [];
    const prefix = `weekPlan_${userId}_`;
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
            try {
                const plan = JSON.parse(localStorage.getItem(key));
                const [year, week] = key.replace(prefix, '').split('_');
                plans.push({
                    year: parseInt(year),
                    week: parseInt(week),
                    plan
                });
            } catch (error) {
                console.error(`Erro ao ler plano ${key}:`, error);
            }
        }
    }
    
    return plans.sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.week - a.week;
    });
}