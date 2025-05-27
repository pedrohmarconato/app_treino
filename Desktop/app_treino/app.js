// app.js

// --- Configuração do Supabase ---
// ATENÇÃO: Preencha com suas credenciais reais do projeto Supabase
const supabase = window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.key);

// --- Funções auxiliares ---
async function fetchUsuarios() {
    const { data, error } = await supabase.from('usuarios').select('*');
    if (error) {
        alert('Erro ao buscar usuários');
        return [];
    }
    return data;
}

async function fetchPlanoDeTreinoDoUsuario(userId) {
    // Busca diretamente na view v_plano_usuario_semana
    const { data, error } = await supabase
        .from('v_plano_usuario_semana')
        .select('*')
        .eq('usuario_id', userId);

    if (error) {
        console.error('Erro ao buscar plano do usuário:', error);
        alert('Erro ao buscar plano do usuário.');
        return [];
    }

    return data;
}

async function fetchSugestaoPeso(userId, exercicioId) {
    // Exemplo usando a view de sugestão de peso
    const { data, error } = await supabase
        .from('v_pesos_usuario')
        .select('*')
        .eq('id_usuario', userId)
        .eq('id_exercicio', exercicioId)
        .single();
    if (error) {
        return null;
    }
    return data;
}

// --- Manipulação de UI ---
// Renderizar usuários dinamicamente na tela de login
function renderUsuariosLogin(usuarios) {
    const usersContainer = document.querySelector('#login-screen .users');
    usersContainer.innerHTML = '';
    usuarios.forEach(usuario => {
        const card = document.createElement('div');
        card.className = 'user-card';
        card.dataset.userId = usuario.id;
        card.innerHTML = `
            <div class="avatar">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(usuario.nome)}" alt="${usuario.nome}">
            </div>
            <h3>${usuario.nome}</h3>
        `;
        card.onclick = () => selecionarUsuario(usuario.id, usuario.nome);
        usersContainer.appendChild(card);
    });
}

async function selecionarUsuario(userId, nome) {
    window.selectedUserId = userId;
    window.selectedUserName = nome;
    // Troca para tela inicial
    changeScreen('home-screen');
    // Atualiza nome/avatar
    document.getElementById('user-name').textContent = nome;
    document.getElementById('user-avatar').src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(nome)}`;
    // Carrega métricas e protocolos
    const protocolos = await fetchPlanoDeTreinoDoUsuario(userId);
    console.log('Protocolos recebidos do Supabase:', protocolos);
    renderProtocolos(protocolos);
    // Carregar métricas do usuário (implementar se necessário)
    // loadUserMetrics(userId);
}

// Inicialização dinâmica dos usuários na tela de login
async function inicializarLogin() {
    const usuarios = await fetchUsuarios();
    renderUsuariosLogin(usuarios);
}

document.addEventListener('DOMContentLoaded', inicializarLogin);

function renderProtocolos(protocolos) {
    const container = document.getElementById('protocolos');
    container.innerHTML = '';
    console.log('Renderizando protocolos:', protocolos);
    if (!protocolos || protocolos.length === 0) {
        container.innerHTML = '<p>Nenhum treino encontrado.</p>';
        return;
    }
    // Ordenar por semana_referencia e numero_treino
    protocolos.sort((a, b) => {
        if (a.semana_referencia !== b.semana_referencia) {
            return a.semana_referencia - b.semana_referencia;
        }
        return a.numero_treino - b.numero_treino;
    });
    protocolos.forEach(proto => {
        const div = document.createElement('div');
        div.className = 'protocolo-card';
        div.innerHTML = `
            <strong>${proto.protocolos_treinamento?.nome || 'Protocolo'}</strong><br>
            Semana: ${proto.semana_referencia ?? '-'}<br>
            Treino: ${proto.numero_treino ?? '-'}
        `;
        container.appendChild(div);
    });
}


// --- Inicialização ---



// Variáveis globais da aplicação
let currentUser = null;
let currentWorkout = null;
let currentExercise = null;
let currentSeries = null;
let exercises = [];
let completedSeries = 0;
let timerInterval = null;
let startTime = null;
let workoutStartTime = null;

// Elementos DOM
const screens = {
    login: document.getElementById('login-screen'),
    home: document.getElementById('home-screen'),
    workout: document.getElementById('workout-screen')
};

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', () => {
    // Evento para seleção de usuário
    document.querySelectorAll('.user-card').forEach(card => {
        card.addEventListener('click', () => {
            const userId = parseInt(card.dataset.userId);
            selectUser(userId);
        });
    });

    // Botões de navegação
    document.getElementById('logout-btn').addEventListener('click', logout);
    document.getElementById('start-workout-btn').addEventListener('click', startWorkout);
    document.getElementById('back-btn').addEventListener('click', backToHome);
    document.getElementById('skip-rest-btn').addEventListener('click', skipRest);
    document.getElementById('finish-workout-btn').addEventListener('click', finishWorkout);
});

// Função para selecionar usuário
async function selectUser(userId) {
    try {
        // Buscar informações do usuário
        const { data: user, error } = await supabaseClient
            .from('usuarios')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;

        currentUser = user;
        
        // Atualizar UI com dados do usuário
        document.getElementById('user-avatar').src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.nome}`;
        document.getElementById('user-name').textContent = user.nome;
        
        // Buscar métricas do usuário
        await loadUserMetrics();
        
        // Buscar próximo treino
        await loadNextWorkout();
        
        // Trocar para tela inicial
        changeScreen('home');
        
    } catch (error) {
        console.error('Erro ao selecionar usuário:', error);
        alert('Erro ao carregar dados do usuário');
    }
}

