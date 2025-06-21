# 📚 API Reference - Sistema de Persistência de Treino

## Visão Geral

Este documento fornece referência completa das APIs implementadas no sistema de persistência de treino, incluindo cache service, modais, navigation guards e componentes contextuais.

## 🗄️ TreinoCacheService

### Descrição
Serviço unificado de cache que gerencia persistência de dados de treino com TTL automático, validação de integridade e cleanup de dados expirados.

### Métodos Principais

#### `saveWorkoutState(data, isPartial = false)`
Salva estado do treino no localStorage com metadata de timestamp e versão.

**Parâmetros:**
- `data` (Object): Dados do treino a serem salvos
- `isPartial` (Boolean): Se true, indica save parcial (usado para auto-save)

**Retorna:** `Promise<boolean>` - true se salvou com sucesso

**Exemplo:**
```javascript
const workoutData = {
    currentWorkout: { id: 123, nome: 'Treino A' },
    exerciciosExecutados: [...],
    startTime: Date.now(),
    currentExerciseIndex: 2
};

const saved = await TreinoCacheService.saveWorkoutState(workoutData, true);
if (saved) {
    console.log('Treino salvo com sucesso');
}
```

#### `getWorkoutState()`
Recupera estado do treino do localStorage com validação automática de TTL.

**Retorna:** `Promise<Object|null>` - Dados do treino ou null se não existir/expirado

**Exemplo:**
```javascript
const workoutState = await TreinoCacheService.getWorkoutState();
if (workoutState) {
    console.log('Treino recuperado:', workoutState.currentWorkout.nome);
} else {
    console.log('Nenhum treino ativo encontrado');
}
```

#### `validateState(state)`
Valida integridade e estrutura dos dados de treino.

**Parâmetros:**
- `state` (Object): Estado a ser validado

**Retorna:** `boolean` - true se válido

**Validações realizadas:**
- Existência de campos obrigatórios
- Estrutura de dados correta
- TTL não expirado
- Versão da aplicação compatível

**Exemplo:**
```javascript
const state = await TreinoCacheService.getWorkoutState();
const isValid = TreinoCacheService.validateState(state);

if (!isValid) {
    console.warn('Estado corrompido, limpando cache');
    await TreinoCacheService.clearWorkoutState();
}
```

#### `hasActiveWorkout()`
Verifica se existe treino ativo válido no cache.

**Retorna:** `Promise<boolean>` - true se há treino ativo

**Exemplo:**
```javascript
const hasActive = await TreinoCacheService.hasActiveWorkout();
if (hasActive) {
    // Mostrar botão de "Continuar Treino"
} else {
    // Mostrar botão de "Iniciar Treino"
}
```

#### `clearWorkoutState()`
Remove dados de treino do cache.

**Retorna:** `Promise<boolean>` - true se removeu com sucesso

**Exemplo:**
```javascript
await TreinoCacheService.clearWorkoutState();
console.log('Cache limpo');
```

### Métodos de Utilidade

#### `getCacheAge()`
Retorna idade do cache em millisegundos.

**Retorna:** `number` - Idade em ms ou 0 se não existir

#### `isCacheExpired()`
Verifica se o cache está expirado (TTL padrão: 24h).

**Retorna:** `boolean` - true se expirado

#### `cleanupExpiredData()`
Remove automaticamente dados expirados do localStorage.

**Retorna:** `Promise<void>`

## 🚪 NavigationGuard

### Descrição
Sistema inteligente de proteção de dados durante navegação, com modais contextuais e fallbacks automáticos.

### Métodos Principais

#### `canNavigate(targetRoute, options = {})`
Verifica se navegação pode prosseguir, exibindo modais de confirmação se necessário.

**Parâmetros:**
- `targetRoute` (String): Rota de destino
- `options` (Object): Opções de configuração
  - `force` (Boolean): Força navegação sem proteção
  - `silent` (Boolean): Suprime logs de debug

**Retorna:** `Promise<boolean>` - true se pode navegar

**Exemplo:**
```javascript
const canProceed = await NavigationGuard.canNavigate('home-screen');
if (canProceed) {
    mostrarTela('home-screen');
} else {
    console.log('Navegação cancelada pelo usuário');
}
```

#### `checkForRecovery()`
Verifica se existe sessão para recuperar no startup da aplicação.

**Retorna:** `Promise<Object|null>` - Dados da sessão ou null

**Exemplo:**
```javascript
const sessionData = await NavigationGuard.checkForRecovery();
if (sessionData) {
    const result = await NavigationGuard.showRecoveryModal(sessionData);
    if (result.action === 'recover') {
        // Restaurar sessão
    }
}
```

