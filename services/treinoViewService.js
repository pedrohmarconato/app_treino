// Service otimizado que utiliza a view vw_treino_completo
import { supabase } from './supabaseService.js';

export class TreinoViewService {
  // Buscar histórico completo de treinos por data e grupo muscular
  static async buscarTreinoPorData(userId, data, grupoMuscular = null) {
    try {
      let query = supabase
        .from('vw_treino_completo')
        .select('*')
        .eq('usuario_id', userId)
        .eq('data_treino', data);

      // Se grupo muscular especificado, filtrar apenas esse grupo
      if (grupoMuscular) {
        query = query.eq('grupo_muscular', grupoMuscular);
      }

      const { data: treinos, error } = await query
        .order('exercicio_nome', { ascending: true })
        .order('serie_numero', { ascending: true });

      if (error) throw error;

      if (!treinos || treinos.length === 0) {
        return { success: true, data: null, message: 'Nenhum treino encontrado' };
      }

      // Agrupar por exercício
      const exerciciosAgrupados = this.agruparPorExercicio(treinos);

      // Calcular métricas do dia
      const metricas = this.calcularMetricasDia(treinos);

      // Se não foi especificado grupo muscular e há múltiplos grupos relevantes, retornar separado
      if (!grupoMuscular && this.temMultiplosGruposRelevantes(treinos)) {
        return this.retornarGruposSeparados(userId, data, treinos);
      }

      return {
        success: true,
        data: {
          data_treino: data,
          exercicios: exerciciosAgrupados,
          metricas: metricas,
          total_execucoes: treinos.length,
          grupo_muscular: treinos[0]?.grupo_muscular,
          planejamento: {
            protocolo_id: treinos[0]?.protocolo_treino_id,
            concluido: treinos[0]?.planejamento_concluido,
            observacoes: treinos[0]?.observacoes_planejamento,
          },
        },
      };
    } catch (error) {
      console.error('[TreinoViewService] Erro ao buscar treino:', error);
      return { success: false, error: error.message };
    }
  }

  // Buscar histórico com filtros avançados
  static async buscarHistoricoCompleto(userId, filtros = {}) {
    try {
      let query = supabase.from('vw_treino_completo').select('*').eq('usuario_id', userId);

      // Aplicar filtros
      if (filtros.data_inicio) {
        query = query.gte('data_treino', filtros.data_inicio);
      }

      if (filtros.data_fim) {
        query = query.lte('data_treino', filtros.data_fim);
      }

      if (filtros.grupo_muscular) {
        query = query.eq('grupo_muscular', filtros.grupo_muscular);
      }

      if (filtros.exercicio_id) {
        query = query.eq('exercicio_id', filtros.exercicio_id);
      }

      if (filtros.apenas_prs) {
        query = query.eq('qualidade_performance', 'Excelente');
      }

      const { data: treinos, error } = await query
        .order('data_execucao', { ascending: false })
        .limit(filtros.limit || 100);

      if (error) throw error;

      // Agrupar por data
      const treinosPorData = this.agruparPorData(treinos);

      return { success: true, data: treinosPorData };
    } catch (error) {
      console.error('[TreinoViewService] Erro ao buscar histórico:', error);
      return { success: false, error: error.message };
    }
  }

  // Estatísticas avançadas
  static async obterEstatisticasAvancadas(userId, periodo = 30) {
    try {
      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - periodo);
      const dataInicioStr = dataInicio.toISOString().split('T')[0];

      const { data: treinos, error } = await supabase
        .from('vw_treino_completo')
        .select('*')
        .eq('usuario_id', userId)
        .gte('data_treino', dataInicioStr);

      if (error) throw error;

      if (!treinos || treinos.length === 0) {
        return { success: true, data: this.getEmptyStats() };
      }

      // Calcular estatísticas
      const stats = {
        periodo: {
          dias: periodo,
          data_inicio: dataInicioStr,
          data_fim: new Date().toISOString().split('T')[0],
        },

        treinos: {
          total_sessoes: [...new Set(treinos.map((t) => t.data_treino))].length,
          total_series: treinos.length,
          total_exercicios: [...new Set(treinos.map((t) => t.exercicio_id))].length,
          grupos_musculares: [...new Set(treinos.map((t) => t.grupo_muscular))],
        },

        volume: {
          total: treinos.reduce((sum, t) => sum + (t.volume_serie || 0), 0),
          medio_por_treino:
            treinos.reduce((sum, t) => sum + (t.volume_total_dia || 0), 0) /
            [...new Set(treinos.map((t) => t.data_treino))].length,
          progressao: this.calcularProgressaoVolume(treinos),
        },

        intensidade: {
          media: this.calcularMedia(treinos.map((t) => t.intensidade_percentual).filter(Boolean)),
          maxima: Math.max(...treinos.map((t) => t.intensidade_percentual || 0)),
          distribuicao: this.calcularDistribuicaoIntensidade(treinos),
        },

        performance: {
          prs: treinos.filter((t) => t.qualidade_performance === 'Excelente').length,
          falhas: treinos.filter((t) => t.falhou).length,
          taxa_sucesso: (
            ((treinos.length - treinos.filter((t) => t.falhou).length) / treinos.length) *
            100
          ).toFixed(1),
        },

        tempo: {
          estimado_total_minutos: Math.round(
            treinos.reduce((sum, t) => sum + (t.tempo_estimado_serie_segundos || 0), 0) / 60
          ),
          medio_por_treino_minutos: Math.round(
            treinos.reduce((sum, t) => sum + (t.tempo_estimado_serie_segundos || 0), 0) /
              60 /
              [...new Set(treinos.map((t) => t.data_treino))].length
          ),
        },

        exercicios_top: this.getTopExercicios(treinos, 5),
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('[TreinoViewService] Erro nas estatísticas:', error);
      return { success: false, error: error.message };
    }
  }

