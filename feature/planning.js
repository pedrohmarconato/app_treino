// js/features/planning.js - CORREÇÃO DO MODAL
// Versão corrigida que fecha o modal adequadamente

import AppState from '../state/appState.js';
import { getWorkoutIcon, getIconForWorkoutType } from '../utils/icons.js';
// Import removido para compatibilidade com browser tradicional
// Use window.WeeklyPlanService.metodo() para acessar métodos
// Se precisar de funções globais, atribua manualmente abaixo
const obterSemanaAtivaUsuario = window.WeeklyPlanService.obterSemanaAtivaUsuario;
const verificarSemanaJaProgramada = window.WeeklyPlanService.verificarSemanaJaProgramada;
const marcarSemanaProgramada = window.WeeklyPlanService.marcarSemanaProgramada;
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
let semanaAtivaAtual = null; // Dados da semana ativa
let jaProgramadaAtual = false; // Status de programação

// Performance optimizations
let validationTimeout = null;
const VALIDATION_DEBOUNCE_MS = 150;

// Mapear ícones para os tipos de treino
const treinoIcons = {
    'Costas': 'costas',
    'Peito': 'peito',
    'Pernas': 'pernas',
    'Ombro e Braço': 'ombros',
    'Cardio': 'cardio',
    'Ombro': 'ombros',
    'Braço': 'bracos'
};

