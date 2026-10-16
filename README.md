# Saúde Vida Sudoeste — Cartão Saúde e Vida

Site de uma página (HTML + Tailwind CDN + JS puro).

## Planos exibidos

| | Pessoa Física | Pessoa Jurídica |
|---|---|---|
| Mensalidade | R$ 50,00 por mês | R$ 35,00 por empregado/mês |
| Dependentes | Titular + até 4 | Empregado titular + até 4 |
| Mínimo | 1 titular | 3 empregados titulares |
| Mensalidade mínima | R$ 50,00 | R$ 105,00 por empresa |

A adesão é feita por WhatsApp (77) 99171-0040, com mensagem pronta por modalidade (veja `MSG` no fim do `index.html`).

## Atualizar a tabela de consultas e exames (sem mexer no site)

A área "Consultas, exames e preços" lê o arquivo `dados/precos.json`. Enquanto ele estiver vazio, o site mostra "Tabela de preços em atualização" com o botão de WhatsApp.

1. Copie `ferramentas/modelo-precos.csv` para `ferramentas/precos.csv` e preencha no Excel (separador `;`):
   - `categoria`: `Consultas médicas`, `Exames laboratoriais`, `Diagnóstico por imagem` ou `Serviços hospitalares`
   - `nome`, `prestador` (obrigatórios), `especialidade` (opcional)
   - `valor_balcao`: valor particular da tabela oficial. Deixe vazio se não foi informado (o site não exibe nem estima)
   - `valor_negociado`: valor acertado com o parceiro (obrigatório)
   - `agendamento`, `observacao` (opcionais)
2. Rode `node ferramentas/atualizar-precos.js`.
   O script aplica a regra comercial **preço associado = valor negociado × 1,10**, valida o arquivo e grava `dados/precos.json` com a data do dia.
3. Publique só o `dados/precos.json`.

O `precos.csv` está no `.gitignore`: o valor negociado com o parceiro nunca vai para o site público.
Só entram na tabela os prestadores com autorização contratual para a regra de preço.

## Rede credenciada

Fica na seção `#rede` do `index.html`, dividida em quatro categorias. Para incluir um parceiro confirmado, acrescente um `<li>` na categoria certa.
