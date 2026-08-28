# G7 independent verifier receipt

status: **PASS WITH INHERITED REDS**
verified-at: 2026-08-27
independent_verifier_task: `01a046fc-0548-7001-86be-78adaff82ce4`
candidate_sha: `ba2b489b7378426fab976267a58eaadc5ffdaf91`
candidate_tree: `6de625faeb677ce0e18b38825f1f4e843e0a545a`
candidate_parent_authority: `b422df42229bcd8c9510608ce60684e69b6021bd`
starting_evidence_head: `4e037c69268ffd4a62f0e9aa933686c6f8c3c93e`
evidence_head: `8f13495b24e995e69f43deadeeec72ff644e111a`
evidence_tree: `39fcc664b03717dcbf9b9abdf4951152dc44bf93`
candidate_to_evidence_diff: **receipt-only; non-receipt=0; worktree clean**
verdict: **G7-owned matrix PASS; inherited reds reproduced/retained exactly**

The Verifier inspected the immutable G7 product candidate independently; this
is not a Builder self-verdict. G7 closes as **PASS WITH INHERITED REDS**. The
packaged/native proof is not reclassified as a blanket release PASS.

## Bounded results

| bounded result | independent evidence |
| --- | --- |
| current package boundary | 20 manifests; 103 retained dependency rows from 109 |
| lock closure | 15 lock roots; exactly 6 direct-removal consequences and 10 expected lock-entry removals |
| protocol ledger | 50 rows: 15 removed, 30 retained, 5 routed to G10; all 159 rows dispositioned |
| falsifier matrix | 30 independent pairs; every bait red exit `1`, every exact restore green exit `0` |
| preserved transport | PTY `send` variants, `shell:forward`, 20 static inner channels, `agent:${event.kind}`, and `viewer:${workspacePath}` dynamic families |
| saved state | named G7 session/research/terminal/Canvas/Dock/external-CLI/host-ACP seams remained green |
| runtime/package identity | actual 13-file runtime/package set byte-identical; all package references resolve |
| build and architecture | Electron build green with host permission; Atlas `HARD RED 0` |

## Runtime receipt description correction

The frozen runtime receipt previously omitted the live critic prompt from its
description. The retained 13-file set includes
`species/hermes/prompts/critic.md`, alongside the four Hermes controls, the
Hermes artifact and research-director/worker prompts, the three qf-proof
controls, and the two qf-proof runtime files. This corrects the description
only; the accepted actual-byte set, byte-identity proof, package references,
and candidate product tree are unchanged.

## Inherited reds — not PASS

| selector | result | owner and boundary |
| --- | --- | --- |
| `kernel-one-path` | **INHERITED_RED** | 13 pre-existing offenders; G8 owns the same exact set |
| `package-inspect.test.ts` | **INHERITED_RED** | 12 pass / 3 Windows fixture failures; G12 owns package qualification |
| `hermes-launch-policy` | **INHERITED_RED** | WSL `E_ACCESSDENIED`; G12 owns operations/platform qualification |
| `research-director-front-door` | **INHERITED_RED** | Windows WMI `Get-CimInstance` access denied; retained as inherited operations/environment red |

None of these reds was repaired, absorbed, relabeled, or used as G7 PASS.
G8's packaged result-observation proof debt remains open: the exact Director
result observation must precede `result_return`; worker completion alone is not
that observation. G9 Report/result authority remains outside G8's current
order, and G12 retains full package/operations qualification.

## Cleanup and identity

The Verifier confirmed the candidate-to-evidence diff is receipt-only with
`non-receipt=0` and a clean worktree. The actual 13-file runtime/package set
was byte-identical and its references resolved. No G7-owned process or root
remained; inherited roots and unrelated operations failures were not cleaned
or relabeled. G7 did not alter the canonical Kernel database, add a truth
store, repair an inherited red, enter G8–G12 work, or open R18.

G7 is therefore closed. The next permitted authority is a fresh G8 semantic
Reader against the bounded order and baseline now named by `NEXT.md`.
