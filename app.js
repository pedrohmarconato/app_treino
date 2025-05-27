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
let currentExerciseActiveSeries = 1; // Tracks the active series for the current exercise

// Elementos DOM
const screens = {
    login: document.getElementById('login-screen'),
    home: document.getElementById('home-screen'),
    workout: document.getElementById('workout-screen'),
    weeklyPlanner: document.getElementById('weekly-planner-screen') // Added planner screen
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

    // Planner screen buttons
    const saveScheduleBtn = document.getElementById('save-schedule-btn');
    if (saveScheduleBtn) {
        saveScheduleBtn.addEventListener('click', () => {
            const year = parseInt(document.getElementById('planner-year').textContent);
            const weekNumber = parseInt(document.getElementById('planner-week-number').textContent);
            saveWeeklySchedule(year, weekNumber);
        });
    }

    const backToHomeFromPlannerBtn = document.getElementById('back-to-home-from-planner-btn');
    if (backToHomeFromPlannerBtn) {
        backToHomeFromPlannerBtn.addEventListener('click', () => changeScreen('home'));
    }
    
    // Removed temporary planner button listener
});

// Função para selecionar usuário
async function selectUser(userId) {
    try {
        // Buscar informações do usuário
        const { data: user, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;
        currentUser = user;
        
        // Atualizar UI com dados do usuário (avatar e nome)
        document.getElementById('user-avatar').src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.nome}`;
        document.getElementById('user-name').textContent = user.nome;

        // Check and trigger weekly planner if needed
        const plannerWasShown = await checkAndTriggerWeeklyPlanner();
        if (plannerWasShown) {
            return; // Stop further processing as user is now in planner
        }
        
        // Proceed if planner was not shown
        await loadUserMetrics();
        await loadNextWorkout(); // This will now use the plan
        changeScreen('home');
        
    } catch (error) {
        console.error('Erro ao selecionar usuário:', error);
        alert('Erro ao carregar dados do usuário');
        changeScreen('login'); // Go back to login on error
    }
}


async function checkAndTriggerWeeklyPlanner() {
    if (!currentUser) return false;

    const today = new Date();
    const { year, week } = getWeekNumber(today);
    // const dayOfWeek = today.getDay() || 7; // 1=Mon, 7=Sun, not strictly needed for simplified logic

    try {
        const { data, error, count } = await supabase
            .from('planejamento_semanal')
            .select('id', { count: 'exact', head: true }) // Only need count
            .eq('usuario_id', currentUser.id)
            .eq('ano', year)
            .eq('numero_semana', week);

        if (error) {
            console.error("Erro ao verificar planejamento semanal:", error);
            return false; // Don't show planner on error
        }
        
        // Simplified condition: If no plan exists for the current week, show the planner.
        if (count === 0) {
            console.log(`Nenhum plano encontrado para usuário ${currentUser.id}, ano ${year}, semana ${week}. Abrindo planejador.`);
            await renderWeeklyPlanner(year, week); // Ensure render is await if it has async parts
            changeScreen('weeklyPlanner');
            return true; // Planner was shown
        }
        console.log(`Plano encontrado para usuário ${currentUser.id}, ano ${year}, semana ${week}. Não abrindo planejador.`);
        return false; // Planner not shown, plan exists
    } catch (e) {
        console.error("Exceção ao verificar planejamento semanal:", e);
        return false;
    }
}


// Carregar métricas do usuário
async function loadUserMetrics() {
    try {
        // Buscar treinos concluídos
        const { data: completedWorkouts, error } = await supabase // Changed supabaseClient to supabase
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

        // Obter e formatar o mês atual
        const currentMonthRaw = new Date().toLocaleString('pt-BR', { month: 'long' });
        const currentMonth = currentMonthRaw.charAt(0).toUpperCase() + currentMonthRaw.slice(1);
        
        // Atualizar UI
        document.getElementById('completed-workouts').textContent = completedCount;
        document.getElementById('progress-percentage').textContent = `${progressPercentage}%`;
        document.getElementById('current-week').textContent = currentWeek > 12 ? 12 : currentWeek;
        document.getElementById('current-month').textContent = currentMonth;
        
        // Buscar último treino realizado
        if (completedCount > 0) {
            const lastWorkoutNumber = Math.max(...uniqueWorkouts);
            const { data: lastWorkoutData } = await supabase // Changed supabaseClient to supabase
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

// Helper function to fetch details for a specific workout number from v_protocolo_treinos
async function fetchWorkoutDetails(workoutNumber, userId) {
    const { data: workoutExercises, error } = await supabase
        .from('v_protocolo_treinos')
        .select(`
            numero_treino,
            tipo_treino,
            semana_referencia,
            dia_semana,
            percentual_1rm_min,
            percentual_1rm_max,
            grupo_muscular,
            exercicio_id,
            ordem_exercicio 
        `) // Added ordem_exercicio
        .eq('numero_treino', workoutNumber)
        .eq('id_usuario', userId) 
        .order('ordem_exercicio', { ascending: true });

    if (error) {
        console.error(`Erro ao buscar detalhes do treino ${workoutNumber} para usuário ${userId}:`, error.message);
        return null;
    }

    if (!workoutExercises || workoutExercises.length === 0) {
        console.warn(`Nenhum exercício encontrado para o treino ${workoutNumber} para usuário ${userId}`);
        return null;
    }

    const firstExercise = workoutExercises[0];
    const exerciseCount = new Set(workoutExercises.map(ex => ex.exercicio_id)).size;
    // Determine the primary muscle group. If multiple, take the first one or concatenate.
    // For simplicity, taking the one from the first exercise, assuming it's representative for the workout card.
    const primaryMuscleGroup = firstExercise.grupo_muscular; 

    return {
        numero_treino: firstExercise.numero_treino,
        tipo_treino: firstExercise.tipo_treino,
        semana_referencia: firstExercise.semana_referencia,
        dia_semana: firstExercise.dia_semana,
        percentual_1rm_min: firstExercise.percentual_1rm_min,
        percentual_1rm_max: firstExercise.percentual_1rm_max,
        grupo_muscular: primaryMuscleGroup, 
        exerciseCount: exerciseCount,
        // Storing all exercises to pass to startWorkout if needed
        allExercisesData: workoutExercises 
    };
}

// Carregar próximos dois treinos (agora baseado no planejamento semanal)
async function loadNextWorkout() {
    if (!currentUser) return;

    const today = new Date();
    const { year, week } = getWeekNumber(today);
    const currentDayOfWeek = today.getDay() || 7; // 1 = Monday, 7 = Sunday

    try {
        const { data: weeklyPlan, error: planError } = await supabase
            .from('planejamento_semanal')
            .select('*')
            .eq('usuario_id', currentUser.id)
            .eq('ano', year)
            .eq('numero_semana', week)
            .order('dia_semana', { ascending: true });

        if (planError) {
            console.error("Erro ao buscar planejamento semanal:", planError);
            // Display error or guide user to planner
            document.getElementById('next-workout-name').textContent = "Erro ao carregar plano";
            return;
        }

        if (!weeklyPlan || weeklyPlan.length === 0) {
            // This case should ideally be handled by checkAndTriggerWeeklyPlanner
            // If it's reached, means planner was skipped or an issue occurred
            console.warn("Nenhum planejamento para a semana atual. O usuário deveria ter sido direcionado ao planejador.");
            document.getElementById('next-workout-name').textContent = "Planeje sua semana!";
            document.getElementById('today-muscle-group').textContent = "Planejamento pendente";
            document.getElementById('next-workout-week').textContent = "";
            document.getElementById('next-workout-exercises').textContent = "";
            document.getElementById('next-workout-intensity').textContent = "";
            document.getElementById('next-workout-2-name').textContent = "";
            document.getElementById('next-workout-2-week').textContent = "";
            document.getElementById('next-workout-2-exercises').textContent = "";
            document.getElementById('next-workout-2-intensity').textContent = "";
            // Optionally, disable start workout button
            document.getElementById('start-workout-btn').disabled = true;
            return;
        }
        document.getElementById('start-workout-btn').disabled = false;


        const upcomingTrainings = weeklyPlan.filter(dayPlan => 
            dayPlan.tipo_atividade === 'TREINO' && 
            dayPlan.dia_semana >= currentDayOfWeek && 
            dayPlan.treino_numero_ref != null
        );
        
        // Add trainings from this week already passed if no future ones are found (for review or late start)
        if (upcomingTrainings.length === 0) {
            const pastTrainingsThisWeek = weeklyPlan.filter(dayPlan => 
                dayPlan.tipo_atividade === 'TREINO' && 
                dayPlan.treino_numero_ref != null
            ).sort((a,b) => a.dia_semana - b.dia_semana); // Ensure sorted
             if (pastTrainingsThisWeek.length > 0) upcomingTrainings.push(...pastTrainingsThisWeek);
        }


        if (upcomingTrainings.length > 0) {
            const workout1Plan = upcomingTrainings[0];
            const workout1Details = await fetchWorkoutDetails(workout1Plan.treino_numero_ref, currentUser.id);

            if (workout1Details) {
                // Critical: Map treino_numero_ref to numero_treino for currentWorkout consistency
                currentWorkout = { 
                    ...workout1Details, 
                    numero_treino: workout1Plan.treino_numero_ref, // This is the key for startWorkout
                    dia_semana_planejado: workout1Plan.dia_semana // Keep planned day if needed
                }; 

                document.getElementById('next-workout-name').textContent = workout1Details.tipo_treino || `Treino ${getWorkoutTypeLabel(workout1Details.dia_semana)}`;
                document.getElementById('next-workout-week').textContent = `Semana ${workout1Details.semana_referencia}`; // This comes from v_protocolo_treinos
                document.getElementById('next-workout-exercises').textContent = `${workout1Details.exerciseCount} exercícios`;
                document.getElementById('next-workout-intensity').textContent = `${workout1Details.percentual_1rm_min}-${workout1Details.percentual_1rm_max}% 1RM`;
                document.getElementById('today-muscle-group').textContent = `Próximo Foco: ${workout1Details.grupo_muscular || 'N/A'}`;
            } else {
                setNoWorkoutUI('next-workout', 'Erro ao carregar Treino 1');
            }

            if (upcomingTrainings.length > 1) {
                const workout2Plan = upcomingTrainings[1];
                const workout2Details = await fetchWorkoutDetails(workout2Plan.treino_numero_ref, currentUser.id);
                if (workout2Details) {
                    document.getElementById('next-workout-2-name').textContent = workout2Details.tipo_treino || `Treino ${getWorkoutTypeLabel(workout2Details.dia_semana)}`;
                    document.getElementById('next-workout-2-week').textContent = `Semana ${workout2Details.semana_referencia}`;
                    document.getElementById('next-workout-2-exercises').textContent = `${workout2Details.exerciseCount} exercícios`;
                    document.getElementById('next-workout-2-intensity').textContent = `${workout2Details.percentual_1rm_min}-${workout2Details.percentual_1rm_max}% 1RM`;
                } else {
                     setNoWorkoutUI('next-workout-2', 'Erro ao carregar Treino 2');
                }
            } else {
                setNoWorkoutUI('next-workout-2', 'Nenhum outro treino planejado');
            }
        } else {
            setNoWorkoutUI('next-workout', 'Nenhum treino restante esta semana');
            setNoWorkoutUI('next-workout-2', '');
            document.getElementById('today-muscle-group').textContent = "Sem treinos planejados";
            document.getElementById('start-workout-btn').disabled = true;
        }

    } catch (error) {
        console.error('Erro ao carregar próximos treinos do planejamento:', error);
        setNoWorkoutUI('next-workout', 'Erro geral');
        setNoWorkoutUI('next-workout-2', '');
    }
}

function setNoWorkoutUI(prefix, message1Name, message2Week = "") {
    document.getElementById(`${prefix}-name`).textContent = message1Name;
    if (document.getElementById(`${prefix}-week`)) {
      document.getElementById(`${prefix}-week`).textContent = message2Week;
    }
    if (document.getElementById(`${prefix}-exercises`)) {
        document.getElementById(`${prefix}-exercises`).textContent = "";
    }
    if (document.getElementById(`${prefix}-intensity`)) {
        document.getElementById(`${prefix}-intensity`).textContent = "";
    }
}


// Iniciar treino
async function startWorkout() {
    if (!currentWorkout || !currentWorkout.numero_treino) {
        alert("Detalhes do treino principal não carregados. Por favor, volte e tente novamente.");
        return;
    }
    
    try {
        // Use the allExercisesData from currentWorkout if available (populated by fetchWorkoutDetails)
        // Otherwise, fetch fresh from v_protocolo_treinos
        let workoutExercisesData = currentWorkout.allExercisesData;

        if (!workoutExercisesData) { // Fallback if not pre-fetched
            console.warn("currentWorkout.allExercisesData not found, fetching fresh for startWorkout");
            const { data, error } = await supabase
                .from('v_protocolo_treinos')
                .select(`
                    exercicio_id,
                    exercicio_nome,
                    series,
                    repeticoes_alvo,
                    percentual_1rm_base,
                    tempo_descanso,
                    ordem_exercicio,
                    observacoes,
                    grupo_muscular
                `)
                .eq('numero_treino', currentWorkout.numero_treino)
                .eq('id_usuario', currentUser.id)
                .order('ordem_exercicio', { ascending: true });
            
            if (error) throw error;
            workoutExercisesData = data;
        }
        
        if (!workoutExercisesData || workoutExercisesData.length === 0) {
            alert("Nenhum exercício encontrado para este treino.");
            return;
        }
        
        exercises = workoutExercisesData.map(ex => ({
            id: ex.exercicio_id, // Assuming 'id' in this context refers to the specific instance in fato_protocolo_treinos, but v_protocolo_treinos might not have this. Using exercicio_id.
            exercicio_id: ex.exercicio_id,
            series: ex.series,
            repeticoes_alvo: ex.repeticoes_alvo,
            percentual_1rm_base: ex.percentual_1rm_base, // This might be named differently in v_protocolo_treinos or needs calculation
            tempo_descanso: ex.tempo_descanso,
            ordem_exercicio: ex.ordem_exercicio,
            observacoes: ex.observacoes,
            dim_exercicios: { // Keep compatible structure for loadExercise/createSeriesRow
                nome: ex.exercicio_nome,
                grupo_muscular: ex.grupo_muscular
            }
        }));
        
        document.getElementById('workout-title').textContent = currentWorkout.tipo_treino || `Treino ${getWorkoutTypeLabel(currentWorkout.dia_semana)}`;
        
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
    document.getElementById('exercise-1rm-percentage').textContent = `Usar ${exercise.percentual_1rm_base || 'N/A'}% do 1RM`;
    
    currentExerciseActiveSeries = 1; // Reset for the new exercise
    document.getElementById('current-series-info').textContent = `Série ${currentExerciseActiveSeries} de ${exercise.series}`;

    // Limpar container de séries anterior
    document.getElementById('series-container').innerHTML = '';
    
    // Criar linhas para as séries
    for (let i = 1; i <= exercise.series; i++) {
        await createSeriesRow(exercise, i); // Pass currentExerciseActiveSeries if needed for initial state
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
        const { data: weightSuggestion, error } = await supabase // Changed supabaseClient to supabase
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
                <button class="done-btn" ${(seriesNumber !== currentExerciseActiveSeries) ? 'disabled' : ''}>✓</button>
            </div>
        `;
        
        if (seriesNumber === currentExerciseActiveSeries) {
            seriesRow.classList.add('active-series');
        }
        
        // Adicionar ao container
        document.getElementById('series-container').appendChild(seriesRow);
        
        // Adicionar evento para finalizar série
        seriesRow.querySelector('.done-btn').addEventListener('click', () => {
            completeSeries(exercise, seriesNumber); // seriesNumber is the actual number of the series clicked
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
        const { error } = await supabase // Changed supabaseClient to supabase
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
        
        // Atualizar UI da série completada
        seriesRow.classList.add('completed');
        seriesRow.classList.remove('active-series');
        weightInput.disabled = true;
        repsInput.disabled = true;
        seriesRow.querySelector('.done-btn').disabled = true;
        
        // Incrementar contador de séries global
        completedSeries++;

        // ---- LOAD PROGRESSION LOGIC ----
        await handleLoadProgression(exercise, reps);
        // ---- END LOAD PROGRESSION LOGIC ----
        
        // Avançar para a próxima série do exercício atual
        currentExerciseActiveSeries++;
        
        if (currentExerciseActiveSeries <= exercise.series) {
            document.getElementById('current-series-info').textContent = `Série ${currentExerciseActiveSeries} de ${exercise.series}`;
            const nextSeriesRow = document.querySelector(`.series-row[data-series="${currentExerciseActiveSeries}"]`);
            if (nextSeriesRow) {
                nextSeriesRow.querySelector('.done-btn').disabled = false;
                nextSeriesRow.classList.add('active-series');
            }
        } else {
            // Última série do exercício concluída
            startRest(exercise.tempo_descanso, currentExercise + 1);
        }
        
    } catch (error) {
        console.error('Erro ao completar série:', error);
        alert('Erro ao salvar série');
    }
}


async function handleLoadProgression(exercise, repsDone) {
    const usuarioId = currentUser.id;
    const exercicioId = exercise.exercicio_id;
    const targetReps = exercise.repeticoes_alvo;
    let newPesoBase;
    let currentPesoBaseInDb;

    try {
        // Attempt Option B: Fetch from v_pesos_usuario
        const { data: vPesosData, error: vPesosError } = await supabase
            .from('v_pesos_usuario')
            .select('peso_base, peso_minimo, peso_maximo, peso_se_facil, peso_se_dificil, nome_exercicio')
            .eq('usuario_id', usuarioId)
            // Assuming v_pesos_usuario has exercicio_id or can be reliably joined.
            // If v_pesos_usuario only has nome_exercicio, we'd use that:
            // .eq('nome_exercicio', exercise.dim_exercicios.nome) 
            // For now, trying with exercicio_id, assuming it's available or implicitly joined in the view
            .eq('exercicio_id', exercicioId) 
            .single();

        if (vPesosError || !vPesosData) {
            console.warn(`Opção B: Não foi possível buscar dados de progressão em v_pesos_usuario para exercicio_id ${exercicioId}. Erro: ${vPesosError?.message}. Tentando Opção A.`);
            // Fall through to Option A
        } else {
            currentPesoBaseInDb = vPesosData.peso_base;
            const { peso_minimo, peso_maximo, peso_se_facil, peso_se_dificil } = vPesosData;

            if (repsDone >= targetReps && peso_se_facil != null) {
                newPesoBase = parseFloat(peso_se_facil);
            } else if (repsDone < targetReps && peso_se_dificil != null) {
                newPesoBase = parseFloat(peso_se_dificil);
            } else {
                console.warn(`Opção B: peso_se_facil/dificil não disponíveis em v_pesos_usuario para exercicio_id ${exercicioId}. Tentando Opção A.`);
                // Fall through to Option A by leaving newPesoBase undefined here
            }

            if (newPesoBase != null) {
                 newPesoBase = Math.max(parseFloat(peso_minimo), Math.min(newPesoBase, parseFloat(peso_maximo)));
            }
        }

        // Option A (Fallback or if Option B didn't set newPesoBase)
        if (newPesoBase == null) {
            console.log(`Executando Opção A de progressão de carga para exercicio_id ${exercicioId}.`);
            const { data: pesosUsuarioData, error: pesosUsuarioError } = await supabase
                .from('pesos_usuario')
                .select('id, peso_base, peso_minimo, peso_maximo')
                .eq('usuario_id', usuarioId)
                .eq('exercicio_id', exercicioId) // Assuming exercicio_id exists in pesos_usuario
                .single();

            if (pesosUsuarioError || !pesosUsuarioData) {
                console.error(`Opção A: Erro ao buscar dados da tabela pesos_usuario para exercicio_id ${exercicioId}: ${pesosUsuarioError?.message}`);
                return; // Cannot proceed
            }
            
            currentPesoBaseInDb = parseFloat(pesosUsuarioData.peso_base);
            const pesoMinimo = parseFloat(pesosUsuarioData.peso_minimo);
            const pesoMaximo = parseFloat(pesosUsuarioData.peso_maximo);
            const incrementStep = 2.5; // kg
            const decrementStep = 2.5; // kg

            if (repsDone >= targetReps) {
                newPesoBase = Math.min(currentPesoBaseInDb + incrementStep, pesoMaximo);
            } else {
                newPesoBase = Math.max(currentPesoBaseInDb - decrementStep, pesoMinimo);
            }
        }
        
        // Ensure newPesoBase is a number with 2 decimal places
        newPesoBase = parseFloat(newPesoBase.toFixed(2));

        // Update pesos_usuario table if newPesoBase is valid and different
        if (newPesoBase != null && newPesoBase !== parseFloat(currentPesoBaseInDb.toFixed(2))) {
            const { error: updateError } = await supabase
                .from('pesos_usuario')
                .update({ 
                    peso_base: newPesoBase, 
                    data_calculo: new Date().toISOString() 
                })
                .eq('usuario_id', usuarioId)
                .eq('exercicio_id', exercicioId); // Assuming exercicio_id is a key in pesos_usuario

            if (updateError) {
                console.error(`Erro ao atualizar peso_base para exercicio_id ${exercicioId}: ${updateError.message}`);
            } else {
                console.log(`Progressão de carga: peso_base atualizado para ${newPesoBase}kg no exercicio_id ${exercicioId}.`);
            }
        } else if (newPesoBase != null && newPesoBase === parseFloat(currentPesoBaseInDb.toFixed(2))) {
            console.log(`Progressão de carga: peso_base (${newPesoBase}kg) não alterado para exercicio_id ${exercicioId}.`);
        }

    } catch (error) {
        console.error(`Erro geral na função handleLoadProgression para exercicio_id ${exercicioId}: ${error.message}`);
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
    document.getElementById('current-series-info').textContent = 'Descanso'; // Atualiza info da série
    
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
        const { data, error } = await supabase // supabaseClient was already supabase here, no change needed but kept for context
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
        const { data: newWeight, error: insertError } = await supabase // supabaseClient was already supabase here
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
    if (screens[screenId]) {
        screens[screenId].classList.add('active');
    } else {
        console.error(`Screen with id '${screenId}' not found in screens object.`);
    }
}

// --- Weekly Planner Logic ---

// Helper to get ISO week number and year
function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return { week: weekNo, year: d.getUTCFullYear() };
}

async function renderWeeklyPlanner(year, weekNumber) {
    if (!currentUser) {
        alert("Usuário não selecionado.");
        changeScreen('login');
        return;
    }

    document.getElementById('planner-year').textContent = year;
    document.getElementById('planner-week-number').textContent = weekNumber;

    const plannerDaysContainer = document.getElementById('planner-days-container');
    plannerDaysContainer.innerHTML = ''; // Clear previous content

    // Define the 4 mandatory workouts directly for clarity and consistency
    // These are assumed to be the core workouts the user needs to plan.
    // numero_treino should correspond to what's in v_protocolo_treinos/fato_protocolo_treinos
    // The 'nome' here is for display in the dropdown.
    const availableWorkouts = [
        { numero_treino: 1, nome: 'Treino A - Costas/Ombros' }, // Assuming numero_treino 1 is type A
        { numero_treino: 2, nome: 'Treino B - Peito' },         // Assuming numero_treino 2 is type B
        { numero_treino: 3, nome: 'Treino C - Braços/Ombros' },// Assuming numero_treino 3 is type C
        { numero_treino: 4, nome: 'Treino D - Pernas' }         // Assuming numero_treino 4 is type D
    ];
    // The previous dynamic fetching logic from v_protocolo_treinos for availableWorkouts is removed
    // to ensure exactly these 4 workouts are presented for planning, aligning with the
    // "4 mandatory workouts" concept and simplifying validation in saveWeeklySchedule.

    console.log("Workouts disponíveis para planejamento:", availableWorkouts);
    
    const daysOfWeek = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"];

    for (let i = 0; i < 7; i++) {
        const dayOfWeekNumber = i + 1; // 1 for Monday, ..., 7 for Sunday
        const dayCard = document.createElement('div');
        dayCard.className = 'planner-day-card';
        dayCard.dataset.dayOfWeek = dayOfWeekNumber;

        let workoutOptionsHTML = '<option value="">Selecione um treino</option>';
        availableWorkouts.forEach(workout => {
            workoutOptionsHTML += `<option value="${workout.numero_treino}">${workout.nome}</option>`;
        });

        dayCard.innerHTML = `
            <h4>${daysOfWeek[i]}</h4>
            <label for="tipo-atividade-${dayOfWeekNumber}">Atividade:</label>
            <select id="tipo-atividade-${dayOfWeekNumber}" class="planner-activity-type" data-day="${dayOfWeekNumber}">
                <option value="">Selecione</option>
                <option value="TREINO">Treino</option>
                <option value="CARDIO">Cardio</option>
                <option value="DESCANSO">Descanso</option>
            </select>
            
            <div id="treino-select-container-${dayOfWeekNumber}" class="treino-select-container hidden">
                <label for="treino-select-${dayOfWeekNumber}">Treino:</label>
                <select id="treino-select-${dayOfWeekNumber}" name="treino-select-${dayOfWeekNumber}">
                    ${workoutOptionsHTML}
                </select>
            </div>
            
            <label for="observacao-${dayOfWeekNumber}">Observação:</label>
            <textarea id="observacao-${dayOfWeekNumber}" name="observacao-${dayOfWeekNumber}" rows="2"></textarea>
        `;
        
        plannerDaysContainer.appendChild(dayCard);

        const activitySelect = dayCard.querySelector('.planner-activity-type');
        const treinoSelectContainer = dayCard.querySelector('.treino-select-container');
        
        activitySelect.addEventListener('change', (event) => {
            if (event.target.value === 'TREINO') {
                treinoSelectContainer.classList.remove('hidden');
            } else {
                treinoSelectContainer.classList.add('hidden');
                treinoSelectContainer.querySelector('select').value = ""; // Reset treino selection
            }
        });
    }
}

async function saveWeeklySchedule(year, weekNumber) {
    if (!currentUser) {
        alert("Usuário não logado.");
        return;
    }

    const dayCards = document.querySelectorAll('.planner-day-card');
    const scheduleData = [];
    let treinoCount = 0;
    const selectedWorkoutRefs = [];

    for (const card of dayCards) {
        const dayOfWeek = parseInt(card.dataset.dayOfWeek);
        const activityType = card.querySelector('.planner-activity-type').value;
        const workoutSelect = card.querySelector(`#treino-select-${dayOfWeek}`);
        const observation = card.querySelector(`#observacao-${dayOfWeek}`).value.trim();
        let treinoRef = null;

        if (activityType === 'TREINO') {
            treinoCount++;
            treinoRef = workoutSelect.value ? parseInt(workoutSelect.value) : null;
            if (treinoRef) {
                selectedWorkoutRefs.push(treinoRef);
            }
        }
        
        if (!activityType) {
            alert(`Por favor, selecione uma atividade para ${card.querySelector('h4').textContent}.`);
            return;
        }

        scheduleData.push({
            usuario_id: currentUser.id,
            ano: year,
            numero_semana: weekNumber,
            dia_semana: dayOfWeek,
            tipo_atividade: activityType,
            treino_numero_ref: treinoRef,
            observacao: observation
        });
    }

    // Validation
    if (treinoCount !== 4) {
        alert("Você deve planejar exatamente 4 dias de TREINO.");
        return;
    }
    if (scheduleData.filter(d => d.tipo_atividade === 'TREINO' && d.treino_numero_ref == null).length > 0) {
        alert("Todos os dias de TREINO devem ter um treino específico selecionado.");
        return;
    }
    const uniqueSelectedWorkouts = new Set(selectedWorkoutRefs);
    if (selectedWorkoutRefs.length !== 4 || uniqueSelectedWorkouts.size !== 4) {
        // This validation assumes that the list of available workouts for selection itself contains exactly 4 unique workouts.
        // If availableWorkouts has more than 4, this needs adjustment or rely on the user to pick 4 unique ones.
        // For now, it checks if 4 treino_refs are selected and if they are all unique.
        alert("Os 4 treinos selecionados devem ser únicos. Verifique se não há treinos repetidos.");
        return;
    }
    
    // Check if other 3 days are CARDIO or DESCANSO
    const nonTrainoDays = scheduleData.filter(d => d.tipo_atividade !== 'TREINO');
    if (nonTrainoDays.length !== 3 || nonTrainoDays.some(d => d.tipo_atividade !== 'CARDIO' && d.tipo_atividade !== 'DESCANSO')) {
        alert("Os 3 dias restantes devem ser 'CARDIO' ou 'DESCANSO'.");
        return;
    }


    try {
        // Delete existing records for this user, year, and week before inserting new ones
        const { error: deleteError } = await supabase
            .from('planejamento_semanal')
            .delete()
            .eq('usuario_id', currentUser.id)
            .eq('ano', year)
            .eq('numero_semana', weekNumber);

        if (deleteError) {
            console.error("Erro ao deletar planejamento antigo:", deleteError);
            alert(`Erro ao limpar planejamento existente: ${deleteError.message}`);
            return;
        }

        const { error: insertError } = await supabase
            .from('planejamento_semanal')
            .insert(scheduleData);

        if (insertError) {
            console.error("Erro ao salvar planejamento semanal:", insertError);
            alert(`Erro ao salvar planejamento: ${insertError.message}`);
            return;
        }

        alert("Planejamento semanal salvo com sucesso!");
        changeScreen('home');
        // Optionally, refresh home screen data if current week was planned
        // await loadNextWorkout(); // This might be needed if the home screen depends on this plan
    } catch (error) {
        console.error("Erro inesperado ao salvar planejamento:", error);
        alert("Um erro inesperado ocorreu.");
    }
}
