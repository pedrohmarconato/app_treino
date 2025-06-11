# Instruções do Projeto - App Treino

## 🎯 Contexto do Projeto

**Repositório**: https://github.com/pedrohmarconato/app_treino.git  
**Tipo**: Aplicação web para gerenciamento de treinos de musculação  
**Stack**: JavaScript vanilla + Supabase + HTML/CSS  
**Status**: Base sólida implementada, necessita integração de dados e otimizações de UX

## 🏗️ Arquitetura Atual

### Estrutura Principal
```
~/app_treino/
├── components/     # Componentes reutilizáveis
├── config.js      # Configurações do Supabase
├── feature/       # Funcionalidades principais (planning.js, workoutExecution.js)
├── services/      # Camada de dados (supabaseService.js, userService.js)
├── templates/     # Templates HTML modularizados (home.js, workout.js)
├── state/         # Gerenciamento de estado global (AppState)
└── utils/         # Utilitários auxiliares
```

### Padrões Implementados
- **Module Pattern**: ES6 modules
- **Service Layer**: Operações de banco centralizadas
- **Template Pattern**: UI componentizada
- **Singleton**: Gerenciadores únicos (WorkoutExecutionManager)

## 🎯 Prioridades Atuais

### 🔴 **CRÍTICO** - Problemas que Impedem Funcionamento
1. **Código Morto em `planning.js`**:
   - Função `removerTreinoDoDiaMobile()` não existe (linha 450)
   - Importação não utilizada: `needsWeeklyPlanning`
   - Variável não lida: `diaAtualSelecionado`

2. **Dependência Circular em `protocolService.js`**:
   - Importa supabase de `app.js` em vez de `supabaseService.js`

### 🟡 **ALTA** - Funcionalidades Principais Pendentes
1. **Popular dados na home**: Template visual pronto, falta integração com Supabase
2. **Conectar botão editar**: Modal existe, falta vincular ao sistema de planejamento
3. **Melhorar botão iniciar treino**: Funcional, precisa validações e feedback
4. **Remodular tela de workout**: Completa, precisa otimização de UX mobile

## 🔧 Configuração Supabase

### Conexão Atual
- **URL**: `https://ktfmktecvllyiqfkavdn.supabase.co`
- **Service**: `services/supabaseService.js` centraliza operações
- **Tabelas**: usuarios, exercicios, protocolo_treinos, execucoes_treino, planejamento_semanal

### Operações Disponíveis
```javascript
// Funções do supabaseService.js:
- query(table, options)     // Consultas com filtros
- insert(table, data)       // Inserção
- update(table, id, data)   // Atualização
- upsert(table, data)       // Insert ou Update
```

## 📋 Elementos UI que Precisam Integração

### Home Screen (templates/home.js)
```javascript
// IDs que devem ser populados com dados do Supabase:
#user-name              // Nome do usuário
#workout-type           // Tipo do treino atual  
#workout-name           // Nome do treino
#workout-exercises      // Número de exercícios
#workout-duration       // Duração estimada
#completed-workouts     // Treinos concluídos
#current-week           // Semana atual
#progress-percentage    // Progresso geral
#week-indicators        // Indicadores dos dias da semana
```

## 🎨 Diretrizes de Desenvolvimento

### Código
- **Linguagem**: JavaScript vanilla (ES6+)
- **Estilo**: Modular, com separação clara de responsabilidades
- **Padrão de Imports**: ES6 modules com caminhos relativos
- **Tratamento de Erros**: Consistente com logging detalhado

### Interface
- **Design**: Responsivo, mobile-first
- **UX**: Foco em usabilidade para treinos em academia
- **Performance**: Lazy loading implementado para login
- **Estado**: Centralizado no AppState

### Supabase
- **Operações**: Sempre via `supabaseService.js`
- **Cache**: Implementar para melhor performance offline
- **Validação**: Antes das operações de banco
- **Logs**: Detalhados para debug

## 🚀 Guia de Implementação Rápida

### Para Correções Críticas
1. Corrigir função em `planning.js` linha 450
2. Remover importações não utilizadas
3. Corrigir dependência circular do Supabase

### Para Novas Funcionalidades
1. **Home**: Criar função para popular dados via `userService.js`
2. **Editar**: Conectar botão ao modal existente em `planning.js`
3. **Iniciar Treino**: Adicionar validações em `workoutExecution.js`
4. **Workout UX**: Otimizar interface mobile existente

## 🔍 Pontos de Atenção

### Segurança
- Chaves do Supabase expostas em `config.js` (migrar para env vars)
- Validação de dados antes operações de banco

### Performance
- Sistema de cache para operações offline
- Bundle splitting para código não crítico
- Otimização de CSS (remover não utilizados)

### Manutenibilidade  
- Documentação inline nas funções críticas
- Testes unitários para `WorkoutExecutionManager`
- Organização de dependências complexas

## 💡 Próximos Passos Recomendados

1. **Corrigir problemas críticos** (1-2 dias)
2. **Implementar integração home screen** (3-5 dias)  
3. **Conectar funcionalidades existentes** (2-3 dias)
4. **Otimizar UX mobile da tela de treino** (5-7 dias)
5. **Implementar cache e melhorias de performance** (1-2 semanas)

---

**Objetivo**: Transformar a base sólida existente em uma aplicação totalmente funcional com foco na experiência do usuário durante treinos.