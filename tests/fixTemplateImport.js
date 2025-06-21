// Script para corrigir o problema de importação de templates

console.log('[FIX] 🔧 Iniciando correção de importação de templates...');

// Teste 1: Verificar estado atual
console.log('\n[FIX] Estado atual:');
console.log('- window.workoutTemplate:', typeof window.workoutTemplate);
console.log('- window.exerciseCardTemplate:', typeof window.exerciseCardTemplate);
console.log('- window.workoutExecutionManager:', typeof window.workoutExecutionManager);

// Teste 2: Tentar importar diretamente os templates
async function fixTemplateImports() {
    console.log('\n[FIX] Tentando importar templates diretamente...');
    
    try {
        // Importar os templates
        const { workoutTemplate, exerciseCardTemplate } = await import('../templates/workoutExecution.js');
        
        console.log('[FIX] ✅ Templates importados com sucesso');
        console.log('- workoutTemplate é função?', typeof workoutTemplate === 'function');
        console.log('- exerciseCardTemplate é função?', typeof exerciseCardTemplate === 'function');
        
        // Disponibilizar globalmente
        window.workoutTemplate = workoutTemplate;
        window.exerciseCardTemplate = exerciseCardTemplate;
        
        console.log('\n[FIX] ✅ Templates disponibilizados globalmente');
        
        // Verificar se o workoutExecutionManager pode usar agora
        if (window.workoutExecutionManager) {
            console.log('[FIX] workoutExecutionManager disponível');
            
            // Verificar se podemos renderizar
            try {
                const testHtml = workoutTemplate();
                console.log('[FIX] ✅ Template pode ser executado');
                console.log('[FIX] HTML gerado tem', testHtml.length, 'caracteres');
            } catch (error) {
                console.error('[FIX] ❌ Erro ao executar template:', error);
            }
        }
        
        return true;
    } catch (error) {
        console.error('[FIX] ❌ Erro ao importar templates:', error);
        return false;
    }
}

// Teste 3: Verificar se o problema é circular dependency
async function checkCircularDependency() {
    console.log('\n[FIX] Verificando dependências circulares...');
    
    // Verificar ordem de carregamento
    const scripts = Array.from(document.querySelectorAll('script[type="module"]'));
    console.log('[FIX] Scripts carregados:');
    scripts.forEach((script, index) => {
        if (script.src) {
            const filename = script.src.split('/').pop();
            console.log(`  ${index + 1}. ${filename}`);
        }
    });
}

// Solução: Re-exportar templates após carregamento
function setupTemplateReExport() {
    console.log('\n[FIX] Configurando re-export de templates...');
    
    // Aguardar um ciclo de evento para garantir que tudo carregou
    setTimeout(async () => {
        console.log('[FIX] Re-exportando templates...');
        
        // Se ainda não estiverem disponíveis, importar
        if (!window.workoutTemplate || !window.exerciseCardTemplate) {
            await fixTemplateImports();
        }
        
        // Verificar novamente
        console.log('\n[FIX] Estado final:');
        console.log('- window.workoutTemplate:', typeof window.workoutTemplate);
        console.log('- window.exerciseCardTemplate:', typeof window.exerciseCardTemplate);
        console.log('- window.workoutExecutionManager:', typeof window.workoutExecutionManager);
        
        // Se tudo estiver OK, mostrar sucesso
        if (window.workoutTemplate && window.exerciseCardTemplate && window.workoutExecutionManager) {
            console.log('\n[FIX] ✅ SUCESSO! Todos os componentes estão disponíveis');
            console.log('[FIX] 💡 O problema era a ordem de carregamento dos módulos');
        } else {
            console.log('\n[FIX] ⚠️ Ainda há componentes faltando');
        }
    }, 100);
}

// Executar correções
(async function() {
    await fixTemplateImports();
    checkCircularDependency();
    setupTemplateReExport();
})();

// Expor função para re-executar
window.fixTemplateImport = fixTemplateImports;