import { readFileSync } from "node:fs";
import { PassThrough } from "node:stream";
import { join } from "node:path";
import { expect, test } from "bun:test";
import {
  assertCleanupReceipt,
  assertUiBoundaryReceipt,
  classifyTimeoutDiagnostic,
  createTimeoutDiagnosticContext,
  deriveTimeoutUiPhase,
  emitTimeoutDiagnostic,
  mapUniqueDirectorSessionStatus,
  runWithWatchdog,
  type DiagnosticKernelState,
  type TimeoutClassificationInput,
} from "./research-director-front-door.ts";
import {
  completeDirectorTurnAndWait,
  orchestrator,
  PtyLineReader,
} from "../../collab-electron/cli/qf-hermes-synthetic-responder.mjs";

const DIAGNOSTIC_KEYS = [
  "failure_boundary",
  "failure_class",
  "readiness_returned",
  "rpc",
  "ui_sample",
  "ui_phase",
  "input_disabled",
  "ledger_has_question",
  "director_tile_count",
  "tile_has_session",
  "kernel_read",
  "mission_for_question",
  "hypothesis_for_question",
  "hypothesis_status",
  "director_session_status",
  "director_definition_exact",
  "spawned_from_exact",
  "main_ipc_seen",
  "create_mission_seen",
  "native_admission_returned",
  "tile_event_sent",
  "tile_event_received",
  "tile_handler_threw",
  "tile_dom_identity_present",
] as const;

const KERNEL_GREEN: DiagnosticKernelState = {
  kernel_read: "ok",
  mission_for_question: true,
  hypothesis_for_question: true,
  hypothesis_status: "open",
  director_session_status: "running",
  director_definition_exact: true,
  spawned_from_exact: true,
};

function classificationBase(): TimeoutClassificationInput {
  return {
    readiness_returned: true,
    rpc: "ok",
    ui_sample: "present",
    ui_phase: "running",
    mission_for_question: true,
    hypothesis_for_question: true,
    director_session_status: "running",
    tile_has_session: true,
    main_ipc_seen: true,
    create_mission_seen: true,
  };
}

test("front-door boundary and cleanup receipts are falsifiable", () => {
  const complete: {
    renderer_form_submit: number;
    preload_ipc: string | null;
    main_ipc: string | null;
    kernel_command: string | null;
    automatic_tile: number;
    tile_event_sent: boolean;
    tile_event_received: boolean;
    tile_handler_threw: boolean;
    tile_dom_identity_present: boolean;
  } = {
    renderer_form_submit: 1,
    preload_ipc: "qf:research:submitQuestion",
    main_ipc: "qf:research:submitQuestion",
    kernel_command: "create_mission",
    automatic_tile: 1,
    tile_event_sent: true,
    tile_event_received: true,
    tile_handler_threw: false,
    tile_dom_identity_present: true,
  };
  const missingHopMutations = [
    (receipt: typeof complete) => { receipt.renderer_form_submit = 0; },
    (receipt: typeof complete) => { receipt.preload_ipc = null; },
    (receipt: typeof complete) => { receipt.main_ipc = null; },
    (receipt: typeof complete) => { receipt.kernel_command = null; },
    (receipt: typeof complete) => { receipt.tile_event_sent = false; },
    (receipt: typeof complete) => { receipt.tile_event_received = false; },
    (receipt: typeof complete) => { receipt.tile_dom_identity_present = false; },
    (receipt: typeof complete) => { receipt.tile_handler_threw = true; },
  ];
  for (const mutate of missingHopMutations) {
    const receipt = { ...complete };
    mutate(receipt);
    expect(() => assertUiBoundaryReceipt(receipt)).toThrow();
  }
  expect(() => assertUiBoundaryReceipt(complete)).not.toThrow();

  expect(() => assertCleanupReceipt({
    owned_process_tree_remaining: 1,
    electron_processes_remaining: 0,
    hermes_processes_remaining: 0,
    roots_remaining: 1,
  })).toThrow();

  expect(() => assertCleanupReceipt({
    owned_process_tree_remaining: 0,
    electron_processes_remaining: 0,
    hermes_processes_remaining: 0,
    roots_remaining: 0,
  })).not.toThrow();
});

