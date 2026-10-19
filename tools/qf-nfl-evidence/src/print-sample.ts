import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildEvidence, formatEvidence, type EvidenceInput } from "./evidence.ts";

const input = JSON.parse(
  readFileSync(join(import.meta.dir, "fixtures", "receiver.json"), "utf8"),
) as EvidenceInput;
console.log(formatEvidence(buildEvidence(input)));
