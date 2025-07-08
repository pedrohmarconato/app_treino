-- Script com 1RMs reais do Pedro (SEM tempo_descanso)
-- Semana 5: 77% do 1RM | Semana 6: 80% do 1RM
-- Leg Press (ID 402): 373.33kg | Agachamento (ID 401): 150kg estimado

DO $$
DECLARE
    v_usuario_id INTEGER := 1;
    v_protocolo_id INTEGER := 1;
    v_hora_inicio TIME;
BEGIN
    -- SEMANA 5 (77% do 1RM)
    
    -- ID 353: Quinta 26/06 - Pernas
    v_hora_inicio := TIME '07:00:00';
    
    -- Agachamento (ID 401): 1RM 150kg → 77% = 115.5kg
    FOR serie IN 1..4 LOOP
        INSERT INTO execucao_exercicio_usuario 
        (usuario_id, protocolo_treino_id, exercicio_id, data_execucao, peso_utilizado, repeticoes, serie_numero, falhou)
        SELECT 
            1, pt.id, 401,
            ('2025-06-26 ' || v_hora_inicio + (serie-1) * interval '3 minutes')::timestamp AT TIME ZONE 'America/Sao_Paulo',
            115.5, 10, serie, false
        FROM protocolo_treinos pt
        WHERE pt.protocolo_id = 1 AND pt.semana_referencia = 5 AND pt.exercicio_id = 401
        LIMIT 1;
    END LOOP;
    v_hora_inicio := v_hora_inicio + interval '12 minutes';
    
    -- Leg Press (ID 402): 1RM 373.33kg → 77% = 287.5kg
    FOR serie IN 1..3 LOOP
        INSERT INTO execucao_exercicio_usuario 
        (usuario_id, protocolo_treino_id, exercicio_id, data_execucao, peso_utilizado, repeticoes, serie_numero, falhou)
        SELECT 
            1, pt.id, 402,
            ('2025-06-26 ' || v_hora_inicio + (serie-1) * interval '2 minutes')::timestamp AT TIME ZONE 'America/Sao_Paulo',
            287.5, 12, serie, false
        FROM protocolo_treinos pt
        WHERE pt.protocolo_id = 1 AND pt.semana_referencia = 5 AND pt.exercicio_id = 402
        LIMIT 1;
    END LOOP;
    v_hora_inicio := v_hora_inicio + interval '8 minutes';
    
    -- Extensão Pernas (ID 403): 1RM 88.83kg → 77% = 68.5kg
    FOR serie IN 1..3 LOOP
        INSERT INTO execucao_exercicio_usuario 
        (usuario_id, protocolo_treino_id, exercicio_id, data_execucao, peso_utilizado, repeticoes, serie_numero, falhou)
        SELECT 
            1, pt.id, 403,
            ('2025-06-26 ' || v_hora_inicio + (serie-1) * interval '90 seconds')::timestamp AT TIME ZONE 'America/Sao_Paulo',
            68.5, 15, serie, false
        FROM protocolo_treinos pt
        WHERE pt.protocolo_id = 1 AND pt.semana_referencia = 5 AND pt.exercicio_id = 403
        LIMIT 1;
    END LOOP;
    v_hora_inicio := v_hora_inicio + interval '6 minutes';
    
    -- Flexão Pernas (ID 404): 1RM 101.33kg → 77% = 78kg
    FOR serie IN 1..3 LOOP
        INSERT INTO execucao_exercicio_usuario 
        (usuario_id, protocolo_treino_id, exercicio_id, data_execucao, peso_utilizado, repeticoes, serie_numero, falhou)
        SELECT 
            1, pt.id, 404,
            ('2025-06-26 ' || v_hora_inicio + (serie-1) * interval '90 seconds')::timestamp AT TIME ZONE 'America/Sao_Paulo',
            78, 12, serie, false
        FROM protocolo_treinos pt
        WHERE pt.protocolo_id = 1 AND pt.semana_referencia = 5 AND pt.exercicio_id = 404
        LIMIT 1;
    END LOOP;
    
    UPDATE planejamento_semanal SET concluido = true, data_conclusao = '2025-06-26', pre_workout = '4'::jsonb, post_workout = '5'::jsonb WHERE id = 353;
    
    -- ID 354: Sexta 27/06 - Ombro e Braço
    v_hora_inicio := TIME '07:00:00';
    
    -- Desenvolvimento Ombros (ID 301): 1RM 21kg → 77% = 16kg
    FOR serie IN 1..4 LOOP
        INSERT INTO execucao_exercicio_usuario 
        (usuario_id, protocolo_treino_id, exercicio_id, data_execucao, peso_utilizado, repeticoes, serie_numero, falhou)
        SELECT 
            1, pt.id, 301,
            ('2025-06-27 ' || v_hora_inicio + (serie-1) * interval '2 minutes')::timestamp AT TIME ZONE 'America/Sao_Paulo',
            16, 10, serie, false
        FROM protocolo_treinos pt
        WHERE pt.protocolo_id = 1 AND pt.semana_referencia = 5 AND pt.exercicio_id = 301
        LIMIT 1;
    END LOOP;
    v_hora_inicio := v_hora_inicio + interval '10 minutes';
    
    -- Elevação Lateral (ID 302): 1RM 30.07kg → 77% = 23kg
    FOR serie IN 1..3 LOOP
        INSERT INTO execucao_exercicio_usuario 
        (usuario_id, protocolo_treino_id, exercicio_id, data_execucao, peso_utilizado, repeticoes, serie_numero, falhou)
        SELECT 
            1, pt.id, 302,
            ('2025-06-27 ' || v_hora_inicio + (serie-1) * interval '90 seconds')::timestamp AT TIME ZONE 'America/Sao_Paulo',
            23, 15, serie, false
        FROM protocolo_treinos pt
        WHERE pt.protocolo_id = 1 AND pt.semana_referencia = 5 AND pt.exercicio_id = 302
        LIMIT 1;
    END LOOP;
    v_hora_inicio := v_hora_inicio + interval '6 minutes';
    
    -- Rosca Direta (ID 201): 1RM 36.67kg → 77% = 28kg
    FOR serie IN 1..4 LOOP
        INSERT INTO execucao_exercicio_usuario 
        (usuario_id, protocolo_treino_id, exercicio_id, data_execucao, peso_utilizado, repeticoes, serie_numero, falhou)
        SELECT 
            1, pt.id, 201,
            ('2025-06-27 ' || v_hora_inicio + (serie-1) * interval '90 seconds')::timestamp AT TIME ZONE 'America/Sao_Paulo',
            28, 10, serie, false
        FROM protocolo_treinos pt
        WHERE pt.protocolo_id = 1 AND pt.semana_referencia = 5 AND pt.exercicio_id = 201
        LIMIT 1;
    END LOOP;
    v_hora_inicio := v_hora_inicio + interval '8 minutes';
    
    -- Tríceps Pulley (ID 202): 1RM 54kg → 77% = 41.5kg
    FOR serie IN 1..4 LOOP
        INSERT INTO execucao_exercicio_usuario 
        (usuario_id, protocolo_treino_id, exercicio_id, data_execucao, peso_utilizado, repeticoes, serie_numero, falhou)
        SELECT 
            1, pt.id, 202,
            ('2025-06-27 ' || v_hora_inicio + (serie-1) * interval '90 seconds')::timestamp AT TIME ZONE 'America/Sao_Paulo',
            41.5, 12, serie, false
        FROM protocolo_treinos pt
        WHERE pt.protocolo_id = 1 AND pt.semana_referencia = 5 AND pt.exercicio_id = 202
        LIMIT 1;
    END LOOP;
    
    UPDATE planejamento_semanal SET concluido = true, data_conclusao = '2025-06-27', pre_workout = '4'::jsonb, post_workout = '3'::jsonb WHERE id = 354;
    
    -- ID 355: Sábado 28/06 - Costas
    v_hora_inicio := TIME '07:00:00';
    
    -- Puxada Frontal (ID 305): 1RM 77kg → 77% = 59kg
    FOR serie IN 1..4 LOOP
        INSERT INTO execucao_exercicio_usuario 
        (usuario_id, protocolo_treino_id, exercicio_id, data_execucao, peso_utilizado, repeticoes, serie_numero, falhou)
        SELECT 
            1, pt.id, 305,
            ('2025-06-28 ' || v_hora_inicio + (serie-1) * interval '2 minutes')::timestamp AT TIME ZONE 'America/Sao_Paulo',
            59, 10, serie, false
        FROM protocolo_treinos pt
        WHERE pt.protocolo_id = 1 AND pt.semana_referencia = 5 AND pt.exercicio_id = 305
        LIMIT 1;
    END LOOP;
    v_hora_inicio := v_hora_inicio + interval '10 minutes';
    
    -- Remada Curvada (ID 306): 1RM 23.8kg → 77% = 18kg
    FOR serie IN 1..3 LOOP
        INSERT INTO execucao_exercicio_usuario 
        (usuario_id, protocolo_treino_id, exercicio_id, data_execucao, peso_utilizado, repeticoes, serie_numero, falhou)
        SELECT 
            1, pt.id, 306,
            ('2025-06-28 ' || v_hora_inicio + (serie-1) * interval '2.5 minutes')::timestamp AT TIME ZONE 'America/Sao_Paulo',
            18, 10, serie, false
        FROM protocolo_treinos pt
        WHERE pt.protocolo_id = 1 AND pt.semana_referencia = 5 AND pt.exercicio_id = 306
        LIMIT 1;
    END LOOP;
    v_hora_inicio := v_hora_inicio + interval '9 minutes';
    
    -- Remada Unilateral (ID 307): 1RM 28kg → 77% = 21.5kg
    FOR serie IN 1..3 LOOP
        INSERT INTO execucao_exercicio_usuario 
        (usuario_id, protocolo_treino_id, exercicio_id, data_execucao, peso_utilizado, repeticoes, serie_numero, falhou)
        SELECT 
            1, pt.id, 307,
            ('2025-06-28 ' || v_hora_inicio + (serie-1) * interval '90 seconds')::timestamp AT TIME ZONE 'America/Sao_Paulo',
            21.5, 12, serie, false
        FROM protocolo_treinos pt
        WHERE pt.protocolo_id = 1 AND pt.semana_referencia = 5 AND pt.exercicio_id = 307
        LIMIT 1;
    END LOOP;
    v_hora_inicio := v_hora_inicio + interval '6 minutes';
    
    -- Rosca Martelo (ID 203): 1RM 38kg → 77% = 29kg
    FOR serie IN 1..3 LOOP
        INSERT INTO execucao_exercicio_usuario 
        (usuario_id, protocolo_treino_id, exercicio_id, data_execucao, peso_utilizado, repeticoes, serie_numero, falhou)
        SELECT 
            1, pt.id, 203,
            ('2025-06-28 ' || v_hora_inicio + (serie-1) * interval '90 seconds')::timestamp AT TIME ZONE 'America/Sao_Paulo',
            29, 12, serie, false
        FROM protocolo_treinos pt
        WHERE pt.protocolo_id = 1 AND pt.semana_referencia = 5 AND pt.exercicio_id = 203
        LIMIT 1;
    END LOOP;
    
    UPDATE planejamento_semanal SET concluido = true, data_conclusao = '2025-06-28', pre_workout = '4'::jsonb, post_workout = '4'::jsonb WHERE id = 355;
    
    -- SEMANA 6 (80% do 1RM)
    
    -- ID 366: Terça 08/07 - Peito
    v_hora_inicio := TIME '07:00:00';
    
    -- Supino Reto (ID 101): 1RM 105kg → 80% = 84kg
    FOR serie IN 1..4 LOOP
        INSERT INTO execucao_exercicio_usuario 
        (usuario_id, protocolo_treino_id, exercicio_id, data_execucao, peso_utilizado, repeticoes, serie_numero, falhou)
        SELECT 
            1, pt.id, 101,
            ('2025-07-08 ' || v_hora_inicio + (serie-1) * interval '3 minutes')::timestamp AT TIME ZONE 'America/Sao_Paulo',
            84, 8, serie, false
        FROM protocolo_treinos pt
        WHERE pt.protocolo_id = 1 AND pt.semana_referencia = 6 AND pt.exercicio_id = 101
        LIMIT 1;
    END LOOP;
    v_hora_inicio := v_hora_inicio + interval '12 minutes';
    
    -- Supino Inclinado (ID 102): 1RM 119kg → 80% = 95kg
    FOR serie IN 1..3 LOOP
        INSERT INTO execucao_exercicio_usuario 
        (usuario_id, protocolo_treino_id, exercicio_id, data_execucao, peso_utilizado, repeticoes, serie_numero, falhou)
        SELECT 
            1, pt.id, 102,
            ('2025-07-08 ' || v_hora_inicio + (serie-1) * interval '2 minutes')::timestamp AT TIME ZONE 'America/Sao_Paulo',
            95, 10, serie, false
        FROM protocolo_treinos pt
        WHERE pt.protocolo_id = 1 AND pt.semana_referencia = 6 AND pt.exercicio_id = 102
        LIMIT 1;
    END LOOP;
    v_hora_inicio := v_hora_inicio + interval '8 minutes';
    
    -- Crucifixo (ID 103): 1RM 70kg → 80% = 56kg
    FOR serie IN 1..3 LOOP
        INSERT INTO execucao_exercicio_usuario 
        (usuario_id, protocolo_treino_id, exercicio_id, data_execucao, peso_utilizado, repeticoes, serie_numero, falhou)
        SELECT 
            1, pt.id, 103,
            ('2025-07-08 ' || v_hora_inicio + (serie-1) * interval '90 seconds')::timestamp AT TIME ZONE 'America/Sao_Paulo',
            56, 12, serie, false
        FROM protocolo_treinos pt
        WHERE pt.protocolo_id = 1 AND pt.semana_referencia = 6 AND pt.exercicio_id = 103
        LIMIT 1;
    END LOOP;
    v_hora_inicio := v_hora_inicio + interval '6 minutes';
    
    -- Tríceps Pulley (ID 202): 1RM 54kg → 80% = 43kg
    FOR serie IN 1..4 LOOP
        INSERT INTO execucao_exercicio_usuario 
        (usuario_id, protocolo_treino_id, exercicio_id, data_execucao, peso_utilizado, repeticoes, serie_numero, falhou)
        SELECT 
            1, pt.id, 202,
            ('2025-07-08 ' || v_hora_inicio + (serie-1) * interval '90 seconds')::timestamp AT TIME ZONE 'America/Sao_Paulo',
            43, 12, serie, false
        FROM protocolo_treinos pt
        WHERE pt.protocolo_id = 1 AND pt.semana_referencia = 6 AND pt.exercicio_id = 202
        LIMIT 1;
    END LOOP;
    
    UPDATE planejamento_semanal SET concluido = true, data_conclusao = '2025-07-08', pre_workout = '4'::jsonb, post_workout = '3'::jsonb WHERE id = 366;
    
    -- ID 367: Quarta 09/07 - Pernas
    v_hora_inicio := TIME '07:00:00';
    
    -- Agachamento (ID 401): 1RM 150kg → 80% = 120kg
    FOR serie IN 1..4 LOOP
        INSERT INTO execucao_exercicio_usuario 
        (usuario_id, protocolo_treino_id, exercicio_id, data_execucao, peso_utilizado, repeticoes, serie_numero, falhou)
        SELECT 
            1, pt.id, 401,
            ('2025-07-09 ' || v_hora_inicio + (serie-1) * interval '3 minutes')::timestamp AT TIME ZONE 'America/Sao_Paulo',
            120, 8, serie, false
        FROM protocolo_treinos pt
        WHERE pt.protocolo_id = 1 AND pt.semana_referencia = 6 AND pt.exercicio_id = 401
        LIMIT 1;
    END LOOP;
    v_hora_inicio := v_hora_inicio + interval '12 minutes';
    
    -- Leg Press (ID 402): 1RM 373.33kg → 80% = 299kg
    FOR serie IN 1..3 LOOP
        INSERT INTO execucao_exercicio_usuario 
        (usuario_id, protocolo_treino_id, exercicio_id, data_execucao, peso_utilizado, repeticoes, serie_numero, falhou)
        SELECT 
            1, pt.id, 402,
            ('2025-07-09 ' || v_hora_inicio + (serie-1) * interval '2 minutes')::timestamp AT TIME ZONE 'America/Sao_Paulo',
            299, 12, serie, false
        FROM protocolo_treinos pt
        WHERE pt.protocolo_id = 1 AND pt.semana_referencia = 6 AND pt.exercicio_id = 402
        LIMIT 1;
    END LOOP;
    v_hora_inicio := v_hora_inicio + interval '8 minutes';
    
    -- Extensão Pernas (ID 403): 1RM 88.83kg → 80% = 71kg
    FOR serie IN 1..3 LOOP
        INSERT INTO execucao_exercicio_usuario 
        (usuario_id, protocolo_treino_id, exercicio_id, data_execucao, peso_utilizado, repeticoes, serie_numero, falhou)
        SELECT 
            1, pt.id, 403,
            ('2025-07-09 ' || v_hora_inicio + (serie-1) * interval '90 seconds')::timestamp AT TIME ZONE 'America/Sao_Paulo',
            71, 15, serie, false
        FROM protocolo_treinos pt
        WHERE pt.protocolo_id = 1 AND pt.semana_referencia = 6 AND pt.exercicio_id = 403
        LIMIT 1;
    END LOOP;
    v_hora_inicio := v_hora_inicio + interval '6 minutes';
    
    -- Flexão Pernas (ID 404): 1RM 101.33kg → 80% = 81kg
    FOR serie IN 1..3 LOOP
        INSERT INTO execucao_exercicio_usuario 
        (usuario_id, protocolo_treino_id, exercicio_id, data_execucao, peso_utilizado, repeticoes, serie_numero, falhou)
        SELECT 
            1, pt.id, 404,
            ('2025-07-09 ' || v_hora_inicio + (serie-1) * interval '90 seconds')::timestamp AT TIME ZONE 'America/Sao_Paulo',
            81, 12, serie, false
        FROM protocolo_treinos pt
        WHERE pt.protocolo_id = 1 AND pt.semana_referencia = 6 AND pt.exercicio_id = 404
        LIMIT 1;
    END LOOP;
    
    UPDATE planejamento_semanal SET concluido = true, data_conclusao = '2025-07-09', pre_workout = '5'::jsonb, post_workout = '5'::jsonb WHERE id = 367;
    
    -- ID 368: Quinta 10/07 - Ombro e Braço
    v_hora_inicio := TIME '07:00:00';
    
    -- Desenvolvimento Ombros (ID 301): 1RM 21kg → 80% = 16.5kg
    FOR serie IN 1..4 LOOP
        INSERT INTO execucao_exercicio_usuario 
        (usuario_id, protocolo_treino_id, exercicio_id, data_execucao, peso_utilizado, repeticoes, serie_numero, falhou)
        SELECT 
            1, pt.id, 301,
            ('2025-07-10 ' || v_hora_inicio + (serie-1) * interval '2 minutes')::timestamp AT TIME ZONE 'America/Sao_Paulo',
            16.5, 8, serie, false
        FROM protocolo_treinos pt
        WHERE pt.protocolo_id = 1 AND pt.semana_referencia = 6 AND pt.exercicio_id = 301
        LIMIT 1;
    END LOOP;
    v_hora_inicio := v_hora_inicio + interval '10 minutes';
    
    -- Elevação Lateral (ID 302): 1RM 30.07kg → 80% = 24kg
    FOR serie IN 1..3 LOOP
        INSERT INTO execucao_exercicio_usuario 
        (usuario_id, protocolo_treino_id, exercicio_id, data_execucao, peso_utilizado, repeticoes, serie_numero, falhou)
        SELECT 
            1, pt.id, 302,
            ('2025-07-10 ' || v_hora_inicio + (serie-1) * interval '90 seconds')::timestamp AT TIME ZONE 'America/Sao_Paulo',
            24, 15, serie, false
        FROM protocolo_treinos pt
        WHERE pt.protocolo_id = 1 AND pt.semana_referencia = 6 AND pt.exercicio_id = 302
        LIMIT 1;
    END LOOP;
    v_hora_inicio := v_hora_inicio + interval '6 minutes';
    
    -- Rosca Direta (ID 201): 1RM 36.67kg → 80% = 29kg
    FOR serie IN 1..4 LOOP
        INSERT INTO execucao_exercicio_usuario 
        (usuario_id, protocolo_treino_id, exercicio_id, data_execucao, peso_utilizado, repeticoes, serie_numero, falhou)
        SELECT 
            1, pt.id, 201,
            ('2025-07-10 ' || v_hora_inicio + (serie-1) * interval '90 seconds')::timestamp AT TIME ZONE 'America/Sao_Paulo',
            29, 10, serie, false
        FROM protocolo_treinos pt
        WHERE pt.protocolo_id = 1 AND pt.semana_referencia = 6 AND pt.exercicio_id = 201
        LIMIT 1;
    END LOOP;
    v_hora_inicio := v_hora_inicio + interval '8 minutes';
    
    -- Tríceps Testa (ID 204): 1RM 44.33kg → 80% = 35.5kg
    FOR serie IN 1..3 LOOP
        INSERT INTO execucao_exercicio_usuario 
        (usuario_id, protocolo_treino_id, exercicio_id, data_execucao, peso_utilizado, repeticoes, serie_numero, falhou)
        SELECT 
            1, pt.id, 204,
            ('2025-07-10 ' || v_hora_inicio + (serie-1) * interval '90 seconds')::timestamp AT TIME ZONE 'America/Sao_Paulo',
            35.5, 12, serie, false
        FROM protocolo_treinos pt
        WHERE pt.protocolo_id = 1 AND pt.semana_referencia = 6 AND pt.exercicio_id = 204
        LIMIT 1;
    END LOOP;
    
    UPDATE planejamento_semanal SET concluido = true, data_conclusao = '2025-07-10', pre_workout = '4'::jsonb, post_workout = '3'::jsonb WHERE id = 368;
    
    -- ID 370: Sábado 12/07 - Costas
    v_hora_inicio := TIME '07:00:00';
    
    -- Puxada Frontal (ID 305): 1RM 77kg → 80% = 61.5kg
    FOR serie IN 1..4 LOOP
        INSERT INTO execucao_exercicio_usuario 
        (usuario_id, protocolo_treino_id, exercicio_id, data_execucao, peso_utilizado, repeticoes, serie_numero, falhou)
        SELECT 
            1, pt.id, 305,
            ('2025-07-12 ' || v_hora_inicio + (serie-1) * interval '2 minutes')::timestamp AT TIME ZONE 'America/Sao_Paulo',
            61.5, 10, serie, false
        FROM protocolo_treinos pt
        WHERE pt.protocolo_id = 1 AND pt.semana_referencia = 6 AND pt.exercicio_id = 305
        LIMIT 1;
    END LOOP;
    v_hora_inicio := v_hora_inicio + interval '10 minutes';
    
    -- Remada Curvada (ID 306): 1RM 23.8kg → 80% = 19kg
    FOR serie IN 1..3 LOOP
        INSERT INTO execucao_exercicio_usuario 
        (usuario_id, protocolo_treino_id, exercicio_id, data_execucao, peso_utilizado, repeticoes, serie_numero, falhou)
        SELECT 
            1, pt.id, 306,
            ('2025-07-12 ' || v_hora_inicio + (serie-1) * interval '2.5 minutes')::timestamp AT TIME ZONE 'America/Sao_Paulo',
            19, 10, serie, false
        FROM protocolo_treinos pt
        WHERE pt.protocolo_id = 1 AND pt.semana_referencia = 6 AND pt.exercicio_id = 306
        LIMIT 1;
    END LOOP;
    v_hora_inicio := v_hora_inicio + interval '9 minutes';
    
    -- Remada Unilateral (ID 307): 1RM 28kg → 80% = 22.5kg
    FOR serie IN 1..3 LOOP
        INSERT INTO execucao_exercicio_usuario 
        (usuario_id, protocolo_treino_id, exercicio_id, data_execucao, peso_utilizado, repeticoes, serie_numero, falhou)
        SELECT 
            1, pt.id, 307,
            ('2025-07-12 ' || v_hora_inicio + (serie-1) * interval '90 seconds')::timestamp AT TIME ZONE 'America/Sao_Paulo',
            22.5, 12, serie, false
        FROM protocolo_treinos pt
        WHERE pt.protocolo_id = 1 AND pt.semana_referencia = 6 AND pt.exercicio_id = 307
        LIMIT 1;
    END LOOP;
    v_hora_inicio := v_hora_inicio + interval '6 minutes';
    
    -- Rosca Concentrada (ID 205): 1RM 39.67kg → 80% = 32kg
    FOR serie IN 1..3 LOOP
        INSERT INTO execucao_exercicio_usuario 
        (usuario_id, protocolo_treino_id, exercicio_id, data_execucao, peso_utilizado, repeticoes, serie_numero, falhou)
        SELECT 
            1, pt.id, 205,
            ('2025-07-12 ' || v_hora_inicio + (serie-1) * interval '90 seconds')::timestamp AT TIME ZONE 'America/Sao_Paulo',
            32, 12, serie, false
        FROM protocolo_treinos pt
        WHERE pt.protocolo_id = 1 AND pt.semana_referencia = 6 AND pt.exercicio_id = 205
        LIMIT 1;
    END LOOP;
    
    UPDATE planejamento_semanal SET concluido = true, data_conclusao = '2025-07-12', pre_workout = '4'::jsonb, post_workout = '4'::jsonb WHERE id = 370;
    
    RAISE NOTICE 'Treinos inseridos com pesos corretos!';
    RAISE NOTICE 'Leg Press: 373.33kg | Agachamento: 150kg (estimado)';
    RAISE NOTICE 'Semana 5 (77%%): 3 treinos | Semana 6 (80%%): 4 treinos';
    
END $$;