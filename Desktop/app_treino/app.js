// app.js - Aplicação de Treinamento com Design Moderno
console.log('[app.js] JS carregado com sucesso!');

// Funções de Modal
function abrirModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
    }
}

function fecharModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// ==================== CONFIGURAÇÃO INICIAL ====================
const supabase = window.supabase.createClient(
    window.SUPABASE_CONFIG.url, 
    window.SUPABASE_CONFIG.key
);

// ==================== ESTADO GLOBAL DA APLICAÇÃO ====================
const AppState = {
    currentUser: null,
    currentProtocol: null,
    currentWorkout: null,
    currentExercises: [],
    currentExerciseIndex: 0,
    workoutStartTime: null,
    completedSeries: 0,
    timerInterval: null,
    restStartTime: null,
    weekPlan: null,
    restTime: 0,
    pesosSugeridos: {},
    isResting: false
};

// ==================== FUNÇÕES DE BANCO DE DADOS ====================

// 1. Funções de Usuário
async function fetchUsuarios() {
    try {
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('status', 'ativo')
            .order('nome');
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        showNotification('Erro ao carregar usuários', 'error');
        return [];
    }
}

// 2. Buscar protocolo ativo do usuário
async function fetchProtocoloAtivoUsuario(userId) {
    try {
        const { data: planoAtivo, error: planoError } = await supabase
            .from('usuario_plano_treino')
            .select(`
                *,
                protocolos_treinamento (*)
            `)
            .eq('usuario_id', userId)
            .eq('status', 'ativo')
            .single();
        
        if (planoError || !planoAtivo) {
            const { data: novoPlano, error: novoPlanoError } = await supabase
                .from('usuario_plano_treino')
                .insert({
                    usuario_id: userId,
                    protocolo_treinamento_id: 1,
                    semana_atual: 1,
                    status: 'ativo'
                })
                .select(`
                    *,
                    protocolos_treinamento (*)
                `)
                .single();
            
            if (novoPlanoError) throw novoPlanoError;
            return novoPlano;
        }
        
        return planoAtivo;
    } catch (error) {
        console.error('Erro ao buscar protocolo do usuário:', error);
        return null;
    }
}

// 3. Buscar próximo treino do usuário
async function fetchProximoTreino(userId, protocoloId) {
    try {
        const weekPlan = getWeekPlan(userId);
        const today = new Date().getDay();
        
        if (weekPlan && weekPlan[today] && weekPlan[today] !== 'folga' && weekPlan[today] !== 'cardio') {
            const tipoTreino = weekPlan[today];
            const diaSemana = { 'A': 1, 'B': 2, 'C': 3, 'D': 4 }[tipoTreino];
            
            const { data: treino, error } = await supabase
                .from('protocolo_treinos')
                .select(`
                    *,
                    exercicios (*)
                `)
                .eq('protocolo_id', protocoloId)
                .eq('dia_semana', diaSemana)
                .eq('semana_referencia', AppState.currentProtocol.semana_atual)
                .limit(1)
                .single();
            
            if (!error && treino) return treino;
        }
        
        const { data: execucoes, error: execError } = await supabase
            .from('execucao_exercicio_usuario')
            .select('protocolo_treino_id')
            .eq('usuario_id', userId);
        
        if (execError) throw execError;
        
        const treinosRealizados = [...new Set(execucoes.map(e => e.protocolo_treino_id))];
        
        let query = supabase
            .from('protocolo_treinos')
            .select(`
                *,
                exercicios (*)
            `)
            .eq('protocolo_id', protocoloId)
            .order('numero_treino', { ascending: true });
        
        if (treinosRealizados.length > 0) {
            query = query.not('id', 'in', `(${treinosRealizados.join(',')})`);
        }
        
        const { data: proximoTreino, error } = await query.limit(1);
        
        if (error) throw error;
        
        if (!proximoTreino || proximoTreino.length === 0) {
            const { data: primeiroTreino, error: primeiroError } = await supabase
                .from('protocolo_treinos')
                .select(`
                    *,
                    exercicios (*)
                `)
                .eq('protocolo_id', protocoloId)
                .eq('numero_treino', 1)
                .limit(1);
            
            if (primeiroError) throw primeiroError;
            return primeiroTreino[0];
        }
        
        return proximoTreino[0];
    } catch (error) {
        console.error('Erro ao buscar próximo treino:', error);
        return null;
    }
}

