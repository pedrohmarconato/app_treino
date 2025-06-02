// feature/workoutExecution.js - Lógica completa de execução do treino
import WorkoutProtocolService from '../services/workoutProtocolService.js';
import { exerciseCardTemplate, generateSeriesItem } from '../templates/exerciseCard.js';
import AppState from '../state/appState.js';
import { showNotification } from '../ui/notifications.js';
import { mostrarTela } from '../ui/navigation.js';

class WorkoutExecutionManager {
    constructor() {
        this.currentWorkout = null;
        this.exerciciosExecutados = [];
        this.startTime = null;
        this.timerInterval = null;
        this.restTimerInterval = null;
        this.currentRestTime = 0;
    }

    // Iniciar treino
    async iniciarTreino() {
        try {
            console.log('[WorkoutExecution] Iniciando treino...');
            
            const currentUser = AppState.get('currentUser');
            if (!currentUser) {
                throw new Error('Usuário não encontrado');
            }

            // Carregar treino do protocolo
            this.currentWorkout = await WorkoutProtocolService.carregarTreinoParaExecucao(currentUser.id);
            
            if (this.currentWorkout.tipo === 'folga') {
                showNotification('Hoje é dia de descanso! 😴', 'info');
                return;
            }
            
            if (this.currentWorkout.tipo === 'cardio') {
                showNotification('Treino de cardio! 🏃‍♂️ Configure seu equipamento.', 'info');
                return;
            }

            // Configurar estado inicial
            this.startTime = Date.now();
            this.exerciciosExecutados = [];
            
            // Salvar no estado global
            AppState.set('currentWorkout', this.currentWorkout);
            
            // Navegar para tela de treino
            if (window.renderTemplate) {
                window.renderTemplate('workout');
            } else {
                mostrarTela('workout-screen');
            }
            
            // Renderizar treino após navegação
            setTimeout(() => {
                this.renderizarTreino();
                this.iniciarCronometro();
            }, 200);
            
            console.log(`[WorkoutExecution] ✅ Treino iniciado: ${this.currentWorkout.exercicios.length} exercícios`);
            
        } catch (error) {
            console.error('[WorkoutExecution] Erro ao iniciar treino:', error);
            showNotification('Erro ao carregar treino: ' + error.message, 'error');
        }
    }

    // Renderizar treino na tela
    renderizarTreino() {
        try {
            const { exercicios, nome, semana_atual } = this.currentWorkout;
            
            // Atualizar header
            this.updateElement('workout-title', nome);
            this.updateElement('workout-week', `Semana ${semana_atual}`);
            this.updateElement('workout-exercises-count', `${exercicios.length} exercícios`);
            
            // Renderizar lista de exercícios
            const exerciseList = document.getElementById('exercise-list');
            if (exerciseList) {
                exerciseList.innerHTML = '';
                
                exercicios.forEach((exercicio, index) => {
                    const exerciseCard = document.createElement('div');
                    exerciseCard.innerHTML = exerciseCardTemplate(exercicio, index, exercicios.length);
                    exerciseList.appendChild(exerciseCard.firstElementChild);
                });
            }
            
            // Configurar event listeners
            this.setupEventListeners();
            
            console.log('[WorkoutExecution] ✅ Treino renderizado');
            
        } catch (error) {
            console.error('[WorkoutExecution] Erro ao renderizar treino:', error);
        }
    }

    // Configurar event listeners
    setupEventListeners() {
        // Configurar funções globais para os botões
        window.ajustarValor = this.ajustarValor.bind(this);
        window.confirmarSerie = this.confirmarSerie.bind(this);
        window.adicionarSerie = this.adicionarSerie.bind(this);
        window.concluirExercicio = this.concluirExercicio.bind(this);
        window.finalizarTreinoCompleto = this.finalizarTreinoCompleto.bind(this);
        window.pularDescanso = this.pularDescanso.bind(this);
        window.adicionarTempo = this.adicionarTempo.bind(this);
    }

