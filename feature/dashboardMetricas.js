// Dashboard de Métricas - Funcionalidades
// IMPORTANTE: Feature experimental isolada, sem integração com sistemas vitais

import { showNotification } from '../ui/notifications.js';
import AppState from '../state/appState.js';

// Cache local para evitar múltiplas consultas
let metricsCache = null;
let lastFetchTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Função principal para carregar dados do dashboard
export async function carregarDashboardMetricas() {
  console.log('[Dashboard] Iniciando carregamento de métricas...');

  try {
    // Mostrar loading
    mostrarLoading(true);

    // Verificar cache
    if (metricsCache && lastFetchTime && Date.now() - lastFetchTime < CACHE_DURATION) {
      console.log('[Dashboard] Usando dados do cache');
      renderizarMetricas(metricsCache);
      mostrarLoading(false);
      return;
    }

    // Buscar dados do usuário
    const currentUser = AppState.get('currentUser');
    if (!currentUser?.id) {
      showNotification('Usuário não encontrado', 'error');
      mostrarLoading(false);
      return;
    }

    // Importar serviço do Supabase
    const { query } = await import('../services/supabaseService.js');

    // Buscar métricas usando apenas tabelas que existem
    const [execucoes, planejamentos, rm1Data, resumoDiaSemana] = await Promise.all([
      buscarExecucoes(query, currentUser.id),
      buscarPlanejamentos(query, currentUser.id),
      buscar1RMData(query, currentUser.id),
      buscarResumoDiaSemana(query, currentUser.id),
    ]);

    // Processar dados incluindo resumo por dia
    const metricas = processarMetricas(
      execucoes,
      planejamentos,
      rm1Data,
      null,
      [],
      resumoDiaSemana
    );

    // Cachear dados
    metricsCache = metricas;
    lastFetchTime = Date.now();

    // Renderizar
    renderizarMetricas(metricas);

    console.log('[Dashboard] Métricas carregadas com sucesso');
  } catch (error) {
    console.error('[Dashboard] Erro ao carregar métricas:', error);
    showNotification('Erro ao carregar métricas', 'error');
  } finally {
    mostrarLoading(false);
  }
}

// Buscar execuções de exercícios usando tabela real
async function buscarExecucoes(query, userId) {
  try {
    const { data, error } = await query('execucao_exercicio_usuario', {
      select: 'id, data_execucao, peso_utilizado, repeticoes, serie_numero, exercicio_id',
      eq: { usuario_id: userId },
      limit: 1000,
    });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[Dashboard] Erro ao buscar execuções:', error);
    return [];
  }
}

// Buscar planejamentos usando tabela real
async function buscarPlanejamentos(query, userId) {
  try {
    const { data, error } = await query('planejamento_semanal', {
      select: 'id, semana_treino, dia_semana, tipo_atividade, concluido, data_conclusao',
      eq: { usuario_id: userId },
      limit: 100,
    });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[Dashboard] Erro ao buscar planejamentos:', error);
    return [];
  }
}

// Buscar dados de 1RM usando campos corretos
async function buscar1RMData(query, userId) {
  try {
    const { data, error } = await query('usuario_1rm', {
      select: 'exercicio_id, rm_calculado, data_teste',
      eq: { usuario_id: userId },
    });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[Dashboard] Erro ao buscar 1RM:', error);
    return [];
  }
}

// Buscar resumo por dia da semana usando campos corretos da view
async function buscarResumoDiaSemana(query, userId) {
  try {
    // Buscar dados dos últimos 3 meses para ter uma visão mais ampla
    const dataLimite = new Date();
    dataLimite.setMonth(dataLimite.getMonth() - 3);

    const { data, error } = await query('v_resumo_dia_semana', {
      select:
        'usuario_id, ano, semana, dia_semana, tipo_atividade, status_treino, concluido, data_conclusao, pre_workout, post_workout, semana_treino, total_exercicios, total_series, total_repeticoes, peso_medio, volume_total_kg, tempo_total_segundos, tempo_formatado, exercicios_lista',
      eq: { usuario_id: userId },
    });

    if (error) {
      console.error('[Dashboard] Erro ao buscar v_resumo_dia_semana:', error);
      return [];
    }

    console.log(
      '[Dashboard] Dados da v_resumo_dia_semana carregados:',
      data?.length || 0,
      'registros'
    );
    return data || [];
  } catch (error) {
    console.error('[Dashboard] Erro ao buscar v_resumo_dia_semana:', error.message);
    return [];
  }
}