// 4. Buscar exercícios do treino
async function fetchExerciciosTreino(numeroTreino, protocoloId) {
    try {
        const { data, error } = await supabase
            .from('protocolo_treinos')
            .select(`
                id,
                protocolo_id,
                exercicio_id,
                numero_treino,
                semana_referencia,
                dia_semana,
                percentual_1rm_base,
                percentual_1rm_min,
                percentual_1rm_max,
                series,
                repeticoes_alvo,
                tempo_descanso,
                ordem_exercicio,
                observacoes,
                exercicios (
                    id,
                    nome,
                    grupo_muscular,
                    equipamento,
                    tempo_descanso_padrao
                )
            `)
            .eq('numero_treino', numeroTreino)
            .eq('protocolo_id', protocoloId)
            .order('ordem_exercicio', { ascending: true });
        
        if (error) throw error;
        
        const exerciciosUnicos = data.reduce((acc, item) => {
            const existente = acc.find(e => e.exercicio_id === item.exercicio_id);
            if (!existente) {
                acc.push({
                    ...item,
                    exercicio_nome: item.exercicios?.nome || 'Exercício sem nome',
                    exercicio_grupo: item.exercicios?.grupo_muscular || 'Grupo não especificado',
                    exercicio_equipamento: item.exercicios?.equipamento || 'Equipamento não especificado'
                });
            }
            return acc;
        }, []);
        
        return exerciciosUnicos;
        
    } catch (error) {
        console.error('Erro ao buscar exercícios:', error);
        return [];
    }
}

// 5. Buscar 1RM do usuário
async function fetch1RMUsuario(userId, exercicioId) {
    try {
        const { data, error } = await supabase
            .from('usuario_1rm')
            .select('rm_calculado')
            .eq('usuario_id', userId)
            .eq('exercicio_id', exercicioId)
            .eq('status', 'ativo')
            .order('data_teste', { descending: true })
            .limit(1)
            .single();
        
        if (error) return null;
        return data.rm_calculado;
    } catch (error) {
        return null;
    }
}

// 6. Salvar execução do exercício
async function salvarExecucaoExercicio(dados) {
    try {
        const { error } = await supabase
            .from('execucao_exercicio_usuario')
            .insert(dados);
        
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Erro ao salvar execução:', error);
        return false;
    }
}

// 7. Buscar métricas do usuário
async function fetchMetricasUsuario(userId) {
    try {
        const { data: execucoes, error } = await supabase
            .from('execucao_exercicio_usuario')
            .select('protocolo_treino_id')
            .eq('usuario_id', userId);
        
        if (error) throw error;
        
        const treinosUnicos = [...new Set(execucoes.map(e => e.protocolo_treino_id))];
        const totalTreinos = treinosUnicos.length;
        
        const planoAtivo = await fetchProtocoloAtivoUsuario(userId);
        let progresso = 0;
        let semanaAtual = 1;
        
        if (planoAtivo) {
            semanaAtual = planoAtivo.semana_atual;
            const totalTreinosProtocolo = planoAtivo.protocolos_treinamento.total_treinos || 48;
            progresso = Math.round((totalTreinos / totalTreinosProtocolo) * 100);
        }
        
        const { data: ultimoTreino, error: ultimoError } = await supabase
            .from('execucao_exercicio_usuario')
            .select('data_execucao, protocolo_treino_id')
            .eq('usuario_id', userId)
            .order('data_execucao', { descending: true })
            .limit(1)
            .single();
        
        let ultimoTreinoInfo = null;
        if (!ultimoError && ultimoTreino) {
            const { data: detalhes } = await supabase
                .from('protocolo_treinos')
                .select('dia_semana, semana_referencia')
                .eq('id', ultimoTreino.protocolo_treino_id)
                .single();
            
            if (detalhes) {
                ultimoTreinoInfo = {
                    data: new Date(ultimoTreino.data_execucao),
                    tipo: obterTipoTreino(detalhes.dia_semana),
                    semana: detalhes.semana_referencia
                };
            }
        }
        
        return {
            treinosConcluidos: totalTreinos,
            progresso: progresso,
            semanaAtual: semanaAtual,
            ultimoTreino: ultimoTreinoInfo
        };
    } catch (error) {
        console.error('Erro ao buscar métricas:', error);
        return {
            treinosConcluidos: 0,
            progresso: 0,
            semanaAtual: 1,
            ultimoTreino: null
        };
    }
}

// 8. Buscar dados para indicadores
async function fetchDadosIndicadores() {
    try {
        // Buscar ranking competitivo
        const { data: comparacao, error: compError } = await supabase
            .from('v_comparativo_usuarios')
            .select('*');
        
        if (compError) throw compError;
        
        // Buscar estatísticas gerais
        const { data: estatisticas, error: estError } = await supabase
            .from('v_estatisticas_usuarios')
            .select('*')
            .eq('usuario_id', AppState.currentUser.id)
            .maybeSingle();
        
        if (estError) throw estError;
        
        // Buscar resumo por grupo muscular
        const { data: resumoGrupo, error: resumoError } = await supabase
            .from('v_resumo_grupo_muscular')
            .select('*')
            .eq('usuario', AppState.currentUser.nome);
        
        if (resumoError) throw resumoError;
        
        return {
            comparacao,
            estatisticas,
            resumoGrupo
        };
    } catch (error) {
        console.error('Erro ao buscar dados dos indicadores:', error);
        return { comparacao: [], estatisticas: null, resumoGrupo: [] };
    }
}

