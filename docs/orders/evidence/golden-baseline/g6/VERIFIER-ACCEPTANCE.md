# G6 independent verifier receipt

status: **PASS WITH INHERITED G8/G12 REDS**
independent_verifier_task: `01a04695-825e-7893-89fb-d0efb6ceec3c`
candidate_sha: `8dbc19162be9c42303fd79c3c942385a17726f31`
candidate_tree: `7cee1e3d8e8444d48c8048f344f44ef33db594e2`
candidate_parent_authority: `929de18c181f3d42eedede5b1ea3246108cc3a1d`
starting_evidence_head: `bd3135edfe7004b140874fd2dcbef16ddb433540`
evidence_head: `4e037c69268ffd4a62f0e9aa933686c6f8c3c93e`
candidate_to_evidence_diff: **exactly five G6 receipts**

The Verifier inspected the immutable G6 product candidate independently; this
is not a Builder self-verdict. G6 closes as **PASS WITH INHERITED G8/G12 REDS**.

## Bounded matrix and product result

The G6 matrix result is `16 PASS / 3 INHERITED_RED`:

| selector | result | owner / evidence |
| --- | --- | --- |
| all G6-owned inventory, staging, Dock, saved-state, refusal, front-door, protected-seam, build, and static checks | PASS | independently rerun at the immutable candidate |
| `kernel-one-path` | INHERITED_RED | 13 pre-existing offenders; G8 owns the same red |
| `package-inspect.test.ts` | INHERITED_RED | 12 pass / 3 Windows platform-fixture failures; G12 owns the red |
| `hermes-launch-policy` | INHERITED_RED | WSL `E_ACCESSDENIED` creating fake Hermes; G12 owns the red |

The three inherited reds are not called PASS, repaired, or absorbed into G6.
The packaged release is not claimed PASS.

## Independent results

- Exact production and QA staging matched P0/Q0 and P1/Q1. Production retained
  four genuine Hermes profiles and eight paths. QA retained six profiles and
  thirteen paths, adding exactly two generic qf-proof profiles/five paths.
- The canonical Kernel remained read-only at `1,175,552` bytes with SHA-256
  `FD564B3A8E585FD38A7AAB758F58A7B3DA33B32C3DA77DB31BAA145C02D73F70`. All
  seven `agent_definition` rows and their seven named fields remained intact;
  refusal-relevant row/link/session counts were unchanged.
- Saved Claude rows projected `available=false` and nonlaunchable. The real
  `qf:sessions:spawn` refusal created zero new session, link, or process.
- Hermes, the front door, Dock, Canvas, PTY, and generic external CLI behavior
  remained green. All eight named falsifiers exited `1`; exact-clear restore
  reruns exited `0`.

## Cleanup and ownership

Atlas reported `HARD RED 0`. All 35 Verifier roots were absent after the run,
and no Bun/Electron process remained. The candidate-to-evidence diff is exactly
the five receipts in this directory: `AFTER.md`, `COMMANDS.tsv`,
`FALSIFIERS.tsv`, `GROUP-ACCEPTANCE.md`, and this file.

G8 retains ownership of `kernel-one-path`; G12 retains ownership of the Windows
package-inspection and Hermes-launch-policy reds. G8/G9 order remains unchanged,
G9 remains after G8, and R18 remains frozen. No G7/G11/G12 broad work is hidden
inside this G6 verdict.
