# 🧪 Test Suite - Sistema de Persistência de Treino

## Visão Geral

Esta suite de testes abrangente valida todos os aspectos críticos do sistema de persistência de treino, incluindo interrupção/recuperação, acessibilidade, performance e funcionalidade offline.

## 📋 Testes Obrigatórios (ETAPA 7)

### 1. **Workout Interruption Recovery** ✅
- **Cenário**: Iniciar treino → Sair → Voltar (dados preservados)
- **Arquivo**: `workoutFlowTests.js`
- **Validações**:
  - Dados de progresso preservados durante interrupção
  - Navigation guard bloqueia saída não intencional
  - Recuperação automática de sessão
  - Estado do AppState mantido corretamente

### 2. **Cross-Tab Session Recovery** ✅
- **Cenário**: Treino em andamento → Fechar aba → Reabrir (recuperação automática)
- **Arquivo**: `workoutFlowTests.js`
- **Validações**:
  - Sincronização entre abas via storage events
  - Recuperação de sessão em nova aba
  - Integridade dos dados preservada

### 3. **Storage Quota Handling** ✅
- **Cenário**: Cache cheio → Salvamento (graceful degradation)
- **Arquivo**: `performanceTestSuite.js`
- **Validações**:
  - Detecção de quota excedida
  - Degradação graciosa sem falhas críticas
  - Limpeza automática de dados antigos

### 4. **Complete Offline Functionality** ✅
- **Cenário**: Sem internet → Funcionamento offline completo
- **Arquivo**: `offlineTestSuite.js`
- **Validações**:
  - Todas as operações de cache funcionam offline
  - Fluxo completo de treino sem internet
  - UI permanece funcional offline
  - Recuperação adequada ao voltar online

### 5. **Accessibility Compliance** ✅
- **Cenário**: Navegação por teclado → Todos os modais acessíveis
- **Arquivo**: `accessibilityValidator.js`
- **Validações**:
  - Modais conformes com WCAG 2.2
  - Navegação por teclado completa
  - ARIA labels e roles adequados
  - Focus trap funcionando

## 🚀 Como Executar os Testes

### Execução Completa (Todos os Testes Obrigatórios)
```javascript
// No console do navegador
const report = await runMandatoryTests();
console.log(report);
```

### Testes Individuais

#### 1. Teste de Interrupção e Recuperação
```javascript
const report = await runWorkoutInterruptionTest();
```

#### 2. Teste de Performance
```javascript
const report = await runPerformanceTest();
```

#### 3. Teste de Acessibilidade
```javascript
const report = await runAccessibilityTest();
```

#### 4. Teste Offline
```javascript
const report = await runOfflineTest();
```

## 📊 Interpretando os Resultados

### Status Geral
- **✅ APROVADO**: Todos os testes obrigatórios passaram
- **❌ REPROVADO**: Um ou mais testes obrigatórios falharam

### Métricas de Performance
- **Cache Write P95**: < 100ms (target)
- **Cache Read P95**: < 50ms (target)
- **Cache Validate P95**: < 10ms (target)
- **UI Update**: < 16ms para 60fps

### Níveis de Acessibilidade
- **AA**: Conformidade total WCAG 2.2
- **A**: Conformidade básica WCAG 2.2
- **Non-compliant**: Violações críticas encontradas

### Score Offline
- **90-100**: Excelente funcionalidade offline
- **80-89**: Boa funcionalidade offline
- **70-79**: Funcionalidade offline adequada
- **<70**: Funcionalidade offline inadequada

## 🔍 Troubleshooting

### Problemas Comuns

#### Falha no Teste de Interrupção
```
❌ Workout Interruption Recovery: session_restore failed
```
**Solução**: Verificar se `TreinoCacheService.validateState()` está funcionando corretamente.

#### Falha no Teste de Acessibilidade
```
❌ Modal Accessibility: Missing aria-labelledby
```
**Solução**: Adicionar `aria-labelledby` aos modais em `SaveExitModal.js` e `SessionRecoveryModal.js`.

#### Falha no Teste de Performance
```
❌ Cache Operations Performance: Write P95 exceeded 100ms
```
**Solução**: Otimizar operações de localStorage ou implementar debouncing.

#### Falha no Teste Offline
```
❌ Offline Functionality: Network requests not properly mocked
```
**Solução**: Verificar se `setupOfflineEnvironment()` está mockando fetch corretamente.

## 📁 Estrutura dos Arquivos

```
tests/
├── README.md                    # Esta documentação
├── testRunner.js               # Orquestrador principal
├── workoutFlowTests.js         # Testes de fluxo e interrupção
├── accessibilityValidator.js   # Validação WCAG 2.2
├── performanceTestSuite.js     # Testes de performance
└── offlineTestSuite.js         # Testes de funcionalidade offline
```

## 🎯 Quality Gates

Para aprovação em produção, todos os seguintes gates devem passar:

1. **✅ All Mandatory Passed**: Todos os 5 testes obrigatórios aprovados
2. **✅ Offline Functionality**: Funcionalidade offline completa
3. **✅ Accessibility Minimum**: Pelo menos WCAG A
4. **✅ Data Preservation**: Dados preservados durante interrupção

## 🚀 Execução em CI/CD

### GitHub Actions (exemplo)
```yaml
- name: Run Workout Persistence Tests
  run: |
    npm test -- --testPathPattern=tests/
    node -e "
      import('./tests/testRunner.js').then(async (module) => {
        const report = await module.runMandatoryTests();
        if (report.summary.overallStatus !== 'APROVADO') {
          process.exit(1);
        }
      });
    "
```

### Jest Integration
```javascript
// jest.config.js
module.exports = {
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/testRunner.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.js']
};
```

## 🔧 Configuração do Ambiente

### Pré-requisitos
- Navegador com suporte a ES6 modules
- localStorage disponível
- Console do navegador acessível

### Setup Inicial
```javascript
// Certificar-se de que todos os serviços estão carregados
await import('./services/treinoCacheService.js');
await import('./state/appState.js');
await import('./services/navigationGuard.js');
```

## 📈 Métricas e Monitoramento

### Métricas Coletadas
- **Performance**: Tempos de cache operations
- **Acessibilidade**: Violações WCAG por severidade
- **Offline**: Capacidades funcionais sem internet
- **Recuperação**: Taxa de sucesso na restauração de dados

### Alertas Recomendados
- Cache write > 200ms
- Violações críticas de acessibilidade > 0
- Falha na funcionalidade offline
- Perda de dados durante interrupção

## 🤝 Contribuindo

### Adicionando Novos Testes
1. Criar arquivo na pasta `tests/`
2. Implementar classe com método `run*Test()`
3. Adicionar ao `TestRunner.js`
4. Documentar no README.md

### Padrões de Código
- Use `console.log` para logging detalhado
- Implemente cleanup adequado (try/finally)
- Retorne objetos padronizados `{ passed, details, error }`
- Adicione timeouts para operações assíncronas

## 📞 Suporte

Para problemas com os testes:

1. **Verificar logs**: Console do navegador com detalhes
2. **Verificar dependências**: Todos os módulos carregados
3. **Verificar ambiente**: localStorage limpo antes dos testes
4. **Consultar troubleshooting**: Seção específica acima

## 📝 Changelog

### v1.0.0 - Implementação Inicial
- ✅ 5 testes obrigatórios implementados
- ✅ Relatórios abrangentes
- ✅ Quality gates definidos
- ✅ Documentação completa

---

**Nota**: Estes testes são críticos para a qualidade do sistema. Execute sempre antes de fazer deploy em produção.