// ==================== FUNÇÕES DE PLANEJAMENTO SEMANAL ====================

function needsWeekPlanning(userId) {
    const key = `weekPlan_${userId}_${getWeekKey()}`;
    const plan = localStorage.getItem(key);
    return !plan;
}

function getWeekKey() {
    const now = new Date();
    const year = now.getFullYear();
    const week = getWeekNumber(now);
    return `${year}_${week}`;
}

function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
}

function saveWeekPlan(userId, plan) {
    const key = `weekPlan_${userId}_${getWeekKey()}`;
    localStorage.setItem(key, JSON.stringify(plan));
    AppState.weekPlan = plan;
}

function getWeekPlan(userId) {
    const key = `weekPlan_${userId}_${getWeekKey()}`;
    const plan = localStorage.getItem(key);
    return plan ? JSON.parse(plan) : null;
}

// ==================== FUNÇÕES DE UI ====================

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'error' ? '#f44336' : '#4caf50'};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 1000;
        animation: slideUp 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideDown 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function renderUsuarios(usuarios) {
    const container = document.getElementById('users-grid');
    container.innerHTML = '';
    
    usuarios.forEach(user => {
        const userImages = {
            'Pedro': 'pedro.png',
            'Japa': 'japa.png'
        };
        
        const card = document.createElement('div');
        card.className = 'user-card';
        card.innerHTML = `
            <div class="user-avatar">
                <img src="${userImages[user.nome] || 'pedro.png'}" 
                     alt="${user.nome}">
            </div>
            <h3>${user.nome}</h3>
            <p>Atleta Premium</p>
        `;
        card.addEventListener('click', function() {
            selecionarUsuario(user);
        });
        container.appendChild(card);
    });
}

async function selecionarUsuario(usuario) {
    console.log('[selecionarUsuario] Iniciando seleção para usuário:', usuario);
    showLoading();
    try {
        AppState.currentUser = usuario;
        
        // Atualizar UI
        document.getElementById('user-name').textContent = usuario.nome;
        const userImages = {
            'Pedro': 'pedro.png',
            'Japa': 'japa.png'
        };
        const avatarEl = document.getElementById('user-avatar');
        if (avatarEl) {
            avatarEl.src = userImages[usuario.nome] || 'pedro.png';
        }
        
        const protocolo = await fetchProtocoloAtivoUsuario(usuario.id);
        console.log('[selecionarUsuario] Protocolo retornado:', protocolo);
        
        if (!protocolo) {
            console.warn('[selecionarUsuario] Nenhum protocolo retornado para o usuário.');
            showNotification('Erro ao carregar protocolo do usuário.', 'error');
            // hideLoading() é chamado no finally
            return;
        }
        
        AppState.currentProtocol = protocolo;
        
        // Verificar planejamento semanal
        if (needsWeekPlanning(usuario.id)) {
            console.log('[selecionarUsuario] Usuário precisa de planejamento semanal.');
            mostrarModalPlanejamento();
            // hideLoading() é chamado no finally
            return;
        }
        
        AppState.weekPlan = getWeekPlan(usuario.id);
        console.log('[selecionarUsuario] WeekPlan definido:', AppState.weekPlan);
        console.log('[selecionarUsuario] Chamando carregarDashboard...');
        await carregarDashboard();
        console.log('[selecionarUsuario] Dashboard carregado! Exibindo tela principal.');
        mostrarTela('home-screen');
    } catch (error) {
        console.error('Erro detalhado ao selecionar usuário ou carregar dashboard:', error);
        showNotification('Ocorreu um erro ao carregar os dados do usuário.', 'error');
    } finally {
        hideLoading();
    }
}

