# Order 004 — `windows-collaborative-inquiry` acceptance gate

**Parent:** WO-W2-02 Deliverable 5  
**Depends:** Orders 001–003  
**Priority:** P0 (acceptance)

## Problem

WO-W2-02 requires gate `windows-collaborative-inquiry` (`WO-W2-02:171-193`). It is **not** registered in `qa/run.ts` (no file under `qa/gates/`). Without it, W2-02 cannot close honestly.

## Why it matters

Founder acceptance and verifier independence depend on a **non-preseeded** packaged Windows journey with receipt `qf.wo-w2-02.integrated-receipt.v1` and four legible captures. Scripted success would violate product law 11 (“Docs, gates, and receipts are not the capability”).

## Scope

**May change:**

- New `qa/gates/windows-collaborative-inquiry.ts`
- Registration in `qa/run.ts`
- Minimal app hooks **only** if required for observability (no behavior change)

**Must not:**

- Weaken existing W1/W2-01 gates to reuse their journeys inside this gate’s positive path
- Hard-code question/answer text that bypasses real Hermes/Codex inference
- Register on Linux release verifier as acceptance (Windows only)

Implement all six falsifiers listed in W2-02 §Deliverable 5 (invalid answer contract, wrong session, Evaluation reuse, row rebind, presentation mutation, stopped-seat late response).

## Done means

On **native Windows 11** with real Hermes/Codex and current UFC data:

```text
bun qa/run.ts windows-collaborative-inquiry
```

Exit 0; writes `receipt.json` to `QF_WINDOWS_COLLABORATIVE_INQUIRY_EVIDENCE_DIR` or temp dir per order; verifies SHA-256 after cleanup; ≥4 captures per order.

Verifier reruns same command on immutable candidate and performs **semantic** read of Q&A prose.

## Report

Unedited gate log, receipt hash, package/tree hashes, runtime model ids, evidence directory listing.