  // Buscar progressão de um exercício específico
  static async buscarProgressaoExercicio(userId, exercicioId, limite = 20) {
    try {
      const { data: progressao, error } = await supabase
        .from('vw_treino_completo')
        .select('*')
        .eq('usuario_id', userId)
        .eq('exercicio_id', exercicioId)
        .order('data_execucao', { ascending: false })
        .limit(limite);

      if (error) throw error;

      const dadosProgressao = progressao.map((p) => ({
        data: p.data_treino,
        serie: p.serie_numero,
        peso: p.peso_utilizado,
        repeticoes: p.repeticoes,
        volume: p.volume_serie,
        rm_estimado: p.rm_estimado,
        intensidade: p.intensidade_percentual,
        progressao_peso: p.progressao_peso,
        qualidade: p.qualidade_performance,
      }));

      return { success: true, data: dadosProgressao };
    } catch (error) {
      console.error('[TreinoViewService] Erro na progressão:', error);
      return { success: false, error: error.message };
    }
  }

  // Verificar se há múltiplos grupos musculares relevantes no mesmo dia
  static temMultiplosGruposRelevantes(treinos) {
    const grupos = [...new Set(treinos.map((t) => t.grupo_muscular))];

    // Se só há 1 grupo, não há múltiplos
    if (grupos.length <= 1) return false;

    // Se há 2 ou mais grupos mas um deles tem menos de 3 séries, considerar como grupo único
    const estatisticasPorGrupo = grupos.map((grupo) => ({
      grupo,
      series: treinos.filter((t) => t.grupo_muscular === grupo).length,
      exercicios: [
        ...new Set(treinos.filter((t) => t.grupo_muscular === grupo).map((t) => t.exercicio_id)),
      ].length,
    }));

    // Filtrar grupos com pelo menos 2 séries OU 2 exercícios diferentes
    const gruposRelevantes = estatisticasPorGrupo.filter(
      (stat) => stat.series >= 2 || stat.exercicios >= 2
    );

    console.log('[TreinoViewService] Estatísticas por grupo:', estatisticasPorGrupo);
    console.log('[TreinoViewService] Grupos relevantes:', gruposRelevantes);

    return gruposRelevantes.length > 1;
  }

  // Verificar se há múltiplos grupos musculares no mesmo dia (método original mantido)
  static temMultiplosGrupos(treinos) {
    const grupos = [...new Set(treinos.map((t) => t.grupo_muscular))];
    return grupos.length > 1;
  }

  // Retornar grupos separados quando há múltiplos no mesmo dia
  static retornarGruposSeparados(userId, data, treinos) {
    const grupos = [...new Set(treinos.map((t) => t.grupo_muscular))];

    console.log(`[TreinoViewService] Múltiplos grupos encontrados: ${grupos.join(', ')}`);

    const gruposSeparados = grupos.map((grupo) => {
      const treinosDoGrupo = treinos.filter((t) => t.grupo_muscular === grupo);
      const exerciciosAgrupados = this.agruparPorExercicio(treinosDoGrupo);
      const metricas = this.calcularMetricasDia(treinosDoGrupo);

      return {
        grupo_muscular: grupo,
        exercicios: exerciciosAgrupados,
        metricas: metricas,
        total_execucoes: treinosDoGrupo.length,
      };
    });

    return {
      success: true,
      data: {
        data_treino: data,
        multiplos_grupos: true,
        grupos: gruposSeparados,
        total_grupos: grupos.length,
        grupos_nomes: grupos,
      },
      message: `Encontrados ${grupos.length} grupos musculares: ${grupos.join(', ')}`,
    };
  }

