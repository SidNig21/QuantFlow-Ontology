import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root=resolve(import.meta.dir,"../../../..");
const next=join(root,"docs/orders/NEXT.md");
const route=join(root,"docs/history/orders/GOLDEN-RUN.md");
const order=join(root,"docs/orders/WO-POST-GOLDEN-FOUNDATION.md");
const archive=join(root,"docs/history/orders/WO-POST-GOLDEN-FOUNDATION.md");
const originalNext=readFileSync(next);
const originalRoute=readFileSync(route);
const adr=join(root,"docs/adr/0004-repository-golden-baseline.md");
const originalAdr=readFileSync(adr);
const log:string[]=[];
function command(args:string[],expected:number,env:Record<string,string>={}) {
  const r=spawnSync(process.execPath,args,{cwd:root,encoding:"utf8",env:{...process.env,...env},maxBuffer:32*1024*1024});
  log.push(`command: ${Object.entries(env).map(([k,v])=>`${k}=${v} `).join("")}bun ${args.join(" ")}\nexit: ${r.status}\n${r.stdout}${r.stderr}`);
  if(r.status!==expected) throw Error(`unexpected exit for ${args.join(" ")}: ${r.status}, expected ${expected}`);
}
const closed="# NEXT — CLOSED\n\nstatus: CLOSED\nactive-order: none\nbuilder-authority: CLOSED\nrouter-authority: CLOSED\ng11-status: CLOSED\nr18-status: FROZEN / SUPERSEDED\n";
let moved=false;
let injected=false;
try {
  // Exercise real file-reading boundaries, then restore exact bytes before writing evidence.
  writeFileSync(next,closed);
  command(["qa/run.ts","rung-ladder"],0);
  writeFileSync(route,originalRoute.toString().replace("| R18 | frozen |","| R18 | active |"));
  command(["qa/run.ts","rung-ladder"],1);
  writeFileSync(route,originalRoute);
  writeFileSync(next,closed.replace("builder-authority: CLOSED","builder-authority: OPEN"));
  command(["qa/run.ts","rung-ladder"],1);
  writeFileSync(next,closed);
  command(["qa/run.ts","rung-ladder"],0);
  if(existsSync(order)) {
    if(!resolve(order).startsWith(root+"\\")||!resolve(archive).startsWith(root+"\\")||existsSync(archive)) throw Error("unsafe temporary order move");
    renameSync(order,archive); moved=true;
  }
  command(["qa/run.ts","repo-shape"],0);
  // A closed order reappearing at the active top level must fail.
  if(moved) { renameSync(archive,order); moved=false; }
  else { writeFileSync(order,readFileSync(archive)); injected=true; }
  command(["qa/run.ts","repo-shape"],1);
  if(injected) { unlinkSync(order); injected=false; }
  else { renameSync(order,archive); moved=true; }
  command(["qa/run.ts","repo-shape"],0);
  command(["docs/orders/evidence/post-golden-foundation/verify-foundation.ts"],0);
  command(["docs/orders/evidence/post-golden-foundation/verify-foundation.ts","--falsify-archive"],1);
  command(["docs/orders/evidence/post-golden-foundation/verify-foundation.ts"],0);
  command(["qa/run.ts","golden-g11-authority"],0);
  const split=originalAdr.indexOf(Buffer.from("\n## Realized consequences — 2026-09-05\n"));
  if(split<0) throw Error("authorized ADR appendix absent");
  const prior=originalAdr.subarray(0,split), appendix=originalAdr.subarray(split);
  for(const [name,mutant] of [
    ["original mutation",Buffer.concat([Buffer.from("!"),originalAdr.subarray(1)])],
    ["original deletion",originalAdr.subarray(1)],
    ["original duplication",Buffer.concat([prior,prior,appendix])],
    ["original reordering",Buffer.concat([prior.subarray(1,2),prior.subarray(0,1),prior.subarray(2),appendix])],
    ["appendix mutation",Buffer.concat([prior,Buffer.from("!"),appendix.subarray(1)])],
    ["appendix deletion",prior],
    ["appendix duplication",Buffer.concat([originalAdr,appendix])],
    ["appendix reordering",Buffer.concat([appendix,prior])],
  ] as const){
    log.push(`ADR bait: ${name}`); writeFileSync(adr,mutant);
    command(["qa/run.ts","golden-g11-authority"],1);
    if(!log.at(-1)?.includes("F04 immutable_hash_mismatch")) throw Error("ADR bait failed outside F04");
    writeFileSync(adr,originalAdr);
    command(["qa/run.ts","golden-g11-authority"],0);
  }
  writeFileSync(next,closed.replace("g11-status: CLOSED","g11-status: OPEN"));
  command(["qa/run.ts","golden-g11-authority"],1);
  writeFileSync(next,closed);
  command(["qa/run.ts","golden-g11-authority"],0);
  for(let n=1;n<=10;n++) command(["qa/run.ts","golden-g11-authority"],1,{QF_G11_FALSIFY:`F${String(n).padStart(2,"0")}`});
  command(["qa/run.ts","golden-g11-authority"],0);
} finally {
  writeFileSync(next,originalNext); writeFileSync(route,originalRoute); writeFileSync(adr,originalAdr);
  if(moved) renameSync(archive,order);
  if(injected) unlinkSync(order);
  if(!process.argv.includes("--stdout-only")) writeFileSync(join(import.meta.dir,"authority-falsifiers.log"),log.join("\n").trimEnd()+"\n");
  console.log(log.join("\n"));
}
