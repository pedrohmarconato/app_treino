// app.js - Aplicação de Treinamento com Design Moderno
console.log('[app.js] JS carregado com sucesso!');

// Este arquivo agora é um módulo ES6. Todos os imports/exports devem ser relativos e explícitos.


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
export const supabase = window.supabase.createClient(
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

    restTime: 0,
    pesosSugeridos: {},
    isResting: false
};

// ==================== FUNÇÕES DE BANCO DE DADOS ====================
// Funções de consulta agora centralizadas em services/protocolService.js
import * as ProtocolService from './services/protocolService.js';
import * as UserService from './services/userService.js';

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

// fetch1RMUsuario foi movido para userService.js

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

// fetchMetricasUsuario foi movido para userService.js

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
    if (!userId) {
        console.error('saveWeekPlan: userId é obrigatório');
        return false;
    }
    
    const key = `weekPlan_${userId}_${getWeekKey()}`;
    try {
        localStorage.setItem(key, JSON.stringify(plan));
        AppState.weekPlan = plan;
        console.log(`Plano semanal salvo para usuário ${userId}:`, plan);
        return true;
    } catch (error) {
        console.error('Erro ao salvar plano semanal:', error);
        return false;
    }
}

function getWeekPlan(userId) {
    if (!userId) {
        console.error('getWeekPlan: userId é obrigatório');
        return null;
    }
    
    const key = `weekPlan_${userId}_${getWeekKey()}`;
    try {
        const plan = localStorage.getItem(key);
        return plan ? JSON.parse(plan) : null;
    } catch (error) {
        console.error('Erro ao recuperar plano semanal:', error);
        return null;
    }
}

function clearWeekPlan(userId) {
    if (!userId) {
        console.error('clearWeekPlan: userId é obrigatório');
        return false;
    }
    
    const key = `weekPlan_${userId}_${getWeekKey()}`;
    try {
        localStorage.removeItem(key);
        if (AppState.currentUser && AppState.currentUser.id === userId) {
            AppState.weekPlan = null;
        }
        console.log(`Plano semanal removido para usuário ${userId}`);
        return true;
    } catch (error) {
        console.error('Erro ao remover plano semanal:', error);
        return false;
    }
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
    // Aguardar o DOM estar pronto
    setTimeout(() => {
        const container = document.getElementById('users-grid');
        if (!container) {
            console.error('Container users-grid não encontrado');
            return;
        }
        
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
    }, 100);
}

