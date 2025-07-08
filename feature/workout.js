// js/features/workout.js
// Lógica da tela de treino

import AppState from '../state/appState.js';
import { fetch1RMUsuario } from '../services/userService.js';
import { carregarPesosSugeridos, salvarExecucaoExercicio, salvarExecucoesEmLote, marcarTreinoConcluido } from '../services/workoutService.js';
import { showNotification } from '../ui/notifications.js';
import { mostrarTela, voltarParaHome } from '../ui/navigation.js';
import { workoutStateManager } from '../services/workoutStateManager.js';
import { workoutAnalytics } from '../services/workoutAnalytics.js';
import { criarModalRecuperacaoTreino } from '../components/workoutRecoveryModal.js';
import { timerManager } from '../services/timerManager.js';
import { cleanCorruptedTimerData } from '../utils/cleanCorruptedTimer.js';
import { offlineSyncService } from '../services/offlineSyncService.js';

// Iniciar treino
export async function iniciarTreino() {
    console.log('[iniciarTreino] Iniciando função iniciarTreino...');
    console.log('[iniciarTreino] Esta é a versão COMPLETA do workout.js');
    
    // Limpar dados corrompidos antes de iniciar
    cleanCorruptedTimerData();
    
    // Verificar se há treino em andamento
    const treinoEmAndamento = await workoutStateManager.verificarTreinoEmAndamento();
    if (treinoEmAndamento && false) { // TEMPORÁRIO: desabilitado para testes
        console.log('[iniciarTreino] Treino em andamento encontrado');
        
        // Mostrar modal de escolha
        criarModalRecuperacaoTreino(
            treinoEmAndamento,
            // Opção: Continuar
            () => {
                mostrarTela('workout-screen');
                const restaurado = workoutStateManager.restaurarEstado(treinoEmAndamento);
                if (restaurado) {
                    // Limpar timers antigos antes de restaurar
                    timerManager.clearContext('workout');
                    
                    // Aguardar um pouco para garantir que o DOM esteja pronto
                    setTimeout(() => {
                        // Re-registrar timer do treino se necessário
                        const workoutStartTime = AppState.get('workoutStartTime');
                        console.log('[iniciarTreino] workoutStartTime restaurado:', workoutStartTime);
                        console.log('[iniciarTreino] Estado completo do cronometro:', treinoEmAndamento.cronometro);
                        
                        // Verificar se o tempo foi restaurado corretamente
                        if (!workoutStartTime && treinoEmAndamento.cronometro?.workoutStartTime) {
                            console.log('[iniciarTreino] Usando workoutStartTime do cache:', treinoEmAndamento.cronometro.workoutStartTime);
                            AppState.set('workoutStartTime', treinoEmAndamento.cronometro.workoutStartTime);
                        }
                        
                        // Forçar inicialização do timer
                        const finalStartTime = AppState.get('workoutStartTime');
                        if (finalStartTime && !isNaN(finalStartTime)) {
                            // Garantir que o timer use o tempo correto
                            startWorkoutTimer();
                        } else {
                            // Se não tem tempo salvo válido, iniciar novo
                            console.warn('[iniciarTreino] Nenhum workoutStartTime válido encontrado, iniciando novo');
                            AppState.set('workoutStartTime', Date.now());
                            startWorkoutTimer();
                        }
                    }, 100);
                    
                    // Verificar se havia cronômetro de descanso ativo
                    const restTime = treinoEmAndamento.cronometro?.restTime;
                    if (restTime && restTime > 0) {
                        // Restaurar cronômetro de descanso
                        AppState.set('restTime', restTime);
                        mostrarCronometroDescanso(restTime);
                    }
                    
                    workoutAnalytics.logTreinoRetomado(treinoEmAndamento);
                    workoutAnalytics.logCacheRecuperado(treinoEmAndamento.execucoes?.length || 0);
                    showNotification('Treino anterior restaurado', 'success');
                    
                    // Mostrar exercício e restaurar séries após o timer ser inicializado
                    setTimeout(() => {
                        mostrarExercicioAtual();
                        restaurarSeriesCompletadas();
                    }, 150);
                }
            },
            // Opção: Novo treino
            () => {
                workoutStateManager.limparTudo();
                workoutAnalytics.logTreinoAbandonado('usuario_escolheu_novo');
                // Continuar com fluxo normal de novo treino
                iniciarNovoTreino();
            }
        );
        return;
    }
    
    // Se não há treino em andamento, continuar com o fluxo normal
    console.log('[iniciarTreino] Nenhum treino em andamento, iniciando novo treino...');
    
    // Debug: Adicionar listener temporário para monitorar mudanças
    const unsubscribe = AppState.subscribe('currentExercises', (newValue) => {
        console.log('[iniciarTreino] currentExercises mudou para:', newValue);
    });
    
    let workout = AppState.get('currentWorkout');
    let exercises = AppState.get('currentExercises');
    
    console.log('[iniciarTreino] workout:', workout);
    console.log('[iniciarTreino] exercises:', exercises);
    console.log('[iniciarTreino] currentExercises direto:', AppState.currentExercises);
    console.log('[iniciarTreino] currentWorkout direto:', AppState.currentWorkout);
    console.log('[iniciarTreino] AppState completo:', AppState.getAll());
    
    if (!workout || !exercises || exercises.length === 0) {
        console.log('[iniciarTreino] Tentando carregar dados do dashboard...');
        
        // Tentar carregar os dados se não estiverem disponíveis
        if (window.carregarDashboard) {
            showNotification('Carregando dados do treino...', 'info');
            await window.carregarDashboard();
            
            // Aguardar um pouco para garantir que os dados assíncronos sejam carregados
            // Dashboard tem um setTimeout de 100ms para carregar dados adicionais
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Verificar novamente após carregar
            const workoutAfterLoad = AppState.get('currentWorkout');
            const exercisesAfterLoad = AppState.get('currentExercises');
            
            console.log('[iniciarTreino] Após carregar dashboard:');
            console.log('[iniciarTreino] workoutAfterLoad:', workoutAfterLoad);
            console.log('[iniciarTreino] exercisesAfterLoad:', exercisesAfterLoad);
            console.log('[iniciarTreino] AppState.currentExercises direto:', AppState.currentExercises);
            
            if (workoutAfterLoad && exercisesAfterLoad && exercisesAfterLoad.length > 0) {
                console.log('[iniciarTreino] Dados carregados com sucesso!');
                // Atualizar variáveis locais com os novos dados
                workout = workoutAfterLoad;
                exercises = exercisesAfterLoad;
                // NÃO usar return aqui, deixar o fluxo continuar
            } else {
                console.log('[iniciarTreino] Nenhum treino encontrado após tentar carregar');
                showNotification('Nenhum treino disponível para hoje', 'warning');
                
                // Ainda assim, navegar para a tela de treino e mostrar mensagem
                mostrarTela('workout-screen');
                
                // Mostrar mensagem na tela de treino
                setTimeout(() => {
                    const container = document.getElementById('exercises-container');
                    if (container) {
                        container.innerHTML = `
                            <div class="no-workout-message">
                                <div class="empty-state">
                                    <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <circle cx="12" cy="12" r="10"/>
                                        <path d="M12 6v6l4 2"/>
                                    </svg>
                                    <h2>Nenhum treino para hoje</h2>
                                    <p>Aproveite para descansar ou fazer uma atividade leve</p>
                                    <button class="btn-primary" onclick="window.voltarParaHome()">
                                        Voltar para Home
                                    </button>
                                </div>
                            </div>
                        `;
                    }
                }, 100);
                
                return;
            }
        } else {
            showNotification('Nenhum treino disponível para hoje', 'warning');
            return;
        }
    }
    
    // Verificar se há execuções não salvas no cache
    const execucoesPendentes = localStorage.getItem('treino_execucoes_temp');
    let estadoRecuperado = false;
    
    if (execucoesPendentes) {
        const execucoesCache = JSON.parse(execucoesPendentes);
        const quantidade = execucoesCache.length;
        if (confirm(`Há ${quantidade} execuções não salvas de um treino anterior. Deseja recuperá-las?`)) {
            // Recuperar execuções do cache
            AppState.set('execucoesCache', execucoesCache);
            showNotification(`${quantidade} execuções recuperadas do cache`, 'info');
            estadoRecuperado = true;
            
            // Recuperar também o estado do treino
            const estadoTreino = localStorage.getItem('treino_estado_temp');
            if (estadoTreino) {
                const estado = JSON.parse(estadoTreino);
                AppState.set('currentExerciseIndex', estado.currentExerciseIndex || 0);
                AppState.set('completedSeries', estado.completedSeries || 0);
                console.log('[iniciarTreino] Estado recuperado:', estado);
            }
        } else {
            // Limpar cache antigo
            localStorage.removeItem('treino_execucoes_temp');
            localStorage.removeItem('treino_estado_temp');
            AppState.set('execucoesCache', []);
        }
    } else {
        // Iniciar cache limpo
        AppState.set('execucoesCache', []);
    }
    
    // Resetar estado do treino apenas se não foi recuperado
    if (!estadoRecuperado) {
        AppState.set('currentExerciseIndex', 0);
        AppState.set('completedSeries', 0);
    }
    // Gerenciar tempo do treino
    if (estadoRecuperado) {
        // Recuperar tempo salvo
        const tempoSalvo = localStorage.getItem('treino_tempo_temp');
        if (tempoSalvo) {
            try {
                const dados = JSON.parse(tempoSalvo);
                const tempoDecorrido = Math.floor((Date.now() - dados.ultimaAtualizacao) / 1000);
                const tempoTotal = Number(dados.tempo || 0) + Number(tempoDecorrido || 0);
                
                // Validar que tempoTotal é válido
                if (!isNaN(tempoTotal) && tempoTotal >= 0) {
                    AppState.set('workoutElapsedTime', tempoTotal);
                    const calculatedStartTime = Date.now() - (tempoTotal * 1000);
                    
                    // Garantir que o tempo calculado é válido
                    if (!isNaN(calculatedStartTime) && calculatedStartTime > 0) {
                        AppState.set('workoutStartTime', calculatedStartTime);
                        console.log('[iniciarTreino] Tempo recuperado - elapsed:', tempoTotal, 'startTime:', calculatedStartTime);
                    } else {
                        console.warn('[iniciarTreino] Tempo calculado inválido, usando tempo atual');
                        AppState.set('workoutStartTime', Date.now());
                    }
                } else {
                    console.warn('[iniciarTreino] Tempo total inválido:', tempoTotal);
                    AppState.set('workoutStartTime', Date.now());
                }
            } catch (error) {
                console.error('[iniciarTreino] Erro ao recuperar tempo:', error);
                AppState.set('workoutStartTime', Date.now());
            }
        } else {
            AppState.set('workoutStartTime', Date.now());
        }
    } else {
        AppState.set('workoutStartTime', Date.now());
    }
    
    // Navegar para tela de treino
    mostrarTela('workout-screen');
    
    // Se houve recuperação de estado, restaurar UI das séries completadas
    if (estadoRecuperado) {
        setTimeout(() => {
            restaurarSeriesCompletadas();
        }, 500);
    }
    
    // Atualizar informações do treino no template
    const workoutNameEl = document.getElementById('workout-name');
    const muscleGroupsEl = document.getElementById('muscle-groups');
    const currentWeekEl = document.getElementById('current-week');
    
    if (workoutNameEl && workout) {
        // Atualizar nome do treino
        const nomeTreino = workout.nome || `Treino ${workout.tipo || workout.grupo_muscular}`;
        workoutNameEl.textContent = nomeTreino;
    }
    
    if (muscleGroupsEl && exercises && exercises.length > 0) {
        // Coletar grupos musculares únicos dos exercícios
        const gruposSet = new Set();
        exercises.forEach(ex => {
            const grupo = ex.grupo_muscular || ex.exercicio_grupo;
            if (grupo) gruposSet.add(grupo);
        });
        
        // Se não houver grupos nos exercícios, usar o tipo do treino
        if (gruposSet.size === 0 && workout.tipo) {
            gruposSet.add(workout.tipo);
        }
        
        muscleGroupsEl.textContent = Array.from(gruposSet).join(', ');
    }
    
    // Atualizar número da semana se disponível
    if (currentWeekEl) {
        const semanaAtual = AppState.get('currentWeek') || 1;
        currentWeekEl.textContent = semanaAtual;
    }
    
    // Iniciar timer do treino
    startWorkoutTimer();
    
    // Recuperar execuções do cache se houver
    const execucoesCache = AppState.get('execucoesCache') || [];
    if (execucoesCache.length > 0) {
        console.log(`[iniciarTreino] Recuperando ${execucoesCache.length} execuções do cache`);
        showNotification(`Recuperadas ${execucoesCache.length} séries executadas`, 'info');
    }
    
    // Mostrar primeiro exercício
    await mostrarExercicioAtual();
    
    // Limpar listener de debug
    if (unsubscribe) unsubscribe();
}

