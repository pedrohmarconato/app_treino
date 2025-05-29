// js/utils/weekPlanStorage.js
// Gerenciamento do plano semanal no localStorage

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