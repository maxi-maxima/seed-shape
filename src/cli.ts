#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runDemo } from "./demo.js";
import { runPlan } from "./run.js";

export interface CliResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export async function runCli(argv: string[]): Promise<CliResult> {
  const [command, ...rest] = argv;
  try {
    if (!command || command === "--help" || command === "-h") {
      return { exitCode: 0, stdout: helpText(), stderr: "" };
    }
    if (command === "--version" || command === "-v") {
      return { exitCode: 0, stdout: `${await readPackageVersion()}\n`, stderr: "" };
    }
    if (command === "demo") {
      const out = readOption(rest, "--out") ?? "reports/demo";
      const result = await runDemo(out);
      return { exitCode: 0, stdout: `Wrote ${result.files.length} files to ${out}\n`, stderr: diagnosticsText(result.diagnostics) };
    }
    if (command === "plan") {
      const inputPath = rest.find((arg) => !arg.startsWith("--"));
      if (!inputPath) {
        return { exitCode: 1, stdout: "", stderr: "Missing schema input path.\n" };
      }
      const out = readOption(rest, "--out") ?? "reports/seed-shape";
      const rows = Number.parseInt(readOption(rest, "--rows") ?? "3", 10);
      const seed = readOption(rest, "--seed") ?? "seed-shape";
      const sql = rest.includes("--sql");
      const result = await runPlan({ inputPath, outDir: out, rows, seed, sql });
      return { exitCode: 0, stdout: `Wrote ${result.files.length} files to ${out}\n`, stderr: diagnosticsText(result.diagnostics) };
    }
    return { exitCode: 1, stdout: "", stderr: `Unknown command: ${command}\n\n${helpText()}` };
  } catch (error) {
    return {
      exitCode: 1,
      stdout: "",
      stderr: `${error instanceof Error ? error.message : String(error)}\n`
    };
  }
}

function readOption(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function diagnosticsText(diagnostics: { level: string; code: string; message: string }[]): string {
  return diagnostics.map((diagnostic) => `${diagnostic.level.toUpperCase()} ${diagnostic.code}: ${diagnostic.message}`).join("\n");
}

function helpText(): string {
  return `seed-shape

Usage:
  seed-shape plan <schema> --out <dir> [--rows <n>] [--seed <text>] [--sql]
  seed-shape demo --out <dir>
  seed-shape --help
  seed-shape --version

seed-shape generates reviewable seed-data plans and deterministic local fixtures.
It does not connect to a database.
`;
}

async function readPackageVersion(): Promise<string> {
  const here = dirname(fileURLToPath(import.meta.url));
  const pkg = JSON.parse(await readFile(join(here, "..", "package.json"), "utf8")) as { version: string };
  return pkg.version;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await runCli(process.argv.slice(2));
  if (result.stdout) {
    process.stdout.write(result.stdout);
  }
  if (result.stderr) {
    process.stderr.write(result.stderr.endsWith("\n") ? result.stderr : `${result.stderr}\n`);
  }
  process.exitCode = result.exitCode;
}
