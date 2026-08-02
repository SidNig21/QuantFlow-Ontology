# WO-WIN1 founder-state incident

Date: 2026-08-02 (America/Los_Angeles)

During preparation of the founder-visible Windows launch, the first PowerShell
launcher failed while assigning the read-only `$HOME` variable, but still
started the packaged executable before the isolated environment was complete.
That launch was not isolated and must not be cited as proof.

Observed writes under `C:\Users\rybow\.quantflow` between 02:40:38 and
02:40:45 PDT included:

- creation of `app/dev/worktree-52d15e433d84` and Electron cache/state paths;
- creation of `app/logs/main-2026-08-02T09-40-38.log` and its rotated log;
- creation of the `artifacts` directory; and
- an updated modification time for `kernel.db-shm`.

The main `kernel.db` file retained its earlier modification time and size, but
there is no pre-launch content hash proving that the live database was never
opened or changed logically. The incident therefore remains recorded as a real
founder-state mutation.

No incident-created path has been deleted or rolled back. Cleanup requires an
explicit founder decision after inspection.

Corrective controls used for later proof runs:

- isolated `USERPROFILE`, `HOME`, `HOMEDRIVE`, `HOMEPATH`, `APPDATA`,
  `LOCALAPPDATA`, `TEMP`, and `TMP`;
- explicit isolated `QF_KERNEL_DB` and `QF_ARTIFACT_ROOT`;
- removal of inherited `QF_DEV_WORKTREE_ROOT` and `ELECTRON_RUN_AS_NODE`;
- exact executable-path process ownership checks; and
- external Computer verification against the isolated package window.
