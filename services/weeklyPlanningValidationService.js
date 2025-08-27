// services/weeklyPlanningValidationService.js
// Serviço para validação e regras do planejamento semanal

import AppState from '../state/appState.js';
import { showNotification } from '../ui/notifications.js';

const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

class WeeklyPlanningValidationService {
    
    /**
     * Verificar se um dia está no passado
     * @param {number} diaIndex - Índice do dia (0=domingo, 1=segunda...)
     * @returns {boolean}
     */
    static isDayInPast(diaIndex) {
        const hoje = new Date();
        const diaAtual = hoje.getDay(); // 0=domingo, 1=segunda...
        
        console.log('[isDayInPast] Verificando:', { diaIndex, diaAtual });
        
        // Se o dia já passou esta semana, é considerado passado
        return diaIndex < diaAtual;
    }
    
    /**
     * Verificar se um dia pode ser editado
     * @param {number} diaIndex - Índice do dia
     * @returns {object} Resultado da validação
     */
    static canEditDay(diaIndex) {
        const weekPlan = AppState.get('weekPlan') || {};
        const dayConfig = weekPlan[diaIndex];
        
        console.log('[canEditDay] Verificando dia:', { diaIndex, dayConfig, isPast: this.isDayInPast(diaIndex) });
        
        // Se dia já foi concluído, pode editar com aviso
        if (dayConfig?.concluido) {
            return {
                canEdit: true,
                warning: true,
                reason: 'completed',
                message: 'Treino já concluído. Alterações podem afetar o histórico.'
            };
        }
        
        // Se dia está no passado e não foi concluído, não pode editar
        if (this.isDayInPast(diaIndex) && dayConfig && !dayConfig.concluido) {
            return {
                canEdit: false,
                blocked: true,
                reason: 'past_day',
                message: 'Não é possível editar dias passados não concluídos.'
            };
        }
        
        // Verificar se há treinos anteriores pendentes
        const blockingInfo = this.checkForBlockingWorkouts(diaIndex);
        if (blockingInfo.isBlocked) {
            return {
                canEdit: false,
                blocked: true,
                reason: 'pending_workout',
                message: blockingInfo.message,
                blockingDay: blockingInfo.blockingDay
            };
        }
        
        // Dia pode ser editado normalmente
        return {
            canEdit: true,
            warning: false,
            reason: 'editable',
            message: null
        };
    }
    
    /**
     * Verificar se há treinos bloqueando a edição do dia
     * @param {number} diaIndex - Índice do dia
     * @returns {object} Informações sobre bloqueio
     */
    static checkForBlockingWorkouts(diaIndex) {
        const weekPlan = AppState.get('weekPlan') || {};
        
        // Verificar apenas dias anteriores na semana
        for (let dia = 0; dia < diaIndex; dia++) {
            const dayConfig = weekPlan[dia];
            
            // Se é um treino, não está concluído e não é um dia passado
            if (dayConfig && 
                dayConfig.categoria === 'treino' && 
                !dayConfig.concluido && 
                !this.isDayInPast(dia)) {
                
                return {
                    isBlocked: true,
                    blockingDay: dia,
                    blockingDayName: DIAS_SEMANA[dia],
                    message: `Treino de ${DIAS_SEMANA[dia]} deve ser concluído primeiro.`
                };
            }
        }
        
        return {
            isBlocked: false,
            blockingDay: null,
            message: null
        };
    }
    
