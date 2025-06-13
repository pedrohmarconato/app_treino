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
`;