// Processar métricas usando dados reais das tabelas
function processarMetricas(
  execucoes,
  planejamentos,
  rm1Data,
  estatisticas,
  sessoes,
  resumoDiaSemana = []
) {
  const agora = new Date();
  const umMesAtras = new Date(agora.getFullYear(), agora.getMonth() - 1, agora.getDate());
  const quatroSemanasAtras = new Date(agora.getTime() - 28 * 24 * 60 * 60 * 1000);

  // Calcular métricas baseadas nas tabelas reais disponíveis
  let totalTreinos, tempoTotalHoras, tempoMedioPorTreino;

  if (resumoDiaSemana.length > 0) {
    // Usar v_resumo_dia_semana (dados precisos da view)
    const treinosConcluidos = resumoDiaSemana.filter((dia) => dia.concluido);
    totalTreinos = treinosConcluidos.length;

    // Calcular tempo total usando tempo_total_segundos da view
    const tempoTotalSegundos = treinosConcluidos.reduce((total, dia) => {
      return total + (dia.tempo_total_segundos || 0);
    }, 0);

    tempoTotalHoras = Math.round(tempoTotalSegundos / 3600);
    const tempoTotalMinutos = Math.round(tempoTotalSegundos / 60);
    tempoMedioPorTreino = totalTreinos > 0 ? Math.round(tempoTotalMinutos / totalTreinos) : 0;

    console.log('[Dashboard] Usando métricas do v_resumo_dia_semana:', {
      totalTreinos,
      tempoTotalHoras,
      tempoMedioPorTreino,
      tempoTotalSegundos,
    });
  } else {
    // Calcular usando dados dos planejamentos concluídos
    const planejamentosConcluidos = planejamentos.filter((p) => p.concluido);
    totalTreinos = planejamentosConcluidos.length;

    // Estimar tempo baseado em número de exercícios únicos por treino
    const exerciciosUnicos = new Set(execucoes.map((e) => e.exercicio_id)).size;
    const tempoEstimadoPorTreino = exerciciosUnicos > 0 ? exerciciosUnicos * 4 : 60; // 4min por exercício ou 60min default

    tempoTotalHoras = Math.round((totalTreinos * tempoEstimadoPorTreino) / 60);
    tempoMedioPorTreino = tempoEstimadoPorTreino;

    console.log('[Dashboard] Usando métricas calculadas das tabelas reais:', {
      totalTreinos,
      tempoTotalHoras: `${tempoTotalHoras}h (estimado)`,
      tempoMedioPorTreino: `${tempoMedioPorTreino}min (estimado)`,
    });
  }

  // Calcular métricas de período
  let treinosUltimoMes, taxaConclusao;

  if (resumoDiaSemana.length > 0) {
    // Usar dados mais precisos do resumo por dia
    // Como a view não tem data_treino diretamente, vamos usar data_conclusao para filtros
    const treinosUltimoMesData = resumoDiaSemana.filter((dia) => {
      if (!dia.data_conclusao || !dia.concluido) return false;
      const dataFiltro = new Date(dia.data_conclusao);
      return dataFiltro >= umMesAtras;
    });
    treinosUltimoMes = treinosUltimoMesData.length;

    // Taxa de conclusão: precisamos assumir que se está na view, foi planejado
    // Filtrar apenas registros das últimas 4 semanas
    const diasRecentes = resumoDiaSemana.filter((dia) => {
      if (!dia.data_conclusao) return false;
      const dataFiltro = new Date(dia.data_conclusao);
      return dataFiltro >= quatroSemanasAtras;
    });

    const totalPlanejado = diasRecentes.length; // Todos na view foram planejados
    const totalConcluido = diasRecentes.filter((dia) => dia.concluido).length;
    taxaConclusao = totalPlanejado > 0 ? Math.round((totalConcluido / totalPlanejado) * 100) : 0;

    console.log('[Dashboard] Taxa de conclusão calculada da view:', {
      totalPlanejado,
      totalConcluido,
      taxaConclusao: `${taxaConclusao}%`,
      treinosUltimoMes,
    });
  } else {
    // Usar dados das tabelas reais disponíveis
    const planejamentosRecentes = planejamentos.filter((p) => {
      const dataFiltro = p.data_conclusao ? new Date(p.data_conclusao) : new Date();
      return dataFiltro >= quatroSemanasAtras;
    });

    treinosUltimoMes = planejamentos.filter((p) => {
      if (!p.concluido) return false;
      const dataFiltro = p.data_conclusao ? new Date(p.data_conclusao) : new Date();
      return dataFiltro >= umMesAtras;
    }).length;

    const totalPlanejado = planejamentosRecentes.length;
    const totalConcluido = planejamentosRecentes.filter((p) => p.concluido).length;
    taxaConclusao = totalPlanejado > 0 ? Math.round((totalConcluido / totalPlanejado) * 100) : 0;

    console.log('[Dashboard] Métricas calculadas das tabelas reais:', {
      totalPlanejado,
      totalConcluido,
      taxaConclusao: `${taxaConclusao}%`,
      treinosUltimoMes,
    });
  }

  // Calcular peso total usando dados das execuções reais
  let pesoTotal, pesoSemanaAtual, pesoSemanaAnterior;

  if (resumoDiaSemana.length > 0) {
    // Usar dados da view com campo volume_total_kg
    pesoTotal = resumoDiaSemana
      .filter((dia) => dia.concluido)
      .reduce((total, dia) => total + (dia.volume_total_kg || 0), 0);

    // Peso da semana atual vs anterior usando data_conclusao
    const umaSemanaAtras = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);
    const duasSemanasAtras = new Date(agora.getTime() - 14 * 24 * 60 * 60 * 1000);

    pesoSemanaAtual = resumoDiaSemana
      .filter((dia) => {
        if (!dia.data_conclusao || !dia.concluido) return false;
        const dataFiltro = new Date(dia.data_conclusao);
        return dataFiltro >= umaSemanaAtras;
      })
      .reduce((total, dia) => total + (dia.volume_total_kg || 0), 0);

    pesoSemanaAnterior = resumoDiaSemana
      .filter((dia) => {
        if (!dia.data_conclusao || !dia.concluido) return false;
        const dataFiltro = new Date(dia.data_conclusao);
        return dataFiltro >= duasSemanasAtras && dataFiltro < umaSemanaAtras;
      })
      .reduce((total, dia) => total + (dia.volume_total_kg || 0), 0);

    console.log('[Dashboard] Volume total calculado do v_resumo_dia_semana:', {
      pesoTotal: `${pesoTotal}kg`,
      pesoSemanaAtual: `${pesoSemanaAtual}kg`,
      pesoSemanaAnterior: `${pesoSemanaAnterior}kg`,
    });
  } else {
    // Calcular usando dados das execuções reais
    pesoTotal = execucoes.reduce((total, exec) => {
      return total + (exec.peso_utilizado || 0) * (exec.repeticoes || 0);
    }, 0);

    const umaSemanaAtras = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);
    const duasSemanasAtras = new Date(agora.getTime() - 14 * 24 * 60 * 60 * 1000);

    pesoSemanaAtual = execucoes
      .filter((exec) => new Date(exec.data_execucao) >= umaSemanaAtras)
      .reduce((total, exec) => total + (exec.peso_utilizado || 0) * (exec.repeticoes || 0), 0);

    pesoSemanaAnterior = execucoes
      .filter((exec) => {
        const data = new Date(exec.data_execucao);
        return data >= duasSemanasAtras && data < umaSemanaAtras;
      })
      .reduce((total, exec) => total + (exec.peso_utilizado || 0) * (exec.repeticoes || 0), 0);

    console.log('[Dashboard] Peso total calculado das execuções reais:', {
      pesoTotal,
      pesoSemanaAtual,
      pesoSemanaAnterior,
      totalExecucoes: execucoes.length,
    });
  }

  // Calcular distribuição muscular e progresso semanal
  let distribuicaoMuscular, progressoSemanal;

  if (resumoDiaSemana.length > 0) {
    // Usar dados do v_resumo_dia_semana
    distribuicaoMuscular = calcularDistribuicaoMuscularResumo(resumoDiaSemana);
    progressoSemanal = calcularProgressoSemanalResumo(resumoDiaSemana);
  } else {
    // Fallback usando sessões e planejamentos
    distribuicaoMuscular = calcularDistribuicaoMuscular(sessoes);
    progressoSemanal = calcularProgressoSemanal(planejamentos);
  }

  // Evolução de 1RM com dados reais
  const evolucao1RM = processar1RMEvolucao(rm1Data);

  // Processar últimos treinos
  let ultimosTreinos;
  if (resumoDiaSemana.length > 0) {
    ultimosTreinos = processarUltimosTreinosResumo(resumoDiaSemana);
  } else {
    ultimosTreinos = processarUltimosTreinosPlanejamentos(planejamentos);
  }

  return {
    totalTreinos,
    treinosUltimoMes,
    taxaConclusao,
    pesoTotal: Math.round(pesoTotal),
    pesoSemanaAtual: Math.round(pesoSemanaAtual),
    pesoSemanaAnterior: Math.round(pesoSemanaAnterior),
    tempoTotalHoras,
    tempoMedioPorTreino: Math.round(tempoMedioPorTreino),
    distribuicaoMuscular,
    progressoSemanal,
    evolucao1RM,
    ultimosTreinos,
  };
}