// Carregar métricas do usuário
async function loadUserMetrics() {
    try {
        // Buscar treinos concluídos
        const { data: completedWorkouts, error } = await supabaseClient
            .from('pesos_usuario')
            .select('DISTINCT numero_treino')
            .eq('id_usuario', currentUser.id);
            
        if (error) throw error;
        
        const uniqueWorkouts = [...new Set(completedWorkouts.map(w => w.numero_treino))];
        const completedCount = uniqueWorkouts.length;
        
        // Calcular progresso (baseado nos 48 treinos totais do protocolo)
        const progressPercentage = Math.round((completedCount / 48) * 100);
        
        // Calcular semana atual (aproximação baseada nos treinos concluídos)
        const currentWeek = Math.floor(completedCount / 4) + 1;
        
        // Atualizar UI
        document.getElementById('completed-workouts').textContent = completedCount;
        document.getElementById('progress-percentage').textContent = `${progressPercentage}%`;
        document.getElementById('current-week').textContent = currentWeek > 12 ? 12 : currentWeek;
        
        // Buscar último treino realizado
        if (completedCount > 0) {
            const lastWorkoutNumber = Math.max(...uniqueWorkouts);
            const { data: lastWorkoutData } = await supabaseClient
                .from('protocolo_treinos')
                .select('numero_treino, semana_referencia, dia_semana')
                .eq('numero_treino', lastWorkoutNumber)
                .eq('protocolo_id', 1)
                .limit(1)
                .single();
                
            if (lastWorkoutData) {
                const workoutType = getWorkoutTypeLabel(lastWorkoutData.dia_semana);
                document.getElementById('last-workout-info').textContent = 
                    `Treino ${workoutType} - Semana ${lastWorkoutData.semana_referencia}`;
            }
        }
        
    } catch (error) {
        console.error('Erro ao carregar métricas:', error);
    }
}

