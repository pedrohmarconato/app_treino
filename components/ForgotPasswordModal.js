/**
 * 🔐 MODAL ESQUECI MINHA SENHA - Forgot Password Modal
 * 
 * FUNÇÃO: Interface modal para recuperação de senha via email.
 * 
 * RESPONSABILIDADES:
 * - Renderizar modal responsivo e acessível
 * - Validar email em tempo real
 * - Integrar com Supabase Auth para envio de email
 * - Gerenciar estados de loading, sucesso e erro
 * - Feedback visual claro para o usuário
 * - Design moderno seguindo paleta do projeto
 * 
 * FUNCIONALIDADES:
 * - show(): Exibir modal e retornar Promise
 * - Validação inline de email
 * - Navegação por teclado (ESC, Tab, Enter)
 * - Estados visuais de carregamento
 * - Mensagens contextuais de feedback
 * - Auto-focus no campo email
 * 
 * INTEGRAÇÃO:
 * - Supabase Auth resetPasswordForEmail()
 * - AuthService resetPassword()
 * - Design system do projeto (#CFFF04 + #101010)
 */

import BaseModal from './BaseModal.js';

export default class ForgotPasswordModal extends BaseModal {
    constructor() {
        super({
            id: 'forgot-password-modal',
            title: 'Recuperar Senha',
            className: 'forgot-password-modal',
            closable: true,
            backdrop: true,
            keyboard: true,
            focus: true
        });
        
        this.prefilledEmail = '';
        this.isLoading = false;
        
        // Carregar CSS específico do modal
        this.loadModalCSS();
    }
    
    /**
     * Carregar CSS específico do modal
     */
    loadModalCSS() {
        if (!document.getElementById('forgot-password-modal-css')) {
            const link = document.createElement('link');
            link.id = 'forgot-password-modal-css';
            link.rel = 'stylesheet';
            link.href = 'css/forgot-password-modal.css';
            document.head.appendChild(link);
        }
    }
    
    /**
     * Exibir modal e retornar Promise com resultado
     * @param {string} prefilledEmail - Email pré-preenchido (opcional)
     */
    show(prefilledEmail = '') {
        console.log('[ForgotPasswordModal] 🎭 show() called with email:', prefilledEmail);
        this.prefilledEmail = prefilledEmail;
        
        if (window.trackEvent) {
            window.trackEvent('forgot_password_modal_opened', {
                timestamp: Date.now(),
                prefilled: !!prefilledEmail,
                viewport: `${window.innerWidth}x${window.innerHeight}`
            });
        }
        
        return super.show({
            onShow: () => {
                // Focus no campo email após exibição
                const emailField = this.element.querySelector('#reset-email');
                if (emailField) {
                    emailField.focus();
                    if (this.prefilledEmail) {
                        emailField.select();
                    }
                }
            }
        });
    }
    
