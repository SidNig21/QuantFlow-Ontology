# ADR-0001 — Windows-first product with optional WSL CLI adapters

status: accepted
date: 2026-08-03
decision-maker: founder

## Context

QuantFlow is a native Windows product. The founder develops, installs, operates, and accepts the
application on Windows 11. Some third-party agent CLIs are easiest to run through WSL, but an
adapter's runtime must not become the application's boot authority or credential owner.

Hermes v1 currently runs in Ubuntu under WSL and reaches QuantFlow through Windows-owned PTY, IPC,
Kernel, and launch-scoped MCP boundaries. Hermes, Ubuntu, WSL2, and Hermes authentication are
operator-owned prerequisites; QuantFlow does not install, copy, rewrite, display, or package their
credentials.

## Decision

1. Native Windows 11 is the canonical QuantFlow development, packaging, runtime, and acceptance
   platform.
2. Hermes v1 is an optional WSL-backed CLI adapter. It requires WSL2, Ubuntu, Hermes, and
   user-owned authentication.
3. Missing or unauthenticated Hermes prerequisites never block QuantFlow boot, Kernel readiness,
   canvas readiness, or visibility of the Dock.
4. The Dock reports an unavailable Hermes adapter with clear, actionable diagnostics.
5. QuantFlow owns Dock identity, session lifecycle, PTY admission, collaboration MCP, durable
   Kernel truth, and canvas projection. Hermes owns only its CLI/TUI process and private
   authentication state.
6. Adapter configuration is launch-scoped. QuantFlow never mutates the founder's global Hermes
   configuration.
7. Future native-Windows or non-Hermes adapters use the same governed Dock, Kernel, MCP, and canvas
   contracts. They do not create private collaboration paths.

## Consequences

- A Windows installer can ship QuantFlow without bundling WSL, Ubuntu, Hermes, or credentials.
- QuantFlow remains usable when Hermes is unavailable; only that Dock adapter is unavailable.
- Installed-app acceptance must exercise the real Windows executable and, when proving Hermes,
  the explicit WSL boundary.
- Release evidence must distinguish native Windows product behavior from adapter prerequisite
  diagnostics and from secondary-platform compatibility.
