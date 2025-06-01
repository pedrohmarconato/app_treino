// js/features/planning.js - CORREÇÃO DO MODAL
// Versão corrigida que fecha o modal adequadamente

import AppState from '../state/appState.js';
import { 
    saveWeeklyPlan, 
    getActiveWeeklyPlan
} from '../services/weeklyPlanningService.js';
import { weeklyPlanManager } from '../hooks/useWeeklyPlan.js';
import { fetchTiposTreinoMuscular } from '../services/userService.js';
import { saveWeekPlanToSupabase, getWeekPlanFromSupabase } from '../utils/weekPlanStorage.js';
import { saveWeekPlan, getWeekPlan } from '../utils/weekPlanStorage.js';
import { showNotification } from '../ui/notifications.js';

// Variáveis do planejamento
let planejamentoAtual = {};
let treinosDisponiveis = [];
let usuarioIdAtual = null;
let nomeDiaAtual = '';

// Mapear emojis para os tipos de treino
const treinoEmojis = {
    'Costas': '🔙',
    'Peito': '💪',
    'Pernas': '🦵',
    'Ombro e Braço': '💪',
    'Cardio': '🏃',
    'Folga': '😴',
    'Ombro': '🎯',
    'Braço': '💪'
};

// Inicializar planejamento
export async function inicializarPlanejamento(usuarioId) {
    console.log('[inicializarPlanejamento] Iniciando para usuário:', usuarioId);
    usuarioIdAtual = usuarioId;
    
    try {
        // 1. Verificar se já existe plano ativo no banco
        const planoExistente = await getActiveWeeklyPlan(usuarioId);
        
        if (planoExistente) {
            console.log('[inicializarPlanejamento] Plano existente encontrado, carregando...');
            planejamentoAtual = planoExistente;
            await finalizarPlanejamentoExistente();
            return;
        }
        
        // 2. Buscar tipos de treino muscular do plano do usuário
        const tiposMusculares = await fetchTiposTreinoMuscular(usuarioId);

        // 3. Criar treinos disponíveis
        treinosDisponiveis = [];
        let treinoIdCounter = 1;

        // Adicionar treinos musculares
        tiposMusculares.forEach(tipo => {
            treinosDisponiveis.push({
                id: `muscular_${treinoIdCounter++}`,
                nome: `Muscular: ${tipo}`,
                tipo: tipo,
                categoria: 'muscular' 
            });
        });

        // Adicionar treinos de Cardio
        for (let i = 0; i < 3; i++) {
            treinosDisponiveis.push({
                id: `cardio_${treinoIdCounter++}`,
                nome: 'Cardio',
                tipo: 'Cardio',
                categoria: 'cardio'
            });
        }
        
        console.log('[inicializarPlanejamento] Treinos disponíveis montados:', treinosDisponiveis);

        // 4. Buscar planejamento existente (Supabase primeiro, depois localStorage)
        let planoSalvo = await getWeekPlanFromSupabase(usuarioId);
        if (!planoSalvo) {
            console.log('[inicializarPlanejamento] Nenhum plano no Supabase, buscando localStorage...');
            planoSalvo = getWeekPlan(usuarioId);
        }
        
        if (planoSalvo) {
            planejamentoAtual = planoSalvo;
            console.log('[inicializarPlanejamento] Plano carregado:', planoSalvo);
        } else {
            planejamentoAtual = {};
            console.log('[inicializarPlanejamento] Nenhum plano encontrado, iniciando vazio');
        }
        
        // 5. Renderizar interface
        renderizarPlanejamentoExistente();
        
    } catch (error) {
        console.error('[inicializarPlanejamento] Erro:', error);
        if (window.showNotification) {
            window.showNotification('Erro ao carregar dados do planejamento', 'error');
        }
    }
}