async function carregarDashboard() {
    // Atualizar indicador de semana
    atualizarIndicadorSemana();
    
    // Buscar métricas
    const metricas = await fetchMetricasUsuario(AppState.currentUser.id);
    
    // Atualizar cards de métricas
    document.getElementById('completed-workouts').textContent = metricas.treinosConcluidos;
    document.getElementById('current-week').textContent = metricas.semanaAtual;
    document.getElementById('progress-percentage').textContent = `${metricas.progresso}%`;
    
    // Atualizar progress ring
    const progressRing = document.querySelector('.progress-ring-progress');
    const circumference = 2 * Math.PI * 40;
    const offset = circumference - (metricas.progresso / 100) * circumference;
    progressRing.style.strokeDashoffset = offset;
    document.querySelector('.progress-percentage').textContent = `${metricas.progresso}%`;
    
    // Atualizar informação do protocolo
    if (AppState.currentProtocol) {
        const userProtocol = document.getElementById('user-protocol');
        const semanaAtual = AppState.currentProtocol.semana_atual || 1;
        const nomeProt = AppState.currentProtocol.nome_protocolo || 'Protocolo não definido';
        userProtocol.textContent = `${nomeProt} - Semana ${semanaAtual}`;
    }
    
    // Buscar próximo treino
    const proximoTreino = await fetchProximoTreino(
        AppState.currentUser.id, 
        AppState.currentProtocol.protocolo_treinamento_id
    );
    
    if (proximoTreino) {
        AppState.currentWorkout = proximoTreino;
        const tipoTreino = obterTipoTreino(proximoTreino.dia_semana);
        document.getElementById('next-workout-name').textContent = `Treino ${tipoTreino}`;
        
        // Buscar exercícios do treino
        const exercicios = await fetchExerciciosTreino(
            proximoTreino.numero_treino,
            AppState.currentProtocol.protocolo_treinamento_id
        );
        
        AppState.currentExercises = exercicios;
    }
    
    // Carregar dados dos indicadores (ranking, estatísticas, etc)
    const dadosIndicadores = await fetchDadosIndicadores();
    if (dadosIndicadores.comparacao && dadosIndicadores.comparacao.length > 0) {
        // Renderizar ranking competitivo na seção de métricas
        renderizarMetricasCompetitivas(dadosIndicadores);
    }
}

function atualizarIndicadorSemana() {
    const weekPlan = AppState.weekPlan;
    const today = new Date().getDay();
    const dayPills = document.querySelectorAll('.day-pill');
    
    dayPills.forEach((pill, index) => {
        pill.classList.remove('active', 'completed');
        
        if (weekPlan && weekPlan[index]) {
            const dayPlan = weekPlan[index];
            if (dayPlan === 'folga') {
                pill.textContent = 'Folga';
                pill.style.opacity = '0.5';
            } else if (dayPlan === 'cardio') {
                pill.textContent = 'Cardio';
            } else {
                pill.textContent = dayPlan;
            }
            
            if (index === today) {
                pill.classList.add('active');
            } else if (index < today) {
                pill.classList.add('completed');
            }
        }
    });
}

function obterTipoTreino(diaSemana) {
    const tipos = { 1: 'A', 2: 'B', 3: 'C', 4: 'D' };
    return tipos[diaSemana] || 'A';
}

function mostrarTela(telaId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(telaId).classList.add('active');
}

function showLoading() {
    const loading = document.createElement('div');
    loading.className = 'loading-overlay';
    loading.innerHTML = '<div class="loading-spinner"></div>';
    document.body.appendChild(loading);
}

function hideLoading() {
    const loading = document.querySelector('.loading-overlay');
    if (loading) loading.remove();
}

// ==================== FUNÇÕES DE MÉTRICAS COMPETITIVAS ====================

function renderizarMetricasCompetitivas(dadosIndicadores) {
    // TODO: Refatorar carregarRankingCompetitivo para utilizar dadosIndicadores.comparacao
    // em vez de buscar os dados novamente, se aplicável.
    carregarRankingCompetitivo();

    carregarEstatisticasUsuarios();

    if (AppState.currentUser && AppState.currentUser.nome) {
        carregarResumoGrupoMuscular(AppState.currentUser.nome);
    } else {
        console.warn("Nome do usuário atual não disponível para carregar resumo muscular.");
    }
}

// Ranking de força entre Pedro e Japa por exercício
async function carregarRankingCompetitivo() {
    const { data, error } = await supabase.from('v_comparativo_usuarios').select('*');
    if (error) {
        showNotification('Erro ao carregar ranking competitivo', 'error');
        return;
    }
    // Aqui você pode renderizar os dados em uma tabela ou cards
    // Exemplo de uso: renderizarRankingCompetitivo(data);
}

// Estatísticas gerais dos usuários
async function carregarEstatisticasUsuarios() {
    const { data, error } = await supabase.from('v_estatisticas_usuarios').select('*');
    if (error) {
        showNotification('Erro ao carregar estatísticas dos usuários', 'error');
        return;
    }
    // Exemplo de uso: renderizarEstatisticasUsuarios(data);
}

// Resumo de desempenho por grupo muscular
async function carregarResumoGrupoMuscular(nomeUsuario) {
    const { data, error } = await supabase
        .from('v_resumo_grupo_muscular')
        .select('*')
        .eq('usuario', nomeUsuario);
    if (error) {
        showNotification('Erro ao carregar resumo por grupo muscular', 'error');
        return;
    }
    // Exemplo de uso: renderizarResumoGrupoMuscular(data);
}

// ==================== FUNÇÕES DE PESOS SUGERIDOS NO TREINO ====================

// Carregar pesos sugeridos para o treino do usuário
async function carregarPesosSugeridos(usuarioId, protocoloTreinoId) {
    const { data, error } = await supabase
        .from('v_pesos_usuario')
        .select('*')
        .eq('usuario_id', usuarioId)
        .eq('protocolo_treino_id', protocoloTreinoId);
    if (error) {
        showNotification('Erro ao carregar pesos sugeridos', 'error');
        return;
    }
    // Exemplo de uso: renderizarPesosSugeridos(data);
}

