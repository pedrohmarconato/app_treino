// services/homeService.js - Serviço para carregar dados da home
import { query } from './supabaseService.js';
import { showNotification } from '../ui/notifications.js';
import { obterSemanaAtivaUsuario } from './weeklyPlanningService.js';

// Carregar todos os dados necessários para a home
export async function carregarDadosHome(userId) {
    try {
        console.log('[carregarDadosHome] Carregando dados para usuário:', userId);
        
        // 1. Dados do usuário
        console.log('[carregarDadosHome] 1. Buscando dados do usuário...');
        const { data: usuarios } = await query('usuarios', {
            eq: { id: userId },
            limit: 1
        });
        const usuario = usuarios && usuarios.length > 0 ? usuarios[0] : null;
        console.log('[carregarDadosHome] ✅ Usuário:', usuario);
        
        // 2. Semana ativa do usuário
        console.log('[carregarDadosHome] 2. Buscando semana ativa...');
        const semanaAtiva = await obterSemanaAtivaUsuario(userId);
        console.log('[carregarDadosHome] ✅ Semana ativa:', semanaAtiva);
        
        // 3. Planejamento da semana atual
        console.log('[carregarDadosHome] 3. Buscando planejamento da semana...');
        let planejamento = [];
        if (semanaAtiva) {
            // Usar query direta na tabela planejamento_semanal
            const hoje = new Date();
            const ano = hoje.getFullYear();
            const semana = Math.ceil((((hoje - new Date(ano, 0, 1)) / 86400000) + 1) / 7);
            
            const { data: planejamentoData } = await query('planejamento_semanal', {
                eq: { 
                    usuario_id: userId,
                    ano: ano,
                    semana: semana
                },
                order: { column: 'dia_semana', ascending: true }
            });
            planejamento = planejamentoData || [];
        }
        console.log('[carregarDadosHome] ✅ Planejamento:', planejamento);
        
        // 4. Estatísticas de treinos
        console.log('[carregarDadosHome] 4. Calculando estatísticas...');
        // Calcular estatísticas baseadas no planejamento
        const treinosConcluidos = planejamento.filter(p => p.concluido).length;
        const treinosPlanejados = planejamento.length;
        const percentualConclusao = treinosPlanejados > 0 ? 
            Math.round((treinosConcluidos / treinosPlanejados) * 100) : 0;
            
        const estatisticas = {
            total_treinos_realizados: treinosConcluidos,
            total_treinos_planejados: treinosPlanejados,
            percentual_conclusao: percentualConclusao
        };
        console.log('[carregarDadosHome] ✅ Estatísticas:', estatisticas);
        
        // 5. Buscar treino do dia atual
        console.log('[carregarDadosHome] 5. Buscando treino de hoje...');
        const hoje = new Date().getDay(); // 0 = domingo, 1 = segunda, etc.
        const { dayToDb } = await import('./weeklyPlanningService.js');
        const diaSemanaBanco = dayToDb(hoje); // Converter para formato do banco (1-7)
        
        const treinoHoje = planejamento.find(p => p.dia_semana === diaSemanaBanco);
        console.log('[carregarDadosHome] ✅ Treino de hoje:', treinoHoje);
        
        const dadosCompletos = {
            usuario,
            semanaAtiva,
            planejamento,
            estatisticas,
            treinoHoje
        };
        
        console.log('[carregarDadosHome] ✅ Dados completos carregados:', dadosCompletos);
        return dadosCompletos;
        
    } catch (error) {
        console.error('[carregarDadosHome] ❌ Erro ao carregar dados da home:', error);
        throw error;
    }
}

