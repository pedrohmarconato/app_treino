// js/features/planning.js - CORREÇÃO DO MODAL
// Versão corrigida que fecha o modal adequadamente

import AppState from '../state/appState.js';
import { getWorkoutIcon, getIconForWorkoutType } from '../utils/icons.js';
// Import removido para compatibilidade com browser tradicional
// Use window.WeeklyPlanService.metodo() para acessar métodos
// Se precisar de funções globais, atribua manualmente abaixo
const obterSemanaAtivaUsuario = window.WeeklyPlanService.obterSemanaAtivaUsuario;
const verificarSemanaJaProgramada = window.WeeklyPlanService.verificarSemanaJaProgramada;
import { weeklyPlanManager } from '../hooks/useWeeklyPlan.js';
import { fetchTiposTreinoMuscular, fetchProtocoloAtivoUsuario } from '../services/userService.js';
import { marcarSemanaProgramada } from '../services/weeklyPlanningService.js';
import { query } from '../services/supabaseService.js';
import { showNotification } from '../ui/notifications.js';

// Variáveis do planejamento
let planejamentoAtual = {};
let treinosDisponiveis = [];
let usuarioIdAtual = null;
let nomeDiaAtual = '';
const nomesDiasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
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
async function inicializarPlanejamento(usuarioId, modoEdicaoParam = false) {
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
        const jaProgramada = await verificarSemanaJaProgramada(usuarioId, semanaAtiva.semana_treino);
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
            popup.classList.add('visible');
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
                modal.classList.add('visible');
                document.body.style.overflow = 'hidden';
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
            modal1.classList.remove('visible');
            modal1.style.display = 'none';
            modal1.style.visibility = 'hidden';
            modal1.style.opacity = '0';
            modal1.classList.add('hidden');
            console.log('[forcarFechamentoModal] Modal modalPlanejamento fechado');
        }
        
        // Método 2: modal-planejamento (ID alternativo)
        const modal2 = document.getElementById('modal-planejamento');
        if (modal2) {
            modal2.classList.remove('visible');
            modal2.style.display = 'none';
            modal2.style.visibility = 'hidden';
            modal2.style.opacity = '0';
            modal2.classList.add('hidden');
            console.log('[forcarFechamentoModal] Modal modal-planejamento fechado');
        }
        
        // Método 3: Fechar seletor de treino se estiver aberto
        const seletorPopup = document.getElementById('seletorTreinoPopup');
        if (seletorPopup) {
            seletorPopup.classList.remove('visible');
            seletorPopup.style.display = 'none';
            seletorPopup.style.visibility = 'hidden';
            seletorPopup.style.opacity = '0';
            seletorPopup.style.zIndex = '';
            console.log('[forcarFechamentoModal] Popup seletor de treino fechado');
        }
        
        // Método 4: Buscar por classe
        const modals = document.querySelectorAll('.modal-overlay, .planning-page-container, .modal');
        modals.forEach((modal, index) => {
            modal.classList.remove('visible');
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
            '.btn-primary, .save-btn, #confirm-plan-btn, .planning-btn, .action-btn, button[onclick*="abrirSeletorTreino"], .day-card button, .empty-slot, .btn-outline-primary'
        );
        botoesParaHabilitar.forEach(btn => {
            if (btn.hasAttribute('data-disabled-by-modal') || btn.disabled) {
                btn.disabled = false;
                btn.style.pointerEvents = 'auto';
                btn.style.opacity = '1';
                btn.removeAttribute('data-disabled-by-modal');
                console.log('[forcarFechamentoModal] Botão habilitado:', btn.className);
            }
        });
        
        // Método 8: Limpar cache de validação
        if (validarPlanejamento._cachedElements) {
            validarPlanejamento._cachedElements = null;
        }
        
        // Limpar outros caches que podem estar causando problemas
        if (window.abrirSeletorTreino._cached) {
            window.abrirSeletorTreino._cached = null;
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
    // Buscar elementos DOM sempre (não usar cache devido a problemas de estado)
    const btnSalvar = document.querySelector('.save-btn') || 
                     document.getElementById('confirm-plan-btn') || 
                     document.querySelector('#confirm-plan-btn') ||
                     document.querySelector('[data-action="save-plan"]') ||
                     document.querySelector('button[onclick*="salvar"]');
    
    const validationMessageElement = document.getElementById('validationMessage') ||
                                   document.querySelector('.validation-message') ||
                                   document.querySelector('#validation-message');
    
    console.log('[validarPlanejamento] Elementos encontrados:', {
        btnSalvar: !!btnSalvar,
        btnSalvarId: btnSalvar?.id,
        btnSalvarClass: btnSalvar?.className,
        validationMessageElement: !!validationMessageElement
    });
    
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

    // Validação 1: Pelo menos 1 dia deve estar preenchido, recomendado 7 dias
    if (diasPreenchidos === 0) {
        messages.push(`❌ Adicione pelo menos um treino na semana.`);
        isValid = false;
    } else if (diasPreenchidos < 7) {
        messages.push(`⚠️ Recomendado preencher todos os 7 dias (faltam ${7 - diasPreenchidos}). Você pode salvar assim mesmo.`);
        // Não invalidar o plano, apenas avisar
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
        
        if (isValid) {
            if (diasPreenchidos === 7) {
                validationMessageElement.textContent = '✅ Planejamento completo! Pronto para salvar.';
            } else {
                validationMessageElement.textContent = `✅ Planejamento válido! ${diasPreenchidos} dia(s) configurado(s). Pronto para salvar.`;
            }
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
        const shouldDisable = !isValid; // Remover exigência de 7 dias
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

    // CORREÇÃO: Garantir que botões de seleção de treino permaneçam habilitados
    const botoesSelecao = document.querySelectorAll(
        'button[onclick*="abrirSeletorTreino"], .day-card button, .empty-slot, .btn-outline-primary'
    );
    botoesSelecao.forEach(btn => {
        if (btn !== btnSalvar && !btn.classList.contains('treino-option')) {
            btn.disabled = false;
            btn.style.pointerEvents = 'auto';
            btn.style.opacity = '1';
        }
    });

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
    
    const diaNumero = parseInt(dia, 10);
    const diaAtualSelecionado = !isNaN(diaNumero) ? diaNumero : diasMap[String(dia).toLowerCase()];
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
    
    if (!popup) {
        console.error('[abrirSeletorTreino] Popup não encontrado!');
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
    
    // Adicionar opção de folga
    const folgaOption = criarOpcaoTreino({
        id: 'folga',
        icon: getWorkoutIcon('descanso'),
        nome: 'Folga',
        descricao: 'Dia de descanso',
        tipo: 'folga',
        categoria: 'folga'
    }, diaAtualSelecionado);
    options.appendChild(folgaOption);
    
    // Adicionar treinos musculares
    console.log('[abrirSeletorTreino] Treinos disponíveis:', treinosDisponiveis);
    
    if (treinosDisponiveis.length === 0) {
        console.warn('[abrirSeletorTreino] Nenhum treino disponível! Criando treinos padrão...');
        
        // Criar treinos padrão se não há nenhum
        treinosDisponiveis = [
            {
                id: 'muscular_peito',
                nome: 'Peito',
                tipo: 'Peito',
                categoria: 'muscular'
            },
            {
                id: 'muscular_costas',
                nome: 'Costas',
                tipo: 'Costas',
                categoria: 'muscular'
            },
            {
                id: 'muscular_pernas',
                nome: 'Pernas',
                tipo: 'Pernas',
                categoria: 'muscular'
            },
            {
                id: 'muscular_ombro',
                nome: 'Ombro e Braço',
                tipo: 'Ombro e Braço',
                categoria: 'muscular'
            }
        ];
        
        console.log('[abrirSeletorTreino] Treinos padrão criados:', treinosDisponiveis);
        
        // Se ainda estiver vazio, tentar recarregar do banco
        if (treinosDisponiveis.length === 0) {
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
    
    // Mostrar popup - CORREÇÃO: Limpar estilos !important primeiro
    popup.classList.add('visible');
    
    // CORREÇÃO CRÍTICA: Limpar estilos inline !important que impedem o modal de aparecer
    popup.style.cssText = '';
    popup.style.display = 'flex';
    popup.style.visibility = 'visible';
    popup.style.opacity = '1';
    popup.style.zIndex = '200000';
    
    document.body.style.overflow = 'hidden';
    
    // Adicionar event listeners para fechar modal
    const fecharModalHandler = (e) => {
        if (e.target === popup || e.key === 'Escape') {
            fecharSeletorTreino();
            document.removeEventListener('keydown', fecharModalHandler);
            popup.removeEventListener('click', fecharModalHandler);
        }
    };
    
    popup.addEventListener('click', fecharModalHandler);
    document.addEventListener('keydown', fecharModalHandler);
    
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
// Criar opção de treino
function criarOpcaoTreino(treino, diaDestino) {
    const option = document.createElement('div');
    option.className = 'treino-option';

    // Verificar se o treino já está usado (para musculares) - LÓGICA CORRIGIDA
    let isDisabled = false;
    let statusText = '';

    if (treino.categoria === 'muscular') {
        const diasComEsseTreino = Object.keys(planejamentoAtual).filter(dia => 
            planejamentoAtual[dia] && planejamentoAtual[dia].tipo === treino.tipo
        );

        const treinoNoOutroDia = diasComEsseTreino.some(dia => dia != diaDestino);

        if (treinoNoOutroDia) {
            isDisabled = true;
            const diaDoUso = diasComEsseTreino.find(d => d != diaDestino);
            statusText = `Já usado em ${nomesDiasSemana[diaDoUso]}`;
        }
        
        console.log(`[criarOpcaoTreino] Validação para ${treino.tipo}:`, {
            diaDestino,
            diasComEsseTreino,
            treinoNoOutroDia,
            isDisabled,
            statusText
        });
    }

    if (isDisabled) {
        option.classList.add('disabled');
    }

    option.innerHTML = `
        <span class="option-icon">${getWorkoutIcon(treino.tipo)}</span>
        <div class="option-info">
            <div class="option-name">${treino.nome}</div>
            <div class="option-description">${treino.descricao || ''}</div>
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

// Fechar seletor de treino
window.fecharSeletorTreino = function() {
    console.log('[fecharSeletorTreino] Fechando popup de seleção...');
    
    const popup = document.getElementById('seletorTreinoPopup');
    if (popup) {
        popup.classList.remove('visible');
        popup.style.display = 'none';
        popup.style.visibility = 'hidden';
        popup.style.opacity = '0';
        popup.style.zIndex = '-1';
        popup.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important;';
        
        document.body.style.overflow = '';
        console.log('[fecharSeletorTreino] Popup fechado completamente');
    }
    
    // Limpar estado
    nomeDiaAtual = '';
    
    // Restaurar botões que podem ter ficado desabilitados - VERSÃO AGRESSIVA
    const botoesParaHabilitar = document.querySelectorAll(
        'button, .btn, .day-card button, .empty-slot, .treino-assigned button, .btn-outline-primary, [onclick*="abrirSeletorTreino"]'
    );
    botoesParaHabilitar.forEach(btn => {
        // Pular apenas o botão de salvar planejamento
        if (!btn.id || !btn.id.includes('salvar') && !btn.id.includes('confirm')) {
            btn.disabled = false;
            btn.style.pointerEvents = 'auto';
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
            btn.removeAttribute('data-disabled-by-modal');
            console.log('[fecharSeletorTreino] Botão habilitado:', btn.textContent || btn.className);
        }
    });
    
    // Aguardar e reabilitar novamente para garantir
    setTimeout(() => {
        const botoesDia = document.querySelectorAll('[onclick*="abrirSeletorTreino"]');
        botoesDia.forEach(btn => {
            btn.disabled = false;
            btn.style.pointerEvents = 'auto';
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        });
        console.log('[fecharSeletorTreino] Segunda verificação - botões reabilitados');
    }, 50);
    
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

// Função auxiliar para limpar estado antes de abrir seletor
function limparEstadoSeletor(dia) {
    console.log(`[limparEstadoSeletor] Limpeza ROBUSTA do estado para dia ${dia}`);
    
    // Limpar todas as possíveis referências - VERSÃO MELHORADA
    delete planejamentoAtual[dia];
    delete planejamentoAtual[String(dia)];
    delete planejamentoAtual[parseInt(dia)];
    
    // Forçar limpeza de qualquer referência residual
    Object.keys(planejamentoAtual).forEach(key => {
        if (key == dia || key === String(dia) || key === parseInt(dia)) {
            delete planejamentoAtual[key];
            console.log(`[limparEstadoSeletor] Removida chave residual: ${key}`);
        }
    });
    
    // Limpar possíveis caches ou estados temporários
    if (window.tempPlanejamento) {
        delete window.tempPlanejamento[dia];
        delete window.tempPlanejamento[String(dia)];
        delete window.tempPlanejamento[parseInt(dia)];
    }
    
    console.log(`[limparEstadoSeletor] Estado limpo para dia ${dia}:`, planejamentoAtual);
}

// Selecionar treino para um dia com validação de semana_referencia
async function selecionarTreinoParaDia(treino, dia) {
    // Garantir que temos um usuário válido
    let userId = usuarioIdAtual;
    if (!userId) {
        const currentUser = AppState.get('currentUser');
        userId = currentUser?.id;
    }
    
    if (!userId) {
        showNotification('Erro: usuário não identificado', 'error');
        fecharSeletorTreino();
        return;
    }
    
    // Validar semana_referencia se for treino muscular
    if (treino.categoria === 'muscular' || treino.categoria === 'treino') {
        try {
            // Buscar protocolo ativo do usuário
            const protocoloAtivo = await fetchProtocoloAtivoUsuario(userId);
            if (!protocoloAtivo) {
                showNotification('Erro: usuário sem protocolo ativo', 'error');
                fecharSeletorTreino();
                return;
            }
            
            // Verificar se existe semana_referencia válida para este protocolo
            const { data: protocoloTreinos } = await query('protocolo_treinos', {
                eq: { protocolo_id: protocoloAtivo.protocolo_treinamento_id },
                select: 'semana_referencia'
            });
            
            if (!protocoloTreinos || protocoloTreinos.length === 0) {
                showNotification('Erro: protocolo sem treinos configurados', 'error');
                fecharSeletorTreino();
                return;
            }
            
            // Adicionar semana_referencia válida ao treino
            const treinosDisponiveis = [...new Set(protocoloTreinos.map(pt => pt.semana_referencia))];
            const treinoIndex = parseInt(dia) % treinosDisponiveis.length;
            treino.semana_referencia = treinosDisponiveis[treinoIndex] || treinosDisponiveis[0];
            
        } catch (error) {
            console.error('[selecionarTreinoParaDia] Erro na validação:', error);
            showNotification('Erro ao validar treino com protocolo', 'error');
            fecharSeletorTreino();
            return;
        }
    }
    
    if (modoEdicao) {
        // Salvar mudança no banco de dados usando novo serviço
        const resultado = await WeeklyPlanService.updateDay(userId, dia, treino);
        
        if (!resultado.success) {
            showNotification(`Erro: ${resultado.error}`, 'error');
            fecharSeletorTreino();
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
    
    // Aguardar DOM atualizar antes de validar para evitar conflitos
    setTimeout(() => {
        validarPlanejamentoDebounced();
    }, 100);
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

// Remover treino do dia - VERSÃO MELHORADA
window.removerTreinoDoDia = function(dia) {
    console.log(`[removerTreinoDoDia] Removendo treino do dia ${dia}`);
    console.log(`[removerTreinoDoDia] Estado antes da remoção:`, planejamentoAtual);
    
    // CORREÇÃO: Garantir limpeza completa do estado - VERSÃO MELHORADA
    const treinoRemovido = planejamentoAtual[dia];
    
    // Limpar todas as possíveis referências
    delete planejamentoAtual[dia];
    delete planejamentoAtual[String(dia)];
    delete planejamentoAtual[parseInt(dia)];
    
    // Forçar limpeza de qualquer referência residual
    Object.keys(planejamentoAtual).forEach(key => {
        if (key == dia || key === String(dia) || key === parseInt(dia)) {
            delete planejamentoAtual[key];
        }
    });
    
    console.log(`[removerTreinoDoDia] Treino removido:`, treinoRemovido);
    console.log(`[removerTreinoDoDia] Estado após remoção:`, planejamentoAtual);

    const dayContent = document.getElementById(`dia-${dia}-content`);
    if (dayContent) {
        dayContent.innerHTML = '';

        const addButton = document.createElement('button');
        addButton.className = 'empty-slot';
        
        // CORREÇÃO: Garantir que o botão funcione corretamente após remoção
        addButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            console.log(`[removerTreinoDoDia] Botão clicado para dia ${dia}`);
            
            // NOVA CORREÇÃO: Limpar estado antes de abrir seletor
            limparEstadoSeletor(dia);
            
            if (window.abrirSeletorTreino) {
                // Aguardar um pouco para garantir que o estado foi limpo
                setTimeout(() => {
                    window.abrirSeletorTreino(dia, nomesDiasSemana[dia]);
                }, 100);
            } else {
                console.error('[removerTreinoDoDia] A função abrirSeletorTreino não foi encontrada no window.');
            }
        });

        addButton.innerHTML = `
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14m-7-7h14"/>
            </svg>
            <span>Adicionar</span>
        `;
        dayContent.appendChild(addButton);
    }

    // CORREÇÃO: Aguardar um pouco antes de validar para garantir que o DOM foi atualizado
    setTimeout(() => {
        validarPlanejamentoDebounced();
    }, 150);
    
    if (window.showNotification) {
        const nomeRemovido = treinoRemovido ? treinoRemovido.nome : 'Treino';
        window.showNotification(`${nomeRemovido} removido de ${nomesDiasSemana[dia]}`, 'info');
    }
    
    console.log(`[removerTreinoDoDia] Remoção concluída para dia ${dia}`);
};

// Salvar planejamento semanal com validação
async function salvarPlanejamentoSemanal() {
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

        // Montar objeto indexado para Supabase com validação de semana_referencia
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
            
            // Validar semana_referencia para treinos musculares
            let numeroTreino = null;
            if (treino && (treino.categoria === 'muscular' || treino.categoria === 'treino')) {
                numeroTreino = treino.semana_referencia;
                // Se não foi definido, usar um válido do protocolo
                if (!numeroTreino) {
                    const { data: protocoloTreinos } = await query('protocolo_treinos', {
                        eq: { protocolo_id: protocoloAtivo.protocolo_treinamento_id },
                        select: 'semana_referencia',
                        order: { column: 'semana_referencia', ascending: true }
                    });
                    
                    if (protocoloTreinos && protocoloTreinos.length > 0) {
                        const treinosDisponiveis = [...new Set(protocoloTreinos.map(pt => pt.semana_referencia))];
                        const treinoIndex = dia % treinosDisponiveis.length;
                        numeroTreino = treinosDisponiveis[treinoIndex] || treinosDisponiveis[0];
                    }
                }
            }
            
            if (treino && treino.tipo) {
                planejamentoParaSupabase[dia] = {
                    tipo: treino.tipo,
                    categoria: treino.categoria,
                    semana_referencia: numeroTreino,
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
                semana_referencia: config.semana_referencia,
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
        
        // CORREÇÃO: Limpar cache do dashboard antes de recarregar
        if (window.limparCachesDashboard) {
            console.log('[salvarPlanejamentoSemanal] Limpando caches do dashboard...');
            window.limparCachesDashboard();
        }
        
        // Forçar atualização imediata dos indicadores na home
        setTimeout(async () => {
            try {
                if (window.carregarDashboard) {
                    console.log('[salvarPlanejamentoSemanal] Recarregando dashboard...');
                    await window.carregarDashboard();
                }
                if (window.carregarIndicadoresSemana) {
                    console.log('[salvarPlanejamentoSemanal] Recarregando indicadores...');
                    await window.carregarIndicadoresSemana();
                }
                if (window.atualizarSeletorSemanas) {
                    console.log('[salvarPlanejamentoSemanal] Atualizando seletor de semanas...');
                    window.atualizarSeletorSemanas();
                }
            } catch (error) {
                console.warn('[salvarPlanejamentoSemanal] Erro ao recarregar (não crítico):', error);
            }
        }, 100);
        

        if (window.showNotification) {
            window.showNotification('✅ Planejamento salvo com sucesso!', 'success');
        }

        // CORREÇÃO: Forçar fechamento antes de navegar
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
                    console.log('[salvarPlanejamentoSemanal] Recarregando dashboard...');
                    await window.carregarDashboard();
                }
                if (window.inicializarHome) {
                    console.log('[salvarPlanejamentoSemanal] Inicializando home...');
                    await window.inicializarHome();
                }
            } catch (error) {
                console.warn('[salvarPlanejamentoSemanal] Erro ao recarregar (não crítico):', error);
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
function fecharModalPlanejamento() {
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
async function abrirCriacaoPlanejamento(usuarioId) {
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
            
            modal.classList.add('visible');
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
async function abrirEdicaoPlanejamento(usuarioId) {
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
async function abrirModalPlanejamento(usuarioId) {
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
async function needsWeekPlanningAsync(userId) {
    return await WeeklyPlanService.needsPlanning(userId);
}

// Exportar função removerTreinoDoDia para compatibilidade
// Disponibilizar função para compatibilidade
window.inicializarPlanejamento = inicializarPlanejamento;
window.salvarPlanejamentoSemanal = salvarPlanejamentoSemanal;
window.fecharModalPlanejamento = fecharModalPlanejamento;
window.abrirCriacaoPlanejamento = abrirCriacaoPlanejamento;
window.abrirEdicaoPlanejamento = abrirEdicaoPlanejamento;
window.abrirModalPlanejamento = abrirModalPlanejamento;
window.needsWeekPlanningAsync = needsWeekPlanningAsync;

// Função global para compatibilidade com o template
window.salvarPlanejamento = async function() {
    console.log('[window.salvarPlanejamento] Função chamada!');
    
    // Adicionar feedback visual no botão
    const botaoSalvar = document.querySelector('.btn-save-plan, [onclick*="salvarPlanejamento"], button[onclick*="salvarPlanejamento"]');
    if (botaoSalvar) {
        botaoSalvar.disabled = true;
        botaoSalvar.textContent = 'Salvando...';
        botaoSalvar.style.opacity = '0.7';
    }
    
    try {
        console.log('[window.salvarPlanejamento] Chamando salvarPlanejamentoSemanal...');
        await salvarPlanejamentoSemanal();
        console.log('[window.salvarPlanejamento] salvarPlanejamentoSemanal concluída com sucesso!');
    } catch (error) {
        console.error('[window.salvarPlanejamento] Erro:', error);
        if (window.showNotification) {
            window.showNotification('Erro ao salvar: ' + error.message, 'error');
        }
    } finally {
        // Restaurar botão
        if (botaoSalvar) {
            botaoSalvar.disabled = false;
            botaoSalvar.textContent = 'Salvar Planejamento';
            botaoSalvar.style.opacity = '1';
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

// Função de debug para diagnosticar problemas de seleção de grupos musculares
window.debugPlanejamentoSemanal = function() {
    console.log('=== DEBUG PLANEJAMENTO SEMANAL ===');
    console.log('Estado atual do planejamento:', planejamentoAtual);
    console.log('Chaves do planejamento:', Object.keys(planejamentoAtual));
    console.log('Valores do planejamento:', Object.values(planejamentoAtual));
    
    // Verificar duplicatas
    const tiposUsados = {};
    Object.entries(planejamentoAtual).forEach(([dia, treino]) => {
        if (treino && treino.tipo) {
            tiposUsados[treino.tipo] = (tiposUsados[treino.tipo] || 0) + 1;
        }
    });
    
    console.log('Tipos de treino por dia:', tiposUsados);
    
    // Identificar duplicatas
    const duplicatas = Object.entries(tiposUsados).filter(([tipo, dias]) => dias.length > 1);
    if (duplicatas.length > 0) {
        console.warn('⚠️ DUPLICATAS ENCONTRADAS:', duplicatas);
    } else {
        console.log('✅ Nenhuma duplicata encontrada');
    }
    
    // Verificar estado dos botões
    const botoesSelecao = document.querySelectorAll('[onclick*="abrirSeletorTreino"]');
    console.log('Botões de seleção encontrados:', botoesSelecao.length);
    
    botoesSelecao.forEach((btn, index) => {
        console.log(`Botão ${index}:`, {
            disabled: btn.disabled,
            text: btn.textContent?.trim(),
            onclick: btn.onclick?.toString().substring(0, 50) + '...'
        });
    });
    
    console.log('================================');
    
    return {
        planejamentoAtual,
        tiposUsados,
        duplicatas,
        totalBotoes: botoesSelecao.length
    };
};

// Função de correção automática para problemas de estado inconsistente no planejamento
window.corrigirEstadoPlanejamento = function() {
    console.log('[corrigirEstadoPlanejamento] 🔧 INICIANDO CORREÇÃO AUTOMÁTICA');
    
    let correcoesFeiras = 0;
    
    // 1. Limpar chaves duplicadas ou inválidas
    const chavesValidas = ['0', '1', '2', '3', '4', '5', '6', 0, 1, 2, 3, 4, 5, 6];
    const chavesParaRemover = Object.keys(planejamentoAtual).filter(chave => 
        !chavesValidas.includes(chave) && !chavesValidas.includes(parseInt(chave))
    );
    
    chavesParaRemover.forEach(chave => {
        console.log(`[corrigirEstadoPlanejamento] Removendo chave inválida: ${chave}`);
        delete planejamentoAtual[chave];
        correcoesFeiras++;
    });
    
    // 2. Normalizar chaves para números
    const planejamentoNormalizado = {};
    Object.entries(planejamentoAtual).forEach(([dia, treino]) => {
        const diaNumerico = parseInt(dia);
        if (diaNumerico >= 0 && diaNumerico <= 6) {
            planejamentoNormalizado[diaNumerico] = treino;
        }
    });
    
    // 3. Detectar e resolver duplicatas de grupos musculares
    const tiposUsados = {};
    Object.entries(planejamentoNormalizado).forEach(([dia, treino]) => {
        if (treino && treino.tipo) {
            tiposUsados[treino.tipo] = (tiposUsados[treino.tipo] || 0) + 1;
        }
    });

    // Resolver duplicatas mantendo apenas a primeira ocorrência
    Object.entries(tiposUsados).forEach(([tipo, dias]) => {
        if (dias.length > 1) {
            console.log(`[corrigirEstadoPlanejamento] ⚠️ Duplicata encontrada para ${tipo} nos dias: ${dias.join(', ')}`);
            // Manter apenas o primeiro dia, remover os outros
            for (let i = 1; i < dias.length; i++) {
                console.log(`[corrigirEstadoPlanejamento] Removendo duplicata de ${tipo} do dia ${dias[i]}`);
                delete planejamentoNormalizado[dias[i]];
                correcoesFeiras++;
            }
        }
    });
    
    // 4. Atualizar o planejamento global
    Object.keys(planejamentoAtual).forEach(key => delete planejamentoAtual[key]);
    Object.assign(planejamentoAtual, planejamentoNormalizado);
    
    // 5. Reabilitar todos os botões de seleção
    const botoesParaHabilitar = document.querySelectorAll(
        'button, .btn, .day-card button, .empty-slot, .treino-assigned button, .btn-outline-primary, [onclick*="abrirSeletorTreino"]'
    );
    botoesParaHabilitar.forEach(btn => {
        if (btn.hasAttribute('data-disabled-by-modal') || btn.disabled) {
            btn.disabled = false;
            btn.style.pointerEvents = 'auto';
            btn.style.opacity = '1';
            btn.removeAttribute('data-disabled-by-modal');
            console.log('[corrigirEstadoPlanejamento] Botão habilitado:', btn.className);
        }
    });
    
    // 6. Limpar cache de validação
    if (validarPlanejamento._cachedElements) {
        validarPlanejamento._cachedElements = null;
    }
    
    // Limpar outros caches que podem estar causando problemas
    if (window.abrirSeletorTreino._cached) {
        window.abrirSeletorTreino._cached = null;
    }
    
    // 7. Forçar revalidação
    setTimeout(() => {
        validarPlanejamentoDebounced();
    }, 100);
    
    console.log('[corrigirEstadoPlanejamento] ✅ CORREÇÃO CONCLUÍDA! ${correcoesFeiras} problemas corrigidos');
    console.log('[corrigirEstadoPlanejamento] Estado final:', planejamentoAtual);
    
    if (window.showNotification) {
        window.showNotification(`✅ Estado corrigido! ${correcoesFeiras} problemas resolvidos`, 'success');
    }
    
    return {
        correcoesFeiras,
        estadoFinal: planejamentoAtual,
        tiposUsados: Object.keys(tiposUsados)
    };
};

// Função para diagnosticar problema de semana
window.diagnosticarProblemaSemanea = async function() {
    console.log('[diagnosticarProblemaSemanea] 🔍 VERIFICANDO PROBLEMA DE SEMANA');
    
    try {
        const userId = AppState.get('currentUser')?.id;
        if (!userId) {
            console.error('[diagnosticarProblemaSemanea] Usuário não encontrado');
            return;
        }
        
        // 1. Verificar d_calendario para semana atual real
        const { data: calendarioAtual } = await query('d_calendario', {
            eq: { eh_semana_atual: true },
            limit: 1
        });
        
        console.log('[diagnosticarProblemaSemanea] 📅 Calendário atual:', calendarioAtual);
        
        // 2. Verificar usuario_plano_treino
        const { data: planoUsuario } = await query('usuario_plano_treino', {
            eq: { 
                usuario_id: userId,
                status: 'ativo'
            },
            limit: 1
        });
        
        console.log('[diagnosticarProblemaSemanea] 👤 Plano usuário:', planoUsuario);
        
        // 3. MUDANÇA: Verificar planejamento baseado na semana individual do usuário
        const semanaUsuario = planoUsuario?.[0]?.semana_atual;
        if (semanaUsuario) {
            const { data: planejamentoAtual } = await query('planejamento_semanal', {
                eq: { 
                    usuario_id: userId,
                    // Buscar dados da semana do protocolo do usuário
                    ano: new Date().getFullYear(),
                    semana: semanaUsuario // MUDANÇA: Usar semana individual do usuário
                }
            });
            
            console.log('[diagnosticarProblemaSemanea] 📋 Planejamento semana usuário:', planejamentoAtual);
        }
        
        // 4. MUDANÇA: Diagnóstico atualizado - não comparar mais com calendário global
        const semanaCalendario = calendarioAtual?.[0]?.semana_treino; // Apenas para referência
        
        console.log('[diagnosticarProblemaSemanea] 🎯 DIAGNÓSTICO ATUALIZADO:');
        console.log('- Semana individual do usuário (ATUAL):', semanaUsuario);
        console.log('- Semana global do calendário (OBSOLETA):', semanaCalendario);
        console.log('- 📝 NOTA: Sistema agora usa progressão individual, não semana global');
        
        // MUDANÇA: Não tratar diferença como problema - é normal agora
        if (semanaUsuario !== semanaCalendario) {
            console.log('[diagnosticarProblemaSemanea] ✅ DIFERENÇA NORMAL: Cada usuário tem sua própria progressão');
            
            if (window.showNotification) {
                window.showNotification(`✅ Sistema atualizado: Usuário está na semana ${semanaUsuario} do seu protocolo`, 'info');
            }
            
            return {
                problema: false, // MUDANÇA: Não é mais um problema
                semanaUsuario,
                semanaCalendario,
                planoUsuario: planoUsuario?.[0],
                calendarioAtual: calendarioAtual?.[0],
                nota: 'Sistema usa progressão individual - diferença é normal'
            };
        } else {
            console.log('[diagnosticarProblemaSemanea] ✅ Semanas alinhadas');
            if (window.showNotification) {
                window.showNotification('✅ Semanas estão alinhadas', 'success');
            }
            return { problema: false };
        }
        
    } catch (error) {
        console.error('[diagnosticarProblemaSemanea] Erro:', error);
        if (window.showNotification) {
            window.showNotification('Erro ao diagnosticar: ' + error.message, 'error');
        }
    }
};

// Função para corrigir problema de semana
window.corrigirProblemaSemanea = async function() {
    console.log('[corrigirProblemaSemanea] 🔧 CORRIGINDO PROBLEMA DE SEMANA');
    
    try {
        const userId = AppState.get('currentUser')?.id;
        if (!userId) {
            console.error('[corrigirProblemaSemanea] Usuário não encontrado');
            return;
        }
        
        // 1. MUDANÇA: Não usar mais semana global do calendário
        // A semana correta agora é baseada na progressão individual do usuário
        console.log('[corrigirProblemaSemanea] ⚠️ FUNÇÃO DESATUALIZADA: Semana não é mais global');
        console.log('[corrigirProblemaSemanea] 📝 Use a progressão individual do usuário em usuario_plano_treino.semana_atual');
        
        // Obter protocolo ativo do usuário
        const { data: protocoloAtivo } = await query('usuario_plano_treino', {
            eq: { usuario_id: userId, status: 'ativo' },
            limit: 1
        });
        
        if (!protocoloAtivo || protocoloAtivo.length === 0) {
            console.error('[corrigirProblemaSemanea] Usuário não tem protocolo ativo');
            return;
        }
        
        const semanaCorreta = protocoloAtivo[0].semana_atual;
        console.log('[corrigirProblemaSemanea] 📊 Semana atual do usuário:', semanaCorreta);
        
        // 2. Atualizar usuario_plano_treino
        const { supabase } = await import('../services/supabaseService.js');
        const { data, error } = await supabase
            .from('usuario_plano_treino')
            .update({ semana_atual: semanaCorreta })
            .eq('usuario_id', userId)
            .eq('status', 'ativo')
            .select();
            
        if (error) {
            console.error('[corrigirProblemaSemanea] Erro ao atualizar:', error);
            if (window.showNotification) {
                window.showNotification('Erro ao corrigir: ' + error.message, 'error');
            }
            return;
        }
        
        console.log('[corrigirProblemaSemanea] ✅ Semana corrigida:', data);
        
        if (window.showNotification) {
            window.showNotification(`✅ Semana corrigida para ${semanaCorreta}!`, 'success');
        }
        
        // 3. Forçar recarregamento dos dados
        if (window.limparCachesDashboard) {
            window.limparCachesDashboard();
        }
        
        setTimeout(async () => {
            if (window.carregarDashboard) {
                await window.carregarDashboard();
            }
            if (window.carregarIndicadoresSemana) {
                await window.carregarIndicadoresSemana();
            }
        }, 200);
        
        return { success: true, semanaCorrigida: semanaCorreta };
        
    } catch (error) {
        console.error('[corrigirProblemaSemanea] Erro:', error);
        if (window.showNotification) {
            window.showNotification('Erro ao corrigir: ' + error.message, 'error');
        }
    }
};

// Função para testar salvamento no Supabase
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
            0: { tipo: 'Peito', categoria: 'muscular', semana_referencia: 1, concluido: false },
            2: { tipo: 'Costas', categoria: 'muscular', semana_referencia: 2, concluido: false },
            4: { tipo: 'Pernas', categoria: 'muscular', semana_referencia: 3, concluido: false },
            5: { tipo: 'Cardio', categoria: 'cardio', semana_referencia: null, concluido: false }
        };
        
        console.log('[testSalvamentoSupabase] 📋 Dados de teste:', dadosTeste);
        
        // Testar salvamento
        const resultado = await WeeklyPlanService.savePlan(currentUser.id, dadosTeste);
        
        console.log('[testSalvamentoSupabase] 📥 Resultado retornado:', resultado);

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
        return { success: false, error: error.message, resultados: [] };
    }
};