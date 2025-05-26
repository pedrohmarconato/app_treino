// app.js

// --- Configuração do Supabase ---
const SUPABASE_URL = 'https://ktfmktecvllyiqfkavdn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0Zm1rdGVjdmxseWlxZmthdmRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwNDQ2OTAsImV4cCI6MjA2MzYyMDY5MH0.PgEnBgtdITsb_G_ycSOaXOmkwNfpvIWVOOAsVrm2zCY';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- Funções auxiliares ---
async function fetchUsuarios() {
    const { data, error } = await supabase.from('dim_usuarios').select('*');
    if (error) {
        alert('Erro ao buscar usuários');
        return [];
    }
    return data;
}

async function fetchProtocolo(userId) {
    const { data, error } = await supabase
        .from('dim_protocolo')
        .select('*')
        .eq('id_usuario', userId);
    if (error) {
        alert('Erro ao buscar protocolo');
        return [];
    }
    return data;
}

async function fetchSugestaoPeso(userId, exercicioId) {
    // Exemplo usando a view de sugestão de peso
    const { data, error } = await supabase
        .from('vw_sugestao_peso_app')
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
function renderUsuarios(usuarios) {
    const container = document.getElementById('usuarios');
    container.innerHTML = '';
    usuarios.forEach(usuario => {
        const btn = document.createElement('button');
        btn.textContent = usuario.nome;
        btn.onclick = () => selecionarUsuario(usuario.id);
        container.appendChild(btn);
    });
}

async function selecionarUsuario(userId) {
    window.selectedUserId = userId;
    const protocolos = await fetchProtocolo(userId);
    renderProtocolos(protocolos);
}

function renderProtocolos(protocolos) {
    const container = document.getElementById('protocolos');
    container.innerHTML = '';
    protocolos.forEach(proto => {
        const div = document.createElement('div');
        div.textContent = proto.nome_protocolo || 'Protocolo';
        container.appendChild(div);
    });
}

// --- Inicialização ---
window.onload = async function() {
    const usuarios = await fetchUsuarios();
    renderUsuarios(usuarios);
};


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
            .from('dim_usuarios')
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
            .from('fato_execucao_exercicio')
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
                .from('fato_protocolo_treinos')
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
            .from('fato_execucao_exercicio')
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
            .from('fato_protocolo_treinos')
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
            .from('fato_protocolo_treinos')
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
            .from('fato_protocolo_treinos')
            .select(`
                id,
                exercicio_id,
                series,
                repeticoes_alvo,
                percentual_1rm_base,
                tempo_descanso,
                ordem_exercicio,
                observacoes,
                dim_exercicios:exercicio_id (
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
    document.getElementById('exercise-name').textContent = exercise.dim_exercicios.nome;
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
            .from('vw_sugestao_peso_app')
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
            alert('Por favor, insira um peso e repetições válidos');
            return;
        }
        
        // Registrar série concluída
        const { error } = await supabaseClient
            .from('fato_execucao_exercicio')
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
    Object.values(screens).forEach(screen => {
        screen.classList.remove('active');
    });
    screens[screenId].classList.add('active');
}
