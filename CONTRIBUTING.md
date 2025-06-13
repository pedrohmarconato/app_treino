# 🤝 Guia de Contribuição - App Treino

Obrigado por considerar contribuir para o App Treino! Este documento fornece diretrizes para contribuições efetivas.

## 📋 Índice
- [Código de Conduta](#código-de-conduta)
- [Como Contribuir](#como-contribuir)
- [Setup do Ambiente](#setup-do-ambiente)
- [Padrões de Desenvolvimento](#padrões-de-desenvolvimento)
- [Processo de Pull Request](#processo-de-pull-request)
- [Reportando Bugs](#reportando-bugs)
- [Sugerindo Features](#sugerindo-features)

## 📜 Código de Conduta

Este projeto adere ao [Contributor Covenant](https://www.contributor-covenant.org/). Ao participar, você concorda em manter um ambiente respeitoso e inclusivo.

## 🚀 Como Contribuir

### 1. Fork e Clone
```bash
# Fork o repositório no GitHub
git clone https://github.com/SEU_USERNAME/app_treino.git
cd app_treino
```

### 2. Crie uma Branch
```bash
# Para features
git checkout -b feature/nome-da-feature

# Para bugs
git checkout -b fix/nome-do-bug

# Para melhorias
git checkout -b improvement/nome-da-melhoria
```

### 3. Faça suas Mudanças
- Siga os [padrões de código](#padrões-de-desenvolvimento)
- Escreva commits descritivos
- Adicione testes quando aplicável

### 4. Submeta um Pull Request
- Use o template de PR fornecido
- Descreva claramente suas mudanças
- Referencie issues relacionadas

## 🛠️ Setup do Ambiente

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Git

### Instalação
```bash
# Clone o repositório
git clone https://github.com/pedrohmarconato/app_treino.git
cd app_treino

# Instale dependências
npm install

# Configure ambiente local
cp .env.example .env.local
# Edite .env.local com suas configurações

# Inicie o servidor de desenvolvimento
npm run dev
```

### Scripts Disponíveis
```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build para produção
npm run test         # Executar testes
npm run lint         # Verificar código
npm run format       # Formatar código
npm run type-check   # Verificar tipos TypeScript
```

## 🎯 Padrões de Desenvolvimento

### Estrutura de Arquivos
```
app_treino/
├── components/          # Componentes reutilizáveis
├── feature/            # Features específicas
├── services/           # Lógica de negócio e APIs
├── styles/             # Estilos CSS
├── templates/          # Templates de páginas
├── utils/              # Utilitários e helpers
├── tests/              # Testes automatizados
└── docs/               # Documentação
```

### Convenções de Nomenclatura
- **Arquivos**: camelCase (`userService.js`)
- **Classes**: PascalCase (`WorkoutManager`)
- **Funções**: camelCase (`getUserWorkouts`)
- **Constantes**: UPPER_SNAKE_CASE (`API_ENDPOINTS`)
- **CSS Classes**: kebab-case (`workout-card`)

### Estilo de Código
```javascript
// ✅ Bom
const calculateWorkoutDuration = (exercises) => {
    return exercises.reduce((total, exercise) => {
        return total + exercise.duration;
    }, 0);
};

// ❌ Evitar
function calc(ex) {
    let t = 0;
    for(let i = 0; i < ex.length; i++) {
        t += ex[i].duration;
    }
    return t;
}
```

### Commits
Use Conventional Commits:
```
feat: adiciona sistema de notificações push
fix: corrige bug no cálculo de calorias
docs: atualiza README com instruções de deploy
style: melhora responsividade em mobile
refactor: simplifica lógica de autenticação
test: adiciona testes para WorkoutService
```

## 🔄 Processo de Pull Request

### Antes de Submeter
- [ ] Código segue os padrões estabelecidos
- [ ] Todos os testes passam
- [ ] Funcionalidade foi testada manualmente
- [ ] Documentação foi atualizada se necessário
- [ ] Branch está atualizada com main

### Template de PR
Use o template fornecido em `.github/pull_request_template.md`

### Revisão
- PRs precisam de pelo menos 1 aprovação
- Mudanças críticas precisam de 2 aprovações
- CI/CD deve passar completamente
- Conflitos devem ser resolvidos

## 🐛 Reportando Bugs

### Antes de Reportar
1. Verifique se o bug já foi reportado
2. Teste na versão mais recente
3. Colete informações sobre o ambiente

### Como Reportar
Use o template em `.github/ISSUE_TEMPLATE/bug_report.md`

**Informações Essenciais:**
- Passos para reproduzir
- Comportamento esperado vs atual
- Screenshots se aplicável
- Informações do ambiente (browser, OS, device)

## ✨ Sugerindo Features

### Antes de Sugerir
1. Verifique se a feature já foi sugerida
2. Considere se faz sentido para o projeto
3. Pense na implementação e manutenção

### Como Sugerir
Use o template em `.github/ISSUE_TEMPLATE/feature_request.md`

**Informações Essenciais:**
- Problema que a feature resolve
- Solução proposta
- Critérios de aceitação
- Mockups se aplicável

## 🏷️ Labels e Milestones

### Labels de Issues
- `bug` - Bugs confirmados
- `enhancement` - Novas features
- `improvement` - Melhorias em features existentes
- `documentation` - Melhorias na documentação
- `good-first-issue` - Bom para iniciantes
- `help-wanted` - Precisamos de ajuda
- `priority-high` - Alta prioridade
- `wontfix` - Não será implementado

### Labels de PRs
- `ready-for-review` - Pronto para revisão
- `work-in-progress` - Em desenvolvimento
- `needs-changes` - Precisa de mudanças
- `breaking-change` - Mudança que quebra compatibilidade

## 🧪 Testes

### Tipos de Teste
- **Unit Tests**: Testes de funções isoladas
- **Integration Tests**: Testes de integração entre componentes
- **E2E Tests**: Testes de fluxo completo

### Executando Testes
```bash
npm test                    # Todos os testes
npm test -- --watch        # Modo watch
npm test -- --coverage     # Com coverage
npm run test:e2e            # Testes E2E
```

### Escrevendo Testes
```javascript
// services/__tests__/workoutService.test.js
import { calculateWorkoutStats } from '../workoutService.js';

describe('WorkoutService', () => {
    describe('calculateWorkoutStats', () => {
        it('should calculate total duration correctly', () => {
            const exercises = [
                { duration: 300, calories: 50 },
                { duration: 600, calories: 100 }
            ];
            
            const result = calculateWorkoutStats(exercises);
            
            expect(result.totalDuration).toBe(900);
            expect(result.totalCalories).toBe(150);
        });
    });
});
```

## 📖 Documentação

### README
- Mantenha atualizado com mudanças significativas
- Inclua instruções claras de setup
- Adicione screenshots quando relevante

### Código
```javascript
/**
 * Calcula estatísticas completas do treino
 * @param {Array<Object>} exercises - Lista de exercícios
 * @param {number} exercises[].duration - Duração em segundos
 * @param {number} exercises[].calories - Calorias queimadas
 * @returns {Object} Estatísticas do treino
 */
function calculateWorkoutStats(exercises) {
    // implementação...
}
```

### Changelog
- Mantenha CHANGELOG.md atualizado
- Use formato [Keep a Changelog](https://keepachangelog.com/)
- Documente breaking changes

## 🎯 Roadmap e Prioridades

### Versão Atual (v5.6)
- ✅ Sistema de ícones SVG
- ✅ Lógica de conclusão melhorada
- 🔄 Melhorias de performance
- 🔄 Testes automatizados

### Próximas Versões
- v5.7: Sistema de notificações
- v5.8: PWA completo
- v6.0: Redesign UI/UX

## 📞 Contato e Suporte

- **Issues**: Use GitHub Issues para bugs e features
- **Discussões**: Use GitHub Discussions para perguntas gerais
- **Email**: [pedrohenriquemarconato@gmail.com](mailto:pedrohenriquemarconato@gmail.com)

## 🙏 Reconhecimentos

Agradecemos a todos os contribuidores que ajudam a tornar o App Treino melhor!

---

**Obrigado por contribuir! 🚀**