// Atualizar elementos da UI com os dados carregados
export function atualizarUIHome(dados) {
    try {
        console.log('[atualizarUIHome] Atualizando UI com dados:', dados);
        
        // Popular nome do usuário
        const userNameEl = document.getElementById('user-name');
        if (userNameEl && dados.usuario) {
            userNameEl.textContent = dados.usuario.nome || 'Usuário';
            console.log('[atualizarUIHome] ✅ Nome do usuário atualizado');
        }
        
        // Popular semana atual e progresso
        if (dados.semanaAtiva) {
            const currentWeekEl = document.getElementById('current-week');
            if (currentWeekEl) {
                currentWeekEl.textContent = `Semana ${dados.semanaAtiva.semana_treino}`;
                console.log('[atualizarUIHome] ✅ Semana atual atualizada');
            }
            
            const progressPercentageEl = document.getElementById('progress-percentage');
            if (progressPercentageEl) {
                const percentual = dados.semanaAtiva.percentual_1rm_calculado || 70;
                progressPercentageEl.textContent = `${percentual}%`;
                console.log('[atualizarUIHome] ✅ Percentual de progresso atualizado');
            }
        }
        
        // Popular estatísticas
        if (dados.estatisticas) {
            const completedWorkoutsEl = document.getElementById('completed-workouts');
            if (completedWorkoutsEl) {
                completedWorkoutsEl.textContent = dados.estatisticas.total_treinos_realizados || 0;
                console.log('[atualizarUIHome] ✅ Treinos concluídos atualizado');
            }
            
            const userWorkoutsEl = document.getElementById('user-workouts');
            if (userWorkoutsEl) {
                userWorkoutsEl.textContent = dados.estatisticas.total_treinos_realizados || 0;
                console.log('[atualizarUIHome] ✅ User workouts atualizado');
            }
        }
        
        // Popular dados do treino de hoje
        if (dados.treinoHoje) {
            const workoutNameEl = document.getElementById('workout-name');
            if (workoutNameEl) {
                const nomeAtividade = formatarNomeAtividade(dados.treinoHoje.tipo_atividade);
                workoutNameEl.textContent = nomeAtividade;
                console.log('[atualizarUIHome] ✅ Nome do treino atualizado');
            }
            
            const workoutTypeEl = document.getElementById('workout-type');
            if (workoutTypeEl) {
                const tipoAtividade = formatarTipoAtividade(dados.treinoHoje.tipo_atividade);
                workoutTypeEl.textContent = tipoAtividade;
                console.log('[atualizarUIHome] ✅ Tipo do treino atualizado');
            }
            
            const workoutExercisesEl = document.getElementById('workout-exercises');
            if (workoutExercisesEl) {
                const descricaoAtividade = formatarDescricaoAtividade(dados.treinoHoje);
                workoutExercisesEl.textContent = descricaoAtividade;
                console.log('[atualizarUIHome] ✅ Descrição dos exercícios atualizada');
            }
        } else {
            // Sem treino para hoje
            const workoutNameEl = document.getElementById('workout-name');
            if (workoutNameEl) {
                workoutNameEl.textContent = 'Nenhum treino hoje';
            }
            
            const workoutTypeEl = document.getElementById('workout-type');
            if (workoutTypeEl) {
                workoutTypeEl.textContent = 'Descanso';
            }
            
            const workoutExercisesEl = document.getElementById('workout-exercises');
            if (workoutExercisesEl) {
                workoutExercisesEl.textContent = 'Dia de recuperação';
            }
            
            console.log('[atualizarUIHome] ✅ Configurado para dia sem treino');
        }
        
        console.log('[atualizarUIHome] ✅ UI da home atualizada com sucesso');
        
    } catch (error) {
        console.error('[atualizarUIHome] ❌ Erro ao atualizar UI:', error);
        showNotification('Erro ao atualizar interface', 'error');
    }
}

// Funções auxiliares para formatação
function formatarNomeAtividade(tipoAtividade) {
    if (!tipoAtividade) return 'Sem treino';
    
    switch(tipoAtividade.toLowerCase()) {
        case 'cardio':
        case 'cardiovascular':
            return 'Treino Cardiovascular';
        case 'folga':
        case 'descanso':
            return 'Dia de Folga';
        default:
            return `Treino ${tipoAtividade}`;
    }
}

function formatarTipoAtividade(tipoAtividade) {
    if (!tipoAtividade) return 'Configure';
    
    switch(tipoAtividade.toLowerCase()) {
        case 'cardio':
        case 'cardiovascular':
            return 'Cardio';
        case 'folga':
        case 'descanso':
            return 'Descanso';
        default:
            return 'Musculação';
    }
}

function formatarDescricaoAtividade(treino) {
    if (!treino || !treino.tipo_atividade) return 'Configure seu planejamento';
    
    const tipo = treino.tipo_atividade.toLowerCase();
    
    switch(tipo) {
        case 'cardio':
        case 'cardiovascular':
            return 'Exercícios aeróbicos • 30-45min';
        case 'folga':
        case 'descanso':
            return 'Repouso e recuperação';
        default:
            return `Treino ${treino.tipo_atividade} • Força • ~45min`;
    }
}

