/**
 * 🆕 MODAL DE CADASTRO DE USUÁRIO - User Registration Modal
 * 
 * FUNÇÃO: Interface modal para cadastro de novos usuários.
 * 
 * RESPONSABILIDADES:
 * - Renderizar modal responsivo com acessibilidade
 * - Validar campos em tempo real
 * - Implementar honeypot anti-bot
 * - Gerenciar estados de loading e erro
 * - Integrar com serviços de cadastro e validação
 * - Garantir compliance LGPD
 * 
 * FUNCIONALIDADES:
 * - show(): Exibir modal e retornar Promise
 * - Validação inline de email e nome
 * - Navegação por teclado (ESC, Tab, Enter)
 * - Feedback visual de erros por campo
 * - Loading states durante submissão
 * - Auto-focus no primeiro campo
 * 
 * ACESSIBILIDADE:
 * - ARIA labels e roles
 * - Screen reader support
 * - Navegação por teclado
 * - Contraste adequado
 * - Foco gerenciado
 */

import { cadastrarNovoUsuario } from '../services/userRegistrationService.js';
import { logLGPDConsent, detectBotBehavior } from '../services/userValidationService.js';

export default class CadastroUsuarioModal {
    constructor() {
        this.startTime = Date.now();
        this.modal = null;
        this.resolve = null;
        this.reject = null;
        this.formStartTime = null;
        this.fieldTimings = {};
    }
    
