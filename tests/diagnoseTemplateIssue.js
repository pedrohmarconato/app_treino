/**
 * Diagnóstico definitivo do problema com workoutTemplate
 */

(async function() {
    console.log('🔍 DIAGNÓSTICO DEFINITIVO - workoutTemplate\n');
    console.log('============================================\n');
    
    // 1. Verificar se o módulo workoutExecution foi carregado
    console.log('1️⃣ Verificando carregamento do workoutExecution.js:');
    console.log('window.workoutExecutionManager:', !!window.workoutExecutionManager);
    console.log('window.WorkoutExecutionManager:', !!window.WorkoutExecutionManager);
    
    // 2. Verificar templates disponíveis
    console.log('\n2️⃣ Verificando templates disponíveis:');
    console.log('window.workoutTemplate:', typeof window.workoutTemplate);
    console.log('window.exerciseCardTemplate:', typeof window.exerciseCardTemplate);
    
    // 3. Tentar importar o template diretamente
    console.log('\n3️⃣ Tentando importar template diretamente:');
    try {
        const module = await import('/templates/workoutExecution.js');
        console.log('✅ Módulo importado com sucesso');
        console.log('Exports:', Object.keys(module));
        console.log('workoutTemplate é função?', typeof module.workoutTemplate === 'function');
        
        // Testar execução do template
        if (typeof module.workoutTemplate === 'function') {
            const html = module.workoutTemplate();
            console.log('✅ Template executado, primeiros 200 chars:');
            console.log(html.substring(0, 200) + '...');
            
            // Disponibilizar globalmente para teste
            window.workoutTemplate = module.workoutTemplate;
            window.exerciseCardTemplate = module.exerciseCardTemplate;
            console.log('\n✅ Templates disponibilizados em window para teste');
        }
    } catch (error) {
        console.error('❌ Erro ao importar template:', error);
    }
    
    // 4. Verificar se o problema é na criação da tela
    console.log('\n4️⃣ Testando criação de tela com template:');
    
    function testCreateScreen() {
        if (!window.workoutTemplate) {
            console.log('❌ workoutTemplate não disponível para teste');
            return;
        }
        
        try {
            const testDiv = document.createElement('div');
            testDiv.innerHTML = window.workoutTemplate();
            console.log('✅ Template aplicado com sucesso em div de teste');
            console.log('Elementos criados:', testDiv.querySelectorAll('*').length);
            
            // Verificar elementos principais
            const elements = {
                'Header': testDiv.querySelector('.workout-header-float'),
                'Timer': testDiv.querySelector('#workout-timer-display'),
                'Progress': testDiv.querySelector('#workout-progress'),
                'Container': testDiv.querySelector('#exercises-container')
            };
            
            console.log('\nElementos principais encontrados:');
            Object.entries(elements).forEach(([name, el]) => {
                console.log(`- ${name}:`, !!el ? '✅' : '❌');
            });
            
        } catch (error) {
            console.error('❌ Erro ao testar template:', error);
        }
    }
    
    testCreateScreen();
    
    // 5. Analisar o fluxo de carregamento
    console.log('\n5️⃣ Análise do fluxo de carregamento:');
    
    // Verificar ordem de scripts
    const scripts = Array.from(document.querySelectorAll('script[type="module"]'));
    console.log('Scripts módulo encontrados:', scripts.length);
    scripts.forEach((script, i) => {
        console.log(`${i + 1}. ${script.src || 'inline'}`);
    });
    
    // 6. Solução proposta
    console.log('\n6️⃣ SOLUÇÃO PROPOSTA:');
    console.log('================');
    
    console.log(`
O problema parece estar no timing de carregamento dos módulos.
O workoutExecution.js está tentando usar o template antes dele estar disponível.

CORREÇÃO NECESSÁRIA em workoutExecution.js:

1. Remover o throw Error e adicionar uma verificação com retry:

async criarEPrepararTelaWorkout() {
    // ... código anterior ...
    
    // Tentar carregar template se não estiver disponível
    if (!workoutTemplate) {
        try {
            const module = await import('../templates/workoutExecution.js');
            workoutTemplate = module.workoutTemplate;
            exerciseCardTemplate = module.exerciseCardTemplate;
        } catch (error) {
            console.error('Erro ao carregar template:', error);
        }
    }
    
    if (!workoutTemplate || typeof workoutTemplate !== 'function') {
        console.error('[WorkoutExecution] Template não disponível após tentativa de import');
        // Criar estrutura mínima sem template
        workoutScreen.innerHTML = '<div>Erro ao carregar template</div>';
    } else {
        workoutScreen.innerHTML = workoutTemplate();
    }
    
    // ... resto do código ...
}
    `);
    
    // 7. Teste rápido
    console.log('\n7️⃣ Teste rápido - iniciar treino agora:');
    console.log('Execute: window.iniciarTreino()');
    
})();