  // Métodos auxiliares para processamento de dados
  static agruparPorExercicio(treinos) {
    const grupos = {};

    treinos.forEach((treino) => {
      if (!grupos[treino.exercicio_id]) {
        grupos[treino.exercicio_id] = {
          exercicio_id: treino.exercicio_id,
          nome: treino.exercicio_nome,
          grupo_muscular: treino.grupo_muscular,
          equipamento: treino.equipamento,
          series: [],
          metricas: {
            volume_total: 0,
            peso_maximo: 0,
            rm_estimado_max: 0,
            intensidade_media: 0,
          },
        };
      }

      grupos[treino.exercicio_id].series.push({
        serie_numero: treino.serie_numero,
        peso: treino.peso_utilizado,
        repeticoes: treino.repeticoes,
        falhou: treino.falhou,
        volume: treino.volume_serie,
        rm_estimado: treino.rm_estimado,
        intensidade: treino.intensidade_percentual,
      });

      // Atualizar métricas
      const metricas = grupos[treino.exercicio_id].metricas;
      metricas.volume_total += treino.volume_serie || 0;
      metricas.peso_maximo = Math.max(metricas.peso_maximo, treino.peso_utilizado || 0);
      metricas.rm_estimado_max = Math.max(metricas.rm_estimado_max, treino.rm_estimado || 0);
    });

    // Calcular intensidade média
    Object.values(grupos).forEach((grupo) => {
      const intensidades = grupo.series.map((s) => s.intensidade).filter(Boolean);
      grupo.metricas.intensidade_media =
        intensidades.length > 0 ? intensidades.reduce((a, b) => a + b, 0) / intensidades.length : 0;
    });

    return Object.values(grupos);
  }

  static agruparPorData(treinos) {
    const grupos = {};

    treinos.forEach((treino) => {
      const data = treino.data_treino;
      if (!grupos[data]) {
        grupos[data] = {
          data: data,
          grupo_muscular: treino.grupo_muscular,
          treinos: [],
          metricas: {
            total_series: treino.total_series_dia,
            total_exercicios: treino.total_exercicios_dia,
            volume_total: treino.volume_total_dia,
            peso_medio: treino.peso_medio_dia,
            tempo_estimado: Math.round(
              (treino.tempo_estimado_serie_segundos * treino.total_series_dia) / 60
            ),
          },
        };
      }
      grupos[data].treinos.push(treino);
    });

    return Object.values(grupos).sort((a, b) => new Date(b.data) - new Date(a.data));
  }

  static calcularMetricasDia(treinos) {
    if (!treinos.length) return {};

    return {
      total_series: treinos[0].total_series_dia,
      total_exercicios: treinos[0].total_exercicios_dia,
      volume_total: treinos[0].volume_total_dia,
      peso_medio: Math.round(treinos[0].peso_medio_dia * 100) / 100,
      tempo_estimado_minutos: Math.round(
        treinos.reduce((sum, t) => sum + (t.tempo_estimado_serie_segundos || 0), 0) / 60
      ),
      intensidade_media:
        Math.round(
          this.calcularMedia(treinos.map((t) => t.intensidade_percentual).filter(Boolean)) * 10
        ) / 10,
      prs_realizados: treinos.filter((t) => t.qualidade_performance === 'Excelente').length,
      taxa_sucesso:
        Math.round(
          ((treinos.length - treinos.filter((t) => t.falhou).length) / treinos.length) * 100 * 10
        ) / 10,
    };
  }

  static calcularMedia(array) {
    if (!array.length) return 0;
    return array.reduce((a, b) => a + b, 0) / array.length;
  }

  static calcularProgressaoVolume(treinos) {
    // Agrupa por semana e calcula progressão
    const volumePorSemana = {};
    treinos.forEach((t) => {
      const chave = `${t.ano}-${t.semana}`;
      volumePorSemana[chave] = (volumePorSemana[chave] || 0) + (t.volume_serie || 0);
    });

    const semanas = Object.keys(volumePorSemana).sort();
    if (semanas.length < 2) return 0;

    const primeira = volumePorSemana[semanas[0]];
    const ultima = volumePorSemana[semanas[semanas.length - 1]];

    return Math.round(((ultima - primeira) / primeira) * 100 * 10) / 10;
  }

  static calcularDistribuicaoIntensidade(treinos) {
    const intensidades = treinos.map((t) => t.intensidade_percentual).filter(Boolean);

    return {
      baixa: intensidades.filter((i) => i < 70).length,
      moderada: intensidades.filter((i) => i >= 70 && i < 85).length,
      alta: intensidades.filter((i) => i >= 85).length,
    };
  }

  static getTopExercicios(treinos, limite) {
    const volumePorExercicio = {};

    treinos.forEach((t) => {
      const key = `${t.exercicio_id}_${t.exercicio_nome}`;
      volumePorExercicio[key] = (volumePorExercicio[key] || 0) + (t.volume_serie || 0);
    });

    return Object.entries(volumePorExercicio)
      .map(([key, volume]) => ({
        exercicio: key.split('_')[1],
        volume: Math.round(volume),
      }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, limite);
  }

  static getEmptyStats() {
    return {
      periodo: { dias: 0 },
      treinos: { total_sessoes: 0, total_series: 0, total_exercicios: 0, grupos_musculares: [] },
      volume: { total: 0, medio_por_treino: 0, progressao: 0 },
      intensidade: { media: 0, maxima: 0, distribuicao: { baixa: 0, moderada: 0, alta: 0 } },
      performance: { prs: 0, falhas: 0, taxa_sucesso: 0 },
      tempo: { estimado_total_minutos: 0, medio_por_treino_minutos: 0 },
      exercicios_top: [],
    };
  }
}

export default TreinoViewService;
