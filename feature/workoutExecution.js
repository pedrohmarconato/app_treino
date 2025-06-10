// feature/workoutExecution.js - CORREÇÃO FINAL para compatibilidade com template
import WorkoutProtocolService from '../services/workoutProtocolService.js';
import AppState from '../state/appState.js';
import { showNotification } from '../ui/notifications.js';

class WorkoutExecutionManager {
    constructor() {
        this.currentWorkout = null;
        this.exerciciosExecutados = [];
        this.startTime = null;
        this.timerInterval = null;
        this.restTimerInterval = null;
        this.currentRestTime = 0;
        this.currentExerciseIndex = 0;
    }

    // Iniciar treino
    async iniciarTreino() {
        try {
            console.log('[WorkoutExecution] 🚀 Iniciando treino...');
            
            const currentUser = AppState.get('currentUser');
            if (!currentUser) {
                throw new Error('Usuário não encontrado');
            }

            // Mostrar loading
            if (window.showNotification) {
                window.showNotification('Carregando treino...', 'info');
            }

            // Carregar treino do protocolo
            this.currentWorkout = await WorkoutProtocolService.carregarTreinoParaExecucao(currentUser.id);
            
            if (!this.currentWorkout) {
                throw new Error('Nenhum treino encontrado para hoje');
            }
            
            // Verificar casos especiais
            if (this.currentWorkout.tipo === 'folga') {
                showNotification('Hoje é dia de descanso! 😴', 'info');
                return;
            }
            
            if (this.currentWorkout.tipo === 'cardio') {
                showNotification('Treino de cardio! 🏃‍♂️ Configure seu equipamento.', 'info');
                return;
            }

            // Verificar se há exercícios
            if (!this.currentWorkout.exercicios || this.currentWorkout.exercicios.length === 0) {
                throw new Error('Nenhum exercício encontrado no treino');
            }

            // Configurar estado inicial
            this.startTime = Date.now();
            this.exerciciosExecutados = [];
            this.currentExerciseIndex = 0;
            
            // Salvar no estado global
            AppState.set('currentWorkout', this.currentWorkout);
            
            console.log(`[WorkoutExecution] ✅ Treino carregado: ${this.currentWorkout.exercicios.length} exercícios`);
            
            // Navegar para tela de workout
            await this.navegarParaTelaWorkout();
            
            // Renderizar treino após navegação bem-sucedida
            setTimeout(() => {
                this.renderizarTreino();
                this.iniciarCronometro();
            }, 500);
            
            console.log(`[WorkoutExecution] ✅ Treino iniciado com sucesso!`);
            
        } catch (error) {
            console.error('[WorkoutExecution] ❌ Erro ao iniciar treino:', error);
            if (window.showNotification) {
                window.showNotification('Erro ao carregar treino: ' + error.message, 'error');
            }
        }
    }

    // Navegação robusta para tela de workout
    async navegarParaTelaWorkout() {
        console.log('[WorkoutExecution] 📱 Navegando para tela de workout...');
        
        try {
            // Tentar o sistema novo primeiro
            if (window.renderTemplate && typeof window.renderTemplate === 'function') {
                console.log('[WorkoutExecution] Usando renderTemplate...');
                await window.renderTemplate('workout');
                
                // Verificar se a navegação funcionou
                await this.aguardarElemento('#workout-screen', 3000);
                console.log('[WorkoutExecution] ✅ Navegação via renderTemplate bem-sucedida');
                return;
            }
        } catch (error) {
            console.warn('[WorkoutExecution] ⚠️ Falha no renderTemplate:', error);
        }
        
        try {
            // Fallback para sistema antigo
            if (window.mostrarTela && typeof window.mostrarTela === 'function') {
                console.log('[WorkoutExecution] Usando mostrarTela como fallback...');
                window.mostrarTela('workout-screen');
                
                // Verificar se funcionou
                await this.aguardarElemento('#workout-screen', 3000);
                console.log('[WorkoutExecution] ✅ Navegação via mostrarTela bem-sucedida');
                return;
            }
        } catch (error) {
            console.warn('[WorkoutExecution] ⚠️ Falha no mostrarTela:', error);
        }
        
        // Último recurso: navegação manual
        console.log('[WorkoutExecution] 🔧 Usando navegação manual...');
        this.navegacaoManual();
    }
    
