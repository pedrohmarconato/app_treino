// Teste e debug para função de logout
console.log('[test-logout.js] 🧪 Arquivo de teste do logout carregado');

// Função para testar logout
window.testarLogout = () => {
    console.log('🧪 ==> TESTANDO FUNÇÃO DE LOGOUT <==');
    
    // Verificar se função existe
    const temLogout = typeof window.logout === 'function';
    console.log('✅ Função logout disponível:', temLogout);
    
    if (!temLogout) {
        console.error('❌ Função logout não encontrada!');
        return false;
    }
    
    // Verificar se mostrarTela existe
    const temMostrarTela = typeof mostrarTela === 'function';
    console.log('✅ Função mostrarTela disponível:', temMostrarTela);
    
    // Verificar se renderTemplate existe
    const temRenderTemplate = typeof window.renderTemplate === 'function';
    console.log('✅ Função renderTemplate disponível:', temRenderTemplate);
    
    // Verificar AppState
    const temAppState = typeof AppState !== 'undefined' && AppState.reset;
    console.log('✅ AppState disponível:', temAppState);
    
    console.log('📋 Para testar logout:');
    console.log('1. window.logout() - Executar logout programaticamente');
    console.log('2. Clicar no botão de logout no cabeçalho (ícone de sair)');
    console.log('3. window.testarLogoutCompleto() - Teste com simulação');
    
    return {
        logout: temLogout,
        mostrarTela: temMostrarTela,
        renderTemplate: temRenderTemplate,
        appState: temAppState
    };
};

// Função para teste completo simulado
window.testarLogoutCompleto = () => {
    console.log('🚀 ==> TESTE COMPLETO DE LOGOUT <==');
    
    try {
        console.log('⚠️  ATENÇÃO: Este teste IRÁ executar logout real!');
        console.log('⏳ Executando logout em 3 segundos...');
        
        let countdown = 3;
        const interval = setInterval(() => {
            console.log(`⏰ ${countdown}...`);
            countdown--;
            
            if (countdown === 0) {
                clearInterval(interval);
                console.log('🚪 Executando logout AGORA!');
                
                // Executar logout
                if (typeof window.logout === 'function') {
                    window.logout();
                } else {
                    console.error('❌ Função logout não disponível');
                }
            }
        }, 1000);
        
        return true;
        
    } catch (error) {
        console.error('❌ Erro no teste de logout:', error);
        return false;
    }
};

// Função para debug do estado atual
window.debugEstadoApp = () => {
    console.log('🔍 ==> DEBUG ESTADO DA APLICAÇÃO <==');
    
    // Verificar tela atual
    const telaAtual = document.querySelector('.screen.active');
    console.log('📱 Tela atual:', telaAtual ? telaAtual.id : 'Nenhuma');
    
    // Verificar AppState
    if (typeof AppState !== 'undefined') {
        console.log('📊 AppState atual:', AppState.getAll ? AppState.getAll() : 'Sem método getAll');
    }
    
    // Verificar localStorage
    const localStorageKeys = Object.keys(localStorage).filter(key => 
        key.includes('workout') || key.includes('treino') || key.includes('exercise')
    );
    console.log('💾 Chaves localStorage relacionadas:', localStorageKeys);
    
    // Verificar timers ativos (se disponível)
    if (window.timerManager) {
        console.log('⏰ TimerManager disponível:', !!window.timerManager);
    }
    
    return {
        telaAtual: telaAtual?.id,
        appState: typeof AppState !== 'undefined',
        localStorageKeys,
        timerManager: !!window.timerManager
    };
};

// Função para forçar logout se normal não funcionar
window.forcarLogout = () => {
    console.log('🆘 ==> FORÇANDO LOGOUT <==');
    
    try {
        // Limpar tudo manualmente
        if (typeof AppState !== 'undefined' && AppState.reset) {
            AppState.reset();
            console.log('✅ AppState resetado');
        }
        
        // Limpar localStorage
        const keys = ['workoutState', 'currentWorkout', 'currentExercises'];
        keys.forEach(key => {
            localStorage.removeItem(key);
            console.log(`✅ Removido: ${key}`);
        });
        
        // Navegar para login
        if (typeof mostrarTela === 'function') {
            mostrarTela('login-screen');
            console.log('✅ Navegação via mostrarTela');
        } else if (window.renderTemplate) {
            window.renderTemplate('login');
            console.log('✅ Navegação via renderTemplate');
        } else {
            // Recriar tela de login manualmente
            const app = document.getElementById('app');
            if (app) {
                app.innerHTML = `
                    <div id="login-screen" class="screen active">
                        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; background: #101010; color: #fff; font-family: Arial, sans-serif;">
                            <h1 style="color: #CFFF04; margin-bottom: 2rem;">App Treino</h1>
                            <p style="margin-bottom: 2rem;">Logout forçado executado com sucesso!</p>
                            <button onclick="location.reload()" style="padding: 16px 32px; background: #CFFF04; color: #000; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
                                Recarregar Aplicação
                            </button>
                        </div>
                    </div>
                `;
                console.log('✅ Tela de login recriada manualmente');
            }
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Erro no logout forçado:', error);
        
        // Último recurso
        console.log('🔄 Recarregando página como último recurso...');
        setTimeout(() => {
            window.location.reload();
        }, 1000);
        
        return false;
    }
};

// Auto-registro de funções após carregamento
setTimeout(() => {
    console.log('[test-logout.js] 💡 Funções disponíveis:');
    console.log('- window.testarLogout()');
    console.log('- window.testarLogoutCompleto()');
    console.log('- window.debugEstadoApp()');
    console.log('- window.forcarLogout()');
}, 1000);

console.log('[test-logout.js] ✅ Arquivo carregado. Use: window.testarLogout()');