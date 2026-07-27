## Plain summary

The order correctly puts the lock on the AI tool door — not inside the shared filing cabinet — so the founder’s “pick any file” button stays intact. That core ruling holds. Two holes remain in the order text itself: the fail-closed gate can go green while the tool is still callable, and the new “staging folder” setting still has no agreed name, which is the same class of underspecification that killed the previous attempt.

---

## Q1. Can each acceptance gate actually fail?

### G1 — hole closed
**What the gate claims:** served `qf_publish_artifact` rejects paths outside the root; zero new rows/events.

| Bait | Kills? | Cheat that still satisfies the literal gate |
|---|---|---|
| (a) absolute outside | Mostly | Use a canary whose resolved path does **not** share a string prefix with the root (e.g. `/tmp/canary-…`). Then `realpath` + naive `startsWith(root)` passes (a)–(d) while still accepting **prefix-sibling** escapes (`$ROOT` vs `$ROOT-evil/…`). Measured: `"/tmp/artifacts-evil/x".startsWith("/tmp/artifacts") === true`. |
| (b) `..` traversal | Yes for normalize-outside | Honest `path.resolve`/`realpath` needed; hard to fake past (b)+(c) together without a real resolve. |
| (c) symlink inside → outside | **Partially** | Kills **unresolved** string-prefix (symlink path still under root). Does **not** kill resolve-then-`startsWith` without a boundary (`root + '/'` / `relative()` / equal-or-child). Order text overclaims: “specifically to kill a string-prefix implementation.” |
| (d) remove check | Yes | Forces the check into shipping code if bait edits shipping code as required. |

**Additional G1 cheat:** implement a correct reject for (a)–(c) but only when `path` looks “suspicious” (contains `..` or is absolute outside), while still using unresolved prefix for “normal” absolute paths under root — (c) kills that. I could not construct a cheat that passes a well-built (c) **and** a separator-safe compare; I **could** construct one against the baits as written if (a)/(c) targets are `/etc/passwd`-style.

**Verdict:** G1 can go red. Bait (c) is necessary but not sufficient against every string-prefix cheat.

### G2 — inside-root publish
**Cheat:** special-case the gate’s fixture filename/hash while leaving the general check weak — unlikely if G1 runs on the same binary. Literal G2 alone does not force symlink-safe compare. Weak alone; coupled to G1 it’s mostly fine.

### G3 — fail closed — **High defect**
**Literal text checks:** unconfigured server → `qf_publish_artifact` **absent from `tools/list`**, action count 23; bait (a) default `/` or allow-all → red; bait (b) with root → 24.

**Passing cheat that violates what G3 claims to prove:**

Today `tools/list` is **not** driven by registration. Measured:

```10:17:tools/qf-read-tools/src/discovery.ts
export function installToolsListHandler(server: McpServer, schema: Schema): void {
  server.server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: servedToolsForSchema(schema).map((def) => ({
      name: def.name,
      description: def.description,
      inputSchema: def.inputSchema,
    })),
  }));
}
```

Handlers are registered separately in `registerActionTools` (`register.ts:126-145`).

**Cheat:** when root is missing, filter `qf_publish_artifact` out of the **list handler only**; leave `registerTool` in place. Then:
- `tools/list` → 23, tool absent → **G3 green**
- `callTool("qf_publish_artifact", { path: canary })` → still unconstrained → **hole open**

G3 never requires a failed `callTool`, never counts registrations, never re-runs G1’s canary on the unconfigured server. D1 says “not registered at all”; **no gate measures registration or callability in the unconfigured case.**

Bait (a) catches “default to `/` / allow-all” when that still **lists** the tool. It does not catch “omit from list, keep handler.”

