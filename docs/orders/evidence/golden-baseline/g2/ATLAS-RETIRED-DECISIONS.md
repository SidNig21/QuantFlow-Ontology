# Prior Atlas decisions retired by G2

The following is the full prior text of the four source-bound decisions before their removal from `qf-atlas/decisions.json`.

```json
"unreachable:collab-electron/src/main/a2a-bus.ts": {
  "verdict": "keep",
  "owner": "founder",
  "reason": "GATE-ANCHORED. qa/gates/artifact-root/run.ts:350 reads this exact path, and :359/:362 assert it imports AND calls the production A2A artifact store. Deleting it turns a gate red, which is the one thing this work may never do to make the map greener."
},
"unreachable:collab-electron/src/windows/shared/flow-cube/cube3d.js": {
  "verdict": "keep",
  "owner": "founder",
  "reason": "Founder-authored brand engine. qa/gates/one-skin.ts:21 allowlists this exact path as one of two justified palette exceptions, and WO-007 describes it as imported verbatim as founder input. flow-cube-watermark.js does not import it (the apparent import at line 16 is a usage comment), so 'unimported' is accurate and irrelevant: it is an asset, not dead wiring."
},
"unreachable:collab-electron/src/main/species-launch.ts": {
  "verdict": "repair",
  "owner": "founder",
  "reason": "ORPHANED, NOT DEAD. Nothing imports it, but collab-electron/scripts/package-lib/shared-paths.test.ts:38 reads its source and asserts it contains './package-resource-paths', and WO-008c documents its launch-precedence chain as live behaviour. A module that a test pins and no code imports is a wiring defect, not a deletion candidate."
},
"unreachable:collab-electron/src/main/species-tools.ts": {
  "verdict": "repair",
  "owner": "founder",
  "reason": "Same shape as species-launch.ts: shared-paths.test.ts:42 pins its content, nothing imports it. WO-008a also uses it as the ACP sole-writer perimeter bait target."
}
```

G2 founder disposition supersedes these source-bound decisions: the four subjects are retired as unbuilt or superseded residue, and current proof is retargeted to live surfaces.