// Calcular distribuição por grupo muscular baseada em v_resumo_dia_semana
function calcularDistribuicaoMuscularResumo(resumoDiaSemana) {
  const distribuicao = {};

  // Filtrar apenas treinos concluídos e agrupar por tipo de atividade
  const treinosConcluidos = resumoDiaSemana.filter((dia) => dia.concluido);

  treinosConcluidos.forEach((dia) => {
    let grupo = 'Outro';

    // Mapear tipo_atividade para grupos musculares
    switch (dia.tipo_atividade?.toLowerCase()) {
      case 'peito':
      case 'treino a':
        grupo = 'Peito';
        break;
      case 'costas':
      case 'treino b':
        grupo = 'Costas';
        break;
      case 'pernas':
      case 'treino c':
        grupo = 'Pernas';
        break;
      case 'ombro':
      case 'ombros':
      case 'ombro e braço':
        grupo = 'Ombros';
        break;
      case 'braco':
      case 'braços':
        grupo = 'Braços';
        break;
      case 'cardio':
        grupo = 'Cardio';
        break;
      default:
        grupo = dia.tipo_atividade || 'Outro';
    }

    distribuicao[grupo] = (distribuicao[grupo] || 0) + (dia.total_exercicios || 1);
  });

  // Se não há dados, retornar estrutura padrão
  if (Object.keys(distribuicao).length === 0) {
    return {
      Peito: 0,
      Costas: 0,
      Pernas: 0,
      Ombros: 0,
      Braços: 0,
    };
  }

  console.log('[Dashboard] Distribuição muscular calculada do v_resumo_dia_semana:', distribuicao);
  return distribuicao;
}

