import { describe, expect, test } from "vitest";
import { parseNativeSchema } from "../src/parsers/native.js";
import { parsePrismaSchema } from "../src/parsers/prisma.js";
import { parseSqlSchema } from "../src/parsers/sql.js";

describe("parseNativeSchema", () => {
  test("parses entities from native JSON", () => {
    const result = parseNativeSchema(JSON.stringify({
      entities: [{ name: "User", fields: [{ name: "email", type: "email" }] }]
    }));

    expect(result.schema.entities[0]?.fields[0]?.type).toBe("email");
    expect(result.diagnostics).toEqual([]);
  });
});

describe("parsePrismaSchema", () => {
  test("parses model fields and relation ids", () => {
    const result = parsePrismaSchema(`
      model User {
        id String @id
        email String @unique
      }

      model Post {
        id Int @id
        authorId String
        title String
      }
    `);

    expect(result.schema.entities.map((entity) => entity.name)).toEqual(["User", "Post"]);
    expect(result.schema.entities[0]?.fields).toContainEqual({
      name: "email",
      type: "email",
      unique: true
    });
  });
});

describe("parseSqlSchema", () => {
  test("parses create table statements", () => {
    const result = parseSqlSchema(`
      CREATE TABLE users (
        id uuid primary key,
        email varchar(255) unique,
        created_at timestamp
      );
    `);

    expect(result.schema.entities[0]?.name).toBe("users");
    expect(result.schema.entities[0]?.fields).toEqual([
      { name: "id", type: "uuid", primary: true },
      { name: "email", type: "email", unique: true },
      { name: "created_at", type: "date" }
    ]);
  });
});
