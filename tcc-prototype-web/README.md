# tcc-prototype-web

Protótipo paralelo (React + TypeScript + Vite) — escopo inicial.

## Como rodar

1. Instale dependências:

```bash
npm install
```

2. Rodar em desenvolvimento:

```bash
npm run dev
```

3. Testes unitários:

```bash
npm run test
```

4. E2E (Playwright):

```bash
npm run e2e
```

## Scripts importantes
- dev, build, preview
- test (vitest --run), test:watch
- lint (eslint src --ext .ts,.tsx), format (prettier --write .)
- e2e (playwright test)

## Padrões e ferramentas
- ESLint + Prettier (configuração recomendada), commitlint, husky, lint-staged
- Tailwind CSS para UI
 - MUI (Material UI) para UI (migrado de Tailwind)
- React Router, Zustand
- i18n preparado (pt-BR default)
- Acessibilidade: integração de @axe-core/react em desenvolvimento

## Escopo
Protótipo paralelo sem backend. Guardamos preferências e progresso em localStorage (LGPD: apenas local).

## Inventario e Politica de Itens
- Fluxo persistente: compra na loja grava em `userInventory` no Supabase e a tela de inventario consome esses dados.
- Politica adotada: itens unicos por usuario (`UNIQUE (userId, itemId)`), abordagem simples e defensavel para o TCC.
- Preparacao para evolucao: inventario possui campos para equipar/aplicar item (`isEquipped`, `equipSlot`, `appliedTarget`), mantendo base para personalizacao de ambiente/personagem/pet.
- Integracao imediata: apos compra, a loja dispara recarga do inventario e a store usa sincronizacao realtime para refletir mudancas sem refresh manual.

## Admin da Loja e RLS (Supabase)
- O CRUD administrativo de itens depende de policies RLS de escrita na tabela `shopItems`.
- Se aparecer erro como `new row violates row-level security policy for table \"shopItems\"`, aplique o script:

`supabase/sql/economy/alter_shop_items_admin_policies.sql`

- Como aplicar no Supabase:
1. Abra o projeto no painel do Supabase.
2. Entre em `SQL Editor`.
3. Cole e execute o conteudo de `alter_shop_items_admin_policies.sql`.

- Observacao: este script libera escrita para usuarios autenticados (modo prototipo). Para producao, substitua por policy restrita a papel admin.

## Pet Virtual e Politica de Alimentacao
- O pet virtual e persistido por usuario em `userPetStates`, com um registro por conta.
- Politica adotada para o TCC: alimentar custa `5` moedas e possui cooldown de `60` segundos.
- Justificativa academica: integra economia real do sistema com acao de cuidado, mantendo regra simples, auditavel e demonstravel em banca.
- Integridade transacional: a funcao `feed_user_pet` valida saldo, debita carteira, registra transacao e atualiza estado do pet no mesmo fluxo.

## Rodando com Docker (portas ajustadas)

Se você tem outra aplicação usando as portas padrão do Vite, alterei as portas do protótipo para evitar conflito:

- Desenvolvimento (dev server): http://localhost:5174 (mapeado via docker-compose)
- Preview/produção (vite preview): porta 4174

Usando docker-compose (modo dev):

```bash
cd tcc-prototype-web
docker compose up --build
```

Acessar: http://localhost:5174

### Supabase + recuperação de senha no Docker

Para o fluxo de "Esqueci minha senha" funcionar corretamente, configure a URL base do app no `.env`:

```bash
VITE_AUTH_REDIRECT_URL=http://localhost:5174
```

O link enviado por e-mail apontará para `/reset-password` usando essa base.

No painel do Supabase (`Authentication` -> `URL Configuration`), adicione também na allow list:

- `http://localhost:5174/reset-password`
- (opcional) `http://localhost:4174/reset-password` para preview/produção local via Docker

### Observações sobre o tema

Este projeto foi migrado para usar MUI (Material UI) para componentes e tema. O provider padrão do MUI (`ThemeProvider`) e `CssBaseline` já estão configurados em `src/main.tsx` e o tema base está em `src/theme.ts`.

Build de produção e rodar a imagem:

```bash
cd tcc-prototype-web
docker build -t tcc-prototype-web:latest .
docker run -p 4174:4174 tcc-prototype-web:latest
```

Se preferir restaurar as portas padrão (5173/4173), posso ajustar os arquivos novamente.