async function selecionarUsuario(usuario) {
    console.log('[selecionarUsuario] Iniciando seleção para usuário:', usuario);
    showLoading();
    try {
        AppState.currentUser = usuario;
        
        // Atualizar UI
        const userNameEl = document.getElementById('user-name');
if (userNameEl) {
    userNameEl.textContent = usuario.nome;
}
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
            return;
        }
        
        AppState.currentProtocol = protocolo;
        
        // Verificar planejamento semanal
        if (needsWeekPlanning(usuario.id)) {
            console.log('[selecionarUsuario] Usuário precisa de planejamento semanal.');
            mostrarModalPlanejamento();
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
    
    // Renderizar ordem customizada da semana
    renderCustomWeekList();
    
    // Buscar métricas
    const metricas = await UserService.fetchMetricasUsuario(AppState.currentUser.id);
    
    // Atualizar cards de métricas
    document.getElementById('completed-workouts').textContent = metricas.treinosConcluidos;
    document.getElementById('current-week').textContent = metricas.semanaAtual;
    document.getElementById('progress-percentage').textContent = `${metricas.progresso}%`;
    
    // Atualizar progress ring
    const progressRing = document.querySelector('.progress-ring-progress');
    if (progressRing) {
        const circumference = 2 * Math.PI * 40;
        const offset = circumference - (metricas.progresso / 100) * circumference;
        progressRing.style.strokeDashoffset = offset;
    }
    const progressPercentage = document.querySelector('.progress-percentage');
    if (progressPercentage) {
        progressPercentage.textContent = `${metricas.progresso}%`;
    }
    
    // Atualizar informação do protocolo
    if (AppState.currentProtocol) {
        const userProtocol = document.getElementById('user-protocol');
        if (userProtocol) {
            const semanaAtual = AppState.currentProtocol.semana_atual || 1;
            const nomeProt = AppState.currentProtocol.nome_protocolo || 'Protocolo não definido';
            userProtocol.textContent = `${nomeProt} - Semana ${semanaAtual}`;
        }
    }
    
    // Buscar próximo treino
    const proximoTreino = await fetchProximoTreino(
        AppState.currentUser.id, 
        AppState.currentProtocol.protocolo_treinamento_id
    );
    
    if (proximoTreino) {
        AppState.currentWorkout = proximoTreino;
        const tipoTreino = obterTipoTreino(proximoTreino.dia_semana);
        const nextWorkoutName = document.getElementById('next-workout-name');
        if (nextWorkoutName) {
            nextWorkoutName.textContent = `Treino ${tipoTreino}`;
        }
        
        // Buscar exercícios do treino
        const exercicios = await ProtocolService.fetchExerciciosTreino(
            proximoTreino.numero_treino,
            AppState.currentProtocol.protocolo_treinamento_id
        );
        
        AppState.currentExercises = exercicios;
        
        // Atualizar contador de exercícios
        const workoutExercises = document.getElementById('workout-exercises');
        if (workoutExercises) {
            workoutExercises.textContent = `${exercicios.length} exercícios`;
        }
    }
    
    // Carregar dados dos indicadores (ranking, estatísticas, etc)
    const dadosIndicadores = await ProtocolService.fetchDadosIndicadores();
    if (dadosIndicadores.comparacao && dadosIndicadores.comparacao.length > 0) {
        // Renderizar ranking competitivo na seção de métricas
        renderizarMetricasCompetitivas();
    }
    
    // Configurar event listener para botão de iniciar treino
    const startBtn = document.getElementById('start-workout-btn');
    if (startBtn) {
        startBtn.onclick = iniciarTreino;
    }
}

// Função para renderizar a lista customizada da semana
function renderCustomWeekList() {
    const ul = document.getElementById('custom-week-list');
    if (!ul) return;
    
    const semana = getSemanaOrdem();
    ul.innerHTML = '';
    
    semana.forEach(item => {
        const li = document.createElement('li');
        li.className = 'custom-week-item';
        li.innerHTML = `
            <strong>${item.dia}:</strong> 
            <span>${item.tipo}${item.tipo === 'Treino' && item.grupo ? ' (' + item.grupo + ')' : ''}</span>
        `;
        ul.appendChild(li);
    });
}

// ==================== DASHBOARD ====================
// (continuação da função carregarDashboard)

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
        const exercicios = await ProtocolService.fetchExerciciosTreino(
            proximoTreino.numero_treino,
            AppState.currentProtocol.protocolo_treinamento_id
        );
        
        AppState.currentExercises = exercicios;
    }
    
    // Carregar dados dos indicadores (ranking, estatísticas, etc)
    const dadosIndicadores = await ProtocolService.fetchDadosIndicadores();
    if (dadosIndicadores.comparacao && dadosIndicadores.comparacao.length > 0) {
        // Renderizar ranking competitivo na seção de métricas
        renderizarMetricasCompetitivas();
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
    // Se estiver usando o novo sistema de templates
    if (window.renderTemplate) {
        switch(telaId) {
            case 'login-screen':
                window.renderTemplate('login');
                // Re-renderiza os usuários após carregar o template
                setTimeout(() => {
                   // Inicializar AppState.users
AppState.users = [];

// Tornar funções globais para uso nos templates
window.mostrarModalPlanejamento = mostrarModalPlanejamento;
window.fecharModalPlanejamento = fecharModalPlanejamento;
window.salvarPlanejamentoSemanal = salvarPlanejamentoSemanal;
window.validarPlanejamento = validarPlanejamento;
window.logout = logout;
window.iniciarTreino = iniciarTreino;
.length > 0) {
                        renderUsuarios(AppState.users);
                    }
                }, 200);
                break;
            case 'home-screen':
                window.renderTemplate('home');
                // Re-inicializa os elementos do dashboard
                setTimeout(() => {
                    if (AppState.currentUser) {
                        const userNameEl = document.getElementById('user-name');
                        if (userNameEl) {
                            userNameEl.textContent = AppState.currentUser.nome;
                        }
                        const userImages = {
                            'Pedro': 'pedro.png',
                            'Japa': 'japa.png'
                        };
                        const avatarEl = document.getElementById('user-avatar');
                        if (avatarEl) {
                            avatarEl.src = userImages[AppState.currentUser.nome] || 'pedro.png';
                        }
                    }
                    carregarDashboard();
                }, 200);
                break;
            case 'workout-screen':
                window.renderTemplate('workout');
                break;
        }
    } else {
        // Fallback para o sistema antigo
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        const screen = document.getElementById(telaId);
        if (screen) {
            screen.classList.add('active');
        }
    }
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

