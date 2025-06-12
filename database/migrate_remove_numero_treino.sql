-- =====================================================
-- MIGRAÇÃO: Remover numero_treino (usar exercicios.grupo_muscular)
-- =====================================================

-- 1. VERIFICAR GRUPOS MUSCULARES EXISTENTES
SELECT DISTINCT grupo_muscular, COUNT(*) as total_exercicios
FROM exercicios 
GROUP BY grupo_muscular 
ORDER BY grupo_muscular;

-- 2. REMOVER VIEWS DEPENDENTES PRIMEIRO
DROP VIEW IF EXISTS v_plano_usuario_semana CASCADE;
DROP VIEW IF EXISTS v_dashboard_usuario CASCADE; 
DROP VIEW IF EXISTS v_planejamento_completo CASCADE;
DROP VIEW IF EXISTS v_protocolo_calendario_integrado CASCADE;

-- 3. REMOVER COLUNA numero_treino da tabela protocolo_treinos
ALTER TABLE protocolo_treinos 
DROP COLUMN IF EXISTS numero_treino CASCADE;

-- 4. REMOVER COLUNA numero_treino da tabela planejamento_semanal
ALTER TABLE planejamento_semanal 
DROP COLUMN IF EXISTS numero_treino CASCADE;

-- 5. RECRIAR VIEWS SEM numero_treino (usando JOIN com exercicios)
-- View: v_plano_usuario_semana
CREATE OR REPLACE VIEW v_plano_usuario_semana AS
SELECT 
    ps.id,
    ps.usuario_id,
    ps.ano,
    ps.semana,
    ps.dia_semana,
    ps.tipo_atividade,
    ps.concluido,
    ps.data_conclusao,
    
    -- Campos do protocolo de treinamento
    upt.protocolo_treinamento_id,
    upt.semana_atual as protocolo_semana_atual,
    upt.data_inicio as protocolo_data_inicio,
    upt.status as protocolo_status
FROM planejamento_semanal ps
LEFT JOIN usuario_plano_treino upt ON ps.usuario_id = upt.usuario_id AND upt.status = 'ativo';

-- View: v_dashboard_usuario  
CREATE OR REPLACE VIEW v_dashboard_usuario AS
SELECT 
    u.id as usuario_id,
    u.nome,
    ps.tipo_atividade,
    ps.concluido,
    COUNT(*) as total_atividades
FROM usuarios u
LEFT JOIN planejamento_semanal ps ON u.id = ps.usuario_id
GROUP BY u.id, u.nome, ps.tipo_atividade, ps.concluido;

-- View: v_planejamento_completo
CREATE OR REPLACE VIEW v_planejamento_completo AS
SELECT 
    ps.*,
    e.grupo_muscular,
    pt.protocolo_id,
    pt.semana_referencia
FROM planejamento_semanal ps
LEFT JOIN protocolo_treinos pt ON ps.usuario_id IN (
    SELECT usuario_id FROM usuario_plano_treino WHERE protocolo_treinamento_id = pt.protocolo_id
)
LEFT JOIN exercicios e ON pt.exercicio_id = e.id AND e.grupo_muscular = ps.tipo_atividade;

-- View: v_protocolo_calendario_integrado
CREATE OR REPLACE VIEW v_protocolo_calendario_integrado AS
SELECT 
    pt.protocolo_id,
    pt.semana_referencia,
    pt.exercicio_id,
    e.grupo_muscular,
    e.nome as exercicio_nome,
    ps.usuario_id,
    ps.tipo_atividade,
    ps.concluido
FROM protocolo_treinos pt
JOIN exercicios e ON pt.exercicio_id = e.id
LEFT JOIN planejamento_semanal ps ON ps.tipo_atividade = e.grupo_muscular;

-- 6. ATUALIZAR FUNÇÃO DE VALIDAÇÃO (usar grupos musculares dinâmicos)
CREATE OR REPLACE FUNCTION validate_planejamento() 
RETURNS TRIGGER AS $$
BEGIN
    -- Validar tipo_atividade básico
    IF NEW.tipo_atividade NOT IN ('folga', 'cardio', 'treino') THEN
        -- Verificar se é um grupo muscular válido
        IF NOT EXISTS (
            SELECT 1 FROM exercicios 
            WHERE grupo_muscular = NEW.tipo_atividade
        ) THEN
            RAISE EXCEPTION 'tipo_atividade inválido: %. Deve ser folga, cardio, treino ou um grupo muscular válido', NEW.tipo_atividade;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. VERIFICAR SE A MIGRAÇÃO FOI BEM-SUCEDIDA
DO $$ 
BEGIN
    -- Verificar se numero_treino foi removido
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'protocolo_treinos' 
        AND column_name = 'numero_treino'
    ) THEN
        RAISE EXCEPTION 'ERRO: Coluna numero_treino ainda existe em protocolo_treinos';
    END IF;
    
    -- Verificar se numero_treino foi removido do planejamento_semanal
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'planejamento_semanal' 
        AND column_name = 'numero_treino'
    ) THEN
        RAISE EXCEPTION 'ERRO: Coluna numero_treino ainda existe em planejamento_semanal';
    END IF;
    
    RAISE NOTICE 'SUCESSO: Migração concluída! numero_treino removido, usando exercicios.grupo_muscular';
END $$;

-- 8. TESTAR QUERY COM JOIN (exemplo)
SELECT 
    pt.protocolo_id,
    pt.semana_referencia,
    e.grupo_muscular,
    e.nome as exercicio_nome,
    COUNT(*) as total_exercicios
FROM protocolo_treinos pt
JOIN exercicios e ON pt.exercicio_id = e.id
WHERE pt.protocolo_id = 1
GROUP BY pt.protocolo_id, pt.semana_referencia, e.grupo_muscular, e.nome
ORDER BY e.grupo_muscular, pt.semana_referencia;

-- 9. CRIAR ÍNDICES PARA PERFORMANCE COM JOIN
CREATE INDEX IF NOT EXISTS idx_protocolo_treinos_exercicio_id 
ON protocolo_treinos(exercicio_id, protocolo_id, semana_referencia);

CREATE INDEX IF NOT EXISTS idx_exercicios_grupo_muscular 
ON exercicios(grupo_muscular);

-- =====================================================
-- INSTRUÇÕES DE EXECUÇÃO:
-- =====================================================
-- 1. Execute este script no Supabase SQL Editor
-- 2. Verifique se não há erros
-- 3. Confirme que os dados foram migrados corretamente
-- 4. O código agora deve funcionar com JOIN exercicios.grupo_muscular
-- 
-- MUDANÇAS REALIZADAS:
-- ✅ Removido numero_treino de protocolo_treinos e planejamento_semanal
-- ✅ Views dependentes dropadas e recriadas sem numero_treino
-- ✅ Validação dinâmica baseada em exercicios.grupo_muscular
-- ✅ Índices criados para performance com JOIN
-- 
-- VIEWS RECRIADAS:
-- - v_plano_usuario_semana (sem numero_treino)
-- - v_dashboard_usuario (agrupamento por tipo_atividade)
-- - v_planejamento_completo (JOIN com exercicios)
-- - v_protocolo_calendario_integrado (JOIN com exercicios)
-- 
-- EXEMPLO DE NOVA QUERY:
-- SELECT pt.*, e.grupo_muscular, e.nome
-- FROM protocolo_treinos pt
-- JOIN exercicios e ON pt.exercicio_id = e.id  
-- WHERE e.grupo_muscular = 'Pernas'
--   AND pt.protocolo_id = 1
--   AND pt.semana_referencia = 3
-- =====================================================