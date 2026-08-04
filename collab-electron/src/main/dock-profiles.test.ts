import { afterEach, describe, expect, test } from "bun:test";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  bootstrapDockProfiles,
  discoverDockProfileManifests,
  getMissingHermesDockDiagnostic,
  type DockProfileRegistration,
} from "./dock-profiles";

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function seedAdapter(
  root: string,
  base: "species/hermes" | "tools/runtime-proof" | "tools/qf-proof-agent",
  adapterId: "hermes" | "qf-toolloop" | "qf-proof-agent",
  profiles: Array<{
    id: string;
    role: string;
    runtime_profile: string | null;
    system_prompt_ref: string | null;
    capability_groups: Array<"market.read" | "desk.orchestrate">;
  }>,
): void {
  const packageName = adapterId === "hermes"
    ? "hermes.aospkg"
    : adapterId === "qf-toolloop"
      ? "qf-toolloop.aospkg"
      : "qf-proof-agent.aospkg";
  const packed = join(root, base, "packed");
  mkdirSync(packed, { recursive: true });
  writeFileSync(join(packed, packageName), "package");
  writeFileSync(
    join(packed, `${adapterId}.meta.json`),
    `${JSON.stringify({
      name: adapterId,
      route: adapterId === "qf-toolloop" ? "agentos" : "native_tui",
      package: packageName,
      ...(adapterId === "hermes"
        ? {
            argv: ["--tui"],
            profile_argv: ["-p", "{runtime_profile}", "--tui"],
          }
        : adapterId === "qf-proof-agent"
          ? {
              command: "node",
              entrypoint: "qf-proof-agent.mjs",
              profile_argv: ["--profile", "{runtime_profile}"],
            }
          : {}),
    })}\n`,
  );
  writeFileSync(
    join(root, base, "dock-profiles.json"),
    `${JSON.stringify({
      schema_version: 1,
      adapter: { id: adapterId, package: `packed/${packageName}` },
      profiles,
    })}\n`,
  );
}

function seedRequired(root: string): void {
  seedAdapter(root, "species/hermes", "hermes", [
    {
      id: "hermes-orchestrator",
      role: "orchestrator",
      runtime_profile: "qf-orchestrator",
      system_prompt_ref: "prompts/orchestrator.md",
      capability_groups: ["desk.orchestrate"],
    },
    {
      id: "hermes-worker",
      role: "worker",
      runtime_profile: "qf-worker",
      system_prompt_ref: "prompts/worker.md",
      capability_groups: ["market.read"],
    },
    {
      id: "hermes-worker-2",
      role: "worker2",
      runtime_profile: "qf-worker-2",
      system_prompt_ref: "prompts/worker.md",
      capability_groups: ["market.read"],
    },
  ]);
}

function seedQaFixtures(root: string): void {
  seedAdapter(root, "tools/qf-proof-agent", "qf-proof-agent", [
    {
      id: "qf-proof-orchestrator",
      role: "orchestrator",
      runtime_profile: "qf-proof-orchestrator",
      system_prompt_ref: "prompts/orchestrator.md",
      capability_groups: ["desk.orchestrate"],
    },
    {
      id: "qf-proof-worker",
      role: "worker",
      runtime_profile: "qf-proof-worker",
      system_prompt_ref: "prompts/worker.md",
      capability_groups: ["market.read"],
    },
  ]);
  seedAdapter(root, "tools/runtime-proof", "qf-toolloop", [
    {
      id: "qf-toolloop",
      role: "toolloop-proof",
      runtime_profile: null,
      system_prompt_ref: null,
      capability_groups: [],
    },
  ]);
}

function freshRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "qf-dock-profiles-"));
  roots.push(root);
  seedRequired(root);
  return root;
}

function freshQaRoot(): string {
  const root = freshRoot();
  seedQaFixtures(root);
  return root;
}