function renderizarMetricasCompetitivas() {
    ProtocolService.carregarRankingCompetitivo();
    ProtocolService.carregarEstatisticasUsuarios();

    if (AppState.currentUser && AppState.currentUser.nome) {
        ProtocolService.carregarResumoGrupoMuscular(AppState.currentUser.nome);
    } else {
        console.warn("Nome do usuário atual não disponível para carregar resumo muscular.");
    }
}

// Ranking de força entre Pedro e Japa por exercício
async function carregarRankingCompetitivo() {
    const { error } = await ProtocolService.carregarRankingCompetitivo();
    if (error) {
        showNotification('Erro ao carregar ranking competitivo', 'error');
        return;
    }
}

// Estatísticas gerais dos usuários
async function carregarEstatisticasUsuarios() {
    const { error } = await ProtocolService.carregarEstatisticasUsuarios();
    if (error) {
        showNotification('Erro ao carregar estatísticas dos usuários', 'error');
        return;
    }
}

// Resumo de desempenho por grupo muscular
async function carregarResumoGrupoMuscular(nomeUsuario) {
    const { error } = await ProtocolService.carregarResumoGrupoMuscular(nomeUsuario);
    if (error) {
        showNotification('Erro ao carregar resumo por grupo muscular', 'error');
        return;
    }
}

// ==================== FUNÇÕES DE PESOS SUGERIDOS NO TREINO ====================

