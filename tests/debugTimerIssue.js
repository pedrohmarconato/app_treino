// Script para debug do problema do timer mostrando NaN:NaN
console.log('=== DEBUG TIMER ISSUE ===');

// Simular situação de recuperação
function debugTimerRecovery() {
    console.log('1. Simulando recuperação de estado...');
    
    // Criar mock do AppState
    const mockAppState = {
        data: {},
        get(key) {
            console.log(`[AppState.get] Solicitado: ${key}, valor:`, this.data[key]);
            return this.data[key];
        },
        set(key, value) {
            console.log(`[AppState.set] Definido: ${key} = ${value}`);
            this.data[key] = value;
        }
    };
    
    // Simular estado recuperado do cache
    const estadoRecuperado = {
        cronometro: {
            workoutStartTime: Date.now() - (15 * 60 * 1000), // 15 min atrás
            restTime: 0,
            restTimerInterval: false
        }
    };
    
    console.log('2. Estado do cronômetro recuperado:', estadoRecuperado.cronometro);
    
    // Simular restauração
    console.log('3. Restaurando workoutStartTime...');
    const startTime = Number(estadoRecuperado.cronometro.workoutStartTime);
    console.log('   - Valor original:', estadoRecuperado.cronometro.workoutStartTime);
    console.log('   - Após Number():', startTime);
    console.log('   - É NaN?', isNaN(startTime));
    console.log('   - Tipo:', typeof startTime);
    console.log('   - É válido?', !isNaN(startTime) && startTime > 0);
    
    if (!isNaN(startTime) && startTime > 0) {
        mockAppState.set('workoutStartTime', startTime);
    }
    
    // Simular cálculo do timer
    console.log('4. Simulando updateTimer...');
    const currentStartTime = mockAppState.get('workoutStartTime');
    const now = Date.now();
    const elapsed = Math.floor((now - currentStartTime) / 1000);
    
    console.log('   - currentStartTime:', currentStartTime);
    console.log('   - now:', now);
    console.log('   - elapsed (segundos):', elapsed);
    console.log('   - elapsed é NaN?', isNaN(elapsed));
    
    if (isNaN(elapsed) || elapsed < 0) {
        console.error('   ❌ ERRO: Elapsed time inválido!');
    } else {
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        console.log('   ✅ Timer formatado:', timeString);
    }
    
    // Verificar problemas comuns
    console.log('\n5. Verificação de problemas comuns:');
    console.log('   - workoutStartTime é undefined?', currentStartTime === undefined);
    console.log('   - workoutStartTime é null?', currentStartTime === null);
    console.log('   - workoutStartTime é string?', typeof currentStartTime === 'string');
    console.log('   - workoutStartTime é objeto?', typeof currentStartTime === 'object');
    
    // Testar conversão de diferentes tipos
    console.log('\n6. Testando conversões:');
    const testValues = [
        undefined,
        null,
        '',
        '1234567890',
        new Date().getTime(),
        new Date().toISOString(),
        { time: 123456 },
        [123456]
    ];
    
    testValues.forEach((val, idx) => {
        const converted = Number(val);
        console.log(`   Teste ${idx + 1}: ${JSON.stringify(val)} -> ${converted} (NaN? ${isNaN(converted)})`);
    });
}

// Executar debug
debugTimerRecovery();

// Verificar localStorage
console.log('\n7. Verificando localStorage:');
if (typeof localStorage !== 'undefined') {
    const keys = ['treino_unified_state', 'treino_cronometro_temp', 'treino_tempo_temp'];
    keys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
            try {
                const parsed = JSON.parse(value);
                console.log(`   ${key}:`, parsed);
            } catch (e) {
                console.log(`   ${key}: erro ao parsear`);
            }
        } else {
            console.log(`   ${key}: não encontrado`);
        }
    });
} else {
    console.log('   localStorage não disponível neste ambiente');
}

console.log('\n=== FIM DO DEBUG ===');