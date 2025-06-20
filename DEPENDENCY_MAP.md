# Mapa de Dependências

## Dependências Principais
- TreinoCacheService ← WorkoutExecutionManager
- WorkoutExecutionManager ← Navigation
- Navigation ← AppState
- Modais (criar) ← TreinoCacheService

## Conflitos Identificados
- workoutPersistence.js vs treinoCacheService.js (duplicação)
- workoutExecution.js vs workoutExecution_v2.js (versões conflitantes)

## Integrações Necessárias
- Navigation + SaveExitModal
- Home + ContextualButton
- Cache + AutoSave System