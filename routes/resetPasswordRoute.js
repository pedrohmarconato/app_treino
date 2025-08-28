export default async function resetPasswordRoute() {
  console.log('[resetPasswordRoute] Iniciando fluxo de redefinição');
  try {
    // Garantir Auth carregado
    if (!window.AuthSystem) {
      const ok = await window.loadAuthSystem?.();
      if (!ok) throw new Error('AuthSystem não carregado');
    }

    // Verificar hash do Supabase (#access_token, etc.)
    const hash = window.location.hash || '';
    const params = new URLSearchParams(window.location.search);
    const email = params.get('email') || '';

    // Caso 1: Link abre com token no hash -> abrir modal de nova senha
    if (hash.includes('access_token')) {
      console.log('[resetPasswordRoute] Token de redefinição detectado no hash');
      // Pedir nova senha do usuário
      const { default: ResetNewPasswordModal } = await import(
        '../components/ResetNewPasswordModal.js'
      );
      const modal = new ResetNewPasswordModal({ email });
      const result = await modal.show();

      if (result?.success) {
        window.showNotification?.('Senha redefinida com sucesso! Faça login.', 'success');
        // Voltar para login
        window.history.replaceState({}, document.title, '/');
        window.renderTemplate?.('login');
      }
      return;
    }

    // Caso 2: Não há token no hash -> mostrar instruções
    const { default: ResetPasswordInfoPage } = await import(
      '../components/ResetPasswordInfoPage.js'
    );
    const info = new ResetPasswordInfoPage({ email });
    info.render();
  } catch (err) {
    console.error('[resetPasswordRoute] Erro:', err);
    window.showNotification?.('Erro ao abrir página de redefinição', 'error');
  }
}
