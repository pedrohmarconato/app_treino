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

import BaseModal from './BaseModal.js';
import { cadastrarNovoUsuario } from '../services/userRegistrationService.js';
import { logLGPDConsent, detectBotBehavior } from '../services/userValidationService.js';

export default class CadastroUsuarioModal extends BaseModal {
  constructor() {
    super({
      id: 'cadastro-usuario-modal',
      title: 'Criar Nova Conta',
      className: 'cadastro-usuario-modal',
      closable: true,
      backdrop: true,
      keyboard: true,
      focus: true,
    });

    this.startTime = Date.now();
    this.formStartTime = null;
    this.fieldTimings = {};
    this.isLoading = false;

    // Carregar CSS específico do modal
    this.loadModalCSS();
  }

  /**
   * Carregar CSS específico do modal
   */
  loadModalCSS() {
    if (!document.getElementById('cadastro-usuario-modal-css')) {
      const link = document.createElement('link');
      link.id = 'cadastro-usuario-modal-css';
      link.rel = 'stylesheet';
      link.href = 'css/cadastro-usuario-modal.css';
      document.head.appendChild(link);
    }
  }

  /**
   * Exibir modal e retornar Promise com resultado
   */
  show() {
    console.log('[CadastroModal] 🎭 show() chamado');

    if (window.trackEvent) {
      window.trackEvent('cadastro_modal_opened', {
        timestamp: Date.now(),
        user_agent: navigator.userAgent.slice(0, 50),
        viewport: `${window.innerWidth}x${window.innerHeight}`,
      });
    }

    return super.show({
      onShow: () => {
        // Focus no campo nome após exibição
        const nomeField = this.element.querySelector('#nome');
        if (nomeField) {
          nomeField.focus();
          this.formStartTime = Date.now();
        }

        // Configurar tracking de timings
        this.setupFieldTimings();
      },
    });
  }

  /**
   * Obter template HTML do modal
   * @returns {string} HTML template
   */
  getTemplate() {
    return `
            <div class="modal-content-unified cadastro-usuario-content">
                <div class="modal-header">
                    <div class="header-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                        </svg>
                    </div>
                    <div class="header-text">
                        <h2 id="${this.options.id}-title" class="modal-title">${this.options.title}</h2>
                        <p class="header-subtitle">Preencha os dados para criar sua conta</p>
                    </div>
                    <button type="button" class="modal-close" aria-label="Fechar modal">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                
                <form id="cadastro-form" class="modal-body" novalidate>
                    <!-- Honeypot field - invisível para usuários -->
                    <input type="text" name="website" id="website" class="honeypot" tabindex="-1" autocomplete="off" aria-hidden="true">
                    
                    <div class="form-group">
                        <label for="nome">Nome completo</label>
                        <div class="input-container">
                            <div class="input-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                    <circle cx="12" cy="7" r="4"/>
                                </svg>
                            </div>
                            <input type="text" 
                                   id="nome" 
                                   name="nome" 
                                   required 
                                   maxlength="50" 
                                   autocomplete="name" 
                                   aria-describedby="nome-error"
                                   placeholder="Digite seu nome completo">
                        </div>
                        <div id="nome-error" class="error-message" role="alert" aria-live="polite"></div>
                    </div>
                    
                    <div class="form-group">
                        <label for="email">Email</label>
                        <div class="input-container">
                            <div class="input-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                    <polyline points="22,6 12,13 2,6"/>
                                </svg>
                            </div>
                            <input type="email" 
                                   id="email" 
                                   name="email" 
                                   required 
                                   maxlength="100"
                                   autocomplete="email" 
                                   aria-describedby="email-error"
                                   placeholder="seu@email.com">
                        </div>
                        <div id="email-error" class="error-message" role="alert" aria-live="polite"></div>
                    </div>
                    
                    <div class="form-group">
                        <label for="data_nascimento">Data de nascimento</label>
                        <div class="input-container">
                            <div class="input-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                    <line x1="16" y1="2" x2="16" y2="6"/>
                                    <line x1="8" y1="2" x2="8" y2="6"/>
                                    <line x1="3" y1="10" x2="21" y2="10"/>
                                </svg>
                            </div>
                            <input type="date" 
                                   id="data_nascimento" 
                                   name="data_nascimento" 
                                   autocomplete="bday" 
                                   aria-describedby="data-error"
                                   min="1920-01-01"
                                   max="${new Date().toISOString().split('T')[0]}">
                        </div>
                        <div id="data-error" class="error-message" role="alert" aria-live="polite"></div>
                    </div>
                    
                    <div class="form-group checkbox-group">
                        <label class="checkbox-container">
                            <input type="checkbox" id="consentimento" name="consentimento" required>
                            <span class="checkbox-custom">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                    <path d="M20 6L9 17l-5-5"/>
                                </svg>
                            </span>
                            <span class="checkbox-text">
                                Concordo em fornecer meus dados para personalização de treinos e acompanhamento
                            </span>
                        </label>
                        <div id="consentimento-error" class="error-message" role="alert" aria-live="polite"></div>
                    </div>
                    
                    <div id="form-feedback" class="form-feedback" role="alert" aria-live="polite" style="display: none;"></div>
                </form>
                
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" id="cancelar-btn">Cancelar</button>
                    <button type="submit" class="btn-primary" id="cadastrar-btn" form="cadastro-form">
                        <span class="btn-text">Criar Conta</span>
                        <span class="btn-loading" style="display:none;">
                            <svg class="spinner" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="31.416" stroke-dashoffset="31.416">
                                    <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                                    <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
                                </circle>
                            </svg>
                            Criando conta...
                        </span>
                    </button>
                </div>
            </div>
        `;
  }

