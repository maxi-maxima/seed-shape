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