    /**
     * Verificar se o plano semanal precisa ser ajustado (usando dados reais do banco)
     * @returns {Promise<object>} Resultado da verificação
     */
    static async validateWeeklyPlan() {
        try {
            const currentUser = AppState.get('currentUser');
            if (!currentUser?.id) {
                return { hasIssues: false, issues: [], suggestions: [], needsAttention: false };
            }

            // Importar serviços necessários
            const { query } = await import('./supabaseService.js');
            const WeeklyPlanService = await import('./weeklyPlanningService.js');
            
            const hoje = new Date();
            const diaAtual = hoje.getDay(); // 0=domingo, 1=segunda...
            const ano = hoje.getFullYear();

            console.log('[WeeklyPlanningValidation] Iniciando validação...', { currentUser: currentUser.id, ano, diaAtual });

            // CORREÇÃO CRÍTICA: Obter semana do protocolo ativo do usuário, não semana civil
            const { data: planoAtivo, error: erroPlano } = await query('usuario_plano_treino', {
                select: 'semana_atual, protocolo_treinamento_id',
                eq: { 
                    usuario_id: currentUser.id,
                    status: 'ativo'
                },
                limit: 1
            });

            if (erroPlano || !planoAtivo || planoAtivo.length === 0) {
                console.error('[WeeklyPlanningValidation] Nenhum plano ativo encontrado:', erroPlano);
                return { hasIssues: false, issues: [], suggestions: [], needsAttention: false };
            }

            const semana_treino = planoAtivo[0].semana_atual;
            console.log('[WeeklyPlanningValidation] Usando semana do protocolo ativo:', { semana_treino, protocolo_id: planoAtivo[0].protocolo_treinamento_id });

            // Buscar planejamento semanal real do banco usando semana_treino
            const { data: planejamentos, error } = await query('planejamento_semanal', {
                select: 'id, dia_semana, tipo_atividade, concluido, data_conclusao, ano, semana, semana_treino, usuario_id',
                eq: { 
                    usuario_id: currentUser.id,
                    ano: ano,
                    semana_treino: semana_treino
                }
            });

            if (error) {
                console.error('[WeeklyPlanningValidation] Erro ao buscar planejamentos:', error);
                return { hasIssues: false, issues: [], suggestions: [], needsAttention: false };
            }

            console.log('[WeeklyPlanningValidation] Planejamentos encontrados:', planejamentos?.length || 0);

            const issues = [];
            const suggestions = [];

            // Verificar cada dia da semana
            for (let dia = 0; dia < diaAtual; dia++) { // Só verificar dias que já passaram
                // Encontrar planejamento para este dia (dia_semana usa 1=domingo, 2=segunda...)  
                const diaDB = dia === 0 ? 7 : dia; // Converter: 0(dom)→7, 1(seg)→1, etc.
                const planejamentoDia = planejamentos?.find(p => p.dia_semana === diaDB);

                if (planejamentoDia && 
                    planejamentoDia.tipo_atividade && 
                    planejamentoDia.tipo_atividade !== 'folga' && 
                    planejamentoDia.tipo_atividade !== 'cardio' && 
                    !planejamentoDia.concluido) {
                    
                    console.log('[WeeklyPlanningValidation] Treino perdido encontrado:', {
                        dia: DIAS_SEMANA[dia],
                        tipo: planejamentoDia.tipo_atividade,
                        concluido: planejamentoDia.concluido
                    });

                    issues.push({
                        type: 'missed_workout',
                        day: dia,
                        dayName: DIAS_SEMANA[dia],
                        config: planejamentoDia,
                        message: `Treino de ${planejamentoDia.tipo_atividade} de ${DIAS_SEMANA[dia]} não foi concluído.`,
                        planejamentoId: planejamentoDia.id
                    });

                    // Sugerir realocação para dias futuros
                    const nextAvailableDay = await this.findNextAvailableDay(dia, planejamentos, diaAtual);
                    if (nextAvailableDay !== null) {
                        suggestions.push({
                            type: 'reallocate_workout',
                            fromDay: dia,
                            toDay: nextAvailableDay,
                            fromPlanejamentoId: planejamentoDia.id,
                            workoutType: planejamentoDia.tipo_atividade,
                            message: `Mover treino de ${planejamentoDia.tipo_atividade} de ${DIAS_SEMANA[dia]} para ${DIAS_SEMANA[nextAvailableDay]}`
                        });
                    }
                }
            }

            console.log('[WeeklyPlanningValidation] Resultado da validação:', {
                issues: issues.length,
                suggestions: suggestions.length,
                needsAttention: issues.length > 0
            });

            return {
                hasIssues: issues.length > 0,
                issues,
                suggestions,
                needsAttention: issues.some(issue => issue.type === 'missed_workout')
            };

        } catch (error) {
            console.error('[WeeklyPlanningValidation] Erro na validação:', error);
            return { hasIssues: false, issues: [], suggestions: [], needsAttention: false };
        }
    }
    
