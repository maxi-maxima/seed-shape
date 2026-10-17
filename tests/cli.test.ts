import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { runCli } from "../src/cli.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })));
  tempDirs.length = 0;
});

async function tempDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "seed-shape-"));
  tempDirs.push(dir);
  return dir;
}

describe("runCli", () => {
  test("writes demo outputs", async () => {
    const out = await tempDir();
    const result = await runCli(["demo", "--out", out]);

    expect(result.exitCode).toBe(0);
    await expect(readFile(join(out, "seed-shape.plan.md"), "utf8")).resolves.toContain("Entity: User");
    await expect(readFile(join(out, "fixtures", "User.json"), "utf8")).resolves.toContain("@example.test");
    await expect(readFile(join(out, "seed.sql"), "utf8")).resolves.toContain("INSERT INTO");
    await expect(readFile(join(out, "seed-shape.report.json"), "utf8")).resolves.toContain("files");
  });

  test("plans from a native schema file", async () => {
    const dir = await tempDir();
    const schemaPath = join(dir, "input.schema.json");
    const out = join(dir, "out");
    await writeFile(schemaPath, JSON.stringify({
      entities: [{ name: "User", fields: [{ name: "email", type: "email" }] }]
    }));

    const result = await runCli(["plan", schemaPath, "--out", out, "--rows", "2", "--sql"]);

    expect(result.exitCode).toBe(0);
    const rows = JSON.parse(await readFile(join(out, "fixtures", "User.json"), "utf8")) as unknown[];
    expect(rows).toHaveLength(2);
  });

  test("returns a non-zero exit for missing input", async () => {
    const result = await runCli(["plan", "missing.schema.json"]);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Input file not found");
  });

  test.each([undefined, "0", "2junk", "9007199254740992"])("rejects an invalid --rows value: %s", async (value) => {
    const args = ["plan", "input.schema.json", "--rows"];
    if (value !== undefined) {
      args.push(value);
    }
    const result = await runCli(args);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Invalid --rows: expected a positive integer");
  });
});
