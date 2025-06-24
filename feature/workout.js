// js/features/workout.js
import { weeklyPlanManager } from '../hooks/useWeeklyPlan.js';
// Lógica da tela de treino

import AppState from '../state/appState.js';
import { fetch1RMUsuario } from '../services/userService.js';
import { carregarPesosSugeridos, salvarExecucaoExercicio, marcarTreinoConcluido } from '../services/workoutService.js';
import { showNotification } from '../ui/notifications.js';
import { mostrarTela, voltarParaHome } from '../ui/navigation.js';

// Iniciar treino
export async function iniciarTreino() {
    console.log('[iniciarTreino] Verificando dados do treino...');
    
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
    if (execucoesPendentes) {
        const quantidade = JSON.parse(execucoesPendentes).length;
        if (confirm(`Há ${quantidade} execuções não salvas de um treino anterior. Deseja recuperá-las?`)) {
            // Recuperar execuções do cache
            AppState.set('execucoesCache', JSON.parse(execucoesPendentes));
            showNotification(`${quantidade} execuções recuperadas do cache`, 'info');
        } else {
            // Limpar cache antigo
            localStorage.removeItem('treino_execucoes_temp');
            AppState.set('execucoesCache', []);
        }
    } else {
        // Iniciar cache limpo
        AppState.set('execucoesCache', []);
    }
    
    // Resetar estado do treino
    AppState.set('currentExerciseIndex', 0);
    AppState.set('completedSeries', 0);
    AppState.set('workoutStartTime', Date.now());
    
    // Navegar para tela de treino
    mostrarTela('workout-screen');
    
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
    
    // Mostrar primeiro exercício
    await mostrarExercicioAtual();
    
    // Limpar listener de debug
    if (unsubscribe) unsubscribe();
}

// Timer do treino
function startWorkoutTimer() {
    const startTime = AppState.get('workoutStartTime');
    
    const updateTimer = () => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        const timerDisplay = document.getElementById('workout-timer-display');
        if (timerDisplay) {
            timerDisplay.textContent = timeString;
        }
    };
    
    // Atualizar imediatamente
    updateTimer();
    
    // Atualizar a cada segundo
    const interval = setInterval(updateTimer, 1000);
    AppState.set('workoutTimerInterval', interval);
}

// Expor no window apenas se não existir (evitar sobrescrever WorkoutExecutionManager)
if (!window.iniciarTreino) {
    console.log('[workout.js] Registrando iniciarTreino legacy');
    window.iniciarTreino = iniciarTreino;
}