### G4 — trusted callers untouched
**Cheat relative to claim:** leave `packages/qf-kernel` untouched; `agent-path` keeps calling `execute(..., path)` in-process → passes.  
**Order text error (not a cheat):** G4 says `dock-registry` also “publish[es] via `path` in-process.” Measured: `dock-registry/run.ts` calls `execute` for `register_agent_definition` (and similar), **never** `publish_artifact`. The gate can pass while proving nothing about publish.

### G5 — cold suite
Can fail for real (missing root in harnesses → `tool-plane` / `tool-discovery` / `action-transport` go red). Hard to “cheat” except by configuring a root (which D1 explicitly requires). Sound as a suite gate.

---

## Q2. Does each deliverable have exactly one meaning?

### D1 — artifact root required
**Second readings:**

1. **Env var has no name.** “An env var … matches `QF_KERNEL_DB`” does not spell `QF_ARTIFACT_ROOT` (or any name). Two builders can ship different names; every gate that “configures a root” must invent the same string. **This is the same defect class as the old “declared staging root” with no spelling.** Severity: **High**.

2. **Where it is read:** `server.ts` at startup vs inside `registerActionTools` vs passed as a parameter from `registerAllTools`. All satisfy the prose.

3. **“Absent”:** unset vs `""` vs whitespace — unspecified. One builder treats `""` as absent (fail closed); another treats it as configured empty and allow-alls.

4. **“Served action count drops by one”:** list count vs `registerActionTools` return length vs schema-derived count — can diverge (see Q1/G3).

Author’s collision note (configure root in existing gates; don’t weaken `expectedServedToolNames`) is **sound** and names `tool-plane` / `tool-discovery`. It does **not** name `action-transport`, which also starts `server.ts` via `makeClient()` with only `QF_KERNEL_DB` today — covered only by the vague “every existing gate.”

### D2 — the check
**Second readings of “resolved to a real absolute path”:**

| Case | Unspecified behavior |
|---|---|
| Symlinks | “Resolve, then compare” — good intent; compare method (`startsWith` vs boundary-safe) unspecified |
| Path does not exist | `realpath` → `ENOENT` (measured). Reject? Or fall through? |
| Root does not exist | Startup fail vs treat as absent vs create? |
| Root is itself a symlink | Resolve root too, or compare against configured string? |

Two competent builders can disagree on all four and both cite D2.

### D3 — nothing else moves
Mostly one meaning for the listed untouchables (`qf-kernel`, `resolveBytes`, app callsites, picker, peer-bus, kernel tests, `path` still advertised when served).

**Tension:** D1 requires editing every server-starting harness/gate env. That is authorized by D1’s collision paragraph, not by D3’s list — readable as intentional, but easy for a builder to under-edit (`action-transport`).

---

## Q3. Self-contradiction / contradiction with code?

### Context table — row by row

| Claim | Verdict | Measurement |
|---|---|---|
| `resolveBytes` reads any path (`create.ts:30-36`) | **Sound** | `readFileSync(input.path)` with no root check |
| GATE 1 type-checks `path` only (`execute.ts:122`; optional string) | **Sound** | `strict().parse` at 122; `path: z.string().optional()` in `research.ts:515-520` |
| Arbitrary absolute path accepted (canary) | **Sound** | Inherited from WO-105/106 evidence; mechanism still present |
| 24 served actions include `qf_publish_artifact` | **Sound** | 25 actions, 1 `operatorOnly` (`observe_ticket`), 24 served; `servedToolsForSchema` length 93 |
| App publishes via `path`, never `bytes` | **Sound** | `agent-host.ts:639`, `a2a-bus.ts:68` — both `path` |
| Founder picker arbitrary path | **Sound** | `renderer.js:955-967` `openFileDialog` → `path: filePath` |
| `bytes` producers: peer-bus + kernel.test (9 sites) | **Mostly sound / Low wrong** | peer-bus `bus.ts:116-125` uses `bytes`. Kernel tests: **11** `execute(..., "publish_artifact", …)` invocations pass `bytes` (9 object-literal blocks + 2 via `input`); “9 sites” undercounts |
| Further in-process `path` callers: agent-path, hermes smoke | **Sound** | `agent-path/run.ts:197-202`; `a2a-4tile-smoke.ts:274-276` |
| Schema says MCP must use `path` | **Sound** | field description at `research.ts:518-519` |
| Serving registration: `registerActionTools` | **Sound but incomplete** | Registration yes; **advertisement** is `discovery.ts` / `servedToolsForSchema` — second path |
| 19 gates | **Sound** | `bun qa/run.ts --list` → 19 |

