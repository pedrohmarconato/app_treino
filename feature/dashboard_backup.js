// js/features/dashboard.js - Dashboard completo com dados reais
import AppState from '../state/appState.js';
import { obterSemanaAtivaUsuario, carregarStatusSemanas } from '../services/weeklyPlanningService.js';
import { fetchMetricasUsuario } from '../services/userService.js';
import { getWorkoutIcon, getActionIcon, workoutTypeMap } from '../utils/icons.js';
import WeeklyPlanService from '../services/weeklyPlanningService.js';
// Import removido para compatibilidade com browser tradicional
// Use window.WeeklyPlanService.metodo() para acessar métodos
// Se precisar de funções globais, atribua manualmente abaixo
import homeService from '../services/homeService.js';
import { showNotification } from '../ui/notifications.js';
import { supabase, query } from '../services/supabaseService.js';
import TreinoExecutadoService from '../services/treinoExecutadoService.js';

// Mapear tipos de treino para ícones
const TREINO_ICONS = {
    'Peito': 'peito',
    'Costas': 'costas', 
    'Pernas': 'pernas',
    'Ombro e Braço': 'ombros',
    'Ombro': 'ombros',
    'Braço': 'bracos',
    'Cardio': 'cardio',
    'cardio': 'cardio',
    'folga': 'descanso',
    'A': 'peito',
    'B': 'costas',
    'C': 'pernas',
    'D': 'ombros'
};

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// Função auxiliar para formatar nome do treino
function formatarNomeTreino(treino) {
    if (!treino) return 'Sem treino';
    
    switch(treino.tipo) {
        case 'folga':
            return 'Dia de Folga';
        case 'cardio':
            return 'Treino Cardiovascular';
        default:
            return `Treino ${treino.tipo}`;
    }
}

// Função principal para carregar dashboard
// SISTEMA DE CACHE GLOBAL - CARREGA UMA VEZ E USA SEMPRE
let dadosGlobaisCache = {
    dados: null,
    timestamp: 0,
    usuario_id: null,
    semanaAtual: null,
    semanaExibida: null
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Carregar TODOS os dados necessários de uma vez
async function carregarDadosCompletos() {
    try {
        const currentUser = AppState.get('currentUser');
        if (!currentUser || !currentUser.id) {
            console.error('[carregarDadosCompletos] Usuário não encontrado');
            return null;
        }

        console.log('[carregarDadosCompletos] 🚀 Carregando todos os dados...');

        // Verificar cache
        const agora = Date.now();
        if (dadosGlobaisCache.dados && 
            dadosGlobaisCache.usuario_id === currentUser.id &&
            (agora - dadosGlobaisCache.timestamp) < CACHE_DURATION) {
            console.log('[carregarDadosCompletos] ✅ Usando cache existente');
            return dadosGlobaisCache.dados;
        }

        // Calcular ano e semana atual
        const hoje = new Date();
        const anoAtual = hoje.getFullYear();
        const semanaAtual = WeeklyPlanService.getWeekNumber(hoje);

        // Fazer UMA consulta para buscar dados de múltiplas semanas
        const { data: planejamentos, error } = await supabase
            .from('planejamento_semanal')
            .select('*')
            .eq('usuario_id', currentUser.id)
            .eq('ano', anoAtual)
            .gte('semana', Math.max(1, semanaAtual - 2))
            .lte('semana', semanaAtual + 2)
            .order('semana', { ascending: true })
            .order('dia_semana', { ascending: true });

        if (error) {
            console.error('[carregarDadosCompletos] Erro na consulta:', error);
            return null;
        }

        // Organizar dados por semana
        const dadosPorSemana = {};
        if (planejamentos && planejamentos.length > 0) {
            planejamentos.forEach(p => {
                if (!dadosPorSemana[p.semana]) {
                    dadosPorSemana[p.semana] = {};
                }
                // Converter dia_semana (1-7) para índice JS (0-6)
                const diaJS = p.dia_semana === 7 ? 0 : p.dia_semana;
                dadosPorSemana[p.semana][diaJS] = {
                    tipo: p.tipo_atividade,
                    tipo_atividade: p.tipo_atividade,
                    concluido: p.concluido,
                    semana_referencia: p.semana_referencia,
                    id: p.id
                };
            });
        }

        // Buscar semana ativa do usuário
        const semanaAtiva = await obterSemanaAtivaUsuario(currentUser.id);

        const dados = {
            planejamentos: dadosPorSemana,
            semanaAtual: semanaAtual,
            semanaAtiva: semanaAtiva?.semana_treino || semanaAtual,
            anoAtual: anoAtual,
            usuario_id: currentUser.id
        };

        // Salvar no cache
        dadosGlobaisCache = {
            dados: dados,
            timestamp: agora,
            usuario_id: currentUser.id,
            semanaAtual: semanaAtual,
            semanaExibida: semanaAtiva?.semana_treino || semanaAtual
        };

        console.log('[carregarDadosCompletos] ✅ Dados carregados:', dados);
        return dados;

    } catch (error) {
        console.error('[carregarDadosCompletos] ❌ Erro crítico:', error);
        return null;
    }
}

// REMOVIDO - função complexa desnecessária
// Agora usamos apenas carregarIndicadoresSemana diretamente

// NAVEGAÇÃO INSTANTÂNEA USANDO CACHE
function navegarSemana(direcao) {
    try {
        console.log(`[navegarSemana] Navegando ${direcao > 0 ? 'próxima' : 'anterior'} semana`);
        
        if (!dadosGlobaisCache.dados) {
            console.warn('[navegarSemana] Cache não carregado, ignorando navegação');
            return;
        }

        const semanaAtual = dadosGlobaisCache.semanaExibida || dadosGlobaisCache.dados.semanaAtual;
        const novaSemana = semanaAtual + direcao;
        
        // Verificar se temos dados para esta semana no cache
        if (!dadosGlobaisCache.dados.planejamentos[novaSemana]) {
            showNotification('Semana não disponível no cache', 'warning');
            return;
        }

        console.log(`[navegarSemana] ⚡ NAVEGAÇÃO INSTANTÂNEA para semana ${novaSemana}`);

        // Atualizar semana exibida no cache
        dadosGlobaisCache.semanaExibida = novaSemana;

        // Renderizar indicadores instantaneamente do cache
        renderizarIndicadoresDoCache(novaSemana);
        
        // Atualizar seletor
        atualizarSeletorSemanas();
        
        console.log(`[navegarSemana] ✅ Navegação para semana ${novaSemana} concluída`);

    } catch (error) {
        console.error('[navegarSemana] ❌ ERRO:', error);
        showNotification('Erro ao navegar entre semanas', 'error');
    }
}

// RENDERIZAR INDICADORES DIRETAMENTE DO CACHE - INSTANTÂNEO
function renderizarIndicadoresDoCache(semana) {
    try {
        const container = document.getElementById('week-indicators');
        if (!container || !dadosGlobaisCache.dados) {
            console.warn('[renderizarIndicadoresDoCache] Container ou cache não disponível');
            return;
        }

        const weekPlan = dadosGlobaisCache.dados.planejamentos[semana] || {};
        const hoje = new Date();
        const diaAtual = hoje.getDay();
        
        console.log(`[renderizarIndicadoresDoCache] ⚡ Renderizando semana ${semana} do cache`);
        
        let html = '';
        for (let i = 0; i < 7; i++) {
            const diaPlan = weekPlan[i];
            const isToday = i === diaAtual && semana === dadosGlobaisCache.dados.semanaAtual;
            const isCompleted = diaPlan?.concluido || false;
            
            // Determinar tipo e classe do dia
            let dayType = 'Configure';
            let dayClass = 'day-indicator';
            let icon = '';
            
            if (diaPlan && diaPlan.tipo) {
                const tipoTreino = diaPlan.tipo.toLowerCase();
                
                switch(tipoTreino) {
                    case 'folga':
                    case 'descanso':
                        dayType = 'Folga';
                        dayClass += ' rest-day';
                        icon = getWorkoutIcon('descanso', 'small');
                        break;
                    case 'cardio':
                    case 'cardiovascular':
                        dayType = 'Cardio';
                        dayClass += ' cardio-day';
                        icon = getWorkoutIcon('cardio', 'small');
                        break;
                    default:
                        dayType = diaPlan.tipo;
                        dayClass += ' workout-day';
                        icon = getWorkoutIcon(TREINO_ICONS[diaPlan.tipo] || 'peito', 'small');
                        break;
                }
            }
            
            // Classes adicionais
            if (isToday) dayClass += ' today';
            if (isCompleted) dayClass += ' completed';
            
            html += `
                <div class="${dayClass}">
                    <div class="day-name">${DIAS_SEMANA[i]}</div>
                    <div class="day-content">
                        ${icon ? `<span class="day-icon" style="
                                    display: inline-block;
                                    width: 24px;
                                    height: 24px;
                                    margin: 0 auto;
                                }
                            </style>
                            ${icon}
                        </span>` : ''}
                        ${dayType}
                    </div>
                </div>
            `;
        }
        
        container.innerHTML = html;
        console.log(`[renderizarIndicadoresDoCache] ✅ Semana ${semana} renderizada instantaneamente`);
        
    } catch (error) {
        console.error('[renderizarIndicadoresDoCache] ❌ Erro:', error);
    }
}

// Atualizar interface do seletor de semanas
function atualizarSeletorSemanas() {
    try {
        if (!dadosGlobaisCache.dados) return;

        const semanaExibida = dadosGlobaisCache.semanaExibida || dadosGlobaisCache.dados.semanaAtual;
        const weekNumber = document.getElementById('week-number');
        const weekStatus = document.getElementById('week-status');

        if (weekNumber) {
            weekNumber.textContent = `Semana ${semanaExibida}`;
        }

        if (weekStatus) {
            let statusText = 'Inativa';
            let statusClass = 'inativa';
            let statusIcon = getWorkoutIcon('navigation.calendar');

            if (semanaExibida === dadosGlobaisCache.dados.semanaAtual) {
                statusText = 'Atual';
                statusClass = 'atual';
                statusIcon = getWorkoutIcon('achievements.star');
            }

            weekStatus.innerHTML = `${statusIcon} ${statusText}`;
            weekStatus.className = `week-status ${statusClass}`;
        }

        // Controlar botões de navegação baseado no cache
        const weekPrev = document.getElementById('week-prev');
        const weekNext = document.getElementById('week-next');
        const weekToday = document.getElementById('week-today');

        if (weekPrev) {
            const temSemanaAnterior = dadosGlobaisCache.dados.planejamentos[semanaExibida - 1];
            weekPrev.disabled = !temSemanaAnterior;
            weekPrev.innerHTML = `${getWorkoutIcon('navigation.back')}`;
            weekPrev.title = temSemanaAnterior ? 'Semana anterior' : 'Não há semana anterior';
        }

        if (weekNext) {
            const temProximaSemana = dadosGlobaisCache.dados.planejamentos[semanaExibida + 1];
            weekNext.disabled = !temProximaSemana;
            weekNext.innerHTML = `${getWorkoutIcon('navigation.forward')}`;
            weekNext.title = temProximaSemana ? 'Próxima semana' : 'Não há próxima semana';
        }
        
        // Botão "Hoje" - mostrar apenas se não estiver na semana atual
        if (weekToday) {
            const isCurrentWeek = semanaExibida === dadosGlobaisCache.dados.semanaAtual;
            weekToday.style.display = isCurrentWeek ? 'none' : 'inline-block';
            weekToday.innerHTML = `${getWorkoutIcon('navigation.home')}`;
            weekToday.title = 'Voltar para semana atual';
            weekToday.className = 'week-today-btn';
        }

    } catch (error) {
        console.error('[atualizarSeletorSemanas] Erro:', error);
    }
}


// Configurar navegação entre semanas
function configurarNavegacaoSemanas() {
    try {
        console.log('[configurarNavegacaoSemanas] Configurando botões de navegação...');
        
        // Botão Hoje
        const weekToday = document.getElementById('week-today');
        if (weekToday) {
            weekToday.onclick = voltarParaSemanaAtual;
            console.log('[configurarNavegacaoSemanas] ✅ Botão "Hoje" configurado');
        }
        
        // Botão Anterior
        const weekPrev = document.getElementById('week-prev');
        if (weekPrev) {
            weekPrev.onclick = () => navegarSemana(-1);
            console.log('[configurarNavegacaoSemanas] ✅ Botão "Anterior" configurado');
        }
        
        // Botão Próximo
        const weekNext = document.getElementById('week-next');
        if (weekNext) {
            weekNext.onclick = () => navegarSemana(1);
            console.log('[configurarNavegacaoSemanas] ✅ Botão "Próximo" configurado');
        }
        
    } catch (error) {
        console.error('[configurarNavegacaoSemanas] Erro:', error);
    }
}

