// Service auxiliar para calcular métricas agregadas
// Complementa a view vw_treino_completo com cálculos que precisam de DISTINCT

import { supabase } from './supabaseService.js';

export class TreinoMetricasService {
    
    // Calcular métricas agregadas por dia
    static async calcularMetricasDia(userId, data) {
        try {
            const dataStr = typeof data === 'string' ? data : data.toISOString().split('T')[0];
            
            // Query 1: Total de séries e volume
            const { data: metricas, error: errorMetricas } = await supabase
                .rpc('calc_metricas_dia', {
                    p_usuario_id: userId,
                    p_data: dataStr
                });
                
            if (errorMetricas) {
                // Fallback: calcular manualmente se a função não existir
                return await this.calcularMetricasManual(userId, dataStr);
            }
            
            return { success: true, data: metricas[0] || {} };
            
        } catch (error) {
            console.error('[TreinoMetricasService] Erro ao calcular métricas:', error);
            return await this.calcularMetricasManual(userId, data);
        }
    }
    
    // Calcular métricas manualmente
    static async calcularMetricasManual(userId, data) {
        try {
            const dataInicio = `${data}T00:00:00`;
            const dataFim = `${data}T23:59:59`;
            
            // Buscar todas as execuções do dia
            const { data: execucoes, error } = await supabase
                .from('vw_treino_completo')
                .select('*')
                .eq('usuario_id', userId)
                .eq('data_treino', data);
                
            if (error) throw error;
            
            if (!execucoes || execucoes.length === 0) {
                return { 
                    success: true, 
                    data: {
                        total_series: 0,
                        total_exercicios: 0,
                        volume_total: 0,
                        peso_medio: 0,
                        tempo_estimado: 0,
                        grupos_musculares: []
                    }
                };
            }
            
            // Calcular métricas
            const metricas = {
                total_series: execucoes.length,
                total_exercicios: [...new Set(execucoes.map(e => e.exercicio_id))].length,
                volume_total: execucoes.reduce((sum, e) => sum + (e.volume_serie || 0), 0),
                peso_medio: execucoes.reduce((sum, e) => sum + (e.peso_utilizado || 0), 0) / execucoes.length,
                tempo_estimado: Math.round(execucoes.reduce((sum, e) => sum + (e.tempo_estimado_serie_segundos || 0), 0) / 60),
                grupos_musculares: [...new Set(execucoes.map(e => e.grupo_muscular))],
                intensidade_media: this.calcularMedia(execucoes.map(e => e.intensidade_percentual).filter(Boolean)),
                prs_realizados: execucoes.filter(e => e.qualidade_performance === 'Excelente').length,
                falhas: execucoes.filter(e => e.falhou).length,
                taxa_sucesso: Math.round(((execucoes.length - execucoes.filter(e => e.falhou).length) / execucoes.length * 100) * 10) / 10
            };
            
            return { success: true, data: metricas };
            
        } catch (error) {
            console.error('[TreinoMetricasService] Erro no cálculo manual:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Calcular estatísticas de progressão
    static async calcularProgressao(userId, exercicioId, limite = 10) {
        try {
            const { data: historico, error } = await supabase
                .from('vw_treino_completo')
                .select('*')
                .eq('usuario_id', userId)
                .eq('exercicio_id', exercicioId)
                .order('data_execucao', { ascending: false })
                .limit(limite);
                
            if (error) throw error;
            
            if (!historico || historico.length === 0) {
                return { success: true, data: [] };
            }
            
            // Calcular progressão
            const progressao = historico.map((atual, index) => {
                const anterior = historico[index + 1];
                
                return {
                    data: atual.data_treino,
                    peso: atual.peso_utilizado,
                    repeticoes: atual.repeticoes,
                    volume: atual.volume_serie,
                    rm_estimado: atual.rm_estimado,
                    intensidade: atual.intensidade_percentual,
                    progressao_peso: anterior ? atual.peso_utilizado - anterior.peso_utilizado : 0,
                    progressao_volume: anterior ? atual.volume_serie - anterior.volume_serie : 0
                };
            });
            
            return { success: true, data: progressao };
            
        } catch (error) {
            console.error('[TreinoMetricasService] Erro na progressão:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Resumo semanal
    static async resumoSemanal(userId, ano, semana) {
        try {
            const { data: treinos, error } = await supabase
                .from('vw_treino_completo')
                .select('*')
                .eq('usuario_id', userId)
                .eq('ano', ano)
                .eq('semana', semana);
                
            if (error) throw error;
            
            if (!treinos || treinos.length === 0) {
                return { success: true, data: this.getResumoVazio() };
            }
            
            // Agrupar por dia
            const porDia = {};
            treinos.forEach(t => {
                const dia = t.dia_semana;
                if (!porDia[dia]) {
                    porDia[dia] = {
                        dia_semana: dia,
                        data: t.data_treino,
                        grupo_muscular: t.grupo_muscular,
                        treinos: []
                    };
                }
                porDia[dia].treinos.push(t);
            });
            
            // Calcular métricas por dia
            const resumo = {
                ano,
                semana,
                dias: Object.values(porDia).map(dia => ({
                    ...dia,
                    total_series: dia.treinos.length,
                    total_exercicios: [...new Set(dia.treinos.map(t => t.exercicio_id))].length,
                    volume_total: dia.treinos.reduce((sum, t) => sum + (t.volume_serie || 0), 0),
                    tempo_estimado: Math.round(dia.treinos.reduce((sum, t) => sum + (t.tempo_estimado_serie_segundos || 0), 0) / 60),
                    concluido: dia.treinos.some(t => t.planejamento_concluido)
                })),
                totais: {
                    dias_treinados: Object.keys(porDia).length,
                    total_series: treinos.length,
                    total_exercicios: [...new Set(treinos.map(t => t.exercicio_id))].length,
                    volume_total: treinos.reduce((sum, t) => sum + (t.volume_serie || 0), 0),
                    tempo_total: Math.round(treinos.reduce((sum, t) => sum + (t.tempo_estimado_serie_segundos || 0), 0) / 60),
                    grupos_musculares: [...new Set(treinos.map(t => t.grupo_muscular))]
                }
            };
            
            return { success: true, data: resumo };
            
        } catch (error) {
            console.error('[TreinoMetricasService] Erro no resumo semanal:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Helpers
    static calcularMedia(array) {
        if (!array || array.length === 0) return 0;
        return Math.round((array.reduce((a, b) => a + b, 0) / array.length) * 10) / 10;
    }
    
    static getResumoVazio() {
        return {
            dias: [],
            totais: {
                dias_treinados: 0,
                total_series: 0,
                total_exercicios: 0,
                volume_total: 0,
                tempo_total: 0,
                grupos_musculares: []
            }
        };
    }
}

export default TreinoMetricasService;