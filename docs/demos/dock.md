# Dock demo — one definition-driven agent catalogue

Founder hands-on script for WO-D2. The Dock lists `agent_definition` rows and launches the exact
definition clicked; qf-toolloop and all Hermes profiles use this one path. Nothing is remembered in
the renderer, and there is no second Peer Seats catalogue.

## Steps

1. Build both packaged adapters once, then start the app in dev:
   ```bash
   cd tools/runtime-proof && bun install --frozen-lockfile && bun run pack-agent
   cd ../../species/hermes && bun install --frozen-lockfile && bun run pack-agent
   cd ../../collab-electron
   env -u ELECTRON_RUN_AS_NODE bun run dev
   ```
2. Wait for boot lines:
   - `kernel: opened …`
   - `agent-host: Dock bootstrap registered=… skipped=… conflicts=…`
   - dock invalidate / host ready
3. With a fresh Kernel, confirm the **Agent dock** shows exactly `qf-toolloop`,
   `hermes-orchestrator`, `hermes-worker`, and `hermes-worker-2`. On an existing founder Kernel,
   additional historical definitions remain visible and a differing same-id row is preserved and
   reported as a bootstrap conflict.
4. Spawn `hermes-orchestrator`, then `hermes-worker`. Confirm each opens a term tile and the host
   log names the exact definition and argv:
   - `hermes-orchestrator` → `["-p","qf-orchestrator","--tui"]`
   - `hermes-worker` → `["-p","qf-worker","--tui"]`
5. Confirm for each launch:
   - a session row appears with a state chip walking the transition table (`starting` → `running` → …)
   - a Session tile appears on the canvas (cube fades as tiles exist)
   - the session has one `spawned_from` link to the exact Dock definition clicked
   - **Cancel** appears only while `running`/`blocked`; `starting` shows the chip only
6. Cancel a live session from the dock; chip reaches a terminal state; **Close** appears on
   `cancelled`/`failed` and removes the actionable edge.
7. Spawn again, then **force-kill** mid-run (`kill -9` the Electron PID — not Quit).
8. Relaunch. Confirm the Dock rebuilds definitions and sessions from `~/.quantflow/kernel.db` alone;
   the interrupted session is terminal (`failed`/`cancelled` per policy), never phantom `running`.

## Receipt

From the repo root:

```bash
KERNEL_DB="$HOME/.quantflow/kernel.db" bun -e '
import { Database } from "bun:sqlite";
const db = new Database(process.env.KERNEL_DB);
const definitions = db.query(
  `SELECT id, role, package_ref, runtime_profile FROM agent_definition ORDER BY id`
).all();
const lineage = db.query(
  `SELECT l.from_id AS session_id, l.to_id AS definition_id
   FROM links l WHERE l.kind = "spawned_from" ORDER BY l.created_at DESC LIMIT 20`
).all();
console.log(JSON.stringify({ definitions, lineage }, null, 2));
'
```

The definition rows plus exact session-to-definition links are the receipt. The packaged manifests
only initialize missing defaults; after bootstrap the Dock and launcher read the Kernel.

Real Hermes turns require the founder's local profiles and credentials. This demo does not prove
caller-bound tool grants or an unscripted model collaboration; D2's credential-free gate proves
definition selection, argv, lineage, cleanup, and peer-role admission.
