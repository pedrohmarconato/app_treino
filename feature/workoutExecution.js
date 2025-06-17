// feature/workoutExecution.js - NOVO LAYOUT INTEGRADO
import WorkoutProtocolService from '../services/workoutProtocolService.js';
import AppState from '../state/appState.js';
import { showNotification } from '../ui/notifications.js';
import { workoutTemplate, exerciseCardTemplate } from '../templates/workoutExecution.js';
import TreinoCacheService from '../services/treinoCacheService.js';
import { getActionIcon, getAchievementIcon, getWorkoutIcon } from '../utils/icons.js';
import { nowInSaoPaulo, toSaoPauloDateString, toSaoPauloISOString } from '../utils/timezoneUtils.js';

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

            // Verificar se treino já está concluído ANTES de carregar dados
            let statusConclusao = { concluido: false };
            if (window.WeeklyPlanService?.verificarTreinoConcluido) {
                try {
                    statusConclusao = await window.WeeklyPlanService.verificarTreinoConcluido(currentUser.id);
                    console.log('[WorkoutExecution] Status de conclusão:', statusConclusao);
                } catch (error) {
                    console.warn('[WorkoutExecution] Erro ao verificar conclusão:', error);
                }
            }
            
            // Bloquear se treino já está concluído
            if (statusConclusao.concluido) {
                if (window.showNotification) {
                    window.showNotification('⚠️ Treino já foi concluído hoje! 🎉', 'warning');
                }
                console.log('[WorkoutExecution] ❌ Tentativa de iniciar treino já concluído bloqueada');
                return;
            }

            // Carregar treino do protocolo
            this.currentWorkout = await WorkoutProtocolService.carregarTreinoParaExecucao(currentUser.id);
            
            if (!this.currentWorkout) {
                throw new Error('Nenhum treino encontrado para hoje');
            }
            
            // Verificar casos especiais
            if (this.currentWorkout.tipo === 'folga') {
                showNotification(`Hoje é dia de descanso! ${getWorkoutIcon('descanso', 'small')}`, 'info');
                return;
            }
            
            if (this.currentWorkout.tipo === 'cardio') {
                showNotification(`Treino de cardio! ${getWorkoutIcon('cardio', 'small')} Configure seu equipamento.`, 'info');
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
                this.renderizarComSeguranca();
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
        
        // Criar elemento da tela
        const workoutScreen = document.createElement('div');
        workoutScreen.id = 'workout-screen';
        workoutScreen.className = 'screen workout-screen';
        workoutScreen.innerHTML = workoutTemplate();
        
        // Adicionar ao container
        appContainer.appendChild(workoutScreen);
        
        // Carregar CSS se necessário
        this.carregarWorkoutCSS();
        
        return workoutScreen;
    }
    
    // Carregar CSS do workout
    carregarWorkoutCSS() {
        // Verificar se CSS já foi carregado
        if (document.querySelector('#workout-execution-css')) {
            return;
        }
        
        const link = document.createElement('link');
        link.id = 'workout-execution-css';
        link.rel = 'stylesheet';
        link.href = './styles/workoutExecution.css';
        document.head.appendChild(link);
    }
    
    // Renderizar informações do treino (função auxiliar mantida para compatibilidade)
    renderizarInfoTreino() {
        const workout = this.currentWorkout;
        
        // Título do treino
        const titleEl = document.getElementById('workout-name');
        if (titleEl) {
            titleEl.textContent = workout.nome || `Treino ${workout.tipo_atividade || 'Força'}`;
        }
        
        // Semana atual
        const weekEl = document.getElementById('current-week');
        if (weekEl) {
            weekEl.textContent = workout.semana_atual || '1';
        }
        
        // Grupos musculares
        const muscleGroupsEl = document.getElementById('muscle-groups');
        if (muscleGroupsEl) {
            const grupos = workout.exercicios.map(ex => 
                ex.exercicio_grupo || ex.grupo_muscular || ''
            ).filter((grupo, index, array) => 
                grupo && array.indexOf(grupo) === index
            );
            muscleGroupsEl.textContent = grupos.join(', ') || workout.tipo_atividade;
        }
        
        // Total de exercícios
        const totalEl = document.getElementById('total-exercises');
        if (totalEl) {
            totalEl.textContent = workout.exercicios.length;
        }
    }
    
    // Renderizar exercícios (versão corrigida)
    renderizarExercicios() {
        console.log('[WorkoutExecution] 📝 Renderizar exercícios (método auxiliar)...');
        
        const container = this.encontrarContainerExercicios();
        if (!container) {
            console.error('[WorkoutExecution] Container de exercícios não encontrado');
            this.criarContainerNaRaiz();
            return;
        }
        
        this.renderizarExerciciosNoContainer(container);
    }
    
    // Confirmar série
    confirmarSerie(exerciseIndex, seriesIndex) {
        try {
            const exercicio = this.currentWorkout.exercicios[exerciseIndex];
            if (!exercicio) {
                throw new Error('Exercício não encontrado');
            }
            
            // Buscar inputs da série
            const seriesItem = document.querySelector(
                `[data-exercise-index="${exerciseIndex}"] [data-series-index="${seriesIndex}"]`
            );
            
            if (!seriesItem) {
                throw new Error('Série não encontrada');
            }
            
            const weightInput = seriesItem.querySelector('.series-weight');
            const repsInput = seriesItem.querySelector('.series-reps');
            
            const peso = parseFloat(weightInput.value) || 0;
            const reps = parseInt(repsInput.value) || 0;
            
            if (peso <= 0 || reps <= 0) {
                showNotification('Por favor, preencha peso e repetições válidos', 'warning');
                return;
            }
            
            // Registrar execução
            this.registrarExecucao(exercicio, peso, reps);
            
            // Marcar série como completa
            this.marcarSerieCompleta(seriesItem);
            
            // Iniciar timer de descanso se não for a última série
            if (seriesIndex < (exercicio.series - 1)) {
                this.iniciarTimerDescanso(exercicio.tempo_descanso || 60);
            }
            
            // Verificar se exercício está completo
            this.verificarExercicioCompleto(exerciseIndex);
            
        } catch (error) {
            console.error('[WorkoutExecution] Erro ao confirmar série:', error);
            showNotification('Erro ao confirmar série', 'error');
        }
    }
    
    // Marcar série como completa
    marcarSerieCompleta(seriesItem) {
        seriesItem.classList.add('completed');
        
        // Animar checkmark
        const btn = seriesItem.querySelector('.series-confirm-btn');
        if (btn) {
            btn.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12" style="stroke-dasharray: 30; stroke-dashoffset: 30; animation: checkmark 0.3s ease-out forwards;"/>
                </svg>
            `;
        }
        
        // Desabilitar inputs
        seriesItem.querySelectorAll('input').forEach(input => {
            input.disabled = true;
        });
    }
    
    // Iniciar timer de descanso
    iniciarTimerDescanso(tempoSegundos) {
        const overlay = document.getElementById('rest-timer-overlay');
        if (!overlay) return;
        
        // Mostrar overlay
        overlay.style.display = 'flex';
        
        // Configurar tempo
        this.currentRestTime = tempoSegundos;
        
        // Atualizar display
        this.atualizarDisplayDescanso();
        
        // Animar círculo
        this.animarCirculoDescanso(tempoSegundos);
        
        // Iniciar countdown
        this.restTimerInterval = setInterval(() => {
            this.currentRestTime--;
            this.atualizarDisplayDescanso();
            
            if (this.currentRestTime <= 0) {
                this.finalizarDescanso();
            }
        }, 1000);
        
        // Configurar botão de pular
        const skipBtn = document.getElementById('skip-rest');
        if (skipBtn) {
            skipBtn.onclick = () => this.finalizarDescanso();
        }
        
        // Atualizar texto motivacional
        const motivationEl = document.getElementById('motivation-text');
        if (motivationEl && window.getRandomMotivation) {
            motivationEl.textContent = window.getRandomMotivation();
        }
    }
    
    // Atualizar display do timer de descanso
    atualizarDisplayDescanso() {
        const displayEl = document.getElementById('rest-timer-display');
        if (displayEl) {
            const minutes = Math.floor(this.currentRestTime / 60);
            const seconds = this.currentRestTime % 60;
            displayEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }
    
    // Animar círculo de progresso do descanso
    animarCirculoDescanso(duration) {
        const circle = document.querySelector('.rest-progress-fill');
        if (circle) {
            const circumference = 2 * Math.PI * 90; // raio = 90
            circle.style.strokeDasharray = circumference;
            circle.style.strokeDashoffset = circumference;
            
            // Animate to 0
            setTimeout(() => {
                circle.style.transition = `stroke-dashoffset ${duration}s linear`;
                circle.style.strokeDashoffset = '0';
            }, 100);
        }
    }
    
    // Finalizar descanso
    finalizarDescanso() {
        // Limpar interval
        if (this.restTimerInterval) {
            clearInterval(this.restTimerInterval);
            this.restTimerInterval = null;
        }
        
        // Esconder overlay
        const overlay = document.getElementById('rest-timer-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
        
        // Reset timer
        this.currentRestTime = 0;
    }
    
    // Atualizar progress bar
    atualizarProgressBar() {
        const totalExercicios = this.currentWorkout.exercicios.length;
        const exerciciosCompletos = this.exerciciosExecutados.length;
        
        const progressEl = document.getElementById('workout-progress');
        if (progressEl) {
            const percentage = (exerciciosCompletos / totalExercicios) * 100;
            progressEl.style.width = `${percentage}%`;
        }
        
        const currentEl = document.getElementById('current-exercise-number');
        if (currentEl) {
            currentEl.textContent = Math.min(exerciciosCompletos + 1, totalExercicios);
        }
    }
    
    // Verificar se exercício está completo
    verificarExercicioCompleto(exerciseIndex) {
        const exerciseCard = document.querySelector(`[data-exercise-index="${exerciseIndex}"]`);
        if (!exerciseCard) return;
        
        const totalSeries = exerciseCard.querySelectorAll('.series-item').length;
        const seriesCompletas = exerciseCard.querySelectorAll('.series-item.completed').length;
        
        if (seriesCompletas >= totalSeries) {
            // Marcar exercício como completo
            exerciseCard.classList.add('completed');
            
            // Adicionar aos executados se ainda não estiver
            if (!this.exerciciosExecutados.includes(exerciseIndex)) {
                this.exerciciosExecutados.push(exerciseIndex);
            }
            
            // Atualizar progress bar
            this.atualizarProgressBar();
            
            // Verificar se treino está completo
            if (this.exerciciosExecutados.length >= this.currentWorkout.exercicios.length) {
                setTimeout(() => this.finalizarTreino(), 1000);
            }
        }
    }
    
    // Finalizar treino
    finalizarTreino() {
        try {
            console.log('[WorkoutExecution] 🏁 Finalizando treino...');
            
            // Verificar se há treino atual
            if (!this.currentWorkout || !this.currentWorkout.exercicios) {
                console.error('[WorkoutExecution] Erro: Nenhum treino ativo para finalizar');
                showNotification('Erro: Nenhum treino ativo', 'error');
                return;
            }
            
            // Parar cronômetro
            this.pararCronometro();
            
            // Calcular estatísticas
            const tempoTotal = this.calcularTempoTotal();
            const totalExercicios = this.currentWorkout.exercicios.length;
            const totalSeries = this.calcularTotalSeries();
            
            // Mostrar tela de conclusão
            this.mostrarTelaCompletacao(tempoTotal, totalExercicios, totalSeries);
            
            // Registrar conclusão do treino
            this.registrarTreinoConcluido();
            
        } catch (error) {
            console.error('[WorkoutExecution] Erro ao finalizar treino:', error);
            showNotification('Erro ao finalizar treino', 'error');
        }
    }
    
    // Mostrar tela de completação
    mostrarTelaCompletacao(tempoTotal, totalExercicios, totalSeries) {
        const overlay = document.getElementById('workout-completion');
        if (!overlay) return;
        
        // Atualizar estatísticas
        const timeEl = document.getElementById('total-time');
        if (timeEl) {
            timeEl.textContent = this.formatarTempo(tempoTotal);
        }
        
        const exercisesEl = document.getElementById('total-exercises-completed');
        if (exercisesEl) {
            exercisesEl.textContent = totalExercicios;
        }
        
        const seriesEl = document.getElementById('total-series');
        if (seriesEl) {
            seriesEl.textContent = totalSeries;
        }
        
        // Mostrar overlay
        overlay.style.display = 'flex';
    }
    
    // Calcular tempo total
    calcularTempoTotal() {
        if (!this.startTime) return 0;
        return Math.floor((Date.now() - this.startTime) / 1000);
    }
    
    // Calcular total de séries
    calcularTotalSeries() {
        return document.querySelectorAll('.series-item.completed').length;
    }
    
    // Formatar tempo
    formatarTempo(segundos) {
        const minutos = Math.floor(segundos / 60);
        const segs = segundos % 60;
        return `${minutos}:${segs.toString().padStart(2, '0')}`;
    }
    
    // Inicializar interações
    inicializarInteracoes() {
        // Adicionar event listeners para inputs
        document.querySelectorAll('.neon-input').forEach(input => {
            input.addEventListener('focus', function() {
                this.parentElement.classList.add('focused');
            });
            
            input.addEventListener('blur', function() {
                this.parentElement.classList.remove('focused');
            });
        });
    }
    
    // Voltar para home
    voltarParaHome() {
        try {
            // Limpar timers
            this.pararCronometro();
            this.finalizarDescanso();
            
            // Resetar estado
            this.resetarEstado();
            
            // Navegar para home
            if (window.mostrarTela) {
                window.mostrarTela('dashboard');
            } else if (window.renderTemplate) {
                window.renderTemplate('dashboard');
            } else {
                // Fallback manual
                location.reload();
            }
            
        } catch (error) {
            console.error('[WorkoutExecution] Erro ao voltar para home:', error);
            location.reload();
        }
    }
    
    // Registrar execução da série no banco
    async registrarExecucao(exercicio, peso, reps) {
        try {
            const currentUser = AppState.get('currentUser');
            if (!currentUser) {
                throw new Error('Usuário não encontrado');
            }

            const execucaoData = {
                usuario_id: currentUser.id,
                exercicio_id: exercicio.exercicio_id,
                protocolo_treino_id: exercicio.id,
                peso_utilizado: peso,
                repeticoes_realizadas: reps,
                data_execucao: nowInSaoPaulo()
            };

            // Usar WorkoutProtocolService para salvar
            await WorkoutProtocolService.registrarExecucaoSerie(execucaoData);
            
            console.log('[WorkoutExecution] ✅ Execução registrada no banco');
            
        } catch (error) {
            console.error('[WorkoutExecution] ❌ Erro ao registrar execução:', error);
            throw error;
        }
    }

    // Registrar treino concluído
    async registrarTreinoConcluido() {
        try {
            const currentUser = AppState.get('currentUser');
            if (!currentUser || !this.currentWorkout) {
                return;
            }

            const conclusaoData = {
                usuario_id: currentUser.id,
                protocolo_id: this.currentWorkout.protocolo_id,
                tipo_atividade: this.currentWorkout.tipo_atividade,
                tempo_total: this.calcularTempoTotal(),
                exercicios_realizados: this.exerciciosExecutados.length,
                data_conclusao: nowInSaoPaulo()
            };

            // Usar WeeklyPlanningService para marcar como concluído
            if (window.WeeklyPlanService?.marcarTreinoConcluido) {
                await window.WeeklyPlanService.marcarTreinoConcluido(currentUser.id);
            }

            console.log('[WorkoutExecution] ✅ Treino marcado como concluído');
            
        } catch (error) {
            console.error('[WorkoutExecution] ❌ Erro ao registrar conclusão:', error);
        }
    }

    // Parar cronômetro
    pararCronometro() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    // Resetar estado
    resetarEstado() {
        this.currentWorkout = null;
        this.exerciciosExecutados = [];
        this.startTime = null;
        this.currentExerciseIndex = 0;
        this.currentRestTime = 0;
    }

    // Renderizar treino (versão corrigida e unificada)
    renderizarTreino() {
        try {
            console.log('[WorkoutExecution] 🎨 Renderizando treino...');
            
            if (!this.currentWorkout || !this.currentWorkout.exercicios) {
                throw new Error('Dados do treino não disponíveis');
            }
            
            console.log('[WorkoutExecution] Dados do treino:', {
                nome: this.currentWorkout.nome,
                exercicios: this.currentWorkout.exercicios.length,
                primeiroExercicio: this.currentWorkout.exercicios[0]
            });
            
            // Aguardar template carregar e renderizar
            setTimeout(() => {
                this.renderizarComSeguranca();
            }, 200);
            
        } catch (error) {
            console.error('[WorkoutExecution] ❌ Erro ao renderizar treino:', error);
            if (window.showNotification) {
                window.showNotification('Erro ao exibir treino: ' + error.message, 'error');
            }
        }
    }

    // NOVA FUNÇÃO: Encontrar o container correto para exercícios (CORRIGIDA)
    encontrarContainerExercicios() {
        console.log('[WorkoutExecution] 🔍 Procurando container no template...');
        
        // ESTRATÉGIA 1: Procurar o container oficial do template
        let container = document.getElementById('exercises-container');
        if (container) {
            console.log('[WorkoutExecution] ✅ Container #exercises-container encontrado');
            return container;
        }
        
        // ESTRATÉGIA 2: Procurar outros containers conhecidos
        const possiveisIds = [
            'exercise-list',
            'workout-content',
            'exercise-container',
            'exercises-list'
        ];
        
        for (const id of possiveisIds) {
            container = document.getElementById(id);
            if (container) {
                console.log(`[WorkoutExecution] ✅ Container alternativo encontrado: #${id}`);
                return container;
            }
        }
        
        // ESTRATÉGIA 3: Procurar containers por classe
        container = document.querySelector('.exercises-container, .workout-content, .exercise-container');
        if (container) {
            console.log('[WorkoutExecution] ✅ Container encontrado por classe:', container.className);
            return container;
        }
        
        // ESTRATÉGIA 4: Criar dentro do workout-screen
        const workoutScreen = document.querySelector('#workout-screen');
        if (workoutScreen) {
            console.log('[WorkoutExecution] 🔨 Criando container dentro do workout-screen...');
            container = document.createElement('div');
            container.id = 'exercises-container-dynamic';
            container.className = 'exercises-container';
            container.style.cssText = `
                padding: 20px;
                max-width: 600px;
                margin: 0 auto;
                min-height: 400px;
                background: transparent;
            `;
            workoutScreen.appendChild(container);
            console.log('[WorkoutExecution] ✅ Container dinâmico criado');
            return container;
        }
        
        console.error('[WorkoutExecution] ❌ Não foi possível encontrar/criar container para exercícios');
        return null;
    }

    renderizarExerciciosNoContainer(container) {
        try {
            console.log('[WorkoutExecution] 📝 Renderizando exercícios no container...');
            
            if (!container) {
                throw new Error('Container não fornecido');
            }
            
            const exercicios = this.currentWorkout.exercicios;
            
            if (!exercicios || exercicios.length === 0) {
                container.innerHTML = `
                    <div class="no-exercises" style="padding: 40px; text-align: center; color: #999;">
                        <h3>Nenhum exercício encontrado</h3>
                        <p>Verifique seu planejamento semanal</p>
                    </div>
                `;
                return;
            }
            
            console.log(`[WorkoutExecution] Renderizando ${exercicios.length} exercícios`);
            container.innerHTML = '';
            
            exercicios.forEach((exercicio, index) => {
                console.log(`[WorkoutExecution] Renderizando exercício ${index + 1}:`, {
                    nome: exercicio.exercicio_nome || exercicio.nome,
                    id: exercicio.exercicio_id || exercicio.id
                });
                
                const exerciseCard = this.criarCardExercicioCompleto(exercicio, index);
                container.appendChild(exerciseCard);
            });
            
            console.log('[WorkoutExecution] ✅ Exercícios renderizados no container');
            
        } catch (error) {
            console.error('[WorkoutExecution] ❌ Erro ao renderizar exercícios:', error);
            if (container) {
                container.innerHTML = `
                    <div style="padding: 20px; color: #ff6b6b; text-align: center;">
                        <h3>Erro ao carregar exercícios</h3>
                        <p>${error.message}</p>
                    </div>
                `;
            }
        }
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
                    <span>${getActionIcon('repeat')} ${numSeries} séries</span>
                    <span>${getAchievementIcon('target')} ${repeticoesAlvo} reps</span>
                    <span>${getActionIcon('timer')} ${tempoDescanso}s descanso</span>
                    ${pesoSugerido ? `<span>${getActionIcon('weight')} ${pesoSugerido}kg sugerido</span>` : ''}
                </div>
                ${grupoMuscular || equipamento ? `
                    <div class="exercise-meta" style="display: flex; gap: 12px; margin-bottom: 12px; font-size: 0.75rem; color: var(--text-secondary, #999);">
                        ${grupoMuscular ? `<span>${getAchievementIcon('target')} ${grupoMuscular}</span>` : ''}
                        ${equipamento ? `<span>${getActionIcon('weight')} ${equipamento}</span>` : ''}
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
                    <h3 style="color: var(--text-primary, #fff); margin-bottom: 20px;">${getActionIcon('timer')} Descanso</h3>
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

    // NOVA FUNÇÃO: Renderizar com segurança (VERSÃO CORRIGIDA)
    renderizarComSeguranca() {
        console.log('[WorkoutExecution] 🎨 Renderizando treino com segurança...');
        
        try {
            // 1. Popular elementos do template
            this.popularElementosDoTemplate();
            
            // 2. Encontrar container para exercícios
            const exerciseContainer = this.encontrarContainerExercicios();
            
            if (!exerciseContainer) {
                console.error('[WorkoutExecution] ❌ Container não encontrado, criando fallback');
                this.criarContainerNaRaiz();
                return;
            }
            
            // 3. Renderizar exercícios
            this.renderizarExerciciosNoContainer(exerciseContainer);
            
            // 4. Atualizar progresso
            this.atualizarProgresso();
            
            // 5. Inicializar cronômetro
            this.iniciarCronometro();
            
            console.log('[WorkoutExecution] ✅ Renderização completa');
            
        } catch (error) {
            console.error('[WorkoutExecution] ❌ Erro na renderização segura:', error);
            this.criarContainerNaRaiz();
        }
    }

    // Popular elementos do template (VERSÃO CORRIGIDA)
    popularElementosDoTemplate() {
        console.log('[WorkoutExecution] 🔧 Populando elementos do template...');
        
        const workout = this.currentWorkout;
        const nome = workout.nome || 'Treino do Dia';
        const semana = workout.semana_atual || 1;
        
        // Elementos de informação do treino
        this.updateElement('workout-name', nome);
        this.updateElement('workout-title', nome);
        this.updateElement('current-week', semana.toString());
        
        // Grupos musculares
        if (workout.exercicios && workout.exercicios.length > 0) {
            const grupos = workout.exercicios
                .map(ex => ex.exercicio_grupo || ex.grupo_muscular || ex.exercicios?.grupo_muscular)
                .filter((grupo, index, array) => grupo && array.indexOf(grupo) === index)
                .join(', ');
            
            this.updateElement('muscle-groups', grupos || 'Treino de Força');
        }
        
        // Total de exercícios
        this.updateElement('total-exercises', workout.exercicios.length.toString());
        this.updateElement('current-exercise-number', '1');
        
        // Reset progress bar
        const progressEl = document.getElementById('workout-progress');
        if (progressEl) {
            progressEl.style.width = '0%';
        }
        
        console.log('[WorkoutExecution] ✅ Elementos do template populados');
    }

    // Criar container na raiz como último recurso (VERSÃO CORRIGIDA)
    criarContainerNaRaiz() {
        console.log('[WorkoutExecution] 🆘 Criando container de emergência...');
        
        const app = document.getElementById('app');
        if (!app) {
            console.error('[WorkoutExecution] ❌ Elemento #app não encontrado!');
            return;
        }
        
        // Remover overlay anterior se existir
        const existingOverlay = document.getElementById('workout-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }
        
        const workout = this.currentWorkout;
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
                        <h2 style="margin: 0;">${workout.nome || 'Treino em Execução'}</h2>
                        <p style="margin: 4px 0 0 0; color: #ccc;">Interface de Emergência</p>
                    </div>
                    <div id="workout-timer-display" style="background: #333; padding: 8px 12px; border-radius: 6px; color: white;">00:00</div>
                </div>
                <div style="background: #333; height: 4px; border-radius: 2px; margin-bottom: 20px;">
                    <div id="workout-progress" style="height: 100%; background: var(--accent-green, #a8ff00); width: 0%; border-radius: 2px; transition: width 0.3s;"></div>
                </div>
                <div id="container-exercicios-emergency"></div>
            </div>
        `;
        
        app.appendChild(overlay);
        
        // Renderizar exercícios no container de emergência
        const container = document.getElementById('container-exercicios-emergency');
        if (container) {
            this.renderizarExerciciosNoContainer(container);
        }
        
        // Inicializar cronômetro
        this.iniciarCronometro();
        
        console.log('[WorkoutExecution] 🆘 Container de emergência criado e renderizado');
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

    // RENDERIZAÇÃO SEGURA: Sistema robusto com múltiplas estratégias
    renderizarComSeguranca() {
        console.log('[ExecucaoTreino] 🛡️ Iniciando renderização segura...');
        
        try {
            if (!this.currentWorkout) {
                throw new Error('Nenhum treino carregado para renderizar');
            }

            console.log('[ExecucaoTreino] 📋 Dados do treino carregado:', {
                nome: this.currentWorkout.nome,
                tipo: this.currentWorkout.tipo_atividade,
                totalExercicios: this.currentWorkout.exercicios?.length || 0
            });

            // 1. Preencher informações básicas do treino
            this.preencherInformacoesTreino();
            
            // 2. Localizar container para os exercícios
            const container = this.localizarContainerExercicios();
            
            if (container) {
                // 3. Renderizar exercícios no container localizado
                this.renderizarExerciciosNoContainer(container);
                
                // 4. Configurar eventos e interações
                this.configurarEventosInteracao();
                
                console.log('[ExecucaoTreino] ✅ Renderização concluída com sucesso!');
            } else {
                console.warn('[ExecucaoTreino] ⚠️ Container não encontrado, ativando modo emergência');
                this.ativarModoEmergencia();
            }
            
        } catch (error) {
            console.error('[ExecucaoTreino] ❌ Erro durante renderização:', error);
            this.ativarModoEmergencia();
        }
    }

    // PREENCHER INFORMAÇÕES: Atualiza dados básicos do treino na interface
    preencherInformacoesTreino() {
        const treino = this.currentWorkout;
        
        const informacoes = [
            { id: 'workout-name', conteudo: treino.nome || `Treino ${treino.tipo_atividade || 'do Dia'}` },
            { id: 'workout-title', conteudo: treino.nome || `Treino ${treino.tipo_atividade || 'do Dia'}` },
            { id: 'current-week', conteudo: treino.semana_atual || '1' },
            { id: 'muscle-groups', conteudo: this.obterGruposMusculares() },
            { id: 'total-exercises', conteudo: (treino.exercicios?.length || 0).toString() },
            { id: 'current-exercise-number', conteudo: '1' }
        ];

        informacoes.forEach(({ id, conteudo }) => {
            const elemento = document.getElementById(id);
            if (elemento) {
                elemento.textContent = conteudo;
                console.log(`[ExecucaoTreino] ✅ Informação atualizada: ${id} = "${conteudo}"`);
            }
        });
    }

    // OBTER GRUPOS MUSCULARES: Extrai e formata grupos musculares dos exercícios
    obterGruposMusculares() {
        if (!this.currentWorkout?.exercicios) return this.currentWorkout?.tipo_atividade || '';
        
        const grupos = this.currentWorkout.exercicios
            .map(ex => ex.exercicio_grupo || ex.grupo_muscular || ex.exercicios?.grupo_muscular || '')
            .filter((grupo, index, array) => grupo && array.indexOf(grupo) === index);
            
        return grupos.join(', ') || this.currentWorkout.tipo_atividade || '';
    }

    // LOCALIZAR CONTAINER: Busca local para renderizar exercícios com múltiplas estratégias
    localizarContainerExercicios() {
        console.log('[ExecucaoTreino] 🔍 Buscando container para exercícios...');
        
        // Estratégia 1: Container oficial do template
        let container = document.getElementById('exercises-container');
        if (container) {
            console.log('[ExecucaoTreino] ✅ Container principal encontrado: #exercises-container');
            return container;
        }
        
        // Estratégia 2: IDs alternativos comuns
        const idsAlternativos = [
            'exercise-container',
            'exercicios-container', 
            'workout-exercises',
            'treino-exercicios',
            'lista-exercicios'
        ];
        
        for (const id of idsAlternativos) {
            container = document.getElementById(id);
            if (container) {
                console.log(`[ExecucaoTreino] ✅ Container alternativo encontrado: #${id}`);
                return container;
            }
        }
        
        // Estratégia 3: Busca por classes CSS
        const seletoresClasse = [
            '.exercises-container',
            '.exercise-container', 
            '.workout-content .container',
            '.workout-exercises',
            '.lista-exercicios'
        ];
        
        for (const seletor of seletoresClasse) {
            container = document.querySelector(seletor);
            if (container) {
                console.log(`[ExecucaoTreino] ✅ Container por classe encontrado: ${seletor}`);
                return container;
            }
        }
        
        // Estratégia 4: Criar container dentro da tela de treino
        const telaTreino = document.querySelector('#workout-screen');
        if (telaTreino) {
            console.log('[ExecucaoTreino] 🔨 Criando container dinâmico dentro da tela...');
            container = document.createElement('div');
            container.id = 'exercises-container-dinamico';
            container.className = 'exercises-container';
            container.style.cssText = `
                padding: 20px;
                max-width: 600px;
                margin: 0 auto;
                min-height: 400px;
            `;
            telaTreino.appendChild(container);
            return container;
        }
        
        console.warn('[ExecucaoTreino] ⚠️ Nenhum container encontrado');
        return null;
    }

    // NOVA FUNÇÃO: Renderizar exercícios de forma segura
    renderizarExerciciosSeguro(container) {
        const exercicios = this.currentWorkout.exercicios;
        
        if (!exercicios || exercicios.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #ccc;">
                    <h3>Nenhum exercício encontrado</h3>
                    <p>Verifique se o treino foi configurado corretamente.</p>
                </div>
            `;
            return;
        }
        
        console.log(`[WorkoutExecution] 🏋️‍♂️ Renderizando ${exercicios.length} exercícios...`);
        
        container.innerHTML = '';
        
        exercicios.forEach((exercicio, index) => {
            try {
                const exerciseCard = this.criarCardExercicioSeguro(exercicio, index);
                container.appendChild(exerciseCard);
            } catch (error) {
                console.error(`[WorkoutExecution] ❌ Erro ao renderizar exercício ${index}:`, error);
                // Continuar com os outros exercícios
            }
        });
        
        console.log(`[WorkoutExecution] ✅ ${exercicios.length} exercícios renderizados com sucesso`);
    }

    // NOVA FUNÇÃO: Criar card de exercício de forma segura
    criarCardExercicioSeguro(exercicio, index) {
        // Extrair dados com fallbacks robustos
        const exerciseName = exercicio.exercicio_nome || 
                            exercicio.nome || 
                            exercicio.exercicios?.nome || 
                            `Exercício ${index + 1}`;
                            
        const muscleGroup = exercicio.exercicio_grupo || 
                           exercicio.grupo_muscular || 
                           exercicio.exercicios?.grupo_muscular || 
                           '';
                           
        const series = exercicio.series || 3;
        const repsTarget = exercicio.repeticoes_alvo || exercicio.repeticoes || 12;
        const restTime = exercicio.tempo_descanso || 60;
        const suggestedWeight = exercicio.peso_sugerido || 
                               exercicio.pesos_sugeridos?.peso_base || 
                               '';

        const card = document.createElement('div');
        card.className = 'exercise-card';
        card.id = `exercise-${exercicio.exercicio_id || index}`;
        card.dataset.exerciseIndex = index;
        
        card.innerHTML = `
            <div class="exercise-card-header">
                <div class="exercise-number">${index + 1}</div>
                <div class="exercise-info">
                    <h3 class="exercise-name">${exerciseName}</h3>
                    <p class="exercise-muscle">${muscleGroup}</p>
                </div>
            </div>
            
            <div class="series-container" id="series-container-${index}">
                ${this.gerarSeriesHTMLSeguro(exercicio, index, series, repsTarget, suggestedWeight)}
            </div>
            
            ${restTime ? `
                <div class="rest-info" style="margin-top: 16px; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px; font-size: 0.875rem; color: #ccc;">
                    ${getActionIcon('timer')} Descanso: ${restTime}s entre séries
                </div>
            ` : ''}
        `;
        
        return card;
    }

    // NOVA FUNÇÃO: Gerar HTML das séries de forma segura
    gerarSeriesHTMLSeguro(exercicio, exerciseIndex, numSeries, repsTarget, suggestedWeight) {
        let html = '';
        
        for (let i = 0; i < numSeries; i++) {
            html += `
                <div class="series-item" data-series-index="${i}" data-exercise-index="${exerciseIndex}" style="display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.03); padding: 16px; border-radius: 12px; margin-bottom: 8px;">
                    <div class="series-number" style="width: 32px; height: 32px; background: rgba(255,255,255,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #ccc;">
                        ${i + 1}
                    </div>
                    <div class="series-inputs" style="flex: 1; display: flex; gap: 12px;">
                        <div class="input-group" style="flex: 1;">
                            <input type="number" 
                                   class="series-weight neon-input" 
                                   placeholder="${suggestedWeight || 'Peso'}"
                                   step="0.5" 
                                   min="0"
                                   inputmode="decimal"
                                   pattern="[0-9]*"
                                   style="width: 100%; padding: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: #fff; text-align: center;">
                        </div>
                        <span style="color: #ccc; display: flex; align-items: center;">×</span>
                        <div class="input-group" style="flex: 1;">
                            <input type="number" 
                                   class="series-reps neon-input" 
                                   placeholder="${repsTarget}"
                                   min="1"
                                   inputmode="numeric"
                                   pattern="[0-9]*"
                                   style="width: 100%; padding: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: #fff; text-align: center;">
                        </div>
                    </div>
                    <button class="series-confirm-btn" 
                            onclick="workoutExecutionManager.confirmarSerieSegura(${exerciseIndex}, ${i})"
                            style="width: 40px; height: 40px; background: linear-gradient(135deg, #13f1fc, #0470dc); border: none; border-radius: 8px; color: #000; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                        ✓
                    </button>
                </div>
            `;
        }
        
        return html;
    }

    // NOVA FUNÇÃO: Configurar interações seguras
    configurarInteracoesSeguras() {
        // Adicionar event listeners para inputs com efeito neon
        document.querySelectorAll('.neon-input').forEach(input => {
            input.addEventListener('focus', function() {
                this.style.borderColor = '#13f1fc';
                this.style.boxShadow = '0 0 10px rgba(19, 241, 252, 0.3)';
            });
            
            input.addEventListener('blur', function() {
                this.style.borderColor = 'rgba(255,255,255,0.2)';
                this.style.boxShadow = 'none';
            });
        });
    }

    // NOVA FUNÇÃO: Confirmar série de forma segura
    confirmarSerieSegura(exerciseIndex, seriesIndex) {
        try {
            console.log(`[WorkoutExecution] ✅ Confirmando série ${seriesIndex + 1} do exercício ${exerciseIndex + 1}`);
            
            const seriesItem = document.querySelector(
                `[data-exercise-index="${exerciseIndex}"][data-series-index="${seriesIndex}"]`
            );
            
            if (!seriesItem) {
                throw new Error('Série não encontrada na interface');
            }
            
            const weightInput = seriesItem.querySelector('.series-weight');
            const repsInput = seriesItem.querySelector('.series-reps');
            
            const peso = parseFloat(weightInput.value);
            const reps = parseInt(repsInput.value);
            
            if (!peso || !reps || peso <= 0 || reps <= 0) {
                showNotification('Por favor, preencha peso e repetições válidos', 'warning');
                return;
            }
            
            // Marcar série como completa visualmente
            this.marcarSerieCompletaSegura(seriesItem, peso, reps);
            
            // Verificar progresso do exercício
            this.verificarProgressoExercicioSeguro(exerciseIndex);
            
            showNotification(`Série registrada: ${peso}kg × ${reps} reps`, 'success');
            
        } catch (error) {
            console.error('[WorkoutExecution] ❌ Erro ao confirmar série:', error);
            showNotification('Erro ao registrar série', 'error');
        }
    }

    // NOVA FUNÇÃO: Marcar série como completa
    marcarSerieCompletaSegura(seriesItem, peso, reps) {
        seriesItem.classList.add('completed');
        seriesItem.style.background = 'rgba(19, 241, 252, 0.1)';
        seriesItem.style.border = '1px solid #13f1fc';
        
        // Atualizar conteúdo
        const inputs = seriesItem.querySelector('.series-inputs');
        inputs.innerHTML = `
            <div style="flex: 1; color: #fff; font-weight: 600;">
                ${peso}kg × ${reps} reps
            </div>
        `;
        
        // Atualizar botão
        const btn = seriesItem.querySelector('.series-confirm-btn');
        btn.innerHTML = '✅';
        btn.style.background = '#00ff88';
        btn.disabled = true;
    }

    // NOVA FUNÇÃO: Verificar progresso do exercício
    verificarProgressoExercicioSeguro(exerciseIndex) {
        const exerciseCard = document.querySelector(`[data-exercise-index="${exerciseIndex}"]`);
        const totalSeries = exerciseCard.querySelectorAll('.series-item').length;
        const seriesCompletas = exerciseCard.querySelectorAll('.series-item.completed').length;
        
        console.log(`[WorkoutExecution] 📊 Progresso exercício ${exerciseIndex + 1}: ${seriesCompletas}/${totalSeries}`);
        
        if (seriesCompletas >= totalSeries) {
            // Exercício completo
            exerciseCard.style.border = '2px solid #00ff88';
            exerciseCard.style.background = 'rgba(0, 255, 136, 0.05)';
            
            // Adicionar aos executados
            if (!this.exerciciosExecutados.includes(exerciseIndex)) {
                this.exerciciosExecutados.push(exerciseIndex);
            }
            
            // Verificar se treino está completo
            if (this.exerciciosExecutados.length >= this.currentWorkout.exercicios.length) {
                setTimeout(() => this.mostrarConclusaoTreinoSegura(), 1000);
            }
        }
        
        // Atualizar progress bar
        this.atualizarProgressBar();
    }

    // NOVA FUNÇÃO: Mostrar conclusão do treino com avaliação
    async mostrarConclusaoTreinoSegura() {
        try {
            // Obter dados para avaliação
            const dadosAvaliacao = await TreinoCacheService.obterDadosParaAvaliacao();
            
            if (dadosAvaliacao.success && dadosAvaliacao.data) {
                // Importar e mostrar modal de avaliação
                const { AvaliacaoTreinoComponent } = await import('../components/avaliacaoTreino.js');
                AvaliacaoTreinoComponent.mostrarModalAvaliacao(dadosAvaliacao.data);
            } else {
                // Fallback para tela básica se houver erro
                this.mostrarConclusaoBasica();
            }
            
            // Registrar conclusão
            this.registrarTreinoConcluido();
            
            console.log('[WorkoutExecution] 🎉 Treino concluído - modal de avaliação exibido');
            
        } catch (error) {
            console.error('[WorkoutExecution] Erro ao mostrar avaliação:', error);
            // Fallback para tela básica
            this.mostrarConclusaoBasica();
        }
    }
    
    // Fallback: Tela básica de conclusão
    mostrarConclusaoBasica() {
        const tempoTotal = this.calcularTempoTotal();
        const totalExercicios = this.currentWorkout.exercicios.length;
        
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.95);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1100;
            color: white;
            text-align: center;
        `;
        
        overlay.innerHTML = `
            <div style="max-width: 400px; padding: 40px;">
                <h1 style="color: #13f1fc; margin-bottom: 20px; font-size: 2.5rem;">🎉 Treino Concluído!</h1>
                <div style="margin-bottom: 30px;">
                    <div style="margin-bottom: 15px;">
                        <span style="color: #ccc;">Tempo Total:</span><br>
                        <span style="color: #13f1fc; font-size: 1.5rem; font-weight: bold;">${tempoTotal}</span>
                    </div>
                    <div>
                        <span style="color: #ccc;">Exercícios:</span><br>
                        <span style="color: #13f1fc; font-size: 1.5rem; font-weight: bold;">${totalExercicios}</span>
                    </div>
                </div>
                <button onclick="workoutExecutionManager.voltarParaHome()" 
                        style="padding: 16px 32px; background: linear-gradient(135deg, #13f1fc, #0470dc); color: #000; border: none; border-radius: 12px; font-weight: bold; cursor: pointer; font-size: 1.1rem;">
                    Finalizar Treino
                </button>
            </div>
        `;
        
        document.body.appendChild(overlay);
    }

    // NOVA FUNÇÃO: Criar interface de emergência
    criarInterfaceEmergencia() {
        console.log('[WorkoutExecution] 🆘 Criando interface de emergência...');
        
        const app = document.getElementById('app');
        if (!app) return;
        
        // Remover conteúdo existente
        app.innerHTML = '';
        
        const exercicios = this.currentWorkout?.exercicios || [];
        
        app.innerHTML = `
            <div style="background: #1a1a1a; min-height: 100vh; padding: 20px; color: white;">
                <div style="max-width: 600px; margin: 0 auto;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; background: #2a2a2a; padding: 16px; border-radius: 12px;">
                        <button onclick="workoutExecutionManager.voltarParaHome()" 
                                style="background: #13f1fc; color: #000; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold;">
                            ← Voltar
                        </button>
                        <div style="text-align: center;">
                            <h2 style="margin: 0;">${this.currentWorkout?.nome || 'Treino em Execução'}</h2>
                            <p style="margin: 4px 0 0 0; color: #ccc;">Interface de Emergência</p>
                        </div>
                        <div id="emergency-timer" style="background: #333; padding: 8px 12px; border-radius: 6px;">00:00</div>
                    </div>
                    
                    <div style="background: #333; height: 4px; border-radius: 2px; margin-bottom: 20px;">
                        <div id="emergency-progress" style="height: 100%; background: #13f1fc; width: 0%; border-radius: 2px; transition: width 0.3s;"></div>
                    </div>
                    
                    <div id="emergency-exercises">
                        ${exercicios.length ? this.gerarExerciciosEmergencia(exercicios) : '<p>Nenhum exercício encontrado</p>'}
                    </div>
                </div>
            </div>
        `;
        
        // Iniciar cronômetro
        this.iniciarCronometro();
    }

    // NOVA FUNÇÃO: Gerar exercícios para interface de emergência
    gerarExerciciosEmergencia(exercicios) {
        return exercicios.map((exercicio, index) => {
            const nome = exercicio.exercicio_nome || exercicio.nome || `Exercício ${index + 1}`;
            const series = exercicio.series || 3;
            
            return `
                <div style="background: #2a2a2a; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
                    <h3 style="margin: 0 0 16px 0; color: #13f1fc;">${index + 1}. ${nome}</h3>
                    <div id="emergency-series-${index}">
                        ${Array.from({length: series}, (_, i) => `
                            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px; padding: 12px; background: #1a1a1a; border-radius: 8px;">
                                <span style="width: 24px; text-align: center; color: #ccc;">${i + 1}</span>
                                <input type="number" placeholder="Peso" inputmode="decimal" pattern="[0-9]*" step="0.5" min="0" style="flex: 1; padding: 8px; background: #333; border: 1px solid #555; border-radius: 4px; color: white;">
                                <span style="color: #ccc;">×</span>
                                <input type="number" placeholder="Reps" inputmode="numeric" pattern="[0-9]*" min="1" style="flex: 1; padding: 8px; background: #333; border: 1px solid #555; border-radius: 4px; color: white;">
                                <button onclick="workoutExecutionManager.confirmarSerieEmergencia(${index}, ${i})" 
                                        style="background: #13f1fc; color: #000; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">✓</button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    // NOVA FUNÇÃO: Confirmar série na interface de emergência
    confirmarSerieEmergencia(exerciseIndex, seriesIndex) {
        console.log(`[WorkoutExecution] Série ${seriesIndex + 1} do exercício ${exerciseIndex + 1} confirmada na interface de emergência`);
        showNotification('Série registrada!', 'success');
    }

    // Debug exercícios
    debugExercicios() {
        console.log('[DEBUG] Estado atual do workout:', {
            hasWorkout: !!this.currentWorkout,
            exercicios: this.currentWorkout?.exercicios?.length || 0,
            data: this.currentWorkout
        });
        return this.currentWorkout;
    }

    // Função de debug para verificar template
    debugTemplate() {
        console.log('[WorkoutExecution] 🔍 DEBUG: Verificando estrutura do template...');
        
        const elementos = [
            '#workout-screen',
            '#workout-name', 
            '#exercises-container',
            '#workout-progress',
            '#exercise-list',
            '#exercise-container',
            '.exercise-container',
            '.workout-content',
            '.exercises-container'
        ];
        
        elementos.forEach(selector => {
            const element = document.querySelector(selector);
            console.log(`[DEBUG] ${selector}: ${element ? '✅ ENCONTRADO' : '❌ NÃO ENCONTRADO'}`);
            if (element) {
                console.log(`  - ID: ${element.id}`);
                console.log(`  - Classes: ${element.className}`);
                console.log(`  - TagName: ${element.tagName}`);
                console.log(`  - innerHTML length: ${element.innerHTML.length}`);
            }
        });
        
        // Debug do estado atual
        console.log('[DEBUG] Estado atual do workout:', {
            currentWorkout: !!this.currentWorkout,
            exercicios: this.currentWorkout?.exercicios?.length || 0,
            nome: this.currentWorkout?.nome
        });
        
        return elementos.map(sel => ({
            selector: sel,
            exists: !!document.querySelector(sel)
        }));
    }
    
    // CONFIGURAR EVENTOS DE INTERAÇÃO: Configura eventos de clique, mudança, etc.
    configurarEventosInteracao() {
        console.log('[ExecucaoTreino] ⚙️ Configurando eventos de interação...');
        
        try {
            // Configurar eventos de botões de finalizar treino
            const finishButtons = document.querySelectorAll('[id*="finish"], [class*="finish"], [data-action="finish"]');
            finishButtons.forEach(btn => {
                btn.addEventListener('click', () => this.finalizarTreino());
            });
            
            // Configurar eventos de inputs de peso/reps
            const inputs = document.querySelectorAll('input[type="number"], input[data-series]');
            inputs.forEach(input => {
                input.addEventListener('change', (e) => this.salvarProgresso(e));
                input.addEventListener('blur', (e) => this.salvarProgresso(e));
            });
            
            console.log('[ExecucaoTreino] ✅ Eventos configurados com sucesso');
            
        } catch (error) {
            console.error('[ExecucaoTreino] ❌ Erro ao configurar eventos:', error);
        }
    }

    // Salvar progresso quando input é alterado
    salvarProgresso(event) {
        try {
            const input = event.target;
            const valor = input.value;
            
            // Identificar qual série/exercício está sendo alterado  
            const seriesItem = input.closest('[data-series]');
            if (!seriesItem) return;
            
            const exerciseIndex = parseInt(seriesItem.dataset.exerciseIndex) || 0;
            const seriesIndex = parseInt(seriesItem.dataset.series) || 0;
            
            console.log(`[WorkoutExecution] Salvando progresso: Exercício ${exerciseIndex}, Série ${seriesIndex}, Valor: ${valor}`);
            
            // Salvar no cache local para evitar perda de dados
            if (this.currentWorkout && this.currentWorkout.exercicios) {
                const exercicio = this.currentWorkout.exercicios[exerciseIndex];
                if (exercicio && exercicio.series && exercicio.series[seriesIndex]) {
                    // Identificar se é peso ou reps pelo type ou classe
                    if (input.classList.contains('peso-input') || input.dataset.type === 'peso') {
                        exercicio.series[seriesIndex].peso = valor;
                    } else if (input.classList.contains('reps-input') || input.dataset.type === 'reps') {
                        exercicio.series[seriesIndex].reps = valor;
                    }
                }
            }
            
        } catch (error) {
            console.error('[WorkoutExecution] Erro ao salvar progresso:', error);
        }
    }
    
    // ATIVAR MODO EMERGÊNCIA: Fallback quando algo falha na renderização
    ativarModoEmergencia() {
        console.warn('[ExecucaoTreino] 🚨 Ativando modo emergência...');
        
        try {
            // Tentar encontrar qualquer container disponível
            const containers = [
                document.getElementById('workout-content'),
                document.querySelector('.workout-container'),
                document.querySelector('#app .active'),
                document.querySelector('#app')
            ];
            
            const container = containers.find(c => c !== null);
            
            if (container) {
                container.innerHTML = `
                    <div class="emergency-mode">
                        <h3>⚠️ Modo Emergência Ativo</h3>
                        <p>Houve um problema na renderização do treino.</p>
                        <button onclick="location.reload()" class="btn-emergency">🔄 Recarregar Página</button>
                        <button onclick="window.renderTemplate('home')" class="btn-emergency">🏠 Voltar ao Início</button>
                    </div>
                `;
                
                console.log('[ExecucaoTreino] 🚨 Modo emergência ativado no container:', container.id || container.className);
            } else {
                console.error('[ExecucaoTreino] ❌ Nenhum container disponível para modo emergência');
            }
            
        } catch (error) {
            console.error('[ExecucaoTreino] ❌ Erro no modo emergência:', error);
        }
    }

    // Função de debug específica para exercícios
    debugExercicios() {
        console.log('[WorkoutExecution] 🔍 DEBUG: Verificando exercícios...');
        
        if (!this.currentWorkout) {
            console.log('[DEBUG] ❌ Nenhum workout carregado');
            return;
        }
        
        const exercicios = this.currentWorkout.exercicios;
        console.log(`[DEBUG] Total de exercícios: ${exercicios?.length || 0}`);
        
        if (exercicios && exercicios.length > 0) {
            exercicios.forEach((ex, index) => {
                console.log(`[DEBUG] Exercício ${index + 1}:`, {
                    id: ex.exercicio_id || ex.id,
                    nome: ex.exercicio_nome || ex.nome || ex.exercicios?.nome,
                    grupo: ex.exercicio_grupo || ex.grupo_muscular,
                    series: ex.series,
                    estrutura: Object.keys(ex)
                });
            });
        }
        
        return {
            totalExercicios: exercicios?.length || 0,
            exercicios: exercicios || []
        };
    }
}

// Criar instância global
const workoutExecutionManager = new WorkoutExecutionManager();

// Exportar para uso global
window.workoutExecutionManager = workoutExecutionManager;

// Funções globais de debug
window.debugWorkoutTemplate = () => workoutExecutionManager.debugTemplate();
window.debugWorkoutExercicios = () => workoutExecutionManager.debugExercicios();
window.forceRenderWorkout = () => {
    if (workoutExecutionManager.currentWorkout) {
        workoutExecutionManager.renderizarComSeguranca();
    } else {
        console.log('❌ Nenhum workout carregado para renderizar');
    }
};

export default workoutExecutionManager;