// Inicializar planejamento
export async function inicializarPlanejamento(usuarioId, modoEdicaoParam = false) {
    console.log('[inicializarPlanejamento] Iniciando para usuário:', usuarioId);
    
    // Aguardar DOM estar pronto
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Garantir que temos um usuário válido
    if (!usuarioId) {
        const currentUser = AppState.get('currentUser');
        usuarioId = currentUser?.id;
        console.log('[inicializarPlanejamento] UserId obtido do AppState:', usuarioId);
    }
    
    if (!usuarioId) {
        console.error('[inicializarPlanejamento] Nenhum usuário encontrado!');
        showNotification('Erro: usuário não identificado', 'error');
        return;
    }
    
    usuarioIdAtual = usuarioId;
    modoEdicao = modoEdicaoParam;
    
    console.log('[inicializarPlanejamento] Variáveis definidas:', {
        usuarioIdAtual,
        modoEdicao
    });
    
    try {
        // 1. Obter semana ativa do usuário
        const semanaAtiva = await obterSemanaAtivaUsuario(usuarioId);
        
        if (!semanaAtiva) {
            showNotification('Nenhuma semana ativa encontrada. Configure o calendário primeiro.', 'warning');
            return;
        }
        
        console.log('[inicializarPlanejamento] Semana ativa:', semanaAtiva);
        
        // 2. Verificar se semana já foi programada
        const jaProgramada = await verificarSemanaJaProgramada(userId, semanaAtiva.semana_treino);
        console.log('[inicializarPlanejamento] Semana já programada:', jaProgramada);
        
        // Guardar dados para uso posterior
        semanaAtivaAtual = semanaAtiva;
        jaProgramadaAtual = jaProgramada;
        
        // 3. Buscar tipos de treino muscular do plano do usuário
        const tiposMusculares = await fetchTiposTreinoMuscular(usuarioId);

        // 4. Criar treinos disponíveis
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

        // 5. Verificar se já existe plano ativo
        const planoExistente = await WeeklyPlanService.getPlan(usuarioId);
        
        // 6. Definir modo baseado no status da programação
        if (jaProgramada && planoExistente) {
            console.log('[inicializarPlanejamento] Semana já programada - Modo visualização/edição limitada');
            modoEdicao = true; // Permitir edição limitada
            diasEditaveis = await WeeklyPlanService.getEditableDays(usuarioId);
        } else if (jaProgramada && !planoExistente) {
            console.log('[inicializarPlanejamento] Inconsistência: marcada como programada mas sem plano');
            // Permitir reprogramação
            modoEdicao = false;
        } else {
            console.log('[inicializarPlanejamento] Semana não programada - Modo criação/edição completa');
            modoEdicao = modoEdicaoParam;
        }
        
        // CORREÇÃO: NUNCA fechar automaticamente, sempre renderizar o modal
        if (planoExistente && modoEdicao) {
            console.log('[inicializarPlanejamento] Modo de edição ativado');
            planejamentoAtual = planoExistente;
            diasEditaveis = await WeeklyPlanService.getEditableDays(usuarioId);
        } else if (planoExistente && !modoEdicao) {
            console.log('[inicializarPlanejamento] Plano existente encontrado, carregando para visualização/edição...');
            planejamentoAtual = planoExistente;
        } else {
            // Nenhum plano, iniciar vazio
            planejamentoAtual = {};
            console.log('[inicializarPlanejamento] Nenhum plano encontrado, iniciando vazio');
        }
        
        // 4. IMPORTANTE: Garantir que o modal esteja visível
        const modal = document.getElementById('modalPlanejamento') || 
                      document.getElementById('modal-planejamento');
        
        if (modal) {
            modal.style.display = 'flex';
            modal.style.visibility = 'visible';
            modal.style.opacity = '1';
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            console.log('[inicializarPlanejamento] Modal exibido');
        }
        
        // 5. Renderizar interface
        renderizarPlanejamentoExistente();
        
        // 6. Atualizar indicadores de status
        atualizarIndicadoresStatus(semanaAtivaAtual, jaProgramadaAtual, diasEditaveis);
        
        // 7. Garantir que o modal está visível
        setTimeout(() => {
            const modal = document.getElementById('modalPlanejamento');
            if (modal) {
                modal.style.display = 'flex';
                modal.style.visibility = 'visible';
                modal.style.opacity = '1';
                modal.classList.remove('hidden');
                console.log('[inicializarPlanejamento] Modal forçado a ficar visível');
            } else {
                console.error('[inicializarPlanejamento] Modal não encontrado para forçar exibição');
            }
        }, 100);
        
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
                
                if (window.renderTemplate) {
                    window.renderTemplate('home');
                } else if (window.mostrarTela) {
                    window.mostrarTela('home-screen');
                }
                
                // CORREÇÃO: Fechar modal APÓS navegar, não antes
                setTimeout(() => {
                    forcarFechamentoModal();
                }, 100);
                
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
        
        // Método 3: Fechar seletor de treino se estiver aberto
        const seletorPopup = document.getElementById('seletorTreinoPopup');
        if (seletorPopup) {
            seletorPopup.style.display = 'none';
            seletorPopup.style.visibility = 'hidden';
            seletorPopup.style.opacity = '0';
            seletorPopup.style.zIndex = '';
            console.log('[forcarFechamentoModal] Popup seletor de treino fechado');
        }
        
        // Método 4: Buscar por classe
        const modals = document.querySelectorAll('.modal-overlay, .planning-page-container, .modal');
        modals.forEach((modal, index) => {
            modal.style.display = 'none';
            modal.style.visibility = 'hidden';
            modal.style.opacity = '0';
            modal.classList.add('hidden');
            console.log(`[forcarFechamentoModal] Modal ${index + 1} por classe fechado`);
        });
        
        // Método 5: Remover overlay do body e restaurar scroll
        document.body.style.overflow = '';
        document.body.classList.remove('modal-open');
        
        // Método 6: Limpar variáveis de estado do planejamento
        nomeDiaAtual = '';
        
        // Método 7: Restaurar estado de botões que podem ter ficado desabilitados
        const botoesParaHabilitar = document.querySelectorAll(
            '.btn-primary, .save-btn, #confirm-plan-btn, .planning-btn, .action-btn'
        );
        botoesParaHabilitar.forEach(btn => {
            if (btn.hasAttribute('data-disabled-by-modal')) {
                btn.disabled = false;
                btn.removeAttribute('data-disabled-by-modal');
                console.log('[forcarFechamentoModal] Botão habilitado:', btn.className);
            }
        });
        
        // Método 8: Limpar cache de validação
        if (validarPlanejamento._cachedElements) {
            validarPlanejamento._cachedElements = null;
        }
        
        // Método 9: Remover elementos dinâmicos
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

function renderizarPlanejamentoExistente() {
    console.log('[renderizarPlanejamentoExistente] Iniciando renderização...');
    
    // Garantir que o modal está visível
    const modal = document.getElementById('modalPlanejamento');
    if (!modal) {
        console.error('[renderizarPlanejamentoExistente] Modal não encontrado!');
        return;
    }
    
    // Atualizar contadores
    let diasPreenchidos = 0;
    let totalTreinos = 0;
    
    // Mapear dias corretamente (1-7 ao invés de 0-6)
    for (let dia = 1; dia <= 7; dia++) {
        const treino = planejamentoAtual[dia - 1]; // Ajustar índice
        
        if (treino && treino.tipo) {
            diasPreenchidos++;
            totalTreinos++;
            
            // Atualizar visualização do dia
            const diaContent = document.getElementById(`dia-${dia}-content`);
            if (diaContent) {
                diaContent.innerHTML = `
                    <div class="treino-assigned">
                        <span class="treino-nome">${treino.nome}</span>
                        <button class="btn-remover" onclick="removerTreinoDoDia(${dia - 1})">×</button>
                    </div>
                `;
            }
        }
    }
    
    // Atualizar estatísticas
    document.getElementById('planned-days').textContent = diasPreenchidos;
    document.getElementById('workout-count').textContent = totalTreinos;
    
    // Validar
    validarPlanejamento();
}

// Atualizar indicadores de status da programação
function atualizarIndicadoresStatus(semanaAtiva, jaProgramada, diasEditaveis = []) {
    const statusIndicator = document.getElementById('planning-status-indicator');
    const statusBadge = statusIndicator?.querySelector('.status-badge');
    const statusText = statusIndicator?.querySelector('.status-text');
    
    if (!statusIndicator || !statusBadge || !statusText) {
        console.warn('[atualizarIndicadoresStatus] Elementos de status não encontrados');
        return;
    }
    
    statusIndicator.style.display = 'flex';
    
    if (jaProgramada) {
        const diasEditaveisCount = diasEditaveis.filter(d => d.editavel).length;
        
        if (diasEditaveisCount > 0) {
            // Programada mas com dias editáveis
            statusBadge.className = 'status-badge warning';
            statusBadge.textContent = '⚠️';
            statusText.textContent = `Semana ${semanaAtiva.semana_treino} programada - ${diasEditaveisCount} dias editáveis`;
        } else {
            // Totalmente programada e realizada
            statusBadge.className = 'status-badge success';
            statusBadge.textContent = '✅';
            statusText.textContent = `Semana ${semanaAtiva.semana_treino} completamente programada`;
        }
    } else {
        // Não programada
        statusBadge.className = 'status-badge info';
        statusBadge.textContent = '📅';
        statusText.textContent = `Semana ${semanaAtiva.semana_treino} - Nova programação`;
    }
    
    // Atualizar subtítulo baseado no percentual de 1RM
    const subtitle = document.querySelector('.modal-subtitle');
    if (subtitle && semanaAtiva.percentual_1rm_calculado) {
        subtitle.textContent = `Configure seus treinos - ${semanaAtiva.percentual_1rm_calculado}% 1RM`;
    }
}

// Adicionar indicador de modo edição (mantido para compatibilidade)
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
            // Mas garantir que outros botões não sejam afetados
            btnSalvar.removeAttribute('data-disabled-by-modal');
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
        const shouldDisable = !isValid || diasPreenchidos < 7;
        btnSalvar.disabled = shouldDisable;
        btnSalvar.style.display = 'flex';
        
        console.log('[validarPlanejamento] Botão salvar:', {
            isValid,
            diasPreenchidos,
            shouldDisable,
            disabled: btnSalvar.disabled
        });
    } else {
        console.warn('[validarPlanejamento] Botão salvar não encontrado!');
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
window.abrirSeletorTreino = async function(dia, nomeDia) {
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
    
    console.log('[abrirSeletorTreino] Elementos encontrados:', {
        popup: !!popup,
        title: !!title,
        options: !!options
    });
    
    if (!popup) {
        console.error('[abrirSeletorTreino] Popup não encontrado! Elementos disponíveis:', 
            Array.from(document.querySelectorAll('[id*="popup"], [id*="Popup"], [id*="seletor"]')).map(el => el.id)
        );
        return;
    }
    
    if (!title || !options) {
        console.error('[abrirSeletorTreino] Elementos internos não encontrados!', { title: !!title, options: !!options });
        return;
    }
    
    const prefixo = modoEdicao ? 'Editar' : 'Selecionar';
    title.textContent = `${nomeDia} - ${prefixo} Treino`;
    options.innerHTML = '';
    
    
    // Adicionar opção de cardio
    const cardioOption = criarOpcaoTreino({
        id: 'cardio',
        icon: getWorkoutIcon('cardio'),
        nome: 'Cardio',
        descricao: 'Exercícios cardiovasculares',
        tipo: 'Cardio',
        categoria: 'cardio'
    }, diaAtualSelecionado);
    options.appendChild(cardioOption);
    
    // Adicionar treinos musculares
    console.log('[abrirSeletorTreino] Treinos disponíveis:', treinosDisponiveis);
    
    if (treinosDisponiveis.length === 0) {
        console.warn('[abrirSeletorTreino] Nenhum treino disponível! Recarregando...');
        
        // Tentar recarregar treinos
        try {
            // Garantir que temos um usuário válido
            let userId = usuarioIdAtual;
            if (!userId) {
                const currentUser = AppState.get('currentUser');
                userId = currentUser?.id;
                console.log('[abrirSeletorTreino] UserId obtido do AppState:', userId);
            }
            
            if (!userId) {
                console.error('[abrirSeletorTreino] Nenhum usuário encontrado!');
                showNotification('Erro: usuário não identificado', 'error');
                return;
            }
            
            const tiposMusculares = await fetchTiposTreinoMuscular(userId);
            console.log('[abrirSeletorTreino] Tipos musculares recarregados:', tiposMusculares);
            
            // Recriar lista de treinos
            treinosDisponiveis = [];
            let treinoIdCounter = 1;
            
            tiposMusculares.forEach(tipo => {
                treinosDisponiveis.push({
                    id: `muscular_${treinoIdCounter++}`,
                    nome: `Muscular: ${tipo}`,
                    tipo: tipo,
                    categoria: 'muscular' 
                });
            });
            
            console.log('[abrirSeletorTreino] Treinos recriados:', treinosDisponiveis);
        } catch (error) {
            console.error('[abrirSeletorTreino] Erro ao recarregar treinos:', error);
        }
    }
    
    treinosDisponiveis.forEach(treino => {
        if (treino.categoria === 'muscular') {
            const option = criarOpcaoTreino({
                id: treino.id,
                icon: getWorkoutIcon(treinoIcons[treino.tipo] || 'peito'),
                nome: treino.tipo,
                descricao: `Treino ${treino.tipo}`,
                tipo: treino.tipo,
                categoria: 'muscular'
            }, diaAtualSelecionado);
            options.appendChild(option);
            console.log('[abrirSeletorTreino] Opção adicionada:', treino.tipo);
        }
    });
    
    console.log('[abrirSeletorTreino] Total de opções adicionadas:', options.children.length);
    
    // Garantir popup visível com estilos forçados
    popup.style.cssText = `
        display: flex !important;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        background: rgba(0, 0, 0, 0.8) !important;
        z-index: 200000 !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 20px !important;
        box-sizing: border-box !important;
        visibility: visible !important;
        opacity: 1 !important;
    `;
    
    document.body.style.overflow = 'hidden';
    
    // Verificar modal-content-small também
    const modalContent = popup.querySelector('.modal-content-small');
    if (modalContent) {
        modalContent.style.cssText = `
            background: #242424 !important;
            border-radius: 16px !important;
            max-width: 400px !important;
            width: 90vw !important;
            max-height: 80vh !important;
            overflow-y: auto !important;
            position: relative !important;
            border: 1px solid #333 !important;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5) !important;
            color: white !important;
            z-index: 200001 !important;
        `;
        console.log('[abrirSeletorTreino] Modal content styles aplicados');
    }
    
    console.log('[abrirSeletorTreino] Popup exibido para', nomeDia, dia);
    console.log('[abrirSeletorTreino] Popup DOM element:', popup);
    console.log('[abrirSeletorTreino] Popup computed styles:', {
        display: window.getComputedStyle(popup).display,
        position: window.getComputedStyle(popup).position,
        zIndex: window.getComputedStyle(popup).zIndex,
        visibility: window.getComputedStyle(popup).visibility
    });
};

// Fechar seletor de treino
window.fecharSeletorTreino = function() {
    console.log('[fecharSeletorTreino] Fechando popup de seleção...');
    
    const popup = document.getElementById('seletorTreinoPopup');
    if (popup) {
        popup.style.display = 'none';
        popup.style.visibility = 'hidden';
        popup.style.opacity = '0';
        popup.style.zIndex = '';
        document.body.style.overflow = '';
        console.log('[fecharSeletorTreino] Popup fechado');
    }
    
    // Limpar estado
    nomeDiaAtual = '';
    
    // Restaurar botões que podem ter ficado desabilitados
    const botoesParaHabilitar = document.querySelectorAll(
        'button[onclick*="abrirSeletorTreino"], .day-card button, .empty-slot, .treino-assigned button'
    );
    botoesParaHabilitar.forEach(btn => {
        if (btn.disabled) {
            btn.disabled = false;
            console.log('[fecharSeletorTreino] Botão reabilitado:', btn.textContent || btn.className);
        }
    });
    
    // Remover event listeners temporários se houver
    const options = document.querySelectorAll('.treino-option');
    options.forEach(option => {
        const newOption = option.cloneNode(true);
        if (option.parentNode) {
            option.parentNode.replaceChild(newOption, option);
        }
    });
    
    console.log('[fecharSeletorTreino] Estado limpo e botões restaurados');
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
        <span class="option-icon">${treino.icon}</span>
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
    // Garantir que temos um usuário válido
    let userId = usuarioIdAtual;
    if (!userId) {
        const currentUser = AppState.get('currentUser');
        userId = currentUser?.id;
    }
    
    if (!userId) {
        showNotification('Erro: usuário não identificado', 'error');
        return;
    }
    
    // Validar numero_treino se for treino muscular
    if (treino.categoria === 'muscular' || treino.categoria === 'treino') {
        try {
            // Buscar protocolo ativo do usuário
            const protocoloAtivo = await fetchProtocoloAtivoUsuario(userId);
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
        const resultado = await WeeklyPlanService.updateDay(userId, dia, treino);
        
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
    
    console.log('[selecionarTreinoParaDia] 🎯 TREINO ADICIONADO:');
    console.log('[selecionarTreinoParaDia] Dia:', dia, typeof dia);
    console.log('[selecionarTreinoParaDia] Treino:', planejamentoAtual[dia]);
    console.log('[selecionarTreinoParaDia] Planejamento completo atual:', planejamentoAtual);
    console.log('[selecionarTreinoParaDia] Object.keys(planejamentoAtual):', Object.keys(planejamentoAtual));
    console.log('[selecionarTreinoParaDia] Total de dias planejados:', Object.keys(planejamentoAtual).length);
    
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
    const treinoData = {
        icon: getWorkoutIcon(treinoIcons[treino.tipo] || 'peito'),
        nome: treino.nome,
        tipo: treino.categoria === 'cardio' ? 'Cardiovascular' : 'Muscular'
    };
    
    // Single template with conditional data
    dayContent.innerHTML = `
        <div class="treino-assigned ${statusClass}">
            <span class="treino-icon">${treinoData.icon}</span>
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

    // Garantir que temos um usuário válido
    let userId = usuarioIdAtual;
    if (!userId) {
        const currentUser = AppState.get('currentUser');
        userId = currentUser?.id;
        console.log('[salvarPlanejamentoSemanal] UserId obtido do AppState:', userId);
    }

    if (!userId) {
        if (window.showNotification) {
            window.showNotification('Erro: usuário não identificado', 'error');
        }
        return;
    }
    
    console.log('[salvarPlanejamentoSemanal] Salvando para usuário:', userId);

    try {
        if (window.showNotification) {
            window.showNotification('Salvando planejamento...', 'info');
        }

        // Validar protocolo ativo antes de salvar
        const protocoloAtivo = await fetchProtocoloAtivoUsuario(userId);
        if (!protocoloAtivo) {
            throw new Error('Usuário não possui protocolo ativo');
        }

        // Mapeamento textual para índice de dias da semana (0=Dom, 6=Sáb)
        const diasMap = {
            'domingo': 0, 'segunda': 1, 'terca': 2, 'quarta': 3,
            'quinta': 4, 'sexta': 5, 'sabado': 6
        };

        console.log('[salvarPlanejamentoSemanal] 🔍 DEBUG ANTES DE PROCESSAR:');
        console.log('[salvarPlanejamentoSemanal] planejamentoAtual:', planejamentoAtual);
        console.log('[salvarPlanejamentoSemanal] Object.keys(planejamentoAtual):', Object.keys(planejamentoAtual));
        console.log('[salvarPlanejamentoSemanal] Object.entries(planejamentoAtual):', Object.entries(planejamentoAtual));

        // Montar objeto indexado para Supabase com validação de numero_treino
        const planejamentoParaSupabase = {};
        for (let dia = 0; dia < 7; dia++) {
            let treino = null;
            
            // PRIMEIRO: Tentar busca direta por índice numérico
            if (planejamentoAtual[dia]) {
                treino = planejamentoAtual[dia];
                console.log(`[salvarPlanejamentoSemanal] 🎯 DIA ${dia} - Encontrado por índice direto:`, treino);
            } else {
                // SEGUNDO: Procurar o treino correspondente ao dia via diasMap
                for (const [diaKey, t] of Object.entries(planejamentoAtual)) {
                    if (diasMap[diaKey] === dia) {
                        treino = t;
                        console.log(`[salvarPlanejamentoSemanal] 🎯 DIA ${dia} - Encontrado via mapeamento (${diaKey}):`, treino);
                        break;
                    }
                }
            }
            
            if (!treino) {
                console.log(`[salvarPlanejamentoSemanal] ⚠️ DIA ${dia} - Nenhum treino definido`);
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
            
            if (treino && treino.tipo) {
                planejamentoParaSupabase[dia] = {
                    tipo: treino.tipo,
                    categoria: treino.categoria,
                    numero_treino: numeroTreino,
                    concluido: false
                };
            }
        }
        
        // VERIFICAÇÃO CRÍTICA: Se não há dados para salvar
        if (Object.keys(planejamentoParaSupabase).length === 0) {
            console.error('[salvarPlanejamentoSemanal] ❌ ERRO CRÍTICO: Nenhum dia foi planejado!');
            console.error('[salvarPlanejamentoSemanal] planejamentoAtual estava vazio:', planejamentoAtual);
            showNotification('❌ Erro: Nenhum treino foi configurado para salvar!', 'error');
            return;
        }
        
        console.log('[salvarPlanejamentoSemanal] 🚀 OBJETO COMPLETO PARA SUPABASE:', planejamentoParaSupabase);
        console.log('[salvarPlanejamentoSemanal] 📊 QUANTIDADE DE DIAS A SALVAR:', Object.keys(planejamentoParaSupabase).length);
        
        // Log detalhado de cada dia
        Object.entries(planejamentoParaSupabase).forEach(([dia, config]) => {
            console.log(`[salvarPlanejamentoSemanal] 📅 DIA ${dia}:`, {
                tipo: config.tipo,
                categoria: config.categoria,
                numero_treino: config.numero_treino,
                config_completa: config
            });
        });

        // Log detalhado antes de enviar para o WeeklyPlanService
        console.log('[salvarPlanejamentoSemanal] 🚀 ENVIANDO PARA WeeklyPlanService.savePlan');
        console.log('[salvarPlanejamentoSemanal] 👤 UserId:', userId);
        console.log('[salvarPlanejamentoSemanal] 📋 Dados completos:', JSON.stringify(planejamentoParaSupabase, null, 2));
        
        // Salva no Supabase usando novo serviço unificado
        console.log('[salvarPlanejamentoSemanal] ⏳ Chamando WeeklyPlanService.savePlan...');
        const resultado = await WeeklyPlanService.savePlan(userId, planejamentoParaSupabase);
        console.log('[salvarPlanejamentoSemanal] 📥 Resultado retornado:', resultado);

        if (!resultado.success) {
            console.error('[salvarPlanejamentoSemanal] ❌ FALHA no salvamento:', resultado.error);
            throw new Error(resultado.error || 'Erro ao salvar no banco');
        }
        
        console.log('[salvarPlanejamentoSemanal] ✅ SUCESSO no WeeklyPlanService.savePlan!');
        
        // NOVO: Após salvar com sucesso, marcar como programada
        const semanaAtiva = await obterSemanaAtivaUsuario(userId);
        if (semanaAtiva) {
            const marcacaoResult = await marcarSemanaProgramada(userId, semanaAtiva.semana_treino, userId);
            if (marcacaoResult.success) {
                console.log('✅ Semana marcada como programada:', marcacaoResult.data);
            } else {
                console.warn('⚠️ Erro ao marcar semana como programada:', marcacaoResult.error);
            }
        }

        // Atualiza estado global para disparar atualização automática da interface
        AppState.set('weekPlan', planejamentoParaSupabase);
        AppState.set('planSaved', { timestamp: Date.now(), userId });
        
        // Forçar atualização imediata dos indicadores na home
        setTimeout(() => {
            if (window.carregarIndicadoresSemana) {
                window.carregarIndicadoresSemana();
            }
            if (window.carregarDashboard) {
                window.carregarDashboard();
            }
        }, 100);
        

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

        // Carregar dashboard e inicializar home
        setTimeout(async () => {
            try {
                if (window.carregarDashboard) {
                    await window.carregarDashboard();
                    console.log('[salvarPlanejamentoSemanal] Dashboard carregado com sucesso');
                }
                
                // NOVO: Inicializar home com dados dinâmicos
                if (window.inicializarHome) {
                    await window.inicializarHome();
                    console.log('[salvarPlanejamentoSemanal] Home inicializada com dados dinâmicos');
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

// Função para CRIAR novo planejamento
export async function abrirCriacaoPlanejamento(usuarioId) {
    console.log('[abrirCriacaoPlanejamento] Criando novo planejamento para usuário:', usuarioId);
    
    try {
        // Garantir que o template seja renderizado primeiro
        if (window.renderTemplate) {
            await window.renderTemplate('planejamentoSemanalPage');
            
            // Aguardar o DOM ser atualizado
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Inicializar o planejamento em modo CRIAÇÃO
        await inicializarPlanejamento(usuarioId, false);
        
        // Exibir modal com debug detalhado
        const modal = document.getElementById('modalPlanejamento');
        console.log('[abrirCriacaoPlanejamento] Procurando modal... encontrado:', !!modal);
        
        if (modal) {
            console.log('[abrirCriacaoPlanejamento] Estado inicial do modal:', {
                display: modal.style.display,
                visibility: modal.style.visibility,
                opacity: modal.style.opacity,
                zIndex: modal.style.zIndex,
                position: window.getComputedStyle(modal).position
            });
            
            modal.style.display = 'flex';
            modal.style.visibility = 'visible';
            modal.style.opacity = '1';
            modal.style.zIndex = '9999';
            document.body.style.overflow = 'hidden';
            
            console.log('[abrirCriacaoPlanejamento] Estado final do modal:', {
                display: modal.style.display,
                visibility: modal.style.visibility,
                opacity: modal.style.opacity,
                zIndex: modal.style.zIndex,
                boundingRect: modal.getBoundingClientRect()
            });
            
            // Debug do conteúdo
            const content = modal.querySelector('.modal-content-wrapper, #planning-screen');
            console.log('[abrirCriacaoPlanejamento] Conteúdo encontrado:', !!content);
            if (content) {
                console.log('[abrirCriacaoPlanejamento] Dimensões do conteúdo:', content.getBoundingClientRect());
            }
            
            console.log('[abrirCriacaoPlanejamento] ✅ Modal de criação exibido');
        } else {
            console.error('[abrirCriacaoPlanejamento] ❌ Modal não encontrado no DOM!');
            console.log('[abrirCriacaoPlanejamento] Elementos disponíveis:', 
                Array.from(document.querySelectorAll('[id*="modal"], [id*="Modal"]')).map(el => el.id)
            );
        }
        
    } catch (error) {
        console.error('[abrirCriacaoPlanejamento] Erro:', error);
        showNotification('Erro ao abrir criação de planejamento', 'error');
    }
}

// Função para EDITAR planejamento existente
export async function abrirEdicaoPlanejamento(usuarioId) {
    console.log('[abrirEdicaoPlanejamento] Editando planejamento para usuário:', usuarioId);
    
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
        
        // Renderizar template de planejamento
        if (window.renderTemplate) {
            await window.renderTemplate('planejamentoSemanalPage');
            
            // Aguardar o DOM ser atualizado
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Inicializar o planejamento em modo EDIÇÃO
        await inicializarPlanejamento(usuarioId, true);
        
        // Exibir modal
        const modal = document.getElementById('modalPlanejamento');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            console.log('[abrirEdicaoPlanejamento] Modal de edição exibido');
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

// Função auxiliar para detectar e abrir o tipo correto
export async function abrirModalPlanejamento(usuarioId) {
    console.log('[abrirModalPlanejamento] Detectando tipo de abertura para usuário:', usuarioId);
    
    try {
        // Verificar se já existe plano
        const planoExistente = await WeeklyPlanService.getPlan(usuarioId);
        
        if (planoExistente) {
            console.log('[abrirModalPlanejamento] Plano existente encontrado, abrindo edição');
            await abrirEdicaoPlanejamento(usuarioId);
        } else {
            console.log('[abrirModalPlanejamento] Nenhum plano encontrado, abrindo criação');
            await abrirCriacaoPlanejamento(usuarioId);
        }
        
    } catch (error) {
        console.error('[abrirModalPlanejamento] Erro:', error);
        // Fallback para criação
        await abrirCriacaoPlanejamento(usuarioId);
    }
}

// Função para verificar se precisa de planejamento
export async function needsWeekPlanningAsync(userId) {
    return await WeeklyPlanService.needsPlanning(userId);
}

// Exportar função removerTreinoDoDia para compatibilidade
export const removerTreinoDoDia = window.removerTreinoDoDia;

// Função global para compatibilidade com o template
window.salvarPlanejamento = async function() {
    console.log('[window.salvarPlanejamento] Função chamada!');
    try {
        await salvarPlanejamentoSemanal();
    } catch (error) {
        console.error('[window.salvarPlanejamento] Erro:', error);
        if (window.showNotification) {
            window.showNotification('Erro ao salvar: ' + error.message, 'error');
        }
    }
};

// Atualizar as funções globais
window.abrirPlanejamentoParaUsuarioAtual = async function() {
    console.log('[abrirPlanejamentoParaUsuarioAtual] Iniciando...');
    const currentUser = AppState.get('currentUser');
    
    if (!currentUser || !currentUser.id) {
        console.error('[abrirPlanejamentoParaUsuarioAtual] Usuário não encontrado');
        showNotification('Faça login para acessar o planejamento', 'error');
        return;
    }
    
    await abrirModalPlanejamento(currentUser.id);
};

// Função específica para criação (para botões "Criar Plano")
window.criarPlanejamentoParaUsuarioAtual = async function() {
    console.log('[criarPlanejamentoParaUsuarioAtual] Iniciando criação...');
    const currentUser = AppState.get('currentUser');
    
    if (!currentUser || !currentUser.id) {
        console.error('[criarPlanejamentoParaUsuarioAtual] Usuário não encontrado');
        showNotification('Faça login para criar planejamento', 'error');
        return;
    }
    
    await abrirCriacaoPlanejamento(currentUser.id);
};

// Função específica para edição (para botões "Editar Plano")
window.editarPlanejamentoParaUsuarioAtual = async function() {
    console.log('[editarPlanejamentoParaUsuarioAtual] Iniciando edição...');
    const currentUser = AppState.get('currentUser');
    
    if (!currentUser || !currentUser.id) {
        console.error('[editarPlanejamentoParaUsuarioAtual] Usuário não encontrado');
        showNotification('Faça login para editar planejamento', 'error');
        return;
    }
    
    await abrirEdicaoPlanejamento(currentUser.id);
};


// Também disponibilizar outras funções necessárias
window.inicializarPlanejamento = inicializarPlanejamento;
window.fecharModalPlanejamento = fecharModalPlanejamento;
window.abrirEdicaoPlanejamento = abrirEdicaoPlanejamento;
window.salvarPlanejamentoSemanal = salvarPlanejamentoSemanal;

// Função de debug para acessar dados do planejamento
window.debugPlanejamento = function() {
    return {
        planejamentoAtual: planejamentoAtual,
        usuarioIdAtual: usuarioIdAtual,
        currentUser: AppState.get('currentUser'),
        weekPlan: AppState.get('weekPlan')
    };
};

// Função global para forçar fechamento (para emergências)
window.forcarFechamentoModal = forcarFechamentoModal;

// Função de debug simplificada para testar inserção direta na tabela planejamento_semanal
window.testInsercaoDireta = async function() {
    console.log('[testInsercaoDireta] 🧪 TESTE DE INSERÇÃO DIRETA');
    
    try {
        const currentUser = AppState.get('currentUser');
        if (!currentUser || !currentUser.id) {
            console.error('[testInsercaoDireta] ❌ Usuário não encontrado');
            return { success: false, error: 'Usuário não encontrado' };
        }
        
        // Importar supabase diretamente para teste
        const { supabase } = await import('../services/supabaseService.js');
        
        // Dados de teste simples para inserção direta
        const registro = {
            usuario_id: currentUser.id,
            ano: 2025,
            semana: 1,
            dia_semana: 1, // Segunda-feira
            tipo_atividade: 'teste_direto',
            numero_treino: null,
            concluido: false
        };
        
        console.log('[testInsercaoDireta] 📋 Dados para inserir:', registro);
        
        // Tentar inserir diretamente
        const { data, error } = await supabase
            .from('planejamento_semanal')
            .insert(registro)
            .select();
            
        if (error) {
            console.error('[testInsercaoDireta] ❌ ERRO:', error);
            if (window.showNotification) {
                window.showNotification('❌ Erro na inserção: ' + error.message, 'error');
            }
            return { success: false, error: error.message };
        }
        
        console.log('[testInsercaoDireta] ✅ SUCESSO! Dados inseridos:', data);
        
        // Limpar o registro de teste
        if (data && data[0] && data[0].id) {
            console.log('[testInsercaoDireta] 🧹 Limpando registro de teste...');
            await supabase
                .from('planejamento_semanal')
                .delete()
                .eq('id', data[0].id);
            console.log('[testInsercaoDireta] ✅ Registro de teste removido');
        }
        
        if (window.showNotification) {
            window.showNotification('✅ Teste de inserção direta PASSOU!', 'success');
        }
        
        return { success: true, data };
        
    } catch (error) {
        console.error('[testInsercaoDireta] ❌ ERRO CRÍTICO:', error);
        if (window.showNotification) {
            window.showNotification('❌ Erro crítico: ' + error.message, 'error');
        }
        return { success: false, error: error.message };
    }
};

// Função de debug para testar salvamento no Supabase
window.testSalvamentoSupabase = async function() {
    console.log('[testSalvamentoSupabase] 🧪 INICIANDO TESTE DE SALVAMENTO');
    
    try {
        const currentUser = AppState.get('currentUser');
        if (!currentUser || !currentUser.id) {
            console.error('[testSalvamentoSupabase] ❌ Usuário não encontrado');
            return { success: false, error: 'Usuário não encontrado' };
        }
        
        console.log('[testSalvamentoSupabase] 👤 Usuário encontrado:', currentUser.id);
        
        // Dados de teste simples
        const dadosTeste = {
            0: { tipo: 'Peito', categoria: 'muscular', numero_treino: 1, concluido: false },
            2: { tipo: 'Costas', categoria: 'muscular', numero_treino: 2, concluido: false },
            4: { tipo: 'Pernas', categoria: 'muscular', numero_treino: 3, concluido: false },
            5: { tipo: 'Cardio', categoria: 'cardio', numero_treino: null, concluido: false }
        };
        
        console.log('[testSalvamentoSupabase] 📋 Dados de teste:', dadosTeste);
        
        // Testar salvamento
        const resultado = await WeeklyPlanService.savePlan(currentUser.id, dadosTeste);
        
        console.log('[testSalvamentoSupabase] 📥 Resultado:', resultado);
        
        if (resultado.success) {
            console.log('[testSalvamentoSupabase] ✅ TESTE PASSOU! Dados salvos com sucesso');
            if (window.showNotification) {
                window.showNotification('✅ Teste de salvamento PASSOU!', 'success');
            }
        } else {
            console.error('[testSalvamentoSupabase] ❌ TESTE FALHOU:', resultado.error);
            if (window.showNotification) {
                window.showNotification('❌ Teste de salvamento FALHOU: ' + resultado.error, 'error');
            }
        }
        
        return resultado;
        
    } catch (error) {
        console.error('[testSalvamentoSupabase] ❌ ERRO CRÍTICO:', error);
        if (window.showNotification) {
            window.showNotification('❌ Erro crítico no teste: ' + error.message, 'error');
        }
        return { success: false, error: error.message };
    }
};

// Função para verificar acesso à tabela planejamento_semanal
window.verificarAcessoTabelaPlanejamento = async function() {
    console.log('[verificarAcessoTabelaPlanejamento] 🔍 VERIFICANDO ACESSO À TABELA');
    
    try {
        // Importar supabase diretamente
        const { supabase } = await import('../services/supabaseService.js');
        
        console.log('[verificarAcessoTabelaPlanejamento] 📊 Testando SELECT na tabela...');
        
        // Tentar fazer um select simples para verificar acesso
        const { data, error } = await supabase
            .from('planejamento_semanal')
            .select('*')
            .limit(1);
            
        if (error) {
            console.error('[verificarAcessoTabelaPlanejamento] ❌ ERRO no SELECT:', error);
            if (window.showNotification) {
                window.showNotification('❌ Erro de acesso à tabela: ' + error.message, 'error');
            }
            return { success: false, error: error.message };
        }
        
        console.log('[verificarAcessoTabelaPlanejamento] ✅ ACESSO OK! Dados encontrados:', data);
        if (window.showNotification) {
            window.showNotification('✅ Acesso à tabela OK!', 'success');
        }
        
        // Testar também INSERT
        console.log('[verificarAcessoTabelaPlanejamento] 🧪 Testando INSERT...');
        const dadosTeste = {
            usuario_id: 999999, // ID fictício para teste
            ano: 2023,
            semana: 99,
            dia_semana: 1,
            tipo_atividade: 'teste',
            numero_treino: null,
            concluido: false
        };
        
        const { data: insertData, error: insertError } = await supabase
            .from('planejamento_semanal')
            .insert(dadosTeste)
            .select();
            
        if (insertError) {
            console.error('[verificarAcessoTabelaPlanejamento] ❌ ERRO no INSERT:', insertError);
            if (window.showNotification) {
                window.showNotification('❌ Erro de INSERT na tabela: ' + insertError.message, 'error');
            }
            return { success: false, error: insertError.message, step: 'insert' };
        }
        
        console.log('[verificarAcessoTabelaPlanejamento] ✅ INSERT OK! Dados inseridos:', insertData);
        
        // Limpar o registro de teste
        if (insertData && insertData[0] && insertData[0].id) {
            console.log('[verificarAcessoTabelaPlanejamento] 🧹 Limpando registro de teste...');
            await supabase
                .from('planejamento_semanal')
                .delete()
                .eq('id', insertData[0].id);
            console.log('[verificarAcessoTabelaPlanejamento] ✅ Registro de teste removido');
        }
        
        if (window.showNotification) {
            window.showNotification('✅ Todos os testes de acesso PASSARAM!', 'success');
        }
        
        return { success: true, message: 'Acesso total à tabela confirmado' };
        
    } catch (error) {
        console.error('[verificarAcessoTabelaPlanejamento] ❌ ERRO CRÍTICO:', error);
        if (window.showNotification) {
            window.showNotification('❌ Erro crítico: ' + error.message, 'error');
        }
        return { success: false, error: error.message };
    }
};

// Função de diagnóstico completo
window.diagnosticoCompletoSalvamento = async function() {
    console.log('[diagnosticoCompletoSalvamento] 🏥 INICIANDO DIAGNÓSTICO COMPLETO');
    
    const resultados = {
        usuario: null,
        protocoloAtivo: null,
        acessoTabela: null,
        testeSalvamento: null
    };
    
    try {
        // 1. Verificar usuário
        console.log('[diagnosticoCompletoSalvamento] 1️⃣ Verificando usuário...');
        const currentUser = AppState.get('currentUser');
        if (currentUser && currentUser.id) {
            resultados.usuario = { success: true, data: currentUser };
            console.log('✅ Usuário OK:', currentUser.id);
        } else {
            resultados.usuario = { success: false, error: 'Usuário não encontrado' };
            console.log('❌ Usuário não encontrado');
        }
        
        // 2. Verificar protocolo ativo
        if (resultados.usuario.success) {
            console.log('[diagnosticoCompletoSalvamento] 2️⃣ Verificando protocolo ativo...');
            try {
                const protocoloAtivo = await fetchProtocoloAtivoUsuario(currentUser.id);
                if (protocoloAtivo) {
                    resultados.protocoloAtivo = { success: true, data: protocoloAtivo };
                    console.log('✅ Protocolo ativo OK:', protocoloAtivo);
                } else {
                    resultados.protocoloAtivo = { success: false, error: 'Protocolo ativo não encontrado' };
                    console.log('❌ Protocolo ativo não encontrado');
                }
            } catch (error) {
                resultados.protocoloAtivo = { success: false, error: error.message };
                console.log('❌ Erro ao buscar protocolo:', error.message);
            }
        }
        
        // 3. Verificar acesso à tabela
        console.log('[diagnosticoCompletoSalvamento] 3️⃣ Verificando acesso à tabela...');
        resultados.acessoTabela = await window.verificarAcessoTabelaPlanejamento();
        
        // 4. Teste de salvamento completo (apenas se tudo anterior passou)
        if (resultados.usuario.success && resultados.protocoloAtivo.success && resultados.acessoTabela.success) {
            console.log('[diagnosticoCompletoSalvamento] 4️⃣ Testando salvamento completo...');
            resultados.testeSalvamento = await window.testSalvamentoSupabase();
        } else {
            resultados.testeSalvamento = { success: false, error: 'Pré-requisitos não atendidos' };
        }
        
        // Gerar relatório
        console.log('[diagnosticoCompletoSalvamento] 📋 RELATÓRIO COMPLETO:');
        console.log('1️⃣ Usuário:', resultados.usuario);
        console.log('2️⃣ Protocolo Ativo:', resultados.protocoloAtivo);
        console.log('3️⃣ Acesso à Tabela:', resultados.acessoTabela);
        console.log('4️⃣ Teste de Salvamento:', resultados.testeSalvamento);
        
        // Gerar mensagem resumida
        let mensagem = '';
        let tipo = 'info';
        
        if (resultados.testeSalvamento.success) {
            mensagem = '✅ TUDO OK! O salvamento deve funcionar normalmente.';
            tipo = 'success';
        } else {
            const problemas = [];
            if (!resultados.usuario.success) problemas.push('Usuário não logado');
            if (!resultados.protocoloAtivo.success) problemas.push('Protocolo ativo ausente');
            if (!resultados.acessoTabela.success) problemas.push('Problema de acesso à tabela');
            if (!resultados.testeSalvamento.success) problemas.push('Falha no teste de salvamento');
            
            mensagem = `❌ PROBLEMAS ENCONTRADOS: ${problemas.join(', ')}`;
            tipo = 'error';
        }
        
        if (window.showNotification) {
            window.showNotification(mensagem, tipo);
        }
        
        return resultados;
        
    } catch (error) {
        console.error('[diagnosticoCompletoSalvamento] ❌ ERRO CRÍTICO:', error);
        if (window.showNotification) {
            window.showNotification('❌ Erro crítico no diagnóstico: ' + error.message, 'error');
        }
        return { success: false, error: error.message, resultados };
    }
};