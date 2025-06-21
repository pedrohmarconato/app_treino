# 📝 Changelog - App Treino

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased]

### 🎨 Adicionado
- Modal de pré-treino para avaliação de energia (Likert 1-5)
- Card de treino expandível remodelado com design moderno
- Sistema de carregamento com animação pulsante
- Estilos para exercícios no card expandível
- Ícones de grupos musculares customizados
- README.md completo com documentação do projeto

### 🔧 Melhorado
- **Interface Home**: Design mais limpo e moderno
- **Card de Treino**: Visual remodelado com badge tipo e glow effect
- **Botão Expandir**: Novo design com hover effects
- **Animações**: Transições suaves com cubic-bezier
- **Responsividade**: Melhor adaptação para diferentes telas

### 🗑️ Removido
- Seção de preparação do treino (dicas e preview)
- Elementos CSS descontinuados (.workout-preparation, .preparation-tips, etc)
- Código legado não utilizado

### 🚀 Performance
- Otimização de transições CSS
- Redução de código desnecessário
- Melhor organização de componentes

### 📝 Documentação
- README.md criado com documentação completa
- CHANGELOG.md atualizado com mudanças recentes
- Estrutura do projeto documentada

## [5.6.1] - 2025-01-13

### 🎨 Adicionado
- Sistema completo de ícones SVG customizados (`utils/icons.js`)
- Ícones categorizados: workouts, actions, achievements, navigation, feedback
- Funções auxiliares: `getWorkoutIcon`, `getActionIcon`, `getAchievementIcon`
- Animações SVG: pulse, bounce, rotate
- Estados visuais: active, disabled, completed

### 🔧 Melhorado
- **Dashboard**: Nova lógica de verificação de conclusão de treinos
- **Templates**: Substituição completa de emojis por ícones SVG
- **Planning**: Sistema de ícones para seleção de treinos
- **Workout Execution**: Indicadores visuais aprimorados
- **CSS**: Estilos responsivos para ícones SVG

### 🐛 Corrigido
- Inconsistência na verificação de treinos concluídos
- Erro PGRST116 em queries do Supabase
- Conflitos de especificidade CSS em dias concluídos
- Problemas de performance com emojis

### 🚀 Performance
- Substituição de emojis por SVGs otimizados
- Redução do uso de fontes externas
- Melhoria na renderização de ícones

## [5.6.0] - 2025-01-10

### 🎨 Adicionado
- Sistema de conclusão de treinos melhorado
- Lógica de verificação baseada em `planejamento_semanal`
- Indicadores visuais de progresso semanal

### 🔧 Melhorado
- Interface de execução de treinos
- Feedback visual para usuário
- Sistema de notificações

### 🐛 Corrigido
- Bugs na navegação entre semanas
- Problemas de sincronização de dados
- Inconsistências na UI

## [5.5.x] - 2024-12-XX

### 🎨 Adicionado
- Sistema de planejamento semanal
- Interface de dashboard
- Métricas de treino

### 🔧 Melhorado
- Performance geral da aplicação
- Responsividade mobile
- Experiência do usuário

## [5.4.x] - 2024-11-XX

### 🎨 Adicionado
- Sistema de autenticação
- Integração com Supabase
- CRUD de exercícios

### 🔧 Melhorado
- Arquitetura da aplicação
- Gerenciamento de estado
- Modularização do código

## [5.0.0] - 2024-10-XX

### 🎨 Adicionado
- Versão inicial da aplicação
- Sistema básico de treinos
- Interface web responsiva

---

## 📋 Tipos de Mudanças

- 🎨 **Adicionado** para novas funcionalidades
- 🔧 **Melhorado** para mudanças em funcionalidades existentes  
- 🐛 **Corrigido** para correções de bugs
- 🚀 **Performance** para melhorias de performance
- 🔒 **Segurança** para correções de vulnerabilidades
- 💥 **Breaking Change** para mudanças incompatíveis
- 🗑️ **Removido** para funcionalidades removidas
- 📝 **Documentação** para mudanças apenas na documentação

## 📅 Formato de Data

Todas as datas seguem o formato ISO 8601 (YYYY-MM-DD).

## 🔗 Links de Comparação

- [Unreleased]: https://github.com/pedrohmarconato/app_treino/compare/v5.6.1...HEAD
- [5.6.1]: https://github.com/pedrohmarconato/app_treino/compare/v5.6.0...v5.6.1
- [5.6.0]: https://github.com/pedrohmarconato/app_treino/compare/v5.5.0...v5.6.0