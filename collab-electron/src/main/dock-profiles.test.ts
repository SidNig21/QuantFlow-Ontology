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
  type DockProfileRegistration,
} from "./dock-profiles";

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function seedAdapter(
  root: string,
  base: "species/hermes" | "tools/runtime-proof",
  adapterId: "hermes" | "qf-toolloop",
  profiles: Array<{
    id: string;
    role: string;
    runtime_profile: string | null;
    system_prompt_ref: string | null;
  }>,
): void {
  const packageName = adapterId === "hermes" ? "hermes.aospkg" : "qf-toolloop.aospkg";
  const packed = join(root, base, "packed");
  mkdirSync(packed, { recursive: true });
  writeFileSync(join(packed, packageName), "package");
  writeFileSync(
    join(packed, `${adapterId}.meta.json`),
    `${JSON.stringify({
      name: adapterId,
      route: adapterId === "hermes" ? "native_tui" : "agentos",
      package: packageName,
      ...(adapterId === "hermes"
        ? {
            argv: ["--tui"],
            profile_argv: ["-p", "{runtime_profile}", "--tui"],
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
      system_prompt_ref: null,
    },
    {
      id: "hermes-worker",
      role: "worker",
      runtime_profile: "qf-worker",
      system_prompt_ref: null,
    },
    {
      id: "hermes-worker-2",
      role: "worker2",
      runtime_profile: "qf-worker-2",
      system_prompt_ref: null,
    },
  ]);
  seedAdapter(root, "tools/runtime-proof", "qf-toolloop", [
    {
      id: "qf-toolloop",
      role: "toolloop-proof",
      runtime_profile: null,
      system_prompt_ref: null,
    },
  ]);
}

function freshRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "qf-dock-profiles-"));
  roots.push(root);
  seedRequired(root);
  return root;
}

describe("Dock profile manifests", () => {
  test("discovers the exact four definitions with derived package refs", () => {
    const manifests = discoverDockProfileManifests(freshRoot());
    const profiles = manifests.flatMap((manifest) => manifest.profiles);
    expect(profiles.map((profile) => profile.name).sort()).toEqual([
      "hermes-orchestrator",
      "hermes-worker",
      "hermes-worker-2",
      "qf-toolloop",
    ]);
    expect(
      profiles.filter((profile) => profile.name.startsWith("hermes-")).every(
        (profile) => profile.package_ref === "species/hermes/packed/hermes.aospkg",
      ),
    ).toBe(true);
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
    expect(first.registered).toHaveLength(4);
    expect(first.conflicts).toHaveLength(0);
    expect(writes).toHaveLength(4);

    const second = bootstrapDockProfiles(root, deps);
    expect(second.registered).toHaveLength(0);
    expect(second.skipped).toHaveLength(4);
    expect(writes).toHaveLength(4);

    rows.set("hermes-worker", {
      ...rows.get("hermes-worker"),
      role: "operator-custom-role",
    });
    const third = bootstrapDockProfiles(root, deps);
    expect(third.conflicts.map((conflict) => conflict.definitionId)).toEqual([
      "hermes-worker",
    ]);
    expect(rows.get("hermes-worker")?.role).toBe("operator-custom-role");
    expect(writes).toHaveLength(4);
  });

  test("validates every manifest before making a Kernel call", () => {
    const root = freshRoot();
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

  test("rejects traversal and duplicate ids", () => {
    const root = freshRoot();
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
        },
      ],
    };
    writeFileSync(path, `${JSON.stringify(base)}\n`);
    expect(() => discoverDockProfileManifests(root)).toThrow(/normalized relative POSIX/);

    base.adapter.package = "packed/hermes.aospkg";
    base.profiles.push({ ...base.profiles[0]! });
    writeFileSync(path, `${JSON.stringify(base)}\n`);
    expect(() => discoverDockProfileManifests(root)).toThrow(/duplicate profile id/);
  });
});
