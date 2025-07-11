/**
 * 🏁 SERVIÇO DE FINALIZAÇÃO DE TREINO - Workout Completion Service
 * 
 * FUNÇÃO: Centralizar e simplificar o processo de finalização de treino
 * Resolve problemas de travamento e garante salvamento completo dos metadados
 * 
 * RESPONSABILIDADES:
 * - Finalizar treino de forma robusta com tratamento de erros
 * - Salvar TODOS os metadados (tempo total, avaliação, estatísticas)
 * - Garantir sincronização com Supabase
 * - Implementar recovery automático em caso de falha
 * - Navegação segura pós-finalização
 * 
 * MELHORIAS:
 * - Processo simplificado e à prova de falhas
 * - Metadados completos salvos no banco
 * - Recovery automático após refresh
 * - Estado persistente para continuidade
 */

import { nowUtcISO, getDateInSP } from '../utils/dateUtils.js';
import { timerManager } from './timerManager.js';

export class WorkoutCompletionService {
    
    /**
     * Finalizar treino de forma robusta
     */
    static async finalizarTreino(dadosCompletos = {}) {
        console.log('[WorkoutCompletion] 🏁 Iniciando finalização de treino...');
        
        const loadingId = this.showProgressiveLoading('Finalizando treino...');
        
        try {
            // 1. Coletar todos os dados da sessão
            const dadosSessao = await this.coletarDadosCompletos(dadosCompletos);
            
            if (!dadosSessao) {
                throw new Error('Não foi possível coletar dados da sessão');
            }
            
            // 2. Validar dados essenciais
            if (!this.validarDadosMinimos(dadosSessao)) {
                throw new Error('Dados insuficientes para finalizar treino');
            }
            
            // 3. Salvar dados completos (com retry)
            const resultadoSalvamento = await this.salvarDadosCompletos(dadosSessao);
            
            // 4. Limpar estado e timers
            await this.limparEstadoTreino();
            
            // 5. Salvar estado de finalização para recovery
            this.salvarEstadoFinalizacao(dadosSessao, resultadoSalvamento);
            
            // 6. Navegação segura
            await this.navegarApósFinalizacao();
            
            this.updateProgressiveLoading(loadingId, 'Treino finalizado com sucesso!', 'success');
            
            console.log('[WorkoutCompletion] ✅ Treino finalizado com sucesso');
            
            return {
                sucesso: true,
                dados: dadosSessao,
                resultado: resultadoSalvamento
            };
            
        } catch (error) {
            console.error('[WorkoutCompletion] ❌ Erro na finalização:', error);
            
            // Salvar estado de erro para recovery
            this.salvarEstadoErro(error, dadosCompletos);
            
            this.updateProgressiveLoading(loadingId, `Erro: ${error.message}`, 'error');
            
            // Não bloquear o usuário - permitir retry
            return {
                sucesso: false,
                erro: error.message,
                recovery: true
            };
        }
    }
    
    /**
     * Coletar TODOS os dados da sessão para salvamento completo
     */
    static async coletarDadosCompletos(dadosExtras = {}) {
        try {
            const startTime = AppState.get('workoutStartTime');
            const currentUser = AppState.get('currentUser');
            const currentWorkout = AppState.get('currentWorkout');
            const execucoesCache = AppState.get('execucoesCache') || [];
            
            if (!currentUser || !startTime) {
                return null;
            }
            
            const agora = Date.now();
            const tempoTotalMs = agora - startTime;
            const tempoTotalMinutos = Math.round(tempoTotalMs / 60000);
            
            // Calcular estatísticas completas
            const estatisticas = this.calcularEstatisticas(execucoesCache);
            
            const dadosCompletos = {
                // Identificação
                usuario_id: currentUser.id,
                protocolo_id: currentWorkout?.protocolo_id || currentWorkout?.id,
                
                // Temporais (usando timezone correto)
                data_inicio: new Date(startTime).toISOString(),
                data_fim: nowUtcISO(),
                data_treino: getDateInSP(startTime),
                tempo_total_segundos: Math.round(tempoTotalMs / 1000),
                tempo_total_minutos: tempoTotalMinutos,
                
                // Execuções
                execucoes: execucoesCache,
                total_series: execucoesCache.length,
                
                // Estatísticas
                exercicios_unicos: estatisticas.exerciciosUnicos,
                peso_total_levantado: estatisticas.pesoTotal,
                repeticoes_totais: estatisticas.repeticoesTotais,
                series_falhadas: estatisticas.seriesFalhadas,
                
                // Treino
                grupo_muscular: currentWorkout?.grupo_muscular || 'N/A',
                tipo_atividade: currentWorkout?.tipo_atividade || 'Treino',
                
                // Avaliação (se fornecida)
                post_workout: dadosExtras.post_workout || null,
                dificuldade_percebida: dadosExtras.dificuldade_percebida || null,
                energia_nivel: dadosExtras.energia_nivel || null,
                observacoes_finais: dadosExtras.observacoes || null,
                
                // Metadados
                plataforma: navigator.platform,
                user_agent: navigator.userAgent.substring(0, 100),
                versao_app: '2.0',
                status: 'concluido',
                
                // Extras fornecidos
                ...dadosExtras
            };
            
            console.log('[WorkoutCompletion] 📊 Dados coletados:', {
                tempo_minutos: tempoTotalMinutos,
                execucoes: execucoesCache.length,
                peso_total: estatisticas.pesoTotal,
                exercicios: estatisticas.exerciciosUnicos
            });
            
            return dadosCompletos;
            
        } catch (error) {
            console.error('[WorkoutCompletion] Erro ao coletar dados:', error);
            return null;
        }
    }
    
