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
