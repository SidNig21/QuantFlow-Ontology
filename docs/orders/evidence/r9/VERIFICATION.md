# R9 — research integrity

QuantFlow now refuses unsupported hypothesis resolution and ungated research
reports inside the Kernel, before mutation.

Product proof:

- a matching `supports` Evaluation resolves its linked hypothesis and publishes
  a report with a Kernel-written `gates` link;
- absent, mismatched, rejecting, or hypothesis-free evidence changes no
  hypothesis and creates no report or event; and
- the generated agent tool surface now requires `evaluation_id` for resolution
  and exposes it as the report authorization field.

Local verification on native Windows:

```text
bun test src/r9-research-integrity.test.ts src/kernel.test.ts
34 pass, 0 fail

bun test src/generate.test.ts
20 pass, 0 fail

bunx tsc --noEmit
exit 0
```