// Carregar dados dinâmicos da home usando homeService
async function carregarDadosDinamicosHome(ano = null, semana = null) {
    try {
        const currentUser = AppState.get('currentUser');
        if (!currentUser || !currentUser.id) return;

        console.log('[carregarDadosDinamicosHome] Carregando dados dinâmicos...');
        
        // Usar o homeService para carregar e atualizar dados
        // TODO: Atualizar homeService para aceitar ano/semana específicos
        const dados = await homeService.carregarDadosHome(currentUser.id);
        homeService.atualizarUIHome(dados);
        
        console.log('[carregarDadosDinamicosHome] ✅ Dados dinâmicos carregados');
    } catch (error) {
        console.error('[carregarDadosDinamicosHome] Erro:', error);
        // Não propagar erro para não quebrar o dashboard
    }
}

// Função para limpar todos os caches do dashboard
function limparCachesDashboard() {
    console.log('[limparCachesDashboard] Limpando cache global...');
    
    // Limpar cache global
    dadosGlobaisCache = {
        dados: null,
        timestamp: 0,
        usuario_id: null,
        semanaAtual: null,
        semanaExibida: null
    };
    
    // Limpar cache do WeeklyPlanService se disponível
    if (WeeklyPlanService.clearCache) {
        WeeklyPlanService.clearCache();
    }
    
    console.log('[limparCachesDashboard] ✅ Cache global limpo');
}

// Voltar para a semana atual
function voltarParaSemanaAtual() {
    try {
        if (!dadosGlobaisCache.dados) {
            console.warn('[voltarParaSemanaAtual] Cache não disponível');
            return;
        }

        const semanaAtual = dadosGlobaisCache.dados.semanaAtual;
        console.log(`[voltarParaSemanaAtual] ⚡ Voltando para semana atual: ${semanaAtual}`);

        // Atualizar semana exibida
        dadosGlobaisCache.semanaExibida = semanaAtual;

        // Renderizar indicadores do cache
        renderizarIndicadoresDoCache(semanaAtual);
        
        // Atualizar seletor
        atualizarSeletorSemanas();
        
        console.log(`[voltarParaSemanaAtual] ✅ Voltou para semana atual: ${semanaAtual}`);

    } catch (error) {
        console.error('[voltarParaSemanaAtual] ❌ Erro:', error);
    }
}

// Exportar função para debug  
export { navegarSemana, limparCachesDashboard, voltarParaSemanaAtual, renderizarIndicadoresDoCache, carregarDadosCompletos };

// Disponibilizar funções globalmente para debug
window.navegarSemana = navegarSemana;
window.voltarParaSemanaAtual = voltarParaSemanaAtual;
window.limparCachesDashboard = limparCachesDashboard;
window.carregarDadosCompletos = carregarDadosCompletos;
window.atualizarMetricasTempoReal = atualizarMetricasTempoReal;
window.recarregarDashboardLegacy = recarregarDashboardLegacy;

// Função de teste completo do sistema
window.testeCompletoSistema = async function() {
    console.log('🧪 [testeCompletoSistema] TESTE COMPLETO DO DASHBOARD OTIMIZADO');
    
    const resultados = {
        sintaxe: true,
        funcoes: {},
        navegacao: {},
        cache: {}
    };
    
    try {
        // 1. Testar se as funções principais existem
        console.log('1️⃣ Testando existência das funções...');
        
        const funcoesEssenciais = [
            'carregarDadosCompletos',
            'navegarSemana', 
            'voltarParaSemanaAtual',
            'renderizarIndicadoresDoCache',
            'limparCachesDashboard'
        ];
        
        funcoesEssenciais.forEach(funcao => {
            resultados.funcoes[funcao] = typeof window[funcao] === 'function';
            console.log(`   ${resultados.funcoes[funcao] ? '✅' : '❌'} ${funcao}`);
        });
        
        // 2. Testar cache
        console.log('2️⃣ Testando sistema de cache...');
        resultados.cache.temCache = !!dadosGlobaisCache.dados;
        resultados.cache.usuario = dadosGlobaisCache.usuario_id;
        resultados.cache.timestamp = dadosGlobaisCache.timestamp;
        
        console.log(`   Cache carregado: ${resultados.cache.temCache ? '✅' : '❌'}`);
        if (resultados.cache.temCache) {
            console.log(`   Usuário: ${resultados.cache.usuario}`);
            console.log(`   Timestamp: ${new Date(resultados.cache.timestamp).toLocaleString()}`);
        }
        
        // 3. Testar navegação se cache disponível
        if (resultados.cache.temCache) {
            console.log('3️⃣ Testando navegação...');
            
            const semanaOriginal = dadosGlobaisCache.semanaExibida;
            console.log(`   Semana original: ${semanaOriginal}`);
            
            // Tentar navegar para próxima semana
            try {
                navegarSemana(1);
                resultados.navegacao.proxima = dadosGlobaisCache.semanaExibida === (semanaOriginal + 1);
                console.log(`   Navegação próxima: ${resultados.navegacao.proxima ? '✅' : '❌'}`);
                
                // Voltar para original
                navegarSemana(-1);
                resultados.navegacao.voltar = dadosGlobaisCache.semanaExibida === semanaOriginal;
                console.log(`   Voltar: ${resultados.navegacao.voltar ? '✅' : '❌'}`);
                
            } catch (error) {
                console.log(`   ❌ Erro na navegação: ${error.message}`);
                resultados.navegacao.erro = error.message;
            }
        }
        
        // 4. Resumo final
        console.log('📊 RESUMO DO TESTE:');
        const todasFuncoesOk = Object.values(resultados.funcoes).every(Boolean);
        const navegacaoOk = resultados.navegacao.proxima && resultados.navegacao.voltar;
        
        console.log(`   Funções: ${todasFuncoesOk ? '✅' : '❌'}`);
        console.log(`   Cache: ${resultados.cache.temCache ? '✅' : '❌'}`);
        console.log(`   Navegação: ${navegacaoOk ? '✅' : '❌'}`);
        
        const sistemaOk = todasFuncoesOk && resultados.cache.temCache && navegacaoOk;
        
        if (sistemaOk) {
            console.log('🎉 SISTEMA COMPLETAMENTE FUNCIONAL!');
            showNotification('🎉 Dashboard otimizado 100% funcional!', 'success');
        } else {
            console.log('⚠️ Sistema com problemas');
            showNotification('⚠️ Sistema com problemas', 'warning');
        }
        
        return resultados;
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
        showNotification('❌ Erro no teste: ' + error.message, 'error');
        return { ...resultados, erro: error.message };
    }
};

// Função de teste para verificar o sistema
window.testarDashboardOtimizado = function() {
    console.log('🧪 [testarDashboardOtimizado] TESTANDO SISTEMA OTIMIZADO');
    
    const resultado = {
        cache: !!dadosGlobaisCache.dados,
        timestamp: dadosGlobaisCache.timestamp,
        usuario: dadosGlobaisCache.usuario_id,
        semanaAtual: dadosGlobaisCache.dados?.semanaAtual,
        semanaExibida: dadosGlobaisCache.semanaExibida,
        totalSemanas: Object.keys(dadosGlobaisCache.dados?.planejamentos || {}).length,
        navegacaoRapida: true,
        sintaxeOk: true // Se chegou até aqui, a sintaxe está OK
    };
    
    console.log('📊 Status do Cache Global:', resultado);
    
    if (resultado.cache) {
        console.log('✅ Sistema funcionando com CACHE GLOBAL!');
        console.log('⚡ Navegação INSTANTÂNEA habilitada!');
        showNotification('✅ Dashboard otimizado funcionando!', 'success');
    } else {
        console.log('❌ Cache não carregado - Execute carregarDadosCompletos() primeiro');
        showNotification('⚠️ Cache não carregado', 'warning');
    }
    
    return resultado;
};

// Função para recarregar dados
window.recarregarDadosDashboard = async function() {
    console.log('🔄 [recarregarDadosDashboard] Recarregando dados...');
    
    try {
        // Limpar cache
        limparCachesDashboard();
        
        // Recarregar dados
        const dados = await carregarDadosCompletos();
        
        if (dados) {
            console.log('✅ Dados recarregados com sucesso!');
            showNotification('✅ Dados recarregados!', 'success');
            
            // Renderizar interface
            const semanaExibir = dados.semanaAtiva || dados.semanaAtual;
            renderizarIndicadoresDoCache(semanaExibir);
            atualizarSeletorSemanas();
            
            return dados;
        } else {
            console.log('❌ Falha ao recarregar dados');
            showNotification('❌ Falha ao recarregar', 'error');
            return null;
        }
        
    } catch (error) {
        console.error('[recarregarDadosDashboard] Erro:', error);
        showNotification('❌ Erro: ' + error.message, 'error');
        return null;
    }
};

export async function carregarDashboard() {
    console.log('[carregarDashboard] 🚀 INICIANDO carregamento com cache global...');
    
    try {
        const currentUser = AppState.get('currentUser');
        if (!currentUser || !currentUser.id) {
            console.error('[carregarDashboard] ❌ Usuário não está definido ou sem ID');
            showNotification('Usuário não está logado. Faça login novamente.', 'error');
            return;
        }

        console.log('[carregarDashboard] ✅ Carregando para usuário:', currentUser.nome, `(ID: ${currentUser.id})`);

        // 1. CARREGAR TODOS OS DADOS DE UMA VEZ
        const dados = await carregarDadosCompletos();
        if (!dados) {
            console.error('[carregarDashboard] ❌ Falha ao carregar dados');
            showNotification('Erro ao carregar dados do planejamento', 'error');
            return;
        }

        // 2. RENDERIZAR INTERFACE DO CACHE
        const semanaExibir = dados.semanaAtiva || dados.semanaAtual;
        dadosGlobaisCache.semanaExibida = semanaExibir;
        
        // Renderizar indicadores instantaneamente do cache
        renderizarIndicadoresDoCache(semanaExibir);
        
        // Atualizar seletor
        atualizarSeletorSemanas();
        
        // 3. CARREGAR TREINO ATUAL
        await carregarTreinoAtualDoCache();

        // 4. CONFIGURAR FUNCIONALIDADES
        configurarBotaoIniciar();
        configurarEventListeners();
        configurarNavegacaoSemanas();
        
        // 5. CARREGAR DADOS SECUNDÁRIOS EM BACKGROUND
        setTimeout(async () => {
            try {
                await Promise.all([
                    carregarMetricasUsuario(),
                    carregarExerciciosDoDia(),
                    carregarEstatisticasAvancadas(),
                    carregarDadosDinamicosHome()
                ]);
            } catch (error) {
                console.warn('[carregarDashboard] Erro em carregamentos secundários:', error);
            }
        }, 100);
        
        console.log('[carregarDashboard] ✅ Dashboard carregado com CACHE GLOBAL!');
        
    } catch (error) {
        console.error('[carregarDashboard] ❌ ERRO CRÍTICO:', error);
        showNotification('Erro crítico ao carregar dashboard: ' + error.message, 'error');
    }
}

// CARREGAR TREINO ATUAL DO CACHE GLOBAL
async function carregarTreinoAtualDoCache() {
    try {
        if (!dadosGlobaisCache.dados) {
            console.warn('[carregarTreinoAtualDoCache] Cache não disponível');
            return;
        }

        const hoje = new Date();
        const diaAtual = hoje.getDay();
        const semanaAtual = dadosGlobaisCache.dados.semanaAtual;
        
        // Buscar treino de hoje no cache
        const planejamentoSemana = dadosGlobaisCache.dados.planejamentos[semanaAtual];
        const treinoHoje = planejamentoSemana?.[diaAtual];
        
        if (!treinoHoje) {
            console.warn('[carregarTreinoAtualDoCache] Nenhum treino encontrado para hoje');
            atualizarUITreinoAtual(null);
            return;
        }

        // Formatar treino
        const treinoFormatado = {
            tipo: treinoHoje.tipo_atividade || treinoHoje.tipo,
            nome: formatarNomeTreino(treinoHoje),
            grupo_muscular: treinoHoje.tipo_atividade || treinoHoje.tipo,
            concluido: treinoHoje.concluido
        };

        // Atualizar UI
        atualizarUITreinoAtual(treinoFormatado);
        
        console.log('[carregarTreinoAtualDoCache] ✅ Treino atual carregado do cache:', treinoFormatado.nome);
        
    } catch (error) {
        console.error('[carregarTreinoAtualDoCache] ❌ Erro:', error);
        atualizarUITreinoAtual(null);
    }
}

