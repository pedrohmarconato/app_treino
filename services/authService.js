/**
 * 🔐 SERVIÇO DE AUTENTICAÇÃO - Authentication Service
 *
 * FUNÇÃO: Gerenciar autenticação de usuários com Supabase Auth.
 *
 * RESPONSABILIDADES:
 * - Registrar usuários antigos no Supabase Auth
 * - Fazer login com email/senha
 * - Gerenciar sessões de usuário
 * - Sincronizar dados entre Auth e tabela usuarios
 * - Migrar usuários existentes para o sistema de auth
 *
 * FUNCIONALIDADES:
 * - signUp(): Cadastrar novo usuário com auth
 * - signIn(): Login com email/senha
 * - signOut(): Logout do usuário
 * - migrateExistingUser(): Migrar usuário antigo
 * - getCurrentUser(): Obter usuário logado
 */

import { query, update, getSupabaseClient } from './supabaseService.js';

/**
 * Fazer login com email e senha
 */
export async function signIn(email, password) {
  console.log('[authService] 🔐 Tentando login para:', email);

  try {
    const client = window.supabaseClient || window.supabase;
    if (!client || !client.auth) {
      throw new Error('Cliente Supabase não inicializado');
    }
    
    const { data, error } = await client.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      console.error('[authService] ❌ Erro no login:', error);
      throw error;
    }

    console.log('[authService] ✅ Login realizado com sucesso');

    // Buscar dados completos do usuário na tabela usuarios
    const { data: userData } = await query('usuarios', {
      eq: { auth_uuid: data.user.id },
      limit: 1,
    });

    if (userData && userData.length > 0) {
      const usuario = userData[0];
      console.log('[authService] 👤 Usuário encontrado:', usuario.nome);

      // Retornar dados completos
      return {
        user: data.user,
        session: data.session,
        userData: usuario,
      };
    } else {
      console.warn('[authService] ⚠️ Usuário autenticado mas não encontrado na tabela usuarios');
      return {
        user: data.user,
        session: data.session,
        userData: null,
      };
    }
  } catch (error) {
    console.error('[authService] ❌ Erro no login:', error);
    throw error;
  }
}

/**
 * Cadastrar novo usuário com autenticação
 */
export async function signUp(email, password, userData) {
  console.log('[authService] 🆕 Cadastrando usuário:', email);

  try {
    const client = window.supabaseClient || window.supabase;
    if (!client || !client.auth) {
      throw new Error('Cliente Supabase não inicializado');
    }
    
    // 1. Criar usuário no Supabase Auth
    const { data, error } = await client.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          name: userData.nome,
        },
      },
    });

    if (error) {
      console.error('[authService] ❌ Erro no cadastro auth:', error);
      throw error;
    }

    console.log('[authService] ✅ Usuário criado no Auth:', data.user.id);

    // 2. Atualizar/criar registro na tabela usuarios com auth_uuid
    const usuarioData = {
      ...userData,
      auth_uuid: data.user.id,
      email: email,
      status: 'ativo',
    };

    // Se já existe um usuário com este email, atualizar
    const { data: existingUser } = await query('usuarios', {
      eq: { email: email },
      limit: 1,
    });

    let finalUser;
    if (existingUser && existingUser.length > 0) {
      // Atualizar usuário existente
      const { data: updatedUser } = await update(
        'usuarios',
        { auth_uuid: data.user.id },
        { eq: { email: email } }
      );
      finalUser = updatedUser[0];
      console.log('[authService] 🔄 Usuário existente atualizado com auth_uuid');
    } else {
      // Criar novo usuário
      const { insert } = await import('./supabaseService.js');
      const { data: newUser } = await insert('usuarios', usuarioData);
      finalUser = newUser[0];
      console.log('[authService] 👤 Novo usuário criado na tabela');
    }

    return {
      user: data.user,
      session: data.session,
      userData: finalUser,
    };
  } catch (error) {
    console.error('[authService] ❌ Erro no cadastro:', error);
    throw error;
  }
}

/**
 * Fazer logout
 */
