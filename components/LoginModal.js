/**
  🔐 MODAL DE LOGIN - Login Modal Component
  
  FUNÇÃO: Interface modal para login com email/senha.
  
  RESPONSABILIDADES:
  - Renderizar formulário de login responsivo
  - Validar email e senha
  - Integrar com Supabase Auth
  - Gerenciar estados de loading e erro
  - Suportar migração de usuários antigos
  - Opção "Esqueci minha senha" e "Criar nova conta"
  
  FUNCIONALIDADES:
  - show(): Exibir modal e retornar Promise
  - Validação em tempo real
  - Auto-focus e navegação por teclado
  - Feedback visual de erros
  - Loading states durante autenticação
 */

import BaseModal from './BaseModal.js';
import { signIn, migrateExistingUser } from '../services/authService.js';

export default class LoginModal extends BaseModal {
  constructor() {
    super();
    this.resolve = null;
    this.reject = null;
    this.isMigrationMode = false;

    // Bind methods to 'this' for correct context and easy removal
    this.handleKeydown = this.handleKeydown.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleForgotPassword = this.handleForgotPassword.bind(this);
    this.handleCreateAccount = this.handleCreateAccount.bind(this);
    this.togglePassword = this.togglePassword.bind(this);
  }

  show(migrationData = null) {
    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
      this.isMigrationMode = !!migrationData;
      this.migrationData = migrationData;
      this._openedAt = Date.now(); // Timestamp para proteção

      this.render();
      this.bindEvents();

      if (window.trackEvent) {
        window.trackEvent('login_modal_opened', {
          timestamp: Date.now(),
          migration_mode: this.isMigrationMode,
        });
      }
    });
  }

  ensureLoginCSS() {
    // Verificar se CSS já foi carregado
    if (document.getElementById('login-options-css')) {
      return;
    }

    // Criar e injetar CSS dos botões
    const style = document.createElement('style');
    style.id = 'login-options-css';
    style.textContent = `
            .login-options {
                margin-top: 20px;
                text-align: center;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
            }
            
            .login-options .separator {
                color: #666;
                font-size: 14px;
            }
            
            .link-button {
                background: none !important;
                border: none !important;
                color: #CFFF04 !important;
                text-decoration: none;
                cursor: pointer;
                font-size: 14px;
                padding: 8px 12px;
                border-radius: 4px;
                transition: all 0.2s ease;
                position: relative;
            }
            
            .link-button:hover {
                background-color: rgba(207, 255, 4, 0.1) !important;
                text-decoration: underline;
            }
            
            .link-button:focus {
                outline: 2px solid #CFFF04;
                outline-offset: 2px;
            }
            
            .link-button:active {
                transform: scale(0.98);
            }
        `;
    document.head.appendChild(style);
    console.log('[LoginModal] CSS dos botões injetado');
  }

  render() {
    // Garantir que CSS dos botões esteja carregado
    this.ensureLoginCSS();

    const isSignup = this.isMigrationMode;
    const title = isSignup ? 'Criar Senha de Acesso' : 'Entrar na Conta';
    const subtitle = isSignup
      ? `Olá ${this.migrationData?.nome || 'usuário'}! Para continuar usando o app, você precisa criar uma senha de acesso.`
      : 'Digite suas credenciais para acessar o sistema';

    const modalHTML = `
            <div id="login-modal-overlay" class="modal-overlay" role="dialog" aria-labelledby="login-modal-title" aria-modal="true" style="z-index: 15000 !important;">
                <div class="modal-container login-modal-container">
                    <div class="modal-header">
                        <h2 id="login-modal-title">${title}</h2>
                        <button type="button" class="modal-close" aria-label="Fechar modal" title="Fechar">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p class="login-subtitle">${subtitle}</p>
                        <form id="login-form" novalidate>
                            ${
                              isSignup
                                ? `
                                <div class="user-info">
                                    <div class="user-avatar-small">
                                        <span class="user-initial">${this.migrationData?.nome?.charAt(0) || 'U'}</span>
                                    </div>
                                    <div class="user-details">
                                        <strong>${this.migrationData?.nome || 'Usuário'}</strong>
                                        <span>${this.migrationData?.email || ''}</span>
                                    </div>
                                </div>
                            `
                                : `
                                <div class="form-group">
                                    <label for="login-email">Email</label>
                                    <input type="email" id="login-email" name="email" required autocomplete="email" aria-describedby="email-error" placeholder="Digite seu email">
                                    <div id="email-error" class="error-message" role="alert" aria-live="polite"></div>
                                </div>
                            `
                            }
                            <div class="form-group">
                                <label for="login-password">${isSignup ? 'Nova Senha' : 'Senha'}</label>
                                <div class="password-input-container">
                                    <input type="password" id="login-password" name="password" required autocomplete="${isSignup ? 'new-password' : 'current-password'}" aria-describedby="password-error" placeholder="${isSignup ? 'Crie uma senha segura' : 'Digite sua senha'}" minlength="6">
                                    <button type="button" class="password-toggle" aria-label="Mostrar/ocultar senha">👁️</button>
                                </div>
                                <div id="password-error" class="error-message" role="alert" aria-live="polite"></div>
                                ${isSignup ? '<div class="password-hint">Mínimo 6 caracteres</div>' : ''}
                            </div>
                            ${
                              isSignup
                                ? `
                                <div class="form-group">
                                    <label for="confirm-password">Confirmar Senha</label>
                                    <input type="password" id="confirm-password" name="confirmPassword" required autocomplete="new-password" aria-describedby="confirm-error" placeholder="Digite novamente a senha" minlength="6">
                                    <div id="confirm-error" class="error-message" role="alert" aria-live="polite"></div>
                                </div>
                            `
                                : ''
                            }
                            <div id="form-error" class="error-message main-error" role="alert" aria-live="polite"></div>
                        </form>
                        ${
                          !isSignup
                            ? `
                            <div class="login-options">
                                <button type="button" class="link-button" id="forgot-password">Esqueci minha senha</button>
                                <span class="separator">•</span>
                                <button type="button" class="link-button" id="create-account">Criar nova conta</button>
                            </div>
                        `
                            : ''
                        }
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn-secondary" id="login-cancel">Cancelar</button>
                        <button type="submit" class="btn-primary" id="login-submit" form="login-form">
                            <span class="btn-text">${isSignup ? 'Criar Senha' : 'Entrar'}</span>
                            <span class="btn-loading" style="display:none;">⏳ ${isSignup ? 'Criando...' : 'Entrando...'}</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.modal = document.getElementById('login-modal-overlay');

    // Garantir visibilidade caso algum estilo global defina .modal-overlay como oculto por padrão
    requestAnimationFrame(() => {
      try {
        this.modal.classList.add('visible');
      } catch (_) {}
    });

    setTimeout(() => {
      const firstField = this.isMigrationMode
        ? this.modal.querySelector('#login-password')
        : this.modal.querySelector('#login-email');
      if (firstField) firstField.focus();
    }, 100);
  }

  bindEvents() {
    document.addEventListener('keydown', this.handleKeydown);

    // Adicionar event listener de clique fora com delay para evitar fechamento imediato
    setTimeout(() => {
      document.addEventListener('click', this.handleClickOutside);
    }, 100);

    this.modal.querySelector('.modal-close').addEventListener('click', () => this.close(null));
    this.modal.querySelector('#login-cancel').addEventListener('click', () => this.close(null));
    this.modal.querySelector('#login-form').addEventListener('submit', this.handleSubmit);

    const forgotPasswordBtn = this.modal.querySelector('#forgot-password');
    if (forgotPasswordBtn) {
      forgotPasswordBtn.addEventListener('click', this.handleForgotPassword);
    }

    const createAccountBtn = this.modal.querySelector('#create-account');
    if (createAccountBtn) {
      createAccountBtn.addEventListener('click', this.handleCreateAccount);
    }

    const passwordToggle = this.modal.querySelector('.password-toggle');
    if (passwordToggle) {
      passwordToggle.addEventListener('click', this.togglePassword);
    }
  }

  unbindEvents() {
    document.removeEventListener('keydown', this.handleKeydown);
    document.removeEventListener('click', this.handleClickOutside);
    // Other listeners are on this.modal, which gets removed, so they are garbage collected.
  }

  handleKeydown(e) {
    if (e.key === 'Escape') {
      this.close(null);
    }
  }

  handleClickOutside(e) {
    // Verificar se há outros modais abertos
    if (
      document.getElementById('forgot-password-modal-overlay') ||
      document.getElementById('cadastro-modal-overlay')
    ) {
      return;
    }

    // Proteção temporal: não fechar muito cedo
    const modalAge = Date.now() - this._openedAt;
    if (modalAge < 300) {
      console.log('[LoginModal] ⏱️ Clique muito cedo, ignorando:', modalAge + 'ms');
      return;
    }

    // Verificar se o clique foi no overlay (fora do container)
    if (e.target === this.modal) {
      console.log('[LoginModal] 🖱️ Clique fora detectado, fechando modal');
      this.close(null);
    }
  }

  async handleForgotPassword(e) {
    if (e) e.stopPropagation();
    const userEmail = this.modal.querySelector('#login-email')?.value || '';
    this.close(null);

    try {
      await new Promise((res) => setTimeout(res, 250)); // Wait for close animation
      const { default: ForgotPasswordModal } = await import('./ForgotPasswordModal.js');
      const forgotPasswordModal = new ForgotPasswordModal();
      await forgotPasswordModal.show(userEmail);
    } catch (error) {
      console.error('Erro ao carregar o modal de recuperação de senha', error);
    }
  }

  async handleCreateAccount(e) {
    if (e) e.stopPropagation();
    this.close(null);

    try {
      await new Promise((res) => setTimeout(res, 250)); // Wait for close animation
      const { default: CadastroUsuarioModal } = await import('./CadastroUsuarioModal.js');
      const cadastroModal = new CadastroUsuarioModal();
      await cadastroModal.show();
    } catch (error) {
      console.error('Erro ao carregar o modal de cadastro', error);
    }
  }

  async handleSubmit(e) {
    e.preventDefault();
    // Basic validation logic can be added here if needed
    this.setLoading(true);
    try {
      const formData = new FormData(e.target);
      const email = this.isMigrationMode ? this.migrationData.email : formData.get('email');
      const password = formData.get('password');

      let result;
      if (this.isMigrationMode) {
        result = await migrateExistingUser(this.migrationData.id, password);
      } else {
        result = await signIn(email, password);
      }

      if (result.error) {
        throw result.error;
      }
      this.close(result);
    } catch (error) {
      console.error('Login/Migration Error:', error);
      // Error handling logic can be added here
    } finally {
      this.setLoading(false);
    }
  }

  togglePassword(e) {
    const button = e.currentTarget;
    const passwordInput = button.previousElementSibling;
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      button.textContent = '🙈';
    } else {
      passwordInput.type = 'password';
      button.textContent = '👁️';
    }
  }

  setLoading(loading) {
    const btn = this.modal.querySelector('#login-submit');
    if (!btn) return;
    const text = btn.querySelector('.btn-text');
    const spinner = btn.querySelector('.btn-loading');
    btn.disabled = loading;
    if (text) text.style.display = loading ? 'none' : 'inline';
    if (spinner) spinner.style.display = loading ? 'inline' : 'none';
  }

  close(result) {
    if (!this.modal) return;
    this.unbindEvents();
    this.modal.style.animation = 'fadeOut 0.2s ease';
    setTimeout(() => {
      if (this.modal) this.modal.remove();
      this.modal = null;
      if (this.resolve) {
        this.resolve(result || null);
        this.resolve = null;
        this.reject = null;
      }
    }, 200);
  }
}
