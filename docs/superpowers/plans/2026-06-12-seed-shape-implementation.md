# seed-shape Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publish `seed-shape`, a local-first CLI that converts small schema sources into reviewable seed plans, deterministic JSON fixtures, optional SQL inserts, and structured reports.

**Architecture:** A TypeScript CLI dispatches commands, selects a parser, validates a normalized schema, generates deterministic rows, and renders Markdown/JSON/SQL outputs. Parsers, validation, generation, renderers, reporting, and demo data live in separate modules so behavior can be tested independently.

**Tech Stack:** Node.js 20+, TypeScript, Vitest, ESLint, npm package scripts, GitHub Actions.

---

## File Structure

- Create `package.json`: npm metadata, CLI bin, scripts, package file allowlist.
- Create `tsconfig.json`: strict ESM TypeScript config.
- Create `eslint.config.js`: flat ESLint config for TypeScript.
- Create `.gitignore`: ignore dependencies, build outputs, coverage, logs, and generated reports.
- Create `.github/workflows/ci.yml`: run install and `npm run check` on pushes/PRs.
- Create `src/cli.ts`: CLI argument parsing and command dispatch.
- Create `src/schema.ts`: normalized schema types, diagnostics, validation helpers.
- Create `src/parsers/native.ts`: parse native `seed-shape.schema.json`.
- Create `src/parsers/prisma.ts`: parse narrow Prisma model syntax.
- Create `src/parsers/sql.ts`: parse narrow SQL `CREATE TABLE` syntax.
- Create `src/parsers/index.ts`: choose parser by extension and content.
- Create `src/generator.ts`: deterministic row generation and reference linking.
- Create `src/renderers/plan.ts`: Markdown plan renderer.
- Create `src/renderers/json.ts`: JSON fixture writer.
- Create `src/renderers/sql.ts`: SQL insert renderer.
- Create `src/reporter.ts`: report JSON model and write helper.
- Create `src/demo.ts`: built-in shop demo schema and demo runner.
- Create `src/run.ts`: orchestration for plan/demo output writing.
- Create `tests/*.test.ts`: focused Vitest suites for all behavior.
- Create `examples/shop.schema.json`, `examples/shop.prisma`, `examples/shop.sql`: demo input files.
- Create bilingual docs: `README.md`, `README.zh-CN.md`, `CHANGELOG.md`, `CHANGELOG.zh-CN.md`, `CONTRIBUTING.md`, `CONTRIBUTING.zh-CN.md`, `SECURITY.md`, `SECURITY.zh-CN.md`.

## Task 1: Scaffold Package and Tooling

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `eslint.config.js`
- Create: `.gitignore`
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create package metadata and scripts**

Add `package.json` with:

```json
{
  "name": "seed-shape",
  "version": "0.1.0",
  "description": "Generate reviewable seed-data plans and deterministic fixtures from small schema sources.",
  "type": "module",
  "bin": {
    "seed-shape": "./dist/cli.js"
  },
  "files": [
    "dist",
    "examples",
    "README.md",
    "README.zh-CN.md",
    "CHANGELOG.md",
    "CHANGELOG.zh-CN.md",
    "CONTRIBUTING.md",
    "CONTRIBUTING.zh-CN.md",
    "SECURITY.md",
    "SECURITY.zh-CN.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run",
    "lint": "eslint .",
    "check": "npm run lint && npm run test && npm run build"
  },
  "keywords": [
    "seed",
    "fixtures",
    "schema",
    "prisma",
    "sql",
    "test-data"
  ],
  "author": "maxi-maxima",
  "license": "MIT",
  "engines": {
    "node": ">=20"
  },
  "devDependencies": {
    "@eslint/js": "^9.29.0",
    "@types/node": "^24.0.1",
    "eslint": "^9.29.0",
    "typescript": "^5.8.3",
    "typescript-eslint": "^8.34.0",
    "vitest": "^3.2.3"
  }
}
```

- [ ] **Step 2: Create TypeScript config**

Add `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": ".",
    "types": ["node", "vitest"]
  },
  "include": ["src/**/*.ts", "tests/**/*.ts"]
}
```

- [ ] **Step 3: Create ESLint config**

Add `eslint.config.js`:

```js
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ["dist/**", "coverage/**", "reports/**"],
  },
  {
    files: ["**/*.ts"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "no-console": "off"
    }
  }
];
```

- [ ] **Step 4: Create repository hygiene files**

Add `.gitignore`:

```gitignore
node_modules/
dist/
coverage/
reports/
*.log
*.tgz
.env
.DS_Store
```

Add `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run check
```

- [ ] **Step 5: Install dependencies and verify scaffold scripts fail for missing source**

Run:

```bash
npm install
npm run check
```

Expected: dependency install succeeds; `npm run check` fails because source files do not exist yet or ESLint has no code to lint. This confirms the scripts are wired before implementation.

- [ ] **Step 6: Commit scaffold**

```bash
git add package.json package-lock.json tsconfig.json eslint.config.js .gitignore .github/workflows/ci.yml
git commit -m "chore: scaffold seed-shape package"
```

## Task 2: Define Schema Types and Validation

**Files:**
- Create: `src/schema.ts`
- Test: `tests/schema.test.ts`

