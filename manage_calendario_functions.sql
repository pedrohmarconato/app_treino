-- Funções para gerenciar a tabela D_calendario
-- Execute após criar e popular a tabela

-- 1. Função simples para definir semana atual (sem dollar quotes)
-- Use esta query diretamente para definir uma semana como atual:

-- Primeiro, remover marca de semana atual anterior
-- UPDATE D_calendario SET eh_semana_atual = FALSE WHERE eh_semana_atual = TRUE;

-- Depois, marcar nova semana atual (exemplo: semana atual do ano com 80% de 1RM)
-- UPDATE D_calendario 
-- SET 
--     semana_treino = 2,
--     percentual_1rm = 80.00,
--     eh_semana_atual = TRUE
-- WHERE semana_ano = EXTRACT(WEEK FROM CURRENT_DATE) 
--   AND ano = EXTRACT(YEAR FROM CURRENT_DATE);

-- 2. Query para sincronizar planejamento_semanal com D_calendario
-- Execute esta query para conectar registros existentes:

-- UPDATE planejamento_semanal 
-- SET calendario_id = (
--     SELECT cal.id 
--     FROM D_calendario cal 
--     WHERE cal.ano = planejamento_semanal.ano 
--       AND cal.semana_ano = planejamento_semanal.semana 
--       AND cal.dia_semana = planejamento_semanal.dia_semana
--     LIMIT 1
-- )
-- WHERE calendario_id IS NULL;

-- 3. Query para definir percentuais de 1RM por semana de treino
-- Exemplo: definir percentuais progressivos

-- Semana 1 do protocolo = 75% 1RM
-- UPDATE D_calendario 
-- SET semana_treino = 1, percentual_1rm = 75.00
-- WHERE semana_ano BETWEEN 1 AND 4 AND ano = 2025;

-- Semana 2 do protocolo = 80% 1RM  
-- UPDATE D_calendario 
-- SET semana_treino = 2, percentual_1rm = 80.00
-- WHERE semana_ano BETWEEN 5 AND 8 AND ano = 2025;

-- Semana 3 do protocolo = 85% 1RM
-- UPDATE D_calendario 
-- SET semana_treino = 3, percentual_1rm = 85.00
-- WHERE semana_ano BETWEEN 9 AND 12 AND ano = 2025;

-- 4. Queries úteis para consulta

-- Ver semana atual configurada
SELECT * FROM D_calendario 
WHERE eh_semana_atual = TRUE;

-- Ver planejamento com dados do calendário
SELECT 
    ps.id,
    ps.usuario_id,
    ps.tipo_atividade,
    ps.numero_treino,
    cal.data_completa,
    cal.semana_treino,
    cal.percentual_1rm,
    cal.eh_semana_atual
FROM planejamento_semanal ps
LEFT JOIN D_calendario cal ON ps.calendario_id = cal.id
WHERE ps.usuario_id = 1
ORDER BY cal.data_completa;

-- Ver protocolo com semana atual do calendário
SELECT 
    upt.usuario_id,
    pt.nome as protocolo_nome,
    upt.semana_atual,
    cal.semana_treino,
    cal.percentual_1rm,
    cal.data_completa
FROM usuario_plano_treino upt
JOIN protocolos_treinamento pt ON upt.protocolo_treinamento_id = pt.id
LEFT JOIN D_calendario cal ON upt.calendario_semana_atual_id = cal.id
WHERE upt.status = 'ativo';

SELECT 'Funções de gerenciamento configuradas!' as resultado;