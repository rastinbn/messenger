# Contributing

Thanks for your interest in contributing!

## Setup

```bash
pnpm install
pnpm dev
```

Requires Node.js 22+ and pnpm 9+ (see `.nvmrc` / `packageManager` in `package.json`).

## Workflow

1. Fork and create a branch: `feat/<short-desc>` or `fix/<short-desc>`.
2. Make your change, following [`docs/conventions.md`](docs/conventions.md).
3. Add/update tests.
4. Update relevant docs in `docs/` if you touched API, DB schema, or the Socket.IO protocol.
5. Open a PR using the provided template. CI must pass (lint, typecheck, test, build).

## Commit Style

We use [Conventional Commits](https://www.conventionalcommits.org/): `feat: add typing indicator`, `fix: correct unread count`, etc.

## Code Review

All changes land via PR review — no direct pushes to `main`. Please be responsive to review feedback; if a PR goes stale for >2 weeks it may be closed and can be reopened later.

## Reporting Bugs / Requesting Features

Use the issue templates under `.github/ISSUE_TEMPLATE/`.

## Code of Conduct

By participating, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).
