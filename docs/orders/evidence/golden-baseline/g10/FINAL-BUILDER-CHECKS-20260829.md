# G10 builder final checks — 2026-08-29

This receipt records the final G10 Builder checks after the one complete registered candidate gate.

## Scope

- Candidate gate: `bun qa/run.ts golden-g10-canvas-runtime`
- Build reuse: `QF_G10_SKIP_BUILD=1`; bundle-affecting product bytes were unchanged from the recorded candidate build.
- Product bundle: `collab-electron/out/main/index.js`
- Bundle SHA-256: `3006C94B2B7638B295F09CACF2BE5CD4F70831230BCE203DAABCE71B14BCD681`
- Bundle diagnostic markers: absent
- Gate source SHA-256: `1FB2A45FE431AB38865EA1A14F6E4F5A0400CEE4826ABD064C565DBBD6FF80B5`
- Registered gate exit: `0`
- Durable gate log: `C:\tmp\golden-g10-candidate-gate-raw-f12a-20260829.txt`
- Durable gate log SHA-256: `17AFB56EC5AE4759B563ADAD8D7CB98D0E91316A8B575F557ED1B8E6F440ABD2`

## Required focused evidence

| Check | Result | Receipt SHA-256 |
| --- | --- | --- |
| F12a raw renderer `qf:execute("create_mission", ...)` refusal and isolated supported-route proof | PASS; raw bait red with `CommandNotAllowlisted`, no raw rows, supported route one Mission/one Hypothesis pair, cleanup zero | `E7A82EFF4C4BB7C87CC235F58F8B149FF769F2BCE01DBD0702E28CE398EA9192` |
| Golden Fast Mode 19-falsifier preflight | PASS; all 19 baits red and exact restores green | `8EB511E55A58210BAB37F545F9CA350A939FF9DB40760D3F5CE72A18237DA5A1` |
| `no-canvas-domain-writes` companion | PASS | `DADC829A73F4B61CBCBD8B81570FE33FDD95DB903D376568F4452DE60275F775` |
| Focused Electron/test matrix | PASS; 15 tests, 0 failures, 152 expectations | receipt is the command output for this candidate run |

## Complete registered gate

The gate returned `PASS  golden-g10-canvas-runtime` and exit `0`. Its registered red/restore proofs included:

- F12a raw renderer bait: red on `CommandNotAllowlisted`; restored supported `qf.research.submit_question` child route: green with exactly one durable Mission/Hypothesis pair and parent unchanged.
- F12b durable Canvas/Mission store bait: red; restored gate: green.
- F14a exact first-launch close/second-launch reopen: 15 objects and 18 links.
- F14b canonical owned-root bait: red with one exact root; exact-root removal and restored run: green.
- Final cleanup: `processes=0`, `roots_remaining=0`, `leaked=[]`, inherited state excluded.

## Atlas and hygiene

- `bun qf-atlas/generate.mjs`: PASS; 408 files, 113 channels.
- `bun qf-atlas/generate.mjs --check`: PASS.
- `bun qf-atlas/ratchet.mjs`: PASS; `HARD RED: 0`, unexplained coverage `0`, undecided without blocker `0`.
- `bun qf-atlas/generate.mjs --diff HEAD`: exit `0`, report `WORSE` with one analyzer coverage regression and two added observations; this is retained as a non-blocking comparative report for the independent Verifier, not suppressed or repaired outside the authorized G10 surface.
- Atlas generated files: `qf-atlas/ATLAS.md` SHA-256 `6721F803505E4429E0108742BF6996E0DE1FDFC39523E707877573BCD844B2CA`; `qf-atlas/atlas.json` SHA-256 `1859CAF076661FC36EEBDB7B954E2E437E7649A4F22C166EB4EEBECD44781CDA`.
- Atlas diff report SHA-256: `46D70C012E3DD6BEDF2E07418A7EE2F44A109FE1054CBAC9BAEFEA64573CBB9F`.
- `git diff --check`: PASS; only line-ending normalization warnings were emitted.
- Diagnostic-only submission correlation markers: absent from current source.

The independent Verifier must decide the immutable candidate; this Builder receipt does not self-verify or open G11.
