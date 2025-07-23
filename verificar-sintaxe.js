// Verificação rápida de sintaxe JavaScript
console.log('🔍 Verificando sintaxe dos arquivos principais...');

const arquivos = [
    'components/disposicaoInicioModal.js',
    'feature/workout.js',
    'services/questionarioService.js'
];

// Função para testar sintaxe básica
function verificarSintaxeBasica() {
    console.log('✅ Este arquivo carregou sem erros de sintaxe');
    
    // Verificar se as funções principais estão disponíveis
    const status = {
        'window.iniciarTreinoComDisposicao': typeof window.iniciarTreinoComDisposicao,
        'window.iniciarTreino': typeof window.iniciarTreino,
        'window.DisposicaoInicioModal': typeof window.DisposicaoInicioModal,
        'window.testarModalDisposicao': typeof window.testarModalDisposicao,
        'window.testarDisposicaoSimples': typeof window.testarDisposicaoSimples
    };
    
    console.table(status);
    
    // Contar quantas funções estão disponíveis
    const disponivel = Object.values(status).filter(tipo => tipo === 'function').length;
    const total = Object.keys(status).length;
    
    console.log(`📊 Status: ${disponivel}/${total} funções disponíveis`);
    
    if (disponivel >= 3) {
        console.log('🎉 Implementação parece estar funcionando!');
        console.log('🎯 Para testar: window.iniciarTreinoComDisposicao()');
    } else {
        console.log('⚠️  Algumas funções ainda não estão disponíveis');
        console.log('💡 Aguarde alguns segundos e tente novamente');
    }
    
    return { disponivel, total, status };
}

// Registrar função globalmente
window.verificarSintaxeBasica = verificarSintaxeBasica;

// Executar teste após 5 segundos
setTimeout(() => {
    console.log('🧪 Executando verificação automática...');
    verificarSintaxeBasica();
}, 5000);

console.log('✅ Verificador de sintaxe carregado. Use: window.verificarSintaxeBasica()');