export async function signOut() {
  console.log('[authService] 🚪 Fazendo logout...');

  try {
    const client = window.supabaseClient || window.supabase;
    if (!client || !client.auth) {
      throw new Error('Cliente Supabase não inicializado');
    }
    
    const { error } = await client.auth.signOut();

    if (error) {
      console.error('[authService] ❌ Erro no logout:', error);
      throw error;
    }

    console.log('[authService] ✅ Logout realizado com sucesso');

    // Limpar estado local
    if (window.AppState) {
      window.AppState.set('currentUser', null);
      window.AppState.set('session', null);
    }
  } catch (error) {
    console.error('[authService] ❌ Erro no logout:', error);
    throw error;
  }
}

/**
 * Obter usuário atual logado
 */
export async function getCurrentUser() {
  try {
    const client = window.supabaseClient || window.supabase;
    if (!client || !client.auth) {
      return null;
    }
    
    const {
      data: { user },
    } = await client.auth.getUser();

    if (!user) {
      return null;
    }

    // Buscar dados completos na tabela usuarios
    const { data: userData } = await query('usuarios', {
      eq: { auth_uuid: user.id },
      limit: 1,
    });

    return {
      user: user,
      userData: userData && userData.length > 0 ? userData[0] : null,
    };
  } catch (error) {
    console.error('[authService] ❌ Erro ao obter usuário atual:', error);
    return null;
  }
}

/**
 * Migrar usuário existente para o sistema de autenticação
 */
export async function migrateExistingUser(userId, password) {
  console.log('[authService] 🔄 Migrando usuário ID:', userId);

  try {
    // 1. Buscar usuário na tabela
    const { data: usuarios } = await query('usuarios', {
      eq: { id: userId },
      limit: 1,
    });

    if (!usuarios || usuarios.length === 0) {
      throw new Error('Usuário não encontrado');
    }

    const usuario = usuarios[0];

    if (usuario.auth_uuid) {
      console.log('[authService] ⚠️ Usuário já migrado');
      return { alreadyMigrated: true, userData: usuario };
    }

    if (!usuario.email) {
      throw new Error('Usuário não possui email cadastrado');
    }

    console.log('[authService] 📧 Criando auth para:', usuario.email);

    // 2. Criar no Supabase Auth
    const client = window.supabaseClient || window.supabase;
    if (!client || !client.auth) {
      throw new Error('Cliente Supabase não inicializado');
    }
    
    const { data, error } = await client.auth.signUp({
      email: usuario.email,
      password: password,
      options: {
        data: {
          name: usuario.nome,
        },
      },
    });

    if (error) {
      console.error('[authService] ❌ Erro na criação auth:', error);
      throw error;
    }

    console.log('[authService] ✅ Auth criado:', data.user.id);

    // 3. Atualizar tabela usuarios com auth_uuid
    const { data: updatedUser } = await update(
      'usuarios',
      { auth_uuid: data.user.id },
      { eq: { id: userId } }
    );

    console.log('[authService] ✅ Usuário migrado com sucesso');

    return {
      user: data.user,
      session: data.session,
      userData: updatedUser[0],
      migrated: true,
    };
  } catch (error) {
    console.error('[authService] ❌ Erro na migração:', error);
    throw error;
  }
}

/**
 * Verificar se usuário precisa de migração
 */
export async function needsMigration(userId) {
  try {
    const { data: usuarios } = await query('usuarios', {
      eq: { id: userId },
      limit: 1,
    });

    if (!usuarios || usuarios.length === 0) {
      return false;
    }

    const usuario = usuarios[0];
    return !usuario.auth_uuid && !!usuario.email;
  } catch (error) {
    console.error('[authService] ❌ Erro ao verificar migração:', error);
    return false;
  }
}

/**
 * Listar usuários que precisam de migração
 */
export async function getUsersNeedingMigration() {
  try {
    const { data: usuarios } = await query('usuarios', {
      is: { auth_uuid: null },
      not: { email: null },
    });

    return usuarios || [];
  } catch (error) {
    console.error('[authService] ❌ Erro ao listar usuários para migração:', error);
    return [];
  }
}

/**
 * Resetar senha de usuário
 * @param {string} email - Email do usuário
 * @returns {Promise<Object>} Resultado da operação
 */