    /**
     * Encontrar próximo dia disponível para realocação
     * @param {number} missedDay - Dia perdido
     * @param {Array} planejamentos - Planejamentos da semana do banco
     * @param {number} diaAtual - Dia atual (0=domingo)
     * @returns {Promise<number|null>} Índice do próximo dia disponível
     */
    static async findNextAvailableDay(missedDay, planejamentos, diaAtual) {
        // Verificar dias futuros (do dia atual até o fim da semana)
        for (let dia = diaAtual; dia < 7; dia++) {
            // Converter para formato do banco (1=domingo, 2=segunda...)
            const diaDB = dia === 0 ? 7 : dia;
            const planejamentoDia = planejamentos?.find(p => p.dia_semana === diaDB);
            
            // Se não tem planejamento ou é folga/cardio, pode ser usado
            if (!planejamentoDia || 
                !planejamentoDia.tipo_atividade ||
                planejamentoDia.tipo_atividade === 'folga' || 
                planejamentoDia.tipo_atividade === 'cardio') {
                return dia;
            }
        }
        
        return null;
    }
    
    /**
     * Aplicar sugestão de realocação automaticamente
     * @param {object} suggestion - Sugestão de realocação
     * @returns {Promise<boolean>} Sucesso da operação
     */
    static async applySuggestion(suggestion) {
        if (suggestion.type !== 'reallocate_workout') {
            return false;
        }
        
        try {
            const currentUser = AppState.get('currentUser');
            
            if (!currentUser?.id) {
                throw new Error('Usuário não encontrado');
            }

            console.log('[WeeklyPlanningValidation] Aplicando sugestão:', suggestion);
            
            // Importar serviços necessários
            const { query, update } = await import('./supabaseService.js');
            
            const ano = new Date().getFullYear();

            // CORREÇÃO: Obter semana do protocolo ativo, não semana civil
            const { data: planoAtivo, error: erroPlano } = await query('usuario_plano_treino', {
                select: 'semana_atual',
                eq: { 
                    usuario_id: currentUser.id,
                    status: 'ativo'
                },
                limit: 1
            });

            if (erroPlano || !planoAtivo || planoAtivo.length === 0) {
                throw new Error('Nenhum plano ativo encontrado');
            }

            const semana_treino = planoAtivo[0].semana_atual;
            
            // Converter dia de destino para formato do banco
            const novoDiaDB = suggestion.toDay === 0 ? 7 : suggestion.toDay;
            
            // 1. Atualizar o dia de destino com o treino perdido
            const updateResult = await update('planejamento_semanal', {
                tipo_atividade: suggestion.workoutType,
                concluido: false,
                data_conclusao: null
            }, {
                usuario_id: currentUser.id,
                ano: ano,
                semana_treino: semana_treino,
                dia_semana: novoDiaDB
            });

            if (updateResult.error) {
                // Se não existe registro para o dia de destino, criar um novo
                const { insert } = await import('./supabaseService.js');
                const insertResult = await insert('planejamento_semanal', {
                    usuario_id: currentUser.id,
                    ano: ano,
                    semana_treino: semana_treino,
                    dia_semana: novoDiaDB,
                    tipo_atividade: suggestion.workoutType,
                    concluido: false
                });

                if (insertResult.error) {
                    throw new Error('Falha ao criar planejamento para o novo dia');
                }
            }

            // 2. Marcar o dia original como folga
            const diaOriginalDB = suggestion.fromDay === 0 ? 7 : suggestion.fromDay;
            await update('planejamento_semanal', {
                tipo_atividade: 'folga',
                concluido: false,
                data_conclusao: null
            }, {
                usuario_id: currentUser.id,
                ano: ano,
                semana_treino: semana_treino,
                dia_semana: diaOriginalDB
            });

            // 3. Limpar cache local para forçar recarregamento
            AppState.set('weekPlan', null);
            
            showNotification(
                `Treino de ${suggestion.workoutType} realocado de ${DIAS_SEMANA[suggestion.fromDay]} para ${DIAS_SEMANA[suggestion.toDay]}`,
                'success'
            );
            
            console.log('[WeeklyPlanningValidation] Sugestão aplicada com sucesso');
            return true;
            
        } catch (error) {
            console.error('[WeeklyPlanningValidation] Erro ao aplicar sugestão:', error);
            showNotification('Erro ao realocar treino: ' + error.message, 'error');
            return false;
        }
    }
    
