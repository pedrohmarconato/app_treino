/**
 * 🎮 CONTROLADOR DE TREINO - Workout Controller
 *
 * FUNÇÃO: Gerenciar a interface de usuário relacionada a treinos, centralizando atualizações de dados e elementos DOM.
 *
 * RESPONSABILIDADES:
 * - Buscar dados completos de treino via queries especializadas
 * - Atualizar elementos da UI de forma coordenada e consistente
 * - Gerenciar diferentes tipos de treino (força, cardio, folga)
 * - Sincronizar dados com AppState para reatividade
 * - Tratar estados de erro e ausência de dados
 * - Fornecer interface unificada para atualizações de treino
 *
 * ARQUITETURA:
 * - Controller Layer: coordena queries e atualizações de UI
 * - Função principal: atualizarTodoTreinoUI() - ÚNICA função que deve ser chamada pelas telas
 * - Funções especializadas para cada seção da UI
 * - Sistema de fallback para cenários de erro
 *
 * TIPOS DE TREINO SUPORTADOS:
 * - Força: treinos com exercícios estruturados por semana/protocolo
 * - Cardio: atividades cardiovasculares com duração estimada
 * - Folga: dias de descanso e recuperação
 *
 * ELEMENTOS UI GERENCIADOS:
 * - Card principal: nome, exercícios, tipo de treino
 * - Indicadores de semana: número, status, progresso
 * - Estatísticas: treinos concluídos, percentual de progresso
 * - Botões de ação: texto e comportamento contextual
 *
 * INTEGRAÇÃO: Usado pelo dashboard principal e sistema de navegação
 */

// controllers/workoutController.js - Controlador que gerencia a UI de treinos
// Pega dados das queries e atualiza elementos da página

import { buscarTreinoCompleto, buscarEstatisticasUsuario } from '../queries/workoutQueries.js';

/**
 * Controlador principal para atualizar toda a UI de treinos
 * Esta é a ÚNICA função que deve ser chamada pelas telas
 * @param {string} userId - ID do usuário
 */
