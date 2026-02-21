# PRD — SDMED SYS

> **Fonte da verdade do projeto.**
> Qualquer agente ou desenvolvedor DEVE ler este arquivo inteiro antes de alterar qualquer código.
> Se algo no código contradiz este PRD, este PRD vence.
>
> Última atualização: Fevereiro 2026

---

## 1. O que é o SDMED SYS

Sistema web de gestão para clínicas médicas. Começa atendendo **uma clínica** como produto interno, com arquitetura multi-tenant preparada para escalar como SaaS para múltiplas clínicas no futuro.

**Uma frase:** "O sistema que a secretária, o médico e o dono da clínica usam o dia inteiro."

### Perfil da clínica alvo

- **Tamanho:** clínica média, 5 a 15 médicos
- **Tipo:** clínica geral / multiespecialidade
- **Modelo de fila:** paciente agenda com antecedência, mas só retira senha quando chega na clínica. Atendimento é por ordem de chegada no dia, por médico/especialidade.
- **Idioma:** Português Brasil (PT-BR) fixo. Sem i18n.
- **Dispositivo principal:** Desktop (secretária e médico usam PC). Mobile é secundário.
- **Design:** manter paleta de cores atual e melhorar progressivamente. Estilo profissional, não mudar a identidade visual.

---

## 2. Stack técnica (não mude isso)

| Camada | Tecnologia | Versão |
|---|---|---|
| Framework | Next.js (App Router) | 15 |
| Linguagem | TypeScript | strict |
| Estilização | CSS Modules (vanilla) | — |
| Banco de dados | Supabase (PostgreSQL) | — |
| Auth | Supabase Auth | — |
| Segurança DB | Row Level Security (RLS) por `clinic_id` | — |
| Deploy | Vercel | — |
| Testes | Vitest | — |
| Lint | ESLint | — |

### Regras invioláveis da stack

- **NÃO** instalar Tailwind, Chakra, MUI ou qualquer lib de UI. Estilização é CSS Modules.
- **NÃO** criar API routes separadas quando Server Actions resolverem.
- **NÃO** usar ORM (Prisma, Drizzle). Acesso ao banco é via Supabase client direto.
- **NÃO** adicionar dependências sem necessidade real. O projeto deve ser leve.
- **NÃO** criar arquivos na raiz do projeto (logs, dumps, etc). Apenas configuração essencial.
- **NÃO** mudar a paleta de cores ou identidade visual sem aprovação.

---

## 3. Arquitetura e estrutura de pastas

```
sdmedsys/
├── app/                        # Rotas Next.js 15 (App Router)
│   ├── (auth)/login/           # Página de login
│   ├── admin/                  # Painel do administrador
│   ├── secretary/              # Painel da secretária
│   ├── doctor/                 # Painel do médico
│   └── tv/                     # Display de fila para TV da sala de espera
├── features/                   # ⭐ MÓDULOS DE NEGÓCIO (feature-based)
│   ├── patients/               # Gestão de pacientes
│   ├── agenda/                 # Agenda e agendamento
│   ├── queue/                  # Fila de atendimento
│   ├── consultation/           # Workspace de consulta / prontuário
│   ├── doctors/                # Cadastro de médicos
│   └── audit/                  # Logs de auditoria
├── components/ui/              # Componentes de UI compartilhados
├── lib/                        # Supabase client, session, helpers
├── docs/decisions/             # ADRs (Architecture Decision Records)
├── middleware.ts               # Proteção de rotas por role
├── package.json
├── tsconfig.json
├── next.config.mjs
├── eslint.config.mjs
└── vitest.config.ts
```

### Padrão obrigatório de cada feature (`features/<modulo>/`)

```
features/<modulo>/
├── types.ts              # Tipos/interfaces TypeScript (espelha o schema do banco)
├── service.ts            # Lógica de negócio (chama Supabase)
├── components/           # Componentes React específicos do módulo
├── hooks/                # Custom hooks (se necessário)
└── __tests__/            # Testes unitários (Vitest)
```

