// Template da tela de login
export const loginTemplate = () => `
    <div id="login-screen" class="screen active">
        <div class="login-container">
            <div class="login-header">
                <h1>💪 Cyclo Training</h1>
                <p>Sistema de Acompanhamento de Treinos</p>
            </div>
            
            <div class="user-selection">
                <h2>Selecione seu Perfil</h2>
                <div id="users-grid" class="users-grid">
                    <!-- Usuários serão carregados dinamicamente -->
                </div>
            </div>
        </div>
    </div>
`;

// Estilos específicos da tela de login
export const loginStyles = `
    .login-container {
        max-width: 600px;
        margin: 0 auto;
        padding: 40px 20px;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }

    .login-header {
        text-align: center;
        margin-bottom: 48px;
    }

    .login-header h1 {
        font-size: 2.5rem;
        margin-bottom: 8px;
        background: linear-gradient(135deg, var(--accent-green) 0%, var(--accent-green-dark) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .login-header p {
        color: var(--text-secondary);
        font-size: 1.125rem;
    }

    .user-selection h2 {
        text-align: center;
        margin-bottom: 32px;
        font-size: 1.5rem;
    }

    .users-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 24px;
        max-width: 500px;
        margin: 0 auto;
    }

    .user-card {
        background: var(--bg-card);
        border-radius: var(--radius-lg);
        padding: 32px;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s ease;
        border: 2px solid var(--border-color);
        position: relative;
        overflow: hidden;
    }

    .user-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, var(--accent-green) 0%, var(--accent-green-dark) 100%);
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    .user-card:hover {
        transform: translateY(-4px);
        border-color: var(--accent-green);
        box-shadow: var(--shadow-lg);
    }

    .user-card:hover::before {
        opacity: 0.1;
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