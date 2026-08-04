# R0 VERIFICATION — founder Hermes state gate

**In plain terms.** Launching a QuantFlow seat no longer relies on a human to check that the founder's Hermes login files stayed the same — a gate photographs only their fingerprints before and after, and fails if either fingerprint moves.

## What was proven

1. **Gate `hermes-founder-state`** hashes `~/.hermes/config.yaml` and `~/.hermes/auth.json` inside WSL via `sha256sum` only. Digests are logged; file contents are never read into the gate's output.
2. **Falsify RED (scratch only).** A temp HOME with scratch `config.yaml` / `auth.json` was photographed, the scratch config was appended, and digests diverged — the comparator goes red without touching the founder's real files.
3. **Falsify GREEN (scratch launch).** The same scratch HOME was photographed, `qf-hermes-launch.sh` ran against it with an isolated profile root, and digests matched afterward.
4. **Real founder photograph.** Real WSL `~/.hermes` digests matched before and after a launch that used the real HOME as the config/auth source and an isolated profile root for the seat.

### Transcript (2026-08-04, worktree `act-i-ladder`)

```
hermes-founder-state: FALSIFY RED scratch digest changed
hermes-founder-state: bait-before config=eebcfb2ed12dbc7abfa0565d17ed409d5ef4c79b3e7a181d59cdbdab3b42eb7f auth=1ef5a365baba0bed4686e07f72929b0c878ce3f8a59dbc6aa800030d0e027b6c
hermes-founder-state: bait-after config=2ba736c452967dac3c067b872993cfadb8f827aaa45264f3657e9b2c21fbc7d7 auth=1ef5a365baba0bed4686e07f72929b0c878ce3f8a59dbc6aa800030d0e027b6c
hermes-founder-state: FALSIFY GREEN scratch launch left digests unchanged
hermes-founder-state: PASS real founder digests unchanged
hermes-founder-state: founder config=e94b59965d330decd15c9befd99c0dca3ec8ab2674817c3e13a04c2f8c379d2e auth=2924b6a33c67b172b85833cc5f02280f49f8055aa5114aa53642b1623f863bbb
hermes-founder-state: PASS
```

Command: `bun qa/run.ts hermes-founder-state` → exit 0.

`bun qa/verify-release.ts` → exit 0 (runId includes stage `hermes-founder-state` after
`windows-cold-boot`).

Prior R0 checks (Hermes unavailable boot; cancel mid-work) remain in `CHECKS-2026-08-04.md` and are unchanged by this gate.

## What was not proven

- This gate exercises the **launch wrapper** (`qf-hermes-launch.sh`) end-to-end, not a full packaged Dock click-path through Electron. A regression that only mutates founder Hermes *after* the wrapper returns, inside a different host code path, would not be caught here.
- Digests prove bytes did not change. They do not prove the launcher never *opened* the files — only that it did not rewrite them.
- Founder manual keyboard-input into a native-TUI tile remains outside this gate (NEXT.md still records that as a separate acceptance item historically; it is not re-litigated here).
- Debt #32 (LX symlink under a Windows-visible profile root) is still carried; this gate does not close it.
