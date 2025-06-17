// Função para expandir/contrair o card principal do treino
window.toggleWorkoutCard = function() {
    console.log('[toggleWorkoutCard] 🔍 Função chamada!');
    
    const card = document.getElementById('current-workout-card');
    const expandableContent = document.getElementById('expandable-content');
    const toggleBtn = document.getElementById('workout-toggle');
    const topActionArea = document.getElementById('top-action-area');
    
    console.log('[toggleWorkoutCard] Elementos encontrados:', {
        card: !!card,
        expandableContent: !!expandableContent,
        toggleBtn: !!toggleBtn,
        topActionArea: !!topActionArea
    });
    
    if (!card || !expandableContent || !toggleBtn) {
        console.error('[toggleWorkoutCard] ❌ Elementos necessários não encontrados!');
        return;
    }
    
    const isExpanded = expandableContent.style.display !== 'none';
    
    console.log('[toggleWorkoutCard] Estado atual:', {
        isExpanded,
        currentDisplay: expandableContent.style.display,
        cardClasses: card.className,
        toggleClasses: toggleBtn.className
    });
    
    if (isExpanded) {
        // Contrair
        console.log('[toggleWorkoutCard] 📤 Contraindo...');
        expandableContent.style.display = 'none';
        card.classList.remove('expanded');
        toggleBtn.classList.remove('expanded');
        
        // Mostrar botão do topo quando reduzido
        if (topActionArea) {
            topActionArea.classList.remove('hidden');
        }
        console.log('[toggleWorkoutCard] ✅ Contraído com sucesso');
    } else {
        // Expandir
        console.log('[toggleWorkoutCard] 📥 Expandindo...');
        expandableContent.style.display = 'block';
        card.classList.add('expanded');
        toggleBtn.classList.add('expanded');
        
        // Ocultar botão do topo quando expandido
        if (topActionArea) {
            topActionArea.classList.add('hidden');
        }
        
        console.log('[toggleWorkoutCard] ✅ Expandido com sucesso');
        
        // Sincronizar dados principais com os dados expandidos
        console.log('[toggleWorkoutCard] 🔄 Sincronizando dados...');
        syncWorkoutData();
    }
};

// Função para sincronizar dados entre versão compacta e expandida
async function syncWorkoutData() {
    console.log('[syncWorkoutData] 🔄 Iniciando sincronização...');
    
    try {
        // Buscar dados do treino atual
        const currentUser = window.AppState?.get('currentUser');
        console.log('[syncWorkoutData] Usuário atual:', currentUser);
        
        if (!currentUser) {
            console.warn('[syncWorkoutData] ❌ Usuário não encontrado para carregar exercícios');
            showNoExercisesMessage('Usuário não encontrado. Faça login novamente.');
            return;
        }

        // Buscar treino do dia atual
        console.log('[syncWorkoutData] 📋 Carregando exercícios para usuário:', currentUser.id);
        await loadTodayWorkoutExercises(currentUser.id);
        console.log('[syncWorkoutData] ✅ Sincronização concluída');
        
    } catch (error) {
        console.error('[syncWorkoutData] ❌ Erro ao sincronizar dados do treino:', error);
        showNoExercisesMessage('Erro ao carregar dados: ' + error.message);
    }
}