// Timer do treino
function startWorkoutTimer() {
    let startTime = AppState.get('workoutStartTime');
    
    console.log('[startWorkoutTimer] Iniciando timer com startTime:', startTime);
    
    // Validar se startTime é válido
    if (!startTime || isNaN(startTime) || typeof startTime !== 'number') {
        console.warn('[startWorkoutTimer] startTime inválido:', startTime, 'tipo:', typeof startTime);
        startTime = Date.now();
        AppState.set('workoutStartTime', startTime);
        console.log('[startWorkoutTimer] Novo startTime definido:', startTime);
    }
    
    // Limpar timer anterior se existir
    const oldInterval = AppState.get('workoutTimerInterval');
    if (oldInterval) {
        clearInterval(oldInterval);
        console.log('[startWorkoutTimer] Timer anterior limpo');
    }
    
    const updateTimer = () => {
        try {
            const currentStartTime = AppState.get('workoutStartTime') || startTime;
            const now = Date.now();
            const elapsed = Math.floor((now - currentStartTime) / 1000);
            
            // Validação adicional
            if (isNaN(elapsed) || elapsed < 0) {
                console.error('[startWorkoutTimer] Elapsed time inválido:', elapsed, 'startTime:', currentStartTime, 'now:', now);
                return;
            }
            
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            // Tentar múltiplos seletores para encontrar o timer
            let timerDisplay = document.getElementById('workout-timer-display');
            if (!timerDisplay) {
                // Tentar selector alternativo
                timerDisplay = document.querySelector('#workout-timer-display');
            }
            
            if (!timerDisplay) {
                // Tentar encontrar em containers alternativos
                const workoutHeader = document.querySelector('.workout-header');
                if (workoutHeader) {
                    timerDisplay = workoutHeader.querySelector('#workout-timer-display');
                }
            }
            
            if (timerDisplay) {
                timerDisplay.textContent = timeString;
                // Remover flag de aviso se conseguiu atualizar
                delete updateTimer.warnedOnce;
            } else {
                // Só logar aviso na primeira vez
                if (!updateTimer.warnedOnce) {
                    console.warn('[startWorkoutTimer] Elemento workout-timer-display não encontrado');
                    console.warn('[startWorkoutTimer] Tentando novamente em 500ms...');
                    updateTimer.warnedOnce = true;
                    
                    // Tentar novamente após um delay
                    setTimeout(() => {
                        const retryDisplay = document.getElementById('workout-timer-display');
                        if (retryDisplay) {
                            retryDisplay.textContent = timeString;
                            console.log('[startWorkoutTimer] Timer encontrado na segunda tentativa');
                            delete updateTimer.warnedOnce;
                        }
                    }, 500);
                }
            }
            // Salvar tempo a cada 5 segundos
            if (elapsed % 5 === 0 && !isNaN(elapsed) && elapsed >= 0) {
                const dadosTempo = {
                    tempo: elapsed,
                    ultimaAtualizacao: Date.now()
                };
                localStorage.setItem('treino_tempo_temp', JSON.stringify(dadosTempo));
            }
        } catch (error) {
            console.error('[startWorkoutTimer] Erro ao atualizar timer:', error);
        }
    };
    
    // Aguardar DOM se necessário
    const startTimer = () => {
        // Atualizar imediatamente
        updateTimer();
        
        // Atualizar a cada segundo
        const interval = setInterval(updateTimer, 1000);
        AppState.set('workoutTimerInterval', interval);
        console.log('[startWorkoutTimer] Timer iniciado com intervalo:', interval);
    };
    
    // Verificar se o DOM está pronto
    if (document.readyState === 'loading') {
        console.log('[startWorkoutTimer] DOM ainda carregando, aguardando...');
        document.addEventListener('DOMContentLoaded', startTimer);
    } else {
        startTimer();
    }
}

