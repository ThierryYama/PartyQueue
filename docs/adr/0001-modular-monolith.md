# ADR 0001: monólito modular com worker separado

- Status: aceito
- Data: 2026-08-09

## Contexto

O PartyQueue será desenvolvido inicialmente por uma pessoa e o domínio ainda está em descoberta. O produto precisa de transações consistentes, integração com a Steam, processamento assíncrono e um ranking determinístico.

## Decisão

Usar um monorepo pnpm/Turborepo com Next.js no front-end, NestJS na API e em um worker standalone, PostgreSQL via Prisma como fonte de verdade e pacotes independentes para contratos, banco e ranking.

## Consequências

- O deploy e a observabilidade permanecem simples no MVP.
- O worker isola tarefas demoradas sem exigir microserviços independentes.
- Módulos podem ser extraídos quando houver evidência operacional.
- Redis/BullMQ, WebSocket, CI e containers serão adicionados em etapas posteriores.

## Alternativas consideradas

- Microserviços: custo operacional prematuro.
- Uma aplicação Next.js full-stack: acopla o domínio e os jobs ao front-end.
- GraphQL: REST cobre o fluxo inicial com menor complexidade.
