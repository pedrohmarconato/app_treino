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

// Função utilitária para garantir tipo_atividade válido
function mapTipoAtividade(tipo) {
  if (!tipo) return 'treino';
  const t = tipo.trim().toLowerCase();
  if (t === 'cardio') return 'cardio';
  if (t === 'folga') return 'folga';
  return 'treino';
}

// Função para salvar a ordem dos dias na semana usando apenas dia_semana
import { update } from '../services/supabaseService.js';

export async function salvarOrdemSemana(usuarioId, ano, semana, novaOrdemArray) {
  // novaOrdemArray: [{ dia_semana: 1, tipo, grupo, ... }, ...]
  // 1. Verificar se já existem registros para o usuário/ano/semana
  const { data: existentes } = await query('planejamento_semanal', {
    eq: { usuario_id: usuarioId, ano, semana }
  });

  if (!existentes || existentes.length === 0) {
    // 2. Não existem registros: fazer INSERT para cada dia
    // Buscar dados complementares na d_calendario para esta semana
    const { data: calendarioSemana } = await query('d_calendario', {
      eq: { ano, semana_ano: semana }
    });
    if (!calendarioSemana || calendarioSemana.length === 0) {
      throw new Error('Semana não encontrada no calendário.');
    }
    // Montar os inserts
    const registros = novaOrdemArray.map((item, idx) => {
      const dia_semana = idx + 1;
      const infoDia = calendarioSemana.find(c => c.dia_semana === dia_semana);
      // Garantir que tipo_atividade é válido
      // Usar função utilitária para garantir valor válido
      const tipo_atividade = mapTipoAtividade(item.tipo);
      return {
        usuario_id: usuarioId,
        ano,
        semana,
        dia_semana,
        tipo_atividade,
        grupo_muscular: item.grupo || (tipo_atividade === 'cardio' ? 'Cardio' : tipo_atividade === 'folga' ? 'Folga' : null),
        numero_treino: item.numero_treino || null,
        concluido: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        calendario_id: infoDia ? infoDia.id : null,
        semana_treino: infoDia ? infoDia.semana_treino : null,
        eh_programado: true,
        data_programacao: new Date().toISOString(),
        usuario_que_programou: usuarioId
      };
    });
    await insert('planejamento_semanal', registros);
  } else {
    // 3. Já existem registros: fazer UPDATE da ordem
    for (let idx = 0; idx < novaOrdemArray.length; idx++) {
      const item = novaOrdemArray[idx];
      const novoDiaSemana = idx + 1; // 1-7
      if (item.dia_semana !== novoDiaSemana) {
        await update('planejamento_semanal',
          { dia_semana: novoDiaSemana },
          {
            eq: {
              usuario_id: usuarioId,
              ano,
              semana,
              dia_semana: item.dia_semana
            }
          }
        );
      }
    }
  }
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

