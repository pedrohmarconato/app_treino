-- Adiciona a coluna 'auth_uuid' à tabela 'usuarios' se ela não existir
-- Esta coluna deve armazenar o ID do usuário da tabela 'auth.users' do Supabase (auth.uid()).
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS auth_uuid UUID;

COMMENT ON COLUMN public.usuarios.auth_uuid IS 'Referência ao ID de usuário da tabela auth.users do Supabase (auth.uid()). Usado para políticas de RLS e para ligar o usuário da sua tabela pública ao sistema de autenticação do Supabase.';

-- APÓS ADICIONAR A COLUNA, VOCÊ PRECISARÁ POPULÁ-LA PARA OS USUÁRIOS EXISTENTES.
-- Exemplo de como você poderia fazer isso (AJUSTE CONFORME SUA LÓGICA DE EMAIL/ID):
-- UPDATE public.usuarios u
-- SET auth_uuid = (SELECT id FROM auth.users au WHERE au.email = u.email)
-- WHERE u.auth_uuid IS NULL;

-- CONSIDERE ADICIONAR CONSTRAINTS E ÍNDICES APÓS POPULAR A COLUNA:

-- 1. CHAVE ESTRANGEIRA (FOREIGN KEY) - Garante integridade referencial
-- Se você adicionar esta constraint, certifique-se de que todos os 'auth_uuid' em 'public.usuarios'
-- realmente existam em 'auth.users.id' ou defina uma estratégia ON DELETE / ON UPDATE.
-- Exemplo:
-- ALTER TABLE public.usuarios 
-- ADD CONSTRAINT fk_usuarios_auth_users FOREIGN KEY (auth_uuid) 
-- REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE;
-- (ON DELETE SET NULL significa que se o usuário for deletado do Supabase Auth, o auth_uuid ficará nulo na sua tabela)
-- (ON DELETE CASCADE significaria que se o usuário for deletado do Supabase Auth, o registro em public.usuarios também seria deletado - use com cuidado)

-- 2. ÍNDICE ÚNICO (UNIQUE INDEX) - Garante que não haja auth_uuids duplicados e melhora a performance de buscas
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_auth_uuid ON public.usuarios(auth_uuid) WHERE auth_uuid IS NOT NULL;
-- (Adicionado 'WHERE auth_uuid IS NOT NULL' para permitir múltiplos nulos se a FK usar SET NULL)

-- LEMBRE-SE: Para novos usuários, sua lógica de cadastro no aplicativo ou um trigger no banco de dados
-- deve garantir que 'public.usuarios.auth_uuid' seja preenchido com o 'id' do usuário de 'auth.users'.