// Carregar pesos sugeridos para o treino do usuário
async function carregarPesosSugeridos(usuarioId, protocoloTreinoId) {
    const { error } = await ProtocolService.carregarPesosSugeridos(usuarioId, protocoloTreinoId);
    if (error) {
        showNotification('Erro ao carregar pesos sugeridos', 'error');
        return;
    }
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

// Voltar para home
function voltarParaHome() {
    mostrarTela('home-screen');
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
    AppState.workoutStartTime = Date.now();
    
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
    const { data: pesosSugeridos } = await ProtocolService.carregarPesosSugeridos(AppState.currentUser.id, protocoloId);
        
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
    UserService.fetch1RMUsuario(AppState.currentUser.id, exercicio.exercicio_id).then(rm => {
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
    const exercicio = AppState.currentExercises[AppState.currentExerciseIndex];
    const peso = parseFloat(document.getElementById(`peso-${serieIndex}`).value);
    const reps = parseInt(document.getElementById(`rep-${serieIndex}`).value);
    
    if (!peso || !reps) {
        showNotification('Preencha peso e repetições', 'error');
        return;
    }
    
    const dados = {
        usuario_id: AppState.currentUser.id,
        protocolo_treino_id: AppState.currentWorkout.id,
        exercicio_id: exercicio.exercicio_id,
        serie_numero: serieIndex + 1,
        peso_utilizado: peso,
        repeticoes_realizadas: reps,
        data_execucao: new Date().toISOString()
    };
    
    const success = await ProtocolService.salvarExecucaoExercicio(dados);
    
    if (!success) {
        showNotification('Erro ao salvar série', 'error');
        return;
    }
        
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
            <strong>${AppState.currentWorkout.nome || 'Treino'}</strong>
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
        await ProtocolService.finalizarTreino();
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
            const { data: execs, error } = await ProtocolService.fetchExecucoesExercicio(
                AppState.currentUser.id,
                AppState.currentWorkout.id,
                exercicio.exercicio_id
            );
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
        const { error } = await ProtocolService.marcarTreinoConcluido(
            AppState.currentUser.id,
            AppState.currentWorkout.id
        );
        if (error) throw error;
        showNotification('Treino finalizado com sucesso!', 'success');
        voltarParaHome();
        carregarDashboard(); // Recarregar dashboard para atualizar métricas
    } catch (error) {
        console.error('Erro ao finalizar treino:', error);
        showNotification('Erro ao finalizar treino', 'error');
    }
}

// ==================== FUNÇÕES UTILITÁRIAS ====================




// ==================== FUNÇÕES DE MODAL ====================

// Buscar grupos musculares dos treinos
async function fetchGruposMuscularesTreinos() {
    try {
        console.log('Buscando grupos musculares dos exercícios...');
        
        // Buscar grupos musculares únicos da tabela exercicios
        const { data, error } = await ProtocolService.fetchGruposMuscularesTreinos();
        if (error) {
            console.error('Erro ao buscar grupos musculares:', error);
            return {
                1: 'Peito/Tríceps',
                2: 'Costas/Bíceps', 
                3: 'Pernas',
                4: 'Ombros/Abdômen'
            };
        }
        
        // Extrair grupos únicos
        const gruposUnicos = [...new Set(data.map(item => item.grupo_muscular))].filter(Boolean);
        console.log('Grupos musculares encontrados:', gruposUnicos);
        
        // Mapear grupos para treinos baseado em palavras-chave
        const resultado = {
            1: gruposUnicos.find(g => g.toLowerCase().includes('peito')) || 'Peito/Tríceps',
            2: gruposUnicos.find(g => g.toLowerCase().includes('costas')) || 'Costas/Bíceps', 
            3: gruposUnicos.find(g => g.toLowerCase().includes('pernas')) || 'Pernas',
            4: gruposUnicos.find(g => g.toLowerCase().includes('ombros')) || 'Ombros/Abdômen'
        };
        
        return resultado;
    } catch (error) {
        console.error('Erro ao buscar grupos musculares:', error);
        return {
            1: 'Peito/Tríceps',
            2: 'Costas/Bíceps', 
            3: 'Pernas',
            4: 'Ombros/Abdômen'
        };
    }
}

async function mostrarModalPlanejamento() {
    console.log('[mostrarModalPlanejamento] Função iniciada');
    
    // Exibe o modal de planejamento semanal
    const modal = document.getElementById('modal-planejamento');
    console.log('[mostrarModalPlanejamento] Modal encontrado:', modal);
    
    if (modal) {
        modal.style.display = 'flex';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.zIndex = '999999';
        modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        console.log('[mostrarModalPlanejamento] Modal exibido');
        
        // Garantir que o conteúdo do modal também esteja visível
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.style.position = 'relative';
            modalContent.style.zIndex = '1000000';
        }
    } else {
        console.error('[mostrarModalPlanejamento] Modal não encontrado no DOM!');
        return;
    }

    // Buscar grupos musculares do banco de dados
    const gruposMusculares = await fetchGruposMuscularesTreinos();
    
    // Atualizar os selects com os grupos musculares corretos
    const selects = modal.querySelectorAll('.dia-select');
    selects.forEach(select => {
        // Atualizar as opções de treino com os grupos musculares do banco
        const optionA = select.querySelector('option[value="A"]');
        const optionB = select.querySelector('option[value="B"]');
        const optionC = select.querySelector('option[value="C"]');
        const optionD = select.querySelector('option[value="D"]');
        
        if (optionA) optionA.textContent = `💪 Treino A - ${gruposMusculares[1] || 'Peito/Tríceps'}`;
        if (optionB) optionB.textContent = `🔙 Treino B - ${gruposMusculares[2] || 'Costas/Bíceps'}`;
        if (optionC) optionC.textContent = `🦵 Treino C - ${gruposMusculares[3] || 'Pernas'}`;
        if (optionD) optionD.textContent = `🎯 Treino D - ${gruposMusculares[4] || 'Ombros/Abdômen'}`;
    });

    // Carregar planejamento existente se houver
    carregarPlanejamentoExistente();
    
    // Configurar eventos nos selects com animações
    configurarListenersSelects();
    
    // Inicializar validação
    validarPlanejamento();
    
    // Configurar evento de submit do form
    const form = document.getElementById('form-planejamento');
    if (form && !form.dataset.listenerAdded) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            salvarPlanejamentoSemanal();
        });
        form.dataset.listenerAdded = 'true';
    }
}