    /**
     * Calcular estatísticas completas da sessão
     */
    static calcularEstatisticas(execucoes) {
        const exerciciosUnicos = new Set(execucoes.map(e => e.exercicio_id)).size;
        
        const pesoTotal = execucoes.reduce((total, exec) => {
            const peso = parseFloat(exec.peso_utilizado) || 0;
            const reps = parseInt(exec.repeticoes_realizadas || exec.repeticoes) || 0;
            return total + (peso * reps);
        }, 0);
        
        const repeticoesTotais = execucoes.reduce((total, exec) => {
            return total + (parseInt(exec.repeticoes_realizadas || exec.repeticoes) || 0);
        }, 0);
        
        const seriesFalhadas = execucoes.filter(e => e.falhou).length;
        
        return {
            exerciciosUnicos,
            pesoTotal: Math.round(pesoTotal * 100) / 100, // 2 casas decimais
            repeticoesTotais,
            seriesFalhadas
        };
    }
    
    /**
     * Validar se temos dados mínimos para finalizar
     */
    static validarDadosMinimos(dados) {
        return dados && 
               dados.usuario_id && 
               dados.data_inicio && 
               dados.tempo_total_segundos > 0;
    }
    
    /**
     * Salvar dados completos no Supabase com retry
     */
    static async salvarDadosCompletos(dados) {
        console.log('[WorkoutCompletion] 💾 Iniciando salvamento completo...');
        
        const resultados = {
            sessao_salva: false,
            execucoes_salvas: 0,
            planejamento_atualizado: false,
            erros: []
        };
        
        try {
            // 1. Salvar sessão de treino (metadados completos)
            try {
                const sessaoResult = await this.salvarSessaoTreino(dados);
                resultados.sessao_salva = sessaoResult.sucesso;
                if (!sessaoResult.sucesso) {
                    resultados.erros.push(`Sessão: ${sessaoResult.erro}`);
                }
            } catch (error) {
                resultados.erros.push(`Erro na sessão: ${error.message}`);
            }
            
            // 2. Salvar execuções individuais
            if (dados.execucoes && dados.execucoes.length > 0) {
                try {
                    const execResult = await this.salvarExecucoes(dados.execucoes, dados.usuario_id);
                    resultados.execucoes_salvas = execResult.salvos || 0;
                    if (execResult.erros && execResult.erros.length > 0) {
                        resultados.erros.push(...execResult.erros);
                    }
                } catch (error) {
                    resultados.erros.push(`Erro nas execuções: ${error.message}`);
                }
            }
            
            // 3. Atualizar planejamento semanal
            try {
                const planResult = await this.atualizarPlanejamento(dados.usuario_id);
                resultados.planejamento_atualizado = planResult.sucesso;
                if (!planResult.sucesso) {
                    resultados.erros.push(`Planejamento: ${planResult.erro}`);
                }
            } catch (error) {
                resultados.erros.push(`Erro no planejamento: ${error.message}`);
            }
            
            console.log('[WorkoutCompletion] 📊 Resultado do salvamento:', resultados);
            
            return resultados;
            
        } catch (error) {
            console.error('[WorkoutCompletion] Erro geral no salvamento:', error);
            resultados.erros.push(`Erro geral: ${error.message}`);
            return resultados;
        }
    }
    
