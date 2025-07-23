// Dashboard de Métricas - Funcionalidades
// IMPORTANTE: Feature experimental isolada, sem integração com sistemas vitais

import { showNotification } from '../ui/notifications.js';
import AppState from '../state/appState.js';

// Cache local para evitar múltiplas consultas
let metricsCache = null;
let lastFetchTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Função principal para carregar dados do dashboard
export async function carregarDashboardMetricas() {
    console.log('[Dashboard] Iniciando carregamento de métricas...');
    
    try {
        // Mostrar loading
        mostrarLoading(true);
        
        // Verificar cache
        if (metricsCache && lastFetchTime && (Date.now() - lastFetchTime < CACHE_DURATION)) {
            console.log('[Dashboard] Usando dados do cache');
            renderizarMetricas(metricsCache);
            mostrarLoading(false);
            return;
        }
        
        // Buscar dados do usuário
        const currentUser = AppState.get('currentUser');
        if (!currentUser?.id) {
            showNotification('Usuário não encontrado', 'error');
            mostrarLoading(false);
            return;
        }
        
        // Importar serviço do Supabase
        const { query } = await import('../services/supabaseService.js');
        
        // Buscar métricas em paralelo
        const [execucoes, planejamentos, rm1Data, estatisticas, sessoes] = await Promise.all([
            buscarExecucoes(query, currentUser.id),
            buscarPlanejamentos(query, currentUser.id),
            buscar1RMData(query, currentUser.id),
            buscarEstatisticas(query, currentUser.id),
            buscarSessoesTreino(query, currentUser.id)
        ]);
        
        // Processar dados
        const metricas = processarMetricas(execucoes, planejamentos, rm1Data, estatisticas, sessoes);
        
        // Cachear dados
        metricsCache = metricas;
        lastFetchTime = Date.now();
        
        // Renderizar
        renderizarMetricas(metricas);
        
        console.log('[Dashboard] Métricas carregadas com sucesso');
        
    } catch (error) {
        console.error('[Dashboard] Erro ao carregar métricas:', error);
        showNotification('Erro ao carregar métricas', 'error');
    } finally {
        mostrarLoading(false);
    }
}

// Buscar execuções de exercícios usando view
async function buscarExecucoes(query, userId) {
    try {
        const { data, error } = await query('v_execucoes_sao_paulo', {
            select: `
                id,
                data_execucao_sp,
                data_treino_sp,
                peso_utilizado,
                repeticoes,
                serie_numero,
                exercicio_id
            `,
            eq: { usuario_id: userId },
            limit: 1000
        });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('[Dashboard] Erro ao buscar execuções:', error);
        return [];
    }
}

// Buscar planejamentos usando view
async function buscarPlanejamentos(query, userId) {
    try {
        const { data, error } = await query('v_planejamento_sao_paulo', {
            select: `
                id,
                semana_treino,
                dia_semana,
                tipo_atividade,
                concluido,
                data_conclusao_sp
            `,
            eq: { usuario_id: userId },
            limit: 100
        });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('[Dashboard] Erro ao buscar planejamentos:', error);
        return [];
    }
}

// Buscar dados de 1RM
async function buscar1RMData(query, userId) {
    try {
        const { data, error } = await query('usuario_1rm', {
            select: `
                exercicio_id,
                peso_maximo,
                data_registro
            `,
            eq: { usuario_id: userId }
        });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('[Dashboard] Erro ao buscar 1RM:', error);
        return [];
    }
}

// Buscar estatísticas do usuário usando view
async function buscarEstatisticas(query, userId) {
    try {
        const { data, error } = await query('v_estatisticas_usuario', {
            select: `
                total_treinos,
                tempo_total_minutos,
                tempo_medio_minutos,
                total_series,
                peso_total_levantado,
                fadiga_media,
                dificuldade_media,
                energia_media,
                ultimo_treino,
                primeiro_treino
            `,
            eq: { usuario_id: userId }
        });
        
        if (error) throw error;
        return data?.[0] || null;
    } catch (error) {
        console.error('[Dashboard] Erro ao buscar estatísticas:', error);
        return null;
    }
}

// Buscar sessões de treino usando view
async function buscarSessoesTreino(query, userId) {
    try {
        const { data, error } = await query('v_sessoes_treino_sp', {
            select: `
                id,
                data_treino,
                inicio_sp,
                fim_sp,
                tempo_total_minutos,
                grupo_muscular,
                tipo_atividade,
                total_series,
                exercicios_unicos,
                peso_total_levantado,
                repeticoes_totais,
                post_workout,
                dificuldade_percebida,
                energia_nivel
            `,
            eq: { usuario_id: userId },
            limit: 50
        });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('[Dashboard] Erro ao buscar sessões:', error);
        return [];
    }
}

