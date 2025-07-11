-- ========================================
-- CONFIGURAÇÕES DE TIMEZONE PARA SUPABASE
-- ========================================
-- 
-- Este arquivo contém queries SQL para verificar e configurar
-- corretamente o tratamento de timestamps no PostgreSQL/Supabase
-- para garantir que todas as datas reflitam o horário de São Paulo
--
-- IMPORTANTE: O banco deve permanecer em UTC, conversões no app!

-- 1. VERIFICAR CONFIGURAÇÕES ATUAIS
-- =================================

-- Verificar timezone atual do banco
SHOW timezone;

-- Verificar todas as tabelas com campos de timestamp
SELECT 
    table_name,
    column_name,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND data_type IN ('timestamp with time zone', 'timestamp without time zone', 'timestamptz')
ORDER BY table_name, column_name;

-- Verificar se existem timestamps sem timezone (perigoso!)
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND data_type = 'timestamp without time zone'
ORDER BY table_name, column_name;

-- 2. QUERIES DE TESTE PARA VALIDAÇÃO
-- ==================================

-- Testar conversão de timezone para registros existentes
SELECT 
    'execucao_exercicio_usuario' as tabela,
    data_execucao as utc_time,
    data_execucao AT TIME ZONE 'America/Sao_Paulo' as sao_paulo_time,
    EXTRACT(HOUR FROM data_execucao AT TIME ZONE 'America/Sao_Paulo') as hora_sp
FROM execucao_exercicio_usuario 
WHERE data_execucao >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY data_execucao DESC 
LIMIT 5;

-- Verificar planejamentos semanais
SELECT 
    ano,
    semana_treino,
    dia_semana,
    data_conclusao as utc_time,
    data_conclusao AT TIME ZONE 'America/Sao_Paulo' as sao_paulo_time
FROM planejamento_semanal 
WHERE data_conclusao IS NOT NULL
ORDER BY data_conclusao DESC 
LIMIT 5;

-- 3. VALIDAÇÃO DE DADOS EXISTENTES
-- ================================

-- Contar registros por dia em São Paulo vs UTC
SELECT 
    'UTC' as timezone_type,
    data_execucao::date as data_treino,
    COUNT(*) as total_execucoes
FROM execucao_exercicio_usuario 
WHERE data_execucao >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY data_execucao::date
ORDER BY data_treino DESC
LIMIT 10;

-- Mesma query mas com timezone de São Paulo
SELECT 
    'São Paulo' as timezone_type,
    (data_execucao AT TIME ZONE 'America/Sao_Paulo')::date as data_treino,
    COUNT(*) as total_execucoes
FROM execucao_exercicio_usuario 
WHERE data_execucao >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY (data_execucao AT TIME ZONE 'America/Sao_Paulo')::date
ORDER BY data_treino DESC
LIMIT 10;

-- 4. CRIAR FUNÇÕES UTILITÁRIAS (OPCIONAL)
-- =======================================

-- Função para converter UTC para São Paulo
CREATE OR REPLACE FUNCTION utc_to_sao_paulo(utc_timestamp TIMESTAMPTZ)
RETURNS TIMESTAMP AS $$
BEGIN
    RETURN utc_timestamp AT TIME ZONE 'America/Sao_Paulo';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Função para obter data atual em São Paulo
CREATE OR REPLACE FUNCTION now_sao_paulo()
RETURNS TIMESTAMP AS $$
BEGIN
    RETURN NOW() AT TIME ZONE 'America/Sao_Paulo';
END;
$$ LANGUAGE plpgsql STABLE;

-- Função para obter apenas a data (sem hora) em São Paulo
CREATE OR REPLACE FUNCTION today_sao_paulo()
RETURNS DATE AS $$
BEGIN
    RETURN (NOW() AT TIME ZONE 'America/Sao_Paulo')::date;
END;
$$ LANGUAGE plpgsql STABLE;

-- 5. VIEWS PARA RELATÓRIOS COM TIMEZONE CORRETO
-- =============================================

-- View para execuções com horário de São Paulo
CREATE OR REPLACE VIEW v_execucoes_sao_paulo AS
SELECT 
    id,
    usuario_id,
    exercicio_id,
    data_execucao as data_execucao_utc,
    data_execucao AT TIME ZONE 'America/Sao_Paulo' as data_execucao_sp,
    (data_execucao AT TIME ZONE 'America/Sao_Paulo')::date as data_treino_sp,
    peso_utilizado,
    repeticoes,
    serie_numero,
    falhou,
    observacoes
FROM execucao_exercicio_usuario;

-- View para planejamento com timezone correto
CREATE OR REPLACE VIEW v_planejamento_sao_paulo AS
SELECT 
    id,
    usuario_id,
    ano,
    semana_treino,
    dia_semana,
    tipo_atividade,
    concluido,
    data_conclusao as data_conclusao_utc,
    CASE 
        WHEN data_conclusao IS NOT NULL 
        THEN data_conclusao AT TIME ZONE 'America/Sao_Paulo'
        ELSE NULL 
    END as data_conclusao_sp,
    protocolo_treinamento_id
FROM planejamento_semanal;

-- 6. QUERIES DE VALIDAÇÃO FINAL
-- =============================

-- Verificar se as funções foram criadas
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('utc_to_sao_paulo', 'now_sao_paulo', 'today_sao_paulo');

-- Verificar se as views foram criadas
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'v_%sao_paulo';

-- Teste final: comparar hora atual em UTC vs São Paulo
SELECT 
    NOW() as utc_now,
    NOW() AT TIME ZONE 'America/Sao_Paulo' as sao_paulo_now,
    EXTRACT(HOUR FROM NOW()) as hora_utc,
    EXTRACT(HOUR FROM NOW() AT TIME ZONE 'America/Sao_Paulo') as hora_sp,
    CASE 
        WHEN EXTRACT(HOUR FROM NOW() AT TIME ZONE 'America/Sao_Paulo') = EXTRACT(HOUR FROM NOW()) - 3
        THEN 'TIMEZONE CORRETO (UTC-3)'
        ELSE 'VERIFICAR TIMEZONE'
    END as status_timezone;

-- 7. LIMPEZA (EXECUTAR APENAS SE NECESSÁRIO)
-- ==========================================

-- CUIDADO: Remover funções e views criadas (apenas se necessário)
/*
DROP VIEW IF EXISTS v_execucoes_sao_paulo;
DROP VIEW IF EXISTS v_planejamento_sao_paulo;
DROP FUNCTION IF EXISTS utc_to_sao_paulo(TIMESTAMPTZ);
DROP FUNCTION IF EXISTS now_sao_paulo();
DROP FUNCTION IF EXISTS today_sao_paulo();
*/

-- ========================================
-- RESUMO DAS MELHORES PRÁTICAS
-- ========================================
--
-- 1. SEMPRE manter o banco em UTC
-- 2. SEMPRE usar TIMESTAMPTZ para novos campos
-- 3. Converter timezone apenas na aplicação ou em views
-- 4. Usar as funções utilitárias para queries consistentes
-- 5. Testar conversões regularmente com as queries acima
-- 6. Nunca alterar a timezone base do banco Supabase
--
-- COMANDOS ÚTEIS PARA DEBUG:
-- - SELECT now_sao_paulo();
-- - SELECT today_sao_paulo();
-- - SELECT utc_to_sao_paulo(NOW());
-- - SELECT * FROM v_execucoes_sao_paulo WHERE data_treino_sp = today_sao_paulo();