**Regra:** lógica de negócio NUNCA fica dentro de componentes. Componentes chamam `service.ts`. Service chama Supabase.

---

## 4. Roles e permissões (RBAC)

Três roles de usuário + acesso especial para TV.

| Role | Rota | O que faz |
|---|---|---|
| **ADMIN** | `/admin` | Tudo: usuários, médicos, pacientes, configurações da clínica, auditoria, dashboard, especialidades |
| **SECRETARY** | `/secretary` | Pacientes (CRUD), agenda (criar/cancelar pra qualquer médico), fila (gerar ticket, chamar paciente), anexos categoria `ADMIN` |
| **DOCTOR** | `/doctor` | Somente própria agenda, workspace de consulta, prontuário, documentos clínicos (receita/atestado/laudo/encaminhamento/solicitação de exame), chamar próximo da fila, anexos `CLINICAL` + `ADMIN` |
| **TV** | `/tv` | Somente leitura: display da fila (protegido por PIN + cookie 12h) |

### Regras de acesso críticas

- Middleware (`middleware.ts`) bloqueia rotas por role no server-side.
- RLS no Supabase garante que um usuário NUNCA vê dados de outra clínica.
- A role é resolvida via tabela `profiles` vinculada a `auth.uid()`.
- Rota `/tv` usa autenticação por PIN (cookie seguro, 12h de validade).
- Onboarding de usuários: **ADMIN cria manualmente** no painel. Não há convite por email nem self-service.

### Regras de agenda por role

- **SECRETARY:** agenda, reagenda e cancela consultas para qualquer médico.
- **DOCTOR:** vê somente a própria agenda. Não edita agenda dos outros.
- **ADMIN:** vê agenda de todos os médicos (visão gerencial).

---

## 5. Modelo de dados (Supabase — schema real)

> Migração para Supabase **já está completa**. Não existem mais mocks.
> Todas as tabelas têm `clinic_id` e RLS ativo.

### 5.1 Administração e Core

#### `profiles`
Estende `auth.users`. Vínculo entre autenticação e sistema.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID | FK para `auth.users` |
| `role` | ENUM | `ADMIN`, `SECRETARY`, `DOCTOR` |
| `clinic_id` | UUID | Clínica do usuário |
| `name` | TEXT | Nome completo |

#### `clinic_settings`
Configurações globais da clínica. **Uma linha por clínica.**

| Campo | Tipo | Descrição |
|---|---|---|
| `clinic_id` | UUID | PK / FK |
| `clinic_name` | TEXT | Nome da clínica |
| `working_hours` | JSONB | Grade de horários de funcionamento |
| `appointment_duration_minutes` | INT | Duração padrão de consulta |
| `queue_prefix` | TEXT | Prefixo do ticket da fila (ex: "A") |
| `tv_refresh_seconds` | INT | Intervalo de refresh do display TV |

- **ADMIN** gerencia (incluindo horário de funcionamento). Outros roles: somente leitura.

#### `doctors`
Dados profissionais dos médicos. Pode ou não estar vinculado a um `profile_id`.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID | PK |
| `profile_id` | UUID | FK para `profiles` (opcional) |
| `clinic_id` | UUID | FK |
| `name` | TEXT | Nome completo |
| `specialty` | TEXT | Especialidade |
| `crm` | TEXT | Registro CRM |
| `phone` | TEXT | Telefone |
| `email` | TEXT | Email |
| `active` | BOOLEAN | Se está ativo na clínica |

- **ADMIN** gerencia (criar, editar, desativar). Staff vê apenas `active = TRUE`.

