# Current visual contract

The existing Glacier Canvas remains the product surface. Research-world tiles
use compact, semantic rectangles: a human label, object type, current state or
authority marker, and a shortened id are visible without hiding the canonical
id from Inspect. Incoming and outgoing existing link triples remain available
inside the tile inspector; cables retain their existing kind and direction.

The Research Dock has five modes: START, CATALOG, ACTIVE, INSPECT, and HISTORY.
Participant identity selects and inspects; only an explicitly labelled session
action can cancel or close a session. Dock and Canvas consume the same derived
participant facts for role, runtime, session, work, recovery, Task, reason, and
output. Missing facts display `Not recorded`; the planning copy belongs only to
the exact Director returned by the current submission when no Task exists.

Raw output, Evaluation, current published Report, and historical Report remain
distinct visual states. Current authority is derived from the existing
read-only projection's `current_report_id`; historical ids come from its
Mission-local `report_ids` set. No new ontology, link kind, or Canvas truth
store is introduced by this presentation contract.