describe("Dock profile manifests", () => {
  test("production discovery succeeds without proof packages", () => {
    const manifests = discoverDockProfileManifests(freshRoot());
    const profiles = manifests.flatMap((manifest) => manifest.profiles);
    expect(profiles.map((profile) => profile.name).sort()).toEqual([
      "hermes-orchestrator",
      "hermes-worker",
      "hermes-worker-2",
    ]);
    expect(
      profiles.filter((profile) => profile.name.startsWith("hermes-")).every(
        (profile) => profile.package_ref === "species/hermes/packed/hermes.aospkg",
      ),
    ).toBe(true);
  });

  test("QA discovery explicitly includes proof fixtures", () => {
    const manifests = discoverDockProfileManifests(freshQaRoot(), { qaMode: true });
    expect(manifests.flatMap((manifest) => manifest.profiles).map((profile) => profile.name).sort()).toEqual([
      "hermes-orchestrator",
      "hermes-worker",
      "hermes-worker-2",
      "qf-proof-orchestrator",
      "qf-proof-worker",
      "qf-toolloop",
    ]);
  });

  test("QA discovery still fails when a required fixture package is missing", () => {
    const root = freshQaRoot();
    rmSync(join(root, "tools/runtime-proof/packed/qf-toolloop.aospkg"));
    expect(() => discoverDockProfileManifests(root, { qaMode: true })).toThrow(
      /Dock profile runtime package missing/,
    );
  });

  test("projects only exact missing Hermes Dock state as an adapter diagnostic", () => {
    const root = freshRoot();
    rmSync(join(root, "species/hermes/dock-profiles.json"));
    expect(getMissingHermesDockDiagnostic(root)).toMatchObject({
      id: "hermes-dock-manifest-missing",
    });

    seedRequired(root);
    rmSync(join(root, "species/hermes/packed/hermes.aospkg"));
    expect(getMissingHermesDockDiagnostic(root)).toMatchObject({
      id: "hermes-dock-package-missing",
    });

    seedRequired(root);
    expect(getMissingHermesDockDiagnostic(root)).toBeNull();
  });

  test("registers once, skips identical rows, and preserves conflicts", () => {
    const rows = new Map<string, Record<string, unknown>>();
    const writes: DockProfileRegistration[] = [];
    const deps = {
      getAgentDefinition: (id: string) => rows.get(id) ?? null,
      executeRegisterAgentDefinition: (input: DockProfileRegistration) => {
        writes.push(input);
        rows.set(input.name, { id: input.name, ...input });
      },
    };
    const root = freshRoot();
    const first = bootstrapDockProfiles(root, deps);
    expect(first.registered).toHaveLength(3);
    expect(first.conflicts).toHaveLength(0);
    expect(writes).toHaveLength(3);

    const second = bootstrapDockProfiles(root, deps);
    expect(second.registered).toHaveLength(0);
    expect(second.skipped).toHaveLength(3);
    expect(writes).toHaveLength(3);

    rows.set("hermes-worker", {
      ...rows.get("hermes-worker"),
      role: "operator-custom-role",
    });
    const third = bootstrapDockProfiles(root, deps);
    expect(third.conflicts.map((conflict) => conflict.definitionId)).toEqual([
      "hermes-worker",
    ]);
    expect(rows.get("hermes-worker")?.role).toBe("operator-custom-role");
    expect(writes).toHaveLength(3);

    const qaRows = new Map<string, Record<string, unknown>>();
    const qaWrites: DockProfileRegistration[] = [];
    const qa = bootstrapDockProfiles(freshQaRoot(), {
      getAgentDefinition: (id: string) => qaRows.get(id) ?? null,
      executeRegisterAgentDefinition: (input: DockProfileRegistration) => {
        qaWrites.push(input);
        qaRows.set(input.name, { id: input.name, ...input });
      },
    }, { qaMode: true });
    expect(qa.registered).toHaveLength(6);
    expect(qaWrites).toHaveLength(6);
  });

  test("validates every manifest before making a Kernel call", () => {
    const root = freshQaRoot();
    const manifest = join(root, "species/hermes/dock-profiles.json");
    const raw = JSON.parse(readFileSync(manifest, "utf8")) as Record<
      string,
      unknown
    >;
    writeFileSync(manifest, `${JSON.stringify({ ...raw, extra: true })}\n`);
    let writes = 0;
    expect(() =>
      bootstrapDockProfiles(root, {
        getAgentDefinition: () => null,
        executeRegisterAgentDefinition: () => {
          writes += 1;
        },
      })
    ).toThrow(/keys must be exactly/);
    expect(writes).toBe(0);
  });

  test("propagates Kernel registration failures", () => {
    expect(() => bootstrapDockProfiles(freshRoot(), {
      getAgentDefinition: () => null,
      executeRegisterAgentDefinition: () => {
        throw new Error("Kernel registration failed");
      },
    })).toThrow("Kernel registration failed");
  });

  test("rejects traversal and duplicate ids", () => {
    const root = freshQaRoot();
    const path = join(root, "species/hermes/dock-profiles.json");
    const base = {
      schema_version: 1,
      adapter: { id: "hermes", package: "../packed/hermes.aospkg" },
      profiles: [
        {
          id: "same",
          role: "worker",
          runtime_profile: "one",
          system_prompt_ref: null,
          capability_groups: ["market.read"],
        },
      ],
    };
    writeFileSync(path, `${JSON.stringify(base)}\n`);
    expect(() => discoverDockProfileManifests(root, { qaMode: true })).toThrow(/normalized relative POSIX/);

    base.adapter.package = "packed/hermes.aospkg";
    base.profiles.push({ ...base.profiles[0]! });
    writeFileSync(path, `${JSON.stringify(base)}\n`);
    expect(() => discoverDockProfileManifests(root, { qaMode: true })).toThrow(/duplicate profile id/);
  });
});
