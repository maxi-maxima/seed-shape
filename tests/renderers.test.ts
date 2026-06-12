import { describe, expect, test } from "vitest";
import { renderJsonFixtures } from "../src/renderers/json.js";
import { renderPlanMarkdown } from "../src/renderers/plan.js";
import { renderSeedSql } from "../src/renderers/sql.js";

describe("renderers", () => {
  const schema = {
    entities: [{
      name: "User",
      rows: 1,
      fields: [
        { name: "id", type: "int", primary: true },
        { name: "email", type: "email", unique: true }
      ]
    }]
  };
  const fixtures = {
    User: [{ id: 1, email: "a'o@example.test" }]
  };

  test("renders a reviewable Markdown plan", () => {
    const markdown = renderPlanMarkdown({ schema, fixtures, diagnostics: [] });
    expect(markdown).toContain("# seed-shape plan");
    expect(markdown).toContain("## Entity: User");
    expect(markdown).toContain("email");
  });

  test("renders pretty JSON fixtures", () => {
    expect(renderJsonFixtures(fixtures.User)).toContain("\"email\": \"a'o@example.test\"");
  });

  test("renders escaped SQL inserts", () => {
    const sql = renderSeedSql(schema, fixtures);
    expect(sql).toContain("INSERT INTO \"User\"");
    expect(sql).toContain("'a''o@example.test'");
  });
});
