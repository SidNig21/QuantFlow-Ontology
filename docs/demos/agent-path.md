# Agent path demo — spawn → stream → tool → Artifact → lifecycle

Founder hands-on script for WO-006c. Domain truth (sessions + artifacts) lives
in `kernel.db`. Chunk streams are ephemeral (Law C).

## Steps

1. From the repo, start the app in dev:
   ```bash
   cd collab-electron && bun run pack-agent   # once, if .aospkg missing
   env -u ELECTRON_RUN_AS_NODE bun run dev
   ```
2. Wait for:
   - `kernel: opened …`
   - `agent-host: reconcile closed N stale session(s)`
   - `agent-host: smoke ok session=<id> guestMinted=<id> chunks=<n>`
     (guestMinted must equal session — ID adoption)
3. **File → Spawn Agent Session** (species `qf-toolloop`).
4. Confirm:
   - a Session tile appears with short id, species, live status from Kernel
   - stream text + a tool call (`echo_upper`) appear live
   - on completion an Artifact tile appears (same `publish_artifact` door as the menu)
5. Spawn a second session; **Cancel** one from its tile. The other completes and publishes.
6. **Force-kill** mid-run (`kill -9` the Electron PID — not Quit).
7. Relaunch. Confirm the interrupted session is `failed`/`closed` (never `running`).
   Prior artifacts remain.

## Receipt

From the repo root (replace `KERNEL_DB` with the boot-line path):

```bash
KERNEL_DB="$HOME/.collaborator/dev/worktree-XXXXXXXXXXXX/kernel.db" bun -e '
import { Database } from "bun:sqlite";
const db = new Database(process.env.KERNEL_DB);
const rows = db.query(
  `SELECT type, object_id, trace_id, created_at FROM events
   WHERE type LIKE "agent_session.%" OR type = "artifact.published"
   ORDER BY created_at DESC LIMIT 20`
).all();
console.log(JSON.stringify(rows, null, 2));
'
```

Shared `trace_id` across `agent_session.*` and `artifact.published` is the receipt.
