# 🏋️ App Treino

> Aplicação web completa para gerenciamento e acompanhamento de treinos físicos

[![Version](https://img.shields.io/badge/version-5.6.1-blue.svg)](https://github.com/pedrohmarconato/app_treino)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
[![Code Style: Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

## 📋 Sobre o Projeto

O **App Treino** é uma aplicação web progressiva (PWA) desenvolvida para facilitar o planejamento, execução e acompanhamento de treinos físicos. Com uma interface moderna e intuitiva, oferece uma experiência completa para entusiastas do fitness.

### ✨ Principais Características

- 🎯 **Planejamento Semanal**: Organize seus treinos por semana
- 📊 **Dashboard Interativo**: Acompanhe seu progresso em tempo real
- 🏋️ **Execução de Treinos**: Interface otimizada para uso durante exercícios
- 📱 **PWA**: Instalável e funciona offline
- 🎨 **Design Responsivo**: Perfeito em qualquer dispositivo
- ⚡ **Performance**: Carregamento rápido e otimizado

## 🚀 Demo

🌐 **[Acesse a aplicação](https://seu-dominio.com)**

![Screenshot](https://via.placeholder.com/800x400?text=App+Treino+Screenshot)

## 🛠️ Tecnologias

### Frontend
- **JavaScript ES6+** - Linguagem principal
- **HTML5** - Estrutura semântica
- **CSS3** - Estilos modernos com Grid/Flexbox
- **SVG Icons** - Sistema de ícones customizados

### Backend & Database
- **Supabase** - Backend as a Service
- **PostgreSQL** - Banco de dados principal
- **Row Level Security** - Segurança avançada

### DevOps & Tools
- **GitHub Actions** - CI/CD automatizado
- **Vercel/Netlify** - Deploy automático
- **Lighthouse** - Auditoria de performance
- **Jest** - Testes automatizados

## 📦 Instalação

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Git

### Setup Local

```bash
# Clone o repositório
git clone https://github.com/pedrohmarconato/app_treino.git
cd app_treino

# Instale as dependências
npm install

# Configure o ambiente
cp .env.example .env.local
# Edite .env.local com suas configurações do Supabase

# Inicie o servidor de desenvolvimento
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`

### Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build para produção
npm run test         # Executar testes
npm run lint         # Verificar código
npm run format       # Formatar código
npm run deploy       # Deploy para produção
```

## 🏗️ Arquitetura

```
app_treino/
├── components/      # Componentes reutilizáveis
├── feature/         # Features principais (dashboard, planning, etc.)
├── services/        # Lógica de negócio e APIs
├── templates/       # Templates de páginas
├── styles/          # Estilos CSS
├── utils/           # Utilitários e helpers
├── ui/              # Componentes de interface
└── tests/           # Testes automatizados
```

Para mais detalhes, consulte a [documentação de arquitetura](docs/ARCHITECTURE.md).

## 🎯 Funcionalidades

### 📅 Planejamento Semanal
- Criação de rotinas personalizadas
- Diferentes tipos de treino (Força, Cardio, Flexibilidade)
- Gestão de grupos musculares
- Programação inteligente de descanso

### 🏋️ Execução de Treinos
- Interface otimizada para uso durante exercícios
- Timer automático entre séries
- Registro de peso e repetições
- Sistema de progressão automática

### 📊 Dashboard e Métricas
- Acompanhamento de progresso semanal
- Estatísticas de performance
- Histórico completo de treinos
- Métricas de consistência

### 🎨 Interface e UX
- Design dark mode otimizado
- Ícones SVG customizados
- Animações fluidas
- Navegação intuitiva

## 🔧 Configuração

### Variáveis de Ambiente

```env
# .env.local
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Configuração do Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Execute os scripts SQL em `database/schema.sql`
3. Configure Row Level Security (RLS)
4. Adicione as credenciais ao `.env.local`

## 🧪 Testes

```bash
# Executar todos os testes
npm test

# Testes em modo watch
npm run test:watch

# Testes com coverage
npm run test:coverage

# Testes E2E
npm run test:e2e
```

### Estrutura de Testes
- **Unit Tests**: Testes de funções isoladas
- **Integration Tests**: Testes de integração entre componentes
- **E2E Tests**: Testes de fluxo completo do usuário

## 🚢 Deploy

### Deploy Automático (Recomendado)

O projeto está configurado para deploy automático via GitHub Actions:

1. Fork o repositório
2. Configure as secrets do GitHub:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
3. Push para `main` faz deploy automático

### Deploy Manual

```bash
# Build do projeto
npm run build

# Deploy para GitHub Pages
npm run deploy

# Ou para Vercel
npx vercel --prod
```

## 📈 Performance

### Métricas Atuais
- **Performance Score**: 95+
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Bundle Size**: < 100KB

### Otimizações
- Lazy loading de módulos
- Compressão de assets
- Service Worker para cache
- Imagens otimizadas

## 🤝 Contribuindo

Contribuições são sempre bem-vindas! Por favor, leia o [guia de contribuição](CONTRIBUTING.md) para detalhes sobre nosso código de conduta e processo de pull requests.

### Como Contribuir

1. Fork o projeto
2. Crie sua feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Guias
- [Código de Conduta](CODE_OF_CONDUCT.md)
- [Guia de Contribuição](CONTRIBUTING.md)
- [Política de Segurança](SECURITY.md)

## 📝 Changelog

Todas as mudanças notáveis são documentadas no [CHANGELOG.md](CHANGELOG.md).

### Últimas Atualizações

#### v5.6.1 (2025-01-13)
- ✨ Sistema completo de ícones SVG
- 🔧 Melhoria na lógica de conclusão de treinos
- 🎨 Interface aprimorada
- 🐛 Correções de bugs importantes

## 📊 Roadmap

### 🎯 Próximas Versões

- **v5.7** - Sistema de notificações push
- **v5.8** - PWA completo com offline-first
- **v6.0** - Redesign completo da UI/UX
- **v6.1** - Migração para TypeScript
- **v6.2** - Features sociais e gamificação

### 💡 Ideias Futuras
- Integração com wearables
- IA para sugestão de treinos
- Modo coach/personal trainer
- Marketplace de treinos

## 📚 Documentação

Para documentação técnica completa do projeto, consulte a pasta `docs/`:

- [📖 **Documentação Completa**](./docs/DOCUMENTACAO_COMPLETA.md) - Visão geral e arquitetura
- [🏗️ **Arquitetura do Sistema**](./docs/ARCHITECTURE.md) - Estrutura técnica detalhada  
- [🔒 **Implementação de Senhas**](./docs/IMPLEMENTACAO_SISTEMA_SENHAS.md) - Plano de autenticação
- [🧠 **Claude Memory**](./docs/CLAUDE_MEMORY.md) - Histórico de desenvolvimento
- [🔍 **Debug Queries**](./docs/DEBUG_QUERIES.md) - Queries SQL para debug

## 🔒 Segurança

Para reportar vulnerabilidades de segurança, por favor consulte nossa [política de segurança](SECURITY.md).

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👥 Equipe

### Desenvolvedor Principal
**Pedro Henrique Marconato**
- GitHub: [@pedrohmarconato](https://github.com/pedrohmarconato)
- Email: pedrohenriquemarconato@gmail.com

### Contribuidores
**Claude AI**
- Assistente de desenvolvimento IA
- Contribuições em arquitetura e código

## 🙏 Agradecimentos

- [Supabase](https://supabase.com) - Backend as a Service incrível
- [Lucide Icons](https://lucide.dev) - Inspiração para o sistema de ícones
- [Tailwind CSS](https://tailwindcss.com) - Inspiração para design system
- Comunidade open-source - Por todas as contribuições

## 📞 Suporte

- 📧 Email: pedrohenriquemarconato@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/pedrohmarconato/app_treino/issues)
- 💬 Discussões: [GitHub Discussions](https://github.com/pedrohmarconato/app_treino/discussions)

---

<div align="center">

**[⬆ Voltar ao topo](#-app-treino)**

Feito com ❤️ por [Pedro Henrique Marconato](https://github.com/pedrohmarconato)

</div>