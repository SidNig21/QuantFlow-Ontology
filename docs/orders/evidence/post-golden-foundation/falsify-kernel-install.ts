import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { WINDOWS_RELEASE_STAGES } from "../../../../qa/verify-release.ts";

// A dependency-free source copy, never a Git checkout and never shared node_modules.
const root = resolve(import.meta.dir, "../../../..");
const isolated = mkdtempSync(join(tmpdir(), "qf-foundation-kernel-"));
const output: string[] = [`isolated-root: ${isolated}`];
function run(args: string[], cwd: string): {status: number | null; output: string} {
  const result = spawnSync(process.execPath, args, {cwd, encoding: "utf8", env: {...process.env, BUN_INSTALL_CACHE_DIR: join(isolated,"install-cache")}, maxBuffer:16*1024*1024});
  const text = `${result.stdout ?? ""}${result.stderr ?? ""}${result.error ? String(result.error) : ""}`;
  output.push(`command: bun ${args.join(" ")}\ncwd: ${cwd}\nexit: ${result.status}\n${text}`);
  return {status: result.status, output: text};
}
try {
  const paths = execFileSync("git", ["ls-files", "packages/qf-kernel", "qf-kernel-schema"], {cwd:root,encoding:"utf8"}).trim().split(/\r?\n/);
  for(const path of paths) {
    const dest = join(isolated,path); mkdirSync(dirname(dest),{recursive:true}); copyFileSync(join(root,path),dest);
  }
  if(existsSync(join(isolated,"packages/qf-kernel/node_modules"))) throw Error("not cold");
  const command = ["test","packages/qf-kernel/src/r10-dataset-integrity.test.ts"];
  const red = run(command,isolated);
  if(red.status===0 || !/Cannot find (?:package|module).*?(?:zod|qf-kernel-schema)/s.test(red.output)) throw Error("missing install did not cause the real dependency failure");
  const stage = WINDOWS_RELEASE_STAGES.find(stage=>stage.id==="install-kernel");
  if(!stage) throw Error("canonical install-kernel absent");
  const install = run(stage.command.slice(1),join(isolated,stage.cwd));
  if(install.status!==0) throw Error("restored canonical install failed");
  if(run(command,isolated).status!==0) throw Error("real Kernel test control failed");
  output.push("missing install-kernel: RED (real dependency failure); restored frozen stage: GREEN; no schema install");
} finally {
  if(!resolve(isolated).startsWith(resolve(tmpdir())+"\\") || !isolated.includes("qf-foundation-kernel-")) throw Error("unsafe cleanup target");
  rmSync(isolated,{recursive:true,force:true});
  output.push(`cleanup: owned roots remaining=${existsSync(isolated)?1:0}; synchronous children completed`);
  writeFileSync(join(import.meta.dir,"kernel-install-falsifier.log"),output.join("\n")+"\n");
  console.log(output.join("\n"));
}