    // Ajustar valor nos inputs
    ajustarValor(inputId, delta) {
        const input = document.getElementById(inputId);
        if (!input) return;
        
        const currentValue = parseFloat(input.value) || 0;
        const newValue = Math.max(0, currentValue + delta);
        
        // Arredondar pesos para 0.5kg
        if (inputId.includes('peso')) {
            input.value = (Math.round(newValue * 2) / 2).toFixed(1);
        } else {
            input.value = Math.round(newValue);
        }
        
        // Efeito visual
        input.style.background = 'var(--accent-green-bg)';
        setTimeout(() => {
            input.style.background = '';
        }, 200);
    }

    // Confirmar série executada
    async confirmarSerie(exercicioId, serieNumero) {
        try {
            const pesoInput = document.getElementById(`peso-${exercicioId}-${serieNumero}`);
            const repsInput = document.getElementById(`reps-${exercicioId}-${serieNumero}`);
            
            const peso = parseFloat(pesoInput.value);
            const reps = parseInt(repsInput.value);
            
            if (!peso || !reps) {
                showNotification('Preencha peso e repetições', 'error');
                return;
            }
            
            // Encontrar exercício e protocolo_treino_id
            const exercicio = this.currentWorkout.exercicios.find(ex => ex.exercicio_id === exercicioId);
            if (!exercicio) {
                throw new Error('Exercício não encontrado');
            }
            
            // Salvar execução no banco
            const dadosExecucao = {
                exercicio_id: exercicioId,
                protocolo_treino_id: exercicio.id,
                peso_utilizado: peso,
                repeticoes_realizadas: reps,
                serie_numero: serieNumero,
                repeticoes_alvo: exercicio.repeticoes_alvo
            };
            
            const resultado = await WorkoutProtocolService.executarSerie(
                AppState.get('currentUser').id,
                dadosExecucao
            );
            
            // Atualizar UI - marcar série como concluída
            this.marcarSerieComoConcluida(exercicioId, serieNumero, peso, reps);
            
            // Atualizar contador de séries
            exercicio.series_executadas = (exercicio.series_executadas || 0) + 1;
            this.atualizarProgressoExercicio(exercicioId);
            
            // Se completou todas as séries, iniciar descanso
            if (exercicio.series_executadas >= exercicio.series) {
                exercicio.status = 'concluido';
                this.habilitarBotaoConcluirExercicio(exercicioId);
            } else {
                // Iniciar descanso entre séries
                this.iniciarDescanso(exercicio.tempo_descanso || 60);
            }
            
            showNotification(`Série ${serieNumero} registrada: ${peso}kg × ${reps}`, 'success');
            
        } catch (error) {
            console.error('[WorkoutExecution] Erro ao confirmar série:', error);
            showNotification('Erro ao registrar série: ' + error.message, 'error');
        }
    }

