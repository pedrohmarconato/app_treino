# 🕐 PROBLEMA: Timer mostrando "NaN:NaN" durante recuperação

## SINTOMAS
- Ao recuperar um treino em andamento, o timer no header mostra "NaN:NaN"
- Séries e repetições são recuperadas corretamente
- Animações funcionam perfeitamente
- Apenas o cronômetro apresenta erro
- Console mostra: `[AppState] Tentativa de definir workoutStartTime inválido: NaN tipo: number`

## CAUSA RAIZ IDENTIFICADA
O problema ocorre em `workout.js` linha 220:
```javascript
const tempoTotal = dados.tempo + tempoDecorrido;
AppState.set('workoutStartTime', Date.now() - (tempoTotal * 1000));
```

Se `dados.tempo` for `undefined` ou inválido, `tempoTotal` se torna `NaN`, resultando em:
- `NaN * 1000` = `NaN`
- `Date.now() - NaN` = `NaN`

## CAUSAS POSSÍVEIS

### 1. workoutStartTime inválido
- Valor sendo salvo como string ISO em vez de timestamp numérico
- Valor undefined ou null sendo convertido para NaN
- Conversão incorreta durante restauração

### 2. Problema de timing do DOM
- Elemento #workout-timer-display não existe quando timer tenta atualizar
- Tela ainda não renderizada completamente durante recuperação

### 3. Estado corrompido no cache
- workoutStartTime salvo incorretamente no localStorage
- Problema na serialização/deserialização do estado

## SOLUÇÕES IMPLEMENTADAS

### 1. Validação robusta do workoutStartTime
```javascript
// Em startWorkoutTimer()
if (!startTime || isNaN(startTime) || typeof startTime !== 'number') {
    console.warn('[startWorkoutTimer] startTime inválido:', startTime);
    startTime = Date.now();
    AppState.set('workoutStartTime', startTime);
}
```

### 2. Garantir que sempre salvamos números
```javascript
// Em workoutStateManager.js
cronometro: {
    workoutStartTime: Number(window.AppState.get('workoutStartTime')) || null
}
```

### 3. Validação no AppState
```javascript
// Em appState.js
if (key === 'workoutStartTime' && value !== null) {
    const numValue = Number(value);
    if (isNaN(numValue) || numValue <= 0) {
        console.error('[AppState] workoutStartTime inválido:', value);
        return;
    }
    value = numValue;
}
```

### 4. Aguardar DOM e retry
```javascript
// Verificar se DOM está pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startTimer);
}

// Retry se elemento não encontrado
setTimeout(() => {
    const retryDisplay = document.getElementById('workout-timer-display');
    if (retryDisplay) {
        retryDisplay.textContent = timeString;
    }
}, 500);
```

### 5. Delay na recuperação
```javascript
// Aguardar DOM estar pronto antes de iniciar timer
setTimeout(() => {
    startWorkoutTimer();
    mostrarExercicioAtual();
    restaurarSeriesCompletadas();
}, 150);
```

## LOGS DE DEBUG

Para debugar o problema, verificar no console:

1. **Ao salvar estado:**
   - `[WorkoutStateManager] Restaurando cronometro:` - deve mostrar workoutStartTime numérico

2. **Ao restaurar:**
   - `[iniciarTreino] workoutStartTime restaurado:` - deve ser número válido
   - `[startWorkoutTimer] Iniciando timer com startTime:` - deve ser timestamp

3. **Se houver erro:**
   - `[startWorkoutTimer] startTime inválido:` - indica conversão falhou
   - `[startWorkoutTimer] Elapsed time inválido:` - problema no cálculo
   - `[AppState] Tentativa de definir workoutStartTime inválido:` - valor incorreto

## TESTE MANUAL

1. Iniciar treino e fazer algumas séries
2. Sair da tela (F5 ou navegar)
3. Voltar e escolher "Continuar treino"
4. Timer deve mostrar tempo correto (não NaN:NaN)

## PREVENÇÃO

1. **Sempre usar timestamps numéricos** - nunca strings ISO
2. **Validar antes de salvar** - garantir que é número válido
3. **Validar ao restaurar** - converter e verificar NaN
4. **Aguardar DOM** - não assumir que elementos existem
5. **Logs detalhados** - facilitar debug futuro