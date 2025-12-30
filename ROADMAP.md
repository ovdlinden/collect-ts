# Roadmap

This document outlines the planned development for collect-ts.

Track progress via [GitHub Milestones](https://github.com/ovdlinden/collect-ts/milestones).

---

## Current: v0.1.0 (Alpha)

The initial alpha release with core functionality:

- [x] Core Collection class with 130+ methods
- [x] LazyCollection for memory-efficient processing
- [x] Full TypeScript generics and type inference
- [x] Higher-order messaging support
- [x] Zero dependencies
- [x] ESM-only, Node 18+
- [x] VitePress documentation site

---

## v0.2.0 — CI & Automation

Focus: Development infrastructure

- [x] GitHub Actions CI (lint, test, build on PRs)
- [x] Automated npm publishing on release tags
- [x] CHANGELOG.md (auto-generated with git-cliff)
- [x] CONTRIBUTING.md

---

## v0.3.0 — Laravel Sync

Focus: Automated synchronization with Laravel

- [ ] Sync detection script (compare Laravel Collection.php vs local implementation)
- [ ] Daily sync check workflow (creates issues when Laravel changes detected)
- [ ] Issue template for sync updates

---

## v1.0.0 — Stable Release

Criteria for stable release:

1. **API Stability** — No breaking changes expected
2. **Battle-tested** — Used in production by the community
3. **Laravel Sync Working** — Automated sync reliably detects and reports changes

---

## Future Ideas

These may be explored after 1.0.0:

- [ ] Browser bundle (for non-Node environments)
- [ ] Benchmarks against alternatives (lodash, collect.js)
- [ ] Plugin system for custom methods
- [ ] Integration examples (React, Vue, etc.)
