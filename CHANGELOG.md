# Changelog

## Unreleased

- Reject missing, partial, and unsafe integer values passed to `--rows` instead of silently normalizing them.
- Escape double quotes in SQL table and column identifiers so generated inserts remain valid.

## 0.1.0 - 2026-06-12

### Added

- Initial `seed-shape` CLI.
- Native JSON, Prisma subset, and SQL `CREATE TABLE` subset parsing.
- Deterministic JSON fixture generation.
- Reviewable Markdown plan output.
- Optional SQL insert rendering.
- Structured report JSON.
- English and Simplified Chinese documentation.
