# Contributing

Thanks for improving `seed-shape`.

## Local Setup

```bash
npm install
npm run check
```

## Development Rules

- Keep the tool local-first. Do not add database connections to the core CLI.
- Add tests before behavior changes.
- Keep parsers conservative and diagnostics clear.
- Update both English and Simplified Chinese docs for user-facing changes.
- Run the release gate before opening a pull request:

```bash
npm run check
node dist/cli.js demo --out reports/demo
npm pack --dry-run --ignore-scripts
```

## Commit Style

Use concise conventional-style messages, for example:

- `feat: add relation diagnostics`
- `fix: escape sql identifiers`
- `docs: update chinese readme`
