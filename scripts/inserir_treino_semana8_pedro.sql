-- Script Semana 8 - Pedro (INCLUINDO PEITO)
-- Progressão: Semana 6 (80%) → Semana 7 (83%) → Semana 8 (86% do 1RM)
-- Dados reais: Leg Press (ID 402): 373.33kg | Agachamento (ID 401): 150kg estimado

DO $$
DECLARE
    v_usuario_id INTEGER := 1;
    v_protocolo_id INTEGER := 1;
    v_hora_inicio TIME;
BEGIN
    RAISE NOTICE 'Iniciando inserção dos treinos da SEMANA 8 (86%% do 1RM) - COM PEITO';
    
    -- =====================================================
    -- TREINO 1: PEITO - Terça 15/07
    -- =====================================================
    v_hora_inicio := TIME '07:00:00';
    
    -- Supino Reto (ID 101): 1RM 60kg → 86% = 51.6kg
    FOR serie IN 1..4 LOOP
        INSERT INTO execucao_exercicio_usuario 
        (usuario_id, protocolo_treino_id, exercicio_id, data_execucao, peso_utilizado, repeticoes, serie_numero, falhou)
        SELECT 
            1, pt.id, 101,
            ('2025-07-15 ' || v_hora_inicio + (serie-1) * interval '3 minutes')::timestamp AT TIME ZONE 'America/Sao_Paulo',
            51.6, 5, serie, false
        FROM protocolo_treinos pt
        WHERE pt.protocolo_id = 1 AND pt.semana_referencia = 8 AND pt.exercicio_id = 101
        LIMIT 1;
    END LOOP;
    v_hora_inicio := v_hora_inicio + interval '12 minutes';
    
    -- Supino Inclinado (ID 102): 1RM 50kg → 86% = 43kg
    FOR serie IN 1..3 LOOP
        INSERT INTO execucao_exercicio_usuario 
        (usuario_id, protocolo_treino_id, exercicio_id, data_execucao, peso_utilizado, repeticoes, serie_numero, falhou)
        SELECT 
            1, pt.id, 102,
            ('2025-07-15 ' || v_hora_inicio + (serie-1) * interval '2.5 minutes')::timestamp AT TIME ZONE 'America/Sao_Paulo',
            43, 5, serie, false
        FROM protocolo_treinos pt
        WHERE pt.protocolo_id = 1 AND pt.semana_referencia = 8 AND pt.exercicio_id = 102
        LIMIT 1;
    END LOOP;
    v_hora_inicio := v_hora_inicio + interval '8 minutes';
    
    -- Crucifixo (ID 103): 1RM 35kg → 86% = 30kg
    FOR serie IN 1..3 LOOP
        INSERT INTO execucao_exercicio_usuario 
        (usuario_id, protocolo_treino_id, exercicio_id, data_execucao, peso_utilizado, repeticoes, serie_numero, falhou)
        SELECT 
            1, pt.id, 103,
            ('2025-07-15 ' || v_hora_inicio + (serie-1) * interval '90 seconds')::timestamp AT TIME ZONE 'America/Sao_Paulo',
            30, 5, serie, false
        FROM protocolo_treinos pt
        WHERE pt.protocolo_id = 1 AND pt.semana_referencia = 8 AND pt.exercicio_id = 103
        LIMIT 1;
    END LOOP;
    
    -- Marcar treino de Peito como concluído
    UPDATE planejamento_semanal 
    SET concluido = true, data_conclusao = '2025-07-15', pre_workout = '4'::jsonb, post_workout = '5'::jsonb 
    WHERE usuario_id = 1 AND ano = 2025 AND semana_treino = 8 AND tipo_atividade = 'Peito';
    
    -- =====================================================
    -- TREINO 2: PERNAS - Quarta 16/07
    -- =====================================================
    v_hora_inicio := TIME '07:00:00';
    
    -- Agachamento (ID 401): 1RM 150kg → 86% = 129kg
    FOR serie IN 1..4 LOOP
        INSERT INTO execucao_exercicio_usuario 
        (usuario_id, protocolo_treino_id, exercicio_id, data_execucao, peso_utilizado, repeticoes, serie_numero, falhou)
        SELECT 
            1, pt.id, 401,
            ('2025-07-16 ' || v_hora_inicio + (serie-1) * interval '3 minutes')::timestamp AT TIME ZONE 'America/Sao_Paulo',
            129, 5, serie, false
        FROM protocolo_treinos pt
        WHERE pt.protocolo_id = 1 AND pt.semana_referencia = 8 AND pt.exercicio_id = 401
        LIMIT 1;
    END LOOP;
    v_hora_inicio := v_hora_inicio + interval '12 minutes';
    
    -- Leg Press (ID 402): 1RM 373.33kg → 86% = 321kg
    FOR serie IN 1..3 LOOP
        INSERT INTO execucao_exercicio_usuario 
        (usuario_id, protocolo_treino_id, exercicio_id, data_execucao, peso_utilizado, repeticoes, serie_numero, falhou)
        SELECT 
            1, pt.id, 402,
            ('2025-07-16 ' || v_hora_inicio + (serie-1) * interval '2 minutes')::timestamp AT TIME ZONE 'America/Sao_Paulo',
            321, 5, serie, false
        FROM protocolo_treinos pt
        WHERE pt.protocolo_id = 1 AND pt.semana_referencia = 8 AND pt.exercicio_id = 402
        LIMIT 1;
    END LOOP;
    v_hora_inicio := v_hora_inicio + interval '8 minutes';
    
    -- Extensão Pernas (ID 403): 1RM 88.83kg → 86% = 76.5kg
    FOR serie IN 1..3 LOOP
        INSERT INTO execucao_exercicio_usuario 
        (usuario_id, protocolo_treino_id, exercicio_id, data_execucao, peso_utilizado, repeticoes, serie_numero, falhou)
        SELECT 
            1, pt.id, 403,
            ('2025-07-16 ' || v_hora_inicio + (serie-1) * interval '90 seconds')::timestamp AT TIME ZONE 'America/Sao_Paulo',
            76.5, 5, serie, false
        FROM protocolo_treinos pt
        WHERE pt.protocolo_id = 1 AND pt.semana_referencia = 8 AND pt.exercicio_id = 403
        LIMIT 1;
    END LOOP;
    v_hora_inicio := v_hora_inicio + interval '6 minutes';
    
    -- Flexão Pernas (ID 404): 1RM 101.33kg → 86% = 87kg
    FOR serie IN 1..3 LOOP
        INSERT INTO execucao_exercicio_usuario 
        (usuario_id, protocolo_treino_id, exercicio_id, data_execucao, peso_utilizado, repeticoes, serie_numero, falhou)
        SELECT 
            1, pt.id, 404,
            ('2025-07-16 ' || v_hora_inicio + (serie-1) * interval '90 seconds')::timestamp AT TIME ZONE 'America/Sao_Paulo',
            87, 5, serie, false
        FROM protocolo_treinos pt
        WHERE pt.protocolo_id = 1 AND pt.semana_referencia = 8 AND pt.exercicio_id = 404
        LIMIT 1;
    END LOOP;
    
    -- Marcar treino de Pernas como concluído
    UPDATE planejamento_semanal 
    SET concluido = true, data_conclusao = '2025-07-16', pre_workout = '4'::jsonb, post_workout = '5'::jsonb 
    WHERE usuario_id = 1 AND ano = 2025 AND semana_treino = 8 AND tipo_atividade = 'Pernas';
    
    -- =====================================================
    -- TREINO 3: OMBRO E BRAÇO - Quinta 17/07  
    -- =====================================================
    v_hora_inicio := TIME '07:00:00';
    
    -- Desenvolvimento Ombros (ID 301): 1RM 21kg → 86% = 18kg
    FOR serie IN 1..4 LOOP
        INSERT INTO execucao_exercicio_usuario 
        (usuario_id, protocolo_treino_id, exercicio_id, data_execucao, peso_utilizado, repeticoes, serie_numero, falhou)
        SELECT 
            1, pt.id, 301,
            ('2025-07-17 ' || v_hora_inicio + (serie-1) * interval '2 minutes')::timestamp AT TIME ZONE 'America/Sao_Paulo',
            18, 5, serie, false
        FROM protocolo_treinos pt
        WHERE pt.protocolo_id = 1 AND pt.semana_referencia = 8 AND pt.exercicio_id = 301
        LIMIT 1;
    END LOOP;
    v_hora_inicio := v_hora_inicio + interval '10 minutes';
    
    -- Elevação Lateral (ID 302): 1RM 30.07kg → 86% = 26kg
    FOR serie IN 1..3 LOOP
        INSERT INTO execucao_exercicio_usuario 
        (usuario_id, protocolo_treino_id, exercicio_id, data_execucao, peso_utilizado, repeticoes, serie_numero, falhou)
        SELECT 
            1, pt.id, 302,
            ('2025-07-17 ' || v_hora_inicio + (serie-1) * interval '90 seconds')::timestamp AT TIME ZONE 'America/Sao_Paulo',
            26, 5, serie, false
        FROM protocolo_treinos pt
        WHERE pt.protocolo_id = 1 AND pt.semana_referencia = 8 AND pt.exercicio_id = 302
        LIMIT 1;
    END LOOP;
    v_hora_inicio := v_hora_inicio + interval '6 minutes';
    
    -- Rosca Direta (ID 201): 1RM 37.33kg → 86% = 32kg
    FOR serie IN 1..3 LOOP
        INSERT INTO execucao_exercicio_usuario 
        (usuario_id, protocolo_treino_id, exercicio_id, data_execucao, peso_utilizado, repeticoes, serie_numero, falhou)
        SELECT 
            1, pt.id, 201,
            ('2025-07-17 ' || v_hora_inicio + (serie-1) * interval '90 seconds')::timestamp AT TIME ZONE 'America/Sao_Paulo',
            32, 5, serie, false
        FROM protocolo_treinos pt
        WHERE pt.protocolo_id = 1 AND pt.semana_referencia = 8 AND pt.exercicio_id = 201
        LIMIT 1;
    END LOOP;
    v_hora_inicio := v_hora_inicio + interval '6 minutes';
    
    -- Tríceps Pulley (ID 202): 1RM 54kg → 86% = 46.5kg
    FOR serie IN 1..3 LOOP
        INSERT INTO execucao_exercicio_usuario 
        (usuario_id, protocolo_treino_id, exercicio_id, data_execucao, peso_utilizado, repeticoes, serie_numero, falhou)
        SELECT 
            1, pt.id, 202,
            ('2025-07-17 ' || v_hora_inicio + (serie-1) * interval '90 seconds')::timestamp AT TIME ZONE 'America/Sao_Paulo',
            46.5, 5, serie, false
        FROM protocolo_treinos pt
        WHERE pt.protocolo_id = 1 AND pt.semana_referencia = 8 AND pt.exercicio_id = 202
        LIMIT 1;
    END LOOP;
    
    -- Marcar treino de Ombro e Braço como concluído
    UPDATE planejamento_semanal 
    SET concluido = true, data_conclusao = '2025-07-17', pre_workout = '4'::jsonb, post_workout = '4'::jsonb 
    WHERE usuario_id = 1 AND ano = 2025 AND semana_treino = 8 AND tipo_atividade = 'Ombro e Braço';
    
    -- =====================================================
    -- TREINO 4: COSTAS - Sábado 19/07
    -- =====================================================
    v_hora_inicio := TIME '07:00:00';
    
    -- Puxada Frontal (ID 305): 1RM 73kg → 86% = 62.5kg
    FOR serie IN 1..4 LOOP
        INSERT INTO execucao_exercicio_usuario 
        (usuario_id, protocolo_treino_id, exercicio_id, data_execucao, peso_utilizado, repeticoes, serie_numero, falhou)
        SELECT 
            1, pt.id, 305,
            ('2025-07-19 ' || v_hora_inicio + (serie-1) * interval '2.5 minutes')::timestamp AT TIME ZONE 'America/Sao_Paulo',
            62.5, 5, serie, false
        FROM protocolo_treinos pt
        WHERE pt.protocolo_id = 1 AND pt.semana_referencia = 8 AND pt.exercicio_id = 305
        LIMIT 1;
    END LOOP;
    v_hora_inicio := v_hora_inicio + interval '10 minutes';
    
    -- Remada Curvada (ID 306): 1RM 23.8kg → 86% = 20.5kg
    FOR serie IN 1..3 LOOP
        INSERT INTO execucao_exercicio_usuario 
        (usuario_id, protocolo_treino_id, exercicio_id, data_execucao, peso_utilizado, repeticoes, serie_numero, falhou)
        SELECT 
            1, pt.id, 306,
            ('2025-07-19 ' || v_hora_inicio + (serie-1) * interval '2.5 minutes')::timestamp AT TIME ZONE 'America/Sao_Paulo',
            20.5, 5, serie, false
        FROM protocolo_treinos pt
        WHERE pt.protocolo_id = 1 AND pt.semana_referencia = 8 AND pt.exercicio_id = 306
        LIMIT 1;
    END LOOP;
    v_hora_inicio := v_hora_inicio + interval '9 minutes';
    
    -- Remada Unilateral (ID 307): 1RM 28kg → 86% = 24kg
    FOR serie IN 1..3 LOOP
        INSERT INTO execucao_exercicio_usuario 
        (usuario_id, protocolo_treino_id, exercicio_id, data_execucao, peso_utilizado, repeticoes, serie_numero, falhou)
        SELECT 
            1, pt.id, 307,
            ('2025-07-19 ' || v_hora_inicio + (serie-1) * interval '90 seconds')::timestamp AT TIME ZONE 'America/Sao_Paulo',
            24, 5, serie, false
        FROM protocolo_treinos pt
        WHERE pt.protocolo_id = 1 AND pt.semana_referencia = 8 AND pt.exercicio_id = 307
        LIMIT 1;
    END LOOP;
    
    -- IMPORTANTE: Verificar se Rosca Martelo (ID 203) está no treino de Costas ou Ombro/Braço
    -- Se estiver em Costas, mover para este treino:
    
    -- Rosca Martelo (ID 203): 1RM 36.33kg → 86% = 31kg
    -- NOTA: Se este exercício estiver classificado como Costas na semana 8
    FOR serie IN 1..3 LOOP
        INSERT INTO execucao_exercicio_usuario 
        (usuario_id, protocolo_treino_id, exercicio_id, data_execucao, peso_utilizado, repeticoes, serie_numero, falhou)
        SELECT 
            1, pt.id, 203,
            ('2025-07-19 ' || v_hora_inicio + interval '6 minutes' + (serie-1) * interval '90 seconds')::timestamp AT TIME ZONE 'America/Sao_Paulo',
            31, 5, serie, false
        FROM protocolo_treinos pt
        WHERE pt.protocolo_id = 1 AND pt.semana_referencia = 8 AND pt.exercicio_id = 203
        LIMIT 1;
    END LOOP;
    
    -- Marcar treino de Costas como concluído
    UPDATE planejamento_semanal 
    SET concluido = true, data_conclusao = '2025-07-19', pre_workout = '4'::jsonb, post_workout = '4'::jsonb 
    WHERE usuario_id = 1 AND ano = 2025 AND semana_treino = 8 AND tipo_atividade = 'Costas';
    
    -- =====================================================
    -- RELATÓRIO FINAL
    -- =====================================================
    RAISE NOTICE '✅ SEMANA 8 INSERIDA COM SUCESSO!';
    RAISE NOTICE 'Progressão: 86%% do 1RM (aumento de 3%% da semana 7)';
    RAISE NOTICE 'Treinos executados: 4 (Peito, Pernas, Ombro e Braço, Costas)';
    RAISE NOTICE '✅ TREINO DE PEITO INCLUÍDO conforme solicitado';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Pesos utilizados (86%% do 1RM):';
    RAISE NOTICE '   💪 Peito: Supino Reto 51.6kg | Supino Inclinado 43kg | Crucifixo 30kg';
    RAISE NOTICE '   🦵 Pernas: Agachamento 129kg | Leg Press 321kg';
    RAISE NOTICE '   💪 Ombro/Braço: Desenvolvimento 18kg | Rosca 32kg';
    RAISE NOTICE '   🔙 Costas: Puxada 62.5kg | Remadas 20.5-24kg';
    