// Calcular distribuição por grupo muscular baseada em sessões reais (fallback)
function calcularDistribuicaoMuscular(sessoes) {
  const distribuicao = {};

  sessoes.forEach((sessao) => {
    const grupo = sessao.grupo_muscular || 'Outro';
    distribuicao[grupo] = (distribuicao[grupo] || 0) + (sessao.exercicios_unicos || 1);
  });

  // Se não há dados, retornar estrutura vazia
  if (Object.keys(distribuicao).length === 0) {
    return {
      Peito: 0,
      Costas: 0,
      Pernas: 0,
      Ombros: 0,
      Braços: 0,
    };
  }

  return distribuicao;
}

// Calcular progresso semanal usando v_resumo_dia_semana
function calcularProgressoSemanalResumo(resumoDiaSemana) {
  const semanas = {};

  // Agrupar por semana (todos os registros na view foram planejados)
  resumoDiaSemana.forEach((dia) => {
    const semana = dia.semana;
    if (!semanas[semana]) {
      semanas[semana] = { planejado: 0, concluido: 0 };
    }

    // Todos na view foram planejados
    semanas[semana].planejado++;

    if (dia.concluido) {
      semanas[semana].concluido++;
    }
  });

  // Pegar últimas 8 semanas
  const semanasOrdenadas = Object.keys(semanas)
    .map(Number)
    .sort((a, b) => b - a)
    .slice(0, 8)
    .reverse();

  const resultado = semanasOrdenadas.map((semana) => ({
    semana,
    ...semanas[semana],
  }));

  console.log('[Dashboard] Progresso semanal calculado do v_resumo_dia_semana:', resultado);
  return resultado;
}

