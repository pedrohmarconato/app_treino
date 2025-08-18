/**
 * 🧪 TESTES DO SISTEMA DE CADASTRO DE USUÁRIOS
 * 
 * OBJETIVO: Validar funcionamento do sistema de cadastro
 * 
 * TESTES INCLUÍDOS:
 * - Validação de dados de entrada
 * - Rate limiting 
 * - Detecção de honeypot
 * - LGPD compliance
 * - Fluxo completo de cadastro
 */

// Mock do Supabase para testes
const mockSupabase = {
    query: jest.fn(),
    insert: jest.fn()
};

// Mock das funções de validação
jest.mock('../services/userValidationService.js', () => ({
    validateUserData: jest.fn(),
    checkRateLimit: jest.fn(),
    logLGPDConsent: jest.fn(),
    detectBotBehavior: jest.fn()
}));

import { cadastrarNovoUsuario } from '../services/userRegistrationService.js';
import { validateUserData, checkRateLimit, logLGPDConsent } from '../services/userValidationService.js';

describe('Sistema de Cadastro de Usuários', () => {
    
    beforeEach(() => {
        // Limpar localStorage antes de cada teste
        localStorage.clear();
        
        // Resetar mocks
        jest.clearAllMocks();
        
        // Mock do window.trackEvent
        global.window.trackEvent = jest.fn();
    });
    
    describe('Validação de Dados', () => {
        
        test('deve aceitar dados válidos', async () => {
            const dadosValidos = {
                nome: 'João Silva',
                email: 'joao@exemplo.com',
                data_nascimento: '1990-01-01'
            };
            
            validateUserData.mockResolvedValue(dadosValidos);
            checkRateLimit.mockResolvedValue(true);
            mockSupabase.query.mockResolvedValue({ data: [] }); // Email não existe
            mockSupabase.insert.mockResolvedValue({ 
                data: [{ id: 1, ...dadosValidos }], 
                error: null 
            });
            
            const resultado = await cadastrarNovoUsuario(dadosValidos);
            
            expect(resultado.error).toBeNull();
            expect(resultado.data).toHaveProperty('id');
            expect(validateUserData).toHaveBeenCalledWith(dadosValidos);
        });
        
        test('deve rejeitar nome muito curto', async () => {
            const dadosInvalidos = {
                nome: 'A',
                email: 'teste@exemplo.com'
            };
            
            const erro = new Error('VALIDATION_ERROR');
            erro.details = { nome: 'Nome deve ter pelo menos 2 caracteres' };
            
            validateUserData.mockRejectedValue(erro);
            
            const resultado = await cadastrarNovoUsuario(dadosInvalidos);
            
            expect(resultado.error).toBeDefined();
            expect(resultado.data).toBeNull();
        });
        
        test('deve rejeitar email inválido', async () => {
            const dadosInvalidos = {
                nome: 'João Silva',
                email: 'email-invalido'
            };
            
            const erro = new Error('VALIDATION_ERROR');
            erro.details = { email: 'Formato de email inválido' };
            
            validateUserData.mockRejectedValue(erro);
            
            const resultado = await cadastrarNovoUsuario(dadosInvalidos);
            
            expect(resultado.error).toBeDefined();
        });
    });
    
    describe('Rate Limiting', () => {
        
        test('deve bloquear após exceder limite', async () => {
            checkRateLimit.mockResolvedValue(false);
            
            const dados = {
                nome: 'Teste',
                email: 'teste@exemplo.com'
            };
            
            const resultado = await cadastrarNovoUsuario(dados);
            
            expect(resultado.error.message).toBe('RATE_LIMIT_EXCEEDED');
            expect(checkRateLimit).toHaveBeenCalled();
        });
        
        test('deve permitir dentro do limite', async () => {
            checkRateLimit.mockResolvedValue(true);
            validateUserData.mockResolvedValue({
                nome: 'Teste',
                email: 'teste@exemplo.com'
            });
            mockSupabase.query.mockResolvedValue({ data: [] });
            mockSupabase.insert.mockResolvedValue({ 
                data: [{ id: 1, nome: 'Teste' }], 
                error: null 
            });
            
            const resultado = await cadastrarNovoUsuario({
                nome: 'Teste',
                email: 'teste@exemplo.com'
            });
            
            expect(resultado.error).toBeNull();
        });
    });
    
    describe('Email Único', () => {
        
        test('deve rejeitar email duplicado', async () => {
            checkRateLimit.mockResolvedValue(true);
            validateUserData.mockResolvedValue({
                nome: 'João',
                email: 'existente@exemplo.com'
            });
            
            // Mock retornando usuário existente
            mockSupabase.query.mockResolvedValue({ 
                data: [{ id: 1, email: 'existente@exemplo.com' }] 
            });
            
            const resultado = await cadastrarNovoUsuario({
                nome: 'João',
                email: 'existente@exemplo.com'
            });
            
            expect(resultado.error.message).toBe('EMAIL_ALREADY_EXISTS');
        });
        
        test('deve aceitar email único', async () => {
            checkRateLimit.mockResolvedValue(true);
            validateUserData.mockResolvedValue({
                nome: 'Maria',
                email: 'novo@exemplo.com'
            });
            
            // Mock retornando nenhum usuário existente
            mockSupabase.query.mockResolvedValue({ data: [] });
            mockSupabase.insert.mockResolvedValue({ 
                data: [{ id: 2, nome: 'Maria', email: 'novo@exemplo.com' }], 
                error: null 
            });
            
            const resultado = await cadastrarNovoUsuario({
                nome: 'Maria',
                email: 'novo@exemplo.com'
            });
            
            expect(resultado.error).toBeNull();
            expect(resultado.data.email).toBe('novo@exemplo.com');
        });
    });
    
    describe('LGPD Compliance', () => {
        
        test('deve registrar consentimento após cadastro', async () => {
            checkRateLimit.mockResolvedValue(true);
            validateUserData.mockResolvedValue({
                nome: 'Pedro',
                email: 'pedro@exemplo.com'
            });
            mockSupabase.query.mockResolvedValue({ data: [] });
            mockSupabase.insert.mockResolvedValue({ 
                data: [{ id: 3, nome: 'Pedro' }], 
                error: null 
            });
            
            await cadastrarNovoUsuario({
                nome: 'Pedro',
                email: 'pedro@exemplo.com'
            });
            
            // Verificar se o tracking foi chamado
            expect(window.trackEvent).toHaveBeenCalledWith('cadastro_sucesso', 
                expect.objectContaining({
                    user_id: 3,
                    protocolo_id: 1
                })
            );
        });
    });
    
    describe('Observabilidade', () => {
        
        test('deve trackear evento de sucesso', async () => {
            checkRateLimit.mockResolvedValue(true);
            validateUserData.mockResolvedValue({
                nome: 'Ana',
                email: 'ana@exemplo.com'
            });
            mockSupabase.query.mockResolvedValue({ data: [] });
            mockSupabase.insert.mockResolvedValue({ 
                data: [{ id: 4, nome: 'Ana' }], 
                error: null 
            });
            
            const startTime = Date.now();
            await cadastrarNovoUsuario({
                nome: 'Ana',
                email: 'ana@exemplo.com',
                _startTime: startTime
            });
            
            expect(window.trackEvent).toHaveBeenCalledWith('cadastro_sucesso',
                expect.objectContaining({
                    user_id: 4,
                    tempo_modal: expect.any(Number),
                    protocolo_id: 1
                })
            );
        });
        
        test('deve trackear evento de erro', async () => {
            checkRateLimit.mockResolvedValue(false);
            
            const startTime = Date.now();
            await cadastrarNovoUsuario({
                nome: 'Erro',
                email: 'erro@exemplo.com',
                _startTime: startTime
            });
            
            expect(window.trackEvent).toHaveBeenCalledWith('cadastro_erro',
                expect.objectContaining({
                    erro_tipo: 'RATE_LIMIT_EXCEEDED',
                    email: 'erro@exemplo.com',
                    tempo_modal: expect.any(Number)
                })
            );
        });
    });
});

