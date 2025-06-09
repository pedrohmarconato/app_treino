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
//   1: { tipo: 'cardio', categoria: 'cardio', numero_treino: null }, // Segunda
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
            console.log('[WeeklyPlanService.savePlan] 🚀 INICIANDO SALVAMENTO COMPLETO');
            console.log('[WeeklyPlanService.savePlan] 👤 UserId:', userId);
            console.log('[WeeklyPlanService.savePlan] 📅 Período:', { ano, semana });
            console.log('[WeeklyPlanService.savePlan] 📋 Plano recebido:', JSON.stringify(plan, null, 2));
            
            // 1. Buscar protocolo ativo do usuário
            console.log('[WeeklyPlanService.savePlan] 🔍 Buscando protocolo ativo...');
            const protocoloAtivo = await fetchProtocoloAtivoUsuario(userId);
            if (!protocoloAtivo) {
                console.error('[WeeklyPlanService.savePlan] ❌ Protocolo ativo não encontrado');
                throw new Error('Usuário não possui protocolo ativo');
            }
            console.log('[WeeklyPlanService.savePlan] ✅ Protocolo ativo encontrado:', protocoloAtivo);
            
            // 2. Deletar plano anterior (se existir)
            console.log('[WeeklyPlanService.savePlan] 🗑️ Deletando plano anterior para:', { userId, ano, semana });
            await this.deletePlan(userId, ano, semana);
            console.log('[WeeklyPlanService.savePlan] ✅ Plano anterior deletado');
            
            // 3. Preparar registros com validação
            console.log('[WeeklyPlanService.savePlan] 📝 Preparando registros para inserção...');
            const registros = [];
            
            for (const [dia, config] of Object.entries(plan)) {
                console.log(`[WeeklyPlanService.savePlan] 🔍 SALVANDO - Dia ${dia}:`, {
                    tipo: config.tipo,
                    categoria: config.categoria,
                    config_completa: config
                });
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
                
                const registro = {
                    usuario_id: userId,
                    ano,
                    semana,
                    dia_semana: this.dayToDb(parseInt(dia)),
                    tipo_atividade: config.tipo || config.categoria, // Salvar tipo específico diretamente
                    numero_treino: numeroTreino,
                    concluido: false
                };
                
                console.log(`[WeeklyPlanService.savePlan] 📝 REGISTRO CRIADO - Dia ${dia}:`, registro);
                registros.push(registro);
            }
            
            // 4. Inserir no Supabase
            console.log('[WeeklyPlanService.savePlan] 📤 PREPARANDO PARA ENVIAR AO SUPABASE');
            console.log('[WeeklyPlanService.savePlan] 📊 Quantidade de registros:', registros.length);
            console.log('[WeeklyPlanService.savePlan] 📄 Registros completos:', JSON.stringify(registros, null, 2));
            
            console.log('[WeeklyPlanService.savePlan] 🚀 ENVIANDO PARA SUPABASE...');
            const { data, error } = await insert('planejamento_semanal', registros);
            
            if (error) {
                console.error('[WeeklyPlanService.savePlan] ❌ ERRO CRÍTICO do Supabase:', error);
                console.error('[WeeklyPlanService.savePlan] 🔍 Dados que causaram erro:', registros);
                throw error;
            }
            
            console.log('[WeeklyPlanService.savePlan] ✅ SUCESSO! Plano semanal salvo no Supabase!');
            console.log('[WeeklyPlanService.savePlan] 📥 Dados retornados do Supabase:', data);
            
            // 5. Salvar backup no localStorage
            console.log('[WeeklyPlanService.savePlan] 💾 Salvando backup no localStorage...');
            this.saveToLocal(userId, plan);
            console.log('[WeeklyPlanService.savePlan] ✅ Backup salvo no localStorage');
            
            console.log('[WeeklyPlanService.savePlan] 🎉 SALVAMENTO COMPLETAMENTE FINALIZADO!');
            return { success: true, data };
            
        } catch (error) {
            console.error('[WeeklyPlanService] Erro ao salvar:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Buscar plano atual com fallback robusto
    static async getPlan(userId, useCache = true) {
        console.log('[WeeklyPlanService.getPlan] 🔍 INICIANDO busca do plano para usuário:', userId);
        
        if (!userId) {
            console.error('[WeeklyPlanService.getPlan] ❌ userId é obrigatório');
            return null;
        }
        
        const { ano, semana } = this.getCurrentWeek();
        console.log('[WeeklyPlanService.getPlan] 📅 Buscando plano para semana:', { ano, semana });
        
        // 1. Tentar cache local primeiro (se habilitado)
        if (useCache) {
            const cached = this.getFromLocal(userId);
            if (cached) {
                console.log('[WeeklyPlanService.getPlan] ✅ Dados do cache:', cached);
                return cached;
            }
        }
        
        try {
            // 2. Tentar buscar usando view otimizada primeiro
            console.log('[WeeklyPlanService.getPlan] 🔄 Tentando view v_planejamento_completo...');
            let { data, error } = await supabase
                .from('v_planejamento_completo')
                .select('*')
                .eq('usuario_id', userId)
                .eq('ano', ano)
                .eq('semana', semana)
                .order('dia_semana', { ascending: true });
            
            // 3. Se view falhar, usar tabela base como fallback
            if (error) {
                console.warn('[WeeklyPlanService.getPlan] ⚠️ View falhou, usando tabela base:', error.message);
                const fallbackResult = await supabase
                    .from('planejamento_semanal')
                    .select('*')
                    .eq('usuario_id', userId)
                    .eq('ano', ano)
                    .eq('semana', semana)
                    .order('dia_semana', { ascending: true });
                
                data = fallbackResult.data;
                error = fallbackResult.error;
                
                if (error) {
                    console.error('[WeeklyPlanService.getPlan] ❌ Fallback também falhou:', error);
                    return null;
                }
            }
            
            if (!data?.length) {
                console.log('[WeeklyPlanService.getPlan] 📭 Nenhum plano encontrado para esta semana');
                return null;
            }
            
            // 4. Converter para formato da app com validação
            const plan = {};
            console.log('[WeeklyPlanService.getPlan] 🔍 DADOS BRUTOS DO BANCO:', data);
            
            data.forEach(dia => {
                const jsDay = this.dbToDay(dia.dia_semana);
                
                // Validação e limpeza dos dados
                let tipoAtividade = dia.tipo_atividade || dia.tipo;
                if (!tipoAtividade || tipoAtividade === 'undefined' || tipoAtividade === 'null' || !tipoAtividade.trim()) {
                    return; // Pular dias sem atividade definida
                }
                
                const planoDia = {
                    tipo: tipoAtividade,
                    tipo_atividade: tipoAtividade, // Garantir ambos os campos
                    categoria: tipoAtividade,
                    numero_treino: dia.numero_treino,
                    concluido: Boolean(dia.concluido),
                    protocolo_id: dia.protocolo_treinamento_id || 1 // Fallback para protocolo padrão
                };
                
                console.log(`[WeeklyPlanService.getPlan] 📊 CONVERTENDO - Dia ${jsDay}:`, {
                    original: dia,
                    convertido: planoDia,
                    tipoAtividade: tipoAtividade
                });
                
                plan[jsDay] = planoDia;
            });
            
            // 5. Validar resultado
            if (Object.keys(plan).length === 0) {
                console.warn('[WeeklyPlanService.getPlan] ⚠️ Plano vazio após conversão');
                return null;
            }
            
            // 6. Salvar no cache
            this.saveToLocal(userId, plan);
            console.log('[WeeklyPlanService.getPlan] ✅ Plano carregado com sucesso:', plan);
            
            return plan;
            
        } catch (error) {
            console.error('[WeeklyPlanService.getPlan] ❌ ERRO CRÍTICO:', error);
            // Fallback para cache em caso de erro
            const cachedPlan = this.getFromLocal(userId);
            if (cachedPlan) {
                console.log('[WeeklyPlanService.getPlan] 🔄 Usando cache como fallback');
                return cachedPlan;
            }
            return null;
        }
    }
    
    // Verificar se precisa de planejamento - CORRIGIDO
    static async needsPlanning(userId) {
        try {
            console.log('[needsPlanning] Verificando se usuário precisa de planejamento:', userId);
            
            // 1. Verificar se semana atual já foi programada
            const { data: status } = await query('v_status_semanas_usuario', {
                eq: { 
                    usuario_id: userId,
                    eh_semana_atual: true 
                },
                single: true
            });
            
            console.log('[needsPlanning] Status da semana atual:', status);
            
            // Se semana atual já foi programada, NÃO precisa de planejamento
            if (status && status.semana_programada) {
                console.log('✅ Semana já programada, indo para home');
                return false; // NÃO precisa
            }
            
            // Se não foi programada, PRECISA ir para planejamento
            console.log('⚠️ Semana não programada, indo para planejamento');
            return true; // PRECISA
            
        } catch (error) {
            console.error('[needsPlanning] Erro ao verificar planejamento:', error);
            
            // Fallback: verificar plano existente (método anterior)
            const plan = await this.getPlan(userId, false);
            const needsPlanning = !plan;
            
            console.log('[needsPlanning] Fallback - plano existente:', !!plan, 'precisa:', needsPlanning);
            return needsPlanning; // Em caso de erro na view, usa método anterior
        }
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
                    tipo_atividade: config.categoria,
                    numero_treino: config.numero_treino || null
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
            console.log('[WeeklyPlanService.deletePlan] 🗑️ Iniciando deleção:', { userId, ano, semana });
            
            const { data, error } = await supabase
                .from('planejamento_semanal')
                .delete()
                .eq('usuario_id', userId)
                .eq('ano', ano)
                .eq('semana', semana);
            
            if (error) {
                console.error('[WeeklyPlanService.deletePlan] ❌ Erro no Supabase:', error);
                throw error;
            }
            
            console.log('[WeeklyPlanService.deletePlan] ✅ Registros deletados:', data);
            this.clearLocal(userId);
            
        } catch (error) {
            console.error('[WeeklyPlanService.deletePlan] ❌ Erro ao deletar:', error);
            throw error; // Re-throw para o caller saber que houve erro
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
    
    // Buscar treino do dia com fallback robusto
    static async getTodaysWorkout(userId) {
        if (!userId) {
            console.error('[getTodaysWorkout] ❌ userId é obrigatório');
            return null;
        }
        
        const hoje = new Date().getDay(); // 0 = domingo, 1 = segunda, etc.
        const { ano, semana } = this.getCurrentWeek();
        
        console.log('[getTodaysWorkout] 🔍 Buscando treino do dia:', { userId, hoje, ano, semana });
        
        try {
            // 1. Tentar view primeiro
            let { data, error } = await supabase
                .from('v_planejamento_completo')
                .select('*')
                .eq('usuario_id', userId)
                .eq('ano', ano)
                .eq('semana', semana)
                .eq('dia_semana', this.dayToDb(hoje))
                .single();
            
            // 2. Fallback para tabela base se view falhar
            if (error) {
                console.warn('[getTodaysWorkout] ⚠️ View falhou, usando tabela base:', error.message);
                const fallbackResult = await supabase
                    .from('planejamento_semanal')
                    .select('*')
                    .eq('usuario_id', userId)
                    .eq('ano', ano)
                    .eq('semana', semana)
                    .eq('dia_semana', this.dayToDb(hoje))
                    .single();
                
                data = fallbackResult.data;
                error = fallbackResult.error;
            }
            
            if (error || !data) {
                console.log('[getTodaysWorkout] 📭 Nenhum planejamento para hoje:', error?.message);
                return null;
            }
            
            const planoDoDia = data;
            console.log('[getTodaysWorkout] 📊 Dados do dia encontrados:', planoDoDia);
            
            // Validação e limpeza do tipo de atividade
            let tipoAtividade = planoDoDia.tipo_atividade || planoDoDia.tipo;
            if (!tipoAtividade || tipoAtividade === 'undefined' || tipoAtividade === 'null' || !tipoAtividade.trim()) {
                return null; // Não há treino definido para hoje
            }
            
            // Se for cardio, retornar info básica
            if (tipoAtividade.toLowerCase() === 'cardio') {
                return {
                    tipo: tipoAtividade,
                    tipo_atividade: tipoAtividade,
                    nome: 'Treino Cardiovascular',
                    exercicios: []
                };
            }
            
            // Para treinos de força, buscar exercícios
            const protocoloId = planoDoDia.protocolo_treinamento_id || 1; // Fallback para protocolo padrão
            
            if (planoDoDia.numero_treino && protocoloId) {
                console.log('[getTodaysWorkout] 🏋️ Buscando exercícios:', { 
                    numero_treino: planoDoDia.numero_treino, 
                    protocolo_id: protocoloId 
                });
                
                const exercicios = await fetchExerciciosTreino(
                    planoDoDia.numero_treino,
                    protocoloId
                );
                
                return {
                    tipo: tipoAtividade,
                    tipo_atividade: tipoAtividade,
                    nome: `Treino ${tipoAtividade}`,
                    grupo_muscular: tipoAtividade,
                    numero_treino: planoDoDia.numero_treino,
                    exercicios: exercicios || []
                };
            }
            
            // Fallback para treino sem exercícios
            return {
                tipo: tipoAtividade,
                tipo_atividade: tipoAtividade,
                nome: `Treino ${tipoAtividade}`,
                grupo_muscular: tipoAtividade,
                numero_treino: planoDoDia.numero_treino,
                exercicios: []
            };
            
        } catch (error) {
            console.error('[getTodaysWorkout] ❌ ERRO CRÍTICO:', error);
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

    // FUNÇÃO TEMPORARIAMENTE DESABILITADA - Tabelas workouts/weekly_plan não existem na estrutura atual
    // Esta função seria usada se houvesse um modelo de dados diferente com essas tabelas
    static async getWorkoutsWithWeeklyPlan(userId) {
        console.warn('[getWorkoutsWithWeeklyPlan] ⚠️ Esta função não se aplica à estrutura atual do banco');
        console.warn('[getWorkoutsWithWeeklyPlan] ℹ️ Use getPlan() para buscar planejamento semanal');
        
        // Retornar o plano semanal atual como fallback
        return await this.getPlan(userId);
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

export async function getWorkoutsWithWeeklyPlan(userId) {
    return await weeklyPlanService.getWorkoutsWithWeeklyPlan(userId);
}

// ==================== NOVAS FUNÇÕES - INTEGRAÇÃO CALENDÁRIO ====================

// Verificar se semana já foi programada
export async function verificarSemanaJaProgramada(userId, semanaTreino) {
    try {
        const { data } = await query('verificar_semana_programada', {
            rpc: {
                p_usuario_id: userId,
                p_semana_treino: semanaTreino
            }
        });
        
        return data; // true/false
    } catch (error) {
        console.error('[verificarSemanaJaProgramada] Erro:', error);
        return false;
    }
}

// Obter semana ativa do usuário
export async function obterSemanaAtivaUsuario(userId) {
    try {
        const { data } = await query('obter_semana_ativa_usuario', {
            rpc: { p_usuario_id: userId }
        });
        
        return data[0] || null;
    } catch (error) {
        console.error('[obterSemanaAtivaUsuario] Erro:', error);
        return null;
    }
}

// Marcar semana como programada
export async function marcarSemanaProgramada(userId, semanaTreino, usuarioQueProgramou = null) {
    try {
        const { data } = await query('marcar_semana_programada', {
            rpc: {
                p_usuario_id: userId,
                p_semana_treino: semanaTreino,
                p_usuario_que_programou: usuarioQueProgramou || userId
            }
        });
        
        console.log('✅ Semana marcada como programada:', data);
        return { success: true, data };
    } catch (error) {
        console.error('[marcarSemanaProgramada] Erro:', error);
        return { success: false, error: error.message };
    }
}

// Carregar status das semanas (para menu)
export async function carregarStatusSemanas(userId) {
    try {
        const { data } = await query('v_status_semanas_usuario', {
            eq: { usuario_id: userId },
            order: { column: 'semana_treino', ascending: true }
        });
        
        return data || [];
    } catch (error) {
        console.error('[carregarStatusSemanas] Erro:', error);
        return [];
    }
}

// Carregar planejamento completo de uma semana
export async function carregarPlanejamentoSemana(userId, semanaTreino) {
    try {
        const { data } = await query('v_planejamento_calendario_completo', {
            eq: { 
                usuario_id: userId,
                semana_treino: semanaTreino 
            },
            order: { column: 'dia_semana', ascending: true }
        });
        
        return data;
    } catch (error) {
        console.error('[carregarPlanejamentoSemana] Erro:', error);
        return [];
    }
}

// Obter estatísticas de programação
export async function obterEstatisticasProgramacao(userId) {
    try {
        const { data } = await query('v_status_semanas_usuario', {
            eq: { usuario_id: userId }
        });
        
        if (!data) return { total: 0, programadas: 0, ativas: 0 };
        
        const total = data.length;
        const programadas = data.filter(s => s.semana_programada).length;
        const ativas = data.filter(s => s.eh_semana_ativa).length;
        
        return { total, programadas, ativas };
    } catch (error) {
        console.error('[obterEstatisticasProgramacao] Erro:', error);
        return { total: 0, programadas: 0, ativas: 0 };
    }
}

// Exportação principal do serviço
export default WeeklyPlanService;
