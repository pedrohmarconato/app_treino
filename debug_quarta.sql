-- Queries de diagnóstico para quarta-feira
-- Execute estas queries no painel do Supabase para investigar

-- 1. Verificar se a view existe e tem dados
SELECT COUNT(*) as total_registros_view
FROM vw_treino_completo 
WHERE usuario_id = 1;

-- 2. Verificar dados da quarta-feira especificamente
SELECT *
FROM vw_treino_completo 
WHERE usuario_id = 1 
  AND data_treino = '2025-06-11';  -- Substitua pela data da quarta

-- 3. Verificar execuções diretas na tabela original (quarta-feira)
SELECT 
    id, 
    usuario_id, 
    exercicio_id, 
    data_execucao, 
    peso_utilizado, 
    repeticoes, 
    serie_numero,
    protocolo_treino_id
FROM execucao_exercicio_usuario 
WHERE usuario_id = 1 
  AND data_execucao >= '2025-06-11T00:00:00'
  AND data_execucao < '2025-06-12T00:00:00';

-- 4. Verificar se há dados em outras datas próximas
SELECT 
    DATE(data_execucao) as data_treino,
    COUNT(*) as total_series,
    COUNT(DISTINCT exercicio_id) as total_exercicios
FROM execucao_exercicio_usuario 
WHERE usuario_id = 1 
  AND data_execucao >= '2025-06-09T00:00:00'
  AND data_execucao < '2025-06-14T00:00:00'
GROUP BY DATE(data_execucao)
ORDER BY data_treino;

-- 5. Verificar planejamento da quarta-feira
SELECT *
FROM planejamento_semanal 
WHERE usuario_id = 1 
  AND ano = 2025 
  AND semana = 24  -- Ajuste conforme necessário
  AND dia_semana = 3;  -- 3 = quarta-feira

-- 6. Query exata que o TreinoViewService está fazendo (SEM filtro de grupo)
SELECT 
    execucao_id,
    usuario_id,
    exercicio_id,
    data_execucao,
    data_treino,
    exercicio_nome,
    grupo_muscular,
    peso_utilizado,
    repeticoes,
    volume_serie
FROM vw_treino_completo 
WHERE usuario_id = 1 
  AND data_treino = '2025-06-11'
ORDER BY exercicio_nome ASC, serie_numero ASC;

-- 7. Query exata que o TreinoViewService está fazendo (COM filtro de grupo - exemplo)
SELECT 
    execucao_id,
    usuario_id,
    exercicio_id,
    data_execucao,
    data_treino,
    exercicio_nome,
    grupo_muscular,
    peso_utilizado,
    repeticoes,
    volume_serie
FROM vw_treino_completo 
WHERE usuario_id = 1 
  AND data_treino = '2025-06-11'
  AND grupo_muscular = 'Costas'  -- Substitua pelo grupo planejado
ORDER BY exercicio_nome ASC, serie_numero ASC;

-- 8. Verificar todos os grupos musculares disponíveis para o usuário
SELECT DISTINCT grupo_muscular, COUNT(*) as total
FROM vw_treino_completo 
WHERE usuario_id = 1
GROUP BY grupo_muscular
ORDER BY grupo_muscular;

-- 9. Verificar formato das datas na view vs tabela original
SELECT 
    'VIEW' as fonte,
    data_treino,
    COUNT(*) as registros
FROM vw_treino_completo 
WHERE usuario_id = 1
GROUP BY data_treino

UNION ALL

SELECT 
    'TABELA' as fonte,
    DATE(data_execucao) as data_treino,
    COUNT(*) as registros
FROM execucao_exercicio_usuario 
WHERE usuario_id = 1
GROUP BY DATE(data_execucao)

ORDER BY data_treino DESC, fonte;

-- 10. Query de fallback exata (busca direta)
SELECT 
    id, 
    usuario_id, 
    exercicio_id, 
    data_execucao, 
    peso_utilizado, 
    repeticoes, 
    serie_numero, 
    falhou
FROM execucao_exercicio_usuario
WHERE usuario_id = 1
  AND data_execucao >= '2025-06-11T00:00:00'
  AND data_execucao < '2025-06-11T23:59:59';