import { describe, expect, test } from "vitest";
import { generateFixtures } from "../src/generator.js";

describe("generateFixtures", () => {
  test("generates deterministic rows for supported field types", () => {
    const first = generateFixtures({
      schema: {
        entities: [{
          name: "User",
          rows: 2,
          fields: [
            { name: "id", type: "uuid", primary: true },
            { name: "email", type: "email", unique: true },
            { name: "name", type: "name" },
            { name: "active", type: "boolean" }
          ]
        }]
      },
      defaultRows: 2,
      seed: "demo"
    });
    const second = generateFixtures({
      schema: first.schema,
      defaultRows: 2,
      seed: "demo"
    });

    expect(second.fixtures).toEqual(first.fixtures);
    expect(first.fixtures.User).toHaveLength(2);
    expect(first.fixtures.User?.[0]?.email).toMatch(/^user-1-/);
  });

  test("links ref fields to generated target rows", () => {
    const result = generateFixtures({
      schema: {
        entities: [
          { name: "User", rows: 1, fields: [{ name: "id", type: "uuid", primary: true }] },
          { name: "Post", rows: 2, fields: [{ name: "authorId", type: "ref", references: "User.id" }] }
        ]
      },
      defaultRows: 2,
      seed: "demo"
    });

    expect(result.fixtures.Post?.[0]?.authorId).toBe(result.fixtures.User?.[0]?.id);
    expect(result.fixtures.Post?.[1]?.authorId).toBe(result.fixtures.User?.[0]?.id);
  });
});
