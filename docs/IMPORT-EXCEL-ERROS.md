# Import Excel — erros comuns

Guia para staff ao importar sócios em **Membros** → Importar Excel.

## Regra de ouro

1. Descarregar o **modelo** (template) a partir da UI
2. Correr sempre **simulação (dry-run)** primeiro
3. Corrigir a lista de erros linha a linha
4. Só depois confirmar o import real

Máximo do ficheiro: **10 MB**. Formatos: `.xlsx` / `.xls` (conforme UI).

## Colunas reconhecidas

Cabeçalhos do modelo (aliases aceites — ver código `member-import-column-map.ts`):

| Coluna                | Obrigatório?             | Notas                                        |
| --------------------- | ------------------------ | -------------------------------------------- |
| Número                | Não                      | Se vazio, gera-se o próximo n.º              |
| Nome                  | Sim (1.ª linha do sócio) |                                              |
| Email                 | Não                      | Tem de ser válido se preenchido              |
| Telefone              | Não                      |                                              |
| Data de adesão        | Sim                      | Formato **dd/mm/aaaa**                       |
| Plano de quota        | Não                      | Nome **exacto** de um plano existente na org |
| Texto extra no cartão | Não                      |                                              |
| Validade no cartão    | Não                      | Data dd/mm/aaaa                              |
| Ativo                 | Não                      | Sim/Não (defeito: activo)                    |
| Notas                 | Não                      |                                              |
| Pagamento data        | Se houver pagamento      | dd/mm/aaaa                                   |
| Pagamento valor       | Se houver pagamento      | > 0                                          |
| Pagamento referência  | Não                      | Defeito: `AAAA-MM` da data                   |
| Pagamento notas       | Não                      |                                              |

## Linhas de pagamento extra

Podes ter várias linhas com o **mesmo Número** e **Nome vazio** só com colunas de pagamento — útil para histórico de quotas.

A **primeira linha** desse sócio tem de trazer o **nome** e os dados do membro.

## Mensagens frequentes

| Mensagem (ou similar)                                     | Causa                                                  | O que fazer                                                                         |
| --------------------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Ficheiro demasiado grande (max 10 MB)                     | Ficheiro > 10 MB                                       | Dividir o Excel ou reduzir anexos                                                   |
| O ficheiro está vazio ou não tem linhas de dados          | Só cabeçalhos / folhas vazias                          | Garantir linhas abaixo do header                                                    |
| Colunas não reconhecidas / mapa incompleto                | Headers diferentes do modelo                           | Usar o template da UI; não renomear colunas à vontade                               |
| O nome é obrigatório na primeira linha de cada sócio      | Nome em falta na linha principal                       | Preencher Nome; nas linhas só-pagamento deixar Nome vazio mas manter Número         |
| A data de adesão é obrigatória (formato dd/mm/aaaa)       | Data vazia ou mal formatada                            | Usar `15/01/2025`, não `2025-01-15` nem serial Excel sem formatação                 |
| Email inválido: «…»                                       | Email mal escrito                                      | Corrigir ou limpar a célula                                                         |
| Plano de quota «…» não encontrado                         | Nome do plano ≠ planos da org                          | Criar o plano em **Planos** ou alinhar o texto (acentos ok; texto tem de coincidir) |
| Para registar pagamento, indique a data do pagamento      | Há valor/ref. sem data                                 | Preencher **Pagamento data**                                                        |
| Para registar pagamento, indique um valor maior que zero  | Valor ≤ 0 ou inválido                                  | Número positivo (ex.: `15` ou `15,00`)                                              |
| Linha de pagamento extra: o número de sócio é obrigatório | Linha só-pagamento sem Número                          | Copiar o n.º da linha principal                                                     |
| Sócio n.º «…» não encontrado…                             | Pagamento extra antes da linha com nome, ou n.º errado | Ordenar: primeiro linha completa do sócio, depois extras                            |
| (erro genérico na linha N)                                | Validação / BD                                         | Ler a mensagem; em dry-run nada foi gravado                                         |

## Dicas práticas (CRC Vale / migração)

- Exportar do sistema antigo → colar no **template ClubOS**, não no inverso
- Criar **todos** os planos de quota **antes** do import
- Datas: formatar a coluna como texto `dd/mm/aaaa` no Excel evita serials estranhos
- Dry-run mostra contadores `created` / `updated` / `payments` / `skipped` + lista `errors[]`
- Depois do import real: amostrar 5–10 sócios e 1 pagamento no backoffice

## Relacionado

- [Como adicionar um clube novo](COMO-ADICIONAR-CLUBE.md)
- [Go-live CRC Vale](GO-LIVE-CRC-VALE.md) (checklist paralelo com `gestao_socios`)
- [FAQ staff CRC Vale](FAQ-CRC-VALE.md)
