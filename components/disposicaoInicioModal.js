// components/disposicaoInicioModal.js
// Modal simples com escala Likert 1-5 para registrar a disposição do usuário antes do treino

import WeeklyPlanService from '../services/weeklyPlanningService.js';
import { supabase } from '../services/supabaseService.js';
import { toSaoPauloISOString } from '../utils/timezoneUtils.js';

export default class DisposicaoInicioModal {
    // Exibe o modal e resolve a Promise com o valor (1-5) escolhido ou null se o usuário fechar
    static solicitar() {
        console.log('[DisposicaoInicioModal] SOLICITAR CHAMADO! Modal deve aparecer agora...');
        return new Promise(resolve => {
            // Se já existe modal aberto, remove
            const existing = document.getElementById('modal-disposicao-inicio');
            if (existing) {
                console.log('[DisposicaoInicioModal] Removendo modal existente');
                existing.remove();
            }

            const html = `
                <div id="modal-disposicao-inicio" class="modal-overlay clean-modal" style="backdrop-filter: blur(4px); z-index: 9999 !important; display: flex !important;" >
                    <div class="modal-content clean-modal-content" onclick="event.stopPropagation()">
                        <h2>Como você se sente agora?</h2>
                        <p>De 1 (muito cansado) a 5 (cheio de energia)</p>
                        <div class="escala-likert" id="escala-disposicao-inicio">
                            ${Array.from({ length: 5 }).map((_, i) => {
                                const v = i + 1;
                                return `<button class="likert-option" data-value="${v}">${v}</button>`;
                            }).join('')}
                        </div>
                        <button id="btn-disposicao-confirmar" class="btn-primary" disabled>Confirmar</button>
                    </div>
                </div>`;

            console.log('[DisposicaoInicioModal] Inserindo HTML no DOM...');
            document.body.insertAdjacentHTML('beforeend', html);

            const modal = document.getElementById('modal-disposicao-inicio');
            console.log('[DisposicaoInicioModal] Modal encontrado no DOM:', !!modal);
            
            if (modal) {
                console.log('[DisposicaoInicioModal] Estilo do modal:', window.getComputedStyle(modal).display);
                console.log('[DisposicaoInicioModal] Z-index do modal:', window.getComputedStyle(modal).zIndex);
            }
            
            const confirmBtn = document.getElementById('btn-disposicao-confirmar');
            let valorSelecionado = null;

            modal.addEventListener('click', () => {
                // Clicar fora fecha sem valor
                modal.remove();
                resolve(null);
            });

            modal.querySelectorAll('.likert-option').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    modal.querySelectorAll('.likert-option').forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                    valorSelecionado = parseInt(btn.dataset.value);
                    confirmBtn.disabled = false;
                });
            });

            confirmBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                modal.remove();
                resolve(valorSelecionado);
            });
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
                .update({ disposicao_inicio: valor, data_disposicao_inicio: toSaoPauloISOString(today) })
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
}

// Função global para teste direto do modal
window.testarModalDisposicao = async function() {
    console.log('[DEBUG] 🧪 Testando modal de disposição diretamente...');
    try {
        const result = await DisposicaoInicioModal.solicitar();
        console.log('[DEBUG] ✅ Modal retornou:', result);
        return result;
    } catch (error) {
        console.error('[DEBUG] ❌ Erro no modal:', error);
        return null;
    }
};
