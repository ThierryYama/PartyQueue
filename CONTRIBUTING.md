# Contribuindo com o PartyQueue

Obrigado pelo interesse em contribuir. Issues, relatos de bugs e sugestões são
bem-vindos.

Para preservar a titularidade necessária a um futuro modelo de licenciamento
comercial, pull requests externos com código somente serão aceitos após
autorização prévia do mantenedor e assinatura de um acordo de contribuição
adequado. Pull requests de código não solicitados poderão ser encerrados.

## Fluxo

1. Abra uma issue e obtenha autorização antes de enviar código.
2. Crie uma branch curta e descritiva.
3. Use Conventional Commits.
4. Não edite migrations que já tenham sido aplicadas.
5. Execute as verificações locais.
6. Abra um pull request descrevendo objetivo, impacto e validação.

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

Não inclua senhas, tokens, chaves de API, arquivos `.env` ou dados pessoais em
commits, issues ou logs. A aprovação final pertence ao mantenedor definido em
`.github/CODEOWNERS`.

Ao contribuir com relatos, discussões ou sugestões, não inclua conteúdo
confidencial nem material de terceiros que você não possa compartilhar.