// Finalizar quando já existe plano
async function finalizarPlanejamentoExistente() {
    try {
        const currentUser = AppState.get('currentUser');
        if (currentUser) {
            const planResult = await weeklyPlanManager.initialize(currentUser.id);
            
            if (!planResult.needsPlanning) {
                // CORREÇÃO: Fechar modal explicitamente antes de navegar
                forcarFechamentoModal();
                
                if (window.renderTemplate) {
                    window.renderTemplate('home');
                } else if (window.mostrarTela) {
                    window.mostrarTela('home-screen');
                }
                
                if (window.carregarDashboard) {
                    setTimeout(async () => {
                        await window.carregarDashboard();
                    }, 300);
                }
                
                if (window.showNotification) {
                    window.showNotification('Plano semanal carregado!', 'success');
                }
                return;
            }
        }
        
        console.warn('[finalizarPlanejamentoExistente] Plano existente inválido, continuando com planejamento');
        
    } catch (error) {
        console.error('[finalizarPlanejamentoExistente] Erro:', error);
        if (window.showNotification) {
            window.showNotification('Erro ao carregar plano existente', 'error');
        }
    }
}

// NOVA FUNÇÃO: Forçar fechamento completo do modal
function forcarFechamentoModal() {
    console.log('[forcarFechamentoModal] Forçando fechamento do modal...');
    
    try {
        // Método 1: modalPlanejamento (ID principal)
        const modal1 = document.getElementById('modalPlanejamento');
        if (modal1) {
            modal1.style.display = 'none';
            modal1.style.visibility = 'hidden';
            modal1.style.opacity = '0';
            modal1.classList.add('hidden');
            console.log('[forcarFechamentoModal] Modal modalPlanejamento fechado');
        }
        
        // Método 2: modal-planejamento (ID alternativo)
        const modal2 = document.getElementById('modal-planejamento');
        if (modal2) {
            modal2.style.display = 'none';
            modal2.style.visibility = 'hidden';
            modal2.style.opacity = '0';
            modal2.classList.add('hidden');
            console.log('[forcarFechamentoModal] Modal modal-planejamento fechado');
        }
        
        // Método 3: Buscar por classe
        const modals = document.querySelectorAll('.modal-overlay, .planning-page-container, .modal');
        modals.forEach((modal, index) => {
            modal.style.display = 'none';
            modal.style.visibility = 'hidden';
            modal.style.opacity = '0';
            modal.classList.add('hidden');
            console.log(`[forcarFechamentoModal] Modal ${index + 1} por classe fechado`);
        });
        
        // Método 4: Remover overlay do body
        document.body.style.overflow = '';
        document.body.classList.remove('modal-open');
        
        // Método 5: Remover elementos dinâmicos
        const dynamicModals = document.querySelectorAll('[id*="modal"], [id*="Modal"], [class*="modal"]');
        dynamicModals.forEach((el, index) => {
            if (el.style.position === 'fixed' || el.style.position === 'absolute') {
                el.style.display = 'none';
                console.log(`[forcarFechamentoModal] Modal dinâmico ${index + 1} fechado`);
            }
        });
        
        console.log('[forcarFechamentoModal] Fechamento completo concluído');
        
    } catch (error) {
        console.error('[forcarFechamentoModal] Erro:', error);
    }
}

// Renderizar planejamento existente
function renderizarPlanejamentoExistente() {
    Object.keys(planejamentoAtual).forEach(dia => {
        const treino = planejamentoAtual[dia];
        if (treino && treino.id && treino.nome && treino.tipo) {
            atualizarVisualizacaoDia(dia, treino);
        }
    });
    validarPlanejamento();
}

