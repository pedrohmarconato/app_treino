/**
 * 📅 SERVIÇO DE PLANEJAMENTO SEMANAL - Weekly Planning Service
 * 
 * FUNÇÃO: Gerenciar criação, edição e acompanhamento do planejamento semanal de treinos.
 * 
 * RESPONSABILIDADES:
 * - Criar planos semanais personalizados (A, B, C, D, Folga, Cardio)
 * - Carregar e salvar configurações semanais do usuário
 * - Calcular progresso semanal (dias completados, próximos treinos)
 * - Integrar com calendario para exibição visual
 * - Detectar e atualizar semana ativa baseada na data atual
 * - Gerenciar transições entre semanas de protocolo
 * - Validar consistência do plano (não pode ter mais que X treinos por semana)
 * 
 * ESTRUTURA DO PLANO:
 * - domingo: "folga" | "A" | "B" | "C" | "D" | "cardio"
 * - segunda: "folga" | "A" | "B" | "C" | "D" | "cardio"
 * - ...para cada dia da semana
 * 
 * DADOS GERENCIADOS:
 * - planejamento_semanal: Configuração de cada usuário
 * - semana_ativa: Qual semana do protocolo está em execução
 * - status_conclusao: Quais dias foram completados
 * 
 * VALIDAÇÕES: Consistência de protocolo, limites de carga, progressão adequada
 */

import { query, insert, update, supabase } from './supabaseService.js';
import { nowInSaoPaulo, toSaoPauloDateString } from '../utils/timezoneUtils.js';
import { CalendarioService } from './calendarioService.js';

