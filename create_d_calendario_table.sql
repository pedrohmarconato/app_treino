-- Script SQL para criar a tabela d_calendario no Supabase
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
CREATE INDEX idx_d_calendario_data ON d_calendario(data_completa);
CREATE INDEX idx_d_calendario_ano_semana ON d_calendario(ano, semana_ano);
CREATE INDEX idx_d_calendario_semana_treino ON d_calendario(semana_treino);
CREATE INDEX idx_d_calendario_atual ON d_calendario(eh_semana_atual) WHERE eh_semana_atual = TRUE;
CREATE INDEX idx_d_calendario_ativa ON d_calendario(eh_semana_ativa) WHERE eh_semana_ativa = TRUE;

-- Constraint para garantir que apenas uma semana seja marcada como atual
CREATE UNIQUE INDEX idx_d_calendario_unica_atual ON d_calendario(eh_semana_atual) 
WHERE eh_semana_atual = TRUE;

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_d_calendario_updated_at()
RETURNS TRIGGER AS $TRIGGER$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$TRIGGER$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_d_calendario_updated_at
    BEFORE UPDATE ON d_calendario
    FOR EACH ROW
    EXECUTE FUNCTION update_d_calendario_updated_at();

-- Comentários nas colunas
COMMENT ON TABLE d_calendario IS 'Tabela de calendário com referências de semanas de treino e percentuais de 1RM';
COMMENT ON COLUMN d_calendario.data_completa IS 'Data completa no formato YYYY-MM-DD';
COMMENT ON COLUMN d_calendario.semana_treino IS 'Número da semana do protocolo de treino (1, 2, 3, ...)';
COMMENT ON COLUMN d_calendario.percentual_1rm IS 'Percentual de 1RM a ser usado nesta semana (ex: 75.00%)';
COMMENT ON COLUMN d_calendario.eh_semana_atual IS 'Indica se esta é a semana atual do treino (apenas uma por vez)';
COMMENT ON COLUMN d_calendario.eh_semana_ativa IS 'Indica se a semana está ativa para treino';

-- Função para popular o calendário com dados base
CREATE OR REPLACE FUNCTION popular_d_calendario(
    data_inicio DATE DEFAULT CURRENT_DATE,
    data_fim DATE DEFAULT CURRENT_DATE + INTERVAL '1 year'
)
RETURNS INTEGER AS $POPULATE$
DECLARE
    data_atual DATE;
    contador INTEGER := 0;
    semana_ano_calc INTEGER;
    dia_semana_calc INTEGER;
BEGIN
    data_atual := data_inicio;
    
    WHILE data_atual <= data_fim LOOP
        -- Calcular semana do ano
        semana_ano_calc := EXTRACT(WEEK FROM data_atual);
        
        -- Calcular dia da semana (1=Segunda, 7=Domingo)
        dia_semana_calc := EXTRACT(DOW FROM data_atual);
        IF dia_semana_calc = 0 THEN 
            dia_semana_calc := 7; -- Domingo = 7
        END IF;
        
        -- Inserir registro se não existir
        INSERT INTO d_calendario (
            data_completa, 
            ano, 
            mes, 
            dia, 
            dia_semana, 
            semana_ano,
            eh_semana_ativa
        ) 
        VALUES (
            data_atual,
            EXTRACT(YEAR FROM data_atual),
            EXTRACT(MONTH FROM data_atual),
            EXTRACT(DAY FROM data_atual),
            dia_semana_calc,
            semana_ano_calc,
            TRUE
        )
        ON CONFLICT (data_completa) DO NOTHING;
        
        contador := contador + 1;
        data_atual := data_atual + INTERVAL '1 day';
    END LOOP;
    
    RETURN contador;
END;
$POPULATE$ LANGUAGE plpgsql;

    -- Popular o calendário para o próximo ano
    SELECT popular_d_calendario(CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year');

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

    -- Exemplo de como definir uma semana como atual com percentual de 1RM
    -- UPDATE d_calendario 
    -- SET eh_semana_atual = FALSE 
    -- WHERE eh_semana_atual = TRUE;

    -- UPDATE d_calendario 
    -- SET 
    --     semana_treino = 1,
    --     percentual_1rm = 75.00,
    --     eh_semana_atual = TRUE
    -- WHERE semana_ano = EXTRACT(WEEK FROM CURRENT_DATE) 
    --   AND ano = EXTRACT(YEAR FROM CURRENT_DATE);