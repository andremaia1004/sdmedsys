# Resposta para o Antigravity — Cole isso:

---

Leia o PRD.md. Temos 7 bugs pra corrigir HOJE. Ordem por dependência e criticidade.

## PLANO DE CORREÇÃO — 7 BUGS

---

### BUG 1 (CRÍTICO): Upload de anexos não funciona

**Problema:** Na tela de detalhes do paciente e na consulta do médico, não existe botão/opção para fazer upload de arquivos (exames, documentos).

**Investigação:**
1. Verifique se Supabase Storage está configurado:
```sql
-- Via MCP, verifique se existe bucket
SELECT * FROM storage.buckets;
```

2. Verifique o código:
   - `features/documents/service.attachments.ts` existe? Tem função de upload?
   - `features/patients/components/` tem componente de anexos? O botão de upload está renderizando?
   - Na consulta (`features/consultation/components/ConsultationWorkspace.tsx`), tem seção de anexos?

3. Verifique `patient_attachments`:
```sql
SELECT count(*) FROM patient_attachments;
```

**O que precisa funcionar:**
- **Na tela do paciente** (detalhes): aba/seção "Anexos" com botão de upload
- **Na consulta do médico** (workspace): seção de anexos com botão de upload
- Upload vai pro Supabase Storage, registro em `patient_attachments`
- Respeitar categorias: SECRETARY só faz upload `ADMIN`, DOCTOR faz upload `CLINICAL` e `ADMIN`
- Mostrar lista de arquivos já anexados com opção de download

**Commit:** `fix(attachments): implement file upload in patient details and consultation workspace`

---

### BUG 2 (CRÍTICO): Médico não vê seus pacientes + vincular médico no cadastro

**Problema:** O médico não tem acesso aos pacientes dele no perfil. A causa raiz é que não existe vínculo médico↔paciente no cadastro.

**Correção em 2 partes:**

**2A — Adicionar campo `doctor_id` na tabela `patients`:**

```sql
-- Migration: adicionar médico responsável ao paciente
ALTER TABLE patients ADD COLUMN doctor_id UUID REFERENCES doctors(id);

-- Index pra performance
CREATE INDEX idx_patients_doctor_id ON patients(doctor_id);
```

Aplicar via MCP (`apply_migration`).

**2B — Atualizar o formulário de cadastro de paciente:**
- Em `features/patients/components/PatientForm.tsx`: adicionar campo select "Médico responsável"
- O select lista todos os médicos ativos da clínica (`doctors WHERE active = true AND clinic_id = X`)
- Campo opcional (paciente pode não ter médico fixo ainda)

**2C — Atualizar o painel do médico:**
- Na rota do médico (`app/(dashboard)/doctor/`), a lista de pacientes deve filtrar:
```sql
SELECT * FROM patients WHERE doctor_id = (SELECT id FROM doctors WHERE profile_id = auth.uid()) AND clinic_id = X;
```
- O médico vê APENAS os pacientes vinculados a ele

**2D — Atualizar types.ts:**
- Adicionar `doctor_id: string | null` em `Patient`

**Commits:**
```
fix(patients): add doctor_id column to patients table
fix(patients): add doctor select to patient registration form
fix(doctor): show only linked patients in doctor panel
```

---

### BUG 3 (ALTO): Painel do dia — mostrar médico que atende o paciente

**Problema:** No painel do dia (dashboard), não aparece qual médico vai atender cada paciente.

**Correção:**
- Na query que alimenta o painel do dia, fazer JOIN com `doctors` via `appointments.doctor_id`
- Mostrar nome do médico ao lado de cada paciente/agendamento no card ou tabela
- Se o paciente veio por walk-in (queue_items sem appointment), mostrar o médico do `queue_items.doctor_id`

**Commit:** `fix(dashboard): show doctor name in daily panel appointments`

---

### BUG 4 (ALTO): Painel do dia — ticket de fila com prioridade

**Problema:** Não existe opção de gerar ticket prioritário (idosos, PCDs, gestantes, lactantes).

**Correção:**

Adicionar campo `priority` na tabela `queue_items`:

```sql
ALTER TABLE queue_items ADD COLUMN priority TEXT NOT NULL DEFAULT 'normal'
  CHECK (priority IN ('normal', 'elderly', 'pcd', 'pregnant', 'lactating'));
```

No código:
- `features/queue/types.ts`: adicionar `priority: 'normal' | 'elderly' | 'pcd' | 'pregnant' | 'lactating'`
- No formulário de gerar ticket (secretária): adicionar select de prioridade com as opções:
  - Normal
  - Idoso (65+)
  - PCD
  - Gestante
  - Lactante
- Na fila: tickets prioritários aparecem **antes** dos normais (dentro da mesma fila do médico)
- Na TV: mostrar badge/ícone indicando prioridade
- No ticket_code: diferenciar (ex: "P001" pra prioritário, "A001" pra normal)

