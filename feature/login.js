// js/features/login.js - VERSÃO CORRIGIDA
// Lógica da tela de login e seleção de usuário

import AppState from '../state/appState.js';
import { fetchUsuarios, fetchProtocoloAtivoUsuario } from '../services/userService.js';
import { fetchProximoTreino } from '../services/workoutService.js';
import { needsWeekPlanning, getWeekPlan } from '../utils/weekPlanStorage.js';
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
        console.error('[renderizarUsuarios] Container users-grid não encontrado, tentando novamente...');
        // Tentar novamente após um delay maior
        setTimeout(() => {
            console.log('[renderizarUsuarios] Tentativa adicional...');
            renderizarUsuarios(usuarios);
        }, 1000);
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
        
        // Navegar para home
        if (window.renderTemplate) {
            console.log('[selecionarUsuario] Usando renderTemplate para ir para home');
            window.renderTemplate('home');
        } else {
            console.log('[selecionarUsuario] Usando mostrarTela para ir para home-screen');
            mostrarTela('home-screen');
        }
        
        // Carregar dashboard após navegação
        setTimeout(async () => {
            console.log('[selecionarUsuario] Carregando dashboard...');
            try {
                if (window.carregarDashboard) {
                    await window.carregarDashboard();
                    console.log('[selecionarUsuario] ✅ Dashboard carregado com sucesso');
                } else {
                    console.warn('[selecionarUsuario] window.carregarDashboard não disponível');
                }
            } catch (dashboardError) {
                console.error('[selecionarUsuario] Erro no dashboard:', dashboardError);
            }
        }, 300);
        
        console.log('[selecionarUsuario] ===== SELEÇÃO CONCLUÍDA =====');
        
    } catch (error) {
        console.error('[selecionarUsuario] Erro crítico:', error);
        showNotification('Erro grave ao selecionar usuário. Tente recarregar.', 'error');
    }
}

// Mostrar tela de planejamento semanal
function mostrarModalPlanejamento(usuarioId) {
    console.log('[mostrarModalPlanejamento] Iniciando para usuário:', usuarioId);
    // Corrigir para navegar para a página de planejamento semanal
    if (window.mostrarTela) {
        // O mapeamento correto é 'planejamentoSemanal' → 'planejamentoSemanalPage', conforme navigation.js
        window.mostrarTela('planejamentoSemanal'); // usuarioId já está no AppState
    } else {
        console.error('Função window.mostrarTela não encontrada.');
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