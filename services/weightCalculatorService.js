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
    static async calcularPesosExercicio(userId, exercicioId, semanaAtual, numeroTreino, protocoloId) {
        try {
            console.log(`[WeightCalculator] Calculando pesos: user=${userId}, exercicio=${exercicioId}, semana=${semanaAtual}`);
            
            // 1. Buscar 1RM do usuário para o exercício
            const rm1 = await fetch1RMUsuario(userId, exercicioId);
            if (!rm1 || rm1 <= 0) {
                console.warn(`[WeightCalculator] 1RM não encontrado para exercício ${exercicioId}`);
                return {
                    peso_base: 20,
                    peso_minimo: 15,
                    peso_maximo: 25,
                    repeticoes_alvo: 10,
                    fonte: 'default'
                };
            }
            
            // 2. Buscar configuração do protocolo para esta semana
            const { data: protocoloTreino, error } = await query('protocolo_treinos', {
                select: '*',
                eq: {
                    exercicio_id: exercicioId,
                    semana_referencia: semanaAtual,
                    numero_treino: numeroTreino,
                    protocolo_id: protocoloId
                },
                single: true
            });
            
            if (error || !protocoloTreino) {
                console.warn(`[WeightCalculator] Protocolo não encontrado:`, { exercicioId, semanaAtual, numeroTreino, protocoloId });
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
    static async calcularPesosTreino(userId, numeroTreino, protocoloId, semanaAtual) {
        try {
            // 1. Buscar exercícios do treino para a semana
            const { data: exerciciosTreino, error } = await query('protocolo_treinos', {
                select: `
                    *,
                    exercicios (
                        id,
                        nome,
                        grupo_muscular,
                        equipamento
                    )
                `,
                eq: {
                    numero_treino: numeroTreino,
                    protocolo_id: protocoloId,
                    semana_referencia: semanaAtual
                },
                order: { column: 'ordem_exercicio', ascending: true }
            });
            
            if (error || !exerciciosTreino) {
                console.error(`[WeightCalculator] Erro ao buscar exercícios do treino:`, error);
                return [];
            }
            
            // 2. Calcular pesos para cada exercício
            const exerciciosComPesos = await Promise.all(
                exerciciosTreino.map(async (protocoloTreino) => {
                    const pesos = await this.calcularPesosExercicio(
                        userId,
                        protocoloTreino.exercicio_id,
                        semanaAtual,
                        numeroTreino,
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
        
        // Calcular pesos dinamicamente
        const pesos = await WeightCalculatorService.calcularPesosExercicio(
            userId,
            protocoloTreino.exercicio_id,
            semanaAtual,
            protocoloTreino.numero_treino,
            protocoloTreino.protocolo_id
        );
        
        return { data: pesos, error: null };
        
    } catch (error) {
        console.error('[carregarPesosSugeridos] Erro:', error);
        return { data: null, error: error.message };
    }
}

export default WeightCalculatorService;