#### `patients`
Cadastro completo de pacientes.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID | PK |
| `clinic_id` | UUID | FK |
| `name` | TEXT | Nome completo |
| `document` | TEXT | CPF ou RG |
| `birth_date` | DATE | Data de nascimento |
| `phone` | TEXT | Telefone |
| `email` | TEXT | Email |
| `address` | TEXT | Endereço |
| `guardian_name` | TEXT | Responsável (menores/incapazes) |
| `insurance` | TEXT | Convênio |
| `main_complaint` | TEXT | Queixa principal |
| `emergency_contact` | TEXT | Contato de emergência |

### 5.2 Fluxo Operacional (Agenda → Fila)

#### `appointments`
Agendamentos de consultas.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID | PK |
| `clinic_id` | UUID | FK |
| `patient_id` | UUID | FK → `patients` |
| `doctor_id` | UUID | FK → `doctors` |
| `start_time` | TIMESTAMPTZ | Início |
| `end_time` | TIMESTAMPTZ | Fim |
| `status` | ENUM | `SCHEDULED`, `CANCELED`, `COMPLETED` |
| `notes` | TEXT | Observações do agendamento |

**Regras de negócio da agenda:**
- Paciente tem médico vinculado (preferencial), mas pode trocar e agendar com outro.
- Secretária agenda pra qualquer médico.
- Prevenção de conflito de horário por `start_time` / `end_time`.
- Duração padrão via `clinic_settings.appointment_duration_minutes`.

#### `queue_items`
Fila de atendimento — **separada por médico/especialidade, ordem de chegada.**

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID | PK |
| `clinic_id` | UUID | FK |
| `appointment_id` | UUID | FK → `appointments` (opcional — aceita walk-in/encaixe) |
| `patient_id` | UUID | FK → `patients` |
| `doctor_id` | UUID | FK → `doctors` |
| `ticket_code` | TEXT | Código visual (ex: "A001") |
| `status` | ENUM | `WAITING`, `CALLED`, `IN_SERVICE`, `DONE`, `NO_SHOW`, `CANCELED` |

**Regras de negócio da fila:**
- **Ticket é gerado pela SECRETÁRIA** quando o paciente chega na clínica (não é automático pelo agendamento).
- Paciente COM agendamento: secretária vincula o `appointment_id`.
- Paciente SEM agendamento (walk-in/encaixe): secretária cria o `queue_item` sem `appointment_id`.
- **Uma fila por médico/especialidade**, não fila única geral.
- Prefixo do ticket vem de `clinic_settings.queue_prefix`.
- **Tanto SECRETARY quanto DOCTOR podem chamar o próximo** paciente da fila.
- Display TV (`/tv`) mostra a fila por médico com polling (`clinic_settings.tv_refresh_seconds`).

### 5.3 Fluxo Clínico (Consulta → Prontuário → Documentos)

> **Fluxo:** `appointments` → `queue_items` → `consultations` → `clinical_entries` + `clinical_documents`

#### `consultations`
Registro de uma visita/atendimento. Container para os dados clínicos.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID | PK |
| `clinic_id` | UUID | FK |
| `patient_id` | UUID | FK → `patients` |
| `doctor_id` | UUID | FK → `doctors` |
| `queue_item_id` | UUID | FK → `queue_items` |
| `started_at` | TIMESTAMPTZ | Início do atendimento |
| `finished_at` | TIMESTAMPTZ | Fim do atendimento |

- **Nota:** campo antigo `clinical_notes` está **deprecated**. Usar `clinical_entries`.

#### `clinical_entries`
**Prontuário Estruturado.** Registros médicos vinculados a uma consulta.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID | PK |
| `clinic_id` | UUID | FK |
| `consultation_id` | UUID | FK → `consultations` |
| `patient_id` | UUID | FK → `patients` |
| `doctor_user_id` | UUID | FK → `auth.users` (o médico que escreveu) |
| `chief_complaint` | TEXT | Queixa principal |
| `diagnosis` | TEXT | Diagnóstico |
| `conduct` | TEXT | Conduta |
| `observations` | TEXT | Observações |
| `free_notes` | TEXT | Notas livres |
| `is_final` | BOOLEAN | Se está finalizada (imutável após `true`) |