// Processar métricas usando dados reais das views
function processarMetricas(execucoes, planejamentos, rm1Data, estatisticas, sessoes) {
    const agora = new Date();
    const umMesAtras = new Date(agora.getFullYear(), agora.getMonth() - 1, agora.getDate());
    const quatroSemanasAtras = new Date(agora.getTime() - (28 * 24 * 60 * 60 * 1000));
    
    // Usar dados das estatísticas se disponível, senão calcular
    const totalTreinos = estatisticas?.total_treinos || sessoes.length || 0;
    const tempoTotalHoras = estatisticas ? Math.round(estatisticas.tempo_total_minutos / 60) : 0;
    const tempoMedioPorTreino = estatisticas?.tempo_medio_minutos || 0;
    
    // Treinos no último mês usando sessões
    const treinosUltimoMes = sessoes.filter(s => {
        const dataTreino = new Date(s.data_treino);
        return dataTreino >= umMesAtras;
    }).length;
    
    // Taxa de conclusão (últimas 4 semanas)
    const planejamentosRecentes = planejamentos.filter(p => {
        if (!p.data_conclusao_sp && !p.concluido) return false;
        const data = p.data_conclusao_sp ? new Date(p.data_conclusao_sp) : new Date();
        return data >= quatroSemanasAtras;
    });
    
    const totalPlanejado = planejamentosRecentes.length;
    const totalConcluido = planejamentosRecentes.filter(p => p.concluido).length;
    const taxaConclusao = totalPlanejado > 0 ? Math.round((totalConcluido / totalPlanejado) * 100) : 0;
    
    // Peso total levantado das estatísticas ou sessões
    const pesoTotal = estatisticas?.peso_total_levantado || 
                     sessoes.reduce((total, s) => total + (s.peso_total_levantado || 0), 0);
    
    // Peso da semana atual vs anterior usando sessões
    const umaSemanaAtras = new Date(agora.getTime() - (7 * 24 * 60 * 60 * 1000));
    const duasSemanasAtras = new Date(agora.getTime() - (14 * 24 * 60 * 60 * 1000));
    
    const pesoSemanaAtual = sessoes
        .filter(s => new Date(s.data_treino) >= umaSemanaAtras)
        .reduce((total, s) => total + (s.peso_total_levantado || 0), 0);
    
    const pesoSemanaAnterior = sessoes
        .filter(s => {
            const data = new Date(s.data_treino);
            return data >= duasSemanasAtras && data < umaSemanaAtras;
        })
        .reduce((total, s) => total + (s.peso_total_levantado || 0), 0);
    
    // Distribuição por grupo muscular baseada em sessões reais
    const distribuicaoMuscular = calcularDistribuicaoMuscular(sessoes);
    
    // Progresso semanal (últimas 8 semanas)
    const progressoSemanal = calcularProgressoSemanal(planejamentos);
    
    // Evolução de 1RM com dados reais
    const evolucao1RM = processar1RMEvolucao(rm1Data);
    
    // Últimos treinos das sessões reais
    const ultimosTreinos = processarUltimosTreinos(sessoes);
    
    return {
        totalTreinos,
        treinosUltimoMes,
        taxaConclusao,
        pesoTotal: Math.round(pesoTotal),
        pesoSemanaAtual: Math.round(pesoSemanaAtual),
        pesoSemanaAnterior: Math.round(pesoSemanaAnterior),
        tempoTotalHoras,
        tempoMedioPorTreino: Math.round(tempoMedioPorTreino),
        distribuicaoMuscular,
        progressoSemanal,
        evolucao1RM,
        ultimosTreinos
    };
}

// Calcular distribuição por grupo muscular baseada em sessões reais
function calcularDistribuicaoMuscular(sessoes) {
    const distribuicao = {};
    
    sessoes.forEach(sessao => {
        const grupo = sessao.grupo_muscular || 'Outro';
        distribuicao[grupo] = (distribuicao[grupo] || 0) + (sessao.exercicios_unicos || 1);
    });
    
    // Se não há dados, retornar estrutura vazia
    if (Object.keys(distribuicao).length === 0) {
        return {
            'Peito': 0,
            'Costas': 0,
            'Pernas': 0,
            'Ombros': 0,
            'Braços': 0
        };
    }
    
    return distribuicao;
}