    // Aguardar elemento aparecer na DOM
    async aguardarElemento(selector, timeout = 3000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const checkElement = () => {
                const element = document.querySelector(selector);
                if (element) {
                    resolve(element);
                    return;
                }
                
                if (Date.now() - startTime > timeout) {
                    reject(new Error(`Timeout aguardando elemento: ${selector}`));
                    return;
                }
                
                setTimeout(checkElement, 100);
            };
            
            checkElement();
        });
    }
    
    // Navegação manual como último recurso
    navegacaoManual() {
        console.log('[WorkoutExecution] 🔧 Executando navegação manual...');
        
        // Esconder todas as telas
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
            screen.style.display = 'none';
        });
        
        // Procurar tela de workout
        let workoutScreen = document.querySelector('#workout-screen');
        
        // Se não existir, criar dinamicamente
        if (!workoutScreen) {
            console.log('[WorkoutExecution] Criando tela de workout dinamicamente...');
            workoutScreen = this.criarTelaWorkoutDinamica();
        }
        
        // Mostrar a tela
        if (workoutScreen) {
            workoutScreen.style.display = 'block';
            workoutScreen.classList.add('active', 'screen');
            console.log('[WorkoutExecution] ✅ Tela de workout ativada manualmente');
        } else {
            throw new Error('Não foi possível criar/encontrar a tela de workout');
        }
    }
    
    // Criar tela de workout dinamicamente
    criarTelaWorkoutDinamica() {
        const appContainer = document.getElementById('app') || document.body;
        
        const workoutHTML = `
            <div id="workout-screen" class="screen workout-screen">
                <div class="workout-header">
                    <div class="workout-header-top">
                        <button class="back-button" onclick="workoutExecutionManager.voltarParaHome()">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="m15 18-6-6 6-6"/>
                            </svg>
                        </button>
                        <div class="workout-info">
                            <h2 id="workout-title" class="workout-title">Carregando...</h2>
                            <p id="workout-week" class="workout-subtitle">Preparando treino...</p>
                        </div>
                        <div class="workout-timer">
                            <span id="workout-timer-display">00:00</span>
                        </div>
                    </div>
                    <div class="workout-progress-bar">
                        <div id="workout-progress" style="width: 0%"></div>
                    </div>
                </div>
                
                <div class="workout-content">
                    <div id="exercise-container" class="exercise-container">
                        <div class="loading-message">
                            <p>Carregando exercícios...</p>
                        </div>
                    </div>
                </div>
                
                <!-- Timer de descanso -->
                <div id="rest-timer" class="rest-timer" style="display: none;">
                    <div class="rest-timer-content">
                        <h3>Descanso</h3>
                        <div class="rest-time-display">
                            <span id="rest-time">60</span>s
                        </div>
                        <button id="skip-rest" class="btn btn-secondary">Pular</button>
                    </div>
                </div>
                
                <!-- Tela de conclusão -->
                <div id="workout-completion" class="workout-completion" style="display: none;">
                    <div class="completion-content">
                        <h2>🎉 Treino Concluído!</h2>
                        <div class="completion-stats">
                            <div class="stat">
                                <span class="label">Tempo Total</span>
                                <span id="total-time" class="value">--:--</span>
                            </div>
                            <div class="stat">
                                <span class="label">Exercícios</span>
                                <span id="total-exercises" class="value">0</span>
                            </div>
                        </div>
                        <button onclick="workoutExecutionManager.voltarParaHome()" class="btn btn-primary">
                            Finalizar
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        appContainer.insertAdjacentHTML('beforeend', workoutHTML);
        return document.querySelector('#workout-screen');
    }

    // CORREÇÃO PRINCIPAL: Renderizar treino compatível com template existente
    renderizarTreino() {
        try {
            console.log('[WorkoutExecution] 🎨 Renderizando treino...');
            if (!this.currentWorkout) {
                throw new Error('Nenhum treino para renderizar');
            }
            const { exercicios, nome, semana_atual } = this.currentWorkout;
            // Aguardar um pouco para o template carregar completamente
            setTimeout(() => {
                this.renderizarComAtraso(exercicios, nome, semana_atual);
            }, 200);
        } catch (error) {
            console.error('[WorkoutExecution] ❌ Erro ao renderizar treino:', error);
            if (window.showNotification) {
                window.showNotification('Erro ao exibir treino: ' + error.message, 'error');
            }
        }
    }

    // NOVA FUNÇÃO: Encontrar o container correto para exercícios
    encontrarContainerExercicios() {
    console.log('[WorkoutExecution] 🔍 Procurando container no template real...');
    // ESTRATÉGIA 1: Procurar na estrutura do template workout existente
    const workoutScreen = document.querySelector('#workout-screen');
    if (workoutScreen) {
        console.log('[WorkoutExecution] Workout screen encontrado, inspecionando...');
        // Loggar toda a estrutura para debug
        console.log('Estrutura HTML do workout-screen:', workoutScreen.innerHTML.substring(0, 500) + '...');
        // Procurar qualquer container que possa servir
        const possiveisContainers = workoutScreen.querySelectorAll('div');
        for (let container of possiveisContainers) {
            // Verificar se é um container apropriado (tem certa altura/espaço)
            const style = window.getComputedStyle(container);
            const rect = container.getBoundingClientRect();
            if (rect.height > 100 || 
                container.children.length === 0 || 
                container.classList.contains('content') ||
                container.classList.contains('container') ||
                container.id.includes('content') ||
                container.id.includes('container')) {
                console.log(`[WorkoutExecution] 📦 Container candidato encontrado:`, {
                    id: container.id,
                    classes: container.className,
                    rect: { width: rect.width, height: rect.height },
                    children: container.children.length
                });
                return container;
            }
        }
    }
    // ESTRATÉGIA 2: Criar dentro do workout-screen existente
    if (workoutScreen) {
        console.log('[WorkoutExecution] 🔨 Criando container dentro do workout-screen existente...');
        const container = document.createElement('div');
        container.id = 'workout-exercises-container';
        container.style.cssText = `
            padding: 20px;
            max-width: 600px;
            margin: 0 auto;
            min-height: 400px;
            background: transparent;
        `;
        // Adicionar ao final do workout-screen
        workoutScreen.appendChild(container);
        console.log('[WorkoutExecution] ✅ Container criado dentro do template existente');
            return container;
        }
        
        return null;
    }

    renderizarExerciciosNoContainer(exercicios, container) {
        container.innerHTML = '';
        if (!exercicios || exercicios.length === 0) {
            container.innerHTML = '<p class="no-exercises">Nenhum exercício encontrado</p>';
            return;
        }
        exercicios.forEach((exercicio, index) => {
            const exerciseCard = this.criarCardExercicioCompleto(exercicio, index);
            container.appendChild(exerciseCard);
        });
    }
    
    // NOVA FUNÇÃO: Criar card de exercício completo
    criarCardExercicioCompleto(exercicio, index) {
        const card = document.createElement('div');
        card.className = 'exercise-card';
        card.id = `exercise-${exercicio.exercicio_id}`;
        card.style.cssText = `
            background: var(--bg-secondary, #2a2a2a);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
            border: 1px solid var(--border-color, #444);
        `;
        
        // Extrair dados detalhados do exercício
        const nomeExercicio = exercicio.exercicios?.nome || exercicio.exercicio_nome || exercicio.nome || 'Exercício ' + (index + 1);
        const numSeries = exercicio.series || 3;
        const repeticoesAlvo = exercicio.repeticoes_alvo || exercicio.pesos_sugeridos?.repeticoes_alvo || '8-12';
        const tempoDescanso = exercicio.tempo_descanso || 60;
        const pesoSugerido = exercicio.pesos_sugeridos?.peso_base || '';
        const grupoMuscular = exercicio.exercicios?.grupo_muscular || exercicio.exercicio_grupo || '';
        const equipamento = exercicio.exercicios?.equipamento || exercicio.exercicio_equipamento || '';
        
        card.innerHTML = `
            <div class="exercise-header">
                <h3 style="margin: 0 0 8px 0; color: var(--text-primary, #fff);">
                    ${nomeExercicio}
                </h3>
                <div class="exercise-details" style="display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 16px; font-size: 0.875rem; color: var(--text-secondary, #ccc);">
                    <span>🔄 ${numSeries} séries</span>
                    <span>🎯 ${repeticoesAlvo} reps</span>
                    <span>⏱️ ${tempoDescanso}s descanso</span>
                    ${pesoSugerido ? `<span>💪 ${pesoSugerido}kg sugerido</span>` : ''}
                </div>
                ${grupoMuscular || equipamento ? `
                    <div class="exercise-meta" style="display: flex; gap: 12px; margin-bottom: 12px; font-size: 0.75rem; color: var(--text-secondary, #999);">
                        ${grupoMuscular ? `<span>🎯 ${grupoMuscular}</span>` : ''}
                        ${equipamento ? `<span>🏋️ ${equipamento}</span>` : ''}
                    </div>
                ` : ''}
            </div>
            
            <div class="exercise-series" id="series-${exercicio.exercicio_id}">
                ${this.gerarSeriesHTMLCompleto(exercicio)}
            </div>
            
        `;
        
        return card;
    }
    
    // NOVA FUNÇÃO: Gerar HTML das séries completo com sugestões de peso
    gerarSeriesHTMLCompleto(exercicio) {
        const numSeries = exercicio.series || 3;
        const pesoSugerido = exercicio.pesos_sugeridos?.peso_base || exercicio.peso_sugerido || '';
        const repeticoesAlvo = exercicio.repeticoes_alvo || exercicio.pesos_sugeridos?.repeticoes_alvo || 10;
        let html = '';
        
        for (let i = 1; i <= numSeries; i++) {
            html += `
                <div class="series-item" data-serie="${i}" style="display: flex; align-items: center; gap: 12px; background: var(--bg-primary, #1a1a1a); padding: 16px; border-radius: 12px; margin-bottom: 12px; transition: all 0.3s ease;">
                    <div class="series-number" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: var(--accent-green, #a8ff00); color: var(--bg-primary, #000); border-radius: 50%; font-weight: 600; flex-shrink: 0;">
                        ${i}
                    </div>
                    <div class="serie-inputs" style="display: flex; align-items: center; gap: 8px; flex: 1;">
                        <input 
                            type="number" 
                            placeholder="${pesoSugerido ? pesoSugerido + 'kg (sugerido)' : 'Peso (kg)'}" 
                            class="peso-input" 
                            step="0.5" 
                            min="0"
                            data-peso-sugerido="${pesoSugerido}"
                            style="width: 120px; padding: 8px; background: var(--bg-secondary, #2a2a2a); border: 1px solid var(--border-color, #444); border-radius: 6px; color: var(--text-primary, #fff); text-align: center;"
                        >
                        <span style="color: var(--text-secondary, #ccc);">×</span>
                        <input 
                            type="number" 
                            placeholder="${repeticoesAlvo}" 
                            class="reps-input" 
                            step="1" 
                            min="0"
                            data-reps-alvo="${repeticoesAlvo}"
                            style="width: 80px; padding: 8px; background: var(--bg-secondary, #2a2a2a); border: 1px solid var(--border-color, #444); border-radius: 6px; color: var(--text-primary, #fff); text-align: center;"
                        >
                        <button 
                            class="confirmar-serie" 
                            onclick="workoutExecutionManager.confirmarSerie(${exercicio.exercicio_id}, ${i})"
                            style="padding: 8px 16px; background: var(--bg-secondary, #2a2a2a); color: var(--text-secondary, #ccc); border: 2px solid var(--border-color, #444); border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.2s ease;"
                        >
                            ✓
                        </button>
                    </div>
                </div>
            `;
        }
        
        return html;
    }

    // Confirmar série (mantido da versão original mas melhorado)
    async confirmarSerie(exercicioId, serieNumero) {
        try {
            console.log(`[WorkoutExecution] Confirmando série ${serieNumero} do exercício ${exercicioId}`);
            
            const serieElement = document.querySelector(`#series-${exercicioId} [data-serie="${serieNumero}"]`);
            if (!serieElement) {
                throw new Error('Série não encontrada na interface');
            }
            
            const pesoInput = serieElement.querySelector('.peso-input');
            const repsInput = serieElement.querySelector('.reps-input');
            
            const peso = parseFloat(pesoInput.value);
            const reps = parseInt(repsInput.value);
            
            if (!peso || !reps) {
                window.showNotification && window.showNotification('Preencha peso e repetições', 'error');
                return;
            }
            
            // Encontrar exercício
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
            
            // Salvar no banco usando o serviço
            const resultado = await WorkoutProtocolService.executarSerie(
                AppState.get('currentUser').id,
                dadosExecucao
            );
            
            // Marcar série como concluída na interface
            this.marcarSerieComoConcluida(exercicioId, serieNumero, peso, reps);
            
            // Atualizar progresso do exercício
            exercicio.series_executadas = (exercicio.series_executadas || 0) + 1;
            this.atualizarProgresso();
            
            // Verificar se completou todas as séries
            if (exercicio.series_executadas >= exercicio.series) {
                exercicio.status = 'concluido';
                this.habilitarBotaoConcluirExercicio(exercicioId);
                
                // Verificar se treino está completo
                if (this.verificarTreinoCompleto()) {
                    this.mostrarTelaConclusao();
                }
            } else {
                // Iniciar descanso entre séries
                this.iniciarDescanso(exercicio.tempo_descanso || 60);
            }
            
            window.showNotification && window.showNotification(`Série ${serieNumero} registrada: ${peso}kg × ${reps}`, 'success');
            
        } catch (error) {
            console.error('[WorkoutExecution] Erro ao confirmar série:', error);
            window.showNotification && window.showNotification('Erro ao registrar série: ' + error.message, 'error');
        }
    }

    // Marcar série como concluída
    marcarSerieComoConcluida(exercicioId, serieNumero, peso, reps) {
        const serieElement = document.querySelector(`#series-${exercicioId} [data-serie="${serieNumero}"]`);
        if (serieElement) {
            serieElement.classList.add('completed');
            serieElement.style.backgroundColor = 'rgba(168, 255, 0, 0.1)';
            serieElement.style.border = '1px solid var(--accent-green, #a8ff00)';
            serieElement.innerHTML = `
                <div class="series-number" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: var(--accent-green, #a8ff00); color: var(--bg-primary, #000); border-radius: 50%; font-weight: 600; flex-shrink: 0; box-shadow: 0 0 10px rgba(168, 255, 0, 0.3);">
                    ${serieNumero}
                </div>
                <div class="serie-result" style="flex: 1; display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: var(--text-primary, #fff); font-weight: 600;">${peso}kg × ${reps} reps</span>
                    <span class="completed-icon" style="color: var(--accent-green, #a8ff00); font-size: 1.2em;">✅</span>
                </div>
            `;
        }
    }

    // Verificar se treino está completo
    verificarTreinoCompleto() {
        if (!this.currentWorkout || !this.currentWorkout.exercicios) return false;
        
        return this.currentWorkout.exercicios.every(exercicio => 
            exercicio.status === 'concluido' || 
            (exercicio.series_executadas || 0) >= (exercicio.series || 3)
        );
    }

    // Mostrar tela de conclusão
    mostrarTelaConclusao() {
        console.log('[WorkoutExecution] 🎉 Treino completo! Mostrando tela de conclusão...');
        
        const tempoTotal = this.calcularTempoTotal();
        const totalExercicios = this.currentWorkout.exercicios.length;
        
        // Atualizar elementos se existirem
        this.updateElement('total-time', tempoTotal);
        this.updateElement('total-exercises', totalExercicios.toString());
        
        // Mostrar tela de conclusão
        const completionScreen = document.getElementById('workout-completion');
        if (completionScreen) {
            completionScreen.style.display = 'block';
        } else {
            // Criar tela de conclusão dinamicamente
            this.criarTelaConclusaoDinamica(tempoTotal, totalExercicios);
        }
        
        window.showNotification && window.showNotification('🎉 Treino concluído com sucesso!', 'success');
    }

    // Criar tela de conclusão dinâmica
    criarTelaConclusaoDinamica(tempoTotal, totalExercicios) {
        const workoutScreen = document.querySelector('#workout-screen');
        if (!workoutScreen) return;
        
        const conclusaoHTML = `
            <div id="workout-completion-dynamic" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; z-index: 1000;">
                <div style="background: var(--bg-secondary, #2a2a2a); padding: 40px; border-radius: 16px; text-align: center; max-width: 400px; margin: 20px;">
                    <h2 style="color: var(--text-primary, #fff); margin-bottom: 20px;">🎉 Treino Concluído!</h2>
                    <div style="margin-bottom: 30px;">
                        <div style="margin-bottom: 15px;">
                            <span style="color: var(--text-secondary, #ccc);">Tempo Total:</span><br>
                            <span style="color: var(--accent-green, #a8ff00); font-size: 1.5em; font-weight: bold;">${tempoTotal}</span>
                        </div>
                        <div>
                            <span style="color: var(--text-secondary, #ccc);">Exercícios:</span><br>
                            <span style="color: var(--accent-green, #a8ff00); font-size: 1.5em; font-weight: bold;">${totalExercicios}</span>
                        </div>
                    </div>
                    <button onclick="workoutExecutionManager.voltarParaHome()" style="padding: 12px 24px; background: var(--accent-green, #a8ff00); color: var(--bg-primary, #000); border: none; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 1rem;">
                        Finalizar Treino
                    </button>
                </div>
            </div>
        `;
        
        workoutScreen.insertAdjacentHTML('beforeend', conclusaoHTML);
    }

    // Calcular tempo total
    calcularTempoTotal() {
        if (!this.startTime) return '00:00';
        
        const elapsed = Date.now() - this.startTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // Atualizar progresso
    atualizarProgresso() {
        if (!this.currentWorkout || !this.currentWorkout.exercicios) return;
        
        const totalExercicios = this.currentWorkout.exercicios.length;
        const exerciciosConcluidos = this.currentWorkout.exercicios.filter(ex => 
            ex.status === 'concluido' || 
            (ex.series_executadas || 0) >= (ex.series || 3)
        ).length;
        
        const progresso = totalExercicios > 0 ? (exerciciosConcluidos / totalExercicios) * 100 : 0;
        
        const progressBar = document.getElementById('workout-progress');
        if (progressBar) {
            progressBar.style.width = `${progresso}%`;
        }
        
        console.log(`[WorkoutExecution] Progresso: ${exerciciosConcluidos}/${totalExercicios} (${progresso.toFixed(1)}%)`);
    }

    // Iniciar cronômetro
    iniciarCronometro() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.timerInterval = setInterval(() => {
            const elapsed = Date.now() - this.startTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            
            const timerDisplay = document.getElementById('workout-timer-display');
            if (timerDisplay) {
                timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }

    // Iniciar descanso
    iniciarDescanso(segundos) {
        const restTimer = document.getElementById('rest-timer');
        const restTimeDisplay = document.getElementById('rest-time');
        
        if (!restTimer || !restTimeDisplay) {
            // Criar timer de descanso dinâmico se não existir
            this.criarTimerDescansoDinamico(segundos);
            return;
        }
        
        this.currentRestTime = segundos;
        restTimer.style.display = 'flex';
        
        this.restTimerInterval = setInterval(() => {
            restTimeDisplay.textContent = this.currentRestTime;
            this.currentRestTime--;
            
            if (this.currentRestTime < 0) {
                this.pararDescanso();
            }
        }, 1000);
        
        // Botão para pular descanso
        const skipButton = document.getElementById('skip-rest');
        if (skipButton) {
            skipButton.onclick = () => this.pararDescanso();
        }
    }

    // Criar timer de descanso dinâmico
    criarTimerDescansoDinamico(segundos) {
        console.log('[WorkoutExecution] 🕐 Criando timer de descanso dinâmico...');
        
        const workoutScreen = document.querySelector('#workout-screen');
        if (!workoutScreen) return;
        
        // Remover timer anterior se existir
        const timerAnterior = document.getElementById('rest-timer-dynamic');
        if (timerAnterior) {
            timerAnterior.remove();
        }
        
        const timerHTML = `
            <div id="rest-timer-dynamic" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 999;">
                <div style="background: var(--bg-secondary, #2a2a2a); padding: 40px; border-radius: 16px; text-align: center; max-width: 300px;">
                    <h3 style="color: var(--text-primary, #fff); margin-bottom: 20px;">⏱️ Descanso</h3>
                    <div style="font-size: 3rem; color: var(--accent-green, #a8ff00); font-weight: bold; margin-bottom: 20px;">
                        <span id="rest-time-dynamic">${segundos}</span>s
                    </div>
                    <button onclick="workoutExecutionManager.pularDescanso()" style="padding: 12px 24px; background: var(--accent-green, #a8ff00); color: var(--bg-primary, #000); border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">
                        Pular Descanso
                    </button>
                </div>
            </div>
        `;
        
        workoutScreen.insertAdjacentHTML('beforeend', timerHTML);
        
        // Iniciar contagem
        this.currentRestTime = segundos;
        this.restTimerInterval = setInterval(() => {
            const display = document.getElementById('rest-time-dynamic');
            if (display) {
                display.textContent = this.currentRestTime;
            }
            
            this.currentRestTime--;
            
            if (this.currentRestTime < 0) {
                this.pararDescanso();
            }
        }, 1000);
    }

    // Parar descanso
    pararDescanso() {
        if (this.restTimerInterval) {
            clearInterval(this.restTimerInterval);
            this.restTimerInterval = null;
        }
        
        // Remover timer padrão
        const restTimer = document.getElementById('rest-timer');
        if (restTimer) {
            restTimer.style.display = 'none';
        }
        
        // Remover timer dinâmico
        const restTimerDynamic = document.getElementById('rest-timer-dynamic');
        if (restTimerDynamic) {
            restTimerDynamic.remove();
        }
        
        console.log('[WorkoutExecution] ✅ Descanso finalizado');
    }

    // Função para pular descanso (chamada pelo botão)
    pularDescanso() {
        this.pararDescanso();
        window.showNotification && window.showNotification('Descanso pulado!', 'info');
    }

    // Utilitário para atualizar elementos
    updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) {
            if (typeof content === 'string') {
                element.textContent = content;
            } else {
                element.innerHTML = content;
            }
            return true;
        }
        return false;
    }

    // NOVA FUNÇÃO: Renderizar com atraso para aguardar template
    renderizarComAtraso(exercicios, nome, semana_atual) {
        console.log('[WorkoutExecution] 🎨 Renderizando treino (com atraso)...');
        // Tentar encontrar elementos do template real primeiro
        this.tentarPopularElementosDoTemplate(nome, semana_atual);
        // Encontrar ou criar container para exercícios
        let exerciseContainer = this.encontrarContainerExercicios();
        if (exerciseContainer) {
            this.renderizarExerciciosNoContainer(exercicios, exerciseContainer);
            console.log(`[WorkoutExecution] ✅ ${exercicios.length} exercícios renderizados`);
        } else {
            console.error('[WorkoutExecution] ❌ Não foi possível encontrar/criar container');
            // Última tentativa: criar na raiz do app
            this.criarContainerNaRaiz(exercicios);
        }
        // Atualizar progresso inicial
        this.atualizarProgresso();
    }

    // NOVA FUNÇÃO: Tentar popular elementos que já existem no template
    tentarPopularElementosDoTemplate(nome, semana_atual) {
        console.log('[WorkoutExecution] 🔧 Tentando popular elementos do template existente...');
        // Lista de possíveis IDs que podem existir no template
        const elementosParaTentar = [
            { id: 'workout-title', conteudo: nome || 'Treino do Dia' },
            { id: 'workout-name', conteudo: nome || 'Treino do Dia' },
            { id: 'treino-titulo', conteudo: nome || 'Treino do Dia' },
            { id: 'workout-week', conteudo: `Semana ${semana_atual || 1}` },
            { id: 'semana-atual', conteudo: `Semana ${semana_atual || 1}` },
            { id: 'workout-subtitle', conteudo: `Semana ${semana_atual || 1}` }
        ];
        elementosParaTentar.forEach(({ id, conteudo }) => {
            const elemento = document.getElementById(id);
            if (elemento) {
                elemento.textContent = conteudo;
                console.log(`[WorkoutExecution] ✅ Populado: ${id} = "${conteudo}"`);
            }
        });
        // Tentar encontrar e popular elementos de progresso
        const progressElements = ['workout-progress', 'progress-bar', 'progresso-treino'];
        progressElements.forEach(id => {
            const elemento = document.getElementById(id);
            if (elemento) {
                elemento.style.width = '0%';
                console.log(`[WorkoutExecution] ✅ Progress bar configurado: ${id}`);
            }
        });
    }

    // NOVA FUNÇÃO: Criar container na raiz como último recurso
    criarContainerNaRaiz(exercicios) {
        console.log('[WorkoutExecution] 🆘 Criando container na raiz do app...');
        const app = document.getElementById('app');
        if (!app) {
            console.error('[WorkoutExecution] ❌ Nem o #app foi encontrado!');
            return;
        }
        // Criar overlay completo
        const overlay = document.createElement('div');
        overlay.id = 'workout-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: var(--bg-primary, #1a1a1a);
            z-index: 1000;
            overflow-y: auto;
            padding: 20px;
        `;
        overlay.innerHTML = `
            <div style="max-width: 600px; margin: 0 auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; background: var(--bg-secondary, #2a2a2a); padding: 16px; border-radius: 12px;">
                    <button onclick="workoutExecutionManager.voltarParaHome()" style="background: var(--accent-green, #a8ff00); color: var(--bg-primary, #000); border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold;">← Voltar</button>
                    <div style="text-align: center; color: white;">
                        <h2 style="margin: 0;">Treino em Execução</h2>
                        <p style="margin: 4px 0 0 0; color: #ccc;">Interface de Emergência</p>
                    </div>
                    <div id="workout-timer-display" style="background: #333; padding: 8px 12px; border-radius: 6px; color: white;">00:00</div>
                </div>
                <div style="background: #333; height: 4px; border-radius: 2px; margin-bottom: 20px;">
                    <div id="workout-progress" style="height: 100%; background: var(--accent-green, #a8ff00); width: 0%; border-radius: 2px; transition: width 0.3s;"></div>
                </div>
                <div id="container-exercicios-raiz"></div>
            </div>
        `;
        app.appendChild(overlay);
        const container = document.getElementById('container-exercicios-raiz');
        this.renderizarExerciciosNoContainer(exercicios, container);
        console.log('[WorkoutExecution] 🆘 Container de emergência criado na raiz');
    }

    // Habilitar botão de concluir exercício
    habilitarBotaoConcluirExercicio(exercicioId) {
        const exerciseCard = document.getElementById(`exercise-${exercicioId}`);
        if (exerciseCard) {
            exerciseCard.style.border = '2px solid var(--accent-green, #a8ff00)';
            exerciseCard.style.background = 'linear-gradient(135deg, var(--bg-secondary, #2a2a2a), rgba(168, 255, 0, 0.1))';
            
            // Adicionar badge de concluído
            const header = exerciseCard.querySelector('.exercise-header h3');
            if (header && !header.querySelector('.completed-badge')) {
                header.innerHTML += ' <span class="completed-badge" style="background: var(--accent-green, #a8ff00); color: var(--bg-primary, #000); padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; margin-left: 8px;">✓ CONCLUÍDO</span>';
            }
        }
        
        console.log(`[WorkoutExecution] ✅ Exercício ${exercicioId} concluído`);
    }

    // Voltar para home
    voltarParaHome() {
    const confirmar = confirm('Tem certeza que deseja sair do treino? O progresso será perdido.');
    if (!confirmar) return;
    this.resetarEstado();
    // Remover overlay se existir
    const overlay = document.getElementById('workout-overlay');
    if (overlay) {
        overlay.remove();
    }
    // Remover elementos dinâmicos
    const elementosDinamicos = [
        '#rest-timer-dynamic',
        '#workout-completion-dynamic',
        '#emergency-exercise-container',
        '#workout-exercises-container'
    ];
    elementosDinamicos.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) element.remove();
    });
    // Navegação de volta
    if (window.renderTemplate) {
        window.renderTemplate('home');
    } else if (window.mostrarTela) {
        window.mostrarTela('home-screen');
    } else {
        // Fallback manual
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
            screen.style.display = 'none';
        });
        const homeScreen = document.querySelector('#home-screen');
        if (homeScreen) {
            homeScreen.style.display = 'block';
            homeScreen.classList.add('active');
        }
        }
        
        console.log('[WorkoutExecution] 🏠 Retornando para home');
    }

    // Resetar estado
    resetarEstado() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        if (this.restTimerInterval) {
            clearInterval(this.restTimerInterval);
            this.restTimerInterval = null;
        }
        
        this.currentWorkout = null;
        this.exerciciosExecutados = [];
        this.startTime = null;
        this.currentRestTime = 0;
        this.currentExerciseIndex = 0;
        
        // Limpar estado global
        AppState.set('currentWorkout', null);
        
        console.log('[WorkoutExecution] 🔄 Estado resetado');
    }

    // Função de debug para verificar template
    debugTemplate() {
        console.log('[WorkoutExecution] 🔍 DEBUG: Verificando estrutura do template...');
        
        const elementos = [
            '#workout-screen',
            '#workout-title', 
            '#workout-week',
            '#workout-progress',
            '#exercise-list',
            '#exercise-container',
            '.exercise-container',
            '.workout-content'
        ];
        
        elementos.forEach(selector => {
            const element = document.querySelector(selector);
            console.log(`[DEBUG] ${selector}: ${element ? '✅ ENCONTRADO' : '❌ NÃO ENCONTRADO'}`);
            if (element) {
                console.log(`  - ID: ${element.id}`);
                console.log(`  - Classes: ${element.className}`);
                console.log(`  - TagName: ${element.tagName}`);
            }
        });
        
        return elementos.map(sel => ({
            selector: sel,
            exists: !!document.querySelector(sel)
        }));
    }
}

// Criar instância global
const workoutExecutionManager = new WorkoutExecutionManager();

// Exportar para uso global
window.workoutExecutionManager = workoutExecutionManager;

// Função global de debug
window.debugWorkoutTemplate = () => workoutExecutionManager.debugTemplate();

export default workoutExecutionManager;