// Test Runner Simplificado - Para executar no navegador
console.log('🧪 Test Runner carregado com sucesso!');

// Função principal de teste
async function runMandatoryTests() {
    console.log('🧪 [TestRunner] Iniciando testes básicos...\n');
    
    const startTime = performance.now();
    const results = {};
    
    try {
        // TESTE 1: Verificar localStorage
        console.log('📋 TESTE 1: Verificando localStorage...');
        results.localStorage = testLocalStorage();
        
        // TESTE 2: Verificar sessionStorage  
        console.log('📋 TESTE 2: Verificando sessionStorage...');
        results.sessionStorage = testSessionStorage();
        
        // TESTE 3: Verificar estrutura do DOM
        console.log('📋 TESTE 3: Verificando estrutura DOM...');
        results.domStructure = testDOMStructure();
        
        // TESTE 4: Verificar scripts carregados
        console.log('📋 TESTE 4: Verificando scripts...');
        results.scripts = testScripts();
        
        // TESTE 5: Verificar cache básico
        console.log('📋 TESTE 5: Verificando cache básico...');
        results.cache = testBasicCache();
        
        const endTime = performance.now();
        const duration = (endTime - startTime) / 1000;
        
        // Gerar relatório
        generateReport(results, duration);
        
        return results;
        
    } catch (error) {
        console.error('🔥 [TestRunner] Erro durante execução dos testes:', error);
        throw error;
    }
}

// Teste localStorage
function testLocalStorage() {
    try {
        const testKey = 'test_' + Date.now();
        const testValue = 'test_value';
        
        localStorage.setItem(testKey, testValue);
        const retrieved = localStorage.getItem(testKey);
        localStorage.removeItem(testKey);
        
        const passed = retrieved === testValue;
        console.log(`   ${passed ? '✅ APROVADO' : '❌ REPROVADO'}: localStorage funcionando`);
        
        return {
            name: 'localStorage Test',
            passed,
            requirement: 'localStorage deve funcionar corretamente'
        };
    } catch (error) {
        console.log(`   ❌ ERRO: ${error.message}`);
        return {
            name: 'localStorage Test', 
            passed: false,
            error: error.message,
            requirement: 'localStorage deve funcionar corretamente'
        };
    }
}

// Teste sessionStorage
function testSessionStorage() {
    try {
        const testKey = 'session_test_' + Date.now();
        const testValue = 'session_test_value';
        
        sessionStorage.setItem(testKey, testValue);
        const retrieved = sessionStorage.getItem(testKey);
        sessionStorage.removeItem(testKey);
        
        const passed = retrieved === testValue;
        console.log(`   ${passed ? '✅ APROVADO' : '❌ REPROVADO'}: sessionStorage funcionando`);
        
        return {
            name: 'sessionStorage Test',
            passed,
            requirement: 'sessionStorage deve funcionar corretamente'
        };
    } catch (error) {
        console.log(`   ❌ ERRO: ${error.message}`);
        return {
            name: 'sessionStorage Test',
            passed: false, 
            error: error.message,
            requirement: 'sessionStorage deve funcionar corretamente'
        };
    }
}

// Teste estrutura DOM
function testDOMStructure() {
    try {
        const app = document.getElementById('app');
        const hasApp = !!app;
        const hasContent = app && app.innerHTML.length > 0;
        
        const passed = hasApp && hasContent;
        console.log(`   ${passed ? '✅ APROVADO' : '❌ REPROVADO'}: Estrutura DOM básica`);
        
        if (!hasApp) console.log('   ⚠️  Elemento #app não encontrado');
        if (!hasContent) console.log('   ⚠️  Elemento #app está vazio');
        
        return {
            name: 'DOM Structure Test',
            passed,
            details: { hasApp, hasContent },
            requirement: 'App deve ter estrutura DOM básica'
        };
    } catch (error) {
        console.log(`   ❌ ERRO: ${error.message}`);
        return {
            name: 'DOM Structure Test',
            passed: false,
            error: error.message,
            requirement: 'App deve ter estrutura DOM básica'
        };
    }
}

