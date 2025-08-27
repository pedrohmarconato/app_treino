(async () => {
    try {
        console.log('Testando importação dinâmica...');
        const module = await import('./feature/login.js');
        console.log('Importação bem-sucedida!', module);
    } catch (error) {
        console.error('Erro na importação:', error);
    }
})();
