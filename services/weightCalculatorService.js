// services/weightCalculatorService.js - Substituição da tabela pesos_usuario
import { query } from './supabaseService.js';
import { fetch1RMUsuario } from './userService.js';

/**
 * Serviço para cálculo dinâmico de pesos baseado em 1RM e protocolo
 * Substitui a tabela pesos_usuario com cálculo em tempo real
 */
export class WeightCalculatorService {
    
    /**
     * Calcular pesos para um exercício específico na semana atual
     */
    static async calcularPesosExercicio(userId, exercicioId, semanaAtual, grupoMuscular, protocoloId) {
        try {
            console.log(`[WeightCalculator] Calculando pesos: user=${userId}, exercicio=${exercicioId}, semana=${semanaAtual}`);
            
            // 1. Buscar 1RM do usuário para o exercício
            const rm1 = await fetch1RMUsuario(userId, exercicioId);
            if (!rm1 || rm1 <= 0) {
                console.log(`[WeightCalculator] 1RM não encontrado para exercício ${exercicioId}, usando valores padrão`);
                
                // Retornar valores padrão mais apropriados baseados no gênero/experiência
                // TODO: Implementar lógica para determinar valores baseados no perfil do usuário
                return {
                    peso_base: 20,
                    peso_minimo: 15,
                    peso_maximo: 25,
                    repeticoes_alvo: 10,
                    fonte: 'default',
                    mensagem: '1RM não cadastrado - usando valores padrão'
                };
            }
            
            // 2. Buscar configuração do protocolo para esta semana usando JOIN
            // Validar parâmetros antes da consulta
            if (!exercicioId || !semanaAtual || !grupoMuscular || !protocoloId) {
                console.warn(`[WeightCalculator] Parâmetros inválidos:`, { exercicioId, semanaAtual, grupoMuscular, protocoloId });
                return this.calcularComPercentuaisPadrao(rm1, semanaAtual || 1);
            }
            
            const { data: protocoloTreino, error } = await query('protocolo_treinos', {
                select: '*, exercicios!inner(grupo_muscular)',
                eq: {
                    exercicio_id: parseInt(exercicioId),
                    semana_referencia: parseInt(semanaAtual),
                    'exercicios.grupo_muscular': grupoMuscular,
                    protocolo_id: parseInt(protocoloId)
                },
                single: true
            });
            
            if (error || !protocoloTreino) {
                console.warn(`[WeightCalculator] Protocolo não encontrado:`, { exercicioId, semanaAtual, grupoMuscular, protocoloId });
                // Fallback com percentuais padrão
                return this.calcularComPercentuaisPadrao(rm1, semanaAtual);
            }
            
            // 3. Calcular pesos baseado nos percentuais do protocolo
            const pesosCalculados = {
                peso_base: this.arredondarPeso(rm1 * (protocoloTreino.percentual_1rm_base / 100)),
                peso_minimo: this.arredondarPeso(rm1 * (protocoloTreino.percentual_1rm_min / 100)),
                peso_maximo: this.arredondarPeso(rm1 * (protocoloTreino.percentual_1rm_max / 100)),
                repeticoes_alvo: protocoloTreino.repeticoes_alvo || 10,
                fonte: 'calculado',
                percentuais: {
                    base: protocoloTreino.percentual_1rm_base,
                    min: protocoloTreino.percentual_1rm_min,
                    max: protocoloTreino.percentual_1rm_max
                },
                rm_base: rm1
            };
            
            console.log(`[WeightCalculator] ✅ Pesos calculados:`, pesosCalculados);
            return pesosCalculados;
            
        } catch (error) {
            console.error(`[WeightCalculator] Erro ao calcular pesos:`, error);
            return this.calcularComPercentuaisPadrao(20, semanaAtual); // Fallback de emergência
        }
    }
    