// Teste scripts carregados
function testScripts() {
    try {
        const scripts = document.querySelectorAll('script');
        const hasScripts = scripts.length > 0;
        const hasAppScript = Array.from(scripts).some(script => 
            script.src.includes('app.js') || script.src.includes('testRunner')
        );
        
        const passed = hasScripts && hasAppScript;
        console.log(`   ${passed ? '✅ APROVADO' : '❌ REPROVADO'}: Scripts carregados`);
        console.log(`   📊 Total de scripts: ${scripts.length}`);
        
        return {
            name: 'Scripts Test',
            passed,
            details: { totalScripts: scripts.length, hasAppScript },
            requirement: 'Scripts principais devem estar carregados'
        };
    } catch (error) {
        console.log(`   ❌ ERRO: ${error.message}`);
        return {
            name: 'Scripts Test',
            passed: false,
            error: error.message,
            requirement: 'Scripts principais devem estar carregados'
        };
    }
}

// Teste cache básico
function testBasicCache() {
    try {
        // Simular operação de cache
        const cacheKey = 'test_cache_' + Date.now();
        const cacheData = { test: true, timestamp: Date.now() };
        
        // Tentar armazenar no localStorage como cache
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        const retrieved = JSON.parse(localStorage.getItem(cacheKey));
        localStorage.removeItem(cacheKey);
        
        const passed = retrieved && retrieved.test === true;
        console.log(`   ${passed ? '✅ APROVADO' : '❌ REPROVADO'}: Cache básico funcionando`);
        
        return {
            name: 'Basic Cache Test',
            passed,
            requirement: 'Sistema de cache básico deve funcionar'
        };
    } catch (error) {
        console.log(`   ❌ ERRO: ${error.message}`);
        return {
            name: 'Basic Cache Test',
            passed: false,
            error: error.message,
            requirement: 'Sistema de cache básico deve funcionar'
        };
    }
}

// Gerar relatório final
function generateReport(results, duration) {
    const tests = Object.values(results);
    const totalTests = tests.length;
    const passedTests = tests.filter(test => test.passed).length;
    const failedTests = totalTests - passedTests;
    const score = (passedTests / totalTests) * 100;
    
    const overallStatus = passedTests === totalTests ? 'APROVADO' : 'REPROVADO';
    const statusIcon = overallStatus === 'APROVADO' ? '✅' : '❌';
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RELATÓRIO FINAL - Testes Básicos');
    console.log('='.repeat(60));
    console.log(`\n${statusIcon} STATUS GERAL: ${overallStatus}`);
    console.log(`🎯 SCORE: ${score.toFixed(1)}%`);
    console.log(`⏱️  DURAÇÃO: ${duration.toFixed(2)}s`);
    
    console.log('\n📋 RESULTADOS DOS TESTES:');
    tests.forEach((test, index) => {
        const icon = test.passed ? '✅' : '❌';
        console.log(`   ${index + 1}. ${icon} ${test.name}`);
        console.log(`      Requisito: ${test.requirement}`);
        if (!test.passed && test.error) {
            console.log(`      Erro: ${test.error}`);
        }
    });
    
    console.log('\n' + '='.repeat(60));
}

// Disponibilizar globalmente
window.runMandatoryTests = runMandatoryTests;
window.testLocalStorage = testLocalStorage;
window.testSessionStorage = testSessionStorage;
window.testDOMStructure = testDOMStructure;
window.testScripts = testScripts;
window.testBasicCache = testBasicCache;

console.log('✅ Funções de teste disponíveis:');
console.log('   - runMandatoryTests()');
console.log('   - testLocalStorage()'); 
console.log('   - testSessionStorage()');
console.log('   - testDOMStructure()');
console.log('   - testScripts()');
console.log('   - testBasicCache()');