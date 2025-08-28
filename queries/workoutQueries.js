// queries/workoutQueries.js - Todas as consultas de treino centralizadas
// Fonte única de verdade para dados de treino

import { query } from '../services/supabaseService.js';
import { obterSemanaAtivaUsuario } from '../services/weeklyPlanningService.js';

/**
 * Buscar dados completos do treino de hoje para um usuário
 * Esta é a ÚNICA função que deve ser usada para buscar dados de treino
 * @param {string} userId - ID do usuário
 * @returns {Promise<Object>} - Dados completos do treino
 */
export async function buscarTreinoCompleto(userId) {
  console.log(
    '[workoutQueries.buscarTreinoCompleto] 🔍 Buscando dados completos para usuário:',
    userId
  );

  try {
    // 1. Buscar semana ativa do protocolo do usuário
    const semanaAtiva = await obterSemanaAtivaUsuario(userId);
    if (!semanaAtiva) {
      throw new Error('Usuário não tem protocolo ativo');
    }

    console.log('[workoutQueries.buscarTreinoCompleto] 📅 Semana ativa:', semanaAtiva);

    // 2. Buscar planejamento para hoje
    const hoje = new Date();
    const diaJS = hoje.getDay(); // 0 = domingo, 1 = segunda, etc.
    const diaDB = diaJS === 0 ? 7 : diaJS; // Converter para formato DB (1-7)
    const ano = hoje.getFullYear();
    const semanaProtocolo = semanaAtiva.semana_treino;

    console.log('[workoutQueries.buscarTreinoCompleto] 📋 Buscando planejamento:', {
      ano,
      semana: semanaProtocolo,
      dia: diaDB,
    });

    const { data: planejamentos } = await query('planejamento_semanal', {
      eq: {
        usuario_id: userId,
        ano: ano,
        semana_treino: semanaProtocolo,
        dia_semana: diaDB,
      },
      limit: 1,
    });

    const planejamentoHoje = planejamentos?.[0];
    if (!planejamentoHoje) {
      return {
        success: false,
        message: 'Nenhum treino programado para hoje',
        data: null,
      };
    }

    console.log(
      '[workoutQueries.buscarTreinoCompleto] 🎯 Planejamento encontrado:',
      planejamentoHoje
    );

    // 3. Se for folga ou cardio, retornar info básica
    if (planejamentoHoje.tipo_atividade === 'folga') {
      return {
        success: true,
        tipo: 'folga',
        data: {
          planejamento: planejamentoHoje,
          semanaProtocolo: semanaProtocolo,
          exercicios: [],
        },
      };
    }

    if (planejamentoHoje.tipo_atividade === 'cardio') {
      return {
        success: true,
        tipo: 'cardio',
        data: {
          planejamento: planejamentoHoje,
          semanaProtocolo: semanaProtocolo,
          exercicios: [],
        },
      };
    }

    // 4. Para treinos de força, buscar exercícios com pesos
    const { buscarExerciciosTreinoDia } = await import('../services/weeklyPlanningService.js');
    const resultadoExercicios = await buscarExerciciosTreinoDia(userId);

    if (!resultadoExercicios || !resultadoExercicios.data) {
      return {
        success: false,
        message: 'Erro ao carregar exercícios do treino',
        data: null,
      };
    }

    console.log(
      '[workoutQueries.buscarTreinoCompleto] 💪 Exercícios carregados:',
      resultadoExercicios.data.length
    );

    // 5. Retornar dados completos
    return {
      success: true,
      tipo: 'forca',
      data: {
        planejamento: planejamentoHoje,
        semanaProtocolo: semanaProtocolo,
        exercicios: resultadoExercicios.data,
        usuario: { id: userId },
        metadata: {
          ano,
          semana: semanaProtocolo,
          dia: diaDB,
          diaJS,
          timestamp: new Date().toISOString(),
        },
      },
    };
  } catch (error) {
    console.error('[workoutQueries.buscarTreinoCompleto] ❌ Erro:', error);
    return {
      success: false,
      message: error.message,
      data: null,
    };
  }
}

/**
 * Buscar estatísticas básicas do usuário
 * @param {string} userId - ID do usuário
 * @returns {Promise<Object>} - Estatísticas do usuário
 */
export async function buscarEstatisticasUsuario(userId) {
  console.log('[workoutQueries.buscarEstatisticasUsuario] 📊 Buscando estatísticas para:', userId);

  try {
    // Buscar treinos concluídos esta semana
    const semanaAtiva = await obterSemanaAtivaUsuario(userId);
    const ano = new Date().getFullYear();

    const { data: treinosSemana } = await query('planejamento_semanal', {
      eq: {
        usuario_id: userId,
        ano: ano,
        semana_treino: semanaAtiva?.semana_treino || 1,
      },
    });

    const treinosConcluidos = treinosSemana?.filter((t) => t.concluido).length || 0;
    const treinosPlanejados = treinosSemana?.length || 0;

    return {
      success: true,
      data: {
        semanaAtual: semanaAtiva?.semana_treino || 1,
        treinosConcluidos,
        treinosPlanejados,
        percentualConclusao:
          treinosPlanejados > 0 ? Math.round((treinosConcluidos / treinosPlanejados) * 100) : 0,
        progressoProtocolo: semanaAtiva?.percentual_1rm_calculado || 70,
      },
    };
  } catch (error) {
    console.error('[workoutQueries.buscarEstatisticasUsuario] ❌ Erro:', error);
    return {
      success: false,
      message: error.message,
      data: null,
    };
  }
}

console.log('🔍 Workout Queries carregadas - Fonte única de verdade ativa!');
