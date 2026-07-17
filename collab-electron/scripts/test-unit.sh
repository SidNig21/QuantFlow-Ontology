#!/usr/bin/env bash
# Bare-environment unit suite: every test that must pass with no Electron,
# no display, and no privileged runtime. This is what CI runs on every push.
#
# Excluded (documented, not forgotten — each gets an integration lane later):
#   src/main/sidecar/**            node-only (node-pty needs node's libuv; run via `npx tsx --test`)
#   src/main/tmux.test.ts          spawns the PTY sidecar, requires the Electron runtime
#   src/windows/shell/src/canvas-viewport.test.ts   requires a DOM
#   src/windows/shell/src/panel-manager.test.ts     requires a DOM
#   src/windows/shell/src/tile-renderer.test.ts     requires a DOM
set -euo pipefail
cd "$(dirname "$0")/.."

# bun's mock.module() leaks across files sharing a process, shadowing real
# modules for whoever runs next (isImageFile and electron.powerMonitor both
# break ONLY in combined runs). So: every mock.module()-using file runs in
# its OWN process; everything else shares one per tree.
MOCKY=(
  src/main/files.test.ts
  src/main/integrations.test.ts
  src/main/updater/update-manager.test.ts
)

EXCLUDES=( ! -path '*/sidecar/*'
  ! -name 'tmux.test.ts'
  ! -name 'canvas-viewport.test.ts'
  ! -name 'panel-manager.test.ts'
  ! -name 'tile-renderer.test.ts' )
for f in "${MOCKY[@]}"; do EXCLUDES+=( ! -path "*/${f#src/}" ); done

PKG_FILES=$(find packages cli -name '*.test.ts' "${EXCLUDES[@]}" 2>/dev/null)
SRC_FILES=$(find src -name '*.test.ts' "${EXCLUDES[@]}" 2>/dev/null)

bun test $PKG_FILES
bun test $SRC_FILES
for f in "${MOCKY[@]}"; do bun test "$f"; done
