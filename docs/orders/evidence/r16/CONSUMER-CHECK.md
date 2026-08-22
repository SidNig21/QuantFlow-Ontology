# R16 normal application consumer check

## Attempt 1 — RED: governed critic cannot inspect result Artifact bytes

Date: 2026-08-22
Candidate: `7dda122435dce47adbc650e5d5b9d933db249263`
Builder evidence: `d9f112993e68dbf2b7efbfa743c5e6cfe76d7a14`
Independent verification: `eaa3dee652e30ca27aad555efba88a34a2dc050f`
Build command: `bun run --cwd collab-electron build`
Build timestamp: `2026-08-22T11:50:40.8281398Z`
Visible masthead: exact candidate SHA and build timestamp
Mode: normal `electron-vite preview --skipBuild`; no proof bridge, SQLite seed,
credential access, or packaged/release gate

Verdict: **RED. R16 remains open.**

### What worked

- The preserved founder Kernel opened normally. The historical
  `KernelUpgradeShapeError (agent-profile-identity)` did not recur.
- A real Hermes Research Director created Mission
  `mission-b5670aa5-eab5-4f67-ac34-23c12fd35bbc`, delegated source Task
  `task-ea18c94d-68a7-42a9-b2a4-e0ca2447b719` to executor
  `0f3b7f14-4af7-4a5e-a71d-d7e06af5ef43`, and produced Hypothesis
  `f24185a4-3fcd-45e1-8f89-a4e071896f4d`, Run
  `run-9fd656da-3395-490e-b638-98793d45c3bf`, and result Artifact
  `cba126f77ef6bf9bc099639dc2b91ee339341e1fba88ccdb511b41327f394a16`.
- The immutable result Artifact is hash-valid and contains
  `eligible_count=3`, `roi=1.000000`, `net_profit=100.000000`,
  `hit_rate=1.000000`, and one selected win.
- Exact canary `qf-r16-typing-check-7dda122` passed by real mouse focus,
  keyboard typing, erase, and mouse return without Enter or submission in the
  Director, executor, and critic terminals.
- The replacement governed critic
  `e213c9db-fe51-4b89-8286-b1a2ba468233` completed the required independent
  `qf_hypothesis_get`, `qf_run_get`, and `qf_artifact_get` reads in broker
  sequence 1/2/3. Two invalid Evaluation attempts were rejected because they
  cited foreign trajectory ids; the third valid attempt created Evaluation
  `36fa58e5-6fc5-498a-823a-b19207d1c09e`.
- Ordinary window Close left the launched root PID, all QuantFlow Electron
  processes, and all QuantFlow Hermes/collaboration/ontology WSL processes at
  zero.

### Exact product defect

The critic's governed `qf_artifact_get` result contained only the Artifact
row—`id`, `created_at`, `kind`, `content_hash`, and `storage_ref`. It did not
contain the hash-verified immutable JSON bytes or preview that the existing R16
research-world projection already exposes for the same Artifact.

The independent critic therefore could verify lineage but could not inspect
the edge or ROI evidence. Its final verdict was honestly `rejects` at confidence
`0.7`, with block reason `EVALUATION_REJECTS_PUBLICATION`; no Report was
published. This is a governed-read defect, not grounds to override the critic
or weaken publication gating.

The selected source Task's read-only Kernel projection consequently contains
exactly 12 objects and 14 links: Mission, source Task, governed review Task,
Hypothesis, Dataset, Run, result and findings Artifacts, Evaluation, Director,
executor, and critic. The absent thirteenth object is the Report and the absent
fifteenth cable is its publication lineage. `missing_lineage=[]`.

### Consumer interference disclosure

During pointer inspection, the Router mistook a live Dock session row for a
selection control and canceled the original critic
`critic-d579b717-b9f1-484d-b704-9e6633273104`. Recovery used only normal app
controls and Director steering, but it created additional Tasks under the same
Mission. The Mission-root chooser therefore correctly returned
`WORLD_ROOT_INELIGIBLE` with four linked research Tasks. The exact source-Task
root above isolates the measured research chain. This operator interference
means the attempt cannot satisfy the final one-Mission/two-launch consumer
receipt even apart from the governed Artifact-read defect.

No reopen acceptance was attempted. No R17 work began. A replacement consumer
attempt may occur only after the bounded repair receives a fresh independent
PASS and one fresh exact build.
