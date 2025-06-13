# App Treino

App Treino é uma aplicação web progressiva (PWA) para gerenciamento de treinos de musculação. O sistema utiliza **Supabase** como backend e foi desenvolvido em JavaScript vanilla com HTML e CSS. O objetivo é oferecer um fluxo completo de planejamento, execução e acompanhamento de treinos com cálculo inteligente de peso baseado em 1RM.

## Funcionalidades
- Autenticação via Supabase com seleção visual de usuário
- Dashboard com métricas em tempo real e cronograma semanal
- Planejamento semanal por grupos musculares
- Execução de treinos com sugestão automática de peso e timer de descanso
- Finalização com avaliação obrigatória (qualidade, dificuldade, energia)
- Calculadora de peso baseada em 1RM com progressão de 70% a 95%
- Interface dark theme com acentos neon e suporte offline (PWA)

## Estrutura do projeto
```text
~/app_treino/
├── components/          # Componentes reutilizáveis
├── config.js            # Configurações Supabase
├── feature/             # Lógica principal (planning, workoutExecution, dashboard, login)
├── services/            # Camada de dados (supabase, workout, planning, weight calculator)
├── templates/           # UI modularizada (home.js, workout.js, login.js)
├── state/               # Gerenciamento global (AppState)
├── styles.css           # Sistema de design unificado
├── database/            # Scripts SQL e migrações
└── docs/                # Documentação
```

Trechos retirados de `DOCUMENTACAO_COMPLETA.md` detalham as funções já implementadas, como sugestão de peso e modal de avaliação obrigatória.

## Requisitos
- Conta no [Supabase](https://supabase.com/) para criar as tabelas descritas em `database/` e aplicar as migrações
- Definir `window.SUPABASE_CONFIG` no arquivo `config.js` com a `url` e `key` do projeto
- Servidor local para testes (ex.: extensão *Live Server* do VSCode ou `python -m http.server`)

## Executando localmente
1. Clone o repositório e configure `config.js` com suas credenciais Supabase.
2. Inicie um servidor local na raiz do projeto para servir `index.html` (necessário para o Service Worker funcionar).
3. Abra o navegador em `http://localhost:PORT` e faça login para acessar o dashboard.

O projeto possui arquivos de configuração para deploy em Vercel (`vercel.json`). Após configurar o repositório remoto, basta realizar o push para produção ou executar `vercel --prod`.

## Banco de dados
O schema utiliza as seguintes tabelas principais:
- `usuarios`, `exercicios`, `protocolo_treinos`, `planejamento_semanal`, `execucao_exercicio_usuario`, `treino_executado` e `d_calendario`.

Algumas migrações presentes na pasta `database/` devem ser executadas antes do uso, como `migrate_remove_numero_treino.sql` e `add_resposta_avaliacao_to_planejamento.sql`.

## Licença
Este projeto é disponibilizado sem garantia e pode ser modificado livremente.
