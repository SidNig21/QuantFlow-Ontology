# G10 independent Verifier acceptance — 2026-08-29

G10 now proves that the current research workspace behaves coherently and
leaves no temporary QuantFlow work running behind after its accepted run.

## Binding identity

| Field | Accepted value |
|---|---|
| Candidate | `96ad59984a62dc8defe224c4404b34c7ca3b2157` |
| Candidate tree | `10ae35acc709b96da6c535dd88ff13f11297906d` |
| Parent | `d25a2bba382407f34b359e0bdfed82aea39e39a5` |
| Candidate diff | exactly one path: `qa/gates/golden-g10-canvas-runtime.ts` |
| Gate-source SHA256 | `3C16550ECA9EE466F8FA058B121DFBA3C6D045956EAC4A8090311D54D2DAF2D4` |
| Reused product bundle SHA256 | `3006C94B2B7638B295F09CACF2BE5CD4F70831230BCE203DAABCE71B14BCD681` |
| Independent Verifier task | `01a0508a-43f5-7101-9416-0683ba081449` |

## Fresh independent proof

The Verifier did not modify the checkout, rewrite receipts, or treat the stale
builder gate-source hash as current. It ran the focused F14b cleanup falsifier:

| Boundary | Result |
|---|---|
| Bait with the owned cleanup path broken | RED; the owned run remained attributable and the bait root was observed |
| Restored cleanup path | GREEN; owned PIDs reached zero and the owned root was removed |
| Ambient/pre-existing state | excluded by exact run correlation; four older `qf-g10-*` roots preserved |

It then ran the complete registered gate with exact product-build reuse:

```text
QF_G10_SKIP_BUILD=1 bun qa/run.ts golden-g10-canvas-runtime
```

The PowerShell environment form used by the Verifier was equivalent:

```text
$env:QF_G10_SKIP_BUILD='1'; bun qa/run.ts golden-g10-canvas-runtime
```

The outer command exited `0` and reported:

```text
PASS golden-g10-canvas-runtime
```

The registered run retained fail-capable nested F12a/F12b/F14b bait/restore
transcripts, exact F14a `15 objects / 18 links`, and the final cleanup result:

```text
processes=0 roots_remaining=0 leaked=[]
```

After the run the worktree was clean and no candidate runtime process remained.
The four older roots were created before this exact run and were excluded by
run attribution; G10 does not claim to repair or delete them.

## Evidence and boundary

All G10 final evidence remains retained in this directory. The original
builder final-check receipt remains immutable, including its pre-repair source
hash; the [hash clarification](RECEIPT-HASH-CLARIFICATION-20260829.md) binds
the current candidate source hash without rewriting that receipt.

G10 closes only the current Canvas/Mission/runtime coherence group. The
inherited G12 package/process red remains RED and is not a G10 or G11 pass;
packaging, install, PTY prebuild, shutdown/relaunch, and process-root work stay
with G12. No product semantic, Kernel, Canvas, R18, or G12 implementation is
authorized by this acceptance.
