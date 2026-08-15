import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { generateConformance } from "../src/generate/conformance.ts";
import { generateDocs } from "../src/generate/docs.ts";
import { generateMcp } from "../src/generate/mcp.ts";
import { generateSql } from "../src/generate/sql.ts";
import { generateUpgradeAgentProfileIdentity } from "../src/generate/upgrade-agent-profile-identity.ts";
import { generateUpgradeMarketIngest } from "../src/generate/upgrade-market-ingest.ts";
import { generateUpgradeMarketContext } from "../src/generate/upgrade-market-context.ts";
import { generateUpgradeCapabilityGrants } from "../src/generate/upgrade-capability-grants.ts";
import { generateUpgradeTaskStatus } from "../src/generate/upgrade-task-status.ts";
import { generateUpgradeConnectionActions } from "../src/generate/upgrade-connection-actions.ts";
import { generateUpgradeTaskDelegation } from "../src/generate/upgrade-task-delegation.ts";
import { generateUpgradeDeterministicExecution } from "../src/generate/upgrade-deterministic-execution.ts";
import { generateUpgradeIndependentCritic } from "../src/generate/upgrade-independent-critic.ts";
import { generateUpgradeTaskComposition } from "../src/generate/upgrade-task-composition.ts";
import { schema } from "../src/schema.ts";

const goldenDir = join(import.meta.dir, "..", "golden");
const upgradesDir = join(goldenDir, "upgrades");
mkdirSync(goldenDir, { recursive: true });
mkdirSync(upgradesDir, { recursive: true });

writeFileSync(join(goldenDir, "migration.sql"), generateSql(schema), "utf8");
writeFileSync(join(goldenDir, "tools.json"), generateMcp(schema), "utf8");
writeFileSync(join(goldenDir, "ONTOLOGY.md"), generateDocs(schema), "utf8");
writeFileSync(join(goldenDir, "conformance.test.ts"), generateConformance(), "utf8");
writeFileSync(
  join(upgradesDir, "0001-agent-profile-identity.sql"),
  generateUpgradeAgentProfileIdentity(),
  "utf8",
);
writeFileSync(
  join(upgradesDir, "0002-market-ingest.sql"),
  generateUpgradeMarketIngest(),
  "utf8",
);
writeFileSync(
  join(upgradesDir, "0003-market-context.sql"),
  generateUpgradeMarketContext(),
  "utf8",
);
writeFileSync(
  join(upgradesDir, "0004-capability-grants.sql"),
  generateUpgradeCapabilityGrants(),
  "utf8",
);
writeFileSync(
  join(upgradesDir, "0005-task-status.sql"),
  generateUpgradeTaskStatus(),
  "utf8",
);
writeFileSync(
  join(upgradesDir, "0006-connection-actions.sql"),
  generateUpgradeConnectionActions(),
  "utf8",
);
writeFileSync(
  join(upgradesDir, "0007-task-delegation.sql"),
  generateUpgradeTaskDelegation(),
  "utf8",
);
writeFileSync(
  join(upgradesDir, "0008-deterministic-execution.sql"),
  generateUpgradeDeterministicExecution(),
  "utf8",
);
writeFileSync(
  join(upgradesDir, "0009-independent-critic.sql"),
  generateUpgradeIndependentCritic(),
  "utf8",
);
writeFileSync(
  join(upgradesDir, "0010-task-composition.sql"),
  generateUpgradeTaskComposition(),
  "utf8",
);

console.log(
  "Wrote golden/migration.sql, golden/tools.json, golden/ONTOLOGY.md, golden/conformance.test.ts, golden/upgrades/0001-agent-profile-identity.sql, golden/upgrades/0002-market-ingest.sql, golden/upgrades/0003-market-context.sql, golden/upgrades/0004-capability-grants.sql, golden/upgrades/0005-task-status.sql, golden/upgrades/0006-connection-actions.sql, golden/upgrades/0007-task-delegation.sql, golden/upgrades/0008-deterministic-execution.sql, golden/upgrades/0009-independent-critic.sql, golden/upgrades/0010-task-composition.sql",
);
