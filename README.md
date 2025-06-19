# 🏋️‍♂️ App Treino – Documentação Unificada

Bem-vindo ao **App Treino**, uma PWA de planejamento e execução de treinos construída 100 % em JavaScript vanilla. Este README consolida as informações dispersas nos demais arquivos de documentação (`docs/`, `design-system.md`, `docs/ARCHITECTURE.md`, etc.) para oferecer uma visão rápida e coesa do projeto.

---

## 📚 Índice
1. Visão Geral
2. Estrutura de Pastas
3. Fluxos Funcionais Principais
4. Diretrizes de Código & Design
5. Configuração do Ambiente
6. Scripts Úteis
7. Processo de Contribuição
8. Referências

---

## 1. Visão Geral
* **Stack:** JavaScript ES Modules + Supabase (Auth, DB, Storage) + Service Worker (PWA)
* **Objetivos-chave:**
  * Operar **offline-first** (cache em `localStorage` + sync automático via `WorkoutSyncService`).
  * UX moderna e responsiva com tema escuro, design tokens e animações suaves.
  * Estrutura **modular**: `components/`, `feature/`, `services/`, `utils/`, `templates/`.

---

## 2. Estrutura de Pastas (resumida)
```text
app_treino/
├─ components/            # Web Components & modais reutilizáveis
├─ feature/               # Fluxos de alto-nível (dashboard, planning, workoutExecution)
├─ services/              # Acesso a dados, cache, Supabase, sync
├─ templates/             # HTML templates dinâmicos
├─ utils/                 # Helpers (ícones, datas, UI)
├─ styles/ / *.css        # Design tokens e temas
├─ docs/                  # Documentação aprofundada
└─ js/app.js              # Ponto de entrada ESM
```
Para estrutura completa consulte [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## 3. Fluxos Funcionais Principais
### 3.1 Planejamento Semanal
```
user ➜ planning.js ➜ weeklyPlanningService ➜ Supabase (tabela planejamento_semanal)
           ▲                         │
           └──────── cache/localStorage ◀────────┘
```
* Fallback para treinos padrão se não houver dados em `exercicios` (ver memória *LÓGICA DO PLANEJAMENTO SEMANAL*).
* Validações para evitar grupos musculares duplicados (ajuste pendente na função `criarOpcaoTreino`).

### 3.2 Execução & Persistência de Treino
1. `feature/workoutExecution.js` coleta progressos em tempo-real.
2. `workoutPersistence.js` salva snapshots no `localStorage`.
3. Ao finalizar o treino, `workoutSyncService` tenta inserir em `workout_sessions` (Supabase) e faz _queue_ offline.

### 3.3 Sincronização Offline → Online
* Fila em `localStorage(workoutSessionsQueue_v1)`.
* `window.addEventListener('online', syncPending)` reenvia.
* Fallback REST `/api/sync-workout` caso Supabase indisponível.

---

## 4. Diretrizes de Código & Design
* **Design System:** variáveis em `design-system.md` (cores, tipografia, espaçamentos). Use tokens – _nunca_ hardcode! 🔒
* **Arquitetura:** princípios descritos em [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) – modularidade, PWA, RLS.
* **Naming:** `kebab-case` para arquivos, `PascalCase` para classes, `camelCase` para funções/variáveis.
* **Logs:** `console.[log|warn|error]` com prefixos entre `[]` para filtragem (ex.: `[WorkoutSync]`).
* **Testes:** pasta `tests/` dividida em `unit/`, `integration/`, `e2e/`.

---

## 5. Configuração do Ambiente
```bash
# 1. Instalar dependências (opcional – projeto roda com CDN)
npm install

# 2. Copiar config de exemplo
cp config.example.js config.js  # adicione URL e KEY do Supabase

# 3. Rodar servidor local (qualquer http-server)
npm start   # ou live-server
```
> Em `localhost` o Service Worker é desativado por padrão (ver `index.html`).

---

## 6. Scripts Úteis
| Comando            | Descrição                           |
|--------------------|-------------------------------------|
| `npm run dev`      | Inicia servidor com live-reload      |
| `npm run test`     | Executa testes Jest                  |
| `npm run build`    | Minifica/otimiza assets              |
| `npm run deploy`   | Deploy (Netlify/Vercel)              |

---

## 7. Processo de Contribuição
1. Crie _branch_ a partir de `main`: `feat/nome-feature`.
2. Siga o **Conventional Commits**: `feat:`, `fix:`, `docs:` …
3. Execute `npm test` antes do PR.
4. Atualize a documentação caso a mudança afete contratos ou UI.
5. Abra Pull Request e aguarde CI.

---

## 8. Sistema de Avaliação
✅ **Sistema Energia + Fadiga**: O app usa escalas específicas (0-5):
- **Pre-workout**: Nível de ENERGIA antes do treino (0=exausto → 5=energia máxima)
- **Post-workout**: Nível de FADIGA após o treino (0=sem fadiga → 5=exaustão total)

As colunas `pre_workout` e `post_workout` já existem na tabela `planejamento_semanal`.

## 9. Referências
* `design-system.md` – tokens de UI.
* `docs/ARCHITECTURE.md` – documentação técnica detalhada.
* `docs/CLAUDE_MEMORY.md` – histórico técnico e decisões.
* `SECURITY.md`, `CONTRIBUTING.md` – políticas de segurança e contribuição.

---

> Esta seção unificada foi gerada a partir da revisão de todos os documentos existentes para fornecer uma **fonte de verdade** inicial. Mantenha-a sempre alinhada com as demais páginas. ✨