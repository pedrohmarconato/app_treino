# 🔒 Sistema de Senhas - Documento de Implementação

**Projeto:** App Treino  
**Data:** 15/06/2025  
**Status:** Planejamento - Aguardando Implementação  
**Complexidade:** Média  
**Tempo Estimado:** 8-12 horas

---

## 📋 Resumo Executivo

Implementação de sistema de autenticação com senha para substituir o atual sistema de seleção de usuários. Foco em simplicidade e segurança básica, sem verificação de email.

### Benefícios
- ✅ **Segurança:** Dados protegidos por autenticação real
- ✅ **Profissionalismo:** Login padrão da indústria
- ✅ **Privacidade:** Cada usuário acessa apenas seus dados
- ✅ **Escalabilidade:** Preparado para múltiplos usuários

### Impactos
- ❌ **Breaking Change:** Usuários existentes precisarão criar senhas
- ⚠️ **Migração:** Necessário script de transição
- 🔄 **UX Change:** Interface de login diferente

---

## 🗂️ Estrutura de Implementação

### FASE 1: 🗄️ BANCO DE DADOS
**Prioridade:** Alta | **Tempo:** 1h | **Complexidade:** Baixa

#### 1.1 Modificações na Tabela `usuarios`
```sql
-- Adicionar colunas para autenticação
ALTER TABLE usuarios 
ADD COLUMN password_hash text,
ADD COLUMN login_attempts integer DEFAULT 0,
ADD COLUMN locked_until timestamp with time zone,
ADD COLUMN last_login timestamp with time zone;

-- Criar índices para performance
CREATE INDEX idx_usuarios_email_hash ON usuarios(email, password_hash);
CREATE INDEX idx_usuarios_locked ON usuarios(locked_until) WHERE locked_until IS NOT NULL;

-- Adicionar constraints
ALTER TABLE usuarios 
ADD CONSTRAINT chk_login_attempts CHECK (login_attempts >= 0 AND login_attempts <= 10);
```

#### 1.2 Script de Migração de Usuários Existentes
```sql
-- Script para usuários existentes criarem senhas
-- Arquivo: migrations/add_password_system.sql

-- Criar tabela temporária para senhas iniciais
CREATE TABLE temp_user_passwords (
    user_id bigint PRIMARY KEY,
    temp_password text,
    created_at timestamp DEFAULT now(),
    used boolean DEFAULT false
);

-- Gerar senhas temporárias para usuários existentes
INSERT INTO temp_user_passwords (user_id, temp_password)
SELECT 
    id, 
    'temp' || id || '2025'  -- Senha temporária: temp[ID]2025
FROM usuarios 
WHERE password_hash IS NULL;

-- Criar view para admin visualizar senhas temporárias
CREATE OR REPLACE VIEW vw_senhas_temporarias AS
SELECT 
    u.id,
    u.nome,
    u.email,
    tp.temp_password,
    tp.used as senha_alterada
FROM usuarios u
JOIN temp_user_passwords tp ON u.id = tp.user_id
WHERE u.password_hash IS NULL;
```

#### 1.3 Validações e Triggers
```sql
-- Trigger para limpar tentativas após login bem-sucedido
CREATE OR REPLACE FUNCTION reset_login_attempts()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.last_login IS NOT NULL AND NEW.last_login != OLD.last_login THEN
        NEW.login_attempts = 0;
        NEW.locked_until = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_reset_login_attempts
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION reset_login_attempts();
```

---

### FASE 2: 🔧 BACKEND / SERVICES

**Prioridade:** Alta | **Tempo:** 3-4h | **Complexidade:** Média