// === Funções auxiliares ===
function iniciarTimerTreino() {
    try {
        const startTime = AppState.get('workoutStartTime') || Date.now();
        AppState.set('workoutStartTime', startTime);

        const update = () => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const min = String(Math.floor(elapsed / 60)).padStart(2, '0');
            const sec = String(elapsed % 60).padStart(2, '0');
            const displayEl = document.getElementById('workout-timer-display');
            if (displayEl) {
                displayEl.textContent = `${min}:${sec}`;
            }
        };

        update();
        timerManager.setInterval('workout_timer', update, 1000);
    } catch (err) {
        console.error('[iniciarTimerTreino] Erro:', err);
    }
}

async function iniciarNovoTreino() {
    console.log('[iniciarNovoTreino] Iniciando novo treino...');

    // Reiniciar índices de estado
    AppState.set('currentExerciseIndex', 0);
    AppState.set('completedSeries', 0);
    AppState.set('workoutStartTime', Date.now());

    // Garantir dados de treino
    let workout = AppState.get('currentWorkout');
    let exercises = AppState.get('currentExercises');
    if (!workout || !exercises || exercises.length === 0) {
        if (window.carregarDashboard) {
            await window.carregarDashboard();
            workout = AppState.get('currentWorkout');
            exercises = AppState.get('currentExercises');
        }
    }

    if (!workout || !exercises || exercises.length === 0) {
        showNotification('Nenhum treino disponível para hoje', 'warning');
        return;
    }

    // Navegar e iniciar UI
    mostrarTela('workout-screen');
    iniciarTimerTreino();
    mostrarExercicioAtual();
}

// Expor no window - SEMPRE registrar a versão completa
// Como workout.js é carregado primeiro (import estático em app.js), 
// esta será a versão definitiva
console.log('[workout.js] Registrando iniciarTreino (versão completa)');
window.iniciarTreino = iniciarTreino;

// Mostrar exercício atual
async function mostrarExercicioAtual() {
    console.log('[mostrarExercicioAtual] Iniciando...');
    
    const exercises = AppState.get('currentExercises');
    const currentIndex = AppState.get('currentExerciseIndex');
    const exercicio = exercises[currentIndex];
    
    console.log('[mostrarExercicioAtual] Dados:', {
        exercisesCount: exercises?.length,
        currentIndex,
        exercicio: exercicio?.exercicio_nome
    });
    
    if (!exercicio) {
        console.log('[mostrarExercicioAtual] Nenhum exercício encontrado, concluindo treino');
        mostrarTreinoConcluido();
        return;
    }
    
    try {
        // Buscar pesos sugeridos
        const currentUser = AppState.get('currentUser');
        console.log('[mostrarExercicioAtual] Carregando pesos sugeridos...');
        const { data: pesosSugeridos } = await carregarPesosSugeridos(
            currentUser.id,
            exercicio.protocolo_treino_id
        );
        
        console.log('[mostrarExercicioAtual] Pesos sugeridos carregados:', pesosSugeridos);
        
        // Atualizar progresso
        console.log('[mostrarExercicioAtual] Atualizando progresso...');
        atualizarProgresso();
        
        // Mostrar container do exercício
        console.log('[mostrarExercicioAtual] Mostrando container...');
        showExerciseContainer();
        
        // Atualizar informações do exercício
        console.log('[mostrarExercicioAtual] Atualizando informações...');
        atualizarInfoExercicio(exercicio, pesosSugeridos);
        
        // Buscar 1RM
        console.log('[mostrarExercicioAtual] Buscando 1RM...');
        const rm = await fetch1RMUsuario(currentUser.id, exercicio.exercicio_id);
        updateElement('rm-info', rm ? `${rm}kg` : '--');
        
        // Renderizar séries
        console.log('[mostrarExercicioAtual] Renderizando séries...');
        renderizarSeries(exercicio, pesosSugeridos);
        
        console.log('[mostrarExercicioAtual] Exercício renderizado com sucesso!');
        
    } catch (error) {
        console.error('[mostrarExercicioAtual] Erro:', error);
        showNotification('Erro ao carregar exercício', 'error');
        
        // Tentar renderizar sem pesos sugeridos
        atualizarProgresso();
        showExerciseContainer();
        atualizarInfoExercicio(exercicio, null);
        renderizarSeries(exercicio, null);
    }
}

// Atualizar barra de progresso
function atualizarProgresso() {
    const exercises = AppState.get('currentExercises');
    const currentIndex = AppState.get('currentExerciseIndex');
    
    const progress = (currentIndex / exercises.length) * 100;
    const progressBar = document.getElementById('workout-progress');
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }
    
    // Atualizar contadores no template
    updateElement('current-exercise-number', currentIndex + 1);
    updateElement('total-exercises', exercises.length);
}

// Mostrar container do exercício
function showExerciseContainer() {
    console.log('[showExerciseContainer] Iniciando...');
    
    const exerciseContainer = document.getElementById('exercises-container');
    const timerContainer = document.getElementById('rest-timer-overlay');
    const completedContainer = document.getElementById('workout-completion');
    
    console.log('[showExerciseContainer] Containers encontrados:', {
        exerciseContainer: !!exerciseContainer,
        timerContainer: !!timerContainer,
        completedContainer: !!completedContainer
    });
    
    if (exerciseContainer) {
        exerciseContainer.style.display = 'block';
        exerciseContainer.classList.remove('hidden');
        console.log('[showExerciseContainer] Container de exercícios mostrado');
    } else {
        console.error('[showExerciseContainer] Container exercises-container não encontrado!');
    }
    
    if (timerContainer) timerContainer.style.display = 'none';
    if (completedContainer) completedContainer.style.display = 'none';
}

// Atualizar informações do exercício
function atualizarInfoExercicio(exercicio, pesosSugeridos) {
    // Por enquanto, vamos apenas preparar os dados
    // A renderização será feita em renderizarSeries
    const exerciseData = {
        nome: exercicio.exercicio_nome,
        grupo: exercicio.exercicio_grupo,
        equipamento: exercicio.exercicio_equipamento,
        observacoes: exercicio.observacoes || '',
        pesosSugeridos: pesosSugeridos,
        intensidade: {
            min: exercicio.percentual_1rm_min || 70,
            max: exercicio.percentual_1rm_max || 80
        },
        descanso: exercicio.tempo_descanso
    };
    
    // Armazenar dados para uso posterior
    AppState.set('currentExerciseData', exerciseData);
}

