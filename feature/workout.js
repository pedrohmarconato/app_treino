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
    const workout = AppState.get('currentWorkout');
    const exercises = AppState.get('currentExercises');
    
    if (!workout || !exercises || exercises.length === 0) {
        showNotification('Nenhum treino disponível', 'error');
        return;
    }
    
    // Resetar estado do treino
    AppState.set('currentExerciseIndex', 0);
    AppState.set('completedSeries', 0);
    AppState.set('workoutStartTime', Date.now());
    
    // Navegar para tela de treino
    mostrarTela('workout-screen');
    
    // Mostrar primeiro exercício
    await mostrarExercicioAtual();
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
    
    updateElement('exercise-counter', `Exercício ${currentIndex + 1} de ${exercises.length}`);
}

// Mostrar container do exercício
function showExerciseContainer() {
    const exerciseContainer = document.getElementById('exercise-container');
    const timerContainer = document.getElementById('timer-container');
    const completedContainer = document.getElementById('workout-completed');
    
    if (exerciseContainer) exerciseContainer.classList.remove('hidden');
    if (timerContainer) timerContainer.classList.add('hidden');
    if (completedContainer) completedContainer.classList.add('hidden');
}

// Atualizar informações do exercício
function atualizarInfoExercicio(exercicio, pesosSugeridos) {
    updateElement('exercise-name', exercicio.exercicio_nome);
    updateElement('exercise-group', exercicio.exercicio_grupo);
    updateElement('exercise-equipment', exercicio.exercicio_equipamento);
    
    // Observações com pesos sugeridos
    let observacoes = exercicio.observacoes || '';
    if (pesosSugeridos) {
        observacoes += `\n\n💪 Pesos Sugeridos:\n`;
        observacoes += `• Base: ${pesosSugeridos.peso_base}kg\n`;
        observacoes += `• Mínimo: ${pesosSugeridos.peso_minimo}kg\n`;
        observacoes += `• Máximo: ${pesosSugeridos.peso_maximo}kg\n`;
        observacoes += `• Alvo: ${pesosSugeridos.repeticoes_alvo} reps`;
    }
    
    const notesEl = document.getElementById('exercise-notes');
    if (notesEl) {
        if (observacoes) {
            notesEl.textContent = observacoes;
            notesEl.style.display = 'block';
            notesEl.style.whiteSpace = 'pre-line';
        } else {
            notesEl.style.display = 'none';
        }
    }
    
    // Intensidade e descanso
    const intensityMin = exercicio.percentual_1rm_min || 70;
    const intensityMax = exercicio.percentual_1rm_max || 80;
    updateElement('intensity-info', `${intensityMin}-${intensityMax}%`);
    updateElement('rest-info', `${exercicio.tempo_descanso}s`);
}

// Renderizar séries
function renderizarSeries(exercicio, pesosSugeridos) {
    const container = document.getElementById('series-container');
    if (!container) return;
    
    container.innerHTML = '';
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
        
        container.appendChild(serieDiv);
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
    
    // Salvar execução
    const dados = {
        usuario_id: currentUser.id,
        protocolo_treino_id: workout.id,
        exercicio_id: exercicio.exercicio_id,
        serie_numero: serieIndex + 1,
        peso_utilizado: peso,
        repeticoes_realizadas: reps,
        data_execucao: new Date().toISOString()
    };
    
    const success = await salvarExecucaoExercicio(dados);
    
    if (!success) {
        showNotification('Erro ao salvar série', 'error');
        return;
    }
    
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
    document.getElementById('exercise-container').classList.add('hidden');
    document.getElementById('timer-modal').style.display = 'flex';
    
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
        
        document.getElementById('timer-modal').style.display = 'none';
        proximoExercicio();
        return;
    }
    
    const minutos = Math.floor(restTime / 60);
    const segundos = restTime % 60;
    const tempoFormatado = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
    
    // Atualizar texto do timer
    updateElement('modal-timer-text', tempoFormatado);
    
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
    
    document.getElementById('timer-modal').style.display = 'none';
    proximoExercicio();
};

// Próximo exercício
function proximoExercicio() {
    const currentIndex = AppState.get('currentExerciseIndex');
    AppState.set('currentExerciseIndex', currentIndex + 1);
    AppState.set('completedSeries', 0);
    
    mostrarExercicioAtual();
}

// Mostrar treino concluído
function mostrarTreinoConcluido() {
    // Ocultar containers
    document.getElementById('exercise-container').classList.add('hidden');
    document.getElementById('timer-container').classList.add('hidden');
    
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
    const modal = document.getElementById('workout-complete-modal');
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
        
        // Fechar modal
        const modal = document.getElementById('workout-complete-modal');
        if (modal) {
            modal.style.display = 'none';
        }
        
        // Resetar estado do treino
        AppState.resetWorkout();
        
        // Voltar para home
        voltarParaHome();
        
        // Recarregar dashboard
        if (window.carregarDashboard) {
            await window.carregarDashboard();
        }
        
        showNotification('Treino finalizado com sucesso!', 'success');
        
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