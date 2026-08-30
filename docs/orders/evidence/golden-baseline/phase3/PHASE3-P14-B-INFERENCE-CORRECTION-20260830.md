# Phase 3 P14-B production-inference correction — 2026-08-30

The earlier run launched the real packaged Director successfully, but it did not prove that a production model performed the turn; P14-B is therefore RED until one bounded gate proves the complete inference chain.

status: **READER YES / YES / BUILDER OPEN ONLY FOR `hermes-production-inference` / P14-B RED**

## Immutable prior evidence and corrected classification

The existing [`PHASE3-CONTINUATION-BUILDER-RECEIPT-20260830.md`](PHASE3-CONTINUATION-BUILDER-RECEIPT-20260830.md) is preserved byte-for-byte at blob `ca2ea021b0ed34a8764fecb76df4c3f6591a7b71`. Its valid observations remain valid:

- packaged Windows app launch of production definition `hermes-research-director` with runtime profile `default`;
- Kernel AgentSession `4fa6df80-922d-49f2-92bb-f0f2ae10ce5c`, PTY/guest identity `2f1cc599507b1847`, exactly one `spawned_from` link, and created→started lifecycle;
- external run-owned transcript of 8,695 bytes with SHA-256 `3387A40908ACF48956AAE5FF49E8BF6AB117A97495AED12F01D1471DA42DB595` containing `QF_PHASE3_REAL_TURN_OK`;
- accepted shutdown, app exit `0`, and the receipt's recorded cleanup facts.

Those facts prove launch and transcript production only. The receipt recorded `provider-model-identity-unprovable`, exposed no trusted API-call row, and did not expose `provider_request_id`. Its heading “P14-B — real packaged Director GREEN” is superseded by this classification:

**LAUNCH-ONLY / INFERENCE UNPROVEN / P14-B RED**

No byte of the old receipt is rewritten. `provider_request_id` remains useful future telemetry debt, but current trusted runtime logging does not expose it and this order does not require it.

## Exact bounded Builder surface

Only these changes are authorized:

1. add `qa/gates/hermes-production-inference.ts`;
2. add `qa/gates/hermes-production-inference.test.ts`;
3. register exactly `hermes-production-inference` in `qa/run.ts`;
4. make mechanically required Phase-3 gate-classification, claim/surface, starting-matrix, and Windows-traversal rows agree with that registration;
5. write one run-owned evidence receipt; and
6. run Atlas generation and commit generated Atlas outputs only if the registration changes them.

No product, Kernel, schema, Hermes runtime, provider/model configuration, packaging, credential, existing gate, candidate/Golden, P18, R18, `main`, remote, bet, or trade change is authorized.

## Exact fresh-pass contract

One fresh isolated run must prove all of the following as a single bound chain:

1. Launch the packaged Windows app and visibly spawn the production `hermes-research-director` definition with runtime profile `default` from the Dock.
2. Use a newly empty run-owned Hermes root and log. Pre-existing or shared logs, sessions, rows, roots, and profiles cannot count.
3. Generate one run nonce, send exactly one prompt containing it through the real Director tile, and observe the exact nonce response in that tile's external transcript.
4. Read exactly one fresh trusted successful API row from the isolated Hermes log. It must bind to the same run/session/turn and report provider `opencode-go`, the exact configured Kimi K3 model identity, nonzero input and output token counts, positive latency, and call ordinal `1`.
5. Read exactly one fresh successful `Turn ended` row bound to the same session/turn, with `api_calls=1`.
6. Read exact Kernel truth for the production AgentDefinition, the same AgentSession, exactly one `spawned_from` Session→Definition link, and its launch lifecycle.
7. Prove no synthetic mode, fallback, or retry path occurred; emit no credential or credential-bearing environment/config/log content.
8. Shut down normally with app exit `0`, `processes=0`, `roots_remaining=0`, and `leaked=[]`.

The run-owned receipt records safe identities, row counts, provider/model labels, token counts, latency, hashes, Kernel IDs/lifecycle, exit, and cleanup. It must not copy prompt bodies beyond the nonce assertion, raw provider payloads, headers, environment values, credentials, or secrets. Model self-report and terminal prose are never trusted provider/model authority.

## Mandatory adversarial falsifiers

The focused test and independent Verifier must each make every case RED:

- synthetic definition, environment, responder, or transcript substituted for production;
- fallback provider/model or any fallback marker;
- retry or API call ordinal other than exactly `1`;
- stale or preseeded API/Turn rows from outside the fresh root/log;
- zero API rows, duplicate API rows, zero Turn rows, or duplicate Turn rows;
- provider other than exact `opencode-go`, or model other than the exact configured Kimi K3 identity;
- zero/missing input tokens, zero/missing output tokens, or nonpositive/missing latency;
- API row and Turn row bound to different session/turn identities, or `api_calls` other than `1`;
- missing/wrong nonce prompt or response, a second prompt, or response visible only in an unrelated transcript;
- missing/wrong Kernel definition, session, `spawned_from` link, or lifecycle;
- credential-shaped output, logged environment/config value, raw payload/header, or any secret exposure;
- nonzero app exit, owned process residue, owned root residue, or leaked resource.

Absence of `provider_request_id` must not RED this gate. Claiming that it was observed when it was not exposed must RED as fabricated telemetry.

## Stop and closure

One final fresh live proof is permitted. Any contract failure is an exact P14-B RED receipt and stops this unit; it does not authorize product repair, retry, fallback, a second inference chase, or weakened evidence. P18, candidate freeze, independent Golden verification, and Golden designation remain closed until P01–P17 are all green. R18 remains separately frozen.

## Judgment

The correction distinguishes process launch from model inference. The prior run remains valuable launch evidence, while trusted isolated API and Turn rows become the missing inference authority. Because the runtime does not expose `provider_request_id`, treating it as future telemetry debt preserves an honest gate without fabricating a field or blocking the present proof on nonexistent instrumentation.