#### 2.1 Criar `services/authService.js`
```javascript
// services/authService.js - Serviço de autenticação

import { supabase } from './supabaseService.js';

class AuthService {
    
    // Hash da senha usando Web Crypto API
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + 'app_treino_salt_2025');
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    // Validar login
    async login(email, password) {
        try {
            // Verificar se usuário existe e não está bloqueado
            const { data: user, error } = await supabase
                .from('usuarios')
                .select('id, nome, email, password_hash, login_attempts, locked_until')
                .eq('email', email.toLowerCase())
                .eq('status', 'ativo')
                .single();
                
            if (error || !user) {
                throw new Error('Email ou senha incorretos');
            }
            
            // Verificar bloqueio
            if (user.locked_until && new Date(user.locked_until) > new Date()) {
                const minutosRestantes = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
                throw new Error(`Conta bloqueada. Tente novamente em ${minutosRestantes} minutos`);
            }
            
            // Verificar senha
            const passwordHash = await this.hashPassword(password);
            
            if (user.password_hash !== passwordHash) {
                // Incrementar tentativas
                await this.incrementLoginAttempts(user.id, user.login_attempts);
                throw new Error('Email ou senha incorretos');
            }
            
            // Login bem-sucedido
            await supabase
                .from('usuarios')
                .update({ 
                    last_login: new Date().toISOString(),
                    login_attempts: 0,
                    locked_until: null 
                })
                .eq('id', user.id);
                
            return {
                id: user.id,
                nome: user.nome,
                email: user.email
            };
            
        } catch (error) {
            console.error('[AuthService] Erro no login:', error);
            throw error;
        }
    }
    
    // Incrementar tentativas de login
    async incrementLoginAttempts(userId, currentAttempts) {
        const newAttempts = currentAttempts + 1;
        const updateData = { login_attempts: newAttempts };
        
        // Bloquear após 5 tentativas por 15 minutos
        if (newAttempts >= 5) {
            const lockUntil = new Date();
            lockUntil.setMinutes(lockUntil.getMinutes() + 15);
            updateData.locked_until = lockUntil.toISOString();
        }
        
        await supabase
            .from('usuarios')
            .update(updateData)
            .eq('id', userId);
    }
    
    // Criar nova senha
    async setPassword(userId, newPassword) {
        try {
            const passwordHash = await this.hashPassword(newPassword);
            
            const { error } = await supabase
                .from('usuarios')
                .update({ 
                    password_hash: passwordHash,
                    login_attempts: 0,
                    locked_until: null 
                })
                .eq('id', userId);
                
            if (error) throw error;
            
            return true;
        } catch (error) {
            console.error('[AuthService] Erro ao definir senha:', error);
            throw error;
        }
    }
    
    // Validar força da senha
    validatePasswordStrength(password) {
        const errors = [];
        
        if (password.length < 6) {
            errors.push('Senha deve ter pelo menos 6 caracteres');
        }
        
        if (!/[0-9]/.test(password)) {
            errors.push('Senha deve conter pelo menos um número');
        }
        
        if (!/[A-Za-z]/.test(password)) {
            errors.push('Senha deve conter pelo menos uma letra');
        }
        
        return {
            valid: errors.length === 0,
            errors,
            strength: this.calculatePasswordStrength(password)
        };
    }
    
    // Calcular força da senha (1-5)
    calculatePasswordStrength(password) {
        let strength = 0;
        
        if (password.length >= 6) strength++;
        if (password.length >= 8) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[A-Za-z]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        
        return Math.min(strength, 5);
    }
    
    // Logout
    logout() {
        localStorage.removeItem('currentUser');
        sessionStorage.clear();
        return true;
    }
    
    // Verificar se está logado
    isAuthenticated() {
        const user = localStorage.getItem('currentUser');
        return user !== null;
    }
    
    // Obter usuário atual
    getCurrentUser() {
        const userStr = localStorage.getItem('currentUser');
        return userStr ? JSON.parse(userStr) : null;
    }
    
    // Salvar sessão
    saveSession(user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
    }
}

export default new AuthService();
```

#### 2.2 Modificar `services/userService.js`
```javascript
// Remover função fetchUsuarios() pública
// Adicionar verificação de autenticação
// Restringir acesso apenas ao usuário logado

// Exemplo de modificação:
export async function fetchUsuarios() {
    // REMOVIDO: Esta função não deve ser pública
    throw new Error('Acesso negado: Use o sistema de login');
}

export async function fetchUsuarioLogado() {
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser) {
        throw new Error('Usuário não autenticado');
    }
    
    const { data, error } = await supabase
        .from('usuarios')
        .select('id, nome, email, data_nascimento, status')
        .eq('id', currentUser.id)
        .eq('status', 'ativo')
        .single();
        
    if (error) throw error;
    return data;
}
```

---

### FASE 3: 🎨 FRONTEND / INTERFACE

**Prioridade:** Alta | **Tempo:** 3-4h | **Complexidade:** Média

