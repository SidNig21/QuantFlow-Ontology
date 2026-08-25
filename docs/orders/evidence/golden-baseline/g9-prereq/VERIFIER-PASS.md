# G9 minimum prerequisite — independent Verifier PASS

Date: 2026-08-25  
Verifier task: `01a037ed-8c05-76a3-89f1-0aacab8e71cc`  
Final message: `msg_0e9a601cc03f2469016a8d52f9c85887d0b30eead4c5a6f5ef`

## Candidate

- repair candidate: `4a12b948746c108bae3143d5982decd50a6957e9`
- origin branch: exact match
- parent candidate preserved: `bc1bdbfde9bfe87a8c30674ccf89d32592076bc0`
- protected `main` / `origin/main`: `5882ab2febf00f2c15a94c868c191420ed561bb4`
- paused G2 stash: `4e4dac24187f54a7187e5e61ab0459acbe7cd3ed`, untouched

## Independent result

**PASS.** The Verifier independently ran the repaired changed-surface proof.
The gate invoked the production `agent-host.runTurn(sessionId, prompt,
{ finalize: true, skipPublish: false })` path through production admission,
live-map lookup, trajectory writer, Kernel session close, and runtime destroy.
Only external environment/runtime dependencies were mocked in the isolated test
process; no production module was mocked.

Measured receipt:

- exactly one `trajectory` Artifact;
- exactly one correct `produces` link;
- 31 bytes with SHA-256 beginning `5c54880f` and matching row/disk identity;
- session closed;
- host destroyed;
- zero ordinary Reports;
- direct Report publication without `evaluation_id` refused with the exact
  required message and unchanged Artifact/event counts.

All eight named falsifiers exited `1` for their intended receipt. The focused
matrix passed `artifact-root`, `governed-review`, `kernel-sole-writer`, changed-
surface typecheck, Atlas generation/check and ratchet (`HARD RED 0`), and both
diff checks. `kernel-one-path` retained the exact byte-identical pre-existing
12-offender G8 fingerprint and gained no candidate-owned offender.

The repository tree was clean after verification and no product process
remained. Full G9 remains parked after G8.

## Earlier defect receipt

The first candidate failed because its gate called the writer directly rather
than proving production `runTurn`. The original immutable failure report remains
at `C:\tmp\quantflow-g9-prereq-verifier-report.md` with SHA-256
`FA99D3D3689F9450240993F7BD65380A7D8981D1BBD486E404874DDFDBCCEB0A`.
It is historical evidence for candidate `bc1bdbf`, not the verdict on the repair
candidate.
