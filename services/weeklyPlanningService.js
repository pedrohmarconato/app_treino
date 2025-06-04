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
    
    // Converter para formato usado pela aplicação (0-6)
    const planFormatted = {};
    plano.forEach(dia => {
        // Converter de volta: 1-7 para 0-6 (segunda=1 vira 1, domingo=7 vira 0)
        const diaIndex = dia.dia_semana === 7 ? 0 : dia.dia_semana;
        
        // Converter tipo_atividade para o formato esperado pela aplicação
        let tipo = dia.tipo_atividade.toLowerCase();
        if (tipo === 'treino' && dia.observacoes) {
            // Extrair o tipo real do treino das observações
            const match = dia.observacoes.match(/- (\w+)$/);
            if (match) {
                tipo = match[1];
            }
        }
        
        planFormatted[diaIndex] = {
            tipo: tipo,
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
            
            // Converter índice 0-6 para 1-7 (segunda=1, domingo=7) conforme esperado pela constraint
            const diaSemanaDB = dia === 0 ? 7 : dia; // domingo (0) vira 7, outros dias mantêm o valor
            
            if (!planoDoDia || typeof planoDoDia.tipo !== 'string') {
                console.warn(`[weeklyPlanningService] Plano para o dia ${dia} inválido ou ausente. Adicionando folga padrão.`);
                registros.push({
                    usuario_id: userId,
                    ano: ano,
                    semana: semana,
                    dia_semana: diaSemanaDB, // Usar valor convertido para 1-7
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
                
                const diaSemanaProtocolo = tipoTreinoMap[tipoAtual] || 1;
                const semanaProtocolo = protocoloAtivo.semana_atual || 1;
                
                // Validar se semanaProtocolo é um número válido
                if (!isNaN(semanaProtocolo) && !isNaN(diaSemanaProtocolo)) {
                    numeroTreino = ((parseInt(semanaProtocolo) - 1) * 4) + parseInt(diaSemanaProtocolo);
                } else {
                    console.warn(`[saveWeeklyPlan] Valores inválidos para cálculo: semana=${semanaProtocolo}, dia=${diaSemanaProtocolo}`);
                    numeroTreino = null;
                }
            }
            
            registros.push({
                usuario_id: userId,
                ano: ano,
                semana: semana,
                dia_semana: diaSemanaDB, // Usar valor convertido para 1-7
                tipo_atividade: tipoAtual === 'folga' ? 'folga' : 
                              tipoAtual === 'cardio' ? 'cardio' : 'treino', // ✅ CORRIGIDO
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
    
    // Converter índice 0-6 para 1-7 (segunda=1, domingo=7) conforme esperado pela constraint
    const diaSemanaDB = diaIndex === 0 ? 7 : diaIndex;
    
    const { data, error } = await update('planejamento_semanal', 
        { concluido: true, data_conclusao: new Date().toISOString() },
        {
            eq: {
                usuario_id: userId,
                ano: ano,
                semana: semana,
                dia_semana: diaSemanaDB
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
 * Editar plano semanal (apenas dias não concluídos)
 */
export async function editWeeklyPlan(userId, diaIndex, novoTreino) {
    console.log('[editWeeklyPlan] Parâmetros recebidos:', { userId, diaIndex, novoTreino });
    
    // Validar parâmetros de entrada
    if (!userId || isNaN(userId)) {
        return { success: false, error: 'ID do usuário inválido' };
    }
    
    if (diaIndex === undefined || isNaN(diaIndex) || diaIndex < 0 || diaIndex > 6) {
        return { success: false, error: 'Índice do dia inválido' };
    }
    
    if (!novoTreino || !novoTreino.tipo || !novoTreino.categoria) {
        return { success: false, error: 'Dados do treino inválidos' };
    }
    
    const { ano, semana } = getCurrentWeekKey();
    const diaSemanaDB = diaIndex === 0 ? 7 : diaIndex;
    
    try {
        // Verificar se o dia ainda pode ser editado
        const { data: diaAtual } = await query('planejamento_semanal', {
            eq: { 
                usuario_id: parseInt(userId),
                ano: ano,
                semana: semana,
                dia_semana: diaSemanaDB
            },
            limit: 1
        });
        
        if (!diaAtual || diaAtual.length === 0) {
            return { success: false, error: 'Dia não encontrado no planejamento atual' };
        }
        
        if (diaAtual[0].concluido) {
            return { success: false, error: 'Treino já foi realizado e não pode ser alterado' };
        }
        
        // Calcular numero_treino se necessário
        let numeroTreino = null;
        if (novoTreino.categoria === 'muscular' || novoTreino.categoria === 'treino') {
            // Buscar protocolo ativo para calcular numero_treino
            const protocoloAtivo = await fetchProtocoloAtivoUsuario(userId);
            if (protocoloAtivo && protocoloAtivo.semana_atual) {
                const tipoTreinoMap = {
                    'peito': 1, 'a': 1,
                    'costas': 2, 'b': 2,
                    'pernas': 3, 'c': 3,
                    'ombro': 4, 'ombro e braço': 4, 'd': 4
                };
                
                const tipoLower = novoTreino.tipo.toLowerCase();
                const diaTreino = tipoTreinoMap[tipoLower];
                if (diaTreino) {
                    numeroTreino = ((protocoloAtivo.semana_atual - 1) * 4) + diaTreino;
                }
            }
        }
        
        // Preparar dados da atualização com validação
        const dadosAtualizacao = {
            tipo_atividade: novoTreino.categoria === 'folga' ? 'folga' : 
                           novoTreino.categoria === 'cardio' ? 'cardio' : 'treino',
            numero_treino: (numeroTreino && !isNaN(numeroTreino)) ? parseInt(numeroTreino) : null,
            observacoes: `Plano editado semana ${semana}/${ano} - ${novoTreino.tipo}`
        };
        
        console.log('[editWeeklyPlan] Dados para atualização:', dadosAtualizacao);
        
        // Atualizar no banco
        const { data, error } = await update('planejamento_semanal', 
            dadosAtualizacao,
            {
                eq: {
                    usuario_id: parseInt(userId),
                    ano: ano,
                    semana: semana,
                    dia_semana: diaSemanaDB
                }
            }
        );
        
        if (error) {
            console.error('[editWeeklyPlan] Erro do Supabase:', error);
            return { success: false, error: error.message };
        }
        
        console.log('[editWeeklyPlan] Atualização realizada com sucesso');
        return { success: true, data };
        
    } catch (error) {
        console.error('[editWeeklyPlan] Erro:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Verificar quais dias podem ser editados
 */
export async function getEditableDays(userId) {
    const { ano, semana } = getCurrentWeekKey();
    
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
        dia_semana: dia.dia_semana === 7 ? 0 : dia.dia_semana, // Converter de volta para 0-6
        tipo_atividade: dia.tipo_atividade,
        concluido: dia.concluido,
        editavel: !dia.concluido
    }));
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
