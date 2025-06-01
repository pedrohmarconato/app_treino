// js/features/login.js
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

// Resto do código permanece igual...




// Selecionar usuário e navegar para a home ou planejamento (SUPER SIMPLIFICADO)
export async function selecionarUsuario(usuario) {
    try {
        // 1. Salvar usuário no estado
        AppState.set('currentUser', usuario);
        console.log('[selecionarUsuario] Usuário definido no AppState:', usuario.nome);

        // 2. Verificar se precisa de planejamento semanal (SUPABASE + localStorage)
        if (await needsWeekPlanningAsync(usuario.id)) {
            console.log('[selecionarUsuario] Necessário planejamento semanal para:', usuario.nome);
            mostrarModalPlanejamento(usuario.id); // Modal de planejamento cuidará do próximo passo
            return; // Encerra aqui, o fluxo continua após o planejamento
        }
        
        // 3. Se não precisa de planejamento, ir para a OrderWeekPage (dados carregam lá)
        console.log('[selecionarUsuario] Planejamento semanal não necessário. Navegando para OrderWeekPage para:', usuario.nome);
        if (window.renderTemplate) {
            window.renderTemplate('orderWeek');
        } else {
            console.error('[selecionarUsuario] window.renderTemplate não está definido. Não é possível navegar para OrderWeekPage. Verifique se o sistema de templates está carregado.');
            // Fallback: ir para home-screen se renderTemplate não estiver disponível
            showNotification('Erro ao tentar abrir a página de ordem semanal. Exibindo dashboard.', 'warning');
            mostrarTela('home-screen');
        }
        
    } catch (error) {
        console.error('Erro crítico ao selecionar usuário:', error);
        // Idealmente, showNotification ainda funcionaria, mas como estamos removendo show/hideLoading daqui,
        // a UI de notificação precisa ser robusta ou gerenciada de forma diferente em erros críticos como este.
        showNotification('Erro grave ao selecionar usuário. Tente recarregar.', 'error');
    }
    // Não há mais hideLoading() aqui, pois showLoading() foi removido.
    // A tela de login deve desaparecer ao navegar para 'home-screen' ou ao modal ser exibido.
}

// Mostrar tela de planejamento semanal
function mostrarModalPlanejamento(usuarioId) {
    console.log('[mostrarModalPlanejamento -> mostrarTelaPlanejamentoSemanal] Iniciando para usuário:', usuarioId);
    
    // Usar o sistema de navegação para mostrar a tela de planejamento
    // O ID do usuário será passado para a função de inicialização através do onScreenRendered ou similar
    if (window.mostrarTela) {
        window.mostrarTela('planejamentoSemanal', { usuarioId: usuarioId }); 
        // A passagem de usuarioId como segundo argumento para mostrarTela
        // dependerá da implementação de mostrarTela e onScreenRendered.
        // Se onScreenRendered não aceitar parâmetros, precisaremos de um estado global ou outra forma de passar o usuarioId.
    } else {
        console.error('Função window.mostrarTela não encontrada.');
        showNotification('Erro ao tentar abrir o planejamento semanal.', 'error');
    }
    
    // A inicialização do planejamento (window.inicializarPlanejamento(usuarioId))
    // deverá ser chamada após a tela ser renderizada, 
    // idealmente dentro de um callback como onScreenRendered('planejamentoSemanal', { usuarioId }).
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
        // Opcionalmente, redirecionar para a tela de login se nenhum usuário estiver logado
        // window.mostrarTela('login-screen'); 
    }
}
window.abrirPlanejamentoParaUsuarioAtual = abrirPlanejamentoParaUsuarioAtual;