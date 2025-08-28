// components/disposicaoInicioModal.js
// Modal simples com escala Likert 1-5 para registrar a disposição do usuário antes do treino

import WeeklyPlanService from '../services/weeklyPlanningService.js';
import { supabase } from '../services/supabaseService.js';
import AppState from '../state/appState.js';

export default class DisposicaoInicioModal {
  // Exibe o modal e resolve a Promise com o valor (1-5) escolhido ou null se o usuário fechar
  static solicitar() {
    return new Promise((resolve) => {
      // Se já existe modal aberto, remove
      const existing = document.getElementById('modal-disposicao-inicio');
      if (existing) {
        existing.remove();
      }

      const html = `
                <div id="modal-disposicao-inicio" class="modal-disposicao-overlay">
                    <div class="modal-disposicao-content" onclick="event.stopPropagation()">
                        <div class="modal-disposicao-header">
                            <h2>Qual seu nível de energia? ⚡</h2>
                            <p>Escolha de 1 (sem energia) a 5 (energia máxima)</p>
                        </div>
                        <div class="escala-disposicao" id="escala-disposicao-inicio">
                            ${Array.from({ length: 5 })
                              .map((_, i) => {
                                const v = i + 1;
                                return `<button class="disposicao-option" data-value="${v}">
                                    <span class="disposicao-value">${v}</span>
                                </button>`;
                              })
                              .join('')}
                        </div>
                        <button id="btn-disposicao-confirmar" class="btn-disposicao-confirmar" disabled>
                            Confirmar 🎉
                        </button>
                    </div>
                </div>`;

      try {
        // Usar estratégia unificada de inserção no body
        document.body.insertAdjacentHTML('beforeend', html);
      } catch (insertError) {
        console.error('[DisposicaoInicioModal] Erro ao inserir HTML:', insertError);
        resolve(null);
        return;
      }

      // Verificar se modal foi criado
      const modal = document.getElementById('modal-disposicao-inicio');

      if (!modal) {
        console.error('[DisposicaoInicioModal] Modal não foi criado no DOM');
        resolve(null);
        return;
      }

      const confirmBtn = document.getElementById('btn-disposicao-confirmar');

      // Event listeners
      modal.addEventListener('click', () => {
        modal.remove();
        resolve(null);
      });

      modal.querySelectorAll('.disposicao-option').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();

          // Remove seleção de todos os botões
          modal.querySelectorAll('.disposicao-option').forEach((b) => {
            b.classList.remove('selected');
          });

          // Adiciona seleção ao botão clicado
          btn.classList.add('selected');

          const confirmarBtn = document.getElementById('btn-disposicao-confirmar');
          if (confirmarBtn) {
            confirmarBtn.disabled = false;
          }
        });
      });

      if (confirmBtn) {
        confirmBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const selectedBtn = modal.querySelector('.disposicao-option.selected');
          if (selectedBtn) {
            const valorSelecionado = parseInt(selectedBtn.dataset.value);
            modal.remove();
            resolve(valorSelecionado);
          }
        });
      } else {
        console.error('[DisposicaoInicioModal] Botão confirmar não encontrado');
      }
    });
  }

  // Persiste o valor na tabela planejamento_semanal para o dia atual
  // Pode ser chamado externamente, mas também existe em WorkoutExecutionManager
  static async salvarValor(userId, valor) {
    if (!valor) return { success: false, error: 'valor vazio' };
    try {
      const today = new Date();
      const { ano, semana } = WeeklyPlanService.getCurrentWeek();
      const diaSemana = WeeklyPlanService.dayToDb(today.getDay());

      const { error } = await supabase
        .from('planejamento_semanal')
        .update({ pre_workout: valor })
        .eq('usuario_id', userId)
        .eq('ano', ano)
        .eq('semana', semana)
        .eq('dia_semana', diaSemana);
      if (error) {
        console.error('[DisposicaoInicioModal] Erro ao salvar disposição:', error);
        return { success: false, error };
      }
      console.log('[DisposicaoInicioModal] Disposição início salva com sucesso');
      return { success: true };
    } catch (err) {
      console.error('[DisposicaoInicioModal] Exceção ao salvar disposição:', err);
      return { success: false, error: err };
    }
  }

  /**
   * Verifica se a disposição já foi coletada hoje (SEMPRE consulta backend)
   * @param {number} userId - ID do usuário
   * @returns {Promise<boolean>} true se já foi coletada, false caso contrário
   */
  static async verificarSeJaColetouHoje(userId) {
    try {
      const hoje = new Date();
      const { ano, semana } = WeeklyPlanService.getCurrentWeek();
      const diaSemana = WeeklyPlanService.dayToDb(hoje.getDay());

      const { data, error } = await supabase
        .from('planejamento_semanal')
        .select('pre_workout')
        .eq('usuario_id', userId)
        .eq('ano', ano)
        .eq('semana', semana)
        .eq('dia_semana', diaSemana)
        .maybeSingle();

      if (error) {
        console.error('[DisposicaoInicioModal] Erro na consulta:', error);
        return false;
      }

      if (!data) {
        return false;
      }

      const valorPreWorkout = data.pre_workout;
      const jaColetou = valorPreWorkout !== null && valorPreWorkout !== undefined;

      // Se coletou, salvar no AppState para usar na avaliação final
      if (jaColetou) {
        AppState.set('energiaPreTreino', valorPreWorkout);
      }

      return jaColetou;
    } catch (error) {
      console.error('[DisposicaoInicioModal] Exceção ao verificar disposição:', error);
      return false;
    }
  }
}
