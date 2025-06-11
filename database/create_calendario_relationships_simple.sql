-- Script SQL simplificado para criar relacionamentos da tabela d_calendario
-- Execute após criar a tabela d_calendario

-- 1. Atualizar a tabela planejamento_semanal para incluir referência ao calendário
ALTER TABLE planejamento_semanal 
ADD COLUMN IF NOT EXISTS calendario_id BIGINT;

ALTER TABLE planejamento_semanal 
ADD CONSTRAINT IF NOT EXISTS fk_planejamento_calendario 
    FOREIGN KEY (calendario_id) REFERENCES d_calendario(id);

-- Criar índice para otimizar joins
CREATE INDEX IF NOT EXISTS idx_planejamento_calendario_id 
ON planejamento_semanal(calendario_id);

-- 2. Atualizar a tabela usuario_plano_treino para incluir referência da semana atual do calendário
ALTER TABLE usuario_plano_treino 
ADD COLUMN IF NOT EXISTS calendario_semana_atual_id BIGINT;

ALTER TABLE usuario_plano_treino 
ADD CONSTRAINT IF NOT EXISTS fk_usuario_plano_calendario 
    FOREIGN KEY (calendario_semana_atual_id) REFERENCES d_calendario(id);

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_usuario_plano_calendario_semana 
ON usuario_plano_treino(calendario_semana_atual_id);

-- 3. Criar view atualizada que inclui dados do calendário
DROP VIEW IF EXISTS v_planejamento_completo_com_calendario;

CREATE OR REPLACE VIEW v_planejamento_completo_com_calendario AS
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
    
    -- Campos do calendário
    cal.data_completa,
    cal.semana_treino,
    cal.percentual_1rm,
    cal.eh_semana_atual,
    cal.eh_semana_ativa,
    
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
    pt.duracao_meses,
    pt.total_semanas,
    
    -- Calendário da semana atual do protocolo
    cal_atual.semana_treino as semana_atual_treino,
    cal_atual.percentual_1rm as percentual_1rm_atual
    
FROM planejamento_semanal ps
LEFT JOIN d_calendario cal 
    ON ps.calendario_id = cal.id
LEFT JOIN usuario_plano_treino upt 
    ON ps.usuario_id = upt.usuario_id 
    AND upt.status = 'ativo'
LEFT JOIN d_calendario cal_atual 
    ON upt.calendario_semana_atual_id = cal_atual.id
LEFT JOIN protocolos_treinamento pt 
    ON upt.protocolo_treinamento_id = pt.id
ORDER BY ps.usuario_id, ps.ano DESC, ps.semana DESC, ps.dia_semana;

-- 4. Criar view para facilitar consulta da semana atual
CREATE OR REPLACE VIEW v_semana_atual_treino AS
SELECT 
    cal.id as calendario_id,
    cal.data_completa,
    cal.ano,
    cal.semana_ano,
    cal.semana_treino,
    cal.percentual_1rm,
    upt.usuario_id,
    upt.protocolo_treinamento_id,
    pt.nome as protocolo_nome
FROM d_calendario cal
JOIN usuario_plano_treino upt ON cal.id = upt.calendario_semana_atual_id
JOIN protocolos_treinamento pt ON upt.protocolo_treinamento_id = pt.id
WHERE cal.eh_semana_atual = TRUE 
  AND upt.status = 'ativo';

-- 5. Criar view para consultar planejamento da semana atual
CREATE OR REPLACE VIEW v_planejamento_semana_atual AS
SELECT 
    ps.*,
    cal.data_completa,
    cal.semana_treino,
    cal.percentual_1rm,
    pt.nome as protocolo_nome
FROM planejamento_semanal ps
JOIN d_calendario cal ON ps.calendario_id = cal.id
JOIN usuario_plano_treino upt ON ps.usuario_id = upt.usuario_id 
JOIN protocolos_treinamento pt ON upt.protocolo_treinamento_id = pt.id
WHERE cal.eh_semana_atual = TRUE 
  AND upt.status = 'ativo'
ORDER BY ps.dia_semana;

-- Comentários nas views
COMMENT ON VIEW v_planejamento_completo_com_calendario IS 
'View completa que combina planejamento, calendário e protocolo de treino';

COMMENT ON VIEW v_semana_atual_treino IS 
'View que mostra informações da semana atual de treino para cada usuário';

COMMENT ON VIEW v_planejamento_semana_atual IS 
'View que mostra o planejamento da semana atual de treino';

-- Verificar resultados
SELECT 'd_calendario criada e configurada' as status;