// Renderizar séries
function renderizarSeries(exercicio, pesosSugeridos) {
    console.log('[renderizarSeries] Iniciando renderização...');
    
    const container = document.getElementById('exercises-container');
    if (!container) {
        console.error('[renderizarSeries] Container exercises-container não encontrado!');
        return;
    }
    
    console.log('[renderizarSeries] Container encontrado, limpando...');
    
    // Limpar container
    container.innerHTML = '';
    
    // Obter dados do exercício atual
    const exerciseData = AppState.get('currentExerciseData');
    const currentIndex = AppState.get('currentExerciseIndex');
    const exercises = AppState.get('currentExercises');
    
    console.log('[renderizarSeries] Dados do exercício:', {
        exercicio: exercicio?.exercicio_nome,
        currentIndex,
        totalExercises: exercises?.length,
        exerciseData: exerciseData
    });
    
    // Criar card do exercício
    const exerciseCard = document.createElement('div');
    exerciseCard.className = 'exercise-card active';
    exerciseCard.innerHTML = `
        <div class="exercise-header">
            <div class="exercise-number">${currentIndex + 1}</div>
            <div class="exercise-info">
                <h2 class="exercise-name">${exercicio.exercicio_nome}</h2>
                <div class="exercise-details">
                    <span class="exercise-muscle">${exercicio.exercicio_grupo}</span>
                    <span class="exercise-equipment">${exercicio.exercicio_equipamento}</span>
                </div>
            </div>
        </div>
        
        ${exerciseData.observacoes || (pesosSugeridos && (pesosSugeridos.peso_base || pesosSugeridos.peso_minimo)) ? `
        <div class="exercise-notes">
            ${exerciseData.observacoes ? `<p>${exerciseData.observacoes}</p>` : ''}
            ${pesosSugeridos && pesosSugeridos.peso_base > 0 ? `
                <div class="suggested-weights">
                    <strong>💪 Pesos Sugeridos:</strong>
                    <span>Base: ${pesosSugeridos.peso_base}kg</span>
                    <span>Min: ${pesosSugeridos.peso_minimo}kg</span>
                    <span>Max: ${pesosSugeridos.peso_maximo}kg</span>
                </div>
            ` : ''}
        </div>
        ` : ''}
        
        <div class="exercise-meta">
            <div class="meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <line x1="12" y1="8" x2="12" y2="16"/>
                    <line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
                <span>${exercicio.series} séries</span>
            </div>
            <div class="meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
                <span>${exercicio.repeticoes_alvo} reps</span>
            </div>
            <div class="meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                </svg>
                <span>${exercicio.tempo_descanso}s descanso</span>
            </div>
        </div>
        
        <div class="series-container" id="series-container-${currentIndex}">
            <!-- Séries serão adicionadas aqui -->
        </div>
        
        <div class="exercise-actions">
            <button class="btn-secondary" onclick="voltarExercicio()">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="15 18 9 12 15 6"/>
                </svg>
                <span>Anterior</span>
            </button>
            <button class="btn-primary" id="btn-proximo-exercicio-${currentIndex}" onclick="proximoExercicio()">
                <span>Próximo</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6"/>
                </svg>
            </button>
        </div>
    `;
    
    container.appendChild(exerciseCard);
    
    // Agora adicionar as séries no container correto
    const seriesContainer = document.getElementById(`series-container-${currentIndex}`);
    if (!seriesContainer) return;
    
    const pesoInicial = pesosSugeridos ? pesosSugeridos.peso_base : 0;
    
    // Buscar execuções do cache para este exercício
    const execucoesCache = AppState.get('execucoesCache') || [];
    const execucoesDoExercicio = execucoesCache.filter(e => 
        e.exercicio_id === exercicio.exercicio_id && 
        e.protocolo_treino_id === exercicio.protocolo_treino_id
    );
    
    for (let i = 0; i < exercicio.series; i++) {
        // Verificar se esta série já foi executada
        const serieExecutada = execucoesDoExercicio.find(e => e.serie_numero === i + 1);
        const serieDiv = document.createElement('div');
        serieDiv.className = `series-item ${serieExecutada ? 'completed' : ''}`;
        serieDiv.id = `serie-${i}`;
        
        if (serieExecutada) {
            // Série já executada - mostrar dados salvos
            serieDiv.innerHTML = `
                <div class="series-number">${i + 1}</div>
                
                <div class="series-input-group">
                    <div class="input-wrapper">
                        <button class="input-btn" disabled>-</button>
                        <input type="number" 
                               id="peso-${i}" 
                               class="series-input" 
                               value="${serieExecutada.peso_utilizado}"
                               disabled>
                        <button class="input-btn" disabled>+</button>
                    </div>
                    <span class="input-label">kg</span>
                </div>
                
                <div class="series-input-group">
                    <div class="input-wrapper">
                        <button class="input-btn" disabled>-</button>
                        <input type="number" 
                               id="rep-${i}" 
                               class="series-input" 
                               value="${serieExecutada.repeticoes_realizadas}"
                               disabled>
                        <button class="input-btn" disabled>+</button>
                    </div>
                    <span class="input-label">reps</span>
                </div>
                
                <button class="btn-confirm-series" disabled>
                    <div class="series-check">✓</div>
                </button>
            `;
        } else {
            // Série não executada - mostrar inputs normais
            serieDiv.innerHTML = `
            <div class="series-number">${i + 1}</div>
            
            <div class="series-input-group">
                <div class="input-wrapper">
                    <button class="input-btn" onclick="ajustarValor('peso-${i}', -2.5)">-</button>
                    <input type="number" 
                           id="peso-${i}" 
                           class="series-input ${pesoInicial > 0 ? 'suggested-value' : ''}" 
                           placeholder="${pesoInicial > 0 ? pesoInicial : '0'}" 
                           value="${pesoInicial}"
                           step="2.5">
                    <button class="input-btn" onclick="ajustarValor('peso-${i}', 2.5)">+</button>
                </div>
                <span class="input-label">kg</span>
            </div>
            
            <div class="series-input-group">
                <div class="input-wrapper">
                    <button class="input-btn" onclick="ajustarValor('rep-${i}', -1)">-</button>
                    <input type="number" 
                           id="rep-${i}" 
                           class="series-input suggested-value" 
                           placeholder="${exercicio.repeticoes_alvo}" 
                           value="${exercicio.repeticoes_alvo}"
                           step="1">
                    <button class="input-btn" onclick="ajustarValor('rep-${i}', 1)">+</button>
                </div>
                <span class="input-label">reps</span>
            </div>
            
            <button class="btn-confirm-series" onclick="confirmarSerie(${i})">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
            </button>
            `;
        }
        
        seriesContainer.appendChild(serieDiv);
    }
    
    // Adicionar event listeners para remover estilo de sugestão ao interagir
    const allInputs = seriesContainer.querySelectorAll('.series-input:not(:disabled)');
    allInputs.forEach(input => {
        input.addEventListener('input', function() {
            this.classList.remove('suggested-value');
        });
        input.addEventListener('focus', function() {
            if (this.classList.contains('suggested-value')) {
                this.select(); // Selecionar todo o texto ao focar em campo sugerido
            }
        });
    });
    
    // Atualizar contador de séries completadas
    const seriesCompletadas = execucoesDoExercicio.length;
    AppState.set('completedSeries', seriesCompletadas);
    
    console.log('[renderizarSeries] Séries renderizadas:', {
        totalSeries: exercicio.series,
        seriesCompletadas,
        containerHtml: container.innerHTML.length
    });
    
    // Atualizar estado do botão próximo após renderizar
    setTimeout(() => {
        atualizarBotaoProximo();
    }, 100);
    
    console.log('[renderizarSeries] Renderização completa!');
}

// Ajustar valor dos inputs
window.ajustarValor = function(inputId, delta) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const currentValue = parseFloat(input.value) || 0;
    const newValue = Math.max(0, currentValue + delta);
    input.value = newValue;
    
    // Remover classe de sugestão quando o usuário interagir
    input.classList.remove('suggested-value');
};

