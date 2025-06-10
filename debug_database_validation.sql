-- Debug SQL queries to find and fix planejamento_semanal validation issue
-- Run these queries in your Supabase SQL editor

-- ========================================
-- STEP 1: Find all triggers on planejamento_semanal table
-- ========================================
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'planejamento_semanal';

-- result: 
| trigger_name             | event_manipulation | action_timing | action_statement                         |
| ------------------------ | ------------------ | ------------- | ---------------------------------------- |
| tr_validate_planejamento | INSERT             | BEFORE        | EXECUTE FUNCTION validate_planejamento() |
| tr_validate_planejamento | UPDATE             | BEFORE        | EXECUTE FUNCTION validate_planejamento() |

-- ========================================
-- STEP 2: Find all check constraints on planejamento_semanal
-- ========================================
SELECT 
    tc.constraint_name,
    tc.table_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'planejamento_semanal' 
    AND tc.constraint_type = 'CHECK';


-- result: 

| constraint_name                           | table_name           | check_clause                                                                    |
| ----------------------------------------- | -------------------- | ------------------------------------------------------------------------------- |
| planejamento_semanal_tipo_atividade_check | planejamento_semanal | ((tipo_atividade = ANY (ARRAY['treino'::text, 'folga'::text, 'cardio'::text]))) |
| planejamento_semanal_dia_semana_check     | planejamento_semanal | (((dia_semana >= 1) AND (dia_semana <= 7)))                                     |
| check_dia_semana                          | planejamento_semanal | (((dia_semana >= 1) AND (dia_semana <= 7)))                                     |
| 2200_31315_1_not_null                     | planejamento_semanal | id IS NOT NULL                                                                  |
| 2200_31315_2_not_null                     | planejamento_semanal | usuario_id IS NOT NULL                                                          |
| 2200_31315_3_not_null                     | planejamento_semanal | ano IS NOT NULL                                                                 |
| 2200_31315_4_not_null                     | planejamento_semanal | semana IS NOT NULL                                                              |
| 2200_31315_5_not_null                     | planejamento_semanal | dia_semana IS NOT NULL                                                          |
| 2200_31315_6_not_null                     | planejamento_semanal | tipo_atividade IS NOT NULL                                                      |


-- ========================================
-- STEP 3: Find all PostgreSQL functions that might validate tipo_atividade
-- ========================================
SELECT 
    proname as function_name,
    prosrc as function_source
FROM pg_proc 
WHERE prosrc ILIKE '%tipo_atividade%' 
    OR prosrc ILIKE '%P0001%' 
    OR prosrc ILIKE '%RAISE EXCEPTION%'
    OR proname ILIKE '%planejamento%'
    OR proname ILIKE '%atividade%';

--result
| function_name                       | function_source                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| sincronizar_planejamento_calendario | 
DECLARE
    contador INTEGER := 0;
    registro RECORD;
BEGIN
    FOR registro IN 
        SELECT ps.id, ps.ano, ps.semana, ps.dia_semana
        FROM planejamento_semanal ps
        WHERE ps.calendario_id IS NULL
    LOOP
        UPDATE planejamento_semanal 
        SET 
            calendario_id = (
                SELECT cal.id 
                FROM D_calendario cal 
                WHERE cal.ano = registro.ano 
                  AND cal.semana_ano = registro.semana 
                  AND cal.dia_semana = registro.dia_semana
                LIMIT 1
            ),
            semana_treino = (
                SELECT cal.semana_treino 
                FROM D_calendario cal 
                WHERE cal.ano = registro.ano 
                  AND cal.semana_ano = registro.semana 
                  AND cal.dia_semana = registro.dia_semana
                LIMIT 1
            )
        WHERE id = registro.id;
        contador := contador + 1;
    END LOOP;
    RETURN contador;
END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| verificar_semana_programada         | 
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM planejamento_semanal ps
        WHERE ps.usuario_id = p_usuario_id 
          AND ps.semana_treino = p_semana_treino 
          AND ps.eh_programado = TRUE
          AND ps.tipo_atividade != 'folga'
    );
END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| exception                           | 
begin
    raise exception using errcode='22000', message=message;
end;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| validate_planejamento               | 
BEGIN
    -- Validar tipo_atividade
    IF NEW.tipo_atividade NOT IN ('folga', 'treino', 'cardio', 'Treino', 'Folga', 'Cardio') THEN
        RAISE EXCEPTION 'tipo_atividade inválido: %', NEW.tipo_atividade;
    END IF;
    
    -- Se for treino, validar se numero_treino existe
    IF LOWER(NEW.tipo_atividade) = 'treino' THEN
        IF NEW.numero_treino IS NULL THEN
            RAISE EXCEPTION 'numero_treino obrigatório para treinos';
        END IF;
        
        -- Verificar se numero_treino existe (validação manual)
        IF NOT EXISTS (SELECT 1 FROM protocolo_treinos WHERE numero_treino = NEW.numero_treino) THEN
            RAISE EXCEPTION 'numero_treino % não existe em protocolo_treinos', NEW.numero_treino;
        END IF;
    ELSE
        -- Folga/cardio não devem ter numero_treino
        NEW.numero_treino = NULL;
    END IF;
    
    RETURN NEW;
