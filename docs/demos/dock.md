# Dock demo — species registry as a surface

Founder hands-on script for WO-007. The dock rail lists species from
`agent_definition` and sessions from `agent_session`. Nothing is remembered in
the renderer — Kernel IPC only. The flow-cube watermark is the canvas empty-state.

## Steps

1. From the repo, start the app in dev:
   ```bash
   cd collab-electron && bun run pack-agent   # once, if .aospkg missing
   env -u ELECTRON_RUN_AS_NODE bun run dev
   ```
2. Wait for boot lines:
   - `kernel: opened …`
   - `agent-host: seedBootSpecies` / register path (idempotent — row count stays 1 across relaunch)
   - dock invalidate / host ready
3. Confirm the **Agent dock** (right rail) shows the ToolLoop species from the Kernel
   (name + role from the row — not a hardcoded renderer list). Canvas empty → flow-cube bold.
4. **Spawn** from the dock. Confirm:
   - a session row appears with a state chip walking the transition table (`starting` → `running` → …)
   - a Session tile appears on the canvas (cube fades as tiles exist)
   - **Cancel** appears only while `running`/`blocked`; `starting` shows the chip only
5. Cancel the live session from the dock; chip reaches a terminal state; **Close** appears on
   `cancelled`/`failed` and removes the actionable edge.
6. Spawn again, then **force-kill** mid-run (`kill -9` the Electron PID — not Quit).
7. Relaunch. Confirm the dock rebuilds species + sessions from `kernel.db` alone;
   the interrupted session is terminal (`failed`/`cancelled` per policy), never phantom `running`.

## Receipt

From the repo root (replace `KERNEL_DB` with the boot-line path):

```bash
KERNEL_DB="$HOME/.collaborator/dev/worktree-XXXXXXXXXXXX/kernel.db" bun -e '
import { Database } from "bun:sqlite";
const db = new Database(process.env.KERNEL_DB);
const rows = db.query(
  `SELECT type, object_id, trace_id, created_at FROM events
   WHERE type = "agent_definition.registered"
      OR type LIKE "agent_session.%"
   ORDER BY created_at DESC LIMIT 30`
).all();
console.log(JSON.stringify(rows, null, 2));
'
```

`agent_definition.registered` plus the session lifecycle events on the same ledger are the receipt.