### Ruling’s four caller classes
The four **trust-boundary** classes are as described for the security argument. Full repo sweep of `publish_artifact` **call** sites also finds:
- `qa/gates/agent-path/run.ts` (path) — listed in the facts table, not the RULING table
- `species/hermes/a2a-4tile-smoke.ts` (path) — same
- `tools/qf-peer-bus` (bytes) — correctly scoped out
- `packages/qf-kernel/src/kernel.test.ts` (bytes)

No additional MCP registration door beyond `tools/qf-read-tools`. The threat framing holds; the RULING’s “exactly one door: `registerActionTools`” **does not** hold for fail-closed **list** behavior.

### D3 vs D1/D2
No collision with leaving the Kernel alone. Collision with **list vs register** and with **gate env wiring** is real but partly anticipated for `tool-plane` / `tool-discovery`.

### Fail-closed vs gates expecting 24 — the WO-106 shape
**Author already found this.** D1 explicitly: naive fail-closed → served 92 vs gates expecting 93; resolution = configure a root in those gates, don’t weaken `expectedServedToolNames`. G3 owns the unconfigured case. **That half is sound.**

**Remaining same-shape defect:** G3 requires list count 23 without measuring that the tool is unregistered/uncallable, while production list and register are **independent code paths**. That is “gate asserts property A; security claim is property B.”

G4’s dock-registry parenthetical is factually wrong (Medium).

---

## Findings by severity

### High
1. **G3 does not prove fail-closed on the attack surface.** List-filter-only cheat leaves `callTool` live. Order never requires an unconfigured-server canary via `callTool`, and never names `discovery.ts` even though G3 is a `tools/list` assertion.
2. **Artifact root still has no spelling (env var name).** Same underspecification class as WO-106 D6’s “declared staging root.” D1’s “every gate configures a root” cannot be executed unambiguously.
3. **Ruling overclaims “exactly one door.”** Untrusted writes go through `registerActionTools`; untrusted **discovery** goes through `installToolsListHandler`. Fail-closed must bind both, or G3 and D1 diverge.

### Medium
4. **G1 bait (c) overclaims.** Kills unresolved prefix; does not kill resolve + naive `startsWith` (prefix-sibling). Measured sibling case accepts under that compare.
5. **D2 “resolved … inside the root” underspecified** for missing files, missing root, and compare semantics.
6. **G4 claims `dock-registry` publishes via `path` — false.** Gate does not exercise `publish_artifact`.

### Low
7. **`kernel.test.ts` “9 sites”** undercounts bytes-backed `publish_artifact` executes (~11).
8. **`action-transport`** also boots the server; named only implicitly under “every gate.”

---

## What is sound (do not churn)

- Constraint at the MCP serving boundary, not Kernel — correct ruling given the founder picker and in-process app paths.
- `bytes` left alone — correctly measured; not agent-reachable over JSON.
- App uses `path`; original D6 `bytes` premise was wrong — this order does not repeat that.
- Explicit handling of `tool-plane` / `tool-discovery` vs fail-closed — avoids the generated-set-vs-runtime self-contradiction that WO-106’s unread D6 would have hit.
- Extra in-process `path` callers documented as a second reason against Kernel-wide rejection.
- G1 (a)(b)(d), G2, G3 bait (b) (two configurations), G5 — directionally real gates.
- Threat residual (rogue second server / debt #22) honestly scoped out.
