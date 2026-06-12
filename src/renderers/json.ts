import type { FixtureRow } from "../generator.js";

export function renderJsonFixtures(rows: FixtureRow[]): string {
  return `${JSON.stringify(rows, null, 2)}\n`;
}