// Confirmar série
window.confirmarSerie = async function(serieIndex) {
    const exercises = AppState.get('currentExercises');
    const currentIndex = AppState.get('currentExerciseIndex');
    const exercicio = exercises[currentIndex];
    const currentUser = AppState.get('currentUser');
    const workout = AppState.get('currentWorkout');
    
    const peso = parseFloat(document.getElementById(`peso-${serieIndex}`).value);
    const reps = parseInt(document.getElementById(`rep-${serieIndex}`).value);
    
    if (!peso || !reps) {
        showNotification('Preencha peso e repetições', 'error');
        return;
    }
    
    // IMPORTANTE: Salvar APENAS no cache local, NÃO no Supabase ainda
    const dados = {
        usuario_id: currentUser.id,
        protocolo_treino_id: exercicio.protocolo_treino_id || workout.id,
        exercicio_id: exercicio.exercicio_id,
        serie_numero: serieIndex + 1,
        peso_utilizado: peso,
        repeticoes_realizadas: reps,
        data_execucao: new Date().toISOString(),
        // REMOVIDO tempo_descanso - não existe na tabela execucao_exercicio_usuario
        // O tempo de descanso está disponível em exercicio.tempo_descanso quando necessário
        // ID temporário para debug
        _tempId: `${exercicio.exercicio_id}_${serieIndex + 1}_${Date.now()}`
    };
    
    console.log('[confirmarSerie] Salvando série:', dados);
    
    // Adicionar ao cache local ao invés de salvar no Supabase
    const execucoesCache = AppState.get('execucoesCache') || [];
    execucoesCache.push(dados);
    AppState.set('execucoesCache', execucoesCache);
    
    // CRÍTICO: Garantir salvamento antes de continuar
    try {
        // Primeiro, garantir que o estado está atualizado no AppState
        AppState.set('execucoesCache', execucoesCache);
        
        // Validar dados críticos antes de salvar
        const currentWorkout = AppState.get('currentWorkout');
        const currentExercises = AppState.get('currentExercises');
        
        if (!currentWorkout || !currentExercises) {
            console.warn('[confirmarSerie] Estado de treino incompleto, forçando salvamento básico');
            // Salvar pelo menos as execuções no localStorage
            localStorage.setItem('treino_execucoes_temp', JSON.stringify(execucoesCache));
            localStorage.setItem('treino_execucoes_backup', JSON.stringify({
                execucoes: execucoesCache,
                timestamp: Date.now()
            }));
        } else {
            // Salvar estado completo
            const estadoCompleto = {
                execucoes: execucoesCache,
                estadoAtual: {
                    currentExerciseIndex: AppState.get('currentExerciseIndex') || 0,
                    completedSeries: AppState.get('completedSeries') || 0,
                    currentWorkout: currentWorkout,
                    currentExercises: currentExercises,
                    currentUser: AppState.get('currentUser')
                },
                cronometro: {
                    workoutStartTime: AppState.get('workoutStartTime'),
                    restTime: AppState.get('restTime') || 0
                },
                timestamp: Date.now()
            };
            
            // Tentar salvar pelo workoutStateManager
            try {
                const salvouNoCache = workoutStateManager.saveStateImmediate(estadoCompleto);
                console.log('[confirmarSerie] Resultado do salvamento:', salvouNoCache);
            } catch (saveError) {
                console.error('[confirmarSerie] Erro no saveStateImmediate:', saveError);
                // Fallback para salvamento manual
                localStorage.setItem('treino_unified_state', JSON.stringify(estadoCompleto));
                localStorage.setItem('treino_execucoes_temp', JSON.stringify(execucoesCache));
            }
        }
        
        // Usar o WorkoutStateManager para salvar com throttle (sempre executar)
        if (workoutStateManager && workoutStateManager.onSerieConfirmada) {
            workoutStateManager.onSerieConfirmada(dados);
        }
        
        // Dados salvos no cache local - sync será feito na finalização do treino
        console.log('[confirmarSerie] Dados salvos no cache local, sync na finalização');
        
        // Registrar analytics
        workoutAnalytics.logSerieCompletada(dados);
        
        console.log(`[workout] Série ${serieIndex + 1} salva com segurança. Total: ${execucoesCache.length} execuções`);
    
    // Marcar série como completa
    const serieItem = document.getElementById(`serie-${serieIndex}`);
    serieItem.classList.add('completed');
    
    // Desabilitar inputs
    document.getElementById(`peso-${serieIndex}`).disabled = true;
    document.getElementById(`rep-${serieIndex}`).disabled = true;
    
    // Trocar botão para check
    const confirmBtn = serieItem.querySelector('.btn-confirm-series');
    confirmBtn.innerHTML = '<div class="series-check">✓</div>';
    confirmBtn.disabled = true;
    
    // Incrementar contador de séries
    const completedSeries = AppState.get('completedSeries') + 1;
    AppState.set('completedSeries', completedSeries);
    
    // Atualizar visual do botão próximo baseado no progresso
    atualizarBotaoProximo();
    
    // Mostrar cronômetro de descanso se não for a última série do exercício
    const currentExerciseIndex = AppState.get('currentExerciseIndex');
    const seriesDoExercicio = document.querySelectorAll(`#series-container-${currentExerciseIndex} .series-item`).length;
    const seriesCompletadasDoExercicio = document.querySelectorAll(`#series-container-${currentExerciseIndex} .series-item.completed`).length;
    
    console.log('[confirmarSerie] Verificando descanso - séries completadas:', seriesCompletadasDoExercicio, 'de', seriesDoExercicio);
    
    if (seriesCompletadasDoExercicio < seriesDoExercicio) {
        // Calcular tempo médio de descanso das execuções anteriores
        const execucoesCache = AppState.get('execucoesCache') || [];
        const temposDescanso = execucoesCache
            .filter(e => e.tempo_descanso && e.tempo_descanso > 0)
            .map(e => e.tempo_descanso);
        
        let tempoDescanso;
        if (temposDescanso.length > 0) {
            // Usar média dos tempos anteriores
            const soma = temposDescanso.reduce((a, b) => a + b, 0);
            tempoDescanso = Math.round(soma / temposDescanso.length);
            console.log('[confirmarSerie] Usando tempo médio de descanso:', tempoDescanso);
        } else {
            // Usar tempo sugerido ou default
            tempoDescanso = exercicio.tempo_descanso || 60;
            console.log('[confirmarSerie] Usando tempo padrão de descanso:', tempoDescanso);
        }
        
        console.log('[confirmarSerie] Mostrando cronômetro de descanso por', tempoDescanso, 'segundos');
        mostrarCronometroDescanso(tempoDescanso);
    } else {
        console.log('[confirmarSerie] Última série do exercício - não mostrando cronômetro');
    }
    
    // Verificar se completou todas as séries
    if (completedSeries === exercicio.series) {
        // Resetar contador para próximo exercício
        AppState.set('completedSeries', 0);
        
        // AGUARDAR FRAME PARA GARANTIR UI ATUALIZADA antes de prosseguir
        await new Promise(resolve => requestAnimationFrame(resolve));
        
        // Se for o último exercício, mostrar conclusão
        if (currentIndex === exercises.length - 1) {
            setTimeout(() => {
                mostrarTreinoConcluido();
            }, 500);
        } else {
            // Senão, iniciar descanso
            setTimeout(() => {
                iniciarDescanso();
            }, 500);
        }
    }
    
    } catch (error) {
        console.error('[confirmarSerie] Erro crítico ao salvar série:', error);
        showNotification('Erro ao salvar série. Tente novamente.', 'error');
        
        // Reverter mudanças visuais se houve erro
        const serieItem = document.getElementById(`serie-${serieIndex}`);
        serieItem?.classList.remove('completed');
        
        // Reabilitar inputs
        const pesoInput = document.getElementById(`peso-${serieIndex}`);
        const repInput = document.getElementById(`rep-${serieIndex}`);
        if (pesoInput) pesoInput.disabled = false;
        if (repInput) repInput.disabled = false;
        
        // Restaurar botão
        const confirmBtn = serieItem?.querySelector('.btn-confirm-series');
        if (confirmBtn) {
            confirmBtn.innerHTML = 'Confirmar';
            confirmBtn.disabled = false;
        }
        
        // Não prosseguir se houve erro crítico
        return false;
    }
};

// Iniciar descanso
function iniciarDescanso() {
    const exercises = AppState.get('currentExercises');
    const currentIndex = AppState.get('currentExerciseIndex');
    const exercicio = exercises[currentIndex];
    const tempoDescanso = exercicio.tempo_descanso || 60;
    
    // Ocultar container do exercício e mostrar timer
    const exerciseContainer = document.getElementById('exercises-container');
    if (exerciseContainer) exerciseContainer.style.display = 'none';
    
    const timerModal = document.getElementById('rest-timer-overlay');
    if (timerModal) timerModal.style.display = 'flex';
    
    // Configurar timer
    AppState.set('restTime', tempoDescanso);
    const interval = setInterval(atualizarTimer, 1000);
    AppState.set('timerInterval', interval);
    
    atualizarTimer();
}

// Atualizar timer
function atualizarTimer() {
    const restTime = AppState.get('restTime');
    
    if (restTime <= 0) {
        const interval = AppState.get('timerInterval');
        clearInterval(interval);
        AppState.set('timerInterval', null);
        
        const timerModal = document.getElementById('rest-timer-overlay');
        if (timerModal) timerModal.style.display = 'none';
        proximoExercicio();
        return;
    }
    
    const minutos = Math.floor(restTime / 60);
    const segundos = restTime % 60;
    const tempoFormatado = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
    
    // Atualizar texto do timer
    updateElement('rest-timer-display', tempoFormatado);
    
    // Atualizar barra de progresso
    const exercises = AppState.get('currentExercises');
    const currentIndex = AppState.get('currentExerciseIndex');
    const exercicio = exercises[currentIndex];
    const tempoTotal = exercicio.tempo_descanso || 60;
    const progresso = ((tempoTotal - restTime) / tempoTotal) * 100;
    
    const progressBar = document.getElementById('modal-timer-progress');
    if (progressBar) {
        progressBar.style.width = `${progresso}%`;
    }
    
    AppState.set('restTime', restTime - 1);
}

// REMOVIDO: Função pularDescanso duplicada - usar a versão correta mais abaixo

