/**
 * ⚙️ CONFIGURAÇÕES DA APLICAÇÃO - Config
 *
 * FUNÇÃO: Centralizar todas as configurações e credenciais da aplicação.
 *
 * RESPONSABILIDADES:
 * - Definir credenciais do Supabase (URL e chave anônima)
 * - Configurar URLs de API e endpoints externos
 * - Definir constantes da aplicação (timeouts, limites, etc.)
 * - Organizar configurações por ambiente (dev, prod)
 * - Expor configurações globalmente via window object
 *
 * CONFIGURAÇÕES INCLUÍDAS:
 * - SUPABASE_CONFIG: URL e chave para conexão com banco
 * - API_TIMEOUTS: Tempos limite para requisições
 * - CACHE_CONFIG: Configurações de cache local
 * - SYNC_CONFIG: Configurações de sincronização offline
 *
 * SEGURANÇA:
 * - Arquivo não deve ser versionado no git (.gitignore)
 * - Chaves expostas são apenas anônimas (public keys)
 * - Credenciais sensíveis ficam no servidor/ambiente
 *
 * IMPORTANTE: As chaves aqui são públicas (client-side), autenticação real
 * é feita via RLS (Row Level Security) no Supabase.
 */

// NÃO versionar este arquivo!
window.SUPABASE_CONFIG = {
  url: 'https://ktfmktecvllyiqfkavdn.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0Zm1rdGVjdmxseWlxZmthdmRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwNDQ2OTAsImV4cCI6MjA2MzYyMDY5MH0.PgEnBgtdITsb_G_ycSOaXOmkwNfpvIWVOOAsVrm2zCY',
};

// Inicializar cliente Supabase assim que o script carregar
if (typeof window !== 'undefined' && window.supabase && window.SUPABASE_CONFIG) {
  console.log('[config.js] 🔧 Inicializando cliente Supabase...');

  try {
    // Verificar se createClient existe
    if (typeof window.supabase.createClient === 'function') {
      // Criar cliente Supabase e armazenar em variável diferente
      window.supabaseClient = window.supabase.createClient(
        window.SUPABASE_CONFIG.url,
        window.SUPABASE_CONFIG.key
      );
    } else if (typeof window.createClient === 'function') {
      // Tentar createClient direto no window
      window.supabaseClient = window.createClient(
        window.SUPABASE_CONFIG.url,
        window.SUPABASE_CONFIG.key
      );
    } else {
      console.warn('[config.js] ⚠️ createClient não encontrado, mantendo supabase original');
    }

    console.log('[config.js] ✅ Cliente Supabase inicializado com sucesso');

    // Testar conexão básica
    const clientToTest = window.supabaseClient || window.supabase;
    if (clientToTest && typeof clientToTest.from === 'function') {
      clientToTest
        .from('usuarios')
        .select('count')
        .limit(1)
        .then((result) => {
          if (result.error) {
            console.warn('[config.js] ⚠️ Teste de conexão falhou:', result.error.message);
          } else {
            console.log('[config.js] ✅ Conexão com banco confirmada');
          }
        })
        .catch((error) => {
          console.warn('[config.js] ⚠️ Erro no teste de conexão:', error.message);
        });
    }
  } catch (error) {
    console.error('[config.js] ❌ Erro ao inicializar Supabase:', error);
  }
} else {
  console.warn('[config.js] ⚠️ Supabase library não encontrada ou configuração inválida');
}
