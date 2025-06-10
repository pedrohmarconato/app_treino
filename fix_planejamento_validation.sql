-- Script para corrigir problemas de validação no planejamento_semanal

-- 1. Primeiro, vamos ver os registros que estão causando problema
SELECT 
    id, 
    usuario_id, 
    ano, 
    semana, 
    dia_semana, 
    tipo_atividade, 
    numero_treino,
    concluido
FROM planejamento_semanal 
WHERE numero_treino IS NULL 
   OR numero_treino = 0
ORDER BY usuario_id, ano, semana, dia_semana;

-- 2. Atualizar registros sem numero_treino baseado no tipo_atividade
-- Para registros de treino (não folga, não cardio)
UPDATE planejamento_semanal 
SET numero_treino = CASE 
    WHEN tipo_atividade ILIKE '%peito%' THEN 1
    WHEN tipo_atividade ILIKE '%costas%' THEN 2  
    WHEN tipo_atividade ILIKE '%pernas%' THEN 3
    WHEN tipo_atividade ILIKE '%ombro%' THEN 4
    WHEN tipo_atividade ILIKE '%braço%' THEN 5
    WHEN tipo_atividade ILIKE '%bíceps%' THEN 5
    WHEN tipo_atividade ILIKE '%tríceps%' THEN 5
    WHEN tipo_atividade ILIKE '%superior%' THEN 1
    WHEN tipo_atividade ILIKE '%inferior%' THEN 2
    ELSE 1 -- Default para treino 1
END
WHERE (numero_treino IS NULL OR numero_treino = 0)
  AND tipo_atividade NOT ILIKE '%folga%'
  AND tipo_atividade NOT ILIKE '%cardio%'
  AND tipo_atividade NOT ILIKE '%descanso%';

-- 3. Para registros de folga e cardio, definir numero_treino como NULL
UPDATE planejamento_semanal 
SET numero_treino = NULL
WHERE (tipo_atividade ILIKE '%folga%' 
       OR tipo_atividade ILIKE '%cardio%' 
       OR tipo_atividade ILIKE '%descanso%')
  AND numero_treino IS NOT NULL;

-- 4. Verificar se ainda há registros problemáticos
SELECT 
    COUNT(*) as registros_sem_numero_treino,
    COUNT(CASE WHEN tipo_atividade NOT ILIKE '%folga%' 
                AND tipo_atividade NOT ILIKE '%cardio%' 
                AND tipo_atividade NOT ILIKE '%descanso%' 
                AND (numero_treino IS NULL OR numero_treino = 0) 
               THEN 1 END) as treinos_sem_numero
FROM planejamento_semanal;

-- 5. Agora tentar sincronizar novamente (versão segura)
-- Primeiro, desabilitar temporariamente o trigger de validação se possível
-- ALTER TABLE planejamento_semanal DISABLE TRIGGER ALL;

-- Sincronização manual registro por registro
DO $$
DECLARE
    reg RECORD;
    cal_id BIGINT;
BEGIN
    FOR reg IN 
        SELECT id, ano, semana, dia_semana, tipo_atividade, numero_treino
        FROM planejamento_semanal 
        WHERE calendario_id IS NULL
        ORDER BY id
    LOOP
        -- Buscar calendário correspondente
        SELECT cal.id INTO cal_id
        FROM d_calendario cal 
        WHERE cal.ano = reg.ano 
          AND cal.semana_ano = reg.semana 
          AND cal.dia_semana = reg.dia_semana
        LIMIT 1;
        
        -- Se encontrou o calendário, atualizar
        IF cal_id IS NOT NULL THEN
            BEGIN
                UPDATE planejamento_semanal 
                SET calendario_id = cal_id
                WHERE id = reg.id;
                
                RAISE NOTICE 'Atualizado registro %: calendario_id = %', reg.id, cal_id;
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE NOTICE 'Erro ao atualizar registro %: %', reg.id, SQLERRM;
            END;
        ELSE
            RAISE NOTICE 'Calendário não encontrado para registro %: ano=%, semana=%, dia=%', 
                        reg.id, reg.ano, reg.semana, reg.dia_semana;
        END IF;
    END LOOP;
END $$;

-- 6. Reabilitar triggers se foram desabilitados
-- ALTER TABLE planejamento_semanal ENABLE TRIGGER ALL;

-- 7. Verificar resultado final
SELECT 
    COUNT(*) as total_registros,
    COUNT(CASE WHEN calendario_id IS NOT NULL THEN 1 END) as com_calendario,
    COUNT(CASE WHEN calendario_id IS NULL THEN 1 END) as sem_calendario
FROM planejamento_semanal;

-- 8. Mostrar registros que ainda não foram sincronizados
SELECT 
    id, usuario_id, ano, semana, dia_semana, tipo_atividade, numero_treino
FROM planejamento_semanal 
WHERE calendario_id IS NULL
ORDER BY usuario_id, ano, semana, dia_semana
LIMIT 10;

SELECT 'Correção de validação concluída!' as resultado;