**Regras de negócio do prontuário:**
- **Somente o médico criador** pode editar suas entries não-finais (`is_final = false`).
- Outros médicos da clínica podem **visualizar** mas NÃO editar.
- Após `is_final = true`: ninguém edita, nunca mais.
- **ADMIN**: somente leitura (auditoria).
- **SECRETARY**: acesso muito restrito (não vê conteúdo clínico).

#### `clinical_documents`
**Registro imutável** de documentos gerados pelo sistema.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID | PK |
| `clinic_id` | UUID | FK |
| `patient_id` | UUID | FK → `patients` |
| `consultation_id` | UUID | FK → `consultations` |
| `doctor_id` | UUID | FK → `doctors` |
| `created_by` | UUID | FK → `auth.users` |
| `type` | ENUM | ver tipos abaixo |
| `issued_at` | TIMESTAMPTZ | Data de emissão |
| `meta` | JSONB | Dados extras (CID, dias, medicamentos, destino, etc.) |

**Tipos de documentos clínicos:**
| Tipo | Descrição |
|---|---|
| `prescription` | Receita médica |
| `certificate` | Atestado médico |
| `report` | Laudo / relatório |
| `referral` | Encaminhamento para outro médico/especialidade |
| `exam_request` | Solicitação de exame |

- **⚠️ IMUTÁVEL: Não existe policy de UPDATE ou DELETE.** Uma vez criado, nunca é alterado.
- Inserção: `DOCTOR` e `ADMIN`.
- Leitura: staff médico da clínica.
- **⚠️ DEVE GERAR PDF** para impressão. Isso é funcionalidade necessária, não futuro.

#### `patient_attachments`
Arquivos externos anexados ao paciente (exames, documentos de identidade, etc.).

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID | PK |
| `clinic_id` | UUID | FK |
| `patient_id` | UUID | FK → `patients` |
| `uploaded_by` | UUID | FK → `auth.users` |
| `category` | ENUM | `ADMIN` ou `CLINICAL` |
| `file_name` | TEXT | Nome do arquivo |
| `file_path` | TEXT | Caminho no Supabase Storage |
| `file_type` | TEXT | MIME type |

**Partição de acesso:**
- **SECRETARY**: só `category = 'ADMIN'`.
- **DOCTOR / ADMIN**: ambas categorias.

### 5.4 Auditoria

#### `audit_logs`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID | PK |
| `clinic_id` | UUID | FK |
| `user_id` | UUID | FK → `auth.users` |
| `action` | TEXT | Ação realizada |
| `entity` | TEXT | Entidade afetada |
| `timestamp` | TIMESTAMPTZ | Quando |

- Todas as tabelas possuem trigger `updated_at` automático.

---

## 6. Fluxo principal do sistema

```
Paciente liga e agenda (ou chega direto como walk-in)
        ↓
[SECRETARY] Cadastra paciente se novo → patients
        ↓
[SECRETARY] Cria agendamento (se não for walk-in) → appointments (SCHEDULED)
        ↓
  ══════ DIA DA CONSULTA ══════
        ↓
[SECRETARY] Paciente chega → gera ticket manual → queue_items (WAITING)
        │   • COM agendamento: vincula appointment_id
        │   • SEM agendamento (encaixe): queue_item sem appointment_id
        ↓
[TV /tv] Display mostra fila POR MÉDICO em tempo real
        ↓
[SECRETARY ou DOCTOR] Chama próximo → queue_items (CALLED → IN_SERVICE)
        ↓
[DOCTOR] Abre workspace → cria consultations (started_at)
        ↓
[DOCTOR] Preenche prontuário → clinical_entries (is_final = false → true)
        ↓
[DOCTOR] Gera documentos → clinical_documents → PDF pra impressão
        │   • Receita, atestado, laudo, encaminhamento, solicitação de exame
        ↓
[DOCTOR] Finaliza → consultations (finished_at) → queue_items (DONE)
        ↓
[SECRETARY/DOCTOR] Anexa exames se necessário → patient_attachments
```

