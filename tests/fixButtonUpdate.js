/**
 * Fix para forçar atualização do botão contextual
 */

async function fixButtonUpdate() {
    console.log('🔧 Aplicando fix para atualização do botão...');
    
    // 1. Disparar evento de atualização de cache
    window.dispatchEvent(new CustomEvent('workout-cache-updated', {
        detail: { 
            hasCache: true,
            timestamp: Date.now()
        }
    }));
    
    // 2. Notificar via AppState se disponível
    if (window.AppState?.set) {
        window.AppState.set('workoutCacheUpdated', Date.now());
    }
    
    // 3. Forçar atualização do botão se existir instância
    if (window.contextualWorkoutButton?.forceUpdate) {
        await window.contextualWorkoutButton.forceUpdate();
        console.log('✅ forceUpdate executado');
    }
    
    // 4. Se não houver instância, tentar criar uma nova
    const button = document.querySelector('#contextual-workout-btn');
    if (button && !window.contextualWorkoutButton) {
        if (window.ContextualWorkoutButton) {
            window.contextualWorkoutButton = new window.ContextualWorkoutButton(button);
            console.log('✅ Nova instância do botão criada');
        }
    }
    
    // 5. Aguardar e verificar
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const finalState = button?.getAttribute('data-state');
    const finalText = button?.innerText;
    
    console.log('📊 Estado final do botão:', {
        state: finalState,
        text: finalText,
        hasResumeText: finalText?.includes('Voltar')
    });
    
    return finalState === 'resume';
}

// Função para debug completo do botão
function debugButton() {
    const button = document.querySelector('#contextual-workout-btn');
    
    if (!button) {
        console.log('❌ Botão não encontrado');
        return;
    }
    
    console.log('🔍 Debug do Botão Contextual:');
    console.log('============================');
    
    // Atributos
    console.log('Atributos:', {
        id: button.id,
        'data-state': button.getAttribute('data-state'),
        'data-action': button.getAttribute('data-action'),
        disabled: button.disabled,
        className: button.className
    });
    
    // Conteúdo
    console.log('Conteúdo:', {
        text: button.innerText,
        html: button.innerHTML.substring(0, 100) + '...'
    });
    
    // Instância
    console.log('Instância:', {
        hasGlobalInstance: !!window.contextualWorkoutButton,
        hasConstructor: !!window.ContextualWorkoutButton
    });
    
    // Cache
    if (window.TreinoCacheService || window.workoutPersistence) {
        const service = window.TreinoCacheService || window.workoutPersistence;
        service.getWorkoutState().then(state => {
            console.log('Estado do cache:', {
                hasState: !!state,
                exerciciosExecutados: state?.exerciciosExecutados?.length || 0
            });
        });
    }
}

// Auto-executar fix
(async function() {
    console.log('🚀 Iniciando fix automático do botão...');
    const success = await fixButtonUpdate();
    
    if (success) {
        console.log('✅ Botão atualizado com sucesso!');
    } else {
        console.log('⚠️ Botão pode precisar de atualização manual');
        console.log('Execute: debugButton() para mais informações');
    }
})();

// Exportar funções
window.fixButtonUpdate = fixButtonUpdate;
window.debugButton = debugButton;