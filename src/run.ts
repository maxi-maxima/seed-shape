import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { generateFixtures } from "./generator.js";
import { parseSchemaFile } from "./parsers/index.js";
import { buildReport } from "./reporter.js";
import type { Diagnostic, SeedShapeSchema } from "./schema.js";
import { validateSchema } from "./schema.js";
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

export async function writeOutputs(
  schema: SeedShapeSchema,
  diagnostics: Diagnostic[],
  options: Omit<PlanOptions, "inputPath">
): Promise<WriteResult> {
  const validation = validateSchema(schema);
  const allDiagnostics = [...diagnostics, ...validation.diagnostics];
  if (!validation.ok) {
    throw new Error(allDiagnostics
      .filter((diagnostic) => diagnostic.level === "error")
      .map((diagnostic) => diagnostic.message)
      .join("\n"));
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
