-- Debug script to check week 5 data
-- Check what's in planejamento_semanal for week 5

-- First, check the current protocol week for the user
SELECT 
    id,
    usuario_id,
    protocolo_id,
    semana_atual,
    status,
    data_inicio
FROM usuario_plano_treino
WHERE status = 'ativo';

-- Check what's saved in planejamento_semanal for week 5
SELECT 
    id,
    usuario_id,
    ano,
    semana,
    semana_treino,
    dia_semana,
    tipo_atividade,
    concluido,
    protocolo_treinamento_id
FROM planejamento_semanal
WHERE semana = 5
ORDER BY usuario_id, dia_semana;

-- Check what's saved for the current year and all weeks for active users
SELECT 
    usuario_id,
    ano,
    semana,
    semana_treino,
    COUNT(*) as dias_planejados
FROM planejamento_semanal
WHERE ano = 2025
GROUP BY usuario_id, ano, semana, semana_treino
ORDER BY usuario_id, semana;

-- Check if there's a mismatch between semana and semana_treino
SELECT 
    usuario_id,
    ano,
    semana,
    semana_treino,
    dia_semana,
    tipo_atividade
FROM planejamento_semanal
WHERE ano = 2025 
    AND semana != semana_treino
ORDER BY usuario_id, semana, dia_semana;