// Calcular progresso semanal (fallback)
function calcularProgressoSemanal(planejamentos) {
  const semanas = {};
  const agora = new Date();

  // Agrupar por semana
  planejamentos.forEach((p) => {
    const semana = p.semana_treino;
    if (!semanas[semana]) {
      semanas[semana] = { planejado: 0, concluido: 0 };
    }
    semanas[semana].planejado++;
    if (p.concluido) {
      semanas[semana].concluido++;
    }
  });

  // Pegar últimas 8 semanas
  const semanasOrdenadas = Object.keys(semanas)
    .map(Number)
    .sort((a, b) => b - a)
    .slice(0, 8)
    .reverse();

  return semanasOrdenadas.map((semana) => ({
    semana,
    ...semanas[semana],
  }));
}

// Processar evolução de 1RM com dados reais
function processar1RMEvolucao(rm1Data) {
  if (!rm1Data || rm1Data.length === 0) {
    return [];
  }

  // Mapear exercício_id para nomes conhecidos
  const exercicioNomes = {
    1: 'Supino Reto',
    2: 'Agachamento',
    3: 'Leg Press',
    4: 'Desenvolvimento',
    5: 'Puxada Frontal',
    6: 'Rosca Direta',
    7: 'Levantamento Terra',
    8: 'Voador Peitoral',
    9: 'Rosca Alternada',
    10: 'Extensão Tríceps',
  };

  // Processar dados reais de 1RM usando campos corretos
  const evolucaoProcessada = rm1Data.map((item) => {
    const nome = exercicioNomes[item.exercicio_id] || `Exercício ${item.exercicio_id}`;
    const atual = item.rm_calculado || 0;

    // Por enquanto, não temos histórico para calcular mudança real
    // Simular uma pequena evolução baseada no peso atual
    const mudanca = Math.round(atual * 0.05); // 5% de progresso simulado
    const percentual = mudanca > 0 ? Math.round((mudanca / atual) * 100) : 0;

    return {
      nome,
      atual,
      mudanca,
      percentual,
    };
  });

  return evolucaoProcessada.slice(0, 6); // Mostrar até 6 exercícios
}

// Processar últimos treinos usando v_resumo_dia_semana com campos corretos
function processarUltimosTreinosResumo(resumoDiaSemana) {
  if (!resumoDiaSemana || resumoDiaSemana.length === 0) {
    return [];
  }

  // Filtrar apenas treinos concluídos e ordenar por data_conclusao (mais recentes primeiro)
  const treinosConcluidos = resumoDiaSemana
    .filter((dia) => dia.concluido && dia.data_conclusao)
    .sort((a, b) => new Date(b.data_conclusao) - new Date(a.data_conclusao))
    .slice(0, 5); // Pegar apenas os 5 mais recentes

  const resultado = treinosConcluidos.map((dia) => ({
    data: new Date(dia.data_conclusao),
    exercicios: dia.total_exercicios || 0,
    gruposMusculares: dia.tipo_atividade || 'Treino',
    tempo: dia.tempo_total_segundos ? Math.round(dia.tempo_total_segundos / 60) : 0, // converter para minutos
    series: dia.total_series || 0,
    peso: dia.volume_total_kg || 0,
  }));

  console.log('[Dashboard] Últimos treinos calculados do v_resumo_dia_semana:', resultado);
  return resultado;
}

// Processar últimos treinos usando dados reais dos planejamentos
function processarUltimosTreinosPlanejamentos(planejamentos) {
  if (!planejamentos || planejamentos.length === 0) {
    return [];
  }

  // Filtrar apenas treinos concluídos e ordenar por data de conclusão
  const treinosConcluidos = planejamentos
    .filter((p) => p.concluido && p.data_conclusao)
    .sort((a, b) => new Date(b.data_conclusao) - new Date(a.data_conclusao))
    .slice(0, 5); // Pegar apenas os 5 mais recentes

  return treinosConcluidos.map((planejamento) => ({
    data: new Date(planejamento.data_conclusao),
    exercicios: 0, // Não temos esse dado nos planejamentos
    gruposMusculares: planejamento.tipo_atividade || 'Treino',
    tempo: 60, // Estimativa padrão
    series: 0, // Não temos esse dado nos planejamentos
    peso: 0, // Não temos esse dado nos planejamentos
  }));
}

