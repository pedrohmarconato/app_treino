// js/features/planning.js
// Lógica do planejamento semanal

import AppState from '../state/appState.js';
import { saveWeekPlan, getWeekPlan } from '../utils/weekPlanStorage.js';
import { fetchTiposTreinoMuscular } from '../services/userService.js';
import { showNotification } from '../ui/notifications.js';
import { mostrarTela } from '../ui/navigation.js';

// Variáveis do planejamento
let planejamentoAtual = {};
let treinosDisponiveis = [];
let usuarioIdAtual = null;
let diaAtualSelecionado = null;
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
        // Buscar tipos de treino muscular do plano do usuário
        const tiposMusculares = await fetchTiposTreinoMuscular(usuarioId);

        // Criar treinos disponíveis
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

        // Verificar se existe planejamento salvo
        const planoSalvo = getWeekPlan(usuarioId);
        if (planoSalvo) {
            planejamentoAtual = planoSalvo;
        } else {
            planejamentoAtual = {};
        }
        
        // Renderizar interface
        renderizarTreinosDisponiveis();
        renderizarPlanejamentoExistente();
        
    } catch (error) {
        console.error('[inicializarPlanejamento] Erro:', error);
        showNotification('Erro ao carregar dados do planejamento', 'error');
    }
}

// Renderizar treinos disponíveis (atualizada para mobile)
function renderizarTreinosDisponiveis() {
    // No layout mobile, não precisamos renderizar treinos disponíveis
    // pois eles aparecem no popup quando o usuário clica no dia
    console.log('[renderizarTreinosDisponiveis] Treinos carregados para popup:', treinosDisponiveis);
}

// Renderizar planejamento existente (atualizada para mobile)
function renderizarPlanejamentoExistente() {
    Object.keys(planejamentoAtual).forEach(dia => {
        const treino = planejamentoAtual[dia];
        if (treino && treino.id && treino.nome && treino.tipo) {
            atualizarVisualizacaoDia(dia, treino);
        }
    });
    validarPlanejamento();
}

// Atualizar função de validação para mobile
function validarPlanejamento() {
    const btnSalvar = document.getElementById('confirm-plan-btn');
    const validationMessageElement = document.getElementById('plan-validation-message');
    
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

    // Validação 2: Não repetir grupos musculares
    for (const tipo in tiposMuscularesNoPlano) {
        if (tiposMuscularesNoPlano[tipo] > 1) {
            messages.push(`❌ O grupo muscular '${tipo}' está repetido.`);
            isValid = false;
        }
    }

    // Validação 3: Pelo menos um treino muscular na semana
    const temTreinoMuscular = Object.values(planejamentoAtual).some(treino => 
        treino && treino.categoria === 'muscular'
    );
    
    if (!temTreinoMuscular && diasPreenchidos > 0) {
        messages.push(`❌ Adicione pelo menos um treino muscular na semana.`);
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

    return isValid && diasPreenchidos === 7;
}

// Abrir seletor de treino
window.abrirSeletorTreino = function(dia, nomeDia) {
    diaAtualSelecionado = dia;
    nomeDiaAtual = nomeDia;
    
    const popup = document.getElementById('seletorTreinoPopup');
    const title = document.getElementById('popup-day-title');
    const options = document.getElementById('treino-options');
    
    if (!popup || !title || !options) return;
    
    title.textContent = `${nomeDia} - Selecionar Treino`;
    
    // Criar opções
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
    diaAtualSelecionado = null;
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
    // Adicionar treino ao planejamento
    planejamentoAtual[dia] = {
        id: treino.id,
        nome: treino.nome,
        tipo: treino.tipo,
        categoria: treino.categoria
    };
    
    // Atualizar visualização do dia
    atualizarVisualizacaoDia(dia, treino);
    
    // Fechar popup
    fecharSeletorTreino();
    
    // Validar planejamento
    validarPlanejamento();
    
    // Mostrar feedback
    showNotification(`${treino.nome} adicionado para ${nomeDiaAtual}`, 'success');
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
                <button class="remove-treino" onclick="removerTreinoDoDiaMobile('${dia}')">×</button>
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
                <button class="remove-treino" onclick="removerTreinoDoDiaMobile('${dia}')">×</button>
            </div>
        `;
    }
}

// Remover treino do dia (versão mobile)
window.removerTreinoDoDiaMobile = function(dia) {
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
    showNotification('Treino removido', 'info');
};

// Salvar planejamento semanal
export async function salvarPlanejamentoSemanal() {
    if (!validarPlanejamento()) {
        showNotification('Planejamento inválido. Verifique as mensagens.', 'error');
        return;
    }

    if (!usuarioIdAtual) {
        showNotification('Erro: usuário não identificado', 'error');
        return;
    }
    
    try {
        // Converter planejamento para formato do weekPlan
        const weekPlan = {};
        for (let dia = 0; dia < 7; dia++) {
            if (planejamentoAtual[dia]) {
                weekPlan[dia] = planejamentoAtual[dia].tipo;
            } else {
                weekPlan[dia] = 'folga';
            }
        }
        
        // Salvar no localStorage
        const saved = saveWeekPlan(usuarioIdAtual, weekPlan);
        
        if (saved) {
            AppState.set('weekPlan', weekPlan);
            showNotification('Planejamento salvo com sucesso!', 'success');
            fecharModalPlanejamento();
            
            // Recarregar dashboard
            if (window.carregarDashboard) {
                await window.carregarDashboard();
            }
            
            // Navegar para home
            mostrarTela('home-screen');
        } else {
            showNotification('Erro ao salvar planejamento', 'error');
        }
        
    } catch (error) {
        console.error('[salvarPlanejamentoSemanal] Erro:', error);
        showNotification('Erro ao salvar planejamento', 'error');
    }
}

// Fechar modal de planejamento
export function fecharModalPlanejamento() {
    const modal = document.getElementById('modalPlanejamento');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Limpar estado
    planejamentoAtual = {};
    treinosDisponiveis = [];
    usuarioIdAtual = null;
    diaAtualSelecionado = null;
    nomeDiaAtual = '';
}

// Função removerTreinoDoDia mantida para compatibilidade
export function removerTreinoDoDia(dia) {
    return removerTreinoDoDiaMobile(dia);
}