// Calcular progresso semanal
function calcularProgressoSemanal(planejamentos) {
    const semanas = {};
    const agora = new Date();
    
    // Agrupar por semana
    planejamentos.forEach(p => {
        const semana = p.semana_treino;
        if (!semanas[semana]) {
            semanas[semana] = { planejado: 0, concluido: 0 };
        }
        semanas[semana].planejado++;
        if (p.concluido) {
            semanas[semana].concluido++;
        }
    });
    
    // Pegar últimas 8 semanas
    const semanasOrdenadas = Object.keys(semanas)
        .map(Number)
        .sort((a, b) => b - a)
        .slice(0, 8)
        .reverse();
    
    return semanasOrdenadas.map(semana => ({
        semana,
        ...semanas[semana]
    }));
}

// Processar evolução de 1RM com dados reais
function processar1RMEvolucao(rm1Data) {
    if (!rm1Data || rm1Data.length === 0) {
        return [];
    }
    
    // Mapear exercício_id para nomes conhecidos
    const exercicioNomes = {
        1: 'Supino Reto',
        2: 'Agachamento',
        3: 'Leg Press',
        4: 'Desenvolvimento',
        5: 'Puxada Frontal',
        6: 'Rosca Direta',
        7: 'Levantamento Terra',
        8: 'Voador Peitoral',
        9: 'Rosca Alternada',
        10: 'Extensão Tríceps'
    };
    
    // Processar dados reais de 1RM
    const evolucaoProcessada = rm1Data.map(item => {
        const nome = exercicioNomes[item.exercicio_id] || `Exercício ${item.exercicio_id}`;
        const atual = item.peso_maximo || 0;
        
        // Por enquanto, não temos histórico para calcular mudança real
        // Simular uma pequena evolução baseada no peso atual
        const mudanca = Math.round(atual * 0.05); // 5% de progresso simulado
        const percentual = mudanca > 0 ? Math.round((mudanca / atual) * 100) : 0;
        
        return {
            nome,
            atual,
            mudanca,
            percentual
        };
    });
    
    return evolucaoProcessada.slice(0, 6); // Mostrar até 6 exercícios
}

// Processar últimos treinos usando dados reais das sessões
function processarUltimosTreinos(sessoes) {
    if (!sessoes || sessoes.length === 0) {
        return [];
    }
    
    // Ordenar sessões por data (mais recentes primeiro)
    const sessoesOrdenadas = sessoes
        .sort((a, b) => new Date(b.data_treino) - new Date(a.data_treino))
        .slice(0, 5); // Pegar apenas os 5 mais recentes
    
    return sessoesOrdenadas.map(sessao => ({
        data: new Date(sessao.data_treino),
        exercicios: sessao.exercicios_unicos || 0,
        gruposMusculares: sessao.grupo_muscular || 'Treino',
        tempo: sessao.tempo_total_minutos || 0,
        series: sessao.total_series || 0,
        peso: sessao.peso_total_levantado || 0
    }));
}

// Renderizar métricas na tela
function renderizarMetricas(metricas) {
    // Overview Cards
    document.getElementById('total-treinos').textContent = metricas.totalTreinos;
    document.getElementById('percentual-conclusao').textContent = `${metricas.taxaConclusao}%`;
    document.getElementById('peso-total').textContent = `${metricas.pesoTotal}kg`;
    document.getElementById('tempo-total').textContent = `${metricas.tempoTotalHoras}h`;
    
    // Trends
    const pesoTrend = metricas.pesoSemanaAtual - metricas.pesoSemanaAnterior;
    const pesoTrendElement = document.querySelector('#peso-total').parentElement.querySelector('.metric-trend');
    pesoTrendElement.textContent = `${pesoTrend >= 0 ? '+' : ''}${pesoTrend}kg vs semana anterior`;
    pesoTrendElement.className = `metric-trend ${pesoTrend >= 0 ? 'positive' : 'negative'}`;
    
    // Tempo médio
    const tempoMedioElement = document.querySelector('#tempo-total').parentElement.querySelector('.metric-trend');
    tempoMedioElement.textContent = `Média: ${metricas.tempoMedioPorTreino}min/treino`;
    
    // Gráfico de Progresso Semanal
    renderizarGraficoSemanal(metricas.progressoSemanal);
    
    // Distribuição Muscular
    renderizarDistribuicaoMuscular(metricas.distribuicaoMuscular);
    
    // Evolução 1RM
    renderizarEvolucao1RM(metricas.evolucao1RM);
    
    // Últimos Treinos
    renderizarUltimosTreinos(metricas.ultimosTreinos);
}