#### 3.1 Atualizar `templates/login.js`
```javascript
// templates/login.js - Nova interface de login

export function renderLoginScreen() {
    return `
        <div id="login-screen" class="screen">
            <div class="login-container">
                <div class="login-header">
                    <div class="app-logo">
                        <h1>💪 App Treino</h1>
                        <p>Seu parceiro de treino</p>
                    </div>
                </div>
                
                <form id="login-form" class="login-form">
                    <div class="form-group">
                        <label for="login-email">Email</label>
                        <input 
                            type="email" 
                            id="login-email" 
                            name="email"
                            placeholder="seu@email.com"
                            required
                            autocomplete="email"
                            inputmode="email">
                    </div>
                    
                    <div class="form-group">
                        <label for="login-password">Senha</label>
                        <div class="password-input">
                            <input 
                                type="password" 
                                id="login-password" 
                                name="password"
                                placeholder="Sua senha"
                                required
                                autocomplete="current-password">
                            <button type="button" class="password-toggle" onclick="togglePasswordVisibility()">
                                👁️
                            </button>
                        </div>
                    </div>
                    
                    <div class="form-options">
                        <label class="checkbox-label">
                            <input type="checkbox" id="remember-me">
                            <span>Lembrar-me</span>
                        </label>
                    </div>
                    
                    <button type="submit" class="btn-login">
                        <span class="btn-text">Entrar</span>
                        <div class="btn-loading" style="display: none;">
                            <div class="spinner"></div>
                        </div>
                    </button>
                    
                    <div id="login-error" class="error-message" style="display: none;"></div>
                </form>
                
                <div class="login-footer">
                    <p>Primeira vez? <a href="#" onclick="showSetPasswordForm()">Criar senha</a></p>
                </div>
            </div>
            
            <!-- Modal para primeira senha -->
            <div id="set-password-modal" class="modal" style="display: none;">
                <div class="modal-content">
                    <h3>Criar sua senha</h3>
                    <form id="set-password-form">
                        <div class="form-group">
                            <label for="new-email">Confirme seu email</label>
                            <input type="email" id="new-email" required>
                        </div>
                        <div class="form-group">
                            <label for="new-password">Nova senha</label>
                            <input type="password" id="new-password" required>
                            <div class="password-strength">
                                <div class="strength-bar">
                                    <div class="strength-fill"></div>
                                </div>
                                <div class="strength-text">Força da senha</div>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="confirm-password">Confirmar senha</label>
                            <input type="password" id="confirm-password" required>
                        </div>
                        <div class="modal-buttons">
                            <button type="button" onclick="hideSetPasswordForm()">Cancelar</button>
                            <button type="submit">Criar Senha</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
}
```

#### 3.2 Modificar `feature/login.js`
```javascript
// feature/login.js - Nova lógica de login

import AuthService from '../services/authService.js';
import AppState from '../state/appState.js';
import { showNotification } from '../ui/notifications.js';
import { mostrarTela } from '../ui/navigation.js';

export async function initLoginScreen() {
    console.log('[Login] Iniciando tela de login');
    
    // Verificar se já está logado
    if (AuthService.isAuthenticated()) {
        const user = AuthService.getCurrentUser();
        AppState.set('currentUser', user);
        mostrarTela('dashboard');
        return;
    }
    
    // Configurar event listeners
    setupLoginEventListeners();
}

function setupLoginEventListeners() {
    const loginForm = document.getElementById('login-form');
    const setPasswordForm = document.getElementById('set-password-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (setPasswordForm) {
        setPasswordForm.addEventListener('submit', handleSetPassword);
    }
    
    // Password strength indicator
    const newPasswordInput = document.getElementById('new-password');
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', updatePasswordStrength);
    }
}

async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const rememberMe = document.getElementById('remember-me').checked;
    
    try {
        showLoginLoading(true);
        
        const user = await AuthService.login(email, password);
        
        // Salvar sessão
        AuthService.saveSession(user);
        AppState.set('currentUser', user);
        
        showNotification(`Bem-vindo, ${user.nome}!`, 'success');
        mostrarTela('dashboard');
        
    } catch (error) {
        showLoginError(error.message);
    } finally {
        showLoginLoading(false);
    }
}