test("timeout phase and unique-session mappings are deterministic", () => {
  expect(deriveTimeoutUiPhase("")).toBe("empty");
  expect(deriveTimeoutUiPhase("Starting durable research…")).toBe("starting");
  expect(deriveTimeoutUiPhase("Research Director running · Mission mission-1")).toBe("running");
  expect(deriveTimeoutUiPhase("anything", "error")).toBe("error");
  expect(deriveTimeoutUiPhase("anything", "")).toBe("other");

  expect(mapUniqueDirectorSessionStatus([])).toBe("absent");
  expect(mapUniqueDirectorSessionStatus(["starting"])).toBe("starting");
  expect(mapUniqueDirectorSessionStatus(["running"])).toBe("running");
  expect(mapUniqueDirectorSessionStatus(["blocked"])).toBe("blocked");
  expect(mapUniqueDirectorSessionStatus(["closed"])).toBe("terminal");
  expect(mapUniqueDirectorSessionStatus(["unknown"])).toBe("other");
  expect(mapUniqueDirectorSessionStatus(["running", "starting"])).toBe("other");
});

test("timeout classification uses the required five-class precedence", () => {
  const base = classificationBase();
  expect(classifyTimeoutDiagnostic({ ...base, readiness_returned: false, ui_phase: "error" })).toBe("app_or_renderer_rpc_failure");
  expect(classifyTimeoutDiagnostic({ ...base, main_ipc_seen: false, mission_for_question: true })).toBe("ipc_rejected");
  expect(classifyTimeoutDiagnostic({ ...base, ui_phase: "error" })).toBe("ipc_rejected");
  expect(classifyTimeoutDiagnostic({ ...base, director_session_status: "starting" })).toBe("admission_pending");
  expect(classifyTimeoutDiagnostic({ ...base, director_session_status: "absent" })).toBe("admission_pending");
  expect(classifyTimeoutDiagnostic({ ...base, ui_phase: "starting" })).toBe("session_projection_missing");
  expect(classifyTimeoutDiagnostic({ ...base, tile_has_session: false })).toBe("session_projection_missing");
  expect(classifyTimeoutDiagnostic({ ...base, director_session_status: "blocked" })).toBe("visible_projection_mismatch");
});

test("the production timeout emitter is redacted, exact-key, once-only, and before cleanup", () => {
  for (const failureBoundary of ["inner_wait_error", "outer_watchdog_timeout"] as const) {
    const hostile = "QUESTION_SENTINEL id-SENTINEL path-SENTINEL command-SENTINEL env-SENTINEL row-SENTINEL output-SENTINEL error-SENTINEL";
    const context = createTimeoutDiagnosticContext([
      hostile,
      "qf-ui-proof main_ipc=qf:research:submitQuestion",
      "qf-ui-proof kernel_command=create_mission",
      "agent-host: admitted native_tui",
      "qf-ui-proof tile_event_sent=create-term-tile",
      "qf-ui-proof tile_event_received=create-term-tile",
      "qf-ui-proof tile_dom_identity=present",
    ]);
    context.kernelPath = "path-SENTINEL";
    context.failureBoundary = failureBoundary;
    context.readinessReturned = false;
    context.mostRecentUiRpc = "ok";
    context.lastUiState = {
      inputDisabled: true,
      ledgerHasQuestion: true,
      directorTileCount: 1,
      tileHasSession: true,
      uiPhase: "running",
    };
    const lines: string[] = [];
    const events: string[] = [];
    let reads = 0;
    const emitted = emitTimeoutDiagnostic(
      context,
      () => {
        reads += 1;
        return KERNEL_GREEN;
      },
      (line) => {
        events.push("emit");
        lines.push(line);
      },
      () => events.push("cleanup"),
    );

    expect(emitted).toBe(true);
    expect(reads).toBe(1);
    expect(events).toEqual(["emit", "cleanup"]);
    expect(lines).toHaveLength(1);
    expect(() => emitTimeoutDiagnostic(context, () => { throw new Error("duplicate read"); }, (line) => lines.push(line), () => events.push("duplicate cleanup"))).not.toThrow();
    expect(lines).toHaveLength(1);

    const [prefix, json] = lines[0]!.split("=", 2);
    expect(prefix).toBe("rd1_timeout_diag");
    const receipt = JSON.parse(json!);
    expect(Object.keys(receipt)).toEqual([...DIAGNOSTIC_KEYS]);
    expect(receipt.failure_boundary).toBe(failureBoundary);
    expect(receipt.failure_class).toBe("app_or_renderer_rpc_failure");
    expect(receipt.readiness_returned).toBe(false);
    expect(receipt.main_ipc_seen).toBe(true);
    expect(receipt.create_mission_seen).toBe(true);
    expect(receipt.native_admission_returned).toBe(true);
    expect(receipt.tile_event_sent).toBe(true);
    expect(receipt.tile_event_received).toBe(true);
    expect(receipt.tile_handler_threw).toBe(false);
    expect(receipt.tile_dom_identity_present).toBe(true);
    expect(receipt.kernel_read).toBe("ok");
    for (const value of [hostile, "path-SENTINEL", "QUESTION_SENTINEL", "id-SENTINEL", "command-SENTINEL", "env-SENTINEL", "row-SENTINEL", "output-SENTINEL", "error-SENTINEL"]) {
      expect(lines[0]).not.toContain(value);
    }
  }
});

