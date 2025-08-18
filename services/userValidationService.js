/**
 * 🔐 SERVIÇO DE VALIDAÇÃO DE USUÁRIOS - User Validation Service
 * 
 * FUNÇÃO: Validar dados de entrada e implementar proteções de segurança.
 * 
 * RESPONSABILIDADES:
 * - Validar formato e conteúdo dos dados de entrada
 * - Implementar rate limiting client-side
 * - Sanitizar dados contra XSS e injeções
 * - Registrar logs LGPD de consentimento
 * - Detectar tentativas de spam/bot
 * 
 * FUNCIONALIDADES:
 * - validateUserData(): Validação completa dos dados
 * - checkRateLimit(): Controle de tentativas por hora
 * - logLGPDConsent(): Logs de consentimento
 * - sanitizeInput(): Limpeza de dados
 * 
 * SEGURANÇA:
 * - Rate limiting: 3 tentativas por hora
 * - Validação regex para email e nomes
 * - Verificação de idade mínima (13 anos)
 * - Escape de caracteres especiais
 */

const RATE_LIMIT_KEY = 'cadastro_rate_limit';
const MAX_ATTEMPTS = 3;
const RATE_WINDOW = 60 * 60 * 1000; // 1 hora em millisegundos

/**
 * Verificar rate limiting de cadastro
 */
export async function checkRateLimit() {
    const stored = localStorage.getItem(RATE_LIMIT_KEY);
    const now = Date.now();
    
    if (!stored) {
        // Primeira tentativa
        localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify({
            attempts: 1,
            firstAttempt: now
        }));
        console.log('[validation] ✅ Rate limit: primeira tentativa registrada');
        return true;
    }
    
    const data = JSON.parse(stored);
    
    // Reset window se passou 1 hora
    if (now - data.firstAttempt > RATE_WINDOW) {
        localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify({
            attempts: 1,
            firstAttempt: now
        }));
        console.log('[validation] ✅ Rate limit: janela resetada após 1h');
        return true;
    }
    
    // Verificar limite
    if (data.attempts >= MAX_ATTEMPTS) {
        const tempoRestante = Math.ceil((RATE_WINDOW - (now - data.firstAttempt)) / 60000);
        console.warn('[validation] ❌ Rate limit excedido. Tempo restante:', tempoRestante, 'minutos');
        return false;
    }
    
    // Incrementar contador
    data.attempts++;
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data));
    console.log('[validation] ⚠️ Rate limit: tentativa', data.attempts, 'de', MAX_ATTEMPTS);
    
    return true;
}

/**
 * Validar dados do usuário
 */
export async function validateUserData(dados) {
    console.log('[validation] 🔍 Iniciando validação de dados...');
    
    const errors = {};
    
    // Validar nome
    if (!dados.nome || typeof dados.nome !== 'string') {
        errors.nome = 'Nome é obrigatório';
    } else {
        const nome = dados.nome.trim();
        if (nome.length < 2) {
            errors.nome = 'Nome deve ter pelo menos 2 caracteres';
        } else if (nome.length > 50) {
            errors.nome = 'Nome muito longo (máximo 50 caracteres)';
        } else if (!/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/.test(nome)) {
            errors.nome = 'Nome deve conter apenas letras e espaços';
        }
    }
    
    // Validar email
    if (!dados.email || typeof dados.email !== 'string') {
        errors.email = 'Email é obrigatório';
    } else {
        const email = dados.email.toLowerCase().trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!emailRegex.test(email)) {
            errors.email = 'Formato de email inválido';
        } else if (email.length > 100) {
            errors.email = 'Email muito longo (máximo 100 caracteres)';
        } else {
            // Verificar domínios suspeitos
            const suspiciousDomains = ['tempmail', 'throwaway', 'guerrillamail', '10minutemail'];
            const domain = email.split('@')[1];
            
            if (suspiciousDomains.some(sus => domain.includes(sus))) {
                errors.email = 'Por favor, use um email válido';
            }
        }
    }
    
    // Validar data de nascimento (opcional)
    if (dados.data_nascimento && dados.data_nascimento.trim()) {
        const data = new Date(dados.data_nascimento);
        const hoje = new Date();
        
        if (isNaN(data.getTime())) {
            errors.data_nascimento = 'Data de nascimento inválida';
        } else {
            const idade = hoje.getFullYear() - data.getFullYear();
            const mesAtual = hoje.getMonth() - data.getMonth();
            
            // Ajustar idade se ainda não fez aniversário este ano
            const idadeReal = mesAtual < 0 || (mesAtual === 0 && hoje.getDate() < data.getDate()) 
                ? idade - 1 
                : idade;
            
            if (idadeReal < 13) {
                errors.data_nascimento = 'Idade mínima: 13 anos';
            } else if (idadeReal > 100) {
                errors.data_nascimento = 'Idade máxima: 100 anos';
            } else if (data > hoje) {
                errors.data_nascimento = 'Data não pode ser no futuro';
            }
        }
    }
    
    // Se há erros, rejeitar
    if (Object.keys(errors).length > 0) {
        console.error('[validation] ❌ Erros de validação:', errors);
        const error = new Error('VALIDATION_ERROR');
        error.details = errors;
        throw error;
    }
    
    // Sanitização e retorno
    const dadosLimpos = {
        nome: sanitizeInput(dados.nome.trim()),
        email: dados.email.toLowerCase().trim(),
        data_nascimento: dados.data_nascimento ? dados.data_nascimento.trim() : null
    };
    
    console.log('[validation] ✅ Dados validados com sucesso');
    return dadosLimpos;
}

