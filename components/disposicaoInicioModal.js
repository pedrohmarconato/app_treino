// components/disposicaoInicioModal.js
// Modal simples com escala Likert 1-5 para registrar a disposição do usuário antes do treino

import WeeklyPlanService from '../services/weeklyPlanningService.js';
import { supabase } from '../services/supabaseService.js';
import { toSaoPauloISOString } from '../utils/timezoneUtils.js';

export default class DisposicaoInicioModal {
    // Exibe o modal e resolve a Promise com o valor (1-5) escolhido ou null se o usuário fechar
    static solicitar() {
        console.log('[DEBUG] 🚀 ==> INICIANDO SOLICITAÇÃO DO MODAL <==');
        console.log('[DEBUG] 📍 Localização atual:', window.location.href);
        console.log('[DEBUG] 📍 Document ready state:', document.readyState);
        console.log('[DEBUG] 📍 Body existe:', !!document.body);
        
        return new Promise(resolve => {
            // Se já existe modal aberto, remove
            const existing = document.getElementById('modal-disposicao-inicio');
            if (existing) {
                console.log('[DEBUG] 🗑️ Modal existente encontrado, removendo...');
                existing.remove();
                console.log('[DEBUG] ✅ Modal anterior removido');
            } else {
                console.log('[DEBUG] ✅ Nenhum modal anterior encontrado');
            }

            const html = `
                <div id="modal-disposicao-inicio" class="modal-disposicao-overlay">
                    <div class="modal-disposicao-content" onclick="event.stopPropagation()">
                        <div class="modal-disposicao-header">
                            <h2>Qual seu nível de energia? ⚡</h2>
                            <p>Escolha de 1 (sem energia) a 5 (energia máxima)</p>
                        </div>
                        <div class="escala-disposicao" id="escala-disposicao-inicio">
                            ${Array.from({ length: 5 }).map((_, i) => {
                                const v = i + 1;
                                return `<button class="disposicao-option" data-value="${v}">
                                    <span class="disposicao-value">${v}</span>
                                </button>`;
                            }).join('')}
                        </div>
                        <button id="btn-disposicao-confirmar" class="btn-disposicao-confirmar" disabled>
                            Confirmar 🎉
                        </button>
                    </div>
                </div>`;

            console.log('[DEBUG] 📝 HTML criado, tamanho:', html.length, 'caracteres');
            console.log('[DEBUG] 📝 Inserindo no document.body...');
            
            try {
                document.body.insertAdjacentHTML('beforeend', html);
                console.log('[DEBUG] ✅ HTML inserido com sucesso');
            } catch (insertError) {
                console.error('[DEBUG] ❌ ERRO ao inserir HTML:', insertError);
                resolve(null);
                return;
            }

            // Verificar se modal foi criado
            const modal = document.getElementById('modal-disposicao-inicio');
            console.log('[DEBUG] 🔍 Modal encontrado após inserção:', !!modal);
            
            if (!modal) {
                console.error('[DEBUG] ❌ MODAL NÃO ENCONTRADO NO DOM!');
                resolve(null);
                return;
            }
            
            console.log('[DEBUG] 📏 Dimensões do modal:', {
                offsetWidth: modal.offsetWidth,
                offsetHeight: modal.offsetHeight,
                clientWidth: modal.clientWidth,
                clientHeight: modal.clientHeight
            });
            
            const computedStyle = window.getComputedStyle(modal);
            console.log('[DEBUG] 🎨 Estilos computados:', {
                display: computedStyle.display,
                visibility: computedStyle.visibility,
                opacity: computedStyle.opacity,
                zIndex: computedStyle.zIndex,
                position: computedStyle.position,
                top: computedStyle.top,
                left: computedStyle.left
            });
            
            console.log('[DEBUG] 📍 Posição no DOM:', {
                parentElement: modal.parentElement?.tagName,
                nextSibling: modal.nextSibling?.tagName || 'nenhum',
                previousSibling: modal.previousSibling?.tagName || 'nenhum'
            });
            
            // Forçar visibilidade
            modal.style.display = 'flex';
            modal.style.visibility = 'visible';
            modal.style.opacity = '1';
            modal.style.zIndex = '999999';
            
            console.log('[DEBUG] 🔧 Estilos forçados aplicados');
            
            const confirmBtn = document.getElementById('btn-disposicao-confirmar');
            console.log('[DEBUG] 🔍 Botão confirmar encontrado:', !!confirmBtn);
            
            let valorSelecionado = null;

            modal.addEventListener('click', () => {
                console.log('[DEBUG] 🖱️ Click no modal (backdrop)');
                // Clicar fora fecha sem valor
                modal.remove();
                console.log('[DEBUG] 🚪 Modal fechado sem valor');
                resolve(null);
            });

            modal.querySelectorAll('.disposicao-option').forEach((btn, index) => {
                console.log('[DEBUG] 🔘 Configurando listener para botão', index + 1);
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    console.log('[DEBUG] 🎯 Botão clicado:', btn.dataset.value);
                    
                    // Remove seleção de todos os botões
                    modal.querySelectorAll('.disposicao-option').forEach(b => {
                        b.classList.remove('selected');
                    });
                    
                    // Adiciona seleção ao botão clicado
                    btn.classList.add('selected');
                    
                    const confirmarBtn = document.getElementById('btn-disposicao-confirmar');
                    if (confirmarBtn) {
                        confirmarBtn.disabled = false;
                        console.log('[DEBUG] ✅ Botão confirmar habilitado');
                    }
                });
            });

            if (confirmBtn) {
                console.log('[DEBUG] ✅ Configurando listener do botão confirmar');
                confirmBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const selectedBtn = modal.querySelector('.disposicao-option.selected');
                    if (selectedBtn) {
                        const valorSelecionado = parseInt(selectedBtn.dataset.value);
                        console.log('[DEBUG] 🎯 Botão confirmar clicado com valor:', valorSelecionado);
                        modal.remove();
                        console.log('[DEBUG] 🚪 Modal fechado com valor:', valorSelecionado);
                        resolve(valorSelecionado);
                    }
                });
            } else {
                console.error('[DEBUG] ❌ BOTÃO CONFIRMAR NÃO ENCONTRADO!');
            }
            
            console.log('[DEBUG] ✅ Modal configurado e pronto para uso');
            
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

// Função para teste e diagnóstico - função global
window.testarModalDisposicao = () => {
    console.log('[TESTE] 🧪 ==> INICIANDO TESTE DO MODAL <==');
    DisposicaoInicioModal.solicitar().then(valor => {
        console.log('[TESTE] ✅ Modal retornou:', valor);
    }).catch(erro => {
        console.error('[TESTE] ❌ Erro no modal:', erro);
    });
};

// Função de diagnóstico completo
window.diagnosticarModalCompleto = () => {
    console.log('[DIAGNÓSTICO] 🔍 ==> DIAGNÓSTICO COMPLETO <==');
    
    // Verificar elementos existentes
    const modalsExistentes = document.querySelectorAll('.modal-overlay');
    console.log('[DIAGNÓSTICO] 📊 Modais existentes:', modalsExistentes.length);
    
    // Verificar viewport
    console.log('[DIAGNÓSTICO] 📐 Viewport:', {
        width: window.innerWidth,
        height: window.innerHeight,
        scrollX: window.scrollX,
        scrollY: window.scrollY
    });
    
    // Verificar body
    console.log('[DIAGNÓSTICO] 🏠 Body:', {
        children: document.body.children.length,
        overflow: window.getComputedStyle(document.body).overflow,
        position: window.getComputedStyle(document.body).position
    });
};
