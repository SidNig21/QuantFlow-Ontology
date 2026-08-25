# Golden Baseline G1 — Independent Verifier Acceptance

status: **PASS**
verified-at: 2026-08-24
verifier-task: `01a0370a-9d7b-78f2-aca5-40d4f93f5b7d`
build-base: `57fc4ff711848bbb7f668f608e7478d407dc14f4`
immutable-candidate: `767717760858c8a0dc77d61e95535faca3c316a0`
evidence-head: `c3a01f6781bb26e6a47d06928a01babcd57895fb`

## Independent result

- Candidate parent equals BUILD_BASE exactly.
- Candidate diff contains the 14 authorized tracked deletions and no product edits.
- All three authorized ignored targets are absent.
- Evidence-head additions are documentation/receipts only.
- The corrected allowlist accounts for all 36 candidate diff rows.
- `BEFORE.md`, `AFTER.md`, `COMMANDS.tsv`, and all 25 recorded log hashes match.
- Production Dock inventory is unchanged: six entries and the same QA-only ungranted fixture observation.
- Atlas is unchanged: 439 files, 126 channels, 13 strip candidates, HARD RED 0, and unchanged ratchet zero fields.
- Commands 06–19 all exit 0.
- Direct-absence and product-process-zero checks exit 0.
- Final invariant: `sha_before == sha_after == c3a01f6781bb26e6a47d06928a01babcd57895fb`; tree clean; zero matching product processes.

The verifier performed no repository mutation. G1 is independently accepted on the Phase-2 branch. This receipt does not merge to `main`, authorize G2 implementation, or unfreeze R18.
