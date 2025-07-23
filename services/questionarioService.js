// services/questionarioService.js
// Serviço centralizado para gerenciar questionários de início e fim do treino

import DisposicaoInicioModal from '../components/disposicaoInicioModal.js';
import AvaliacaoTreinoComponent from '../components/avaliacaoTreino.js';
import AppState from '../state/appState.js';

export class QuestionarioService {
    
    /**
     * Executa o questionário completo de início do treino
     * @param {number} userId - ID do usuário
     * @returns {Promise<Object>} Resultado com dados coletados
     */
    static async executarQuestionarioInicio(userId) {
        console.log('[QuestionarioService] Iniciando questionário pré-treino para usuário:', userId);
        
        const resultado = {
            sucesso: false,
            dados: {},
            erro: null
        };
        
        try {
            // 1. Verificar se disposição já foi coletada hoje
            const jaColetou = await DisposicaoInicioModal.verificarSeJaColetouHoje(userId);
            
            if (jaColetou) {
                console.log('[QuestionarioService] Disposição já foi coletada hoje, pulando modal');
                resultado.sucesso = true;
                resultado.dados.energia = 'ja_coletada';
                resultado.dados.mensagem = 'Disposição já foi coletada hoje';
                return resultado;
            }
            
            // 2. Coletar nível de energia (obrigatório)
            console.log('[QuestionarioService] Solicitando disposição inicial...');
            const energiaNivel = await DisposicaoInicioModal.solicitar();
            
            if (energiaNivel) {
                console.log('[QuestionarioService] Energia coletada:', energiaNivel);
                resultado.dados.energia = energiaNivel;
                
                // Salvar na base de dados
                const salvamento = await DisposicaoInicioModal.salvarValor(userId, energiaNivel);
                if (salvamento.success) {
                    console.log('[QuestionarioService] Energia salva com sucesso');
                    // Armazenar no AppState para usar na avaliação final
                    AppState.set('energiaPreTreino', energiaNivel);
                    resultado.sucesso = true;
                } else {
                    console.error('[QuestionarioService] Erro ao salvar energia:', salvamento.error);
                    resultado.erro = salvamento.error;
                }
            } else {
                console.log('[QuestionarioService] Usuário cancelou ou não informou energia');
                resultado.erro = 'Usuário não informou energia';
            }
            
            // TODO: Expandir para outros questionários (sono, alimentação, motivação)
            // resultado.dados.sono = await coletarNivelSono();
            // resultado.dados.alimentacao = await coletarQualidadeAlimentacao();
            // resultado.dados.motivacao = await coletarNivelMotivacao();
            
        } catch (error) {
            console.error('[QuestionarioService] Erro no questionário de início:', error);
            resultado.erro = error;
        }
        
        return resultado;
    }
    
    /**
     * Executa o questionário completo de fim do treino
     * @param {Object} dadosResumo - Dados do treino para exibir no modal
     * @returns {Promise<Object>} Resultado da avaliação
     */
    static async executarQuestionarioFim(dadosResumo) {
        console.log('[QuestionarioService] Iniciando questionário pós-treino com dados:', dadosResumo);
        
        try {
            // Exibir modal de avaliação completo
            // O modal se encarrega de toda a lógica de coleta e salvamento
            AvaliacaoTreinoComponent.mostrarModalAvaliacao(dadosResumo);
            
            return {
                sucesso: true,
                mensagem: 'Modal de avaliação exibido com sucesso'
            };
            
        } catch (error) {
            console.error('[QuestionarioService] Erro no questionário de fim:', error);
            return {
                sucesso: false,
                erro: error
            };
        }
    }
    
    /**
     * Calcula resumo do treino para o questionário final
     * @returns {Object} Dados resumidos do treino
     */
    static calcularResumoTreino() {
        const exercises = AppState.get('currentExercises') || [];
        const execucoesCache = AppState.get('execucoesCache') || [];
        const workoutStartTime = AppState.get('workoutStartTime');
        const energiaPreTreino = AppState.get('energiaPreTreino');
        const workout = AppState.get('currentWorkout');
        
        // Calcular estatísticas
        const exerciciosRealizados = new Set(execucoesCache.map(ex => ex.exercicio_id)).size;
        const totalSeries = execucoesCache.length;
        const pesoTotalLevantado = execucoesCache.reduce((total, ex) => total + (ex.peso * ex.repeticoes), 0);
        const tempoTreino = workoutStartTime ? this.formatarTempo((Date.now() - workoutStartTime) / 1000) : '00:00';
        
        return {
            grupo_muscular: workout?.grupo_muscular || 'Treino',
            energia_pre_treino: energiaPreTreino,
            resumo: {
                exercicios_realizados: exerciciosRealizados,
                total_series: totalSeries,
                peso_total_levantado: pesoTotalLevantado,
                tempo_treino: tempoTreino
            }
        };
    }
    
    /**
     * Formatar tempo em MM:SS
     * @param {number} segundos - Tempo em segundos
     * @returns {string} Tempo formatado
     */
    static formatarTempo(segundos) {
        const mins = Math.floor(segundos / 60);
        const secs = Math.floor(segundos % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    /**
     * Verifica se os questionários estão habilitados
     * @returns {Object} Status dos questionários
     */
    static verificarStatusQuestionarios() {
        return {
            inicio_habilitado: true, // Sempre habilitado por enquanto
            fim_habilitado: true,    // Sempre habilitado por enquanto
            questionarios_expandidos: false // Para futuras expansões
        };
    }
    
    // TODO: Métodos para questionários expandidos
    /*
    static async coletarNivelSono() {
        // Modal para coletar qualidade do sono (1-5)
        // "Como foi sua qualidade de sono ontem?"
    }
    
    static async coletarQualidadeAlimentacao() {
        // Modal para coletar qualidade da alimentação (1-5)
        // "Como foi sua alimentação hoje?"
    }
    
    static async coletarNivelMotivacao() {
        // Modal para coletar nível de motivação (1-5)
        // "Qual seu nível de motivação para treinar?"
    }
    */
}

export default QuestionarioService;