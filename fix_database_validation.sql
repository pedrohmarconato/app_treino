-- Fix SQL script for planejamento_semanal tipo_atividade validation
-- Run AFTER identifying the issue with debug_database_validation.sql

-- ========================================
-- SCENARIO 1: If there's a CHECK constraint limiting tipo_atividade values
-- ========================================

-- Drop the restrictive CHECK constraint (replace 'constraint_name' with actual name found in debug)
-- ALTER TABLE planejamento_semanal DROP CONSTRAINT IF EXISTS constraint_name_here;

-- Add a new constraint that allows muscle groups
-- ALTER TABLE planejamento_semanal 
-- ADD CONSTRAINT check_tipo_atividade_valido 
-- CHECK (tipo_atividade IN ('treino', 'cardio', 'folga', 'Peito', 'Costas', 'Pernas', 'Ombro', 'Braço', 'Bíceps', 'Tríceps', 'Superior', 'Inferior', 'Ombro e Braço'));

-- ========================================
-- SCENARIO 2: If tipo_atividade is using an ENUM type
-- ========================================

-- First, change column to TEXT type (if it's currently ENUM)
-- ALTER TABLE planejamento_semanal 
-- ALTER COLUMN tipo_atividade TYPE TEXT;

-- Then add the new constraint
-- ALTER TABLE planejamento_semanal 
-- ADD CONSTRAINT check_tipo_atividade_valido 
-- CHECK (tipo_atividade IN ('treino', 'cardio', 'folga', 'Peito', 'Costas', 'Pernas', 'Ombro', 'Braço', 'Bíceps', 'Tríceps', 'Superior', 'Inferior', 'Ombro e Braço'));

-- ========================================
-- SCENARIO 3: If there's a trigger function causing the validation
-- ========================================

-- Disable the problematic trigger (replace 'trigger_name' with actual name found in debug)
-- ALTER TABLE planejamento_semanal DISABLE TRIGGER trigger_name_here;

-- OR modify the trigger function to allow muscle groups
-- Example trigger function modification:
/*
CREATE OR REPLACE FUNCTION validate_tipo_atividade()
RETURNS TRIGGER AS $$
BEGIN
    -- Allow these specific values
    IF NEW.tipo_atividade NOT IN ('treino', 'cardio', 'folga', 'Peito', 'Costas', 'Pernas', 'Ombro', 'Braço', 'Bíceps', 'Tríceps', 'Superior', 'Inferior', 'Ombro e Braço') THEN
        RAISE EXCEPTION 'tipo_atividade inválido: %', NEW.tipo_atividade;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
*/

-- ========================================
-- SCENARIO 4: Simple solution - Remove all validation
-- ========================================

-- If you want to completely remove tipo_atividade validation:
-- ALTER TABLE planejamento_semanal DROP CONSTRAINT IF EXISTS check_tipo_atividade_valido;
-- -- And disable any triggers found in the debug step

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Test inserting a muscle group to verify the fix
-- INSERT INTO planejamento_semanal (usuario_id, ano, semana, dia_semana, tipo_atividade, numero_treino, concluido)
-- VALUES (1, 2025, 1, 1, 'Peito', 1, false);

-- Check if the insert was successful
-- SELECT * FROM planejamento_semanal WHERE tipo_atividade = 'Peito' ORDER BY id DESC LIMIT 1;

-- Clean up test data
-- DELETE FROM planejamento_semanal WHERE tipo_atividade = 'Peito' AND usuario_id = 1 AND ano = 2025 AND semana = 1;

-- ========================================
-- RECOMMENDED APPROACH:
-- ========================================
-- 1. Run debug_database_validation.sql first
-- 2. Identify what's causing the P0001 error (constraint, trigger, or function)
-- 3. Apply the appropriate fix from the scenarios above
-- 4. Test with the verification queries