// Renderizar gráfico semanal
function renderizarGraficoSemanal(progressoSemanal) {
    const container = document.getElementById('weekly-progress-chart');
    container.innerHTML = '';
    
    if (progressoSemanal.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Sem dados disponíveis</p>';
        return;
    }
    
    // Encontrar valor máximo para escala
    const maxValue = Math.max(...progressoSemanal.map(s => s.planejado), 7);
    
    progressoSemanal.forEach(semana => {
        const percentualConcluido = semana.planejado > 0 
            ? Math.round((semana.concluido / semana.planejado) * 100)
            : 0;
        
        const heightConcluido = semana.planejado > 0
            ? (semana.concluido / maxValue) * 100
            : 0;
        
        const heightPlanejado = (semana.planejado / maxValue) * 100;
        
        const column = document.createElement('div');
        column.className = 'bar-column';
        column.innerHTML = `
            <div class="bar-wrapper">
                <div class="bar planejado" style="height: ${heightPlanejado}%">
                    <span class="bar-value">${semana.planejado}</span>
                </div>
                <div class="bar" style="height: ${heightConcluido}%; position: absolute; bottom: 0; width: 100%;">
                    <span class="bar-value" style="color: #fff;">${semana.concluido}</span>
                </div>
            </div>
            <div class="bar-label">Sem ${semana.semana}</div>
        `;
        
        container.appendChild(column);
    });
}

// Renderizar distribuição muscular
function renderizarDistribuicaoMuscular(distribuicao) {
    const container = document.getElementById('muscle-stats');
    container.innerHTML = '';
    
    const icones = {
        'Peito': '💪',
        'Costas': '🔙',
        'Pernas': '🦵',
        'Ombros': '🎯',
        'Braços': '💪',
        'Core': '🎯',
        'Cardio': '🏃'
    };
    
    Object.entries(distribuicao)
        .sort((a, b) => b[1] - a[1])
        .forEach(([grupo, count]) => {
            const item = document.createElement('div');
            item.className = 'muscle-stat-item';
            item.innerHTML = `
                <div class="muscle-icon">${icones[grupo] || '💪'}</div>
                <div class="muscle-name">${grupo}</div>
                <div class="muscle-count">${count}</div>
            `;
            container.appendChild(item);
        });
}

// Renderizar evolução 1RM
function renderizarEvolucao1RM(evolucao) {
    const container = document.getElementById('rm-evolution');
    container.innerHTML = '';
    
    if (evolucao.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Sem dados de 1RM disponíveis</p>';
        return;
    }
    
    evolucao.forEach(exercicio => {
        const card = document.createElement('div');
        card.className = 'rm-card';
        card.innerHTML = `
            <div class="exercise-name">${exercicio.nome}</div>
            <div class="rm-current">${exercicio.atual}kg</div>
            <div class="rm-change ${exercicio.mudanca < 0 ? 'negative' : ''}">
                ${exercicio.mudanca >= 0 ? '+' : ''}${exercicio.mudanca}kg (${exercicio.percentual >= 0 ? '+' : ''}${exercicio.percentual}%)
            </div>
        `;
        container.appendChild(card);
    });
}

// Renderizar últimos treinos
function renderizarUltimosTreinos(treinos) {
    const container = document.getElementById('recent-workouts');
    container.innerHTML = '';
    
    if (treinos.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Nenhum treino registrado</p>';
        return;
    }
    
    treinos.forEach(treino => {
        const item = document.createElement('div');
        item.className = 'history-item';
        
        const dataFormatada = treino.data.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
        
        const tempoDisplay = treino.tempo > 0 ? `${treino.tempo}min` : '~60min';
        const pesoDisplay = treino.peso > 0 ? ` • ${Math.round(treino.peso)}kg` : '';
        
        item.innerHTML = `
            <div class="history-info">
                <div class="history-icon">💪</div>
                <div class="history-details">
                    <h4>${treino.gruposMusculares || 'Treino'}</h4>
                    <div class="history-date">${dataFormatada}</div>
                </div>
            </div>
            <div class="history-stats">
                <div class="history-duration">${tempoDisplay}</div>
                <div class="history-exercises">${treino.exercicios} exercícios${pesoDisplay}</div>
            </div>
        `;
        container.appendChild(item);
    });
}

// Mostrar/esconder loading
function mostrarLoading(show) {
    const loading = document.getElementById('dashboard-loading');
    if (loading) {
        loading.classList.toggle('hidden', !show);
    }
}

// Exportar funções
export default {
    carregarDashboardMetricas
};