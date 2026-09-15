# W1-03 acceptance — live UFC research, independent criticism, and one Canvas

status: ACCEPTED
candidate: `665ddcd2783a9e218cb5095b51943d026d17f70a`
tree: `727f5ee6329ecb7b5cdf745b3f2a1f3da97ded1f`
date: 2026-09-14
branch: `codex/wo-w1-03-one-canvas`

## Founder-readable result

Ryan can open a live UFC market in the packaged Windows app, ask a specific question, let a real
Researcher analyze exact current and historical evidence, receive an independent Critic's review and
an honest decision, then close and later retrieve the same work. QuantFlow records the work in the
Ontology, displays it on one Canvas, and leaves no hidden participant or app processes after closing.

## Independent acceptance

A separate `gpt-5.6-sol` verifier checked the immutable candidate and returned semantic **YES** and
verification **YES**. The decisive command reused the exact packaged candidate:

```text
bun qa/run.ts wave1-critic-decision
wave1-critic-decision PASS: real separate worker/Critic, exact source lineage, rendered Decision, reopen, zero cleanup
PASS wave1-critic-decision
```

The live case used Bovada event `30189205`, Giga Chikadze versus Joanderson Brito. The question was
whether Joanderson Brito wins by submission. QuantFlow reached an `INCONCLUSIVE / WATCH` decision:
the official evidence supports Brito as a credible submission threat, but the requested submission
selection was not offered and no validated matchup-specific probability was available.

The real product path proved:

- a current Bovada Quote and two hash-bound official UFC sources;
- one assigned Researcher Task completed with a hash-valid Artifact and the complete exact read lineage;
- a different Critic completed the frozen Hypothesis, Run, and Artifact reads and wrote one Evaluation;
- the Evaluation gated the current Report and the decision rendered on the Canvas;
- normal close, clean Director-only reopen, deliberate retrieval, and second close;
- both participants closed, zero live sessions on reopen, zero remaining QuantFlow processes, and no
  disposable proof root.

Package `app.asar` SHA-256:
`63da2a978b0fbb89d2f7aa48f99dbe5a6cad2cdbf72dc962e1d2529c5275fad6`.

The literal founder Desktop shortcut resolved to this checkout's packaged executable, used the correct
working directory, and carried build description `@ 665ddcd2`.

## Evidence

- [Live acceptance receipt](live-decision.json)
- [Rendered decision](decision.png)
- [Saved-work continuation receipt](saved-resume.json)
- [Saved-work rendered decision](saved-resume-decision.png)
- [Earlier live handoff failure](live-decision-red.json)
- [Earlier live handoff screenshot](live-decision-red.png)

## Accepted boundary

This closes Wave 1's useful UFC research loop and its four-pillar connection for that workflow. It does
not claim Codex admission, cross-runtime questions and answers, interactive analytical manipulation,
Claude admission, outcome tracking, calibration, another sport, or trade execution. Those remain later
roadmap work.
