// js/ui/notifications.js
// Sistema de notificações e indicadores de carregamento

// Mostrar notificação
export function showNotification(message, type = 'info') {
    // Remover notificações antigas
    const oldNotifications = document.querySelectorAll('.notification');
    oldNotifications.forEach(n => n.remove());
    
    // Criar nova notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type} show`;
    notification.textContent = message;
    
    // Aplicar estilos inline para garantir visibilidade
    notification.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'error' ? '#f44336' : type === 'success' ? '#10b981' : '#333'};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 999999;
        animation: slideUp 0.3s ease;
        min-width: 300px;
        text-align: center;
        font-weight: 500;
    `;
    
    document.body.appendChild(notification);
    
    // Remover após 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideDown 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Mostrar loading global
export function showLoading() {
    hideLoading(); // Remove loading anterior se existir
    
    const loading = document.createElement('div');
    loading.className = 'loading-overlay';
    loading.innerHTML = '<div class="loading-spinner"></div>';
    
    // Aplicar estilos inline
    loading.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
    `;
    
    const spinner = loading.querySelector('.loading-spinner');
    spinner.style.cssText = `
        width: 48px;
        height: 48px;
        border: 3px solid #333;
        border-top-color: #a8ff00;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    `;
    
    document.body.appendChild(loading);
}

// Esconder loading global
export function hideLoading() {
    const loading = document.querySelector('.loading-overlay');
    if (loading) {
        loading.remove();
    }
}