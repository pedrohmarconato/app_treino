// js/hooks/useWeeklyPlan.js
// Hook para integração do plano semanal com o workflow da aplicação

import AppState from '../state/appState.js';
import { 
    needsWeeklyPlanning, 
    getActiveWeeklyPlan, 
    getTodaysWorkoutWithWeights,
    markDayAsCompleted,
    checkAndCreateNewWeek 
} from '../services/weeklyPlanningService.js';
import { showNotification } from '../ui/notifications.js';

/**
 * Hook principal para gerenciamento do plano semanal
 */
export class WeeklyPlanManager {
    constructor() {
        this.currentPlan = null;
        this.todaysWorkout = null;
        this.isInitialized = false;
    }

    /**
     * Inicializar para um usuário específico
     */
    async initialize(userId) {
        try {
            console.log('[WeeklyPlanManager] Inicializando para usuário:', userId);
            
            // 1. Verificar se precisa de planejamento
            const needsPlanning = await needsWeeklyPlanning(userId);
            
            if (needsPlanning) {
                console.log('[WeeklyPlanManager] Usuário precisa de planejamento semanal');
                return { needsPlanning: true };
            }
            
            // 2. Carregar plano ativo
            this.currentPlan = await getActiveWeeklyPlan(userId);
            
            if (!this.currentPlan) {
                console.log('[WeeklyPlanManager] Não foi possível carregar plano ativo');
                return { needsPlanning: true };
            }
            
            // 3. Carregar treino do dia com pesos
            this.todaysWorkout = await getTodaysWorkoutWithWeights(userId);
            
            // 4. Salvar no estado global
            AppState.set('weekPlan', this.currentPlan);
            AppState.set('currentWorkout', this.todaysWorkout);
            
            this.isInitialized = true;
            
            console.log('[WeeklyPlanManager] Inicialização concluída:', {
                plan: this.currentPlan,
                todaysWorkout: this.todaysWorkout?.nome
            });
            
            return { 
                needsPlanning: false, 
                plan: this.currentPlan,
                todaysWorkout: this.todaysWorkout
            };
            
        } catch (error) {
            console.error('[WeeklyPlanManager] Erro na inicialização:', error);
            return { needsPlanning: true, error: error.message };
        }
    }

    /**
     * Atualizar dados para o dia atual
     */
    async refreshTodaysWorkout(userId) {
        if (!this.isInitialized) {
            return await this.initialize(userId);
        }
        
        try {
            this.todaysWorkout = await getTodaysWorkoutWithWeights(userId);
            AppState.set('currentWorkout', this.todaysWorkout);
            
            return this.todaysWorkout;
        } catch (error) {
            console.error('[WeeklyPlanManager] Erro ao atualizar treino do dia:', error);
            return null;
        }
    }

    /**
     * Marcar treino como concluído e verificar progressão
     */
    async completeToday(userId) {
        try {
            const hoje = new Date().getDay();
            
            // 1. Marcar dia como concluído
            const marked = await markDayAsCompleted(userId, hoje);
            
            if (!marked) {
                throw new Error('Erro ao marcar dia como concluído');
            }
            
            // 2. Atualizar plano local
            if (this.currentPlan && this.currentPlan[hoje]) {
                this.currentPlan[hoje].concluido = true;
                AppState.set('weekPlan', this.currentPlan);
            }
            
            // 3. Verificar se semana foi concluída
            const weekCompleted = await checkAndCreateNewWeek(userId);
            
            if (weekCompleted) {
                showNotification('🎉 Semana concluída! Preparando próxima semana...', 'success');
                
                // Reinicializar para nova semana
                this.isInitialized = false;
                return await this.initialize(userId);
            }
            
            showNotification('✅ Treino concluído!', 'success');
            return { completed: true, weekCompleted: false };
            
        } catch (error) {
            console.error('[WeeklyPlanManager] Erro ao completar dia:', error);
            showNotification('Erro ao marcar treino como concluído', 'error');
            return { completed: false, error: error.message };
        }
    }

    /**
     * Obter status do dia atual
     */
    getTodayStatus() {
        if (!this.currentPlan) return null;
        
        const hoje = new Date().getDay();
        const planoDoDia = this.currentPlan[hoje];
        
        if (!planoDoDia) return null;
        
        return {
            dia: hoje,
            tipo: planoDoDia.tipo,
            concluido: planoDoDia.concluido,
            treino: this.todaysWorkout
        };
    }

    /**
     * Obter resumo da semana
     */
    getWeekSummary() {
        if (!this.currentPlan) return null;
        
        const diasConcluidos = Object.values(this.currentPlan)
            .filter(dia => dia.concluido).length;
        
        const totalDias = Object.keys(this.currentPlan).length;
        const progresso = Math.round((diasConcluidos / totalDias) * 100);
        
        return {
            diasConcluidos,
            totalDias,
            progresso,
            plano: this.currentPlan
        };
    }
}

// Instância única do gerenciador
export const weeklyPlanManager = new WeeklyPlanManager();