END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| subscription_check_filters          | 
    /*
    Validates that the user defined filters for a subscription:
    - refer to valid columns that the claimed role may access
    - values are coercable to the correct column type
    */
    declare
        col_names text[] = coalesce(
                array_agg(c.column_name order by c.ordinal_position),
                '{}'::text[]
            )
            from
                information_schema.columns c
            where
                format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity
                and pg_catalog.has_column_privilege(
                    (new.claims ->> 'role'),
                    format('%I.%I', c.table_schema, c.table_name)::regclass,
                    c.column_name,
                    'SELECT'
                );
        filter realtime.user_defined_filter;
        col_type regtype;

        in_val jsonb;
    begin
        for filter in select * from unnest(new.filters) loop
            -- Filtered column is valid
            if not filter.column_name = any(col_names) then
                raise exception 'invalid column for filter %', filter.column_name;
            end if;

            -- Type is sanitized and safe for string interpolation
            col_type = (
                select atttypid::regtype
                from pg_catalog.pg_attribute
                where attrelid = new.entity
                      and attname = filter.column_name
            );
            if col_type is null then
                raise exception 'failed to lookup type for column %', filter.column_name;
            end if;

            -- Set maximum number of entries for in filter
            if filter.op = 'in'::realtime.equality_op then
                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
                if coalesce(jsonb_array_length(in_val), 0) > 100 then
                    raise exception 'too many values for `in` filter. Maximum 100';
                end if;
            else
                -- raises an exception if value is not coercable to type
                perform realtime.cast(filter.value, col_type);
            end if;

        end loop;

        -- Apply consistent order to filters so the unique constraint on
        -- (subscription_id, entity, filters) can't be tricked by a different filter order
        new.filters = coalesce(
            array_agg(f order by f.column_name, f.op, f.value),
            '{}'
        ) from unnest(new.filters) f;

        return new;
    end;
     |
| broadcast_changes                   | 
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

-- ========================================
-- STEP 4: Find all functions that mention specific muscle groups
-- ========================================
SELECT 
    proname as function_name,
    prosrc as function_source
FROM pg_proc 
WHERE prosrc ILIKE '%peito%' 
    OR prosrc ILIKE '%costas%' 
    OR prosrc ILIKE '%pernas%'
    OR prosrc ILIKE '%ombro%'
    OR prosrc ILIKE '%braço%';


--result 
-- sucess. no rows returned

-- ========================================
-- STEP 5: Check Row Level Security policies
-- ========================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'planejamento_semanal';

-- result: 
| schemaname | tablename            | policyname                          | permissive | roles    | cmd    | qual | with_check |
| ---------- | -------------------- | ----------------------------------- | ---------- | -------- | ------ | ---- | ---------- |
| public     | planejamento_semanal | Deleção pública do planejamento     | PERMISSIVE | {public} | DELETE | true | null       |
| public     | planejamento_semanal | Atualização pública do planejamento | PERMISSIVE | {public} | UPDATE | true | true       |
| public     | planejamento_semanal | Inserção pública do planejamento    | PERMISSIVE | {public} | INSERT | null | true       |
| public     | planejamento_semanal | Leitura pública do planejamento     | PERMISSIVE | {public} | SELECT | true | null       |


-- ========================================
-- STEP 6: Check table structure and constraints
-- ========================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'planejamento_semanal'
ORDER BY ordinal_position;

-- results
| column_name           | data_type                | is_nullable | column_default                                   |
| --------------------- | ------------------------ | ----------- | ------------------------------------------------ |
| id                    | bigint                   | NO          | nextval('planejamento_semanal_id_seq'::regclass) |
| usuario_id            | bigint                   | NO          | null                                             |
| ano                   | integer                  | NO          | null                                             |
| semana                | integer                  | NO          | null                                             |
| dia_semana            | integer                  | NO          | null                                             |
| tipo_atividade        | text                     | NO          | null                                             |
| numero_treino         | integer                  | YES         | null                                             |
| concluido             | boolean                  | YES         | false                                            |
| data_conclusao        | timestamp with time zone | YES         | null                                             |
| created_at            | timestamp with time zone | YES         | now()                                            |
| updated_at            | timestamp with time zone | YES         | now()                                            |
| calendario_id         | bigint                   | YES         | null                                             |
| semana_treino         | integer                  | YES         | null                                             |
| eh_programado         | boolean                  | YES         | false                                            |
| data_programacao      | timestamp with time zone | YES         | null                                             |
| usuario_que_programou | bigint                   | YES         | null                                             |



-- ========================================
-- STEP 7: Look for any ENUM types that might restrict tipo_atividade
-- ========================================
SELECT 
    t.typname,
    e.enumlabel
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname ILIKE '%atividade%' 
    OR t.typname ILIKE '%tipo%'
    OR t.typname ILIKE '%treino%';

--results 
-- sucess. No rows returned

-- ========================================
-- STEP 8: Test with a simple SELECT to see current data
-- ========================================
SELECT DISTINCT tipo_atividade 
FROM planejamento_semanal 
ORDER BY tipo_atividade;

--results
| tipo_atividade |
| -------------- |
| cardio         |
| folga          |
| treino         |

-- ========================================
-- RESULTS INTERPRETATION:
-- ========================================
-- If STEP 1 shows triggers -> Check the trigger functions
-- If STEP 2 shows constraints -> The CHECK constraint is the issue
-- If STEP 3 shows functions -> One of these is raising the P0001 error
-- If STEP 7 shows ENUMs -> The column might be using an ENUM type with limited values