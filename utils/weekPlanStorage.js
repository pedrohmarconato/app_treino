// utils/weekPlanStorage.js
// Utilitários auxiliares para gerenciamento de planos semanais
// NOTA: A funcionalidade principal foi movida para services/weeklyPlanningService.js

// Calcular número da semana ISO 8601
export function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// Obter chave da semana atual para localStorage
export function getWeekKey() {
    const now = new Date();
    const year = now.getFullYear();
    const week = getWeekNumber(now);
    return `${year}_${week}`;
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