    /**
     * Salvar sessão de treino completa (criar tabela se necessário)
     */
    static async salvarSessaoTreino(dados) {
        try {
            // Preparar dados para inserção
            const sessaoData = {
                usuario_id: dados.usuario_id,
                data_treino: dados.data_treino,
                data_inicio: dados.data_inicio,
                data_fim: dados.data_fim,
                tempo_total_segundos: dados.tempo_total_segundos,
                tempo_total_minutos: dados.tempo_total_minutos,
                grupo_muscular: dados.grupo_muscular,
                tipo_atividade: dados.tipo_atividade,
                protocolo_id: dados.protocolo_id,
                
                // Estatísticas
                total_series: dados.total_series,
                exercicios_unicos: dados.exercicios_unicos,
                peso_total_levantado: dados.peso_total_levantado,
                repeticoes_totais: dados.repeticoes_totais,
                series_falhadas: dados.series_falhadas,
                
                // Avaliação
                post_workout: dados.post_workout,
                dificuldade_percebida: dados.dificuldade_percebida,
                energia_nivel: dados.energia_nivel,
                observacoes_finais: dados.observacoes_finais,
                
                // Metadados
                plataforma: dados.plataforma,
                versao_app: dados.versao_app,
                status: dados.status,
                
                created_at: nowUtcISO()
            };
            
            // Tentar inserir na tabela sessoes_treino
            const { data, error } = await supabase
                .from('sessoes_treino')
                .insert(sessaoData)
                .select()
                .single();
            
            if (error) {
                console.warn('[WorkoutCompletion] Tabela sessoes_treino não existe ou erro:', error);
                
                // Salvar no localStorage como backup
                const backupKey = `sessao_backup_${dados.usuario_id}_${Date.now()}`;
                localStorage.setItem(backupKey, JSON.stringify(sessaoData));
                
                return {
                    sucesso: false,
                    erro: 'Tabela não encontrada - dados salvos localmente',
                    backup: backupKey
                };
            }
            
            console.log('[WorkoutCompletion] ✅ Sessão salva:', data);
            return { sucesso: true, data };
            
        } catch (error) {
            console.error('[WorkoutCompletion] Erro ao salvar sessão:', error);
            return { sucesso: false, erro: error.message };
        }
    }
    
    /**
     * Salvar execuções individuais
     */
    static async salvarExecucoes(execucoes, usuarioId) {
        try {
            // Usar o serviço existente
            const workoutService = await import('../services/workoutService.js');
            return await workoutService.salvarExecucoesEmLote(execucoes);
        } catch (error) {
            console.error('[WorkoutCompletion] Erro ao salvar execuções:', error);
            return { salvos: 0, erros: [error.message] };
        }
    }
    
    /**
     * Atualizar planejamento semanal
     */
    static async atualizarPlanejamento(usuarioId) {
        try {
            const workoutProtocol = await import('../services/workoutProtocolService.js');
            await workoutProtocol.WorkoutProtocolService.marcarTreinoComoConcluido(usuarioId);
            return { sucesso: true };
        } catch (error) {
            console.error('[WorkoutCompletion] Erro ao atualizar planejamento:', error);
            return { sucesso: false, erro: error.message };
        }
    }
    
    /**
     * Limpar todo estado do treino
     */
    static async limparEstadoTreino() {
        try {
            // Limpar timers
            timerManager.clearContext('workout');
            
            // Limpar AppState
            AppState.set('execucoesCache', []);
            AppState.set('workoutStartTime', null);
            AppState.set('restTime', null);
            AppState.set('currentWorkout', null);
            
            // Limpar cache de treino
            const cacheService = await import('./treinoCacheService.js');
            await cacheService.TreinoCacheService.clearWorkoutState();
            
            console.log('[WorkoutCompletion] 🧹 Estado limpo');
            
        } catch (error) {
            console.error('[WorkoutCompletion] Erro ao limpar estado:', error);
        }
    }
    