// Próximo exercício
function proximoExercicio() {
    console.log('[proximoExercicio] Avançando para próximo exercício...');
    
    const exercises = AppState.get('currentExercises');
    const currentIndex = AppState.get('currentExerciseIndex');
    const novoIndex = currentIndex + 1;
    
    // Verificar se todas as séries foram completadas
    const currentExercise = exercises[currentIndex];
    if (currentExercise) {
        const totalSeries = currentExercise.series || 0;
        const seriesCompletadas = document.querySelectorAll(`#series-container-${currentIndex} .series-item.completed`).length;
        
        if (seriesCompletadas < totalSeries) {
            showNotification(`Complete todas as séries antes de avançar (${seriesCompletadas}/${totalSeries} concluídas)`, 'warning');
            return;
        }
    }
    
    // Verificar se há próximo exercício
    if (novoIndex >= exercises.length) {
        console.log('[proximoExercicio] Não há mais exercícios, mostrando conclusão');
        mostrarTreinoConcluido();
        return;
    }
    
    // 1. SALVAR ESTADO ANTES DE AVANÇAR (crítico para não perder progresso)
    workoutStateManager.saveStateImmediate();
    
    // 2. OBTER TEMPO DE DESCANSO DO EXERCÍCIO ATUAL
    const exercicioAtual = exercises[currentIndex];
    const tempoDescansoEntreExercicios = exercicioAtual.tempo_descanso || 60; // Padrão 60 segundos
    
    console.log(`[proximoExercicio] Iniciando descanso de ${tempoDescansoEntreExercicios}s entre exercícios`);
    
    // 3. MOSTRAR TELA DE DESCANSO ENTRE EXERCÍCIOS
    mostrarDescansoEntreExercicios(tempoDescansoEntreExercicios, () => {
        // Callback executado após o descanso ou quando o usuário pular
        console.log('[proximoExercicio] Descanso concluído, carregando próximo exercício');
        
        // MOSTRAR LOADING/SPINNER
        const exerciseContainer = document.getElementById('exercises-container');
        if (exerciseContainer) {
            exerciseContainer.innerHTML = `
                <div class="exercise-loading">
                    <div class="loading-spinner"></div>
                    <p>Carregando próximo exercício...</p>
                </div>
            `;
            exerciseContainer.style.display = 'block';
        }
        
        // RESETAR TODOS OS ESTADOS DA UI
        resetarEstadosUI();
        
        // REMOVER OVERLAYS
        const restOverlay = document.getElementById('rest-timer-overlay');
        if (restOverlay) {
            restOverlay.style.display = 'none';
        }
        
        // Limpar timer se existir
        const timerInterval = AppState.get('restTimerInterval');
        if (timerInterval) {
            clearInterval(timerInterval);
            AppState.set('restTimerInterval', null);
        }
        
        // ATUALIZAR ÍNDICE E ESTADO
        AppState.set('currentExerciseIndex', novoIndex);
        AppState.set('completedSeries', 0);
        
        // CARREGAR PRÓXIMO EXERCÍCIO COM DELAY PARA GARANTIR UI RESPONSIVA
        setTimeout(async () => {
            try {
                // Carregar pesos sugeridos para o novo exercício
                const proximoExercicio = exercises[novoIndex];
                if (proximoExercicio) {
                    const currentUser = AppState.get('currentUser');
                    const { data: pesosSugeridos } = await carregarPesosSugeridos(
                        currentUser.id,
                        proximoExercicio.protocolo_treino_id
                    );
                    
                    // Salvar pesos sugeridos no estado
                    if (pesosSugeridos) {
                        AppState.set('pesosSugeridos', pesosSugeridos);
                    }
                }
                
                // Mostrar novo exercício
                mostrarExercicioAtual();
                
                // Salvar estado após mudança completa
                workoutStateManager.onExercicioMudou(novoIndex);
                
                // Rolar para o topo suavemente
                window.scrollTo({ top: 0, behavior: 'smooth' });
                
                console.log(`[proximoExercicio] Avançado para exercício ${novoIndex + 1} de ${exercises.length}`);
                
            } catch (error) {
                console.error('[proximoExercicio] Erro ao carregar exercício:', error);
                showNotification('Erro ao carregar exercício', 'error');
                
                // Em caso de erro, ainda mostrar o exercício sem pesos sugeridos
                mostrarExercicioAtual();
            }
        }, 100); // Pequeno delay para garantir que o spinner seja visível
    }); // Fim do callback de descanso
}

