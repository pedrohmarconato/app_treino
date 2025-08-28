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

import { query, update } from './supabaseService.js';

/**
 * Fazer login com email e senha
 */
export async function signIn(email, password) {
  console.log('[authService] 🔐 Tentando login para:', email);

  try {
    const { data, error } = await window.supabase.auth.signInWithPassword({
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
    // 1. Criar usuário no Supabase Auth
    const { data, error } = await window.supabase.auth.signUp({
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
    const { error } = await window.supabase.auth.signOut();

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
    const {
      data: { user },
    } = await window.supabase.auth.getUser();

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
    const { data, error } = await window.supabase.auth.signUp({
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

    // Verificar se o usuário existe antes de enviar reset
    console.log('[authService] 🔍 Verificando se usuário existe...');
    const userExists = await checkEmailExists(email);

    if (!userExists) {
      console.log('[authService] ❌ Email não encontrado no sistema');
      throw new Error('User not found');
    }

    // Enviar email de reset com configurações melhoradas
    const { data, error } = await window.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password?email=${encodeURIComponent(email)}`,
      captchaToken: null, // Pode ser usado para captcha se necessário
    });

    if (error) {
      console.error('[authService] ❌ Erro no reset:', error);

      // Melhor tratamento de erros específicos
      if (error.message?.includes('Email rate limit exceeded')) {
        throw new Error(
          'Muitas tentativas de reset. Aguarde alguns minutos antes de tentar novamente.'
        );
      } else if (error.message?.includes('User not found')) {
        throw new Error('Email não encontrado em nosso sistema');
      } else if (error.message?.includes('Invalid email')) {
        throw new Error('Email inválido');
      } else {
        throw new Error(error.message || 'Erro ao enviar email de recuperação');
      }
    }

    console.log('[authService] ✅ Email de reset enviado com sucesso');

    // Retornar dados úteis para o modal
    return {
      success: true,
      email: email,
      message: 'Email de recuperação enviado com sucesso',
      data: data,
    };
  } catch (error) {
    console.error('[authService] ❌ Erro no reset de senha:', error);

    return {
      success: false,
      error: error,
      message: error.message || 'Erro desconhecido',
    };
  }
}

/**
 * Verificar se email já está cadastrado no Auth
 */
export async function checkEmailExists(email) {
  try {
    // Tentar fazer login com senha falsa para verificar se o email existe
    const { error } = await window.supabase.auth.signInWithPassword({
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
