# 📋 CHECKLIST DE EXECUÇÃO - PONTOS DE ATENÇÃO

## 🟥 PRIORIDADE ALTA (Bloqueia Release)

### 1. GRAVAÇÃO EM LOTE ✅
```javascript
// ✅ IMPLEMENTADO em salvarExecucoesEmLote()
// TODO: Adicionar chunking e constraint UNIQUE

// services/workoutService.js - MELHORIAS NECESSÁRIAS:
export async function salvarExecucoesEmLote(execucoes) {
    const CHUNK_SIZE = 1000; // PostgreSQL limit
    
    // Dividir em chunks
    const chunks = [];
    for (let i = 0; i < execucoes.length; i += CHUNK_SIZE) {
        chunks.push(execucoes.slice(i, i + CHUNK_SIZE));
    }
    
    // Processar cada chunk
    for (const chunk of chunks) {
        const { data, error, status } = await insert('execucao_exercicio_usuario', chunk)
            .onConflict('usuario_id,exercicio_id,serie_numero,data_execucao')
            .merge(); // upsert
            
        // Tratar erro parcial (status 207)
        if (status === 207 && error?.details) {
            const failedRows = error.details.failed_rows;
            // Adicionar à fila de retry
            await offlineSyncService.addToSyncQueue(failedRows, 'execucoes_retry');
        }
    }
}
```

**AÇÕES:**
- [ ] Implementar chunking com limite de 1000 linhas
- [ ] Adicionar UNIQUE constraint no banco: `(usuario_id, exercicio_id, serie_numero, data_execucao)`
- [ ] Implementar tratamento de status 207 (partial success)
- [ ] Criar fila específica para retry de linhas falhadas

### 2. FLUXO "PRÓXIMO EXERCÍCIO" ✅
```javascript
// ✅ PARCIALMENTE IMPLEMENTADO
// TODO: Melhorar limpeza de timers e listeners

// feature/workout.js - ADICIONAR:
const activeTimers = new Set();
const activeListeners = new Map();

function limparTimersEListeners() {
    // Limpar todos os timers
    activeTimers.forEach(timerId => clearInterval(timerId));
    activeTimers.clear();
    
    // Limpar restTimerInterval específico
    const restTimer = AppState.get('restTimerInterval');
    if (restTimer) {
        clearInterval(restTimer);
        AppState.set('restTimerInterval', null);
    }
    
    // Remover listeners ao finalizar
    activeListeners.forEach((handler, event) => {
        window.removeEventListener(event, handler);
    });
    activeListeners.clear();
}

// Chamar em proximoExercicio() e finalizarTreino()
```

**AÇÕES:**
- [ ] Criar sistema centralizado de tracking de timers
- [ ] Limpar TODOS os intervals/timeouts ao mudar de exercício
- [ ] Remover listeners de beforeunload/visibilitychange ao finalizar
- [ ] Adicionar cleanup em caso de erro/exceção

### 3. OFFLINE SYNC SERVICE ✅
```javascript
// ✅ IMPLEMENTADO com retry básico
// TODO: Adicionar limite de tentativas e back-off

// services/offlineSyncService.js - MELHORIAS:
const MAX_RETRY_ATTEMPTS = 10;
const BASE_RETRY_DELAY = 1000; // 1 segundo

async syncItem(item) {
    // Validar tentativas
    if (item.attempts >= MAX_RETRY_ATTEMPTS) {
        console.error('[OfflineSync] Max tentativas excedidas:', item);
        // Mover para DLQ (Dead Letter Queue)
        await this.moveToDeadLetter(item);
        return false;
    }
    
    // Calcular delay com back-off exponencial
    const delay = Math.min(
        BASE_RETRY_DELAY * Math.pow(2, item.attempts),
        300000 // Max 5 minutos
    );
    
    // Aguardar antes de tentar
    if (item.attempts > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    // Tentar sincronizar...
}
```

**AÇÕES:**
- [ ] Implementar contador persistente de tentativas
- [ ] Adicionar back-off exponencial com jitter
- [ ] Criar Dead Letter Queue para itens que falharam 10x
- [ ] Adicionar métrica de itens em DLQ

### 4. RECOVERY MODAL ✅
```javascript
// ✅ IMPLEMENTADO básico
// TODO: Validar correspondência de treino

// components/workoutRecoveryModal.js - ADICIONAR:
function validarCacheCorrespondente(dadosRecuperados, treinoAtual) {
    // Comparar IDs
    if (dadosRecuperados.protocolo_treino_id !== treinoAtual.id) {
        return {
            valido: false,
            motivo: 'Treino diferente do planejado'
        };
    }
    
    // Comparar hash do planejamento
    const hashAtual = calcularHashPlanejamento(treinoAtual);
    if (dadosRecuperados.planejamento_hash !== hashAtual) {
        return {
            valido: false,
            motivo: 'Planejamento foi alterado'
        };
    }
    
    return { valido: true };
}

// No modal, adicionar validação:
const validacao = validarCacheCorrespondente(dadosRecuperados, treinoAtual);
if (!validacao.valido) {
    // Mostrar apenas opção de "Começar Novo"
    // com explicação do motivo
}
```