    /**
     * Calcular pesos para todos os exercícios de um treino
     */
    static async calcularPesosTreino(userId, tipoAtividade, protocoloId, semanaAtual) {
        try {
            // 1. Validar parâmetros
            if (!tipoAtividade || !protocoloId || !semanaAtual) {
                console.warn(`[WeightCalculator] Parâmetros inválidos para buscar treino:`, { tipoAtividade, protocoloId, semanaAtual });
                return [];
            }
            
            // 1. Buscar exercícios do treino para a semana usando JOIN
            const { data: exerciciosTreino, error } = await query('protocolo_treinos', {
                select: '*, exercicios!inner ( id, nome, grupo_muscular, equipamento )',
                eq: {
                    'exercicios.grupo_muscular': tipoAtividade,
                    protocolo_id: parseInt(protocoloId),
                    semana_referencia: parseInt(semanaAtual)
                },
                order: { column: 'ordem_exercicio', ascending: true }
            });
            
            if (error || !exerciciosTreino) {
                console.error(`[WeightCalculator] Erro ao buscar exercícios do treino:`, error);
                
                // Debug detalhado - buscar todos os protocolos disponíveis
                const { data: allProtocolos } = await query('protocolo_treinos', {
                    select: 'protocolo_id, semana_referencia, exercicio_id, exercicios(grupo_muscular)',
                    limit: 10
                });
                console.log('[WeightCalculator] 🔍 Protocolos disponíveis (amostra):', allProtocolos);
                
                // Debug - buscar para este protocolo específico
                const { data: protocoloEspecifico } = await query('protocolo_treinos', {
                    select: 'semana_referencia, exercicio_id, exercicios(grupo_muscular)',
                    eq: { protocolo_id: parseInt(protocoloId) },
                    limit: 10
                });
                console.log(`[WeightCalculator] 🔍 Exercícios disponíveis para protocolo ${protocoloId}:`, protocoloEspecifico);
                
                // Debug mais específico - buscar por grupo muscular
                const { data: treinoEspecifico } = await query('protocolo_treinos', {
                    select: 'semana_referencia, protocolo_id, exercicio_id, exercicios!inner(grupo_muscular)',
                    eq: { 'exercicios.grupo_muscular': tipoAtividade },
                    limit: 5
                });
                console.log(`[WeightCalculator] 🔍 Treinos disponíveis para grupo muscular ${tipoAtividade}:`, treinoEspecifico);
                
                // Debug - buscar todas as semanas disponíveis
                const { data: semanasDisponiveis } = await query('protocolo_treinos', {
                    select: 'semana_referencia, exercicios!inner(grupo_muscular)',
                    eq: { protocolo_id: parseInt(protocoloId), 'exercicios.grupo_muscular': tipoAtividade },
                    distinct: true
                });
                console.log(`[WeightCalculator] 🔍 Semanas disponíveis para protocolo ${protocoloId}, grupo ${tipoAtividade}:`, semanasDisponiveis?.map(s => s.semana_referencia));
                
                // INVESTIGAÇÃO COMPLETA DA BASE DE DADOS
                console.log('🔍 ===== INVESTIGAÇÃO COMPLETA DA BASE DE DADOS =====');
                
                // 1. Verificar estrutura geral da tabela
                const { data: estruturaGeral } = await query('protocolo_treinos', {
                    select: 'protocolo_id, semana_referencia, exercicio_id, exercicios(grupo_muscular)',
                    limit: 20
                });
                console.log('📋 Estrutura geral da tabela protocolo_treinos:', estruturaGeral);
                
                // 2. Todos os protocolos existentes
                const { data: todosProtocolos } = await query('protocolo_treinos', {
                    select: 'protocolo_id',
                    distinct: true
                });
                console.log('🗂️ Todos os protocolo_id existentes:', todosProtocolos?.map(p => p.protocolo_id));
                
                // 3. Todos os grupos musculares disponíveis
                const { data: todosGrupos } = await query('exercicios', {
                    select: 'grupo_muscular',
                    distinct: true
                });
                console.log(`🏋️ Todos os grupos musculares disponíveis:`, todosGrupos?.map(g => g.grupo_muscular));
                
                // 4. Todas as semanas para protocolo e grupo muscular
                const { data: todasSemanas } = await query('protocolo_treinos', {
                    select: 'semana_referencia, exercicios!inner(grupo_muscular)',
                    eq: { protocolo_id: parseInt(protocoloId), 'exercicios.grupo_muscular': tipoAtividade },
                    distinct: true
                });
                console.log(`📅 Todas as semanas para protocolo ${protocoloId}, grupo ${tipoAtividade}:`, todasSemanas?.map(s => s.semana_referencia));
                
                // 5. Verificar se existe combinação mais próxima
                const { data: combinacaoProxima } = await query('protocolo_treinos', {
                    select: 'protocolo_id, semana_referencia, exercicio_id, exercicios!inner(grupo_muscular)',
                    eq: { protocolo_id: parseInt(protocoloId), 'exercicios.grupo_muscular': tipoAtividade },
                    limit: 5
                });
                console.log(`🎯 Exercícios para protocolo ${protocoloId}, grupo ${tipoAtividade} (TODAS as semanas):`, combinacaoProxima);
                
                console.log('🔍 ===== FIM DA INVESTIGAÇÃO =====');
                
                throw new Error(`Nenhum exercício encontrado para: grupo_muscular=${tipoAtividade}, protocolo_id=${protocoloId}, semana=${semanaAtual}`);
            }
            
            // 2. Calcular pesos para cada exercício
            const exerciciosComPesos = await Promise.all(
                exerciciosTreino.map(async (protocoloTreino) => {
                    const pesos = await this.calcularPesosExercicio(
                        userId,
                        protocoloTreino.exercicio_id,
                        semanaAtual,
                        protocoloTreino.exercicios.grupo_muscular,
                        protocoloId
                    );
                    
                    return {
                        ...protocoloTreino,
                        exercicio_nome: protocoloTreino.exercicios?.nome || 'Exercício',
                        exercicio_grupo: protocoloTreino.exercicios?.grupo_muscular || 'Grupo',
                        exercicio_equipamento: protocoloTreino.exercicios?.equipamento || 'Equipamento',
                        pesos_sugeridos: pesos
                    };
                })
            );
            
            console.log(`[WeightCalculator] ✅ ${exerciciosComPesos.length} exercícios com pesos calculados`);
            return exerciciosComPesos;
            
        } catch (error) {
            console.error(`[WeightCalculator] Erro ao calcular pesos do treino:`, error);
            return [];
        }
    }
    