// VERSÃO SIMPLIFICADA - USA APENAS O CACHE GLOBAL
// Esta função agora só existe para compatibilidade, mas usa o cache global
async function carregarIndicadoresSemana(ano = null, semana = null) {
    console.log('[carregarIndicadoresSemana] ⚡ USANDO CACHE GLOBAL');
    
    if (!dadosGlobaisCache.dados) {
        console.warn('[carregarIndicadoresSemana] Cache não disponível, carregando dados...');
        await carregarDadosCompletos();
    }
    
    const semanaParaExibir = semana || dadosGlobaisCache.semanaExibida || dadosGlobaisCache.dados?.semanaAtual;
    if (semanaParaExibir) {
        renderizarIndicadoresDoCache(semanaParaExibir);
    } else {
        console.warn('[carregarIndicadoresSemana] Não foi possível determinar semana para exibir');
    }

// VERSÃO SIMPLIFICADA - USA APENAS O CACHE GLOBAL  
async function carregarTreinoAtual() {
    console.log('[carregarTreinoAtual] ⚡ USANDO CACHE GLOBAL');
    
    if (!dadosGlobaisCache.dados) {
        console.warn('[carregarTreinoAtual] Cache não disponível');
        return;
    }
    
    await carregarTreinoAtualDoCache();
}

// Função auxiliar para formatar nome do treino completo
function formatarNomeTreinoCompleto(treino) {
    if (!treino) return 'Sem treino';
    
    const tipo = treino.tipo_atividade || treino.tipo;
    
    switch(tipo?.toLowerCase()) {
        case 'folga':
            return 'Dia de Folga';
        case 'cardio':
            return 'Treino Cardiovascular';
        default:
            return `Treino ${tipo}`;
    }
}

// Função auxiliar para calcular duração estimada
function calcularDuracaoEstimada(exercicios) {
    if (!exercicios || exercicios.length === 0) return 0;
    
    // Cálculo baseado em: (séries × tempo_descanso) + (séries × 30s execução) por exercício
    const duracaoTotal = exercicios.reduce((total, exercicio) => {
        const series = exercicio.series || 3;
        const descanso = exercicio.tempo_descanso || 60;
        const tempoExecucao = 30; // segundos estimados por série
        
        return total + (series * (descanso + tempoExecucao));
    }, 0);
    
    // Retornar em minutos
    return Math.round(duracaoTotal / 60);
}

// Função atualizada para UI do treino atual com informações completas
function atualizarUITreinoAtualCompleto(treino) {
    const workoutTypeEl = document.getElementById('workout-type');
    const workoutNameEl = document.getElementById('workout-name');
    const workoutExercisesEl = document.getElementById('workout-exercises');
    const btnTextEl = document.getElementById('btn-text');
    const progressTextEl = document.getElementById('workout-progress-text');
    const progressCircleEl = document.getElementById('workout-progress-circle');
    
    if (!treino) {
        // Fallback para função original se não há treino
        atualizarUITreinoAtual(null);
        return;
    }
    
    // Configurar baseado no tipo de treino
    switch(treino.tipo?.toLowerCase()) {
        case 'folga':
            updateElement(workoutTypeEl, 'Descanso');
            updateElement(workoutNameEl, 'Dia de Folga');
            updateElement(workoutExercisesEl, 'Repouso e recuperação');
            updateElement(btnTextEl, 'Dia de Descanso');
            updateElement(progressTextEl, '😴');
            break;
            
        case 'cardio':
            updateElement(workoutTypeEl, 'Cardio');
            updateElement(workoutNameEl, 'Treino Cardiovascular');
            updateElement(workoutExercisesEl, 'Exercícios aeróbicos • 30-45min');
            updateElement(btnTextEl, 'Iniciar Cardio');
            updateElement(progressTextEl, getWorkoutIcon('cardio', 'small'));
            break;
            
        default:
            // Treino de força com informações detalhadas
            const grupoMuscular = treino.grupo_muscular;
            const icon = getWorkoutIcon(TREINO_ICONS[grupoMuscular] || 'peito', 'small');
            
            updateElement(workoutTypeEl, `Treino ${grupoMuscular}`);
            updateElement(workoutNameEl, treino.nome);
            updateElement(workoutExercisesEl, 
                `${treino.total_exercicios} exercícios • ${treino.duracao_estimada}min • ${grupoMuscular}`
            );
            updateElement(btnTextEl, 'Iniciar Treino');
            updateElement(progressTextEl, icon);
            break;
    }
    
    // Atualizar progresso circular se necessário
    if (progressCircleEl && treino.tipo?.toLowerCase() !== 'folga') {
        const hoje = new Date().getDay();
        const progressoSemanal = Math.min((hoje / 7) * 100, 100);
        const offset = 251.2 - (progressoSemanal / 100) * 251.2;
        progressCircleEl.style.strokeDashoffset = offset.toString();
        
        if (treino.tipo?.toLowerCase() === 'cardio') {
            updateElement(progressTextEl, `${Math.round(progressoSemanal)}%`);
        }
    }
}

// Atualizar UI do treino atual
function atualizarUITreinoAtual(treino) {
    const workoutTypeEl = document.getElementById('workout-type');
    const workoutNameEl = document.getElementById('workout-name');
    const workoutExercisesEl = document.getElementById('workout-exercises');
    const btnTextEl = document.getElementById('btn-text');
    const progressTextEl = document.getElementById('workout-progress-text');
    const progressCircleEl = document.getElementById('workout-progress-circle');
    
    if (!treino) {
        // Sem treino configurado
        updateElement(workoutTypeEl, 'Configure');
        updateElement(workoutNameEl, 'Nenhum treino configurado');
        updateElement(workoutExercisesEl, 'Configure seu planejamento');
        updateElement(btnTextEl, 'Configurar Planejamento');
        updateElement(progressTextEl, '0%');
        
        if (progressCircleEl) {
            progressCircleEl.style.strokeDashoffset = '251.2';
        }
        return;
    }
    
    // Configurar baseado no tipo de treino
    switch(treino.tipo) {
        case 'folga':
            updateElement(workoutTypeEl, 'Descanso');
            updateElement(workoutNameEl, 'Dia de Folga');
            updateElement(workoutExercisesEl, 'Repouso e recuperação');
            updateElement(btnTextEl, 'Dia de Descanso');
            updateElement(progressTextEl, '😴');
            break;
            
        case 'cardio':
        case 'Cardio':
            updateElement(workoutTypeEl, 'Cardio');
            updateElement(workoutNameEl, 'Treino Cardiovascular');
            updateElement(workoutExercisesEl, 'Exercícios aeróbicos • 30-45min');
            updateElement(btnTextEl, 'Iniciar Cardio');
            updateElement(progressTextEl, getWorkoutIcon('cardio', 'small'));
            break;
            
        default:
            // Treino de força
            const grupoMuscular = treino.tipo;
            const icon = getWorkoutIcon(TREINO_ICONS[grupoMuscular] || 'peito', 'small');
            updateElement(workoutTypeEl, `Treino ${grupoMuscular}`);
            updateElement(workoutNameEl, `Treino ${grupoMuscular}`);
            updateElement(workoutExercisesEl, `Força • ${grupoMuscular} • ~45min`);
            updateElement(btnTextEl, 'Iniciar Treino');
            updateElement(progressTextEl, icon);
            break;
    }
    
    // Simular progresso baseado no dia da semana
    const hoje = new Date().getDay();
    const progressoSemanal = Math.min((hoje / 7) * 100, 100);
    
    if (progressCircleEl && treino.tipo !== 'folga') {
        const offset = 251.2 - (progressoSemanal / 100) * 251.2;
        progressCircleEl.style.strokeDashoffset = offset.toString();
        
        if (treino.tipo === 'cardio' || treino.tipo === 'Cardio') {
            updateElement(progressTextEl, `${Math.round(progressoSemanal)}%`);
        }
    }
}

// Carregar métricas do usuário
async function carregarMetricasUsuario() {
    try {
        const currentUser = AppState.get('currentUser');
        
        if (!currentUser || !currentUser.id) {
            console.error('[carregarMetricasUsuario] ❌ currentUser é null ou sem ID');
            console.log('[carregarMetricasUsuario] currentUser atual:', currentUser);
            throw new Error('Usuário não está definido para carregar métricas');
        }
        
        // Tentar buscar métricas reais do banco
        let metricas = null;
        try {
            // Primeiro tentar do WorkoutProtocolService
            const { WorkoutProtocolService } = await import('../services/workoutProtocolService.js');
            const estatisticas = await WorkoutProtocolService.obterEstatisticasUsuario(currentUser.id);
            
            if (estatisticas) {
                metricas = {
                    treinosConcluidos: estatisticas.total_treinos_realizados || 0,
                    semanaAtual: estatisticas.semana_atual || 1,
                    progresso: estatisticas.percentual_progresso || 0
                };
                console.log('[carregarMetricasUsuario] ✅ Métricas carregadas do Supabase:', metricas);
            }
        } catch (error) {
            console.warn('[carregarMetricasUsuario] Erro ao buscar do WorkoutProtocolService:', error);
            
            // Fallback para userService
            try {
                metricas = await fetchMetricasUsuario(currentUser.id);
                console.log('[carregarMetricasUsuario] ✅ Métricas carregadas do userService:', metricas);
            } catch (fallbackError) {
                console.warn('[carregarMetricasUsuario] Erro no fallback userService:', fallbackError);
            }
        }
        
        // Se não conseguiu carregar, é um erro real
        if (!metricas) {
            console.error('[carregarMetricasUsuario] ❌ FALHA: Não foi possível carregar métricas do Supabase');
            throw new Error('Não foi possível carregar métricas do usuário do banco de dados');
        }
        
        // Atualizar elementos da UI
        updateElement('completed-workouts', metricas.treinosConcluidos || 0);
        updateElement('current-week', metricas.semanaAtual || 1);
        updateElement('progress-percentage', `${Math.round(metricas.progresso || 0)}%`);
        
        // Atualizar barra de progresso do usuário
        const userProgressBar = document.getElementById('user-progress-bar');
        if (userProgressBar) {
            const progressWidth = Math.min((metricas.treinosConcluidos / 4) * 100, 100);
            userProgressBar.style.width = `${progressWidth}%`;
        }
        
        updateElement('user-workouts', metricas.treinosConcluidos || 0);
        
        // Salvar métricas no estado
        AppState.set('userMetrics', metricas);
        
        console.log('[carregarMetricasUsuario] ✅ Métricas carregadas:', metricas);
        
    } catch (error) {
        console.error('[carregarMetricasUsuario] ❌ ERRO CRÍTICO:', error);
        showNotification('Erro ao carregar métricas do usuário: ' + error.message, 'error');
        throw error; // Propagar o erro
    }
}

// Carregar e renderizar planejamento semanal
async function carregarPlanejamentoSemanal() {
    try {
        const currentUser = AppState.get('currentUser');
        
        if (!currentUser || !currentUser.id) {
            console.error('[carregarPlanejamentoSemanal] ❌ currentUser é null ou sem ID');
            console.log('[carregarPlanejamentoSemanal] currentUser atual:', currentUser);
            throw new Error('Usuário não está definido para carregar planejamento semanal');
        }
        
        const container = document.getElementById('weekly-plan-list');
        if (!container) {
            // Container não existe na nova estrutura da home - usar indicadores da semana em vez disso
            console.log('[carregarPlanejamentoSemanal] Container weekly-plan-list não encontrado - usando indicadores da semana');
            return;
        }
        
        // Usar serviço unificado para buscar planejamento
        const weekPlan = await WeeklyPlanService.getPlan(currentUser.id);
        const hoje = new Date();
        const diaAtual = hoje.getDay();
        
        console.log('[carregarPlanejamentoSemanal] Plano semanal:', weekPlan);
        
        if (!weekPlan) {
            container.innerHTML = `
                <div class="plan-item">
                    <div class="plan-day">Planejamento</div>
                    <div class="plan-activity">Não configurado</div>
                    <div class="plan-status pending">Configure</div>
                </div>
            `;
            return;
        }
        
        let html = '';
        
        for (let i = 0; i < 7; i++) {
            const diaPlan = weekPlan[i];
            const isToday = i === diaAtual;
            const isCompleted = diaPlan?.concluido || false;
            
            let atividade = 'Sem Plano';
            let statusClass = 'pending';
            let statusText = 'Pendente';
            
            if (diaPlan) {
                if (diaPlan.categoria === 'folga') {
                    atividade = 'Folga';
                } else if (diaPlan.categoria === 'cardio') {
                    atividade = 'Treino Cardiovascular';
                } else if (diaPlan.categoria === 'treino') {
                    atividade = `Treino ${diaPlan.tipo}`;
                } else {
                    atividade = 'Treino';
                }
            }
            
            if (isCompleted) {
                statusClass = 'completed';
                statusText = 'Concluído';
            } else if (isToday) {
                statusClass = 'today';
                statusText = 'Hoje';
            } else if (diaPlan) {
                statusClass = 'pending';
                statusText = 'Planejado';
            }
            
            html += `
                <div class="plan-item">
                    <div class="plan-day">${DIAS_SEMANA[i]}</div>
                    <div class="plan-activity">${atividade}</div>
                    <div class="plan-status ${statusClass}">${statusText}</div>
                </div>
            `;
        }
        
        container.innerHTML = html;
        console.log('[carregarPlanejamentoSemanal] ✅ Planejamento semanal carregado do Supabase');
        
    } catch (error) {
        console.error('[carregarPlanejamentoSemanal] ❌ ERRO CRÍTICO:', error);
        
        const container = document.getElementById('weekly-plan-list');
        if (container) {
            container.innerHTML = `
                <div class="plan-item">
                    <div class="plan-day">Erro</div>
                    <div class="plan-activity">${error.message}</div>
                    <div class="plan-status pending">❌</div>
                </div>
            `;
        }
        
        showNotification('Erro ao carregar planejamento semanal: ' + error.message, 'error');
        // Não propagar erro para não quebrar o dashboard todo
    }
}

// Carregar exercícios do dia com informações detalhadas
async function carregarExerciciosDoDia() {
    try {
        const currentUser = AppState.get('currentUser');
        
        if (!currentUser || !currentUser.id) {
            console.error('[carregarExerciciosDoDia] ❌ currentUser é null ou sem ID');
            return;
        }
        
        const container = document.getElementById('workout-exercises-list');
        if (!container) {
            console.warn('[carregarExerciciosDoDia] Container workout-exercises-list não encontrado');
            return;
        }

        // Usar nossa nova implementação para buscar exercícios
        const resultado = await WeeklyPlanService.buscarExerciciosTreinoDia(currentUser.id);
        
        console.log('[carregarExerciciosDoDia] 📊 Resultado da busca:', resultado);
        
        if (resultado.error) {
            console.log('[carregarExerciciosDoDia] ⚠️', resultado.error);
            mostrarMensagemExercicios(resultado.error, 'warning', container);
            return;
        }
        
        if (resultado.message) {
            console.log('[carregarExerciciosDoDia] 📝', resultado.message);
            mostrarMensagemExercicios(resultado.message, 'info', container);
            return;
        }
        
        if (resultado.data && resultado.data.length > 0) {
            console.log('[carregarExerciciosDoDia] ✅ Exercícios encontrados:', resultado.data.length);
            
            // Expandir automaticamente o card quando há exercícios
            const expandableContent = document.getElementById('expandable-content');
            if (expandableContent) {
                expandableContent.style.display = 'block';
                
                // Atualizar ícone do toggle também
                const toggleButton = document.getElementById('workout-toggle');
                const expandIcon = toggleButton?.querySelector('.expand-icon');
                if (expandIcon) {
                    expandIcon.style.transform = 'rotate(180deg)';
                }
                
                console.log('[carregarExerciciosDoDia] Card de treino expandido automaticamente');
            }
            
            renderizarExercicios(resultado.data, resultado.planejamento, container);
            return;
        }
        
        // Fallback: mostrar mensagem de nenhum exercício encontrado
        mostrarMensagemExercicios('Nenhum exercício encontrado para hoje', 'info', container);
        
    } catch (error) {
        console.error('[carregarExerciciosDoDia] ❌ ERRO:', error);
        if (container) {
            mostrarMensagemExercicios('Erro ao carregar exercícios', 'error', container);
        }
    }
}

// Função para renderizar card de exercício individual
function renderizarExercicioCard(exercicio, index) {
    const pesos = exercicio.pesos_sugeridos;
    const percentuais = pesos?.percentuais || { base: 70, min: 65, max: 75 };
    const pesoBase = pesos?.peso_base || 0;
    const pesoMin = pesos?.peso_minimo || 0;
    const pesoMax = pesos?.peso_maximo || 0;
    
    return `
        <div class="exercise-preview-card ${index === 0 ? 'first-exercise' : ''}">
            <div class="exercise-preview-header">
                <div>
                    <div class="exercise-name">
                        <span class="exercise-number">${index + 1}.</span>
                        ${exercicio.exercicio_nome}
                    </div>
                    <div class="exercise-group">
                        ${exercicio.exercicio_grupo} • ${exercicio.exercicio_equipamento}
                    </div>
                </div>
                <div class="exercise-rm-info">
                    <span class="rm-badge">${percentuais.base}% 1RM</span>
                </div>
            </div>
            
            <div class="exercise-weight-range">
                <div class="weight-indicator">
                    <span class="weight-min">${pesoMin}kg</span>
                    <div class="weight-bar">
                        <div class="weight-range-fill" 
                             style="width: ${pesoMax > pesoMin ? ((pesoBase - pesoMin) / (pesoMax - pesoMin)) * 100 : 50}%">
                        </div>
                        <div class="weight-target" 
                             style="left: ${pesoMax > pesoMin ? ((pesoBase - pesoMin) / (pesoMax - pesoMin)) * 100 : 50}%">
                        </div>
                    </div>
                    <span class="weight-max">${pesoMax}kg</span>
                </div>
                <div class="weight-target-label">Alvo: ${pesoBase}kg</div>
            </div>
            
            <div class="exercise-preview-details">
                <div class="exercise-detail">
                    <div class="exercise-detail-label">Séries</div>
                    <div class="exercise-detail-value">${exercicio.series || 3}</div>
                </div>
                <div class="exercise-detail">
                    <div class="exercise-detail-label">Repetições</div>
                    <div class="exercise-detail-value">${exercicio.repeticoes_alvo || 10}</div>
                </div>
                <div class="exercise-detail">
                    <div class="exercise-detail-label">Descanso</div>
                    <div class="exercise-detail-value">${Math.floor((exercicio.tempo_descanso || 60) / 60)}min</div>
                </div>
                <div class="exercise-detail">
                    <div class="exercise-detail-label">Volume</div>
                    <div class="exercise-detail-value">
                        ${Math.round(pesoBase * (exercicio.series || 3) * (exercicio.repeticoes_alvo || 10))}kg
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Funções auxiliares de renderização
function renderizarDiaDescanso(container) {
    container.innerHTML = `
        <div class="exercise-preview-card rest-day-card">
            <div class="exercise-preview-header">
                <div>
                    <div class="exercise-name">Dia de Descanso</div>
                    <div class="exercise-group">Recuperação muscular ativa</div>
                </div>
                <div class="exercise-rm-info">
                    <span class="rest-icon">😴</span>
                </div>
            </div>
            <div class="rest-day-suggestions">
                <div class="suggestion-item">
                    <span class="suggestion-icon">🧘</span>
                    <span>Alongamento leve</span>
                </div>
                <div class="suggestion-item">
                    <span class="suggestion-icon">🚶</span>
                    <span>Caminhada relaxante</span>
                </div>
                <div class="suggestion-item">
                    <span class="suggestion-icon">💧</span>
                    <span>Hidratação adequada</span>
                </div>
                <div class="suggestion-item">
                    <span class="suggestion-icon">😴</span>
                    <span>8+ horas de sono</span>
                </div>
            </div>
        </div>
    `;
}

function renderizarTreinoCardio(container) {
    const cardioSuggestions = [
        { name: 'Esteira', duration: '20-30min', intensity: 'Moderada', calories: '200-300' },
        { name: 'Bicicleta', duration: '25-35min', intensity: 'Moderada', calories: '250-350' },
        { name: 'Elíptico', duration: '20-25min', intensity: 'Moderada-Alta', calories: '220-320' },
        { name: 'Remo', duration: '15-20min', intensity: 'Alta', calories: '180-280' }
    ];
    
    let html = '';
    cardioSuggestions.forEach(cardio => {
        html += `
            <div class="exercise-preview-card">
                <div class="exercise-preview-header">
                    <div>
                        <div class="exercise-name">${cardio.name}</div>
                        <div class="exercise-group">Exercício Cardiovascular</div>
                    </div>
                    <div class="exercise-rm-info">
                        <span class="cardio-badge">${cardio.intensity}</span>
                    </div>
                </div>
                <div class="exercise-preview-details">
                    <div class="exercise-detail">
                        <div class="exercise-detail-label">Duração</div>
                        <div class="exercise-detail-value">${cardio.duration}</div>
                    </div>
                    <div class="exercise-detail">
                        <div class="exercise-detail-label">Intensidade</div>
                        <div class="exercise-detail-value">${cardio.intensity}</div>
                    </div>
                    <div class="exercise-detail">
                        <div class="exercise-detail-label">Calorias</div>
                        <div class="exercise-detail-value">${cardio.calories}</div>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function renderizarSemExercicios(container) {
    container.innerHTML = `
        <div class="exercise-preview-card error-card">
            <div class="exercise-preview-header">
                <div>
                    <div class="exercise-name">Nenhum exercício encontrado</div>
                    <div class="exercise-group">Configure seu protocolo de treino</div>
                </div>
                <div class="exercise-rm-info">
                    <span>⚠️</span>
                </div>
            </div>
            <div class="error-actions">
                <button class="btn-secondary" onclick="window.location.reload()">
                    Recarregar
                </button>
            </div>
        </div>
    `;
}

// Carregar estatísticas avançadas do usuário
async function carregarEstatisticasAvancadas() {
    try {
        const currentUser = AppState.get('currentUser');
        
        if (!currentUser || !currentUser.id) {
            console.warn('[carregarEstatisticasAvancadas] ❌ currentUser não definido');
            return;
        }
        
        // Buscar estatísticas do Supabase
        const { query } = await import('../services/supabaseService.js');
        
        // 1. Buscar execuções recentes
        const { data: execucoesRecentes } = await query('execucao_exercicio_usuario', {
            eq: { usuario_id: currentUser.id },
            order: { column: 'data_execucao', ascending: false },
            limit: 10
        });
        
        // 2. Buscar estatísticas de 1RM (usando tabela direta)
        const { data: estatisticas1RM } = await query('usuario_1rm', {
            eq: { usuario_id: currentUser.id, status: 'ativo' },
            order: { column: 'data_teste', ascending: false }
        });
        
        // 3. Buscar exercícios para calcular progressão por grupo
        const { data: exercicios1RM } = await query('usuario_1rm', {
            eq: { usuario_id: currentUser.id, status: 'ativo' },
            select: '*, exercicios(grupo_muscular)'
        });
        
        // 4. Calcular estatísticas da semana atual
        const hoje = new Date();
        const inicioSemana = new Date(hoje.setDate(hoje.getDate() - hoje.getDay()));
        const fimSemana = new Date(inicioSemana);
        fimSemana.setDate(fimSemana.getDate() + 6);
        
        const { data: execucoesSemana } = await query('execucao_exercicio_usuario', {
            eq: { usuario_id: currentUser.id },
            gte: { data_execucao: inicioSemana.toISOString() },
            lte: { data_execucao: fimSemana.toISOString() }
        });
        
        // Processar e exibir estatísticas
        processarEstatisticasAvancadas({
            execucoesRecentes: execucoesRecentes || [],
            estatisticas1RM: estatisticas1RM || [],
            exercicios1RM: exercicios1RM || [],
            execucoesSemana: execucoesSemana || []
        });
        
        console.log('[carregarEstatisticasAvancadas] ✅ Estatísticas avançadas carregadas');
        
    } catch (error) {
        console.error('[carregarEstatisticasAvancadas] ❌ Erro:', error);
        // Não propagar erro para não quebrar o dashboard
    }
}

// Processar e exibir estatísticas avançadas
function processarEstatisticasAvancadas(dados) {
    try {
        const { execucoesRecentes, estatisticas1RM, exercicios1RM, execucoesSemana } = dados;
        
        // Atualizar métricas da semana
        atualizarMetricasSemana(execucoesSemana);
        
        // Atualizar progresso de 1RM
        atualizarProgresso1RM(estatisticas1RM);
        
        // Atualizar progressão por grupos musculares (calculada localmente)
        atualizarProgressaoGrupos(exercicios1RM);
        
        // Atualizar atividade recente
        atualizarAtividadeRecente(execucoesRecentes);
        
    } catch (error) {
        console.error('[processarEstatisticasAvancadas] Erro:', error);
    }
}

// Atualizar métricas da semana
function atualizarMetricasSemana(execucoesSemana) {
    try {
        const totalExerciciosSemana = execucoesSemana.length;
        const pesoTotalSemana = execucoesSemana.reduce((total, exec) => total + (exec.peso_utilizado * exec.repeticoes), 0);
        const diasTreinados = new Set(execucoesSemana.map(exec => 
            new Date(exec.data_execucao).toDateString()
        )).size;
        
        // Atualizar elementos se existirem
        updateElement('weekly-exercises-count', totalExerciciosSemana);
        updateElement('weekly-volume', `${Math.round(pesoTotalSemana)}kg`);
        updateElement('weekly-training-days', diasTreinados);
        
        // Atualizar progresso semanal no card principal
        const progressPercentage = Math.min((diasTreinados / 4) * 100, 100);
        const progressCircle = document.getElementById('workout-progress-circle');
        if (progressCircle) {
            const offset = 251.2 - (progressPercentage / 100) * 251.2;
            progressCircle.style.strokeDashoffset = offset.toString();
        }
        
    } catch (error) {
        console.error('[atualizarMetricasSemana] Erro:', error);
    }
}

// Atualizar progresso de 1RM
function atualizarProgresso1RM(estatisticas1RM) {
    try {
        if (!estatisticas1RM || estatisticas1RM.length === 0) return;
        
        // Encontrar maior 1RM
        const maior1RM = Math.max(...estatisticas1RM.map(stat => stat.rm_calculado || 0));
        
        // Calcular ganho médio baseado nos dados disponíveis
        const exerciciosComRM = estatisticas1RM.length;
        
        updateElement('max-1rm', `${maior1RM}kg`);
        updateElement('exercises-with-progress', exerciciosComRM);
        
    } catch (error) {
        console.error('[atualizarProgresso1RM] Erro:', error);
    }
}

// Atualizar progressão por grupos musculares
function atualizarProgressaoGrupos(exercicios1RM) {
    try {
        if (!exercicios1RM || exercicios1RM.length === 0) return;
        
        // Agrupar por grupo muscular
        const gruposMus = {};
        exercicios1RM.forEach(exercicio => {
            const grupo = exercicio.exercicios?.grupo_muscular || 'Outros';
            if (!gruposMus[grupo]) {
                gruposMus[grupo] = [];
            }
            gruposMus[grupo].push(exercicio.rm_calculado);
        });
        
        // Simples atualização de estatísticas
        const totalGrupos = Object.keys(gruposMus).length;
        updateElement('muscle-groups-count', totalGrupos);
        
    } catch (error) {
        console.error('[atualizarProgressaoGrupos] Erro:', error);
    }
}

// Atualizar atividade recente
function atualizarAtividadeRecente(execucoesRecentes) {
    try {
        const container = document.getElementById('recent-activity');
        if (!container || !execucoesRecentes || execucoesRecentes.length === 0) return;
        
        let html = '';
        execucoesRecentes.slice(0, 5).forEach(execucao => {
            const dataExecucao = new Date(execucao.data_execucao);
            const diasAtras = Math.floor((new Date() - dataExecucao) / (1000 * 60 * 60 * 24));
            const tempoRelativo = diasAtras === 0 ? 'Hoje' : 
                                diasAtras === 1 ? 'Ontem' : 
                                `${diasAtras} dias atrás`;
            
            html += `
                <div class="activity-item">
                    <div class="activity-icon">${getActionIcon('weight')}</div>
                    <div class="activity-content">
                        <div class="activity-description">
                            ${execucao.peso_utilizado}kg × ${execucao.repeticoes} reps
                        </div>
                        <div class="activity-time">${tempoRelativo}</div>
                    </div>
                    <div class="activity-success ${execucao.falhou ? 'failed' : 'success'}">
                        ${execucao.falhou ? getActionIcon('warning') : getActionIcon('checkFilled')}
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('[atualizarAtividadeRecente] Erro:', error);
    }
}

// Configurar botão de iniciar treino
function configurarBotaoIniciar() {
    const startBtn = document.getElementById('start-workout-btn');
    if (!startBtn) {
        console.warn('[configurarBotaoIniciar] Botão não encontrado');
        return;
    }
    
    const workout = AppState.get('currentWorkout');
    
    startBtn.onclick = () => {
        if (!workout) {
            // Sem treino - abrir planejamento
            if (window.abrirPlanejamentoParaUsuarioAtual) {
                window.abrirPlanejamentoParaUsuarioAtual();
            } else {
                showNotification('Configure seu planejamento primeiro', 'warning');
            }
            return;
        }
        
        // Com treino - usar a função global iniciarTreino
        if (window.iniciarTreino) {
            window.iniciarTreino();
        } else {
            showNotification('Sistema de treino carregando...', 'info');
        }
    };
    
    // Habilitar/desabilitar baseado no estado
    startBtn.disabled = false;
    
    console.log('[configurarBotaoIniciar] ✅ Botão configurado para:', workout?.tipo || 'configuração');
}

// Configurar event listeners
// Variável para evitar múltiplos registros de listeners
let listenersConfigured = false;
let debounceTimer = null;
let supabaseChannel = null;

// Configurar listener do Supabase para mudanças em tempo real
async function configurarSupabaseListener() {
    try {
        const currentUser = AppState.get('currentUser');
        if (!currentUser || !currentUser.id) {
            console.warn('[configurarSupabaseListener] ❌ Usuário não está definido');
            return;
        }

        // Importar supabase
        const { supabase } = await import('../services/supabaseService.js');
        
        // Remover canal anterior se existir
        if (supabaseChannel) {
            console.log('[configurarSupabaseListener] 🗑️ Removendo canal anterior');
            supabase.removeChannel(supabaseChannel);
        }

        // Criar novo canal para mudanças na planejamento_semanal
        supabaseChannel = supabase
            .channel('planejamento_semanal_changes')
            .on('postgres_changes', 
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'planejamento_semanal',
                    filter: `usuario_id=eq.${currentUser.id}`
                }, 
                (payload) => {
                    console.log('[configurarSupabaseListener] 📡 Mudança detectada na planejamento_semanal:', payload);
                    
                    // Debounce para evitar múltiplas chamadas
                    if (debounceTimer) {
                        clearTimeout(debounceTimer);
                    }
                    
                    debounceTimer = setTimeout(() => {
                        fetchWorkouts();
                    }, 500);
                }
            )
            .subscribe((status) => {
                console.log('[configurarSupabaseListener] 📡 Status da subscription:', status);
            });

        console.log('[configurarSupabaseListener] ✅ Listener Supabase configurado para usuário:', currentUser.id);

    } catch (error) {
        console.error('[configurarSupabaseListener] ❌ Erro ao configurar listener:', error);
    }
}

// Função para buscar workouts (adaptada para o contexto atual)
async function fetchWorkouts() {
    try {
        console.log('[fetchWorkouts] 🔄 Recarregando workouts...');
        
        const currentUser = AppState.get('currentUser');
        if (!currentUser || !currentUser.id) {
            console.warn('[fetchWorkouts] ❌ Usuário não está definido');
            return;
        }

        // Como as tabelas workouts/weekly_plan não existem, vamos atualizar os dados do planejamento atual
        console.log('[fetchWorkouts] 🔄 Atualizando dados do planejamento semanal...');
        
        // Buscar plano semanal atual do usuário - usando exportações de compatibilidade primeiro
        let planAtual = null;
        try {
            // Método prioritário: Usar exportação de compatibilidade (mais confiável)
            const { getActiveWeeklyPlan } = await import('../services/weeklyPlanningService.js');
            planAtual = await getActiveWeeklyPlan(currentUser.id);
            console.log('[fetchWorkouts] ✅ Plano carregado via exportação de compatibilidade');
        } catch (error) {
            console.error('[fetchWorkouts] ❌ Erro ao buscar plano semanal:', error.message);
        }
        
        // Atualizar estado com plano atualizado
        if (planAtual) {
            AppState.set('weekPlan', planAtual);
            console.log('[fetchWorkouts] ✅ Plano semanal atualizado:', planAtual);
        }
        
        // Recarregar componentes relevantes se estivermos na tela home
        const homeScreen = document.getElementById('home-screen');
        if (homeScreen && homeScreen.classList.contains('active')) {
            await carregarIndicadoresSemana();
            await carregarTreinoAtual();
            await carregarExerciciosDoDia();
        }
        
        console.log('[fetchWorkouts] ✅ Dados atualizados com sucesso!');
        
    } catch (error) {
        console.error('[fetchWorkouts] ❌ Erro ao recarregar workouts:', error);
    }
}

// Função para limpar listeners (para uso em cleanup)
async function limparEventListeners() {
    try {
        if (supabaseChannel) {
            console.log('[limparEventListeners] 🗑️ Removendo canal Supabase...');
            const { supabase } = await import('../services/supabaseService.js');
            supabase.removeChannel(supabaseChannel);
            supabaseChannel = null;
        }
        
        if (debounceTimer) {
            clearTimeout(debounceTimer);
            debounceTimer = null;
        }
        
        listenersConfigured = false;
        console.log('[limparEventListeners] ✅ Event listeners limpos');
        
    } catch (error) {
        console.error('[limparEventListeners] ❌ Erro ao limpar listeners:', error);
    }
}

// Configurar listener para visibilidade da página (equivalente ao useFocusEffect)
function configurarVisibilityListener() {
    try {
        // Listener para mudança de visibilidade da página
        document.addEventListener('visibilitychange', () => {
            // Só refetch se a página ficou visível e estamos na home screen
            if (!document.hidden) {
                const homeScreen = document.getElementById('home-screen');
                if (homeScreen && homeScreen.classList.contains('active')) {
                    console.log('[configurarVisibilityListener] 👁️ Página voltou ao foco, refetchando dados...');
                    
                    // Debounce para evitar execuções muito frequentes
                    if (debounceTimer) {
                        clearTimeout(debounceTimer);
                    }
                    
                    debounceTimer = setTimeout(() => {
                        fetchWorkouts();
                    }, 300);
                }
            }
        });

        // Listener para quando a janela volta ao foco
        window.addEventListener('focus', () => {
            const homeScreen = document.getElementById('home-screen');
            if (homeScreen && homeScreen.classList.contains('active')) {
                console.log('[configurarVisibilityListener] 🔄 Janela voltou ao foco, refetchando dados...');
                
                // Debounce para evitar execuções muito frequentes
                if (debounceTimer) {
                    clearTimeout(debounceTimer);
                }
                
                debounceTimer = setTimeout(() => {
                    fetchWorkouts();
                }, 300);
            }
        });

        console.log('[configurarVisibilityListener] ✅ Visibility listeners configurados');

    } catch (error) {
        console.error('[configurarVisibilityListener] ❌ Erro ao configurar visibility listeners:', error);
    }
}

function configurarEventListeners() {
    if (listenersConfigured) {
        console.log('[configurarEventListeners] Listeners já configurados, pulando...');
        return;
    }
    
    // Listener para mudanças no estado com debounce
    AppState.subscribe('weekPlan', (newPlan) => {
        console.log('[dashboard] Plano semanal atualizado, recarregando...');
        
        // Debounce para evitar execuções muito frequentes
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }
        
        debounceTimer = setTimeout(() => {
            // Verificar se estamos na tela home antes de recarregar
            const homeScreen = document.getElementById('home-screen');
            if (homeScreen && homeScreen.classList.contains('active')) {
                // Recarregar indicadores da semana para refletir mudanças automaticamente
                carregarIndicadoresSemana();
                carregarPlanejamentoSemanal();
            }
        }, 300); // Reduzido para resposta mais rápida
    });
    
    AppState.subscribe('currentUser', (newUser) => {
        if (newUser) {
            console.log('[dashboard] Usuário alterado, recarregando dashboard...');
            carregarDashboard();
        }
    });

    // Configurar listener Supabase para mudanças na weekly_plan
    configurarSupabaseListener();
    
    // Configurar listener para quando a página volta ao foco (equivalente ao useFocusEffect)
    configurarVisibilityListener();
    
    listenersConfigured = true;
    console.log('[configurarEventListeners] ✅ Event listeners configurados');
    
    // Atualizar a cada minuto para mostrar progresso do dia
    setInterval(() => {
        const progressTextEl = document.getElementById('workout-progress-text');
        const workout = AppState.get('currentWorkout');
        
        if (progressTextEl && workout && workout.tipo !== 'folga') {
            const agora = new Date();
            const hoje = agora.getDay();
            const horaAtual = agora.getHours();
            
            // Simular progresso do dia (6h às 22h = 100%)
            const progressoDia = Math.min(Math.max((horaAtual - 6) / 16 * 100, 0), 100);
            
            if (workout.tipo !== 'cardio' && workout.tipo !== 'Cardio') {
                const progressCircleEl = document.getElementById('workout-progress-circle');
                if (progressCircleEl) {
                    const offset = 251.2 - (progressoDia / 100) * 251.2;
                    progressCircleEl.style.strokeDashoffset = offset.toString();
                }
                progressTextEl.textContent = `${Math.round(progressoDia)}%`;
            }
        }
    }, 60000); // A cada minuto
    
    console.log('[configurarEventListeners] ✅ Event listeners configurados');
}

// Função auxiliar para atualizar elementos
function updateElement(element, value) {
    if (!element) return;
    
    if (typeof element === 'string') {
        const el = document.getElementById(element);
        if (el) el.textContent = value;
    } else {
        element.textContent = value;
    }
}

// Função para atualizar métricas em tempo real (pode ser chamada externamente)
function atualizarMetricasTempoReal(novasMetricas) {
    try {
        updateElement('completed-workouts', novasMetricas.treinosConcluidos || 0);
        updateElement('current-week', novasMetricas.semanaAtual || 1);
        updateElement('progress-percentage', `${Math.round(novasMetricas.progresso || 0)}%`);
        
        const userProgressBar = document.getElementById('user-progress-bar');
        if (userProgressBar) {
            const progressWidth = Math.min((novasMetricas.treinosConcluidos / 4) * 100, 100);
            userProgressBar.style.width = `${progressWidth}%`;
        }
        
        updateElement('user-workouts', novasMetricas.treinosConcluidos || 0);
        
        AppState.set('userMetrics', novasMetricas);
        
        console.log('[atualizarMetricasTempoReal] ✅ Métricas atualizadas:', novasMetricas);
        
    } catch (error) {
        console.error('[atualizarMetricasTempoReal] Erro:', error);
    }
}

// Função para forçar reload completo do dashboard
function recarregarDashboardLegacy() {
    console.log('[recarregarDashboard] Forçando reload completo...');
    carregarDashboard();
}

// Função de teste para verificar se fetchWorkouts funciona
window.testFetchWorkouts = async function() {
    console.log('[testFetchWorkouts] 🧪 TESTANDO FUNÇÃO fetchWorkouts');
    
    try {
        const currentUser = AppState.get('currentUser');
        if (!currentUser || !currentUser.id) {
            console.error('[testFetchWorkouts] ❌ Usuário não encontrado');
            if (window.showNotification) {
                window.showNotification('❌ Faça login primeiro', 'error');
            }
            return { success: false, error: 'Usuário não encontrado' };
        }
        
        console.log('[testFetchWorkouts] 👤 Usuário:', currentUser.id);
        
        // Chamar a função fetchWorkouts
        await fetchWorkouts();
        
        console.log('[testFetchWorkouts] ✅ fetchWorkouts executou sem erros');
        if (window.showNotification) {
            window.showNotification('✅ fetchWorkouts funcionando!', 'success');
        }
        
        return { success: true };
        
    } catch (error) {
        console.error('[testFetchWorkouts] ❌ ERRO:', error);
        if (window.showNotification) {
            window.showNotification('❌ Erro no fetchWorkouts: ' + error.message, 'error');
        }
        return { success: false, error: error.message };
    }
};

// Exportar para compatibilidade
window.carregarDashboard = carregarDashboard;
window.recarregarDashboard = recarregarDashboard;
window.carregarIndicadoresSemana = carregarIndicadoresSemana;
window.limparEventListeners = limparEventListeners;
window.fetchWorkouts = fetchWorkouts;

// Função global para navegação de semanas
window.navegarSemana = navegarSemana;

// Função global para carregar dados dinâmicos
window.carregarDadosDinamicosHome = carregarDadosDinamicosHome;

// Verificar se treino foi concluído usando a mesma lógica do workoutExecution
async function verificarTreinoConcluido(userId, dayIndex, ano = null, semana = null) {
    try {
        console.log(`[verificarTreinoConcluido] 🔍 Verificando conclusão do dia ${dayIndex} (${DIAS_SEMANA[dayIndex]}) para usuário:`, userId);
        
        // Se não especificado, usar semana atual
        if (!ano || !semana) {
            const hoje = new Date();
            ano = hoje.getFullYear();
            semana = WeeklyPlanService.getWeekNumber(hoje);
        }
        
        console.log(`[verificarTreinoConcluido] 📅 Verificando para semana ${semana}/${ano}`);
        
        // Buscar planejamento específico do dia no banco usando a mesma lógica do workoutExecution
        const { data: planejamentoArray, error } = await query('planejamento_semanal', {
            select: 'concluido, data_conclusao, tipo_atividade',
            eq: {
                usuario_id: userId,
                ano: ano,
                semana: semana,
                dia_semana: WeeklyPlanService.dayToDb(dayIndex)
            }
        });
        
        const planejamentoDia = planejamentoArray && planejamentoArray.length > 0 ? planejamentoArray[0] : null;
        
        if (error) {
            console.warn(`[verificarTreinoConcluido] ⚠️ Erro ao buscar planejamento do dia ${dayIndex}:`, error.message);
            return false;
        }
        
        if (!planejamentoDia) {
            console.log(`[verificarTreinoConcluido] ⚠️ Nenhum planejamento encontrado para o dia ${dayIndex} (${DIAS_SEMANA[dayIndex]})`);
            return false;
        }
        
        // VERIFICAR O STATUS NO PLANEJAMENTO_SEMANAL usando a mesma lógica
        // O campo 'concluido' na tabela planejamento_semanal é a fonte da verdade
        const concluido = Boolean(planejamentoDia.concluido);
        
        console.log(`[verificarTreinoConcluido] 📊 ANÁLISE DO DIA ${dayIndex} (${DIAS_SEMANA[dayIndex]}):`, {
            planejamento: planejamentoDia,
            concluido: concluido,
            data_conclusao: planejamentoDia.data_conclusao,
            tipo_atividade: planejamentoDia.tipo_atividade,
            logica: 'BASEADA_NO_PLANEJAMENTO_SEMANAL'
        });
        
        return concluido;
        
    } catch (error) {
        console.error(`[verificarTreinoConcluido] ❌ Erro no dia ${dayIndex}:`, error);
        return false;
    }
}

// Sincronizar status de conclusão quando há execuções mas planejamento não está marcado
async function sincronizarConclusaoTreino(userId, dayIndex) {
    try {
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const semana = WeeklyPlanService.getWeekNumber(hoje);
        
        await supabase
            .from('planejamento_semanal')
            .update({ 
                concluido: true, 
                data_conclusao: new Date().toISOString() 
            })
            .eq('usuario_id', userId)
            .eq('ano', ano)
            .eq('semana', semana)
            .eq('dia_semana', WeeklyPlanService.dayToDb(dayIndex));
        
        console.log(`[sincronizarConclusaoTreino] Treino do dia ${dayIndex} marcado como concluído`);
        
    } catch (error) {
        console.error('[sincronizarConclusaoTreino] Erro:', error);
        throw error;
    }
}

// ===== HISTÓRICO DE TREINOS =====

// Handler para clique nos dias da semana
window.handleDayClick = async function(dayIndex, isCompleted) {
    console.log(`[handleDayClick] Clicou no dia ${dayIndex}, concluído: ${isCompleted}`);
    
    const currentUser = AppState.get('currentUser');
    if (!currentUser?.id) {
        showNotification('Usuário não encontrado', 'error');
        return;
    }
    
    // Sempre tentar buscar histórico, mesmo se não marcado como concluído
    // pois pode haver execuções que não foram sincronizadas
    
    try {
        showNotification('Carregando histórico do treino...', 'info');
        
        // Buscar dados do treino histórico
        const historico = await buscarHistoricoTreino(currentUser.id, dayIndex);
        
        if (historico) {
            // Verificar se há múltiplos grupos musculares
            if (historico.multiplos_grupos) {
                mostrarSeletorGrupoMuscular(historico, dayIndex);
            } else {
                mostrarModalHistorico(historico, dayIndex);
            }
        } else {
            // Se não há histórico, mostrar informações de debug
            const debugInfo = await debugTreinoInfo(currentUser.id, dayIndex);
            console.log('[handleDayClick] Debug info:', debugInfo);
            showNotification(`Nenhum treino encontrado para este dia. ${debugInfo.data ? debugInfo.data.substring(0, 100) + '...' : 'Verificando dados...'}`, 'warning');
        }
    } catch (error) {
        console.error('[handleDayClick] Erro:', error);
        showNotification('Erro ao carregar histórico do treino', 'error');
    }
};

// Buscar grupo muscular planejado para um dia específico
async function buscarGrupoMuscularPlanejado(userId, dataAlvo) {
    try {
        const ano = dataAlvo.getFullYear();
        const semana = getWeekNumber(dataAlvo);
        const diaSemana = WeeklyPlanService.dayToDb(dataAlvo.getDay());
        
        const { data: planejamento, error } = await supabase
            .from('planejamento_semanal')
            .select('tipo_atividade')
            .eq('usuario_id', userId)
            .eq('ano', ano)
            .eq('semana', semana)
            .eq('dia_semana', diaSemana)
            .single();
            
        if (error || !planejamento) {
            console.log('[buscarGrupoMuscularPlanejado] Nenhum planejamento encontrado para este dia');
            return null;
        }
        
        return planejamento.tipo_atividade;
        
    } catch (error) {
        console.error('[buscarGrupoMuscularPlanejado] Erro:', error);
        return null;
    }
}

// Função auxiliar para obter número da semana
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
}

// Buscar histórico de treino específico (nova versão com treino_executado)
async function buscarHistoricoTreino(userId, dayIndex) {
    try {
        const hoje = new Date();
        const dataAlvo = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - (hoje.getDay() - dayIndex));
        const dataAlvoStr = dataAlvo.toISOString().split('T')[0];
        
        console.log(`[buscarHistoricoTreino] Buscando treino para dia ${dayIndex} (${dataAlvoStr})`);
        
        // DESATIVADO: Busca na nova tabela treino_executado (tabela inexistente)
        // const sessaoResult = await TreinoExecutadoService.buscarSessaoPorData(userId, dataAlvoStr);
        // if (sessaoResult.success && sessaoResult.data.length > 0) {
        //     const sessao = sessaoResult.data[0]; // Primeira sessão do dia
        //     console.log('[buscarHistoricoTreino] ✅ Sessão encontrada na nova estrutura:', sessao);
        //     return {
        //         sessao,
        //         execucoes: sessao.execucao_exercicio_usuario || [],
        //         exerciciosSugeridos: [], // TODO: buscar do protocolo se necessário
        //         dayIndex,
        //         data_treino: dataAlvo,
        //         fonte: 'treino_executado'
        //     };
        // }
        
        // Primeiro, buscar qual grupo muscular foi planejado para este dia
        const grupoMuscularPlanejado = await buscarGrupoMuscularPlanejado(userId, dataAlvo);
        console.log('[buscarHistoricoTreino] Grupo muscular planejado:', grupoMuscularPlanejado);
        
        // Buscar usando a view otimizada
        console.log('[buscarHistoricoTreino] Buscando dados na view otimizada...');
        
        const { TreinoViewService } = await import('../services/treinoViewService.js');
        
        // Primeiro tenta com o grupo planejado, depois sem filtro se não encontrar
        let resultadoView = await TreinoViewService.buscarTreinoPorData(userId, dataAlvoStr, grupoMuscularPlanejado);
        console.log('[buscarHistoricoTreino] Resultado da busca com grupo específico:', {
            success: resultadoView.success,
            hasData: !!resultadoView.data,
            grupoUsado: grupoMuscularPlanejado
        });
        
        // Se não encontrou com grupo específico E há grupo planejado, tenta sem filtro
        if ((!resultadoView.success || !resultadoView.data) && grupoMuscularPlanejado) {
            console.log('[buscarHistoricoTreino] Não encontrado com grupo específico, tentando busca geral...');
            resultadoView = await TreinoViewService.buscarTreinoPorData(userId, dataAlvoStr, null);
            console.log('[buscarHistoricoTreino] Resultado da busca geral:', {
                success: resultadoView.success,
                hasData: !!resultadoView.data
            });
        }
        
        // Se ainda não encontrou e não havia grupo planejado, tenta busca geral
        if ((!resultadoView.success || !resultadoView.data) && !grupoMuscularPlanejado) {
            console.log('[buscarHistoricoTreino] Tentando busca geral sem grupo planejado...');
            resultadoView = await TreinoViewService.buscarTreinoPorData(userId, dataAlvoStr, null);
            console.log('[buscarHistoricoTreino] Resultado final da busca geral:', {
                success: resultadoView.success,
                hasData: !!resultadoView.data
            });
        }
        
        if (resultadoView.success && resultadoView.data) {
            console.log('[buscarHistoricoTreino] ✅ Dados encontrados na view:', resultadoView.data);
            
            // Verificar se há múltiplos grupos musculares
            if (resultadoView.data.multiplos_grupos) {
                console.log('[buscarHistoricoTreino] ⚠️ Múltiplos grupos encontrados, mostrando seletor');
                return {
                    multiplos_grupos: true,
                    grupos_disponiveis: resultadoView.data.grupos,
                    data_treino: dataAlvo,
                    dayIndex,
                    fonte: 'view_otimizada_multiplos'
                };
            }
            
            return {
                sessao: {
                    data_treino: resultadoView.data.data_treino,
                    grupo_muscular: resultadoView.data.grupo_muscular,
                    metricas: resultadoView.data.metricas,
                    protocolo_treino_id: resultadoView.data.planejamento.protocolo_id
                },
                execucoes: resultadoView.data.exercicios.flatMap(ex => 
                    ex.series.map(serie => ({
                        exercicio_id: ex.exercicio_id,
                        exercicios: {
                            nome: ex.nome,
                            grupo_muscular: ex.grupo_muscular,
                            tipo_atividade: ex.grupo_muscular
                        },
                        serie_numero: serie.serie_numero,
                        peso_utilizado: serie.peso,
                        repeticoes: serie.repeticoes,
                        falhou: serie.falhou,
                        volume_serie: serie.volume,
                        rm_estimado: serie.rm_estimado,
                        intensidade_percentual: serie.intensidade
                    }))
                ),
                exerciciosSugeridos: [],
                dayIndex,
                data_treino: dataAlvo,
                fonte: 'view_otimizada',
                metricas_avancadas: resultadoView.data.metricas,
                grupo_planejado: grupoMuscularPlanejado
            };
        }
        
        // Fallback: tentar busca direta mais simples se view falhou
        console.log('[buscarHistoricoTreino] View não retornou dados, tentando busca direta...');
        
        try {
            const { data: execucoesDiretas, error: errorDireto } = await supabase
                .from('execucao_exercicio_usuario')
                .select('id, usuario_id, exercicio_id, data_execucao, peso_utilizado, repeticoes, serie_numero, falhou')
                .eq('usuario_id', userId)
                .gte('data_execucao', dataAlvoStr + 'T00:00:00')
                .lt('data_execucao', dataAlvoStr + 'T23:59:59');
            
            if (errorDireto) {
                console.error('[buscarHistoricoTreino] Erro na busca direta:', errorDireto);
            } else if (execucoesDiretas && execucoesDiretas.length > 0) {
                console.log('[buscarHistoricoTreino] ✅ Encontradas execuções diretas:', execucoesDiretas.length);
                
                // Buscar detalhes dos exercícios separadamente
                const exercicioIds = [...new Set(execucoesDiretas.map(e => e.exercicio_id))];
                const { data: exerciciosDetalhes } = await supabase
                    .from('exercicios')
                    .select('id, nome, grupo_muscular')
                    .in('id', exercicioIds);
                
                // Mapear exercícios
                const exerciciosMap = {};
                (exerciciosDetalhes || []).forEach(ex => {
                    exerciciosMap[ex.id] = ex;
                });
                
                // Combinar dados
                const execucoesCompletas = execucoesDiretas.map(exec => ({
                    ...exec,
                    exercicios: exerciciosMap[exec.exercicio_id] || {
                        nome: 'Exercício desconhecido',
                        grupo_muscular: 'Geral'
                    }
                }));
                
                return {
                    execucoes: execucoesCompletas,
                    exerciciosSugeridos: [],
                    dayIndex,
                    data_treino: dataAlvo,
                    fonte: 'busca_direta'
                };
            }
        } catch (errorFallback) {
            console.error('[buscarHistoricoTreino] Erro no fallback:', errorFallback);
        }
        
        console.log('[buscarHistoricoTreino] ❌ Nenhum treino encontrado para este dia');
        return null;
        
    } catch (error) {
        console.error('[buscarHistoricoTreino] Erro:', error);
        throw error;
    }
}

// Mostrar seletor quando há múltiplos grupos musculares no mesmo dia
function mostrarSeletorGrupoMuscular(historico, dayIndex) {
    const dayName = DIAS_SEMANA[dayIndex];
    const dataFormatada = historico.data_treino.toLocaleDateString('pt-BR');
    
    const modalHTML = `
        <div id="modal-seletor-grupo" class="modal-overlay" onclick="fecharModalSeletorGrupo(event)">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3>Múltiplos Treinos - ${dayName}</h3>
                    <span class="modal-date">${dataFormatada}</span>
                    <button class="modal-close" onclick="fecharModalSeletorGrupo()">&times;</button>
                </div>
                
                <div class="modal-body">
                    <p class="selector-message">
                        Foram encontrados treinos de múltiplos grupos musculares neste dia. 
                        Selecione qual grupo você deseja visualizar:
                    </p>
                    
                    <div class="grupos-selector">
                        ${historico.grupos_disponiveis.map(grupo => `
                            <button class="grupo-btn" onclick="selecionarGrupoMuscular('${grupo.grupo_muscular}', ${dayIndex})">
                                <div class="grupo-info">
                                    <span class="grupo-nome">${grupo.grupo_muscular}</span>
                                    <div class="grupo-stats">
                                        <span>${grupo.total_execucoes} séries</span>
                                        <span>${grupo.exercicios.length} exercícios</span>
                                        <span>${Math.round(grupo.metricas.volume_total)}kg volume</span>
                                    </div>
                                </div>
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Selecionar grupo muscular específico
async function selecionarGrupoMuscular(grupoMuscular, dayIndex) {
    try {
        fecharModalSeletorGrupo();
        showNotification(`Carregando treino de ${grupoMuscular}...`, 'info');
        
        // Buscar apenas o grupo selecionado
        const historico = await buscarHistoricoTreino(currentUser.id, dayIndex);
        
        // Buscar especificamente esse grupo
        const { TreinoViewService } = await import('../services/treinoViewService.js');
        const hoje = new Date();
        const dataAlvo = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - (hoje.getDay() - dayIndex));
        const dataAlvoStr = dataAlvo.toISOString().split('T')[0];
        
        const resultadoEspecifico = await TreinoViewService.buscarTreinoPorData(currentUser.id, dataAlvoStr, grupoMuscular);
        
        if (resultadoEspecifico.success && resultadoEspecifico.data) {
            const historicoEspecifico = {
                sessao: {
                    data_treino: resultadoEspecifico.data.data_treino,
                    grupo_muscular: resultadoEspecifico.data.grupo_muscular,
                    metricas: resultadoEspecifico.data.metricas
                },
                execucoes: resultadoEspecifico.data.exercicios.flatMap(ex => 
                    ex.series.map(serie => ({
                        exercicio_id: ex.exercicio_id,
                        exercicios: {
                            nome: ex.nome,
                            grupo_muscular: ex.grupo_muscular,
                            tipo_atividade: ex.grupo_muscular
                        },
                        serie_numero: serie.serie_numero,
                        peso_utilizado: serie.peso,
                        repeticoes: serie.repeticoes,
                        falhou: serie.falhou,
                        volume_serie: serie.volume
                    }))
                ),
                dayIndex,
                data_treino: dataAlvo,
                fonte: 'view_grupo_especifico'
            };
            
            mostrarModalHistorico(historicoEspecifico, dayIndex);
        } else {
            showNotification('Erro ao carregar treino específico', 'error');
        }
        
    } catch (error) {
        console.error('[selecionarGrupoMuscular] Erro:', error);
        showNotification('Erro ao carregar treino específico', 'error');
    }
}

// Fechar modal do seletor
function fecharModalSeletorGrupo(event) {
    if (event && event.target !== event.currentTarget) return;
    const modal = document.getElementById('modal-seletor-grupo');
    if (modal) modal.remove();
}

// Mostrar modal com histórico do treino
function mostrarModalHistorico(historico, dayIndex) {
    const dayName = DIAS_SEMANA[dayIndex];
    const dataFormatada = historico.data_treino.toLocaleDateString('pt-BR');
    
    // Calcular estatísticas
    const stats = calcularEstatisticasTreino(historico);
    
    // Criar HTML do modal
    const modalHTML = `
        <div id="modal-historico" class="modal-overlay" onclick="fecharModalHistorico(event)">
            <div class="modal-content workout-history-modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <div class="workout-history-header">
                        <div class="history-title-section">
                            <h2>Histórico do Treino</h2>
                            <div class="history-subtitle">
                                <span class="day-name">${dayName}</span>
                                <span class="separator">•</span>
                                <span class="date">${dataFormatada}</span>
                            </div>
                        </div>
                        <button class="btn-close" onclick="fecharModalHistorico()">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div class="modal-body">
                    <!-- Estatísticas Gerais -->
                    <div class="stats-overview">
                        <div class="stat-card">
                            <div class="stat-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                                </svg>
                            </div>
                            <div class="stat-content">
                                <div class="stat-value">${stats.totalPeso}kg</div>
                                <div class="stat-label">Total Levantado</div>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                                    <polyline points="14 2 14 8 20 8"/>
                                </svg>
                            </div>
                            <div class="stat-content">
                                <div class="stat-value">${stats.totalExercicios}</div>
                                <div class="stat-label">Exercícios</div>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"/>
                                    <polyline points="12 6 12 12 16 14"/>
                                </svg>
                            </div>
                            <div class="stat-content">
                                <div class="stat-value">${stats.duracaoEstimada}min</div>
                                <div class="stat-label">Duração</div>
                            </div>
                        </div>
                        
                        <div class="stat-card performance-stat">
                            <div class="stat-icon ${stats.performance.class}">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    ${stats.performance.icon}
                                </svg>
                            </div>
                            <div class="stat-content">
                                <div class="stat-value ${stats.performance.class}">${stats.performance.percentual}%</div>
                                <div class="stat-label">Performance</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Lista de Exercícios -->
                    <div class="exercises-history">
                        <h3>Exercícios Realizados</h3>
                        <div class="exercises-list">
                            ${renderizarExerciciosHistorico(historico)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Adicionar modal ao DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Mostrar modal com animação
    setTimeout(() => {
        const modal = document.getElementById('modal-historico');
        if (modal) {
            modal.classList.add('show');
        }
    }, 10);
}

// Calcular estatísticas do treino
function calcularEstatisticasTreino(historico) {
    const { execucoes, exerciciosSugeridos } = historico;
    
    // Total de peso levantado
    const totalPeso = execucoes.reduce((total, exec) => {
        return total + ((exec.peso_utilizado || 0) * (exec.repeticoes || 0));
    }, 0);
    
    // Número de exercícios únicos
    const exerciciosUnicos = new Set(execucoes.map(e => e.exercicio_id));
    const totalExercicios = exerciciosUnicos.size;
    
    // Duração estimada (aproximação: 3-4 min por série)
    const totalSeries = execucoes.length;
    const duracaoEstimada = Math.round(totalSeries * 3.5);
    
    // Performance vs sugerido
    let performance = { percentual: 100, class: 'good', icon: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>' };
    
    if (exerciciosSugeridos.length > 0) {
        const pesoSugerido = exerciciosSugeridos.reduce((total, sug) => {
            return total + ((sug.peso_sugerido || 0) * (sug.repeticoes_sugeridas || 0) * (sug.series || 1));
        }, 0);
        
        if (pesoSugerido > 0) {
            const percentual = Math.round((totalPeso / pesoSugerido) * 100);
            performance.percentual = percentual;
            
            if (percentual >= 100) {
                performance.class = 'excellent';
                performance.icon = '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>';
            } else if (percentual >= 85) {
                performance.class = 'good';
                performance.icon = '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>';
            } else if (percentual >= 70) {
                performance.class = 'average';
                performance.icon = '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>';
            } else {
                performance.class = 'below';
                performance.icon = '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>';
            }
        }
    }
    
    return {
        totalPeso: totalPeso.toLocaleString('pt-BR'),
        totalExercicios,
        duracaoEstimada,
        performance
    };
}

// Renderizar exercícios do histórico com resumo avançado
function renderizarExerciciosHistorico(historico) {
    const { execucoes, exerciciosSugeridos } = historico;
    
    // Agrupar execuções por exercício
    const exerciciosAgrupados = {};
    
    execucoes.forEach(exec => {
        const exercicioId = exec.exercicio_id;
        if (!exerciciosAgrupados[exercicioId]) {
            exerciciosAgrupados[exercicioId] = {
                nome: exec.exercicios?.nome || 'Exercício',
                grupo_muscular: exec.exercicios?.grupo_muscular || 'Geral',
                equipamento: exec.exercicios?.equipamento || '',
                series: [],
                sugerido: exerciciosSugeridos.find(s => s.exercicio_id === exercicioId),
                execucaoData: exec.data_execucao
            };
        }
        
        exerciciosAgrupados[exercicioId].series.push({
            serie: exec.serie_numero || exerciciosAgrupados[exercicioId].series.length + 1,
            peso: exec.peso_utilizado || 0,
            reps: exec.repeticoes || 0,
            falhou: exec.falhou || false,
            timestamp: new Date(exec.data_execucao || Date.now())
        });
    });
    
    // Renderizar HTML com resumo avançado
    return Object.values(exerciciosAgrupados).map(exercicio => {
        // Calcular métricas do exercício
        const totalPesoExercicio = exercicio.series.reduce((total, serie) => 
            total + (serie.peso * serie.reps), 0
        );
        
        const pesoMedio = exercicio.series.length > 0 ? 
            exercicio.series.reduce((total, serie) => total + serie.peso, 0) / exercicio.series.length : 0;
            
        const seriesCompletadas = exercicio.series.filter(s => !s.falhou).length;
        const totalSeries = exercicio.series.length;
        
        // Calcular variação vs sugerido
        let variacaoPercent = 0;
        const pesoSugerido = exercicio.sugerido?.peso_sugerido || exercicio.sugerido?.peso_base || 0;
        if (pesoSugerido > 0 && pesoMedio > 0) {
            variacaoPercent = ((pesoMedio - pesoSugerido) / pesoSugerido) * 100;
        }
        
        // Calcular tempo estimado do exercício
        const tempoDescanso = exercicio.sugerido?.tempo_descanso || 60;
        const tempoExecucao = totalSeries * 45; // 45s por série
        const tempoDescansoTotal = Math.max(0, totalSeries - 1) * tempoDescanso;
        const tempoTotal = tempoExecucao + tempoDescansoTotal;
        const tempoMinutos = Math.floor(tempoTotal / 60);
        const tempoSegundos = tempoTotal % 60;
        
        // HTML das séries (colapsível)
        const seriesHTML = exercicio.series.map(serie => {
            const statusClass = serie.falhou ? 'failed' : 'completed';
            const statusIcon = serie.falhou ? '❌' : '✅';
            
            return `
                <div class="serie-item ${statusClass}">
                    <span class="serie-numero">${serie.serie}ª</span>
                    <span class="serie-peso">${serie.peso}kg</span>
                    <span class="serie-reps">${serie.reps} reps</span>
                    <span class="serie-volume">${(serie.peso * serie.reps).toFixed(1)}kg</span>
                    <span class="serie-status">${statusIcon}</span>
                </div>
            `;
        }).join('');
        
        const exercicioId = `exercise-${Math.random().toString(36).substr(2, 9)}`;
        
        return `
            <div class="exercise-history-item">
                <div class="exercise-header">
                    <div class="exercise-info">
                        <h4 class="exercise-name">${exercicio.nome}</h4>
                        <span class="exercise-muscle">${exercicio.grupo_muscular}${exercicio.equipamento ? ' • ' + exercicio.equipamento : ''}</span>
                    </div>
                    <div class="exercise-status completed">
                        <span>Concluído</span>
                    </div>
                </div>
                
                <!-- Resumo das Métricas -->
                <div class="exercise-summary-metrics">
                    <div class="metric-card-small">
                        <div class="metric-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M9 12l2 2 4-4"/>
                                <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
                                <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
                                <path d="M3 12h6m6 0h6"/>
                            </svg>
                        </div>
                        <div class="metric-info">
                            <span class="metric-value">${totalPesoExercicio.toFixed(1)} kg</span>
                            <span class="metric-label">Carga Total</span>
                        </div>
                    </div>
                    
                    <div class="metric-card-small">
                        <div class="metric-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12 6 12 12 16 14"/>
                            </svg>
                        </div>
                        <div class="metric-info">
                            <span class="metric-value">${tempoMinutos}:${tempoSegundos.toString().padStart(2, '0')}</span>
                            <span class="metric-label">Tempo Total</span>
                        </div>
                    </div>
                    
                    <div class="metric-card-small">
                        <div class="metric-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                            </svg>
                        </div>
                        <div class="metric-info">
                            <span class="metric-value" style="color: ${variacaoPercent >= 0 ? 'var(--accent-green, #00ff57)' : 'var(--accent-red, #ff4444)'}">${variacaoPercent >= 0 ? '+' : ''}${variacaoPercent.toFixed(1)}%</span>
                            <span class="metric-label">vs Sugerido</span>
                        </div>
                    </div>
                    
                    <div class="metric-card-small">
                        <div class="metric-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                <line x1="12" y1="8" x2="12" y2="16"/>
                                <line x1="8" y1="12" x2="16" y2="12"/>
                            </svg>
                        </div>
                        <div class="metric-info">
                            <span class="metric-value">${seriesCompletadas}/${totalSeries}</span>
                            <span class="metric-label">Séries</span>
                        </div>
                    </div>
                </div>
                
                <!-- Detalhes das Séries (Colapsível) -->
                <div class="series-details-history">
                    <button class="series-toggle-history" onclick="toggleSeriesHistory('${exercicioId}')">
                        <span>Ver Detalhes das Séries</span>
                        <svg class="toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="6 9 12 15 18 9"/>
                        </svg>
                    </button>
                    
                    <div class="series-list-history collapsed" id="series-${exercicioId}">
                        <div class="series-list-header">
                            <span>Série</span>
                            <span>Peso</span>
                            <span>Reps</span>
                            <span>Volume</span>
                            <span>Status</span>
                        </div>
                        ${seriesHTML}
                        ${pesoSugerido > 0 ? `
                            <div class="exercise-suggested-compact">
                                <span class="suggested-label">Sugerido:</span>
                                <span class="suggested-value">${pesoSugerido}kg × ${exercicio.sugerido?.repeticoes_sugeridas || exercicio.sugerido?.repeticoes_alvo || '?'} reps</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Função para toggle das séries históricas
window.toggleSeriesHistory = function(exercicioId) {
    const toggle = document.querySelector(`[onclick="toggleSeriesHistory('${exercicioId}')"]`);
    const seriesList = document.getElementById(`series-${exercicioId}`);
    
    if (seriesList && toggle) {
        const isCollapsed = seriesList.classList.contains('collapsed');
        
        if (isCollapsed) {
            seriesList.classList.remove('collapsed');
            toggle.classList.add('expanded');
            toggle.querySelector('span').textContent = 'Ocultar Detalhes das Séries';
        } else {
            seriesList.classList.add('collapsed');
            toggle.classList.remove('expanded');
            toggle.querySelector('span').textContent = 'Ver Detalhes das Séries';
        }
    }
};

// Fechar modal de histórico
window.fecharModalHistorico = function(event) {
    if (event && event.target !== event.currentTarget) return;
    
    const modal = document.getElementById('modal-historico');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
};

// Função para debug de informações do treino
async function debugTreinoInfo(userId, dayIndex) {
    try {
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const semana = WeeklyPlanService.getWeekNumber(hoje);
        const dataAlvo = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - (hoje.getDay() - dayIndex));
        const dataAlvoStr = dataAlvo.toISOString().split('T')[0];
        
        // Buscar planejamento
        const { data: planejamento } = await supabase
            .from('planejamento_semanal')
            .select('*')
            .eq('usuario_id', userId)
            .eq('ano', ano)
            .eq('semana', semana)
            .eq('dia_semana', WeeklyPlanService.dayToDb(dayIndex))
            .single();
        
        // Buscar execuções (todas do dia, independente do protocolo)
        const { data: execucoes } = await supabase
            .from('execucao_exercicio_usuario')
            .select('id, data_execucao, protocolo_treino_id, exercicio_id, peso_utilizado, repeticoes')
            .eq('usuario_id', userId)
            .gte('data_execucao', dataAlvoStr)
            .lt('data_execucao', new Date(dataAlvo.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
            
        // Buscar também execuções de protocolos ativos
        const { data: execucoesAtivas } = await supabase
            .from('execucao_exercicio_usuario')
            .select('id, data_execucao, protocolo_treino_id, exercicio_id')
            .eq('usuario_id', userId)
            .gte('data_execucao', dataAlvoStr)
            .lt('data_execucao', new Date(dataAlvo.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
        
        const protocolosEncontrados = [...new Set(execucoes?.map(e => e.protocolo_treino_id) || [])];
        
        const info = [
            `Dia: ${dayIndex} (${dataAlvoStr})`,
            `Planejamento: ${planejamento ? 'Existe' : 'Não existe'}`,
            `Concluído: ${planejamento?.concluido || false}`,
            `Protocolo ID: ${planejamento?.protocolo_treino_id || 'N/A'}`,
            `Execuções: ${execucoes?.length || 0}`,
            `Protocolos das execuções: [${protocolosEncontrados.join(', ')}]`,
            `Semana: ${semana}, Ano: ${ano}`
        ].join(' | ');
        
        console.log(`[debugTreinoInfo] ${info}`, { 
            planejamento, 
            execucoes,
            planejamento_completo: planejamento,
            protocolo_treino_id_detalhes: {
                valor: planejamento?.protocolo_treino_id,
                tipo: typeof planejamento?.protocolo_treino_id,
                eh_null: planejamento?.protocolo_treino_id === null,
                eh_undefined: planejamento?.protocolo_treino_id === undefined
            },
            query_params: {
                userId,
                ano,
                semana,
                dia_semana: WeeklyPlanService.dayToDb(dayIndex),
                data_busca: dataAlvoStr
            }
        });
        
        return info;
        
    } catch (error) {
        console.error('[debugTreinoInfo] Erro:', error);
        return `Erro no debug: ${error.message}`;
    }
}

// ===== FUNÇÕES DE RENDERIZAÇÃO DE EXERCÍCIOS =====

// Renderizar lista de exercícios na interface
function renderizarExercicios(exercicios, planejamento, container) {
    if (!container) {
        console.error('[renderizarExercicios] Container não fornecido');
        return;
    }
    
    const tipoTreino = planejamento?.tipo_atividade || 'Treino';
    const numeroTreino = planejamento?.semana_referencia || '';
    
    let html = `
        <div class="exercises-header">
            <h4>${getActionIcon('weight')} ${tipoTreino} ${numeroTreino ? '- Treino ' + numeroTreino : ''}</h4>
            <p class="exercises-count">${exercicios.length} exercício${exercicios.length !== 1 ? 's' : ''}</p>
        </div>
        <div class="exercises-grid">
    `;
    
    exercicios.forEach((exercicio, index) => {
        html += `
            <div class="exercise-card" data-exercise-id="${exercicio.id}">
                <div class="exercise-header">
                    <div class="exercise-number">${index + 1}</div>
                    <div class="exercise-info">
                        <h5 class="exercise-name">${exercicio.nome}</h5>
                        <p class="exercise-muscle">${exercicio.grupo_muscular}</p>
                    </div>
                </div>
                
                <div class="exercise-details">
                    <div class="exercise-sets">
                        <span class="label">Séries:</span>
                        <span class="value">${exercicio.series}</span>
                    </div>
                    <div class="exercise-reps">
                        <span class="label">Repetições:</span>
                        <span class="value">${exercicio.repeticoes}</span>
                    </div>
                    <div class="exercise-weight">
                        <span class="label">Peso:</span>
                        <span class="value">${exercicio.peso_base}kg</span>
                        <span class="range">(${exercicio.peso_min}-${exercicio.peso_max}kg)</span>
                    </div>
                    <div class="exercise-rest">
                        <span class="label">Descanso:</span>
                        <span class="value">${exercicio.tempo_descanso}s</span>
                    </div>
                </div>
                
                ${exercicio.equipamento ? `
                    <div class="exercise-equipment">
                        <span class="equipment-tag">${exercicio.equipamento}</span>
                    </div>
                ` : ''}
            </div>
        `;
    });
    
    html += `
        </div>
        <div class="exercises-footer">
            <p class="rm-info">💡 Pesos baseados no seu 1RM atual</p>
        </div>
    `;
    
    container.innerHTML = html;
    
    console.log('[renderizarExercicios] ✅ Exercícios renderizados:', exercicios.length);
    
    // Atualizar grupos musculares na seção de preparação
    atualizarGruposMusculares(exercicios);
}

// Atualizar grupos musculares na seção de preparação
function atualizarGruposMusculares(exercicios) {
    const container = document.getElementById('muscle-groups');
    if (!container) {
        console.log('[atualizarGruposMusculares] Container muscle-groups não encontrado');
        return;
    }
    
    if (!exercicios || exercicios.length === 0) {
        container.innerHTML = '<div class="muscle-chip">Configure treino</div>';
        console.log('[atualizarGruposMusculares] Nenhum exercício encontrado');
        return;
    }
    
    // Extrair grupos musculares únicos dos exercícios
    const gruposSet = new Set();
    
    exercicios.forEach(exercicio => {
        // Tentar diferentes campos que podem conter o grupo muscular
        const grupo = exercicio.grupo_muscular || 
                     exercicio.exercicio_grupo || 
                     exercicio.tipo_atividade ||
                     exercicio.categoria;
        
        if (grupo && grupo.trim() !== '' && grupo !== 'folga' && grupo !== 'cardio') {
            gruposSet.add(grupo.toLowerCase().trim());
        }
    });
    
    const gruposMusculares = Array.from(gruposSet);
    
    if (gruposMusculares.length === 0) {
        container.innerHTML = '<div class="muscle-chip">Treino personalizado</div>';
        console.log('[atualizarGruposMusculares] Nenhum grupo muscular identificado');
        return;
    }
    
    // Criar HTML para os chips dos grupos musculares
    const html = gruposMusculares.map(grupo => 
        `<div class="muscle-chip">${grupo}</div>`
    ).join('');
    
    container.innerHTML = html;
    
    console.log('[atualizarGruposMusculares] ✅ Grupos musculares atualizados:', gruposMusculares);
}

// Mostrar mensagem quando não há exercícios
function mostrarMensagemExercicios(mensagem, tipo = 'info', container) {
    if (!container) {
        console.error('[mostrarMensagemExercicios] Container não fornecido');
        return;
    }
    
    const iconMap = {
        'info': '📝',
        'warning': '⚠️', 
        'error': '❌'
    };
    
    container.innerHTML = `
        <div class="no-exercises-message ${tipo}">
            <div class="message-icon">${iconMap[tipo] || '📝'}</div>
            <p class="message-text">${mensagem}</p>
        </div>
    `;
    
    console.log('[mostrarMensagemExercicios] Mensagem exibida:', mensagem);
}