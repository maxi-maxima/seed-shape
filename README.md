# seed-shape

`seed-shape` generates reviewable seed-data plans and deterministic local fixtures from small schema sources.

It is useful when you need realistic demo rows for a UI, API test, or agent-generated feature branch, but you do not want the tool to connect to a database. It reads a schema-like file, writes a Markdown plan, emits JSON fixtures, and can also produce simple SQL insert statements.

## Why This Exists

Most seed tools focus on running code against an ORM or a database. `seed-shape` focuses on the step before that: making the intended data shape visible and reproducible.

Use it to answer:

- Which entities will be generated?
- How many rows does each entity get?
- Which fields are primary, unique, or references?
- What exact fixture files will be handed to the app or test suite?

## Install

```bash
npm install -g seed-shape
```

For local development:

```bash
npm install
npm run check
```

## Commands

```bash
seed-shape plan <schema> --out <dir> [--rows <n>] [--seed <text>] [--sql]
seed-shape demo --out <dir>
seed-shape --help
seed-shape --version
```

## Quick Start

Run the built-in demo:

```bash
seed-shape demo --out reports/demo
```

Or run against a native schema:

```bash
seed-shape plan examples/shop.schema.json --out reports/shop --rows 5 --seed preview --sql
```

`--rows` accepts a positive integer. Missing, partial, or unsafe integer values fail before output files are written.

Outputs:

- `seed-shape.plan.md`: a human-readable fixture plan.
- `fixtures/<Entity>.json`: deterministic fixture rows.
- `seed.sql`: optional SQL inserts when `--sql` is set.
- `seed-shape.report.json`: machine-readable diagnostics and output paths.

## Supported Inputs

First release support is intentionally conservative:

- Native `seed-shape.schema.json`.
- A narrow subset of Prisma `model` syntax.
- A narrow subset of SQL `CREATE TABLE` statements.

Unsupported fields or constructs are reported as diagnostics. `seed-shape` prefers clear partial support over pretending to understand every schema feature.

## Native Schema Example

```json
{
  "entities": [
    {
      "name": "User",
      "rows": 3,
      "fields": [
        { "name": "id", "type": "uuid", "primary": true },
        { "name": "email", "type": "email", "unique": true },
        { "name": "name", "type": "name" }
      ]
    },
    {
      "name": "Post",
      "rows": 5,
      "fields": [
        { "name": "id", "type": "uuid", "primary": true },
        { "name": "authorId", "type": "ref", "references": "User.id" },
        { "name": "title", "type": "sentence" },
        { "name": "published", "type": "boolean" }
      ]
    }
  ]
}
```

## Boundaries

`seed-shape` does not:

- connect to a database;
- run migrations;
- execute generated SQL;
- replace Prisma, Drizzle, Snaplet, Faker.js, or application-specific seed scripts.

It creates local artifacts you can inspect, edit, commit, or pass to another tool.

## Documentation

- English: `README.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `SECURITY.md`
- Simplified Chinese: `README.zh-CN.md`, `CHANGELOG.zh-CN.md`, `CONTRIBUTING.zh-CN.md`, `SECURITY.zh-CN.md`

## Development

```bash
npm install
npm run check
node dist/cli.js demo --out reports/demo
npm pack --dry-run --ignore-scripts
```

## License

MIT