    /**
     * Obter template HTML do modal
     * @returns {string} HTML template
     */
    getTemplate() {
        return `
            <div class="modal-content-unified forgot-password-content">
                <div class="modal-header">
                    <div class="header-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                            <circle cx="12" cy="16" r="1"/>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                    </div>
                    <div class="header-text">
                        <h2 id="${this.options.id}-title" class="modal-title">${this.options.title}</h2>
                        <p class="header-subtitle">Digite seu email para receber instruções de redefinição</p>
                    </div>
                    <button type="button" class="modal-close" aria-label="Fechar modal">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>

                <form id="forgot-password-form" class="modal-body" novalidate>
                    <div class="form-group">
                        <label for="reset-email">Email</label>
                        <div class="email-input-container">
                            <div class="input-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                    <polyline points="22,6 12,13 2,6"/>
                                </svg>
                            </div>
                            <input type="email"
                                   id="reset-email"
                                   name="email"
                                   required
                                   autocomplete="email"
                                   aria-describedby="email-error email-info"
                                   placeholder="Digite seu email cadastrado"
                                   value="${this.prefilledEmail}">
                        </div>
                        <div id="email-error" class="error-message" role="alert" aria-live="polite"></div>
                        <div id="email-info" class="info-message">
                            Enviaremos um link de recuperação para este email
                        </div>
                    </div>

                    <div id="form-feedback" class="form-feedback" role="alert" aria-live="polite" style="display: none;"></div>
                </form>

                <div class="modal-footer">
                    <button type="button" class="btn-secondary" id="cancel-btn">Cancelar</button>
                    <button type="submit" class="btn-primary" id="reset-btn" form="forgot-password-form">
                        <span class="btn-text">Enviar Email</span>
                        <span class="btn-loading" style="display:none;">
                            <svg class="spinner" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="31.416" stroke-dashoffset="31.416">
                                    <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                                    <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
                                </circle>
                            </svg>
                            Enviando...
                        </span>
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * Configurar event listeners específicos do modal
     */
    setupEventListeners() {
        super.setupEventListeners();
        
        // Cancel button
        const cancelBtn = this.element.querySelector('#cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hide(null));
        }
        
        // Email validation
        const emailField = this.element.querySelector('#reset-email');
        if (emailField) {
            emailField.addEventListener('input', this.validateEmail.bind(this));
            emailField.addEventListener('blur', this.validateEmail.bind(this));
        }
        
        // Form submit
        const form = this.element.querySelector('#forgot-password-form');
        if (form) {
            form.addEventListener('submit', this.handleSubmit.bind(this));
        }
    }
    
    /**
     * Manipular teclas - sobrescrever para verificar loading
     */
    handleKeydown(e) {
        if (e.key === 'Escape' && !this.isLoading) {
            super.handleKeydown(e);
        }
    }
    
    /**
     * Validar email
     */
    validateEmail() {
        const email = document.getElementById('reset-email').value.trim();
        const errorDiv = document.getElementById('email-error');
        errorDiv.textContent = '';
        errorDiv.style.display = 'none';
        if (!email) {
            return true; // empty allowed, will be caught on submit
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showFieldError('email-error', 'Formato de email inválido');
            return false;
        }
        const common = ['gmail.com','hotmail.com','outlook.com','yahoo.com','icloud.com'];
        const domain = email.split('@')[1];
        if (domain && !common.includes(domain)) {
            this.showFieldInfo('email-error', 'Verifique se o domínio está correto', 'info');
        }
        return true;
    }
    
    /**
     * Manipular submissão do formulário
     */
    async handleSubmit(e) {
        e.preventDefault();
        
        if (this.isLoading) return;
        
        const email = document.getElementById('reset-email').value.trim();
        
        // Validações finais
        if (!email) {
            this.showFieldError('email-error', 'Email é obrigatório');
            document.getElementById('reset-email').focus();
            return;
        }
        
        if (!this.validateEmail()) {
            document.getElementById('reset-email').focus();
            return;
        }
        
        // Iniciar processo de reset
        this.setLoading(true);
        this.clearFeedback();
        
        try {
            console.log('[ForgotPasswordModal] 📧 Enviando email de recuperação para:', email);
            
            // Importar serviço de autenticação
            const { resetPassword } = await import('../services/authService.js');
            
            // Enviar email de recuperação
            const resultado = await resetPassword(email);
            
            if (resultado.error) {
                throw resultado.error;
            }
            
            // Sucesso
            console.log('[ForgotPasswordModal] ✅ Email enviado com sucesso');
            this.showSuccess(email);
            
            // Track evento sucesso
            if (window.trackEvent) {
                window.trackEvent('forgot_password_success', {
                    timestamp: Date.now(),
                    email_domain: email.split('@')[1]
                });
            }
            
        } catch (error) {
            console.error('[ForgotPasswordModal] ❌ Erro ao enviar email:', error);
            
            // Tratar diferentes tipos de erro
            let errorMessage = 'Erro ao enviar email de recuperação';
            
            if (error.message?.includes('User not found')) {
                errorMessage = 'Email não encontrado em nosso sistema';
            } else if (error.message?.includes('Email rate limit')) {
                errorMessage = 'Muitas tentativas. Aguarde alguns minutos';
            } else if (error.message?.includes('Invalid email')) {
                errorMessage = 'Email inválido';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            this.showError(errorMessage);
            
            // Track evento erro
            if (window.trackEvent) {
                window.trackEvent('forgot_password_error', {
                    timestamp: Date.now(),
                    error: error.message || 'Unknown error'
                });
            }
            
        } finally {
            this.setLoading(false);
        }
    }
    
    /**
     * Mostrar tela de sucesso
     */
    showSuccess(email) {
        const domain = email.split('@')[1];
        
        const successHTML = `
            <div class="modal-content-unified forgot-password-content success-content">
                <div class="modal-header success-header">
                    <div class="header-icon success-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 12l2 2 4-4"/>
                            <circle cx="12" cy="12" r="10"/>
                        </svg>
                    </div>
                    <div class="header-text">
                        <h2>Email Enviado!</h2>
                        <p class="header-subtitle">Verifique sua caixa de entrada</p>
                    </div>
                </div>
                
                <div class="modal-body success-body">
                    <div class="success-message">
                        <p>📧 Enviamos um link de recuperação para:</p>
                        <p class="email-sent"><strong>${email}</strong></p>
                        
                        <div class="instructions">
                            <h4>📋 Próximos passos:</h4>
                            <ol>
                                <li>Verifique sua caixa de entrada</li>
                                <li>Procure também na pasta de <strong>spam/lixo</strong></li>
                                <li>Clique no link de recuperação</li>
                                <li>Defina sua nova senha</li>
                            </ol>
                        </div>
                        
                        <div class="email-actions">
                            <a href="https://${domain}" target="_blank" class="btn-secondary btn-email" rel="noopener">
                                Abrir ${domain}
                            </a>
                        </div>
                        
                        <div class="help-text">
                            <p>💡 <strong>Não recebeu o email?</strong></p>
                            <p>• Aguarde alguns minutos</p>
                            <p>• Verifique a pasta de spam</p>
                            <p>• Tente novamente em 5 minutos</p>
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button type="button" class="btn-primary" id="close-success-btn">
                        Entendi
                    </button>
                </div>
            </div>
        `;
        
        // Atualizar conteúdo do modal
        this.element.innerHTML = successHTML;
        
        // Bind evento do botão fechar
        this.element.querySelector('#close-success-btn').addEventListener('click', () => {
            this.hide({ success: true, email });
        });
    }
    
    /**
     * Controlar estado de loading
     */
    setLoading(loading) {
        this.isLoading = loading;
        
        const btn = document.getElementById('reset-btn');
        const text = btn?.querySelector('.btn-text');
        const spinner = btn?.querySelector('.btn-loading');
        const emailField = document.getElementById('reset-email');
        const cancelBtn = document.getElementById('cancel-btn');
        
        if (btn) {
            btn.disabled = loading;
            if (text && spinner) {
                text.style.display = loading ? 'none' : 'inline';
                spinner.style.display = loading ? 'inline-flex' : 'none';
            }
        }
        
        // Desabilitar campos durante loading
        if (emailField) emailField.disabled = loading;
        if (cancelBtn) cancelBtn.disabled = loading;
    }
    
    /**
     * Mostrar erro no campo específico
     */
    showFieldError(fieldId, message) {
        const errorDiv = document.getElementById(fieldId);
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.className = 'error-message';
            errorDiv.style.display = 'block';
        }
    }
    
    /**
     * Mostrar informação no campo
     */
    showFieldInfo(fieldId, message, type = 'info') {
        const errorDiv = document.getElementById(fieldId);
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.className = `${type}-message`;
            errorDiv.style.display = 'block';
        }
    }
    
    /**
     * Mostrar feedback geral
     */
    showError(message) {
        const feedbackDiv = document.getElementById('form-feedback');
        if (feedbackDiv) {
            feedbackDiv.textContent = message;
            feedbackDiv.className = 'form-feedback error-feedback';
            feedbackDiv.style.display = 'block';
        }
    }
    
    /**
     * Limpar feedback
     */
    clearFeedback() {
        const feedbackDiv = document.getElementById('form-feedback');
        if (feedbackDiv) {
            feedbackDiv.style.display = 'none';
        }
    }
    
    
}