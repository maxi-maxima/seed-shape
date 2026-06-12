import type { Diagnostic, SeedShapeSchema } from "./schema.js";

export interface SeedShapeReport {
  schema: SeedShapeSchema;
  diagnostics: Diagnostic[];
  files: string[];
}

export function buildReport(report: SeedShapeReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}
