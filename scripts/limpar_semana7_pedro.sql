-- =====================================================
-- 🗑️ LIMPAR SEMANA 7 DO PEDRO - TABELA EXECUCAO_EXERCICIO_USUARIO
-- =====================================================
-- OBJETIVO: Deletar todas as execuções da semana 7 do Pedro
-- ANTES DE: Inserir os novos dados da semana 7
-- =====================================================

DO $$
DECLARE
    total_deletados INTEGER := 0;
    rec_count INTEGER;
    rec RECORD;
BEGIN
    RAISE NOTICE '🗑️ Iniciando limpeza da semana 7 do Pedro...';
    
    -- ===== VERIFICAR O QUE EXISTE ANTES DE DELETAR =====
    SELECT COUNT(*) INTO rec_count
    FROM execucao_exercicio_usuario eeu
    INNER JOIN protocolo_treinos pt ON pt.id = eeu.protocolo_treino_id
    WHERE eeu.usuario_id = 1  -- Pedro
        AND pt.semana_referencia = 7;
    
    RAISE NOTICE '📊 Execuções encontradas da semana 7: %', rec_count;
    
    -- Se não houver registros, não precisa deletar
    IF rec_count = 0 THEN
        RAISE NOTICE '✅ Nenhuma execução da semana 7 encontrada. Nada para deletar.';
        RETURN;
    END IF;
    
    -- ===== MOSTRAR O QUE SERÁ DELETADO =====
    RAISE NOTICE '🔍 Detalhes das execuções que serão deletadas:';
    
    FOR rec IN (
        SELECT 
            e.nome as exercicio,
            COUNT(*) as total_series,
            MIN(eeu.data_execucao::date) as primeira_data,
            MAX(eeu.data_execucao::date) as ultima_data
        FROM execucao_exercicio_usuario eeu
        INNER JOIN protocolo_treinos pt ON pt.id = eeu.protocolo_treino_id
        INNER JOIN exercicios e ON e.id = eeu.exercicio_id
        WHERE eeu.usuario_id = 1
            AND pt.semana_referencia = 7
        GROUP BY e.nome
        ORDER BY e.nome
    )
    LOOP
        RAISE NOTICE '   %: % séries (% a %)', 
            rec.exercicio, rec.total_series, rec.primeira_data, rec.ultima_data;
    END LOOP;
    
    -- ===== DELETAR EXECUÇÕES DA SEMANA 7 =====
    DELETE FROM execucao_exercicio_usuario 
    WHERE id IN (
        SELECT eeu.id
        FROM execucao_exercicio_usuario eeu
        INNER JOIN protocolo_treinos pt ON pt.id = eeu.protocolo_treino_id
        WHERE eeu.usuario_id = 1  -- Pedro
            AND pt.semana_referencia = 7
    );
    
    -- Contar quantos foram deletados
    GET DIAGNOSTICS total_deletados = ROW_COUNT;
    
    -- ===== RESETAR PLANEJAMENTO SEMANAL =====
    -- Marcar treinos da semana 7 como não concluídos
    UPDATE planejamento_semanal 
    SET 
        concluido = false,
        data_conclusao = NULL,
        post_workout = NULL
    WHERE usuario_id = 1
        AND ano = 2025
        AND semana_treino = 7;
    
    -- ===== RELATÓRIO FINAL =====
    RAISE NOTICE '✅ LIMPEZA CONCLUÍDA!';
    RAISE NOTICE '🗑️ Total de execuções deletadas: %', total_deletados;
    RAISE NOTICE '📅 Planejamento semanal resetado para semana 7';
    RAISE NOTICE '✨ Pronto para inserir novos dados da semana 7';
    
END $$;

-- =====================================================
-- 📊 VERIFICAÇÃO FINAL - CONFIRMAR QUE FOI LIMPO
-- =====================================================

-- Verificar se ainda existem execuções da semana 7
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ LIMPO - Nenhuma execução da semana 7 encontrada'
        ELSE '❌ PROBLEMA - Ainda existem ' || COUNT(*) || ' execuções da semana 7'
    END as status_limpeza
FROM execucao_exercicio_usuario eeu
INNER JOIN protocolo_treinos pt ON pt.id = eeu.protocolo_treino_id
WHERE eeu.usuario_id = 1
    AND pt.semana_referencia = 7;

-- Verificar status do planejamento semanal
SELECT 
    '📅 STATUS PLANEJAMENTO PÓS-LIMPEZA' as info,
    tipo_atividade,
    concluido,
    data_conclusao,
    post_workout
FROM planejamento_semanal
WHERE usuario_id = 1
    AND ano = 2025
    AND semana_treino = 7
ORDER BY tipo_atividade;

-- Contar execuções por semana para verificar integridade
SELECT 
    '📊 EXECUÇÕES POR SEMANA (Verificação)' as info,
    pt.semana_referencia as semana,
    COUNT(*) as total_execucoes
FROM execucao_exercicio_usuario eeu
INNER JOIN protocolo_treinos pt ON pt.id = eeu.protocolo_treino_id
WHERE eeu.usuario_id = 1
GROUP BY pt.semana_referencia
ORDER BY pt.semana_referencia;