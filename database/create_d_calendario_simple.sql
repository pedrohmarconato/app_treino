-- Script SQL simplificado para criar a tabela d_calendario no Supabase
-- Execute este script no SQL Editor do Supabase Dashboard

-- Criar a tabela d_calendario
CREATE TABLE IF NOT EXISTS d_calendario (
    id BIGSERIAL PRIMARY KEY,
    data_completa DATE NOT NULL UNIQUE,
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    dia INTEGER NOT NULL,
    dia_semana INTEGER NOT NULL, -- 1=Segunda, 2=Terça, ..., 7=Domingo
    semana_ano INTEGER NOT NULL, -- Semana do ano (1-53)
    semana_treino INTEGER, -- Referência da semana do protocolo de treino (1, 2, 3, ...)
    percentual_1rm DECIMAL(5,2), -- Percentual de 1RM para a semana (ex: 75.00, 80.00, 85.00)
    eh_semana_atual BOOLEAN DEFAULT FALSE, -- Indica se é a semana atual do treino
    eh_semana_ativa BOOLEAN DEFAULT TRUE, -- Indica se a semana está ativa para treino
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_d_calendario_data ON d_calendario(data_completa);
CREATE INDEX IF NOT EXISTS idx_d_calendario_ano_semana ON d_calendario(ano, semana_ano);
CREATE INDEX IF NOT EXISTS idx_d_calendario_semana_treino ON d_calendario(semana_treino);
CREATE INDEX IF NOT EXISTS idx_d_calendario_atual ON d_calendario(eh_semana_atual) WHERE eh_semana_atual = TRUE;
CREATE INDEX IF NOT EXISTS idx_d_calendario_ativa ON d_calendario(eh_semana_ativa) WHERE eh_semana_ativa = TRUE;

-- Constraint para garantir que apenas uma semana seja marcada como atual
CREATE UNIQUE INDEX IF NOT EXISTS idx_d_calendario_unica_atual ON d_calendario(eh_semana_atual) 
WHERE eh_semana_atual = TRUE;

-- Comentários nas colunas
COMMENT ON TABLE d_calendario IS 'Tabela de calendário com referências de semanas de treino e percentuais de 1RM';
COMMENT ON COLUMN d_calendario.data_completa IS 'Data completa no formato YYYY-MM-DD';
COMMENT ON COLUMN d_calendario.semana_treino IS 'Número da semana do protocolo de treino (1, 2, 3, ...)';
COMMENT ON COLUMN d_calendario.percentual_1rm IS 'Percentual de 1RM a ser usado nesta semana (ex: 75.00%)';
COMMENT ON COLUMN d_calendario.eh_semana_atual IS 'Indica se esta é a semana atual do treino (apenas uma por vez)';
COMMENT ON COLUMN d_calendario.eh_semana_ativa IS 'Indica se a semana está ativa para treino';

-- Verificar se a tabela foi criada corretamente
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'd_calendario' 
ORDER BY ordinal_position;