#### `showRecoveryModal(sessionData)`
Exibe modal de recuperação de sessão com preview dos dados.

**Parâmetros:**
- `sessionData` (Object): Dados da sessão a ser recuperada

**Retorna:** `Promise<Object>` - Resultado com action e data

**Possíveis ações:**
- `'recover'`: Usuário escolheu recuperar
- `'discard'`: Usuário escolheu descartar
- `'cancel'`: Usuário cancelou

#### `configure(options)`
Configura comportamento do navigation guard.

**Parâmetros:**
- `options` (Object): Configurações
  - `enableModalConfirmation` (Boolean): Habilita modais de confirmação
  - `autoSaveBeforeExit` (Boolean): Auto-save antes de sair
  - `sessionTimeoutMs` (Number): Timeout da sessão em ms
  - `debugMode` (Boolean): Habilita logs detalhados

**Exemplo:**
```javascript
NavigationGuard.configure({
    enableModalConfirmation: true,
    autoSaveBeforeExit: true,
    sessionTimeoutMs: 86400000, // 24h
    debugMode: false
});
```

## 💾 AppState

### Descrição
Gerenciador centralizado de estado da aplicação com flags específicos para persistência de treino.

### Métodos de Persistência

#### `startWorkoutSession(workoutData, sessionId)`
Inicia nova sessão de treino com flags apropriados.

**Parâmetros:**
- `workoutData` (Object): Dados do treino
- `sessionId` (String): ID único da sessão (opcional)

**Exemplo:**
```javascript
AppState.startWorkoutSession(workout, 'session_123');
console.log('Sessão iniciada:', AppState.get('workoutSessionId'));
```

#### `markDataAsUnsaved()`
Marca dados como não salvos (usado durante edições).

#### `markDataAsSaved()`
Marca dados como salvos e atualiza timestamp.

#### `endWorkoutSession()`
Finaliza sessão de treino e limpa flags.

#### `getWorkoutSessionInfo()`
Retorna informações completas da sessão atual.

**Retorna:** `Object` com:
- `isActive`: Sessão ativa
- `hasUnsavedData`: Dados não salvos
- `sessionId`: ID da sessão
- `startTime`: Timestamp de início
- `lastSave`: Último save
- `duration`: Duração em ms

## 🎯 ContextualWorkoutButton

### Descrição
Botão inteligente com 6 estados dinâmicos baseados no cache e contexto do treino.

### Estados Disponíveis

#### `loading`
Estado inicial durante verificação de cache.
- **Texto**: "Carregando..."
- **Ícone**: ⏳
- **Ação**: null (disabled)

#### `start`
Nenhum treino ativo detectado.
- **Texto**: "Iniciar Treino"
- **Ícone**: ▶️
- **Ação**: `startWorkout`

#### `resume`
Treino em andamento no cache.
- **Texto**: "Voltar ao Treino"
- **Ícone**: 🔄
- **Ação**: `resumeWorkout`
- **Subtitle**: "{progress}% concluído • {timeElapsed}"

#### `complete`
Treino finalizado hoje.
- **Texto**: "Treino Concluído"
- **Ícone**: ✅
- **Ação**: `viewResults`
- **Estado**: disabled

#### `rest`
Dia de descanso programado.
- **Texto**: "Dia de Descanso"
- **Ícone**: 😴
- **Ação**: null (disabled)

#### `error`
Erro no cache ou dados corrompidos.
- **Texto**: "Erro no Cache"
- **Ícone**: ⚠️
- **Ação**: `clearCache`

### Métodos Principais

#### `constructor(element, options)`
Cria instância do botão contextual.

**Parâmetros:**
- `element` (HTMLElement|String): Elemento ou seletor
- `options` (Object): Configurações
  - `updateInterval` (Number): Intervalo de atualização em ms
  - `enableAutoUpdate` (Boolean): Habilita updates automáticos
  - `showProgress` (Boolean): Mostra progresso no subtitle
  - `showTimeElapsed` (Boolean): Mostra tempo decorrido

#### `updateStateFromCache()`
Força atualização do estado baseado no cache atual.

**Retorna:** `Promise<void>`

#### `forceUpdate()`
Força atualização manual do botão.

#### `destroy()`
Limpa recursos e event listeners.

### Eventos

#### `workout-button-state-change`
Disparado quando estado do botão muda.

**Detail:**
- `newState`: Novo estado
- `data`: Dados do estado
- `oldState`: Estado anterior
- `element`: Elemento do botão

**Exemplo:**
```javascript
document.addEventListener('workout-button-state-change', (event) => {
    const { newState, data } = event.detail;
    console.log(`Botão mudou para: ${newState}`);
    
    if (newState === 'resume') {
        console.log(`Progresso: ${data.progress}%`);
    }
});
```