    /**
     * Arredondar peso para múltiplos de 0.5kg (padrão de academias)
     */
    static arredondarPeso(peso) {
        return Math.round(peso * 2) / 2;
    }
    
    /**
     * Calcular com percentuais padrão (fallback)
     */
    static calcularComPercentuaisPadrao(rm1, semanaAtual) {
        // Progressão básica por semana
        const progressao = {
            1: { base: 70, min: 65, max: 75 },
            2: { base: 72, min: 67, max: 77 },
            3: { base: 75, min: 70, max: 80 },
            4: { base: 73, min: 68, max: 78 },
            5: { base: 77, min: 72, max: 82 },
            6: { base: 80, min: 75, max: 85 },
            7: { base: 83, min: 78, max: 88 },
            8: { base: 78, min: 73, max: 83 },
            9: { base: 85, min: 80, max: 90 },
            10: { base: 88, min: 83, max: 93 },
            11: { base: 92, min: 87, max: 97 },
            12: { base: 95, min: 90, max: 100 }
        };
        
        const percentuais = progressao[semanaAtual] || progressao[1];
        
        return {
            peso_base: this.arredondarPeso(rm1 * (percentuais.base / 100)),
            peso_minimo: this.arredondarPeso(rm1 * (percentuais.min / 100)),
            peso_maximo: this.arredondarPeso(rm1 * (percentuais.max / 100)),
            repeticoes_alvo: 10,
            fonte: 'padrao',
            percentuais: percentuais,
            rm_base: rm1
        };
    }
    