- [ ] **Step 1: Write failing validation tests**

Create `tests/schema.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { normalizeRows, validateSchema } from "../src/schema.js";

describe("validateSchema", () => {
  test("accepts a valid schema with a relation target", () => {
    const result = validateSchema({
      entities: [
        {
          name: "User",
          rows: 2,
          fields: [{ name: "id", type: "uuid", primary: true }]
        },
        {
          name: "Post",
          rows: 2,
          fields: [{ name: "authorId", type: "ref", references: "User.id" }]
        }
      ]
    });

    expect(result.ok).toBe(true);
    expect(result.diagnostics).toEqual([]);
  });

  test("rejects duplicate fields and invalid references", () => {
    const result = validateSchema({
      entities: [
        {
          name: "Post",
          rows: 2,
          fields: [
            { name: "id", type: "uuid" },
            { name: "id", type: "int" },
            { name: "missing", type: "ref", references: "User.id" }
          ]
        }
      ]
    });

    expect(result.ok).toBe(false);
    expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      "duplicate_field",
      "invalid_reference"
    ]);
  });
});

describe("normalizeRows", () => {
  test("uses entity rows before default rows", () => {
    expect(normalizeRows({ name: "User", rows: 4, fields: [] }, 9)).toBe(4);
  });

  test("keeps default rows in a practical range", () => {
    expect(normalizeRows({ name: "User", fields: [] }, 0)).toBe(1);
    expect(normalizeRows({ name: "User", fields: [] }, 101)).toBe(100);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/schema.test.ts
```

Expected: FAIL because `src/schema.ts` does not exist.

- [ ] **Step 3: Implement schema types and validation**

Create `src/schema.ts`:

```ts
export type FieldType =
  | "uuid"
  | "int"
  | "string"
  | "email"
  | "name"
  | "sentence"
  | "boolean"
  | "date"
  | "ref";

export interface FieldShape {
  name: string;
  type: FieldType | string;
  primary?: boolean;
  unique?: boolean;
  optional?: boolean;
  references?: string;
}

export interface EntityShape {
  name: string;
  rows?: number;
  fields: FieldShape[];
}

export interface SeedShapeSchema {
  entities: EntityShape[];
}

export interface Diagnostic {
  level: "warning" | "error";
  code: string;
  message: string;
  entity?: string;
  field?: string;
  line?: number;
}

export interface ValidationResult {
  ok: boolean;
  diagnostics: Diagnostic[];
}

export interface ParseResult {
  schema: SeedShapeSchema;
  diagnostics: Diagnostic[];
}

export const supportedFieldTypes = new Set<FieldType>([
  "uuid",
  "int",
  "string",
  "email",
  "name",
  "sentence",
  "boolean",
  "date",
  "ref"
]);

export function normalizeRows(entity: EntityShape, defaultRows: number): number {
  const requested = entity.rows ?? defaultRows;
  if (!Number.isFinite(requested)) {
    return 1;
  }
  return Math.max(1, Math.min(100, Math.trunc(requested)));
}

export function validateSchema(schema: SeedShapeSchema): ValidationResult {
  const diagnostics: Diagnostic[] = [];
  const entityNames = new Set(schema.entities.map((entity) => entity.name));
  const fieldNamesByEntity = new Map<string, Set<string>>();

  for (const entity of schema.entities) {
    if (!entity.name.trim()) {
      diagnostics.push({
        level: "error",
        code: "empty_entity_name",
        message: "Entity names must not be empty."
      });
    }

    const names = new Set<string>();
    for (const field of entity.fields) {
      if (names.has(field.name)) {
        diagnostics.push({
          level: "error",
          code: "duplicate_field",
          message: `Field "${field.name}" is duplicated on "${entity.name}".`,
          entity: entity.name,
          field: field.name
        });
      }
      names.add(field.name);

      if (!supportedFieldTypes.has(field.type as FieldType)) {
        diagnostics.push({
          level: "warning",
          code: "unknown_field_type",
          message: `Field "${field.name}" uses unknown type "${field.type}" and will be generated as a string.`,
          entity: entity.name,
          field: field.name
        });
      }
    }
    fieldNamesByEntity.set(entity.name, names);
  }

  for (const entity of schema.entities) {
    for (const field of entity.fields) {
      if (field.type !== "ref") {
        continue;
      }
      const [targetEntity, targetField] = (field.references ?? "").split(".");
      if (!targetEntity || !targetField || !entityNames.has(targetEntity) || !fieldNamesByEntity.get(targetEntity)?.has(targetField)) {
        diagnostics.push({
          level: "error",
          code: "invalid_reference",
          message: `Field "${entity.name}.${field.name}" references missing target "${field.references ?? ""}".`,
          entity: entity.name,
          field: field.name
        });
      }
    }
  }

  return {
    ok: diagnostics.every((diagnostic) => diagnostic.level !== "error"),
    diagnostics
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm test -- tests/schema.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit schema module**

```bash
git add src/schema.ts tests/schema.test.ts
git commit -m "feat: add schema validation"
```

## Task 3: Implement Parsers

**Files:**
- Create: `src/parsers/native.ts`
- Create: `src/parsers/prisma.ts`
- Create: `src/parsers/sql.ts`
- Create: `src/parsers/index.ts`
- Test: `tests/parsers.test.ts`

- [ ] **Step 1: Write failing parser tests**

Create `tests/parsers.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { parseNativeSchema } from "../src/parsers/native.js";
import { parsePrismaSchema } from "../src/parsers/prisma.js";
import { parseSqlSchema } from "../src/parsers/sql.js";

