/**
 * 🧹 LIMPEZA DE DADOS CORROMPIDOS DO TIMER - Clean Corrupted Timer
 *
 * FUNÇÃO: Detectar e corrigir dados corrompidos relacionados a timers e cronômetros.
 *
 * RESPONSABILIDADES:
 * - Verificar integridade dos dados de timer no localStorage
 * - Detectar valores NaN ou inválidos em tempos e timestamps
 * - Corrigir automaticamente dados corrompidos quando possível
 * - Limpar dados irrecuperáveis para evitar bugs
 * - Sincronizar dados entre diferentes chaves de armazenamento
 * - Executar verificações automáticas na inicialização
 *
 * VERIFICAÇÕES REALIZADAS:
 * - treino_tempo_temp: valida tempo e timestamp de última atualização
 * - treino_unified_state: verifica workoutStartTime no cronômetro
 * - Detecção de strings 'NaN' nos dados JSON
 * - Validação de tipos numéricos e ranges válidos
 *
 * ESTRATÉGIAS DE CORREÇÃO:
 * - Remoção completa de dados inválidos não-recuperáveis
 * - Correção usando timestamps alternativos quando disponíveis
 * - Fallback para tempo atual em casos extremos
 * - Logs detalhados para debugging e monitoramento
 *
 * INTEGRAÇÃO: Executado automaticamente na inicialização e disponível para chamada manual
 */

// Utilitário para limpar dados corrompidos do timer
export function cleanCorruptedTimerData() {
  console.log('[cleanCorruptedTimer] 🔍 Verificando dados do timer...');

  const dadosCorrigidos = {
    tempoTemp: false,
    estadoUnificado: false,
    appState: false,
    timerInterval: false,
  };

  // 1. Verificar treino_tempo_temp
  const tempoSalvo = localStorage.getItem('treino_tempo_temp');
  if (tempoSalvo) {
    try {
      const dados = JSON.parse(tempoSalvo);

      // Verificações mais robustas
      const tempoValido =
        typeof dados.tempo === 'number' && !isNaN(dados.tempo) && dados.tempo >= 0;
      const timestampValido =
        typeof dados.ultimaAtualizacao === 'number' &&
        !isNaN(dados.ultimaAtualizacao) &&
        dados.ultimaAtualizacao > 0;
      const tempoMuitoAntigo =
        dados.ultimaAtualizacao && Date.now() - dados.ultimaAtualizacao > 24 * 60 * 60 * 1000; // 24h

      if (!tempoValido || !timestampValido || tempoMuitoAntigo) {
        console.warn('[cleanCorruptedTimer] ⚠️ Dados corrompidos encontrados:', {
          dados: dados,
          tempoValido,
          timestampValido,
          tempoMuitoAntigo,
          idade: dados.ultimaAtualizacao ? Date.now() - dados.ultimaAtualizacao : 'N/A',
        });
        localStorage.removeItem('treino_tempo_temp');
        dadosCorrigidos.tempoTemp = true;
        console.log('[cleanCorruptedTimer] ✅ Dados do timer limpos');
      } else {
        console.log('[cleanCorruptedTimer] ✅ Dados do timer válidos');
      }
    } catch (error) {
      console.error('[cleanCorruptedTimer] ❌ Erro ao parsear dados:', error);
      localStorage.removeItem('treino_tempo_temp');
      dadosCorrigidos.tempoTemp = true;
    }
  }

  // 2. Verificar estado unificado
  const estadoUnificado = localStorage.getItem('treino_unified_state');
  if (estadoUnificado) {
    try {
      const estado = JSON.parse(estadoUnificado);
      let precisaAtualizar = false;

      if (estado.cronometro && estado.cronometro.workoutStartTime) {
        const startTime = Number(estado.cronometro.workoutStartTime);

        if (isNaN(startTime) || startTime <= 0) {
          console.warn(
            '[cleanCorruptedTimer] ⚠️ workoutStartTime corrompido:',
            estado.cronometro.workoutStartTime
          );

          // Corrigir usando o timestamp do estado ou tempo atual
          if (estado.timestamp && !isNaN(estado.timestamp)) {
            estado.cronometro.workoutStartTime = estado.timestamp;
          } else {
            estado.cronometro.workoutStartTime = Date.now();
          }

          precisaAtualizar = true;
          dadosCorrigidos.estadoUnificado = true;
        }
      }

      // Verificar outros campos do cronômetro
      if (estado.cronometro) {
        ['tempoAtual', 'tempoUltimaAtualizacao'].forEach((campo) => {
          if (estado.cronometro[campo] && isNaN(Number(estado.cronometro[campo]))) {
            console.warn(
              `[cleanCorruptedTimer] ⚠️ Campo ${campo} corrompido:`,
              estado.cronometro[campo]
            );
            delete estado.cronometro[campo];
            precisaAtualizar = true;
            dadosCorrigidos.estadoUnificado = true;
          }
        });
      }

      if (precisaAtualizar) {
        localStorage.setItem('treino_unified_state', JSON.stringify(estado));
        console.log('[cleanCorruptedTimer] ✅ Estado unificado corrigido');
      }
    } catch (error) {
      console.error('[cleanCorruptedTimer] ❌ Erro ao processar estado unificado:', error);
      localStorage.removeItem('treino_unified_state');
      dadosCorrigidos.estadoUnificado = true;
    }
  }

  // 3. Verificar AppState (se disponível)
  if (typeof window !== 'undefined' && window.AppState) {
    try {
      const timerInterval = window.AppState.get('timerInterval');
      const restTime = window.AppState.get('restTime');
      const workoutStartTime = window.AppState.get('workoutStartTime');

      // Limpar intervalos órfãos
      if (timerInterval && (typeof timerInterval !== 'number' || isNaN(timerInterval))) {
        console.warn('[cleanCorruptedTimer] ⚠️ timerInterval corrompido:', timerInterval);
        window.AppState.set('timerInterval', null);
        dadosCorrigidos.timerInterval = true;
      }

      // Verificar restTime
      if (restTime && (typeof restTime !== 'number' || isNaN(restTime))) {
        console.warn('[cleanCorruptedTimer] ⚠️ restTime corrompido:', restTime);
        window.AppState.set('restTime', 0);
        dadosCorrigidos.appState = true;
      }

      // Verificar workoutStartTime
      if (workoutStartTime && (typeof workoutStartTime !== 'number' || isNaN(workoutStartTime))) {
        console.warn('[cleanCorruptedTimer] ⚠️ workoutStartTime corrompido:', workoutStartTime);
        window.AppState.set('workoutStartTime', null);
        dadosCorrigidos.appState = true;
      }
    } catch (error) {
      console.error('[cleanCorruptedTimer] ❌ Erro ao verificar AppState:', error);
    }
  }

  // 4. Limpar strings 'NaN' em todo localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);

    if (value && value.includes('NaN')) {
      console.warn(`[cleanCorruptedTimer] ⚠️ String 'NaN' encontrada em ${key}`);
      try {
        const parsed = JSON.parse(value);
        const cleaned = JSON.stringify(parsed).replace(/:\s*NaN/g, ': null');
        if (cleaned !== value) {
          localStorage.setItem(key, cleaned);
          console.log(`[cleanCorruptedTimer] ✅ NaN corrigido em ${key}`);
        }
      } catch (e) {
        // Se não é JSON válido, remover completamente
        localStorage.removeItem(key);
        console.log(`[cleanCorruptedTimer] ✅ Item inválido removido: ${key}`);
      }
    }
  }

  const totalCorrecoes = Object.values(dadosCorrigidos).filter(Boolean).length;

  if (totalCorrecoes > 0) {
    console.log('[cleanCorruptedTimer] 🔧 Resumo das correções:', dadosCorrigidos);
    console.log(`[cleanCorruptedTimer] ✅ ${totalCorrecoes} problemas corrigidos`);

    // Notificar usuário se muitos problemas foram encontrados
    if (totalCorrecoes >= 3 && typeof window !== 'undefined' && window.showNotification) {
      window.showNotification('Dados do timer foram corrigidos automaticamente', 'info');
    }
  } else {
    console.log('[cleanCorruptedTimer] ✅ Nenhum problema encontrado');
  }

  return dadosCorrigidos;
}

