// js/features/login.js - VERSÃO CORRIGIDA
// Lógica da tela de login e seleção de usuário

import AppState from '../state/appState.js';
import { fetchUsuarios, fetchProtocoloAtivoUsuario } from '../services/userService.js';
import { fetchProximoTreino } from '../services/workoutService.js';
import WeeklyPlanService from '../services/weeklyPlanningService.js';
import { needsWeekPlanningAsync } from './planning.js';
import { showLoading, hideLoading, showNotification } from '../ui/notifications.js';
import { mostrarTela, adicionarBotaoOrdemSemana } from '../ui/navigation.js';
import { carregarDashboard } from './dashboard.js';

// Inicializar tela de login
export async function initLoginScreen() {
    console.log('[initLoginScreen] Iniciando...');
    try {
        const usuarios = await fetchUsuarios();
        console.log('[initLoginScreen] Usuários carregados:', usuarios);
        AppState.set('users', usuarios);
        // AGUARDAR mais tempo para garantir que o template foi renderizado
        setTimeout(() => {
            console.log('[initLoginScreen] Tentando renderizar usuários...');
            renderizarUsuarios(usuarios);
        }, 500);
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        showNotification('Erro ao carregar usuários', 'error');
    }
}

// Renderizar usuários na tela
function renderizarUsuarios(usuarios) {
    console.log('[renderizarUsuarios] Buscando container...');
    const container = document.getElementById('users-grid');
    
    if (!container) {
        console.warn('[renderizarUsuarios] Container users-grid não encontrado.');
        
        // Verificar se estamos na tela de login antes de tentar novamente
        const loginScreen = document.getElementById('login-screen');
        const currentScreen = document.querySelector('.screen.active');
        
        if (!loginScreen || (currentScreen && currentScreen.id !== 'login-screen')) {
            console.log('[renderizarUsuarios] Não estamos na tela de login, abortando renderização');
            return;
        }
        
        // Tentar novamente apenas se estivermos na tela de login e for a primeira tentativa
        if (!renderizarUsuarios._tentativas) {
            renderizarUsuarios._tentativas = 1;
            setTimeout(() => {
                console.log('[renderizarUsuarios] Tentativa adicional...');
                renderizarUsuarios(usuarios);
            }, 1000);
        } else {
            console.log('[renderizarUsuarios] Máximo de tentativas atingido, abortando');
            renderizarUsuarios._tentativas = 0;
        }
        return;
    }
    
    console.log('[renderizarUsuarios] Container encontrado, renderizando', usuarios.length, 'usuários');
    
    container.innerHTML = '';
    
    if (usuarios.length === 0) {
        console.warn('[renderizarUsuarios] Nenhum usuário para renderizar');
        container.innerHTML = '<p>Nenhum usuário encontrado</p>';
        return;
    }
    
    usuarios.forEach((user, index) => {
        console.log(`[renderizarUsuarios] Renderizando usuário ${index + 1}:`, user.nome);
        
        const userImages = {
            'Pedro': 'pedro.png',
            'Japa': 'japa.png'
        };
        
        const card = document.createElement('div');
        card.className = 'user-card';
        card.innerHTML = `
            <div class="user-avatar">
                <img src="${userImages[user.nome] || 'pedro.png'}" 
                     alt="${user.nome}"
                     onerror="console.error('Erro ao carregar imagem:', this.src)">
            </div>
            <h3>${user.nome}</h3>
            <p>Atleta Premium</p>
        `;
        
        card.addEventListener('click', () => {
            console.log('[renderizarUsuarios] Usuário selecionado:', user.nome);
            selecionarUsuario(user);
        });
        
        container.appendChild(card);
    });
    
    console.log('[renderizarUsuarios] Renderização concluída');
}