    // Marcar série como concluída visualmente
    marcarSerieComoConcluida(exercicioId, serieNumero, peso, reps) {
        const serieItem = document.getElementById(`series-${exercicioId}-${serieNumero}`);
        const confirmBtn = document.getElementById(`confirm-${exercicioId}-${serieNumero}`);
        const resultDiv = document.getElementById(`result-${exercicioId}-${serieNumero}`);
        
        if (serieItem) {
            serieItem.classList.add('completed');
        }
        
        if (confirmBtn) {
            confirmBtn.disabled = true;
            confirmBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 6L9 17l-5-5"/>
                </svg>
            `;
        }
        
        if (resultDiv) {
            resultDiv.querySelector('.result-weight').textContent = `${peso}kg`;
            resultDiv.querySelector('.result-reps').textContent = `×${reps}`;
            resultDiv.classList.remove('hidden');
        }
        
        // Desabilitar inputs
        const pesoInput = document.getElementById(`peso-${exercicioId}-${serieNumero}`);
        const repsInput = document.getElementById(`reps-${exercicioId}-${serieNumero}`);
        if (pesoInput) pesoInput.disabled = true;
        if (repsInput) repsInput.disabled = true;
    }

    // Adicionar nova série
    adicionarSerie(exercicioId) {
        const exercicio = this.currentWorkout.exercicios.find(ex => ex.exercicio_id === exercicioId);
        if (!exercicio) return;
        
        const seriesExecutadas = exercicio.series_executadas || 0;
        const novoNumero = seriesExecutadas + 1;
        
        if (novoNumero > exercicio.series) {
            showNotification('Todas as séries já foram executadas', 'info');
            return;
        }
        
        const seriesList = document.getElementById(`series-list-${exercicioId}`);
        if (seriesList) {
            const ultimaExecucao = this.getUltimaExecucao(exercicioId);
            const pesoSugerido = ultimaExecucao ? ultimaExecucao.peso : (exercicio.pesos_sugeridos?.peso_base || 0);
            const repsAlvo = exercicio.repeticoes_alvo || 10;
            
            const novaSerieDiv = document.createElement('div');
            novaSerieDiv.innerHTML = generateSeriesItem(exercicioId, novoNumero, pesoSugerido, repsAlvo);
            seriesList.appendChild(novaSerieDiv.firstElementChild);
        }
        
        // Ocultar botão se atingiu o máximo
        if (novoNumero >= exercicio.series) {
            const addBtn = document.getElementById(`add-series-btn-${exercicioId}`);
            if (addBtn) addBtn.style.display = 'none';
        }
    }

    // Obter última execução do exercício
    getUltimaExecucao(exercicioId) {
        const seriesItems = document.querySelectorAll(`[id^="series-${exercicioId}-"]`);
        let ultimaExecucao = null;
        
        seriesItems.forEach(item => {
            if (item.classList.contains('completed')) {
                const serieNumero = item.id.split('-')[2];
                const peso = parseFloat(document.getElementById(`peso-${exercicioId}-${serieNumero}`).value);
                const reps = parseInt(document.getElementById(`reps-${exercicioId}-${serieNumero}`).value);
                
                ultimaExecucao = { peso, reps };
            }
        });
        
        return ultimaExecucao;
    }

    // Atualizar progresso do exercício
    atualizarProgressoExercicio(exercicioId) {
        const exercicio = this.currentWorkout.exercicios.find(ex => ex.exercicio_id === exercicioId);
        if (!exercicio) return;
        
        const progressEl = document.getElementById(`series-progress-${exercicioId}`);
        if (progressEl) {
            progressEl.textContent = `${exercicio.series_executadas || 0}/${exercicio.series}`;
        }
        
        // Atualizar progresso geral do treino
        this.atualizarProgressoGeral();
    }

    // Habilitar botão de concluir exercício
    habilitarBotaoConcluirExercicio(exercicioId) {
        const btn = document.getElementById(`complete-exercise-btn-${exercicioId}`);
        if (btn) {
            btn.disabled = false;
            btn.style.background = 'var(--accent-green)';
        }
    }

    // Concluir exercício
    async concluirExercicio(exercicioId) {
        try {
            const exercicio = this.currentWorkout.exercicios.find(ex => ex.exercicio_id === exercicioId);
            if (!exercicio) return;
            
            // Marcar exercício como concluído no backend
            const resultado = await WorkoutProtocolService.finalizarExercicio(
                AppState.get('currentUser').id,
                exercicioId
            );
            
            // Adicionar aos exercícios executados
            this.exerciciosExecutados.push({
                exercicio_id: exercicioId,
                nome: exercicio.exercicio_nome,
                ...resultado
            });
            
            // Marcar como concluído visualmente
            const exerciseCard = document.getElementById(`exercise-${exercicioId}`);
            if (exerciseCard) {
                exerciseCard.classList.add('completed');
                exerciseCard.style.opacity = '0.7';
            }
            
            // Verificar se todos os exercícios foram concluídos
            const todosConcluidos = this.currentWorkout.exercicios.every(ex => 
                ex.status === 'concluido' || this.exerciciosExecutados.some(exe => exe.exercicio_id === ex.exercicio_id)
            );
            
            if (todosConcluidos) {
                setTimeout(() => {
                    this.mostrarTreinoConcluido();
                }, 1000);
            } else {
                showNotification(`✅ ${exercicio.exercicio_nome} concluído!`, 'success');
            }
            
        } catch (error) {
            console.error('[WorkoutExecution] Erro ao concluir exercício:', error);
            showNotification('Erro ao finalizar exercício', 'error');
        }
    }

    // Iniciar timer de descanso
    iniciarDescanso(segundos) {
        this.currentRestTime = segundos;
        
        const timerContainer = document.getElementById('timer-container');
        if (timerContainer) {
            timerContainer.classList.remove('hidden');
            
            this.restTimerInterval = setInterval(() => {
                this.atualizarTimerDescanso();
            }, 1000);
            
            this.atualizarTimerDescanso();
        }
    }

    // Atualizar timer de descanso
    atualizarTimerDescanso() {
        const timerDisplay = document.getElementById('timer-display');
        const timerProgress = document.querySelector('.timer-circle-progress');
        
        if (this.currentRestTime <= 0) {
            this.pularDescanso();
            return;
        }
        
        // Atualizar display
        const minutos = Math.floor(this.currentRestTime / 60);
        const segundos = this.currentRestTime % 60;
        if (timerDisplay) {
            timerDisplay.textContent = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
        }
        
        // Atualizar progresso circular
        if (timerProgress) {
            const totalTime = parseInt(document.getElementById('timer-display').getAttribute('data-total') || 60);
            const progress = (totalTime - this.currentRestTime) / totalTime;
            const offset = 565.48 * (1 - progress);
            timerProgress.style.strokeDashoffset = offset;
        }
        
        this.currentRestTime--;
    }

    // Pular descanso
    pularDescanso() {
        if (this.restTimerInterval) {
            clearInterval(this.restTimerInterval);
            this.restTimerInterval = null;
        }
        
        const timerContainer = document.getElementById('timer-container');
        if (timerContainer) {
            timerContainer.classList.add('hidden');
        }
        
        this.currentRestTime = 0;
    }

    // Adicionar tempo ao descanso
    adicionarTempo(segundos) {
        this.currentRestTime += segundos;
        showNotification(`+${segundos}s adicionados ao descanso`, 'info');
    }

    // Mostrar treino concluído
    mostrarTreinoConcluido() {
        const exerciseList = document.getElementById('exercise-list');
        const completionContainer = document.getElementById('completion-container');
        
        if (exerciseList) exerciseList.style.display = 'none';
        if (completionContainer) {
            completionContainer.classList.remove('hidden');
            
            // Atualizar resumo
            this.atualizarResumoTreino();
        }
        
        // Parar cronômetro
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
    }

    // Atualizar resumo do treino
    atualizarResumoTreino() {
        const summaryContainer = document.getElementById('workout-summary');
        if (!summaryContainer) return;
        
        const tempoTotal = this.formatarTempo(Date.now() - this.startTime);
        const totalExercicios = this.exerciciosExecutados.length;
        const totalSeries = this.exerciciosExecutados.reduce((sum, ex) => sum + ex.series_realizadas, 0);
        const pesoTotal = this.exerciciosExecutados.reduce((sum, ex) => sum + (ex.peso_medio * ex.series_realizadas), 0);
        
        summaryContainer.innerHTML = `
            <div class="summary-grid">
                <div class="summary-item">
                    <div class="summary-icon">⏱️</div>
                    <div class="summary-data">
                        <div class="summary-value">${tempoTotal}</div>
                        <div class="summary-label">Duração</div>
                    </div>
                </div>
                <div class="summary-item">
                    <div class="summary-icon">🏋️</div>
                    <div class="summary-data">
                        <div class="summary-value">${totalExercicios}</div>
                        <div class="summary-label">Exercícios</div>
                    </div>
                </div>
                <div class="summary-item">
                    <div class="summary-icon">📊</div>
                    <div class="summary-data">
                        <div class="summary-value">${totalSeries}</div>
                        <div class="summary-label">Séries</div>
                    </div>
                </div>
                <div class="summary-item">
                    <div class="summary-icon">⚖️</div>
                    <div class="summary-data">
                        <div class="summary-value">${Math.round(pesoTotal)}kg</div>
                        <div class="summary-label">Volume Total</div>
                    </div>
                </div>
            </div>
        `;
    }

    // Finalizar treino completo
    async finalizarTreinoCompleto() {
        try {
            const tempoTotal = Math.floor((Date.now() - this.startTime) / 1000);
            
            const dadosTreino = {
                numero_treino: this.currentWorkout.numero_treino,
                exercicios_realizados: this.exerciciosExecutados,
                tempo_total: tempoTotal,
                observacoes: this.getObservacoes()
            };
            
            // Finalizar no backend
            const resultado = await WorkoutProtocolService.finalizarTreino(
                AppState.get('currentUser').id,
                dadosTreino
            );
            
            // Limpar estado
            this.resetarEstado();
            
            // Voltar para home
            if (window.renderTemplate) {
                window.renderTemplate('home');
            } else {
                mostrarTela('home-screen');
            }
            
            // Recarregar dashboard
            setTimeout(async () => {
                if (window.carregarDashboard) {
                    await window.carregarDashboard();
                }
            }, 500);
            
            // Notificação de sucesso
            let mensagem = '🎉 Treino finalizado com sucesso!';
            if (resultado.proxima_acao === 'semana_avancada') {
                mensagem += ' Você avançou para a próxima semana!';
            }
            
            showNotification(mensagem, 'success');
            
        } catch (error) {
            console.error('[WorkoutExecution] Erro ao finalizar treino:', error);
            showNotification('Erro ao finalizar treino: ' + error.message, 'error');
        }
    }

    // Obter observações do treino
    getObservacoes() {
        // Pode implementar um modal para observações
        return null;
    }

    // Iniciar cronômetro do treino
    iniciarCronometro() {
        this.timerInterval = setInterval(() => {
            const tempoDecorrido = Date.now() - this.startTime;
            const tempoFormatado = this.formatarTempo(tempoDecorrido);
            this.updateElement('workout-duration-live', tempoFormatado);
        }, 1000);
    }

    // Atualizar progresso geral
    atualizarProgressoGeral() {
        const totalExercicios = this.currentWorkout.exercicios.length;
        const exerciciosConcluidos = this.exerciciosExecutados.length;
        const progresso = (exerciciosConcluidos / totalExercicios) * 100;
        
        const progressCircle = document.getElementById('workout-progress-circle');
        const progressText = document.getElementById('workout-progress-text');
        
        if (progressCircle) {
            const circumference = 2 * Math.PI * 40;
            const offset = circumference - (progresso / 100) * circumference;
            progressCircle.style.strokeDashoffset = offset;
        }
        
        if (progressText) {
            progressText.textContent = `${Math.round(progresso)}%`;
        }
    }

    // Formatar tempo
    formatarTempo(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // Resetar estado
    resetarEstado() {
        this.currentWorkout = null;
        this.exerciciosExecutados = [];
        this.startTime = null;
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        if (this.restTimerInterval) {
            clearInterval(this.restTimerInterval);
            this.restTimerInterval = null;
        }
        
        AppState.set('currentWorkout', null);
    }

    // Função auxiliar para atualizar elementos
    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }
}

// Instância global
export const workoutExecutionManager = new WorkoutExecutionManager();

// Função global para iniciar treino
window.iniciarTreino = async function() {
    await workoutExecutionManager.iniciarTreino();
};

// Função para voltar para home
window.voltarParaHome = function() {
    // Confirmar se quer sair do treino
    if (workoutExecutionManager.currentWorkout) {
        const confirmar = confirm('Tem certeza que deseja sair do treino? O progresso será perdido.');
        if (!confirmar) return;
        
        workoutExecutionManager.resetarEstado();
    }
    
    if (window.renderTemplate) {
        window.renderTemplate('home');
    } else {
        mostrarTela('home-screen');
    }
};

export default workoutExecutionManager;