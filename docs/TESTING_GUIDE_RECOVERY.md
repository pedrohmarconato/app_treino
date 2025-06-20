# Guia de Teste - Sistema de Recuperação de Treino

## Passo a Passo para Teste Correto

### 1. Preparação do Ambiente

#### 1.1 Limpar Estado Anterior
```javascript
// Execute no console do navegador
localStorage.clear();
sessionStorage.clear();
location.reload();
```

#### 1.2 Verificar Dependências
```javascript
// Verificar se todos os componentes estão carregados
console.log({
    workoutManager: !!window.workoutExecutionManager,
    cacheService: !!window.TreinoCacheService,
    contextualButton: !!document.querySelector('#contextual-workout-btn'),
    renderTemplate: typeof window.renderTemplate
});
```

### 2. Criar um Treino de Teste

#### 2.1 Iniciar Treino
1. Na tela inicial, clique em "Iniciar Treino"
2. Aguarde a tela de treino carregar completamente
3. Verifique se o cronômetro está funcionando (canto superior direito)

#### 2.2 Executar Algumas Séries
1. Complete pelo menos 2-3 séries de exercícios
2. **IMPORTANTE**: Aguarde o modal de descanso aparecer após cada série
3. Deixe o descanso completar ou pule após alguns segundos
4. Verifique o progresso sendo atualizado (ex: "2/6 séries")

### 3. Salvar o Treino Corretamente

#### 3.1 Processo de Salvamento
1. **NÃO** use o botão voltar do navegador
2. **NÃO** recarregue a página diretamente
3. Use um dos métodos abaixo:

**Método A - Salvar e Sair (Recomendado):**
```javascript
// Execute no console durante o treino
await window.workoutExecutionManager.salvarESair();
```

**Método B - Via Interface:**
1. Clique no botão de menu/opções
2. Selecione "Salvar e Sair"
3. Confirme no modal que aparecer

#### 3.2 Verificar Salvamento
```javascript
// Verificar se foi salvo corretamente
const cache = await TreinoCacheService.getWorkoutState();
console.log('Treino salvo:', {
    temCache: !!cache,
    exerciciosExecutados: cache?.exerciciosExecutados?.length || 0,
    tempoDecorrido: cache?.startTime ? Date.now() - cache.startTime : 0
});
```

### 4. Testar Recuperação

#### 4.1 Voltar à Tela Inicial
Após salvar, você deve ser redirecionado automaticamente. Se não:
```javascript
window.location.href = '/';
```

#### 4.2 Verificar Botão Contextual
1. O botão deve mostrar "Voltar ao Treino"
2. Deve exibir o progresso (ex: "33% concluído • 15 min")
3. Se não aparecer, aguarde 2-3 segundos ou execute:
```javascript
// Forçar atualização do botão
if (window.contextualWorkoutButton) {
    await window.contextualWorkoutButton.forceUpdate();
}
```

#### 4.3 Clicar para Recuperar
1. Clique no botão "Voltar ao Treino"
2. Aguarde o indicador de carregamento
3. A tela de treino deve aparecer com:
   - Exercícios já completados marcados
   - Progresso restaurado
   - Cronômetro continuando de onde parou

### 5. Troubleshooting

#### 5.1 Se o Botão Não Mudar para "Voltar ao Treino"
```javascript
// Debug do estado do botão
const button = document.querySelector('#contextual-workout-btn');
console.log({
    estado: button?.getAttribute('data-state'),
    acao: button?.getAttribute('data-action'),
    texto: button?.innerText
});

// Verificar cache
debugWorkoutCache();
```

#### 5.2 Se Clicar e Nada Acontecer
```javascript
// Verificar erros no console
// Procure por mensagens com [WorkoutExecution] ou [ContextualWorkoutButton]

// Testar navegação manualmente
await window.workoutExecutionManager.navegarParaTelaWorkout();
```

