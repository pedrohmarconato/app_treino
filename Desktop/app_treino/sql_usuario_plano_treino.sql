-- Tabela para associar um usuário a um plano de treinamento específico
CREATE TABLE IF NOT EXISTS usuario_plano_treino (
    id BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    protocolo_treinamento_id BIGINT NOT NULL REFERENCES protocolos_treinamento(id) ON DELETE CASCADE,
    data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    semana_atual INTEGER NOT NULL DEFAULT 1, -- Para acompanhar o progresso no protocolo
    status TEXT DEFAULT 'ativo', -- Ex: ativo, pausado, concluído, cancelado
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_usuario_protocolo_data_inicio UNIQUE (usuario_id, protocolo_treinamento_id, data_inicio) -- Um usuário não pode iniciar o mesmo protocolo na mesma data mais de uma vez
);

-- Adicionar comentários para clareza
COMMENT ON TABLE usuario_plano_treino IS 'Associa um usuário a um protocolo de treinamento específico, registrando seu progresso (semana atual) e status.';
COMMENT ON COLUMN usuario_plano_treino.usuario_id IS 'ID do usuário que está seguindo o plano.';
COMMENT ON COLUMN usuario_plano_treino.protocolo_treinamento_id IS 'ID do protocolo de treinamento geral que o usuário está seguindo.';
COMMENT ON COLUMN usuario_plano_treino.data_inicio IS 'Data em que o usuário iniciou este protocolo de treinamento.';
COMMENT ON COLUMN usuario_plano_treino.semana_atual IS 'Semana atual do protocolo em que o usuário se encontra.';
COMMENT ON COLUMN usuario_plano_treino.status IS 'Status atual do usuário neste plano (ex: ativo, pausado, concluído).';

-- Habilitar RLS
ALTER TABLE usuario_plano_treino ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS SIMPLIFICADAS (permitem acesso mais amplo, adequado para o cenário descrito)
-- Para um app sem login formal e com usuários fixos, podemos ser mais permissivos.

CREATE POLICY "Permitir leitura de todos os planos de treino designados"
ON usuario_plano_treino
FOR SELECT
USING (true); -- Qualquer um pode ler

CREATE POLICY "Permitir inserção em planos de treino designados"
ON usuario_plano_treino
FOR INSERT
WITH CHECK (true); -- Qualquer um pode inserir

CREATE POLICY "Permitir atualização em planos de treino designados"
ON usuario_plano_treino
FOR UPDATE
USING (true)
WITH CHECK (true); -- Qualquer um pode atualizar

CREATE POLICY "Permitir deleção em planos de treino designados"
ON usuario_plano_treino
FOR DELETE
USING (true); -- Qualquer um pode deletar

-- Índices para otimizar consultas comuns
CREATE INDEX IF NOT EXISTS idx_usuario_plano_treino_usuario_id ON usuario_plano_treino(usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuario_plano_treino_protocolo_id ON usuario_plano_treino(protocolo_treinamento_id);
CREATE INDEX IF NOT EXISTS idx_usuario_plano_treino_status ON usuario_plano_treino(status);
