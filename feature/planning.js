// js/features/planning.js - CORREÇÃO DO MODAL
// Versão corrigida que fecha o modal adequadamente

import AppState from '../state/appState.js';
import WeeklyPlanService from '../services/weeklyPlanningService.js';
import { weeklyPlanManager } from '../hooks/useWeeklyPlan.js';
import { fetchTiposTreinoMuscular, fetchProtocoloAtivoUsuario } from '../services/userService.js';
import { query } from '../services/supabaseService.js';
import { showNotification } from '../ui/notifications.js';

// Variáveis do planejamento
let planejamentoAtual = {};
let treinosDisponiveis = [];
let usuarioIdAtual = null;
let nomeDiaAtual = '';
let diasEditaveis = []; // Controla quais dias podem ser editados
let modoEdicao = false; // Indica se está em modo de edição

// Performance optimizations
let validationTimeout = null;
const VALIDATION_DEBOUNCE_MS = 150;

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
export async function inicializarPlanejamento(usuarioId, modoEdicaoParam = false) {
    console.log('[inicializarPlanejamento] Iniciando para usuário:', usuarioId);
    usuarioIdAtual = usuarioId;
    modoEdicao = modoEdicaoParam;
    
    try {
        // 1. Verificar se já existe plano ativo no banco
        const planoExistente = await WeeklyPlanService.getPlan(usuarioId);
        
        if (planoExistente && !modoEdicao) {
            console.log('[inicializarPlanejamento] Plano existente encontrado, carregando...');
            planejamentoAtual = planoExistente;
            await finalizarPlanejamentoExistente();
            return;
        }
        
        if (planoExistente && modoEdicao) {
            console.log('[inicializarPlanejamento] Modo de edição ativado');
            planejamentoAtual = planoExistente;
            diasEditaveis = await WeeklyPlanService.getEditableDays(usuarioId);
            console.log('[inicializarPlanejamento] Dias editáveis:', diasEditaveis);
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

        // 4. Buscar planejamento existente
        const planoSalvo = await WeeklyPlanService.getPlan(usuarioId, false); // Não usar cache na inicialização
        
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

// Renderizar planejamento existente - OTIMIZADO
function renderizarPlanejamentoExistente() {
    // Usar requestAnimationFrame para melhor performance
    requestAnimationFrame(() => {
        // Batch DOM operations
        const fragment = document.createDocumentFragment();
        const updates = [];
        
        // Preparar todas as atualizações antes de aplicar ao DOM
        Object.keys(planejamentoAtual).forEach(dia => {
            const treino = planejamentoAtual[dia];
            if (treino && treino.id && treino.nome && treino.tipo) {
                updates.push({ dia, treino });
            }
        });
        
        // Aplicar atualizações em batch
        updates.forEach(({ dia, treino }) => {
            atualizarVisualizacaoDia(dia, treino);
        });
        
        // Otimizar modo edição com cache de elementos
        if (modoEdicao && diasEditaveis.length > 0) {
            // Cache elements to avoid repeated DOM queries
            const diasElementsCache = new Map();
            
            diasEditaveis.forEach(diaInfo => {
                let diaElement = diasElementsCache.get(diaInfo.dia_semana);
                if (!diaElement) {
                    diaElement = document.querySelector(`[onclick*="abrirSeletorTreino('${diaInfo.dia_semana}"]`);
                    if (diaElement) {
                        diasElementsCache.set(diaInfo.dia_semana, diaElement);
                    }
                }
                
                if (diaElement && !diaInfo.editavel) {
                    // Batch style changes
                    Object.assign(diaElement.style, {
                        cursor: 'not-allowed',
                        opacity: '0.6'
                    });
                    diaElement.onclick = () => {
                        showNotification('Este treino já foi realizado e não pode ser alterado', 'warning');
                    };
                }
            });
            
            // Adicionar indicador visual de modo edição
            adicionarIndicadorModoEdicao();
        }
        
        // Validar após todas as mudanças
        validarPlanejamentoDebounced();
    });
}

// Adicionar indicador de modo edição
function adicionarIndicadorModoEdicao() {
    const container = document.querySelector('.planning-page-container') || 
                     document.querySelector('.modal-content') ||
                     document.querySelector('#modalPlanejamento');
    
    if (container) {
        // Remover indicador existente se houver
        const indicadorExistente = container.querySelector('.planning-mode-indicator');
        if (indicadorExistente) {
            indicadorExistente.remove();
        }
        
        // Criar novo indicador
        const indicador = document.createElement('div');
        indicador.className = 'planning-mode-indicator';
        indicador.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                <svg style="width: 20px; height: 20px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="m18.5 2.5 1 1-10 10-4 1 1-4 10-10z"/>
                </svg>
                <span>MODO EDIÇÃO - Apenas treinos não realizados podem ser alterados</span>
            </div>
        `;
        
        // Inserir no início do container
        container.insertBefore(indicador, container.firstChild);
    }
}

// Validar planejamento - OTIMIZADO
function validarPlanejamento() {
    // Cache DOM elements to avoid repeated queries
    if (!validarPlanejamento._cachedElements) {
        validarPlanejamento._cachedElements = {
            btnSalvar: document.querySelector('.save-btn') || document.getElementById('confirm-plan-btn'),
            validationMessageElement: document.getElementById('validationMessage')
        };
    }
    
    const { btnSalvar, validationMessageElement } = validarPlanejamento._cachedElements;
    
    let diasPreenchidos = 0;
    let isValid = true;
    const messages = [];
    const tiposMuscularesNoPlano = {};

    // Em modo edição, validação é diferente
    if (modoEdicao) {
        // No modo edição, consideramos válido se há pelo menos mudanças válidas
        messages.push('ℹ️ Modo de edição ativo. Alterações serão salvas automaticamente.');
        
        if (validationMessageElement) {
            // Batch DOM updates
            requestAnimationFrame(() => {
                validationMessageElement.innerHTML = messages.join('<br>');
                validationMessageElement.className = 'validation-message info';
                validationMessageElement.style.display = 'block';
            });
        }
        
        // No modo edição, não precisamos do botão salvar tradicional
        if (btnSalvar) {
            btnSalvar.style.display = 'none';
        }
        
        return true;
    }

    // Contar dias preenchidos (modo normal) - Otimizada com Object.values
    const treinosValidos = Object.values(planejamentoAtual).filter(treino => treino);
    diasPreenchidos = treinosValidos.length;
    
    // Processo de contagem otimizado
    treinosValidos.forEach(treino => {
        if (treino.categoria === 'muscular') {
            tiposMuscularesNoPlano[treino.tipo] = (tiposMuscularesNoPlano[treino.tipo] || 0) + 1;
        }
    });

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
        validationMessageElement.classList.remove('success', 'error', 'info');
        
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
        btnSalvar.style.display = 'flex';
    }

    // Atualizar estatísticas na interface
    atualizarEstatisticasPlanejamento(diasPreenchidos);

    console.log('[validarPlanejamento] Validação:', { modoEdicao, isValid, diasPreenchidos, messages });
    return isValid && diasPreenchidos === 7;
}

// Debounced validation wrapper - OTIMIZAÇÃO DE PERFORMANCE
function validarPlanejamentoDebounced() {
    if (validationTimeout) {
        clearTimeout(validationTimeout);
    }
    
    validationTimeout = setTimeout(() => {
        validarPlanejamento();
        validationTimeout = null;
    }, VALIDATION_DEBOUNCE_MS);
}

// Atualizar estatísticas do planejamento
function atualizarEstatisticasPlanejamento(diasPreenchidos) {
    try {
        const plannedDaysEl = document.getElementById('planned-days');
        const workoutCountEl = document.getElementById('workout-count');
        
        if (plannedDaysEl) {
            plannedDaysEl.textContent = diasPreenchidos;
        }
        
        if (workoutCountEl) {
            const totalTreinos = Object.values(planejamentoAtual).filter(treino => 
                treino && (treino.categoria === 'muscular' || treino.categoria === 'cardio' || treino.categoria === 'treino')
            ).length;
            workoutCountEl.textContent = totalTreinos;
        }
    } catch (error) {
        console.warn('[atualizarEstatisticasPlanejamento] Erro:', error);
    }
}

// Abrir seletor de treino
window.abrirSeletorTreino = function(dia, nomeDia) {
    // Converter string do dia para número (0-6)
    const diasMap = {
        'domingo': 0, 'segunda': 1, 'terca': 2, 'quarta': 3,
        'quinta': 4, 'sexta': 5, 'sabado': 6
    };
    
    const diaAtualSelecionado = typeof dia === 'string' ? diasMap[dia] : parseInt(dia);
    nomeDiaAtual = nomeDia;
    
    // Verificar se o dia pode ser editado
    if (modoEdicao) {
        const diaEditavel = diasEditaveis.find(d => d.dia_semana === diaAtualSelecionado);
        if (diaEditavel && !diaEditavel.editavel) {
            showNotification('Este treino já foi realizado e não pode ser alterado', 'warning');
            return;
        }
    }
    
    const popup = document.getElementById('seletorTreinoPopup');
    const title = document.getElementById('popup-day-title');
    const options = document.getElementById('treino-options');
    
    if (!popup || !title || !options) return;
    
    const prefixo = modoEdicao ? 'Editar' : 'Selecionar';
    title.textContent = `${nomeDia} - ${prefixo} Treino`;
    options.innerHTML = '';
    
    // Adicionar opção de folga
    const folgaOption = criarOpcaoTreino({
        id: 'folga',
        emoji: '😴',
        nome: 'Folga',
        descricao: 'Dia de descanso',
        tipo: 'folga',
        categoria: 'folga'
    }, diaAtualSelecionado);
    options.appendChild(folgaOption);
    
    // Adicionar opção de cardio
    const cardioOption = criarOpcaoTreino({
        id: 'cardio',
        emoji: '🏃',
        nome: 'Cardio',
        descricao: 'Exercícios cardiovasculares',
        tipo: 'Cardio',
        categoria: 'cardio'
    }, diaAtualSelecionado);
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
            }, diaAtualSelecionado);
            options.appendChild(option);
        }
    });
    
    // Garantir popup visível independentemente do CSS
    popup.style.display = 'flex';
    popup.style.visibility = 'visible';
    popup.style.opacity = '1';
    popup.style.zIndex = 1050;
    document.body.style.overflow = 'hidden';
    console.log('[abrirSeletorTreino] Popup exibido para', nomeDia, dia);
};

// Fechar seletor de treino
window.fecharSeletorTreino = function() {
    const popup = document.getElementById('seletorTreinoPopup');
    if (popup) {
        popup.style.display = 'none';
        popup.style.visibility = 'hidden';
        popup.style.opacity = '0';
        popup.style.zIndex = '';
        document.body.style.overflow = '';
        console.log('[fecharSeletorTreino] Popup fechado');
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

// Selecionar treino para um dia com validação de numero_treino
async function selecionarTreinoParaDia(treino, dia) {
    // Validar numero_treino se for treino muscular
    if (treino.categoria === 'muscular' || treino.categoria === 'treino') {
        try {
            // Buscar protocolo ativo do usuário
            const protocoloAtivo = await fetchProtocoloAtivoUsuario(usuarioIdAtual);
            if (!protocoloAtivo) {
                showNotification('Erro: usuário sem protocolo ativo', 'error');
                return;
            }
            
            // Verificar se existe numero_treino válido para este protocolo
            const { data: protocoloTreinos } = await query('protocolo_treinos', {
                eq: { protocolo_id: protocoloAtivo.protocolo_treinamento_id },
                select: 'numero_treino'
            });
            
            if (!protocoloTreinos || protocoloTreinos.length === 0) {
                showNotification('Erro: protocolo sem treinos configurados', 'error');
                return;
            }
            
            // Adicionar numero_treino válido ao treino
            const treinosDisponiveis = [...new Set(protocoloTreinos.map(pt => pt.numero_treino))];
            const treinoIndex = parseInt(dia) % treinosDisponiveis.length;
            treino.numero_treino = treinosDisponiveis[treinoIndex] || treinosDisponiveis[0];
            
        } catch (error) {
            console.error('[selecionarTreinoParaDia] Erro na validação:', error);
            showNotification('Erro ao validar treino com protocolo', 'error');
            return;
        }
    }
    
    if (modoEdicao) {
        // Salvar mudança no banco de dados usando novo serviço
        const resultado = await WeeklyPlanService.updateDay(usuarioIdAtual, dia, treino);
        
        if (!resultado.success) {
            showNotification(`Erro: ${resultado.error}`, 'error');
            return;
        }
        
        showNotification(`${treino.nome} atualizado para ${nomeDiaAtual}`, 'success');
    } else {
        showNotification(`${treino.nome} adicionado para ${nomeDiaAtual}`, 'success');
    }
    
    planejamentoAtual[dia] = {
        id: treino.id,
        nome: treino.nome,
        tipo: treino.tipo,
        categoria: treino.categoria
    };
    
    atualizarVisualizacaoDia(dia, treino);
    fecharSeletorTreino();
    validarPlanejamentoDebounced();
}

// Atualizar visualização do dia - OTIMIZADO
function atualizarVisualizacaoDia(dia, treino) {
    const dayContent = document.getElementById(`dia-${dia}-content`);
    if (!dayContent) return;
    
    // Cache calculation for better performance
    const podeEditar = modoEdicao ? 
        (diasEditaveis.find(d => d.dia_semana === parseInt(dia))?.editavel ?? true) : 
        true;
    
    // Pre-calculate values to avoid repeated computation
    const statusClass = podeEditar ? '' : 'completed';
    const botaoRemover = podeEditar ? 
        `<button class="remove-treino" onclick="removerTreinoDoDia('${dia}')">×</button>` : 
        '<span class="completed-badge">✓</span>';
    
    // Optimized template rendering with single template
    const treinoData = treino.categoria === 'folga' ? {
        emoji: '😴',
        nome: 'Folga',
        tipo: 'Descanso'
    } : {
        emoji: treinoEmojis[treino.tipo] || '🏋️',
        nome: treino.nome,
        tipo: treino.categoria === 'cardio' ? 'Cardiovascular' : 'Muscular'
    };
    
    // Single template with conditional data
    dayContent.innerHTML = `
        <div class="treino-assigned ${statusClass}">
            <span class="treino-emoji">${treinoData.emoji}</span>
            <div class="treino-info">
                <div class="treino-name">${treinoData.nome}</div>
                <div class="treino-type">${treinoData.tipo}</div>
            </div>
            ${botaoRemover}
        </div>
    `;
}

// Remover treino do dia
window.removerTreinoDoDia = function(dia) {
    delete planejamentoAtual[dia];
    
    const dayContent = document.getElementById(`dia-${dia}-content`);
    if (dayContent) {
        dayContent.innerHTML = `
            <div class="empty-slot">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 5v14m-7-7h14"/>
                </svg>
                <span>Adicionar</span>
            </div>
        `;
    }
    
    validarPlanejamentoDebounced();
    if (window.showNotification) {
        window.showNotification('Treino removido', 'info');
    }
};

// FUNÇÃO PRINCIPAL: Salvar planejamento semanal com validação
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

        // Validar protocolo ativo antes de salvar
        const protocoloAtivo = await fetchProtocoloAtivoUsuario(usuarioIdAtual);
        if (!protocoloAtivo) {
            throw new Error('Usuário não possui protocolo ativo');
        }

        // Mapeamento textual para índice de dias da semana (0=Dom, 6=Sáb)
        const diasMap = {
            'domingo': 0, 'segunda': 1, 'terca': 2, 'quarta': 3,
            'quinta': 4, 'sexta': 5, 'sabado': 6
        };

        // Montar objeto indexado para Supabase com validação de numero_treino
        const planejamentoParaSupabase = {};
        for (let dia = 0; dia < 7; dia++) {
            let treino = null;
            // Procurar o treino correspondente ao dia
            for (const [diaKey, t] of Object.entries(planejamentoAtual)) {
                if (diasMap[diaKey] === dia) {
                    treino = t;
                    break;
                }
            }
            
            // Validar numero_treino para treinos musculares
            let numeroTreino = null;
            if (treino && (treino.categoria === 'muscular' || treino.categoria === 'treino')) {
                numeroTreino = treino.numero_treino;
                // Se não foi definido, usar um válido do protocolo
                if (!numeroTreino) {
                    const { data: protocoloTreinos } = await query('protocolo_treinos', {
                        eq: { protocolo_id: protocoloAtivo.protocolo_treinamento_id },
                        select: 'numero_treino',
                        order: { column: 'numero_treino', ascending: true }
                    });
                    
                    if (protocoloTreinos && protocoloTreinos.length > 0) {
                        const treinosDisponiveis = [...new Set(protocoloTreinos.map(pt => pt.numero_treino))];
                        const treinoIndex = dia % treinosDisponiveis.length;
                        numeroTreino = treinosDisponiveis[treinoIndex] || treinosDisponiveis[0];
                    }
                }
            }
            
            planejamentoParaSupabase[dia] = {
                tipo: treino && treino.tipo ? treino.tipo.toLowerCase() : 'folga',
                categoria: treino && treino.categoria ? treino.categoria.toLowerCase() : 'folga',
                numero_treino: numeroTreino,
                concluido: false
            };
        }
        console.log('[salvarPlanejamentoSemanal] Objeto indexado para Supabase:', planejamentoParaSupabase);

        // Salva no Supabase usando novo serviço unificado
        const resultado = await WeeklyPlanService.savePlan(usuarioIdAtual, planejamentoParaSupabase);

        if (!resultado.success) {
            throw new Error(resultado.error || 'Erro ao salvar no banco');
        }

        // Atualiza estado global
        AppState.set('weekPlan', planejamentoParaSupabase);
        

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

// Função para verificar se precisa de planejamento
export async function needsWeekPlanningAsync(userId) {
    return await WeeklyPlanService.needsPlanning(userId);
}

// Exportar função removerTreinoDoDia para compatibilidade
export const removerTreinoDoDia = window.removerTreinoDoDia;

// Função global para compatibilidade com o template
window.salvarPlanejamento = async function() {
    await salvarPlanejamentoSemanal();
};

// Função para abrir modo de edição
export async function abrirEdicaoPlanejamento(usuarioId) {
    console.log('[abrirEdicaoPlanejamento] Iniciando edição para usuário:', usuarioId);
    
    try {
        // Verificar se há plano ativo
        const planoExistente = await WeeklyPlanService.getPlan(usuarioId);
        if (!planoExistente) {
            showNotification('Não há plano semanal ativo para editar. Crie um planejamento primeiro.', 'warning');
            return;
        }
        
        // Verificar se há dias editáveis
        const diasEditaveisData = await WeeklyPlanService.getEditableDays(usuarioId);
        const temDiasEditaveis = diasEditaveisData.some(dia => dia.editavel);
        
        if (!temDiasEditaveis) {
            showNotification('Todos os treinos da semana já foram realizados. Não há nada para editar.', 'info');
            return;
        }
        
        // Renderizar template de planejamento em modo edição
        if (window.renderTemplate) {
            window.renderTemplate('planejamentoSemanalPage');
            setTimeout(async () => {
                await inicializarPlanejamento(usuarioId, true); // true = modo edição
            }, 100);
        }
        
    } catch (error) {
        console.error('[abrirEdicaoPlanejamento] Erro:', error);
        
        // Tratamento específico de erros
        if (error.message && error.message.includes('Failed to fetch')) {
            showNotification('Erro de conexão. Verifique sua internet e tente novamente.', 'error');
        } else if (error.message && error.message.includes('CORS')) {
            showNotification('Erro de configuração. Contate o administrador.', 'error');
        } else {
            showNotification('Erro ao carregar planejamento para edição: ' + (error.message || error), 'error');
        }
    }
}

// Também disponibilizar outras funções necessárias
window.inicializarPlanejamento = inicializarPlanejamento;
window.fecharModalPlanejamento = fecharModalPlanejamento;
window.abrirEdicaoPlanejamento = abrirEdicaoPlanejamento;

// Função global para forçar fechamento (para emergências)
window.forcarFechamentoModal = forcarFechamentoModal;