// Mostrar exercício atual
async function mostrarExercicioAtual() {
    const exercises = AppState.get('currentExercises');
    const currentIndex = AppState.get('currentExerciseIndex');
    const exercicio = exercises[currentIndex];
    
    if (!exercicio) {
        mostrarTreinoConcluido();
        return;
    }
    
    // Buscar pesos sugeridos
    const currentUser = AppState.get('currentUser');
    const { data: pesosSugeridos } = await carregarPesosSugeridos(
        currentUser.id,
        exercicio.protocolo_treino_id
    );
    
    // Atualizar progresso
    atualizarProgresso();
    
    // Mostrar container do exercício
    showExerciseContainer();
    
    // Atualizar informações do exercício
    atualizarInfoExercicio(exercicio, pesosSugeridos);
    
    // Buscar 1RM
    const rm = await fetch1RMUsuario(currentUser.id, exercicio.exercicio_id);
    updateElement('rm-info', rm ? `${rm}kg` : '--');
    
    // Renderizar séries
    renderizarSeries(exercicio, pesosSugeridos);
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
    const exerciseContainer = document.getElementById('exercises-container');
    const timerContainer = document.getElementById('rest-timer-overlay');
    const completedContainer = document.getElementById('workout-completion');
    
    if (exerciseContainer) {
        exerciseContainer.style.display = 'block';
        exerciseContainer.classList.remove('hidden');
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
    const container = document.getElementById('exercises-container');
    if (!container) return;
    
    // Limpar container
    container.innerHTML = '';
    
    // Obter dados do exercício atual
    const exerciseData = AppState.get('currentExerciseData');
    const currentIndex = AppState.get('currentExerciseIndex');
    const exercises = AppState.get('currentExercises');
    
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
            ${pesosSugeridos ? `
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
            <button class="btn-primary" onclick="proximoExercicio()">
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
    
    for (let i = 0; i < exercicio.series; i++) {
        const serieDiv = document.createElement('div');
        serieDiv.className = 'series-item';
        serieDiv.id = `serie-${i}`;
        
        serieDiv.innerHTML = `
            <div class="series-number">${i + 1}</div>
            
            <div class="series-input-group">
                <div class="input-wrapper">
                    <button class="input-btn" onclick="ajustarValor('peso-${i}', -2.5)">-</button>
                    <input type="number" 
                           id="peso-${i}" 
                           class="series-input" 
                           placeholder="0" 
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
                           class="series-input" 
                           placeholder="0" 
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
        
        seriesContainer.appendChild(serieDiv);
    }
}

// Ajustar valor dos inputs
window.ajustarValor = function(inputId, delta) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const currentValue = parseFloat(input.value) || 0;
    const newValue = Math.max(0, currentValue + delta);
    input.value = newValue;
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
        protocolo_treino_id: workout.id,
        exercicio_id: exercicio.exercicio_id,
        serie_numero: serieIndex + 1,
        peso_utilizado: peso,
        repeticoes_realizadas: reps,
        data_execucao: new Date().toISOString()
    };
    
    // Adicionar ao cache local ao invés de salvar no Supabase
    let execucoesCache = AppState.get('execucoesCache') || [];
    execucoesCache.push(dados);
    AppState.set('execucoesCache', execucoesCache);
    
    // Salvar no localStorage para proteção
    localStorage.setItem('treino_execucoes_temp', JSON.stringify(execucoesCache));
    
    console.log(`[workout] Série ${serieIndex + 1} salva no cache local. Total: ${execucoesCache.length} execuções`);
    
    // Sempre retornar sucesso pois salvamos localmente
    const success = true;
    
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
    
    // Verificar se completou todas as séries
    if (completedSeries === exercicio.series) {
        // Resetar contador para próximo exercício
        AppState.set('completedSeries', 0);
        
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

// Pular descanso
window.pularDescanso = function() {
    const interval = AppState.get('timerInterval');
    if (interval) {
        clearInterval(interval);
        AppState.set('timerInterval', null);
    }
    
    const timerModal = document.getElementById('rest-timer-overlay');
    if (timerModal) timerModal.style.display = 'none';
    proximoExercicio();
};

// Próximo exercício
function proximoExercicio() {
    const currentIndex = AppState.get('currentExerciseIndex');
    AppState.set('currentExerciseIndex', currentIndex + 1);
    AppState.set('completedSeries', 0);
    
    mostrarExercicioAtual();
}

// Voltar exercício
window.voltarExercicio = function() {
    const currentIndex = AppState.get('currentExerciseIndex');
    if (currentIndex > 0) {
        AppState.set('currentExerciseIndex', currentIndex - 1);
        AppState.set('completedSeries', 0);
        mostrarExercicioAtual();
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
    try {
        const currentUser = AppState.get('currentUser');
        
        if (!currentUser) {
            showNotification('Erro: usuário não identificado', 'error');
            return;
        }
        
        // IMPORTANTE: Enviar todas as execuções do cache para o Supabase
        const execucoesCache = AppState.get('execucoesCache') || [];
        
        if (execucoesCache.length > 0) {
            showNotification('Salvando treino...', 'info');
            
            console.log(`[finalizarTreino] Enviando ${execucoesCache.length} execuções para o Supabase...`);
            
            // Enviar todas as execuções de uma vez
            for (const execucao of execucoesCache) {
                const success = await salvarExecucaoExercicio(execucao);
                if (!success) {
                    console.error('[finalizarTreino] Erro ao salvar execução:', execucao);
                    // Continuar salvando as outras mesmo se uma falhar
                }
            }
            
            console.log('[finalizarTreino] ✅ Todas as execuções enviadas para o Supabase');
            
            // Limpar cache após envio bem sucedido
            AppState.set('execucoesCache', []);
            localStorage.removeItem('treino_execucoes_temp');
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
        showNotification('Erro ao finalizar treino', 'error');
    }
};

// Função auxiliar para atualizar elementos
function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

// Exportar funções globais
// Renomeado para evitar conflito com nova implementação no WorkoutExecutionManager
// window.iniciarTreinoLegacy = iniciarTreino;