// Validar planejamento
function validarPlanejamento() {
    const btnSalvar = document.querySelector('.btn-save') || document.getElementById('confirm-plan-btn');
    const validationMessageElement = document.getElementById('validationMessage');
    
    let diasPreenchidos = 0;
    let isValid = true;
    const messages = [];
    const tiposMuscularesNoPlano = {};

    // Contar dias preenchidos
    for (const diaKey in planejamentoAtual) {
        if (planejamentoAtual.hasOwnProperty(diaKey) && planejamentoAtual[diaKey]) {
            diasPreenchidos++;
            const treinoDoDia = planejamentoAtual[diaKey];
            if (treinoDoDia.categoria === 'muscular') {
                tiposMuscularesNoPlano[treinoDoDia.tipo] = (tiposMuscularesNoPlano[treinoDoDia.tipo] || 0) + 1;
            }
        }
    }

    // Validação 1: Todos os 7 dias devem estar preenchidos
    if (diasPreenchidos < 7) {
        messages.push(`❌ Preencha todos os 7 dias da semana (faltam ${7 - diasPreenchidos}).`);
        isValid = false;
    }

    // Validação 2: Não repetir grupos musculares (apenas aviso)
    for (const tipo in tiposMuscularesNoPlano) {
        if (tiposMuscularesNoPlano[tipo] > 1) {
            messages.push(`⚠️ O grupo muscular '${tipo}' está repetido.`);
        }
    }

    // Validação 3: Pelo menos um treino na semana
    const temAlgumTreino = Object.values(planejamentoAtual).some(treino => 
        treino && (treino.categoria === 'muscular' || treino.categoria === 'cardio')
    );
    
    if (!temAlgumTreino && diasPreenchidos > 0) {
        messages.push(`❌ Adicione pelo menos um treino na semana.`);
        isValid = false;
    }

    // Atualizar UI
    if (validationMessageElement) {
        validationMessageElement.classList.remove('success', 'error');
        
        if (isValid && diasPreenchidos === 7) {
            validationMessageElement.textContent = '✅ Planejamento válido! Pronto para salvar.';
            validationMessageElement.classList.add('success');
            validationMessageElement.style.display = 'block';
        } else if (messages.length > 0) {
            validationMessageElement.innerHTML = messages.join('<br>');
            validationMessageElement.classList.add('error');
            validationMessageElement.style.display = 'block';
        } else {
            validationMessageElement.style.display = 'none';
        }
    }

    if (btnSalvar) {
        btnSalvar.disabled = !isValid || diasPreenchidos < 7;
    }

    console.log('[validarPlanejamento] Validação:', { isValid, diasPreenchidos, messages });
    return isValid && diasPreenchidos === 7;
}

// Abrir seletor de treino
window.abrirSeletorTreino = function(dia, nomeDia) {
    const diaAtualSelecionado = dia;
    nomeDiaAtual = nomeDia;
    
    const popup = document.getElementById('seletorTreinoPopup');
    const title = document.getElementById('popup-day-title');
    const options = document.getElementById('treino-options');
    
    if (!popup || !title || !options) return;
    
    title.textContent = `${nomeDia} - Selecionar Treino`;
    options.innerHTML = '';
    
    // Adicionar opção de folga
    const folgaOption = criarOpcaoTreino({
        id: 'folga',
        emoji: '😴',
        nome: 'Folga',
        descricao: 'Dia de descanso',
        tipo: 'folga',
        categoria: 'folga'
    }, dia);
    options.appendChild(folgaOption);
    
    // Adicionar opção de cardio
    const cardioOption = criarOpcaoTreino({
        id: 'cardio',
        emoji: '🏃',
        nome: 'Cardio',
        descricao: 'Exercícios cardiovasculares',
        tipo: 'Cardio',
        categoria: 'cardio'
    }, dia);
    options.appendChild(cardioOption);
    
    // Adicionar treinos musculares
    treinosDisponiveis.forEach(treino => {
        if (treino.categoria === 'muscular') {
            const option = criarOpcaoTreino({
                id: treino.id,
                emoji: treinoEmojis[treino.tipo] || '🏋️',
                nome: treino.tipo,
                descricao: `Treino ${treino.tipo}`,
                tipo: treino.tipo,
                categoria: 'muscular'
            }, dia);
            options.appendChild(option);
        }
    });
    
    popup.style.display = 'flex';
    document.body.style.overflow = 'hidden';
};

// Fechar seletor de treino
window.fecharSeletorTreino = function() {
    const popup = document.getElementById('seletorTreinoPopup');
    if (popup) {
        popup.style.display = 'none';
        document.body.style.overflow = '';
    }
    nomeDiaAtual = '';
};

// Criar opção de treino
function criarOpcaoTreino(treino, diaDestino) {
    const option = document.createElement('div');
    option.className = 'treino-option';
    
    // Verificar se o treino já está usado (para musculares)
    let isDisabled = false;
    let statusText = '';
    
    if (treino.categoria === 'muscular') {
        for (const dia in planejamentoAtual) {
            const treinoExistente = planejamentoAtual[dia];
            if (treinoExistente && treinoExistente.tipo === treino.tipo && dia != diaDestino) {
                isDisabled = true;
                statusText = 'Já utilizado';
                break;
            }
        }
    }
    
    if (isDisabled) {
        option.classList.add('disabled');
    }
    
    option.innerHTML = `
        <span class="option-emoji">${treino.emoji}</span>
        <div class="option-info">
            <div class="option-name">${treino.nome}</div>
            <div class="option-description">${treino.descricao}</div>
            ${statusText ? `<div class="option-status">${statusText}</div>` : ''}
        </div>
    `;
    
    if (!isDisabled) {
        option.addEventListener('click', () => {
            selecionarTreinoParaDia(treino, diaDestino);
        });
    }
    
    return option;
}