END $$;

-- =====================================================
-- VERIFICAÇÃO DOS DADOS INSERIDOS
-- =====================================================

-- Verificar execuções da semana 8
SELECT 
    '🔍 EXECUÇÕES SEMANA 8' as verificacao,
    e.nome as exercicio,
    eeu.peso_utilizado || 'kg' as peso,
    eeu.repeticoes || ' reps' as reps,
    'Série ' || eeu.serie_numero as serie,
    eeu.data_execucao::date as data
FROM execucao_exercicio_usuario eeu
INNER JOIN protocolo_treinos pt ON pt.id = eeu.protocolo_treino_id
INNER JOIN exercicios e ON e.id = eeu.exercicio_id
WHERE eeu.usuario_id = 1
    AND pt.semana_referencia = 8
    AND eeu.data_execucao >= '2025-07-15'
    AND eeu.data_execucao <= '2025-07-19'
ORDER BY e.nome, eeu.serie_numero;

-- Verificar planejamento semanal atualizado
SELECT 
    '📅 PLANEJAMENTO ATUALIZADO' as verificacao,
    tipo_atividade,
    concluido,
    data_conclusao,
    post_workout
FROM planejamento_semanal
WHERE usuario_id = 1 
    AND ano = 2025 
    AND semana_treino = 8
ORDER BY tipo_atividade;