// Função para carregar exercícios do treino de hoje
async function loadTodayWorkoutExercises(userId) {
    const container = document.getElementById('workout-exercises-list');
    if (!container) return;

    // Mostrar loading
    container.innerHTML = `
        <div class="loading-exercises">
            <div class="loading-spinner"></div>
            <p>Carregando exercícios...</p>
        </div>
    `;

    try {
        console.log('[loadTodayWorkoutExercises] 🔄 NOVA ARQUITETURA: Usando controller centralizado');
        
        // MUDANÇA: Usar novo controller centralizado
        const { carregarExerciciosParaExpandir } = await import('../controllers/workoutController.js');
        const workoutData = await carregarExerciciosParaExpandir(userId);
        
        // MUDANÇA: buscarExerciciosTreinoDia retorna { data: [...exercicios], planejamento: {...} }
        if (!workoutData || !workoutData.data) {
            console.warn('[loadTodayWorkoutExercises] Nenhum treino encontrado para hoje');
            showNoExercisesMessage('Nenhum treino configurado para hoje.');
            return;
        }
        
        const exercises = workoutData.data;
        const planejamento = workoutData.planejamento;
        
        console.log('[loadTodayWorkoutExercises] Exercícios encontrados:', exercises);
        console.log('[loadTodayWorkoutExercises] Planejamento:', planejamento);
        
        // Verificar se é dia de folga ou cardio
        if (planejamento?.tipo_atividade === 'folga') {
            showNoExercisesMessage('Hoje é dia de descanso! 😴', 'info');
            return;
        }
        
        if (planejamento?.tipo_atividade === 'cardio') {
            showNoExercisesMessage('Treino de cardio configurado! 🏃‍♂️', 'info');
            return;
        }
        
        if (!exercises || exercises.length === 0) {
            showNoExercisesMessage('Nenhum exercício encontrado para este treino.');
            return;
        }
        
        // Processar e exibir exercícios com os dados corretos da semana do protocolo
        displayExercisesFromProtocol(exercises, planejamento);
        
        // Não é mais necessário sincronizar - o controller já fez isso

    } catch (error) {
        console.error('[loadTodayWorkoutExercises] Erro ao carregar exercícios:', error);
        showNoExercisesMessage('Erro ao carregar exercícios: ' + error.message);
    }
}

// Função para renderizar exercícios
function renderWorkoutExercises(exercises, workoutType) {
    const container = document.getElementById('workout-exercises-list');
    if (!container) return;

    const exercisesHTML = exercises.map((exercise, index) => `
        <div class="exercise-item">
            <div class="exercise-header">
                <div class="exercise-info">
                    <h4>${exercise.nome || exercise.exercicio_nome || 'Exercício'}</h4>
                    <p>${exercise.grupo_muscular || exercise.exercicio_grupo || workoutType} • ${exercise.equipamento || exercise.exercicio_equipamento || 'Livre'}</p>
                </div>
                <div class="exercise-badge">${index + 1}</div>
            </div>
            
            <div class="exercise-sets header">
                <div class="set-number">Série</div>
                <div class="set-weight">Peso (kg)</div>
                <div class="set-reps">Reps</div>
                <div class="set-rest">Descanso</div>
            </div>
            
            ${generateExerciseSets(exercise)}
            
            ${exercise.observacoes || exercise.obs ? `<div class="exercise-notes">${exercise.observacoes || exercise.obs}</div>` : ''}
        </div>
    `).join('');

    container.innerHTML = exercisesHTML;
}

// Função para gerar séries do exercício
function generateExerciseSets(exercise) {
    const series = exercise.series || 3;
    const reps = exercise.repeticoes || exercise.reps || '12';
    
    // CORRIGIDO: Usar peso_base como peso principal, ou fallback para peso/weight
    const weight = exercise.peso_base || exercise.peso || exercise.weight || 0;
    const pesoMin = exercise.peso_min;
    const pesoMax = exercise.peso_max;
    
    // Mostrar range de peso se disponível, evitar mostrar 0kg
    let weightDisplay = weight;
    if (pesoMin && pesoMax && pesoMin !== pesoMax && pesoMin > 0) {
        weightDisplay = `${pesoMin}-${pesoMax}`;
    } else if (weight && weight > 0) {
        weightDisplay = weight;
    } else {
        // Se não há peso calculado, mostrar indicação
        weightDisplay = '---';
    }
    
    const rest = exercise.tempo_descanso || exercise.descanso || exercise.rest || '60';

    let setsHTML = '';
    for (let i = 1; i <= series; i++) {
        setsHTML += `
            <div class="exercise-sets">
                <div class="set-number">${i}</div>
                <div class="set-weight">${weightDisplay === '---' ? weightDisplay : weightDisplay + 'kg'}</div>
                <div class="set-reps">${reps}</div>
                <div class="set-rest">${i === series ? '-' : rest + 's'}</div>
            </div>
        `;
    }
    
    return setsHTML;
}

// Função para mostrar mensagem quando não há exercícios
function showNoExercisesMessage(message = 'Nenhum exercício programado para hoje', type = 'warning') {
    const container = document.getElementById('workout-exercises-list');
    if (!container) return;

    // Ícones diferentes baseados no tipo
    const icons = {
        info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
        warning: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
        error: '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>'
    };

    container.innerHTML = `
        <div class="no-exercises-message ${type}">
            <div class="message-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    ${icons[type] || icons.warning}
                </svg>
            </div>
            <p class="message-text">${message}</p>
        </div>
    `;
}

