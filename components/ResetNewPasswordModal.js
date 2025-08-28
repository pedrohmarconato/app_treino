export default class ResetNewPasswordModal {
  constructor(options = {}) {
    this.options = options;
    this.modal = null;
    this.resolve = null;
    this.reject = null;
  }

  show() {
    return new Promise((res, rej) => {
      this.resolve = res;
      this.reject = rej;
      this.render();
      this.bind();
      // focus
      setTimeout(() => this.modal.querySelector('#new-password')?.focus(), 50);
    });
  }

  render() {
    const html = `
      <div id="reset-new-password-overlay" class="modal-overlay" style="z-index: 16000;">
        <div class="modal-container" style="max-width:480px">
          <div class="modal-header">
            <h2>Definir nova senha</h2>
            <button class="modal-close" aria-label="Fechar">&times;</button>
          </div>
          <form id="reset-new-password-form" class="modal-body">
            <div class="form-group">
              <label for="new-password">Nova senha</label>
              <input type="password" id="new-password" minlength="6" required autocomplete="new-password" placeholder="••••••••"/>
              <div id="new-pass-error" class="error-message"></div>
            </div>
            <div class="form-group">
              <label for="confirm-password">Confirmar nova senha</label>
              <input type="password" id="confirm-password" minlength="6" required autocomplete="new-password" placeholder="••••••••"/>
              <div id="confirm-pass-error" class="error-message"></div>
            </div>
          </form>
          <div class="modal-footer">
            <button class="btn-secondary" id="cancel-btn">Cancelar</button>
            <button class="btn-primary" id="save-btn" form="reset-new-password-form">Salvar</button>
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    this.modal = document.getElementById('reset-new-password-overlay');
  }

  bind() {
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close(null);
    });
    this.modal.querySelector('.modal-close').addEventListener('click', (e) => {
      e.preventDefault();
      this.close(null);
    });
    this.modal.querySelector('#cancel-btn').addEventListener('click', (e) => {
      e.preventDefault();
      this.close(null);
    });
    this.modal.querySelector('#reset-new-password-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const pass = this.modal.querySelector('#new-password').value.trim();
      const confirm = this.modal.querySelector('#confirm-password').value.trim();
      const err1 = this.modal.querySelector('#new-pass-error');
      const err2 = this.modal.querySelector('#confirm-pass-error');
      err1.textContent = '';
      err2.textContent = '';
      if (!pass || pass.length < 6) {
        err1.textContent = 'Senha deve ter ao menos 6 caracteres';
        return;
      }
      if (pass !== confirm) {
        err2.textContent = 'As senhas não coincidem';
        return;
      }
      try {
        // Atualizar senha via Supabase (usuário já autenticado via link mágico de reset)
        const { data, error } = await window.supabase.auth.updateUser({ password: pass });
        if (error) throw error;
        this.close({ success: true });
      } catch (err) {
        err2.textContent = err.message || 'Erro ao redefinir senha';
      }
    });
  }

  close(result) {
    if (!this.modal) return;
    this.modal.style.animation = 'fadeOut 0.2s ease';
    setTimeout(() => {
      this.modal.remove();
      this.modal = null;
      this.resolve?.(result || null);
    }, 200);
  }
}