describe("parseNativeSchema", () => {
  test("parses entities from native JSON", () => {
    const result = parseNativeSchema(JSON.stringify({
      entities: [{ name: "User", fields: [{ name: "email", type: "email" }] }]
    }));

    expect(result.schema.entities[0]?.fields[0]?.type).toBe("email");
    expect(result.diagnostics).toEqual([]);
  });
});

describe("parsePrismaSchema", () => {
  test("parses model fields and relation ids", () => {
    const result = parsePrismaSchema(`
      model User {
        id String @id
        email String @unique
      }

      model Post {
        id Int @id
        authorId String
        title String
      }
    `);

    expect(result.schema.entities.map((entity) => entity.name)).toEqual(["User", "Post"]);
    expect(result.schema.entities[0]?.fields).toContainEqual({
      name: "email",
      type: "email",
      unique: true
    });
  });
});

describe("parseSqlSchema", () => {
  test("parses create table statements", () => {
    const result = parseSqlSchema(`
      CREATE TABLE users (
        id uuid primary key,
        email varchar(255) unique,
        created_at timestamp
      );
    `);

    expect(result.schema.entities[0]?.name).toBe("users");
    expect(result.schema.entities[0]?.fields).toEqual([
      { name: "id", type: "uuid", primary: true },
      { name: "email", type: "email", unique: true },
      { name: "created_at", type: "date" }
    ]);
  });
});
```

- [ ] **Step 2: Run parser tests to verify failure**

Run:

```bash
npm test -- tests/parsers.test.ts
```

Expected: FAIL because parser modules do not exist.

- [ ] **Step 3: Implement native parser**

Create `src/parsers/native.ts`:

```ts
import type { ParseResult, SeedShapeSchema } from "../schema.js";

export function parseNativeSchema(text: string): ParseResult {
  try {
    const parsed = JSON.parse(text) as SeedShapeSchema;
    return {
      schema: {
        entities: Array.isArray(parsed.entities) ? parsed.entities : []
      },
      diagnostics: Array.isArray(parsed.entities)
        ? []
        : [{ level: "error", code: "invalid_native_schema", message: "Native schema must contain an entities array." }]
    };
  } catch (error) {
    return {
      schema: { entities: [] },
      diagnostics: [{
        level: "error",
        code: "invalid_json",
        message: error instanceof Error ? error.message : "Invalid JSON."
      }]
    };
  }
}
```

- [ ] **Step 4: Implement Prisma parser**

Create `src/parsers/prisma.ts`:

```ts
import type { EntityShape, FieldShape, ParseResult } from "../schema.js";

const prismaTypeMap = new Map<string, string>([
  ["String", "string"],
  ["Int", "int"],
  ["Boolean", "boolean"],
  ["DateTime", "date"]
]);

export function parsePrismaSchema(text: string): ParseResult {
  const entities: EntityShape[] = [];
  const modelPattern = /model\s+(\w+)\s*\{([\s\S]*?)\}/g;
  let match: RegExpExecArray | null;

  while ((match = modelPattern.exec(text)) !== null) {
    const [, name, body] = match;
    const fields: FieldShape[] = [];
    for (const rawLine of body.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("//") || line.startsWith("@@")) {
        continue;
      }
      const parts = line.split(/\s+/);
      const fieldName = parts[0];
      const prismaType = parts[1]?.replace("?", "").replace("[]", "");
      if (!fieldName || !prismaType || /^[A-Z]/.test(fieldName) === false && fieldName.includes("@")) {
        continue;
      }

      let type = prismaTypeMap.get(prismaType) ?? "string";
      if (fieldName.toLowerCase().includes("email")) {
        type = "email";
      }
      if (parts.includes("@id")) {
        type = prismaType === "Int" ? "int" : "uuid";
      }

      fields.push({
        name: fieldName,
        type,
        primary: parts.includes("@id") || undefined,
        unique: parts.includes("@unique") || undefined,
        optional: parts[1]?.includes("?") || undefined
      });
    }
    entities.push({ name, fields });
  }

  return { schema: { entities }, diagnostics: [] };
}
```

- [ ] **Step 5: Implement SQL parser**

Create `src/parsers/sql.ts`:

```ts
import type { EntityShape, FieldShape, ParseResult } from "../schema.js";

export function parseSqlSchema(text: string): ParseResult {
  const entities: EntityShape[] = [];
  const tablePattern = /create\s+table\s+["`]?(\w+)["`]?\s*\(([\s\S]*?)\);/gi;
  let match: RegExpExecArray | null;

  while ((match = tablePattern.exec(text)) !== null) {
    const [, name, body] = match;
    const fields: FieldShape[] = [];
    for (const rawColumn of body.split(",")) {
      const line = rawColumn.trim();
      if (!line || /^(primary|foreign|constraint|unique)\b/i.test(line)) {
        continue;
      }
      const parts = line.split(/\s+/);
      const fieldName = parts[0]?.replace(/["`]/g, "");
      const sqlType = parts[1]?.toLowerCase() ?? "text";
      if (!fieldName) {
        continue;
      }
      fields.push({
        name: fieldName,
        type: mapSqlType(fieldName, sqlType),
        primary: /\bprimary\s+key\b/i.test(line) || undefined,
        unique: /\bunique\b/i.test(line) || undefined
      });
    }
    entities.push({ name, fields });
  }

  return { schema: { entities }, diagnostics: [] };
}

