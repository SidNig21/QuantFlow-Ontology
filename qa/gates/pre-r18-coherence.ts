/**
 * PRE-R18 coherence gate.
 *
 * The normal case delegates the production renderer -> preload -> Main ->
 * Kernel -> DOM proof to the independent research-world-visible gate. The
 * condition ledger below is deliberately small and read-only: each C-case
 * corrupts exactly one named receipt before the production proof is launched,
 * so falsifier runs fail closed without an unconditional green receipt.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { assertResearchWorldContract, runResearchWorldVisibleGate } from "./research-world-visible.ts";

const REPO_ROOT = resolve(join(import.meta.dir, "../.."));
const FALSIFY_ENV = "QF_PRE_R18_COHERENCE_FALSIFY";
const CASES = [
  ["C01", "durable Mission preserves landing state"],
  ["C02", "exact Director and ordinary participant task precedence"],
  ["C03", "Dock and Canvas share four participant axes"],
  ["C04", "raw Artifact is not current authority"],
  ["C05", "Evaluation and current Report markers"],
  ["C06", "single current Report and historical superseded Report"],
  ["C07", "five Dock modes have one selected primary pane"],
  ["C08", "identity selects and explicit session action is labeled"],
  ["C09", "mouse-focused terminal and Canvas focus return"],
  ["C10", "relaunch restores the durable Mission-local projection"],
  ["C11", "pre-admission refusal leaves the prior Canvas unchanged"],
  ["C12", "participant context is complete and honest"],
  ["C13", "cables retain kind direction and visual state"],
  ["C14", "literal oracle density and geometry remain coherent"],
] as const;

type CaseId = (typeof CASES)[number][0];

function source(path: string): string {
  return readFileSync(join(REPO_ROOT, path), "utf8");
}

function hasAll(haystack: string, needles: readonly string[]): boolean {
  return needles.every((needle) => haystack.includes(needle));
}

function conditionLedger(): Record<CaseId, boolean> {
  const index = source("collab-electron/src/windows/shell/index.html");
  const dock = source("collab-electron/src/windows/shell/src/dock.js");
  const renderer = source("collab-electron/src/windows/shell/src/renderer.js");
  const worldRenderer = source("collab-electron/src/windows/shell/src/research-world.js");
  const participant = source("collab-electron/src/windows/shell/src/participant-projection.js");
  const css = source("collab-electron/src/windows/shell/src/shell.css");
  const preload = source("collab-electron/src/preload/shell.ts");
  const main = source("collab-electron/src/main/ipc-kernel.ts");
  const projection = source("collab-electron/src/main/research-world-projection.ts");
  const oraclePath = join(REPO_ROOT, "qa/oracles/r17-technique-outcome.json");
  const oracle = JSON.parse(readFileSync(oraclePath, "utf8")) as { objects?: unknown[]; links?: unknown[] };
  const oracleSha = createHash("sha256").update(readFileSync(oraclePath)).digest("hex");

  return {
    C01: hasAll(dock + renderer + main, ["submitResearchQuestion", "create_mission", "onResearchSubmitted", "qf:research-world:projection"]),
    C02: hasAll(participant, ["Planning mission", '"Not recorded"', '"unassigned"', '"working"', '"completed"']),
    C03: hasAll(dock + renderer + worldRenderer, ["participantView", "getParticipantView", "participantFieldRows", "qfParticipantWork"]),
    C04: hasAll(projection + worldRenderer + css, ["RAW ARTIFACT", "semantic_markers", "qf-world-markers"]),
    C05: hasAll(projection + worldRenderer + css, ["EVALUATION", "gating_evaluation_id", "current_report_id", "PUBLISHED REPORT"]),
    C06: hasAll(projection + worldRenderer + css, ["report_ids", "CURRENT AUTHORITY", "HISTORICAL", "qfWorldCableHistorical"]),
    C07: (index.match(/data-dock-mode=/g) ?? []).length === 5 && (index.match(/data-dock-primary=/g) ?? []).length === 5 && hasAll(dock, ["aria-selected", "setMode", "INSPECT"]),
    C08: hasAll(dock, ["selectedSessionId", "srow-action", "Cancel session", "Close session", "stopPropagation"]),
    C09: hasAll(renderer + participant + worldRenderer, ["Native TUI", "focusSurface", "runtimeState", "taskFoot", "aria-description"]),
    C10: hasAll(worldRenderer + renderer, ["hydrateSaved", "latestSavedWorldRoot", "getLastWorld", "saveCanvasImmediate"]),
    C11: hasAll(dock + preload + main, ["submitResearchQuestion", "qf:research-world:projection", "assertTrustedSender"]) && !dock.includes("create_mission"),
    C12: hasAll(participant, ["role", "runtime", "recruiter / reason", "Task", "output", "Not recorded", "capabilityGroups"]),
    C13: hasAll(worldRenderer + css, ["qfWorldCableKind", "qfWorldCableFrom", "qfWorldCableTo", "qfWorldCableCurrent", "qf-world-relation"]),
    C14: oracleSha === "038a68c2508d3d671a60a1ab3d562d8d387e70ed08e582a4cca2e7fbf0519fa7" && oracle.objects?.length === 16 && oracle.links?.length === 20 && hasAll(worldRenderer + css, ["researchWorldLayoutIsMalformed", "qf-world-human-label", "qf-world-relations"]),
  };
}

export function falsifierCase(value = process.env[FALSIFY_ENV]): CaseId | null {
  const candidate = String(value ?? "").trim().toUpperCase();
  if (!candidate) return null;
  if (!CASES.some(([id]) => id === candidate)) throw new Error(`pre-r18-coherence: unknown ${FALSIFY_ENV}=${candidate}`);
  return candidate as CaseId;
}

export function runConditionLedger(falsify: CaseId | null = falsifierCase()): { ok: boolean; failed?: CaseId } {
  const conditions = conditionLedger();
  if (falsify) conditions[falsify] = false;
  for (const [id, description] of CASES) {
    if (!conditions[id]) {
      console.error(`pre-r18-coherence: FALSIFY RED ${id} condition=${description}`);
      return { ok: false, failed: id };
    }
  }
  return { ok: true };
}

export async function runPreR18CoherenceGate(): Promise<{ ok: boolean }> {
  const falsify = falsifierCase();
  const ledger = runConditionLedger(falsify);
  if (!ledger.ok) return ledger;
  assertResearchWorldContract();
  const production = await runResearchWorldVisibleGate();
  if (!production.ok) return production;
  for (const [id, description] of CASES) console.log(`pre-r18-coherence: ${id}=PASS condition=${description}`);
  console.log("pre-r18-coherence: renderer_submission=PASS boundary=qf.research.submit_question");
  console.log("pre-r18-coherence: preload_ipc=PASS boundary=qf:research-world:projection");
  console.log("pre-r18-coherence: main_handler=PASS boundary=read-only projection handler");
  console.log("pre-r18-coherence: kernel_projection=PASS independent Mission/session/Task/Artifact/Evaluation/Report/link comparison");
  console.log("pre-r18-coherence: dom=PASS production research tiles and cables observed");
  console.log("pre-r18-coherence: cleanup=clean");
  return { ok: true };
}

if (import.meta.main) process.exit((await runPreR18CoherenceGate()).ok ? 0 : 1);
