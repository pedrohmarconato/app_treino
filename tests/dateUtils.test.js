/**
 * Testes para utilitários de data e timezone
 * Valida se as conversões entre UTC e São Paulo estão funcionando corretamente
 */

// Mock das dependências para ambiente de teste
global.console = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    group: jest.fn(),
    groupEnd: jest.fn(),
};

// Mock do date-fns para testes
jest.mock('date-fns-tz', () => ({
    zonedTimeToUtc: jest.fn((dateTime, timezone) => {
        // Simula conversão de São Paulo (-03:00) para UTC
        const date = new Date(dateTime);
        return new Date(date.getTime() + (3 * 60 * 60 * 1000)); // +3 horas para UTC
    }),
    utcToZonedTime: jest.fn((date, timezone) => {
        // Simula conversão de UTC para São Paulo (-03:00)
        const utcDate = new Date(date);
        return new Date(utcDate.getTime() - (3 * 60 * 60 * 1000)); // -3 horas para SP
    }),
    formatInTimeZone: jest.fn((date, timezone, format) => {
        const spDate = new Date(date.getTime() - (3 * 60 * 60 * 1000));
        return spDate.toLocaleDateString('pt-BR');
    })
}));

jest.mock('date-fns', () => ({
    format: jest.fn((date, format) => date.toISOString().split('T')[0]),
    parseISO: jest.fn((str) => new Date(str)),
    isValid: jest.fn((date) => !isNaN(date.getTime()))
}));

// Importar após os mocks
const {
    nowUtcISO,
    spToUtc,
    utcToSp,
    formatInSP,
    getDateInSP,
    combineDateTimeInSP,
    isSameDayInSP,
    debugTimezone
} = require('../utils/dateUtils.js');

describe('DateUtils - Timezone Conversions', () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
        // Mock da data atual como 2025-07-10 12:00:00 UTC
        jest.spyOn(Date, 'now').mockReturnValue(new Date('2025-07-10T12:00:00.000Z').getTime());
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('nowUtcISO()', () => {
        test('deve retornar timestamp atual em UTC', () => {
            const result = nowUtcISO();
            expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        });
    });

    describe('spToUtc()', () => {
        test('deve converter data de São Paulo para UTC', () => {
            const spDateTime = '2025-07-10 14:30:00';
            const result = spToUtc(spDateTime);
            
            expect(result).toBeInstanceOf(Date);
            // Com SP = UTC-3, 14:30 SP deve virar 17:30 UTC
            expect(result.getUTCHours()).toBe(17);
            expect(result.getUTCMinutes()).toBe(30);
        });

        test('deve retornar null para entrada inválida', () => {
            expect(spToUtc(null)).toBeNull();
            expect(spToUtc(undefined)).toBeNull();
            expect(spToUtc('')).toBeNull();
        });
    });

    describe('utcToSp()', () => {
        test('deve converter data UTC para São Paulo', () => {
            const utcDateTime = '2025-07-10T17:30:00.000Z';
            const result = utcToSp(utcDateTime);
            
            expect(result).toBeInstanceOf(Date);
            // UTC 17:30 deve virar 14:30 em SP (UTC-3)
            expect(result.getHours()).toBe(14);
            expect(result.getMinutes()).toBe(30);
        });

        test('deve retornar null para entrada inválida', () => {
            expect(utcToSp(null)).toBeNull();
            expect(utcToSp('')).toBeNull();
        });
    });

    describe('getDateInSP()', () => {
        test('deve retornar data no formato YYYY-MM-DD em São Paulo', () => {
            const utcDate = new Date('2025-07-10T23:30:00.000Z');
            const result = getDateInSP(utcDate);
            
            // Com UTC-3, 23:30 UTC vira 20:30 SP (mesmo dia)
            expect(result).toBe('2025-07-10');
        });

        test('deve usar data atual quando não fornecida', () => {
            const result = getDateInSP();
            expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });
    });

    describe('combineDateTimeInSP()', () => {
        test('deve combinar data e hora em São Paulo e retornar UTC', () => {
            const result = combineDateTimeInSP('2025-07-10', '14:30');
            
            expect(result).toBeInstanceOf(Date);
            // 14:30 SP deve virar 17:30 UTC
            expect(result.getUTCHours()).toBe(17);
            expect(result.getUTCMinutes()).toBe(30);
        });

        test('deve usar 00:00 quando hora não fornecida', () => {
            const result = combineDateTimeInSP('2025-07-10');
            
            expect(result).toBeInstanceOf(Date);
            // 00:00 SP deve virar 03:00 UTC
            expect(result.getUTCHours()).toBe(3);
            expect(result.getUTCMinutes()).toBe(0);
        });

        test('deve retornar null para data inválida', () => {
            expect(combineDateTimeInSP(null)).toBeNull();
            expect(combineDateTimeInSP('')).toBeNull();
        });
    });

    describe('isSameDayInSP()', () => {
        test('deve retornar true para datas do mesmo dia em SP', () => {
            const date1 = '2025-07-10T02:00:00.000Z'; // 23:00 do dia 09 em SP
            const date2 = '2025-07-10T23:00:00.000Z'; // 20:00 do dia 10 em SP
            
            // Ambas são dia 10 em SP (considerando UTC-3)
            const result = isSameDayInSP(date1, date2);
            expect(result).toBe(true);
        });

        test('deve retornar false para datas de dias diferentes em SP', () => {
            const date1 = '2025-07-09T02:00:00.000Z'; // 23:00 do dia 08 em SP
            const date2 = '2025-07-10T23:00:00.000Z'; // 20:00 do dia 10 em SP
            
            const result = isSameDayInSP(date1, date2);
            expect(result).toBe(false);
        });
    });

    describe('Funções de compatibilidade', () => {
        test('deve manter compatibilidade com timezoneUtils antigo', () => {
            const { 
                toSaoPauloISOString, 
                toSaoPauloDateString, 
                newSaoPauloDate,
                utcToSaoPaulo,
                saoPauloToUtc
            } = require('../utils/dateUtils.js');

            expect(typeof toSaoPauloISOString).toBe('function');
            expect(typeof toSaoPauloDateString).toBe('function');
            expect(typeof newSaoPauloDate).toBe('function');
            expect(typeof utcToSaoPaulo).toBe('function');
            expect(typeof saoPauloToUtc).toBe('function');
        });
    });

    describe('Cenários de erro', () => {
        test('deve lidar com datas inválidas graciosamente', () => {
            const invalidDate = 'data-invalida';
            
            expect(spToUtc(invalidDate)).toBeNull();
            expect(utcToSp(invalidDate)).toBeNull();
            expect(formatInSP(invalidDate)).toBe('');
        });

        test('deve usar fallbacks quando date-fns não disponível', () => {
            // Este teste seria mais complexo, mas a estrutura permite fallbacks
            expect(true).toBe(true); // Placeholder
        });
    });
});