// Função para monitoramento contínuo (verificação periódica)
export function startTimerMonitoring() {
  console.log('[cleanCorruptedTimer] 🔄 Iniciando monitoramento contínuo...');

  // Verificar a cada 5 minutos
  const monitoringInterval = setInterval(
    () => {
      const resultado = cleanCorruptedTimerData();
      const problemas = Object.values(resultado).filter(Boolean).length;

      if (problemas > 0) {
        console.warn(
          `[cleanCorruptedTimer] ⚠️ ${problemas} problemas detectados durante monitoramento`
        );
      }
    },
    5 * 60 * 1000
  ); // 5 minutos

  // Armazenar referência para limpeza posterior
  if (typeof window !== 'undefined') {
    window.timerMonitoringInterval = monitoringInterval;
  }

  return monitoringInterval;
}

// Função para parar monitoramento
export function stopTimerMonitoring() {
  if (typeof window !== 'undefined' && window.timerMonitoringInterval) {
    clearInterval(window.timerMonitoringInterval);
    delete window.timerMonitoringInterval;
    console.log('[cleanCorruptedTimer] ⏹️ Monitoramento contínuo parado');
  }
}

// Executar automaticamente ao carregar
if (typeof window !== 'undefined') {
  window.cleanCorruptedTimerData = cleanCorruptedTimerData;
  window.startTimerMonitoring = startTimerMonitoring;
  window.stopTimerMonitoring = stopTimerMonitoring;

  // Executar na inicialização
  document.addEventListener('DOMContentLoaded', () => {
    console.log('[cleanCorruptedTimer] 🚀 Iniciando verificação automática...');

    // Verificação inicial
    const resultado = cleanCorruptedTimerData();

    // Iniciar monitoramento se problemas foram detectados
    const problemas = Object.values(resultado).filter(Boolean).length;
    if (problemas > 0) {
      console.log('[cleanCorruptedTimer] 🔄 Problemas detectados, iniciando monitoramento...');
      startTimerMonitoring();
    }

    // Verificação específica para strings 'NaN'
    const tempoSalvo = localStorage.getItem('treino_tempo_temp');
    if (tempoSalvo && tempoSalvo.includes('NaN')) {
      console.warn('[cleanCorruptedTimer] ⚠️ NaN detectado em treino_tempo_temp');
      cleanCorruptedTimerData();
    }
  });

  // Verificar quando mudança de página/visibilidade
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      console.log('[cleanCorruptedTimer] 👁️ Página ficou visível, verificando dados...');
      cleanCorruptedTimerData();
    }
  });
}
