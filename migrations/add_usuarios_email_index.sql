-- Migration: Adicionar índice único para email na tabela usuarios
-- Data: 2024-01-18
-- Objetivo: Melhorar performance de consultas por email e garantir unicidade

-- Verificar se o índice já existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'usuarios' 
        AND indexname = 'idx_usuarios_email_unique'
    ) THEN
        -- Criar índice único para email
        CREATE UNIQUE INDEX idx_usuarios_email_unique ON usuarios(email);
        RAISE NOTICE 'Índice único criado para usuarios.email';
    ELSE
        RAISE NOTICE 'Índice único para usuarios.email já existe';
    END IF;
END $$;

-- Adicionar constraint de email único se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'usuarios_email_key' 
        AND table_name = 'usuarios'
    ) THEN
        ALTER TABLE usuarios ADD CONSTRAINT usuarios_email_key UNIQUE (email);
        RAISE NOTICE 'Constraint única adicionada para usuarios.email';
    ELSE
        RAISE NOTICE 'Constraint única para usuarios.email já existe';
    END IF;
END $$;

-- Comentário na coluna para documentação
COMMENT ON COLUMN usuarios.email IS 'Email único do usuário - usado para identificação e cadastro';

-- Verificar dados duplicados antes da migration (opcional - para debug)
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT email, COUNT(*) 
        FROM usuarios 
        WHERE email IS NOT NULL 
        GROUP BY email 
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF duplicate_count > 0 THEN
        RAISE WARNING 'Encontrados % emails duplicados na tabela usuarios', duplicate_count;
        -- Listar emails duplicados para análise
        FOR duplicate_email IN 
            SELECT email, COUNT(*) as count
            FROM usuarios 
            WHERE email IS NOT NULL 
            GROUP BY email 
            HAVING COUNT(*) > 1
        LOOP
            RAISE NOTICE 'Email duplicado: % (% ocorrências)', duplicate_email.email, duplicate_email.count;
        END LOOP;
    ELSE
        RAISE NOTICE 'Nenhum email duplicado encontrado - migration pode prosseguir';
    END IF;
END $$;