// Carregar próximo treino
async function loadNextWorkout() {
    try {
        // Buscar treinos concluídos
        const { data: completedWorkouts, error } = await supabaseClient
            .from('pesos_usuario')
            .select('DISTINCT numero_treino')
            .eq('id_usuario', currentUser.id);
            
        if (error) throw error;
        
        const uniqueWorkouts = [...new Set(completedWorkouts.map(w => w.numero_treino))];
        
        // Determinar próximo treino (último + 1, ou começar do 1)
        let nextWorkoutNumber = 1;
        if (uniqueWorkouts.length > 0) {
            nextWorkoutNumber = Math.max(...uniqueWorkouts) + 1;
            if (nextWorkoutNumber > 48) nextWorkoutNumber = 1; // Recomeçar o protocolo
        }
        
        // Buscar detalhes do próximo treino
        const { data: nextWorkoutData, error: nextError } = await supabaseClient
            .from('protocolo_treinos')
            .select(`
                numero_treino, 
                semana_referencia, 
                dia_semana,
                percentual_1rm_min,
                percentual_1rm_max
            `)
            .eq('numero_treino', nextWorkoutNumber)
            .eq('protocolo_id', 1)
            .limit(1)
            .single();
            
        if (nextError) throw nextError;
        
        // Guardar info do próximo treino
        currentWorkout = nextWorkoutData;
        
        // Contar exercícios no treino
        const { count: exerciseCount } = await supabaseClient
            .from('protocolo_treinos')
            .select('exercicio_id', { count: 'exact' })
            .eq('numero_treino', nextWorkoutNumber)
            .eq('protocolo_id', 1);
            
        // Atualizar UI
        const workoutType = getWorkoutTypeLabel(nextWorkoutData.dia_semana);
        document.getElementById('next-workout-name').textContent = `Treino ${workoutType}`;
        document.getElementById('next-workout-week').textContent = `Semana ${nextWorkoutData.semana_referencia}`;
        document.getElementById('next-workout-exercises').textContent = `${exerciseCount} exercícios`;
        document.getElementById('next-workout-intensity').textContent = 
            `${nextWorkoutData.percentual_1rm_min}-${nextWorkoutData.percentual_1rm_max}% 1RM`;
        
    } catch (error) {
        console.error('Erro ao carregar próximo treino:', error);
    }
}

// Iniciar treino
async function startWorkout() {
    if (!currentWorkout) return;
    
    try {
        // Buscar todos os exercícios do treino
        const { data: workoutExercises, error } = await supabaseClient
            .from('protocolo_treinos')
            .select(`
                id,
                exercicio_id,
                series,
                repeticoes_alvo,
                percentual_1rm_base,
                tempo_descanso,
                ordem_exercicio,
                observacoes,
                exercicios:exercicio_id (
                    nome,
                    grupo_muscular
                )
            `)
            .eq('numero_treino', currentWorkout.numero_treino)
            .eq('protocolo_id', 1)
            .order('ordem_exercicio', { ascending: true });
            
        if (error) throw error;
        
        // Guardar exercícios
        exercises = workoutExercises;
        
        // Atualizar título do treino
        const workoutType = getWorkoutTypeLabel(currentWorkout.dia_semana);
        document.getElementById('workout-title').textContent = `Treino ${workoutType}`;
        
        // Iniciar com o primeiro exercício
        currentExercise = 0;
        loadExercise(currentExercise);
        
        // Registrar início do treino
        workoutStartTime = new Date();
        
        // Trocar para tela de treino
        changeScreen('workout');
        
    } catch (error) {
        console.error('Erro ao iniciar treino:', error);
        alert('Erro ao carregar treino');
    }
}

// Carregar exercício atual
async function loadExercise(index) {
    if (index >= exercises.length) {
        // Treino concluído
        showWorkoutCompletion();
        return;
    }
    
    const exercise = exercises[index];
    
    // Atualizar progresso
    const progress = ((index + 1) / exercises.length) * 100;
    document.getElementById('workout-progress').style.width = `${progress}%`;
    
    // Atualizar UI
    document.getElementById('exercise-name').textContent = exercise.exercicios.nome;
    document.getElementById('exercise-notes').textContent = exercise.observacoes || 'Realize com atenção à técnica';
    
    // Limpar container de séries anterior
    document.getElementById('series-container').innerHTML = '';
    
    // Criar linhas para as séries
    for (let i = 1; i <= exercise.series; i++) {
        await createSeriesRow(exercise, i);
    }
    
    // Mostrar container de exercício, esconder timer
    document.getElementById('exercise-container').classList.remove('hidden');
    document.getElementById('timer-container').classList.add('hidden');
    document.getElementById('workout-completed').classList.add('hidden');
}

