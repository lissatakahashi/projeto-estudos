# Guia 08: Solução do Erro de Variáveis de Ambiente

Se você encontrou o erro abaixo no console do navegador, este guia explica o que aconteceu e como resolver.

> **Erro:** `Uncaught Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in development`

## 1. O que aconteceu?

O código da nossa aplicação (especificamente no arquivo **[client.ts](file:///Users/evertoncoimbradearaujo/Documents/GitHub/Projeto-Estudos/tcc-prototype-web/src/lib/supabase/client.ts)**) precisa saber o endereço do seu banco de dados Supabase e a sua chave pública (Anon Key) para funcionar.

Como essas informações podem mudar de um projeto para outro, nós não as escrevemos diretamente no código por segurança. Em vez disso, usamos **Variáveis de Ambiente**.

O erro acontece porque o servidor de desenvolvimento (Vite) não encontrou essas variáveis configuradas.

---

## 2. Como Resolver (Passo a Passo)

### Passo 1: Localizar os dados no Supabase
1. Acesse o painel do seu projeto no [Supabase](https://supabase.com).
2. Vá em **Project Settings** > **API**.
3. Copie a **Project URL** e a **anon public key**.

### Passo 2: Configurar o arquivo `.env`
No seu computador, na pasta raiz do projeto frontend (`tcc-prototype-web`):
1. Verifique se existe um arquivo chamado `.env`.
2. O arquivo deve usar o prefixo **`VITE_`** para que o React consiga ler os valores:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
```

> [!IMPORTANT]
> Sem o prefixo `VITE_`, o Vite ignora as variáveis por segurança e elas não chegam ao navegador, causando o erro que vimos.

### Passo 3: Reiniciar o Servidor
Após salvar o arquivo `.env`, você deve parar o servidor (Ctrl + C no terminal) e iniciá-lo novamente:

```bash
npm run dev
```

---

## 3. Uso com Docker (Containers)

Se você está rodando o projeto via Docker Compose, também atualizamos a configuração para carregar automaticamente o arquivo `.env`.

Nos arquivos `docker-compose.yml`, `docker-compose.dev.yml` e `docker-compose.prod.yml`, adicionamos a diretiva `env_file`:

```yaml
services:
  web:
    # ...
    env_file:
      - .env
```

### 3.1 Hot Module Replacement (Watch)
Sim, o modo **Watch** (HMR) está ativo no container! 

Configuramos o volume no Docker para espelhar sua pasta local (`./:/app`). Para garantir que o Vite perceba as mudanças de arquivos no macOS (que às vezes não envia alertas de sistema para dentro do container), ativamos o `usePolling: true` no arquivo **[vite.config.ts](file:///Users/evertoncoimbradearaujo/Documents/GitHub/Projeto-Estudos/tcc-prototype-web/vite.config.ts)**.

Isso garante que, ao salvar um arquivo no VS Code, a tela no navegador dentro do Docker atualize instantaneamente.

---

## 4. Por que isso é importante para a aluna?

Este é um conceito fundamental em desenvolvimento profissional:
- **Segurança**: Nunca colocamos chaves de acesso diretamente no código que vai para o GitHub.
- **Portabilidade**: O mesmo código pode rodar em "Desenvolvimento" (sua máquina) e "Produção" (na internet) apenas trocando o arquivo de configuração.

---

## ✅ Verificação de Sucesso
Após seguir os passos, recarregue a página. O erro deve sumir das ferramentas de desenvolvedor e o sistema de Login passará a funcionar corretamente!
