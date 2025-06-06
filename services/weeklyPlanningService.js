// services/weeklyPlanService.js - VERSÃO REFATORADA UNIFICADA
// Serviço unificado para gestão do planejamento semanal
// Combina todas as funcionalidades em um só lugar com estrutura consistente
// Updated: Fixed import issue by using supabase directly instead of remove function

import { query, insert, update, supabase } from './supabaseService.js';
import { fetchProtocoloAtivoUsuario } from './userService.js';
import { fetchExerciciosTreino, carregarPesosSugeridos } from './workoutService.js';

// ==================== ESTRUTURA UNIFICADA ====================
// Formato padrão para toda a aplicação (0-6 = Dom-Sáb)
// {
//   0: { tipo: 'peito', categoria: 'treino', numero_treino: 1 },  // Domingo
//   1: { tipo: 'folga', categoria: 'folga', numero_treino: null }, // Segunda
//   ...
// }

class WeeklyPlanService {
    // Converter dia JS (0-6) para dia DB (1-7)
    static dayToDb(jsDay) {
        return jsDay === 0 ? 7 : jsDay;
    }
    
    // Converter dia DB (1-7) para dia JS (0-6)
    static dbToDay(dbDay) {
        return dbDay === 7 ? 0 : dbDay;
    }
    
    // Helpers de data
    static getCurrentWeek() {
        const now = new Date();
        return {
            ano: now.getFullYear(),
            semana: this.getWeekNumber(now)
        };
    }
    