// ==================== FUNÇÕES DE TREINO ====================

// Stubs for navigation to prevent ReferenceError
function mostrarPrograma() {
    showNotification('Funcionalidade de programa ainda não implementada.', 'info');
}
function mostrarHistorico() {
    showNotification('Funcionalidade de histórico ainda não implementada.', 'info');
}
function mostrarPerfil() {
    showNotification('Funcionalidade de perfil ainda não implementada.', 'info');
}

// Iniciar treino
async function iniciarTreino() {
    if (!AppState.currentWorkout || !AppState.currentExercises) {
        showNotification('Nenhum treino disponível', 'error');
        return;
    }
    
    // Reset state
    AppState.currentExerciseIndex = 0;
    AppState.completedSeries = 0;
    
    // Update workout title
    const tipoTreino = obterTipoTreino(AppState.currentWorkout.dia_semana);
    document.getElementById('workout-name').textContent = `Treino ${tipoTreino}`;
    
    mostrarTela('workout-screen');
    await mostrarExercicioAtual();
}

async function mostrarExercicioAtual() {
    const exercicio = AppState.currentExercises[AppState.currentExerciseIndex];
    
    if (!exercicio) {
        mostrarTreinoConcluido();
        return;
    }
    
    // Buscar pesos sugeridos para este exercício
    let protocoloId = exercicio.protocolo_treino_id;
    if (!protocoloId && AppState.currentProtocol && AppState.currentProtocol.protocolo_treinamento_id) {
        protocoloId = AppState.currentProtocol.protocolo_treinamento_id;
    }
    if (!protocoloId) {
        console.warn('protocolo_treino_id indefinido ao buscar pesos sugeridos');
    }
    const { data: pesosSugeridos, error } = await supabase
        .from('v_pesos_usuario')
        .select('*')
        .eq('usuario_id', AppState.currentUser.id)
        .eq('protocolo_treino_id', protocoloId)
        .maybeSingle();
        
    // Atualizar progresso
    const progress = (AppState.currentExerciseIndex / AppState.currentExercises.length) * 100;
    document.getElementById('workout-progress').style.width = `${progress}%`;
    document.getElementById('exercise-counter').textContent = 
        `Exercício ${AppState.currentExerciseIndex + 1} de ${AppState.currentExercises.length}`;
        
    // Mostrar container do exercício
    document.getElementById('exercise-container').classList.remove('hidden');
    document.getElementById('timer-container').classList.add('hidden');
    document.getElementById('workout-completed').classList.add('hidden');
        
    // Atualizar informações do exercício
    document.getElementById('exercise-name').textContent = exercicio.exercicio_nome;
    document.getElementById('exercise-group').textContent = exercicio.grupo_muscular || 'Grupo não especificado';
    document.getElementById('exercise-equipment').textContent = exercicio.exercicio_equipamento || 'Equipamento não especificado';
        
    // Observações com pesos sugeridos
    let observacoes = exercicio.observacoes || '';
    if (pesosSugeridos) {
        observacoes += `\n\n💪 Pesos Sugeridos:\n`;
        observacoes += `• Base: ${pesosSugeridos.peso_base}kg\n`;
        observacoes += `• Mínimo: ${pesosSugeridos.peso_minimo}kg\n`;
        observacoes += `• Máximo: ${pesosSugeridos.peso_maximo}kg\n`;
        observacoes += `• Alvo: ${pesosSugeridos.repeticoes_alvo} reps`;
    }
        
    if (observacoes) {
        document.getElementById('exercise-notes').textContent = observacoes;
        document.getElementById('exercise-notes').style.display = 'block';
        document.getElementById('exercise-notes').style.whiteSpace = 'pre-line';
    } else {
        document.getElementById('exercise-notes').style.display = 'none';
    }
        
    // Informações de intensidade e descanso
    const intensityMin = exercicio.percentual_1rm_min || 70;
    const intensityMax = exercicio.percentual_1rm_max || 80;
    document.getElementById('intensity-info').textContent = `${intensityMin}-${intensityMax}%`;
    document.getElementById('rest-info').textContent = `${exercicio.tempo_descanso}s`;
        
    // Buscar 1RM
    fetch1RMUsuario(AppState.currentUser.id, exercicio.exercicio_id).then(rm => {
        if (rm) {
            document.getElementById('rm-info').textContent = `${rm}kg`;
        } else {
            document.getElementById('rm-info').textContent = '--';
        }
    });
        
    // Renderizar séries com peso sugerido como valor inicial
    renderizarSeries(exercicio, pesosSugeridos);
}

