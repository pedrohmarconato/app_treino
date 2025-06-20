// Script para forçar recarga do WorkoutSession
// Cole isso no console do navegador para limpar o cache do módulo

// 1. Limpar cache de módulos
if ('caches' in window) {
    caches.keys().then(names => {
        names.forEach(name => {
            console.log('Limpando cache:', name);
            caches.delete(name);
        });
    });
}

// 2. Adicionar timestamp para forçar recarga
const timestamp = Date.now();

// 3. Testar importação com timestamp
import(`./core/WorkoutSession.js?t=${timestamp}`)
    .then(module => {
        console.log('✅ WorkoutSession recarregado com sucesso!');
        console.log('Módulo:', module);
        
        // Testar se pode criar instância
        try {
            const session = new module.WorkoutSession();
            console.log('✅ Instância criada:', session);
        } catch (error) {
            console.error('❌ Erro ao criar instância:', error);
        }
    })
    .catch(error => {
        console.error('❌ Erro ao importar WorkoutSession:', error);
    });

// 4. Instruções alternativas
console.log('\n🔄 Se o erro persistir, tente:');
console.log('1. Abrir DevTools > Network > Disable cache');
console.log('2. Fazer hard refresh: Ctrl+Shift+R (ou Cmd+Shift+R no Mac)');
console.log('3. Abrir em aba anônima/privada');
console.log('\n📝 Depois disso, clique novamente em "Iniciar Treino"');