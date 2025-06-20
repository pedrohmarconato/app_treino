// Teste de diagnóstico para importação de templates
console.log('[DIAG] 🔍 Iniciando diagnóstico de importação de templates...');

// Teste 1: Verificar se o módulo pode ser importado diretamente
async function testDirectImport() {
    console.log('\n[DIAG] Teste 1: Importação direta do módulo');
    try {
        const module = await import('../templates/workoutExecution.js');
        console.log('[DIAG] ✅ Módulo importado com sucesso');
        console.log('[DIAG] Exports disponíveis:', Object.keys(module));
        console.log('[DIAG] workoutTemplate é função?', typeof module.workoutTemplate === 'function');
        console.log('[DIAG] exerciseCardTemplate é função?', typeof module.exerciseCardTemplate === 'function');
        return module;
    } catch (error) {
        console.error('[DIAG] ❌ Erro na importação:', error);
        return null;
    }
}

// Teste 2: Verificar se os templates estão disponíveis globalmente
function testGlobalAvailability() {
    console.log('\n[DIAG] Teste 2: Disponibilidade global');
    console.log('[DIAG] window.workoutTemplate:', typeof window.workoutTemplate);
    console.log('[DIAG] window.exerciseCardTemplate:', typeof window.exerciseCardTemplate);
    console.log('[DIAG] window.workoutExecutionManager:', typeof window.workoutExecutionManager);
}

// Teste 3: Verificar ordem de carregamento
function testLoadOrder() {
    console.log('\n[DIAG] Teste 3: Ordem de carregamento');
    console.log('[DIAG] DOM state:', document.readyState);
    console.log('[DIAG] Scripts carregados:');
    
    const scripts = Array.from(document.querySelectorAll('script[type="module"]'));
    scripts.forEach((script, index) => {
        console.log(`[DIAG]   ${index + 1}. ${script.src || 'inline script'}`);
    });
}

// Teste 4: Tentar executar o template
async function testTemplateExecution() {
    console.log('\n[DIAG] Teste 4: Execução do template');
    
    const module = await testDirectImport();
    if (module && module.workoutTemplate) {
        try {
            const html = module.workoutTemplate();
            console.log('[DIAG] ✅ Template executado com sucesso');
            console.log('[DIAG] HTML gerado (primeiros 200 chars):', html.substring(0, 200) + '...');
        } catch (error) {
            console.error('[DIAG] ❌ Erro ao executar template:', error);
        }
    }
}

// Teste 5: Verificar se o problema é de timing
async function testTiming() {
    console.log('\n[DIAG] Teste 5: Timing de carregamento');
    
    // Verificar imediatamente
    console.log('[DIAG] Estado inicial:');
    testGlobalAvailability();
    
    // Verificar após um pequeno delay
    setTimeout(() => {
        console.log('\n[DIAG] Após 100ms:');
        testGlobalAvailability();
    }, 100);
    
    // Verificar após DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('\n[DIAG] Após DOMContentLoaded:');
            testGlobalAvailability();
        });
    }
    
    // Verificar após window.load
    window.addEventListener('load', () => {
        console.log('\n[DIAG] Após window.load:');
        testGlobalAvailability();
    });
}

// Executar todos os testes
async function runDiagnostics() {
    console.log('[DIAG] 🚀 Executando diagnósticos...\n');
    
    testLoadOrder();
    await testTemplateExecution();
    testTiming();
    
    console.log('\n[DIAG] 📊 Diagnóstico concluído');
}

// Executar quando o script carregar
runDiagnostics();

// Expor função global para re-executar
window.diagTemplateImport = runDiagnostics;