test("a missing boundary emits nothing, and after-cleanup emission is rejected by ordering", () => {
  const missing = createTimeoutDiagnosticContext();
  const lines: string[] = [];
  expect(emitTimeoutDiagnostic(missing, () => KERNEL_GREEN, (line) => lines.push(line), () => lines.push("cleanup"))).toBe(false);
  expect(lines).toHaveLength(0);

  const context = createTimeoutDiagnosticContext();
  context.failureBoundary = "inner_wait_error";
  const events: string[] = [];
  expect(() => emitTimeoutDiagnostic(
    context,
    () => KERNEL_GREEN,
    () => {
      if (events.includes("cleanup")) throw new Error("emission happened after cleanup");
      events.push("emit");
    },
    () => events.push("cleanup"),
  )).not.toThrow();
  expect(events).toEqual(["emit", "cleanup"]);
});

test("outer watchdog emission remains once-only while the watched task settles later", async () => {
  const context = createTimeoutDiagnosticContext();
  const lines: string[] = [];
  const result = await runWithWatchdog(
    () => new Promise<true>((resolve) => setTimeout(() => resolve(true), 40)),
    {
      deadlineMs: 5,
      onDeadline: () => {
        context.failureBoundary = "outer_watchdog_timeout";
        emitTimeoutDiagnostic(context, () => KERNEL_GREEN, (line) => lines.push(line), () => {});
      },
    },
  );
  expect(result.timedOut).toBe(true);
  await new Promise((resolve) => setTimeout(resolve, 60));
  expect(lines).toHaveLength(1);
});

test("watchdog returns red without awaiting never-settling cleanup", async () => {
  const started = Date.now();
  const result = await runWithWatchdog(
    () => new Promise<never>(() => {}),
    {
      deadlineMs: 25,
      onDeadline: () => new Promise<never>(() => {}),
    },
  );
  expect(result.timedOut).toBe(true);
  expect(Date.now() - started).toBeLessThan(500);
});

test("Director lifecycle holds the production branch until PTY release and removes listeners", async () => {
  const input = new PassThrough();
  const reader = new PtyLineReader(input);
  let released = false;
  let completed = false;
  let settled = false;
  const lifecycle = completeDirectorTurnAndWait(reader, "mission-lifecycle", () => {
    expect(released).toBe(false);
    completed = true;
  });
  void lifecycle.then(() => { settled = true; });
  await new Promise((resolve) => setImmediate(resolve));
  expect(completed).toBe(true);
  expect(settled).toBe(false);
  expect(reader.closed).toBe(false);

  released = true;
  input.end();
  await lifecycle;
  expect(settled).toBe(true);
  reader.dispose();
  expect(input.listenerCount("data")).toBe(0);
  expect(input.listenerCount("end")).toBe(0);
  expect(input.listenerCount("error")).toBe(0);
});

test("the production Director branch uses the lifecycle handshake and has no fixed dwell", async () => {
  const input = new PassThrough();
  const reader = new PtyLineReader(input);
  let completionObserved = false;
  let settled = false;
  const mission = {
    mission_id: "mission-production-lifecycle",
    question: "bounded lifecycle question",
    instruction: "do not recruit or assign a Task in this slice",
  };
  const run = orchestrator(reader, {}, {}, async (heldReader: PtyLineReader, missionId: string) => {
    await completeDirectorTurnAndWait(heldReader, missionId, () => {
      completionObserved = true;
    });
  });
  void run.then(() => { settled = true; }, () => { settled = true; });
  input.write(`QUANTFLOW_MISSION ${JSON.stringify(mission)}\n`);
  await new Promise((resolve) => setImmediate(resolve));
  expect(completionObserved).toBe(true);
  expect(settled).toBe(false);

  input.end();
  await run;
  expect(settled).toBe(true);
  reader.dispose();

  const source = readFileSync(
    join(import.meta.dir, "../../collab-electron/cli/qf-hermes-synthetic-responder.mjs"),
    "utf8",
  );
  const branchStart = source.indexOf("if (activation.instruction?.includes(\"do not recruit or assign a Task in this slice\"))");
  const branchEnd = source.indexOf("const ontologyTools", branchStart);
  expect(branchStart).toBeGreaterThanOrEqual(0);
  expect(branchEnd).toBeGreaterThan(branchStart);
  expect(source.slice(branchStart, branchEnd)).not.toMatch(/setTimeout|setInterval|sleep/);
});