function renderizarSeries(exercicio, pesosSugeridos) {
    const container = document.getElementById('series-container');
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
        
    // Sugestão de peso para a série
    for (let i = 0; i < exercicio.series; i++) {
        let sugestaoPeso = '';
        if (pesosSugeridos && pesosSugeridos[`serie_${i+1}`]) {
            sugestaoPeso = `<span class='peso-sugerido' style='color:var(--accent-green); font-size:0.95em; margin-left:8px;'>Sugestão: ${pesosSugeridos[`serie_${i+1}`]} kg</span>`;
        }
        const serieItem = document.getElementById(`serie-${i}`);
        serieItem.innerHTML += `
            <div class="serie-header">
                <span>Série ${i + 1}</span>
                ${sugestaoPeso}
            </div>
        `;
    }
}

function ajustarValor(inputId, delta) {
    const input = document.getElementById(inputId);
    const currentValue = parseFloat(input.value) || 0;
    const newValue = Math.max(0, currentValue + delta);
    input.value = newValue;
        
    // Validar série
    const serieIndex = parseInt(inputId.split('-')[1]);
    validarSerie(serieIndex);
}

function validarSerie(index) {
    const pesoInput = document.getElementById(`peso-${index}`);
    const repsInput = document.getElementById(`rep-${index}`);
    const checkBtn = document.getElementById(`check-${index}`);
    if (!pesoInput || !repsInput || !checkBtn) return;
    const peso = pesoInput.value;
    const reps = repsInput.value;
    if (peso && reps && parseFloat(peso) > 0 && parseInt(reps) > 0) {
        checkBtn.disabled = false;
    } else {
        checkBtn.disabled = true;
    }
}

async function confirmarSerie(serieIndex) {
    // Salvar dados da série
    salvarExecucaoExercicio(serieIndex).then(success => {
        if (!success) return;
            
        const serieItem = document.getElementById(`serie-${serieIndex}`);
        serieItem.classList.add('completed');
            
        // Desabilitar inputs
        document.getElementById(`peso-${serieIndex}`).disabled = true;
        document.getElementById(`rep-${serieIndex}`).disabled = true;
            
        // Trocar botão para check
        const confirmBtn = serieItem.querySelector('.btn-confirm-series');
        confirmBtn.innerHTML = '<div class="series-check">✓</div>';
        confirmBtn.disabled = true;
            
        AppState.completedSeries++;
            
        // Se completou todas as séries, iniciar descanso automaticamente
        const totalSeries = AppState.currentExercises[AppState.currentExerciseIndex].series;
        if (AppState.completedSeries === totalSeries) {
            // Se for o último exercício, mostrar tela de conclusão
            if (AppState.currentExerciseIndex === AppState.currentExercises.length - 1) {
                setTimeout(() => {
                    mostrarTreinoConcluido();
                }, 500);
            } else {
                // Senão, iniciar descanso automaticamente
                setTimeout(() => {
                    iniciarDescanso();
                }, 500);
            }
        }
    });
}

// Iniciar descanso
function iniciarDescanso() {
    const exercicio = AppState.currentExercises[AppState.currentExerciseIndex];
    const tempoDescanso = exercicio.tempo_descanso || 60;
        
    // Ocultar container do exercício
    document.getElementById('exercise-container').classList.add('hidden');
    document.getElementById('timer-modal').style.display = 'flex';
        
    // Configurar timer
    AppState.restTime = tempoDescanso;
    AppState.restInterval = setInterval(atualizarTimer, 1000);
    atualizarTimer();
}

// Atualizar display do timer
function atualizarTimer() {
    if (AppState.restTime <= 0) {
        clearInterval(AppState.restInterval);
        document.getElementById('timer-modal').style.display = 'none';
        proximoExercicio();
        return;
    }
    
    const minutos = Math.floor(AppState.restTime / 60);
    const segundos = AppState.restTime % 60;
    const tempoFormatado = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
    
    // Atualizar texto do timer no modal
    document.getElementById('modal-timer-text').textContent = tempoFormatado;
    
    // Atualizar barra de progresso
    const exercicio = AppState.currentExercises[AppState.currentExerciseIndex];
    const tempoTotal = exercicio.tempo_descanso || 60;
    const progresso = ((tempoTotal - AppState.restTime) / tempoTotal) * 100;
    document.getElementById('modal-timer-progress').style.width = `${progresso}%`;
    
    AppState.restTime--;
}

// Pular descanso
function pularDescanso() {
    document.getElementById('timer-modal').style.display = 'none';
    clearInterval(AppState.restInterval);
    proximoExercicio();
}

// Próximo exercício
function proximoExercicio() {
    AppState.currentExerciseIndex++;
    AppState.completedSeries = 0;
    
    if (AppState.timerInterval) {
        clearInterval(AppState.timerInterval);
    }
    
    mostrarExercicioAtual();
}