// Criar linha de série
async function createSeriesRow(exercise, seriesNumber) {
    try {
        // Buscar peso sugerido
        const { data: weightSuggestion, error } = await supabaseClient
            .from('v_pesos_usuario')
            .select('peso_sugerido')
            .eq('id_usuario', currentUser.id)
            .eq('exercicio_id', exercise.exercicio_id)
            .limit(1)
            .single();
        
        let suggestedWeight = 0;
        
        if (!error && weightSuggestion) {
            // Aplicar percentual do treino atual
            suggestedWeight = Math.round(weightSuggestion.peso_sugerido * (exercise.percentual_1rm_base / 100));
            // Mínimo de 1kg
            suggestedWeight = Math.max(1, suggestedWeight);
        }
        
        // Criar elemento de série
        const seriesRow = document.createElement('div');
        seriesRow.className = 'series-row';
        seriesRow.dataset.series = seriesNumber;
        
        seriesRow.innerHTML = `
            <div>${seriesNumber}</div>
            <div>
                <input type="number" class="weight-input" value="${suggestedWeight}" min="0" step="0.5">
            </div>
            <div>
                <input type="number" class="reps-input" value="${exercise.repeticoes_alvo}" min="0">
            </div>
            <div>
                <button class="done-btn">✓</button>
            </div>
        `;
        
        // Adicionar ao container
        document.getElementById('series-container').appendChild(seriesRow);
        
        // Adicionar evento para finalizar série
        seriesRow.querySelector('.done-btn').addEventListener('click', () => {
            completeSeries(exercise, seriesNumber);
        });
    } catch (error) {
        console.error('Erro ao criar linha de série:', error);
    }
}

// Função para salvar execução real do exercício
async function saveExecucaoExercicio({usuario_id, protocolo_treino_id, exercicio_id, peso_utilizado, repeticoes, falhou = false, observacoes = ''}) {
    try {
        const { error } = await supabase
            .from('execucao_exercicio_usuario')
            .insert({
                usuario_id,
                protocolo_treino_id,
                exercicio_id,
                peso_utilizado,
                repeticoes,
                falhou,
                observacoes
            });
        if (error) {
            console.error('Erro ao salvar execução do exercício:', error);
        } else {
            console.log('Execução do exercício salva com sucesso!');
        }
    } catch (e) {
        console.error('Erro inesperado ao salvar execução:', e);
    }
}

// Finalizar série
async function completeSeries(exercise, seriesNumber) {
    try {
        const seriesRow = document.querySelector(`.series-row[data-series="${seriesNumber}"]`);
        if (!seriesRow || seriesRow.classList.contains('completed')) return;
        
        // Pegar valores
        const weightInput = seriesRow.querySelector('.weight-input');
        const repsInput = seriesRow.querySelector('.reps-input');
        
        const weight = parseFloat(weightInput.value) || 0;
        const reps = parseInt(repsInput.value) || 0;
        
        if (weight <= 0 || reps <= 0) {
            alert('Preencha peso e repetições corretamente!');
            return;
        }
        
        // Salvar execução real do exercício
        await saveExecucaoExercicio({
            usuario_id: currentUser.id,
            protocolo_treino_id: exercise.id, // id do protocolo_treino (linha do treino)
            exercicio_id: exercise.exercicio_id,
            peso_utilizado: weight,
            repeticoes: reps,
            falhou: false,
            observacoes: ''
        });
        
        // Registrar série concluída
        const { error } = await supabaseClient
            .from('pesos_usuario')
            .insert({
                id_usuario: currentUser.id,
                exercicio_id: exercise.exercicio_id,
                numero_treino: currentWorkout.numero_treino,
                semana_treino: currentWorkout.semana_referencia,
                dia_semana: currentWorkout.dia_semana,
                serie: seriesNumber,
                repeticoes: reps,
                id_peso: await getOrCreateWeightId(weight),
                data_hora: new Date().toISOString()
            });
            
        if (error) throw error;
        
        // Marcar como concluída
        // Atualizar UI
        seriesRow.classList.add('completed');
        weightInput.disabled = true;
        repsInput.disabled = true;
        seriesRow.querySelector('.done-btn').disabled = true;
        
        // Incrementar contador de séries
        completedSeries++;
        
        // Verificar se esta é a última série do exercício
        if (seriesNumber === exercise.series) {
            // Mostrar timer e preparar próximo exercício
            startRest(exercise.tempo_descanso, currentExercise + 1);
        }
        
    } catch (error) {
        console.error('Erro ao completar série:', error);
        alert('Erro ao salvar série');
    }
}

