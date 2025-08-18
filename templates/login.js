// Template da tela de login
export const loginTemplate = () => `
    <div id="login-screen" class="screen">
        <div class="login-container">
            <div class="login-header">
                <div class="logo-container">
                    <div class="brand-logos">
                        <img src="./icons/logo.png" alt="Logo" class="brand-logo main-logo">
                    </div>
                </div>
                <p>Bem-vindo ao seu treino</p>
            </div>
            
            <!-- Container para usuários com estrutura correta -->
            <div class="users-grid" id="users-grid">
                <!-- Placeholder temporário -->
                <div class="loading-users">Carregando usuários...</div>
            </div>
        </div>
    </div>
`;

// ADICIONAR estilos específicos para garantir que apareçam
export const loginStyles = `
    .login-container {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background: linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
    }

    .login-header {
        text-align: center;
        margin-bottom: 48px;
    }

    .logo-container {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16px;
        margin-bottom: 8px;
    }

    .brand-logos {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16px;
    }

    .brand-logo {
        height: 56px;
        width: auto;
        filter: drop-shadow(0 0 15px var(--accent-green)) brightness(1.2);
        animation: logoPulse 2s ease-in-out infinite;
        transition: all 0.3s ease;
    }
    .main-logo {
        height: 120px;
        width: auto;
        max-width: 90vw;
    }

    .brand-logo:hover {
        transform: scale(1.1);
        filter: drop-shadow(0 0 25px var(--accent-green)) brightness(1.4);
    }

    .ff-logo {
        animation-delay: 0s;
    }

    .forca-logo {
        animation-delay: 0.5s;
    }

    @keyframes logoPulse {
        0%, 100% { filter: drop-shadow(0 0 12px var(--accent-green)) brightness(1.2); }
        50% { filter: drop-shadow(0 0 20px var(--accent-green)) brightness(1.4); }
    }

    .login-header h1 {
        margin: 0;
        background: linear-gradient(135deg, var(--text-primary) 0%, var(--accent-green) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-size: 2.5rem;
        text-shadow: 0 0 20px rgba(207, 255, 4, 0.3);
        font-weight: 900;
        letter-spacing: 2px;
    }

    .login-header p {
        color: var(--text-secondary);
        font-size: 1.125rem;
    }

    .users-grid {
        display: flex;
        gap: 24px;
        margin-bottom: 32px;
        flex-wrap: wrap;
        justify-content: center;
    }

    .loading-users {
        color: var(--text-secondary);
        font-size: 1rem;
        padding: 20px;
    }

    .user-card {
        background: var(--bg-card);
        border-radius: var(--radius-lg);
        padding: 32px 24px;
        cursor: pointer;
        transition: var(--transition);
        text-align: center;
        border: 2px solid transparent;
        position: relative;
        overflow: hidden;
        min-width: 200px;
    }

    .user-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: radial-gradient(circle at center, var(--accent-green-bg) 0%, transparent 70%);
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    .user-card:hover {
        transform: translateY(-4px);
        border-color: var(--accent-green);
        box-shadow: var(--shadow-lg);
    }

    .user-card:hover::before {
        opacity: 1;
    }

    .user-avatar {
        width: 120px;
        height: 120px;
        border-radius: var(--radius-full);
        margin: 0 auto 16px;
        overflow: hidden;
        border: 3px solid var(--border-color);
        position: relative;
        z-index: 1;
    }

    .user-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .user-card h3 {
        font-size: 1.125rem;
        margin-bottom: 4px;
        position: relative;
        z-index: 1;
    }

    .user-card p {
        color: var(--text-secondary);
        font-size: 0.875rem;
        position: relative;
        z-index: 1;
    }

    .no-users {
        text-align: center;
        color: var(--text-secondary);
        padding: 40px 20px;
    }

    .no-users p {
        margin-bottom: 20px;
        font-size: 1.1rem;
    }
    
    /* ===== ESTILOS DO MODAL DE CADASTRO ===== */
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.2s ease;
    }
    
    .modal-container {
        background: white;
        border-radius: 12px;
        max-width: 400px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        animation: slideIn 0.3s ease;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes slideIn {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
    
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .modal-header {
        padding: 20px 24px 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #eee;
        margin-bottom: 0;
        padding-bottom: 16px;
    }
    
    .modal-header h2 {
        margin: 0;
        font-size: 1.25rem;
        color: #333;
        font-weight: 600;
    }
    
    .modal-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #666;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: all 0.2s ease;
    }
    
    .modal-close:hover {
        background: #f5f5f5;
        color: #333;
    }
    
    .modal-body {
        padding: 20px 24px;
    }
    
    .form-group {
        margin-bottom: 16px;
    }
    
    .form-group label {
        display: block;
        margin-bottom: 6px;
        font-weight: 500;
        color: #333;
        font-size: 14px;
    }
    
    .form-group input[type="text"],
    .form-group input[type="email"],
    .form-group input[type="date"] {
        width: 100%;
        padding: 12px;
        border: 2px solid #ddd;
        border-radius: 8px;
        font-size: 16px;
        transition: border-color 0.2s ease;
        background: white;
        box-sizing: border-box;
    }
    
    .form-group input:focus {
        outline: none;
        border-color: #007bff;
        box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
    }
    
    .form-group input:invalid {
        border-color: #dc3545;
    }
    
    .error-message {
        color: #dc3545;
        font-size: 12px;
        margin-top: 4px;
        min-height: 16px;
        display: block;
    }
    
    .checkbox-container {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        cursor: pointer;
        font-size: 14px;
        line-height: 1.4;
    }
    
    .checkbox-container input[type="checkbox"] {
        margin: 0;
        margin-top: 2px;
    }
    
    .checkbox-text {
        flex: 1;
        color: #555;
    }
    
    .modal-footer {
        padding: 0 24px 24px;
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        border-top: 1px solid #eee;
        margin-top: 0;
        padding-top: 16px;
    }
    
    .btn-secondary {
        background: #f8f9fa;
        color: #6c757d;
        border: 1px solid #dee2e6;
        padding: 10px 20px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s ease;
    }
    
    .btn-secondary:hover {
        background: #e9ecef;
        color: #495057;
    }
    
    .btn-primary {
        background: #007bff;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .btn-primary:hover:not(:disabled) {
        background: #0056b3;
        transform: translateY(-1px);
    }
    
    .btn-primary:disabled {
        background: #6c757d;
        cursor: not-allowed;
        transform: none;
    }
    
    .btn-loading {
        display: none;
    }
    
    /* Toast notifications */
    .toast-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10001;
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        font-size: 14px;
        font-weight: 500;
        max-width: 300px;
        animation: slideInRight 0.3s ease;
    }
    
    .toast-error {
        background: #dc3545;
        color: white;
    }
    
    .toast-success {
        background: #28a745;
        color: white;
    }
    
    /* Responsividade do modal */
    @media (max-width: 480px) {
        .modal-container {
            width: 95%;
            margin: 20px;
        }
        
        .modal-header {
            padding: 16px 20px 0;
        }
        
        .modal-body {
            padding: 16px 20px;
        }
        
        .modal-footer {
            padding: 0 20px 20px;
            flex-direction: column-reverse;
        }
        
        .btn-secondary,
        .btn-primary {
            width: 100%;
            justify-content: center;
        }
    }
`;