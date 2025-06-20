# Contexto do Projeto: Sistema de Persistência de Treinos

## Problema Crítico
- Usuários perdem progresso de treino ao sair da aplicação
- Não existe fluxo de recuperação de sessão
- Cache existe mas não está integrado aos modais de navegação

## Arquitetura Atual
- TreinoCacheService: localStorage funcional
- WorkoutExecutionManager: manager principal
- AppState: estado global básico
- Navigation: controle de rotas simples

## Fluxo Desejado
[Iniciar] → [Auto-save] → [Sair] → [Modal Save/Exit] → [Home com "Voltar"] → [Modal Recovery] → [Restore 100%]

## Arquivos Críticos
- services/treinoCacheService.js (core funcional)
- feature/workoutExecution.js (manager principal)
- ui/navigation.js (navegação)
- state/appState.js (flags globais)

## Padrões Técnicos
- localStorage para cache primário
- Modais acessíveis (WCAG 2.2)
- Offline-first architecture
- Performance < 100ms para operações críticas