    /**
     * Exibir modal e retornar Promise com resultado
     */
    show() {
        return new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
            this.render();
            this.bindEvents();
            this.setupFieldTimings();
            
            // Track evento abertura modal
            if (window.trackEvent) {
                window.trackEvent('cadastro_modal_opened', {
                    timestamp: Date.now(),
                    user_agent: navigator.userAgent.slice(0, 50),
                    viewport: `${window.innerWidth}x${window.innerHeight}`
                });
            }
        });
    }
    
    /**
     * Renderizar HTML do modal
     */
    render() {
        const modalHTML = `
            <div id="cadastro-modal-overlay" class="modal-overlay" role="dialog" aria-labelledby="modal-title" aria-modal="true">
                <div class="modal-container">
                    <div class="modal-header">
                        <h2 id="modal-title">Cadastrar Novo Usuário</h2>
                        <button type="button" class="modal-close" aria-label="Fechar modal" title="Fechar">&times;</button>
                    </div>
                    
                    <form id="cadastro-form" class="modal-body" novalidate>
                        <!-- Honeypot field - invisível para usuários -->
                        <input type="text" name="website" id="website" style="position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;" tabindex="-1" autocomplete="off" aria-hidden="true">
                        
                        <div class="form-group">
                            <label for="nome">Nome *</label>
                            <input type="text" 
                                   id="nome" 
                                   name="nome" 
                                   required 
                                   maxlength="50" 
                                   autocomplete="name" 
                                   aria-describedby="nome-error"
                                   placeholder="Digite seu nome">
                            <div id="nome-error" class="error-message" role="alert" aria-live="polite"></div>
                        </div>
                        
                        <div class="form-group">
                            <label for="email">Email *</label>
                            <input type="email" 
                                   id="email" 
                                   name="email" 
                                   required 
                                   maxlength="100"
                                   autocomplete="email" 
                                   aria-describedby="email-error"
                                   placeholder="Digite seu email">
                            <div id="email-error" class="error-message" role="alert" aria-live="polite"></div>
                        </div>
                        
                        <div class="form-group">
                            <label for="data_nascimento">Data de Nascimento</label>
                            <input type="date" 
                                   id="data_nascimento" 
                                   name="data_nascimento" 
                                   autocomplete="bday" 
                                   aria-describedby="data-error"
                                   min="1920-01-01"
                                   max="${new Date().toISOString().split('T')[0]}">
                            <div id="data-error" class="error-message" role="alert" aria-live="polite"></div>
                        </div>
                        
                        <div class="form-group">
                            <label class="checkbox-container">
                                <input type="checkbox" id="consentimento" required>
                                <span class="checkmark" aria-hidden="true"></span>
                                <span class="checkbox-text">
                                    Concordo em fornecer meus dados para personalização de treinos e acompanhamento *
                                </span>
                            </label>
                            <div id="consentimento-error" class="error-message" role="alert" aria-live="polite"></div>
                        </div>
                    </form>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn-secondary" id="cancelar-btn">Cancelar</button>
                        <button type="submit" class="btn-primary" id="cadastrar-btn" form="cadastro-form">
                            <span class="btn-text">Cadastrar</span>
                            <span class="btn-loading" style="display:none;">⏳ Cadastrando...</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('cadastro-modal-overlay');
        
        // Foco automático após renderização
        setTimeout(() => {
            const nomeField = document.getElementById('nome');
            if (nomeField) {
                nomeField.focus();
                this.formStartTime = Date.now();
            }
        }, 100);
    }
    
    /**
     * Configurar tracking de timings dos campos
     */
    setupFieldTimings() {
        ['nome', 'email', 'data_nascimento'].forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('focus', () => {
                    this.fieldTimings[fieldId] = { focusTime: Date.now() };
                });
                
                field.addEventListener('blur', () => {
                    if (this.fieldTimings[fieldId]) {
                        this.fieldTimings[fieldId].blurTime = Date.now();
                        this.fieldTimings[fieldId].duration = 
                            this.fieldTimings[fieldId].blurTime - this.fieldTimings[fieldId].focusTime;
                    }
                });
            }
        });
    }
    
    /**
     * Vincular eventos do modal
     */
    bindEvents() {
        // ESC para fechar
        this.handleKeydown = this.handleKeydown.bind(this);
        document.addEventListener('keydown', this.handleKeydown);
        
        // Botões de fechar/cancelar
        this.modal.querySelector('.modal-close').addEventListener('click', () => this.close(null));
        this.modal.querySelector('#cancelar-btn').addEventListener('click', () => this.close(null));
        
        // Clique fora do modal
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close(null);
        });
        
        // Validação em tempo real
        const emailField = document.getElementById('email');
        const nomeField = document.getElementById('nome');
        const dataField = document.getElementById('data_nascimento');
        
        emailField.addEventListener('blur', this.validateEmail.bind(this));
        emailField.addEventListener('input', this.debounce(this.validateEmail.bind(this), 500));
        
        nomeField.addEventListener('input', this.validateNome.bind(this));
        dataField.addEventListener('change', this.validateDataNascimento.bind(this));
        
        // Submit form
        document.getElementById('cadastro-form').addEventListener('submit', this.handleSubmit.bind(this));
    }
    
    /**
     * Manipular teclas
     */
    handleKeydown(e) {
        if (e.key === 'Escape') {
            this.close(null);
        }
    }
    
    /**
     * Debounce para validações
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    /**
     * Validar email em tempo real
     */
    async validateEmail() {
        const email = document.getElementById('email').value.trim();
        const errorDiv = document.getElementById('email-error');
        
        if (!email) {
            errorDiv.textContent = '';
            return true;
        }
        
        // Validação formato
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            errorDiv.textContent = 'Formato de email inválido';
            return false;
        }
        
        // Verificar domínios suspeitos
        const suspiciousDomains = ['tempmail', 'throwaway', 'guerrillamail'];
        const domain = email.split('@')[1];
        if (suspiciousDomains.some(sus => domain.includes(sus))) {
            errorDiv.textContent = 'Por favor, use um email válido';
            return false;
        }
        
        errorDiv.textContent = '';
        
        // Track validação
        if (window.trackEvent) {
            window.trackEvent('campo_validado', {
                campo: 'email',
                valido: true,
                tempo_preenchimento: this.fieldTimings.email?.duration || 0
            });
        }
        
        return true;
    }
    
    /**
     * Validar nome
     */
    validateNome() {
        const nome = document.getElementById('nome').value.trim();
        const errorDiv = document.getElementById('nome-error');
        
        if (!nome) {
            errorDiv.textContent = '';
            return true;
        }
        
        if (nome.length < 2) {
            errorDiv.textContent = 'Nome deve ter pelo menos 2 caracteres';
            return false;
        }
        
        if (nome.length > 50) {
            errorDiv.textContent = 'Nome muito longo (máximo 50 caracteres)';
            return false;
        }
        
        if (!/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/.test(nome)) {
            errorDiv.textContent = 'Nome deve conter apenas letras e espaços';
            return false;
        }
        
        errorDiv.textContent = '';
        return true;
    }
    
    /**
     * Validar data de nascimento
     */
    validateDataNascimento() {
        const data = document.getElementById('data_nascimento').value;
        const errorDiv = document.getElementById('data-error');
        
        if (!data) {
            errorDiv.textContent = '';
            return true;
        }
        
        const nascimento = new Date(data);
        const hoje = new Date();
        const idade = hoje.getFullYear() - nascimento.getFullYear();
        
        if (idade < 13) {
            errorDiv.textContent = 'Idade mínima: 13 anos';
            return false;
        }
        
        if (idade > 100) {
            errorDiv.textContent = 'Idade máxima: 100 anos';
            return false;
        }
        
        errorDiv.textContent = '';
        return true;
    }
    
    /**
     * Manipular submissão do formulário
     */
    async handleSubmit(e) {
        e.preventDefault();
        
        // Verificar honeypot (proteção anti-bot)
        if (document.getElementById('website').value) {
            console.warn('[Modal] 🤖 Bot detectado via honeypot');
            this.showError('Erro de validação. Tente novamente.');
            return;
        }
        
        const formData = new FormData(e.target);
        const dados = {
            nome: formData.get('nome'),
            email: formData.get('email'),
            data_nascimento: formData.get('data_nascimento'),
            consentimento: formData.get('consentimento') === 'on',
            _startTime: this.startTime
        };
        
        // Validação consentimento
        if (!dados.consentimento) {
            document.getElementById('consentimento-error').textContent = 'Consentimento obrigatório';
            document.getElementById('consentimento').focus();
            return;
        }
        
        // Detectar comportamento de bot
        const fillTime = Date.now() - this.formStartTime;
        const botCheck = detectBotBehavior(dados, { fillTime });
        
        if (botCheck.isSuspicious && botCheck.riskScore > 2) {
            console.warn('[Modal] 🚨 Comportamento suspeito:', botCheck.patterns);
            this.showError('Erro de validação. Aguarde um momento e tente novamente.');
            return;
        }
        
        // Validar todos os campos novamente
        const nomeValido = this.validateNome();
        const emailValido = await this.validateEmail();
        const dataValida = this.validateDataNascimento();
        
        if (!nomeValido || !emailValido || !dataValida) {
            this.showError('Por favor, corrija os erros antes de continuar');
            return;
        }
        
        this.setLoading(true);
        
        try {
            console.log('[Modal] 🚀 Submetendo cadastro...');
            const resultado = await cadastrarNovoUsuario(dados);
            
            if (resultado.error) {
                throw resultado.error;
            }
            
            // Log consentimento LGPD
            logLGPDConsent(resultado.data.id, true, {
                modal_version: '1.0',
                form_completion_time: Date.now() - this.formStartTime
            });
            
            // Feedback de sucesso
            this.showSuccess(`Usuário ${resultado.data.nome} cadastrado com sucesso!`);
            
            // Fechar modal após delay para mostrar sucesso
            setTimeout(() => {
                this.close(resultado.data);
            }, 1500);
            
        } catch (error) {
            console.error('[Modal] ❌ Erro no cadastro:', error);
            
            // Tratar erros específicos
            if (error.message === 'EMAIL_ALREADY_EXISTS') {
                this.showError('Este email já está cadastrado');
                document.getElementById('email').focus();
            } else if (error.message === 'RATE_LIMIT_EXCEEDED') {
                this.showError('Muitas tentativas. Tente novamente em 1 hora.');
            } else if (error.message === 'VALIDATION_ERROR' && error.details) {
                this.showValidationErrors(error.details);
            } else {
                this.showError('Erro no cadastro. Verifique os dados e tente novamente.');
            }
            
        } finally {
            this.setLoading(false);
        }
    }
    
    /**
     * Exibir erros de validação específicos
     */
    showValidationErrors(errors) {
        Object.entries(errors).forEach(([field, message]) => {
            const errorDiv = document.getElementById(`${field}-error`);
            if (errorDiv) {
                errorDiv.textContent = message;
            }
        });
        
        // Focar no primeiro campo com erro
        const firstErrorField = Object.keys(errors)[0];
        if (firstErrorField) {
            document.getElementById(firstErrorField)?.focus();
        }
    }
    
    /**
     * Controlar estado de loading
     */
    setLoading(loading) {
        const btn = document.getElementById('cadastrar-btn');
        const text = btn.querySelector('.btn-text');
        const spinner = btn.querySelector('.btn-loading');
        
        btn.disabled = loading;
        text.style.display = loading ? 'none' : 'inline';
        spinner.style.display = loading ? 'inline' : 'none';
        
        // Desabilitar form durante loading
        const inputs = this.modal.querySelectorAll('input, button');
        inputs.forEach(input => {
            if (input.id !== 'cadastrar-btn') {
                input.disabled = loading;
            }
        });
    }
    
    /**
     * Exibir mensagem de erro
     */
    showError(message) {
        this.showToast(message, 'error');
    }
    
    /**
     * Exibir mensagem de sucesso
     */
    showSuccess(message) {
        this.showToast(message, 'success');
    }
    
    /**
     * Exibir toast notification
     */
    showToast(message, type = 'error') {
        // Remover toast anterior se existir
        const existingToast = document.querySelector('.toast-notification');
        if (existingToast) {
            existingToast.remove();
        }
        
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.textContent = message;
        
        const styles = {
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: '10001',
            padding: '12px 24px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontSize: '14px',
            fontWeight: '500',
            maxWidth: '300px',
            animation: 'slideInRight 0.3s ease',
            background: type === 'error' ? '#f44336' : '#4caf50',
            color: 'white'
        };
        
        Object.assign(toast.style, styles);
        
        document.body.appendChild(toast);
        
        // Remover após 4 segundos
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }
        }, 4000);
    }
    
    /**
     * Fechar modal
     */
    close(result) {
        if (this.modal) {
            // Animação de saída
            this.modal.style.animation = 'fadeOut 0.2s ease';
            setTimeout(() => {
                this.modal.remove();
            }, 200);
        }
        
        // Limpar event listeners
        document.removeEventListener('keydown', this.handleKeydown);
        
        // Resolver promise
        if (result) {
            this.resolve(result);
        } else {
            this.resolve(null);
        }
    }
}