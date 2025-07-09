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
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0Zm1rdGVjdmxseWlxZmthdmRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwNDQ2OTAsImV4cCI6MjA2MzYyMDY5MH0.PgEnBgtdITsb_G_ycSOaXOmkwNfpvIWVOOAsVrm2zCY'
};