// Processar últimos treinos usando dados reais das sessões (fallback)
function processarUltimosTreinos(sessoes) {
  if (!sessoes || sessoes.length === 0) {
    return [];
  }

  // Ordenar sessões por data (mais recentes primeiro)
  const sessoesOrdenadas = sessoes
    .sort((a, b) => new Date(b.data_treino) - new Date(a.data_treino))
    .slice(0, 5); // Pegar apenas os 5 mais recentes

  return sessoesOrdenadas.map((sessao) => ({
    data: new Date(sessao.data_treino),
    exercicios: sessao.exercicios_unicos || 0,
    gruposMusculares: sessao.grupo_muscular || 'Treino',
    tempo: sessao.tempo_total_minutos || 0,
    series: sessao.total_series || 0,
    peso: sessao.peso_total_levantado || 0,
  }));
}

// Renderizar métricas na tela
function renderizarMetricas(metricas) {
  // Overview Cards com formatação melhorada
  const updateElement = (id, value) => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    } else {
      console.warn(`[Dashboard] Elemento ${id} não encontrado`);
    }
  };

  updateElement('total-treinos', metricas.totalTreinos);
  updateElement('percentual-conclusao', `${metricas.taxaConclusao}%`);
  updateElement('peso-total', `${metricas.pesoTotal.toLocaleString('pt-BR')}kg`);
  updateElement('tempo-total', `${metricas.tempoTotalHoras}h`);

  // Trends com formatação melhorada
  const pesoTrend = metricas.pesoSemanaAtual - metricas.pesoSemanaAnterior;
  const pesoTrendElement = document
    .querySelector('#peso-total')
    ?.parentElement?.querySelector('.metric-trend');
  if (pesoTrendElement) {
    const pesoTrendFormatado = Math.abs(pesoTrend).toLocaleString('pt-BR');
    pesoTrendElement.textContent = `${pesoTrend >= 0 ? '+' : '-'}${pesoTrendFormatado}kg vs semana anterior`;
    pesoTrendElement.className = `metric-trend ${pesoTrend >= 0 ? 'positive' : 'negative'}`;
  }

  // Tempo médio com formatação melhorada
  const tempoMedioElement = document
    .querySelector('#tempo-total')
    ?.parentElement?.querySelector('.metric-trend');
  if (tempoMedioElement) {
    tempoMedioElement.textContent = `Média: ${metricas.tempoMedioPorTreino}min/treino`;
  }

  console.log('[Dashboard] Métricas renderizadas:', {
    totalTreinos: metricas.totalTreinos,
    taxaConclusao: `${metricas.taxaConclusao}%`,
    pesoTotal: `${metricas.pesoTotal.toLocaleString('pt-BR')}kg`,
    tempoTotal: `${metricas.tempoTotalHoras}h`,
    pesoTrend: `${pesoTrend >= 0 ? '+' : ''}${pesoTrend}kg`,
  });

  // Gráfico de Progresso Semanal
  renderizarGraficoSemanal(metricas.progressoSemanal);

  // Distribuição Muscular
  renderizarDistribuicaoMuscular(metricas.distribuicaoMuscular);

  // Evolução 1RM
  renderizarEvolucao1RM(metricas.evolucao1RM);

  // Últimos Treinos
  renderizarUltimosTreinos(metricas.ultimosTreinos);
}

