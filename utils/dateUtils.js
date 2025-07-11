/**
 * 📅 UTILITÁRIOS DE DATA - Date Utils
 * 
 * FUNÇÃO: Centralizar todas as operações de data/hora com suporte correto para o fuso de São Paulo.
 * Substitui timezoneUtils.js com implementação mais robusta usando date-fns-tz.
 * 
 * RESPONSABILIDADES:
 * - Converter entre UTC e São Paulo timezone
 * - Garantir que todas as datas sejam salvas em UTC no banco
 * - Exibir sempre em horário de São Paulo para o usuário
 * - Tratar corretamente horário de verão (quando aplicável)
 * - Fornecer funções utilitárias para formatação
 * 
 * IMPORTANTE:
 * - Banco de dados SEMPRE em UTC
 * - Interface SEMPRE em São Paulo (America/Sao_Paulo)
 * - Usar estas funções em TODOS os lugares que manipulam datas
 */

// Using CDN versions instead of ES6 imports
const { format, parseISO, isValid } = window.dateFns || {};
const { zonedTimeToUtc, utcToZonedTime, formatInTimeZone } = window.dateFnsTz || {};
const { ptBR } = window.dateFns?.locale || {};

const TIMEZONE_SP = 'America/Sao_Paulo';

/**
 * Obtém a data/hora atual em São Paulo
 * @returns {Date} Data atual no timezone de São Paulo
 */
export function nowInSaoPaulo() {
    return utcToZonedTime(new Date(), TIMEZONE_SP);
}

/**
 * Converte uma data/hora de São Paulo para UTC (para salvar no banco)
 * @param {string|Date} spDateTime - Data/hora em São Paulo
 * @returns {Date} Data em UTC
 */
export function spToUtc(spDateTime) {
    if (!spDateTime) return null;
    
    // Se for string sem timezone info, assume São Paulo
    if (typeof spDateTime === 'string' && !spDateTime.includes('Z') && !spDateTime.includes('+') && !spDateTime.includes('-')) {
        return zonedTimeToUtc(spDateTime, TIMEZONE_SP);
    }
    
    // Se já for Date ou ISO string com timezone
    const date = typeof spDateTime === 'string' ? parseISO(spDateTime) : spDateTime;
    return isValid(date) ? date : null;
}

/**
 * Converte uma data UTC para São Paulo (para exibir ao usuário)
 * @param {string|Date} utcDateTime - Data/hora em UTC
 * @returns {Date} Data no timezone de São Paulo
 */
export function utcToSp(utcDateTime) {
    if (!utcDateTime) return null;
    
    const date = typeof utcDateTime === 'string' ? parseISO(utcDateTime) : utcDateTime;
    return isValid(date) ? utcToZonedTime(date, TIMEZONE_SP) : null;
}

/**
 * Formata uma data UTC para exibição em São Paulo
 * @param {string|Date} utcDateTime - Data/hora em UTC
 * @param {string} formatStr - String de formato (ex: 'dd/MM/yyyy HH:mm')
 * @returns {string} Data formatada no timezone de São Paulo
 */
export function formatInSP(utcDateTime, formatStr = 'dd/MM/yyyy HH:mm') {
    if (!utcDateTime) return '';
    
    const date = typeof utcDateTime === 'string' ? parseISO(utcDateTime) : utcDateTime;
    if (!isValid(date)) return '';
    
    return formatInTimeZone(date, TIMEZONE_SP, formatStr, { locale: ptBR });
}

/**
 * Obtém ISO string da data/hora atual em UTC (para salvar no banco)
 * @returns {string} ISO string em UTC
 */
export function nowUtcISO() {
    return new Date().toISOString();
}

/**
 * Obtém ISO string de uma data em São Paulo convertida para UTC
 * @param {string|Date} spDateTime - Data/hora em São Paulo
 * @returns {string} ISO string em UTC
 */
export function spToUtcISO(spDateTime) {
    const utcDate = spToUtc(spDateTime);
    return utcDate ? utcDate.toISOString() : null;
}

/**
 * Obtém apenas a data (YYYY-MM-DD) em São Paulo
 * @param {string|Date} utcDateTime - Data/hora em UTC
 * @returns {string} Data no formato YYYY-MM-DD
 */
export function getDateInSP(utcDateTime = new Date()) {
    return formatInSP(utcDateTime, 'yyyy-MM-dd');
}

/**
 * Combina data e hora em São Paulo e retorna UTC
 * @param {string} date - Data no formato YYYY-MM-DD
 * @param {string} time - Hora no formato HH:mm
 * @returns {Date} Data/hora em UTC
 */
export function combineDateTimeInSP(date, time) {
    if (!date) return null;
    
    const dateTimeStr = time ? `${date} ${time}` : `${date} 00:00`;
    return spToUtc(dateTimeStr);
}

/**
 * Verifica se duas datas são do mesmo dia em São Paulo
 * @param {string|Date} date1 - Primeira data (UTC)
 * @param {string|Date} date2 - Segunda data (UTC)
 * @returns {boolean} True se são do mesmo dia
 */
export function isSameDayInSP(date1, date2) {
    const d1 = getDateInSP(date1);
    const d2 = getDateInSP(date2);
    return d1 === d2;
}

/**
 * Debug helper - mostra conversões de timezone
 * @param {string|Date} dateTime - Data para debug
 * @param {string} label - Label para o console
 */
export function debugTimezone(dateTime, label = 'Debug') {
    const date = typeof dateTime === 'string' ? parseISO(dateTime) : dateTime;
    
    console.group(`🕐 ${label}`);
    console.log('Input:', dateTime);
    console.log('UTC:', date.toISOString());
    console.log('São Paulo:', formatInSP(date, 'yyyy-MM-dd HH:mm:ss zzz'));
    console.log('Timestamp:', date.getTime());
    console.groupEnd();
}

// Exporta funções compatíveis com timezoneUtils.js antigo
export const toSaoPauloISOString = (date) => formatInSP(date, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
export const toSaoPauloDateString = (date) => getDateInSP(date);
export const newSaoPauloDate = () => nowInSaoPaulo();
export const utcToSaoPaulo = (date) => utcToSp(date);
export const saoPauloToUtc = (date) => spToUtc(date);

// Disponibiliza globalmente para compatibilidade
if (typeof window !== 'undefined') {
    window.dateUtils = {
        nowInSaoPaulo,
        spToUtc,
        utcToSp,
        formatInSP,
        nowUtcISO,
        spToUtcISO,
        getDateInSP,
        combineDateTimeInSP,
        isSameDayInSP,
        debugTimezone,
        // Compatibilidade
        toSaoPauloISOString,
        toSaoPauloDateString,
        newSaoPauloDate,
        utcToSaoPaulo,
        saoPauloToUtc
    };
}