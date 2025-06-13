// hooks/useWeeklyPlan.js - Manager para planejamento semanal
import { saveWeeklyPlan, getActiveWeeklyPlan } from '../services/weeklyPlanningService.js';
import AppState from '../state/appState.js';

/**
 * Manager para gerenciar o planejamento semanal
 * Não é um React Hook, é uma classe utilitária
 */
export class WeeklyPlanManager {
    constructor() {
        this.currentPlan = null;
        this.isInitialized = false;
    }

    /**
     * Inicializar manager para um usuário
     */
    async initialize(userId) {
        try {
            console.log('[WeeklyPlanManager] Inicializando para usuário:', userId);
            
            // 1. Verificar se há plano ativo no Supabase
            const activePlan = await getActiveWeeklyPlan(userId);
            
            if (activePlan) {
                this.currentPlan = activePlan;
                AppState.set('weekPlan', activePlan);
                this.isInitialized = true;
                
                console.log('[WeeklyPlanManager] ✅ Plano ativo encontrado');
                return {
                    needsPlanning: false,
                    plan: activePlan
                };
            }
            
            // 2. Verificar localStorage como fallback
            const localPlan = getWeekPlan(userId);
            
            if (localPlan) {
                this.currentPlan = localPlan;
                AppState.set('weekPlan', localPlan);
                this.isInitialized = true;
                
                console.log('[WeeklyPlanManager] ✅ Plano local encontrado');
                return {
                    needsPlanning: false,
                    plan: localPlan
                };
            }
            
            // 3. Nenhum plano encontrado
            console.log('[WeeklyPlanManager] ⚠️ Nenhum plano encontrado, precisa configurar');
            return {
                needsPlanning: true,
                plan: null
            };
            
        } catch (error) {
            console.error('[WeeklyPlanManager] Erro na inicialização:', error);
            return {
                needsPlanning: true,
                plan: null,
                error: error.message
            };
        }
    }

    /**
     * Salvar novo plano semanal
     */
    async savePlan(userId, planData) {
        try {
            console.log('[WeeklyPlanManager] Salvando plano para usuário:', userId);
            
            // 1. Salvar no Supabase
            const result = await saveWeeklyPlan(userId, planData);
            
            if (!result.success) {
                throw new Error(result.error || 'Erro ao salvar no Supabase');
            }
            
            // 2. Backup no localStorage
            saveWeekPlan(userId, planData);
            
            // 3. Atualizar estado
            this.currentPlan = planData;
            AppState.set('weekPlan', planData);
            this.isInitialized = true;
            
            console.log('[WeeklyPlanManager] ✅ Plano salvo com sucesso');
            
            return {
                success: true,
                plan: planData
            };
            
        } catch (error) {
            console.error('[WeeklyPlanManager] Erro ao salvar plano:', error);
            
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Obter plano atual
     */
    getCurrentPlan() {
        return this.currentPlan;
    }

    /**
     * Verificar se usuário tem plano configurado
     */
    hasPlan() {
        return this.currentPlan !== null;
    }

    /**
     * Obter treino do dia
     */
    getTodaysWorkout() {
        if (!this.currentPlan) {
            return null;
        }
        
        const today = new Date().getDay(); // 0 = domingo, 1 = segunda, etc.
        const todaysPlan = this.currentPlan[today];
        
        if (!todaysPlan) {
            return null;
        }
        
        return {
            tipo: todaysPlan,
            nome: this.formatWorkoutName(todaysPlan),
            dia: today
        };
    }

    /**
     * Formatar nome do treino
     */
    formatWorkoutName(tipo) {
        if (typeof tipo === 'string') {
            switch(tipo.toLowerCase()) {
                case 'folga':
                    return 'Dia de Folga';
                case 'cardio':
                    return 'Treino Cardiovascular';
                default:
                    return `Treino ${tipo}`;
            }
        }
        
        if (tipo && tipo.tipo) {
            return this.formatWorkoutName(tipo.tipo);
        }
        
        return 'Treino';
    }

    /**
     * Verificar se precisa de novo planejamento
     */
    async needsNewPlanning(userId) {
        const result = await this.initialize(userId);
        return result.needsPlanning;
    }

    /**
     * Resetar manager
     */
    reset() {
        this.currentPlan = null;
        this.isInitialized = false;
        AppState.set('weekPlan', null);
    }

    /**
     * Obter estatísticas do plano
     */
    getPlanStats() {
        if (!this.currentPlan) {
            return {
                totalDays: 0,
                workoutDays: 0,
                restDays: 0,
                cardioDays: 0
            };
        }
        
        const stats = {
            totalDays: 7,
            workoutDays: 0,
            restDays: 0,
            cardioDays: 0
        };
        
        for (let day = 0; day < 7; day++) {
            const dayPlan = this.currentPlan[day];
            
            if (!dayPlan || dayPlan === 'folga') {
                stats.restDays++;
            } else if (dayPlan === 'cardio' || dayPlan === 'Cardio') {
                stats.cardioDays++;
            } else {
                stats.workoutDays++;
            }
        }
        
        return stats;
    }

    /**
     * Validar plano
     */
    validatePlan(planData) {
        const errors = [];
        
        // Verificar se todos os 7 dias estão preenchidos
        for (let day = 0; day < 7; day++) {
            if (!planData[day]) {
                errors.push(`Dia ${day + 1} não está configurado`);
            }
        }
        
        // Verificar se há pelo menos um treino na semana
        const hasWorkout = Object.values(planData).some(day => 
            day && day !== 'folga' && day !== 'cardio'
        );
        
        if (!hasWorkout) {
            errors.push('Pelo menos um dia deve ter treino de força');
        }
        
        // Verificar se não há muitos dias consecutivos de treino
        let consecutiveWorkouts = 0;
        let maxConsecutive = 0;
        
        for (let day = 0; day < 7; day++) {
            const dayPlan = planData[day];
            
            if (dayPlan && dayPlan !== 'folga') {
                consecutiveWorkouts++;
                maxConsecutive = Math.max(maxConsecutive, consecutiveWorkouts);
            } else {
                consecutiveWorkouts = 0;
            }
        }
        
        if (maxConsecutive > 4) {
            errors.push('Evite mais de 4 dias consecutivos de treino');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}

// Instância global
export const weeklyPlanManager = new WeeklyPlanManager();

// Função de conveniência para compatibilidade
export async function initializeWeeklyPlan(userId) {
    return await weeklyPlanManager.initialize(userId);
}

export default weeklyPlanManager;