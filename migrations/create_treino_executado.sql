-- Criar tabela para agrupar sessões de treino executadas
CREATE TABLE IF NOT EXISTS treino_executado (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    data_treino DATE NOT NULL,
    grupo_muscular TEXT NOT NULL,
    tipo_atividade TEXT NOT NULL,
    protocolo_treino_id INTEGER,
    
    -- Status da sessão
    concluido BOOLEAN DEFAULT true,
    data_inicio TIMESTAMP,
    data_fim TIMESTAMP,
    
    -- Métricas do treino
    total_exercicios INTEGER DEFAULT 0,
    total_series INTEGER DEFAULT 0,
    peso_total DECIMAL(8,2) DEFAULT 0,
    duracao_minutos INTEGER,
    
    -- Relação com planejamento
    ano INTEGER,
    semana INTEGER, 
    dia_semana INTEGER,
    
    -- Metadados
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Índices para performance
    UNIQUE(usuario_id, data_treino, grupo_muscular)
);

-- Adicionar índices
CREATE INDEX IF NOT EXISTS idx_treino_executado_usuario_data 
ON treino_executado(usuario_id, data_treino);

CREATE INDEX IF NOT EXISTS idx_treino_executado_semana 
ON treino_executado(usuario_id, ano, semana);

-- Relacionar execuções existentes com sessões
ALTER TABLE execucao_exercicio_usuario 
ADD COLUMN IF NOT EXISTS treino_executado_id INTEGER 
REFERENCES treino_executado(id);

-- Trigger para atualizar métricas automaticamente
CREATE OR REPLACE FUNCTION atualizar_metricas_treino_executado()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE treino_executado 
    SET 
        total_exercicios = (
            SELECT COUNT(DISTINCT exercicio_id) 
            FROM execucao_exercicio_usuario 
            WHERE treino_executado_id = NEW.treino_executado_id
        ),
        total_series = (
            SELECT COUNT(*) 
            FROM execucao_exercicio_usuario 
            WHERE treino_executado_id = NEW.treino_executado_id
        ),
        peso_total = (
            SELECT COALESCE(SUM(peso_utilizado * repeticoes), 0)
            FROM execucao_exercicio_usuario 
            WHERE treino_executado_id = NEW.treino_executado_id
        ),
        updated_at = NOW()
    WHERE id = NEW.treino_executado_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_metricas_treino
    AFTER INSERT OR UPDATE OR DELETE ON execucao_exercicio_usuario
    FOR EACH ROW
    WHEN (NEW.treino_executado_id IS NOT NULL OR OLD.treino_executado_id IS NOT NULL)
    EXECUTE FUNCTION atualizar_metricas_treino_executado();