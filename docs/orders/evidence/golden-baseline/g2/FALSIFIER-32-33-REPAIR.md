# G2 Falsifier 32/33 Mechanical Repair

Date: 2026-08-25

This focused receipt records the bounded repair in `qf-atlas/falsify.mjs`.

## Before

- Prior clean-tree ledger: `96/98` falsifiers pass.
- Prior log: `C:\tmp\g2-decisions-falsify-clean.txt`.
- Prior log SHA256: `D449DFE51FBB3FCA45221B65E93E809ABBA9946257434D33C260992CCD49B5A7`.
- Falsifiers 32 and 33 failed because the live ledger had no unreachable undecided finding to borrow.

## Repair

Falsifier 32 now creates its own unimported `zz-falsify-32.ts` fixture, captures that fixture model with the exact unreachable row undecided, adds the remove decision, and requires the exact row to become `remove` with undecided reduced by exactly one from the fixture model.

Falsifier 33 independently creates `zz-falsify-33.ts`, captures its fixture model with the exact unreachable row undecided, adds only the bare `accepted` decision, and requires that row to remain undecided. Both fixtures use the existing nested `withFile` cleanup. No analyzer, schema, pass criterion, record number/name, or other falsifier was changed.

## After

- Required clean-tree command: `bun qf-atlas/falsify.mjs`.
- External log: `C:\tmp\g2-falsify-32-33-clean.txt`.
- External log SHA256: `787C82851E40EF6C25E5EA630960DF881729DB362DF0F54E25C8976312F94B38`.
- Exit: `0`.
- Falsifiers 32 and 33: pass; item 32 reported `verdict=remove undecided 41 -> 40`, and item 33 reported `verdict=undecided` because bare `accepted` is incomplete.
- Full ledger: `98/98 falsifiers pass`.
- Tree receipt: `tree neutral — no files written`.

The repair is limited to `qf-atlas/falsify.mjs`; no Atlas output regeneration was required by the clean run.
