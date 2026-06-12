import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

describe("package build contract", () => {
  test("build output matches the published CLI bin path", async () => {
    const root = process.cwd();
    const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8")) as {
      bin: Record<string, string>;
    };
    const tsconfig = JSON.parse(await readFile(join(root, "tsconfig.json"), "utf8")) as {
      compilerOptions: { rootDir?: string; outDir?: string };
      include?: string[];
    };

    expect(packageJson.bin["seed-shape"]).toBe("./dist/cli.js");
    expect(tsconfig.compilerOptions.outDir).toBe("dist");
    expect(tsconfig.compilerOptions.rootDir).toBe("src");
    expect(tsconfig.include).toEqual(["src/**/*.ts"]);
  });
});
