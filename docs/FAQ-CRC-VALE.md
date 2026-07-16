# FAQ — staff CRC Vale

Perguntas frequentes para administradores e tesoureiros do piloto **CRC Vale**.

## Acesso e papéis

**Quem pode fazer o quê?**

| Acção                               | Imperador | Administrador | Tesoureiro                  |
| ----------------------------------- | --------- | ------------- | --------------------------- |
| Ver dashboard / sócios / pagamentos | ✓         | ✓             | ✓                           |
| Criar / editar / importar sócios    | ✓         | ✓             | —                           |
| Planos de quota, cartões, settings  | ✓         | ✓             | —                           |
| Registar pagamentos / recibos       | ✓         | ✓             | ✓                           |
| Activar módulos / criar novo clube  | ✓         | —             | —                           |
| Portal do sócio                     | —         | —             | — (sócios com role `socio`) |

**Não vejo a organização certa.**  
Confirma o selector de organização no header. O papel efectivo depende da **membership** nessa org.

**Esqueci a password.**  
Usar **Recuperar password** na página de login (email SMTP tem de estar configurado).

## Sócios e import

**Como migro do `gestao_socios`?**  
Exportar → dry-run no ClubOS → corrigir → import real. Guia: [Import Excel — erros comuns](IMPORT-EXCEL-ERROS.md) e [Go-live](GO-LIVE-CRC-VALE.md).

**O dry-run alterou a base de dados?**  
Não. Só simula e devolve erros/contadores.

**Posso reimportar o mesmo ficheiro?**  
Sim: sócios existentes (mesmo número na org) são **actualizados**; pagamentos com a mesma referência não devem duplicar (upsert por referência). Em caso de dúvida, dry-run outra vez.

## Quotas e pagamentos

**O sócio aparece “em atraso” mas pagou.**  
Verifica se o pagamento está **PAID**, a data/referência e se o plano de quota está correcto. O estado de quota deriva dos pagamentos + periodicidade do plano.

**Como emito recibo?**  
Em Pagamentos, abrir o pagamento e descarregar o PDF do recibo (quando o módulo estiver activo).

## Cartões e validação

**O QR do cartão não valida.**  
Confirmar que o cartão foi gerado para o sócio certo, que a org activa é a CRC Vale, e que a rota pública `/validar/[memberId]` está acessível. Rate limit pode bloquear muitas tentativas seguidas.

**Template CRC Vale vs clássico.**  
Escolher em **Cartões** / settings de cartão. O layout `crc_vale` é o visual do piloto.

## Portal do sócio

**Como o sócio entra no portal?**  
Em Membros → conceder acesso ao portal (cria utilizador `socio` + password / convite conforme fluxo actual). O sócio usa `/portal`, não o backoffice.

**O sócio não vê o logótipo.**  
Carregar logo em **Definições** da org.

## Problemas técnicos

**API / ecrã em erro.**  
Ver [Runbook ops](RUNBOOK-OPS.md). Em produção: Sentry + estado dos contentores Docker.

**Quem contactar no piloto?**  
Responsável técnico ClubOS + contacto staff CRC Vale (preencher na go-live checklist).

## Documentação relacionada

- [Como adicionar um clube novo](COMO-ADICIONAR-CLUBE.md)
- [Go-live CRC Vale](GO-LIVE-CRC-VALE.md)
- [Autenticação e RBAC](AUTENTICACAO-RBAC.md)
