-- Fix for execucao_exercicio_usuario table structure
-- Issue: Missing 'serie_numero' column causing workout execution save failures
-- Solution: Add serie_numero column to track which set/series of exercise was performed

-- Add serie_numero column to execucao_exercicio_usuario table
ALTER TABLE execucao_exercicio_usuario 
ADD COLUMN serie_numero INTEGER DEFAULT 1;

-- Add comment for documentation
COMMENT ON COLUMN execucao_exercicio_usuario.serie_numero IS 'Número da série/set executado (1, 2, 3...)';

-- Update existing records to have serie_numero = 1 (first series)
UPDATE execucao_exercicio_usuario 
SET serie_numero = 1 
WHERE serie_numero IS NULL;

-- Optional: Add constraint to ensure serie_numero is positive
ALTER TABLE execucao_exercicio_usuario 
ADD CONSTRAINT execucao_exercicio_usuario_serie_numero_positive 
CHECK (serie_numero > 0);