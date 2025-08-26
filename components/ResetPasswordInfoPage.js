export default class ResetPasswordInfoPage {
  constructor({ email = '' } = {}) {
    this.email = email;
  }

  render() {
    const container = document.getElementById('app');
    if (!container) return;
    container.innerHTML = `
      <div id="reset-password-info" class="screen active" style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#101010;color:#fff;padding:24px;">
        <div style="max-width:560px;width:100%;background:#151515;border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:24px;">
          <h2 style="margin-top:0;color:#CFFF04;">Redefinição de senha</h2>
          <p>Enviamos um email com um link para redefinição de senha.</p>
          <ul>
            <li>Verifique a caixa de entrada e a pasta de spam.</li>
            <li>O link expira após alguns minutos.</li>
            <li>Caso tenha aberto esta página via link, o formulário de nova senha aparecerá automaticamente.</li>
          </ul>
          <div style="margin-top:16px;display:flex;gap:8px;">
            <button id="voltar-login" class="btn-secondary">Voltar ao login</button>
            <button id="reenviar-email" class="btn-primary">Reenviar email</button>
          </div>
          <div id="reenviar-status" class="error-message" style="margin-top:8px;"></div>
        </div>
      </div>`;

    document.getElementById('voltar-login')?.addEventListener('click', () => {
      window.history.replaceState({}, document.title, '/');
      window.renderTemplate?.('login');
    });

    document.getElementById('reenviar-email')?.addEventListener('click', async () => {
      const status = document.getElementById('reenviar-status');
      status.textContent = '';
      try {
        const email = this.email || prompt('Digite seu email cadastrado:');
        if (!email) return;
        const ok = await window.loadAuthSystem?.();
        if (!ok) throw new Error('Auth não carregado');
        const { resetPassword } = await import('../services/authService.js');
        const res = await resetPassword(email);
        if (res?.success) {
          status.style.color = '#CFFF04';
          status.textContent = 'Email reenviado! Verifique sua caixa de entrada.';
        } else {
          throw new Error(res?.message || 'Falha ao reenviar');
        }
      } catch (err) {
        status.style.color = '#f44336';
        status.textContent = err.message || 'Erro ao reenviar email';
      }
    });
  }
}
