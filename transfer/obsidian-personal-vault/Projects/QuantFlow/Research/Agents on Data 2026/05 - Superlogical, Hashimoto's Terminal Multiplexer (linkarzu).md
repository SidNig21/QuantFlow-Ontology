---
tags: [quantflow, research, terminal, multiplexer, positioning, category, dock-doctrine]
source: https://www.youtube.com/watch?v=i143GJGY89o
speaker: linkarzu (livestream reaction) — subject: Mitchell Hashimoto, Superlogical
event: livestream, 2026-07-30 · announcement dated 2026-07-28
duration: "28:33"
watched: 2026-07-30
---

# Superlogical — Hashimoto's new terminal multiplexer

Watched via `/watch` (captions + 26 scene frames). Format is a livestream reaction, so the *commentary* is loose; the substance is the Superlogical manifesto read on screen. This note captures the announcement, not the stream.

**Filed here because it is the closest thing to a category collision QuantFlow has had** — and, read carefully, it is the opposite of one. See §Category at the end; that section is the reason this note exists.

## What was announced

Mitchell Hashimoto — creator of **Ghostty**, founder of HashiCorp (Terraform, Vagrant) — has started **Superlogical**. From his post (20:55):

> *"I talk about this in my personal post… tldr; it's in a **non-profit with strong governance and remains independent**."*

![[aod05-superlogical-t2055.jpg]]

Ghostty continues independently — a reply in-thread confirms it, and Hashimoto doesn't contradict it.

## The manifesto — verbatim from the site (19:37)

![[aod05-superlogical-t1937.jpg]]

> *"…work, and production work would share one well-crafted underlying system instead of living in separate tools.*
>
> *We'll begin with a **terminal multiplexer**. It keeps multiple terminal blocks organized inside a long-lived session, so you can close the application, reconnect from another device, and pick up exactly where you left off.*
>
> *If you're already familiar with terminal multiplexers, you'll feel right at home, but we're bringing a more modern touch. Sessions can be accessed through **the web and native macOS/iOS applications**, and **sharing a live session with other people is built in from the start**. We're also addressing the most common papercuts of existing tools, such as making scrollback, selection, and scrolling all work natively.*
>
> ***"A terminal multiplexer may sound like a narrow place to start a company. Our vision is much larger, but terminals connect developers, agents, tools, and infrastructure so it is the right foundation for everything that follows."*** *We will build a high-quality terminal multiplexer that remains excellent at that job, even as it grows to become the second and third parts of the plan."*

## The dissenting view, same video

![[aod05-superlogical-t0017.jpg]]

The stream opens on a clip of **Kovid Goyal** (creator of Kitty terminal): *"multiplexers as a whole, I think are a bad idea."* Kitty's position has always been that multiplexing belongs in the terminal, not layered above it. Worth holding alongside the announcement — the category itself is contested by serious people.

![[aod05-superlogical-t1757.jpg]]

## Substrate triage (START_HERE §5.8)

Running the standing rule on this, since that's what it's for:

- **Dock item?** No. It has no CLI that spawns as a seat and acts on the Kernel.
- **Underlayer?** **Yes.** It wants to run beneath everything — QuantFlow would depend on it.
- **Verdict: log it, do not evaluate it.** Exactly the disposition the rule prescribes, and exactly what this note is.

**The one thing that would change that:** if Superlogical's session layer gets a scriptable API, it becomes a candidate *replacement for the PTY sidecar* — which the GTM audit found to be the least safe component in QuantFlow (unauthenticated control socket, orphaned processes on quit, no ownership check on the pidfile). That is a real future trade, but it is a **swap of plumbing**, not of product, and it should not be considered until the audit's P0-3 and P1-6 are closed on their own terms. Adopting an underlayer to avoid fixing your own bug is how you acquire two bugs.

## Category — the reason this note matters

![[aod05-superlogical-t1635.jpg]]

**QuantFlow is not a terminal multiplexer, and accepting that label would be the single most expensive positioning mistake available.**

A multiplexer multiplexes **sessions** — ephemeral, untyped, and amnesiac. Detach and reattach and you get your shell back exactly as it was, which is the whole promise. tmux does not know what a Hypothesis is, cannot tell a proposed bet from a settled one, and has no opinion about whether a write is legal.

QuantFlow multiplexes **work on a typed world** — durable, governed, replayable. Remove the Kernel and you *would* have a multiplexer with a nice canvas. The Kernel is the product; the multiplexer is a component it happens to contain.

Note the direction of travel in Hashimoto's own words: *"terminals connect developers, agents, tools, and infrastructure, so it is the **right foundation for everything that follows**."* **He is starting at the terminal and building upward toward a governed system.** QuantFlow started at the governed system and reached down to the terminal because it needed seats. Two teams walking the same ladder from opposite ends — and QuantFlow is already standing on the rung that is the hard part.

**Better categories, in order of how well they'd land:**

| Category | Fit |
|---|---|
| **Ontology-backed research console** | Most accurate. Says the truth layer is the product |
| **Single-operator Foundry** | Best shorthand for anyone who knows Palantir — one market, one operator, same shape |
| *"Thin agents on a smarter substrate"* | Eifrem's phrase ([[04 - Thinner Agents on a Smarter Substrate (Emil Eifrem, Neo4j)]]) — **QuantFlow is the substrate.** Best phrase for a technical audience |
| Spatial operating console for AI-assisted quant research | `START_HERE.md`'s own line. Accurate, and a mouthful |
| ~~Terminal multiplexer~~ | **Reject.** Buyers expect free, competitors are tmux/zellij/Ghostty/Superlogical, and none of the value is legible |

The trap is that "terminal multiplexer" is the easiest thing to *demonstrate* — you open the app and there are terminals in a grid. It is the least of what is there. If a demo makes people say "so, tmux with a GUI," the demo is showing the wrong layer: **lead with an object on the canvas that has lineage, not with a seat that has a shell.**

Related: [[04 - Thinner Agents on a Smarter Substrate (Emil Eifrem, Neo4j)]] · [[03 - Dr. Karp on Sovereign AI (Palantir All-Hands)]] · [[Agents on Data 2026 — Hub]]