## 🎭 Modal Components

### SaveExitModal

#### Descrição
Modal WCAG 2.2 compliant para confirmação de saída durante treino ativo.

#### Método Principal

#### `show()`
Exibe modal e retorna Promise com decisão do usuário.

**Retorna:** `Promise<String>` com opções:
- `'save-exit'`: Salvar e sair
- `'exit-no-save'`: Sair sem salvar
- `'cancel'`: Cancelar

**Exemplo:**
```javascript
const modal = new SaveExitModal(workoutState);
const decision = await modal.show();

switch (decision) {
    case 'save-exit':
        await saveWorkout();
        navigate();
        break;
    case 'exit-no-save':
        navigate();
        break;
    case 'cancel':
        // Permanecer na tela
        break;
}
```

### SessionRecoveryModal

#### Descrição
Modal para recuperação de sessão com preview detalhado dos dados.

#### Método Principal

#### `show()`
Exibe modal de recuperação com preview da sessão.

**Retorna:** `Promise<String>` com opções:
- `'recover'`: Recuperar sessão
- `'discard'`: Descartar dados
- `'cancel'`: Cancelar

**Preview inclui:**
- Nome do treino
- Progresso (exercícios completados)
- Tempo decorrido
- Timestamp da última atividade

## 🔧 Utility Functions

### Funções de Conveniência

#### `runMandatoryTests()`
Executa todos os testes obrigatórios da suite.

**Retorna:** `Promise<Object>` - Relatório completo

#### `runWorkoutInterruptionTest()`
Executa apenas teste de interrupção e recuperação.

#### `runAccessibilityTest()`
Executa validação de acessibilidade WCAG 2.2.

#### `runPerformanceTest()`
Executa testes de performance do cache.

#### `runOfflineTest()`
Executa testes de funcionalidade offline.

### Debug Functions

#### `getContextualButtonInstance()`
Retorna instância atual do botão contextual.

#### `NavigationGuard.getDebugInfo()`
Retorna informações de debug do navigation guard.

#### `AppState.getWorkoutSessionInfo()`
Retorna informações completas da sessão.

## 📊 Performance Targets

### Cache Operations
- **Write P95**: < 100ms
- **Read P95**: < 50ms  
- **Validate P95**: < 10ms

### UI Operations
- **Modal Open**: < 300ms
- **Button Update**: < 16ms (60fps)
- **State Change**: < 50ms

### Storage Limits
- **TTL**: 24 horas padrão
- **Quota**: Graceful degradation quando excedida
- **Auto-cleanup**: Dados expirados removidos automaticamente

## 🚨 Error Handling

### Padrões de Erro

Todos os métodos seguem padrões consistentes:

1. **Try/Catch**: Operações assíncronas protegidas
2. **Fallbacks**: Múltiplas estratégias de recuperação
3. **Logging**: Erros sempre logados com contexto
4. **Graceful Degradation**: Sistema continua funcionando

### Tipos de Erro Comuns

#### `QuotaExceededError`
Storage quota do localStorage excedida.

**Handling:**
```javascript
try {
    await TreinoCacheService.saveWorkoutState(data);
} catch (error) {
    if (error.name === 'QuotaExceededError') {
        // Limpar dados antigos e tentar novamente
        await TreinoCacheService.cleanupExpiredData();
        await TreinoCacheService.saveWorkoutState(data);
    }
}
```

#### `ValidationError`
Dados de treino corrompidos ou inválidos.

**Handling:** Limpeza automática do cache e reinicialização.

#### `ImportError`
Falha ao carregar módulos dinamicamente.

**Handling:** Fallback para implementação básica.

## 🎯 Best Practices

### Cache Usage
1. **Always validate** dados recuperados do cache
2. **Handle expiration** adequadamente
3. **Cleanup expired data** periodicamente
4. **Use TTL appropriate** para o contexto

### Navigation
1. **Always check** se pode navegar antes de mudar tela
2. **Handle user decisions** apropriadamente
3. **Provide fallbacks** para casos de erro
4. **Log navigation events** para debug

### Modal Usage
1. **Follow WCAG 2.2** guidelines
2. **Implement focus trap** obrigatório
3. **Handle ESC key** sempre
4. **Provide clear actions** para o usuário

### State Management
1. **Use flags appropriately** para indicar estados
2. **Subscribe to changes** quando necessário
3. **Clean up subscriptions** ao destruir componentes
4. **Keep state minimal** e focused

---

**Nota**: Esta API está em constante evolução. Consulte sempre a versão mais recente da documentação e os testes para exemplos atualizados de uso.