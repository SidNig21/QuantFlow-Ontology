---
tags: [foundry, aip, free-tier, scope]
created: 2026-07-22
---

# Free AIP Developer Tier — what you can use

You are on the **free AIP Developer Tier** (solo / not company-sponsored). Scope everything in this vault to that.

## Confirmed (Palantir staff on community)

Sources:
- [Developer Tier Billing and Usage](https://community.palantir.com/t/developer-tier-billing-and-usage/1074) — Palantir staff: **free, you will not be charged**; limits are baked in (you hit a ceiling, not a bill). See **Control Panel → Your Plan**.
- [Queries Regarding Free Tier](https://community.palantir.com/t/queries-regarding-free-tier-developer-account/5073) — Palantir staff: Developer Tier includes **all Generally Available (GA) applications**. Check **Control Panel → Application Access**. Beta apps need a support Issue.
- [5-user limit](https://community.palantir.com/t/why-can-i-only-add-up-to-5-users-in-palantir-foundry/3911) — free Developer Tier caps users (staff points to Your Plan).
- Community report: ~**60 action types** max on free tier (user-reported; verify on Your Plan).

## What that means for you (practical)

**Yes — GA apps you should assume you can enable/use** (if listed under Application Access):

| Layer | Apps / surfaces |
|-------|-----------------|
| Data | Pipeline Builder, Data Connection, datasets, lineage |
| Ontology | Ontology Manager, Object Explorer, object/link types, Actions |
| Apps | **Workshop** (no-code UI — prefer this over OSDK/React), Contour, Quiver as available |
| AIP | AIP Assist, AIP Logic / related GA AIP features on Your Plan |
| Dev tools | Code Repositories, Code Workspaces, Developer Console, OSDK (optional — avoid React path for learning) |

**How to check on your stack (source of truth):**
1. **Control Panel → Your Plan** — hard limits (users, compute, storage, ontology quotas).
2. **Control Panel → Application Access** — which apps are GA / enabled for you.
3. Sidebar favorites ≠ entitlement. “Only Ontology showing” is weak evidence Workshop is missing — enable apps / search Workshop once you have objects.

## Explicitly OUT of scope for free-tier you

| Product | Why ignore for learning |
|---------|-------------------------|
| **Apollo** | Continuous delivery / infra that *hosts* Foundry+AIP. You don’t operate Apollo on free tier. Read one Architecture page for orientation; don’t index Apollo ops docs. |
| **Gotham** | Defense/intel application suite on the same Ontology architecture. Not a free-tier product. |
| **Enterprise-only / stack-gated** (DevCon 6) | Orchestrator (`@palantir/durable-functions`), Agent Engine / Agent Builder beta, SuperRepo (“at your own stacks”), Ontology MCP as enterprise dogfood — **not** self-serve free-tier installs. Borrow doctrine only; don’t wait on them. See vault link to DevCon6 notes if needed. |

## Docs we index here

Only docs that teach **GA Foundry + AIP surfaces you can click on free tier**:

1. Getting started + platform summary  
2. Architecture center (mental model; Apollo/Gotham mentioned only as context)  
3. Ontology building  
4. Data / Pipeline Builder  
5. AIP (GA features)  
6. Workshop + Actions  
7. Light developer toolchain (skip deep OSDK/React unless you choose it later)

Skip: Apollo ops, Gotham, full API reference dumps, enterprise agent stack marketing.

## Start here in Foundry today

1. Control Panel → Application Access → confirm Workshop / Pipeline Builder / Ontology Manager  
2. Control Panel → Your Plan → screenshot your real limits into this folder later  
3. Build: tiny dataset → object type → Object Explorer → (then) Workshop
