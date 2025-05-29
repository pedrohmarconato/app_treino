// OrderWeekPage.js

// Função para mostrar ordem da semana para um usuário específico
export function mostrarOrdemSemana(usuarioId) {
    // Verificar se há usuário logado
    if (!usuarioId) {
        console.log('[mostrarOrdemSemana] Nenhum usuário logado');
        return;
    }
    // Aqui você pode adicionar a lógica para buscar e exibir a ordem da semana do usuário
    // Por exemplo, chamar renderOrderWeekPage ou outra função que injete o template na tela
    if (typeof window.renderOrderWeekPage === 'function') {
        window.renderOrderWeekPage('order-week-page', usuarioId);
    } else {
        console.warn('[mostrarOrdemSemana] Função renderOrderWeekPage não encontrada');
    }
}
// Página para reordenar e editar o plano semanal de treinos com drag-and-drop

// OrderWeekPage.js - Template HTML para a página de ordenação da semana.
// A lógica de interatividade (drag-and-drop, state) será gerenciada em app.js na função renderOrderWeekPage.

const DIAS_SEMANA_ORDEM = [
  'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'
];
const GRUPOS_ORDEM = ['A', 'B', 'C', 'D'];
const TIPOS_ORDEM = ['Treino', 'Cardio', 'Folga'];

// Esta função agora retorna uma string HTML para ser injetada no DOM.
// Os IDs e classes são usados pela função renderOrderWeekPage em app.js para adicionar interatividade.
export default function OrderWeekPageTemplate(semanaAtual) {
  return `
    <div class="order-week-page" id="order-week-container">
      <h2>Organizar Semana de Treinos</h2>
      <ul class="semana-list" id="semana-list-ul">
        ${semanaAtual.map((item, idx) => `
          <li
            id="dia-item-${idx}"
            draggable="true"
            data-index="${idx}"
          >
            <span class="dia-label">${item.dia}</span>
            <select class="tipo-select" data-index="${idx}">
              ${TIPOS_ORDEM.map(tipo => `<option value="${tipo}" ${item.tipo === tipo ? 'selected' : ''}>${tipo}</option>`).join('')}
            </select>
            ${item.tipo === 'Treino' ? `
              <select class="grupo-select" data-index="${idx}">
                ${GRUPOS_ORDEM.map(grupo => `<option value="${grupo}" ${item.grupo === grupo ? 'selected' : ''}>${grupo}</option>`).join('')}
              </select>
            ` : '<span class="grupo-placeholder"></span>'}
            <span class="drag-handle">☰</span>
          </li>
        `).join('')}
      </ul>
      <button class="btn-primary" id="salvar-ordem-semana">Salvar Ordem</button>
    </div>
  `;
}

// Estilos podem ser exportados separadamente se necessário, ou mantidos em styles.css
export const orderWeekStyles = `
  .order-week-page {
    padding: 20px;
    background-color: var(--bg-primary);
    color: var(--text-primary);
  }
  .semana-list {
    list-style: none;
    padding: 0;
  }
  .semana-list li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px;
    margin-bottom: 8px;
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    cursor: grab;
  }
  .semana-list li.dragging {
    opacity: 0.5;
    background: var(--primary-color-light);
  }
  .dia-label {
    font-weight: bold;
    flex-grow: 1;
  }
  .semana-list select {
    margin-left: 10px;
    padding: 5px;
    border-radius: var(--radius-sm);
    background: var(--bg-primary);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
  }
  .drag-handle {
    margin-left: 15px;
    cursor: grab;
    font-size: 1.2em;
  }
  .grupo-placeholder {
    display: inline-block;
    width: 70px; /* Aproximadamente a largura de um select de grupo */
    margin-left: 10px;
  }
`;


// CSS básico para drag-and-drop e layout