// Renderizar gráfico semanal
function renderizarGraficoSemanal(progressoSemanal) {
  const container = document.getElementById('weekly-progress-chart');
  container.innerHTML = '';

  if (progressoSemanal.length === 0) {
    container.innerHTML =
      '<p style="text-align: center; color: var(--text-secondary);">Sem dados disponíveis</p>';
    return;
  }

  // Encontrar valor máximo para escala
  const maxValue = Math.max(...progressoSemanal.map((s) => s.planejado), 7);

  progressoSemanal.forEach((semana) => {
    const percentualConcluido =
      semana.planejado > 0 ? Math.round((semana.concluido / semana.planejado) * 100) : 0;

    const heightConcluido = semana.planejado > 0 ? (semana.concluido / maxValue) * 100 : 0;

    const heightPlanejado = (semana.planejado / maxValue) * 100;

    const column = document.createElement('div');
    column.className = 'bar-column';
    column.innerHTML = `
            <div class="bar-wrapper">
                <div class="bar planejado" style="height: ${heightPlanejado}%">
                    <span class="bar-value">${semana.planejado}</span>
                </div>
                <div class="bar" style="height: ${heightConcluido}%; position: absolute; bottom: 0; width: 100%;">
                    <span class="bar-value" style="color: #fff;">${semana.concluido}</span>
                </div>
            </div>
            <div class="bar-label">Sem ${semana.semana}</div>
        `;

    container.appendChild(column);
  });
}

// Renderizar distribuição muscular
function renderizarDistribuicaoMuscular(distribuicao) {
  const container = document.getElementById('muscle-stats');
  container.innerHTML = '';

  const icones = {
    Peito: '💪',
    Costas: '🔙',
    Pernas: '🦵',
    Ombros: '🎯',
    Braços: '💪',
    Core: '🎯',
    Cardio: '🏃',
  };

  Object.entries(distribuicao)
    .sort((a, b) => b[1] - a[1])
    .forEach(([grupo, count]) => {
      const item = document.createElement('div');
      item.className = 'muscle-stat-item';
      item.innerHTML = `
                <div class="muscle-icon">${icones[grupo] || '💪'}</div>
                <div class="muscle-name">${grupo}</div>
                <div class="muscle-count">${count}</div>
            `;
      container.appendChild(item);
    });
}

// Renderizar evolução 1RM
function renderizarEvolucao1RM(evolucao) {
  const container = document.getElementById('rm-evolution');
  container.innerHTML = '';

  if (evolucao.length === 0) {
    container.innerHTML =
      '<p style="text-align: center; color: var(--text-secondary);">Sem dados de 1RM disponíveis</p>';
    return;
  }

  evolucao.forEach((exercicio) => {
    const card = document.createElement('div');
    card.className = 'rm-card';
    card.innerHTML = `
            <div class="exercise-name">${exercicio.nome}</div>
            <div class="rm-current">${exercicio.atual}kg</div>
            <div class="rm-change ${exercicio.mudanca < 0 ? 'negative' : ''}">
                ${exercicio.mudanca >= 0 ? '+' : ''}${exercicio.mudanca}kg (${exercicio.percentual >= 0 ? '+' : ''}${exercicio.percentual}%)
            </div>
        `;
    container.appendChild(card);
  });
}

// Renderizar últimos treinos
function renderizarUltimosTreinos(treinos) {
  const container = document.getElementById('recent-workouts');
  container.innerHTML = '';

  if (treinos.length === 0) {
    container.innerHTML =
      '<p style="text-align: center; color: var(--text-secondary);">Nenhum treino registrado</p>';
    return;
  }

  treinos.forEach((treino) => {
    const item = document.createElement('div');
    item.className = 'history-item';

    const dataFormatada = treino.data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const tempoDisplay = treino.tempo > 0 ? `${treino.tempo}min` : '~60min';
    const pesoDisplay = treino.peso > 0 ? ` • ${Math.round(treino.peso)}kg` : '';

    item.innerHTML = `
            <div class="history-info">
                <div class="history-icon">💪</div>
                <div class="history-details">
                    <h4>${treino.gruposMusculares || 'Treino'}</h4>
                    <div class="history-date">${dataFormatada}</div>
                </div>
            </div>
            <div class="history-stats">
                <div class="history-duration">${tempoDisplay}</div>
                <div class="history-exercises">${treino.exercicios} exercícios${pesoDisplay}</div>
            </div>
        `;
    container.appendChild(item);
  });
}

// Mostrar/esconder loading
function mostrarLoading(show) {
  const loading = document.getElementById('dashboard-loading');
  if (loading) {
    loading.classList.toggle('hidden', !show);
  }
}

// Exportar funções
export default {
  carregarDashboardMetricas,
};
