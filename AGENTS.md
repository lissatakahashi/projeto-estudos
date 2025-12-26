# Padrão de Nomenclatura para Pastas de Documentação

Sempre que solicitar a criação de uma pasta para documentação da sua interação, será utilizado o seguinte padrão:

`NN-DD-MM-AAAA-HHMM`

- **NN**: Número sequencial da interação ou pasta
- **DD-MM-AAAA**: Data no formato brasileiro (dia-mês-ano)
- **HHMM**: Hora e minuto da criação (24h, sem separador)

Exemplo: `01-30-10-2025-1532`

Se desejar criar uma nova pasta, basta pedir e seguirei esse padrão automaticamente.

---

## Processo de branch, commit, push e Pull Request

Sempre que houver pendências de commit:

1. Crie uma branch descritiva para a tarefa.
2. Adicione as alterações com `git add .`.
3. Faça o commit com uma mensagem clara.
4. Envie a branch para o remoto com `git push --set-upstream origin nome_da_branch`.
5. Abra um Pull Request para a branch main no GitHub.

**Recomendações:**
- Use nomes de branch descritivos e padronizados.
- Faça commits pequenos e frequentes.
- Solicite revisão de outros membros.
- Aguarde aprovação e testes antes do merge.
- Documente o processo para referência futura.

---

## Regras de Uso de Ferramentas

- Sempre que precisar de documentação atualizada de bibliotecas, pacotes ou ferramentas, utilize obrigatoriamente o MCP server `context7`. Ele garante que as informações estejam de acordo com as versões mais recentes.