// Verifica se a semana já está programada para o usuário e semana_treino
function verificarSemanaJaProgramada(userId, semanaTreino) {
    return query('planejamento_semanal', {
        eq: { usuario_id: userId, semana_treino: semanaTreino }
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
    // Converter dia JS (0-6) para dia DB (1-7) - CORRIGIDO
    static dayToDb(jsDay) {
        // Validar entrada
        if (jsDay === null || jsDay === undefined || isNaN(jsDay)) {
            console.error('[dayToDb] Valor inválido recebido:', jsDay);
            return 7; // Default para domingo (7 no DB)
        }
        const numDay = parseInt(jsDay);
        if (numDay < 0 || numDay > 6) {
            console.error('[dayToDb] Dia fora do range 0-6:', numDay);
            return 7; // Default para domingo (7 no DB)
        }
        
        // JS usa 0-6 (Domingo=0, Segunda=1)
        // DB usa 1-7 (Segunda=1, Domingo=7)
        if (numDay === 0) return 7; // Domingo: 0 → 7
        return numDay; // Segunda-Sábado: 1-6 → 1-6
    }

    // Converter dia DB (1-7) para dia JS (0-6) - CORRIGIDO
    static dbToDay(dbDay) {
        // DB usa 1-7 (Segunda=1, Domingo=7)
        // JS usa 0-6 (Domingo=0, Segunda=1)
        if (dbDay === 7) return 0; // Domingo: 7 → 0
        return dbDay; // Segunda-Sábado: 1-6 → 1-6
    }
    
    // Helpers de data
    static getCurrentWeek() {
        const now = new Date();
        return {
            ano: now.getFullYear(),
            semana: this.getWeekNumber(now)
        };
    }
    
    // Calcular número da semana do ano (domingo = 0, sábado = 6)
    static getWeekNumber(date) {
        // Semana começa no domingo (0)
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    }

    // ==================== OPERAÇÕES PRINCIPAIS ====================
    
    // Salvar plano completo - REFATORADO PARA USAR SEMANA DO PROTOCOLO
    static async savePlan(userId, plan) {
        const ano = new Date().getFullYear();
        const semana = this.getWeekNumber(new Date()); // Semana do ANO (calendário)
        let semana_treino = 1; // Semana do PROTOCOLO
        
        try {
            const { data: protocolosAtivos } = await query('usuario_plano_treino', {
                eq: { 
                    usuario_id: userId,
                    status: 'ativo'
                },
                limit: 1
            });
            
            if (protocolosAtivos && protocolosAtivos.length > 0) {
                semana_treino = protocolosAtivos[0].semana_atual || 1;
                console.log('[WeeklyPlanService.savePlan] 📅 Salvando com semana ANO:', semana, '| Semana PROTOCOLO:', semana_treino);
            } else {
                console.warn('[WeeklyPlanService.savePlan] ⚠️ Protocolo não encontrado, usando semana_treino = 1');
            }
        } catch (error) {
            console.error('[WeeklyPlanService.savePlan] ❌ Erro ao buscar protocolo:', error);
        }
        
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
                    semana, // Semana do ANO
                    semana_treino, // Semana do PROTOCOLO
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
            
            // Nova regra: Se é domingo e planejou a próxima semana, atualizar semana_atual
            const hoje = new Date();
            if (hoje.getDay() === 0 && semana_treino > (protocoloAtivo.semana_atual || 1)) {
                console.log('[WeeklyPlanService.savePlan] 🔄 Domingo com planejamento futuro detectado');
                try {
                    const { WorkoutProtocolService } = await import('./workoutProtocolService.js');
                    await WorkoutProtocolService.verificarEAtualizarSemanaPorPlanejamento(userId);
                } catch (err) {
                    console.error('[WeeklyPlanService.savePlan] Erro ao verificar planejamento futuro:', err);
                }
            }
            
            console.log('[WeeklyPlanService.savePlan] 🎉 SALVAMENTO COMPLETAMENTE FINALIZADO!');
            return { success: true, data };
            
        } catch (error) {
            console.error('[WeeklyPlanService] Erro ao salvar:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Buscar plano atual com fallback robusto
    static async getPlan(userId, useCache = true, ano = null, semana = null) {
        console.log('[WeeklyPlanService.getPlan] 🔍 INICIANDO busca do plano para usuário:', userId);
        
        if (!userId) {
            console.error('[WeeklyPlanService.getPlan] ❌ userId é obrigatório');
            return null;
        }
        
        // Se não especificado, usar semana do PROTOCOLO
        if (!ano || !semana) {
            // Buscar semana do protocolo do usuário
            const semanaAtiva = await obterSemanaAtivaUsuario(userId);
            if (semanaAtiva && semanaAtiva.semana_treino) {
                semana = semanaAtiva.semana_treino;
                console.log('[WeeklyPlanService.getPlan] 📅 Usando semana do PROTOCOLO:', semana);
            } else {
                // Fallback para semana do ano se não houver protocolo ativo
                const current = this.getCurrentWeek();
                ano = current.ano;
                semana = current.semana;
                console.log('[WeeklyPlanService.getPlan] ⚠️ Sem protocolo ativo, usando semana do ANO como fallback:', { ano, semana });
            }
            
            if (!ano) {
                ano = new Date().getFullYear();
            }
        }
        
        console.log('[WeeklyPlanService.getPlan] 📅 Buscando plano para semana_treino:', { ano, semana });
        
        // 1. Tentar cache local primeiro (se habilitado)
        const cacheKey = `${userId}-${ano}-${semana}`;
        if (useCache) {
            const cached = this.getFromLocal(cacheKey);
            if (cached) {
                console.log('[WeeklyPlanService.getPlan] ✅ Dados do cache:', cached);
                return cached;
            }
        }
        
        try {
            // 2. Buscar dados da tabela planejamento_semanal usando semana_treino
            console.log('[WeeklyPlanService.getPlan] 🔄 Buscando dados do planejamento_semanal usando semana_treino...');
            const { data, error } = await supabase
                .from('planejamento_semanal')
                .select('*')
                .eq('usuario_id', userId)
                .eq('ano', ano)
                .eq('semana_treino', semana)  // MUDANÇA: usar semana_treino ao invés de semana
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
                const tipoAtividade = dia.tipo_atividade || dia.tipo;
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
            this.saveToLocal(cacheKey, plan);
            console.log('[WeeklyPlanService.getPlan] ✅ Plano carregado com sucesso:', plan);
            
            return plan;
            
        } catch (error) {
            console.error('[WeeklyPlanService.getPlan] ❌ ERRO CRÍTICO:', error);
            // Fallback para cache em caso de erro
            const cachedPlan = this.getFromLocal(cacheKey);
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
            
            // 1. Verificar se a view v_status_semanas_usuario está disponível
            let status = null;
            let error = null;
            try {
                const { data, error: viewErr } = await query('v_status_semanas_usuario', {
                    eq: {
                        usuario_id: userId,
                        eh_semana_atual: true
                    }
                });
                if (viewErr) {
                    throw viewErr;
                }
                status = data;
            } catch (viewError) {
                // A view pode estar desativada temporariamente – seguir com fallback
                console.warn('[needsPlanning] View v_status_semanas_usuario indisponível, usando fallback:', viewError?.message || viewError);
                error = viewError;
            }
            
            if (error) {
                console.warn('[needsPlanning] View indisponível - usando fallback:', error);
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
                    data_conclusao: nowInSaoPaulo()
                    // semana_treino já foi gravada no momento do planejamento
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
    
    // Helpers localStorage - CORRIGIDO para usar semana específica
    static getLocalKey(userId, ano = null, semana = null) {
        if (!ano || !semana) {
            const current = this.getCurrentWeek();
            ano = current.ano;
            semana = current.semana;
        }
        return `weekPlan_${userId}_${ano}_${semana}`;
    }
    
    static saveToLocal(cacheKey, plan) {
        try {
            localStorage.setItem(cacheKey, JSON.stringify(plan));
        } catch (e) {
            console.warn('[WeeklyPlanService] Erro ao salvar cache:', e);
        }
    }
    
    static getFromLocal(cacheKey) {
        try {
            const data = localStorage.getItem(cacheKey);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    }
    
    static clearLocal(userId, ano = null, semana = null) {
        try {
            const key = this.getLocalKey(userId, ano, semana);
            localStorage.removeItem(key);
        } catch (e) {}
    }
    
    // Limpar todo o cache
    static clearCache() {
        try {
            // Remover itens que começam com 'weeklyPlan_'
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const key = localStorage.key(i);
                if (key && key.startsWith('weeklyPlan_')) {
                    localStorage.removeItem(key);
                }
            }
            console.log('[WeeklyPlanService] Cache limpo');
        } catch (e) {
            console.warn('[WeeklyPlanService] Erro ao limpar cache:', e);
        }
    }

    // ==================== FUNCIONALIDADES AVANÇADAS ====================
    
    // Buscar treino do dia com fallback robusto - CORRIGIDO PARA USAR SEMANA DO PROTOCOLO
    static async getTodaysWorkout(userId) {
        if (!userId) {
            console.error('[getTodaysWorkout] ❌ userId é obrigatório');
            return null;
        }
        
        // MUDANÇA: Obter semana do protocolo em vez da semana do calendário
        const { data: protocolosAtivos } = await query('usuario_plano_treino', {
            eq: { 
                usuario_id: userId,
                status: 'ativo'
            },
            limit: 1
        });
        
        if (!protocolosAtivos || protocolosAtivos.length === 0) {
            console.error('[getTodaysWorkout] ❌ Usuário sem protocolo ativo');
            return null;
        }
        
        const hoje = new Date().getDay(); // 0 = domingo, 1 = segunda, etc.
        const diaDb = this.dayToDb(hoje); // Converter para formato DB
        
        console.log('[getTodaysWorkout] 🔄 NOVA LÓGICA: Buscando treino da semana do protocolo:', { userId, hoje: diaDb });
        
        try {
            // 1. Buscar dados do planejamento_semanal diretamente
            const { data, error } = await supabase
                .from('planejamento_semanal')
                .select('*')
                .eq('usuario_id', userId)
                .eq('ano', new Date().getFullYear())
                .eq('semana_treino', protocolosAtivos[0].semana_atual || 1)
                .eq('dia_semana', diaDb)
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
            const tipoAtividade = planoDoDia.tipo_atividade || planoDoDia.tipo;
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

// Função para calcular percentual 1RM baseado na semana de progressão
function calcularPercentual1rmPorSemana(semana) {
    // Progressão típica de 12 semanas: começa em 60% e vai até 90%
    const progressao = {
        1: 60,  // Semana de adaptação
        2: 65,  
        3: 70,  
        4: 72,  
        5: 75,  
        6: 77,  
        7: 80,  
        8: 82,  
        9: 85,  
        10: 87,
        11: 90,
        12: 90  // Semana de teste/pico
    };
    
    return progressao[semana] || 70; // Default 70% se semana inválida
}

// Função para obter número da semana no ano
function getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// Obter semana ativa do usuário - VERSÃO REFATORADA BASEADA EM PROGRESSÃO INDIVIDUAL
export async function obterSemanaAtivaUsuario(userId) {
    try {
        console.log('[obterSemanaAtivaUsuario] Buscando semana ativa para usuário:', userId);
        
        // CORREÇÃO AUTOMÁTICA: Garantir que eh_semana_atual está correto
        console.log('[obterSemanaAtivaUsuario] 🔧 Verificando e corrigindo semana atual...');
        try {
            const resultado = await CalendarioService.manterSemanaAtualizada();
            if (!resultado.success && resultado.reason === 'network_error') {
                console.warn('[obterSemanaAtivaUsuario] 🌐 Erro de rede no calendário, continuando com dados em cache...');
                // Continuar execução mesmo com erro de rede
            }
        } catch (error) {
            console.error('[obterSemanaAtivaUsuario] ❌ Erro ao atualizar calendário:', error);
            // Continuar execução mesmo com erro
        }
        
        // NOVO MÉTODO: Usar apenas a progressão individual do usuário
        console.log('[obterSemanaAtivaUsuario] 📊 Buscando protocolo ativo do usuário...');
        const { data: protocolosAtivos } = await query('usuario_plano_treino', {
            eq: { 
                usuario_id: userId,
                status: 'ativo'
            },
            limit: 1
        });
        
        const protocoloAtivo = protocolosAtivos && protocolosAtivos.length > 0 ? protocolosAtivos[0] : null;
        
        if (!protocoloAtivo) {
            console.log('[obterSemanaAtivaUsuario] ❌ Nenhum protocolo ativo encontrado para usuário:', userId);
            return null;
        }
        
        console.log('[obterSemanaAtivaUsuario] ✅ Protocolo ativo encontrado:', protocoloAtivo);
        
        // Calcular percentual 1RM baseado na semana do usuário
        const semanaUsuario = protocoloAtivo.semana_atual || 1;
        const percentual1rm = calcularPercentual1rmPorSemana(semanaUsuario);
        
        console.log('[obterSemanaAtivaUsuario] 💪 Dados da semana ativa:', {
            semanaUsuario,
            percentual1rm,
            protocoloId: protocoloAtivo.protocolo_treinamento_id
        });
        
        // Buscar dados da data atual no calendário (apenas para informações de data)
        let dadosCalendario = null;
        try {
            const { data: calendarioAtual } = await query('d_calendario', {
                eq: { eh_semana_atual: true },
                limit: 1
            });
            
            if (calendarioAtual && calendarioAtual.length > 0) {
                dadosCalendario = calendarioAtual[0];
                console.log('[obterSemanaAtivaUsuario] 📅 Dados do calendário atual:', dadosCalendario);
            }
        } catch (calendarioError) {
            console.log('[obterSemanaAtivaUsuario] ⚠️ Não foi possível obter dados do calendário:', calendarioError.message);
        }
        
        // Retornar dados baseados na progressão individual do usuário
        return {
            semana_treino: semanaUsuario, // MUDANÇA: Usar semana individual do usuário
            protocolo_treinamento_id: protocoloAtivo.protocolo_treinamento_id,
            percentual_1rm_calculado: percentual1rm,
            usuario_id: userId,
            data_inicio_protocolo: protocoloAtivo.data_inicio,
            calendario_id: dadosCalendario?.id || null,
            ano: dadosCalendario?.ano || new Date().getFullYear(),
            semana_ano: dadosCalendario?.semana_ano || getWeekNumber(new Date()),
            eh_semana_ativa: true, // Sempre ativa para progressão individual
            fonte: 'progressao_individual'
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
export async function buscarExerciciosTreinoDia(userId, diaAtual = null, semanaOverride = null) {
    try {
        console.log('[buscarExerciciosTreinoDia] 🏋️‍♂️ Buscando exercícios do treino do dia para usuário:', userId, 'semanaOverride:', semanaOverride);
        
        // Se não informado, usar dia atual
        const hoje = diaAtual || new Date();
        const diaSemana = WeeklyPlanService.dayToDb(hoje.getDay()); // Converter para formato DB
        
        console.log('[buscarExerciciosTreinoDia] 📅 Dia da semana (DB):', diaSemana);
        console.log('[buscarExerciciosTreinoDia] 📅 Data de hoje:', hoje.toISOString());
        console.log('[buscarExerciciosTreinoDia] 📅 Dia JS:', hoje.getDay(), '(0=Dom, 1=Seg...)');
        
        // 1. CORRIGIDO: Buscar planejamento usando semana do protocolo do usuário
        const ano = hoje.getFullYear();
        
        // Usar semana override se fornecida, senão usar semana do protocolo
        let numeroSemana;
        if (semanaOverride !== null) {
            numeroSemana = semanaOverride;
            console.log('[buscarExerciciosTreinoDia] 🔄 Usando semana override:', numeroSemana);
        } else {
            // Obter semana do protocolo do usuário em vez da semana do calendário
            const semanaAtiva = await obterSemanaAtivaUsuario(userId);
            if (!semanaAtiva) {
                console.log('[buscarExerciciosTreinoDia] ❌ Não foi possível obter semana ativa do usuário');
                return { data: [], error: 'Usuário sem protocolo ativo' };
            }
            numeroSemana = semanaAtiva.semana_treino;
        }
        console.log('[buscarExerciciosTreinoDia] 🔄 NOVA LÓGICA: Usando semana do protocolo:', numeroSemana);
        console.log('[buscarExerciciosTreinoDia] 🔍 Buscando planejamento:', {
            usuario_id: userId,
            ano: ano,
            semana_treino: numeroSemana,
            dia_semana: diaSemana
        });
        
        const { data: planejamentos, error: planejamentoError } = await supabase
            .from('planejamento_semanal')
            .select('*')
            .eq('usuario_id', userId)
            .eq('ano', ano)
            .eq('semana_treino', numeroSemana)
            .eq('dia_semana', diaSemana)
            .order('id', { ascending: false })
            .limit(1);
            
        const planejamento = planejamentos?.[0];
            
        if (planejamentoError || !planejamento) {
            console.log('[buscarExerciciosTreinoDia] ❌ Nenhum planejamento encontrado para hoje:', planejamentoError?.message);
            return { data: [], error: 'Nenhum treino programado para hoje' };
        }
        
        console.log('[buscarExerciciosTreinoDia] 📋 Planejamento encontrado:', planejamento);
        console.log('[buscarExerciciosTreinoDia] 🏋️ Tipo de atividade:', planejamento.tipo_atividade);
        
        // Se não for dia de treino (folga/cardio), retornar informação
        if (planejamento.tipo_atividade === 'folga') {
            return { data: [], message: 'Dia de descanso' };
        }
        
        if (planejamento.tipo_atividade === 'cardio') {
            return { data: [], message: 'Dia de cardio' };
        }
        
        // 2. Buscar protocolo do usuário E semana atual do calendário
        const [usuarioPlanoResult, calendarioResult] = await Promise.all([
            supabase.from('usuario_plano_treino').select('*').eq('usuario_id', userId).eq('status', 'ativo').single(),
            supabase.from('d_calendario').select('*').eq('data_completa', toSaoPauloDateString(hoje)).single()
        ]);
        
        const { data: usuarioPlano, error: planoError } = usuarioPlanoResult;
        const { data: calendarioHoje, error: calendarioError } = calendarioResult;
            
        if (planoError || !usuarioPlano) {
            console.log('[buscarExerciciosTreinoDia] ❌ Plano do usuário não encontrado:', planoError?.message);
            return { data: [], error: 'Plano de treino não encontrado' };
        }
        
        // Usar SEMPRE semana do protocolo para home/treino do usuário
        const semanaReferencia = usuarioPlano.semana_atual;
        
        console.log('[buscarExerciciosTreinoDia] 🎯 Plano do usuário:', usuarioPlano);
        console.log('[buscarExerciciosTreinoDia] 📅 Dados do calendário:', calendarioHoje);
        console.log('[buscarExerciciosTreinoDia] 📅 Semana de referência (protocolo):', semanaReferencia);
        console.log('[buscarExerciciosTreinoDia] 🔍 DEBUG - Data formatada para consulta:', toSaoPauloDateString(hoje));
        
        // 3. Buscar exercícios do protocolo usando semana de referência do protocolo
        console.log('[buscarExerciciosTreinoDia] 🎯 Buscando exercícios para:', {
            protocolo_id: usuarioPlano.protocolo_treinamento_id,
            semana_referencia: semanaReferencia,
            dia_semana: diaSemana,
            tipo_atividade: planejamento.tipo_atividade
        });
        
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
            .ilike('exercicios.grupo_muscular', `${planejamento.tipo_atividade}%`)
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
        console.log('[buscarExerciciosTreinoDia] 🔍 DEBUG - Protocolos encontrados:', protocoloTreinos.map(p => ({
            exercicio_id: p.exercicio_id,
            semana_referencia: p.semana_referencia,
            percentual_base: p.percentual_1rm_base,
            series: p.series,
            repeticoes: p.repeticoes_alvo
        })));
        
        // 5. Formatar dados dos exercícios com cálculos de peso
        const exerciciosFormatados = protocoloTreinos.map(protocolo => {
            // Com o join, os dados do exercício vêm em protocolo.exercicios (array) ou protocolo.exercicio (objeto)
            // Supabase retorna como array quando usa !inner join
            const exercicioData = Array.isArray(protocolo.exercicios) ? protocolo.exercicios[0] : protocolo.exercicios;
            
            // Debug: verificar estrutura dos dados
            if (!exercicioData) {
                console.error('[buscarExerciciosTreinoDia] ⚠️ exercicioData é undefined para protocolo:', protocolo);
                console.error('[buscarExerciciosTreinoDia] Estrutura do protocolo:', JSON.stringify(protocolo, null, 2));
            }
            
            // Encontrar dados de 1RM
            const dadoRM = dadosRM.find(rm => rm.exercicio_id === protocolo.exercicio_id);
            
            const rmCalculado = dadoRM?.rm_calculado || 0;
            
            console.log(`[buscarExerciciosTreinoDia] 🔍 DEBUG Exercício ${protocolo.exercicio_id}:`, {
                protocolo: protocolo,
                exercicioData: exercicioData,
                nome: exercicioData?.nome || exercicioData?.exercicio_nome,
                rm_calculado: rmCalculado,
                percentual_base: protocolo.percentual_1rm_base,
                peso_calculado: rmCalculado * (protocolo.percentual_1rm_base / 100),
                semana_referencia: protocolo.semana_referencia
            });
            
            return {
                // IDs
                id: protocolo.id,
                exercicio_id: protocolo.exercicio_id,
                protocolo_id: protocolo.protocolo_id,
                protocolo_treino_id: protocolo.id,
                
                // Dados do exercício
                exercicio_nome: exercicioData?.nome || 'Exercício não encontrado',
                nome: exercicioData?.nome || 'Exercício não encontrado',
                exercicio_grupo: exercicioData?.grupo_muscular || 'N/A',
                grupo_muscular: exercicioData?.grupo_muscular || 'N/A',
                exercicio_equipamento: exercicioData?.equipamento || 'N/A',
                equipamento: exercicioData?.equipamento || 'N/A',
                
                // Pesos calculados
                peso_base: Math.round(rmCalculado * (protocolo.percentual_1rm_base / 100) * 100) / 100,
                peso_minimo: Math.round(rmCalculado * (protocolo.percentual_1rm_min / 100) * 100) / 100,
                peso_maximo: Math.round(rmCalculado * (protocolo.percentual_1rm_max / 100) * 100) / 100,
                peso_min: Math.round(rmCalculado * (protocolo.percentual_1rm_min / 100) * 100) / 100,
                peso_max: Math.round(rmCalculado * (protocolo.percentual_1rm_max / 100) * 100) / 100,
                peso_calculado: Math.round(rmCalculado * (protocolo.percentual_1rm_base / 100) * 100) / 100,
                
                // Séries e repetições
                series: protocolo.series,
                repeticoes: protocolo.repeticoes_alvo,
                repeticoes_alvo: protocolo.repeticoes_alvo,
                
                // Descanso
                tempo_descanso: protocolo.tempo_descanso,
                descanso_sugerido: protocolo.tempo_descanso,
                
                // Outros
                ordem: protocolo.ordem_exercicio,
                ordem_exercicio: protocolo.ordem_exercicio,
                rm_calculado: rmCalculado,
                observacoes: protocolo.observacoes,
                
                // Percentuais
                percentual_1rm_base: protocolo.percentual_1rm_base,
                percentual_1rm_min: protocolo.percentual_1rm_min,
                percentual_1rm_max: protocolo.percentual_1rm_max
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
        console.log(`[marcarSemanaProgramada] Função desabilitada - campos não existem na tabela`);
        // DESABILITADO: Os campos eh_programado, data_programacao e usuario_que_programou
        // não existem na tabela planejamento_semanal
        /*
        // Atualizar registros da semana para marcar como programados
        const { data, error } = await supabase
            .from('planejamento_semanal')
            .update({
                eh_programado: true,
                data_programacao: nowInSaoPaulo(),
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
        */
        
        // Retornar sucesso sem fazer nada por enquanto
        return { success: true, data: [] };
        
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


// ... (restante do código)

// Função de teste para verificar erros 406
export async function testarCorrecoesErro406(userId = null) {
    console.log('🔧 [testarCorrecoesErro406] TESTANDO CORREÇÕES DE ERRO 406');
    
    try {
        const testes = {
            timestamp: nowInSaoPaulo(),
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
        const diaSemana = WeeklyPlanService.dayToDb(hoje.getDay());
        const dataHoje = toSaoPauloDateString(hoje); // YYYY-MM-DD
        
        // 🔄 NOVA LÓGICA: Usar semana do protocolo ativo
        const semanaAtiva = await obterSemanaAtivaUsuario(userId);
        const ano = hoje.getFullYear();
        const semana = semanaAtiva?.semanaUsuario || getWeekNumber(hoje); // fallback para semana civil
        
        console.log('[verificarTreinoConcluido] 📅 Usando semana:', { ano, semana, diaSemana, fonte: semanaAtiva ? 'protocolo' : 'civil' });
        
        // 1. Buscar planejamento de hoje no banco
        const { data: planejamentoHoje, error } = await query('planejamento_semanal', {
            select: 'concluido, data_conclusao, tipo_atividade',
            eq: {
                usuario_id: userId,
                ano: ano,
                semana_treino: semana,
                dia_semana: diaSemana
            },
            maybeSingle: true
        });
        
        if (error) {
            console.warn('[verificarTreinoConcluido] ⚠️ Erro ao buscar planejamento:', error.message);
            return { concluido: false, erro: error.message };
        }
        
        if (!planejamentoHoje) {
            console.log('[verificarTreinoConcluido] ⚠️ Nenhum planejamento encontrado para hoje');
            return { concluido: false, semPlanejamento: true };
        }
        
        // 2. VERIFICAR O STATUS NO PLANEJAMENTO_SEMANAL
        // O campo 'concluido' na tabela planejamento_semanal é a fonte da verdade
        const concluido = Boolean(planejamentoHoje.concluido);
        
        console.log('[verificarTreinoConcluido] 📊 ANÁLISE DO PLANEJAMENTO:', {
            planejamento: planejamentoHoje,
            concluido: concluido,
            data_conclusao: planejamentoHoje.data_conclusao,
            tipo_atividade: planejamentoHoje.tipo_atividade,
            logica: 'BASEADA_NO_PLANEJAMENTO_SEMANAL'
        });
        
        const resultado = {
            concluido: concluido,
            data_conclusao: planejamentoHoje.data_conclusao,
            tipo_atividade: planejamentoHoje.tipo_atividade,
            temPlanejamento: true,
            criterioUtilizado: 'planejamento_semanal_concluido'
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
        const diaSemana = WeeklyPlanService.dayToDb(hoje.getDay());
        const dataHoje = toSaoPauloDateString(hoje);
        
        // 🔄 NOVA LÓGICA: Usar semana do protocolo ativo
        const semanaAtiva = await obterSemanaAtivaUsuario(userId);
        const ano = hoje.getFullYear();
        const semana = semanaAtiva?.semanaUsuario || getWeekNumber(hoje); // fallback para semana civil
        
        console.log('[resetarTreinoHoje] 📅 Usando semana:', { ano, semana, diaSemana, fonte: semanaAtiva ? 'protocolo' : 'civil' });
        
        // 1. Resetar flag concluido no planejamento
        const { data: resetPlan, error: planError } = await update('planejamento_semanal', 
            {
                concluido: false,
                data_conclusao: null
            },
            {
                usuario_id: userId,
                ano: ano,
                semana_treino: semana,
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
    window.testarCorrecoesErro406 = testarCorrecoesErro406;
    window.WeeklyPlanService = WeeklyPlanService;
    window.WeeklyPlanService.obterSemanaAtivaUsuario = obterSemanaAtivaUsuario;
    window.WeeklyPlanService.verificarTreinoConcluido = verificarTreinoConcluido;
    window.WeeklyPlanService.resetarTreinoHoje = resetarTreinoHoje;
    window.WeeklyPlanService.buscarExerciciosTreinoDia = buscarExerciciosTreinoDia;
    // Adicione aqui outras funções utilitárias exportadas que precisar acessar globalmente
}
// Exportação principal do serviço (browser global)
if (typeof window !== 'undefined') {
    window.WeeklyPlanService = WeeklyPlanService;
}
// Export default do serviço
export default WeeklyPlanService;
