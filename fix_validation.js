// Script de validação completa das correções
// Execute no console: validateAllFixes()

window.validateAllFixes = async function() {
    console.log('🔧 VALIDANDO TODAS AS CORREÇÕES IMPLEMENTADAS');
    console.log('================================================');
    
    const results = {
        timestamp: new Date().toISOString(),
        fixes: {},
        overall_status: 'unknown'
    };
    
    // 1. Validar usuário logado
    console.log('\n👤 1. Validando usuário logado...');
    const currentUser = AppState.get('currentUser');
    if (!currentUser?.id) {
        console.error('❌ ERRO CRÍTICO: Usuário não está logado');
        results.overall_status = 'failed';
        return results;
    }
    console.log('✅ Usuário logado:', currentUser.nome, `(ID: ${currentUser.id})`);
    results.user = currentUser;
    
    // 2. Testar WeeklyPlanService.getPlan com fallback
    console.log('\n📊 2. Testando WeeklyPlanService.getPlan...');
    try {
        const plan = await WeeklyPlanService.getPlan(currentUser.id, false);
        if (plan) {
            console.log('✅ Plano carregado com sucesso');
            console.log('📋 Dias no plano:', Object.keys(plan).length);
            results.fixes.weeklyPlanService = 'success';
            results.plan = plan;
            
            // Verificar estrutura dos dados
            const firstDay = plan[0] || plan[Object.keys(plan)[0]];
            if (firstDay) {
                console.log('📝 Estrutura do primeiro dia:', {
                    tipo: firstDay.tipo,
                    tipo_atividade: firstDay.tipo_atividade,
                    categoria: firstDay.categoria,
                    numero_treino: firstDay.numero_treino
                });
            }
        } else {
            console.warn('⚠️ Plano retornou null - usuário pode não ter planejamento para esta semana');
            results.fixes.weeklyPlanService = 'no_data';
        }
    } catch (error) {
        console.error('❌ Erro no WeeklyPlanService:', error);
        results.fixes.weeklyPlanService = 'error';
        results.errors = results.errors || [];
        results.errors.push(`WeeklyPlanService: ${error.message}`);
    }
    
    // 3. Testar getTodaysWorkout
    console.log('\n💪 3. Testando getTodaysWorkout...');
    try {
        const workout = await WeeklyPlanService.getTodaysWorkout(currentUser.id);
        if (workout) {
            console.log('✅ Treino do dia carregado');
            console.log('🏋️ Treino:', workout.nome);
            console.log('📝 Estrutura:', {
                tipo: workout.tipo,
                tipo_atividade: workout.tipo_atividade,
                grupo_muscular: workout.grupo_muscular,
                exercicios: workout.exercicios?.length || 0
            });
            results.fixes.getTodaysWorkout = 'success';
            results.todaysWorkout = workout;
        } else {
            console.warn('⚠️ Nenhum treino para hoje');
            results.fixes.getTodaysWorkout = 'no_data';
        }
    } catch (error) {
        console.error('❌ Erro no getTodaysWorkout:', error);
        results.fixes.getTodaysWorkout = 'error';
        results.errors = results.errors || [];
        results.errors.push(`getTodaysWorkout: ${error.message}`);
    }
    
    // 4. Testar carregamento dos indicadores
    console.log('\n📅 4. Testando carregamento dos indicadores...');
    try {
        await carregarIndicadoresSemana();
        console.log('✅ Indicadores da semana carregados');
        results.fixes.weekIndicators = 'success';
        
        // Verificar se os elementos foram renderizados
        const container = document.getElementById('week-indicators');
        if (container && container.children.length > 0) {
            console.log('📊 Elementos renderizados:', container.children.length);
            results.indicatorsRendered = container.children.length;
        }
    } catch (error) {
        console.error('❌ Erro ao carregar indicadores:', error);
        results.fixes.weekIndicators = 'error';
        results.errors = results.errors || [];
        results.errors.push(`Indicadores: ${error.message}`);
    }
    
    // 5. Testar dashboard completo
    console.log('\n🏠 5. Testando dashboard completo...');
    try {
        await carregarDashboard();
        console.log('✅ Dashboard carregado completamente');
        results.fixes.fullDashboard = 'success';
    } catch (error) {
        console.error('❌ Erro no dashboard:', error);
        results.fixes.fullDashboard = 'error';
        results.errors = results.errors || [];
        results.errors.push(`Dashboard: ${error.message}`);
    }
    
    // 6. Verificar dados no AppState
    console.log('\n🗂️ 6. Verificando AppState...');
    const weekPlan = AppState.get('weekPlan');
    const currentWorkout = AppState.get('currentWorkout');
    
    if (weekPlan) {
        console.log('✅ WeekPlan no AppState:', Object.keys(weekPlan).length, 'dias');
        results.appState.weekPlan = 'present';
    } else {
        console.warn('⚠️ WeekPlan não está no AppState');
        results.appState.weekPlan = 'missing';
    }
    
    if (currentWorkout) {
        console.log('✅ CurrentWorkout no AppState:', currentWorkout.nome);
        results.appState.currentWorkout = 'present';
    } else {
        console.warn('⚠️ CurrentWorkout não está no AppState');
        results.appState.currentWorkout = 'missing';
    }
    
    // 7. Análise final
    console.log('\n📋 RESUMO DA VALIDAÇÃO:');
    console.log('========================');
    
    const successCount = Object.values(results.fixes).filter(v => v === 'success').length;
    const totalFixes = Object.keys(results.fixes).length;
    
    console.log(`✅ Correções funcionando: ${successCount}/${totalFixes}`);
    console.log(`⚠️ Sem dados: ${Object.values(results.fixes).filter(v => v === 'no_data').length}`);
    console.log(`❌ Com erro: ${Object.values(results.fixes).filter(v => v === 'error').length}`);
    
    if (results.errors && results.errors.length > 0) {
        console.log('\n❌ ERROS ENCONTRADOS:');
        results.errors.forEach(error => console.log('  -', error));
    }
    
    // Status geral
    if (successCount === totalFixes) {
        results.overall_status = 'all_good';
        console.log('\n🎉 TODAS AS CORREÇÕES FUNCIONANDO PERFEITAMENTE!');
    } else if (successCount > 0) {
        results.overall_status = 'partial_success';
        console.log('\n⚠️ Algumas correções funcionam, mas há problemas');
    } else {
        results.overall_status = 'failed';
        console.log('\n❌ CORREÇÕES FALHARAM - VERIFICAR PROBLEMAS');
    }
    
    // Próximos passos
    console.log('\n🔧 PRÓXIMOS PASSOS:');
    if (!results.plan && !results.todaysWorkout) {
        console.log('1. 📝 Criar planejamento semanal para o usuário');
        console.log('2. 🗃️ Verificar se a view v_planejamento_completo existe');
    }
    if (results.errors && results.errors.length > 0) {
        console.log('3. 🔍 Investigar e corrigir os erros listados acima');
    }
    if (successCount > 0) {
        console.log('4. ✅ Testar funcionalidade completa da aplicação');
    }
    
    return results;
};

