// Script para verificar se o problema de template foi resolvido

console.log('[VERIFY] 🔍 Verificando correção do problema de templates...\n');

// Função para verificar disponibilidade de componentes
function checkAvailability() {
    const checks = {
        'window.workoutTemplate': typeof window.workoutTemplate,
        'window.exerciseCardTemplate': typeof window.exerciseCardTemplate,
        'window.workoutExecutionManager': typeof window.workoutExecutionManager,
        'window.WorkoutExecutionManager': typeof window.WorkoutExecutionManager,
        'window.renderTemplate': typeof window.renderTemplate
    };
    
    console.log('[VERIFY] Status dos componentes:');
    Object.entries(checks).forEach(([key, type]) => {
        const icon = type !== 'undefined' ? '✅' : '❌';
        console.log(`  ${icon} ${key}: ${type}`);
    });
    
    return Object.values(checks).every(type => type !== 'undefined');
}

// Função para testar execução do template
async function testTemplateExecution() {
    console.log('\n[VERIFY] Testando execução do template...');
    
    if (typeof window.workoutTemplate !== 'function') {
        console.error('[VERIFY] ❌ workoutTemplate não é uma função');
        return false;
    }
    
    try {
        const html = window.workoutTemplate();
        console.log('[VERIFY] ✅ Template executado com sucesso');
        console.log('[VERIFY] HTML gerado tem', html.length, 'caracteres');
        
        // Verificar se o HTML contém elementos esperados
        const hasWorkoutScreen = html.includes('workout-screen');
        const hasTimer = html.includes('workout-timer');
        const hasProgress = html.includes('workout-progress');
        
        console.log('[VERIFY] Elementos encontrados:');
        console.log(`  ${hasWorkoutScreen ? '✅' : '❌'} workout-screen`);
        console.log(`  ${hasTimer ? '✅' : '❌'} workout-timer`);
        console.log(`  ${hasProgress ? '✅' : '❌'} workout-progress`);
        
        return hasWorkoutScreen && hasTimer && hasProgress;
    } catch (error) {
        console.error('[VERIFY] ❌ Erro ao executar template:', error);
        return false;
    }
}

// Função para simular início de treino
async function testWorkoutStart() {
    console.log('\n[VERIFY] Testando início de treino...');
    
    if (typeof window.iniciarTreino !== 'function') {
        console.warn('[VERIFY] ⚠️ window.iniciarTreino não disponível');
        return;
    }
    
    // Verificar se há usuário logado
    if (!window.AppState || !window.AppState.get('currentUser')) {
        console.warn('[VERIFY] ⚠️ Nenhum usuário logado para testar');
        return;
    }
    
    console.log('[VERIFY] 🏋️ Simulando início de treino...');
    console.log('[VERIFY] 💡 Observe o console para ver se o template é carregado corretamente');
}

// Função principal de verificação
async function runVerification() {
    console.log('[VERIFY] 🚀 Iniciando verificação...\n');
    
    // Verificar disponibilidade inicial
    const initialCheck = checkAvailability();
    
    if (!initialCheck) {
        console.log('\n[VERIFY] ⏳ Aguardando carregamento completo...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Verificar novamente
        const secondCheck = checkAvailability();
        
        if (!secondCheck) {
            console.error('\n[VERIFY] ❌ PROBLEMA NÃO RESOLVIDO!');
            console.log('[VERIFY] Os componentes ainda não estão disponíveis.');
            return;
        }
    }
    
    // Testar execução do template
    const templateWorks = await testTemplateExecution();
    
    if (templateWorks) {
        console.log('\n[VERIFY] ✅ PROBLEMA RESOLVIDO!');
        console.log('[VERIFY] O template está funcionando corretamente.');
        console.log('\n[VERIFY] 💡 Próximos passos:');
        console.log('  1. Faça login na aplicação');
        console.log('  2. Configure um treino no planejamento');
        console.log('  3. Clique em "Iniciar Treino"');
        console.log('  4. O template deve ser renderizado sem usar o fallback');
    } else {
        console.error('\n[VERIFY] ⚠️ PROBLEMA PARCIALMENTE RESOLVIDO');
        console.log('[VERIFY] Os componentes estão disponíveis mas o template tem problemas.');
    }
    
    // Sugerir teste de treino
    await testWorkoutStart();
}

// Executar verificação
runVerification();

// Expor função para re-executar
window.verifyTemplateFix = runVerification;