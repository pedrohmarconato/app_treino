-- SQL para testar IDs reais válidos da base de dados
-- Baseado na estrutura encontrada nos arquivos do projeto

-- 1. CONSULTAR EXERCÍCIOS DISPONÍVEIS
SELECT 
    id,
    nome,
    grupo_muscular,
    equipamento
FROM exercicios 
ORDER BY id
LIMIT 10;

-- 2. CONSULTAR PROTOCOLOS DE TREINAMENTO
SELECT 
    id,
    nome,
    descricao,
    total_semanas,
    dias_por_semana
FROM protocolos_treinamento
ORDER BY id;

-- 3. CONSULTAR RELAÇÃO PROTOCOLO-EXERCÍCIOS
SELECT 
    pt.id,
    pt.protocolo_id,
    pt.exercicio_id,
    pt.semana_referencia,
    pt.tipo_atividade,
    pt.series,
    pt.repeticoes_alvo,
    pt.percentual_1rm_base,
    e.nome as exercicio_nome,
    e.grupo_muscular
FROM protocolo_treinos pt
INNER JOIN exercicios e ON e.id = pt.exercicio_id
ORDER BY pt.protocolo_id, pt.semana_referencia, pt.exercicio_id
LIMIT 20;

-- 4. VERIFICAR USUÁRIOS
SELECT 
    id,
    nome,
    status
FROM usuarios
ORDER BY id;

-- 5. VERIFICAR PLANOS ATIVOS
SELECT 
    upt.id,
    upt.usuario_id,
    upt.protocolo_treinamento_id,
    upt.semana_atual,
    upt.status,
    u.nome as usuario_nome,
    pt.nome as protocolo_nome
FROM usuario_plano_treino upt
INNER JOIN usuarios u ON u.id = upt.usuario_id
INNER JOIN protocolos_treinamento pt ON pt.id = upt.protocolo_treinamento_id
WHERE upt.status = 'ativo'
ORDER BY upt.usuario_id;

-- 6. GRUPOS MUSCULARES ÚNICOS
SELECT DISTINCT grupo_muscular
FROM exercicios
WHERE grupo_muscular IS NOT NULL
ORDER BY grupo_muscular;

-- 7. SEMANAS DISPONÍVEIS POR PROTOCOLO
SELECT DISTINCT 
    protocolo_id,
    semana_referencia
FROM protocolo_treinos
ORDER BY protocolo_id, semana_referencia;

-- 8. EXEMPLO DE TREINO PARA UM USUÁRIO ESPECÍFICO
-- (Assumindo usuário ID = 1 ou 2, protocolo ID = 1)
SELECT 
    pt.id as protocolo_treino_id,
    pt.protocolo_id,
    pt.exercicio_id,
    pt.semana_referencia,
    pt.tipo_atividade,
    pt.series,
    pt.repeticoes_alvo,
    pt.percentual_1rm_base,
    pt.percentual_1rm_min,
    pt.percentual_1rm_max,
    pt.tempo_descanso,
    pt.ordem_exercicio,
    e.nome as exercicio_nome,
    e.grupo_muscular,
    e.equipamento
FROM protocolo_treinos pt
INNER JOIN exercicios e ON e.id = pt.exercicio_id
WHERE pt.protocolo_id = 1 
  AND pt.semana_referencia = 1
  AND e.grupo_muscular = 'Peito'  -- ou 'Costas', 'Pernas', etc.
ORDER BY pt.ordem_exercicio;

-- 9. INSERIR DADOS DE TESTE SE NECESSÁRIO
-- (Descomente apenas se as tabelas estiverem vazias)

/*
-- Inserir usuários de teste
INSERT INTO usuarios (nome, email, data_nascimento, status) VALUES
('Pedro', 'pedro@teste.com', '1990-01-01', 'ativo'),
('Japa', 'japa@teste.com', '1985-05-15', 'ativo');

-- Inserir exercícios básicos
INSERT INTO exercicios (nome, grupo_muscular, equipamento) VALUES
('Supino Reto', 'Peito', 'Barra'),
('Supino Inclinado', 'Peito', 'Barra'),
('Crucifixo', 'Peito', 'Halteres'),
('Remada Curvada', 'Costas', 'Barra'),
('Puxada Frontal', 'Costas', 'Cabo'),
('Agachamento', 'Pernas', 'Barra'),
('Leg Press', 'Pernas', 'Máquina'),
('Desenvolvimento', 'Ombro e Braço', 'Halteres'),
('Rosca Direta', 'Ombro e Braço', 'Barra'),
('Tríceps Testa', 'Ombro e Braço', 'Barra');

-- Inserir protocolo básico
INSERT INTO protocolos_treinamento (nome, descricao, total_semanas, dias_por_semana) VALUES
('Protocolo Básico', 'Treino básico de força', 12, 3);

-- Inserir relações protocolo-exercícios (exemplo para semana 1)
INSERT INTO protocolo_treinos (protocolo_id, exercicio_id, tipo_atividade, semana_referencia, percentual_1rm_base, percentual_1rm_min, percentual_1rm_max, series, repeticoes_alvo, ordem_exercicio) VALUES
(1, 1, 'Peito', 1, 70, 65, 75, 4, 10, 1),
(1, 2, 'Peito', 1, 70, 65, 75, 3, 10, 2),
(1, 3, 'Peito', 1, 65, 60, 70, 3, 12, 3),
(1, 4, 'Costas', 1, 70, 65, 75, 4, 10, 1),
(1, 5, 'Costas', 1, 70, 65, 75, 3, 10, 2),
(1, 6, 'Pernas', 1, 75, 70, 80, 4, 8, 1),
(1, 7, 'Pernas', 1, 70, 65, 75, 3, 12, 2);

-- Inserir plano para usuário
INSERT INTO usuario_plano_treino (usuario_id, protocolo_treinamento_id, semana_atual, status) VALUES
(1, 1, 1, 'ativo'),
(2, 1, 1, 'ativo');
*/