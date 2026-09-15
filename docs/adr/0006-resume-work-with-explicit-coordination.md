# Resume work with explicit coordination and dated inputs

An investigation keeps its original market observation and an unfinished Task keeps its identity when work resumes. Each new Run binds its own fresh, identity-checked observation, while earlier inputs and attempts remain unchanged.

The original `delegated_by` relationship records who requested the Task. A `coordinated_by` relationship records the admitted participant currently responsible for directing it and receiving its result; tasks without that relationship continue to use their original delegator. An explicit operator resume action changes current responsibility atomically and records the handoff, so closed sessions never have to impersonate living participants.

This separates historical attribution from present authority in the typed ontology. Deriving present authority separately from event histories in each consumer would make routing harder to inspect; creating a replacement inquiry would split one question across unrelated work. A Task with an existing result must enter revision and independent review instead of pre-result resumption. This decision governs the saved-work repair in W1-03; it is not evidence that resumption has been implemented.
