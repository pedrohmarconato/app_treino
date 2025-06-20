// Script para carregar o teste do WorkoutSession
// Cole isso no console do navegador

const script = document.createElement('script');
script.src = './tests/testWorkoutSessionIntegration.js';
script.onload = () => {
    console.log('✅ Script de teste carregado! Use os comandos:');
    console.log('  testWorkoutSession.integration() - Testar integração básica');
    console.log('  testWorkoutSession.series(0, 0) - Testar confirmação de série');
    console.log('  testWorkoutSession.recovery() - Testar recuperação de estado');
    console.log('  testWorkoutSession.runAll() - Executar todos os testes');
};
script.onerror = (error) => {
    console.error('❌ Erro ao carregar script de teste:', error);
};
document.head.appendChild(script);