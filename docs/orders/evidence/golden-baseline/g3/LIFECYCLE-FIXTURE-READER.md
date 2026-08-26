# Golden Baseline G3 — Lifecycle Fixture Semantic Reader

status: **YES / YES**
reader-task: `01a03e81-0b6d-7960-8c21-724be13906e1`
reviewed-candidate: `56e4c6ffb5fe81546742b1b2adfd99895f55af56`
reader-mutation: none

## Adjudication

The original requirement for an empty `tsconfig.json` made normal `tsc --noEmit` impossible with TS18003. The minimum honest repair is:

- add `qa/fixtures/lifecycle-command/src/empty.ts` containing exactly `export {};`;
- set `tsconfig.json` to exactly `{"files":["src/empty.ts"]}`.

This preserves the package, TypeScript 5.9.3 lock, lifecycle matcher, literal/flagged/chained red controls, and normal typecheck PASS meaning. The fixture becomes a real compilable typecheck package without adding product/runtime behavior or relaxing an assertion.