**AÇÕES:**
- [ ] Adicionar hash do planejamento ao salvar cache
- [ ] Validar correspondência antes de oferecer "Continuar"
- [ ] Mostrar motivo claro se cache for incompatível
- [ ] Opção forçada de "Descartar" se divergir

---

## 🟧 PRIORIDADE MÉDIA (Ideal antes de produção)

### 5. WORKOUT STATE MANAGER
```javascript
// Monitoramento de localStorage
function checkStorageUsage() {
    let totalSize = 0;
    for (let key in localStorage) {
        totalSize += localStorage[key].length + key.length;
    }
    
    const sizeMB = totalSize / 1024 / 1024;
    if (sizeMB > 4) {
        console.warn(`[Storage] Uso alto: ${sizeMB.toFixed(2)}MB`);
        // Limpar dados antigos
        cleanupOldData();
    }
}

// Sincronização entre abas
const channel = new BroadcastChannel('workout_sync');
channel.onmessage = (event) => {
    if (event.data.type === 'STATE_UPDATED') {
        // Sincronizar estado
    }
};
```

### 6. ANALYTICS
```javascript
// Buffer de eventos
const eventBuffer = [];
const BUFFER_SIZE = 10;
const BUFFER_TIMEOUT = 30000;

function bufferEvent(event) {
    eventBuffer.push(event);
    
    if (eventBuffer.length >= BUFFER_SIZE) {
        flushEvents();
    } else {
        scheduleFlush();
    }
}

// Anonimização
function anonymizeData(event) {
    // Remover dados pessoais
    delete event.data.email;
    delete event.data.nome;
    // Hash do user_id
    event.data.user_hash = hashUserId(event.data.user_id);
    delete event.data.user_id;
}
```

### 7. TESTES ADICIONAIS
```javascript
// Test: Race condition
test('handles simultaneous visibility and unload', async () => {
    const savespy = jest.spyOn(workoutStateManager, 'saveStateImmediate');
    
    // Disparar quase simultâneos
    document.dispatchEvent(new Event('visibilitychange'));
    setTimeout(() => {
        window.dispatchEvent(new Event('beforeunload'));
    }, 10);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Deve salvar apenas uma vez
    expect(savespy).toHaveBeenCalledTimes(1);
});

// Test: Chunking
test('splits large batches correctly', () => {
    const items = Array(2500).fill({ test: true });
    const chunks = chunkArray(items, 1000);
    
    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toHaveLength(1000);
    expect(chunks[2]).toHaveLength(500);
});
```

---

## 📊 MÉTRICAS DE SUCESSO

### KPIs para Monitorar:
1. **Taxa de sincronização offline**: > 95% em 24h
2. **Itens em DLQ**: < 0.1% do total
3. **Tempo médio de recovery**: < 3 segundos
4. **Taxa de conflitos de gravação**: < 0.01%
5. **Uso de localStorage**: < 5MB por usuário

### Alertas Críticos:
- [ ] Fila offline > 100 itens
- [ ] DLQ > 10 itens
- [ ] localStorage > 4MB
- [ ] Falha em chunk de gravação
- [ ] Recovery modal aparecendo > 5x/dia para mesmo usuário

---

## 🚀 ORDEM DE IMPLEMENTAÇÃO SUGERIDA

1. **HOJE**: Constraint UNIQUE + chunking
2. **AMANHÃ**: Limpeza de timers + validação de cache
3. **SEMANA**: DLQ + monitoramento de storage
4. **SPRINT**: Analytics com buffer + testes de race condition

---

## 🔍 COMANDOS ÚTEIS PARA VALIDAÇÃO

```bash
# Verificar constraints no banco
SELECT conname, contype, conkey 
FROM pg_constraint 
WHERE conrelid = 'execucao_exercicio_usuario'::regclass;

# Monitorar localStorage no console
Object.keys(localStorage).map(k => ({
    key: k, 
    size: (localStorage[k].length / 1024).toFixed(2) + 'KB'
})).sort((a,b) => parseFloat(b.size) - parseFloat(a.size));

# Debug de timers ativos
console.log('Active timers:', activeTimers.size);
console.log('Active listeners:', activeListeners.size);
```