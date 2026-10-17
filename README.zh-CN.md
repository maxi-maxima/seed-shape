# seed-shape

`seed-shape` 可以从小型 schema 文件生成可审阅的种子数据计划和确定性的本地 fixture。

当你需要给 UI、API 测试或 AI 生成的功能分支准备演示数据，但不希望工具连接数据库时，它会很有用。它读取类似 schema 的文件，输出 Markdown 计划、JSON fixture，也可以生成简单的 SQL insert 语句。

## 为什么做这个项目

大多数 seed 工具的重点是通过 ORM 或数据库执行播种逻辑。`seed-shape` 关注更前一步：先把准备生成的数据结构变得透明、可复现、可人工审查。

它帮助你回答：

- 会生成哪些实体？
- 每个实体有多少行？
- 哪些字段是主键、唯一值或引用？
- 最终交给应用或测试套件的 fixture 文件是什么？

## 安装

```bash
npm install -g seed-shape
```

本地开发：

```bash
npm install
npm run check
```

## 命令

```bash
seed-shape plan <schema> --out <dir> [--rows <n>] [--seed <text>] [--sql]
seed-shape demo --out <dir>
seed-shape --help
seed-shape --version
```

## 快速开始

运行内置 demo：

```bash
seed-shape demo --out reports/demo
```

或者使用原生 schema：

```bash
seed-shape plan examples/shop.schema.json --out reports/shop --rows 5 --seed preview --sql
```

`--rows` 接受正整数。缺失、不完整或超出安全整数范围的值会在写入输出文件前直接失败。

输出文件：

- `seed-shape.plan.md`：给人看的 fixture 计划。
- `fixtures/<Entity>.json`：确定性的 fixture 数据。
- `seed.sql`：使用 `--sql` 时生成的可选 SQL insert。
- `seed-shape.report.json`：机器可读的诊断和输出路径。

## 支持的输入

首个版本故意保持保守：

- 原生 `seed-shape.schema.json`。
- Prisma `model` 语法的一个窄子集。
- SQL `CREATE TABLE` 语句的一个窄子集。

不支持的字段或结构会作为诊断信息输出。`seed-shape` 宁愿清楚说明部分支持，也不会假装理解所有 schema 特性。

## 原生 Schema 示例

```json
{
  "entities": [
    {
      "name": "User",
      "rows": 3,
      "fields": [
        { "name": "id", "type": "uuid", "primary": true },
        { "name": "email", "type": "email", "unique": true },
        { "name": "name", "type": "name" }
      ]
    },
    {
      "name": "Post",
      "rows": 5,
      "fields": [
        { "name": "id", "type": "uuid", "primary": true },
        { "name": "authorId", "type": "ref", "references": "User.id" },
        { "name": "title", "type": "sentence" },
        { "name": "published", "type": "boolean" }
      ]
    }
  ]
}
```

## 边界

`seed-shape` 不会：

- 连接数据库；
- 运行迁移；
- 执行生成的 SQL；
- 替代 Prisma、Drizzle、Snaplet、Faker.js 或应用自己的 seed 脚本。

它只创建你可以审阅、编辑、提交或交给其他工具使用的本地文件。

## 文档

- 英文：`README.md`、`CHANGELOG.md`、`CONTRIBUTING.md`、`SECURITY.md`
- 简体中文：`README.zh-CN.md`、`CHANGELOG.zh-CN.md`、`CONTRIBUTING.zh-CN.md`、`SECURITY.zh-CN.md`

## 开发

```bash
npm install
npm run check
node dist/cli.js demo --out reports/demo
npm pack --dry-run --ignore-scripts
```

## 许可证

MIT