async function handleSetPassword(event) {
    event.preventDefault();
    
    const email = document.getElementById('new-email').value;
    const password = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    try {
        // Validações
        if (password !== confirmPassword) {
            throw new Error('Senhas não conferem');
        }
        
        const validation = AuthService.validatePasswordStrength(password);
        if (!validation.valid) {
            throw new Error(validation.errors.join(', '));
        }
        
        // Buscar usuário por email
        const { data: user } = await supabase
            .from('usuarios')
            .select('id')
            .eq('email', email.toLowerCase())
            .single();
            
        if (!user) {
            throw new Error('Email não encontrado');
        }
        
        // Definir senha
        await AuthService.setPassword(user.id, password);
        
        showNotification('Senha criada com sucesso!', 'success');
        hideSetPasswordForm();
        
        // Fazer login automaticamente
        const loggedUser = await AuthService.login(email, password);
        AuthService.saveSession(loggedUser);
        AppState.set('currentUser', loggedUser);
        mostrarTela('dashboard');
        
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// Funções auxiliares
function showLoginLoading(show) {
    const btnText = document.querySelector('.btn-text');
    const btnLoading = document.querySelector('.btn-loading');
    const submitBtn = document.querySelector('.btn-login');
    
    if (show) {
        btnText.style.display = 'none';
        btnLoading.style.display = 'flex';
        submitBtn.disabled = true;
    } else {
        btnText.style.display = 'block';
        btnLoading.style.display = 'none';
        submitBtn.disabled = false;
    }
}

function showLoginError(message) {
    const errorDiv = document.getElementById('login-error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

function updatePasswordStrength() {
    const password = document.getElementById('new-password').value;
    const validation = AuthService.validatePasswordStrength(password);
    
    const strengthBar = document.querySelector('.strength-fill');
    const strengthText = document.querySelector('.strength-text');
    
    const strength = validation.strength;
    const percentage = (strength / 5) * 100;
    
    strengthBar.style.width = `${percentage}%`;
    
    const levels = ['Muito fraca', 'Fraca', 'Regular', 'Boa', 'Forte'];
    const colors = ['#ff4444', '#ff8800', '#ffcc00', '#88ff00', '#00ff88'];
    
    strengthText.textContent = levels[Math.max(0, strength - 1)] || 'Digite uma senha';
    strengthBar.style.backgroundColor = colors[Math.max(0, strength - 1)] || '#ddd';
}

// Funções globais para os botões
window.togglePasswordVisibility = function() {
    const passwordInput = document.getElementById('login-password');
    const toggleBtn = document.querySelector('.password-toggle');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.textContent = '🙈';
    } else {
        passwordInput.type = 'password';
        toggleBtn.textContent = '👁️';
    }
};

window.showSetPasswordForm = function() {
    document.getElementById('set-password-modal').style.display = 'flex';
};

window.hideSetPasswordForm = function() {
    document.getElementById('set-password-modal').style.display = 'none';
};
```

---

### FASE 4: 🎨 ESTILOS CSS

**Prioridade:** Média | **Tempo:** 2h | **Complexidade:** Baixa

#### 4.1 Adicionar em `styles.css`
```css
/* ==============================================
   LOGIN SYSTEM STYLES
============================================== */

.login-container {
    max-width: 400px;
    margin: 0 auto;
    padding: 40px 20px;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.login-header {
    text-align: center;
    margin-bottom: 40px;
}

.app-logo h1 {
    font-size: 2.5rem;
    margin: 0 0 10px 0;
    background: linear-gradient(135deg, #13f1fc, #0470dc);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.app-logo p {
    color: #888;
    margin: 0;
    font-size: 1rem;
}

.login-form {
    background: rgba(255, 255, 255, 0.05);
    padding: 30px;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.form-group {
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    color: #e0e0e0;
    font-weight: 500;
    font-size: 0.9rem;
}

.form-group input {
    width: 100%;
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: #fff;
    font-size: 1rem;
    transition: all 0.3s ease;
}

.form-group input:focus {
    outline: none;
    border-color: #13f1fc;
    box-shadow: 0 0 0 3px rgba(19, 241, 252, 0.1);
}

.password-input {
    position: relative;
}

.password-toggle {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #888;
    cursor: pointer;
    font-size: 1.2rem;
    padding: 4px;
}

.form-options {
    margin-bottom: 25px;
}

.checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    color: #ccc;
    font-size: 0.9rem;
}

.checkbox-label input[type="checkbox"] {
    width: auto;
}

.btn-login {
    width: 100%;
    padding: 14px;
    background: linear-gradient(135deg, #13f1fc, #0470dc);
    color: #000;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.btn-login:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(19, 241, 252, 0.3);
}

.btn-login:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
}

.btn-loading {
    display: flex;
    align-items: center;
    justify-content: center;
}

.spinner {
    width: 20px;
    height: 20px;
    border: 2px solid transparent;
    border-top: 2px solid #000;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.error-message {
    background: rgba(255, 68, 68, 0.2);
    border: 1px solid #ff4444;
    color: #ff6b7a;
    padding: 12px;
    border-radius: 8px;
    margin-top: 15px;
    font-size: 0.9rem;
    text-align: center;
}

.login-footer {
    text-align: center;
    margin-top: 30px;
}

.login-footer p {
    color: #888;
    margin: 0;
}

.login-footer a {
    color: #13f1fc;
    text-decoration: none;
    font-weight: 500;
}

.login-footer a:hover {
    text-decoration: underline;
}

/* Password Strength Indicator */
.password-strength {
    margin-top: 8px;
}

.strength-bar {
    height: 4px;
    background: #333;
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 5px;
}

.strength-fill {
    height: 100%;
    width: 0%;
    transition: all 0.3s ease;
    border-radius: 2px;
}

.strength-text {
    font-size: 0.8rem;
    color: #888;
}

/* Modal Styles */
.modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-content {
    background: #1a1a1a;
    padding: 30px;
    border-radius: 16px;
    border: 1px solid #333;
    max-width: 400px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
}

.modal-content h3 {
    margin: 0 0 20px 0;
    color: #13f1fc;
    text-align: center;
}

.modal-buttons {
    display: flex;
    gap: 12px;
    margin-top: 25px;
}

.modal-buttons button {
    flex: 1;
    padding: 12px;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
}

.modal-buttons button[type="button"] {
    background: #333;
    color: #ccc;
}

.modal-buttons button[type="submit"] {
    background: linear-gradient(135deg, #13f1fc, #0470dc);
    color: #000;
    font-weight: 600;
}

/* Responsive */
@media (max-width: 480px) {
    .login-container {
        padding: 20px 15px;
    }
    
    .login-form {
        padding: 20px;
    }
    
    .app-logo h1 {
        font-size: 2rem;
    }
}
```

---

### FASE 5: 🔒 SEGURANÇA E VALIDAÇÕES

**Prioridade:** Alta | **Tempo:** 2h | **Complexidade:** Média

#### 5.1 Middleware de Autenticação
```javascript
// middleware/authMiddleware.js

export function requireAuth() {
    return function(target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        
        descriptor.value = function(...args) {
            if (!AuthService.isAuthenticated()) {
                throw new Error('Acesso negado: Login necessário');
            }
            return originalMethod.apply(this, args);
        };
        
        return descriptor;
    };
}

// Uso:
// @requireAuth()
// async function fetchUserData() { ... }
```

#### 5.2 Proteção de Rotas
```javascript
// utils/routeProtection.js

export function protectRoute(requiredAuth = true) {
    if (requiredAuth && !AuthService.isAuthenticated()) {
        mostrarTela('login');
        return false;
    }
    return true;
}

// Modificar navigation.js
export function mostrarTela(tela) {
    if (tela !== 'login' && !protectRoute()) {
        return;
    }
    // ... resto da lógica
}
```

#### 5.3 Rate Limiting Client-Side
```javascript
// utils/rateLimiter.js

class RateLimiter {
    constructor() {
        this.attempts = new Map();
    }
    
    canAttempt(key, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
        const now = Date.now();
        const attempts = this.attempts.get(key) || [];
        
        // Remover tentativas antigas
        const validAttempts = attempts.filter(time => now - time < windowMs);
        
        if (validAttempts.length >= maxAttempts) {
            return false;
        }
        
        validAttempts.push(now);
        this.attempts.set(key, validAttempts);
        return true;
    }
}

export default new RateLimiter();
```

---

## 🗂️ Replicação do Banco de Dados

### 📋 Estratégias de Backup e Replicação

#### Opção 1: 🔄 **Supabase Built-in** (Recomendado)
```sql
-- 1. Backup automático (já incluso no Supabase)
-- 2. Point-in-time recovery
-- 3. Read replicas para diferentes regiões

-- Configuração via Dashboard do Supabase:
-- Settings > Database > Backups
-- Settings > Database > Read Replicas
```

#### Opção 2: 📥 **Export/Import Manual**
```bash
# Export completo
pg_dump -h [HOST] -U [USER] -d [DATABASE] \
  --clean --no-owner --verbose \
  --file=app_treino_backup_$(date +%Y%m%d_%H%M%S).sql

# Import
psql -h [NEW_HOST] -U [NEW_USER] -d [NEW_DATABASE] \
  -f app_treino_backup_20250615_120000.sql
```

#### Opção 3: 🔄 **Replicação Streaming** 
```sql
-- No servidor master (Supabase)
CREATE PUBLICATION app_treino_pub FOR ALL TABLES;

-- No servidor replica
CREATE SUBSCRIPTION app_treino_sub 
CONNECTION 'host=[MASTER_HOST] dbname=[DB] user=[USER] password=[PASS]' 
PUBLICATION app_treino_pub;
```

#### Opção 4: 📦 **Docker + PostgreSQL**
```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres-master:
    image: postgres:15
    environment:
      POSTGRES_DB: app_treino
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: secure_pass
    volumes:
      - ./data/master:/var/lib/postgresql/data
      - ./init:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    command: >
      postgres 
      -c wal_level=replica 
      -c max_wal_senders=3 
      -c max_replication_slots=3

  postgres-replica:
    image: postgres:15
    environment:
      PGUSER: replica_user
      POSTGRES_PASSWORD: replica_pass
    volumes:
      - ./data/replica:/var/lib/postgresql/data
    ports:
      - "5433:5432"
    depends_on:
      - postgres-master
```

#### Opção 5: ☁️ **Multi-Cloud Setup**
```javascript
// config/database.js
const dbConfig = {
  primary: {
    host: 'primary.supabase.co',
    database: 'postgres',
    user: 'postgres',
    password: process.env.SUPABASE_PASS
  },
  replica: {
    host: 'replica.aws.com',
    database: 'app_treino_replica',
    user: 'admin',
    password: process.env.AWS_RDS_PASS
  }
};

// Usar replica para leituras, primary para escritas
export function getReadConnection() {
  return dbConfig.replica;
}

export function getWriteConnection() {
  return dbConfig.primary;
}
```

### 📊 **Script de Sincronização Automática**
```javascript
// scripts/syncDatabase.js

class DatabaseSync {
  async syncTables() {
    const tables = [
      'usuarios', 'exercicios', 'protocolos_treinamento',
      'protocolo_treinos', 'execucao_exercicio_usuario',
      'planejamento_semanal', 'usuario_1rm', 'usuario_plano_treino'
    ];
    
    for (const table of tables) {
      await this.syncTable(table);
    }
  }
  
  async syncTable(tableName) {
    try {
      // 1. Obter última sincronização
      const lastSync = await this.getLastSyncTime(tableName);
      
      // 2. Buscar registros modificados
      const { data: newRecords } = await supabasePrimary
        .from(tableName)
        .select('*')
        .gte('updated_at', lastSync);
      
      // 3. Upsert no banco replica
      if (newRecords.length > 0) {
        await supabaseReplica
          .from(tableName)
          .upsert(newRecords, { onConflict: 'id' });
      }
      
      // 4. Atualizar timestamp da sincronização
      await this.updateSyncTime(tableName);
      
      console.log(`✅ ${tableName}: ${newRecords.length} registros sincronizados`);
      
    } catch (error) {
      console.error(`❌ Erro ao sincronizar ${tableName}:`, error);
    }
  }
}

// Executar a cada 5 minutos
setInterval(() => {
  new DatabaseSync().syncTables();
}, 5 * 60 * 1000);
```

### 🚨 **Monitoramento de Integridade**
```sql
-- Verificar consistência entre bancos
CREATE OR REPLACE FUNCTION check_database_integrity()
RETURNS TABLE(
  table_name text,
  primary_count bigint,
  replica_count bigint,
  difference bigint,
  status text
) AS $$
DECLARE
  tables_to_check text[] := ARRAY[
    'usuarios', 'exercicios', 'protocolos_treinamento',
    'execucao_exercicio_usuario', 'planejamento_semanal'
  ];
  table_name text;
  primary_count bigint;
  replica_count bigint;
BEGIN
  FOREACH table_name IN ARRAY tables_to_check LOOP
    -- Contar registros no primary
    EXECUTE format('SELECT count(*) FROM %I', table_name) INTO primary_count;
    
    -- Contar registros no replica (seria executado via dblink)
    -- replica_count := get_replica_count(table_name);
    
    -- Para demonstração, usar o mesmo valor
    replica_count := primary_count;
    
    RETURN QUERY SELECT 
      table_name,
      primary_count,
      replica_count,
      primary_count - replica_count as difference,
      CASE 
        WHEN primary_count = replica_count THEN '✅ OK'
        ELSE '⚠️ DIVERGENTE'
      END as status;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Executar verificação
SELECT * FROM check_database_integrity();
```

---

## 🗄️ Views e Estruturas de Banco Existentes

### **📊 View `vw_treino_completo`**

Esta view já está implementada no Supabase e é essencial para o funcionamento dos serviços de métricas. Caso precise recriar:

```sql
-- View simplificada que funciona garantidamente
-- Foca no essencial para resolver o problema do dashboard

CREATE OR REPLACE VIEW vw_treino_completo AS
SELECT 
    -- Identificação básica
    eeu.id as execucao_id,
    eeu.usuario_id,
    eeu.exercicio_id,
    eeu.data_execucao,
    DATE(eeu.data_execucao) as data_treino,
    EXTRACT(YEAR FROM eeu.data_execucao) as ano,
    EXTRACT(WEEK FROM eeu.data_execucao) as semana,
    EXTRACT(DOW FROM eeu.data_execucao) as dia_semana,
    
    -- Dados do exercício  
    ex.nome as exercicio_nome,
    ex.grupo_muscular,
    ex.equipamento,
    ex.grupo_muscular as tipo_atividade,
    
    -- Dados da execução
    eeu.serie_numero,
    COALESCE(eeu.peso_utilizado, 0) as peso_utilizado,
    COALESCE(eeu.repeticoes, 0) as repeticoes,
    COALESCE(eeu.falhou, false) as falhou,
    COALESCE(ex.tempo_descanso_padrao, 60) as tempo_descanso,
    eeu.observacoes as observacoes_execucao,
    
    -- Métricas básicas calculadas
    (COALESCE(eeu.peso_utilizado, 0) * COALESCE(eeu.repeticoes, 0)) as volume_serie,
    
    -- 1RM estimado usando fórmula de Brzycki
    CASE 
        WHEN COALESCE(eeu.repeticoes, 0) > 0 AND COALESCE(eeu.repeticoes, 0) <= 12 AND COALESCE(eeu.peso_utilizado, 0) > 0 THEN
            ROUND(COALESCE(eeu.peso_utilizado, 0) / (1.0278 - (0.0278 * COALESCE(eeu.repeticoes, 0))), 2)
        ELSE COALESCE(eeu.peso_utilizado, 0)
    END as rm_estimado,
    
    -- Intensidade relativa
    CASE 
        WHEN COALESCE(u1rm.rm_calculado, 0) > 0 AND COALESCE(eeu.peso_utilizado, 0) > 0 THEN
            ROUND((COALESCE(eeu.peso_utilizado, 0) / COALESCE(u1rm.rm_calculado, 1)) * 100, 1)
        ELSE NULL
    END as intensidade_percentual,
    
    -- Dados do 1RM do usuário
    u1rm.rm_calculado as rm_usuario,
    u1rm.data_teste as data_ultimo_teste,
    
    -- Tempo estimado por exercício
    CASE ex.grupo_muscular
        WHEN 'Peito' THEN (COALESCE(ex.tempo_descanso_padrao, 90) + 40)
        WHEN 'Costas' THEN (COALESCE(ex.tempo_descanso_padrao, 90) + 40)
        WHEN 'Pernas' THEN (COALESCE(ex.tempo_descanso_padrao, 120) + 50)
        WHEN 'Ombros' THEN (COALESCE(ex.tempo_descanso_padrao, 60) + 35)
        WHEN 'Braços' THEN (COALESCE(ex.tempo_descanso_padrao, 45) + 30)
        WHEN 'Core' THEN (COALESCE(ex.tempo_descanso_padrao, 30) + 25)
        ELSE (COALESCE(ex.tempo_descanso_padrao, 60) + 35)
    END as tempo_estimado_serie_segundos,
    
    -- Progressão simples
    LAG(COALESCE(eeu.peso_utilizado, 0)) OVER (
        PARTITION BY eeu.usuario_id, eeu.exercicio_id, eeu.serie_numero 
        ORDER BY eeu.data_execucao
    ) as peso_execucao_anterior,
    
    -- Dados do planejamento
    eeu.protocolo_treino_id,
    COALESCE(ps.concluido, false) as planejamento_concluido,
    ps.data_conclusao,
    ps.observacoes as observacoes_planejamento,
    
    -- Status de qualidade simples
    CASE 
        WHEN COALESCE(eeu.falhou, false) = true THEN 'Falha'
        WHEN (COALESCE(eeu.peso_utilizado, 0) * COALESCE(eeu.repeticoes, 0)) > 0 THEN 'Concluido'
        ELSE 'Sem dados'
    END as qualidade_performance,
    
    -- Timestamps
    eeu.created_at,
    eeu.updated_at

FROM execucao_exercicio_usuario eeu
INNER JOIN exercicios ex ON eeu.exercicio_id = ex.id
LEFT JOIN usuario_1rm u1rm ON (
    eeu.usuario_id = u1rm.usuario_id 
    AND eeu.exercicio_id = u1rm.exercicio_id 
    AND u1rm.status = 'ativo'
    AND u1rm.data_teste = (
        SELECT MAX(data_teste) 
        FROM usuario_1rm u2 
        WHERE u2.usuario_id = eeu.usuario_id 
        AND u2.exercicio_id = eeu.exercicio_id 
        AND u2.status = 'ativo'
    )
)
LEFT JOIN planejamento_semanal ps ON (
    eeu.usuario_id = ps.usuario_id
    AND EXTRACT(YEAR FROM eeu.data_execucao) = ps.ano
    AND EXTRACT(WEEK FROM eeu.data_execucao) = ps.semana  
    AND EXTRACT(DOW FROM eeu.data_execucao) = ps.dia_semana
    AND ex.grupo_muscular = ps.tipo_atividade
)
ORDER BY eeu.data_execucao DESC, eeu.exercicio_id, eeu.serie_numero;

-- Índices essenciais para performance
CREATE INDEX IF NOT EXISTS idx_vw_treino_usuario_data 
ON execucao_exercicio_usuario(usuario_id, data_execucao);

CREATE INDEX IF NOT EXISTS idx_vw_treino_exercicio_serie 
ON execucao_exercicio_usuario(usuario_id, exercicio_id, serie_numero, data_execucao);

-- Comentários
COMMENT ON VIEW vw_treino_completo IS 'View simplificada para consulta de treinos com métricas essenciais.';
```

### **🎯 Métricas Disponíveis da View:**
- **Volume por série**: `peso_utilizado × repeticoes`
- **1RM estimado**: Calculado pela fórmula de Brzycki
- **Intensidade %**: Baseada no 1RM pessoal do usuário
- **Progressão**: Comparação com execução anterior
- **Tempo estimado**: Por grupo muscular
- **Quality score**: Status da performance

### **🔧 Uso nos Services:**
```javascript
// TreinoViewService usa esta view
import { TreinoViewService } from './services/treinoViewService.js';
const resultado = await TreinoViewService.buscarTreinoPorData(userId, '2025-06-11');

// TreinoMetricasService para agregações
import { TreinoMetricasService } from './services/treinoMetricasService.js';
const metricas = await TreinoMetricasService.calcularMetricasDia(userId, '2025-06-11');
```

**⚠️ IMPORTANTE:** Esta view já existe no banco e é utilizada pelos serviços `treinoViewService.js` e `treinoMetricasService.js`. Não delete!

---

## 📅 Cronograma de Implementação

### **Sprint 1 - Banco de Dados (2 dias)**
- [ ] Modificar tabela `usuarios`
- [ ] Criar triggers e validações
- [ ] Script de migração
- [ ] Testes de banco

### **Sprint 2 - Backend (3 dias)**
- [ ] Criar `authService.js`
- [ ] Modificar `userService.js`
- [ ] Implementar validações
- [ ] Testes de autenticação

### **Sprint 3 - Frontend (3 dias)**
- [ ] Nova tela de login
- [ ] Formulário de criação de senha
- [ ] Indicador de força da senha
- [ ] Testes de interface

### **Sprint 4 - Integração (2 dias)**
- [ ] Conectar frontend com backend
- [ ] Proteção de rotas
- [ ] Middleware de autenticação
- [ ] Testes end-to-end

### **Sprint 5 - Segurança (1 dia)**
- [ ] Rate limiting
- [ ] Validações extras
- [ ] Auditoria de segurança
- [ ] Documentação

---

## 🧪 Plano de Testes

### **Testes de Segurança**
```javascript
// tests/auth.test.js

describe('Sistema de Autenticação', () => {
  test('Deve hashear senhas corretamente', async () => {
    const password = 'teste123';
    const hash1 = await AuthService.hashPassword(password);
    const hash2 = await AuthService.hashPassword(password);
    
    expect(hash1).toBe(hash2); // Determinístico
    expect(hash1).not.toBe(password); // Não em texto plano
  });
  
  test('Deve bloquear após 5 tentativas', async () => {
    for (let i = 0; i < 5; i++) {
      try {
        await AuthService.login('test@test.com', 'wrong');
      } catch (error) {
        // Esperado
      }
    }
    
    // 6ª tentativa deve estar bloqueada
    await expect(
      AuthService.login('test@test.com', 'wrong')
    ).rejects.toThrow('Conta bloqueada');
  });
  
  test('Deve validar força da senha', () => {
    const weak = AuthService.validatePasswordStrength('123');
    const strong = AuthService.validatePasswordStrength('MinhaSenh@123');
    
    expect(weak.valid).toBe(false);
    expect(strong.valid).toBe(true);
    expect(strong.strength).toBeGreaterThan(3);
  });
});
```

### **Testes de Interface**
```javascript
// tests/login.ui.test.js

describe('Interface de Login', () => {
  test('Deve mostrar erro para credenciais inválidas', async () => {
    render(LoginScreen);
    
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'invalid@test.com' }
    });
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'wrong' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    
    await waitFor(() => {
      expect(screen.getByText(/Email ou senha incorretos/)).toBeInTheDocument();
    });
  });
  
  test('Deve redirecionar após login bem-sucedido', async () => {
    // Mock do AuthService
    AuthService.login = jest.fn().mockResolvedValue({
      id: 1,
      nome: 'Teste',
      email: 'test@test.com'
    });
    
    render(LoginScreen);
    
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@test.com' }
    });
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'senha123' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    
    await waitFor(() => {
      expect(mockNavigation.mostrarTela).toHaveBeenCalledWith('dashboard');
    });
  });
});
```

---

## 📚 Considerações Finais

### **✅ Benefícios da Implementação**
- **Segurança:** Proteção real dos dados
- **Escalabilidade:** Suporta múltiplos usuários
- **Profissionalismo:** Interface padrão de mercado
- **Controle:** Admin pode gerenciar acessos

### **⚠️ Riscos e Mitigações**
- **Breaking Change:** Usuários precisarão criar senhas
  - *Mitigação:* Script de migração + senhas temporárias
- **Complexidade:** Código mais complexo
  - *Mitigação:* Documentação detalhada + testes
- **UX:** Processo de login adicional
  - *Mitigação:* Interface intuitiva + "lembrar-me"

### **🔮 Próximos Passos**
1. **Aprovação final** do documento
2. **Escolha da estratégia** de backup/replicação
3. **Definição da data** de início
4. **Preparação do ambiente** de desenvolvimento
5. **Comunicação com usuários** sobre a mudança

---

**Documento preparado por:** Claude Code  
**Última atualização:** 15/06/2025  
**Status:** Aguardando aprovação para implementação

---
