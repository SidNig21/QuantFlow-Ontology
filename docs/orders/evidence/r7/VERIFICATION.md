# R7 VERIFICATION — ACP fs confinement

**In plain terms.** Legacy chat file access cannot wander outside a declared folder, and with no folder set it is not offered at all.

## What was proven

1. `QF_ACP_FS_ROOT` unset ⇒ fs not advertised; calls refuse.
2. Confinement via `relative()` + `realpathSync.native` (`acp-fs-root.ts`).
3. Escapes refused: absolute outside, `..`, prefix sibling, UNC-ish, missing/empty root.
4. Permission path remains deny-without-human (`denyPermissionResponse`).

Gate: `acp-fs-confine` + unit `acp-fs-root.test.ts`.

## What was not proven

- Symlink-out on every Windows host (junction covered when available).
- Full retirement of legacy ACP chat (confined, not deleted).
