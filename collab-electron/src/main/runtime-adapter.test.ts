import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  allowsPtyRoleDelivery,
  expandRuntimeAdapterArgv,
  parseRuntimeAdapterMetadata,
  resolveRuntimeAdapterMetadata,
} from "./runtime-adapter";

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function hermesMetadata(): Record<string, unknown> {
  return {
    name: "hermes",
    route: "native_tui",
    package: "hermes.aospkg",
    argv: ["--tui"],
    profile_argv: ["-p", "{runtime_profile}", "--tui"],
    peer_delivery: {
      mode: "pty_role",
      runtime_profiles: ["qf-orchestrator", "qf-worker"],
    },
  };
}

describe("runtime adapter metadata", () => {
  test("expands one complete runtime-profile token and keeps null on base argv", () => {
    const metadata = parseRuntimeAdapterMetadata(hermesMetadata());
    expect(expandRuntimeAdapterArgv(metadata, null)).toEqual(["--tui"]);
    expect(expandRuntimeAdapterArgv(metadata, "qf-worker")).toEqual([
      "-p",
      "qf-worker",
      "--tui",
    ]);
    expect(allowsPtyRoleDelivery(metadata, null)).toBe(false);
    expect(allowsPtyRoleDelivery(metadata, "other")).toBe(false);
    expect(allowsPtyRoleDelivery(metadata, "qf-worker")).toBe(true);
  });

  test("rejects missing, repeated, partial, and unknown placeholders", () => {
    for (const profile_argv of [
      ["-p", "value", "--tui"],
      ["{runtime_profile}", "{runtime_profile}"],
      ["-p={runtime_profile}", "--tui"],
      ["{other}", "{runtime_profile}"],
    ]) {
      expect(() =>
        parseRuntimeAdapterMetadata({ ...hermesMetadata(), profile_argv })
      ).toThrow(/placeholder|exactly one/);
    }
  });

  test("rejects unknown keys and duplicate peer selectors", () => {
    expect(() =>
      parseRuntimeAdapterMetadata({ ...hermesMetadata(), command: "hermes" })
    ).toThrow(/unknown key/);
    expect(() =>
      parseRuntimeAdapterMetadata({
        ...hermesMetadata(),
        peer_delivery: {
          mode: "pty_role",
          runtime_profiles: ["qf-worker", "qf-worker"],
        },
      })
    ).toThrow(/must be unique/);
  });

  test("resolves sibling metadata and binds it to the package filename", () => {
    const root = mkdtempSync(join(tmpdir(), "qf-runtime-adapter-"));
    roots.push(root);
    const packed = join(root, "species/hermes/packed");
    mkdirSync(packed, { recursive: true });
    writeFileSync(join(packed, "hermes.aospkg"), "package");
    writeFileSync(
      join(packed, "hermes.meta.json"),
      `${JSON.stringify(hermesMetadata())}\n`,
    );

    const resolved = resolveRuntimeAdapterMetadata(
      "species/hermes/packed/hermes.aospkg",
      root,
    );
    expect(resolved.metadata.adapterId).toBe("hermes");
    expect(resolved.metadata.packageName).toBe("hermes.aospkg");
  });
});