---

## 7. Painel do ADMIN — funcionalidades

O admin é o gestor da clínica. Precisa de:

| Funcionalidade | Status |
|---|---|
| Criar/desativar usuários (secretárias, médicos) | Existente (verificar bugs) |
| Configurar horário de funcionamento da clínica | Existente (verificar bugs) |
| Ver logs de auditoria (quem fez o quê) | Existente (verificar bugs) |
| Gerenciar especialidades disponíveis | Verificar se existe |
| **Dashboard básico** (consultas do dia, pacientes na fila, médicos ativos) | **Precisa ser criado** |

O dashboard básico do admin é **escopo do projeto atual**, não backlog futuro. Deve mostrar no mínimo:
- Quantidade de consultas do dia (por status)
- Pacientes na fila agora (por médico)
- Médicos ativos hoje

---

## 8. Estado atual e problemas conhecidos

> **Status: MVP com muita coisa quebrada. Supabase migrado. Código desorganizado.**
> **Tem bugs que impedem uso real. Prioridade absoluta é corrigir antes de qualquer outra coisa.**

### O que existe (mas pode estar bugado)
- Login com Supabase Auth
- CRUD de pacientes
- Agenda (visão semanal)
- Fila de atendimento com display TV
- Workspace de consulta / prontuário
- Documentos clínicos
- Roles com middleware
- RLS ativo em todas as tabelas

### Problemas conhecidos

**Lixo na raiz do projeto** — ~25 arquivos de log/debug commitados:
- `build_*.txt`, `build_*.log` (6 arquivos)
- `lint_*.json`, `lint_*.txt` (12 arquivos)
- `test_*.log`, `test_*.txt` (6 arquivos)
- `tsc_output.txt`, `audit_test.log`
- SQL de debug: `check_appointments_only.sql`, `debug_clinic_id.sql`, `fix_clinic_id_and_rls.sql`

**Migrations SQL soltas na raiz** — `supabase_*.sql` devem ir para `supabase/migrations/`.

**Bugs recorrentes de build/lint** — múltiplos logs de erro indicam instabilidade.

---

## 9. Prioridades — em ordem (respeite esta ordem)

> **O foco NÃO é adicionar features novas. É corrigir, organizar e estabilizar.**
> A ordem abaixo é lei. Não pule etapas.

### Prioridade 1: Corrigir bugs que impedem uso
- Identificar e corrigir tudo que está quebrando o fluxo principal (seção 6)
- O sistema precisa funcionar end-to-end: login → cadastrar paciente → agendar → gerar ticket → chamar → consultar → gerar documento
- Sem esse fluxo funcionando, nada mais importa

### Prioridade 2: Padronizar código
- Toda feature segue: `types.ts` → `service.ts` → `components/`
- `types.ts` espelha EXATAMENTE o schema do banco (seção 5)
- Extrair lógica de negócio de dentro de componentes para `service.ts`
- Tipar tudo — eliminar `any`, objetos sem interface
- Padronizar tratamento de erros (padrão único com feedback visual ao usuário)
- Consolidar componentes de UI duplicados em `components/ui/`

### Prioridade 3: Build e lint passando sem erros
- Zero erros de ESLint (`npm run lint`)
- Zero erros de TypeScript (`npx tsc --noEmit`)
- Build limpo (`npm run build`)
- Testes passando (`npm run test`)

### Prioridade 4: Limpar lixo e organizar
- Deletar arquivos de log/debug/dump da raiz
- Atualizar `.gitignore`
- Mover migrations para `supabase/migrations/` com numeração
- Remover código morto (mocks, stubs, `clinical_notes` deprecated)
- Criar `.env.example`
- README com setup local real

