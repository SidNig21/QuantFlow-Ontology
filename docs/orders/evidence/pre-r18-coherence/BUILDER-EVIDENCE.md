# Pre-R18 Coherence — Round 3 Repair Builder Evidence

## Scope and candidate identity

This receipt records the evidence-only repair after the Round 3 verifier failure recorded in `VERIFICATION-ROUND-3.md`. The unchanged product candidate is `1a869c67f8d7c3f1bf6aec6247af2cd1ed3e87cf` on `wo-pre-r18-coherence`; the clean pre-repair receipt was `3449166f05e365defba0e608d3c077f086e09134`. No product component, ontology, layout, C01–C14 assertion or threshold, oracle, or R18 boundary was changed, and no R18 work was started. The only code change is the proof/capture sequencing in `qa/gates/pre-r18-coherence.ts`; the remaining changes are the recaptured evidence images and their manifest/receipt.

## Visual sequencing repair

The prior frames 12 and 13 retained the Critic participant inspector from frame 11. The repaired capture sequence now:

1. Clicks the real START Dock tab after frame 11 and collapses any participant Canvas Inspect controls through their existing Inspect buttons. The receipt records the participant details as closed and records the Dock's actual computed paint state; it does not hide or restyle the Dock. In this product state the Dock remains visibly rendered, which is the state Ryan can reach through normal interaction.
2. For frame 12, finds the exact result Artifact by its live `data-qf-world-type`/`data-qf-world-id`, uses the existing Canvas body mousedown/mouseup focus/raise path, pans and zooms through real Canvas wheel interactions, and opens that tile's own Inspect control.
3. For frame 13, repeats the same real Canvas interaction for the exact Evaluation tile.
4. Before each capture, proves actual DOM identity, nonzero computed paint rectangles, containment in the Canvas viewport, z-order and `elementsFromPoint` topmost status, visible `Collapse`/details state, and no visible participant-inspector overlap. The gate waits for the painted details state before `capturePage`.
5. Reopens the saved world for frame 14 and captures the legible dense 16-object/20-link world after the evidence-only pan/zoom state.

The live proof logged the following exact target identities and geometry:

- Artifact `f6b17a65302300edce36ea0fb7131e77765c54558aaaf8281469de25d6315671`: Canvas `280,0–1200,1000`; tile `595.34375,229.09375–884.650634765625,450.89569091796875`; `beforeZ=21`, `afterZ=2`, no overlap, `centerTopmost=true`, details open with `Collapse`.
- Evaluation `86c514da-652d-4fd3-a67a-45e672106b41`: Canvas `280,0–1200,1000`; tile `595.34375,229.09375–884.650634765625,450.89569091796875`; `beforeZ=18`, `afterZ=3`, no overlap, `centerTopmost=true`, details open with `Collapse`.
- Participant close proof recorded `dock.hidden=true`, computed `display=flex`, nonzero Dock rectangle `1201,669.59375–1600,834.796875`, and every participant Canvas details node `detailsHidden=true`. The Dock's visible paint is therefore measured and retained, not suppressed by proof code.

Frames 11–14 were directly inspected after the final capture. Frame 11 shows the selected Critic participant. Frames 12 and 13 visibly show the enlarged named Artifact/Evaluation Canvas tiles with their own open `Collapse` state, while the Dock remains visible on START and does not dominate the Canvas details. Frame 14 visibly retains the dense populated world.

## Verification receipt

| Check | Result |
|---|---|
| Focused `task-composition.test.ts` + `research-world.test.ts` | 11 pass, 0 fail, 99 expectations |
| `bunx tsc --noEmit` from `collab-electron` | PASS |
| Capture-enabled live `bun qa/run.ts pre-r18-coherence` | PASS; 14/14 unique captures, 1600x1000, 982,030 bytes, 16 objects/20 links, clean roots |
| Capture-disabled live `bun qa/run.ts pre-r18-coherence` | PASS; C01–C14, oracle 16/20, inspected 16/20, clean roots |
| C01–C14 falsifiers | PASS as a red matrix: every named falsifier exited 1 with its expected `FALSIFY RED C##` marker |
| Inherited `bun qa/run.ts research-world-visible` | PASS on retry; 13 oracle tiles / 15 cables, 10 pointer/Inspect/collapse checks, clean roots |
| Required static/doc gates | PASS: repo-shape, lockfile-committed, kernel-sole-writer, no-canvas-domain-writes, kernel-sole-writer-app, doc-action-surface, one-skin, rung-ladder, doc-links |
| `bun install --frozen-lockfile` | PASS |
| Package-wide `bun test` | 493 pass, 42 fail, 8 errors across 535 tests; unrelated pre-existing/environmental failures, detailed below |
| `git diff --check` | PASS |

## Package-wide note

The authorized package-wide test run completed `493 pass, 42 fail, 8 errors` across 535 tests. The failures are unrelated to this proof-only change and include Hermes launcher fixture expectations, packaged-resource fixture setup, Windows `ls`/Electron test stubs, missing `pty-sidecar.js`/tmux runtime, Bun nested-describe behavior, sidecar socket timing, DOM/image-extension test environment mismatches, and missing browser globals. The changed-surface suite, live PRE-R18 gates, inherited gate, static/doc gates, and typecheck are green. No unrelated package-wide failure was repaired.

## Evidence and Atlas handoff

The final screenshot hashes, sizes, object/link counts, uniqueness, and 1600x1000/600KB/25MB constraints are recorded in [SCREENSHOT-MANIFEST.md](./SCREENSHOT-MANIFEST.md). Atlas generation is intentionally performed only after this final proof/evidence ordering is committed; the final `generate --check`, ratchet, diff, evidence commit SHA, and separate Atlas commit SHA are reported in the handoff. The product candidate remains unchanged.
