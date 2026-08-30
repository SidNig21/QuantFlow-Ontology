# G10 receipt-hash clarification — 2026-08-29

This note corrects the hash used to identify the final G10 gate source without
changing the earlier receipt or any product evidence.

The immutable builder receipt
`FINAL-BUILDER-CHECKS-20260829.md` records gate-source SHA256
`1FB2A45FE431AB38865EA1A14F6E4F5A0400CEE4826ABD064C565DBBD6FF80B5`.
That value belongs to the pre-repair candidate evidence and remains preserved
exactly as written; it is not the identity of the accepted final gate source.

The accepted candidate is
`96ad59984a62dc8defe224c4404b34c7ca3b2157` / tree
`10ae35acc709b96da6c535dd88ff13f11297906d`. The independent Verifier
recomputed the current candidate file
`qa/gates/golden-g10-canvas-runtime.ts` as:

```
SHA256 3C16550ECA9EE466F8FA058B121DFBA3C6D045956EAC4A8090311D54D2DAF2D4
```

That current hash is the authoritative source identity for the accepted
candidate. The product bundle remains the separately recorded
`3006C94B2B7638B295F09CACF2BE5CD4F70831230BCE203DAABCE71B14BCD681`; no
bundle, raw gate log, focused transcript, or prior receipt was rewritten.

Proof binding:

- candidate path scope: exactly `qa/gates/golden-g10-canvas-runtime.ts`;
- focused independent F14b bait: RED;
- restored independent F14b cleanup: GREEN;
- complete registered `QF_G10_SKIP_BUILD=1 bun qa/run.ts golden-g10-canvas-runtime`:
  exit `0`, `PASS golden-g10-canvas-runtime`;
- final owned-run cleanup: `processes=0 roots_remaining=0 leaked=[]`;
- independent Verifier: task `01a0508a-43f5-7101-9416-0683ba081449`.

This is an evidence-only clarification. It does not amend history, replace the
builder receipt, or authorize any G11 implementation.
