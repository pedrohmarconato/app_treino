// utils/weekPlanStorage.js
// Utilitários auxiliares para gerenciamento de planos semanais
// NOTA: A funcionalidade principal foi movida para services/weeklyPlanningService.js

// Calcular número da semana do ano (domingo = 0, sábado = 6)
export function getWeekNumber(date) {
    // Semana começa no domingo (0)
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// Obter chave da semana atual para localStorage
export function getWeekKey() {
    const now = new Date();
    const year = now.getFullYear();
    const week = getWeekNumber(now);
    return `${year}_${week}`;
}

// Obter chave específica para usuário e semana
export function getUserWeekKey(userId, customWeek = null) {
    if (customWeek) {
        return `weekPlan_${userId}_${customWeek}`;
    }
    const weekKey = getWeekKey();
    return `weekPlan_${userId}_${weekKey}`;
}

// ==================== FUNÇÕES PRINCIPAIS DE LOCALSTORAGE ====================

// Salvar plano semanal no localStorage
export function saveWeekPlan(userId, planData) {
    try {
        const key = getUserWeekKey(userId);
        localStorage.setItem(key, JSON.stringify(planData));
        console.log('[saveWeekPlan] ✅ Plano salvo no localStorage:', key);
        return true;
    } catch (error) {
        console.error('[saveWeekPlan] ❌ Erro ao salvar no localStorage:', error);
        return false;
    }
}

// Obter plano semanal do localStorage
export function getWeekPlan(userId) {
    try {
        const key = getUserWeekKey(userId);
        const data = localStorage.getItem(key);
        
        if (!data) {
            console.log('[getWeekPlan] 📭 Nenhum plano encontrado no localStorage para:', key);
            return null;
        }
        
        const plan = JSON.parse(data);
        console.log('[getWeekPlan] ✅ Plano carregado do localStorage:', key, plan);
        return plan;
    } catch (error) {
        console.error('[getWeekPlan] ❌ Erro ao carregar do localStorage:', error);
        return null;
    }
}

// Limpar plano semanal do localStorage
export function clearWeekPlan(userId) {
    try {
        const key = getUserWeekKey(userId);
        localStorage.removeItem(key);
        console.log('[clearWeekPlan] ✅ Plano removido do localStorage:', key);
        return true;
    } catch (error) {
        console.error('[clearWeekPlan] ❌ Erro ao remover do localStorage:', error);
        return false;
    }
}

// Verificar se existe plano no localStorage
export function hasWeekPlan(userId) {
    try {
        const key = getUserWeekKey(userId);
        return localStorage.getItem(key) !== null;
    } catch (error) {
        console.error('[hasWeekPlan] ❌ Erro ao verificar localStorage:', error);
        return false;
    }
}

// Obter todos os planos do usuário do localStorage (histórico)
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

// ==================== COMPATIBILIDADE GLOBAL ====================
// Disponibilizar funções globalmente para compatibilidade com código existente
if (typeof window !== 'undefined') {
    window.getWeekPlan = getWeekPlan;
    window.saveWeekPlan = saveWeekPlan;
    window.clearWeekPlan = clearWeekPlan;
    window.hasWeekPlan = hasWeekPlan;
    window.getUserWeekKey = getUserWeekKey;
    window.getWeekKey = getWeekKey;
    window.getWeekNumber = getWeekNumber;
    window.getAllUserWeekPlans = getAllUserWeekPlans;
}