    /**
     * Mostrar modal com sugestões de ajuste do plano
     * @param {object} validationResult - Resultado da validação
     */
    static showPlanAdjustmentModal(validationResult) {
        if (!validationResult.hasIssues) {
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'plan-adjustment-modal-overlay';
        modal.innerHTML = `
            <div class="plan-adjustment-modal">
                <div class="modal-header">
                    <h3>⚠️ Ajuste do Plano Semanal</h3>
                    <button class="close-btn" type="button">&times;</button>
                </div>
                
                <div class="modal-body">
                    <div class="issues-section">
                        <h4>Problemas Identificados:</h4>
                        <ul class="issues-list">
                            ${validationResult.issues.map(issue => `
                                <li class="issue-item">
                                    <span class="issue-icon">❌</span>
                                    <span class="issue-text">${issue.message}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                    
                    ${validationResult.suggestions.length > 0 ? `
                        <div class="suggestions-section">
                            <h4>Sugestões de Ajuste:</h4>
                            <div class="suggestions-list">
                                ${validationResult.suggestions.map((suggestion, index) => `
                                    <div class="suggestion-item" data-suggestion-index="${index}">
                                        <span class="suggestion-icon">💡</span>
                                        <span class="suggestion-text">${suggestion.message}</span>
                                        <button class="apply-suggestion-btn" data-suggestion-index="${index}">
                                            Aplicar
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <div class="modal-footer">
                    <button class="btn-secondary dismiss-btn">Ignorar</button>
                    <button class="btn-primary auto-adjust-btn">Ajustar Automaticamente</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners
        const closeBtn = modal.querySelector('.close-btn');
        const dismissBtn = modal.querySelector('.dismiss-btn');
        const autoAdjustBtn = modal.querySelector('.auto-adjust-btn');
        const applySuggestionBtns = modal.querySelectorAll('.apply-suggestion-btn');
        
        const closeModal = () => {
            document.body.removeChild(modal);
        };
        
        closeBtn.addEventListener('click', closeModal);
        dismissBtn.addEventListener('click', closeModal);
        
        // Aplicar ajuste automático
        autoAdjustBtn.addEventListener('click', async () => {
            autoAdjustBtn.disabled = true;
            autoAdjustBtn.textContent = 'Ajustando...';
            
            let successCount = 0;
            for (const suggestion of validationResult.suggestions) {
                const success = await this.applySuggestion(suggestion);
                if (success) successCount++;
            }
            
            if (successCount > 0) {
                showNotification(`${successCount} ajuste(s) aplicado(s) com sucesso`, 'success');
                closeModal();
                
                // Recarregar planejamento se necessário
                if (window.carregarPlanejamentoSemanal) {
                    setTimeout(() => window.carregarPlanejamentoSemanal(), 500);
                }
            } else {
                showNotification('Não foi possível aplicar os ajustes', 'error');
                autoAdjustBtn.disabled = false;
                autoAdjustBtn.textContent = 'Ajustar Automaticamente';
            }
        });
        
        // Aplicar sugestões individuais
        applySuggestionBtns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const index = parseInt(e.target.dataset.suggestionIndex);
                const suggestion = validationResult.suggestions[index];
                
                btn.disabled = true;
                btn.textContent = 'Aplicando...';
                
                const success = await this.applySuggestion(suggestion);
                if (success) {
                    e.target.textContent = '✓ Aplicado';
                    e.target.classList.add('applied');
                } else {
                    btn.disabled = false;
                    btn.textContent = 'Aplicar';
                }
            });
        });
        
        // Fechar ao clicar fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
    
    /**
     * Verificar e mostrar alertas de validação automaticamente
     */
    static async checkAndShowValidationAlerts() {
        const validationResult = this.validateWeeklyPlan();
        
        if (validationResult.needsAttention) {
            // Esperar um pouco para não conflitar com outras modais
            setTimeout(() => {
                this.showPlanAdjustmentModal(validationResult);
            }, 1000);
        }
        
        return validationResult;
    }
}

export default WeeklyPlanningValidationService;

// Disponibilizar globalmente
window.WeeklyPlanningValidationService = WeeklyPlanningValidationService;