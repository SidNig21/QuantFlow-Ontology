## Measured facts (verified on this tree)

| Claim | Verdict |
|---|---|
| 23 objects; 71 tools = 46 read + 25 action | **True** |
| 0 generated tools served; zero `ListTools` string handlers | **True** for generated tools / symbol search |
| Kernel public reads: 4 functions / 3 types | **True** |
| Only `FROM links` at `kernel.test.ts:458` | **True** |
| 25 tables; tools.json 1555 lines / 46589 bytes; 14 gates | **True** |
| `observe-door` clause 2 directory skip | **True** (`qa/gates/observe-door.ts:97`) |
| peer-bus `McpServer` + `StdioServerTransport` on sdk `^1.29.0`, L28–109 | **True** |
| “no MCP server exists” | **False** — `tools/qf-peer-bus` is one |

---

## QUESTION 1 — Can each acceptance gate actually fail?

### G1 — **Partially. Defeatable.**
Goes red only if the builder’s attack files still contain `golden/tools.json` / `generateMcp(` after clause 2 stops trusting the whole `qf-kernel-schema/` tree and stops skipping `.json`.

**What breaks a real fix:** keep the directory `continue`, or keep `ext === ".json"`.

**How to false-pass:** The order asks for only four transcripts (post-fix red → restore green × 2). It does **not** require the pre-fix miss. Attack A is paraphrased; the evidence file’s load-bearing shape is “server inside schema names the path; `collab-electron` import does **not**.” A builder can put `golden/tools.json` in the outside importer — clause 2 **already** catches that today — and show red→green without proving the directory-trust hole closed. Weaker A (any schema file containing the string) also skips the import-side blind spot the probe found.

### G2 — **No, not as written. Satisfiable by construction against hand-written registration.**
Intended fail: adding `experimental` forces a server/registration edit.

**Defeat:** Hand-write all 69 `registerTool(...)` calls. Add `experimental` only in a test fixture; regenerate; show three tools in `tools.json`; paste a fixture diff with no registration; do not touch the server (it never served `experimental`). That matches the order’s procedure (“appear”, “falsify by DIFF”, “if adding a type required touching server code”). SCOPES required tools that “exist **and answer**”; G2 weakened that to definition appearance. This is the doctrine phase-exit gate and it does not catch hand-written serving.

### G3 — **Sound.**
Fails if the served `_links` tool’s rows ≠ raw SQL on the same graph, or if the call never goes through the served tool (helper-only). Clear fail modes.

### G4 — **Partially. Enumeration is defeatable.**
Fails honestly if ListTools-equivalent length ≠ 69, a name escapes `_get`/`_query`/`_links`, or `qf_observe_ticket` is present.

**Defeat:** Enumerate a pre-filtered array (`generateMcp` output filtered to reads, or an in-process list built only from what the test wants) while the live server also registers actions. The order never binds “served list” to an MCP client `tools/list` over the real transport.

### G5 — **Sound.**
Fails if unknown type or unknown filter key does not error (or errors only after interpolating into SQL). Bait both ways is specified.

### G6 — **Sound.**
Fails if any of the 14 gates exits non-zero on a cold worktree. Exit-code-on-own-line constraint is checkable.

---

## QUESTION 2 — Does each deliverable have exactly one meaning?

### Deliverable 1 — **No. Underspecified.**
Named bans (no `switch`, no per-type branch, no per-type function) help, but do not disqualify a hand-maintained type→table map, or pin filter semantics (AND? equality only?).  
**Seam:** D1 requires property filters on `queryObjects`, but `generateMcp` `_query` inputs are still only `limit`/`offset` (and SCOPES already called that description a pinned lie). One builder implements kernel filters unused by MCP; another extends tool schemas. Both can claim D1/D3.

### Deliverable 2 — **Yes, one meaning.**
Add generated `qf_<object>_links`; counts 71→94 / 46→69 / 25 unchanged. Ambiguity is small (`kind` optional filter only).

### Deliverable 3 — **No. Underspecified on the read/action cut.**
“Serve zero actions” + “registration driven by schema” need a cut the order never names. `generateMcp` emits reads and actions together. Honest builds differ: iterate `schema.objects` only; filter `tools.json`; add a read-only generator flag. All can claim both bullets. With G2 weak, “schema-driven” is not enforced.

### Deliverable 4 — **No, by design.**
Compact **or** decline with a reason. Two builders, two outcomes, both pass. Intentional escape hatch; fails “exactly one meaning.”

### Deliverable 5 — **Does not exist.**
Order has deliverables 0–4 only.

---

## Ranked findings

### High — load-bearing
1. **G2 does not fail hand-written tool registration.** Procedure proves fixture codegen, not schema-driven **serving**. Builder can ship 69 hand-written `registerTool`s and still pass. **Fix:** Require the fixture type’s three tools on a live MCP `tools/list` (server loading that schema) with zero new registration lines in server code; or a permanent gate forbidding per-tool name literals outside a `schema.objects` loop.

2. **G1 can pass without closing the probed hole.** No pre-fix miss transcripts; Attack A paraphrase allows an attack that is already red today. **Fix:** Mandate evidence paths (`qf-kernel-schema/src/mcp-server.ts` + import-only `collab-electron` side; `collab-electron/mcp-config.json`) and six transcripts per attack (miss → red → restore green).

3. **G4’s “enumeration” is not bound to the served protocol surface.** Filtered helper lists defeat it. **Fix:** Require MCP client `tools/list` against the running server; paste raw list + length.

### Medium — load-bearing
4. **Deliverable 3 never names the action-exclusion mechanism.** Schema-driven + zero actions are jointly satisfiable only via an unnamed cut; builders will diverge. **Fix:** Specify e.g. “register only by iterating `schema.objects` (get/query/links); never `schema.actions`; do not read `golden/tools.json`.”

5. **Deliverable 1 “type-agnostic” + filters vs tool surface.** Disqualifiers incomplete; kernel filters vs generated `_query` inputs unresolved (SCOPES in, order half-in). **Fix:** Define derivation rule + filter semantics; either require `_query` inputSchema to expose declared properties or explicitly defer that to a later rung and stop calling MCP filters “real” here.

6. **Cited fact wrong: “no MCP server exists.”** peer-bus exists at the cited file. **Fix:** “No process serves the generated Kernel tool definitions.”

### Low — cosmetic
7. **Deliverable 4 is multi-outcome on purpose.** Fine as discretion; not “one meaning.” Promote to non-deliverable note if single meaning is required.

8. **Deliverable 0 mixes clause 1 allowlist language into a clause 2 fix.** Imprecise, not load-bearing if the three named generators are the clause-2 allowlist.

---

**G3, G5, G6 are sound** — each has a concrete break that turns them red; no finding manufactured there.

**Strongest “order contains one too” candidate:** G2’s DIFF procedure (finding 1). It is the doctrine phase-exit gate and, as written, cannot catch the failure mode it claims to police.
