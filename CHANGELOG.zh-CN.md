# 更新日志

## 未发布

- 拒绝 `--rows` 的缺失值、不完整整数和超出安全整数范围的值，不再静默归一化这些错误输入。

## 0.1.0 - 2026-06-12

### 新增

- 初始版本 `seed-shape` CLI。
- 支持原生 JSON、Prisma 子集和 SQL `CREATE TABLE` 子集解析。
- 支持确定性的 JSON fixture 生成。
- 支持可审阅的 Markdown 计划输出。
- 支持可选 SQL insert 渲染。
- 支持结构化 report JSON。
- 提供英文和简体中文文档。
