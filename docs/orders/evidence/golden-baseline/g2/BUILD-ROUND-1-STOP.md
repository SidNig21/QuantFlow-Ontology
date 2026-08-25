# G2 Builder Round 1 Stop

builder-task: 01a03735-9b13-79b2-be67-db6664b7b37b
build-base: 6f73e61f74dc5f438da90d92e3f1ed3a33586297
candidate: none
push: none
stopped-at: focused matrix item 2, bun qa/run.ts research-director-front-door
exit: 1

Observed receipt:

    front door heading mismatch: Research Dock

The product shell and failing gate were both unchanged from BUILD_BASE_SHA.
The accepted Pre-R18 order requires the visible title "Research Dock"; the gate
alone retained the superseded "Research Director" heading assertion.

The Builder stopped because the gate file was outside the Round 1 candidate
allowlist. Its completed allowlisted diff remains preserved in the one checkout.
No candidate commit was created.