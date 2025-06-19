-- =====================================================
-- MIGRAÇÃO: Adicionar constraints para pre_workout e post_workout
-- Tabela: planejamento_semanal
-- Data: 2025-01-18
-- Propósito: Garantir que os valores estejam na escala Likert (0-5)
-- =====================================================

-- Verificar se as colunas existem (devem existir)
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'planejamento_semanal' 
AND column_name IN ('pre_workout', 'post_workout');

-- Adicionar constraint para pre_workout (escala 0-5)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chk_pre_workout_range' 
        AND table_name = 'planejamento_semanal'
    ) THEN
        ALTER TABLE planejamento_semanal 
        ADD CONSTRAINT chk_pre_workout_range 
        CHECK (pre_workout IS NULL OR pre_workout BETWEEN 0 AND 5);
        
        RAISE NOTICE 'Constraint chk_pre_workout_range adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Constraint chk_pre_workout_range já existe.';
    END IF;
END
$$;

-- Adicionar constraint para post_workout (escala 0-5)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chk_post_workout_range' 
        AND table_name = 'planejamento_semanal'
    ) THEN
        ALTER TABLE planejamento_semanal 
        ADD CONSTRAINT chk_post_workout_range 
        CHECK (post_workout IS NULL OR post_workout BETWEEN 0 AND 5);
        
        RAISE NOTICE 'Constraint chk_post_workout_range adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Constraint chk_post_workout_range já existe.';
    END IF;
END
$$;

-- Adicionar comentários para documentação
COMMENT ON COLUMN planejamento_semanal.pre_workout IS 
'Nível de ENERGIA antes do treino (0-5): 0=Sem energia nenhuma, 1=Muito pouca energia, 2=Pouca energia, 3=Energia normal, 4=Muita energia, 5=Energia máxima';

COMMENT ON COLUMN planejamento_semanal.post_workout IS 
'Nível de FADIGA após o treino (0-5): 0=Nenhuma fadiga, 1=Fadiga leve, 2=Fadiga moderada, 3=Fadiga intensa, 4=Muito fadigado, 5=Exaustão total';

-- Verificação final
SELECT 
    table_name,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'planejamento_semanal' 
AND constraint_name LIKE '%workout%';

-- Exemplos de uso:
/*
-- Atualizar nível de energia pré-treino
UPDATE planejamento_semanal 
SET pre_workout = 3  -- Energia normal
WHERE usuario_id = 1 AND dia_semana = 1 AND concluido = false;

-- Atualizar fadiga pós-treino ao finalizar
UPDATE planejamento_semanal 
SET post_workout = 2, concluido = true, data_conclusao = NOW()  -- Fadiga moderada
WHERE usuario_id = 1 AND dia_semana = 1;

-- Relatório de energia vs fadiga
SELECT 
    usuario_id,
    tipo_atividade,
    pre_workout as energia_inicial,
    post_workout as fadiga_final,
    CASE 
        WHEN pre_workout >= 4 AND post_workout BETWEEN 2 AND 4 THEN 'Treino Ideal'
        WHEN pre_workout <= 2 AND post_workout >= 4 THEN 'Possível Overtraining'
        WHEN post_workout <= 1 THEN 'Treino Muito Leve'
        ELSE 'Normal'
    END as classificacao_treino,
    data_conclusao
FROM planejamento_semanal 
WHERE concluido = true 
AND pre_workout IS NOT NULL 
AND post_workout IS NOT NULL
ORDER BY data_conclusao DESC;
*/