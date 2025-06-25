// js/ui/notifications.js
// Sistema de notificações e indicadores de carregamento

// Mostrar notificação
export function showNotification(message, type = 'info', persistent = false) {
    // Se não for persistente, remover notificações antigas
    if (!persistent) {
        const oldNotifications = document.querySelectorAll('.notification:not(.persistent)');
        oldNotifications.forEach(n => n.remove());
    }
    
    // Criar nova notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type} show${persistent ? ' persistent' : ''}`;
    notification.innerHTML = message; // Usar innerHTML para suportar HTML no botão de retry
    
    // Aplicar estilos inline para garantir visibilidade
    notification.style.cssText = `
        position: fixed;
        bottom: ${persistent ? '20px' : '100px'};
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
        max-width: 90%;
        text-align: center;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
        justify-content: center;
    `;
    
    // Estilizar botões dentro da notificação
    const buttons = notification.querySelectorAll('button');
    buttons.forEach(btn => {
        btn.style.cssText = `
            background: rgba(255,255,255,0.2);
            color: white;
            border: 1px solid rgba(255,255,255,0.3);
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s;
            margin-left: 8px;
        `;
        btn.onmouseover = () => {
            btn.style.background = 'rgba(255,255,255,0.3)';
        };
        btn.onmouseout = () => {
            btn.style.background = 'rgba(255,255,255,0.2)';
        };
    });
    
    document.body.appendChild(notification);
    
    // Se não for persistente, remover após 3 segundos
    if (!persistent) {
        setTimeout(() => {
            notification.style.animation = 'slideDown 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    // Retornar objeto com método remove para notificações persistentes
    return {
        element: notification,
        remove: () => {
            notification.style.animation = 'slideDown 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    };
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