### Prioridade 5: Dashboard básico do admin
- Consultas do dia (por status)
- Pacientes na fila agora (por médico)
- Médicos ativos hoje
- Componentes simples, sem lib de gráficos — números e listas bastam

### Prioridade 6: Geração de PDF
- Receita, atestado, laudo, encaminhamento, solicitação de exame
- Gerar PDF a partir dos dados de `clinical_documents`
- Deve ser possível imprimir ou baixar

---

## 10. O que NÃO fazer agora (backlog futuro)

Estas features **NÃO** devem ser implementadas agora. Nenhum agente deve começar sem aprovação explícita do owner.

| Feature | Quando |
|---|---|
| Módulo financeiro | Pós-estabilização |
| Relatórios avançados e gráficos | Pós-estabilização |
| Notificações (email, WhatsApp) | Pós-estabilização |
| Agenda com visão diária/mensal | Pós-estabilização |
| WebSocket para fila (substituir polling) | Pós-estabilização |
| Convite de usuários por email | Pós-estabilização |
| Self-service onboarding multi-tenant | Pós-estabilização |
| Telemedicina | Futuro distante |
| App mobile | Futuro distante |
| Integração TISS/SUS | Futuro distante |
| i18n (multi-idioma) | Sem previsão |

---

## 11. Variáveis de ambiente

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...          # NUNCA no client-side

# Auth
AUTH_MODE=supabase                         # 'supabase' em prod, 'stub' para dev sem Supabase

# TV
TV_PIN=1234                                # PIN de acesso à rota /tv

