---
tags: [foundry, architecture, free-tier]
source: https://palantir.com/docs/foundry/architecture-center/platforms/
fetched: 2026-07-22
---

# AIP, Foundry, and Apollo

> Official Architecture center. **Free-tier note:** you use **Foundry + AIP**. Apollo runs underneath — you don’t operate it. Gotham is mentioned only as a defense suite on the same Ontology — not available to you.

## The three platforms

The standard Palantir architecture consists of three integrated platforms: AIP, Foundry, and Apollo.

- **Apollo** — continuous delivery platform that manages the underlying infrastructure hosting Foundry and AIP (zero-downtime upgrades across many services).
- **Foundry** — foundational data operations: data management, logic authoring, Ontology development, analytics, workflow development.
- **AIP** — generative AI platform: LLM connectivity (“k-LLM”), toolchain for agents/automations, AI-enabled apps, Evals for production AI workflows.

Together they are framed as an **Enterprise Operating System**.

## Nine capability sets (AIP + Foundry)

Conceptually:

1. Ontology Language  
2. Ontology Engine  
3. Ontology Toolchain  
4. Data Services  
5. Logic Services  
6. Workflow Services  
7. Analytics & Applications  
8. Automations  
9. Product Delivery toolchain  

These sit on mesh-wide components (Storage, Compute, Networking, Security, Governance, Workspace) — **powered by Apollo**.

## Security (high level)

Unified security across AIP / Foundry / Apollo: infrastructure (zero trust), platform (scopes for humans and agents, RBAC/markings/purpose), enterprise (IdP / audit integration).

## Extensibility — Gotham mention

Defense offerings (including **Gotham** multimodal apps/tools) are described as integrated with this architecture and **powered by the Foundry-managed Ontology**. That is enterprise/defense packaging — **not free Developer Tier**.

Compute Modules can bring custom containers into the Apollo-managed mesh (enterprise pattern).

## Free-tier takeaway

Read this once for vocabulary. Then ignore Apollo/Gotham as products and build on **Foundry Ontology + Pipeline Builder + Workshop + GA AIP**.

← Overview · → The Ontology system
