-- SQL para criar a view v_planejamento_completo no Supabase
-- Execute este script no SQL Editor do Supabase Dashboard

-- Primeiro, verificar se a view já existe e removê-la se necessário
DROP VIEW IF EXISTS v_planejamento_completo;

-- Criar a view com JOIN otimizado
CREATE OR REPLACE VIEW v_planejamento_completo AS
SELECT 
    -- Campos do planejamento semanal
    ps.id,
    ps.usuario_id,
    ps.ano,
    ps.semana,
    ps.dia_semana,
    ps.tipo_atividade,
    ps.numero_treino,
    ps.concluido,
    ps.data_conclusao,
    ps.created_at,
    ps.updated_at,
    
    -- Campos do protocolo de treinamento
    upt.protocolo_treinamento_id,
    upt.semana_atual as protocolo_semana_atual,
    upt.data_inicio as protocolo_data_inicio,
    upt.status as protocolo_status,
    
    -- Campos do protocolo
    pt.nome as protocolo_nome,
    pt.descricao as protocolo_descricao,
    pt.dias_por_semana,
    pt.total_treinos,
    pt.nivel_dificuldade
    
FROM planejamento_semanal ps
LEFT JOIN usuario_plano_treino upt 
    ON ps.usuario_id = upt.usuario_id 
    AND upt.status = 'ativo'
LEFT JOIN protocolos_treinamento pt 
    ON upt.protocolo_treinamento_id = pt.id
ORDER BY ps.usuario_id, ps.ano DESC, ps.semana DESC, ps.dia_semana;

-- Comentário da view
COMMENT ON VIEW v_planejamento_completo IS 
'View que combina planejamento semanal com dados do protocolo ativo do usuário';

-- Verificar se a view foi criada corretamente
SELECT 
    viewname, 
    viewowner, 
    definition 
FROM pg_views 
WHERE viewname = 'v_planejamento_completo';

-- Teste básico da view
SELECT * FROM v_planejamento_completo LIMIT 5;

-- Verificar estrutura da view
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'v_planejamento_completo' 
ORDER BY ordinal_position;