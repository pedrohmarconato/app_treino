// Arquivo de teste independente para verificar integração do modal de disposição
console.log('[test-disposicao.js] Carregando arquivo de teste...');

// Função de teste global simples
window.testarDisposicaoSimples = () => {
    console.log('🧪 ==> TESTE SIMPLES MODAL DISPOSIÇÃO <==');
    
    // Verificar disponibilidade das funções
    const status = {
        iniciarTreinoComDisposicao: typeof window.iniciarTreinoComDisposicao,
        iniciarTreino: typeof window.iniciarTreino,
        DisposicaoInicioModal: typeof window.DisposicaoInicioModal,
        testarModalDisposicao: typeof window.testarModalDisposicao
    };
    
    console.table(status);
    
    // Instruções
    console.log('📋 Para testar:');
    console.log('1. window.iniciarTreinoComDisposicao() - Função principal');
    console.log('2. window.testarModalDisposicao() - Teste só do modal');
    console.log('3. Clicar no botão "Iniciar Treino" na interface');
    
    return status;
};

// Função de teste avançado que tenta executar o fluxo completo
window.testarFluxoCompleto = async () => {
    console.log('🚀 ==> TESTE FLUXO COMPLETO DISPOSIÇÃO <==');
    
    // Verificar disponibilidade
    if (typeof window.iniciarTreinoComDisposicao !== 'function') {
        console.error('❌ Função iniciarTreinoComDisposicao não disponível');
        console.log('💡 Tente recarregar a página e aguardar 3 segundos');
        return false;
    }
    
    console.log('✅ Função iniciarTreinoComDisposicao disponível');
    
    // Verificar modal
    const modal = window.DisposicaoInicioModal || window.DisposicaoInicioModal;
    if (!modal) {
        console.error('❌ DisposicaoInicioModal não disponível');
        return false;
    }
    
    console.log('✅ DisposicaoInicioModal disponível');
    
    // Teste de verificação
    try {
        const jaColetou = await modal.verificarSeJaColetouHoje(1);
        console.log('📊 Disposição já coletada hoje:', jaColetou);
        
        console.log('🎯 Agora teste o botão "Iniciar Treino" ou execute:');
        console.log('   window.iniciarTreinoComDisposicao()');
        
        return true;
    } catch (error) {
        console.error('❌ Erro ao verificar disposição:', error);
        return false;
    }
};

// Teste de carregamento automático após 3 segundos
setTimeout(() => {
    console.log('[test-disposicao.js] Executando teste automático...');
    if (typeof window.testarDisposicaoSimples === 'function') {
        window.testarDisposicaoSimples();
    }
    console.log('[test-disposicao.js] 💡 Para teste avançado: window.testarFluxoCompleto()');
}, 3000);

console.log('[test-disposicao.js] ✅ Arquivo carregado. Use: window.testarDisposicaoSimples()');