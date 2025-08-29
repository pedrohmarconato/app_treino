/**
 * 🔌 SERVIÇO DE CONEXÃO COM BANCO - Supabase Service
 *
 * FUNÇÃO: Interface única para comunicação com o banco de dados PostgreSQL via Supabase.
 *
 * RESPONSABILIDADES:
 * - Configurar e manter conexão com banco de dados Supabase
 * - Fornecer métodos padronizados para operações CRUD (query, insert, update, remove)
 * - Gerenciar autenticação e autorização de usuários
 * - Tratar erros de conexão e retries automáticos
 * - Logging detalhado de operações para debugging
 *
 * MÉTODOS PRINCIPAIS:
 * - query(): SELECT com filtros, ordenação, paginação
 * - insert(): INSERT com validação e retorno de dados
 * - update(): UPDATE com condições e validação
 * - remove(): DELETE com condições de segurança
 * - auth(): Métodos de autenticação (login, logout, signup)
 *
 * CONFIGURAÇÃO: Lê credenciais de window.SUPABASE_CONFIG (definido em config.js)
 */

// Aguardar configuração estar disponível
function waitForSupabaseConfig() {
  return new Promise((resolve) => {
    if (window.SUPABASE_CONFIG) {
      resolve();
      return;
    }

    const checkConfig = () => {
      if (window.SUPABASE_CONFIG) {
        console.log('[SUPABASE] Configuração carregada:', {
          url: window.SUPABASE_CONFIG.url,
          hasKey: !!window.SUPABASE_CONFIG.key,
        });
        resolve();
      } else {
        setTimeout(checkConfig, 50);
      }
    };
    checkConfig();
  });
}

// Estado de conectividade
let connectionStatus = {
  isOnline: navigator.onLine,
  lastCheck: null,
  retryCount: 0,
};

let supabase;

// Função para obter cliente Supabase
async function getSupabaseClient() {
  if (supabase) return supabase;

  await waitForSupabaseConfig();

  if (!window.SUPABASE_CONFIG.url || !window.SUPABASE_CONFIG.key) {
    console.warn('[supabaseService] ⚠️ Configuração do Supabase incompleta');
    return null;
  }

  // Verificar se já existe um cliente criado pelo config.js
  if (window.supabaseClient && typeof window.supabaseClient.from === 'function') {
    supabase = window.supabaseClient;
    console.log('[supabaseService] ✅ Reutilizando cliente Supabase do config.js');
    return supabase;
  } 
  
  // Tentar criar um novo cliente se necessário
  if (window.supabase && typeof window.supabase.createClient === 'function') {
    try {
      supabase = window.supabase.createClient(
        window.SUPABASE_CONFIG.url,
        window.SUPABASE_CONFIG.key,
        {
          realtime: { enabled: false },
          auth: { persistSession: false, autoRefreshToken: false },
        }
      );
      console.log('[supabaseService] ✅ Cliente Supabase criado com sucesso');
      return supabase;
    } catch (error) {
      console.error('[supabaseService] ❌ Erro ao criar cliente Supabase:', error);
      return null;
    }
  } else if (window.createClient && typeof window.createClient === 'function') {
    try {
      supabase = window.createClient(
        window.SUPABASE_CONFIG.url,
        window.SUPABASE_CONFIG.key,
        {
          realtime: { enabled: false },
          auth: { persistSession: false, autoRefreshToken: false },
        }
      );
      console.log('[supabaseService] ✅ Cliente Supabase criado com sucesso (createClient global)');
      return supabase;
    } catch (error) {
      console.error('[supabaseService] ❌ Erro ao criar cliente Supabase:', error);
      return null;
    }
  } else if (window.supabase && typeof window.supabase.from === 'function') {
    // supabase already initialized (client), reuse it
    supabase = window.supabase;
    console.log('[supabaseService] ✅ Reutilizando cliente Supabase existente');
    return supabase;
  } else {
    console.warn('[supabaseService] ⚠️ Biblioteca Supabase não encontrada');
    console.log('[supabaseService] Debug - window.supabase:', window.supabase);
    console.log('[supabaseService] Debug - window.createClient:', window.createClient);
    console.log('[supabaseService] Debug - window.supabaseClient:', window.supabaseClient);
    return null;
  }
}

// Teste inicial de conectividade
async function testConnection() {
  try {
    console.log('[Supabase] Testando conectividade...');
    const client = await getSupabaseClient();
    if (!client) {
      throw new Error('Cliente Supabase não inicializado');
    }
    const { error } = await client.from('usuarios').select('count').limit(1);

    if (error) {
      console.error('[Supabase] Erro no teste de conectividade:', error);
      connectionStatus.isOnline = false;
      return false;
    }

    console.log('[Supabase] Conectividade OK');
    connectionStatus.isOnline = true;
    connectionStatus.retryCount = 0;
    return true;
  } catch (error) {
    console.error('[Supabase] Falha no teste de conectividade:', error);
    connectionStatus.isOnline = false;
    return false;
  }
}