// Carregar planejamento existente do usuário
function carregarPlanejamentoExistente() {
    if (!AppState.currentUser) return;
    
    const planoExistente = loadWeekPlan(AppState.currentUser.id);
    if (!planoExistente) return;
    
    console.log('[carregarPlanejamentoExistente] Plano encontrado:', planoExistente);
    
    // Preencher os selects com o plano existente
    const form = document.getElementById('form-planejamento');
    const selects = form.querySelectorAll('.dia-select');
    
    selects.forEach((select, index) => {
        if (planoExistente[index]) {
            select.value = planoExistente[index];
        }
    });
    
    // Validar o planejamento carregado
    validarPlanejamento();
}

function configurarListenersSelects() {
    const form = document.getElementById('form-planejamento');
    const selects = form.querySelectorAll('.dia-select');
    
    // Remover listeners antigos para evitar duplicação
    selects.forEach(select => {
        const newSelect = select.cloneNode(true);
        select.parentNode.replaceChild(newSelect, select);
    });
    
    // Adicionar novos listeners com animações
    const newSelects = form.querySelectorAll('.dia-select');
    newSelects.forEach(select => {
        select.addEventListener('change', function() {
            // Adicionar animação de mudança
            this.classList.add('changed');
            setTimeout(() => {
                this.classList.remove('changed');
            }, 400);
            
            // Adicionar feedback visual imediato
            const dayCard = this.closest('.dia-card');
            if (this.value) {
                dayCard.style.borderColor = '#10b981';
                setTimeout(() => {
                    dayCard.style.borderColor = '';
                }, 300);
            }
            
            // Validar planejamento
            validarPlanejamento();
        });
        
        // Adicionar efeito visual quando o select ganha foco
        select.addEventListener('focus', function() {
            this.closest('.dia-card').style.transform = 'translateY(-3px)';
        });
        
        select.addEventListener('blur', function() {
            this.closest('.dia-card').style.transform = 'translateY(0)';
        });
    });
}

function salvarPlanejamento() {
    salvarPlanejamentoSemanal();
}

function fecharModalPlanejamento() {
    const modal = document.getElementById('modal-planejamento');
    if (modal) {
        modal.style.display = 'none';
    }
}

