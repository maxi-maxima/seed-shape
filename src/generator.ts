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
