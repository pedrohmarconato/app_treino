import LoginModal from '../components/LoginModal.js';
import { fetchUser } from '../services/userService.js';
import { inicializarHome } from '../services/homeService.js';
import AppState from '../state/appState.js';

/**
 * 🔐 Ponto de Entrada para Autenticação
 * 
 * Esta função gerencia todo o fluxo de login, exibindo o modal de login
 * e tratando o resultado (sucesso ou cancelamento).
 */
async function showLoginFlow() {
    console.log('[LoginFlow] 🚀 Iniciando fluxo de login...');
    const loginModal = new LoginModal();

    try {
        const result = await loginModal.show();

        if (result && result.user) {
            console.log('[LoginFlow] ✅ Login bem-sucedido', result.user);
            await handleLoginSuccess(result.user);
        } else {
            console.log('[LoginFlow] 🛑 Fluxo de login cancelado ou fechado.');
        }
    } catch (error) {
        console.error('[LoginFlow] ❌ Erro no fluxo de login:', error);
    }
}

/**
 * 🚀 Manipulador de Sucesso de Login
 * 
 * Após o login, busca os dados completos do usuário e inicializa a tela principal.
 */
async function handleLoginSuccess(user) {
    try {
        const usuarioCompleto = await fetchUser(user.id);
        if (!usuarioCompleto) {
            throw new Error('Não foi possível carregar os dados do usuário.');
        }

        AppState.set('currentUser', usuarioCompleto);
        console.log('[LoginFlow] 👤 Usuário completo carregado e salvo no estado:', usuarioCompleto);

        // Navega para a tela principal
        await inicializarHome();

    } catch (error) {
        console.error('[LoginFlow] ❌ Erro ao processar o pós-login:', error);
    }
}

/**
 * 🎬 Função de Inicialização
 * 
 * Ponto de partida para a tela de login, que agora simplesmente
 * invoca o fluxo de login principal.
 */
export function initLoginScreen() {
    console.log('[initLoginScreen] 🎬 Disparando o fluxo de login...');
    showLoginFlow();
}

// Disponibiliza a função globalmente para ser chamada pelo `init.js` ou `app.js`
window.initLoginScreen = initLoginScreen;