function salvarPlanejamentoSemanal() {
    if (!AppState.currentUser) {
        showNotification('Erro: usuário não selecionado', 'error');
        return;
    }

    const form = document.getElementById('form-planejamento');
    const formData = new FormData(form);
    const plano = {};
    
    // Montar o plano a partir do formulário
    for (let [dia, valor] of formData.entries()) {
        plano[dia] = valor;
    }
    
    console.log('[salvarPlanejamentoSemanal] Plano montado:', plano);
    
    // Validar se todos os dias foram preenchidos
    const diasCompletos = Object.keys(plano).length === 7;
    if (!diasCompletos) {
        showNotification('Por favor, complete o planejamento para todos os dias da semana', 'error');
        return;
    }
    
    // Salvar o plano
    saveWeekPlan(AppState.currentUser.id, plano);
    AppState.weekPlan = plano;
    
    // Fechar modal
    const modal = document.getElementById('modal-planejamento');
    if (modal) modal.style.display = 'none';
    
    showNotification('Planejamento semanal salvo com sucesso!', 'success');
    
    // Carregar dashboard e mostrar tela principal
    carregarDashboard().then(() => {
        mostrarTela('home-screen');
    });
}

// Validação em tempo real do planejamento
function validarPlanejamento() {
    console.log('Validando planejamento...');
    const selects = document.querySelectorAll('.dia-select');
    const plano = {};
    const treinos = { A: [], B: [], C: [], D: [] };
    let cardioFolga = 0;
    let hasValues = false;
    const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    
    // Resetar todos os estilos de erro
    selects.forEach((select) => {
        const dayPlan = select.closest('.dia-card');
        if (dayPlan) dayPlan.classList.remove('error');
    });
    
    // Coletar valores dos selects
    selects.forEach((select, index) => {
        const valor = select.value;
        
        if (valor) {
            hasValues = true;
            plano[index] = valor;
            
            if (valor === 'folga' || valor === 'cardio') {
                cardioFolga++;
            } else if (valor in treinos) {
                treinos[valor].push(diasSemana[index]);
            }
        }
    });
    
    const validation = document.getElementById('plan-validation');
    const submitBtn = document.getElementById('confirm-plan-btn');
    let isValid = true;
    let messages = [];
    
    // Se não há valores, limpar validação
    if (!hasValues) {
        validation.className = 'plan-validation';
        validation.innerHTML = '';
        if (submitBtn) submitBtn.disabled = true;
        return;
    }
    
    // Verificar se todos os dias foram preenchidos
    let diasVazios = [];
    selects.forEach((select, index) => {
        if (!select.value) {
            diasVazios.push(diasSemana[index]);
            const dayPlan = select.closest('.dia-card');
            if (dayPlan) dayPlan.classList.add('error');
        }
    });
    
    if (diasVazios.length > 0) {
        messages.push(`❌ Preencha os dias: ${diasVazios.join(', ')}`);
        isValid = false;
    }
    
    // Verificar treinos duplicados com detalhes
    for (const [treino, dias] of Object.entries(treinos)) {
        if (dias.length > 1) {
            messages.push(`❌ Treino ${treino} repetido em: ${dias.join(', ')}`);
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
    
    // Verificar se todos os treinos estão incluídos (apenas quando não há dias vazios)
    if (diasVazios.length === 0) {
        const treinosFaltantes = [];
        for (const [treino, dias] of Object.entries(treinos)) {
            if (dias.length === 0) {
                treinosFaltantes.push(treino);
            }
        }
        
        if (treinosFaltantes.length > 0) {
            messages.push(`❌ Faltam os treinos: ${treinosFaltantes.join(', ')}`);
            isValid = false;
        }
        
        // Verificar quantidade de cardio/folga
        if (cardioFolga !== 3) {
            if (cardioFolga < 3) {
                messages.push(`⚠️ Adicione mais ${3 - cardioFolga} dia(s) de cardio/folga`);
            } else {
                messages.push(`⚠️ Remova ${cardioFolga - 3} dia(s) de cardio/folga (máximo 3)`);
            }
            isValid = false;
        }
    }
    
    // Mostrar resultado da validação
    validation.classList.add('show');
    
    // Verificar se todos os dias estão preenchidos
    const allDaysFilled = diasVazios.length === 0;
    
    if (isValid && allDaysFilled) {
        validation.className = 'plan-validation show success';
        validation.innerHTML = '✅ Planejamento perfeito! Todos os treinos organizados corretamente.';
        if (submitBtn) {
            console.log('[validarPlanejamento] Habilitando botão de salvar');
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.style.cursor = 'pointer';
        }
    } else {
        validation.className = 'plan-validation show error';
        validation.innerHTML = messages.join('<br>');
        if (submitBtn) {
            console.log('[validarPlanejamento] Desabilitando botão de salvar');
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.5';
            submitBtn.style.cursor = 'not-allowed';
        }
    }
}

// ==================== INICIALIZAÇÃO ====================

// --- Integração OrderWeekPage.js (renderização vanilla JS) ---
import OrderWeekPage from './templates/OrderWeekPage.js';

const DIAS_SEMANA = [
  'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'
];
const GRUPOS = ['A', 'B', 'C', 'D'];
const TIPOS = ['Treino', 'Cardio', 'Folga'];
const semanaPadrao = [
  { dia: 'Domingo', tipo: 'Folga', grupo: null },
  { dia: 'Segunda', tipo: 'Treino', grupo: 'A' },
  { dia: 'Terça', tipo: 'Treino', grupo: 'B' },
  { dia: 'Quarta', tipo: 'Cardio', grupo: null },
  { dia: 'Quinta', tipo: 'Treino', grupo: 'C' },
  { dia: 'Sexta', tipo: 'Treino', grupo: 'D' },
  { dia: 'Sábado', tipo: 'Folga', grupo: null }
];

// Sincronização com backend
import { saveSemanaOrdemBackend, loadSemanaOrdemBackend } from './services/protocolService.js';

async function syncSemanaOrdemFromBackend(userId) {
  const ordem = await loadSemanaOrdemBackend(userId);
  if (ordem) {
    localStorage.setItem('semanaOrdem', JSON.stringify(ordem));
    return ordem;
  }
  return getSemanaOrdemLocal();
}
async function syncSemanaOrdemToBackend(userId, ordem) {
  await saveSemanaOrdemBackend(userId, ordem);
}
function getSemanaOrdemLocal() {
  const raw = localStorage.getItem('semanaOrdem');
  if (raw) try { return JSON.parse(raw); } catch { return semanaPadrao; }
  return semanaPadrao;
}
function getSemanaOrdem() {
  // Para uso global, sempre pega do localStorage (sincronizado previamente)
  return getSemanaOrdemLocal();
}
function setSemanaOrdem(semana, userId) {
  localStorage.setItem('semanaOrdem', JSON.stringify(semana));
  if (userId) syncSemanaOrdemToBackend(userId, semana);
}
window.renderOrderWeekPage = function(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  // Renderização vanilla (sem React):
  let semana = getSemanaOrdem();
  container.innerHTML = '';
  // Monta lista drag-and-drop manualmente
  container.innerHTML = `<h2>Organizar Semana de Treinos</h2><ul id='semana-list'></ul><button id='salvar-semana-btn' class='btn-primary'>Salvar</button>`;
  const ul = container.querySelector('#semana-list');
  semana.forEach((item, idx) => {
    const li = document.createElement('li');
    li.draggable = true;
    li.innerHTML = `<span class='dia-label'>${item.dia}</span>` +
      `<select class='tipo-select'>${TIPOS.map(t => `<option value='${t}' ${item.tipo===t?'selected':''}>${t}</option>`).join('')}</select>` +
      (item.tipo==='Treino' ? `<select class='grupo-select'>${GRUPOS.map(g => `<option value='${g}' ${item.grupo===g?'selected':''}>${g}</option>`).join('')}</select>` : '') +
      `<span class='drag-handle'>☰</span>`;
    li.className = 'semana-li';
    li.dataset.idx = idx;
    ul.appendChild(li);
  });
  // Drag-and-drop handlers
  let dragIdx = null;
  ul.querySelectorAll('li').forEach((li, idx) => {
    li.addEventListener('dragstart', () => { dragIdx = idx; li.classList.add('dragging'); });
    li.addEventListener('dragend', () => { dragIdx = null; li.classList.remove('dragging'); });
    li.addEventListener('dragover', e => {
      e.preventDefault();
      if (dragIdx === null || dragIdx === idx) return;
      const moved = semana.splice(dragIdx, 1)[0];
      semana.splice(idx, 0, moved);
      setSemanaOrdem(semana);
      window.renderOrderWeekPage(containerId); // re-render
    });
  });
  // Tipo/grupo handlers
  ul.querySelectorAll('.tipo-select').forEach((sel, idx) => {
    sel.addEventListener('change', e => {
      semana[idx].tipo = e.target.value;
      if (e.target.value !== 'Treino') semana[idx].grupo = null;
      else if (!semana[idx].grupo) semana[idx].grupo = 'A';
      setSemanaOrdem(semana);
      window.renderOrderWeekPage(containerId);
    });
  });
  ul.querySelectorAll('.grupo-select').forEach((sel, idx) => {
    sel.addEventListener('change', e => {
      semana[idx].grupo = e.target.value;
      setSemanaOrdem(semana);
      window.renderOrderWeekPage(containerId);
    });
  });
  // Salvar
  container.querySelector('#salvar-semana-btn').onclick = () => {
    setSemanaOrdem(semana);
    alert('Ordem da semana salva!');
  };
};

// --- Adiciona botão na bottom navigator bar ---
document.addEventListener('DOMContentLoaded', () => {
  let bar = document.querySelector('.bottom-nav, .bottom-bar, .bottomnavigator, #bottom-nav');
  if (!bar) {
    bar = document.createElement('div');
    bar.className = 'bottom-nav';
    document.body.appendChild(bar);
  }
  if (!bar.querySelector('#order-week-btn')) {
    const btn = document.createElement('button');
    btn.id = 'order-week-btn';
    btn.className = 'btn-bottom-nav';
    btn.innerHTML = `<span>Ordem Semana</span>`;
    btn.onclick = () => {
      window.renderTemplate && window.renderTemplate('orderWeek');
    };
    bar.appendChild(btn);
  }
});


document.addEventListener('DOMContentLoaded', async function() {
    // Sincroniza ordem customizada da semana com backend ao iniciar
    const userId = AppState.currentUser && AppState.currentUser.id;
    if (userId) await syncSemanaOrdemFromBackend(userId);
    // Renderiza a semana customizada na home
    function renderCustomWeekList() {
        const ul = document.getElementById('custom-week-list');
        if (!ul) return;
        const semana = getSemanaOrdem();
        ul.innerHTML = '';
        semana.forEach(item => {
            const li = document.createElement('li');
            li.className = 'custom-week-item';
            li.innerHTML = `<strong>${item.dia}:</strong> ${item.tipo}${item.tipo === 'Treino' && item.grupo ? ' ('+item.grupo+')' : ''}`;
            ul.appendChild(li);
        });
    }
    // Observa mudanças de navegação/renderização da home
    const observer = new MutationObserver(() => {
        if (document.getElementById('custom-week-list')) {
            renderCustomWeekList();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    // Também tenta renderizar imediatamente
    setTimeout(renderCustomWeekList, 300);

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
    const btn = document.getElementById('start-workout-btn');
if (btn) {
    btn.addEventListener('click', iniciarTreino);
}
    
    // Carregar usuários
    const usuarios = await UserService.fetchUsuarios();
    renderUsuarios(usuarios);
});