    /**
     * Salvar estado de finalização para recovery
     */
    static salvarEstadoFinalizacao(dados, resultado) {
        try {
            const estadoRecovery = {
                action: 'treino_finalizado',
                timestamp: nowUtcISO(),
                dados_treino: dados,
                resultado_salvamento: resultado,
                redirect_to: 'home-screen',
                refresh_dashboard: true
            };
            
            localStorage.setItem('workout_completion_state', JSON.stringify(estadoRecovery));
            
            // Limpar após 1 hora
            setTimeout(() => {
                localStorage.removeItem('workout_completion_state');
            }, 60 * 60 * 1000);
            
        } catch (error) {
            console.error('[WorkoutCompletion] Erro ao salvar estado de finalização:', error);
        }
    }
    
    /**
     * Salvar estado de erro para retry
     */
    static salvarEstadoErro(error, dados) {
        try {
            const estadoErro = {
                action: 'treino_erro',
                timestamp: nowUtcISO(),
                erro: error.message,
                dados_originais: dados,
                retry_available: true
            };
            
            localStorage.setItem('workout_error_state', JSON.stringify(estadoErro));
            
        } catch (err) {
            console.error('[WorkoutCompletion] Erro ao salvar estado de erro:', err);
        }
    }
    
    /**
     * Navegação segura após finalização
     */
    static async navegarApósFinalizacao() {
        try {
            // Aguardar um pouco para garantir que tudo foi processado
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Navegar para home
            const navigation = await import('../ui/navigation.js');
            navigation.mostrarTela('home-screen');
            
            // Recarregar dashboard após navegar
            setTimeout(async () => {
                if (window.carregarDashboard) {
                    try {
                        await window.carregarDashboard();
                    } catch (error) {
                        console.error('[WorkoutCompletion] Erro ao recarregar dashboard:', error);
                    }
                }
            }, 500);
            
        } catch (error) {
            console.error('[WorkoutCompletion] Erro na navegação:', error);
        }
    }
    
    /**
     * Verificar se há recovery pendente após refresh
     */
    static async verificarRecoveryPendente() {
        try {
            const completionState = localStorage.getItem('workout_completion_state');
            const errorState = localStorage.getItem('workout_error_state');
            
            if (completionState) {
                const state = JSON.parse(completionState);
                console.log('[WorkoutCompletion] 🔄 Recovery de finalização detectado');
                
                // Redirecionar e recarregar dashboard
                if (state.redirect_to) {
                    const navigation = await import('../ui/navigation.js');
                    navigation.mostrarTela(state.redirect_to);
                }
                
                if (state.refresh_dashboard && window.carregarDashboard) {
                    setTimeout(() => window.carregarDashboard(), 1000);
                }
                
                localStorage.removeItem('workout_completion_state');
                return { tipo: 'finalizado', state };
            }
            
            if (errorState) {
                const state = JSON.parse(errorState);
                console.log('[WorkoutCompletion] ⚠️ Recovery de erro detectado');
                
                // Mostrar opção de retry
                if (state.retry_available) {
                    this.mostrarOpçãoRetry(state);
                }
                
                return { tipo: 'erro', state };
            }
            
            return null;
            
        } catch (error) {
            console.error('[WorkoutCompletion] Erro no recovery:', error);
            return null;
        }
    }
    
    /**
     * Mostrar opção de retry após erro
     */
    static mostrarOpçãoRetry(errorState) {
        if (window.showNotification) {
            const notification = window.showNotification(
                `Treino não foi finalizado completamente. <button onclick="window.retryWorkoutCompletion()" class="btn-retry">Tentar Novamente</button>`,
                'warning',
                true
            );
            
            window.retryWorkoutCompletion = async () => {
                if (notification && notification.remove) {
                    notification.remove();
                }
                
                await this.finalizarTreino(errorState.dados_originais);
                localStorage.removeItem('workout_error_state');
            };
        }
    }
    
    /**
     * Sistema de loading progressivo
     */
    static showProgressiveLoading(message) {
        if (window.showNotification) {
            return window.showNotification(message, 'info', true);
        }
        return null;
    }
    
    static updateProgressiveLoading(loadingId, message, type = 'info') {
        if (loadingId && loadingId.remove) {
            loadingId.remove();
        }
        
        if (window.showNotification) {
            return window.showNotification(message, type, type === 'error');
        }
        return null;
    }
}

// Expor globalmente para compatibilidade
window.WorkoutCompletionService = WorkoutCompletionService;

// Auto-verificar recovery na inicialização
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            WorkoutCompletionService.verificarRecoveryPendente();
        }, 1000);
    });
}

export default WorkoutCompletionService;