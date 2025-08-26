-- 📋 TABELA DE QUESTIONÁRIO DE USUÁRIOS
-- Esta tabela armazena as respostas do questionário inicial dos usuários

-- Criar tabela user_questionnaire
CREATE TABLE IF NOT EXISTS user_questionnaire (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    
    -- Dados pessoais
    nome VARCHAR(100) NOT NULL,
    genero VARCHAR(20) NOT NULL CHECK (genero IN ('masculino', 'feminino', 'outro')),
    data_nascimento DATE NOT NULL,
    peso DECIMAL(5,2) NOT NULL CHECK (peso >= 20 AND peso <= 300),
    altura INTEGER NOT NULL CHECK (altura >= 100 AND altura <= 250),
    
    -- Saúde e lesões
    possui_lesao BOOLEAN DEFAULT FALSE,
    tipos_lesao TEXT[], -- Array de tipos: ['joelho', 'ombro', 'costas', etc]
    descricao_lesoes TEXT,
    
    -- Experiência e objetivos
    experiencia VARCHAR(20) NOT NULL CHECK (experiencia IN ('iniciante', 'intermediario', 'avancado')),
    tempo_treino DECIMAL(3,1) DEFAULT 0 CHECK (tempo_treino >= 0 AND tempo_treino <= 20),
    objetivo VARCHAR(30) NOT NULL CHECK (objetivo IN ('hipertrofia', 'emagrecimento', 'forca', 'resistencia', 'condicionamento')),
    
    -- Preferências de treino
    dias_treino TEXT[] NOT NULL, -- Array: ['segunda', 'terca', 'quarta', etc]
    tempo_por_treino INTEGER NOT NULL CHECK (tempo_por_treino IN (30, 45, 60, 90)),
    incluir_cardio BOOLEAN DEFAULT FALSE,
    incluir_alongamento BOOLEAN DEFAULT FALSE,
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id), -- Um questionário por usuário
    CHECK (array_length(dias_treino, 1) >= 1) -- Pelo menos um dia de treino
);

-- Criar índices para performance
CREATE INDEX idx_user_questionnaire_user_id ON user_questionnaire(user_id);
CREATE INDEX idx_user_questionnaire_objetivo ON user_questionnaire(objetivo);
CREATE INDEX idx_user_questionnaire_experiencia ON user_questionnaire(experiencia);
CREATE INDEX idx_user_questionnaire_created_at ON user_questionnaire(created_at);

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_user_questionnaire_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar updated_at
CREATE TRIGGER trigger_user_questionnaire_updated_at
    BEFORE UPDATE ON user_questionnaire
    FOR EACH ROW
    EXECUTE FUNCTION update_user_questionnaire_updated_at();

-- Adicionar comentários para documentação
COMMENT ON TABLE user_questionnaire IS 'Armazena respostas do questionário inicial dos usuários';
COMMENT ON COLUMN user_questionnaire.user_id IS 'ID do usuário (FK para tabela usuarios)';
COMMENT ON COLUMN user_questionnaire.nome IS 'Nome completo do usuário';
COMMENT ON COLUMN user_questionnaire.genero IS 'Gênero: masculino, feminino ou outro';
COMMENT ON COLUMN user_questionnaire.data_nascimento IS 'Data de nascimento para cálculo de idade';
COMMENT ON COLUMN user_questionnaire.peso IS 'Peso em kg (20-300)';
COMMENT ON COLUMN user_questionnaire.altura IS 'Altura em cm (100-250)';
COMMENT ON COLUMN user_questionnaire.possui_lesao IS 'Indica se possui alguma lesão';
COMMENT ON COLUMN user_questionnaire.tipos_lesao IS 'Array com tipos de lesão';
COMMENT ON COLUMN user_questionnaire.descricao_lesoes IS 'Descrição detalhada das lesões';
COMMENT ON COLUMN user_questionnaire.experiencia IS 'Nível de experiência em treino';
COMMENT ON COLUMN user_questionnaire.tempo_treino IS 'Anos de experiência (0-20)';
COMMENT ON COLUMN user_questionnaire.objetivo IS 'Objetivo principal do treino';
COMMENT ON COLUMN user_questionnaire.dias_treino IS 'Array com dias da semana para treino';
COMMENT ON COLUMN user_questionnaire.tempo_por_treino IS 'Tempo em minutos por sessão';
COMMENT ON COLUMN user_questionnaire.incluir_cardio IS 'Se inclui cardio no treino';
COMMENT ON COLUMN user_questionnaire.incluir_alongamento IS 'Se inclui alongamento no treino';

-- RLS (Row Level Security) - opcional
-- ALTER TABLE user_questionnaire ENABLE ROW LEVEL SECURITY;

-- Política para usuários só acessarem seus próprios questionários
-- CREATE POLICY "Users can view own questionnaire" ON user_questionnaire
--     FOR ALL USING (user_id = auth.uid());

-- Exemplos de queries úteis:

-- 1. Obter questionário de um usuário específico
-- SELECT * FROM user_questionnaire WHERE user_id = $1;

-- 2. Verificar se usuário já preencheu questionário
-- SELECT EXISTS(SELECT 1 FROM user_questionnaire WHERE user_id = $1);

-- 3. Estatísticas gerais
-- SELECT 
--     objetivo,
--     COUNT(*) as quantidade,
--     ROUND(AVG(peso), 1) as peso_medio,
--     ROUND(AVG(altura), 1) as altura_media,
--     ROUND(AVG(tempo_treino), 1) as tempo_medio_treino
-- FROM user_questionnaire 
-- GROUP BY objetivo;

-- 4. Usuários com lesões por tipo
-- SELECT 
--     UNNEST(tipos_lesao) as tipo_lesao,
--     COUNT(*) as quantidade
-- FROM user_questionnaire 
-- WHERE possui_lesao = true
-- GROUP BY tipo_lesao
-- ORDER BY quantidade DESC;

-- 5. Frequência de treino por experiência
-- SELECT 
--     experiencia,
--     ROUND(AVG(array_length(dias_treino, 1)), 1) as dias_treino_medio,
--     ROUND(AVG(tempo_por_treino), 0) as tempo_sessao_medio
-- FROM user_questionnaire
-- GROUP BY experiencia;

-- 6. IMC calculado
-- SELECT 
--     nome,
--     peso,
--     altura,
--     ROUND(peso / POWER(altura::decimal / 100, 2), 1) as imc,
--     CASE 
--         WHEN peso / POWER(altura::decimal / 100, 2) < 18.5 THEN 'Abaixo do peso'
--         WHEN peso / POWER(altura::decimal / 100, 2) < 25 THEN 'Peso normal'
--         WHEN peso / POWER(altura::decimal / 100, 2) < 30 THEN 'Sobrepeso'
--         ELSE 'Obesidade'
--     END as classificacao_imc
-- FROM user_questionnaire
-- ORDER BY imc;