// Função para mostrar mensagem de cardio
function showCardioMessage() {
    const container = document.getElementById('workout-exercises-list');
    if (!container) return;

    container.innerHTML = `
        <div class="no-exercises">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 12h18m-9-9v18"/>
            </svg>
            <p>Hoje é dia de cardio! 🏃‍♂️</p>
            <p>Escolha sua atividade cardiovascular preferida</p>
        </div>
    `;
}

// REMOVIDO: Função de exercícios padrão/simulados
// Conforme regra estabelecida: é proibido simular ou inventar dados

// Função para atualizar informações do treino
window.updateWorkoutInfo = function(exerciseCount, duration) {
    const exercisesEl = document.getElementById('workout-exercises');
    const durationEl = document.getElementById('workout-duration');
    
    if (exercisesEl) exercisesEl.textContent = (exerciseCount || '0') + ' exercícios';
    if (durationEl) durationEl.textContent = '~' + (duration || '30') + 'min';
};

// Função para aplicar sistema de cores nos dias
window.updateDayStatus = function(dayId, status) {
    const dayCard = document.getElementById(`card-${dayId}`) || 
                   document.querySelector(`[data-day="${dayId}"]`) ||
                   document.querySelector(`.day-indicator:nth-child(${getDayIndex(dayId)})`);
    
    if (!dayCard) return;
    
    // Remover classes de status anteriores
    dayCard.classList.remove('completed', 'cancelled', 'pending', 'today');
    
    // Adicionar nova classe de status
    switch(status) {
        case 'completed':
            dayCard.classList.add('completed');
            break;
        case 'cancelled':
            dayCard.classList.add('cancelled');
            break;
        case 'today':
            dayCard.classList.add('today');
            break;
        default:
            dayCard.classList.add('pending');
    }
};

// Helper para obter índice do dia
function getDayIndex(dayName) {
    const days = {
        'domingo': 1, 'segunda': 2, 'terca': 3, 'quarta': 4,
        'quinta': 5, 'sexta': 6, 'sabado': 7
    };
    return days[dayName] || 1;
}

// Inicializar quando DOM carregar
document.addEventListener('DOMContentLoaded', function() {
    // Garantir que o botão do topo esteja visível inicialmente (estado reduzido)
    const topActionArea = document.getElementById('top-action-area');
    const expandableContent = document.getElementById('expandable-content');
    
    if (topActionArea && expandableContent) {
        // Se começar expandido, ocultar botão do topo
        if (expandableContent.style.display !== 'none') {
            topActionArea.classList.add('hidden');
        } else {
            // Se começar reduzido, mostrar botão do topo
            topActionArea.classList.remove('hidden');
        }
    }
    
    // Exemplo de uso - simular dados
    setTimeout(() => {
        updateWorkoutInfo(8, 45);
        updateDayStatus('segunda', 'completed');
        updateDayStatus('terca', 'today');
        updateDayStatus('quinta', 'cancelled');
    }, 1000);
});

