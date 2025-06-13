-- View simplificada que funciona garantidamente
-- Foca no essencial para resolver o problema do dashboard

CREATE OR REPLACE VIEW vw_treino_completo AS
SELECT 
    -- Identificação básica
    eeu.id as execucao_id,
    eeu.usuario_id,
    eeu.exercicio_id,
    eeu.data_execucao,
    DATE(eeu.data_execucao) as data_treino,
    EXTRACT(YEAR FROM eeu.data_execucao) as ano,
    EXTRACT(WEEK FROM eeu.data_execucao) as semana,
    EXTRACT(DOW FROM eeu.data_execucao) as dia_semana,
    
    -- Dados do exercício  
    ex.nome as exercicio_nome,
    ex.grupo_muscular,
    ex.equipamento,
    ex.grupo_muscular as tipo_atividade,
    
    -- Dados da execução
    eeu.serie_numero,
    COALESCE(eeu.peso_utilizado, 0) as peso_utilizado,
    COALESCE(eeu.repeticoes, 0) as repeticoes,
    COALESCE(eeu.falhou, false) as falhou,
    COALESCE(ex.tempo_descanso_padrao, 60) as tempo_descanso,
    eeu.observacoes as observacoes_execucao,
    
    -- Métricas básicas calculadas
    (COALESCE(eeu.peso_utilizado, 0) * COALESCE(eeu.repeticoes, 0)) as volume_serie,
    
    -- 1RM estimado usando fórmula de Brzycki
    CASE 
        WHEN COALESCE(eeu.repeticoes, 0) > 0 AND COALESCE(eeu.repeticoes, 0) <= 12 AND COALESCE(eeu.peso_utilizado, 0) > 0 THEN
            ROUND(COALESCE(eeu.peso_utilizado, 0) / (1.0278 - (0.0278 * COALESCE(eeu.repeticoes, 0))), 2)
        ELSE COALESCE(eeu.peso_utilizado, 0)
    END as rm_estimado,
    
    -- Intensidade relativa
    CASE 
        WHEN COALESCE(u1rm.rm_calculado, 0) > 0 AND COALESCE(eeu.peso_utilizado, 0) > 0 THEN
            ROUND((COALESCE(eeu.peso_utilizado, 0) / COALESCE(u1rm.rm_calculado, 1)) * 100, 1)
        ELSE NULL
    END as intensidade_percentual,
    
    -- Dados do 1RM do usuário
    u1rm.rm_calculado as rm_usuario,
    u1rm.data_teste as data_ultimo_teste,
    
    -- Tempo estimado por exercício
    CASE ex.grupo_muscular
        WHEN 'Peito' THEN (COALESCE(ex.tempo_descanso_padrao, 90) + 40)
        WHEN 'Costas' THEN (COALESCE(ex.tempo_descanso_padrao, 90) + 40)
        WHEN 'Pernas' THEN (COALESCE(ex.tempo_descanso_padrao, 120) + 50)
        WHEN 'Ombros' THEN (COALESCE(ex.tempo_descanso_padrao, 60) + 35)
        WHEN 'Braços' THEN (COALESCE(ex.tempo_descanso_padrao, 45) + 30)
        WHEN 'Core' THEN (COALESCE(ex.tempo_descanso_padrao, 30) + 25)
        ELSE (COALESCE(ex.tempo_descanso_padrao, 60) + 35)
    END as tempo_estimado_serie_segundos,
    
    -- Progressão simples
    LAG(COALESCE(eeu.peso_utilizado, 0)) OVER (
        PARTITION BY eeu.usuario_id, eeu.exercicio_id, eeu.serie_numero 
        ORDER BY eeu.data_execucao
    ) as peso_execucao_anterior,
    
    -- Dados do planejamento
    eeu.protocolo_treino_id,
    COALESCE(ps.concluido, false) as planejamento_concluido,
    ps.data_conclusao,
    ps.observacoes as observacoes_planejamento,
    
    -- Status de qualidade simples
    CASE 
        WHEN COALESCE(eeu.falhou, false) = true THEN 'Falha'
        WHEN (COALESCE(eeu.peso_utilizado, 0) * COALESCE(eeu.repeticoes, 0)) > 0 THEN 'Concluido'
        ELSE 'Sem dados'
    END as qualidade_performance,
    
    -- Timestamps
    eeu.created_at,
    eeu.updated_at

FROM execucao_exercicio_usuario eeu
INNER JOIN exercicios ex ON eeu.exercicio_id = ex.id
LEFT JOIN usuario_1rm u1rm ON (
    eeu.usuario_id = u1rm.usuario_id 
    AND eeu.exercicio_id = u1rm.exercicio_id 
    AND u1rm.status = 'ativo'
    AND u1rm.data_teste = (
        SELECT MAX(data_teste) 
        FROM usuario_1rm u2 
        WHERE u2.usuario_id = eeu.usuario_id 
        AND u2.exercicio_id = eeu.exercicio_id 
        AND u2.status = 'ativo'
    )
)
LEFT JOIN planejamento_semanal ps ON (
    eeu.usuario_id = ps.usuario_id
    AND EXTRACT(YEAR FROM eeu.data_execucao) = ps.ano
    AND EXTRACT(WEEK FROM eeu.data_execucao) = ps.semana  
    AND EXTRACT(DOW FROM eeu.data_execucao) = ps.dia_semana
    AND ex.grupo_muscular = ps.tipo_atividade
)
ORDER BY eeu.data_execucao DESC, eeu.exercicio_id, eeu.serie_numero;

-- Índices essenciais
CREATE INDEX IF NOT EXISTS idx_vw_treino_usuario_data 
ON execucao_exercicio_usuario(usuario_id, data_execucao);

CREATE INDEX IF NOT EXISTS idx_vw_treino_exercicio_serie 
ON execucao_exercicio_usuario(usuario_id, exercicio_id, serie_numero, data_execucao);

-- Comentários
COMMENT ON VIEW vw_treino_completo IS 'View simplificada para consulta de treinos com métricas essenciais.';