// Script para debugar estado do usuário
console.log('🔍 Debug do estado do usuário carregado');

function debugUserState() {
    console.log('=== DEBUG USER STATE ===');
    
    // 1. Verificar AppState
    const AppState = window.AppState;
    if (AppState) {
        console.log('✅ AppState disponível');
        const currentUser = AppState.get('currentUser');
        console.log('currentUser:', currentUser);
        console.log('Todos os dados do AppState:', AppState.state);
    } else {
        console.log('❌ AppState não disponível');
    }
    
    // 2. Verificar localStorage
    const keys = ['currentUser', 'users', 'weekPlan'];
    keys.forEach(key => {
        const value = localStorage.getItem(key);
        console.log(`localStorage.${key}:`, value ? JSON.parse(value) : null);
    });
    
    // 3. Verificar sessionStorage
    keys.forEach(key => {
        const value = sessionStorage.getItem(key);
        console.log(`sessionStorage.${key}:`, value ? JSON.parse(value) : null);
    });
    
    // 4. Verificar se existe algum listener do AppState
    if (AppState && AppState.listeners) {
        console.log('Listeners do AppState:', AppState.listeners);
    }
    
    console.log('=== FIM DEBUG ===');
}

// Monitorar mudanças no AppState
if (window.AppState) {
    const unsubscribe = window.AppState.subscribe('currentUser', (newUser, oldUser) => {
        console.log('🔄 currentUser mudou:', { oldUser, newUser });
    });
    
    console.log('👂 Listener adicionado para currentUser');
}

// Disponibilizar globalmente
window.debugUserState = debugUserState;

console.log('💡 Execute: window.debugUserState() no console para debugar o estado do usuário');