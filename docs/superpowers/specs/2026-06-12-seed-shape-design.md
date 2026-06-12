# seed-shape Design Spec

## Summary

`seed-shape` is a local-first TypeScript CLI that turns small schema sources into a reviewable seed-data plan plus deterministic JSON and SQL fixtures. It is for developers and AI coding agents who need credible demo data before wiring a real database seeder.

The project intentionally does not connect to databases, run migrations, or replace ORM-native seeders. Its core value is making fixture intent explicit: entity counts, field generators, relation links, constraints, and output files can be inspected before the data is used.

## Research Notes

The current seed-data landscape has strong tools, but they cluster around different jobs:

- Prisma documents database seeding as code that runs through the Prisma CLI and application stack.
- Drizzle has seed support oriented around generating rows for Drizzle schemas.
- Faker.js provides broad fake-value primitives and deterministic seeding, but it does not infer a fixture plan from project schemas.
- Snaplet focuses on database-aware generated seed data, including richer relational workflows.
- JSON Schema is a widely used contract format for describing data shape, but it is a validation vocabulary rather than a seed-plan review tool.

`seed-shape` takes the gap between these tools: it reads schema-like inputs offline and produces transparent fixture artifacts. The first release should be small, scriptable, and useful without a database account.

## Non-Duplicate Positioning

Recent local projects under `E:\Projects` include agent instruction auditors, CI/package surface analyzers, webhook fixture replay, runbook linting, and security/permission tools. `seed-shape` is different because it works on application data shape and demo fixtures, not package metadata, agent behavior, workflow docs, or webhook transport.

## Target User

- A developer starting a feature branch who needs demo records matching the project schema.
- An AI coding agent preparing UI/API fixtures and wanting a plan humans can review.
- A maintainer who wants reproducible sample JSON and seed SQL without touching live infrastructure.

## First-Release Scope

### Inputs

The CLI accepts one input file:

- `seed-shape.schema.json`: a small native schema format.
- `schema.prisma`: a pragmatic subset of Prisma model syntax.
- `.sql`: a pragmatic subset of `CREATE TABLE` statements.

The parser should be deliberately conservative. Unsupported constructs must produce clear diagnostics with file, line where available, and the construct that was skipped.

### Outputs

For a command such as:

```bash
seed-shape plan examples/shop.schema.json --out reports/demo --rows 5 --sql
```

the CLI writes:

- `seed-shape.plan.md`: bilingual-friendly Markdown summary of entities, fields, inferred generators, constraints, and relations.
- `fixtures/<entity>.json`: deterministic JSON rows per entity.
- `seed.sql`: optional insert statements for the generated fixtures.
- `seed-shape.report.json`: machine-readable report with diagnostics and generated file paths.

### Commands

- `seed-shape plan <schema> --out <dir> [--rows <n>] [--seed <text>] [--sql]`
- `seed-shape demo --out <dir>`
- `seed-shape --help`
- `seed-shape --version`

### Native Schema Format

The native JSON format is the canonical internal contract:

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
      "rows": 6,
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

### Field Types

First release supports:

- `uuid`
- `int`
- `string`
- `email`
- `name`
- `sentence`
- `boolean`
- `date`
- `ref`

Unrecognized field types fall back to deterministic strings and emit a warning.

## Architecture

The codebase is a TypeScript CLI with small modules:

- `src/cli.ts`: argument parsing, help/version routing, and command dispatch.
- `src/schema.ts`: shared schema types and validation.
- `src/parsers/native.ts`: parse the native JSON schema.
- `src/parsers/prisma.ts`: parse a narrow Prisma model subset into the shared schema.
- `src/parsers/sql.ts`: parse a narrow SQL `CREATE TABLE` subset into the shared schema.
- `src/generator.ts`: deterministic row generation and relation linking.
- `src/renderers/plan.ts`: Markdown plan rendering.
- `src/renderers/json.ts`: fixture JSON writing.
- `src/renderers/sql.ts`: insert SQL rendering.
- `src/reporter.ts`: structured diagnostics and report JSON.
- `src/demo.ts`: self-contained demo schema and output runner.

No parser should perform generation. No renderer should infer schema meaning. This keeps parser, planner, generator, and output responsibilities testable in isolation.

## Data Flow

1. CLI resolves the input file and options.
2. Parser selection uses file extension and simple content sniffing.
3. Parser returns a normalized schema plus diagnostics.
4. Schema validation checks entity names, duplicate fields, relation targets, and row counts.
5. Generator creates deterministic rows from `--seed`, entity name, row index, and field name.
6. Renderers write Markdown, JSON fixtures, optional SQL, and report JSON.
7. CLI exits with code `0` when outputs were written with warnings, and code `1` when validation prevents usable output.

## Error Handling

- Missing input file: exit `1`, print concise error.
- Invalid native JSON: exit `1`, include parser error.
- Unsupported Prisma or SQL syntax: keep parsing supported parts, emit warnings, and continue if at least one valid entity remains.
- Invalid relation target: exit `1`, no partial fixture writes.
- Output write failure: exit `1`, include failed path.

Warnings should be visible in stderr and copied to `seed-shape.report.json`.

## Testing Strategy

Use Vitest and test-first implementation.

- Parser tests for native JSON, Prisma subset, SQL subset, and unsupported constructs.
- Validation tests for duplicate fields and invalid relations.
- Generator tests for deterministic output and stable relation linking.
- Renderer tests for Markdown plan, fixture JSON shape, and SQL escaping.
- CLI tests for `demo`, `plan`, help/version, exit codes, and output files.

The release gate is:

```bash
npm run check
node dist/cli.js demo --out reports/demo
npm pack --dry-run --ignore-scripts
```

## Documentation

The repository ships English and Simplified Chinese project docs:

- `README.md`
- `README.zh-CN.md`
- `CHANGELOG.md`
- `CHANGELOG.zh-CN.md`
- `CONTRIBUTING.md`
- `CONTRIBUTING.zh-CN.md`
- `SECURITY.md`
- `SECURITY.zh-CN.md`

Both READMEs must include the positioning boundary: `seed-shape` generates local fixtures and plans; it does not connect to a database.

## Acceptance Criteria

- A new repository exists at `E:\Projects\seed-shape`.
- `npm run check` passes.
- `node dist/cli.js demo --out reports/demo` writes a plan, JSON fixtures, SQL, and report JSON.
- `npm pack --dry-run --ignore-scripts` shows bilingual docs in the tarball.
- The GitHub repo `maxi-maxima/seed-shape` is public and synced with local `main`.
