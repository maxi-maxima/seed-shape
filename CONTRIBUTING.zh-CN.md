# 贡献指南

感谢你改进 `seed-shape`。

## 本地环境

```bash
npm install
npm run check
```

## 开发规则

- 保持 local-first。不要在核心 CLI 中加入数据库连接。
- 行为变更先写测试。
- 解析器要保守，诊断信息要清楚。
- 面向用户的变更需要同时更新英文和简体中文文档。
- 提交 PR 前运行发布门槛：

```bash
npm run check
node dist/cli.js demo --out reports/demo
npm pack --dry-run --ignore-scripts
```

## 提交信息

使用简洁的 conventional 风格提交信息，例如：

- `feat: add relation diagnostics`
- `fix: escape sql identifiers`
- `docs: update chinese readme`