    /**
     * Atualizar 1RM baseado em execução real (Fórmula de Epley)
     */
    static calcular1RMPorExecucao(pesoExecutado, repeticoesExecutadas) {
        if (repeticoesExecutadas <= 0 || pesoExecutado <= 0) {
            return null;
        }
        
        // Fórmula de Epley: 1RM = peso × (1 + reps/30)
        const novoRM = pesoExecutado * (1 + (repeticoesExecutadas / 30));
        return this.arredondarPeso(novoRM);
    }
    
    /**
     * Sugerir ajuste de peso baseado na execução anterior
     */
    static sugerirAjustePeso(pesoAnterior, repsAnterior, repsAlvo) {
        if (!pesoAnterior || !repsAnterior || !repsAlvo) {
            return pesoAnterior;
        }
        
        // Se fez mais reps que o alvo, aumentar peso
        if (repsAnterior > repsAlvo) {
            const incremento = Math.ceil((repsAnterior - repsAlvo) / 2) * 2.5;
            return this.arredondarPeso(pesoAnterior + incremento);
        }
        
        // Se fez menos reps que o alvo, diminuir peso
        if (repsAnterior < repsAlvo - 2) {
            const decremento = Math.ceil((repsAlvo - repsAnterior) / 2) * 2.5;
            return this.arredondarPeso(Math.max(pesoAnterior - decremento, pesoAnterior * 0.9));
        }
        
        // Se ficou próximo do alvo, manter peso
        return pesoAnterior;
    }
    
    /**
     * Obter histórico de pesos para um exercício (últimas 4 semanas)
     */
    static async obterHistoricoPesos(userId, exercicioId, semanaAtual) {
        try {
            const historico = [];
            
            for (let semana = Math.max(1, semanaAtual - 3); semana <= semanaAtual; semana++) {
                const pesos = await this.calcularPesosExercicio(userId, exercicioId, semana, 1, 1);
                historico.push({
                    semana: semana,
                    ...pesos
                });
            }
            
            return historico;
            
        } catch (error) {
            console.error(`[WeightCalculator] Erro ao obter histórico:`, error);
            return [];
        }
    }
}

// Funções de conveniência para compatibilidade com código existente
export async function carregarPesosSugeridos(userId, protocoloTreinoId) {
    try {
        // Buscar dados do protocolo_treino específico
        const { data: protocoloTreino } = await query('protocolo_treinos', {
            eq: { id: protocoloTreinoId },
            single: true
        });
        
        if (!protocoloTreino) {
            return { data: null, error: 'Protocolo não encontrado' };
        }
        
        // Buscar semana atual do usuário
        const { data: planoUsuario } = await query('usuario_plano_treino', {
            eq: { usuario_id: userId, status: 'ativo' },
            single: true
        });
        
        const semanaAtual = planoUsuario?.semana_atual || 1;
        
        // Buscar grupo muscular do exercício
        const { data: exercicio } = await query('exercicios', {
            select: 'grupo_muscular',
            eq: { id: protocoloTreino.exercicio_id },
            single: true
        });

        // Calcular pesos dinamicamente
        const pesos = await WeightCalculatorService.calcularPesosExercicio(
            userId,
            protocoloTreino.exercicio_id,
            semanaAtual,
            exercicio?.grupo_muscular || 'Peito',
            protocoloTreino.protocolo_id
        );
        
        return { data: pesos, error: null };
        
    } catch (error) {
        console.error('[carregarPesosSugeridos] Erro:', error);
        return { data: null, error: error.message };
    }
}

export default WeightCalculatorService;