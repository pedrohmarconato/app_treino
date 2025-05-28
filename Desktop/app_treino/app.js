// app.js - Aplicação de Treinamento com Supabase

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
    weekPlan: null
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
        alert('Erro ao carregar usuários');
        return [];
    }
}

// 2. Buscar protocolo ativo do usuário
async function fetchProtocoloAtivoUsuario(userId) {
    try {
        // Primeiro, verificar se o usuário tem um plano de treino ativo
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
            // Se não tem plano ativo, criar um novo com o protocolo padrão (ID 1)
            const { data: novoPlano, error: novoPlanoError } = await supabase
                .from('usuario_plano_treino')
                .insert({
                    usuario_id: userId,
                    protocolo_treinamento_id: 1, // Protocolo padrão
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
        // Verificar se tem planejamento semanal
        const weekPlan = getWeekPlan(userId);
        const today = new Date().getDay(); // 0 = Domingo, 6 = Sábado
        
        if (weekPlan && weekPlan[today] && weekPlan[today] !== 'folga' && weekPlan[today] !== 'cardio') {
            // Buscar treino específico do planejamento
            const tipoTreino = weekPlan[today]; // Ex: 'A', 'B', 'C', 'D'
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
        
        // Fallback para lógica original
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

// 4. Buscar exercícios do treino - FUNÇÃO CORRIGIDA
async function fetchExerciciosTreino(numeroTreino, protocoloId) {
    try {
        // Buscar todos os exercícios do treino específico
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
        
        // Garantir que cada exercício seja único e bem estruturado
        const exerciciosUnicos = data.reduce((acc, item) => {
            // Verificar se o exercício já foi adicionado
            const existente = acc.find(e => e.exercicio_id === item.exercicio_id);
            if (!existente) {
                acc.push({
                    ...item,
                    // Garantir que os dados do exercício estejam acessíveis
                    exercicio_nome: item.exercicios?.nome || 'Exercício sem nome',
                    exercicio_grupo: item.exercicios?.grupo_muscular || 'Não especificado',
                    exercicio_equipamento: item.exercicios?.equipamento || 'Livre'
                });
            }
            return acc;
        }, []);
        
        console.log('Exercícios carregados:', exerciciosUnicos);
        return exerciciosUnicos;
        
    } catch (error) {
        console.error('Erro ao buscar exercícios:', error);
        return [];
    }
}

// 5. Buscar 1RM do usuário para um exercício
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
        // Buscar total de treinos realizados
        const { data: execucoes, error } = await supabase
            .from('execucao_exercicio_usuario')
            .select('protocolo_treino_id')
            .eq('usuario_id', userId);
        
        if (error) throw error;
        
        const treinosUnicos = [...new Set(execucoes.map(e => e.protocolo_treino_id))];
        const totalTreinos = treinosUnicos.length;
        
        // Buscar plano ativo para calcular progresso
        const planoAtivo = await fetchProtocoloAtivoUsuario(userId);
        let progresso = 0;
        let semanaAtual = 1;
        
        if (planoAtivo) {
            semanaAtual = planoAtivo.semana_atual;
            const totalTreinosProtocolo = planoAtivo.protocolos_treinamento.total_treinos || 48;
            progresso = Math.round((totalTreinos / totalTreinosProtocolo) * 100);
        }
        
        // Buscar último treino
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
        // Buscar comparação entre usuários
        const { data: comparacao, error: compError } = await supabase
            .from('v_comparativo_usuarios')
            .select('*');
        
        if (compError) throw compError;
        
        // Buscar progresso do usuário atual
        const { data: progresso, error: progError } = await supabase
            .from('execucao_exercicio_usuario')
            .select(`
                data_execucao,
                peso_utilizado,
                repeticoes,
                exercicios (nome, grupo_muscular)
            `)
            .eq('usuario_id', AppState.currentUser.id)
            .order('data_execucao', { descending: true })
            .limit(100);
        
        if (progError) throw progError;
        
        // Buscar resumo por grupo muscular
        const { data: resumoGrupo, error: resumoError } = await supabase
            .from('v_resumo_grupo_muscular')
            .select('*');
        
        if (resumoError) throw resumoError;
        
        return {
            comparacao,
            progresso,
            resumoGrupo
        };
    } catch (error) {
        console.error('Erro ao buscar dados dos indicadores:', error);
        return { comparacao: [], progresso: [], resumoGrupo: [] };
    }
}

// ==================== FUNÇÕES DE PLANEJAMENTO SEMANAL ====================

// Verificar se precisa planejar a semana
function needsWeekPlanning(userId) {
    const key = `weekPlan_${userId}_${getWeekKey()}`;
    const plan = localStorage.getItem(key);
    return !plan;
}

// Obter chave da semana atual
function getWeekKey() {
    const now = new Date();
    const year = now.getFullYear();
    const week = getWeekNumber(now);
    return `${year}_${week}`;
}

// Obter número da semana
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
}

// Salvar planejamento semanal
function saveWeekPlan(userId, plan) {
    const key = `weekPlan_${userId}_${getWeekKey()}`;
    localStorage.setItem(key, JSON.stringify(plan));
    AppState.weekPlan = plan;
}

// Obter planejamento semanal
function getWeekPlan(userId) {
    const key = `weekPlan_${userId}_${getWeekKey()}`;
    const plan = localStorage.getItem(key);
    return plan ? JSON.parse(plan) : null;
}

// Criar interface de planejamento semanal
function showWeekPlanning() {
    const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const opcoes = ['folga', 'cardio', 'A', 'B', 'C', 'D'];
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content week-planning">
            <h2>🗓️ Planeje sua Semana</h2>
            <p>Organize seus treinos para esta semana. Você precisa incluir 4 treinos (A, B, C, D).</p>
            
            <div class="week-grid">
                ${dias.map((dia, index) => `
                    <div class="day-plan">
                        <h4>${dia}</h4>
                        <select id="day-${index}" class="day-select">
                            <option value="folga">Folga</option>
                            <option value="cardio">Cardio</option>
                            <option value="A">Treino A - Costas/Ombros</option>
                            <option value="B">Treino B - Peito</option>
                            <option value="C">Treino C - Braços/Ombros</option>
                            <option value="D">Treino D - Pernas</option>
                        </select>
                    </div>
                `).join('')}
            </div>
            
            <div class="plan-summary">
                <p id="plan-validation"></p>
            </div>
            
            <button class="primary-btn" onclick="confirmWeekPlan()">Confirmar Planejamento</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Adicionar listeners para validação
    document.querySelectorAll('.day-select').forEach(select => {
        select.addEventListener('change', validateWeekPlan);
    });
    
    // Pré-sugerir um planejamento balanceado
    suggestBalancedPlan();
}

// Sugerir planejamento balanceado
function suggestBalancedPlan() {
    const sugestao = [
        'folga',    // Domingo
        'A',        // Segunda
        'cardio',   // Terça
        'B',        // Quarta
        'C',        // Quinta
        'folga',    // Sexta
        'D'         // Sábado
    ];
    
    sugestao.forEach((valor, index) => {
        document.getElementById(`day-${index}`).value = valor;
    });
    
    validateWeekPlan();
}

// Validar planejamento semanal
function validateWeekPlan() {
    const treinos = { A: 0, B: 0, C: 0, D: 0 };
    let valid = true;
    
    for (let i = 0; i < 7; i++) {
        const valor = document.getElementById(`day-${i}`).value;
        if (treinos.hasOwnProperty(valor)) {
            treinos[valor]++;
        }
    }
    
    const validation = document.getElementById('plan-validation');
    const missing = [];
    
    for (let treino in treinos) {
        if (treinos[treino] === 0) {
            missing.push(`Treino ${treino}`);
            valid = false;
        } else if (treinos[treino] > 1) {
            validation.innerHTML = `⚠️ Treino ${treino} aparece ${treinos[treino]} vezes. Cada treino deve aparecer apenas uma vez.`;
            validation.className = 'error';
            return false;
        }
    }
    
    if (missing.length > 0) {
        validation.innerHTML = `⚠️ Faltam: ${missing.join(', ')}`;
        validation.className = 'error';
    } else {
        validation.innerHTML = '✅ Planejamento válido! Todos os treinos estão incluídos.';
        validation.className = 'success';
    }
    
    return valid;
}

// Confirmar planejamento semanal
function confirmWeekPlan() {
    if (!validateWeekPlan()) {
        alert('Por favor, inclua todos os 4 treinos (A, B, C, D) uma vez cada.');
        return;
    }
    
    const plan = {};
    for (let i = 0; i < 7; i++) {
        plan[i] = document.getElementById(`day-${i}`).value;
    }
    
    saveWeekPlan(AppState.currentUser.id, plan);
    document.querySelector('.modal-overlay').remove();
    
    // Recarregar próximo treino
    carregarProximoTreino();
}

// ==================== FUNÇÕES DE UI ====================

// Renderizar usuários na tela de login
function renderUsuarios(usuarios) {
    const container = document.querySelector('#login-screen .users');
    container.innerHTML = '';
    
    usuarios.forEach(user => {
        const card = document.createElement('div');
        card.className = 'user-card';
        card.dataset.userId = user.id;
        
        // Usar imagem fitness ao invés de avatar cartoon
        const userImages = {
            'Pedro': 'https://images.unsplash.com/photo-1583454110551-21f7548f6c12?w=200&h=200&fit=crop',
            'Japa': 'https://images.unsplash.com/photo-1567013127542-490d2b32c4a3?w=200&h=200&fit=crop'
        };
        
        card.innerHTML = `
            <div class="avatar fitness">
                <img src="${userImages[user.nome] || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop'}" 
                     alt="${user.nome}">
            </div>
            <h3>${user.nome}</h3>
        `;
        card.onclick = () => selecionarUsuario(user);
        container.appendChild(card);
    });
}

// Selecionar usuário e carregar dados
async function selecionarUsuario(usuario) {
    AppState.currentUser = usuario;
    
    // Atualizar UI com dados do usuário
    document.getElementById('user-name').textContent = usuario.nome;
    
    const userImages = {
        'Pedro': 'https://images.unsplash.com/photo-1583454110551-21f7548f6c12?w=40&h=40&fit=crop',
        'Japa': 'https://images.unsplash.com/photo-1567013127542-490d2b32c4a3?w=40&h=40&fit=crop'
    };
    
    document.getElementById('user-avatar').src = userImages[usuario.nome] || 
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=40&h=40&fit=crop';
    
    // Buscar protocolo ativo
    const protocolo = await fetchProtocoloAtivoUsuario(usuario.id);
    if (protocolo) {
        AppState.currentProtocol = protocolo;
    }
    
    // Verificar se precisa planejar a semana
    if (needsWeekPlanning(usuario.id)) {
        showWeekPlanning();
    } else {
        AppState.weekPlan = getWeekPlan(usuario.id);
    }
    
    // Carregar métricas
    await atualizarMetricas();
    
    // Carregar próximo treino
    await carregarProximoTreino();
    
    // Mudar para tela home
    mudarTela('home-screen');
}

// Atualizar métricas na tela home
async function atualizarMetricas() {
    const metricas = await fetchMetricasUsuario(AppState.currentUser.id);
    
    document.getElementById('completed-workouts').textContent = metricas.treinosConcluidos;
    document.getElementById('progress-percentage').textContent = `${metricas.progresso}%`;
    document.getElementById('current-week').textContent = metricas.semanaAtual;
    
    // Atualizar último treino
    if (metricas.ultimoTreino) {
        const diasAtras = Math.floor((new Date() - metricas.ultimoTreino.data) / (1000 * 60 * 60 * 24));
        const textoTempo = diasAtras === 0 ? 'Hoje' : 
                          diasAtras === 1 ? 'Ontem' : 
                          `${diasAtras} dias atrás`;
        
        document.getElementById('last-workout-info').textContent = 
            `${metricas.ultimoTreino.tipo} - ${textoTempo}`;
    }
}

// Carregar e exibir próximo treino
async function carregarProximoTreino() {
    if (!AppState.currentProtocol) return;
    
    // Verificar planejamento do dia
    const weekPlan = getWeekPlan(AppState.currentUser.id);
    const today = new Date().getDay();
    
    if (weekPlan && weekPlan[today]) {
        const planToday = weekPlan[today];
        
        if (planToday === 'folga') {
            document.getElementById('next-workout-name').textContent = '🏖️ Dia de Folga';
            document.getElementById('next-workout-week').textContent = 'Descanse e recupere-se';
            document.getElementById('next-workout-exercises').textContent = 'Hidrate-se bem';
            document.getElementById('next-workout-intensity').textContent = 'Alongue-se';
            document.getElementById('start-workout-btn').disabled = true;
            document.getElementById('start-workout-btn').textContent = 'Dia de Descanso';
            return;
        }
        
        if (planToday === 'cardio') {
            document.getElementById('next-workout-name').textContent = '🏃 Dia de Cardio';
            document.getElementById('next-workout-week').textContent = '30-45 minutos';
            document.getElementById('next-workout-exercises').textContent = 'Corrida, bike ou natação';
            document.getElementById('next-workout-intensity').textContent = 'Intensidade moderada';
            document.getElementById('start-workout-btn').disabled = true;
            document.getElementById('start-workout-btn').textContent = 'Registre no seu app de cardio';
            return;
        }
    }
    
    // Habilitar botão
    document.getElementById('start-workout-btn').disabled = false;
    document.getElementById('start-workout-btn').textContent = 'Iniciar Treino';
    
    const proximoTreino = await fetchProximoTreino(
        AppState.currentUser.id, 
        AppState.currentProtocol.protocolo_treinamento_id
    );
    
    if (proximoTreino) {
        AppState.currentWorkout = proximoTreino;
        
        // Contar exercícios
        const exercicios = await fetchExerciciosTreino(
            proximoTreino.numero_treino,
            proximoTreino.protocolo_id
        );
        
        // Atualizar UI
        const tipoTreino = obterTipoTreino(proximoTreino.dia_semana);
        document.getElementById('next-workout-name').textContent = tipoTreino;
        document.getElementById('next-workout-week').textContent = `Semana ${proximoTreino.semana_referencia}`;
        document.getElementById('next-workout-exercises').textContent = `${exercicios.length} exercícios`;
        document.getElementById('next-workout-intensity').textContent = 
            `${proximoTreino.percentual_1rm_min}-${proximoTreino.percentual_1rm_max}% 1RM`;
    }
}

// Criar tela de indicadores
async function mostrarIndicadores() {
    const dados = await fetchDadosIndicadores();
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content indicators">
            <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">✕</button>
            <h2>📊 Indicadores de Performance</h2>
            
            <div class="indicators-grid">
                <div class="indicator-card">
                    <h3>💪 Comparação entre Atletas</h3>
                    <div class="comparison-list">
                        ${dados.comparacao.map(comp => `
                            <div class="comparison-item">
                                <span class="exercise-name">${comp.exercicio}</span>
                                <div class="comparison-bars">
                                    <div class="user-bar">
                                        <span>Pedro: ${comp.pedro_1rm || 0}kg</span>
                                        <div class="bar" style="width: ${(comp.pedro_1rm / Math.max(comp.pedro_1rm || 1, comp.japa_1rm || 1)) * 100}%"></div>
                                    </div>
                                    <div class="user-bar">
                                        <span>Japa: ${comp.japa_1rm || 0}kg</span>
                                        <div class="bar" style="width: ${(comp.japa_1rm / Math.max(comp.pedro_1rm || 1, comp.japa_1rm || 1)) * 100}%"></div>
                                    </div>
                                </div>
                                <span class="winner">🏆 ${comp.mais_forte}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="indicator-card">
                    <h3>📈 Sua Evolução Recente</h3>
                    <div class="progress-summary">
                        ${agruparProgressoPorExercicio(dados.progresso).map(prog => `
                            <div class="progress-item">
                                <span class="exercise-name">${prog.exercicio}</span>
                                <span class="progress-info">
                                    ${prog.pesoInicial}kg → ${prog.pesoAtual}kg 
                                    <span class="${prog.evolucao >= 0 ? 'positive' : 'negative'}">
                                        ${prog.evolucao >= 0 ? '+' : ''}${prog.evolucao.toFixed(1)}%
                                    </span>
                                </span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="indicator-card full-width">
                    <h3>🎯 Força por Grupo Muscular</h3>
                    <div class="muscle-group-grid">
                        ${dados.resumoGrupo.filter(r => r.usuario === AppState.currentUser.nome).map(grupo => `
                            <div class="muscle-group-card">
                                <h4>${grupo.grupo_muscular}</h4>
                                <div class="muscle-stats">
                                    <div class="stat">
                                        <span class="label">Exercícios</span>
                                        <span class="value">${grupo.qtd_exercicios}</span>
                                    </div>
                                    <div class="stat">
                                        <span class="label">Média 1RM</span>
                                        <span class="value">${Math.round(grupo.media_1rm)}kg</span>
                                    </div>
                                    <div class="stat">
                                        <span class="label">Máximo</span>
                                        <span class="value">${Math.round(grupo.maior_1rm)}kg</span>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Agrupar progresso por exercício
function agruparProgressoPorExercicio(progressos) {
    const grupos = {};
    
    progressos.forEach(p => {
        if (!grupos[p.exercicios.nome]) {
            grupos[p.exercicios.nome] = {
                exercicio: p.exercicios.nome,
                registros: []
            };
        }
        grupos[p.exercicios.nome].registros.push(p);
    });
    
    return Object.values(grupos).map(g => {
        const registros = g.registros.sort((a, b) => 
            new Date(a.data_execucao) - new Date(b.data_execucao)
        );
        
        const primeiro = registros[0];
        const ultimo = registros[registros.length - 1];
        
        return {
            exercicio: g.exercicio,
            pesoInicial: primeiro.peso_utilizado,
            pesoAtual: ultimo.peso_utilizado,
            evolucao: ((ultimo.peso_utilizado - primeiro.peso_utilizado) / primeiro.peso_utilizado) * 100
        };
    }).slice(0, 5); // Top 5 exercícios
}

// Iniciar treino - FUNÇÃO MELHORADA
async function iniciarTreino() {
    if (!AppState.currentWorkout) {
        alert('Nenhum treino disponível');
        return;
    }
    
    // Mostrar loading
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-overlay';
    loadingDiv.innerHTML = '<div class="loading-spinner">Carregando exercícios...</div>';
    document.body.appendChild(loadingDiv);
    
    try {
        // Buscar exercícios do treino
        const exercicios = await fetchExerciciosTreino(
            AppState.currentWorkout.numero_treino,
            AppState.currentWorkout.protocolo_id
        );
        
        if (!exercicios || exercicios.length === 0) {
            throw new Error('Nenhum exercício encontrado para este treino');
        }
        
        // Configurar estado
        AppState.currentExercises = exercicios;
        AppState.currentExerciseIndex = 0;
        AppState.workoutStartTime = new Date();
        AppState.completedSeries = 0;
        
        // Atualizar título do treino
        const tipoTreino = obterTipoTreino(AppState.currentWorkout.dia_semana);
        document.getElementById('workout-title').textContent = tipoTreino;
        
        // Adicionar resumo do treino
        const summaryDiv = document.querySelector('.workout-summary');
        if (summaryDiv) {
            summaryDiv.innerHTML = `
                <div class="summary-item">
                    <span class="summary-label">Total de Exercícios:</span>
                    <span class="summary-value">${exercicios.length}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Tempo Estimado:</span>
                    <span class="summary-value">${calcularTempoEstimado(exercicios)}min</span>
                </div>
            `;
        }
        
        // Carregar primeiro exercício
        await carregarExercicio(0);
        
        // Mudar para tela de treino
        mudarTela('workout-screen');
        
    } catch (error) {
        console.error('Erro ao iniciar treino:', error);
        alert(`Erro ao carregar treino: ${error.message}`);
    } finally {
        // Remover loading
        loadingDiv.remove();
    }
}

// Função auxiliar para calcular tempo estimado
function calcularTempoEstimado(exercicios) {
    let tempoTotal = 0;
    exercicios.forEach(ex => {
        // Tempo por série (30s) + descanso entre séries
        tempoTotal += (ex.series * 30) + ((ex.series - 1) * ex.tempo_descanso);
        // Adicionar tempo de descanso entre exercícios
        tempoTotal += ex.tempo_descanso;
    });
    return Math.round(tempoTotal / 60);
}

// Carregar exercício específico - FUNÇÃO MELHORADA
async function carregarExercicio(index) {
    if (index >= AppState.currentExercises.length) {
        // Treino concluído
        exibirConclusaoTreino();
        return;
    }
    
    const exercicio = AppState.currentExercises[index];
    AppState.currentExerciseIndex = index;
    
    // Atualizar progresso
    const progresso = ((index) / AppState.currentExercises.length) * 100;
    document.getElementById('workout-progress').style.width = `${progresso}%`;
    
    // Atualizar contador de exercícios
    let workoutHeader = document.querySelector('#workout-screen .header');
    if (workoutHeader) {
        let counter = document.getElementById('exercise-counter');
        if (!counter) {
            counter = document.createElement('div');
            counter.id = 'exercise-counter';
            counter.className = 'exercise-counter';
            workoutHeader.appendChild(counter);
        }
        counter.textContent = `Exercício ${index + 1} de ${AppState.currentExercises.length}`;
    }
    
    // Usar os dados corretos do exercício
    const nomeExercicio = exercicio.exercicio_nome || exercicio.exercicios?.nome || 'Exercício';
    const grupoMuscular = exercicio.exercicio_grupo || exercicio.exercicios?.grupo_muscular || '';
    const equipamento = exercicio.exercicio_equipamento || exercicio.exercicios?.equipamento || '';
    
    // Atualizar informações do exercício
    document.getElementById('exercise-name').textContent = nomeExercicio;
    
    // Criar descrição detalhada
    const descricao = [];
    if (grupoMuscular) descricao.push(`Grupo: ${grupoMuscular}`);
    if (equipamento) descricao.push(`Equipamento: ${equipamento}`);
    if (exercicio.observacoes) descricao.push(exercicio.observacoes);
    
    document.getElementById('exercise-notes').textContent = 
        descricao.length > 0 ? descricao.join(' • ') : 'Execute com técnica perfeita';
    
    // Criar séries com informações corretas
    await criarSeries(exercicio);
    
    // Mostrar container do exercício
    document.getElementById('exercise-container').classList.remove('hidden');
    document.getElementById('timer-container').classList.add('hidden');
    document.getElementById('workout-completed').classList.add('hidden');
}

// Criar linhas de séries - FUNÇÃO APRIMORADA
async function criarSeries(exercicio) {
    const container = document.getElementById('series-container');
    container.innerHTML = '';
    
    // Buscar 1RM do usuário para calcular peso sugerido
    const rm = await fetch1RMUsuario(AppState.currentUser.id, exercicio.exercicio_id);
    
    // Calcular peso sugerido baseado no percentual do protocolo
    let pesoSugerido = 0;
    if (rm && exercicio.percentual_1rm_base > 0) {
        pesoSugerido = Math.round(rm * (exercicio.percentual_1rm_base / 100) * 2) / 2; // Arredondar para 0.5kg
    }
    
    // Buscar último peso usado neste exercício
    const { data: ultimaExecucao } = await supabase
        .from('execucao_exercicio_usuario')
        .select('peso_utilizado, repeticoes')
        .eq('usuario_id', AppState.currentUser.id)
        .eq('exercicio_id', exercicio.exercicio_id)
        .order('data_execucao', { descending: true })
        .limit(1)
        .single();
    
    // Se tem execução anterior, usar como referência
    if (ultimaExecucao && ultimaExecucao.peso_utilizado) {
        pesoSugerido = ultimaExecucao.peso_utilizado;
    }
    
    // Criar header da tabela de séries
    const header = document.createElement('div');
    header.className = 'series-header';
    header.innerHTML = `
        <div>Série</div>
        <div>Peso (kg)</div>
        <div>Repetições</div>
        <div>Status</div>
    `;
    container.appendChild(header);
    
    // Criar linhas de séries
    for (let i = 1; i <= exercicio.series; i++) {
        const row = document.createElement('div');
        row.className = 'series-row';
        row.dataset.series = i;
        row.innerHTML = `
            <div class="series-number">${i}</div>
            <div class="series-weight">
                <button class="weight-adjust" onclick="ajustarPeso(${i}, -0.5)">-</button>
                <input type="number" 
                       class="weight-input" 
                       id="weight-${i}"
                       value="${pesoSugerido}" 
                       min="0" 
                       step="0.5"
                       placeholder="0">
                <button class="weight-adjust" onclick="ajustarPeso(${i}, 0.5)">+</button>
            </div>
            <div class="series-reps">
                <button class="reps-adjust" onclick="ajustarReps(${i}, -1)">-</button>
                <input type="number" 
                       class="reps-input" 
                       id="reps-${i}"
                       value="${exercicio.repeticoes_alvo}" 
                       min="1"
                       placeholder="0">
                <button class="reps-adjust" onclick="ajustarReps(${i}, 1)">+</button>
            </div>
            <div class="series-action">
                <button class="done-btn" id="done-${i}" onclick="finalizarSerie(${i})">
                    <span class="check-icon">✓</span>
                </button>
            </div>
        `;
        container.appendChild(row);
    }
    
    // Adicionar informações de intensidade
    const infoDiv = document.createElement('div');
    infoDiv.className = 'exercise-info';
    infoDiv.innerHTML = `
        <div class="info-item">
            <span class="info-label">Intensidade:</span>
            <span class="info-value">${exercicio.percentual_1rm_min}-${exercicio.percentual_1rm_max}% 1RM</span>
        </div>
        <div class="info-item">
            <span class="info-label">Descanso:</span>
            <span class="info-value">${exercicio.tempo_descanso}s</span>
        </div>
        ${rm ? `
        <div class="info-item">
            <span class="info-label">Seu 1RM:</span>
            <span class="info-value">${rm}kg</span>
        </div>
        ` : ''}
    `;
    container.appendChild(infoDiv);
}

// Funções auxiliares para ajuste de peso e repetições
function ajustarPeso(serie, delta) {
    const input = document.getElementById(`weight-${serie}`);
    const novoValor = Math.max(0, parseFloat(input.value || 0) + delta);
    input.value = novoValor;
}

function ajustarReps(serie, delta) {
    const input = document.getElementById(`reps-${serie}`);
    const novoValor = Math.max(1, parseInt(input.value || 0) + delta);
    input.value = novoValor;
}

// Finalizar série
async function finalizarSerie(numeroSerie) {
    const row = document.querySelector(`.series-row[data-series="${numeroSerie}"]`);
    if (!row || row.classList.contains('completed')) return;
    
    const peso = parseFloat(row.querySelector('.weight-input').value) || 0;
    const reps = parseInt(row.querySelector('.reps-input').value) || 0;
    
    if (peso <= 0 || reps <= 0) {
        alert('Preencha peso e repetições');
        return;
    }
    
    const exercicioAtual = AppState.currentExercises[AppState.currentExerciseIndex];
    
    // Salvar execução
    const sucesso = await salvarExecucaoExercicio({
        usuario_id: AppState.currentUser.id,
        protocolo_treino_id: exercicioAtual.id,
        exercicio_id: exercicioAtual.exercicio_id,
        peso_utilizado: peso,
        repeticoes: reps,
        falhou: false
    });
    
    if (!sucesso) {
        alert('Erro ao salvar série');
        return;
    }
    
    // Marcar como concluída
    row.classList.add('completed');
    row.querySelector('.done-btn').disabled = true;
    row.querySelectorAll('input').forEach(input => input.disabled = true);
    
    AppState.completedSeries++;
    
    // Verificar se é a última série
    if (numeroSerie === exercicioAtual.series) {
        iniciarDescanso(exercicioAtual.tempo_descanso);
    }
}

// Iniciar período de descanso
function iniciarDescanso(tempoDescanso) {
    const proximoIndex = AppState.currentExerciseIndex + 1;
    const temProximo = proximoIndex < AppState.currentExercises.length;
    
    // Esconder exercício, mostrar timer
    document.getElementById('exercise-container').classList.add('hidden');
    document.getElementById('timer-container').classList.remove('hidden');
    
    // Configurar próximo exercício
    if (temProximo) {
        const proximo = AppState.currentExercises[proximoIndex];
        document.getElementById('next-exercise-name').textContent = proximo.exercicio_nome || proximo.exercicios?.nome;
    } else {
        document.getElementById('next-exercise-name').textContent = '🎉 Treino finalizado!';
    }
    
    // Iniciar contagem regressiva
    AppState.restStartTime = new Date();
    let tempoRestante = tempoDescanso;
    
    atualizarTimer(tempoRestante);
    
    AppState.timerInterval = setInterval(() => {
        const decorrido = Math.floor((new Date() - AppState.restStartTime) / 1000);
        tempoRestante = tempoDescanso - decorrido;
        
        if (tempoRestante <= 0) {
            clearInterval(AppState.timerInterval);
            if (temProximo) {
                carregarExercicio(proximoIndex);
            } else {
                exibirConclusaoTreino();
            }
        } else {
            atualizarTimer(tempoRestante);
        }
    }, 1000);
}

// Atualizar display do timer
function atualizarTimer(segundos) {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    document.getElementById('timer').textContent = 
        `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Pular descanso
function pularDescanso() {
    if (AppState.timerInterval) {
        clearInterval(AppState.timerInterval);
    }
    
    const proximoIndex = AppState.currentExerciseIndex + 1;
    if (proximoIndex < AppState.currentExercises.length) {
        carregarExercicio(proximoIndex);
    } else {
        exibirConclusaoTreino();
    }
}

// Exibir tela de conclusão
function exibirConclusaoTreino() {
    document.getElementById('exercise-container').classList.add('hidden');
    document.getElementById('timer-container').classList.add('hidden');
    document.getElementById('workout-completed').classList.remove('hidden');
    
    // Calcular estatísticas
    document.getElementById('completed-series').textContent = AppState.completedSeries;
    
    const tempoTotal = Math.floor((new Date() - AppState.workoutStartTime) / 60000);
    const horas = Math.floor(tempoTotal / 60);
    const minutos = tempoTotal % 60;
    document.getElementById('total-time').textContent = 
        horas > 0 ? `${horas}h ${minutos}min` : `${minutos}min`;
}

// Finalizar treino
async function finalizarTreino() {
    // Atualizar semana atual se necessário
    if (AppState.currentProtocol) {
        const { data: treinos } = await supabase
            .from('protocolo_treinos')
            .select('numero_treino')
            .eq('protocolo_id', AppState.currentProtocol.protocolo_treinamento_id)
            .eq('semana_referencia', AppState.currentProtocol.semana_atual);
        
        const treinosSemana = treinos ? treinos.length : 0;
        const treinosRealizados = AppState.currentWorkout.numero_treino % treinosSemana;
        
        // Se completou todos os treinos da semana, avançar
        if (treinosRealizados === 0) {
            await supabase
                .from('usuario_plano_treino')
                .update({ semana_atual: AppState.currentProtocol.semana_atual + 1 })
                .eq('id', AppState.currentProtocol.id);
        }
    }
    
    // Resetar estado
    AppState.currentExercises = [];
    AppState.currentExerciseIndex = 0;
    AppState.completedSeries = 0;
    
    // Atualizar tela home
    await atualizarMetricas();
    await carregarProximoTreino();
    
    mudarTela('home-screen');
}

// ==================== FUNÇÕES AUXILIARES ====================

// Obter descrição do tipo de treino
function obterTipoTreino(diaSemana) {
    const tipos = {
        1: 'Treino A - Costas e Ombros',
        2: 'Treino B - Peito',
        3: 'Treino C - Braços e Ombros',
        4: 'Treino D - Pernas'
    };
    return tipos[diaSemana] || `Treino ${diaSemana}`;
}

// Mudar entre telas
function mudarTela(telaId) {
    const telas = ['login-screen', 'home-screen', 'workout-screen'];
    telas.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.classList.toggle('active', id === telaId);
        }
    });
}

// Logout
function logout() {
    AppState.currentUser = null;
    AppState.currentProtocol = null;
    AppState.currentWorkout = null;
    AppState.weekPlan = null;
    mudarTela('login-screen');
}

// Voltar para home
function voltarParaHome() {
    if (AppState.currentExercises.length > 0) {
        if (!confirm('Deseja sair do treino? O progresso será perdido.')) {
            return;
        }
    }
    
    if (AppState.timerInterval) {
        clearInterval(AppState.timerInterval);
    }
    
    mudarTela('home-screen');
}

// Replanejar semana
function replanejarSemana() {
    if (confirm('Deseja replanejar sua semana? Isso irá sobrescrever o planejamento atual.')) {
        showWeekPlanning();
    }
}

// ==================== ESTILOS DINÂMICOS ====================
const dynamicStyles = `
<style>
/* Modal Overlay */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
}

.modal-content {
    background: white;
    border-radius: 20px;
    padding: 30px;
    max-width: 900px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.close-btn {
    position: absolute;
    top: 20px;
    right: 20px;
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #666;
}

/* Week Planning */
.week-planning h2 {
    text-align: center;
    margin-bottom: 10px;
}

.week-planning p {
    text-align: center;
    color: #666;
    margin-bottom: 30px;
}

.week-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 15px;
    margin-bottom: 20px;
}

.day-plan {
    text-align: center;
}

.day-plan h4 {
    margin-bottom: 10px;
    color: #333;
}

.day-select {
    width: 100%;
    padding: 10px;
    border: 2px solid #e0e0e0;
    border-radius: 10px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s;
}

.day-select:focus {
    border-color: var(--primary-color);
    outline: none;
}

.plan-summary {
    text-align: center;
    margin: 20px 0;
    min-height: 30px;
}

.plan-summary p {
    font-weight: 500;
    margin: 0;
}

.plan-summary .error {
    color: #f44336;
}

.plan-summary .success {
    color: #4caf50;
}

/* Indicators */
.indicators h2 {
    text-align: center;
    margin-bottom: 30px;
}

.indicators-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 20px;
}

.indicator-card {
    background: #f8f9fa;
    border-radius: 15px;
    padding: 20px;
}

.indicator-card.full-width {
    grid-column: 1 / -1;
}

.indicator-card h3 {
    margin-bottom: 20px;
    color: #333;
}

.comparison-item {
    margin-bottom: 20px;
    padding: 15px;
    background: white;
    border-radius: 10px;
}

.exercise-name {
    font-weight: 600;
    display: block;
    margin-bottom: 10px;
}

.comparison-bars {
    margin: 10px 0;
}

.user-bar {
    margin: 5px 0;
}

.user-bar span {
    font-size: 14px;
    color: #666;
}

.bar {
    height: 8px;
    background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
    border-radius: 4px;
    margin-top: 5px;
    transition: width 0.5s ease;
}

.winner {
    display: block;
    text-align: right;
    color: #ff9800;
    font-weight: 500;
}

.progress-item {
    display: flex;
    justify-content: space-between;
    padding: 10px;
    margin-bottom: 10px;
    background: white;
    border-radius: 8px;
}

.progress-info {
    font-weight: 500;
}

.positive {
    color: #4caf50;
}

.negative {
    color: #f44336;
}

.muscle-group-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
}

.muscle-group-card {
    background: white;
    padding: 20px;
    border-radius: 10px;
    text-align: center;
}

.muscle-group-card h4 {
    margin-bottom: 15px;
    color: var(--primary-color);
}

.muscle-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    text-align: center;
}

.stat .label {
    display: block;
    font-size: 12px;
    color: #666;
    margin-bottom: 5px;
}

.stat .value {
    display: block;
    font-size: 18px;
    font-weight: 700;
    color: #333;
}

/* Avatar fitness */
.avatar.fitness {
    border: 3px solid var(--primary-color);
}

.avatar.fitness img {
    object-position: center top;
}

/* Botões extras */
.extra-buttons {
    display: flex;
    gap: 10px;
    margin-top: 20px;
}

.secondary-btn {
    flex: 1;
}

/* Novos estilos para a tela de treino */
.exercise-counter {
    text-align: center;
    color: #666;
    font-size: 14px;
    margin-top: 10px;
}

.series-header {
    display: grid;
    grid-template-columns: 60px 1fr 1fr 80px;
    gap: 10px;
    padding: 10px;
    background: #f5f5f5;
    border-radius: 10px;
    margin-bottom: 10px;
    font-weight: 600;
    font-size: 14px;
    color: #666;
}

.series-row {
    display: grid;
    grid-template-columns: 60px 1fr 1fr 80px;
    gap: 10px;
    padding: 10px;
    align-items: center;
    transition: all 0.3s ease;
}

.series-number {
    font-weight: 700;
    font-size: 18px;
    color: var(--primary-color);
    text-align: center;
}

.series-weight, .series-reps {
    display: flex;
    align-items: center;
    gap: 5px;
}

.weight-adjust, .reps-adjust {
    width: 30px;
    height: 30px;
    border: 1px solid #ddd;
    background: white;
    border-radius: 5px;
    cursor: pointer;
    font-size: 16px;
    transition: all 0.2s;
}

.weight-adjust:hover, .reps-adjust:hover {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
}

.weight-input, .reps-input {
    flex: 1;
    text-align: center;
    font-size: 16px;
    font-weight: 600;
}

.exercise-info {
    margin-top: 20px;
    padding: 15px;
    background: #f0f7ff;
    border-radius: 10px;
    display: flex;
    justify-content: space-around;
    flex-wrap: wrap;
    gap: 15px;
}

.info-item {
    text-align: center;
}

.info-label {
    display: block;
    font-size: 12px;
    color: #666;
    margin-bottom: 5px;
}

.info-value {
    display: block;
    font-size: 18px;
    font-weight: 700;
    color: var(--primary-color);
}

.loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
}

.loading-spinner {
    background: white;
    padding: 30px;
    border-radius: 10px;
    font-weight: 600;
}

.workout-summary {
    display: flex;
    justify-content: center;
    gap: 30px;
    margin-top: 10px;
    padding: 10px;
    background: #f5f5f5;
    border-radius: 10px;
}

.summary-item {
    text-align: center;
}

.summary-label {
    font-size: 12px;
    color: #666;
    display: block;
}

.summary-value {
    font-size: 20px;
    font-weight: 700;
    color: var(--primary-color);
}

.series-row.completed {
    background: #e8f5e9;
    opacity: 0.8;
}

.series-row.completed .done-btn {
    background: #4caf50;
    color: white;
}

.check-icon {
    font-size: 18px;
}
</style>
`;

// ==================== EVENTOS ====================

document.addEventListener('DOMContentLoaded', async () => {
    // Adicionar estilos dinâmicos
    document.head.insertAdjacentHTML('beforeend', dynamicStyles);
    
    // Adicionar botões extras na tela home
    const scheduleDiv = document.querySelector('.schedule');
    if (scheduleDiv) {
        const extraButtons = document.createElement('div');
        extraButtons.className = 'extra-buttons';
        extraButtons.innerHTML = `
            <button class="secondary-btn" onclick="mostrarIndicadores()">📊 Indicadores</button>
            <button class="secondary-btn" onclick="replanejarSemana()">📅 Replanejar Semana</button>
        `;
        scheduleDiv.appendChild(extraButtons);
    }
    
    // Carregar usuários na tela de login
    const usuarios = await fetchUsuarios();
    renderUsuarios(usuarios);
    
    // Configurar eventos dos botões
    document.getElementById('logout-btn').addEventListener('click', logout);
    document.getElementById('start-workout-btn').addEventListener('click', iniciarTreino);
    document.getElementById('back-btn').addEventListener('click', voltarParaHome);
    document.getElementById('skip-rest-btn').addEventListener('click', pularDescanso);
    document.getElementById('finish-workout-btn').addEventListener('click', finalizarTreino);
});

// Exportar funções para ser usadas inline no HTML
window.finalizarSerie = finalizarSerie;
window.confirmWeekPlan = confirmWeekPlan;
window.mostrarIndicadores = mostrarIndicadores;
window.replanejarSemana = replanejarSemana;
window.ajustarPeso = ajustarPeso; // Nova função exportada
window.ajustarReps = ajustarReps; // Nova função exportada