export async function resetPassword(email) {
  console.log('[authService] 🔄 Solicitando reset de senha para:', email);

  try {
    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Formato de email inválido');
    }

    // Obter cliente Supabase
    let client = window.supabaseClient || window.supabase;
    
    // Se não encontrou, tentar obter via getSupabaseClient
    if (!client) {
      console.log('[authService] Tentando obter cliente via getSupabaseClient...');
      client = await getSupabaseClient();
    }
    
    if (!client || !client.auth) {
      throw new Error('Cliente Supabase não inicializado');
    }

    // Determinar URL de redirecionamento baseado no ambiente
    const isProduction = window.location.hostname !== 'localhost' && 
                        window.location.hostname !== '127.0.0.1';
    const redirectTo = isProduction 
      ? 'https://app-treino-pmarconatos-projects.vercel.app/reset-password'
      : `${window.location.origin}/reset-password`;
    
    console.log('[authService] 📧 Enviando email de reset para:', email);
    console.log('[authService] 🔗 Redirect URL:', redirectTo);
    
    // Enviar email de reset - O Supabase já verifica se o email existe
    const { data, error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: `${redirectTo}?email=${encodeURIComponent(email)}`,
      captchaToken: null, // Pode ser usado para captcha se necessário
    });

    if (error) {
      console.error('[authService] ❌ Erro no reset:', error);

      // Melhor tratamento de erros específicos
      if (error.message?.includes('Email rate limit exceeded')) {
        throw new Error(
          'Muitas tentativas de reset. Aguarde alguns minutos antes de tentar novamente.'
        );
      } else if (error.message?.includes('Invalid email')) {
        throw new Error('Email inválido');
      } else {
        // Não expor se o email existe ou não por segurança
        throw new Error('Se o email estiver cadastrado, você receberá as instruções de recuperação');
      }
    }

    console.log('[authService] ✅ Email de reset processado com sucesso');

    // Sempre retornar sucesso para não expor se o email existe
    return {
      success: true,
      email: email,
      message: 'Se o email estiver cadastrado, você receberá as instruções de recuperação',
      data: data,
    };
  } catch (error) {
    console.error('[authService] ❌ Erro no reset de senha:', error);

    // Para erros de validação, retornar mensagem específica
    if (error.message === 'Formato de email inválido' || 
        error.message === 'Cliente Supabase não inicializado') {
      return {
        success: false,
        error: error,
        message: error.message,
      };
    }

    // Para outros erros, retornar mensagem genérica por segurança
    return {
      success: true,
      email: email,
      message: 'Se o email estiver cadastrado, você receberá as instruções de recuperação',
    };
  }
}

/**
 * Verificar se email já está cadastrado no Auth
 */
export async function checkEmailExists(email) {
  try {
    console.log('[authService] Debug - window.supabaseClient:', window.supabaseClient);
    console.log('[authService] Debug - window.supabase:', window.supabase);
    
    // Tentar várias formas de acessar o cliente
    let client = window.supabaseClient || window.supabase;
    
    // Se não encontrou, tentar importar e obter
    if (!client) {
      console.log('[authService] Tentando obter cliente via getSupabaseClient...');
      const supabaseClient = await getSupabaseClient();
      client = supabaseClient;
    }
    
    console.log('[authService] Debug - client:', client);
    console.log('[authService] Debug - client?.auth:', client?.auth);
    console.log('[authService] Debug - typeof client?.auth:', typeof client?.auth);
    
    if (!client || !client.auth) {
      console.error('[authService] Cliente Supabase não inicializado');
      console.error('[authService] client:', client);
      console.error('[authService] client?.auth:', client?.auth);
      
      // Tentar verificar diretamente na tabela como fallback
      console.log('[authService] Tentando verificar email diretamente na tabela...');
      const { data: users } = await query('usuarios', {
        eq: { email: email },
        limit: 1
      });
      
      return users && users.length > 0;
    }
    
    // Tentar fazer login com senha falsa para verificar se o email existe
    const { error } = await client.auth.signInWithPassword({
      email: email,
      password: 'fake-password-to-test',
    });

    // Se o erro for "Invalid login credentials", o email existe
    // Se for "User not found" ou similar, não existe
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        return true; // Email existe
      } else {
        return false; // Email não existe
      }
    }

    return true; // Login funcionou (improvável com senha fake)
  } catch (error) {
    console.error('[authService] ❌ Erro ao verificar email:', error);
    return false;
  }
}
