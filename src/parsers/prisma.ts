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
      if (!fieldName || !prismaType || (!/^[A-Za-z_]\w*$/.test(fieldName))) {
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
