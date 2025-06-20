/**
 * Debug para verificar problema com workoutTemplate
 */

(async function() {
    console.log('🔍 DEBUG TEMPLATE IMPORT');
    console.log('=======================\n');
    
    // 1. Verificar se workoutTemplate está disponível globalmente
    console.log('1️⃣ Verificação Global:');
    console.log('window.workoutTemplate:', typeof window.workoutTemplate);
    console.log('window.exerciseCardTemplate:', typeof window.exerciseCardTemplate);
    
    // 2. Verificar se o manager tem acesso aos templates
    if (window.workoutExecutionManager) {
        console.log('\n2️⃣ Verificação no Manager:');
        
        // Tentar acessar propriedades do manager
        const managerProps = Object.getOwnPropertyNames(window.workoutExecutionManager);
        const templateRelated = managerProps.filter(prop => 
            prop.toLowerCase().includes('template')
        );
        
        console.log('Propriedades relacionadas a template:', templateRelated);
    }
    
    // 3. Tentar importar diretamente
    console.log('\n3️⃣ Tentando importar diretamente:');
    try {
        const module = await import('/templates/workoutExecution.js');
        console.log('✅ Módulo importado com sucesso');
        console.log('Exports disponíveis:', Object.keys(module));
        console.log('workoutTemplate é função?', typeof module.workoutTemplate === 'function');
        console.log('exerciseCardTemplate é função?', typeof module.exerciseCardTemplate === 'function');
        
        // Testar execução
        if (typeof module.workoutTemplate === 'function') {
            const html = module.workoutTemplate();
            console.log('✅ Template executado, tamanho HTML:', html.length, 'caracteres');
            console.log('Primeiros 100 chars:', html.substring(0, 100) + '...');
        }
        
        // Disponibilizar globalmente se não estiver
        if (!window.workoutTemplate) {
            window.workoutTemplate = module.workoutTemplate;
            window.exerciseCardTemplate = module.exerciseCardTemplate;
            console.log('\n✅ Templates disponibilizados globalmente');
        }
        
    } catch (error) {
        console.error('❌ Erro ao importar módulo:', error);
    }
    
    // 4. Verificar se o problema é de timing
    console.log('\n4️⃣ Verificação de Timing:');
    console.log('DOM pronto?', document.readyState);
    console.log('workoutExecutionManager existe?', !!window.workoutExecutionManager);
    
    // 5. Solução temporária
    console.log('\n5️⃣ Aplicando solução temporária...');
    
    // Criar uma função que garante que o template esteja disponível
    window.ensureWorkoutTemplate = async function() {
        if (window.workoutTemplate && typeof window.workoutTemplate === 'function') {
            return window.workoutTemplate;
        }
        
        try {
            const module = await import('/templates/workoutExecution.js');
            window.workoutTemplate = module.workoutTemplate;
            window.exerciseCardTemplate = module.exerciseCardTemplate;
            return module.workoutTemplate;
        } catch (error) {
            console.error('Erro ao garantir template:', error);
            return null;
        }
    };
    
    console.log('✅ Função ensureWorkoutTemplate criada');
    console.log('\n💡 Para testar:');
    console.log('1. Execute: await ensureWorkoutTemplate()');
    console.log('2. Depois tente iniciar o treino novamente');
})();