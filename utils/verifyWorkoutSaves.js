/**
 * ✅ VERIFICAÇÃO DE SALVAMENTO DE TREINOS - Verify Workout Saves
 *
 * FUNÇÃO: Verificar e diagnosticar problemas no salvamento de dados de treino.
 *
 * RESPONSABILIDADES:
 * - Buscar e validar últimas execuções de exercícios no banco
 * - Verificar treinos concluídos em período específico (hoje)
 * - Diagnosticar dados em cache local (localStorage e AppState)
 * - Fornecer logs detalhados para debugging de problemas
 * - Expor informações estruturadas sobre estado do salvamento
 * - Identificar inconsistências entre cache e banco de dados
 *
 * VERIFICAÇÕES REALIZADAS:
 * - execucao_exercicio_usuario: últimas 10 execuções por usuário
 * - treino_realizado: treinos concluídos na data atual
 * - Cache local: chaves de armazenamento temporário
 * - AppState: execuções em memória não persistidas
 *
 * DADOS RETORNADOS:
 * - Lista de execuções recentes com detalhes completos
 * - Contador de treinos concluídos hoje
 * - Informações da última execução registrada
 * - Status de sucesso/falha das operações
 * - Dados de cache local organizados por chave
 *
 * USO PARA DEBUG:
 * - Executar após problemas de salvamento
 * - Verificar se dados chegam ao banco
 * - Identificar problemas de sincronização
 * - Monitorar integridade do cache
 *
 * INTEGRAÇÃO: Disponível globalmente para debug via console do navegador
 */

// Utilitário para verificar se os treinos estão sendo salvos corretamente
import { supabase } from '../services/supabaseService.js';

export async function verificarUltimosTreinos(usuarioId) {
  console.log('[verificarUltimosTreinos] Verificando últimos treinos salvos...');

  try {
    // Buscar últimas 10 execuções
    const { data: execucoes, error } = await supabase
      .from('execucao_exercicio_usuario')
      .select('*')
      .eq('usuario_id', usuarioId)
      .order('data_execucao', { ascending: false })
      .limit(10);

    if (error) {
      console.error('[verificarUltimosTreinos] Erro ao buscar execuções:', error);
      return { sucesso: false, erro: error };
    }

    console.log('[verificarUltimosTreinos] Últimas execuções encontradas:', execucoes?.length || 0);

    if (execucoes && execucoes.length > 0) {
      console.log('[verificarUltimosTreinos] Última execução:', {
        id: execucoes[0].id,
        exercicio_id: execucoes[0].exercicio_id,
        data: new Date(execucoes[0].data_execucao).toLocaleString('pt-BR'),
        peso: execucoes[0].peso_utilizado,
        reps: execucoes[0].repeticoes,
      });
    }

    // Verificar treinos concluídos hoje
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const { data: treinosHoje, error: errorHoje } = await supabase
      .from('treino_realizado')
      .select('*')
      .eq('usuario_id', usuarioId)
      .gte('data_conclusao', hoje.toISOString())
      .order('data_conclusao', { ascending: false });

    if (errorHoje) {
      console.warn('[verificarUltimosTreinos] Erro ao buscar treinos de hoje:', errorHoje);
    } else {
      console.log('[verificarUltimosTreinos] Treinos concluídos hoje:', treinosHoje?.length || 0);
    }

    return {
      sucesso: true,
      execucoes: execucoes || [],
      treinosHoje: treinosHoje || [],
      ultimaExecucao: execucoes?.[0] || null,
    };
  } catch (error) {
    console.error('[verificarUltimosTreinos] Erro geral:', error);
    return { sucesso: false, erro: error };
  }
}

// Função para debug do cache local
export function verificarCacheLocal() {
  console.log('[verificarCacheLocal] Verificando dados em cache...');

  const cacheKeys = [
    'treino_execucoes_temp',
    'treino_estado_temp',
    'treino_tempo_temp',
    'treino_unified_state',
    'offline_sync_queue',
  ];

  const cacheData = {};

  cacheKeys.forEach((key) => {
    const value = localStorage.getItem(key);
    if (value) {
      try {
        cacheData[key] = JSON.parse(value);
        console.log(`[verificarCacheLocal] ${key}:`, cacheData[key]);
      } catch (e) {
        console.warn(`[verificarCacheLocal] Erro ao parsear ${key}:`, e);
      }
    }
  });

  // Verificar execuções no AppState
  if (window.AppState) {
    const execucoesCache = window.AppState.get('execucoesCache');
    console.log('[verificarCacheLocal] Execuções no AppState:', execucoesCache?.length || 0);
  }

  return cacheData;
}

// Expor globalmente para debug
if (typeof window !== 'undefined') {
  window.verificarUltimosTreinos = verificarUltimosTreinos;
  window.verificarCacheLocal = verificarCacheLocal;
}
