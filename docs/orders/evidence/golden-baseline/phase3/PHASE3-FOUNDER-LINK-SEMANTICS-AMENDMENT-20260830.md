# Phase 3 founder link semantics amendment — 2026-08-30

status: **FRESH READER YES / YES — ONE GATEWAY FILE ADDED TO EXISTING BUILDER**

- authority head before amendment: `2ed206dc`
- originating accepted order: [PHASE3-FOUNDER-ONTOLOGY-READ-AMENDMENT-20260830.md](PHASE3-FOUNDER-ONTOLOGY-READ-AMENDMENT-20260830.md)
- fresh Reader: `/root/founder_link_semantics_reader`

## Exact defect

Generated `qf_*_links` tools promise links **touching** an object and publicly accept only `id` plus optional `kind`. Kernel `getLinks()` correctly returns edges touching the id in either direction. The app gateway nevertheless filters omitted direction and explicit `both` to incoming edges only.

That mismatch removes the two outgoing edges required by the already-approved founder read chain:

```text
Task -> assigned_to -> AgentSession
AgentSession -> spawned_from -> AgentDefinition
```

No hidden `direction: "from"` argument may rescue the real MCP proof because it is absent from the generated tool schema and frozen founder prompt.

## Exact added Builder surface

Add only:

- `collab-electron/src/main/ontology-gateway.ts`

to the previously approved editable paths. The existing test/gate paths remain:

- `collab-electron/src/main/ontology-role-tools.ts`
- `collab-electron/src/main/ontology-gateway.test.ts`
- `qa/gates/windows-dock-ontology.ts`
- directly caused Phase-3 evidence
- generated Atlas outputs only if changed by regeneration

## Required semantics

For the gateway's link-read branch:

```text
omitted/default -> every touching link
both            -> every touching link
from            -> only links whose from_id equals id
to              -> only links whose to_id equals id
```

The existing optional `kind` filter continues to compose with direction. Do not add `direction` to generated schemas. Keeping explicit `from`, `to`, and `both` internally is backward-compatible behavior; generated MCP callers rely on the correct default.

Required independent RED cases restore the old incoming-only default, make `both` incoming-only, swap `from`/`to`, remove either outgoing assignment/spawn edge, or require a hidden direction argument. Exact restoration must return GREEN using schema-declared `{id}` calls.

Capability checks, exact live-seat identity, app-owned Kernel validation, distinct trajectory Artifacts, role boundaries, write exclusions, package proof, provider-free sequencing, and every prior amendment stop remain unchanged.

No Kernel, schema, generated ontology, MCP bridge, role/capability expansion beyond the already-approved roster, trajectory mechanism, UI, package configuration, dependency, P14-B, or R18 change is authorized.

