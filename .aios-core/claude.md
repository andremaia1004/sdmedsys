# CLAUDE.md — SDMED SYS

> Leia este arquivo inteiro antes de qualquer tarefa.
> Em caso de conflito, o PRD (`PRD-sdmed.md`) é a fonte da verdade.

---

## O que é este projeto

Sistema web de gestão para clínicas médicas. Uma clínica hoje, SaaS multi-tenant no futuro.
Idioma: **PT-BR fixo**. Dispositivo principal: **Desktop**.

---

## Stack (não mude)

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router) |
| Linguagem | TypeScript strict |
| Estilização | CSS Modules (vanilla) |
| Banco | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Segurança DB | RLS por `clinic_id` |
| Deploy | Vercel |
| Testes | Vitest |

**Proibido instalar:** Tailwind, Chakra, MUI, Prisma, Drizzle, ou qualquer lib de UI/ORM.
**Proibido:** API routes quando Server Actions resolvem; inline styles; `any` desnecessário.

---

## Arquitetura

```
app/                  → Rotas Next.js (auth, admin, secretary, doctor, tv)
features/<modulo>/    → Módulos de negócio (padrão obrigatório abaixo)
components/ui/        → Componentes compartilhados
lib/                  → Supabase client, session, helpers
docs/decisions/       → ADRs
middleware.ts         → Proteção de rotas por role
```

### Padrão obrigatório de cada feature

```
features/<modulo>/
├── types.ts        ← espelha EXATAMENTE o schema do banco
├── service.ts      ← toda lógica de negócio + chamadas ao Supabase
├── components/     ← componentes React do módulo
├── hooks/          ← custom hooks (se necessário)
└── __tests__/      ← testes Vitest
```

**Regra de ouro:** componente → `service.ts` → Supabase. Nunca pular camadas.

---

## Roles e acesso

| Role | Rota | Resumo |
|---|---|---|
| ADMIN | `/admin` | Tudo: usuários, médicos, pacientes, config, auditoria |
| SECRETARY | `/secretary` | Pacientes (CRUD), agenda (todos os médicos), fila, anexos ADMIN |
| DOCTOR | `/doctor` | Própria agenda, workspace de consulta, prontuário, documentos clínicos, anexos CLINICAL+ADMIN |
| TV | `/tv` | Somente leitura (PIN + cookie 12h) |

- Middleware bloqueia rotas por role no server-side.
- RLS garante isolamento por `clinic_id`.
- Admin cria usuários manualmente — sem self-service.

---

## Regras críticas ao escrever código

- Sempre TypeScript. Nunca JS puro.
- Sempre CSS Modules. Nunca inline styles ou libs externas.
- Sempre importar tipos de `types.ts` da feature.
- Sempre chamar Supabase via `service.ts`, nunca direto no componente.
- Sempre filtrar por `clinic_id` em queries (mesmo com RLS ativo).
- Sempre tratar erros com try/catch e feedback visual ao usuário.
- `clinical_documents` é **imutável** — nunca UPDATE/DELETE.
- `clinical_entries` com `is_final = true` é **imutável**.
- Só o médico criador pode editar seus próprios rascunhos.
- SECRETARY nunca acessa `clinical_entries` nem anexos `CLINICAL`.

---

## Ordem de prioridades (siga esta ordem)

1. **Bugs** — fluxo end-to-end: login → paciente → agenda → fila → consulta → documento
2. **Padronização** — `types.ts` → `service.ts` → `components/` em todas as features
3. **Build limpo** — lint, tsc, build e testes sem erros
4. **Organização** — remover lixo, migrations, .env.example, README
5. **Dashboard admin** — consultas do dia, fila, médicos ativos (sem lib de gráficos)
6. **PDF** — 5 tipos de documentos clínicos (receita, atestado, laudo, encaminhamento, solicitação)

**Não implemente nada fora desta lista sem aprovação do owner.**

---

## Backlog bloqueado (não toque)

Financeiro, relatórios avançados, notificações, WebSocket, convite por email, telemedicina, app mobile, integração TISS/SUS, i18n.

---

## Commits

Mensagens em inglês: `type(scope): description`
Tipos: `fix` · `feat` · `refactor` · `chore` · `docs` · `test`
Exemplo: `fix(queue): ticket not generated for walk-in patients`

---

## Agentes AIOS disponíveis

Este projeto usa o Synkra AIOS via Antigravity. Ative com `@nome-do-agente`.

| Agente | Quando usar |
|---|---|
| `@dev` (Dex) | Implementar código — use `*develop {story-id}` ou `*build-autonomous {story-id}` |
| `@qa` (Quinn) | Revisar código, validar RLS, testar fluxos |
| `@sm` (River) | Transformar PRD em histórias detalhadas com checkboxes |
| `@architect` | Decisões técnicas, ADRs, mudanças estruturais |
| `@pm` | Priorização, refinamento de backlog |
| `@analyst` | Análise de requisitos, pesquisa |

### Fluxo padrão de desenvolvimento

```
@sm *create-story {funcionalidade}   → gera história em docs/stories/
@dev *develop {story-id}             → implementa seguindo a história
@qa *review {story-id}               → valida código e regras críticas
@dev *apply-qa-fixes                 → aplica correções
```

### Restrições do @dev (Dex) neste projeto

- Não pode push nem criar PRs — delega para `@github-devops` (Gage)
- Antes de marcar story completa: rodar `*run-tests` (lint + vitest)
- CodeRabbit auto-fixa CRITICAL (máx 2 iterações)
- Commits seguem: `type(scope): description` em inglês

---

## Contexto adicional

- Schema completo do banco: @PRD-sdmed.md (seção 5)
- Checklist de estabilização: @PRD-sdmed.md (seção 14)
- Decisões arquiteturais: @PRD-sdmed.md (seção 13) e `docs/decisions/`
- Config AIOS: @.aios-core/claude.md
- Agentes: `.aios-core/development/agents/` e `.antigravity/agents/`
