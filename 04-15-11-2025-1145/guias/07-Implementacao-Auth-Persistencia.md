# Guia 07: Implementação de Autenticação e Persistência Supabase

Este guia explica detalhadamente como integramos o sistema de login e a persistência de dados do Pomodoro no banco de dados Supabase. Este é um tutorial focado no entendimento do fluxo de dados para estudantes.

## 1. Por que Autenticação e Persistência?

Até agora, o Pomodoro salvava tudo no `localStorage` (navegador). Se o usuário limpasse os dados ou trocasse de computador, perdia tudo.
- **Autenticação**: Identifica quem é o usuário.
- **Persistência**: Garante que os dados (sessões de estudo, moedas) fiquem guardados na nuvem (Supabase).

---

## 2. Fluxo de Autenticação

Usamos o **Supabase Auth** para gerenciar usuários. Criamos duas novas páginas:
- **[RegisterPage](file:///Users/evertoncoimbradearaujo/Documents/GitHub/Projeto-Estudos/tcc-prototype-web/src/pages/Auth/RegisterPage.tsx)**: Para criar novas contas.
- **[LoginPage](file:///Users/evertoncoimbradearaujo/Documents/GitHub/Projeto-Estudos/tcc-prototype-web/src/pages/Auth/LoginPage.tsx)**: Para acessar contas existentes.

### O Hook `useAuthSession`
No arquivo `src/lib/supabase/hooks.ts`, usamos o hook `useAuthSession`. Ele "escuta" o Supabase para saber se alguém logou ou deslogou. Quando o estado muda, ele atualiza a aplicação automaticamente.

```typescript
// Exemplo de como escutamos mudanças de login
supabase.auth.onAuthStateChange((_event, session) => {
  // Se houver session, o usuário está logado!
});
```

---

## 3. Integrando o Estado Global (Zustand)

O arquivo **[usePomodoroStore.ts](file:///Users/evertoncoimbradearaujo/Documents/GitHub/Projeto-Estudos/tcc-prototype-web/src/state/usePomodoroStore.ts)** é o coração da lógica. Fizemos três grandes mudanças:

### A. Adicionamos o `userId`
Agora a Store sabe quem está logado:
```typescript
userId: string | null;
setUserId: (id: string | null) => void;
```

### B. Funções Assíncronas (`async/await`)
Como falar com o banco de dados leva tempo, funções como `startPomodoro` e `completePomodoro` agora são `async`.

### C. Sincronização em tempo real
- Ao **Iniciar**: Criamos um registro no Supabase e guardamos o ID retornado.
- Ao **Concluir**: Atualizamos esse mesmo registro no banco marcando como concluído.

---

## 4. Mapeamento de Dados (Mappers)

O banco de dados (Supabase) tem nomes de colunas diferentes do nosso código TypeScript. Usamos "Mappers" no arquivo `pomodoroService.ts` para converter entre os dois formatos:
- `mapPomodoroToRecord`: Transforma o objeto do código para o formato que o banco aceita.
- `mapRecordToPomodoro`: Transforma o que vem do banco para o formato que o código entende.

---

## 5. Como Testar (Passo a Passo)

Para validar se tudo está funcionando:

1.  **Registro**: Vá em "Registrar" na Navbar e crie uma conta de teste.
2.  **Login**: Entre com seu e-mail e senha.
3.  **Verificação**: O seu e-mail deve aparecer na Navbar.
4.  **Pomodoro**: Inicie um timer de foco.
5.  **Persistência**: Se você tiver acesso ao painel do Supabase, verá uma linha na tabela `pomodoros` com `isComplete: false`.
6.  **Conclusão**: Ao terminar o tempo, a linha no banco mudará para `isComplete: true`.
7.  **Histórico**: Atualize a página e veja que o contador de histórico (ou lista) permanece lá, pois foi recarregado do banco!

---

## 💡 Dica para a Aluna

Observe como o `usePomodoroStore` mantém o `localStorage` como um "fallback". Mesmo se a internet cair, o dado continua no navegador, e quando o usuário loga ou a página recarrega, tentamos sincronizar com a nuvem. Este é o conceito de **Offline-First** ou persistência híbrida.