// Verificar conectividade periodicamente
window.addEventListener('online', () => {
  console.log('[Supabase] Conexão de rede restaurada');
  connectionStatus.isOnline = true;
  testConnection();
});

window.addEventListener('offline', () => {
  console.log('[Supabase] Conexão de rede perdida');
  connectionStatus.isOnline = false;
});

// Testar conectividade no startup
setTimeout(() => {
  testConnection();
}, 2000);

export { supabase, testConnection, connectionStatus };

// Função para detectar erros de rede
function isNetworkError(error) {
  if (!error) return false;

  const errorMessage = error.message?.toLowerCase() || '';
  const errorDetails = error.details?.toLowerCase() || '';

  return (
    errorMessage.includes('failed to fetch') ||
    errorMessage.includes('network') ||
    errorMessage.includes('err_network_changed') ||
    errorDetails.includes('failed to fetch') ||
    error.code === '' ||
    !navigator.onLine
  );
}

// Função wrapper com retry automático para operações críticas
export async function queryWithRetry(queryFn, options = {}) {
  const maxRetries = options.maxRetries || 3;
  const baseDelay = options.baseDelay || 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[queryWithRetry] Tentativa ${attempt}/${maxRetries}`);
      const result = await queryFn();

      if (result.error && isNetworkError(result.error) && attempt < maxRetries) {
        const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), 5000);
        console.log(`[queryWithRetry] Erro de rede detectado, retry em ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      return result;
    } catch (error) {
      console.error(`[queryWithRetry] Erro na tentativa ${attempt}:`, error);

      if (isNetworkError(error) && attempt < maxRetries) {
        const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), 5000);
        console.log(`[queryWithRetry] Retry em ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      throw error;
    }
  }
}

// Listener para mudanças de conectividade
let isOnline = navigator.onLine;
let networkNotificationShown = false;

window.addEventListener('online', () => {
  isOnline = true;
  console.log('[supabaseService] 🌐 Conexão restaurada');

  // Mostrar notificação de conexão restaurada
  if (networkNotificationShown && window.showNotification) {
    window.showNotification('Conexão restaurada!', 'success', false, 3000);
    networkNotificationShown = false;
  }
});

window.addEventListener('offline', () => {
  isOnline = false;
  console.log('[supabaseService] 📵 Conexão perdida');

  // Mostrar notificação de conexão perdida
  if (window.showNotification) {
    window.showNotification(
      'Sem conexão com a internet. Dados serão salvos localmente.',
      'warning',
      false,
      5000
    );
    networkNotificationShown = true;
  }
});

// Função que verifica conectividade antes de fazer query
export async function safeQuery(queryFn, options = {}) {
  if (!isOnline && !options.forceOffline) {
    console.warn('[safeQuery] Offline - não executando query');
    return {
      data: null,
      error: { message: 'Sem conexão com a internet', code: 'OFFLINE' },
      offline: true,
    };
  }

  return await queryWithRetry(queryFn, options);
}

// Funções auxiliares para queries comuns
export async function query(table, options = {}) {
  console.log(`[query] Consultando tabela: ${table}`, options);

  // Verificar se o cliente Supabase existe
  const client = await getSupabaseClient();
  if (!client) {
    console.error('[query] Cliente Supabase não está disponível');
    return {
      data: null,
      error: {
        message: 'Cliente Supabase não inicializado',
        code: 'CLIENT_NOT_INITIALIZED',
      },
    };
  }

  // Verificar conectividade antes de tentar
  if (!connectionStatus.isOnline && !navigator.onLine) {
    console.warn('[query] Sem conectividade - abortando query');
    return {
      data: null,
      error: {
        message: 'Sem conexão com a internet',
        code: 'NETWORK_ERROR',
        details: 'ERR_ADDRESS_UNREACHABLE',
      },
    };
  }

  try {
    let q = client.from(table);

    // Sempre usar select() primeiro
    if (options.select) {
      q = q.select(options.select);
    } else {
      q = q.select('*'); // Selecionar tudo por padrão
    }

    // Aplicar filtros
    if (options.eq) {
      Object.entries(options.eq).forEach(([key, value]) => {
        // Tratar valores null e undefined
        if (value === null || value === undefined || value === 'null' || value === 'undefined') {
          console.log(`[query] Aplicando filtro is null: ${key}`);
          q = q.is(key, null);
        } else {
          console.log(`[query] Aplicando filtro eq: ${key} = ${value}`);
          q = q.eq(key, value);
        }
      });
    }

    if (options.order) {
      q = q.order(options.order.column, { ascending: options.order.ascending ?? true });
    }
    if (options.limit) q = q.limit(options.limit);
    if (options.single) {
      q = q.single();
    } else if (options.maybeSingle) {
      q = q.maybeSingle();
    }

    console.log(`[query] Executando query na tabela ${table}...`);
    const { data, error } = await q;

    if (error) {
      // Tratar erro de "single" quando não há registros ou múltiplos (PGRST116)
      if (error.code === 'PGRST116') {
        console.warn(
          `[query] ⚠️ Nenhum resultado único para ${table}. Retornando null. Detalhes:`,
          error.message
        );
        return { data: null, error: null };
      }

      console.error(`[query] Erro na consulta ${table}:`, error);
      throw error;
    }

    console.log(`[query] Resultado da consulta ${table}:`, data);
    return { data, error: null };
  } catch (error) {
    console.error(`[query] Erro ao consultar ${table}:`, error);
    return { data: null, error };
  }
}

export async function insert(table, data) {
  // Verificar se o cliente Supabase existe
  if (!supabase) {
    console.error('[insert] Cliente Supabase não está disponível');
    return {
      data: null,
      error: {
        message: 'Cliente Supabase não inicializado',
        code: 'CLIENT_NOT_INITIALIZED',
      },
    };
  }

  try {
    console.log(`[insert] 📤 INICIANDO INSERT na tabela: ${table}`);
    console.log(`[insert] 📄 DADOS PARA INSERIR:`, JSON.stringify(data, null, 2));
    console.log(`[insert] 📊 QUANTIDADE DE REGISTROS:`, Array.isArray(data) ? data.length : 1);

    const { data: result, error } = await supabase.from(table).insert(data).select();

    if (error) {
      console.error(`[insert] ❌ ERRO do Supabase na tabela ${table}:`, error);
      console.error(`[insert] 🔍 DADOS QUE CAUSARAM ERRO:`, JSON.stringify(data, null, 2));
      throw error;
    }

    console.log(`[insert] ✅ SUCESSO ao inserir em ${table}!`);
    console.log(`[insert] 📥 RESULTADO RETORNADO:`, JSON.stringify(result, null, 2));
    console.log(`[insert] 📈 REGISTROS INSERIDOS:`, result?.length || 0);

    return { data: result, error: null };
  } catch (error) {
    console.error(`[insert] ❌ ERRO CRÍTICO ao inserir em ${table}:`, error);
    console.error(`[insert] 🔍 DADOS PROBLEMÁTICOS:`, JSON.stringify(data, null, 2));
    return { data: null, error };
  }
}

export async function update(table, data, filters) {
  // Verificar se o cliente Supabase existe
  if (!supabase) {
    console.error('[update] Cliente Supabase não está disponível');
    return {
      data: null,
      error: {
        message: 'Cliente Supabase não inicializado',
        code: 'CLIENT_NOT_INITIALIZED',
      },
    };
  }

  try {
    console.log(`[supabaseService] update chamado:`, { table, data, filters });

    let q = supabase.from(table).update(data);

    // Se filters é um número, assume que é um ID
    if (typeof filters === 'number' || typeof filters === 'string') {
      console.log(`[supabaseService] Usando ID filter:`, filters);
      q = q.eq('id', filters);
    }
    // Se filters é um objeto, aplica os filtros
    else if (filters && typeof filters === 'object' && filters.eq) {
      console.log(`[supabaseService] Aplicando filtros .eq:`, filters.eq);
      Object.entries(filters.eq).forEach(([key, value]) => {
        q = q.eq(key, value);
      });
    }
    // Suporte ao formato antigo (retrocompatibilidade)
    else if (filters && typeof filters === 'object') {
      console.warn('[supabaseService] Formato antigo de update detectado, use { eq: {...} }');
      console.warn('[supabaseService] Filters recebido:', filters);
      Object.entries(filters).forEach(([key, value]) => {
        if (key !== 'eq') {
          // Evitar processar 'eq' como coluna
          q = q.eq(key, value);
        }
      });
    }
    // Se filters está undefined
    else {
      console.error('[supabaseService] ERRO: filters não fornecido ou inválido:', filters);
      throw new Error('Filters obrigatório para update');
    }

    const { data: result, error } = await q.select();

    if (error) throw error;
    return { data: result, error: null };
  } catch (error) {
    console.error(`[supabaseService] Erro ao atualizar ${table}:`, error);
    console.error(`[supabaseService] Parâmetros: table=${table}, data=`, data, 'filters=', filters);
    return { data: null, error };
  }
}

export async function upsert(table, data, options = {}) {
  try {
    const { data: result, error } = await supabase.from(table).upsert(data, options).select();

    if (error) throw error;
    return { data: result, error: null };
  } catch (error) {
    console.error(`Erro ao fazer upsert em ${table}:`, error);
    return { data: null, error };
  }
}
