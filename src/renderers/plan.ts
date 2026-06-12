import type { FixtureMap } from "../generator.js";
import type { Diagnostic, SeedShapeSchema } from "../schema.js";

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