// Mostrar treino concluído
function mostrarTreinoConcluido() {
    document.getElementById('exercise-container').classList.add('hidden');
    document.getElementById('timer-container').classList.add('hidden');
    
    // Preparar resumo do treino
    const tempoTotal = Math.floor((Date.now() - AppState.workoutStartTime) / 1000);
    const minutos = Math.floor(tempoTotal / 60);
    const segundos = tempoTotal % 60;
    
    const resumoContent = `
        <div class="summary-item">
            <span>Tempo Total:</span>
            <strong>${minutos}m ${segundos}s</strong>
        </div>
        <div class="summary-item">
            <span>Exercícios Completados:</span>
            <strong>${AppState.currentExercises.length}</strong>
        </div>
        <div class="summary-item">
            <span>Treino:</span>
            <strong>${AppState.currentWorkout.nome}</strong>
        </div>
    `;
    
    document.getElementById('workout-summary-content').innerHTML = resumoContent;
    
    // Mostrar modal de fim de treino
    document.getElementById('workout-complete-modal').style.display = 'flex';
    
    // Atualizar progress bar para 100%
    document.getElementById('workout-progress').style.width = '100%';
}

// Finalizar treino completo
async function finalizarTreinoCompleto() {
    try {
        // Fechar modal
        document.getElementById('workout-complete-modal').style.display = 'none';
        
        // Salvar treino no banco
        await finalizarTreino();
    } catch (error) {
        console.error('Erro ao finalizar treino:', error);
        showNotification('Erro ao salvar treino', 'error');
    }
}

// Finalizar treino
async function finalizarTreino() {
    try {
        // Buscar todos os exercícios do treino atual
        const exercicios = AppState.currentExercises;
        let todasSeriesRegistradas = true;

        for (const exercicio of exercicios) {
            // Buscar execuções para cada exercício
            const { data: execs, error } = await supabase
                .from('execucao_exercicio_usuario')
                .select('id')
                .eq('usuario_id', AppState.currentUser.id)
                .eq('protocolo_treino_id', AppState.currentWorkout.protocolo_treino_id)
                .eq('exercicio_id', exercicio.exercicio_id);
            if (error) throw error;
            const esperado = exercicio.series || 1;
            if (!execs || execs.length < esperado) {
                todasSeriesRegistradas = false;
                break;
            }
        }

        if (!todasSeriesRegistradas) {
            showNotification('Finalize todas as séries de todos os exercícios antes de concluir o treino!', 'error');
            return;
        }

        // Marcar treino como concluído
        const { error } = await supabase
            .from('treinos_concluidos')
            .insert({
                usuario_id: AppState.currentUser.id,
                protocolo_treino_id: AppState.currentWorkout.protocolo_treino_id,
                data_conclusao: new Date()
            });
        if (error) throw error;
        showNotification('Treino finalizado com sucesso!', 'success');
        voltarParaHome();
        carregarDashboard(); // Recarregar dashboard para atualizar métricas
    } catch (error) {
        console.error('Erro ao finalizar treino:', error);
        showNotification('Erro ao finalizar treino', 'error');
    }
}

// ==================== FUNÇÕES DE MODAL ====================

function mostrarModalPlanejamento() {
    console.log('[mostrarModalPlanejamento] Função iniciada');
    
    // Verificar telas ativas
    const telasAtivas = document.querySelectorAll('.screen.active');
    console.log('[mostrarModalPlanejamento] Telas ativas:', telasAtivas);
    
    // Exibe o modal de planejamento semanal simples
    const modal = document.getElementById('modal-planejamento');
    console.log('[mostrarModalPlanejamento] Modal encontrado:', modal);
    if (modal) {
        modal.style.display = 'flex'; // Mudado de 'block' para 'flex'
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.zIndex = '999999';
        modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        console.log('[mostrarModalPlanejamento] Modal display definido como flex com z-index alto');
        
        // Garantir que o conteúdo do modal também esteja visível
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.style.position = 'relative';
            modalContent.style.zIndex = '1000000';
            console.log('[mostrarModalPlanejamento] Modal content z-index definido');
        }
    } else {
        console.error('[mostrarModalPlanejamento] Modal não encontrado no DOM!');
    }
    // Adiciona listener para fechar e salvar
    const form = document.getElementById('form-planejamento');
    console.log('[mostrarModalPlanejamento] Form encontrado:', form);
    
    // Configura eventos onchange em todos os selects
    const selects = form.querySelectorAll('.dia-select');
    selects.forEach(select => {
        select.addEventListener('change', validarPlanejamento);
    });
    console.log('[mostrarModalPlanejamento] Eventos de change adicionados aos selects');
    
    // Inicializa a validação
    validarPlanejamento();
    
    if (form && !form.dataset.listener) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('[mostrarModalPlanejamento] Form submetido');
            // Monta o plano
            const data = new FormData(form);
            const plano = {};
            for (let [dia, valor] of data.entries()) {
                plano[dia] = valor;
            }
            console.log('[mostrarModalPlanejamento] Plano montado:', plano);
            // Salva no AppState e fecha o modal
            AppState.weekPlan = plano;
            if (modal) modal.style.display = 'none';
            showNotification('Planejamento semanal salvo!', 'success');
            // Após salvar, carrega o dashboard e mostra a tela principal
            carregarDashboard();
            mostrarTela('home-screen');
        });
        form.dataset.listener = 'true';
    }
}

