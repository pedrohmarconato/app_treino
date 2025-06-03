// js/services/weeklyPlanningService.js
// Serviço completo para gestão do planejamento semanal

import { query, insert, update } from './supabaseService.js';
import { fetchProtocoloAtivoUsuario } from './userService.js';
import { fetchExerciciosTreino, carregarPesosSugeridos } from './workoutService.js';

/**
 * Calcula número da semana ISO
 */
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

/**
 * Obter chave única da semana atual
 */
function getCurrentWeekKey() {
    const now = new Date();
    return {
        ano: now.getFullYear(),
        semana: getWeekNumber(now)
    };
}

/**
 * Verifica se o usuário precisa de novo planejamento semanal
 */
export async function needsWeeklyPlanning(userId) {
    const { ano, semana } = getCurrentWeekKey();
    
    const { data: planoAtual } = await query('planejamento_semanal', {
        eq: { 
            usuario_id: userId,
            ano: ano,
            semana: semana
        },
        limit: 1
    });
    
    return !planoAtual || planoAtual.length === 0;
}

/**
 * Buscar plano semanal ativo
 */
export async function getActiveWeeklyPlan(userId) {
    const { ano, semana } = getCurrentWeekKey();
    
    const { data: plano } = await query('planejamento_semanal', {
        eq: { 
            usuario_id: userId,
            ano: ano,
            semana: semana
        },
        order: { column: 'dia_semana', ascending: true }
    });
    
    if (!plano || plano.length === 0) {
        return null;
    }
    
    // Converter para formato usado pela aplicação
    const planFormatted = {};
    plano.forEach(dia => {
        planFormatted[dia.dia_semana] = {
            tipo: dia.tipo_atividade,
            numero_treino: dia.numero_treino,
            concluido: dia.concluido
        };
    });
    
    return planFormatted;
}

/**
 * Salvar plano semanal no banco
 */