/**
 * Sanitizar entrada para prevenir XSS
 */
function sanitizeInput(input) {
    if (!input || typeof input !== 'string') return input;
    
    return input
        .replace(/[<>]/g, '') // Remove brackets
        .replace(/['"]/g, '') // Remove quotes
        .replace(/javascript:/gi, '') // Remove javascript protocol
        .replace(/on\w+=/gi, '') // Remove event handlers
        .trim();
}

/**
 * Registrar consentimento LGPD
 */
export function logLGPDConsent(userId, consentimento, detalhes = {}) {
    console.log('[validation] 📝 Registrando consentimento LGPD...');
    
    const log = {
        user_id: userId,
        consentimento: consentimento,
        timestamp: new Date().toISOString(),
        ip_hash: localStorage.getItem('ip_hash') || 'unknown',
        user_agent: navigator.userAgent.slice(0, 100),
        finalidade: 'Personalização de treinos e acompanhamento',
        base_legal: 'Consentimento explícito',
        ...detalhes
    };
    
    console.log('[validation] 📋 Log LGPD:', {
        user_id: log.user_id,
        consentimento: log.consentimento,
        timestamp: log.timestamp
    });
    
    // Armazenar em localStorage para auditoria
    try {
        const logs = JSON.parse(localStorage.getItem('lgpd_logs') || '[]');
        logs.push(log);
        
        // Manter apenas os últimos 100 logs para não sobrecarregar storage
        const logsLimitados = logs.slice(-100);
        localStorage.setItem('lgpd_logs', JSON.stringify(logsLimitados));
        
        console.log('[validation] ✅ Consentimento LGPD registrado');
        
    } catch (error) {
        console.error('[validation] ❌ Erro ao salvar log LGPD:', error);
    }
}

/**
 * Verificar se há tentativas suspeitas de bot
 */
export function detectBotBehavior(formData, timings) {
    const suspiciousPatterns = [];
    
    // Preenchimento muito rápido (< 2 segundos)
    if (timings.fillTime < 2000) {
        suspiciousPatterns.push('FILL_TOO_FAST');
    }
    
    // Valores idênticos em campos diferentes
    if (formData.nome === formData.email) {
        suspiciousPatterns.push('IDENTICAL_VALUES');
    }
    
    // Padrões conhecidos de bots
    const botPatterns = [/test/i, /bot/i, /spam/i, /admin/i];
    if (botPatterns.some(pattern => pattern.test(formData.nome) || pattern.test(formData.email))) {
        suspiciousPatterns.push('BOT_KEYWORDS');
    }
    
    // Múltiplas tentativas muito rápidas
    const recentAttempts = JSON.parse(localStorage.getItem('recent_attempts') || '[]');
    const now = Date.now();
    const recentCount = recentAttempts.filter(time => now - time < 30000).length; // 30 segundos
    
    if (recentCount > 2) {
        suspiciousPatterns.push('RAPID_ATTEMPTS');
    }
    
    // Registrar tentativa atual
    recentAttempts.push(now);
    localStorage.setItem('recent_attempts', JSON.stringify(recentAttempts.slice(-10)));
    
    if (suspiciousPatterns.length > 0) {
        console.warn('[validation] 🤖 Comportamento suspeito detectado:', suspiciousPatterns);
    }
    
    return {
        isSuspicious: suspiciousPatterns.length > 0,
        patterns: suspiciousPatterns,
        riskScore: suspiciousPatterns.length
    };
}

/**
 * Limpar dados de rate limiting (para admin/debug)
 */
export function resetRateLimit() {
    localStorage.removeItem(RATE_LIMIT_KEY);
    localStorage.removeItem('recent_attempts');
    console.log('[validation] 🔄 Rate limit resetado');
}

/**
 * Obter status atual de validação
 */
export function getValidationStatus() {
    const rateLimit = JSON.parse(localStorage.getItem(RATE_LIMIT_KEY) || '{}');
    const lgpdLogs = JSON.parse(localStorage.getItem('lgpd_logs') || '[]');
    const recentAttempts = JSON.parse(localStorage.getItem('recent_attempts') || '[]');
    
    return {
        rateLimit: {
            attempts: rateLimit.attempts || 0,
            maxAttempts: MAX_ATTEMPTS,
            timeWindow: RATE_WINDOW,
            timeRemaining: rateLimit.firstAttempt 
                ? Math.max(0, RATE_WINDOW - (Date.now() - rateLimit.firstAttempt))
                : 0
        },
        lgpd: {
            totalLogs: lgpdLogs.length,
            lastLog: lgpdLogs[lgpdLogs.length - 1]?.timestamp || null
        },
        security: {
            recentAttempts: recentAttempts.length,
            suspiciousActivity: recentAttempts.filter(time => Date.now() - time < 60000).length > 3
        }
    };
}