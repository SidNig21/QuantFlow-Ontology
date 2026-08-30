# Phase 3 LOCAL cable-semantics amendment — 2026-08-30

This proposed two-file product amendment makes LOCAL selection show the complete lineage internal to the current Mission without leaking historical or global links.

status: **FRESH READER RECHECK REQUIRED / BUILDER CLOSED / TWO PRODUCT FILES ONLY IF ACCEPTED**

- defect Reader task: `01a05212-f0e4-7101-a0d9-8e59df8a3f08`
- defect verdict at authority base: **YES / YES — finite LOCAL cable product repair**
- authority base commit: `b32e3fce598e5cfc6a782b7952fd3de6088b93e6`
- authority base tree: `67fc9aef9e481346afba018bd901346e51845fc8`
- preserved unstaged proof path: `qa/gates/pre-r18-coherence.ts`
- preserved proof working-file Git blob: `493dfa080ca814e66e391f8e1b985ce8c30baff9`
- preserved proof binary-diff Git hash: `53bdb1c32ced5e1995f1357d98406c0ca35c10a0`
- amendment approval: **PENDING — a fresh Reader must recheck this exact amendment commit before any Builder**

The defect verdict bounds the amendment but cannot approve it. This docs/evidence commit leaves the existing unstaged gate diff byte-identical and unstaged, and authorizes no product mutation.

## Proposed exact two-file surface

If a fresh Reader accepts this amendment and a later receipt/rotation opens it, only these product paths are editable:

- `collab-electron/src/windows/shell/src/research-world.js`
- `collab-electron/src/windows/shell/src/research-world.test.ts`

The existing assertion surface in `qa/gates/pre-r18-coherence.ts` is proof only and remains byte-unchanged under this amendment. No other product, gate, oracle, Canvas, Dock, Kernel, IPC, lifecycle, or fixture file is editable.

## Exact CURRENT_MISSION and LOCAL contract

Unselected `CURRENT_MISSION` remains exactly 17 current objects and exactly 12 primary overview cables. Selecting a current object or current cable enters `LOCAL` semantics within the same current-Mission controller state; it does not enter `FULL_LINEAGE` and does not switch to a historical/global projection.

LOCAL renders every exact link whose `from_id` and `to_id` are both members of the exact 17-object current-Mission set. In the settled R17 fixture this internal current set is exactly 21 links. It must not use only `current.visibleLinkKeys` when that overview set contains 12 links, and it must not use all world links. Historical endpoints and links remain excluded, as do any links with either endpoint outside the exact current 17.

LOCAL visual meaning is exact:

- selected local-lineage cables use opacity `0.9` and must compute at least `0.80`;
- other current-Mission cables use opacity `0.28` and must compute at most `0.50`;
- the selected object uses opacity `1`;
- unrelated current-Mission objects use opacity `0.35`;
- historical objects and links are absent, not merely dimmed.

Back returns to `ORDINARY_CANVAS` and clears LOCAL selection/projection state. Deliberately reopening the exact Mission restores unselected `CURRENT_MISSION` with the exact 17 objects and 12 primary overview cables; it must not restore stale LOCAL selection or the 21-link LOCAL view.

## Mandatory fail-capable baits

1. Drive LOCAL links only from `current.visibleLinkKeys`: RED because only the 12 overview cables render and required internal current lineage is missing.
2. Drive LOCAL from all world links: RED because historical/out-of-current links or endpoints leak into LOCAL.
3. Omit grading/internal current links while preserving other links: RED on exact settled-R17 21-link identity membership, not count alone.
4. Change only opacity while retaining the wrong 12-link membership: RED because exact link identity membership remains incomplete; visual styling cannot substitute for topology.
5. Back to ordinary Canvas without clearing LOCAL, then reopen the Mission: RED if stale LOCAL selection/state or 21 LOCAL links remain instead of unselected 17-object/12-cable overview.
6. Restore the positive path: unselected current is exact 17/12; selecting an exact current object/cable yields only all 21 endpoint-in-current links with exact opacity semantics; historical/global leakage is zero; Back clears to ordinary; exact Mission reopen restores unselected 17/12.

## Preserved authority and stops

Object/link truth, current-Mission membership, overview membership, controller identity, Inspect/Back/navigation sequence, FULL_LINEAGE behavior, persistence, settlement, lifecycle, and the existing gate assertion remain unchanged. No global all-links fallback, filtered historical leak, synthetic link, count weakening, opacity-only workaround, hidden product state, new oracle, or layout change is authorized.

The preserved unstaged pre-R18 gate diff remains governed by its prior accepted/mechanical authorities and must not be touched or staged by this authority task. P14-A parser/selection mutation remains closed and measurement pending; P15 is not repaired or closed here. P18/candidate freeze, independent Verifier acceptance, Golden designation, `main`, every remote ref, and R18 remain closed. No candidate is permitted until P01-P17 are green. Any third executable path or semantic expansion stops for new authority.
