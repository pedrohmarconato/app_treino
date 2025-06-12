// services/weeklyPlanService.js - VERSÃO REFATORADA UNIFICADA
// Serviço unificado para gestão do planejamento semanal
// Combina todas as funcionalidades em um só lugar com estrutura consistente
// Updated: Fixed import issue by using supabase directly instead of remove function

import { query, insert, update, supabase } from './supabaseService.js';

// Verifica se a semana já está programada para o usuário e semana_treino
function verificarSemanaJaProgramada(userId, semanaTreino) {
    return query('planejamento_semanal', {
        eq: { usuario_id: userId, semana: semanaTreino }
    }).then(({ data }) => !!(data && data.length > 0));
}

// Função utilitária para garantir tipo_atividade válido
function mapTipoAtividade(tipo) {
    if (!tipo) return 'treino';
    const t = tipo.trim().toLowerCase();
    
    // Cardio activities - normalize to 'cardio'
    if (t === 'cardio' || t.includes('cardio')) return 'cardio';
    
    // Rest day
    if (t === 'folga') return 'folga';
    
    // Muscle groups - normalize to exercicios.grupo_muscular format
    const muscleGroupMap = {
        'peito': 'Peito',
        'costas': 'Costas', 
        'pernas': 'Pernas',
        'ombro': 'Ombro e Braço', // Padronizar para formato completo
        'ombro e braço': 'Ombro e Braço',
        'braço': 'Ombro e Braço', // Mapear braço isolado para o formato completo
        'braco': 'Ombro e Braço',
        'bíceps': 'Ombro e Braço',
        'biceps': 'Ombro e Braço',
        'tríceps': 'Ombro e Braço',
        'triceps': 'Ombro e Braço',
        'superior': 'Superior',
        'inferior': 'Inferior'
    };
    
    // Check for exact muscle group match
    if (muscleGroupMap[t]) {
        return muscleGroupMap[t];
    }
    
    // Check for partial matches (e.g., "ombro e braço")
    for (const [key, value] of Object.entries(muscleGroupMap)) {
        if (t.includes(key)) {
            return value;
        }
    }
    
    // Return original if it's already properly formatted (like "Peito", "Costas")
    return tipo;
}

import { fetchProtocoloAtivoUsuario } from './userService.js';
import { fetchExerciciosTreino, carregarPesosSugeridos } from './workoutService.js';