# Feature flags
USE_SUPABASE=true                          # Sempre true (migração completa)
```

---

## 12. Regras para agentes do Claude Code

### ⚠️ Comportamento obrigatório dos agentes

1. **Leia este PRD inteiro** antes de qualquer tarefa.
2. **Pergunte antes de mudar algo grande** — mudanças estruturais (renomear pastas, mudar padrões, alterar schema) precisam de aprovação do owner.
3. **Siga a ordem de prioridades** da seção 9. Não pule pra feature nova se tem bug aberto.
4. **Não invente features** que não estão neste documento.
5. **Não mude a stack** em hipótese nenhuma.
6. **Não mude o visual/paleta** sem aprovação.

### Ao criar ou editar código
- Sempre TypeScript. Nunca JavaScript puro.
- Sempre CSS Modules. Nunca inline styles, nunca libs externas de CSS.
- Sempre importar tipos de `types.ts` da feature.
- Sempre chamar Supabase via `service.ts`, nunca direto no componente.
- Sempre filtrar por `clinic_id` em queries (defesa em profundidade, mesmo com RLS).
- Sempre tratar erros com try/catch e feedback visual ao usuário.
- Respeitar imutabilidade de `clinical_documents` — NUNCA update/delete.
- Respeitar partição `ADMIN`/`CLINICAL` de `patient_attachments` conforme role.
- Respeitar `is_final` de `clinical_entries` — entry finalizada é imutável.
- Respeitar que só o médico criador edita seus rascunhos.

### Ao fazer commits
- Mensagens em inglês: `type(scope): description`
- Tipos: `fix`, `feat`, `refactor`, `chore`, `docs`, `test`
- Exemplo: `fix(queue): ticket not generated for walk-in patients`

### Ao criar novos arquivos
- Dentro de `features/<modulo>/` seguindo o padrão.
- Componentes genéricos em `components/ui/`.
- Nunca na raiz do projeto.

### O que NUNCA fazer
- Adicionar dependências npm sem justificativa
- Criar API routes quando Server Actions resolvem
- Queries sem `clinic_id`
- Commitar logs, dumps, debug files
- Mudar a stack, paleta de cores ou identidade visual
- Implementar features do backlog (seção 10) sem aprovação
- Criar policies de UPDATE/DELETE em `clinical_documents`
- Permitir SECRETARY editar `clinical_entries` ou acessar attachments `CLINICAL`
- Permitir um médico editar rascunho de outro médico
- Pular a ordem de prioridades da seção 9

---

## 13. Decisões arquiteturais registradas

| Decisão | Motivo |
|---|---|
| `consultations.clinical_notes` → `clinical_entries` | Rastreabilidade e dados estruturados |
| `clinic_id` em TODAS as tabelas | Multi-tenant seguro com RLS |
| Partição `ADMIN`/`CLINICAL` em attachments | Recepção não vê exames clínicos |
| `clinical_documents` imutável | Segurança jurídica: receitas/atestados não podem ser alterados |
| `doctors.profile_id` opcional | Médico pode existir sem login (ex: visitante) |
| `clinical_entries.is_final` | Rascunhos durante consulta, trava após finalização |
| Somente médico criador edita rascunho | Responsabilidade individual sobre o registro clínico |
| Fila por médico/especialidade | Cada médico tem sua fila independente |
| Ticket gerado manualmente pela secretária | Controle de quem realmente chegou na clínica |
| Walk-in aceito (sem agendamento) | `queue_items.appointment_id` é opcional |
| CSS Modules sem lib de UI | Zero runtime, escopo local, sem dependência |
| Feature-based architecture | Módulos auto-contidos, fáceis de manter e testar |
| 5 tipos de documentos clínicos | prescription, certificate, report, referral, exam_request |
| PDF obrigatório para documentos clínicos | Médico precisa imprimir receitas e atestados |
| PT-BR fixo, sem i18n | Escopo Brasil, simplifica o código |
| Desktop first | Secretária e médico usam PC no dia a dia |
| Admin cria usuários manualmente | Sem self-service ou convite por email por enquanto |

---

## 14. Checklist de "pronto" para estabilização

Quando **todos** estiverem verdes, o sistema está estável pra uso real:

**Prioridade 1 — Bugs:**
- [ ] Fluxo completo funciona end-to-end (login → paciente → agenda → fila → consulta → documento)
- [ ] Login/logout funciona sem erros
- [ ] CRUD de pacientes funciona sem erros
- [ ] Agenda: criar, visualizar, cancelar funciona
- [ ] Fila: gerar ticket, chamar, finalizar funciona (com e sem agendamento)
- [ ] Consulta: abrir workspace, preencher prontuário, finalizar funciona
- [ ] Documentos clínicos: criar e visualizar funciona
- [ ] Roles: cada role vê apenas o que deveria
- [ ] RLS: dados isolados por clínica confirmado

**Prioridade 2 — Código:**
- [ ] Todas as features seguem `types.ts` → `service.ts` → `components/`
- [ ] `types.ts` espelha o schema real do banco
- [ ] Zero lógica de negócio dentro de componentes React
- [ ] Zero `any` desnecessário
- [ ] Tratamento de erros padronizado

**Prioridade 3 — Build:**
- [ ] `npm run lint` — zero erros
- [ ] `npx tsc --noEmit` — zero erros
- [ ] `npm run build` — passa limpo
- [ ] `npm run test` — testes passam

**Prioridade 4 — Organização:**
- [ ] Zero arquivos de log/debug na raiz
- [ ] `.gitignore` atualizado
- [ ] Migrations em `supabase/migrations/`
- [ ] `.env.example` documentado
- [ ] README com setup local real
- [ ] Código morto removido

**Prioridade 5 — Dashboard:**
- [ ] Dashboard admin com consultas do dia, fila e médicos ativos

**Prioridade 6 — PDF:**
- [ ] Geração de PDF para os 5 tipos de documentos clínicos
- [ ] PDF pode ser impresso ou baixado

---

*Este documento é a fonte da verdade. Atualize-o quando decisões mudarem.*
