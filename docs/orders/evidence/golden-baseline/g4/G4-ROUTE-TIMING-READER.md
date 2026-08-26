# G4 route-timing semantic adjudication

- Reader task: `01a03f1a-b4d5-7b82-a58a-0e90965d8873`
- Authority SHA: `dd1dcb7ef50248e46f4de5acb543ef7e7753a981`
- Decision: **Contract A required**
- Mutation: none

Arbitrary non-empty route strings remain untrusted metadata through parsing and resolution. Runtime support is decided only by the post-resolution dispatcher.

This does not expand supported compatibility. Only `native_tui` and `host_acp` may dispatch. Retired `agentos` and arbitrary unknown routes must both produce the exact `UnsupportedRuntimeRouteError` before Kernel, runtime, process, package-link, PTY, ACP, Task, Artifact, or event mutation.

Contract B—rejecting unknown routes in the parser—would bypass the accepted dispatcher and create two refusal meanings/classes.

The fail-capable proof is `bun qa/run.ts golden-g4-retired-route`, exercising parse → resolve → dispatch for `native_tui`, `host_acp`, `agentos`, and an arbitrary unknown route. Parser rejection, fallback, incorrect callback selection, or pre-dispatch mutation makes the gate red.
