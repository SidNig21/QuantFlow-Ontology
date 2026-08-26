# G3 Cleanup Receipt

- Authorized tracked deletion count: **19**; all 19 are absent from the working tree and remain the only tracked deletions under the two named roots.
- Preserved ignored manifest: IGNORED-DESCENDANTS-BEFORE.tsv, 20,052 literal paths, SHA-256 39affcbb8729d3d1971a349b08577b948d2a7be423303c4254b595ebb26d0247.
- Partial-cleanup resume state: 14,992 manifest paths were already absent; 5,060 literal paths remained. The state is recorded in PARTIAL-CLEANUP-STATE.tsv; the complete disposition is REMOVED-PATHS.tsv.
- Final root proof: C:UsersybowQuantFlow-Ontology	oolsqf-peer-bus and C:UsersybowQuantFlow-Ontologyspeciescritic-mock were each resolved inside the repository and removed with one literal bounded root operation. Both roots are absent.
- Final untracked-root proof: git ls-files --others --exclude-standard -- tools/qf-peer-bus species/critic-mock returned zero paths.
- No app-owned peer-bus.db, peer-delivery, Agent Host, Dock collaboration, governed-review, or hermes-critic path was in the deletion manifest.