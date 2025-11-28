Eu iria começar pela **Fase 2 — Pomodoro + Economia**, mas com um recorte ainda menor: um “**núcleo de sessão**” bem fechado, antes de loja, badges etc.

Hoje o protótipo já tem:

* Layout base (AppShell, Navbar, Footer, skip-link, tema claro/escuro).
* Home bem estruturada com Hero, seções, banner LGPD com persistência.
* Rotas criadas e **/pomodoro** já registrada no `router.tsx`, mas só com placeholder.
* Domínio de Pomodoro só como *stub* (`types` + `start/complete/penalize` com `console.log`).

Ou seja: a Fase 1 está praticamente encaixada, e o maior “buraco” é justamente o **fluxo real de Pomodoro**. Então eu começaria assim:

---

## Primeira etapa sugerida: “Núcleo de Sessão Pomodoro + Estado Global”

**Objetivo:** sair do placeholder em `/pomodoro` e ter **um ciclo completo de foco** funcionando, com:

* timer real,
* estados claros (`idle`, `focus`, `break`),
* flag de **sessão válida/inválida**,
* crédito de moedas apenas quando a sessão é válida,
* tudo guardado em **estado global + localStorage**.

Sem ainda se preocupar com loja, inventário ou badges.

### 1. Fechar o modelo de domínio do Pomodoro

Antes de mexer em UI:

* Refinar o tipo `Pomodoro` para algo alinhado ao backlog, incluindo pelo menos:

  * `id`, `mode` (focus / short_break / long_break),
  * `status` (idle / running / paused / finished),
  * `duration` planejada,
  * `remaining` (em segundos),
  * `isValid` (booleano),
  * campos para anti-trapaça (ex.: `lostFocusSeconds`, `invalidReason`).
* Definir as regras de negócio básicas:

  * Quando uma sessão começa, qual a duração padrão (25/5/15)?
  * Em que momento a sessão vira “inválida” (perda de foco > limiar)?
  * Quando creditar moedas (apenas ao concluir foco com `isValid=true`).

> Saída dessa etapa: **contrato claro** do objeto de sessão e das funções de domínio (start, tick, pause, resume, complete, penalizeLostFocus).

### 2. Criar o “slice” de estado (Pomodoro + Economia base)

Ainda sem UI sofisticada, trabalhar no nível de estado:

* Definir no estado global (Zustand) algo como:

  * `pomodoro`: sessão atual + fila de próximos ciclos (para break longo etc.).
  * `economy`: `coins` + função `addCoins`.
* Regras importantes:

  * **Single source of truth**: a tela lê tudo desse estado (sem `useState` solto na página).
  * Persistência em `localStorage` com uma `schemaVersion` simples.
  * No load:

    * tentar restaurar a sessão em andamento (se houver),
    * garantir que uma sessão muito antiga seja considerada expirada (não retomar algo de ontem, por exemplo).

> Saída dessa etapa: um **store funcional**, com funções de “começar foco”, “atualizar timer”, “marcar inválida”, “concluir sessão e dar moedas”.

### 3. Substituir o placeholder da rota `/pomodoro` por uma página mínima, mas correta

Aqui entra a primeira entrega visível:

* Construir uma página Pomodoro com:

  * display do tempo restante,
  * rótulo do modo atual (Foco / Pausa curta / Pausa longa),
  * botões **Iniciar / Pausar / Retomar / Encerrar** acessíveis pelo teclado,
  * um texto claro de status:

    * “Sessão válida em andamento”,
    * “Sessão inválida (perda de foco por Xs)”,
    * “Sessão concluída (+X moedas)”.
* Conectar os botões diretamente às funções do store (start, pause, resume, complete).
* Cuidar de A11Y:

  * `aria-live` para feedback ao terminar sessão ou marcar inválida.
  * Estados de foco visíveis nos botões (já alinhado com critério AA).

> Saída dessa etapa: `/pomodoro` deixa de ser um “div placeholder” e passa a demonstrar **toda a lógica de sessão + moedas**, mesmo sem histórico e loja.

### 4. Implementar o anti-trapaça mínimo (só para Foco)

Ainda nessa primeira etapa, mas de forma **simples**:

* Escutar `visibilitychange` na página do Pomodoro:

  * se sair da aba / minimizar durante foco, acumular `lostFocusSeconds`.
  * se `lostFocusSeconds > limiar` (ex.: 15s do backlog), marcar a sessão como inválida.
* Na UI:

  * mostrar claramente quando isso aconteceu (“Sessão inválida por perda de foco prolongada”).
  * garantir que a tentativa de completar uma sessão inválida **não gere moedas**.

> Saída: já cumpre a parte principal do item **5) Anti-trapaça & integridade da sessão**, mesmo que ainda sem “heartbeat” avançado.

### 5. Persistência mínima dos resultados

Por fim, ainda na mesma “primeira etapa”:

* Ao concluir ou invalidar uma sessão, registrar um item em um array de `history` no estado:

  * `id`, `start`, `end`, `duration`, `isValid`, `invalidReason`.
* Persistir esse `history` no mesmo `localStorage` (mesmo que o `/history` ainda mostre um simples “placeholder com contagem”).

> Saída: os dados já existem e poderão ser exibidos de forma rica na Fase 4 (Histórico & Badges), sem retrabalho de lógica.

---

### Por que começar por aqui?

1. **Alinha 100% com o objetivo do MVP**: “validar Pomodoro + Gamificação”, e gamificação só faz sentido com um Pomodoro confiável.
2. **Evita retrabalho**: definir o domínio e o estado antes da UI evita ter que refatorar telas depois.
3. **Prepara todas as fases seguintes**:

   * Loja só consome `coins`.
   * Histórico só consome `history`.
   * Badges só consomem contagens (sessões válidas, minutos focados, streak).

Se você quiser, no próximo passo eu posso pegar essa “primeira etapa” e transformar em uma **lista de issues** (Fase 2A) bem objetiva, com título, descrição e critérios de aceite por issue, já no formato para abrir no repositório — ainda sem nenhum trecho de código.
