/**
 * 🆕 SERVIÇO DE CADASTRO DE USUÁRIOS - User Registration Service
 *
 * FUNÇÃO: Gerenciar cadastro de novos usuários com validação e segurança.
 *
 * RESPONSABILIDADES:
 * - Validar dados de entrada (nome, email, data nascimento)
 * - Verificar unicidade de email no banco
 * - Criar usuário na tabela usuarios
 * - Vincular automaticamente ao protocolo padrão (ID=1)
 * - Registrar logs LGPD e eventos de observabilidade
 * - Implementar rate limiting e proteção anti-spam
 *
 * FUNCIONALIDADES:
 * - cadastrarNovoUsuario(): Função principal de cadastro
 * - Validação em tempo real de email único
 * - Criação automática de plano de treino padrão
 * - Logs de consentimento LGPD com IP hasheado
 * - Rate limiting via localStorage (3 tentativas/hora)
 *
 * SEGURANÇA:
 * - Sanitização de dados de entrada
 * - Verificação de honeypot anti-bot
 * - Hashing de IP para privacidade
 * - Rate limiting client-side
 */

import { insert, query } from './supabaseService.js';
import { validateUserData, checkRateLimit } from './userValidationService.js';

export async function cadastrarNovoUsuario(dadosUsuario) {
  console.log('[userRegistration] 🚀 Iniciando cadastro para:', dadosUsuario.email);

  try {
    // 1. Verificar rate limiting
    const rateLimitOk = await checkRateLimit();
    if (!rateLimitOk) {
      console.warn('[userRegistration] ❌ Rate limit excedido');
      throw new Error('RATE_LIMIT_EXCEEDED');
    }

    // 2. Validar dados de entrada
    console.log('[userRegistration] 🔍 Validando dados...');
    const dadosValidados = await validateUserData(dadosUsuario);

    // 3. Verificar email único
    console.log('[userRegistration] 📧 Verificando unicidade do email...');
    const { data: existingUser } = await query('usuarios', {
      eq: { email: dadosValidados.email },
      limit: 1,
    });

    if (existingUser && existingUser.length > 0) {
      console.warn('[userRegistration] ❌ Email já existe:', dadosValidados.email);
      throw new Error('EMAIL_ALREADY_EXISTS');
    }

    // 4. Inserir usuário
    console.log('[userRegistration] 👤 Criando usuário...');
    const userData = {
      nome: dadosValidados.nome,
      email: dadosValidados.email,
      data_nascimento: dadosValidados.data_nascimento || null,
      status: 'ativo',
      created_at: new Date().toISOString(),
      created_ip: await getHashedIP(),
    };

    const { data: novoUsuario, error: userError } = await insert('usuarios', userData);
    if (userError) {
      console.error('[userRegistration] ❌ Erro ao criar usuário:', userError);
      throw userError;
    }

    console.log('[userRegistration] ✅ Usuário criado com ID:', novoUsuario[0].id);

    // 5. Criar plano padrão (protocolo ID=1)
    console.log('[userRegistration] 📋 Criando plano de treino padrão...');
    const planoData = {
      usuario_id: novoUsuario[0].id,
      protocolo_treinamento_id: 1, // Protocolo padrão
      semana_atual: 1,
      status: 'ativo',
      data_inicio: new Date().toISOString().split('T')[0],
    };

    const { error: planoError } = await insert('usuario_plano_treino', planoData);
    if (planoError) {
      console.error('[userRegistration] ⚠️ Erro ao criar plano (continuando):', planoError);
      // Continua mesmo com erro no plano - pode ser criado depois
    } else {
      console.log('[userRegistration] ✅ Plano de treino criado');
    }

    // 6. Log evento sucesso
    const tempoTotal = Date.now() - (dadosUsuario._startTime || Date.now());

    if (window.trackEvent) {
      window.trackEvent('cadastro_sucesso', {
        user_id: novoUsuario[0].id,
        tempo_modal: tempoTotal,
        protocolo_id: 1,
        tem_data_nascimento: !!dadosValidados.data_nascimento,
      });
    }

    console.log('[userRegistration] 🎉 Cadastro concluído com sucesso!');
    console.log('[userRegistration] ⏱️ Tempo total:', tempoTotal + 'ms');

    return { data: novoUsuario[0], error: null };
  } catch (error) {
    console.error('[userRegistration] ❌ Erro no cadastro:', error);

    // Log evento erro
    const tempoTotal = Date.now() - (dadosUsuario._startTime || Date.now());

    if (window.trackEvent) {
      window.trackEvent('cadastro_erro', {
        erro_tipo: error.message,
        email: dadosUsuario.email,
        tempo_modal: tempoTotal,
      });
    }

    return { data: null, error };
  }
}

/**
 * Gerar IP hasheado para compliance LGPD
 */
async function getHashedIP() {
  try {
    // Tentar obter IP real
    const ip = await fetch('https://api.ipify.org?format=json')
      .then((r) => r.json())
      .then((d) => d.ip)
      .catch(() => '0.0.0.0');

    // Hash simples do IP (produção deveria usar crypto.subtle)
    const hashedIP = btoa(ip + '_salt_' + new Date().getDate()).slice(0, 8);

    // Armazenar para logs LGPD
    localStorage.setItem('ip_hash', hashedIP);

    console.log('[userRegistration] 🔐 IP hasheado para LGPD');
    return hashedIP;
  } catch (error) {
    console.warn('[userRegistration] ⚠️ Erro ao obter IP:', error);
    return 'unknown_' + Date.now().toString(36).slice(-4);
  }
}

/**
 * Verificar se protocolo padrão existe
 */
export async function verificarProtocoloPadrao() {
  try {
    const { data: protocolo } = await query('protocolos_treinamento', {
      eq: { id: 1 },
      single: true,
    });

    if (!protocolo) {
      console.error('[userRegistration] ❌ CRÍTICO: Protocolo padrão ID=1 não existe!');
      return false;
    }

    console.log('[userRegistration] ✅ Protocolo padrão verificado:', protocolo.nome);
    return true;
  } catch (error) {
    console.error('[userRegistration] ❌ Erro ao verificar protocolo padrão:', error);
    return false;
  }
}

/**
 * Obter estatísticas de cadastro (para admin)
 */
export async function getEstatisticasCadastro() {
  const logs = JSON.parse(localStorage.getItem('lgpd_logs') || '[]');
  const rateLimit = JSON.parse(localStorage.getItem('cadastro_rate_limit') || '{}');

  return {
    total_tentativas: logs.length,
    ultima_tentativa: logs[logs.length - 1]?.timestamp || null,
    rate_limit_atual: rateLimit.attempts || 0,
    reset_rate_limit: rateLimit.firstAttempt
      ? new Date(rateLimit.firstAttempt + 60 * 60 * 1000)
      : null,
  };
}
