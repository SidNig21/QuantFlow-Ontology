# G2 observe-door Reader adjudication

- candidate: `e490df8fde06ef7b4f9f11b349ca9cfb234a30b6`
- original G2 start: `6f73e61f74dc5f438da90d92e3f1ed3a33586297`
- Reader task: `01a03bf0-9713-79a3-87dd-7a6ec14a0d13`
- verdict: **YES / YES — mechanical same-meaning proof repair**

The first independent Verifier correctly rejected the recorded
`ROUTER_ACCEPTED_GREEN` annotation: `bun qa/run.ts observe-door` exited 1.
The exact reported paths were `qf-atlas/atlas.json`,
`qa/gates/doc-action-surface.ts`, and `qa/gates/governed-review.ts`.

The Reader proved that the three gate source files, the generated tool
catalogue, and the runtime serving-policy files are byte-identical between the
original G2 start and the candidate. `atlas.json` contains the same
`observe_ticket` projection at both SHAs; G2 changed no surviving reach row.

Classification:

- `qf-atlas/atlas.json` is generated developer projection output and is not a
  running-app input;
- `doc-action-surface.ts` parses the generated catalogue only to compare action
  names;
- `governed-review.ts` calls the pure generator only to assert that an internal
  action is absent;
- `observe_ticket` remains `operatorOnly`, runtime registration filters it, and
  the real tool-plane harness asserts it is absent from MCP `tools/list`.

Therefore the smallest exact-path classification amendment preserves the
original product invariant. No blanket allowlist is authorized. The replacement
candidate must prove the live tool plane remains closed and must falsify one
unallowlisted production string, one unallowlisted JSON tool-catalogue reference,
and one unallowlisted QA generator consumer.

Full G9 remains parked after G8. G3 and later groups remain unauthorized until
G2 independently passes.
