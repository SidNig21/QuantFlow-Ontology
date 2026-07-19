# Law D demo — Artifact survives kill + relaunch

This is the founder’s hands-on script for WO-006b. Domain truth lives in
`kernel.db`; the canvas JSON only stores layout + an `artifactId` reference.

## Steps

1. From the repo, start the app in dev:
   ```bash
   cd collab-electron && bun run dev
   ```
2. Wait for the main-process log line:
   `kernel: opened <path>, artifacts=<n>`
   Note `n` (often `0` on a fresh worktree).
3. In the app menu: **File → Publish Artifact…**
4. Choose any small file (e.g. `README.md` at the repo root).
5. Confirm:
   - an Artifact tile appears showing `id`, `kind`, `content_hash`, `storage_ref`, `created_at`
   - main/shell log includes `publish_artifact {"id":"…","hash":"…"}` (id equals hash)
6. **Force-kill** the app (do not use a clean Quit — e.g. close the window
   manager kill, or `kill -9` the Electron PID).
7. Relaunch (`cd collab-electron && bun run dev`).
8. Confirm:
   - boot line shows `artifacts=<n+1>` (or the same count if you republished identical bytes)
   - the Artifact tile is still on the canvas
   - DevTools on the tile logs `qf:artifacts:list […]` with the same metadata

## Receipt (event row)

From the **repo root**, after at least one publish (replace `KERNEL_DB` with the
path from the `kernel: opened` log — in dev it is under
`~/.collaborator/dev/worktree-<hash>/kernel.db`):

```bash
bun -e '
import { Database } from "bun:sqlite";
const db = new Database(process.env.KERNEL_DB ?? `${process.env.HOME}/.collaborator/dev/` +
  require("fs").readdirSync(`${process.env.HOME}/.collaborator/dev`).find(d => d.startsWith("worktree-")) +
  "/kernel.db");
const row = db.query(`SELECT * FROM events WHERE type = ? ORDER BY created_at DESC LIMIT 1`)
  .get("artifact.published");
console.log(JSON.stringify(row, null, 2));
'
```

Or, if you already know the path:

```bash
KERNEL_DB="$HOME/.collaborator/dev/worktree-XXXXXXXXXXXX/kernel.db" bun -e '
import { Database } from "bun:sqlite";
const db = new Database(process.env.KERNEL_DB);
console.log(JSON.stringify(
  db.query(`SELECT * FROM events WHERE type = ? ORDER BY created_at DESC LIMIT 1`)
    .get("artifact.published"),
  null,
  2,
));
'
```

You should see one `artifact.published` row whose `object_id` matches the tile’s id.