    static getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }

    // ==================== OPERAÇÕES PRINCIPAIS ====================
    
    // Salvar plano completo com validação de numero_treino
    static async savePlan(userId, plan) {
        const { ano, semana } = this.getCurrentWeek();
        
        try {
            // 1. Buscar protocolo ativo do usuário
            const protocoloAtivo = await fetchProtocoloAtivoUsuario(userId);
            if (!protocoloAtivo) {
                throw new Error('Usuário não possui protocolo ativo');
            }
            
            // 2. Deletar plano anterior (se existir)
            await this.deletePlan(userId, ano, semana);
            
            // 3. Preparar registros com validação
            const registros = [];
            
            for (const [dia, config] of Object.entries(plan)) {
                let numeroTreino = null;
                
                // Se for treino, validar numero_treino com protocolo do usuário
                if (config.categoria === 'treino' || config.categoria === 'muscular') {
                    // Buscar numero_treino válido do protocolo ativo
                    const { data: protocoloTreinos } = await query('protocolo_treinos', {
                        eq: { protocolo_id: protocoloAtivo.protocolo_treinamento_id },
                        select: 'numero_treino',
                        order: { column: 'numero_treino', ascending: true }
                    });
                    
                    if (protocoloTreinos && protocoloTreinos.length > 0) {
                        // Mapear tipo de treino para numero_treino baseado no protocolo
                        const treinosDisponiveis = [...new Set(protocoloTreinos.map(pt => pt.numero_treino))];
                        
                        // Usar primeiro treino disponível ou calcular baseado no dia
                        const diaIndex = parseInt(dia);
                        const treinoIndex = diaIndex % treinosDisponiveis.length;
                        numeroTreino = treinosDisponiveis[treinoIndex] || treinosDisponiveis[0];
                    }
                }
                
                registros.push({
                    usuario_id: userId,
                    ano,
                    semana,
                    dia_semana: this.dayToDb(parseInt(dia)),
                    tipo_atividade: config.categoria || 'folga',
                    numero_treino: numeroTreino,
                    concluido: false
                });
            }
            
            // 4. Inserir no Supabase
            const { data, error } = await insert('planejamento_semanal', registros);
            
            if (error) throw error;
            
            // 5. Salvar backup no localStorage
            this.saveToLocal(userId, plan);
            
            return { success: true, data };
            
        } catch (error) {
            console.error('[WeeklyPlanService] Erro ao salvar:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Buscar plano atual usando view v_planejamento_completo
    static async getPlan(userId, useCache = true) {
        const { ano, semana } = this.getCurrentWeek();
        
        // 1. Tentar cache local primeiro (se habilitado)
        if (useCache) {
            const cached = this.getFromLocal(userId);
            if (cached) return cached;
        }
        
        try {
            // 2. Buscar do Supabase usando view otimizada
            const { data, error } = await supabase
                .from('v_planejamento_completo')
                .select('*')
                .eq('usuario_id', userId)
                .eq('ano', ano)
                .eq('semana', semana)
                .order('dia_semana', { ascending: true });
            
            if (error || !data?.length) return null;
            
            // 3. Converter para formato da app
            const plan = {};
            data.forEach(dia => {
                const jsDay = this.dbToDay(dia.dia_semana);
                plan[jsDay] = {
                    tipo: dia.tipo_atividade,
                    categoria: dia.tipo_atividade,
                    numero_treino: dia.numero_treino,
                    concluido: dia.concluido,
                    protocolo_id: dia.protocolo_treinamento_id
                };
            });
            
            // 4. Salvar no cache
            this.saveToLocal(userId, plan);
            
            return plan;
            
        } catch (error) {
            console.error('[WeeklyPlanService] Erro ao buscar:', error);
            return this.getFromLocal(userId); // Fallback para cache
        }
    }
    
    // Verificar se precisa de planejamento
    static async needsPlanning(userId) {
        const plan = await this.getPlan(userId, false); // Não usar cache
        return !plan;
    }

    // Atualizar dia específico
    static async updateDay(userId, dia, config) {
        console.log('[editWeeklyPlan] Parâmetros recebidos:', { userId, diaIndex: dia, novoTreino: config });
        
        // Validar parâmetros
        if (!userId || isNaN(userId)) {
            console.error('[editWeeklyPlan] userId inválido:', userId);
            return { success: false, error: 'userId inválido' };
        }
        
        if (isNaN(dia) || dia < 0 || dia > 6) {
            console.error('[editWeeklyPlan] diaIndex inválido:', dia);
            return { success: false, error: 'diaIndex deve ser um número entre 0 e 6' };
        }
        
        if (!config || typeof config !== 'object') {
            console.error('[editWeeklyPlan] configuração do treino inválida:', config);
            return { success: false, error: 'configuração do treino é obrigatória' };
        }
        
        const { ano, semana } = this.getCurrentWeek();
        
        try {
            const { error } = await update('planejamento_semanal', 
                {
                    tipo_atividade: config.categoria || 'folga',
                    numero_treino: config.numero_treino || null,
                    observacoes: config.tipo
                },
                {
                    eq: {
                        usuario_id: userId,
                        ano,
                        semana,
                        dia_semana: this.dayToDb(dia)
                    }
                }
            );
            
            if (error) throw error;
            
            // Atualizar cache
            const plan = await this.getPlan(userId, false);
            this.saveToLocal(userId, plan);
            
            return { success: true };
            
        } catch (error) {
            console.error('[WeeklyPlanService] Erro ao atualizar:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Marcar dia como concluído
    static async markDayComplete(userId, dia) {
        const { ano, semana } = this.getCurrentWeek();
        
        try {
            const { error } = await update('planejamento_semanal',
                { 
                    concluido: true,
                    data_conclusao: new Date().toISOString()
                },
                {
                    eq: {
                        usuario_id: userId,
                        ano,
                        semana,
                        dia_semana: this.dayToDb(dia)
                    }
                }
            );
            
            if (error) throw error;
            
            return { success: true };
            
        } catch (error) {
            console.error('[WeeklyPlanService] Erro ao marcar concluído:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Deletar plano
    static async deletePlan(userId, ano, semana) {
        try {
            await supabase
                .from('planejamento_semanal')
                .delete()
                .eq('usuario_id', userId)
                .eq('ano', ano)
                .eq('semana', semana);
            
            this.clearLocal(userId);
            
        } catch (error) {
            console.error('[WeeklyPlanService] Erro ao deletar:', error);
        }
    }

    // ==================== CACHE LOCALSTORAGE ====================
    
    // Helpers localStorage
    static getLocalKey(userId) {
        const { ano, semana } = this.getCurrentWeek();
        return `weekPlan_${userId}_${ano}_${semana}`;
    }
    
    static saveToLocal(userId, plan) {
        try {
            localStorage.setItem(this.getLocalKey(userId), JSON.stringify(plan));
        } catch (e) {
            console.warn('[WeeklyPlanService] Erro ao salvar cache:', e);
        }
    }
    
    static getFromLocal(userId) {
        try {
            const data = localStorage.getItem(this.getLocalKey(userId));
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    }
    
    static clearLocal(userId) {
        try {
            localStorage.removeItem(this.getLocalKey(userId));
        } catch (e) {}
    }

    // ==================== FUNCIONALIDADES AVANÇADAS ====================
    
    // Buscar treino do dia usando view v_planejamento_completo
    static async getTodaysWorkout(userId) {
        const hoje = new Date().getDay(); // 0 = domingo, 1 = segunda, etc.
        const { ano, semana } = this.getCurrentWeek();
        
        try {
            // Usar view v_planejamento_completo para JOIN otimizado
            const { data, error } = await supabase
                .from('v_planejamento_completo')
                .select('*')
                .eq('usuario_id', userId)
                .eq('ano', ano)
                .eq('semana', semana)
                .eq('dia_semana', this.dayToDb(hoje))
                .single();
            
            if (error || !data) {
                console.log('[getTodaysWorkout] Nenhum planejamento para hoje');
                return null;
            }
            
            const planoDoDia = data;
            
            // Se não for treino, retornar info do dia
            if (planoDoDia.tipo_atividade === 'folga' || planoDoDia.tipo_atividade === 'cardio') {
                return {
                    tipo: planoDoDia.tipo_atividade,
                    nome: planoDoDia.tipo_atividade === 'folga' ? 'Dia de Folga' : 'Cardio',
                    exercicios: []
                };
            }
            
            // Se for treino, usar numero_treino do planejamento
            if (planoDoDia.tipo_atividade === 'treino' && planoDoDia.numero_treino) {
                const exercicios = await fetchExerciciosTreino(
                    planoDoDia.numero_treino, 
                    planoDoDia.protocolo_treinamento_id
                );
                
                return {
                    tipo: 'treino',
                    nome: `Treino ${planoDoDia.observacoes || planoDoDia.tipo_atividade}`,
                    numero_treino: planoDoDia.numero_treino,
                    exercicios: exercicios,
                    protocolo_treino_id: planoDoDia.protocolo_treinamento_id
                };
            }
            
            return null;
            
        } catch (error) {
            console.error('[getTodaysWorkout] Erro:', error);
            return null;
        }
    }

    // Verificar quais dias podem ser editados
    static async getEditableDays(userId) {
        const { ano, semana } = this.getCurrentWeek();
        
        try {
            const { data: planoAtual } = await query('planejamento_semanal', {
                eq: { 
                    usuario_id: userId,
                    ano: ano,
                    semana: semana
                },
                order: { column: 'dia_semana', ascending: true }
            });
            
            if (!planoAtual) return [];
            
            // Retornar apenas dias que podem ser editados
            return planoAtual.map(dia => ({
                dia_semana: this.dbToDay(dia.dia_semana), // Converter de volta para 0-6
                tipo_atividade: dia.tipo_atividade,
                concluido: dia.concluido,
                editavel: !dia.concluido
            }));
        } catch (error) {
            console.error('[WeeklyPlanService] Erro ao buscar dias editáveis:', error);
            return [];
        }
    }

    // Buscar histórico de planos semanais
    static async getPlanHistory(userId, limit = 10) {
        try {
            const { data: historico } = await query('planejamento_semanal', {
                eq: { usuario_id: userId },
                order: [
                    { column: 'ano', ascending: false },
                    { column: 'semana', ascending: false }
                ],
                limit: limit * 7 // 7 dias por semana
            });
            
            if (!historico) return [];
            
            // Agrupar por semana
            const semanas = {};
            historico.forEach(dia => {
                const chave = `${dia.ano}_${dia.semana}`;
                if (!semanas[chave]) {
                    semanas[chave] = {
                        ano: dia.ano,
                        semana: dia.semana,
                        dias: [],
                        concluida: true
                    };
                }
                
                semanas[chave].dias.push(dia);
                if (!dia.concluido) {
                    semanas[chave].concluida = false;
                }
            });
            
            return Object.values(semanas);
        } catch (error) {
            console.error('[WeeklyPlanService] Erro ao buscar histórico:', error);
            return [];
        }
    }
    
    // Verificar se semana foi totalmente concluída
    static async checkWeekCompletion(userId) {
        const { ano, semana } = this.getCurrentWeek();
        
        try {
            const { data: planoAtual } = await query('planejamento_semanal', {
                eq: { 
                    usuario_id: userId,
                    ano: ano,
                    semana: semana
                }
            });
            
            if (!planoAtual) return false;
            
            // Verificar se todos os dias estão concluídos
            const todosConcluidos = planoAtual.every(dia => dia.concluido);
            
            if (todosConcluidos) {
                // Avançar semana do protocolo do usuário
                const protocoloAtivo = await fetchProtocoloAtivoUsuario(userId);
                if (protocoloAtivo) {
                    const novaSemana = (protocoloAtivo.semana_atual || 1) + 1;
                    
                    // Atualizar semana do protocolo
                    await update('usuario_plano_treino', 
                        { semana_atual: novaSemana },
                        { eq: { id: protocoloAtivo.id } }
                    );
                }
                
                return true; // Semana concluída
            }
            
            return false; // Ainda há dias pendentes
        } catch (error) {
            console.error('[WeeklyPlanService] Erro ao verificar conclusão:', error);
            return false;
        }
    }

    // Buscar pesos sugeridos para o treino do dia
    static async getTodaysWorkoutWithWeights(userId) {
        const treinoDoDia = await this.getTodaysWorkout(userId);
        
        if (!treinoDoDia || treinoDoDia.tipo !== 'treino') {
            return treinoDoDia;
        }
        
        // Enriquecer exercícios com pesos sugeridos
        const exerciciosComPesos = await Promise.all(
            treinoDoDia.exercicios.map(async (exercicio) => {
                const { data: pesos } = await carregarPesosSugeridos(
                    userId, 
                    exercicio.protocolo_treino_id
                );
                
                return {
                    ...exercicio,
                    pesos_sugeridos: pesos
                };
            })
        );
        
        return {
            ...treinoDoDia,
            exercicios: exerciciosComPesos
        };
    }
}

// ==================== EXPORTAÇÕES E COMPATIBILIDADE ====================

// Instância padrão do serviço
const weeklyPlanService = WeeklyPlanService;

// Exportações para compatibilidade com código existente
export async function needsWeeklyPlanning(userId) {
    return await weeklyPlanService.needsPlanning(userId);
}

export async function getActiveWeeklyPlan(userId) {
    return await weeklyPlanService.getPlan(userId);
}

export async function saveWeeklyPlan(userId, planejamento) {
    return await weeklyPlanService.savePlan(userId, planejamento);
}

export async function getTodaysWorkout(userId) {
    return await weeklyPlanService.getTodaysWorkout(userId);
}

export async function markDayAsCompleted(userId, diaIndex) {
    const result = await weeklyPlanService.markDayComplete(userId, diaIndex);
    return result.success;
}

export async function editWeeklyPlan(userId, diaIndex, novoTreino) {
    return await weeklyPlanService.updateDay(userId, diaIndex, novoTreino);
}

export async function getEditableDays(userId) {
    return await weeklyPlanService.getEditableDays(userId);
}

export async function getWeeklyPlanHistory(userId, limit = 10) {
    return await weeklyPlanService.getPlanHistory(userId, limit);
}

export async function checkAndCreateNewWeek(userId) {
    return await weeklyPlanService.checkWeekCompletion(userId);
}

export async function getTodaysWorkoutWithWeights(userId) {
    return await weeklyPlanService.getTodaysWorkoutWithWeights(userId);
}

// Exportação principal do serviço
export default WeeklyPlanService;
