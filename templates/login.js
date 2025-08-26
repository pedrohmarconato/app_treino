// Template da tela de login
export const loginTemplate = () => `
    <div id="login-screen" class="screen">
        <div class="login-container">
            <!-- Container de efeitos será adicionado via JS -->
            
            <div class="login-header">
                <div class="logo-container">
                    <img src="./icons/logo.png" alt="Logo" class="brand-logo">
                </div>
                <p>Bem-vindo ao seu treino</p>
            </div>
            
            <!-- Formulário de login -->
            <form id="login-form" class="login-form">
                <div class="form-group">
                    <label for="email-input">Email</label>
                    <input type="email" id="email-input" required placeholder="seu@email.com" autocomplete="email" />
                </div>
                <div class="form-group">
                    <label for="password-input">Senha</label>
                    <input type="password" id="password-input" required placeholder="••••••••" autocomplete="current-password" />
                </div>
                <button type="submit" class="btn-login-submit">
                    <span class="btn-text">Entrar</span>
                </button>
                
                <div class="login-options">
                    <button type="button" id="forgot-password-btn" class="btn-forgot-password">
                        Esqueci minha senha
                    </button>
                </div>
                
                <button type="button" id="cadastrar-usuario-btn" class="btn-new-user">
                    <span class="btn-icon">+</span>
                    <span class="btn-text">Criar nova conta</span>
                </button>
            </form>
        </div>
    </div>
`;


// ADICIONAR estilos específicos para garantir que apareçam
export const loginStyles = `
    /* ===== VARIÁVEIS DE DESIGN ===== */
    :root {
        --login-primary: #CFFF04;
        --login-secondary: #101010;
        --login-accent: #1a1a1a;
        --login-glass: rgba(255, 255, 255, 0.05);
        --login-border: rgba(255, 255, 255, 0.1);
        --login-shadow: 0 2px 16px rgba(0, 0, 0, 0.2);
        --login-gradient: #0a0a0a;
    }
    
    /* ===== CONTAINER PRINCIPAL ===== */
    .login-container {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background: var(--login-gradient);
        position: relative;
        overflow: hidden;
    }
    
    /* Fundo limpo sem efeitos */

    /* ===== HEADER E LOGO ===== */
    .login-header {
        text-align: center;
        margin-bottom: 48px;
        position: relative;
        z-index: 2;
    }

    .logo-container {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 24px;
        position: relative;
    }

    /* Logo com efeito glassmorphism */
    .brand-logo {
        height: 120px;
        width: auto;
        filter: brightness(1.1);
        position: relative;
        z-index: 2;
    }
    
    /* Logo sem efeitos */

    .login-header p {
        color: rgba(255, 255, 255, 0.8);
        font-size: 1.25rem;
        font-weight: 300;
        letter-spacing: 1px;
        margin: 0;
        animation: fadeInUp 0.8s ease-out;
    }
    
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    /* ===== FORMULÁRIO DE LOGIN ===== */
    .login-form {
        width: 100%;
        max-width: 400px;
        background: var(--login-glass);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid var(--login-border);
        border-radius: 24px;
        padding: 40px;
        box-shadow: var(--login-shadow);
        position: relative;
        z-index: 2;
        /* Sem animação */
    }
    
    /* Animação removida */
    
    /* Remover efeito hover do form */
    
    /* ===== FORM GROUPS ===== */
    .form-group {
        margin-bottom: 24px;
        position: relative;
    }
    
    .form-group label {
        display: block;
        color: rgba(255, 255, 255, 0.9);
        font-size: 14px;
        font-weight: 500;
        margin-bottom: 8px;
        letter-spacing: 0.5px;
        transition: color 0.3s ease;
    }
    
    .form-group:focus-within label {
        color: var(--login-primary);
    }
    
    .form-group input {
        width: 100%;
        padding: 16px;
        background: rgba(255, 255, 255, 0.05);
        border: 2px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        color: white;
        font-size: 16px;
        transition: all 0.3s ease;
        box-sizing: border-box;
    }
    
    .form-group input::placeholder {
        color: rgba(255, 255, 255, 0.3);
    }
    
    .form-group input:focus {
        outline: none;
        border-color: var(--login-primary);
        background: rgba(255, 255, 255, 0.08);
        box-shadow: 0 0 0 4px rgba(207, 255, 4, 0.1);
    }
    
    /* Animação de entrada nos inputs */
    .form-group input {
        animation: inputSlideIn 0.5s ease-out both;
    }
    
    .form-group:nth-child(1) input {
        animation-delay: 0.3s;
    }
    
    .form-group:nth-child(2) input {
        animation-delay: 0.4s;
    }
    
    @keyframes inputSlideIn {
        from {
            opacity: 0;
            transform: translateX(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    /* ===== BOTÕES ===== */
    .btn-login-submit, .btn-new-user {
        width: 100%;
        padding: 16px 24px;
        border: none;
        border-radius: 12px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
        margin-bottom: 16px;
    }
    
    /* ===== OPÇÕES DE LOGIN ===== */
    .login-options {
        display: flex;
        justify-content: center;
        margin: 16px 0 24px 0;
    }
    
    .btn-forgot-password {
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.7);
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        padding: 8px 16px;
        border-radius: 8px;
        transition: all 0.3s ease;
        text-decoration: none;
        letter-spacing: 0.5px;
    }
    
    .btn-forgot-password:hover {
        color: var(--login-primary);
        background: rgba(207, 255, 4, 0.1);
        transform: translateY(-1px);
    }
    
    .btn-forgot-password:active {
        transform: translateY(0);
    }
    
    .btn-login-submit {
        background: linear-gradient(135deg, var(--login-primary), #b8e000);
        color: var(--login-secondary);
        box-shadow: 0 4px 20px rgba(207, 255, 4, 0.4);
        animation: buttonFadeIn 0.5s ease-out 0.5s both;
    }
    
    .btn-login-submit:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 30px rgba(207, 255, 4, 0.6);
    }
    
    .btn-login-submit:active {
        transform: translateY(0);
    }
    
    /* Efeito de onda nos botões */
    .btn-login-submit::before, .btn-new-user::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.5);
        transform: translate(-50%, -50%);
        transition: width 0.6s, height 0.6s;
    }
    
    .btn-login-submit:active::before, .btn-new-user:active::before {
        width: 300px;
        height: 300px;
    }
    
    .btn-new-user {
        background: transparent;
        color: rgba(255, 255, 255, 0.8);
        border: 2px solid rgba(255, 255, 255, 0.2);
        margin-bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        animation: buttonFadeIn 0.5s ease-out 0.6s both;
    }
    
    .btn-new-user:hover {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(255, 255, 255, 0.4);
        color: white;
        transform: translateY(-2px);
    }
    
    @keyframes buttonFadeIn {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    /* ===== RESPONSIVIDADE ===== */
    @media (max-width: 480px) {
        .login-form {
            padding: 32px 24px;
            margin: 0 16px;
        }
        
        .brand-logo {
            height: 100px;
        }
        
        .logo-container::before {
            width: 150px;
            height: 150px;
        }
        
        .login-header p {
            font-size: 1.1rem;
        }
        
        .form-group input {
            padding: 14px;
            font-size: 15px;
        }
        
        .btn-login-submit, .btn-new-user {
            padding: 14px 20px;
            font-size: 15px;
        }
    }
    
    /* ===== ANIMAÇÃO DE LOADING ===== */
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    
    .loading-spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid transparent;
        border-top-color: currentColor;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }
`;