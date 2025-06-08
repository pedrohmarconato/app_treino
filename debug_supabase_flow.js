// Debug script para testar fluxo completo de dados Supabase
// Use no console do browser: debugSupabaseFlow()

window.debugSupabaseFlow = async function() {
    console.log('🔍 INICIANDO DEBUG DO FLUXO SUPABASE');
    
    const currentUser = AppState.get('currentUser');
    if (!currentUser?.id) {
        console.error('❌ Usuário não encontrado no AppState');
        return { error: 'Usuário não logado' };
    }
    
    console.log('👤 Usuário atual:', currentUser);
    
    const results = {};
    
    try {
        // 1. Testar view v_planejamento_completo
        console.log('\n📊 1. Testando view v_planejamento_completo...');
        try {
            const { data: viewData, error: viewError } = await supabase
                .from('v_planejamento_completo')
                .select('*')
                .eq('usuario_id', currentUser.id)
                .limit(1);
            
            if (viewError) {
                console.warn('⚠️ View não existe ou tem erro:', viewError.message);
                results.view_exists = false;
                results.view_error = viewError.message;
            } else {
                console.log('✅ View funciona, exemplo de dados:', viewData);
                results.view_exists = true;
                results.view_sample = viewData;
            }
        } catch (e) {
            console.error('❌ Erro ao testar view:', e);
            results.view_exists = false;
            results.view_error = e.message;
        }
        
        // 2. Testar tabela planejamento_semanal
        console.log('\n📋 2. Testando tabela planejamento_semanal...');
        const { data: tableData, error: tableError } = await supabase
            .from('planejamento_semanal')
            .select('*')
            .eq('usuario_id', currentUser.id)
            .limit(5);
        
        if (tableError) {
            console.error('❌ Erro na tabela base:', tableError);
            results.table_error = tableError.message;
        } else {
            console.log('✅ Tabela base funciona, dados:', tableData);
            results.table_data = tableData;
            results.table_count = tableData.length;
        }
        
        // 3. Testar WeeklyPlanService.getPlan
        console.log('\n🔄 3. Testando WeeklyPlanService.getPlan...');
        const planResult = await WeeklyPlanService.getPlan(currentUser.id, false);
        console.log('📊 Resultado do getPlan:', planResult);
        results.plan_service_result = planResult;
        
        // 4. Testar getTodaysWorkout
        console.log('\n🏋️ 4. Testando getTodaysWorkout...');
        const workoutResult = await WeeklyPlanService.getTodaysWorkout(currentUser.id);
        console.log('💪 Resultado do getTodaysWorkout:', workoutResult);
        results.workout_result = workoutResult;
        
        // 5. Testar carregamento dos indicadores
        console.log('\n📅 5. Testando carregamento dos indicadores...');
        try {
            await carregarIndicadoresSemana();
            console.log('✅ Indicadores carregados com sucesso');
            results.indicators_loaded = true;
        } catch (e) {
            console.error('❌ Erro ao carregar indicadores:', e);
            results.indicators_error = e.message;
        }
        
        // 6. Verificar estado atual do AppState
        console.log('\n🗂️ 6. Estado atual do AppState...');
        const weekPlan = AppState.get('weekPlan');
        const currentWorkout = AppState.get('currentWorkout');
        console.log('📊 WeekPlan no estado:', weekPlan);
        console.log('💪 CurrentWorkout no estado:', currentWorkout);
        results.app_state = {
            weekPlan: weekPlan,
            currentWorkout: currentWorkout
        };
        
        // 7. Resumo e diagnóstico
        console.log('\n📋 RESUMO DO DIAGNÓSTICO:');
        console.log('View existe:', results.view_exists);
        console.log('Dados na tabela:', results.table_count || 0);
        console.log('Service retornou plano:', !!results.plan_service_result);
        console.log('Workout do dia:', !!results.workout_result);
        console.log('Indicadores carregados:', !!results.indicators_loaded);
        
        // Sugestões de correção
        console.log('\n💡 SUGESTÕES:');
        if (!results.view_exists) {
            console.log('1. ⚠️ Criar view v_planejamento_completo no Supabase');
        }
        if (!results.table_count) {
            console.log('2. ⚠️ Criar planejamento semanal para o usuário');
        }
        if (!results.plan_service_result) {
            console.log('3. ⚠️ Verificar se o usuário tem dados na semana atual');
        }
        
        console.log('\n✅ DEBUG COMPLETO!');
        return results;
        
    } catch (error) {
        console.error('❌ ERRO CRÍTICO NO DEBUG:', error);
        results.critical_error = error.message;
        return results;
    }
};

// Função de teste rápido
window.testSupabaseConnection = async function() {
    console.log('🔍 Teste rápido de conexão Supabase');
    
    try {
        const { data, error } = await supabase
            .from('usuarios')
            .select('id, nome')
            .limit(1);
        
        if (error) {
            console.error('❌ Erro de conexão:', error);
            return false;
        }
        
        console.log('✅ Conexão OK, exemplo:', data);
        return true;
    } catch (e) {
        console.error('❌ Erro crítico:', e);
        return false;
    }
};

console.log('🛠️ Funções de debug carregadas:');
console.log('- debugSupabaseFlow() - Diagnóstico completo');
console.log('- testSupabaseConnection() - Teste rápido');