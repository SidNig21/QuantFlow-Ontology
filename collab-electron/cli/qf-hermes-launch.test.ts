import { createHash } from "node:crypto";
import {
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readlinkSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, test } from "bun:test";

const wrapper = readFileSync(resolve(import.meta.dir, "qf-hermes-launch.sh"), "utf8");

function wslPath(path: string): string {
  return path.replace(/^([A-Za-z]):[\\/]/, (_, drive: string) => `/mnt/${drive.toLowerCase()}/`).replaceAll("\\", "/");
}

describe("Hermes packaged launch wrapper", () => {
  test("requires and uses an isolated profile root", () => {
    expect(wrapper).toContain("QF_QUANTFLOW_HERMES_PROFILE_ROOT");
    expect(wrapper).not.toContain("QF_HERMES_PROFILE_ROOT");
    expect(wrapper).toContain('profile_home="$profile_root/profiles/quantflow-runtime-$seat_id"');
    expect(wrapper).toContain('"$HOME/.hermes/config.yaml"');
    expect(wrapper).toContain('ln -s "$auth_source" "$auth_link"');
    expect(wrapper).toContain('auth_source="$HOME/.hermes/auth.json"');
    expect(wrapper).toContain("QF_LAUNCH_READY_NONCE");
    expect(wrapper).toContain("QF_LAUNCH_READY %s");
    expect(wrapper).toContain("QF_LAUNCH_COMMIT %s");
    expect(wrapper).toContain("unset QF_LAUNCH_READY_NONCE");
    expect(wrapper).toContain("--quantflow-mission-oneshot");
    expect(wrapper).toContain("--quantflow-task-oneshot");
    expect(wrapper).toContain('IFS= read -r activation');
    expect(wrapper).toContain('exec "$hermes_command" -z');
  });

  test("reports missing Hermes prerequisites without writing a profile", () => {
    expect(wrapper).toContain("QuantFlow Hermes unavailable: install Hermes");
    expect(wrapper).toContain("an isolated Hermes profile root is not configured");
    expect(wrapper).toContain("isolated auth.json path is not a symlink");
    expect(wrapper).not.toContain('cp "$HOME/.hermes/auth.json"');
  });

  test("waits for the founder mission and hands it to Hermes as one supported prompt", () => {
    const root = mkdtempSync(join(tmpdir(), "qf-hermes-oneshot-"));
    try {
      const wrapperPath = resolve(import.meta.dir, "qf-hermes-launch.sh");
      const isolatedRoot = join(root, "isolated-hermes");
      const activation =
        'QUANTFLOW_MISSION {"contract":"qf.mission.activation.v1","mission_id":"mission-test","question":"What changed?"}\r\n';
      const args = process.platform === "win32"
        ? [
            "-d", "Ubuntu", "--", "env",
            `HOME=${wslPath(root)}`,
            "QF_AGENT_SESSION_ID=seat-test",
            "QF_LAUNCH_READY_NONCE=test-ready",
            `QF_QUANTFLOW_HERMES_PROFILE_ROOT=${wslPath(isolatedRoot)}`,
            "bash", wslPath(wrapperPath), "/tmp/qf-bridge.mjs", "/tmp/qf-ontology-bridge.mjs",
            "echo", "--quantflow-mission-oneshot", "--tui",
          ]
        : [
            wrapperPath, "/tmp/qf-bridge.mjs", "/tmp/qf-ontology-bridge.mjs",
            "echo", "--quantflow-mission-oneshot", "--tui",
          ];
      const result = spawnSync(process.platform === "win32" ? "wsl.exe" : "bash", args, {
        input: activation,
        encoding: "utf8",
        env: process.platform === "win32"
          ? process.env
          : {
              ...process.env,
              HOME: root,
              QF_AGENT_SESSION_ID: "seat-test",
              QF_LAUNCH_READY_NONCE: "test-ready",
              QF_QUANTFLOW_HERMES_PROFILE_ROOT: isolatedRoot,
            },
      });
      expect(result.status).toBe(0);
      expect(result.stdout).toContain("QF_LAUNCH_COMMIT test-ready");
      expect(result.stdout).toContain("-z You are the QuantFlow research orchestrator");
      expect(result.stdout).toContain("mission-test");
      expect(result.stdout).not.toContain("-z --tui");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("waits for a delegated task before starting a one-shot worker", () => {
    const root = mkdtempSync(join(tmpdir(), "qf-hermes-task-oneshot-"));
    try {
      const wrapperPath = resolve(import.meta.dir, "qf-hermes-launch.sh");
      const isolatedRoot = join(root, "isolated-hermes");
      const task =
        "[QuantFlow TASK task-test from orchestrator] Inspect the available market evidence, then call send_result.\r\n";
      const args = process.platform === "win32"
        ? [
            "-d", "Ubuntu", "--", "env",
            `HOME=${wslPath(root)}`,
            "QF_AGENT_SESSION_ID=worker-test",
            "QF_LAUNCH_READY_NONCE=test-ready",
            `QF_QUANTFLOW_HERMES_PROFILE_ROOT=${wslPath(isolatedRoot)}`,
            "bash", wslPath(wrapperPath), "/tmp/qf-bridge.mjs", "/tmp/qf-ontology-bridge.mjs",
            "echo", "--quantflow-task-oneshot", "--tui",
          ]
        : [
            wrapperPath, "/tmp/qf-bridge.mjs", "/tmp/qf-ontology-bridge.mjs",
            "echo", "--quantflow-task-oneshot", "--tui",
          ];
      const result = spawnSync(process.platform === "win32" ? "wsl.exe" : "bash", args, {
        input: task,
        encoding: "utf8",
        env: process.platform === "win32"
          ? process.env
          : {
              ...process.env,
              HOME: root,
              QF_AGENT_SESSION_ID: "worker-test",
              QF_LAUNCH_READY_NONCE: "test-ready",
              QF_QUANTFLOW_HERMES_PROFILE_ROOT: isolatedRoot,
            },
      });
      expect(result.status).toBe(0);
      expect(result.stdout).toContain("QF_LAUNCH_COMMIT test-ready");
      expect(result.stdout).toContain("-z You are the QuantFlow research worker");
      expect(result.stdout).toContain("task-test");
      expect(result.stdout).not.toContain("-z --tui");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("starts a delegated critic with the independent Evaluation contract", () => {
    const root = mkdtempSync(join(tmpdir(), "qf-hermes-critic-oneshot-"));
    try {
      const wrapperPath = resolve(import.meta.dir, "qf-hermes-launch.sh");
      const isolatedRoot = join(root, "isolated-hermes");
      const task =
        "[QuantFlow TASK task-critic from orchestrator] Review run-1 and result-1.\r\n";
      const args = process.platform === "win32"
        ? [
            "-d", "Ubuntu", "--", "env",
            `HOME=${wslPath(root)}`,
            "QF_AGENT_SESSION_ID=critic-test",
            "QF_PEER_ROLE=critic",
            "QF_LAUNCH_READY_NONCE=test-ready",
            `QF_QUANTFLOW_HERMES_PROFILE_ROOT=${wslPath(isolatedRoot)}`,
            "bash", wslPath(wrapperPath), "/tmp/qf-bridge.mjs", "/tmp/qf-ontology-bridge.mjs",
            "echo", "--quantflow-task-oneshot", "--tui",
          ]
        : [
            wrapperPath, "/tmp/qf-bridge.mjs", "/tmp/qf-ontology-bridge.mjs",
            "echo", "--quantflow-task-oneshot", "--tui",
          ];
      const result = spawnSync(process.platform === "win32" ? "wsl.exe" : "bash", args, {
        input: task,
        encoding: "utf8",
        env: process.platform === "win32"
          ? process.env
          : {
              ...process.env,
              HOME: root,
              QF_AGENT_SESSION_ID: "critic-test",
              QF_PEER_ROLE: "critic",
              QF_LAUNCH_READY_NONCE: "test-ready",
              QF_QUANTFLOW_HERMES_PROFILE_ROOT: isolatedRoot,
            },
      });
      expect(result.status).toBe(0);
      expect(result.stdout).toContain("-z You are the independent QuantFlow research critic");
      expect(result.stdout).toContain("qf_record_evaluation");
      expect(result.stdout).toContain("task-critic");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("keeps founder config/auth untouched while using isolated profile shape", () => {
    const root = mkdtempSync(join(tmpdir(), "qf-hermes-launch-"));
    try {
      const founderHome = join(root, "founder-home");
      const hermesHome = join(founderHome, ".hermes");
      const isolatedRoot = join(root, "isolated-hermes");
      mkdirSync(hermesHome, { recursive: true });
      const founderConfig = join(hermesHome, "config.yaml");
      const founderAuth = join(hermesHome, "auth.json");
      writeFileSync(founderConfig, "model:\n  name: test-only\n");
      writeFileSync(founderAuth, "opaque-test-auth\n");
      const configHash = createHash("sha256")
        .update(readFileSync(founderConfig))
        .digest("hex");
      const authBefore = statSync(founderAuth);
      const wrapperPath = resolve(import.meta.dir, "qf-hermes-launch.sh");
      const hermesArgs = process.platform === "win32"
        ? [
            "-d", "Ubuntu", "--", "env",
            `HOME=${wslPath(founderHome)}`,
            "QF_AGENT_SESSION_ID=seat/test",
            "QF_LAUNCH_READY_NONCE=test-ready",
            `QF_HERMES_PROFILE_ROOT=${wslPath(join(founderHome, ".hermes", "redirect"))}`,
            `QF_QUANTFLOW_HERMES_PROFILE_ROOT=${wslPath(isolatedRoot)}`,
            "bash", wslPath(wrapperPath), "/tmp/qf-bridge.mjs", "/tmp/qf-ontology-bridge.mjs", "sh", "-c", "exit 0",
          ]
        : [wrapperPath, "/tmp/qf-bridge.mjs", "/tmp/qf-ontology-bridge.mjs", "sh", "-c", "exit 0"];
      const result = spawnSync(
        process.platform === "win32" ? "wsl.exe" : "bash",
        hermesArgs,
        process.platform === "win32"
          ? { encoding: "utf8" }
          : {
              cwd: resolve(import.meta.dir, ".."),
              env: {
                ...process.env,
                HOME: founderHome,
                QF_AGENT_SESSION_ID: "seat/test",
                QF_LAUNCH_READY_NONCE: "test-ready",
                QF_HERMES_PROFILE_ROOT: join(founderHome, ".hermes", "redirect"),
                QF_QUANTFLOW_HERMES_PROFILE_ROOT: isolatedRoot,
              },
              encoding: "utf8",
            },
      );
      expect(result.status).toBe(0);
      const profileHome = join(isolatedRoot, "profiles", "quantflow-runtime-seat_test");
      if (process.platform === "win32") {
        const linkPath = wslPath(join(isolatedRoot, "auth.json"));
        const linkCheck = spawnSync("wsl.exe", ["-d", "Ubuntu", "--", "test", "-L", linkPath]);
        expect(linkCheck.status).toBe(0);
        const linkTarget = spawnSync("wsl.exe", ["-d", "Ubuntu", "--", "readlink", linkPath], { encoding: "utf8" });
        expect(linkTarget.status).toBe(0);
        expect(linkTarget.stdout.trim()).toContain("founder-home/.hermes/auth.json");
      } else {
        expect(lstatSync(join(isolatedRoot, "auth.json")).isSymbolicLink()).toBe(true);
        expect(readlinkSync(join(isolatedRoot, "auth.json"))).toContain("founder-home/.hermes/auth.json");
      }
      expect(createHash("sha256").update(readFileSync(founderConfig)).digest("hex")).toBe(configHash);
      const authAfter = statSync(founderAuth);
      expect(authAfter.size).toBe(authBefore.size);
      expect(authAfter.mtimeMs).toBe(authBefore.mtimeMs);
      if (process.platform === "win32") {
        const profileCheck = spawnSync(
          "wsl.exe",
          ["-d", "Ubuntu", "--", "test", "-f", `${wslPath(join(profileHome, "config.yaml"))}`],
        );
        expect(profileCheck.status).toBe(0);
      } else {
        expect(readFileSync(join(profileHome, "config.yaml"), "utf8")).toContain("quantflow-collaboration");
      expect(readFileSync(join(profileHome, "config.yaml"), "utf8")).toContain("quantflow-ontology");
      }
      expect(() => lstatSync(join(founderHome, ".hermes", "profiles"))).toThrow();
      expect(() => lstatSync(join(founderHome, ".hermes", "redirect"))).toThrow();
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
