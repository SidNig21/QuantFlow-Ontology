/**
 * Golden G4 route gate.
 *
 * The staged QA closure is derived from every Dock profile manifest. Each
 * referenced package is resolved and dispatched through the production route
 * boundary. Unsupported metadata is allowed through parse/resolve only to
 * prove that dispatch rejects it before a callback can mutate runtime state.
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  discoverDockProfileManifests,
  type DockProfileManifest,
} from "../../collab-electron/src/main/dock-profiles.ts";
import { resolveRuntimeAdapterMetadata } from "../../collab-electron/src/main/runtime-adapter.ts";
import {
  dispatchRuntimeRoute,
  UnsupportedRuntimeRouteError,
} from "../../collab-electron/src/main/runtime-route-dispatch.ts";
import { prepareRuntimeStaging } from "../../collab-electron/scripts/package-lib/runtime-staging.ts";

const REPO_ROOT = resolve(import.meta.dir, "../..");
function assertPrecreatedPathUsesSingleDispatcher(): void {
  const source = readFileSync(
    join(REPO_ROOT, "collab-electron/src/main/agent-host.ts"),
    "utf8",
  );
  const admissionStart = source.indexOf(
    "export async function admitAndStartSession(",
  );
  const precreatedStart = source.indexOf(
    "export async function startPrecreatedNativeTuiSession(",
  );
  const precreatedEnd = source.indexOf("function peerBusDbPath()", precreatedStart);
  if (admissionStart < 0 || precreatedStart < 0 || precreatedEnd < 0 || precreatedStart <= admissionStart) {
    throw new Error("production precreated/admission functions are missing");
  }
  const admission = source.slice(admissionStart, precreatedStart);
  const precreated = source.slice(precreatedStart, precreatedEnd);
  const dispatchCount =
    admission.match(/\bdispatchRuntimeRoute\s*\(/g)?.length ?? 0;
  if (dispatchCount !== 1) {
    throw new Error(
      "production admission must have exactly one runtime dispatcher",
    );
  }
  if (
    !/const runtime = getDefinitionRuntime\(definitionId\);\s+return await admitAndStartSession\(definitionId, \{/.test(
      precreated,
    )
  ) {
    throw new Error(
      "precreated path must resolve metadata and hand off to admitAndStartSession",
    );
  }
  if (
    /assertPrecreatedNativeTuiRoute|metadata\.route|dispatchRuntimeRoute|kernelExecute|admitNativeTuiDefinition|admitHostAcp|completeRuntimeKernelAdmission/.test(
      precreated,
    )
  ) {
    throw new Error(
      "precreated path has a competing refusal, mutation, or runtime callback boundary",
    );
  }
}

type RouteProbe = {
  route: string;
  packageRef: string;
};

function packageRefs(manifests: readonly DockProfileManifest[]): string[] {
  return [...new Set(
    manifests.flatMap((manifest) =>
      manifest.profiles.map((profile) => profile.package_ref),
    ),
  )].sort();
}

function writeRouteProbe(root: string, route: string): RouteProbe {
  const packageRef = `tools/golden-g4-route-probe/packed/${route}.aospkg`;
  const packagePath = join(root, packageRef);
  const metadataPath = join(root, `tools/golden-g4-route-probe/packed/${route}.meta.json`);
  mkdirSync(join(root, "tools/golden-g4-route-probe/packed"), { recursive: true });
  writeFileSync(packagePath, `probe-${route}\n`);
  writeFileSync(
    metadataPath,
    JSON.stringify({
      name: `golden-g4-${route}`,
      route,
      package: `${route}.aospkg`,
      command: null,
      entrypoint: null,
      terminal_target: null,
      argv: [],

      tools: [],
    }),
  );
  return { route, packageRef };
}

function assertUnsupportedRoute(
  root: string,
  route: string,
  mutationCount: { value: number },
): void {
  const probe = writeRouteProbe(root, route);
  const resolved = resolveRuntimeAdapterMetadata(probe.packageRef, root);
  const before = mutationCount.value;
  let thrown: unknown;
  try {
    if (process.env.QF_G4_RETIRED_ROUTE_FALSIFY === "accept-unknown") {
      throw new Error("falsifier accepted an unsupported route");
    }
    dispatchRuntimeRoute(resolved.metadata.route, resolved.packageRef, {
      native_tui: () => { mutationCount.value += 1; },
      host_acp: () => { mutationCount.value += 1; },
    });
  } catch (error) {
    thrown = error;
  }
  if (!(thrown instanceof UnsupportedRuntimeRouteError)) {
    throw new Error(`${route}: expected UnsupportedRuntimeRouteError`);
  }
  if (thrown.route !== route || thrown.packageRef !== probe.packageRef) {
    throw new Error(`${route}: error identity mismatch`);
  }
  const expectedMessage =
    `unsupported runtime route "${route}" for package_ref "${probe.packageRef}"`;
  if (thrown.message !== expectedMessage || thrown.code !== "QF_UNSUPPORTED_RUNTIME_ROUTE") {
    throw new Error(`${route}: exact error contract mismatch: ${thrown.message}`);
  }
  if (mutationCount.value !== before) {
    throw new Error(`${route}: unsupported route mutated before dispatch rejection`);
  }
}

export function runGoldenG4RetiredRouteGate(): { ok: boolean } {
  const stagingRoot = mkdtempSync(join(tmpdir(), "qf-golden-g4-route-"));
  const probeRoot = mkdtempSync(join(tmpdir(), "qf-golden-g4-probe-"));
  const mutations = { value: 0 };
  try {
    prepareRuntimeStaging({ stagingRoot, repoRoot: REPO_ROOT }, { qaMode: true });
    assertPrecreatedPathUsesSingleDispatcher();
    const manifests = discoverDockProfileManifests(stagingRoot, { qaMode: true });
    const refs = packageRefs(manifests);
    if (refs.length === 0) throw new Error("staged QA closure has no profile references");

    const routeCounts = new Map<string, number>();
    for (const packageRef of refs) {
      const resolved = resolveRuntimeAdapterMetadata(packageRef, stagingRoot);
      const before = mutations.value;
      dispatchRuntimeRoute(resolved.metadata.route, packageRef, {
        native_tui: () => { mutations.value += 1; },
        host_acp: () => { mutations.value += 1; },
      });
      if (mutations.value !== before + 1) {
        throw new Error(`staged ${packageRef}: supported route callback count mismatch`);
      }
      routeCounts.set(
        resolved.metadata.route,
        (routeCounts.get(resolved.metadata.route) ?? 0) + 1,
      );
    }

    const hostProbe = writeRouteProbe(probeRoot, "host_acp");
    const hostResolved = resolveRuntimeAdapterMetadata(hostProbe.packageRef, probeRoot);
    dispatchRuntimeRoute(hostResolved.metadata.route, hostProbe.packageRef, {
      native_tui: () => { throw new Error("host_acp selected native_tui callback"); },
      host_acp: () => { mutations.value += 1; },
    });
    assertUnsupportedRoute(probeRoot, "agentos", mutations);
    assertUnsupportedRoute(probeRoot, "golden-g4-unknown", mutations);

    const stagedPaths = manifests.map((manifest) => manifest.manifestRef);
    if (stagedPaths.some((path) => !existsSync(join(stagingRoot, path)))) {
      throw new Error("staged QA closure manifest enumeration is incomplete");
    }
    console.log(
      `golden-g4-retired-route: PASS refs=${JSON.stringify(refs)} ` +
        `routes=${JSON.stringify(Object.fromEntries(routeCounts))} ` +
        `unsupported=agentos,golden-g4-unknown callbacks=${mutations.value}`,
    );
    return { ok: true };
  } catch (error) {
    console.error(
      `golden-g4-retired-route: ${error instanceof Error ? error.message : String(error)}`,
    );
    return { ok: false };
  } finally {
    rmSync(stagingRoot, { recursive: true, force: true });
    rmSync(probeRoot, { recursive: true, force: true });
  }
}

if (import.meta.main) {
  process.exit(runGoldenG4RetiredRouteGate().ok ? 0 : 1);
}
