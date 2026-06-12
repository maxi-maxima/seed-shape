import { writeOutputs } from "./run.js";
import type { SeedShapeSchema } from "./schema.js";

export const demoSchema: SeedShapeSchema = {
  entities: [
    {
      name: "User",
      rows: 3,
      fields: [
        { name: "id", type: "uuid", primary: true },
        { name: "email", type: "email", unique: true },
        { name: "name", type: "name" },
        { name: "createdAt", type: "date" }
      ]
    },
    {
      name: "Post",
      rows: 5,
      fields: [
        { name: "id", type: "uuid", primary: true },
        { name: "authorId", type: "ref", references: "User.id" },
        { name: "title", type: "sentence" },
        { name: "published", type: "boolean" }
      ]
    }
  ]
};

export async function runDemo(outDir: string) {
  return writeOutputs(demoSchema, [], {
    outDir,
    rows: 3,
    seed: "seed-shape-demo",
    sql: true
  });
}
