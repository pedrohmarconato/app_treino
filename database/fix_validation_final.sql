-- FINAL FIX for planejamento_semanal validation issues
-- Run these commands in your Supabase SQL editor

-- ========================================
-- STEP 1: Remove the restrictive CHECK constraint
-- ========================================
ALTER TABLE planejamento_semanal 
DROP CONSTRAINT IF EXISTS planejamento_semanal_tipo_atividade_check;

-- ========================================
-- STEP 2: Add new constraint that allows muscle groups
-- ========================================
ALTER TABLE planejamento_semanal 
ADD CONSTRAINT planejamento_semanal_tipo_atividade_check 
CHECK (tipo_atividade IN (
    'treino', 'folga', 'cardio', 'Treino', 'Folga', 'Cardio',
    'Peito', 'Costas', 'Pernas', 'Ombro', 'Braço', 'Bíceps', 'Tríceps', 
    'Superior', 'Inferior', 'Ombro e Braço'
));

-- ========================================
-- STEP 3: Update the trigger function to allow muscle groups
-- ========================================
CREATE OR REPLACE FUNCTION validate_planejamento()
RETURNS TRIGGER AS $$
BEGIN
    -- Validar tipo_atividade - now allowing muscle groups
    IF NEW.tipo_atividade NOT IN (
        'folga', 'treino', 'cardio', 'Treino', 'Folga', 'Cardio',
        'Peito', 'Costas', 'Pernas', 'Ombro', 'Braço', 'Bíceps', 'Tríceps', 
        'Superior', 'Inferior', 'Ombro e Braço'
    ) THEN
        RAISE EXCEPTION 'tipo_atividade inválido: %', NEW.tipo_atividade;
    END IF;
    
    -- Validação simplificada: apenas verificar se tipo_atividade é válido
    -- (numero_treino foi removido da estrutura)
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- STEP 4: Test the fix with a muscle group
-- ========================================
-- This should now work without errors:
INSERT INTO planejamento_semanal (usuario_id, ano, semana, dia_semana, tipo_atividade, concluido)
VALUES (1, 2025, 1, 1, 'Peito', false);

-- Verify the insert worked
SELECT * FROM planejamento_semanal WHERE tipo_atividade = 'Peito' ORDER BY id DESC LIMIT 1;

-- Clean up test data
DELETE FROM planejamento_semanal WHERE tipo_atividade = 'Peito' AND usuario_id = 1 AND ano = 2025 AND semana = 1;

-- ========================================
-- VERIFICATION: Check that both fixes are applied
-- ========================================

-- 1. Verify new constraint allows muscle groups
SELECT tc.constraint_name, cc.check_clause 
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'planejamento_semanal' AND tc.constraint_name = 'planejamento_semanal_tipo_atividade_check';

-- 2. Verify trigger function is updated
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'validate_planejamento';

SELECT 'Validation fixes applied successfully!' as resultado;