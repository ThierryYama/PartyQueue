# PartyQueue

O PartyQueue responde: **“o que o nosso grupo consegue jogar hoje?”** Ele combina bibliotecas, participantes e contexto da sessão para gerar uma shortlist explicável e facilitar a votação.

## Arquitetura inicial

O MVP usa um monólito modular com worker separado:

- Next.js 16 e React 19 em `apps/web`;
- NestJS 11 em `apps/api`;
- NestJS standalone em `apps/worker`;
- PostgreSQL e Prisma 7 em `packages/database`;
- Redis e BullMQ para filas persistentes e processamento assíncrono;
- pnpm workspaces e Turborepo na raiz;
- contratos e ranking isolados de frameworks em `packages/`.

Veja [a visão arquitetural](docs/architecture/overview.md) e o [ADR do monólito modular](docs/adr/0001-modular-monolith.md).

## Requisitos

- Node.js 22 LTS (`.nvmrc`);
- pnpm 11;
- Docker e Docker Compose para a infraestrutura local.

## Desenvolvimento local

```bash
pnpm install
cp .env.example .env
# Gere uma senha e use o mesmo valor nas três variáveis PostgreSQL do .env.
openssl rand -hex 32
pnpm infra:up
pnpm db:generate
pnpm db:migrate
pnpm dev
```

Use o host `localhost` em `DATABASE_URL` e `postgres` em
`DATABASE_URL_DOCKER`. O Compose recusa iniciar sem essas credenciais. O arquivo
`.env` não é versionado e deve permanecer fora do Git. Nunca coloque segredos
em variáveis `NEXT_PUBLIC_*`, pois elas são expostas ao navegador.

- Web: `http://localhost:3000`
- API healthcheck: `http://localhost:3333/api/v1/health`

O endpoint abaixo cria um job de teste. O worker deve registrar seu processamento no terminal:

```bash
curl -X POST http://localhost:3333/api/v1/jobs/ping
```

Para criar a primeira migration quando o PostgreSQL estiver disponível:

```bash
pnpm --filter @partyqueue/database migrate:dev --name init
```

## Comandos

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm build
pnpm db:generate
pnpm db:migrate
pnpm db:studio
pnpm infra:up
pnpm infra:down
pnpm docker:up
pnpm docker:down
```

`infra:up` inicia somente PostgreSQL e Redis, preservando o hot reload local do Next e Nest. `docker:up` constrói e inicia também web, API e worker.

## CI

Pull requests e pushes na `main` executam instalação reproduzível, validação do Compose, geração do Prisma Client, formatação, lint, typecheck e build. Testes entrarão no pipeline quando a primeira suíte for criada.

## Próximas etapas

Depois da infraestrutura, o primeiro vertical slice será autenticação Steam → sincronização da biblioteca em um job BullMQ → persistência → listagem no Next.js.

## Governança e licença

O projeto é mantido por [@ThierryYama](https://github.com/ThierryYama). Consulte
[CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md) e
[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) antes de colaborar.

O código é **source-available**, mas não é open source segundo a definição da
OSI. Ele é disponibilizado sob a
[PolyForm Noncommercial License 1.0.0](LICENSE): usos não comerciais são
permitidos nos limites da licença, enquanto qualquer uso comercial exige uma
autorização escrita separada. Veja os detalhes de
[licenciamento comercial](COMMERCIAL-LICENSE.md).