// Função principal para inicializar a home
export async function inicializarHome() {
    try {
        console.log('[inicializarHome] Iniciando carregamento da home...');
        
        // Aguardar um pouco para garantir que o template foi renderizado
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Obter usuário atual
        const currentUser = window.AppState?.get('currentUser');
        if (!currentUser || !currentUser.id) {
            console.error('[inicializarHome] ❌ Usuário não encontrado');
            showNotification('Usuário não encontrado. Faça login novamente.', 'error');
            return;
        }
        
        console.log('[inicializarHome] 👤 Usuário encontrado:', currentUser.id);
        
        // Carregar dados
        const dados = await carregarDadosHome(currentUser.id);
        
        // Atualizar UI
        atualizarUIHome(dados);
        
        console.log('[inicializarHome] ✅ Home inicializada com sucesso');
        
    } catch (error) {
        console.error('[inicializarHome] ❌ Erro ao inicializar home:', error);
        showNotification('Erro ao carregar dados da home', 'error');
    }
}

// Função de teste para validar o fluxo completo
export async function testarFluxoCompleto() {
    console.log('🧪 [testarFluxoCompleto] INICIANDO TESTE DO FLUXO COMPLETO');
    
    try {
        // 1. Verificar usuário logado
        const currentUser = window.AppState?.get('currentUser');
        if (!currentUser || !currentUser.id) {
            console.error('❌ [testarFluxoCompleto] Usuário não logado');
            if (window.showNotification) {
                window.showNotification('❌ Faça login primeiro para testar', 'error');
            }
            return { success: false, error: 'Usuário não logado' };
        }
        
        console.log('✅ [testarFluxoCompleto] 1. Usuário logado:', currentUser.id);
        
        // 2. Testar verificação se precisa de planejamento
        const { needsWeekPlanningAsync } = await import('../services/weeklyPlanningService.js');
        const precisaPlanejamento = await needsWeekPlanningAsync(currentUser.id);
        console.log('✅ [testarFluxoCompleto] 2. Precisa de planejamento:', precisaPlanejamento);
        
        // 3. Testar carregamento de dados da home
        const dados = await carregarDadosHome(currentUser.id);
        console.log('✅ [testarFluxoCompleto] 3. Dados da home carregados:', dados);
        
        // 4. Testar atualização da UI
        atualizarUIHome(dados);
        console.log('✅ [testarFluxoCompleto] 4. UI atualizada');
        
        // 5. Verificar elementos da UI
        const elementos = {
            userNameEl: document.getElementById('user-name'),
            currentWeekEl: document.getElementById('current-week'),
            progressPercentageEl: document.getElementById('progress-percentage'),
            completedWorkoutsEl: document.getElementById('completed-workouts'),
            workoutNameEl: document.getElementById('workout-name'),
            workoutTypeEl: document.getElementById('workout-type')
        };
        
        const elementosEncontrados = Object.keys(elementos).filter(key => elementos[key] !== null);
        console.log('✅ [testarFluxoCompleto] 5. Elementos encontrados:', elementosEncontrados);
        
        // 6. Verificar se dados foram populados
        const dadosPopulados = {
            userName: elementos.userNameEl?.textContent || 'N/A',
            currentWeek: elementos.currentWeekEl?.textContent || 'N/A',
            progressPercentage: elementos.progressPercentageEl?.textContent || 'N/A',
            completedWorkouts: elementos.completedWorkoutsEl?.textContent || 'N/A',
            workoutName: elementos.workoutNameEl?.textContent || 'N/A',
            workoutType: elementos.workoutTypeEl?.textContent || 'N/A'
        };
        console.log('✅ [testarFluxoCompleto] 6. Dados populados:', dadosPopulados);
        
        const resultado = {
            success: true,
            usuarioLogado: !!currentUser,
            precisaPlanejamento,
            dadosCarregados: !!dados,
            elementosEncontrados: elementosEncontrados.length,
            dadosPopulados
        };
        
        console.log('🎉 [testarFluxoCompleto] TESTE COMPLETO - SUCESSO!', resultado);
        
        if (window.showNotification) {
            window.showNotification(`✅ Teste completo PASSOU! ${elementosEncontrados.length} elementos encontrados`, 'success');
        }
        
        return resultado;
        
    } catch (error) {
        console.error('❌ [testarFluxoCompleto] ERRO:', error);
        
        if (window.showNotification) {
            window.showNotification('❌ Erro no teste: ' + error.message, 'error');
        }
        
        return { success: false, error: error.message };
    }
}

// Disponibilizar teste globalmente
window.testarFluxoCompleto = testarFluxoCompleto;

export default {
    carregarDadosHome,
    atualizarUIHome,
    inicializarHome,
    testarFluxoCompleto
};