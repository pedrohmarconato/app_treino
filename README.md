# 💪 App Treino - Sistema de Acompanhamento de Treinos

## 📋 Sobre o Projeto

App Treino é uma aplicação web progressiva (PWA) desenvolvida para acompanhamento personalizado de treinos físicos. O sistema oferece um protocolo inteligente de treinos baseado em RM (Repetição Máxima), progressão automática de cargas e acompanhamento detalhado do progresso.

## ✨ Recursos Principais

### 🏋️‍♂️ Sistema de Treinos

- **Protocolo de Treinos Inteligente**: Sistema de periodização baseado em semanas
- **Cálculo Automático de Cargas**: Baseado em percentuais da 1RM
- **Progressão Adaptativa**: Ajuste automático de pesos conforme evolução
- **Divisão de Treinos**: Treino A, B, C e D com grupos musculares específicos

### 📊 Acompanhamento

- **Dashboard Interativo**: Visualização do progresso semanal
- **Métricas Detalhadas**: Treinos concluídos, evolução de cargas, etc
- **Histórico Completo**: Registro detalhado de cada execução
- **Sistema de Avaliação**: Auto-avaliação de esforço (RPE)

### 🎨 Interface Moderna

- **Design Neon Sóbrio**: Visual moderno com elementos neon sutis
- **Cards Expandíveis**: Interface limpa e organizada
- **Animações Suaves**: Transições fluidas e micro-interações
- **Totalmente Responsivo**: Adaptado para todos os dispositivos

### 🔧 Funcionalidades Técnicas

- **PWA**: Funciona offline e pode ser instalado
- **Service Worker**: Cache inteligente e sync em background
- **LocalStorage**: Persistência de dados localmente
- **Modal de Pré-treino**: Avaliação de energia antes de iniciar

## 🚀 Tecnologias Utilizadas

- **Frontend**: JavaScript Vanilla (ES6+)
- **Estilização**: CSS3 com variáveis customizadas
- **Arquitetura**: MVC com módulos ES6
- **Estado**: AppState centralizado
- **Banco de Dados**: Supabase
- **Build**: Webpack
- **PWA**: Service Worker com Workbox

## 📱 Instalação

1. Clone o repositório:

```bash
git clone https://github.com/pedrohmarconato/app_treino.git
cd app_treino
```

2. Instale as dependências:

```bash
npm install
```

3. Configure as variáveis de ambiente:

```bash
cp .env.example .env
# Edite o arquivo .env com suas credenciais
```

4. Execute o projeto:

```bash
npm start
```

## 🔨 Scripts Disponíveis

- `npm start` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm test` - Executa os testes
- `npm run lint` - Verifica padrões de código

## 📁 Estrutura do Projeto

```
app_treino/
├── components/        # Componentes reutilizáveis
├── controllers/       # Lógica de controle
├── feature/          # Funcionalidades específicas
├── services/         # Serviços e API
├── state/           # Gerenciamento de estado
├── templates/       # Templates HTML
├── ui/              # Componentes de UI
├── utils/           # Utilitários
└── styles.css       # Estilos globais
```

## 🎯 Fluxo de Treino

1. **Login**: Autenticação do usuário
2. **Dashboard**: Visualização do plano semanal
3. **Iniciar Treino**: Modal de avaliação de energia
4. **Execução**: Registro série por série
5. **Conclusão**: Avaliação final e salvamento

## 🔄 Atualizações Recentes

### v2.0.0 - Design Overhaul

- ✅ Nova interface com design neon sóbrio
- ✅ Card de treino expandível remodelado
- ✅ Remoção de elementos descontinuados
- ✅ Modal de pré-treino integrado
- ✅ Animações e transições melhoradas
- ✅ Sistema de ícones atualizado

## 🤝 Contribuindo

Consulte [CONTRIBUTING.md](CONTRIBUTING.md) para diretrizes de contribuição.

## 📄 Licença

Este projeto está sob a licença MIT.

## 👥 Equipe

- **Pedro Marconato** - Desenvolvedor Principal

---

Feito com 💪 e ☕ por Pedro Marconato
