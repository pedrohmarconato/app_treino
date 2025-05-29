// js/features/planning.js
// Lógica do planejamento semanal

import AppState from '../state/appState.js';
import { saveWeekPlan, getWeekPlan } from '../utils/weekPlanStorage.js';
import { fetchGruposMuscularesTreinos } from '../services/workoutService.js';
import { showNotification } from '../ui/notifications.js';
import { mostrarTela } from '../ui/navigation.js';

// Variáveis do planejamento
let planejamentoAtual = {};
let treinosDisponiveis = [];
let usuarioIdAtual = null;
let elementoArrastando = null;

// Inicializar planejamento
export async function inicializarPlanejamento(usuarioId) {
    console.log('[inicializarPlanejamento] Iniciando para usuário:', usuarioId);
    usuarioIdAtual = usuarioId;
    
    try {
        // Carregar grupos musculares
        const grupos = await fetchGruposMuscularesTreinos();
        
        // Criar treinos disponíveis
        treinosDisponiveis = [
            { id: 1, nome: 'Treino A - Peito e Tríceps', tipo: 'A' },
            { id: 2, nome: 'Treino B - Costas e Bíceps', tipo: 'B' },
            { id: 3, nome: 'Treino C - Pernas', tipo: 'C' },
            { id: 4, nome: 'Treino D - Ombros e Abdômen', tipo: 'D' }
        ];
        
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

// Renderizar treinos disponíveis
function renderizarTreinosDisponiveis() {
    const container = document.getElementById('listaTreinosDisponiveis');
    if (!container) return;
    
    container.innerHTML = treinosDisponiveis.map(treino => `
        <div class="treino-item" draggable="true" data-treino-id="${treino.id}" data-treino-nome="${treino.nome}">
            <span class="treino-tipo">${treino.tipo}</span>
            <span class="treino-nome">${treino.nome}</span>
        </div>
    `).join('');
    
    // Adicionar eventos de drag
    container.querySelectorAll('.treino-item').forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragend', handleDragEnd);
    });
    
    // Configurar drop zones
    configurarDropZones();
}

// Configurar zonas de drop
function configurarDropZones() {
    document.querySelectorAll('.drop-zone').forEach(zone => {
        zone.addEventListener('dragover', handleDragOver);
        zone.addEventListener('drop', handleDrop);
        zone.addEventListener('dragleave', handleDragLeave);
        zone.addEventListener('dragenter', handleDragEnter);
    });
}

// Handlers de drag and drop
function handleDragStart(e) {
    elementoArrastando = e.target;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/html', e.target.innerHTML);
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'copy';
    return false;
}

function handleDragEnter(e) {
    e.target.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.target.classList.remove('drag-over');
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    e.preventDefault();
    
    const dropZone = e.target.closest('.drop-zone');
    dropZone.classList.remove('drag-over');
    
    if (elementoArrastando) {
        const dia = dropZone.dataset.dia;
        const treinoId = elementoArrastando.dataset.treinoId;
        const treinoNome = elementoArrastando.dataset.treinoNome;
        
        // Adicionar treino ao planejamento
        planejamentoAtual[dia] = {
            id: treinoId,
            nome: treinoNome,
            tipo: treinoNome.split(' ')[1] // Extrai A, B, C ou D
        };
        
        // Atualizar visualização
        dropZone.innerHTML = `
            <div class="treino-alocado" data-treino-id="${treinoId}">
                <span>${treinoNome}</span>
                <button class="btn-remover" onclick="removerTreinoDoDia('${dia}')">×</button>
            </div>
        `;
        
        // Validar planejamento
        validarPlanejamento();
    }
    
    return false;
}

// Remover treino de um dia
window.removerTreinoDoDia = function(dia) {
    delete planejamentoAtual[dia];
    
    const dropZone = document.querySelector(`.drop-zone[data-dia="${dia}"]`);
    if (dropZone) {
        dropZone.innerHTML = '<span class="placeholder">Arraste um treino aqui</span>';
    }
    
    validarPlanejamento();
};

// Renderizar planejamento existente
function renderizarPlanejamentoExistente() {
    Object.keys(planejamentoAtual).forEach(dia => {
        const treino = planejamentoAtual[dia];
        const dropZone = document.querySelector(`.drop-zone[data-dia="${dia}"]`);
        
        if (dropZone && treino) {
            dropZone.innerHTML = `
                <div class="treino-alocado" data-treino-id="${treino.id}">
                    <span>${treino.nome}</span>
                    <button class="btn-remover" onclick="removerTreinoDoDia('${dia}')">×</button>
                </div>
            `;
        }
    });
    
    validarPlanejamento();
}

// Validar planejamento
function validarPlanejamento() {
    const btnSalvar = document.getElementById('confirm-plan-btn');
    const validation = document.getElementById('plan-validation');
    
    const treinos = { A: 0, B: 0, C: 0, D: 0 };
    let diasPreenchidos = 0;
    let isValid = true;
    let messages = [];
    
    // Contar treinos
    for (let dia = 0; dia < 7; dia++) {
        if (planejamentoAtual[dia]) {
            diasPreenchidos++;
            const tipo = planejamentoAtual[dia].tipo;
            if (treinos[tipo] !== undefined) {
                treinos[tipo]++;
            }
        }
    }
    
    // Verificar se todos os dias estão preenchidos
    if (diasPreenchidos < 7) {
        messages.push(`❌ Preencha todos os dias da semana (faltam ${7 - diasPreenchidos} dias)`);
        isValid = false;
    }
    
    // Verificar duplicatas e faltantes
    Object.entries(treinos).forEach(([tipo, count]) => {
        if (count > 1) {
            messages.push(`❌ Treino ${tipo} está duplicado`);
            isValid = false;
        } else if (count === 0) {
            messages.push(`❌ Treino ${tipo} não foi alocado`);
            isValid = false;
        }
    });
    
    // Atualizar validação visual
    if (validation) {
        if (isValid) {
            validation.className = 'plan-validation show success';
            validation.innerHTML = '✅ Planejamento válido! Todos os treinos estão corretamente distribuídos.';
        } else {
            validation.className = 'plan-validation show error';
            validation.innerHTML = messages.join('<br>');
        }
    }
    
    // Habilitar/desabilitar botão
    if (btnSalvar) {
        btnSalvar.disabled = !isValid;
    }
}

// Salvar planejamento semanal
window.salvarPlanejamentoSemanal = async function() {
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
};

// Fechar modal de planejamento
window.fecharModalPlanejamento = function() {
    const modal = document.getElementById('modalPlanejamento');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Limpar estado
    planejamentoAtual = {};
    treinosDisponiveis = [];
    usuarioIdAtual = null;
    elementoArrastando = null;
};

// Exportar função de inicialização
window.inicializarPlanejamento = inicializarPlanejamento;