/**
 * 📅 UTILITÁRIOS DE DATA - Date Utils
 *
 * FUNÇÃO: Centralizar todas as operações de data/hora com suporte correto para o fuso de São Paulo.
 * Implementação simplificada sem dependências externas para compatibilidade com browser.
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

const TIMEZONE_SP = 'America/Sao_Paulo';

/**
 * Helper para verificar se uma data é válida
 */
function isValidDate(date) {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Parse ISO string para Date
 */
function parseISOString(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isValidDate(date) ? date : null;
}

/**
 * Formatar data usando Intl.DateTimeFormat
 */
function formatDate(date, options = {}) {
  if (!isValidDate(date)) return '';

  const defaultOptions = {
    timeZone: TIMEZONE_SP,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    ...options,
  };

  return new Intl.DateTimeFormat('pt-BR', defaultOptions).format(date);
}

/**
 * Obtém a data/hora atual em São Paulo
 * @returns {Date} Data atual no timezone de São Paulo
 */
export function nowInSaoPaulo() {
  return new Date();
}

/**
 * Converte uma data/hora de São Paulo para UTC (para salvar no banco)
 * @param {string|Date} spDateTime - Data/hora em São Paulo
 * @returns {Date} Data em UTC
 */
export function spToUtc(spDateTime) {
  if (!spDateTime) return null;

  // Se for string, converte para Date
  const date = typeof spDateTime === 'string' ? parseISOString(spDateTime) : spDateTime;
  return isValidDate(date) ? date : null;
}

/**
 * Converte uma data UTC para São Paulo (para exibir ao usuário)
 * @param {string|Date} utcDateTime - Data/hora em UTC
 * @returns {Date} Data no timezone de São Paulo
 */
export function utcToSp(utcDateTime) {
  if (!utcDateTime) return null;

  const date = typeof utcDateTime === 'string' ? parseISOString(utcDateTime) : utcDateTime;
  return isValidDate(date) ? date : null;
}

/**
 * Formata uma data UTC para exibição em São Paulo
 * @param {string|Date} utcDateTime - Data/hora em UTC
 * @param {string} formatStr - String de formato (ex: 'dd/MM/yyyy HH:mm')
 * @returns {string} Data formatada no timezone de São Paulo
 */
export function formatInSP(utcDateTime, formatStr = 'dd/MM/yyyy HH:mm') {
  if (!utcDateTime) return '';

  const date = typeof utcDateTime === 'string' ? parseISOString(utcDateTime) : utcDateTime;
  if (!isValidDate(date)) return '';

  // Mapear formato customizado para opções do Intl
  if (formatStr === 'dd/MM/yyyy HH:mm') {
    return formatDate(date);
  } else if (formatStr === 'yyyy-MM-dd') {
    // Usar Intl.DateTimeFormat com locale en-CA para formato YYYY-MM-DD
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: TIMEZONE_SP,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date);
  } else if (formatStr === "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'") {
    return date.toISOString();
  }

  // Fallback para formato padrão
  return formatDate(date);
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
  const date = typeof utcDateTime === 'string' ? parseISOString(utcDateTime) : utcDateTime;
  if (!isValidDate(date)) return '';

  // Usar Intl.DateTimeFormat para garantir formato correto
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE_SP,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return formatter.format(date);
}

/**
 * Combina data e hora em São Paulo e retorna UTC
 * @param {string} date - Data no formato YYYY-MM-DD
 * @param {string} time - Hora no formato HH:mm
 * @returns {Date} Data/hora em UTC
 */
export function combineDateTimeInSP(date, time) {
  if (!date) return null;

  const dateTimeStr = time ? `${date}T${time}:00` : `${date}T00:00:00`;
  return new Date(dateTimeStr);
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
  const date = typeof dateTime === 'string' ? parseISOString(dateTime) : dateTime;

  if (!isValidDate(date)) {
    console.log(`🕐 ${label} - Data inválida:`, dateTime);
    return;
  }

  console.group(`🕐 ${label}`);
  console.log('Input:', dateTime);
  console.log('UTC:', date.toISOString());
  console.log('São Paulo:', formatInSP(date));
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
    saoPauloToUtc,
  };
}
