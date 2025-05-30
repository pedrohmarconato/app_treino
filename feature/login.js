// js/features/login.js
// Lógica da tela de login e seleção de usuário

import AppState from '../state/appState.js';
import { fetchUsuarios, fetchProtocoloAtivoUsuario } from '../services/userService.js';
import { fetchProximoTreino } from '../services/workoutService.js';
import { needsWeekPlanning, getWeekPlan } from '../utils/weekPlanStorage.js';
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

// Resto do código permanece igual...




// Selecionar usuário e fazer login
export async function selecionarUsuario(usuario) {
    showLoading();
    
    try {
        // Salvar usuário no estado
        AppState.set('currentUser', usuario);
        
        // Adicionar botão de ordem da semana
        adicionarBotaoOrdemSemana();
        
        // Carregar protocolo ativo
        const protocolo = await fetchProtocoloAtivoUsuario(usuario.id);
        
        if (!protocolo) {
            showNotification('Erro ao carregar protocolo do usuário', 'error');
            hideLoading();
            return;
        }
        
        AppState.set('currentProtocol', protocolo);
        
        // Verificar se precisa de planejamento semanal
        if (needsWeekPlanning(usuario.id)) {
            hideLoading();
            mostrarModalPlanejamento(usuario.id);
            return;
        }
        
        // Carregar plano semanal
        const weekPlan = getWeekPlan(usuario.id);
        AppState.set('weekPlan', weekPlan);
        
        // Carregar próximo treino
        const proximoTreino = await fetchProximoTreino(
            usuario.id,
            protocolo.protocolo_treinamento_id,
            protocolo.semana_atual
        );
        
        AppState.set('currentWorkout', proximoTreino);
        
        // Carregar dashboard
        await carregarDashboard();
        
        // Navegar para home
        mostrarTela('home-screen');
        
    } catch (error) {
        console.error('Erro ao selecionar usuário:', error);
        showNotification('Erro ao carregar dados do usuário', 'error');
    } finally {
        hideLoading();
    }
}

// Mostrar modal de planejamento semanal
function mostrarModalPlanejamento(usuarioId) {
    console.log('[mostrarModalPlanejamento] Iniciando para usuário:', usuarioId);
    
    // Verificar se o modal existe
    let modal = document.getElementById('modalPlanejamento');
    if (!modal && window.modalPlanejamentoTemplate) {
        // Criar modal usando template
        const modalHTML = window.modalPlanejamentoTemplate();
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        modal = document.getElementById('modalPlanejamento');
    }
    
    if (modal) {
        modal.style.display = 'block';
        // Inicializar o planejamento
        if (window.inicializarPlanejamento) {
            window.inicializarPlanejamento(usuarioId);
        }
    } else {
        console.error('Modal de planejamento não encontrado');
        showNotification('Erro ao abrir planejamento semanal', 'error');
    }
}

// Exportar para uso global
window.selecionarUsuario = selecionarUsuario;