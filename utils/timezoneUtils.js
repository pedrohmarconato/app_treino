/**
 * 🕐 UTILITÁRIOS DE FUSO HORÁRIO - Timezone Utils
 * 
 * FUNÇÃO: Gerenciar conversões precisas entre UTC e horário de São Paulo.
 * 
 * RESPONSABILIDADES:
 * - Converter datas UTC (do banco) para horário local de São Paulo
 * - Converter datas locais para UTC para salvar no banco
 * - Tratar automaticamente horário de verão brasileiro
 * - Fornecer formatação consistente de datas e horas
 * - Evitar problemas de timezone em operações críticas
 * - Manter precisão em cálculos de tempo (cronômetros, intervalos)
 * 
 * FUNÇÕES PRINCIPAIS:
 * - nowInSaoPaulo(): Data/hora atual no fuso de São Paulo
 * - toSaoPauloISOString(): Converte UTC para ISO string de São Paulo
 * - toSaoPauloDateString(): Formato de data brasileiro (DD/MM/AAAA)
 * - parseFromSaoPaulo(): Converte string São Paulo para UTC
 * 
 * CASOS DE USO:
 * - Salvar timestamp de execuções de treino
 * - Exibir horários corretos no dashboard
 * - Filtrar dados por dia/semana brasileira
 * - Calcular métricas diárias precisas
 * 
 * IMPORTANTE: Todas as datas no banco são UTC, UI sempre em horário de São Paulo
 */

/**
 * Converte data UTC para o fuso horário de São Paulo
 * @param {Date|string} utcDate - Data em UTC
 * @returns {Date} Data convertida para São Paulo
 */
export function utcToSaoPaulo(utcDate) {
    const date = new Date(utcDate);
    
    // Criar objeto Intl.DateTimeFormat para São Paulo
    const saoPauloTime = new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).formatToParts(date);

    // Construir nova data no timezone de São Paulo
    const parts = {};
    saoPauloTime.forEach(part => {
        parts[part.type] = part.value;
    });

    return new Date(`${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`);
}

/**
 * Converte data do fuso horário de São Paulo para UTC
 * @param {Date|string} saoPauloDate - Data em São Paulo
 * @returns {Date} Data convertida para UTC
 */
export function saoPauloToUtc(saoPauloDate) {
    const date = new Date(saoPauloDate);
    
    // Se a data não tem informação de timezone, assumir São Paulo
    if (!saoPauloDate.toString().includes('GMT') && !saoPauloDate.toString().includes('UTC')) {
        // Criar uma string de data assumindo São Paulo timezone
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
        
        // Usar um elemento temporário para ajustar timezone
        const tempDate = new Date(dateStr);
        const saoPauloOffset = getSaoPauloOffset(tempDate);
        
        // Ajustar para UTC
        return new Date(tempDate.getTime() + (saoPauloOffset * 60 * 1000));
    }
    
    return date;
}

/**
 * Obtém o offset de São Paulo em minutos (considerando horário de verão)
 * @param {Date} date - Data para calcular o offset
 * @returns {number} Offset em minutos
 */
function getSaoPauloOffset(date) {
    // São Paulo: UTC-3 (sem horário de verão desde 2019)
    // Mas mantemos a lógica para casos históricos
    const year = date.getFullYear();
    
    // A partir de 2019, São Paulo não tem mais horário de verão
    if (year >= 2019) {
        return -180; // UTC-3
    }
    
    // Para anos anteriores, verificar período de horário de verão
    // (mantido para compatibilidade com dados históricos)
    const startDST = getStartDST(year);
    const endDST = getEndDST(year);
    
    if (date >= startDST && date < endDST) {
        return -120; // UTC-2 (horário de verão)
    } else {
        return -180; // UTC-3 (horário padrão)
    }
}

/**
 * Obtém data de início do horário de verão para um ano específico
 * @param {number} year - Ano
 * @returns {Date} Data de início do horário de verão
 */
function getStartDST(year) {
    // Terceiro domingo de outubro (até 2017)
    // Primeiro domingo de novembro (2018)
    if (year === 2018) {
        return getNthSundayOfMonth(year, 10, 1); // Primeiro domingo de novembro
    } else {
        return getNthSundayOfMonth(year, 9, 3); // Terceiro domingo de outubro
    }
}

/**
 * Obtém data de fim do horário de verão para um ano específico
 * @param {number} year - Ano
 * @returns {Date} Data de fim do horário de verão
 */
function getEndDST(year) {
    // Terceiro domingo de fevereiro (até 2017)
    // Primeiro domingo de fevereiro (2018)
    if (year === 2018) {
        return getNthSundayOfMonth(year + 1, 1, 1); // Primeiro domingo de fevereiro do ano seguinte
    } else {
        return getNthSundayOfMonth(year + 1, 1, 3); // Terceiro domingo de fevereiro do ano seguinte
    }
}

/**
 * Obtém o N-ésimo domingo de um mês
 * @param {number} year - Ano
 * @param {number} month - Mês (0-11)
 * @param {number} n - Qual domingo (1-5)
 * @returns {Date} Data do N-ésimo domingo
 */
function getNthSundayOfMonth(year, month, n) {
    const firstDay = new Date(year, month, 1);
    const firstSunday = new Date(year, month, 1 + (7 - firstDay.getDay()) % 7);
    return new Date(year, month, firstSunday.getDate() + (n - 1) * 7);
}

/**
 * Obtém timestamp atual em São Paulo
 * @returns {string} Timestamp ISO string em São Paulo
 */
export function nowInSaoPaulo() {
    const now = new Date();
    const saoPauloDate = utcToSaoPaulo(now);
    return saoPauloDate.toISOString();
}

/**
 * Converte timestamp para formato de data de São Paulo (YYYY-MM-DD)
 * @param {Date|string} date - Data para converter
 * @returns {string} Data no formato YYYY-MM-DD em São Paulo
 */
export function toSaoPauloDateString(date) {
    const saoPauloDate = utcToSaoPaulo(date);
    return saoPauloDate.toISOString().split('T')[0];
}

/**
 * Converte timestamp para formato completo de São Paulo
 * @param {Date|string} date - Data para converter
 * @returns {string} Data no formato ISO em São Paulo
 */
export function toSaoPauloISOString(date) {
    const saoPauloDate = utcToSaoPaulo(date);
    return saoPauloDate.toISOString();
}

/**
 * Wrapper para new Date() que retorna horário de São Paulo
 * @returns {Date} Data atual em São Paulo
 */
export function newSaoPauloDate() {
    return utcToSaoPaulo(new Date());
}

// Compatibilidade global
if (typeof window !== 'undefined') {
    window.utcToSaoPaulo = utcToSaoPaulo;
    window.saoPauloToUtc = saoPauloToUtc;
    window.nowInSaoPaulo = nowInSaoPaulo;
    window.toSaoPauloDateString = toSaoPauloDateString;
    window.toSaoPauloISOString = toSaoPauloISOString;
    window.newSaoPauloDate = newSaoPauloDate;
}