import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dir, "../../../..");
const base = "80883799d5c845339a08f6430360b471c3d0eb09";
const git = (...args: string[]) => execFileSync("git",args,{cwd:root,maxBuffer:128*1024*1024});
const hash = (b: Buffer) => createHash("sha256").update(b).digest("hex");
const manifest = JSON.parse(readFileSync(join(import.meta.dir,"moves.json"),"utf8"));
const assert = (ok: boolean, why: string) => { if(!ok) throw Error(why); };
try {
  assert(manifest.base===base,"manifest base drift");
  const paths=git("ls-tree","-r","--name-only",base).toString().trim().split("\n");
  const sources=paths.filter(p=>/^docs\/orders\/(?!NEXT\.md$|PROTOCOL\.md$)[^/]+\.md$/.test(p)||p.startsWith("design/glacier/")||["docs/plans/INSTITUTIONAL-BUILD-PLAN.md","docs/proposals/V2-SCOPE.md"].includes(p));
  assert(sources.length===52 && manifest.moves.length===52,"move census drift");
  assert(new Set(manifest.moves.map((m: any)=>m.source)).size===52 && new Set(manifest.moves.map((m: any)=>m.destination)).size===52,"move uniqueness drift");
  if(process.argv.includes("--falsify-archive")) manifest.moves[0].after="0".repeat(64);
  for(const move of manifest.moves) {
    assert(sources.includes(move.source),"unexpected source");
    const expectedDestination=move.source.startsWith("design/")?move.source.replace("design/","docs/history/design/"):move.source.replace("docs/","docs/history/");
    assert(move.destination===expectedDestination,"destination drift");
    assert(!existsSync(join(root,move.source)),`old source returned ${move.source}`);
    const before=git("show",`${base}:${move.source}`);
    assert(move.blob===git("rev-parse",`${base}:${move.source}`).toString().trim() && move.before===hash(before),`original identity drift ${move.source}`);
    let expected=before;
    if(move.source==="docs/orders/GOLDEN-RUN.md") expected=Buffer.from(before.toString().replace(/^(# [^\n]+\n)/,'$1\nstatus: HISTORICAL — completed Golden route; post-R17 sequence superseded by docs/plans/OFFICIAL-ROADMAP.md on 2026-09-03; not build authority\n').replace('| R18 | active |','| R18 | frozen |'));
    if(move.source==="docs/plans/INSTITUTIONAL-BUILD-PLAN.md") expected=Buffer.from(before.toString().replace(/^status:.*$/m,'status: HISTORICAL — pre-Golden R18–R25 route; superseded by docs/plans/OFFICIAL-ROADMAP.md on 2026-09-03; R18 frozen by ADR-0004'));
    if(move.source==="docs/proposals/V2-SCOPE.md") expected=Buffer.from(before.toString().replace(/^status:.*$/m,'status: HISTORICAL — never approved; Golden route won; superseded by docs/plans/OFFICIAL-ROADMAP.md'));
    assert(move.after===hash(expected) && readFileSync(join(root,move.destination)).equals(expected),`archive hash/authorized delta mismatch ${move.destination}`);
  }
  const evidencePaths=paths.filter(p=>p.startsWith("docs/orders/evidence/"));
  assert(evidencePaths.length===568,"original evidence census drift");
  const changedEvidence=git("diff","--name-only",base,"--","docs/orders/evidence",":(exclude)docs/orders/evidence/post-golden-foundation").toString().trim();
  assert(changedEvidence==="","existing evidence mutated: "+changedEvidence);
  const inventory=readFileSync(join(import.meta.dir,"existing-evidence.tsv"),"utf8").trim().split("\n").slice(1);
  const originalRows=git("ls-tree","-r",base,"docs/orders/evidence").toString().trim().split("\n").map(row=>{const [meta,path]=row.split("\t");return `${path}\t${meta!.split(" ")[2]}`;});
  assert(JSON.stringify(inventory)===JSON.stringify(originalRows),"frozen evidence inventory drift");
  const ledger=readFileSync(join(root,"docs/history/orders/NEXT-post-golden-ab40524d.md"));
  assert(hash(ledger)==="c355555aedbbf15e143e21ac6166baf6386329043da741d237a010899a2d68ac","preserved NEXT ledger drift");
  for(const name of ["OFFICIAL-ROADMAP","INSTITUTION-CONTRACTS","PRODUCT-SURFACE-AND-WORKFLOW-ARCHITECTURE","DEMO-SPEC"]){
    const category=["OFFICIAL-ROADMAP","INSTITUTION-CONTRACTS"].includes(name)?"orders":"plans";
    assert(readFileSync(join(root,`docs/plans/${name}.md`)).equals(git("show",`13cf85ee:docs/${category}/${name}.md`)),"approved canonical content drift: "+name);
  }
  if(manifest.qualificationOrder) {
    const order=manifest.qualificationOrder;
    assert(order.source==="docs/orders/WO-POST-GOLDEN-FOUNDATION.md" && order.destination==="docs/history/orders/WO-POST-GOLDEN-FOUNDATION.md" && order.originalGitBlob===null,"qualification order provenance drift");
    assert(!existsSync(join(root,order.source)) && hash(readFileSync(join(root,order.destination)))===order.sha256.toLowerCase(),"qualification order move/hash drift");
  }
  console.log("foundation-preservation: PASS moves=52 byte-exact=49 authorized-annotations=3 existing-evidence=568 canonical-documents=4 byte-exact-from=13cf85ee preserved-NEXT-hash=C355555AEDBBF15E143E21AC6166BAF6386329043DA741D237A010899A2D68AC");
} catch(error) {
  console.error("foundation-preservation: RED "+String(error)); process.exitCode=1;
}
