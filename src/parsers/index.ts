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
    diagnostics: [{
      level: "error",
      code: "unknown_schema_format",
      message: `Could not detect schema format for ${path}.`
    }]
  };
}
