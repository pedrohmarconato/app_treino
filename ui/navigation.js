// js/ui/navigation.js
// Sistema de navegação e controle de telas

import AppState from '../state/appState.js';

// Mapeamento de telas para templates
const screenTemplateMap = {
    'login-screen': 'login',
    'home-screen': 'home',
    'workout-screen': 'workout'
};

// Mostrar tela específica
export function mostrarTela(telaId) {
    // Se estiver usando o sistema de templates
    if (window.renderTemplate) {
        const templateName = screenTemplateMap[telaId];
        if (templateName) {
            window.renderTemplate(templateName);
            
            // Executar callbacks pós-renderização
            setTimeout(() => {
                onScreenRendered(telaId);
            }, 100);
        }
    } else {
        // Fallback para sistema antigo
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        const screen = document.getElementById(telaId);
        if (screen) {
            screen.classList.add('active');
            onScreenRendered(telaId);
        }
    }
}

// Callback executado após renderizar uma tela
function onScreenRendered(telaId) {
    switch(telaId) {
        case 'login-screen':
            // Re-renderizar usuários se houver
            const users = AppState.get('users');
            if (users && users.length > 0) {
                renderUsuarios(users);
            }
            break;
            
        case 'home-screen':
            // Atualizar informações do usuário
            const currentUser = AppState.get('currentUser');
            if (currentUser) {
                updateUserInfo(currentUser);
            }
            break;
            
        case 'workout-screen':
            // Preparar tela de treino
            prepareWorkoutScreen();
            break;
    }
}

// Atualizar informações do usuário na UI
function updateUserInfo(user) {
    const userNameEl = document.getElementById('user-name');
    if (userNameEl) {
        userNameEl.textContent = user.nome;
    }
    
    const userImages = {
        'Pedro': 'pedro.png',
        'Japa': 'japa.png'
    };
    
    const avatarEl = document.getElementById('user-avatar');
    if (avatarEl) {
        avatarEl.src = userImages[user.nome] || 'pedro.png';
    }
}

// Preparar tela de treino
function prepareWorkoutScreen() {
    const workout = AppState.get('currentWorkout');
    if (workout) {
        const workoutTitle = document.getElementById('workout-title');
        if (workoutTitle) {
            const tipoTreino = obterTipoTreino(workout.dia_semana);
            workoutTitle.textContent = `Treino ${tipoTreino}`;
        }
    }
}

// Renderizar lista de usuários
function renderUsuarios(usuarios) {
    const container = document.getElementById('users-grid');
    if (!container) return;
    
    container.innerHTML = '';
    
    usuarios.forEach(user => {
        const userImages = {
            'Pedro': 'pedro.png',
            'Japa': 'japa.png'
        };
        
        const card = document.createElement('div');
        card.className = 'user-card';
        card.innerHTML = `
            <div class="user-avatar">
                <img src="${userImages[user.nome] || 'pedro.png'}" 
                     alt="${user.nome}">
            </div>
            <h3>${user.nome}</h3>
            <p>Atleta Premium</p>
        `;
        
        card.addEventListener('click', () => {
            // Importar função de seleção do módulo de login
            if (window.selecionarUsuario) {
                window.selecionarUsuario(user);
            }
        });
        
        container.appendChild(card);
    });
}

// Navegar para tela anterior
export function voltarParaHome() {
    mostrarTela('home-screen');
}

// Fazer logout
export function logout() {
    AppState.reset();
    mostrarTela('login-screen');
}

// Obter tipo de treino baseado no dia da semana
function obterTipoTreino(diaSemana) {
    const tipos = { 1: 'A', 2: 'B', 3: 'C', 4: 'D' };
    return tipos[diaSemana] || 'A';
}

// Verificar se pode navegar (útil para prevenir navegação durante treino)
export function canNavigate() {
    const isWorkoutActive = AppState.get('isWorkoutActive');
    
    if (isWorkoutActive) {
        return confirm('Você tem um treino em andamento. Deseja realmente sair?');
    }
    
    return true;
}

// Adicionar botão de ordem da semana após login
export function adicionarBotaoOrdemSemana() {
    let bar = document.querySelector('.bottom-nav, .bottom-bar, .bottomnavigator, #bottom-nav');
    
    if (!bar) {
        bar = document.createElement('div');
        bar.className = 'bottom-nav';
        bar.innerHTML = '<div class="nav-items"></div>';
        document.body.appendChild(bar);
    }
    
    const navItems = bar.querySelector('.nav-items') || bar;
    
    if (!navItems.querySelector('#order-week-btn')) {
        const btn = document.createElement('button');
        btn.id = 'order-week-btn';
        btn.className = 'nav-item';
        btn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"/>
            </svg>
            <span>Ordem</span>
        `;
        btn.onclick = () => {
            if (window.renderTemplate) {
                window.renderTemplate('orderWeek');
            }
        };
        navItems.appendChild(btn);
    }
}