// js/features/planning.js
// Lógica do planejamento semanal

import AppState from '../state/appState.js';
import { saveWeekPlan, getWeekPlan } from '../utils/weekPlanStorage.js';
import { fetchTiposTreinoMuscular } from '../services/userService.js'; // Importa a nova função
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
                tipo: tipo, // Usado para a lógica de não repetição
                categoria: 'muscular' 
            });
        });

        // Adicionar treinos de Cardio
        for (let i = 0; i < 3; i++) {
            treinosDisponiveis.push({
                id: `cardio_${treinoIdCounter++}`,
                nome: 'Cardio',
                tipo: 'Cardio', // Tipo genérico para cardio
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

// Renderizar treinos disponíveis
function renderizarTreinosDisponiveis() {
    const container = document.getElementById('listaTreinosDisponiveis');
    if (!container) return;
    
    container.innerHTML = treinosDisponiveis.map(treino => {
        // Seleciona o emoji pelo tipo, ou usa padrão se não houver
        const emoji = treinoEmojis[treino.tipo] || '🏋️';
        // Remove prefixos do nome para exibição
        const displayName = treino.nome.replace(/^Muscular: /, '').replace(/^Cardio: /, '');
        return `
            <div class="treino-item" draggable="true" data-treino-id="${treino.id}" data-treino-nome="${treino.nome}" data-treino-tipo="${treino.tipo}">
                <span class="treino-tipo">${emoji}</span>
                <span class="treino-nome">${displayName}</span>
            </div>
        `;
    }).join('');
    
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
    if (!dropZone) return;
    dropZone.classList.remove('drag-over');

    if (elementoArrastando) {
        const dia = dropZone.dataset.dia;
        const treinoIdArrastado = elementoArrastando.dataset.treinoId;

        // Encontrar o objeto do treino arrastado na lista de treinos disponíveis
        const treinoArrastado = treinosDisponiveis.find(t => t.id === treinoIdArrastado);

        if (!treinoArrastado) {
            console.error('[handleDrop] Treino arrastado não encontrado na lista de disponíveis:', treinoIdArrastado);
            showNotification('Erro ao processar o treino.', 'error');
            return;
        }

        // Validação: Não repetir grupos musculares
        if (treinoArrastado.categoria === 'muscular') {
            for (const diaPlanejado in planejamentoAtual) {
                const treinoExistente = planejamentoAtual[diaPlanejado];
                if (treinoExistente.categoria === 'muscular' && treinoExistente.tipo === treinoArrastado.tipo) {
                    showNotification(`O grupo muscular '${treinoArrastado.tipo}' já foi adicionado.`, 'error');
                    return; // Impede a adição
                }
            }
        }
        
        // Adicionar treino ao planejamento
        planejamentoAtual[dia] = {
            id: treinoArrastado.id,
            nome: treinoArrastado.nome,
            tipo: treinoArrastado.tipo,
            categoria: treinoArrastado.categoria
        };

        // Atualizar visualização da drop zone
        dropZone.innerHTML = `
            <div class="treino-no-dia" data-treino-id="${treinoArrastado.id}">
                <span class="treino-tipo">${treinoArrastado.tipo}</span>
                <span class="treino-nome">${treinoArrastado.nome.replace('Muscular: ', '').replace('Cardio: ', '')}</span>
                <button class="remover-treino-dia" onclick="removerTreinoDoDia('${dia}')">X</button>
            </div>
        `;
    }
    
    // Validar planejamento após cada drop para feedback imediato, se necessário
    validarPlanejamento();
    
    return false; // Prevenir default browser handling
}

// Remover treino de um dia
export function removerTreinoDoDia(dia) {
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
        
        if (dropZone && treino && treino.id && treino.nome && treino.tipo) { // Checagem mais robusta do objeto treino
            dropZone.innerHTML = `
                <div class="treino-no-dia" data-treino-id="${treino.id}">
                    <span class="treino-tipo">${treino.tipo}</span>
                    <span class="treino-nome">${treino.nome.replace('Muscular: ', '').replace('Cardio: ', '')}</span>
                    <button class="remover-treino-dia" onclick="removerTreinoDoDia('${dia}')">X</button>
                </div>
            `;
        } else if (dropZone) {
            // Se não houver treino para o dia, garantir que o placeholder seja exibido
            dropZone.innerHTML = '<span class="placeholder">Arraste um treino aqui</span>';
        }
    });
    
    validarPlanejamento();
}

// Validar planejamento
function validarPlanejamento() {
    const btnSalvar = document.getElementById('confirm-plan-btn');
    const validationMessageElement = document.getElementById('plan-validation-message'); // Supondo que o elemento da mensagem tenha este ID
    
    let diasPreenchidos = 0;
    let isValid = true;
    const messages = [];
    const tiposMuscularesNoPlano = {};

    // Iterar sobre os 7 dias da semana (assumindo que as drop zones são numeradas de 0 a 6 ou têm data-dia="0" a data-dia="6")
    const diasDaSemana = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']; // Ou como seus data-dia estiverem definidos
    // Se os data-dia forem numéricos de 0 a 6, podemos usar um loop for (let i = 0; i < 7; i++)

    for (const diaKey in planejamentoAtual) {
        if (planejamentoAtual.hasOwnProperty(diaKey) && planejamentoAtual[diaKey]) {
            diasPreenchidos++;
            const treinoDoDia = planejamentoAtual[diaKey];
            if (treinoDoDia.categoria === 'muscular') {
                tiposMuscularesNoPlano[treinoDoDia.tipo] = (tiposMuscularesNoPlano[treinoDoDia.tipo] || 0) + 1;
            }
        }
    }

    // Validação 1: Todos os slots devem estar cheios
    // Contar quantos dias no planejamentoAtual têm um treino atribuído.
    // Os 'dias' no HTML são 'domingo', 'segunda', etc. O objeto planejamentoAtual usa essas chaves.
    const totalDiasNoModal = document.querySelectorAll('#planning-modal .drop-zone').length;
    if (diasPreenchidos < totalDiasNoModal) {
        messages.push(`❌ Preencha todos os ${totalDiasNoModal} dias da semana (faltam ${totalDiasNoModal - diasPreenchidos}).`);
        isValid = false;
    }

    // Validação 2: Não repetir grupos musculares
    for (const tipo in tiposMuscularesNoPlano) {
        if (tiposMuscularesNoPlano[tipo] > 1) {
            messages.push(`❌ O grupo muscular '${tipo}' está repetido.`);
            isValid = false;
        }
    }

    // Atualizar mensagem de validação e estado do botão salvar
    if (validationMessageElement) {
        if (isValid) {
            validationMessageElement.textContent = '✅ Planejamento válido!';
            validationMessageElement.className = 'success'; // Adicione classes CSS para estilização
        } else {
            validationMessageElement.innerHTML = messages.join('<br>');
            validationMessageElement.className = 'error'; // Adicione classes CSS para estilização
        }
    }

    if (btnSalvar) {
        btnSalvar.disabled = !isValid;
    }

    return isValid; // Retorna o status da validação
}

// Salvar planejamento semanal
export async function salvarPlanejamentoSemanal() {
    if (!validarPlanejamento()) { // Chama a validação aqui
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
};

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
    elementoArrastando = null;
};