#### 5.3 Se a Tela Aparecer Vazia
```javascript
// Verificar se o estado foi carregado
console.log('Estado atual:', window.workoutExecutionManager.currentWorkout);

// Forçar renderização
await window.workoutExecutionManager.renderizar();
```

### 6. Cenários de Teste Completos

#### Cenário 1: Fluxo Básico
1. Iniciar treino novo
2. Completar 2 séries
3. Salvar e sair via interface
4. Clicar em "Voltar ao Treino"
5. Verificar se continua de onde parou

#### Cenário 2: Interrupção por Tempo
1. Iniciar treino
2. Completar 1 série
3. Aguardar 2 minutos (simular pausa)
4. Salvar via console: `await workoutExecutionManager.salvarProgresso()`
5. Recarregar página: `location.reload()`
6. Clicar em "Voltar ao Treino"

#### Cenário 3: Múltiplas Interrupções
1. Iniciar treino
2. Completar 1 série, salvar e sair
3. Voltar ao treino
4. Completar mais 2 séries, salvar e sair
5. Voltar ao treino novamente
6. Verificar se todo progresso está correto

### 7. Comandos Úteis para Debug

```javascript
// Estado completo do sistema
async function debugSystemState() {
    const state = {
        cache: await TreinoCacheService.getWorkoutState(),
        hasActive: await TreinoCacheService.hasActiveWorkout(),
        appState: AppState.get('isWorkoutActive'),
        currentScreen: document.querySelector('.screen.active')?.id,
        buttonState: document.querySelector('#contextual-workout-btn')?.getAttribute('data-state')
    };
    console.table(state);
    return state;
}

// Limpar tudo e começar do zero
function resetEverything() {
    localStorage.clear();
    sessionStorage.clear();
    location.reload();
}

// Simular salvamento durante treino
async function quickSave() {
    if (window.workoutExecutionManager?.salvarProgresso) {
        await window.workoutExecutionManager.salvarProgresso();
        console.log('✅ Progresso salvo');
    } else {
        console.error('❌ Manager não disponível');
    }
}
```

### 8. Validação Final

Após recuperar o treino com sucesso, verifique:

- [ ] Cronômetro está funcionando
- [ ] Exercícios completados estão marcados
- [ ] Progresso está correto (séries e exercícios)
- [ ] Botão "Próximo Exercício" funciona
- [ ] Modal de descanso aparece após completar série
- [ ] Pode continuar o treino normalmente

### 9. Logs Esperados

Durante um fluxo correto, você deve ver no console:

```
[WorkoutExecution] 💾 Salvando progresso do treino...
[WorkoutExecution] ✅ Progresso salvo com sucesso
[ContextualWorkoutButton] Cache atualizado, verificando estado...
[ContextualWorkoutButton] Estado alterado: start → resume
[WorkoutExecution] 📱 Navegando para tela de workout...
[WorkoutExecution] ✅ Navegação concluída - tela visível
[WorkoutExecution] 🔄 Recuperando treino do cache...
[WorkoutExecution] ✅ Treino recuperado com sucesso
```

### 10. Problemas Comuns e Soluções

| Problema | Causa | Solução |
|----------|-------|---------|
| Botão não muda para "Voltar ao Treino" | Cache não foi salvo corretamente | Use `salvarESair()` ao invés de recarregar |
| Clica mas não navega | Erro de Promise no renderTemplate | Fix já aplicado na versão atual |
| Tela de treino vazia | Estado não foi restaurado | Verificar se `resumeFromCache` completou |
| Progresso incorreto | Cálculo considerando séries ao invés de exercícios | Fix já aplicado |
| Modal de descanso não aparece | Conflito de IDs com template | Fix já aplicado |

## Resumo

Para evitar problemas:
1. **SEMPRE** use os métodos corretos para salvar
2. **NUNCA** recarregue a página durante o treino
3. **AGUARDE** as animações e transições completarem
4. **VERIFIQUE** o console para mensagens de erro
5. **USE** os comandos de debug quando necessário

Este guia garante que você teste o fluxo correto e identifique problemas reais vs problemas de uso incorreto.