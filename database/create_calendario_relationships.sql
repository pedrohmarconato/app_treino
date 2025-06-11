-- Script SQL para criar relacionamentos da tabela d_calendario com outras tabelas
-- Execute após criar a tabela d_calendario

-- 1. Atualizar a tabela planejamento_semanal para incluir referência ao calendário
ALTER TABLE planejamento_semanal 
ADD COLUMN IF NOT EXISTS calendario_id BIGINT,
ADD CONSTRAINT fk_planejamento_calendario 
    FOREIGN KEY (calendario_id) REFERENCES d_calendario(id);

-- Criar índice para otimizar joins
CREATE INDEX IF NOT EXISTS idx_planejamento_calendario_id 
ON planejamento_semanal(calendario_id);

-- 2. Atualizar a tabela usuario_plano_treino para incluir referência da semana atual do calendário
ALTER TABLE usuario_plano_treino 
ADD COLUMN IF NOT EXISTS calendario_semana_atual_id BIGINT,
ADD CONSTRAINT fk_usuario_plano_calendario 
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

-- 6. Função para atualizar semana atual automaticamente
CREATE OR REPLACE FUNCTION atualizar_semana_atual_treino(
    p_usuario_id INTEGER,
    p_nova_semana_treino INTEGER,
    p_percentual_1rm DECIMAL(5,2)
)
RETURNS BOOLEAN AS $BODY$
DECLARE
    calendario_id_atual BIGINT;
    semana_ano_atual INTEGER;
    ano_atual INTEGER;
BEGIN
    -- Obter semana e ano atuais
    semana_ano_atual := EXTRACT(WEEK FROM CURRENT_DATE);
    ano_atual := EXTRACT(YEAR FROM CURRENT_DATE);
    
    -- Remover marca de semana atual anterior
    UPDATE d_calendario SET eh_semana_atual = FALSE WHERE eh_semana_atual = TRUE;
    
    -- Marcar nova semana atual no calendário
    UPDATE d_calendario 
    SET 
        semana_treino = p_nova_semana_treino,
        percentual_1rm = p_percentual_1rm,
        eh_semana_atual = TRUE
    WHERE semana_ano = semana_ano_atual 
      AND ano = ano_atual
    RETURNING id INTO calendario_id_atual;
    
    -- Atualizar referência na tabela usuario_plano_treino
    UPDATE usuario_plano_treino 
    SET 
        calendario_semana_atual_id = calendario_id_atual,
        semana_atual = p_nova_semana_treino
    WHERE usuario_id = p_usuario_id 
      AND status = 'ativo';
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$BODY$ LANGUAGE plpgsql;

-- 7. Função para sincronizar planejamento_semanal com d_calendario
CREATE OR REPLACE FUNCTION sincronizar_planejamento_calendario()
RETURNS INTEGER AS $SYNC$
DECLARE
    contador INTEGER := 0;
    registro RECORD;
BEGIN
    -- Atualizar registros do planejamento_semanal que não têm calendário_id
    FOR registro IN 
        SELECT ps.id, ps.ano, ps.semana, ps.dia_semana
        FROM planejamento_semanal ps
        WHERE ps.calendario_id IS NULL
    LOOP
        -- Encontrar a data correspondente no calendário
        UPDATE planejamento_semanal ps
        SET calendario_id = (
            SELECT cal.id 
            FROM d_calendario cal 
            WHERE cal.ano = registro.ano 
              AND cal.semana_ano = registro.semana 
              AND cal.dia_semana = registro.dia_semana
            LIMIT 1
        )
        WHERE ps.id = registro.id;
        
        contador := contador + 1;
    END LOOP;
    
    RETURN contador;
END;
$SYNC$ LANGUAGE plpgsql;

-- Executar sincronização inicial
SELECT sincronizar_planejamento_calendario();

-- Comentários nas views
COMMENT ON VIEW v_planejamento_completo_com_calendario IS 
'View completa que combina planejamento, calendário e protocolo de treino';

COMMENT ON VIEW v_semana_atual_treino IS 
'View que mostra informações da semana atual de treino para cada usuário';

COMMENT ON VIEW v_planejamento_semana_atual IS 
'View que mostra o planejamento da semana atual de treino';

-- Exemplo de uso: definir semana 2 como atual com 80% de 1RM para usuário 1
-- SELECT atualizar_semana_atual_treino(1, 2, 80.00);

-- Verificar resultados
SELECT 'd_calendario criada e configurada' as status;
SELECT COUNT(*) as total_registros FROM d_calendario;
SELECT COUNT(*) as registros_atualizados FROM planejamento_semanal WHERE calendario_id IS NOT NULL;