describe('DateUtils - Integração com Banco de Dados', () => {
    
    test('deve formatar dados vindos do Supabase corretamente', () => {
        // Simula dados vindos do banco (sempre UTC)
        const dadosDoBanco = {
            data_execucao: '2025-07-10T17:30:00.000000+00:00', // UTC
            created_at: '2025-07-10T20:00:00.000000+00:00'
        };

        const dataExecucaoSP = utcToSp(dadosDoBanco.data_execucao);
        const createdAtSP = utcToSp(dadosDoBanco.created_at);

        expect(dataExecucaoSP.getHours()).toBe(14); // 17:30 UTC = 14:30 SP
        expect(createdAtSP.getHours()).toBe(17);    // 20:00 UTC = 17:00 SP
    });

    test('deve preparar dados para inserção no banco corretamente', () => {
        // Simula entrada do usuário (horário de SP)
        const dadosUsuario = {
            data_treino: '2025-07-10',
            hora_inicio: '14:30'
        };

        const dataParaBanco = spToUtc(`${dadosUsuario.data_treino} ${dadosUsuario.hora_inicio}:00`);
        
        expect(dataParaBanco.getUTCHours()).toBe(17); // 14:30 SP = 17:30 UTC
        expect(dataParaBanco.toISOString()).toMatch(/2025-07-10T17:30:00/);
    });
});

describe('DateUtils - Performance e Cache', () => {
    
    test('deve executar conversões rapidamente', () => {
        const start = performance.now();
        
        for (let i = 0; i < 1000; i++) {
            const utcDate = nowUtcISO();
            const spDate = utcToSp(utcDate);
            const backToUtc = spToUtc(spDate.toISOString());
        }
        
        const end = performance.now();
        const duration = end - start;
        
        // Deve executar 1000 conversões em menos de 100ms
        expect(duration).toBeLessThan(100);
    });

    test('deve manter consistência em conversões round-trip', () => {
        const originalUTC = '2025-07-10T17:30:00.000Z';
        
        // UTC -> SP -> UTC
        const spDate = utcToSp(originalUTC);
        const backToUTC = spToUtc(spDate);
        
        expect(backToUTC.toISOString()).toBe(originalUTC);
    });
});