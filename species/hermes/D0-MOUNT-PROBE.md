WO-008b Deliverable 0 — AgentOS mounts vs bundle probe
date: 2026-07-20
branch: wo-008b
repo git: host plumbing landed; Outcome A blocked (see FINAL)

=== Typed surface ===
AgentOs.create({ mounts: NativeMountConfig[] })
NativeMountConfig = {
  path: string,  // guest mount point
  plugin: createHostDirBackend({ hostPath, readOnly: true }),
  readOnly: true
}

=== CASE A: narrow marker mount ===
create options:
{
  "mounts": [{
    "path": "/mnt/wo008b-probe",
    "plugin": { "id": "host_dir", "config": {
      "hostPath": "/tmp/wo008b-mount-probe/host-narrow",
      "readOnly": true
    }},
    "readOnly": true
  }]
}
guest.exists(/mnt/wo008b-probe/MARKER.txt) = true
guest.exists(host homedir) = false
CASE A: YES — mount works, narrowly scoped

=== CASE B: same-path hermes-agent + uv cpython (not whole HOME) ===
mounts (paths only):
- host/guest: $HOME/.hermes/hermes-agent (RO)
- host/guest: $HOME/.local/share/uv/python/cpython-3.11.15-linux-x86_64-gnu (RO)
- guest symlink path cpython-3.11-linux-x86_64-gnu → same real host dir (RO)
guest.exists(HERMES_BIN) = true
guest.exists(~/.hermes/auth.json) = false
CASE B visibility: YES

=== CASE C: guest stdin ===
process.stdin is Object with on/read — NO .pipe()
shim fixed to bridge via on("data")/write

=== CASE D: guest execution (blocks Outcome A) ===
After mounts + shim stdin fix, createSession reaches spawn(HERMES_BIN):
  ERR_AGENTOS_NODE_SYNC_RPC: refused to compile guest WebAssembly module
  … file is a shell-shim script (starts with "#!" …)

ELF python3.11 spawn probe:
  ERR_NATIVE_BINARY_NOT_SUPPORTED: refused to execute native ELF guest binary
  … only WebAssembly binaries …

Baseline without mounts: still Outcome B (HERMES_BIN not found) — mounts fixed visibility.

=== FINAL VERDICT ===
CHOSEN PATH: 1a authorized mount (works, narrowly scoped, auth.json not leaked).
UNBUILDABLE for Outcome A on AgentOS 0.2.7: guest child_process may only run
WebAssembly — Hermes is a host Python/ELF install. Bundle of the same native
binaries into the package tree hits the same exec wall (measured).

Evidence pointers:
- /tmp/wo008b-d0-mount-probe.txt (this file)
- /tmp/wo008b-d0-handshake.txt (earlier stdin.pipe failure → then WASM)
- species/hermes d0-smoke after mounts: UNKNOWN exit 3 (WASM refuse, not B)