// Função para exibir exercícios com dados da semana do protocolo
function displayExercisesFromProtocol(exercises, planejamento, containerId = 'workout-exercises-list') {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`[displayExercisesFromProtocol] container #${containerId} não encontrado`);
        return;
    }

    console.log('[displayExercisesFromProtocol] Exibindo exercícios da semana do protocolo:', exercises);

    // Header do treino
    const headerHtml = `
        <div class="exercises-header">
            <h4>Treino ${planejamento?.tipo_atividade || 'de Força'}</h4>
            <p class="exercises-count">${exercises.length} exercício${exercises.length !== 1 ? 's' : ''} • Semana ${planejamento?.semana_treino || 'N/A'}</p>
        </div>
    `;

    // Gerar HTML dos exercícios
    const exercisesHtml = exercises.map((exercise, index) => {
        // Usar campos corretos da estrutura retornada por buscarExerciciosTreinoDia
        const nome = exercise.nome || exercise.exercicio_nome || 'Exercício sem nome';
        const grupo = exercise.grupo_muscular || exercise.exercicio_grupo || 'N/A';
        const equipamento = exercise.equipamento || exercise.exercicio_equipamento || 'N/A';
        
        // Pesos - usar os campos corretos
        const pesoBase = exercise.peso_base || exercise.peso || 0;
        const pesoMin = exercise.peso_min || pesoBase;
        const pesoMax = exercise.peso_max || pesoBase;
        const pesoDisplay = pesoMin !== pesoMax ? `${pesoMin}-${pesoMax}kg` : `${pesoBase}kg`;
        
        // Series e repetições
        const series = exercise.series || exercise.num_series || 3;
        const repeticoes = exercise.repeticoes || exercise.repeticoes_alvo || exercise.reps || 10;
        const descanso = exercise.tempo_descanso || exercise.rest_time || 90;
        
        // Observações
        const observacoes = exercise.observacoes || exercise.obs || exercise.notes || '';

        return `
            <div class="exercise-card">
                <div class="exercise-header">
                    <div class="exercise-number">${index + 1}</div>
                    <div class="exercise-info">
                        <h4 class="exercise-name">${nome}</h4>
                        <p class="exercise-muscle">${grupo}</p>
                    </div>
                </div>
                
                <div class="exercise-details">
                    <div class="exercise-weight">
                        <span class="label">Peso</span>
                        <span class="value">${pesoDisplay}</span>
                    </div>
                    <div class="exercise-sets">
                        <span class="label">Séries</span>
                        <span class="value">${series}x${repeticoes}</span>
                    </div>
                    <div class="exercise-rest">
                        <span class="label">Descanso</span>
                        <span class="value">${descanso}s</span>
                    </div>
                    <div class="exercise-equipment">
                        <span class="label">Equipamento</span>
                        <span class="equipment-tag">${equipamento}</span>
                    </div>
                </div>
                
                ${observacoes ? `
                    <div class="exercise-notes">
                        <strong>Observações:</strong> ${observacoes}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');

    // Footer com informações adicionais
    const footerHtml = `
        <div class="exercises-footer">
            <p class="rm-info">💡 Pesos calculados baseados na sua 1RM e progressão da semana ${planejamento?.semana_treino || 'N/A'}</p>
        </div>
    `;

    container.innerHTML = headerHtml + `<div class="exercises-grid">${exercisesHtml}</div>` + footerHtml;
    // Retorna o container para encadeamento opcional
    return container;
}

// Disponibilizar globalmente para uso em outros módulos (ex.: modal de histórico)
window.displayExercisesFromProtocol = displayExercisesFromProtocol;


// Função para sincronizar toda a página com os dados corretos do expandir
function sincronizarPaginaComDadosDoExpandir(exercises, planejamento) {
    console.log('[sincronizarPaginaComDadosDoExpandir] 🔄 Sincronizando página com dados do protocolo...');
    console.log('[sincronizarPaginaComDadosDoExpandir] Exercícios:', exercises);
    console.log('[sincronizarPaginaComDadosDoExpandir] Planejamento:', planejamento);
    
    if (!exercises || !planejamento) {
        console.warn('[sincronizarPaginaComDadosDoExpandir] ⚠️ Dados insuficientes para sincronização');
        return;
    }
    
    // 1. Atualizar card principal com dados corretos
    atualizarCardPrincipal(exercises, planejamento);
    
    // 2. Atualizar AppState com dados corretos
    atualizarAppState(exercises, planejamento);
    
    // 3. Atualizar indicadores da semana
    atualizarIndicadoresSemana(planejamento);
    
    console.log('[sincronizarPaginaComDadosDoExpandir] ✅ Página sincronizada com dados da semana', planejamento.semana_treino);
}

// 1. Atualizar card principal
function atualizarCardPrincipal(exercises, planejamento) {
    console.log('[atualizarCardPrincipal] 🎯 Atualizando card principal...');
    
    // Elementos do card principal
    const workoutNameEl = document.getElementById('workout-name');
    const workoutExercisesEl = document.getElementById('workout-exercises');
    const workoutTypeEl = document.getElementById('workout-type');
    
    if (workoutNameEl) {
        const nome = `Treino ${planejamento.tipo_atividade} - Semana ${planejamento.semana_treino}`;
        workoutNameEl.textContent = nome;
        console.log('[atualizarCardPrincipal] ✅ Nome atualizado:', nome);
    }
    
    if (workoutExercisesEl) {
        const descricao = `${exercises.length} exercícios • Semana ${planejamento.semana_treino} • ${planejamento.tipo_atividade}`;
        workoutExercisesEl.textContent = descricao;
        console.log('[atualizarCardPrincipal] ✅ Descrição atualizada:', descricao);
    }
    
    if (workoutTypeEl) {
        workoutTypeEl.textContent = `Treino ${planejamento.tipo_atividade}`;
        console.log('[atualizarCardPrincipal] ✅ Tipo atualizado:', planejamento.tipo_atividade);
    }
}

// 2. Atualizar AppState
function atualizarAppState(exercises, planejamento) {
    console.log('[atualizarAppState] 🗃️ Atualizando AppState...');
    
    const workoutData = {
        tipo: planejamento.tipo_atividade,
        nome: `Treino ${planejamento.tipo_atividade}`,
        grupo_muscular: planejamento.tipo_atividade,
        semana_treino: planejamento.semana_treino,
        exercicios: exercises,
        concluido: false
    };
    
    if (window.AppState) {
        window.AppState.set('currentWorkout', workoutData);
        console.log('[atualizarAppState] ✅ currentWorkout atualizado:', workoutData);
    }
}

// 3. Atualizar indicadores da semana
function atualizarIndicadoresSemana(planejamento) {
    console.log('[atualizarIndicadoresSemana] 📅 Atualizando indicadores...');
    
    // Atualizar seletor de semana
    const weekNumberEl = document.getElementById('week-number');
    if (weekNumberEl) {
        weekNumberEl.textContent = `Semana ${planejamento.semana_treino}`;
        console.log('[atualizarIndicadoresSemana] ✅ Número da semana atualizado:', planejamento.semana_treino);
    }
    
    // Atualizar status da semana
    const weekStatusEl = document.getElementById('week-status');
    if (weekStatusEl) {
        weekStatusEl.textContent = 'Ativa';
        weekStatusEl.className = 'week-status atual';
        console.log('[atualizarIndicadoresSemana] ✅ Status da semana atualizado');
    }
    
    // Outros elementos que mostram semana
    const currentWeekEl = document.getElementById('current-week');
    if (currentWeekEl) {
        currentWeekEl.textContent = `Semana ${planejamento.semana_treino}`;
        console.log('[atualizarIndicadoresSemana] ✅ Current week atualizado');
    }
}

// Função de teste para debug
window.testarToggleWorkout = function() {
    console.log('🧪 [TESTE] Iniciando teste do toggle workout...');
    
    // Verificar se elementos existem
    const elementos = {
        card: document.getElementById('current-workout-card'),
        content: document.getElementById('expandable-content'),
        toggle: document.getElementById('workout-toggle'),
        exercisesList: document.getElementById('workout-exercises-list')
    };
    
    console.log('🧪 [TESTE] Elementos encontrados:', elementos);
    
    // Testar a função toggleWorkoutCard
    if (window.toggleWorkoutCard) {
        console.log('🧪 [TESTE] Chamando toggleWorkoutCard...');
        window.toggleWorkoutCard();
    } else {
        console.error('🧪 [TESTE] ❌ toggleWorkoutCard não está definida!');
    }
};

// Função para testar sincronização completa
window.testarSincronizacaoCompleta = async function() {
    console.log('🧪 [TESTE-SYNC] Testando sincronização completa da página...');
    
    const currentUser = window.AppState?.get('currentUser');
    if (!currentUser) {
        console.error('🧪 [TESTE-SYNC] ❌ Usuário não logado');
        return;
    }
    
    try {
        // Carregar dados do protocolo
        await loadTodayWorkoutExercises(currentUser.id);
        
        // Verificar se sincronização aconteceu
        const currentWorkout = window.AppState?.get('currentWorkout');
        console.log('🧪 [TESTE-SYNC] CurrentWorkout após sincronização:', currentWorkout);
        
        // Verificar elementos da página
        const elementos = {
            workoutName: document.getElementById('workout-name')?.textContent,
            workoutExercises: document.getElementById('workout-exercises')?.textContent,
            weekNumber: document.getElementById('week-number')?.textContent,
            weekStatus: document.getElementById('week-status')?.textContent
        };
        
        console.log('🧪 [TESTE-SYNC] Elementos da página:', elementos);
        console.log('🧪 [TESTE-SYNC] ✅ Teste de sincronização concluído');
        
    } catch (error) {
        console.error('🧪 [TESTE-SYNC] ❌ Erro no teste:', error);
    }
};

// Função para testar carregamento de exercícios
window.testarCarregarExercicios = async function() {
    console.log('🧪 [TESTE] Testando carregamento de exercícios...');
    
    const currentUser = window.AppState?.get('currentUser');
    if (!currentUser) {
        console.error('🧪 [TESTE] ❌ Usuário não logado');
        return;
    }
    
    try {
        await loadTodayWorkoutExercises(currentUser.id);
        console.log('🧪 [TESTE] ✅ Exercícios carregados com sucesso');
    } catch (error) {
        console.error('🧪 [TESTE] ❌ Erro ao carregar exercícios:', error);
    }
};

console.log('🎯 Workout Toggle System carregado - Design Neon ativo!');
console.log('💡 Para testar:');
console.log('  - window.testarToggleWorkout() (testa o toggle)');
console.log('  - window.testarCarregarExercicios() (testa carregamento)');
console.log('  - window.testarSincronizacaoCompleta() (testa sincronização completa)');

// Auto-test ao carregar (apenas uma vez)
if (!window._workoutToggleTestExecuted) {
    window._workoutToggleTestExecuted = true;
    setTimeout(() => {
        console.log('🤖 [AUTO-TEST] Verificando se elementos estão disponíveis...');
        const elementos = {
            card: !!document.getElementById('current-workout-card'),
            content: !!document.getElementById('expandable-content'),
            toggle: !!document.getElementById('workout-toggle'),
            exercisesList: !!document.getElementById('workout-exercises-list')
        };
        console.log('🤖 [AUTO-TEST] Elementos disponíveis:', elementos);
        
        // Verificar cada elemento individualmente
        Object.entries(elementos).forEach(([nome, existe]) => {
            if (existe) {
                console.log(`🤖 [AUTO-TEST] ✅ ${nome}: ENCONTRADO`);
            } else {
                console.error(`🤖 [AUTO-TEST] ❌ ${nome}: NÃO ENCONTRADO`);
                
                // Tentar encontrar elementos similares
                const similarElements = document.querySelectorAll(`[id*="${nome.replace('card', 'workout').replace('content', 'expandable').replace('toggle', 'toggle').replace('exercisesList', 'exercises')}"]`);
                if (similarElements.length > 0) {
                    console.log(`🤖 [AUTO-TEST] 🔍 Elementos similares encontrados:`, Array.from(similarElements).map(el => el.id));
                }
            }
        });
        
        if (elementos.card && elementos.content && elementos.toggle) {
            console.log('🤖 [AUTO-TEST] ✅ Todos os elementos necessários estão disponíveis!');
        } else {
            console.warn('🤖 [AUTO-TEST] ⚠️ Alguns elementos não foram encontrados.');
            
            // Debug adicional - listar todos os IDs disponíveis
            const todosOsIds = Array.from(document.querySelectorAll('[id]')).map(el => el.id);
            console.log('🤖 [AUTO-TEST] 📋 Todos os IDs disponíveis na página:', todosOsIds);
            
            // Debug adicional - verificar qual tela está sendo exibida
            const appContent = document.getElementById('app');
            console.log('🤖 [AUTO-TEST] 📺 Conteúdo do app:', appContent ? appContent.innerHTML.substring(0, 200) + '...' : 'App não encontrado');
            
            // Verificar se estamos na tela home
            const homeScreen = document.getElementById('home-screen');
            const loginScreen = document.getElementById('login-screen');
            console.log('🤖 [AUTO-TEST] 🏠 Tela atual:', {
                home: !!homeScreen,
                login: !!loginScreen,
                appExists: !!appContent
            });
        }
    }, 2000);
}

// Função para aguardar a tela home ser renderizada
function aguardarTelaHome() {
    console.log('🤖 [AGUARDAR-HOME] Aguardando tela home ser renderizada...');
    
    const checkInterval = setInterval(() => {
        const homeScreen = document.getElementById('home-screen');
        const workoutCard = document.getElementById('current-workout-card');
        
        if (homeScreen && workoutCard) {
            console.log('🤖 [AGUARDAR-HOME] ✅ Tela home detectada! Inicializando toggle...');
            clearInterval(checkInterval);
            
            // Executar o teste novamente agora que a home existe
            setTimeout(() => {
                const elementos = {
                    card: !!document.getElementById('current-workout-card'),
                    content: !!document.getElementById('expandable-content'),
                    toggle: !!document.getElementById('workout-toggle'),
                    exercisesList: !!document.getElementById('workout-exercises-list')
                };
                
                console.log('🤖 [AGUARDAR-HOME] Elementos após home renderizada:', elementos);
                
                if (elementos.card && elementos.content && elementos.toggle) {
                    console.log('🤖 [AGUARDAR-HOME] ✅ Toggle workout pronto para uso!');
                } else {
                    console.warn('🤖 [AGUARDAR-HOME] ⚠️ Alguns elementos ainda não encontrados após renderização da home');
                }
            }, 500);
        }
    }, 1000);
    
    // Timeout de segurança (30 segundos)
    setTimeout(() => {
        clearInterval(checkInterval);
        console.warn('🤖 [AGUARDAR-HOME] ⏰ Timeout: Tela home não foi renderizada em 30 segundos');
    }, 30000);
}

// Iniciar o observador imediatamente
console.log('🚀 [INIT] Iniciando sistema de observação da home...');
aguardarTelaHome();

// Observador adicional com MutationObserver para detectar mudanças no DOM
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
            const homeScreen = document.getElementById('home-screen');
            const workoutCard = document.getElementById('current-workout-card');
            
            if (homeScreen && workoutCard && !window._workoutToggleReady) {
                window._workoutToggleReady = true;
                console.log('🤖 [MUTATION-OBSERVER] ✅ Home detectada via MutationObserver!');
                
                setTimeout(() => {
                    const elementos = {
                        card: !!document.getElementById('current-workout-card'),
                        content: !!document.getElementById('expandable-content'),
                        toggle: !!document.getElementById('workout-toggle'),
                        exercisesList: !!document.getElementById('workout-exercises-list')
                    };
                    
                    console.log('🤖 [MUTATION-OBSERVER] Elementos encontrados:', elementos);
                    
                    if (elementos.card && elementos.content && elementos.toggle) {
                        console.log('🤖 [MUTATION-OBSERVER] ✅ Toggle workout PRONTO! Pode expandir o resumo.');
                        
                        // Testar automaticamente uma vez
                        if (!window._autoTestExecuted) {
                            window._autoTestExecuted = true;
                            console.log('🤖 [MUTATION-OBSERVER] 🧪 Executando teste automático...');
                            setTimeout(() => {
                                if (window.toggleWorkoutCard) {
                                    console.log('🤖 [MUTATION-OBSERVER] 🧪 Testando toggleWorkoutCard...');
                                    window.toggleWorkoutCard();
                                }
                            }, 1000);
                        }
                    }
                }, 100);
            }
        }
    });
});