// Mostrar descanso entre exercícios com UI personalizada
function mostrarDescansoEntreExercicios(tempoDescanso, onComplete) {
    console.log(`[mostrarDescansoEntreExercicios] Iniciando descanso de ${tempoDescanso}s entre exercícios`);
    
    // Obter informações dos exercícios
    const exercises = AppState.get('currentExercises');
    const currentIndex = AppState.get('currentExerciseIndex');
    const nextIndex = currentIndex + 1;
    
    const exercicioAtual = exercises[currentIndex];
    const proximoExercicio = exercises[nextIndex];
    
    // Usar o overlay existente mas personalizar o conteúdo
    const overlay = document.getElementById('rest-timer-overlay');
    if (!overlay) {
        console.error('[mostrarDescansoEntreExercicios] Overlay não encontrado');
        onComplete(); // Executar callback mesmo sem overlay
        return;
    }
    
    // Personalizar overlay para descanso entre exercícios
    overlay.innerHTML = `
        <div class="rest-timer-content">
            <div class="exercise-transition-header">
                <h2>Exercício Concluído!</h2>
                <div class="exercise-info">
                    <div class="completed-exercise">
                        <span class="exercise-label">Concluído:</span>
                        <span class="exercise-name">${exercicioAtual.nome}</span>
                    </div>
                    <div class="arrow-down">↓</div>
                    <div class="next-exercise">
                        <span class="exercise-label">Próximo:</span>
                        <span class="exercise-name">${proximoExercicio.nome}</span>
                    </div>
                </div>
            </div>
            
            <div class="rest-timer-circle">
                <svg class="rest-progress" width="240" height="240">
                    <circle cx="120" cy="120" r="110" fill="none" stroke="#e2e8f0" stroke-width="8"/>
                    <circle cx="120" cy="120" r="110" fill="none" stroke="#4f46e5" stroke-width="8" 
                            class="rest-progress-fill" stroke-linecap="round" 
                            transform="rotate(-90 120 120)"/>
                </svg>
                <div class="rest-timer-text">
                    <span id="rest-timer-display" class="rest-time">00:00</span>
                    <span class="rest-label">descanso</span>
                </div>
            </div>
            
            <div class="rest-timer-actions">
                <button id="skip-rest" class="btn-rest-skip">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="5 4 15 12 5 20 5 4"/>
                        <line x1="19" y1="5" x2="19" y2="19"/>
                    </svg>
                    <span>Pular Descanso</span>
                </button>
            </div>
            
            <div class="rest-motivation">
                <p id="motivation-text">"Prepare-se para o próximo exercício! Respire fundo e mantenha o foco."</p>
            </div>
        </div>
    `;
    
    // Mostrar overlay
    overlay.style.display = 'flex';
    
    // Configurar timer
    let tempoRestante = tempoDescanso;
    let timerInterval;
    
    // Salvar estado do cronômetro
    AppState.set('restTime', tempoRestante);
    AppState.set('isExerciseTransition', true); // Flag para identificar transição
    workoutStateManager.onCronometroIniciado(tempoRestante);
    
    // Configurar elementos
    const timerDisplay = document.getElementById('rest-timer-display');
    const progressCircle = overlay.querySelector('.rest-progress-fill');
    const skipButton = document.getElementById('skip-rest');
    
    if (!timerDisplay || !progressCircle) {
        console.error('[mostrarDescansoEntreExercicios] Elementos do timer não encontrados');
        onComplete();
        return;
    }
    
    // Calcular circunferência do círculo
    const radius = 110;
    const circumference = 2 * Math.PI * radius;
    progressCircle.style.strokeDasharray = circumference;
    
    // Função para formatar tempo
    function formatarTempo(segundos) {
        const mins = Math.floor(segundos / 60);
        const secs = segundos % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    // Função para atualizar progresso
    function updateProgress() {
        const progress = tempoRestante / tempoDescanso;
        const offset = circumference * (1 - progress);
        progressCircle.style.strokeDashoffset = offset;
    }
    
    // Função para finalizar descanso
    function finalizarDescanso() {
        console.log('[mostrarDescansoEntreExercicios] Finalizando descanso entre exercícios');
        
        // Limpar timer
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        
        // Esconder overlay
        overlay.style.display = 'none';
        
        // Limpar estado
        AppState.set('restTime', 0);
        AppState.set('isExerciseTransition', false);
        AppState.set('restTimerInterval', null);
        
        // Executar callback
        if (onComplete) {
            onComplete();
        }
    }
    
    // Configurar botão de pular
    if (skipButton) {
        skipButton.onclick = finalizarDescanso;
    }
    
    // Iniciar timer
    timerDisplay.textContent = formatarTempo(tempoRestante);
    updateProgress();
    
    timerInterval = setInterval(() => {
        tempoRestante--;
        
        if (timerDisplay) {
            timerDisplay.textContent = formatarTempo(tempoRestante);
        }
        updateProgress();
        
        // Atualizar estado
        AppState.set('restTime', tempoRestante);
        
        if (tempoRestante <= 0) {
            finalizarDescanso();
            
            // Tocar som ou vibrar se disponível
            if ('vibrate' in navigator) {
                navigator.vibrate([200, 100, 200]);
            }
        }
    }, 1000);
    
    // Salvar referência do timer
    AppState.set('restTimerInterval', timerInterval);
}

// Função auxiliar para resetar estados da UI
function resetarEstadosUI() {
    // Resetar indicadores de falha
    AppState.set('seriesFalhadas', []);
    
    // Resetar dropsets se existirem
    AppState.set('dropsetsAtivos', false);
    AppState.set('dropsetConfig', null);
    
    // Resetar temporizadores
    AppState.set('restTime', null);
    
    // Resetar contadores visuais
    const seriesCompletadas = document.querySelectorAll('.serie-row.completed');
    seriesCompletadas.forEach(serie => {
        serie.classList.remove('completed', 'failed');
    });
    
    // Resetar inputs de séries anteriores
    const inputs = document.querySelectorAll('.series-input');
    inputs.forEach(input => {
        input.value = '';
        input.disabled = false;
    });
    
    // Resetar botões de confirmação
    const confirmButtons = document.querySelectorAll('.btn-confirm-series');
    confirmButtons.forEach(btn => {
        btn.disabled = false;
        btn.innerHTML = '<svg>...</svg>'; // Restaurar ícone original
    });
    
    console.log('[resetarEstadosUI] Estados da UI resetados');
}

// Voltar exercício
window.voltarExercicio = function() {
    const currentIndex = AppState.get('currentExerciseIndex');
    if (currentIndex > 0) {
        // Salvar estado antes de voltar
        workoutStateManager.saveStateImmediate();
        
        // Mostrar loading
        const exerciseContainer = document.getElementById('exercises-container');
        if (exerciseContainer) {
            exerciseContainer.innerHTML = `
                <div class="exercise-loading">
                    <div class="loading-spinner"></div>
                    <p>Carregando exercício anterior...</p>
                </div>
            `;
        }
        
        // Resetar estados da UI
        resetarEstadosUI();
        
        // Atualizar índice
        AppState.set('currentExerciseIndex', currentIndex - 1);
        AppState.set('completedSeries', 0);
        
        // Carregar exercício anterior com delay
        setTimeout(() => {
            mostrarExercicioAtual();
            workoutStateManager.onExercicioMudou(currentIndex - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
    } else {
        showNotification('Este é o primeiro exercício', 'info');
    }
};

// Expor próximo exercício globalmente
window.proximoExercicio = proximoExercicio;

// Expor voltarParaHome globalmente
window.voltarParaHome = voltarParaHome;

// Mostrar treino concluído
function mostrarTreinoConcluido() {
    // Ocultar containers
    const exerciseContainer = document.getElementById('exercises-container');
    if (exerciseContainer) exerciseContainer.style.display = 'none';
    
    const timerContainer = document.getElementById('rest-timer-overlay');
    if (timerContainer) timerContainer.style.display = 'none';
    
    // Calcular tempo total
    const startTime = AppState.get('workoutStartTime');
    const tempoTotal = Math.floor((Date.now() - startTime) / 1000);
    const minutos = Math.floor(tempoTotal / 60);
    const segundos = tempoTotal % 60;
    
    // Preparar resumo
    const exercises = AppState.get('currentExercises');
    const workout = AppState.get('currentWorkout');
    
    const resumoContent = `
        <div class="summary-item">
            <span>Tempo Total:</span>
            <strong>${minutos}m ${segundos}s</strong>
        </div>
        <div class="summary-item">
            <span>Exercícios Completados:</span>
            <strong>${exercises.length}</strong>
        </div>
        <div class="summary-item">
            <span>Treino:</span>
            <strong>${workout.nome || 'Treino'}</strong>
        </div>
    `;
    
    const summaryEl = document.getElementById('workout-summary-content');
    if (summaryEl) {
        summaryEl.innerHTML = resumoContent;
    }
    
    // Mostrar modal de conclusão
    const modal = document.getElementById('workout-completion');
    if (modal) {
        modal.style.display = 'flex';
    }
    
    // Atualizar progress bar para 100%
    const progressBar = document.getElementById('workout-progress');
    if (progressBar) {
        progressBar.style.width = '100%';
    }
}

// Finalizar treino
window.finalizarTreino = async function() {
    let loadingNotification = null;
    
    try {
        const currentUser = AppState.get('currentUser');
        
        if (!currentUser) {
            showNotification('Erro: usuário não identificado', 'error');
            return;
        }
        
        // IMPORTANTE: Enviar todas as execuções do cache para o Supabase
        const execucoesCache = AppState.get('execucoesCache') || [];
        
        console.log('[finalizarTreino] 📊 Debug - Estado do cache:', {
            quantidade: execucoesCache.length,
            execucoes: execucoesCache
        });
        
        if (execucoesCache.length > 0) {
            // Mostrar notificação de loading persistente
            loadingNotification = showNotification('Salvando treino...', 'info', true);
            
            console.log(`[finalizarTreino] Enviando ${execucoesCache.length} execuções em lote...`);
            
            // Verificar se está online
            if (!navigator.onLine) {
                // Se offline, adicionar à fila de sincronização
                await offlineSyncService.addToSyncQueue(execucoesCache, 'execucoes');
                
                // Remover notificação de loading
                if (loadingNotification && loadingNotification.remove) {
                    loadingNotification.remove();
                }
                
                showNotification(
                    'Sem conexão. Treino salvo localmente e será sincronizado quando voltar online.',
                    'warning',
                    true
                );
                
                // Continuar com fluxo normal (limpar cache local)
            } else {
                // Se online, tentar salvar normalmente
                const resultado = await salvarExecucoesEmLote(execucoesCache);
                
                // Remover notificação de loading
                if (loadingNotification && loadingNotification.remove) {
                    loadingNotification.remove();
                }
                
                if (!resultado.sucesso) {
                    console.error('[finalizarTreino] ❌ Erro ao salvar execuções:', resultado.erros);
                    
                    // Adicionar à fila offline para retry
                    await offlineSyncService.addToSyncQueue(execucoesCache, 'execucoes');
                    
                    const errorBanner = showNotification(
                        `Erro ao salvar. Dados salvos localmente. <button onclick="tentarNovamenteSalvar()" class="btn-retry">Tentar Novamente</button>`,
                        'error',
                        true
                    );
                    
                    window.errorBanner = errorBanner;
                    
                    // Continuar com fluxo para não bloquear usuário
                } else {
                    console.log(`[finalizarTreino] ✅ ${resultado.salvos} execuções salvas com sucesso`);
                }
            }
            
            // Limpar cache após processamento (sucesso ou erro tratado)
            AppState.set('execucoesCache', []);
            workoutStateManager.limparTudo();
        }
        
        // Marcar treino como concluído
        const workout = AppState.get('currentWorkout');
        if (workout) {
            await marcarTreinoConcluido(currentUser.id, workout.id);
        }
        
        // Fechar modal
        const modal = document.getElementById('workout-complete-modal');
        if (modal) {
            modal.style.display = 'none';
        }
        
        // Parar timer do treino
        const timerInterval = AppState.get('workoutTimerInterval');
        if (timerInterval) {
            clearInterval(timerInterval);
            AppState.set('workoutTimerInterval', null);
        }
        
        // Registrar analytics de finalização
        const resumo = {
            exerciciosCompletados: exercises.length,
            seriesCompletadas: execucoesCache.length,
            pesoTotal: execucoesCache.reduce((total, exec) => 
                total + (exec.peso_utilizado * exec.repeticoes_realizadas), 0
            )
        };
        workoutAnalytics.logTreinoFinalizado(resumo);
        
        // Resetar estado do treino
        AppState.resetWorkout();
        
        // Voltar para home
        voltarParaHome();
        
        // Recarregar dashboard
        if (window.carregarDashboard) {
            await window.carregarDashboard();
        }
        
        showNotification('Treino finalizado e salvo com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao finalizar treino:', error);
        
        // Remover loading se ainda existir
        if (loadingNotification && loadingNotification.remove) {
            loadingNotification.remove();
        }
        
        // Mostrar erro com opção de retry
        const errorBanner = showNotification(
            `Erro ao finalizar treino: ${error.message}. <button onclick="tentarNovamenteSalvar()" class="btn-retry">Tentar Novamente</button>`,
            'error',
            true
        );
        window.errorBanner = errorBanner;
    } finally {
        // Garantir que loading seja removido
        if (loadingNotification && loadingNotification.remove) {
            loadingNotification.remove();
        }
    }
};

// Função para tentar salvar novamente
window.tentarNovamenteSalvar = async function() {
    // Remover banner de erro anterior
    if (window.errorBanner && window.errorBanner.remove) {
        window.errorBanner.remove();
    }
    
    // Tentar finalizar novamente
    await window.finalizarTreino();
};

// Mostrar cronômetro de descanso
function mostrarCronometroDescanso(tempoDescanso) {
    // Usar o overlay existente no template
    const overlay = document.getElementById('rest-timer-overlay');
    if (!overlay) {
        console.error('[mostrarCronometroDescanso] Overlay não encontrado no DOM');
        return;
    }
    
    // Mostrar overlay
    overlay.style.display = 'flex';
    
    // Aguardar DOM estar pronto e então configurar timer
    setTimeout(() => {
        const timerDisplay = document.getElementById('rest-timer-display');
        const progressCircle = overlay.querySelector('.rest-progress-fill');
        
        // Verificar se os elementos foram encontrados
        if (!timerDisplay || !progressCircle) {
            console.error('[mostrarCronometroDescanso] Elementos do timer não encontrados');
            return;
        }
        
        // Configurar timer
        let tempoRestante = tempoDescanso;
        
        // Salvar estado do cronômetro
        AppState.set('restTime', tempoRestante);
        workoutStateManager.onCronometroIniciado(tempoRestante);
        
        // Calcular circunferência do círculo (raio 110 para o novo tamanho)
        const radius = 110;
        const circumference = 2 * Math.PI * radius;
        progressCircle.style.strokeDasharray = circumference;
        
        // Função para atualizar o progresso
        function updateProgress() {
            const progress = tempoRestante / tempoDescanso;
            const offset = circumference * (1 - progress);
            progressCircle.style.strokeDashoffset = offset;
        }
        
        // Iniciar animação
        updateProgress();
        
        // Função para formatar tempo
        function formatarTempo(segundos) {
            const mins = Math.floor(segundos / 60);
            const secs = segundos % 60;
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        
        // Exibir tempo inicial
        timerDisplay.textContent = formatarTempo(tempoRestante);
        
        // Intervalo do timer
        const timerInterval = setInterval(() => {
            tempoRestante--;
            if (timerDisplay) {
                timerDisplay.textContent = formatarTempo(tempoRestante);
            }
            updateProgress();
            
            if (tempoRestante <= 0) {
                clearInterval(timerInterval);
                fecharCronometroDescanso();
                // Tocar som ou vibrar se disponível
                if ('vibrate' in navigator) {
                    navigator.vibrate(200);
                }
            }
        }, 1000);
        
        // Salvar intervalo para poder cancelar
        AppState.set('restTimerInterval', timerInterval);
        
        // Adicionar event listener ao botão de pular
        const skipButton = document.getElementById('skip-rest');
        if (skipButton) {
            skipButton.onclick = window.pularDescanso;
        }
    }, 50); // Aguardar 50ms para garantir que o DOM está pronto
}

// Pular descanso
window.pularDescanso = function() {
    const timerInterval = AppState.get('restTimerInterval');
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    fecharCronometroDescanso();
};

// Fechar cronômetro de descanso
function fecharCronometroDescanso() {
    const overlay = document.getElementById('rest-timer-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
    AppState.set('restTimerInterval', null);
}

// Função auxiliar para atualizar elementos
function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

// Atualizar estado visual do botão próximo
function atualizarBotaoProximo() {
    const currentIndex = AppState.get('currentExerciseIndex');
    const exercises = AppState.get('currentExercises');
    const currentExercise = exercises[currentIndex];
    
    if (!currentExercise) return;
    
    const btnProximo = document.getElementById(`btn-proximo-exercicio-${currentIndex}`);
    if (!btnProximo) return;
    
    const totalSeries = currentExercise.series || 0;
    const seriesCompletadas = document.querySelectorAll(`#series-container-${currentIndex} .series-item.completed`).length;
    
    if (seriesCompletadas < totalSeries) {
        // Desabilitar visualmente o botão
        btnProximo.classList.add('btn-disabled');
        btnProximo.style.opacity = '0.5';
        btnProximo.style.cursor = 'not-allowed';
        btnProximo.title = `Complete todas as séries (${seriesCompletadas}/${totalSeries})`;
    } else {
        // Habilitar o botão
        btnProximo.classList.remove('btn-disabled');
        btnProximo.style.opacity = '1';
        btnProximo.style.cursor = 'pointer';
        btnProximo.title = 'Ir para o próximo exercício';
    }
}

// Restaurar visualmente as séries já completadas
function restaurarSeriesCompletadas() {
    console.log('[restaurarSeriesCompletadas] Iniciando restauração visual...');
    
    const execucoesCache = AppState.get('execucoesCache') || [];
    const currentExerciseIndex = AppState.get('currentExerciseIndex') || 0;
    const exercises = AppState.get('currentExercises') || [];
    
    if (!exercises.length) {
        console.log('[restaurarSeriesCompletadas] Sem exercícios para restaurar');
        return;
    }
    
    // Agrupar execuções por exercício
    const execucoesPorExercicio = {};
    execucoesCache.forEach(exec => {
        if (!execucoesPorExercicio[exec.exercicio_id]) {
            execucoesPorExercicio[exec.exercicio_id] = [];
        }
        execucoesPorExercicio[exec.exercicio_id].push(exec);
    });
    
    console.log('[restaurarSeriesCompletadas] Execuções agrupadas:', execucoesPorExercicio);
    
    // Para cada exercício com execuções, marcar séries como completadas
    Object.keys(execucoesPorExercicio).forEach(exercicioId => {
        const execucoesDoExercicio = execucoesPorExercicio[exercicioId];
        
        execucoesDoExercicio.forEach(exec => {
            const serieIndex = exec.serie_numero - 1;
            const serieRow = document.querySelector(`#serie-${serieIndex}`);
            
            if (serieRow) {
                // Marcar como completada
                serieRow.classList.add('completed');
                
                // Preencher valores se os inputs existirem
                const pesoInput = document.getElementById(`peso-${serieIndex}`);
                const repInput = document.getElementById(`rep-${serieIndex}`);
                
                if (pesoInput) pesoInput.value = exec.peso_utilizado;
                if (repInput) repInput.value = exec.repeticoes_realizadas || exec.repeticoes;
                
                // Desabilitar botão de confirmar
                const confirmBtn = serieRow.querySelector('.confirm-serie-btn');
                if (confirmBtn) {
                    confirmBtn.disabled = true;
                    confirmBtn.innerHTML = '<i class="fas fa-check"></i>';
                }
                
                console.log(`[restaurarSeriesCompletadas] Série ${exec.serie_numero} do exercício ${exercicioId} restaurada`);
            }
        });
    });
    
    // Atualizar contador de séries completadas
    const totalSeriesCompletadas = execucoesCache.length;
    if (window.updateProgressBar) {
        window.updateProgressBar(totalSeriesCompletadas);
    }
    
    console.log(`[restaurarSeriesCompletadas] ${totalSeriesCompletadas} séries restauradas visualmente`);
}

// Exportar funções globais
// Renomeado para evitar conflito com nova implementação no WorkoutExecutionManager
// window.iniciarTreinoLegacy = iniciarTreino;console.log('[workout.js] ✅ Arquivo carregado com sucesso - window.iniciarTreino =', typeof window.iniciarTreino);
