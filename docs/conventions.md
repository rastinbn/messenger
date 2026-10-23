# Coding Standards & Conventions

## TypeScript

- Strict mode everywhere (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`).
- No `any` without an inline comment justifying it.
- Prefer `type` for unions/utility shapes, `interface` for object shapes meant to be extended/implemented.
- All cross-cutting data shapes live in `@messenger/shared-types`, never redefined locally.

## Components (Frontend)

- Named exports only (no `export default`) — improves refactor tooling and grep-ability.
- Colocation: `Button/Button.tsx`, `Button/Button.test.tsx`, `Button/index.ts`.
- One component per file. Presentational vs. container components kept separate where a component grows past ~150 lines.
- Props typed with an explicit `interface {Name}Props`.

## Imports

- Absolute imports via path aliases (`@/components`, `@/services`, `@/hooks`, `@/stores`).
- Import order enforced by ESLint: builtin → external → internal → parent → sibling → index, alphabetized within groups.

## Backend (Phase 2)

- Clean Architecture layering per module; dependencies point inward only.
- Controllers are thin: parse request → call one application service method → map response. No business logic in controllers.
- Repositories are the only place Prisma is imported.
- Every input DTO validated with `class-validator`; every schema shape also mirrored/derived from `@messenger/shared-types` where applicable.

## Commits & Branching

- [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`.
- Branch naming: `feat/<short-desc>`, `fix/<short-desc>`.
- No direct commits to `main`; all changes via PR.

## Testing

- Unit tests colocated with source (`*.test.ts(x)`).
- Integration tests under `apps/api/test/`.
- New features require tests before merge; bug fixes require a regression test.

## Documentation

- Any change to API shape, DB schema, or Socket.IO protocol must update the corresponding doc in `docs/` in the same PR.