**Commits:**
```
fix(queue): add priority field to queue_items
fix(queue): add priority selection when generating ticket
fix(queue): prioritize elderly/pcd/pregnant in queue ordering
```

---

### BUG 5 (ALTO): TV — mostrar apenas pacientes do dia

**Problema:** A TV está mostrando todos os queue_items, não só os do dia atual.

**Correção:**
- Na query que alimenta a TV, filtrar por `created_at::date = CURRENT_DATE`
- Verificar em `app/tv/` ou `features/queue/` onde está o fetch da TV
- Garantir que queue_items de dias anteriores não apareçam

```sql
-- A query da TV deve incluir:
WHERE clinic_id = X 
  AND created_at::date = CURRENT_DATE
  AND status IN ('WAITING', 'CALLED', 'IN_SERVICE')
ORDER BY priority DESC, created_at ASC
```

**Commit:** `fix(tv): filter queue to show only today's patients`

---

### BUG 6 (MÉDIO): TV — redesign com identidade visual

**Problema:** TV precisa de redesign para mostrar: nome do paciente, qual médico, lista dos próximos.

**Correção:**
- Redesenhar `features/queue/components/TVBoard.tsx` (ou equivalente)
- Layout proposto:

```
┌─────────────────────────────────────────────────┐
│            [LOGO DA CLÍNICA]                     │
│         Nome da Clínica (clinic_settings)        │
├─────────────────────────────────────────────────┤
│                                                  │
│   🔔 CHAMANDO AGORA                             │
│   ┌──────────────────────────────────────────┐  │
│   │  SENHA: A001  |  PACIENTE: João Silva    │  │
│   │  MÉDICO: Dr. Carlos - Clínico Geral     │  │
│   └──────────────────────────────────────────┘  │
│                                                  │
├─────────────────────────────────────────────────┤
│   PRÓXIMOS:                                      │
│   ┌──────┬──────────────┬──────────────────┐    │
│   │ A002 │ Maria Santos │ Dr. Ana - Cardio │    │
│   │ A003 │ Pedro Lima   │ Dr. Carlos       │    │
│   │ P004 │ Rosa Idosa ⭐│ Dr. Ana - Cardio │    │
│   └──────┴──────────────┴──────────────────┘    │
│                                                  │
│   ⭐ = Prioridade                                │
└─────────────────────────────────────────────────┘
```

- Usar a paleta de cores atual do sistema (não inventar cores novas)
- Logo da clínica: puxar de `clinic_settings` ou Supabase Storage (se tiver)
- Font grande, legível de longe
- CSS Modules (TVBoard.module.css)
- Mostrar badge de prioridade (⭐ ou ícone) nos tickets prioritários
- Separar visualmente "CHAMANDO AGORA" (destaque) dos "PRÓXIMOS" (lista)

**Commit:** `feat(tv): redesign TV display with clinic branding and doctor info`

---

### BUG 7 (MÉDIO): Erro ao subir logo da clínica

**Problema:** Upload de logo no perfil da clínica não funciona.

**Investigação:**
1. Verifique se existe bucket no Supabase Storage pra logos:
```sql
SELECT * FROM storage.buckets WHERE name LIKE '%logo%' OR name LIKE '%clinic%' OR name LIKE '%avatar%';
```

2. Se não existir, criar:
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('clinic-logos', 'clinic-logos', true);
```

3. Verifique o código em `app/(dashboard)/admin/settings/` ou equivalente — onde está o form de upload da logo?

4. Verifique se `clinic_settings` tem campo pra armazenar o path da logo:
```sql
SELECT column_name FROM information_schema.columns WHERE table_name = 'clinic_settings';
```

Se não tiver, adicionar:
```sql
ALTER TABLE clinic_settings ADD COLUMN logo_url TEXT;
```

**Commit:** `fix(settings): fix clinic logo upload to Supabase Storage`

---

## ORDEM DE EXECUÇÃO

```
BUG 2 → Médico + pacientes (foundation — afeta bug 3)
BUG 1 → Upload de anexos (foundation — afeta UX geral)
BUG 3 → Painel do dia + médico (depende do bug 2)
BUG 4 → Fila com prioridade (depende de migration)
BUG 5 → TV só pacientes do dia (quick fix)
BUG 7 → Logo da clínica (investigar + fix)
BUG 6 → TV redesign (o mais demorado, fazer por último)
```

## REGRAS

- **Um bug por vez.** Diagnostique → me mostre → corrija → commit → próximo.
- Use o MCP pra verificar schema e dados antes e depois de cada correção.
- Commits isolados por bug.
- Se precisar de migration (ALTER TABLE), me mostre o SQL antes de aplicar.
- Mantenha o padrão de `ActionResponse` e toasts que acabamos de implementar.
- CSS Modules pra qualquer mudança visual. Sem libs externas.

Comece pelo BUG 2 (médico + pacientes). Diagnostique primeiro.