// ==================== ESTRUTURA UNIFICADA ====================
// Formato padrão para toda a aplicação (0-6 = Dom-Sáb)
// {
//   0: { tipo: 'peito', categoria: 'treino' },  // Domingo
//   1: { tipo: 'cardio', categoria: 'cardio' }, // Segunda
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
    
    // Salvar plano completo
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
                const registro = {
                    usuario_id: userId,
                    ano,
                    semana,
                    dia_semana: this.dayToDb(parseInt(dia)),
                    tipo_atividade: mapTipoAtividade(config.tipo || config.categoria),
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
            // 2. Buscar dados da tabela planejamento_semanal diretamente
            console.log('[WeeklyPlanService.getPlan] 🔄 Buscando dados do planejamento_semanal...');
            let { data, error } = await supabase
                .from('planejamento_semanal')
                .select('*')
                .eq('usuario_id', userId)
                .eq('ano', ano)
                .eq('semana', semana)
                .order('dia_semana', { ascending: true });
            
            // 3. Se houver erro, retornar null
            if (error) {
                console.error('[WeeklyPlanService.getPlan] ❌ Erro ao buscar planejamento:', error);
                return null;
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
            const { data: status, error } = await query('v_status_semanas_usuario', {
                eq: { 
                    usuario_id: userId,
                    eh_semana_atual: true 
                }
            });
            
            if (error) {
                console.error('[needsPlanning] Erro na consulta v_status_semanas_usuario:', error);
                // Fallback: verificar plano existente diretamente
                const plan = await this.getPlan(userId, false);
                const needsPlanning = !plan;
                console.log('[needsPlanning] Fallback - plano existente:', !!plan, 'precisa:', needsPlanning);
                return needsPlanning;
            }
            
            console.log('[needsPlanning] Status da semana atual:', status);
            
            // Se não há dados, usar fallback
            if (!status || !Array.isArray(status) || status.length === 0) {
                console.log('[needsPlanning] Nenhum status encontrado, usando fallback...');
                const plan = await this.getPlan(userId, false);
                const needsPlanning = !plan;
                console.log('[needsPlanning] Fallback - plano existente:', !!plan, 'precisa:', needsPlanning);
                return needsPlanning;
            }
            
            // Pegar primeiro resultado (se for array) ou usar o objeto diretamente
            const statusAtual = Array.isArray(status) ? status[0] : status;
            
            // Se semana atual já foi programada, NÃO precisa de planejamento
            if (statusAtual && statusAtual.semana_programada) {
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
                    tipo_atividade: config.categoria
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
            // 1. Buscar dados do planejamento_semanal diretamente
            let { data, error } = await supabase
                .from('planejamento_semanal')
                .select('*')
                .eq('usuario_id', userId)
                .eq('ano', ano)
                .eq('semana', semana)
                .eq('dia_semana', this.dayToDb(hoje))
                .single();
            
            // Dados já no formato esperado com .single()
            
            // 2. Se não encontrar dados, retornar null
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
            
            if (protocoloId) {
                console.log('[getTodaysWorkout] 🏋️ Buscando exercícios:', { 
                    tipo_atividade: tipoAtividade, 
                    protocolo_id: protocoloId 
                });
                
                const exercicios = await fetchExerciciosTreino(
                    tipoAtividade, // Este já é o grupo muscular do planejamento
                    protocoloId
                );
                
                return {
                    tipo: tipoAtividade,
                    tipo_atividade: tipoAtividade,
                    nome: `Treino ${tipoAtividade}`,
                    grupo_muscular: tipoAtividade,
                    exercicios: exercicios || []
                };
            }
            
            // Fallback para treino sem exercícios
            return {
                tipo: tipoAtividade,
                tipo_atividade: tipoAtividade,
                nome: `Treino ${tipoAtividade}`,
                grupo_muscular: tipoAtividade,
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

// Adicionar nossa nova função ao objeto WeeklyPlanService
WeeklyPlanService.buscarExerciciosTreinoDia = buscarExerciciosTreinoDia;

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


export async function verificarDisponibilidadeCalendario() {
    try {
        console.log('[verificarDisponibilidadeCalendario] Verificando disponibilidade da tabela "d_calendario"...');
        
        // Tentar buscar uma linha da tabela "d_calendario"
        const { data, error } = await query('d_calendario', {
            limit: 1
        });
        
        // Verificar se é erro 404 (tabela não existe)
        if (error && (error.code === 'PGRST116' || error.message?.includes('404') || error.message?.includes('not found'))) {
            console.log('[verificarDisponibilidadeCalendario] ❌ Tabela "d_calendario" não existe no banco (404)');
            return { 
                disponivel: false, 
                erro: 'Tabela não existe', 
                codigo: '404_NOT_FOUND',
                recomendacao: 'Execute os scripts SQL para criar a tabela "d_calendario"'
            };
        }
        
        if (error) {
            console.log('[verificarDisponibilidadeCalendario] ❌ Erro ao acessar "d_calendario":', error.message);
            return { 
                disponivel: false, 
                erro: error.message, 
                codigo: error.code 
            };
        }
        
        if (!data || data.length === 0) {
            console.log('[verificarDisponibilidadeCalendario] ⚠️ Tabela "d_calendario" existe mas está vazia');
            return { 
                disponivel: true, 
                populado: false, 
                erro: 'Tabela vazia',
                recomendacao: 'Execute a função popular_d_calendario() para popular com dados'
            };
        }
        
        // Verificar se há semana ativa
        const { data: semanaAtiva, error: semanaError } = await query('d_calendario', {
            eq: { 
                eh_semana_atual: true,
                eh_semana_ativa: true
            },
            limit: 1
        });
        
        const temSemanaAtiva = !semanaError && semanaAtiva && semanaAtiva.length > 0;
        
        console.log('[verificarDisponibilidadeCalendario] ✅ "d_calendario" disponível:', {
            registros: data.length,
            temSemanaAtiva
        });
        
        return { 
            disponivel: true, 
            populado: true,
            temSemanaAtiva,
            registros: data.length,
            status: 'funcionando'
        };
        
    } catch (error) {
        console.log('[verificarDisponibilidadeCalendario] ❌ Erro crítico ao verificar:', error.message);
        return { 
            disponivel: false, 
            erro: error.message,
            codigo: 'CRITICAL_ERROR'
        };
    }
}

// Obter semana ativa do usuário - VERSÃO INTELIGENTE COM DETECÇÃO DE CALENDÁRIO
export async function obterSemanaAtivaUsuario(userId) {
    try {
        console.log('[obterSemanaAtivaUsuario] Buscando semana ativa para usuário:', userId);
        
        // Verificar se "d_calendario" está disponível primeiro (cache de verificação)
        if (!obterSemanaAtivaUsuario._calendarioStatus) {
            console.log('[obterSemanaAtivaUsuario] Verificando disponibilidade do "d_calendario"...');
            obterSemanaAtivaUsuario._calendarioStatus = await verificarDisponibilidadeCalendario();
        }
        
        const calendarioDisponivel = obterSemanaAtivaUsuario._calendarioStatus.disponivel && 
                                   obterSemanaAtivaUsuario._calendarioStatus.temSemanaAtiva;
        
        console.log('[obterSemanaAtivaUsuario] Status do calendário:', {
            disponivel: obterSemanaAtivaUsuario._calendarioStatus.disponivel,
            temSemanaAtiva: obterSemanaAtivaUsuario._calendarioStatus.temSemanaAtiva,
            usarCalendario: calendarioDisponivel
        });
        
        // Método 1: View v_semana_atual_treino temporariamente desabilitada devido a problema de JOIN
        // TODO: Investigar por que view não tem usuario_id disponível e reativar quando corrigido
        if (calendarioDisponivel) {
            // try {
            //     const { data: semanaAtivaView, error: viewError } = await query('v_semana_atual_treino', {
            //         eq: { usuario_id: userId },
            //         limit: 1
            //     });
            //     
            //     if (!viewError && semanaAtivaView && semanaAtivaView.length > 0) {
            //         const semanaData = semanaAtivaView[0];
            //         console.log('[obterSemanaAtivaUsuario] ✅ Dados obtidos da view v_semana_atual_treino:', semanaData);
            //         return {
            //             semana_treino: semanaData.semana_treino,
            //             protocolo_treinamento_id: semanaData.protocolo_treinamento_id,
            //             percentual_1rm_calculado: semanaData.percentual_1rm || 75,
            //             usuario_id: userId,
            //             calendario_id: semanaData.calendario_id,
            //             eh_semana_ativa: semanaData.eh_semana_ativa,
            //             fonte: 'view_calendario'
            //         };
            //     }
            // } catch (viewError) {
            //     console.log('[obterSemanaAtivaUsuario] View v_semana_atual_treino falhou:', viewError.message);
            // }
            
            // Método 2: Buscar diretamente na tabela "d_calendario" se view falhou
            try {
                const { data: semanasAtivas } = await query('d_calendario', {
                    eq: { 
                        eh_semana_atual: true,
                        eh_semana_ativa: true
                    },
                    limit: 1
                });
                
                if (semanasAtivas && semanasAtivas.length > 0) {
                    const semanaAtiva = semanasAtivas[0];
                    console.log('[obterSemanaAtivaUsuario] ✅ Semana ativa encontrada no "d_calendario":', semanaAtiva);
                    
                    // Buscar protocolo do usuário para complementar dados
                    const { data: protocolosUsuario } = await query('usuario_plano_treino', {
                        eq: { 
                            usuario_id: userId,
                            status: 'ativo'
                        },
                        limit: 1
                    });
                    
                    const protocoloUsuario = protocolosUsuario && protocolosUsuario.length > 0 ? protocolosUsuario[0] : null;
                    
                    return {
                        semana_treino: semanaAtiva.semana_treino || 1,
                        protocolo_treinamento_id: protocoloUsuario?.protocolo_treinamento_id || 1,
                        percentual_1rm_calculado: semanaAtiva.percentual_1rm || 75,
                        usuario_id: userId,
                        calendario_id: semanaAtiva.id,
                        eh_semana_ativa: semanaAtiva.eh_semana_ativa,
                        ano: semanaAtiva.ano,
                        semana_ano: semanaAtiva.semana_ano,
                        fonte: 'calendario_direto'
                    };
                }
            } catch (calendarioError) {
                console.log('[obterSemanaAtivaUsuario] Erro no acesso direto ao "d_calendario":', calendarioError.message);
            }
        }
        
        // Método 3: Fallback para usuario_plano_treino (método anterior)
        console.log('[obterSemanaAtivaUsuario] Usando fallback para usuario_plano_treino...');
        const { data: protocolosAtivos } = await query('usuario_plano_treino', {
            eq: { 
                usuario_id: userId,
                status: 'ativo'
            },
            limit: 1
        });
        
        const protocoloAtivo = protocolosAtivos && protocolosAtivos.length > 0 ? protocolosAtivos[0] : null;
        
        if (!protocoloAtivo) {
            console.log('[obterSemanaAtivaUsuario] ❌ Nenhum protocolo ativo encontrado');
            return null;
        }
        
        console.log('[obterSemanaAtivaUsuario] ✅ Fallback - protocolo ativo encontrado:', protocoloAtivo);
        
        // Retornar dados do fallback
        return {
            semana_treino: protocoloAtivo.semana_atual || 1,
            protocolo_treinamento_id: protocoloAtivo.protocolo_treinamento_id,
            percentual_1rm_calculado: 75, // Valor padrão na ausência do calendário
            usuario_id: userId,
            fonte: 'fallback_usuario_plano'
        };
        
    } catch (error) {
        console.error('[obterSemanaAtivaUsuario] ❌ Erro crítico:', error);
        return null;
    }
}

// Carregar status das semanas (para menu) - NOVA VERSÃO COM D_CALENDARIO
export async function carregarStatusSemanas(userId) {
    try {
        console.log('[carregarStatusSemanas] Carregando status para usuário:', userId);
        
        // Verificar se "d_calendario" está disponível
        const calendarioStatus = await verificarDisponibilidadeCalendario();
        
        if (calendarioStatus.disponivel && calendarioStatus.temSemanaAtiva) {
            console.log('[carregarStatusSemanas] Usando "d_calendario" para carregar status');
            return await carregarStatusSemanasComCalendario(userId);
        } else {
            console.warn('[carregarStatusSemanas] d_calendario não disponível ou sem semanas ativas. Retornando lista vazia.');
            return [];
        }
    } catch (error) {
        console.error('[carregarStatusSemanas] Erro:', error);
        return [];
    }
}

// Buscar exercícios do treino do dia atual
export async function buscarExerciciosTreinoDia(userId, diaAtual = null) {
    try {
        console.log('[buscarExerciciosTreinoDia] 🏋️‍♂️ Buscando exercícios do treino do dia para usuário:', userId);
        
        // Se não informado, usar dia atual
        const hoje = diaAtual || new Date();
        const diaSemana = hoje.getDay(); // 0=domingo, 1=segunda, ..., 6=sábado
        
        console.log('[buscarExerciciosTreinoDia] 📅 Dia da semana:', diaSemana);
        
        // 1. Buscar planejamento do dia atual da semana atual
        const ano = hoje.getFullYear();
        const primeiroDiaAno = new Date(ano, 0, 1);
        const diasPassados = Math.floor((hoje - primeiroDiaAno) / (24 * 60 * 60 * 1000));
        const numeroSemana = Math.ceil((diasPassados + primeiroDiaAno.getDay() + 1) / 7);
        
        const { data: planejamento, error: planejamentoError } = await supabase
            .from('planejamento_semanal')
            .select('*')
            .eq('usuario_id', userId)
            .eq('ano', ano)
            .eq('semana', numeroSemana)
            .eq('dia_semana', diaSemana)
            .single();
            
        if (planejamentoError || !planejamento) {
            console.log('[buscarExerciciosTreinoDia] ❌ Nenhum planejamento encontrado para hoje:', planejamentoError?.message);
            return { data: [], error: 'Nenhum treino programado para hoje' };
        }
        
        console.log('[buscarExerciciosTreinoDia] 📋 Planejamento encontrado:', planejamento);
        
        // Se não for dia de treino (folga/cardio), retornar informação
        if (planejamento.tipo_atividade === 'folga') {
            return { data: [], message: 'Dia de descanso 😴' };
        }
        
        if (planejamento.tipo_atividade === 'cardio') {
            return { data: [], message: 'Dia de cardio 🏃‍♂️' };
        }
        
        // 2. Buscar protocolo do usuário E semana atual do calendário
        const [usuarioPlanoResult, calendarioResult] = await Promise.all([
            supabase
                .from('usuario_plano_treino')
                .select('protocolo_treinamento_id, semana_atual')
                .eq('usuario_id', userId)
                .eq('status', 'ativo')
                .single(),
            supabase
                .from('d_calendario')
                .select('semana_treino')
                .eq('data_completa', hoje.toISOString().split('T')[0])
                .single()
        ]);
        
        const { data: usuarioPlano, error: planoError } = usuarioPlanoResult;
        const { data: calendarioHoje, error: calendarioError } = calendarioResult;
            
        if (planoError || !usuarioPlano) {
            console.log('[buscarExerciciosTreinoDia] ❌ Plano do usuário não encontrado:', planoError?.message);
            return { data: [], error: 'Plano de treino não encontrado' };
        }
        
        // Usar semana do calendário como referência (mais precisa)
        const semanaReferencia = calendarioHoje?.semana_treino || usuarioPlano.semana_atual;
        
        console.log('[buscarExerciciosTreinoDia] 🎯 Plano do usuário:', usuarioPlano);
        console.log('[buscarExerciciosTreinoDia] 📅 Semana de referência (calendário):', semanaReferencia);
        
        // 3. Buscar exercícios do protocolo usando semana de referência do calendário
        const { data: protocoloTreinos, error: protocoloError } = await supabase
            .from('protocolo_treinos')
            .select(`
                *,
                exercicios!inner (
                    id,
                    nome,
                    grupo_muscular,
                    equipamento
                )
            `)
            .eq('protocolo_id', usuarioPlano.protocolo_treinamento_id)
            .eq('semana_referencia', semanaReferencia)
            .eq('exercicios.grupo_muscular', planejamento.tipo_atividade)
            .order('ordem_exercicio', { ascending: true });
            
        if (protocoloError || !protocoloTreinos?.length) {
            console.log('[buscarExerciciosTreinoDia] ❌ Protocolo não encontrado:', protocoloError?.message);
            return { data: [], error: 'Protocolo de treino não encontrado' };
        }
        
        console.log('[buscarExerciciosTreinoDia] 📋 Protocolo encontrado:', protocoloTreinos.length, 'exercícios');
        
        // 4. Buscar dados dos exercícios e 1RM separadamente
        const exercicioIds = protocoloTreinos.map(p => p.exercicio_id);
        
        const [exerciciosResponse, rmResponse] = await Promise.all([
            supabase.from('exercicios').select('*').in('id', exercicioIds),
            supabase.from('usuario_1rm').select('*').eq('usuario_id', userId).in('exercicio_id', exercicioIds)
        ]);
        
        if (exerciciosResponse.error) {
            console.error('[buscarExerciciosTreinoDia] ❌ Erro ao buscar exercícios:', exerciciosResponse.error);
            return { data: [], error: 'Erro ao carregar dados dos exercícios' };
        }
        
        const exercicios = exerciciosResponse.data || [];
        const dadosRM = rmResponse.data || [];
        
        console.log('[buscarExerciciosTreinoDia] 🏋️‍♂️ Exercícios encontrados:', exercicios.length);
        console.log('[buscarExerciciosTreinoDia] 💪 Dados de 1RM encontrados:', dadosRM.length);
        
        // 5. Formatar dados dos exercícios com cálculos de peso
        const exerciciosFormatados = protocoloTreinos.map(protocolo => {
            // Encontrar dados do exercício
            const exercicio = exercicios.find(ex => ex.id === protocolo.exercicio_id);
            // Encontrar dados de 1RM
            const dadoRM = dadosRM.find(rm => rm.exercicio_id === protocolo.exercicio_id);
            
            const rmCalculado = dadoRM?.rm_calculado || 0;
            
            return {
                id: protocolo.exercicio_id,
                nome: exercicio?.nome || 'Exercício não encontrado',
                grupo_muscular: exercicio?.grupo_muscular || 'N/A',
                equipamento: exercicio?.equipamento || 'N/A',
                peso_base: Math.round(rmCalculado * (protocolo.percentual_1rm_base / 100) * 100) / 100,
                peso_min: Math.round(rmCalculado * (protocolo.percentual_1rm_min / 100) * 100) / 100,
                peso_max: Math.round(rmCalculado * (protocolo.percentual_1rm_max / 100) * 100) / 100,
                series: protocolo.series,
                repeticoes: protocolo.repeticoes_alvo,
                tempo_descanso: protocolo.tempo_descanso,
                ordem: protocolo.ordem_exercicio,
                rm_calculado: rmCalculado,
                observacoes: protocolo.observacoes
            };
        });
        
        console.log('[buscarExerciciosTreinoDia] ✅ Exercícios formatados:', exerciciosFormatados.length);
        
        return { 
            data: exerciciosFormatados,
            planejamento: {
                tipo_atividade: planejamento.tipo_atividade,
                semana_treino: planejamento.semana_treino
            }
        };
        
    } catch (error) {
        console.error('[buscarExerciciosTreinoDia] ❌ Erro crítico:', error);
        return { data: [], error: 'Erro interno ao buscar exercícios' };
    }
}

// Marcar semana como programada
export async function marcarSemanaProgramada(userId, semanaTreino, usuarioQueProgramou) {
    try {
        console.log(`[marcarSemanaProgramada] Marcando semana ${semanaTreino} como programada para usuário ${userId}`);
        
        // Atualizar registros da semana para marcar como programados
        const { data, error } = await supabase
            .from('planejamento_semanal')
            .update({
                eh_programado: true,
                data_programacao: new Date().toISOString(),
                usuario_que_programou: usuarioQueProgramou
            })
            .eq('usuario_id', userId)
            .eq('semana_treino', semanaTreino)
            .select();
        
        if (error) {
            console.error('[marcarSemanaProgramada] Erro ao atualizar:', error);
            return { success: false, error: error.message };
        }
        
        console.log(`[marcarSemanaProgramada] ✅ Semana ${semanaTreino} marcada como programada:`, data);
        return { success: true, data };
        
    } catch (error) {
        console.error('[marcarSemanaProgramada] Erro crítico:', error);
        return { success: false, error: error.message };
    }
}

// Carregar status usando "d_calendario"
async function carregarStatusSemanasComCalendario(userId) {
    try {
        // Buscar todas as semanas ativas do calendário
        const { data: semanasCalendario } = await query('d_calendario', {
            eq: { eh_semana_ativa: true },
            select: 'id, semana_treino, eh_semana_atual, ano, semana_ano',
            order: { column: 'semana_treino', ascending: true }
        });
        
        if (!semanasCalendario || semanasCalendario.length === 0) {
            console.log('[carregarStatusSemanasComCalendario] Nenhuma semana ativa no calendário');
            return [];
        }
        
        // Buscar planejamentos do usuário
        const { data: planejamentos } = await query('planejamento_semanal', {
            eq: { usuario_id: userId },
            select: 'ano, semana, dia_semana, concluido',
            order: { column: 'ano', ascending: true }
        });
        
        // Mapear status das semanas
        const resultado = semanasCalendario.map(semanaCalendario => {
            // Encontrar planejamentos para esta semana
            const planejamentosSemana = planejamentos?.filter(p => 
                p.ano === semanaCalendario.ano && 
                p.semana === semanaCalendario.semana_ano
            ) || [];
            
            const diasConcluidos = planejamentosSemana.filter(p => p.concluido).length;
            const totalDias = planejamentosSemana.length;
            
            return {
                semana_treino: semanaCalendario.semana_treino,
                semana_programada: totalDias > 0,
                eh_semana_atual: semanaCalendario.eh_semana_atual,
                eh_semana_ativa: true,
                dias_concluidos: diasConcluidos,
                total_dias: totalDias,
                ano: semanaCalendario.ano,
                semana: semanaCalendario.semana_ano,
                calendario_id: semanaCalendario.id,
                fonte: 'calendario'
            };
        });
        
        console.log('[carregarStatusSemanasComCalendario] Status calculado:', resultado);
        return resultado;
        
    } catch (error) {
        console.error('[carregarStatusSemanasComCalendario] Erro:', error);
        return [];
    }
}

// Carregar status usando método tradicional
async function carregarStatusSemanasTradicionais(userId) {
    try {
        // Buscar protocolo ativo para saber quantas semanas existem
        const { fetchProtocoloAtivoUsuario } = await import('./userService.js');
        const protocoloAtivo = await fetchProtocoloAtivoUsuario(userId);
        if (!protocoloAtivo) {
            console.log('[carregarStatusSemanasTradicionais] Nenhum protocolo ativo');
            return [];
        }
        
        // Buscar planejamentos existentes
        const { data: planejamentos } = await query('planejamento_semanal', {
            eq: { usuario_id: userId },
            select: 'ano, semana, dia_semana, concluido',
            order: { column: 'ano', ascending: true }
        });
        
        // Agrupar por semana e calcular status
        const semanas = {};
        const { ano: anoAtual, semana: semanaAtual } = WeeklyPlanService.getCurrentWeek();
        
        if (planejamentos) {
            planejamentos.forEach(p => {
                const chave = `${p.ano}_${p.semana}`;
                if (!semanas[chave]) {
                    semanas[chave] = {
                        ano: p.ano,
                        semana: p.semana,
                        semana_treino: protocoloAtivo.semana_atual || 1,
                        semana_programada: true,
                        eh_semana_atual: p.ano === anoAtual && p.semana === semanaAtual,
                        dias_concluidos: 0,
                        total_dias: 0,
                        fonte: 'tradicional'
                    };
                }
                semanas[chave].total_dias++;
                if (p.concluido) {
                    semanas[chave].dias_concluidos++;
                }
            });
        }
        
        const resultado = Object.values(semanas);
        console.log('[carregarStatusSemanasTradicionais] Status calculado:', resultado);
        
        return resultado;
    } catch (error) {
        console.error('[carregarStatusSemanasTradicionais] Erro:', error);
        return [];
    }
}

// ... (restante do código)

// Função de teste para verificar integração com "d_calendario"
export async function testarIntegracaoCalendario(userId = null) {
    console.log('🧪 [testarIntegracaoCalendario] INICIANDO TESTE DE INTEGRAÇÃO');
    
    try {
        // 1. Verificar disponibilidade do calendário
        console.log('1️⃣ Verificando disponibilidade do "d_calendario"...');
        const statusCalendario = await verificarDisponibilidadeCalendario();
        console.log('Status do calendário:', statusCalendario);
        
        // 2. Testar obtenção de semana ativa
        if (userId) {
            console.log(`2️⃣ Testando obtenção de semana ativa para usuário ${userId}...`);
            const semanaAtiva = await obterSemanaAtivaUsuario(userId);
            console.log('Semana ativa:', semanaAtiva);
            
            // 3. Testar verificação de programação
            console.log('3️⃣ Testando verificação de semana programada...');
            const jaProgramada = await verificarSemanaJaProgramada(userId);
            console.log('Já programada:', jaProgramada);
            
            // 4. Testar carregamento de status
            console.log('4️⃣ Testando carregamento de status das semanas...');
            const statusSemanas = await carregarStatusSemanas(userId);
            console.log('Status das semanas:', statusSemanas);
        }
        
        const resultado = {
            calendarioDisponivel: statusCalendario.disponivel,
            calendarioPopulado: statusCalendario.populado,
            temSemanaAtiva: statusCalendario.temSemanaAtiva,
            testeUsuario: !!userId,
            timestamp: new Date().toISOString()
        };
        
        console.log('🎉 [testarIntegracaoCalendario] TESTE CONCLUÍDO:', resultado);
        
        if (window.showNotification) {
            const mensagem = statusCalendario.disponivel ? 
                '✅ "d_calendario" disponível e funcional!' : 
                '⚠️ "d_calendario" não disponível, usando fallback';
            window.showNotification(mensagem, statusCalendario.disponivel ? 'success' : 'warning');
        }
        
        return resultado;
        
    } catch (error) {
        console.error('❌ [testarIntegracaoCalendario] ERRO:', error);
        
        if (window.showNotification) {
            window.showNotification('❌ Erro no teste: ' + error.message, 'error');
        }
        
        return { success: false, error: error.message };
    }
}

// Limpar cache de verificação do calendário (útil quando tabela é criada depois)
export function limparCacheCalendario() {
    if (obterSemanaAtivaUsuario._calendarioStatus) {
        delete obterSemanaAtivaUsuario._calendarioStatus;
        console.log('[limparCacheCalendario] Cache do calendário limpo');
    }
    if (carregarStatusSemanas._calendarioStatus) {
        delete carregarStatusSemanas._calendarioStatus;
        console.log('[limparCacheCalendario] Cache de status das semanas limpo');
    }
}

// Função para diagnóstico completo do sistema
export async function diagnosticoCompletoSistema(userId = null) {
    console.log('🏥 [diagnosticoCompletoSistema] INICIANDO DIAGNÓSTICO COMPLETO');
    
    try {
        const diagnostico = {
            timestamp: new Date().toISOString(),
            usuario: null,
            calendario: null,
            planejamento: null,
            recomendacoes: []
        };
        
        // 1. Verificar usuário
        if (userId) {
            const currentUser = window.AppState?.get('currentUser');
            diagnostico.usuario = {
                fornecido: userId,
                appState: currentUser?.id,
                valido: !!(userId && currentUser)
            };
        }
        
        // 2. Verificar calendário
        diagnostico.calendario = await verificarDisponibilidadeCalendario();
        
        // 3. Testar planejamento se usuário disponível
        if (userId) {
            try {
                const semanaAtiva = await obterSemanaAtivaUsuario(userId);
                const jaProgramada = await verificarSemanaJaProgramada(userId);
                const statusSemanas = await carregarStatusSemanas(userId);
                
                diagnostico.planejamento = {
                    semanaAtiva: !!semanaAtiva,
                    fonte: semanaAtiva?.fonte,
                    jaProgramada,
                    totalSemanas: statusSemanas?.length || 0,
                    semanasComPlanejamento: statusSemanas?.filter(s => s.semana_programada).length || 0
                };
            } catch (error) {
                diagnostico.planejamento = { erro: error.message };
            }
        }
        
        // 4. Gerar recomendações baseadas no status real
        if (!diagnostico.calendario.disponivel) {
            if (diagnostico.calendario.codigo === '404_NOT_FOUND') {
                diagnostico.recomendacoes.push('CRÍTICO: Tabela "d_calendario" não existe. Execute os scripts SQL para criá-la');
                diagnostico.recomendacoes.push('Sistema funcionando apenas com fallback (usuario_plano_treino)');
            } else {
                diagnostico.recomendacoes.push('Configure e popule a tabela "d_calendario" para melhor controle');
            }
        } else {
            if (diagnostico.calendario.populado && !diagnostico.calendario.temSemanaAtiva) {
                diagnostico.recomendacoes.push('Defina uma semana como ativa no "d_calendario" (eh_semana_atual=true)');
            }
            if (!diagnostico.calendario.populado) {
                diagnostico.recomendacoes.push('Execute a função popular_d_calendario() para popular com dados');
            }
        }
        
        if (!userId) {
            diagnostico.recomendacoes.push('Forneça um userId para testes completos de planejamento');
        } else if (diagnostico.planejamento?.erro) {
            diagnostico.recomendacoes.push('Verifique se o usuário tem protocolo ativo configurado');
        }
        
        console.log('🎯 [diagnosticoCompletoSistema] DIAGNÓSTICO COMPLETO:', diagnostico);
        
        return diagnostico;
        
    } catch (error) {
        console.error('❌ [diagnosticoCompletoSistema] ERRO:', error);
        return { success: false, error: error.message };
    }
}

// Função de teste específica para verificar erros 406
export async function testarCorrecoesErro406(userId = null) {
    console.log('🔧 [testarCorrecoesErro406] TESTANDO CORREÇÕES DE ERRO 406');
    
    try {
        const testes = {
            timestamp: new Date().toISOString(),
            usuario: userId,
            resultados: {}
        };
        
        // Teste 1: obterSemanaAtivaUsuario
        console.log('1️⃣ Testando obterSemanaAtivaUsuario...');
        try {
            const semanaAtiva = userId ? await obterSemanaAtivaUsuario(userId) : null;
            testes.resultados.obterSemanaAtivaUsuario = {
                sucesso: true,
                dados: !!semanaAtiva,
                fonte: semanaAtiva?.fonte
            };
            console.log('✅ obterSemanaAtivaUsuario passou');
        } catch (error) {
            testes.resultados.obterSemanaAtivaUsuario = {
                sucesso: false,
                erro: error.message
            };
            console.log('❌ obterSemanaAtivaUsuario falhou:', error.message);
        }
        
        // Teste 2: verificarSemanaJaProgramada  
        console.log('2️⃣ Testando verificarSemanaJaProgramada...');
        try {
            const jaProgramada = userId ? await verificarSemanaJaProgramada(userId, 1) : false;
            testes.resultados.verificarSemanaJaProgramada = {
                sucesso: true,
                programada: jaProgramada
            };
            console.log('✅ verificarSemanaJaProgramada passou');
        } catch (error) {
            testes.resultados.verificarSemanaJaProgramada = {
                sucesso: false,
                erro: error.message
            };
            console.log('❌ verificarSemanaJaProgramada falhou:', error.message);
        }
        
        // Teste 3: WeeklyPlanService.getTodaysWorkout
        console.log('3️⃣ Testando getTodaysWorkout...');
        try {
            const treinoHoje = userId ? await WeeklyPlanService.getTodaysWorkout(userId) : null;
            testes.resultados.getTodaysWorkout = {
                sucesso: true,
                temTreino: !!treinoHoje
            };
            console.log('✅ getTodaysWorkout passou');
        } catch (error) {
            testes.resultados.getTodaysWorkout = {
                sucesso: false,
                erro: error.message
            };
            console.log('❌ getTodaysWorkout falhou:', error.message);
        }
        
        // Teste 4: carregarStatusSemanas
        console.log('4️⃣ Testando carregarStatusSemanas...');
        try {
            const status = userId ? await carregarStatusSemanas(userId) : [];
            testes.resultados.carregarStatusSemanas = {
                sucesso: true,
                quantidade: status.length
            };
            console.log('✅ carregarStatusSemanas passou');
        } catch (error) {
            testes.resultados.carregarStatusSemanas = {
                sucesso: false,
                erro: error.message
            };
            console.log('❌ carregarStatusSemanas falhou:', error.message);
        }
        
        // Resumo
        const totalTestes = Object.keys(testes.resultados).length;
        const testesComSucesso = Object.values(testes.resultados).filter(r => r.sucesso).length;
        
        testes.resumo = {
            total: totalTestes,
            sucessos: testesComSucesso,
            falhas: totalTestes - testesComSucesso,
            percentualSucesso: Math.round((testesComSucesso / totalTestes) * 100)
        };
        
        console.log('🎯 [testarCorrecoesErro406] RESUMO:', testes.resumo);
        
        if (window.showNotification) {
            const mensagem = testesComSucesso === totalTestes ? 
                `✅ Todos os ${totalTestes} testes passaram! Erros 406 corrigidos` :
                `⚠️ ${testesComSucesso}/${totalTestes} testes passaram`;
            window.showNotification(mensagem, testesComSucesso === totalTestes ? 'success' : 'warning');
        }
        
        return testes;
        
    } catch (error) {
        console.error('❌ [testarCorrecoesErro406] ERRO CRÍTICO:', error);
        
        if (window.showNotification) {
            window.showNotification('❌ Erro crítico no teste: ' + error.message, 'error');
        }
        
        return { success: false, error: error.message };
    }
}

// Verificar se treino de hoje está concluído (com verificação de exercícios executados)
export async function verificarTreinoConcluido(userId) {
    try {
        console.log('[verificarTreinoConcluido] 🔍 Verificando conclusão do treino de hoje para usuário:', userId);
        
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const semana = getWeekNumber(hoje);
        const diaSemana = hoje.getDay();
        const dataHoje = hoje.toISOString().split('T')[0]; // YYYY-MM-DD
        
        // 1. Buscar planejamento de hoje no banco
        const { data: planejamentoHoje, error } = await query('planejamento_semanal', {
            select: 'concluido, data_conclusao, tipo_atividade',
            eq: {
                usuario_id: userId,
                ano: ano,
                semana: semana,
                dia_semana: diaSemana
            },
            single: true
        });
        
        if (error) {
            console.warn('[verificarTreinoConcluido] ⚠️ Erro ao buscar planejamento:', error.message);
            return { concluido: false, erro: error.message };
        }
        
        if (!planejamentoHoje) {
            console.log('[verificarTreinoConcluido] ⚠️ Nenhum planejamento encontrado para hoje');
            return { concluido: false, semPlanejamento: true };
        }
        
        // 2. NOVA LÓGICA SIMPLIFICADA: Verificar apenas execuções de hoje
        // Primeiro buscar dados do calendário de hoje
        const { data: calendarioHoje, error: calError } = await query('d_calendario', {
            select: 'id, eh_semana_atual, data_completa',
            eq: { data_completa: dataHoje },
            single: true
        });
        
        if (calError) {
            console.warn('[verificarTreinoConcluido] ⚠️ Erro ao buscar calendário:', calError.message);
        }
        
        console.log('[verificarTreinoConcluido] 📅 Calendário de hoje:', {
            calendarioHoje,
            dataHoje,
            ehSemanaAtual: calendarioHoje?.eh_semana_atual
        });
        
        // CORREÇÃO: Verificar conclusão baseado apenas em execuções, não em semana_atual
        // A lógica anterior estava incorreta - deve verificar execuções independente da semana_atual
        console.log('[verificarTreinoConcluido] 📅 Dados do calendário:', {
            calendarioHoje,
            ehSemanaAtual: calendarioHoje?.eh_semana_atual,
            observacao: 'Verificando execuções independente de eh_semana_atual'
        });
        
        // Buscar execuções apenas de hoje
        const { data: execucoesHoje, error: execError } = await query('execucao_exercicio_usuario', {
            select: 'id, exercicio_id, serie_numero, data_execucao',
            eq: { usuario_id: userId },
            gte: { data_execucao: `${dataHoje}T00:00:00.000Z` },
            lt: { data_execucao: `${dataHoje}T23:59:59.999Z` }
        });
        
        if (execError) {
            console.warn('[verificarTreinoConcluido] ⚠️ Erro ao buscar execuções:', execError.message);
        }
        
        // Filtrar execuções de hoje manualmente para ter certeza
        const execucoesRealmenteHoje = execucoesHoje?.filter(exec => {
            const dataExec = new Date(exec.data_execucao).toISOString().split('T')[0];
            return dataExec === dataHoje;
        }) || [];
        
        const totalExecucoesHoje = execucoesRealmenteHoje.length;
        const exerciciosUnicosHoje = new Set(execucoesRealmenteHoje.map(e => e.exercicio_id)).size;
        const temExecucoesHoje = totalExecucoesHoje > 0;
        
        console.log('[verificarTreinoConcluido] 📊 ANÁLISE DETALHADA DE EXECUÇÕES:', {
            totalTodasExecucoes: execucoesHoje?.length || 0,
            totalExecucoesHoje: totalExecucoesHoje,
            exerciciosUnicosHoje: exerciciosUnicosHoje,
            temExecucoesHoje: temExecucoesHoje,
            dataConsultada: dataHoje,
            primeiraExecucao: execucoesHoje?.[0]?.data_execucao,
            primeiraExecucaoHoje: execucoesRealmenteHoje?.[0]?.data_execucao,
            ehSemanaAtual: calendarioHoje?.eh_semana_atual
        });
        
        // 3. CRITÉRIO FINAL CORRIGIDO: Apenas execuções realmente de hoje (removendo dependência de eh_semana_atual)
        const concluido = temExecucoesHoje;
        
        console.log('[verificarTreinoConcluido] 🚨 DECISÃO FINAL:', {
            temExecucoesHoje,
            ehSemanaAtual: calendarioHoje?.eh_semana_atual,
            resultadoFinal: concluido,
            logica: 'CORRIGIDA_apenas_execucoes_hoje'
        });
        
        const resultado = {
            concluido: concluido,
            data_conclusao: planejamentoHoje.data_conclusao,
            tipo_atividade: planejamentoHoje.tipo_atividade,
            temPlanejamento: true,
            // Dados da nova lógica baseada em execuções reais
            totalExecucoesHoje: totalExecucoesHoje,
            exerciciosUnicosHoje: exerciciosUnicosHoje,
            ehSemanaAtual: calendarioHoje?.eh_semana_atual,
            flagBancoAntigo: planejamentoHoje.concluido || false,
            criterioUtilizado: 'execucoes_hoje_E_semana_atual'
        };
        
        console.log('[verificarTreinoConcluido] ✅ Status do treino de hoje:', resultado);
        return resultado;
        
    } catch (error) {
        console.error('[verificarTreinoConcluido] ❌ Erro:', error);
        return { concluido: false, erro: error.message };
    }
}

// Resetar treino de hoje (para casos de refazer/corrigir)
export async function resetarTreinoHoje(userId, motivoReset = 'Reset manual') {
    try {
        console.log('[resetarTreinoHoje] 🔄 Resetando treino de hoje para usuário:', userId);
        
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const semana = getWeekNumber(hoje);
        const diaSemana = hoje.getDay();
        const dataHoje = hoje.toISOString().split('T')[0];
        
        // 1. Resetar flag concluido no planejamento
        const { data: resetPlan, error: planError } = await update('planejamento_semanal', 
            {
                concluido: false,
                data_conclusao: null
            },
            {
                usuario_id: userId,
                ano: ano,
                semana: semana,
                dia_semana: diaSemana
            }
        );
        
        if (planError) {
            throw new Error(`Erro ao resetar planejamento: ${planError.message}`);
        }
        
        // 2. OPCIONAL: Remover execuções de hoje (comentado para preservar histórico)
        // const { data: removeExec, error: execError } = await query('execucao_exercicio_usuario', {
        //     delete: true,
        //     eq: { usuario_id: userId },
        //     gte: { data_execucao: `${dataHoje}T00:00:00.000Z` },
        //     lt: { data_execucao: `${dataHoje}T23:59:59.999Z` }
        // });
        
        console.log('[resetarTreinoHoje] ✅ Treino resetado com sucesso');
        return { 
            sucesso: true, 
            mensagem: 'Treino resetado. Você pode iniciar novamente.',
            motivoReset: motivoReset
        };
        
    } catch (error) {
        console.error('[resetarTreinoHoje] ❌ Erro ao resetar treino:', error);
        return { 
            sucesso: false, 
            erro: error.message 
        };
    }
}

// Disponibilizar funções globalmente para debug
if (typeof window !== 'undefined') {
    window.testarIntegracaoCalendario = testarIntegracaoCalendario;
    window.diagnosticoCompletoSistema = diagnosticoCompletoSistema;
    window.verificarDisponibilidadeCalendario = verificarDisponibilidadeCalendario;
    window.testarCorrecoesErro406 = testarCorrecoesErro406;
    window.limparCacheCalendario = limparCacheCalendario;
}

// Exportação principal do serviço (browser global)
if (typeof window !== 'undefined') {
    window.WeeklyPlanService = WeeklyPlanService;
    window.WeeklyPlanService.obterSemanaAtivaUsuario = obterSemanaAtivaUsuario;
    window.WeeklyPlanService.verificarSemanaJaProgramada = verificarSemanaJaProgramada;
    window.WeeklyPlanService.buscarExerciciosTreinoDia = buscarExerciciosTreinoDia;
    window.WeeklyPlanService.verificarTreinoConcluido = verificarTreinoConcluido;
    window.WeeklyPlanService.resetarTreinoHoje = resetarTreinoHoje;
    // Adicione aqui outras funções utilitárias exportadas que precisar acessar globalmente
}
// Export default do serviço
export default WeeklyPlanService;