// Iniciar descanso
function startRest(restTime, nextExerciseIndex) {
    // Se for último exercício, não mostra próximo
    const isLastExercise = nextExerciseIndex >= exercises.length;
    
    // Esconder container de exercício
    document.getElementById('exercise-container').classList.add('hidden');
    
    // Mostrar timer
    document.getElementById('timer-container').classList.remove('hidden');
    
    // Atualizar próximo exercício (se houver)
    if (!isLastExercise) {
        document.getElementById('next-exercise-name').textContent = 
            exercises[nextExerciseIndex].dim_exercicios.nome;
    } else {
        document.getElementById('next-exercise-name').textContent = 'Treino finalizado';
    }
    
    // Iniciar timer
    startTime = new Date();
    let timeLeft = restTime;
    
    // Atualizar display do timer
    updateTimerDisplay(timeLeft);
    
    // Criar intervalo para atualização
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((new Date() - startTime) / 1000);
        timeLeft = restTime - elapsed;
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            // Passar para próximo exercício ou finalizar
            if (isLastExercise) {
                showWorkoutCompletion();
            } else {
                currentExercise = nextExerciseIndex;
                loadExercise(currentExercise);
            }
        } else {
            updateTimerDisplay(timeLeft);
        }
    }, 1000);
}

// Atualizar display do timer
function updateTimerDisplay(timeInSeconds) {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    document.getElementById('timer').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Pular descanso
function skipRest() {
    clearInterval(timerInterval);
    const isLastExercise = currentExercise + 1 >= exercises.length;
    
    if (isLastExercise) {
        showWorkoutCompletion();
    } else {
        currentExercise++;
        loadExercise(currentExercise);
    }
}

// Mostrar tela de conclusão de treino
function showWorkoutCompletion() {
    // Esconder containers
    document.getElementById('exercise-container').classList.add('hidden');
    document.getElementById('timer-container').classList.add('hidden');
    
    // Mostrar tela de conclusão
    document.getElementById('workout-completed').classList.remove('hidden');
    
    // Atualizar estatísticas
    document.getElementById('completed-series').textContent = completedSeries;
    
    // Calcular tempo total de treino
    const totalMinutes = Math.floor((new Date() - workoutStartTime) / 60000);
    document.getElementById('total-time').textContent = 
        `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}min`;
}

// Finalizar treino e voltar para home
async function finishWorkout() {
    completedSeries = 0;
    exercises = [];
    currentExercise = null;
    
    // Atualizar métricas e próximo treino
    await loadUserMetrics();
    await loadNextWorkout();
    
    // Voltar para home
    changeScreen('home');
}

// Voltar para home
function backToHome() {
    if (confirm('Deseja realmente sair do treino? O progresso não será salvo.')) {
        changeScreen('home');
    }
}

// Logout
function logout() {
    currentUser = null;
    changeScreen('login');
}

// Função auxiliar para buscar ou criar ID de peso
async function getOrCreateWeightId(weight) {
    try {
        // Arredondar para 1 casa decimal
        weight = Math.round(weight * 10) / 10;
        
        // Buscar ID existente
        const { data, error } = await supabase
            .from('dim_pesos')
            .select('id')
            .eq('valor', weight)
            .limit(1);
            
        if (error) throw error;
        
        // Se existe, retornar ID
        if (data && data.length > 0) {
            return data[0].id;
        }
        
        // Se não existe, criar
        const { data: newWeight, error: insertError } = await supabase
            .from('dim_pesos')
            .insert({ valor: weight })
            .select('id')
            .single();
            
        if (insertError) throw insertError;
        
        return newWeight.id;
        
    } catch (error) {
        console.error('Erro ao buscar/criar ID de peso:', error);
        // Fallback - ID 1 (geralmente o menor peso)
        return 1;
    }
}

// Função auxiliar para obter label do tipo de treino
function getWorkoutTypeLabel(day_semana) {
    switch (day_semana) {
        case 1: return 'A - Costas/Ombros';
        case 2: return 'B - Peito';
        case 3: return 'C - Braços/Ombros';
        case 4: return 'D - Pernas';
        default: return `Tipo ${day_semana}`;
    }
}

// Função auxiliar para trocar de tela
function changeScreen(screenId) {
    const screens = ['login-screen', 'home-screen', 'workout-screen'];
    screens.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (id === screenId) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        }
    });
}