function mapSqlType(fieldName: string, sqlType: string): string {
  if (sqlType.includes("uuid")) {
    return "uuid";
  }
  if (fieldName.toLowerCase().includes("email")) {
    return "email";
  }
  if (sqlType.includes("int") || sqlType.includes("serial")) {
    return "int";
  }
  if (sqlType.includes("bool")) {
    return "boolean";
  }
  if (sqlType.includes("date") || sqlType.includes("time")) {
    return "date";
  }
  return "string";
}
```

- [ ] **Step 6: Implement parser selection**

Create `src/parsers/index.ts`:

```ts
import { extname } from "node:path";
import type { ParseResult } from "../schema.js";
import { parseNativeSchema } from "./native.js";
import { parsePrismaSchema } from "./prisma.js";
import { parseSqlSchema } from "./sql.js";

export function parseSchemaFile(path: string, text: string): ParseResult {
  const ext = extname(path).toLowerCase();
  if (ext === ".json") {
    return parseNativeSchema(text);
  }
  if (path.endsWith(".prisma")) {
    return parsePrismaSchema(text);
  }
  if (ext === ".sql") {
    return parseSqlSchema(text);
  }
  if (/^\s*\{/.test(text)) {
    return parseNativeSchema(text);
  }
  if (/\bmodel\s+\w+\s*\{/.test(text)) {
    return parsePrismaSchema(text);
  }
  if (/\bcreate\s+table\b/i.test(text)) {
    return parseSqlSchema(text);
  }
  return {
    schema: { entities: [] },
    diagnostics: [{ level: "error", code: "unknown_schema_format", message: `Could not detect schema format for ${path}.` }]
  };
}
```

- [ ] **Step 7: Run parser tests to verify pass**

Run:

```bash
npm test -- tests/parsers.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit parsers**

```bash
git add src/parsers tests/parsers.test.ts
git commit -m "feat: parse native prisma and sql schemas"
```

## Task 4: Implement Deterministic Generator

**Files:**
- Create: `src/generator.ts`
- Test: `tests/generator.test.ts`

- [ ] **Step 1: Write failing generator tests**

Create `tests/generator.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { generateFixtures } from "../src/generator.js";

describe("generateFixtures", () => {
  test("generates deterministic rows for supported field types", () => {
    const first = generateFixtures({
      schema: {
        entities: [{
          name: "User",
          rows: 2,
          fields: [
            { name: "id", type: "uuid", primary: true },
            { name: "email", type: "email", unique: true },
            { name: "name", type: "name" },
            { name: "active", type: "boolean" }
          ]
        }]
      },
      defaultRows: 2,
      seed: "demo"
    });
    const second = generateFixtures({
      schema: first.schema,
      defaultRows: 2,
      seed: "demo"
    });

    expect(second.fixtures).toEqual(first.fixtures);
    expect(first.fixtures.User).toHaveLength(2);
    expect(first.fixtures.User[0]?.email).toMatch(/^user-1-/);
  });

  test("links ref fields to generated target rows", () => {
    const result = generateFixtures({
      schema: {
        entities: [
          { name: "User", rows: 1, fields: [{ name: "id", type: "uuid", primary: true }] },
          { name: "Post", rows: 2, fields: [{ name: "authorId", type: "ref", references: "User.id" }] }
        ]
      },
      defaultRows: 2,
      seed: "demo"
    });

    expect(result.fixtures.Post[0]?.authorId).toBe(result.fixtures.User[0]?.id);
    expect(result.fixtures.Post[1]?.authorId).toBe(result.fixtures.User[0]?.id);
  });
});
```

- [ ] **Step 2: Run generator tests to verify failure**

Run:

```bash
npm test -- tests/generator.test.ts
```

Expected: FAIL because `src/generator.ts` does not exist.

- [ ] **Step 3: Implement generator**

Create `src/generator.ts`:

```ts
import { createHash } from "node:crypto";
import type { FieldShape, SeedShapeSchema } from "./schema.js";
import { normalizeRows, supportedFieldTypes } from "./schema.js";

export type FixtureRow = Record<string, string | number | boolean | null>;
export type FixtureMap = Record<string, FixtureRow[]>;

export interface GenerateOptions {
  schema: SeedShapeSchema;
  defaultRows: number;
  seed: string;
}

export interface GenerateResult {
  schema: SeedShapeSchema;
  fixtures: FixtureMap;
}

export function generateFixtures(options: GenerateOptions): GenerateResult {
  const fixtures: FixtureMap = {};

  for (const entity of options.schema.entities) {
    const rows: FixtureRow[] = [];
    const rowCount = normalizeRows(entity, options.defaultRows);
    for (let index = 0; index < rowCount; index += 1) {
      const row: FixtureRow = {};
      for (const field of entity.fields) {
        row[field.name] = generateFieldValue({
          field,
          entityName: entity.name,
          rowIndex: index,
          seed: options.seed,
          fixtures
        });
      }
      rows.push(row);
    }
    fixtures[entity.name] = rows;
  }

  return { schema: options.schema, fixtures };
}

function generateFieldValue(args: {
  field: FieldShape;
  entityName: string;
  rowIndex: number;
  seed: string;
  fixtures: FixtureMap;
}): string | number | boolean | null {
  const token = stableToken(args.seed, args.entityName, args.field.name, args.rowIndex);

  if (args.field.type === "ref") {
    const [targetEntity, targetField] = (args.field.references ?? "").split(".");
    const rows = args.fixtures[targetEntity] ?? [];
    if (rows.length === 0 || !targetField) {
      return null;
    }
    return rows[args.rowIndex % rows.length]?.[targetField] ?? null;
  }

  if (!supportedFieldTypes.has(args.field.type as never)) {
    return `${args.field.name}-${args.rowIndex + 1}-${token.slice(0, 8)}`;
  }

  switch (args.field.type) {
    case "uuid":
      return formatUuid(token);
    case "int":
      return args.rowIndex + 1;
    case "email":
      return `user-${args.rowIndex + 1}-${token.slice(0, 6)}@example.test`;
    case "name":
      return `Sample ${titleCase(args.field.name)} ${args.rowIndex + 1}`;
    case "sentence":
      return `Generated ${titleCase(args.entityName)} ${args.rowIndex + 1} for review.`;
    case "boolean":
      return args.rowIndex % 2 === 0;
    case "date":
      return new Date(Date.UTC(2026, 0, 1 + args.rowIndex)).toISOString();
    case "string":
    default:
      return `${args.field.name}-${args.rowIndex + 1}-${token.slice(0, 8)}`;
  }
}

function stableToken(seed: string, entityName: string, fieldName: string, rowIndex: number): string {
  return createHash("sha256")
    .update(`${seed}:${entityName}:${fieldName}:${rowIndex}`)
    .digest("hex");
}

function formatUuid(token: string): string {
  return `${token.slice(0, 8)}-${token.slice(8, 12)}-${token.slice(12, 16)}-${token.slice(16, 20)}-${token.slice(20, 32)}`;
}

function titleCase(value: string): string {
  return value.slice(0, 1).toUpperCase() + value.slice(1).replace(/[_-]/g, " ");
}
```

- [ ] **Step 4: Run generator tests to verify pass**

Run:

```bash
npm test -- tests/generator.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit generator**

```bash
git add src/generator.ts tests/generator.test.ts
git commit -m "feat: generate deterministic fixtures"
```

## Task 5: Implement Renderers and Report

**Files:**
- Create: `src/renderers/plan.ts`
- Create: `src/renderers/json.ts`
- Create: `src/renderers/sql.ts`
- Create: `src/reporter.ts`
- Test: `tests/renderers.test.ts`

- [ ] **Step 1: Write failing renderer tests**

Create `tests/renderers.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { renderJsonFixtures } from "../src/renderers/json.js";
import { renderPlanMarkdown } from "../src/renderers/plan.js";
import { renderSeedSql } from "../src/renderers/sql.js";

describe("renderers", () => {
  const schema = {
    entities: [{
      name: "User",
      rows: 1,
      fields: [
        { name: "id", type: "int", primary: true },
        { name: "email", type: "email", unique: true }
      ]
    }]
  };
  const fixtures = {
    User: [{ id: 1, email: "a'o@example.test" }]
  };

  test("renders a reviewable Markdown plan", () => {
    const markdown = renderPlanMarkdown({ schema, fixtures, diagnostics: [] });
    expect(markdown).toContain("# seed-shape plan");
    expect(markdown).toContain("## Entity: User");
    expect(markdown).toContain("email");
  });

  test("renders pretty JSON fixtures", () => {
    expect(renderJsonFixtures(fixtures.User)).toContain('"email": "a\\'o@example.test"');
  });

  test("renders escaped SQL inserts", () => {
    const sql = renderSeedSql(schema, fixtures);
    expect(sql).toContain("INSERT INTO \"User\"");
    expect(sql).toContain("'a''o@example.test'");
  });
});
```

- [ ] **Step 2: Run renderer tests to verify failure**

Run:

```bash
npm test -- tests/renderers.test.ts
```

Expected: FAIL because renderer modules do not exist.

- [ ] **Step 3: Implement Markdown plan renderer**

Create `src/renderers/plan.ts`:

```ts
import type { Diagnostic, SeedShapeSchema } from "../schema.js";
import type { FixtureMap } from "../generator.js";

export function renderPlanMarkdown(args: {
  schema: SeedShapeSchema;
  fixtures: FixtureMap;
  diagnostics: Diagnostic[];
}): string {
  const lines = [
    "# seed-shape plan",
    "",
    "This plan summarizes the fixture shape before any data is copied into an app or database.",
    ""
  ];

  for (const entity of args.schema.entities) {
    const rows = args.fixtures[entity.name] ?? [];
    lines.push(`## Entity: ${entity.name}`, "", `Rows: ${rows.length}`, "", "| Field | Type | Notes |", "| --- | --- | --- |");
    for (const field of entity.fields) {
      const notes = [
        field.primary ? "primary" : "",
        field.unique ? "unique" : "",
        field.references ? `references ${field.references}` : ""
      ].filter(Boolean).join(", ");
      lines.push(`| ${field.name} | ${field.type} | ${notes || "-"} |`);
    }
    lines.push("");
  }

  if (args.diagnostics.length > 0) {
    lines.push("## Diagnostics", "");
    for (const diagnostic of args.diagnostics) {
      lines.push(`- ${diagnostic.level.toUpperCase()} ${diagnostic.code}: ${diagnostic.message}`);
    }
    lines.push("");
  }

  return `${lines.join("\n").trim()}\n`;
}
```

- [ ] **Step 4: Implement JSON renderer**

Create `src/renderers/json.ts`:

```ts
import type { FixtureRow } from "../generator.js";

export function renderJsonFixtures(rows: FixtureRow[]): string {
  return `${JSON.stringify(rows, null, 2)}\n`;
}
```

- [ ] **Step 5: Implement SQL renderer**

Create `src/renderers/sql.ts`:

```ts
import type { FixtureMap, FixtureRow } from "../generator.js";
import type { SeedShapeSchema } from "../schema.js";

export function renderSeedSql(schema: SeedShapeSchema, fixtures: FixtureMap): string {
  const statements: string[] = [];
  for (const entity of schema.entities) {
    const rows = fixtures[entity.name] ?? [];
    for (const row of rows) {
      const columns = Object.keys(row);
      const values = columns.map((column) => formatSqlValue(row[column]));
      statements.push(`INSERT INTO "${entity.name}" (${columns.map((column) => `"${column}"`).join(", ")}) VALUES (${values.join(", ")});`);
    }
  }
  return `${statements.join("\n")}\n`;
}

function formatSqlValue(value: FixtureRow[string]): string {
  if (value === null) {
    return "NULL";
  }
  if (typeof value === "number") {
    return String(value);
  }
  if (typeof value === "boolean") {
    return value ? "TRUE" : "FALSE";
  }
  return `'${String(value).replaceAll("'", "''")}'`;
}
```

- [ ] **Step 6: Implement report writer model**

Create `src/reporter.ts`:

```ts
import type { Diagnostic, SeedShapeSchema } from "./schema.js";

export interface SeedShapeReport {
  schema: SeedShapeSchema;
  diagnostics: Diagnostic[];
  files: string[];
}

export function buildReport(report: SeedShapeReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}
```

- [ ] **Step 7: Run renderer tests to verify pass**

Run:

```bash
npm test -- tests/renderers.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit renderers**

```bash
git add src/renderers src/reporter.ts tests/renderers.test.ts
git commit -m "feat: render plans fixtures and sql"
```

## Task 6: Implement CLI Orchestration and Demo

**Files:**
- Create: `src/run.ts`
- Create: `src/demo.ts`
- Create: `src/cli.ts`
- Create: `examples/shop.schema.json`
- Create: `examples/shop.prisma`
- Create: `examples/shop.sql`
- Test: `tests/cli.test.ts`

- [ ] **Step 1: Write failing CLI tests**

Create `tests/cli.test.ts`:

```ts
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { runCli } from "../src/cli.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })));
  tempDirs.length = 0;
});

async function tempDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "seed-shape-"));
  tempDirs.push(dir);
  return dir;
}

describe("runCli", () => {
  test("writes demo outputs", async () => {
    const out = await tempDir();
    const result = await runCli(["demo", "--out", out]);

    expect(result.exitCode).toBe(0);
    await expect(readFile(join(out, "seed-shape.plan.md"), "utf8")).resolves.toContain("Entity: User");
    await expect(readFile(join(out, "fixtures", "User.json"), "utf8")).resolves.toContain("@example.test");
    await expect(readFile(join(out, "seed.sql"), "utf8")).resolves.toContain("INSERT INTO");
    await expect(readFile(join(out, "seed-shape.report.json"), "utf8")).resolves.toContain("files");
  });

  test("plans from a native schema file", async () => {
    const dir = await tempDir();
    const schemaPath = join(dir, "input.schema.json");
    const out = join(dir, "out");
    await writeFile(schemaPath, JSON.stringify({
      entities: [{ name: "User", rows: 1, fields: [{ name: "email", type: "email" }] }]
    }));

    const result = await runCli(["plan", schemaPath, "--out", out, "--rows", "2", "--sql"]);

    expect(result.exitCode).toBe(0);
    await expect(readFile(join(out, "fixtures", "User.json"), "utf8")).resolves.toContain("@example.test");
  });

  test("returns a non-zero exit for missing input", async () => {
    const result = await runCli(["plan", "missing.schema.json"]);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Input file not found");
  });
});
```

- [ ] **Step 2: Run CLI tests to verify failure**

Run:

```bash
npm test -- tests/cli.test.ts
```

Expected: FAIL because CLI modules do not exist.

- [ ] **Step 3: Implement run orchestration**

Create `src/run.ts`:

```ts
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Diagnostic, SeedShapeSchema } from "./schema.js";
import { validateSchema } from "./schema.js";
import { generateFixtures } from "./generator.js";
import { parseSchemaFile } from "./parsers/index.js";
import { buildReport } from "./reporter.js";
import { renderJsonFixtures } from "./renderers/json.js";
import { renderPlanMarkdown } from "./renderers/plan.js";
import { renderSeedSql } from "./renderers/sql.js";

export interface PlanOptions {
  inputPath: string;
  outDir: string;
  rows: number;
  seed: string;
  sql: boolean;
}

export interface WriteResult {
  files: string[];
  diagnostics: Diagnostic[];
}

export async function runPlan(options: PlanOptions): Promise<WriteResult> {
  const exists = await stat(options.inputPath).then(() => true, () => false);
  if (!exists) {
    throw new Error(`Input file not found: ${options.inputPath}`);
  }
  const text = await readFile(options.inputPath, "utf8");
  const parsed = parseSchemaFile(options.inputPath, text);
  return writeOutputs(parsed.schema, [...parsed.diagnostics], options);
}

export async function writeOutputs(schema: SeedShapeSchema, diagnostics: Diagnostic[], options: Omit<PlanOptions, "inputPath">): Promise<WriteResult> {
  const validation = validateSchema(schema);
  const allDiagnostics = [...diagnostics, ...validation.diagnostics];
  if (!validation.ok) {
    throw new Error(allDiagnostics.filter((diagnostic) => diagnostic.level === "error").map((diagnostic) => diagnostic.message).join("\n"));
  }

  const generated = generateFixtures({ schema, defaultRows: options.rows, seed: options.seed });
  const fixturesDir = join(options.outDir, "fixtures");
  await mkdir(fixturesDir, { recursive: true });

  const files: string[] = [];
  const planPath = join(options.outDir, "seed-shape.plan.md");
  await writeFile(planPath, renderPlanMarkdown({ schema, fixtures: generated.fixtures, diagnostics: allDiagnostics }));
  files.push(planPath);

  for (const [entityName, rows] of Object.entries(generated.fixtures)) {
    const fixturePath = join(fixturesDir, `${entityName}.json`);
    await writeFile(fixturePath, renderJsonFixtures(rows));
    files.push(fixturePath);
  }

  if (options.sql) {
    const sqlPath = join(options.outDir, "seed.sql");
    await writeFile(sqlPath, renderSeedSql(schema, generated.fixtures));
    files.push(sqlPath);
  }

  const reportPath = join(options.outDir, "seed-shape.report.json");
  await writeFile(reportPath, buildReport({ schema, diagnostics: allDiagnostics, files }));
  files.push(reportPath);

  return { files, diagnostics: allDiagnostics };
}
```

- [ ] **Step 4: Implement demo schema**

Create `src/demo.ts`:

```ts
import type { SeedShapeSchema } from "./schema.js";
import { writeOutputs } from "./run.js";

export const demoSchema: SeedShapeSchema = {
  entities: [
    {
      name: "User",
      rows: 3,
      fields: [
        { name: "id", type: "uuid", primary: true },
        { name: "email", type: "email", unique: true },
        { name: "name", type: "name" },
        { name: "createdAt", type: "date" }
      ]
    },
    {
      name: "Post",
      rows: 5,
      fields: [
        { name: "id", type: "uuid", primary: true },
        { name: "authorId", type: "ref", references: "User.id" },
        { name: "title", type: "sentence" },
        { name: "published", type: "boolean" }
      ]
    }
  ]
};

export async function runDemo(outDir: string) {
  return writeOutputs(demoSchema, [], {
    outDir,
    rows: 3,
    seed: "seed-shape-demo",
    sql: true
  });
}
```

- [ ] **Step 5: Implement CLI**

Create `src/cli.ts`:

```ts
#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runDemo } from "./demo.js";
import { runPlan } from "./run.js";

export interface CliResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export async function runCli(argv: string[]): Promise<CliResult> {
  const [command, ...rest] = argv;
  try {
    if (!command || command === "--help" || command === "-h") {
      return { exitCode: 0, stdout: helpText(), stderr: "" };
    }
    if (command === "--version" || command === "-v") {
      return { exitCode: 0, stdout: `${await readPackageVersion()}\n`, stderr: "" };
    }
    if (command === "demo") {
      const out = readOption(rest, "--out") ?? "reports/demo";
      const result = await runDemo(out);
      return { exitCode: 0, stdout: `Wrote ${result.files.length} files to ${out}\n`, stderr: diagnosticsText(result.diagnostics) };
    }
    if (command === "plan") {
      const inputPath = rest.find((arg) => !arg.startsWith("--"));
      if (!inputPath) {
        return { exitCode: 1, stdout: "", stderr: "Missing schema input path.\n" };
      }
      const out = readOption(rest, "--out") ?? "reports/seed-shape";
      const rows = Number.parseInt(readOption(rest, "--rows") ?? "3", 10);
      const seed = readOption(rest, "--seed") ?? "seed-shape";
      const sql = rest.includes("--sql");
      const result = await runPlan({ inputPath, outDir: out, rows, seed, sql });
      return { exitCode: 0, stdout: `Wrote ${result.files.length} files to ${out}\n`, stderr: diagnosticsText(result.diagnostics) };
    }
    return { exitCode: 1, stdout: "", stderr: `Unknown command: ${command}\n\n${helpText()}` };
  } catch (error) {
    return {
      exitCode: 1,
      stdout: "",
      stderr: `${error instanceof Error ? error.message : String(error)}\n`
    };
  }
}

function readOption(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function diagnosticsText(diagnostics: { level: string; code: string; message: string }[]): string {
  return diagnostics.map((diagnostic) => `${diagnostic.level.toUpperCase()} ${diagnostic.code}: ${diagnostic.message}`).join("\n");
}

function helpText(): string {
  return `seed-shape

Usage:
  seed-shape plan <schema> --out <dir> [--rows <n>] [--seed <text>] [--sql]
  seed-shape demo --out <dir>
  seed-shape --help
  seed-shape --version

seed-shape generates reviewable seed-data plans and deterministic local fixtures.
It does not connect to a database.
`;
}

async function readPackageVersion(): Promise<string> {
  const here = dirname(fileURLToPath(import.meta.url));
  const pkg = JSON.parse(await readFile(join(here, "..", "package.json"), "utf8")) as { version: string };
  return pkg.version;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await runCli(process.argv.slice(2));
  if (result.stdout) {
    process.stdout.write(result.stdout);
  }
  if (result.stderr) {
    process.stderr.write(result.stderr.endsWith("\n") ? result.stderr : `${result.stderr}\n`);
  }
  process.exitCode = result.exitCode;
}
```

- [ ] **Step 6: Add examples**

Create `examples/shop.schema.json`:

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

Create `examples/shop.prisma`:

```prisma
model User {
  id    String @id
  email String @unique
  name  String
}

model Post {
  id       String @id
  authorId String
  title    String
}
```

Create `examples/shop.sql`:

```sql
CREATE TABLE users (
  id uuid primary key,
  email varchar(255) unique,
  name text,
  created_at timestamp
);

CREATE TABLE posts (
  id uuid primary key,
  author_id uuid,
  title text,
  published boolean
);
```

- [ ] **Step 7: Run CLI tests to verify pass**

Run:

```bash
npm test -- tests/cli.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit CLI**

```bash
git add src/run.ts src/demo.ts src/cli.ts examples tests/cli.test.ts
git commit -m "feat: add seed-shape cli"
```

## Task 7: Write Bilingual Docs and License

**Files:**
- Create: `README.md`
- Create: `README.zh-CN.md`
- Create: `CHANGELOG.md`
- Create: `CHANGELOG.zh-CN.md`
- Create: `CONTRIBUTING.md`
- Create: `CONTRIBUTING.zh-CN.md`
- Create: `SECURITY.md`
- Create: `SECURITY.zh-CN.md`
- Create: `LICENSE`

- [ ] **Step 1: Write English README**

Create `README.md` with sections: what it does, why it exists, install/run, commands, supported inputs, outputs, examples, boundaries, docs index.

- [ ] **Step 2: Write Chinese README**

Create `README.zh-CN.md` with matching information in Simplified Chinese.

- [ ] **Step 3: Write changelogs**

Create `CHANGELOG.md` and `CHANGELOG.zh-CN.md` with `0.1.0` initial release entries.

- [ ] **Step 4: Write contributing and security docs**

Create `CONTRIBUTING.md`, `CONTRIBUTING.zh-CN.md`, `SECURITY.md`, and `SECURITY.zh-CN.md`.

- [ ] **Step 5: Add MIT license**

Create `LICENSE` with the MIT license and copyright holder `maxi-maxima`.

- [ ] **Step 6: Commit docs**

```bash
git add README.md README.zh-CN.md CHANGELOG.md CHANGELOG.zh-CN.md CONTRIBUTING.md CONTRIBUTING.zh-CN.md SECURITY.md SECURITY.zh-CN.md LICENSE
git commit -m "docs: add bilingual project documentation"
```

## Task 8: Full Verification and Public Release

**Files:**
- All project files.

- [ ] **Step 1: Run full check**

Run:

```bash
npm run check
```

Expected: lint, tests, and build pass with exit code `0`.

- [ ] **Step 2: Run compiled demo**

Run:

```bash
node dist/cli.js demo --out reports/demo
```

Expected: writes `seed-shape.plan.md`, `fixtures/User.json`, `fixtures/Post.json`, `seed.sql`, and `seed-shape.report.json`.

- [ ] **Step 3: Verify package contents**

Run:

```bash
npm pack --dry-run --ignore-scripts
```

Expected: tarball includes `dist`, `examples`, and all bilingual docs.

- [ ] **Step 4: Create public GitHub repo and push**

Use Git Credential Manager credentials to create `maxi-maxima/seed-shape` as public, then:

```bash
git remote add origin https://github.com/maxi-maxima/seed-shape.git
git push -u origin main
```

- [ ] **Step 5: Verify public sync**

Run:

```bash
git status --short --branch
git rev-list --left-right --count HEAD...origin/main
git ls-remote --heads origin main
```

Expected: branch tracks `origin/main`, ahead/behind is `0 0`, remote head exists. GitHub API lookup must report `"private": false`.
