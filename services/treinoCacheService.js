// Serviço para gerenciar cache local de execuções de treino
export class TreinoCacheService {
    
    static STORAGE_KEY = 'treino_em_andamento';
    static HISTORICO_KEY = 'treinos_cache_historico';
    
    // Iniciar nova sessão de treino
    static iniciarSessaoTreino(dadosIniciais) {
        const sessao = {
            id: this.gerarIdSessao(),
            usuario_id: dadosIniciais.usuario_id,
            protocolo_treino_id: dadosIniciais.protocolo_treino_id,
            grupo_muscular: dadosIniciais.grupo_muscular,
            tipo_atividade: dadosIniciais.tipo_atividade,
            data_inicio: new Date().toISOString(),
            data_treino: new Date().toISOString().split('T')[0],
            status: 'em_andamento',
            
            // Execuções em cache
            execucoes: [],
            
            // Metadados
            exercicios_planejados: dadosIniciais.exercicios_planejados || [],
            observacoes_iniciais: dadosIniciais.observacoes || null
        };
        
        this.salvarSessaoCache(sessao);
        
        console.log('[TreinoCacheService] ✅ Sessão iniciada:', sessao.id);
        return sessao;
    }
    
    // Adicionar execução ao cache
    static adicionarExecucaoCache(dadosExecucao) {
        try {
            const sessao = this.obterSessaoAtiva();
            
            if (!sessao) {
                throw new Error('Nenhuma sessão de treino ativa encontrada');
            }
            
            const execucao = {
                id_temporario: this.gerarIdTemporario(),
                exercicio_id: dadosExecucao.exercicio_id,
                exercicio_nome: dadosExecucao.exercicio_nome,
                peso_utilizado: dadosExecucao.peso_utilizado,
                repeticoes: dadosExecucao.repeticoes,
                serie_numero: dadosExecucao.serie_numero,
                falhou: dadosExecucao.falhou || false,
                observacoes: dadosExecucao.observacoes || null,
                timestamp: new Date().toISOString(),
                
                // Dados adicionais para UX
                peso_sugerido: dadosExecucao.peso_sugerido,
                repeticoes_sugeridas: dadosExecucao.repeticoes_sugeridas,
                tempo_descanso: dadosExecucao.tempo_descanso
            };
            
            sessao.execucoes.push(execucao);
            sessao.ultima_atividade = new Date().toISOString();
            
            this.salvarSessaoCache(sessao);
            
            console.log('[TreinoCacheService] ✅ Execução adicionada ao cache:', {
                exercicio: execucao.exercicio_nome,
                serie: execucao.serie_numero,
                total_execucoes: sessao.execucoes.length
            });
            
            return { success: true, execucao, total_execucoes: sessao.execucoes.length };
            
        } catch (error) {
            console.error('[TreinoCacheService] Erro ao adicionar execução:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Verificar se é o último exercício planejado
    static verificarUltimoExercicio() {
        try {
            const sessao = this.obterSessaoAtiva();
            
            if (!sessao) {
                return { eh_ultimo: false, motivo: 'Sessão não encontrada' };
            }
            
            // Se não há exercícios planejados, usar heurística
            if (!sessao.exercicios_planejados || sessao.exercicios_planejados.length === 0) {
                return this.verificarUltimoExercicioHeuristica(sessao);
            }
            
            // Verificar baseado no planejamento
            const exerciciosExecutados = new Set(sessao.execucoes.map(e => e.exercicio_id));
            const exerciciosPlanejados = new Set(sessao.exercicios_planejados.map(e => e.exercicio_id));
            
            const exerciciosRestantes = [...exerciciosPlanejados].filter(id => !exerciciosExecutados.has(id));
            const eh_ultimo = exerciciosRestantes.length === 0;
            
            console.log('[TreinoCacheService] Verificação último exercício:', {
                planejados: exerciciosPlanejados.size,
                executados: exerciciosExecutados.size,
                restantes: exerciciosRestantes.length,
                eh_ultimo
            });
            
            return {
                eh_ultimo,
                exercicios_restantes: exerciciosRestantes.length,
                progresso: exerciciosExecutados.size / exerciciosPlanejados.size,
                motivo: eh_ultimo ? 'Todos exercícios planejados concluídos' : `${exerciciosRestantes.length} exercícios restantes`
            };
            
        } catch (error) {
            console.error('[TreinoCacheService] Erro ao verificar último exercício:', error);
            return { eh_ultimo: false, erro: error.message };
        }
    }
    
    // Heurística para detectar último exercício quando não há planejamento
    static verificarUltimoExercicioHeuristica(sessao) {
        const agora = new Date();
        const ultimaExecucao = new Date(sessao.ultima_atividade || sessao.data_inicio);
        const tempoInatividade = (agora - ultimaExecucao) / (1000 * 60); // minutos
        
        const exerciciosUnicos = new Set(sessao.execucoes.map(e => e.exercicio_id)).size;
        const totalSeries = sessao.execucoes.length;
        const duracaoTreino = (agora - new Date(sessao.data_inicio)) / (1000 * 60);
        
        // Critérios heurísticos
        const criterios = {
            tempo_minimo: duracaoTreino >= 15, // 15 min mínimo
            exercicios_suficientes: exerciciosUnicos >= 3, // 3 exercícios diferentes
            series_suficientes: totalSeries >= 6, // 6 séries mínimo
            tempo_inatividade: tempoInatividade >= 5 // 5 min sem atividade
        };
        
        const pontuacao = Object.values(criterios).filter(Boolean).length;
        const eh_ultimo = pontuacao >= 3; // Pelo menos 3 critérios atendidos
        
        return {
            eh_ultimo,
            motivo: eh_ultimo ? 'Heurística indica treino completo' : 'Treino aparenta estar incompleto',
            criterios,
            pontuacao,
            metricas: {
                duracao_minutos: Math.round(duracaoTreino),
                exercicios_unicos: exerciciosUnicos,
                total_series: totalSeries,
                tempo_inatividade: Math.round(tempoInatividade)
            }
        };
    }
    
    // Obter dados para avaliação de qualidade
    static obterDadosParaAvaliacao() {
        try {
            const sessao = this.obterSessaoAtiva();
            
            if (!sessao) {
                throw new Error('Nenhuma sessão ativa para avaliar');
            }
            
            const agora = new Date();
            const duracaoTotal = (agora - new Date(sessao.data_inicio)) / (1000 * 60);
            
            // Calcular estatísticas
            const stats = this.calcularEstatisticasSessao(sessao);
            
            const dadosAvaliacao = {
                sessao_id: sessao.id,
                grupo_muscular: sessao.grupo_muscular,
                tipo_atividade: sessao.tipo_atividade,
                duracao_minutos: Math.round(duracaoTotal),
                
                estatisticas: stats,
                
                // Para display na tela de avaliação
                resumo: {
                    exercicios_realizados: stats.exercicios_unicos,
                    total_series: stats.total_series,
                    peso_total_levantado: stats.peso_total,
                    tempo_treino: this.formatarTempo(duracaoTotal)
                }
            };
            
            console.log('[TreinoCacheService] Dados preparados para avaliação:', dadosAvaliacao);
            return { success: true, data: dadosAvaliacao };
            
        } catch (error) {
            console.error('[TreinoCacheService] Erro ao obter dados para avaliação:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Finalizar treino com avaliação
    static async finalizarTreinoComAvaliacao(dadosAvaliacao) {
        try {
            const {
                avaliacao_qualidade, // 0-5
                observacoes_finais = null,
                dificuldade_percebida = null, // 1-10 opcional
                energia_nivel = null // 1-10 opcional
            } = dadosAvaliacao;
            
            const sessao = this.obterSessaoAtiva();
            
            if (!sessao) {
                throw new Error('Nenhuma sessão ativa para finalizar');
            }
            
            // Adicionar dados de avaliação à sessão
            sessao.avaliacao = {
                qualidade: avaliacao_qualidade,
                dificuldade_percebida,
                energia_nivel,
                observacoes_finais,
                data_avaliacao: new Date().toISOString()
            };
            
            sessao.status = 'finalizado';
            sessao.data_fim = new Date().toISOString();
            
            // Salvar no cache antes de commitar
            this.salvarSessaoCache(sessao);
            
            console.log('[TreinoCacheService] ✅ Sessão finalizada com avaliação:', {
                avaliacao: avaliacao_qualidade,
                execucoes: sessao.execucoes.length
            });
            
            return { success: true, sessao };
            
        } catch (error) {
            console.error('[TreinoCacheService] Erro ao finalizar com avaliação:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Commit: enviar cache para banco de dados
    static async commitarTreinoParaBanco() {
        try {
            const sessao = this.obterSessaoAtiva();
            
            if (!sessao || sessao.status !== 'finalizado') {
                throw new Error('Sessão não está pronta para commit');
            }
            
            console.log('[TreinoCacheService] Iniciando commit para banco de dados...');
            
            // 1. Criar sessão na tabela treino_executado
            // BLOCO DESATIVADO: Criação de sessão na tabela treino_executado (tabela inexistente)
            /*
            const { data: sessaoDb, error: sessaoError } = await supabase
                .from('treino_executado') // DESATIVADO: tabela inexistente
                .insert({
                    usuario_id: sessao.usuario_id,
                    data_treino: sessao.data_treino,
                    grupo_muscular: sessao.grupo_muscular,
                    tipo_atividade: sessao.tipo_atividade,
                    protocolo_treino_id: sessao.protocolo_treino_id,
                    concluido: true,
                    data_inicio: sessao.data_inicio,
                    data_fim: sessao.data_fim,
                    avaliacao_qualidade: sessao.avaliacao?.qualidade,
                    dificuldade_percebida: sessao.avaliacao?.dificuldade_percebida,
                    energia_nivel: sessao.avaliacao?.energia_nivel,
                    observacoes: sessao.avaliacao?.observacoes_finais
                })
                .select()
                .single();
            */
            return { success: false, error: 'Operação desativada: tabela treino_executado não existe.' };

            
            // if (sessaoError) throw sessaoError; // DESATIVADO
            
            // 2. Inserir execuções individuais
            const execucoesParaBanco = sessao.execucoes.map(exec => ({
                usuario_id: sessao.usuario_id,
                protocolo_treino_id: sessao.protocolo_treino_id,
                exercicio_id: exec.exercicio_id,
                // treino_executado_id: sessaoDb.id, // DESATIVADO: tabela inexistente
                data_execucao: exec.timestamp,
                peso_utilizado: exec.peso_utilizado,
                repeticoes: exec.repeticoes,
                serie_numero: exec.serie_numero,
                falhou: exec.falhou,
                observacoes: exec.observacoes
            }));
            
            const { error: execucoesError } = await supabase
                .from('execucao_exercicio_usuario')
                .insert(execucoesParaBanco);
            
            if (execucoesError) throw execucoesError;
            
            // 3. Atualizar planejamento_semanal
            const hoje = new Date();
            const ano = hoje.getFullYear();
            const semana = this.calcularSemana(hoje);
            const { dayToDb } = await import('./weeklyPlanningService.js');
            const diaSemana = dayToDb(hoje.getDay());
            
            const { error: planejamentoError } = await supabase
                .from('planejamento_semanal')
                .update({
                    concluido: true,
                    data_conclusao: sessao.data_fim,
                    protocolo_treino_id: sessao.protocolo_treino_id
                })
                .eq('usuario_id', sessao.usuario_id)
                .eq('ano', ano)
                .eq('semana', semana)
                .eq('dia_semana', diaSemana);
            
            if (planejamentoError) {
                console.warn('[TreinoCacheService] Erro ao atualizar planejamento (não crítico):', planejamentoError);
            }
            
            // 4. Mover sessão para histórico e limpar cache ativo
            this.moverParaHistorico(sessao);
            this.limparSessaoAtiva();
            
            console.log('[TreinoCacheService] ✅ Commit realizado com sucesso:', {
                sessao_id: sessaoDb.id,
                execucoes: execucoesParaBanco.length,
                avaliacao: sessao.avaliacao?.qualidade
            });
            
            return {
                success: true,
                sessao_db_id: sessaoDb.id,
                execucoes_salvas: execucoesParaBanco.length,
                planejamento_atualizado: !planejamentoError
            };
            
        } catch (error) {
            console.error('[TreinoCacheService] ❌ Erro no commit:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Marcar treino como falta (saiu sem finalizar)
    static marcarTreinoComoFalta(motivo = 'Treino abandonado') {
        try {
            const sessao = this.obterSessaoAtiva();
            
            if (!sessao) {
                return { success: false, error: 'Nenhuma sessão ativa' };
            }
            
            sessao.status = 'falta';
            sessao.motivo_falta = motivo;
            sessao.data_abandono = new Date().toISOString();
            
            // Mover para histórico como falta
            this.moverParaHistorico(sessao);
            this.limparSessaoAtiva();
            
            console.log('[TreinoCacheService] ⚠️ Treino marcado como falta:', motivo);
            
            return { success: true, motivo };
            
        } catch (error) {
            console.error('[TreinoCacheService] Erro ao marcar falta:', error);
            return { success: false, error: error.message };
        }
    }
    
    // === MÉTODOS UTILITÁRIOS ===
    
    static obterSessaoAtiva() {
        try {
            const dados = localStorage.getItem(this.STORAGE_KEY);
            return dados ? JSON.parse(dados) : null;
        } catch (error) {
            console.error('[TreinoCacheService] Erro ao obter sessão:', error);
            return null;
        }
    }
    
    static salvarSessaoCache(sessao) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessao));
        } catch (error) {
            console.error('[TreinoCacheService] Erro ao salvar cache:', error);
        }
    }
    
    static limparSessaoAtiva() {
        localStorage.removeItem(this.STORAGE_KEY);
        console.log('[TreinoCacheService] Cache ativo limpo');
    }
    
    static moverParaHistorico(sessao) {
        try {
            const historico = this.obterHistorico();
            historico.push({
                ...sessao,
                movido_para_historico: new Date().toISOString()
            });
            
            // Manter apenas últimas 10 sessões no histórico local
            const historicoLimitado = historico.slice(-10);
            localStorage.setItem(this.HISTORICO_KEY, JSON.stringify(historicoLimitado));
            
        } catch (error) {
            console.error('[TreinoCacheService] Erro ao mover para histórico:', error);
        }
    }
    
    static obterHistorico() {
        try {
            const dados = localStorage.getItem(this.HISTORICO_KEY);
            return dados ? JSON.parse(dados) : [];
        } catch (error) {
            console.error('[TreinoCacheService] Erro ao obter histórico:', error);
            return [];
        }
    }
    
    static calcularEstatisticasSessao(sessao) {
        const exerciciosUnicos = new Set(sessao.execucoes.map(e => e.exercicio_id)).size;
        const totalSeries = sessao.execucoes.length;
        const pesoTotal = sessao.execucoes.reduce((total, exec) => 
            total + ((exec.peso_utilizado || 0) * (exec.repeticoes || 0)), 0
        );
        
        return {
            exercicios_unicos: exerciciosUnicos,
            total_series: totalSeries,
            peso_total: pesoTotal,
            series_falhadas: sessao.execucoes.filter(e => e.falhou).length,
            media_peso_por_serie: totalSeries > 0 ? Math.round(pesoTotal / totalSeries) : 0
        };
    }
    
    static formatarTempo(minutos) {
        const h = Math.floor(minutos / 60);
        const m = Math.round(minutos % 60);
        return h > 0 ? `${h}h ${m}min` : `${m}min`;
    }
    
    static gerarIdSessao() {
        return `treino_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    static gerarIdTemporario() {
        return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    }
    
    static calcularSemana(data) {
        const inicioAno = new Date(data.getFullYear(), 0, 1);
        const diasDoAno = Math.floor((data - inicioAno) / (24 * 60 * 60 * 1000));
        return Math.ceil((diasDoAno + inicioAno.getDay() + 1) / 7);
    }
    
    // Verificar se há sessão ativa (para proteção)
    static temSessaoAtiva() {
        const sessao = this.obterSessaoAtiva();
        return sessao && sessao.status === 'em_andamento';
    }
    
    // Recuperar sessão abandonada (para casos de crash/reload)
    static recuperarSessaoAbandonada() {
        const sessao = this.obterSessaoAtiva();
        
        if (!sessao || sessao.status !== 'em_andamento') {
            return null;
        }
        
        const agora = new Date();
        const ultimaAtividade = new Date(sessao.ultima_atividade || sessao.data_inicio);
        const tempoInativo = (agora - ultimaAtividade) / (1000 * 60 * 60); // horas
        
        // Se mais de 4 horas inativo, considerar abandonado
        if (tempoInativo > 4) {
            this.marcarTreinoComoFalta('Sessão abandonada por mais de 4 horas');
            return null;
        }
        
        return sessao;
    }
}

export default TreinoCacheService;