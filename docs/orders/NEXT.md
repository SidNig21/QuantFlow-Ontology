# NEXT — the current order (rotated 2026-07-29 after WO-K3 PASS)

> **Builder: this file is your complete entry point.** It always points at the single order that is
> currently unblocked. Do not choose your own order; do not proceed past this one.
> **Founder:** feed this same file to every fresh builder window: *"Follow `docs/orders/NEXT.md`."*

## Current order: **[WO-CI2](WO-CI2.md) — the shipped app contains its required runtime files**

**Read the order top to bottom before touching anything.** This is an off-ladder release repair
required before product renaming or Dock profile/runtime unification.

Branch from the verified WO-K3 merge on `main`. Use Cursor CLI with **Composer 2.5 only** in an
isolated worktree. The builder reports evidence and stops; it does not merge or self-verify.

**In plain terms:** the source app builds, but the Linux package currently leaves out the agent
runtime files used by its Dock paths, and the release check never notices. Package the actual app
and make missing or stale runtime bytes turn the release check red.

## Build priority

1. Add the credential-free unsigned Linux directory-package stage exactly as ordered.
2. Prepare and stage the existing qf-toolloop and Hermes packs deterministically from frozen nested
   installs; preserve the existing runtime references.
3. Make packaged resolution use `process.resourcesPath`; keep development resolution at repo root.
4. Move the two vendored tmux FileSets unchanged to macOS-only resources and preflight every active
   Linux FileSet before Builder runs.
5. Inspect only the finished package with the production resolver, a run-bound receipt, and the
   same-process Builder log. Show every required bait red, restore, then green.

## What this order does not claim

WO-CI2 proves package closure, not a live Hermes turn. A fresh packaged Kernel still lacks the
founder-defined Hermes-backed profiles, and the app still carries a separate hardcoded Peer Seats
path. The next architect order will unify profile identity, runtime adapters, and the Dock Catalog
after this package proof is honest.

## Hard boundaries

- Never place, execute, or automate a real bet or trade; never handle credentials.
- No AppImage, signing, publishing, release upload, product rename, schema redesign, peer-bus fix,
  MCP v2 migration, live ingest, or new runtime dependency.
- Do not delete operator data, shared dependencies, preserved Kernels, or profile homes.
- Do not broaden resource copying to whole source trees, credentials, profiles, or operator data.

## Behind WO-CI2

Do not promote WO-N1 merely because WO-K3 closed. The architect first cuts the measured
Dock profile/runtime unification order: multiple Kernel definitions may share Hermes or use another
CLI adapter, every session links to its exact profile, and adding a profile requires no Dock edit.
The stale peer-bus delivery cache remains a separately measured blocker before unscripted WO-109
collaboration.

---

*The order log in [`README.md`](README.md) wins on status. The verifier rotates this file atomically
with the merge, verification record, roadmap/log updates, and verifier-door check.*