export async function atualizarTodoTreinoUI(userId) {
  console.log('[workoutController.atualizarTodoTreinoUI] 🎮 Atualizando UI completa para:', userId);

  try {
    // 1. Buscar dados completos do treino
    const resultadoTreino = await buscarTreinoCompleto(userId);
    console.log('[workoutController.atualizarTodoTreinoUI] 📦 Dados recebidos:', resultadoTreino);

    // 2. Buscar estatísticas
    const resultadoEstatisticas = await buscarEstatisticasUsuario(userId);

    // 3. Atualizar todos os elementos da UI
    if (resultadoTreino.success) {
      atualizarCardPrincipal(resultadoTreino);
      atualizarIndicadoresSemana(resultadoTreino);
      atualizarAppState(resultadoTreino);
    } else {
      atualizarUIParaSemTreino(resultadoTreino.message);
    }

    if (resultadoEstatisticas.success) {
      atualizarEstatisticas(resultadoEstatisticas);
    }

    console.log('[workoutController.atualizarTodoTreinoUI] ✅ UI atualizada com sucesso');

    return resultadoTreino;
  } catch (error) {
    console.error('[workoutController.atualizarTodoTreinoUI] ❌ Erro:', error);
    atualizarUIParaErro(error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Atualizar card principal de treino
 */
function atualizarCardPrincipal(resultado) {
  console.log('[workoutController.atualizarCardPrincipal] 🎯 Atualizando card principal...');

  const elementos = {
    workoutName: document.getElementById('workout-name'),
    workoutExercises: document.getElementById('workout-exercises'),
    workoutType: document.getElementById('workout-type'),
    btnText: document.getElementById('btn-text'),
  };

  const { planejamento, exercicios, semanaProtocolo } = resultado.data;

  switch (resultado.tipo) {
    case 'folga':
      updateElement(elementos.workoutName, 'Dia de Folga');
      updateElement(elementos.workoutExercises, 'Repouso e recuperação');
      updateElement(elementos.workoutType, 'Descanso');
      updateElement(elementos.btnText, 'Dia de Descanso');
      break;

    case 'cardio':
      updateElement(elementos.workoutName, 'Treino Cardiovascular');
      updateElement(elementos.workoutExercises, 'Exercícios aeróbicos • 30-45min');
      updateElement(elementos.workoutType, 'Cardio');
      updateElement(elementos.btnText, 'Iniciar Cardio');
      break;

    case 'forca': {
      const tipoTreino = planejamento.tipo_atividade;
      const numExercicios = exercicios?.length || 0;

      updateElement(elementos.workoutName, `Treino ${tipoTreino} - Semana ${semanaProtocolo}`);
      updateElement(
        elementos.workoutExercises,
        `${numExercicios} exercícios • Semana ${semanaProtocolo} • ${tipoTreino}`
      );
      updateElement(elementos.workoutType, `Treino ${tipoTreino}`);
      updateElement(elementos.btnText, 'Iniciar Treino');
      break;
    }
  }

  console.log('[workoutController.atualizarCardPrincipal] ✅ Card principal atualizado');
}

/**
 * Atualizar indicadores da semana
 */
function atualizarIndicadoresSemana(resultado) {
  console.log('[workoutController.atualizarIndicadoresSemana] 📅 Atualizando indicadores...');

  const elementos = {
    weekNumber: document.getElementById('week-number'),
    weekStatus: document.getElementById('week-status'),
    currentWeek: document.getElementById('current-week'),
  };

  const semana = resultado.data.semanaProtocolo;

  updateElement(elementos.weekNumber, `Semana ${semana}`);
  updateElement(elementos.weekStatus, 'Ativa');
  updateElement(elementos.currentWeek, `Semana ${semana}`);

  // Aplicar classe CSS adequada
  if (elementos.weekStatus) {
    elementos.weekStatus.className = 'week-status atual';
  }

  console.log(
    '[workoutController.atualizarIndicadoresSemana] ✅ Indicadores atualizados para semana',
    semana
  );
}

/**
 * Atualizar AppState
 */
function atualizarAppState(resultado) {
  console.log('[workoutController.atualizarAppState] 🗃️ Atualizando AppState...');

  if (!window.AppState) {
    console.warn('[workoutController.atualizarAppState] ⚠️ AppState não disponível');
    return;
  }

  const { planejamento, exercicios, semanaProtocolo } = resultado.data;

  const workoutData = {
    tipo: planejamento.tipo_atividade,
    nome: `Treino ${planejamento.tipo_atividade}`,
    grupo_muscular: planejamento.tipo_atividade,
    semana_treino: semanaProtocolo,
    exercicios: exercicios || [],
    concluido: planejamento.concluido || false,
    metadata: resultado.data.metadata,
  };

  window.AppState.set('currentWorkout', workoutData);
  console.log('[workoutController.atualizarAppState] ✅ AppState atualizado:', workoutData);
}

/**
 * Atualizar estatísticas
 */
function atualizarEstatisticas(resultado) {
  console.log('[workoutController.atualizarEstatisticas] 📊 Atualizando estatísticas...');

  const elementos = {
    completedWorkouts: document.getElementById('completed-workouts'),
    userWorkouts: document.getElementById('user-workouts'),
    progressPercentage: document.getElementById('progress-percentage'),
  };

  const stats = resultado.data;

  updateElement(elementos.completedWorkouts, stats.treinosConcluidos);
  updateElement(elementos.userWorkouts, stats.treinosConcluidos);
  updateElement(elementos.progressPercentage, `${stats.progressoProtocolo}%`);

  console.log('[workoutController.atualizarEstatisticas] ✅ Estatísticas atualizadas');
}

/**
 * UI para quando não há treino
 */
function atualizarUIParaSemTreino(mensagem) {
  console.log('[workoutController.atualizarUIParaSemTreino] 📭 Sem treino:', mensagem);

  const elementos = {
    workoutName: document.getElementById('workout-name'),
    workoutExercises: document.getElementById('workout-exercises'),
    workoutType: document.getElementById('workout-type'),
    btnText: document.getElementById('btn-text'),
  };

  updateElement(elementos.workoutName, 'Nenhum treino configurado');
  updateElement(elementos.workoutExercises, 'Configure seu planejamento semanal');
  updateElement(elementos.workoutType, 'Configure');
  updateElement(elementos.btnText, 'Configurar Planejamento');
}

/**
 * UI para erro
 */
function atualizarUIParaErro(mensagem) {
  console.error('[workoutController.atualizarUIParaErro] ❌ Erro:', mensagem);

  const elementos = {
    workoutName: document.getElementById('workout-name'),
    workoutExercises: document.getElementById('workout-exercises'),
  };

  updateElement(elementos.workoutName, 'Erro ao carregar treino');
  updateElement(elementos.workoutExercises, `Erro: ${mensagem}`);
}

/**
 * Função auxiliar para atualizar elementos
 */
function updateElement(element, content) {
  if (element && content !== null && content !== undefined) {
    element.textContent = content;
  }
}

/**
 * Função para carregar dados dos exercícios no expandir
 * Mantém compatibilidade com o sistema existente
 */
export async function carregarExerciciosParaExpandir(userId) {
  console.log('[workoutController.carregarExerciciosParaExpandir] 📋 Carregando para expandir...');

  const resultado = await buscarTreinoCompleto(userId);

  if (resultado.success && resultado.tipo === 'forca') {
    return {
      data: resultado.data.exercicios,
      planejamento: {
        tipo_atividade: resultado.data.planejamento.tipo_atividade,
        semana_treino: resultado.data.semanaProtocolo,
      },
    };
  }

  return null;
}

// Função de teste
export async function testarControllerCompleto(userId) {
  console.log('🧪 [TESTE-CONTROLLER] Testando controller completo...');

  const resultado = await atualizarTodoTreinoUI(userId);

  console.log('🧪 [TESTE-CONTROLLER] Resultado:', resultado);
  console.log(
    '🧪 [TESTE-CONTROLLER] CurrentWorkout no AppState:',
    window.AppState?.get('currentWorkout')
  );

  return resultado;
}

// Disponibilizar globalmente para testes
window.testarControllerCompleto = testarControllerCompleto;

console.log('🎮 Workout Controller carregado - UI centralizada ativa!');
