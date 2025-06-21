/**
 * Script para debugar e verificar disponibilidade do TreinoCacheService
 */

function debugCacheService() {
    console.log('🔍 DEBUG CACHE SERVICE');
    console.log('======================\n');
    
    // 1. Verificar disponibilidade global
    console.log('1️⃣ Verificando disponibilidade global:');
    console.log({
        'window.TreinoCacheService': !!window.TreinoCacheService,
        'window.workoutPersistence': !!window.workoutPersistence,
        'localStorage disponível': typeof localStorage !== 'undefined'
    });
    
    // 2. Tentar encontrar o serviço
    console.log('\n2️⃣ Procurando serviços de cache:');
    
    const possibleLocations = [
        'TreinoCacheService',
        'workoutPersistence',
        'WorkoutPersistence',
        'cacheService',
        'CacheService'
    ];
    
    const found = [];
    possibleLocations.forEach(loc => {
        if (window[loc]) {
            found.push(loc);
            console.log(`✅ Encontrado: window.${loc}`);
            
            // Verificar métodos disponíveis
            if (typeof window[loc] === 'object') {
                const methods = Object.getOwnPropertyNames(window[loc])
                    .filter(prop => typeof window[loc][prop] === 'function');
                console.log(`   Métodos:`, methods);
            }
        }
    });
    
    if (found.length === 0) {
        console.log('❌ Nenhum serviço de cache encontrado globalmente');
    }
    
    // 3. Verificar imports em módulos carregados
    console.log('\n3️⃣ Verificando módulos carregados:');
    
    // Verificar se o manager tem o serviço
    if (window.workoutExecutionManager) {
        console.log('✅ workoutExecutionManager encontrado');
        
        // Procurar referências ao cache
        const managerKeys = Object.keys(window.workoutExecutionManager);
        const cacheRelated = managerKeys.filter(key => 
            key.toLowerCase().includes('cache') || 
            key.toLowerCase().includes('persist')
        );
        
        if (cacheRelated.length > 0) {
            console.log('   Propriedades relacionadas a cache:', cacheRelated);
        }
    }
    
    // 4. Verificar localStorage diretamente
    console.log('\n4️⃣ Verificando localStorage:');
    
    const workoutKeys = Object.keys(localStorage).filter(key => 
        key.includes('workout') || key.includes('treino')
    );
    
    if (workoutKeys.length > 0) {
        console.log('✅ Chaves de treino encontradas:', workoutKeys);
        
        workoutKeys.forEach(key => {
            const value = localStorage.getItem(key);
            try {
                const parsed = JSON.parse(value);
                console.log(`   ${key}:`, typeof parsed === 'object' ? 
                    Object.keys(parsed).slice(0, 5).join(', ') + '...' : 
                    value.substring(0, 50) + '...'
                );
            } catch {
                console.log(`   ${key}:`, value?.substring(0, 50) + '...');
            }
        });
    } else {
        console.log('❌ Nenhuma chave de treino no localStorage');
    }
    
    // 5. Solução temporária
    console.log('\n5️⃣ Criando wrapper temporário para testes:');
    
    if (!window.TreinoCacheService && !window.workoutPersistence) {
        window.TreinoCacheService = {
            saveWorkoutState: async (state) => {
                console.log('[TEMP] Salvando estado:', state);
                localStorage.setItem('workout_state', JSON.stringify(state));
                localStorage.setItem('workout_cache_timestamp', Date.now().toString());
                
                // Disparar evento para atualizar UI
                window.dispatchEvent(new CustomEvent('workout-cache-updated', {
                    detail: { state, timestamp: Date.now() }
                }));
                
                return true;
            },
            
            getWorkoutState: async () => {
                const state = localStorage.getItem('workout_state');
                return state ? JSON.parse(state) : null;
            },
            
            clearWorkoutState: async () => {
                localStorage.removeItem('workout_state');
                localStorage.removeItem('workout_cache_timestamp');
                
                window.dispatchEvent(new CustomEvent('workout-cache-updated', {
                    detail: { state: null, cleared: true }
                }));
            },
            
            hasActiveWorkout: async () => {
                return !!localStorage.getItem('workout_state');
            }
        };
        
        console.log('✅ Wrapper temporário criado em window.TreinoCacheService');
        console.log('   Métodos disponíveis:', Object.keys(window.TreinoCacheService));
    }
    
    // 6. Testar funcionalidade
    console.log('\n6️⃣ Testando funcionalidade:');
    
    async function testCacheFunctions() {
        try {
            const service = window.TreinoCacheService || window.workoutPersistence;
            
            if (!service) {
                console.log('❌ Nenhum serviço disponível para teste');
                return;
            }
            
            // Teste de escrita
            const testData = {
                test: true,
                timestamp: Date.now(),
                message: 'Teste de cache'
            };
            
            if (service.saveWorkoutState) {
                await service.saveWorkoutState(testData);
                console.log('✅ Teste de escrita bem-sucedido');
            }
            
            // Teste de leitura
            if (service.getWorkoutState) {
                const retrieved = await service.getWorkoutState();
                console.log('✅ Teste de leitura:', retrieved?.test === true ? 'OK' : 'Falhou');
            }
            
            // Teste de limpeza
            if (service.clearWorkoutState) {
                await service.clearWorkoutState();
                console.log('✅ Teste de limpeza executado');
            }
            
        } catch (error) {
            console.error('❌ Erro nos testes:', error);
        }
    }
    
    testCacheFunctions();
    
    console.log('\n🎯 RESUMO:');
    console.log('Use window.TreinoCacheService para acessar o serviço de cache');
    console.log('Execute testRecoverySystem() novamente após este debug');
}

// Executar automaticamente
debugCacheService();

// Exportar para uso posterior
window.debugCacheService = debugCacheService;