// Iniciar observação
observer.observe(document.body, {
    childList: true,
    subtree: true
});

console.log('🚀 [INIT] MutationObserver ativo, aguardando mudanças no DOM...');

// Aguardar especificamente pela função garantirCardExpandivelExiste ser executada
let attempts = 0;
const maxAttempts = 30; // 30 segundos
const checkForElements = setInterval(() => {
    attempts++;
    
    const elementos = {
        card: !!document.getElementById('current-workout-card'),
        content: !!document.getElementById('expandable-content'),
        toggle: !!document.getElementById('workout-toggle'),
        exercisesList: !!document.getElementById('workout-exercises-list')
    };
    
    const todosExistem = elementos.card && elementos.content && elementos.toggle && elementos.exercisesList;
    
    if (todosExistem) {
        console.log(`🚀 [FINAL-CHECK] ✅ Elementos encontrados após ${attempts} tentativas!`, elementos);
        console.log('🚀 [FINAL-CHECK] 🎉 Toggle workout está PRONTO para uso!');
        clearInterval(checkForElements);
        
        // Notificar que está pronto
        if (window.workoutToggleCallback) {
            window.workoutToggleCallback();
        }
        
        return;
    }
    
    if (attempts >= maxAttempts) {
        console.error(`🚀 [FINAL-CHECK] ❌ Timeout após ${attempts} tentativas. Elementos não encontrados:`, elementos);
        console.error('🚀 [FINAL-CHECK] ❌ Verifique se a home está sendo renderizada corretamente.');
        clearInterval(checkForElements);
    } else if (attempts % 5 === 0) {
        console.log(`🚀 [FINAL-CHECK] ⏳ Tentativa ${attempts}/${maxAttempts} - aguardando elementos...`);
    }
}, 1000);