export async function saveWeeklyPlan(userId, planejamento) {
    console.log('[weeklyPlanningService] saveWeeklyPlan chamado com userId:', userId);
    console.log('[weeklyPlanningService] Planejamento recebido:', JSON.stringify(planejamento, null, 2));

    const { ano, semana } = getCurrentWeekKey();
    
    try {
        // 1. Buscar protocolo ativo do usuário para determinar semana do protocolo
        const protocoloAtivo = await fetchProtocoloAtivoUsuario(userId);
        if (!protocoloAtivo) {
            throw new Error('Usuário não possui protocolo ativo');
        }
        
        // 2. Preparar registros para inserção
        const registros = [];
        
        for (let dia = 0; dia < 7; dia++) {
            const planoDoDia = planejamento[dia]; // Espera-se que planejamento seja um objeto {0: ..., 1: ..., ...}
            
            if (!planoDoDia || typeof planoDoDia.tipo !== 'string') {
                console.warn(`[weeklyPlanningService] Plano para o dia ${dia} inválido ou ausente. Pulando.`);
                // Se um dia é crucial, pode-se adicionar um 'folga' padrão aqui ou lançar erro.
                // Por ora, vamos pular para ver se o erro de constraint é por outro motivo.
                // Se todos os dias forem obrigatórios, isso precisa mudar.
                registros.push({
                    usuario_id: userId,
                    ano: ano,
                    semana: semana,
                    dia_semana: dia, // dia_semana é o índice do loop 0-6
                    tipo_atividade: 'folga', // Default para dia ausente ou inválido
                    numero_treino: null,
                    concluido: false,
                    observacoes: `Plano semana ${semana}/${ano} - Dia ${dia} (padrão folga)`
                });
                continue;
            }
            
            let numeroTreino = null;
            const tipoAtual = planoDoDia.tipo.toLowerCase(); // Já deve estar em minúsculo vindo de planning.js
            
            if (tipoAtual !== 'folga' && tipoAtual !== 'cardio') {
                const tipoTreinoMap = {
                    // Mapear tipos em minúsculo para consistência
                    'a': 1, 'peito': 1,
                    'b': 2, 'costas': 2, 
                    'c': 3, 'pernas': 3,
                    'd': 4, 'ombro': 4, 'ombro e braço': 4
                };
                
                const diaSemanaProtocolo = tipoTreinoMap[tipoAtual] || 1; // Usar tipoAtual (minúsculo)
                const semanaProtocolo = protocoloAtivo.semana_atual || 1;
                numeroTreino = ((semanaProtocolo - 1) * (Object.keys(tipoTreinoMap).length / 2)) + diaSemanaProtocolo; // Ajuste para o número de treinos distintos
            }
            
            registros.push({
                usuario_id: userId,
                ano: ano,
                semana: semana,
                dia_semana: dia, // dia_semana é o índice do loop 0-6
                tipo_atividade: tipoAtual === 'folga' ? 'folga' : 
                              tipoAtual === 'cardio' ? 'cardio' : tipoAtual, // Salva o tipo original em minúsculo
                numero_treino: numeroTreino,
                concluido: false,
                observacoes: `Plano semana ${semana}/${ano} - ${tipoAtual}`
            });
        }
        
        console.log('[weeklyPlanningService] Registros preparados para insert:', JSON.stringify(registros, null, 2));
        
        // 3. Inserir registros
        const { data, error } = await insert('planejamento_semanal', registros);
        
        if (error) {
            console.error('[weeklyPlanningService] Erro do Supabase insert:', JSON.stringify(error, null, 2));
            throw error;
        }
        
        return { success: true, data };
        
    } catch (error) {
        console.error('[weeklyPlanningService] Erro ao salvar plano semanal:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Buscar treino do dia baseado no plano semanal
 */
export async function getTodaysWorkout(userId) {
    const hoje = new Date().getDay(); // 0 = domingo, 1 = segunda, etc.
    const planoSemanal = await getActiveWeeklyPlan(userId);
    
    if (!planoSemanal || !planoSemanal[hoje]) {
        return null;
    }
    
    const planoDoDia = planoSemanal[hoje];
    
    // Se não for treino, retornar info do dia
    if (planoDoDia.tipo === 'folga' || planoDoDia.tipo === 'cardio') {
        return {
            tipo: planoDoDia.tipo,
            nome: planoDoDia.tipo === 'folga' ? 'Dia de Folga' : 'Cardio',
            exercicios: []
        };
    }
    
    // Se for treino, buscar exercícios e pesos
    if (planoDoDia.numero_treino) {
        const protocoloAtivo = await fetchProtocoloAtivoUsuario(userId);
        if (!protocoloAtivo) return null;
        
        const exercicios = await fetchExerciciosTreino(
            planoDoDia.numero_treino, 
            protocoloAtivo.protocolo_treinamento_id
        );
        
        return {
            tipo: 'treino',
            nome: `Treino ${planoDoDia.tipo}`,
            numero_treino: planoDoDia.numero_treino,
            exercicios: exercicios,
            protocolo_treino_id: protocoloAtivo.protocolo_treinamento_id
        };
    }
    
    return null;
}

/**
 * Marcar dia como concluído
 */
export async function markDayAsCompleted(userId, diaIndex) {
    const { ano, semana } = getCurrentWeekKey();
    
    const { data, error } = await update('planejamento_semanal', 
        { concluido: true, data_conclusao: new Date().toISOString() },
        {
            eq: {
                usuario_id: userId,
                ano: ano,
                semana: semana,
                dia_semana: diaIndex
            }
        }
    );
    
    return !error;
}

/**
 * Verificar se semana foi totalmente concluída e criar nova se necessário
 */
export async function checkAndCreateNewWeek(userId) {
    const { ano, semana } = getCurrentWeekKey();
    
    // Buscar plano atual
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
}

/**
 * Buscar histórico de planos semanais
 */
export async function getWeeklyPlanHistory(userId, limit = 10) {
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
}

/**
 * Buscar pesos sugeridos para o treino do dia
 */
export async function getTodaysWorkoutWithWeights(userId) {
    const treinoDoDia = await getTodaysWorkout(userId);
    
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
