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
        : [{
            level: "error",
            code: "invalid_native_schema",
            message: "Native schema must contain an entities array."
          }]
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