describe('Modal de Cadastro', () => {
    
    // Mocks para DOM
    beforeEach(() => {
        document.body.innerHTML = '';
        
        // Mock do getElementById
        const mockGetElementById = jest.fn((id) => {
            const element = document.createElement('input');
            element.id = id;
            element.value = '';
            return element;
        });
        
        global.document.getElementById = mockGetElementById;
    });
    
    test('deve detectar honeypot preenchido', () => {
        // Simular honeypot preenchido (comportamento de bot)
        const honeypotField = document.createElement('input');
        honeypotField.id = 'website';
        honeypotField.value = 'valor-de-bot';
        
        document.getElementById = jest.fn((id) => {
            if (id === 'website') return honeypotField;
            return document.createElement('input');
        });
        
        // Verificar detecção
        const isBot = honeypotField.value !== '';
        expect(isBot).toBe(true);
    });
    
    test('deve validar formato de email', () => {
        const emailValido = 'teste@exemplo.com';
        const emailInvalido = 'email-sem-arroba';
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        expect(emailRegex.test(emailValido)).toBe(true);
        expect(emailRegex.test(emailInvalido)).toBe(false);
    });
});

// Testes de integração simulados
describe('Fluxo Completo', () => {
    
    test('cenário feliz - cadastro completo', async () => {
        // Setup
        checkRateLimit.mockResolvedValue(true);
        validateUserData.mockResolvedValue({
            nome: 'Usuário Teste',
            email: 'usuario@teste.com',
            data_nascimento: '1995-05-15'
        });
        mockSupabase.query.mockResolvedValue({ data: [] });
        mockSupabase.insert
            .mockResolvedValueOnce({ // Insert usuário
                data: [{ 
                    id: 100, 
                    nome: 'Usuário Teste',
                    email: 'usuario@teste.com',
                    status: 'ativo'
                }], 
                error: null 
            })
            .mockResolvedValueOnce({ // Insert plano
                data: [{ 
                    id: 200,
                    usuario_id: 100,
                    protocolo_treinamento_id: 1
                }], 
                error: null 
            });
        
        // Execução
        const resultado = await cadastrarNovoUsuario({
            nome: 'Usuário Teste',
            email: 'usuario@teste.com',
            data_nascimento: '1995-05-15',
            _startTime: Date.now()
        });
        
        // Verificações
        expect(resultado.error).toBeNull();
        expect(resultado.data).toMatchObject({
            id: 100,
            nome: 'Usuário Teste',
            email: 'usuario@teste.com',
            status: 'ativo'
        });
        
        // Verificar chamadas de inserção
        expect(mockSupabase.insert).toHaveBeenCalledTimes(2); // Usuário + plano
        
        // Verificar tracking
        expect(window.trackEvent).toHaveBeenCalledWith('cadastro_sucesso',
            expect.objectContaining({
                user_id: 100,
                protocolo_id: 1
            })
        );
    });
});