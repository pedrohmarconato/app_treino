// feature/progressaoSemana.js
// Componente vanilla (não React) para exibir a progressão semanal do usuário
// inspirado no design React fornecido pelo time de produto.

import { supabase } from '../services/supabaseService.js';

// Pequeno utilitário para exibir notificações. Usa toast se existir, senão fallback
function showToast(message, type = 'success') {
    if (window.toast && typeof window.toast[type] === 'function') {
        window.toast[type](message);
    } else {
        alert(message); // fallback simples
    }
}

/**
 * Renderiza a UI da progressão semanal dentro do container indicado.
 * @param {HTMLElement} container
 * @param {object} status
 * @param {string|number} usuarioId
 */
function renderCard(container, status, usuarioId) {
    // Insere CSS uma única vez
    if (!document.getElementById('progressao-semana-styles')) {
        const style = document.createElement('style');
        style.id = 'progressao-semana-styles';
        style.textContent = `
            .progressao-card {
                background: var(--bg-card, #232323);
                border-radius: var(--radius-md, 12px);
                padding: 24px;
                margin: 16px 0;
                box-shadow: var(--shadow-card, 0 10px 40px rgba(0,0,0,0.3));
                color: var(--text-primary, #fff);
            }
            .progressao-card h3 {
                margin: 0 0 16px 0;
                font-size: 1.25rem;
                font-weight: 600;
            }
            .progressao-card .status-treinos {
                margin-bottom: 16px;
            }
            .progressao-card .progress-bar {
                width: 100%;
                height: 8px;
                background: var(--bg-secondary, #181818);
                border-radius: 4px;
                overflow: hidden;
            }
            .progressao-card .progress-fill {
                height: 100%;
                background: var(--accent-green, #CFFF04);
                transition: width 0.4s ease;
            }
            .progressao-card .mensagem {
                margin: 12px 0;
            }
            .progressao-card .mensagem .sugestao {
                color: var(--text-secondary, #a8a8a8);
                font-size: 0.875rem;
                margin-top: 4px;
            }
            .progressao-card .acoes {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .progressao-card button {
                padding: 10px 16px;
                border: none;
                border-radius: var(--radius-sm, 8px);
                cursor: pointer;
                font-weight: 600;
                transition: var(--transition, all 0.3s ease);
            }
            .progressao-card .btn-primary {
                background: var(--accent-green, #CFFF04);
                color: #000;
            }
            .progressao-card .btn-secondary {
                background: #ffcc00;
                color: #000;
            }
            .progressao-card .btn-warning {
                background: #ff0055;
                color: #fff;
            }
            .progressao-card .btn-primary[disabled],
            .progressao-card .btn-secondary[disabled],
            .progressao-card .btn-warning[disabled] {
                opacity: 0.6;
                cursor: not-allowed;
            }
            .progressao-card .aviso-domingo {
                background: rgba(255, 165, 0, 0.1);
                padding: 12px;
                border-radius: 8px;
                margin-bottom: 8px;
            }
            .progressao-card .alert-warning {
                color: #ffcc00;
            }
        `;
        document.head.appendChild(style);
    }

    const percentual = status.percentual_concluido || 0;
    const corBarra = percentual >= 80 ? 'var(--accent-green, #CFFF04)' : '#ffcc00';

    // Construir HTML
    container.innerHTML = `
        <div class="progressao-card">
            <h3>Progressão da Semana</h3>
            <div class="status-treinos">
                <div class="progress-bar">
                    <div class="progress-fill" style="width:${percentual}%; background:${corBarra};"></div>
                </div>
                <p>${status.treinos_concluidos} de ${status.treinos_totais} treinos concluídos</p>
            </div>
            <div class="mensagem">
                <p>${status.mensagem || ''}</p>
                <p class="sugestao">${status.sugestao || ''}</p>
            </div>
            ${status.pode_avancar ? gerarAcoesHTML(status) : ''}
        </div>
    `;

    // Bind de botões (se existir acoes)
    if (status.pode_avancar) {
        const btnCompleto = container.querySelector('#btn-avancar-completo');
        const btnParcialBom = container.querySelector('#btn-avancar-parcial');
        const btnDomingo = container.querySelector('#btn-avancar-domingo');

        if (btnCompleto) btnCompleto.addEventListener('click', () => avancarSemana(usuarioId, container, false));
        if (btnParcialBom) btnParcialBom.addEventListener('click', () => avancarSemana(usuarioId, container, false));
        if (btnDomingo) btnDomingo.addEventListener('click', () => avancarSemana(usuarioId, container, true));
    }
}

function gerarAcoesHTML(status) {
    switch (status.tipo_avanco) {
        case 'completo':
            return `<div class="acoes"><button id="btn-avancar-completo" class="btn-primary">Avançar para Próxima Semana ✅</button></div>`;
        case 'parcial_bom':
            return `<div class="acoes"><button id="btn-avancar-parcial" class="btn-secondary">Avançar Semana (80% concluído)</button></div>`;
        case 'parcial_domingo':
            return `<div class="acoes"><div class="aviso-domingo">${status.sugestao}</div><button id="btn-avancar-domingo" class="btn-warning">Sim, quero avançar mesmo assim</button></div>`;
        default:
            return '';
    }
}

async function avancarSemana(usuarioId, container, forcar = false) {
    // Mostrar estado de loading
    const botones = container.querySelectorAll('button');
    botones.forEach(b => (b.disabled = true));

    try {
        const { data, error } = await supabase.rpc('fn_avancar_semana_usuario', {
            p_usuario_id: usuarioId,
            p_forcar_avanco: forcar,
        });

        if (error) throw error;

        const result = data[0];
        if (result?.sucesso) {
            showToast(result.mensagem || 'Semana avançada com sucesso', 'success');
            // Recarregar página para refletir nova semana
            window.location.reload();
        } else {
            showToast(result?.mensagem || 'Não foi possível avançar a semana', 'error');
        }
    } catch (err) {
        console.error('[progressaoSemana] Erro ao avançar semana:', err);
        showToast('Erro ao avançar semana', 'error');
    } finally {
        botones.forEach(b => (b.disabled = false));
    }
}

/**
 * Função pública para mostrar progressão da semana na home.
 * Cria container se não existir.
 */
export async function mostrarProgressaoSemana(usuarioId) {
    if (!usuarioId) return;

    let container = document.getElementById('progressao-semana-container');
    if (!container) {
        // Como fallback, adicionar no final do conteúdo principal
        const homeContent = document.querySelector('.home-content') || document.body;
        container = document.createElement('div');
        container.id = 'progressao-semana-container';
        homeContent.appendChild(container);
    }

    container.innerHTML = '<div class="progressao-card">Carregando informações...</div>';

    try {
        const { data, error } = await supabase.rpc('fn_analisar_progressao_semana', {
            p_usuario_id: usuarioId,
        });
        if (error) throw error;
        if (!Array.isArray(data) || data.length === 0) {
            container.innerHTML = '<div class="progressao-card">Nenhum dado de progressão disponível.</div>';
            return;
        }
        const status = data[0];
        renderCard(container, status, usuarioId);
    } catch (err) {
        console.error('[progressaoSemana] Erro ao carregar status:', err);
        container.innerHTML = '<div class="progressao-card">Erro ao carregar dados.</div>';
    }
}

// Para debug manual no console
window.mostrarProgressaoSemana = mostrarProgressaoSemana;
