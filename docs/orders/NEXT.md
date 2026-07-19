# NEXT — the current order (updated only by the verifier)

> **Builder: this file is your complete entry point.** It always points at the single order that is currently unblocked. Do not choose your own order; do not proceed past this one.
> **Founder: feed this same file to every fresh builder window.** One line is enough: *"Follow the instructions in `docs/orders/NEXT.md`."*

## Current order: **none — WO-006b is being drafted by the verifier**

WO-006a merged 2026-07-18 (three rounds; see its verification records). Nothing is unblocked for a builder right now.

**WO-006b** is next: one agent path end-to-end — spawn from canvas, stream into a tile, publish one Artifact through the Kernel — with **Law D as the acceptance path**: create an Artifact, kill and relaunch the app, and the tile shows the same Artifact served from the Kernel. A demo passing on in-memory tile state fails the order. It is the v0.1 phase gate, and the first order the founder verifies hands-on.

The verifier is measuring the app side (canvas, dock, Electron seams) before writing it — the defect class this workshop keeps paying for is orders written against imagined code. When the order lands, this file will point at it.

## Builder rules (standing)

**Never run `bun qa/run.ts --all`, never delete `node_modules`.** The cold run belongs to the verifier.

---

*Rotation rule: when the verifier passes the current order, the same verification commit flips the log status in `README.md` and rewrites this file to the next unblocked rung. If this file and the order log disagree, the log wins — report the discrepancy instead of building.*
