/**
 * Peer-bus canvas PASS — cold argv / surface alias checks (no live Hermes profiles).
 * Exit 0 = green.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  listHermesSeats,
  resolveHermesSeat,
} from "../../collab-electron/src/main/hermes-seats.ts";

const HERE = dirname(fileURLToPath(import.meta.url));

type SurfaceDoc = {
  surface?: string;
  route?: string;
  argv?: unknown;
};

function asSurface(value: unknown): "native_tui" | "acp_session" | null {
  if (value === "native_tui" || value === "acp_session") return value;
  return null;
}

/** Mirror species-surface readSurfaceDoc alias rule for committed/packed docs. */
function readSurfaceAlias(path: string): {
  surface: "native_tui" | "acp_session";
  argv: string[];
} | null {
  if (!existsSync(path)) return null;
  const doc = JSON.parse(readFileSync(path, "utf8")) as SurfaceDoc;
  const surface = asSurface(doc.surface) ?? asSurface(doc.route);
  if (!surface) return null;
  const argv = Array.isArray(doc.argv)
    ? doc.argv.filter((a): a is string => typeof a === "string" && a.length > 0)
    : [];
  return {
    surface,
    argv: surface === "native_tui" && argv.length === 0 ? ["--tui"] : argv,
  };
}

function main(): number {
  console.log("seat-argv-smoke: peer-bus canvas PASS");

  const orch = resolveHermesSeat("orchestrator");
  const worker = resolveHermesSeat("worker");
  if (JSON.stringify(orch.argv) !== JSON.stringify(["-p", "qf-orchestrator", "--tui"])) {
    console.error("seat-argv-smoke: orchestrator argv mismatch", orch.argv);
    return 1;
  }
  if (JSON.stringify(worker.argv) !== JSON.stringify(["-p", "qf-worker", "--tui"])) {
    console.error("seat-argv-smoke: worker argv mismatch", worker.argv);
    return 1;
  }
  if (orch.sessionLabel !== "Hermes Orchestrator" || worker.sessionLabel !== "Hermes Worker") {
    console.error("seat-argv-smoke: sessionLabel mismatch");
    return 1;
  }

  let rejected = false;
  try {
    resolveHermesSeat("not-a-seat");
  } catch {
    rejected = true;
  }
  if (!rejected) {
    console.error("seat-argv-smoke: unknown seatId must throw");
    return 1;
  }

  const launchPath = join(HERE, "launch.json");
  const metaPath = join(HERE, "packed/hermes.meta.json");
  const fromLaunch = readSurfaceAlias(launchPath);
  if (!fromLaunch || fromLaunch.surface !== "native_tui") {
    console.error(
      "seat-argv-smoke: launch.json must resolve native_tui via surface|route",
      fromLaunch,
    );
    return 1;
  }
  const fromMeta = readSurfaceAlias(metaPath);
  if (!fromMeta || fromMeta.surface !== "native_tui") {
    console.error(
      "seat-argv-smoke: packed hermes.meta.json must resolve native_tui via surface|route",
      fromMeta,
    );
    return 1;
  }

  console.log(
    "seat-argv-smoke: seats",
    listHermesSeats().map((s) => ({ id: s.seatId, argv: s.argv })),
  );
  console.log(
    `seat-argv-smoke: launch surface=${fromLaunch.surface} meta surface=${fromMeta.surface}`,
  );
  console.log("seat-argv-smoke: OK");
  return 0;
}

process.exit(main());
