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
      if (
        !targetEntity ||
        !targetField ||
        !entityNames.has(targetEntity) ||
        !fieldNamesByEntity.get(targetEntity)?.has(targetField)
      ) {
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