  /**
   * Configurar tracking de timings dos campos
   */
  setupFieldTimings() {
    ['nome', 'email', 'data_nascimento'].forEach((fieldId) => {
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
   * Configurar event listeners específicos do modal
   */
  setupEventListeners() {
    super.setupEventListeners();

    // Cancel button
    const cancelBtn = this.element.querySelector('#cancelar-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.hide(null));
    }

    // Validação em tempo real
    const emailField = this.element.querySelector('#email');
    const nomeField = this.element.querySelector('#nome');
    const dataField = this.element.querySelector('#data_nascimento');

    if (emailField) {
      emailField.addEventListener('blur', this.validateEmail.bind(this));
      emailField.addEventListener('input', this.debounce(this.validateEmail.bind(this), 500));
    }

    if (nomeField) {
      nomeField.addEventListener('input', this.validateNome.bind(this));
    }

    if (dataField) {
      dataField.addEventListener('change', this.validateDataNascimento.bind(this));
    }

    // Form submit
    const form = this.element.querySelector('#cadastro-form');
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
    const email = this.element.querySelector('#email').value.trim();
    const errorDiv = this.element.querySelector('#email-error');

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
    if (suspiciousDomains.some((sus) => domain.includes(sus))) {
      errorDiv.textContent = 'Por favor, use um email válido';
      return false;
    }

    errorDiv.textContent = '';

    // Track validação
    if (window.trackEvent) {
      window.trackEvent('campo_validado', {
        campo: 'email',
        valido: true,
        tempo_preenchimento: this.fieldTimings.email?.duration || 0,
      });
    }

    return true;
  }

  /**
   * Validar nome
   */
  validateNome() {
    const nome = this.element.querySelector('#nome').value.trim();
    const errorDiv = this.element.querySelector('#nome-error');

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
    const data = this.element.querySelector('#data_nascimento').value;
    const errorDiv = this.element.querySelector('#data-error');

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
    if (this.element.querySelector('#website').value) {
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
      _startTime: this.startTime,
    };

    // Validação consentimento
    if (!dados.consentimento) {
      this.element.querySelector('#consentimento-error').textContent = 'Consentimento obrigatório';
      this.element.querySelector('#consentimento').focus();
      return;
    }

    // Detectar comportamento de bot (temporariamente desabilitado para debug)
    const fillTime = Date.now() - this.formStartTime;
    console.log('[Modal] 🔍 Tempo de preenchimento:', fillTime, 'ms');

    try {
      const botCheck = detectBotBehavior(dados, { fillTime });
      console.log('[Modal] 🤖 Resultado bot check:', botCheck);

      if (botCheck.isSuspicious && botCheck.riskScore > 2) {
        console.warn('[Modal] 🚨 Comportamento suspeito:', botCheck.patterns);
        this.showError('Erro de validação. Aguarde um momento e tente novamente.');
        return;
      }
    } catch (botError) {
      console.warn('[Modal] ⚠️ Erro na detecção de bot, continuando:', botError);
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
        form_completion_time: Date.now() - this.formStartTime,
      });

      // Feedback de sucesso
      this.showSuccess(`Usuário ${resultado.data.nome} cadastrado com sucesso!`);

      // Fechar modal após delay para mostrar sucesso
      setTimeout(() => {
        this.hide(resultado.data);
      }, 1500);
    } catch (error) {
      console.error('[Modal] ❌ Erro no cadastro:', error);

      // Tratar erros específicos
      if (error.message === 'EMAIL_ALREADY_EXISTS') {
        this.showError('Este email já está cadastrado');
        this.element.querySelector('#email').focus();
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
      this.element.querySelector(`#${firstErrorField}`)?.focus();
    }
  }

  /**
   * Controlar estado de loading
   */
  setLoading(loading) {
    this.isLoading = loading;

    const btn = this.element.querySelector('#cadastrar-btn');
    const text = btn?.querySelector('.btn-text');
    const spinner = btn?.querySelector('.btn-loading');

    if (btn) {
      btn.disabled = loading;
      if (text && spinner) {
        text.style.display = loading ? 'none' : 'inline';
        spinner.style.display = loading ? 'inline-flex' : 'none';
      }
    }

    // Desabilitar form durante loading
    const inputs = this.element.querySelectorAll('input, button');
    inputs.forEach((input) => {
      if (input.id !== 'cadastrar-btn') {
        input.disabled = loading;
      }
    });
  }

  /**
   * Exibir mensagem de erro
   */
  showError(message) {
    const feedbackDiv = this.element.querySelector('#form-feedback');
    if (feedbackDiv) {
      feedbackDiv.textContent = message;
      feedbackDiv.className = 'form-feedback error-feedback';
      feedbackDiv.style.display = 'block';
    }
  }

  /**
   * Exibir mensagem de sucesso
   */
  showSuccess(message) {
    const feedbackDiv = this.element.querySelector('#form-feedback');
    if (feedbackDiv) {
      feedbackDiv.textContent = message;
      feedbackDiv.className = 'form-feedback success-feedback';
      feedbackDiv.style.display = 'block';
    }
  }

  /**
   * Limpar feedback
   */
  clearFeedback() {
    const feedbackDiv = this.element.querySelector('#form-feedback');
    if (feedbackDiv) {
      feedbackDiv.style.display = 'none';
    }
  }
}