// Selecionar treino para um dia
function selecionarTreinoParaDia(treino, dia) {
    planejamentoAtual[dia] = {
        id: treino.id,
        nome: treino.nome,
        tipo: treino.tipo,
        categoria: treino.categoria
    };
    
    atualizarVisualizacaoDia(dia, treino);
    fecharSeletorTreino();
    validarPlanejamento();
    
    if (window.showNotification) {
        window.showNotification(`${treino.nome} adicionado para ${nomeDiaAtual}`, 'success');
    }
}

// Atualizar visualização do dia
function atualizarVisualizacaoDia(dia, treino) {
    const dayContent = document.getElementById(`dia-${dia}-content`);
    if (!dayContent) return;
    
    if (treino.categoria === 'folga') {
        dayContent.innerHTML = `
            <div class="treino-assigned">
                <span class="treino-emoji">😴</span>
                <div class="treino-info">
                    <div class="treino-name">Folga</div>
                    <div class="treino-type">Descanso</div>
                </div>
                <button class="remove-treino" onclick="removerTreinoDoDia('${dia}')">×</button>
            </div>
        `;
    } else {
        dayContent.innerHTML = `
            <div class="treino-assigned">
                <span class="treino-emoji">${treinoEmojis[treino.tipo] || '🏋️'}</span>
                <div class="treino-info">
                    <div class="treino-name">${treino.nome}</div>
                    <div class="treino-type">${treino.categoria === 'cardio' ? 'Cardiovascular' : 'Muscular'}</div>
                </div>
                <button class="remove-treino" onclick="removerTreinoDoDia('${dia}')">×</button>
            </div>
        `;
    }
}

// Remover treino do dia
window.removerTreinoDoDia = function(dia) {
    delete planejamentoAtual[dia];
    
    const dayContent = document.getElementById(`dia-${dia}-content`);
    if (dayContent) {
        dayContent.innerHTML = `
            <div class="empty-slot">
                <svg viewBox="0 0 24 24" width="24" height="24">
                    <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
                </svg>
                <span>Adicionar</span>
            </div>
        `;
    }
    
    validarPlanejamento();
    if (window.showNotification) {
        window.showNotification('Treino removido', 'info');
    }
};

