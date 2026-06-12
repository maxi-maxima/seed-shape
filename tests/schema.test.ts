import { describe, expect, test } from "vitest";
import { normalizeRows, validateSchema } from "../src/schema.js";

describe("validateSchema", () => {
  test("accepts a valid schema with a relation target", () => {
    const result = validateSchema({
      entities: [
        {
          name: "User",
          rows: 2,
          fields: [{ name: "id", type: "uuid", primary: true }]
        },
        {
          name: "Post",
          rows: 2,
          fields: [{ name: "authorId", type: "ref", references: "User.id" }]
        }
      ]
    });

    expect(result.ok).toBe(true);
    expect(result.diagnostics).toEqual([]);
  });

  test("rejects duplicate fields and invalid references", () => {
    const result = validateSchema({
      entities: [
        {
          name: "Post",
          rows: 2,
          fields: [
            { name: "id", type: "uuid" },
            { name: "id", type: "int" },
            { name: "missing", type: "ref", references: "User.id" }
          ]
        }
      ]
    });

    expect(result.ok).toBe(false);
    expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      "duplicate_field",
      "invalid_reference"
    ]);
  });
});

describe("normalizeRows", () => {
  test("uses entity rows before default rows", () => {
    expect(normalizeRows({ name: "User", rows: 4, fields: [] }, 9)).toBe(4);
  });

  test("keeps default rows in a practical range", () => {
    expect(normalizeRows({ name: "User", fields: [] }, 0)).toBe(1);
    expect(normalizeRows({ name: "User", fields: [] }, 101)).toBe(100);
  });
});
