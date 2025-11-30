# Implementação: Núcleo de Sessão Pomodoro (feature/pomodoro-core)

Este documento descreve, de forma didática, o que foi implementado na branch `feature/pomodoro-core`, por que fizemos cada mudança e o que esperar como próximo passo.

## Objetivo

Entregar um "núcleo de sessão" Pomodoro funcional no protótipo: domínio (tipos), store global (Zustand) com persistência mínima, página `/pomodoro` conectada ao store, e um mecanismo simples anti-trapaça baseado em `visibilitychange`.

Essa implementação estabelece a base necessária para a gamificação (crédito de moedas), histórico e integrações futuras (loja, badges), evitando retrabalho ao definir o domínio e a fonte única de verdade (single source of truth).

-## Arquivos alterados / criados

- `tcc-prototype-web/src/domain/pomodoro/types/PomodoroMode.ts` — tipo `PomodoroMode` (focus / short_break / long_break).
- `tcc-prototype-web/src/domain/pomodoro/types/PomodoroStatus.ts` — tipo `PomodoroStatus` (idle / running / paused / finished).
- `tcc-prototype-web/src/domain/pomodoro/types/Pomodoro.ts` — tipo `Pomodoro` com `pomodoroId: PomodoroId` e campos de sessão.
- `tcc-prototype-web/src/domain/pomodoro/types/PomodoroHistoryItem.ts` — tipo `PomodoroHistoryItem` com `pomodoroHistoryItemId: PomodoroHistoryItemId`.
- `tcc-prototype-web/src/state/usePomodoroStore.ts` — store Zustand com ações de domínio (start, tick, pause, resume, complete, penalize), persistência em `localStorage` e histórico.
- `tcc-prototype-web/src/pages/Pomodoro/PomodoroPage.tsx` — página mínima do Pomodoro: display do tempo, modo atual, botões Iniciar/Pausar/Retomar/Encerrar, handlers de visibilidade e timer.
- `tcc-prototype-web/src/app/router.tsx` — rota `/pomodoro` agora aponta para `PomodoroPage` (substitui o placeholder).
- `04-15-11-2025-1145/guias/02-Implementacao-Pomodoro-Core.md` — este arquivo explicativo (você está lendo).

## O que foi implementado e por quê

1. Tipos do domínio (pasta `types/`)

   - Foi ampliado o tipo `Pomodoro` com campos necessários para controlar o ciclo: `mode`, `status`, `duration`, `remaining`, `isValid`, `lostFocusSeconds`, timestamps (`startedAt`, `endedAt`) e `invalidReason`.
   - Adicionamos `PomodoroHistoryItem` para armazenar um log simples ao finalizar ou invalidar uma sessão.

   Por que: ter um contrato claro evita refatorações nas camadas superiores (UI / store) e facilita o consumo por loja/badges/histórico.

2. Store global (Zustand)

   - Implementada a store `usePomodoroStore` com ações:
     - `startPomodoro({ duration, mode })`
     - `tickPomodoro()` (decrementa `remaining`), `pausePomodoro()`, `resumePomodoro()`
     - `completePomodoro()` (registra `history`, zera sessão e credita moedas se `isValid`)
     - `penalizeLostFocus(seconds)` (acumula `lostFocusSeconds` e marca inválida se ultrapassar limiar)
     - `addCoins(amount)`, `loadFromStorage()`, `clearExpiredSession()`
   - Persistência simples em `localStorage` sob a chave `pomodoro_state_v1`.
   - Regras embutidas: crédito de moedas somente se `isValid === true`; sessão expirada (>24h) é descartada ao carregar.

   Por que: centralizar estado e regras garante comportamento consistente entre componentes e prepara a base para auditoria, testes e evolução do sistema econômico.

3. Página `/pomodoro`

   - Página minimal: exibe tempo restante, modo atual, estado de validade e botões para controlar a sessão.
   - `aria-live` foi usado em duas regiões para fornecer feedback assistivo ao usuário ao mudar estado.
   - O componente faz:
     - `loadFromStorage()` ao montar para restaurar estado salvo.
     - um `setInterval` simples que chama `tickPomodoro()` a cada segundo quando a sessão está `running`.
     - handlers de `visibilitychange` para medir tempo em que a aba ficou oculta e repassar esse tempo para `penalizeLostFocus(seconds)`.

   Por que: entregar uma interface de uso real para validar o fluxo, sem a complexidade visual final. A detecção de perda de foco via `visibilitychange` é uma solução simples e eficaz para começar a evitar trapaças.

4. Anti-trapaça (mínimo)

   - Estratégia: quando a aba fica oculta, registramos `hiddenAt`; ao voltar, calculamos segundos perdidos e aplicamos `penalizeLostFocus(seconds)` na store.
   - Threshold (durável em store): `LOST_FOCUS_THRESHOLD = 15` segundos — acima disso a sessão é marcada inválida.

   Por que: é um primeiro passo para integridade da sessão. Futuras melhorias podem incluir heartbeat, foco de janela, ou checagens por atividade do usuário.

## Decisões e trade-offs

- Persistência foi implementada de forma simples (JSON em `localStorage`) para ser direta e fácil de inspecionar. Se quisermos trocar para um armazenamento assíncrono (IndexedDB) ou backend, a store pode ser adaptada.
- O `tick` é acionado pela página via `setInterval` em vez de um timer central no store. Isso reduz complexidade e evita timers corriendo quando a página está inativa; se precisarmos suportar timers mesmo com a aba em background, podemos mover o mecanismo para um worker ou usar uma abordagem baseada em timestamps.
- Valores como moedas por sessão (`5`) e limiar de perda de foco (`15s`) foram definidos por configuração direta no store e podem (devem) virar constantes configuráveis no futuro.

## Como testar manualmente (passos rápidos)

1. No seu ambiente local com a branch `feature/pomodoro-core`:

```bash
git checkout feature/pomodoro-core
pnpm install # ou npm install / yarn
pnpm dev
```

2. Acesse `http://localhost:5173/pomodoro` (ou porta do seu dev server).
3. Clique em `Iniciar` — o tempo deve começar a decrementar.
4. Minimize ou troque de aba por mais de ~15s e volte: a página deve mostrar "Sessão inválida".
5. Complete uma sessão válida (deixe o timer acabar ou clique em `Encerrar`) e verifique que `economy.coins` foi incrementado (inspecione o estado no console ou no localStorage `pomodoro_state_v1`).

## Próximos passos recomendados

1. Ajustar valores configuráveis (duração padrão, moedas por sessão, limiar anti-trapaça) para ficarem centralizados.
2. Criar testes unitários para a store (ações start/tick/complete/penalize) e testes E2E para o fluxo na UI.
3. Expor o histórico em uma página `/history` consumindo `history` do store.
4. Integrar com a loja: consumir `economy.coins` para compras.
5. Melhorar anti-trapaça (heartbeat, verificação de atividade do usuário, integração com backend para provas de integridade se necessário).

## Commits e PR

- Branch criada: `feature/pomodoro-core`.
- PR sugerido: `feat(pomodoro): core session store, page and anti-cheat` com checklist dos critérios de aceite descritos no guia principal.

Se quiser, eu já abro o PR com os commits feitos; também posso ajustar limiares/valores ou separar as mudanças em commits menores. O que prefere a seguir?