// CORREÇÃO PRINCIPAL: Selecionar usuário e navegar SEMPRE para HOME
export async function selecionarUsuario(usuario) {
    try {
        console.log('[selecionarUsuario] ===== SELEÇÃO DE USUÁRIO =====');
        console.log('[selecionarUsuario] Usuário selecionado:', usuario.nome);
        
        // 1. Salvar usuário no estado
        AppState.set('currentUser', usuario);
        console.log('[selecionarUsuario] Usuário definido no AppState:', usuario.nome);

        // 2. Verificar se precisa de planejamento semanal (SUPABASE + localStorage)
        const precisaPlanejamento = await needsWeekPlanningAsync(usuario.id);
        console.log('[selecionarUsuario] Precisa de planejamento?', precisaPlanejamento);
        
        if (precisaPlanejamento) {
            console.log('[selecionarUsuario] ➡️ REDIRECIONANDO para planejamento semanal');
            mostrarModalPlanejamento(usuario.id);
            return;
        }
        
        // 3. CORREÇÃO: SEMPRE ir para home, nunca para OrderWeekPage
        console.log('[selecionarUsuario] ➡️ REDIRECIONANDO para HOME (planejamento já existe)');
        
        // Debug: verificar se renderTemplate está disponível
        console.log('[selecionarUsuario] Verificando renderTemplate:', !!window.renderTemplate);
        console.log('[selecionarUsuario] Funções window disponíveis:', Object.keys(window).filter(k => k.includes('render')));
        
        // Navegar para home usando renderTemplate
        if (window.renderTemplate) {
            console.log('[selecionarUsuario] ✅ Usando renderTemplate para ir para home');
            try {
                window.renderTemplate('home');
                console.log('[selecionarUsuario] ✅ renderTemplate("home") executado com sucesso');
            } catch (error) {
                console.error('[selecionarUsuario] ❌ Erro ao executar renderTemplate:', error);
                console.log('[selecionarUsuario] Fallback: usando mostrarTela');
                mostrarTela('home-screen');
            }
        } else {
            console.error('[selecionarUsuario] ❌ renderTemplate não disponível! Usando fallback');
            mostrarTela('home-screen');
        }
        
        console.log('[selecionarUsuario] ===== SELEÇÃO CONCLUÍDA =====');
        
    } catch (error) {
        console.error('[selecionarUsuario] Erro crítico:', error);
        showNotification('Erro grave ao selecionar usuário. Tente recarregar.', 'error');
    }
}

// Mostrar tela de planejamento semanal
function mostrarModalPlanejamento(usuarioId) {
    console.log('[mostrarModalPlanejamento] 📅 Iniciando para usuário:', usuarioId);
    
    // Debug: verificar renderTemplate
    console.log('[mostrarModalPlanejamento] Verificando renderTemplate:', !!window.renderTemplate);
    
    if (window.renderTemplate) {
        console.log('[mostrarModalPlanejamento] ✅ Usando renderTemplate para planejamento');
        try {
            window.renderTemplate('planejamentoSemanalPage');
            console.log('[mostrarModalPlanejamento] ✅ Navegação para planejamento executada');
        } catch (error) {
            console.error('[mostrarModalPlanejamento] ❌ Erro ao navegar:', error);
            if (window.mostrarTela) {
                window.mostrarTela('planejamentoSemanal');
            }
        }
    } else if (window.mostrarTela) {
        console.log('[mostrarModalPlanejamento] Usando mostrarTela como fallback');
        window.mostrarTela('planejamentoSemanal');
    } else {
        console.error('[mostrarModalPlanejamento] ❌ Nenhum método de navegação disponível');
        showNotification('Erro ao tentar abrir o planejamento semanal.', 'error');
    }
}

// Exportar para uso global
window.selecionarUsuario = selecionarUsuario;

// Função para abrir o planejamento semanal para o usuário atual (usado pela home page)
function abrirPlanejamentoParaUsuarioAtual() {
    console.log('[abrirPlanejamentoParaUsuarioAtual] Tentando abrir planejamento para usuário atual.');
    const currentUser = AppState.get('currentUser');
    if (currentUser && currentUser.id) {
        mostrarModalPlanejamento(currentUser.id);
    } else {
        console.error('[abrirPlanejamentoParaUsuarioAtual] Nenhum usuário atual encontrado no AppState.');
        showNotification('Faça login para acessar o planejamento.', 'error');
    }
}
window.abrirPlanejamentoParaUsuarioAtual = abrirPlanejamentoParaUsuarioAtual;