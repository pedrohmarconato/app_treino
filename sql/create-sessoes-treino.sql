-- =====================================================
-- CRIAÇÃO DA TABELA SESSÕES DE TREINO
-- =====================================================
-- 
-- Esta tabela armazena os METADADOS COMPLETOS de cada sessão de treino
-- enquanto as execuções individuais ficam em execucao_exercicio_usuario
--
-- IMPORTANTE: Executar no Supabase SQL Editor

-- 1. CRIAR TABELA PRINCIPAL
CREATE TABLE IF NOT EXISTS sessoes_treino (
    -- Identificação
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id TEXT NOT NULL,
    
    -- Referências
    protocolo_id INTEGER,
    
    -- Dados temporais (sempre em UTC no banco, conversão no app)
    data_treino DATE NOT NULL, -- Data do treino em São Paulo (YYYY-MM-DD)
    data_inicio TIMESTAMPTZ NOT NULL, -- Momento que começou (UTC)
    data_fim TIMESTAMPTZ NOT NULL, -- Momento que terminou (UTC)
    
    -- Duração
    tempo_total_segundos INTEGER NOT NULL,
    tempo_total_minutos INTEGER NOT NULL,
    
    -- Classificação do treino
    grupo_muscular TEXT NOT NULL,
    tipo_atividade TEXT NOT NULL,
    
    -- Estatísticas da sessão
    total_series INTEGER DEFAULT 0,
    exercicios_unicos INTEGER DEFAULT 0,
    peso_total_levantado DECIMAL(10,2) DEFAULT 0,
    repeticoes_totais INTEGER DEFAULT 0,
    series_falhadas INTEGER DEFAULT 0,
    
    -- Avaliação pós-treino (0-5 ou 1-10 dependendo do campo)
    post_workout INTEGER, -- Nível de fadiga após treino (0-5)
    dificuldade_percebida INTEGER, -- Dificuldade percebida (1-10)
    energia_nivel INTEGER, -- Nível de energia (1-10)
    observacoes_finais TEXT,
    
    -- Metadados técnicos
    plataforma TEXT,
    versao_app TEXT DEFAULT '2.0',
    status TEXT DEFAULT 'concluido',
    
    -- Auditoria
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_sessoes_treino_usuario_id ON sessoes_treino(usuario_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_treino_data_treino ON sessoes_treino(data_treino);
CREATE INDEX IF NOT EXISTS idx_sessoes_treino_usuario_data ON sessoes_treino(usuario_id, data_treino);
CREATE INDEX IF NOT EXISTS idx_sessoes_treino_created_at ON sessoes_treino(created_at);
CREATE INDEX IF NOT EXISTS idx_sessoes_treino_tipo ON sessoes_treino(tipo_atividade);
CREATE INDEX IF NOT EXISTS idx_sessoes_treino_grupo ON sessoes_treino(grupo_muscular);

-- 3. CRIAR TRIGGER PARA UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sessoes_treino_updated_at
    BEFORE UPDATE ON sessoes_treino
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. ADICIONAR COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON TABLE sessoes_treino IS 'Metadados completos de cada sessão de treino executada';
COMMENT ON COLUMN sessoes_treino.data_treino IS 'Data do treino no timezone de São Paulo (para agrupamento)';
COMMENT ON COLUMN sessoes_treino.data_inicio IS 'Timestamp UTC de início da sessão';
COMMENT ON COLUMN sessoes_treino.data_fim IS 'Timestamp UTC de fim da sessão';
COMMENT ON COLUMN sessoes_treino.tempo_total_segundos IS 'Duração total em segundos';
COMMENT ON COLUMN sessoes_treino.peso_total_levantado IS 'Soma de (peso × repetições) de todas as séries';
COMMENT ON COLUMN sessoes_treino.post_workout IS 'Nível de fadiga pós-treino (0=nenhum, 5=exausto)';
COMMENT ON COLUMN sessoes_treino.dificuldade_percebida IS 'Escala de dificuldade percebida (1-10)';
COMMENT ON COLUMN sessoes_treino.energia_nivel IS 'Nível de energia durante treino (1-10)';

-- 5. VERIFICAR SE A TABELA FOI CRIADA CORRETAMENTE
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'sessoes_treino' 
ORDER BY ordinal_position;

-- 6. EXEMPLO DE INSERT (TESTE)
/*
INSERT INTO sessoes_treino (
    usuario_id,
    data_treino,
    data_inicio,
    data_fim,
    tempo_total_segundos,
    tempo_total_minutos,
    grupo_muscular,
    tipo_atividade,
    total_series,
    exercicios_unicos,
    peso_total_levantado,
    repeticoes_totais,
    post_workout
) VALUES (
    'user123',
    '2025-01-15', -- Data em São Paulo
    '2025-01-15T17:30:00Z', -- 14:30 SP = 17:30 UTC
    '2025-01-15T18:45:00Z', -- 15:45 SP = 18:45 UTC  
    4500, -- 75 minutos
    75,
    'Peito e Tríceps',
    'Treino A',
    12,
    4,
    1250.50,
    144,
    3
);
*/

-- 7. VIEWS ÚTEIS PARA RELATÓRIOS

-- View com dados em timezone de São Paulo
CREATE OR REPLACE VIEW v_sessoes_treino_sp AS
SELECT 
    id,
    usuario_id,
    protocolo_id,
    data_treino,
    data_inicio AT TIME ZONE 'America/Sao_Paulo' as inicio_sp,
    data_fim AT TIME ZONE 'America/Sao_Paulo' as fim_sp,
    tempo_total_minutos,
    grupo_muscular,
    tipo_atividade,
    total_series,
    exercicios_unicos,
    peso_total_levantado,
    repeticoes_totais,
    series_falhadas,
    post_workout,
    dificuldade_percebida,
    energia_nivel,
    observacoes_finais,
    status,
    created_at AT TIME ZONE 'America/Sao_Paulo' as criado_em_sp
FROM sessoes_treino
ORDER BY data_treino DESC, inicio_sp DESC;

-- View de estatísticas por usuário
CREATE OR REPLACE VIEW v_estatisticas_usuario AS
SELECT 
    usuario_id,
    COUNT(*) as total_treinos,
    SUM(tempo_total_minutos) as tempo_total_minutos,
    AVG(tempo_total_minutos) as tempo_medio_minutos,
    SUM(total_series) as total_series,
    SUM(peso_total_levantado) as peso_total_levantado,
    AVG(post_workout) as fadiga_media,
    AVG(dificuldade_percebida) as dificuldade_media,
    AVG(energia_nivel) as energia_media,
    MAX(data_treino) as ultimo_treino,
    MIN(data_treino) as primeiro_treino
FROM sessoes_treino 
WHERE status = 'concluido'
GROUP BY usuario_id;

-- View de treinos por semana
CREATE OR REPLACE VIEW v_treinos_por_semana AS
SELECT 
    usuario_id,
    EXTRACT(YEAR FROM data_treino) as ano,
    EXTRACT(WEEK FROM data_treino) as semana,
    COUNT(*) as treinos_semana,
    SUM(tempo_total_minutos) as tempo_total_semana,
    AVG(post_workout) as fadiga_media_semana,
    ARRAY_AGG(DISTINCT grupo_muscular) as grupos_treinados
FROM sessoes_treino 
WHERE status = 'concluido'
GROUP BY usuario_id, ano, semana
ORDER BY ano DESC, semana DESC;

-- 8. FUNÇÕES ÚTEIS

-- Função para obter estatísticas de um usuário
CREATE OR REPLACE FUNCTION get_user_stats(user_id TEXT)
RETURNS TABLE (
    total_treinos BIGINT,
    tempo_total_horas NUMERIC,
    peso_total_kg NUMERIC,
    treino_mais_longo INTEGER,
    fadiga_media NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT,
        ROUND(SUM(tempo_total_minutos) / 60.0, 1),
        ROUND(SUM(peso_total_levantado), 1),
        MAX(tempo_total_minutos),
        ROUND(AVG(post_workout), 1)
    FROM sessoes_treino 
    WHERE usuario_id = user_id AND status = 'concluido';
END;
$$ LANGUAGE plpgsql;

-- Função para treinos da última semana
CREATE OR REPLACE FUNCTION get_recent_workouts(user_id TEXT, days_back INTEGER DEFAULT 7)
RETURNS TABLE (
    data_treino DATE,
    grupo_muscular TEXT,
    tempo_minutos INTEGER,
    series INTEGER,
    peso_total NUMERIC,
    fadiga INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        st.data_treino,
        st.grupo_muscular,
        st.tempo_total_minutos,
        st.total_series,
        st.peso_total_levantado,
        st.post_workout
    FROM sessoes_treino st
    WHERE st.usuario_id = user_id 
      AND st.status = 'concluido'
      AND st.data_treino >= CURRENT_DATE - INTERVAL '1 day' * days_back
    ORDER BY st.data_treino DESC;
END;
$$ LANGUAGE plpgsql;

-- 9. VERIFICAÇÕES FINAIS
SELECT 'Tabela sessoes_treino criada com sucesso!' as status;
SELECT 'Índices criados: ' || COUNT(*) FROM pg_indexes WHERE tablename = 'sessoes_treino';
SELECT 'Views criadas: ' || COUNT(*) FROM pg_views WHERE viewname LIKE 'v_%treino%' OR viewname LIKE 'v_%sessoes%';

-- 10. GRANTS DE PERMISSÃO (ajustar conforme necessário)
-- GRANT ALL ON sessoes_treino TO authenticated;
-- GRANT ALL ON v_sessoes_treino_sp TO authenticated;
-- GRANT ALL ON v_estatisticas_usuario TO authenticated;