// Validação em tempo real do planejamento
function validarPlanejamento() {
    console.log('Validando planejamento...');
    const selects = document.querySelectorAll('.dia-select');
    const plano = {};
    const treinos = { A: 0, B: 0, C: 0, D: 0 };
    let cardioFolga = 0;
    let hasValues = false;
    
    selects.forEach((select, index) => {
        const dayPlan = select.closest('.dia-card');
        const valor = select.value;
        
        // Resetar estilo
        if (dayPlan) dayPlan.classList.remove('error');
        
        if (valor) {
            hasValues = true;
            plano[index] = valor;
            
            if (valor === 'folga' || valor === 'cardio') {
                cardioFolga++;
            } else if (valor in treinos) {
                treinos[valor]++;
            }
        }
    });
    
    const validation = document.getElementById('plan-validation');
    let isValid = true;
    let messages = [];
    
    // Só validar se houver algum valor selecionado
    if (!hasValues) {
        validation.className = 'plan-validation';
        validation.innerHTML = '';
        document.getElementById('confirm-plan-btn').disabled = true;
        return;
    }
    
    // Verificar se todos os dias foram preenchidos
    let diasVazios = 0;
    selects.forEach((select) => {
        if (!select.value) {
            diasVazios++;
        }
    });
    
    if (diasVazios > 0) {
        messages.push(`❌ ${diasVazios} dia(s) sem planejamento`);
        isValid = false;
    }
    
    // Verificar se cada treino aparece exatamente uma vez
    for (const [treino, count] of Object.entries(treinos)) {
        if (count === 0 && diasVazios === 0) {
            messages.push(`❌ Treino ${treino} não foi incluído`);
            isValid = false;
        } else if (count > 1) {
            messages.push(`❌ Treino ${treino} aparece ${count} vezes (deve aparecer apenas 1)`);
            isValid = false;
            // Marcar dias duplicados como erro
            selects.forEach((select, index) => {
                if (select.value === treino) {
                    const dayPlan = select.closest('.dia-card');
                    if (dayPlan) dayPlan.classList.add('error');
                }
            });
        }
    }
    
    // Verificar se há 3 dias de cardio/folga
    if (diasVazios === 0) {
        if (cardioFolga < 3) {
            messages.push(`❌ Apenas ${cardioFolga} dias de cardio/folga (precisa de 3)`);
            isValid = false;
        } else if (cardioFolga > 3) {
            messages.push(`❌ ${cardioFolga} dias de cardio/folga (máximo 3)`);
            isValid = false;
        }
    }
    
    validation.classList.add('show');
    if (isValid && diasVazios === 0) {
        validation.className = 'plan-validation show success';
        validation.innerHTML = '✅ Planejamento válido! Pronto para confirmar.';
        const submitBtn = document.querySelector('#form-planejamento .btn-primary');
        if (submitBtn) submitBtn.disabled = false;
    } else {
        validation.className = 'plan-validation show error';
        validation.innerHTML = messages.join('<br>');
        const submitBtn = document.querySelector('#form-planejamento .btn-primary');
        if (submitBtn) submitBtn.disabled = true;
    }
}

// ==================== INICIALIZAÇÃO ====================

document.addEventListener('DOMContentLoaded', async function() {
    // Adicionar animações CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideUp {
            from {
                transform: translate(-50%, 100%);
                opacity: 0;
            }
            to {
                transform: translate(-50%, 0);
                opacity: 1;
            }
        }
        
        @keyframes slideDown {
            from {
                transform: translate(-50%, 0);
                opacity: 1;
            }
            to {
                transform: translate(-50%, 100%);
                opacity: 0;
            }
        }
        
        .muscle-group-item {
            margin-bottom: 12px;
        }
        
        .muscle-group-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
            font-size: 0.875rem;
        }
        
        .evolution-item {
            margin-bottom: 16px;
            padding: 12px;
            background: var(--bg-primary);
            border-radius: var(--radius-sm);
        }
        
        .evolution-stats {
            display: flex;
            justify-content: space-between;
            margin-top: 8px;
            font-size: 0.875rem;
        }
    `;
    document.head.appendChild(style);
    
    // Event listener para botão de iniciar treino
    document.getElementById('start-workout-btn').addEventListener('click', iniciarTreino);
    
    // Carregar usuários
    const usuarios = await fetchUsuarios();
    renderUsuarios(usuarios);
});