// Função de teste específico para o problema de dados
window.testDataFlow = async function() {
    console.log('🔍 TESTE ESPECÍFICO DO FLUXO DE DADOS');
    
    const currentUser = AppState.get('currentUser');
    if (!currentUser?.id) {
        console.error('❌ Usuário não logado');
        return;
    }
    
    // Limpar cache para forçar busca no banco
    console.log('🗑️ Limpando cache...');
    localStorage.removeItem(`weekPlan_${currentUser.id}_${new Date().getFullYear()}_${WeeklyPlanService.getWeekNumber(new Date())}`);
    
    // Buscar dados direto do banco
    console.log('📡 Buscando dados direto do Supabase...');
    const plan = await WeeklyPlanService.getPlan(currentUser.id, false);
    
    if (plan) {
        console.log('✅ Dados encontrados:', plan);
        
        // Forçar atualização da UI
        console.log('🔄 Atualizando UI...');
        await carregarIndicadoresSemana();
        
        console.log('✅ UI atualizada com dados do banco');
    } else {
        console.error('❌ Nenhum dado encontrado no banco para esta semana');
        console.log('💡 Verifique se o usuário tem um planejamento criado');
    }
};

console.log('🛠️ Funções de validação carregadas:');
console.log('- validateAllFixes() - Validação completa das correções');
console.log('- testDataFlow() - Teste específico do fluxo de dados');