// FUNÇÃO PRINCIPAL: Salvar planejamento semanal - VERSÃO CORRIGIDA
export async function salvarPlanejamentoSemanal() {
    console.log('[salvarPlanejamentoSemanal] Iniciando salvamento...');

    if (!validarPlanejamento()) {
        if (window.showNotification) {
            window.showNotification('Planejamento inválido. Verifique as mensagens.', 'error');
        }
        return;
    }

    if (!usuarioIdAtual) {
        if (window.showNotification) {
            window.showNotification('Erro: usuário não identificado', 'error');
        }
        return;
    }

    try {
        if (window.showNotification) {
            window.showNotification('Salvando planejamento...', 'info');
        }

        // Mapeamento textual para índice de dias da semana (0=Dom, 6=Sáb)
        const diasMap = {
            'domingo': 0, 'segunda': 1, 'terca': 2, 'quarta': 3,
            'quinta': 4, 'sexta': 5, 'sabado': 6
        };

        // Inicializa todos os dias como folga
        const planejamentoParaSupabase = {};
        for (let dia = 0; dia < 7; dia++) {
            planejamentoParaSupabase[dia] = {
                tipo: 'folga',
                categoria: 'folga',
                numero_treino: null,
                concluido: false
            };
        }

        // Preenche com os dados do planejamento atual
        Object.entries(planejamentoAtual).forEach(([diaKey, treino]) => {
            const diaIndex = diasMap[diaKey];
            if (diaIndex !== undefined && treino) {
                planejamentoParaSupabase[diaIndex] = {
                    tipo: treino.tipo || 'folga',
                    categoria: treino.categoria || 'folga',
                    numero_treino: treino.numero_treino || null,
                    concluido: false
                };
            }
        });

        console.log('[salvarPlanejamentoSemanal] Planejamento convertido:', planejamentoParaSupabase);

        // Salva no Supabase
        const resultado = await saveWeeklyPlan(usuarioIdAtual, planejamentoParaSupabase);

        if (!resultado.success) {
            throw new Error(resultado.error || 'Erro ao salvar no banco');
        }

        // Backup no localStorage
        const weekPlanLocalStorage = {};
        for (let dia = 0; dia < 7; dia++) {
            weekPlanLocalStorage[dia] = planejamentoParaSupabase[dia].tipo;
        }
        saveWeekPlan(usuarioIdAtual, weekPlanLocalStorage);

        // Atualiza estado global
        AppState.set('weekPlan', planejamentoParaSupabase);

        // Simula treino do dia para inicialização
        const hoje = new Date().getDay();
        const treinoDoDia = planejamentoParaSupabase[hoje];
        if (treinoDoDia) {
            const mockWorkout = {
                tipo: treinoDoDia.tipo,
                nome: treinoDoDia.tipo === 'folga' ? 'Dia de Folga' :
                      treinoDoDia.tipo === 'Cardio' ? 'Cardio' :
                      `Treino ${treinoDoDia.tipo}`,
                exercicios: [],
                numero_treino: treinoDoDia.numero_treino
            };
            AppState.set('currentWorkout', mockWorkout);
        }

        if (window.showNotification) {
            window.showNotification('✅ Planejamento salvo com sucesso!', 'success');
        }

        // CORREÇÃO PRINCIPAL: Forçar fechamento antes de navegar
        console.log('[salvarPlanejamentoSemanal] Forçando fechamento do modal...');
        forcarFechamentoModal();
        
        // Aguardar fechamento
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Navegação robusta
        console.log('[salvarPlanejamentoSemanal] Navegando para home...');
        if (window.renderTemplate) {
            window.renderTemplate('home');
        } else if (window.mostrarTela) {
            window.mostrarTela('home-screen');
        }

        // Carregar dashboard
        setTimeout(async () => {
            try {
                if (window.carregarDashboard) {
                    await window.carregarDashboard();
                    console.log('[salvarPlanejamentoSemanal] Dashboard carregado com sucesso');
                }
            } catch (dashboardError) {
                console.warn('[salvarPlanejamentoSemanal] Erro no dashboard (não crítico):', dashboardError);
            }
        }, 400);

        console.log('[salvarPlanejamentoSemanal] Salvamento concluído com sucesso!');
        
    } catch (error) {
        console.error('[salvarPlanejamentoSemanal] Erro:', error);
        if (window.showNotification) {
            window.showNotification('Erro ao salvar planejamento: ' + error.message, 'error');
        }
    }
}

// Fechar modal de planejamento - VERSÃO CORRIGIDA
export function fecharModalPlanejamento() {
    console.log('[fecharModalPlanejamento] Fechando modal...');
    
    // Usar função robusta de fechamento
    forcarFechamentoModal();
    
    // Limpar estado
    planejamentoAtual = {};
    treinosDisponiveis = [];
    usuarioIdAtual = null;
    nomeDiaAtual = '';
}

// Função para verificar se precisa de planejamento - SUPABASE + localStorage
export async function needsWeekPlanningAsync(userId) {
    // Primeiro verifica Supabase
    const supabasePlan = await getWeekPlanFromSupabase(userId);
    if (supabasePlan) return false;
    // Fallback para localStorage
    const localPlan = getWeekPlan(userId);
    return !localPlan;
}

// Exportar função removerTreinoDoDia para compatibilidade
export const removerTreinoDoDia = window.removerTreinoDoDia;

// Função global para compatibilidade com o template
window.salvarPlanejamento = async function() {
    await salvarPlanejamentoSemanal();
};

// Também disponibilizar outras funções necessárias
window.inicializarPlanejamento = inicializarPlanejamento;
window.fecharModalPlanejamento = fecharModalPlanejamento;

// Função global para forçar fechamento (para emergências)
window.forcarFechamentoModal = forcarFechamentoModal;