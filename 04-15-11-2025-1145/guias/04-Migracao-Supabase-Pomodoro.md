# Migração da Persistência para Supabase — Pomodoro Core

Este documento descreve, passo a passo, como migrar a camada de persistência atual (arquivo/local) para Supabase no projeto `tcc-prototype-web`.

**Objetivo:** usar Supabase para armazenar sessões/pomodoros do usuário, habilitar sincronização em tempo real e autenticação, mantendo comportamento offline/recuperação quando necessário.

**Pré-requisitos:**
- Conta Supabase criada e um projeto ativo.
- `supabase` CLI (opcional, para migrações/seeds).
- Projeto local com Node/Vite configurado.

**Visão geral das etapas:**
- Criar esquema no banco (tabelas + RLS)
- Adicionar cliente Supabase ao frontend
- Migrar operações de `usePomodoroStore.ts` para usar Supabase (CRUD + realtime)
- Integrar autenticação (Supabase Auth)
- Testar offline/online e adicionar fallback local
- Criar migrações e seeds
- Documentar e publicar

**Nomes de variáveis de ambiente recomendadas (Vite):**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Nunca coloque a `SERVICE_ROLE` key no cliente. Use-a apenas em scripts server-side quando necessário.

**Instalação (frontend)**
```
npm install @supabase/supabase-js
```

**1) Definir esquema de banco (exemplo SQL)**

Tabela principal: `pomodoros`

```sql
-- cria a tabela de pomodoros
create table if not exists pomodoros (
  pomodoroId uuid default gen_random_uuid() primary key,
  userId uuid references auth.users(id) on delete cascade,
  title text,
  durationMinutes int,
  startedAt timestamptz,
  endedAt timestamptz,
  isComplete boolean default false,
  metadata jsonb,
  createdAt timestamptz default now(),
  updatedAt timestamptz default now()
);

create index if not exists idx_pomodoros_userId on pomodoros(userId);

-- trigger para atualizar `updatedAt`
create or replace function set_updated_at() returns trigger as $$
begin
  new.updatedAt = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_updated_at
  before update on pomodoros
  for each row
  execute function set_updated_at();
```

RLS (Row Level Security) básica — permitir que o usuário veja apenas seus registros:

```sql
alter table pomodoros enable row level security;

create policy "users can access own pomodoros"
  on pomodoros
  for all
  using (auth.uid() = userId)
  with check (auth.uid() = userId);
```

Observação: `auth.uid()` é a função do Supabase (Postgres) que mapeia o usuário autenticado. Ajuste caso use outra estratégia.

**2) Criar cliente Supabase no frontend**

Arquivo sugerido: `src/lib/supabaseClient.ts`

```ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: { params: { eventsPerSecond: 10 } }
});

export default supabase;
```

Observações:
- Use `VITE_` prefix para exposição ao cliente com Vite.
- Ajuste as opções `realtime` se precisar de tuning.

**3) Mapear operações necessárias (analisar `usePomodoroStore.ts`)**

Revisar o arquivo `src/state/usePomodoroStore.ts` e identificar os métodos a migrar:
- obter lista de pomodoros do usuário (read / list)
- criar um novo pomodoro (create)
- atualizar pomodoro (update)
- remover pomodoro (delete)
- sincronizar estado em tempo real (subscribe)

Para cada operação, vamos substituir o acesso local por chamadas ao Supabase.

Exemplos de CRUD com `supabase`:

```ts
// listar
const { data, error } = await supabase
  .from('pomodoros')
  .select('*')
  .eq('userId', userId)
  .order('createdAt', { ascending: false });

// criar
const { data, error } = await supabase
  .from('pomodoros')
  .insert([{ userId: userId, title, durationMinutes: duration }])
  .select()
  .single();

// atualizar
const { data, error } = await supabase
  .from('pomodoros')
  .update({ isComplete: true, endedAt: new Date().toISOString() })
  .eq('pomodoroId', pomodoroId)
  .select()
  .single();

// remover
const { error } = await supabase
  .from('pomodoros')
  .delete()
  .eq('pomodoroId', pomodoroId);
```

**4) Realtime: receber updates em tempo real**

Exemplo de subscription para `pomodoros`:

```ts
const channel = supabase
  .channel('public:pomodoros')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'pomodoros' }, payload => {
    // payload.new / payload.old — atualize sua store local
  })
  .subscribe();

// para cancelar
channel.unsubscribe();
```

Integre o subscription ao lifecycle do `usePomodoroStore` para manter a store sincronizada.

**5) Integração com autenticação**

- Use Supabase Auth (email/password, OAuth). No frontend, ouça mudanças de sessão e recarregue dados quando o usuário entrar/sair.

Exemplo rápido:

```ts
supabase.auth.onAuthStateChange((event, session) => {
  // recarregar dados: carregar pomodoros do `session.user.id`
});
```

No `usePomodoroStore`, mantenha `userId` a partir de `session?.user?.id` e use-o como `user_id` nas queries.

**6) Fallback offline / cache local**

- Mantenha um cache local (IndexedDB ou localStorage) para permitir operações offline.
- Estratégia:
  - Ler do cache ao inicializar para UI responsiva.
  - Enfileirar operações mutativas quando offline (queue) e sincronizar quando voltar online.
  - Resolver conflitos com estratégias timestamp / last-write-wins ou lógica de merge específica.

Bibliotecas úteis: `idb` (IndexedDB wrapper) ou manter um JSON no `localStorage` para dados pequenos.

Exemplo simples (pseudo):

```ts
// ao criar pomodoro offline -> salvar no cache com flag `pending: true`
// ao reconectar -> enviar ao Supabase e remover a flag pending
```

**7) Migrações e seeds**

- Use o `supabase` CLI ou o painel SQL do Supabase para aplicar o SQL do esquema. Exemplo com CLI:

```bash
supabase db remote set <PROJECT_REF>
supabase db push --file migrations/create_pomodoros.sql
```

- Criar um script de `seed.sql` para dados iniciais (opcional).

**8) Testes e validação**

- Teste manual com um usuário real: criar, atualizar, excluir pomodoros; validar que RLS bloqueia acesso indevido.
- E2E: adapte testes (Playwright) para fazer login via Auth e executar fluxos de CRUD.

**9) Observações de segurança e boas práticas**

- Nunca expor `SERVICE_ROLE` key no cliente.
- Use RLS para proteger dados por usuário.
- Limite permissões e valide inputs no backend (políticas/SQL) quando necessário.
- Monitorar limites de requisições e custos do projeto Supabase.

**10) Checklist de commit / PR**

- [ ] Adicionar `@supabase/supabase-js` em `package.json`
- [ ] Criar `src/lib/supabaseClient.ts` e exportar `supabase`
- [ ] Atualizar `src/state/usePomodoroStore.ts` para usar Supabase (criando funções auxiliares se necessário)
- [ ] Implementar subscription e cleanup
- [ ] Implementar fallback cache/offline
- [ ] Adicionar migração SQL em `migrations/` ou instruções no README
- [ ] Atualizar `README.md` com env vars e passos de deploy

---

Se quiser, eu posso:
- abrir um branch/commit com `src/lib/supabaseClient.ts` criado;
- editar `src/state/usePomodoroStore.ts` propondo mudanças concretas (PR-ready);
- gerar os arquivos de migração SQL em `tcc-prototype-web/migrations/`.

Diga qual desses passos você quer que eu execute primeiro — criar o client, modificar a store, ou gerar as migrations.
