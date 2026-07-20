import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const REPO = "/home/sidnig21/QuantFlow-Ontology";
const ELECDIR = join(REPO, "collab-electron");
const OUT_PNG = join(REPO, "species/critic-mock/evidence/dock.png");
const LOG = "/tmp/wo008-dock.txt";
const lines = [];
const log = (...a) => {
  const s = a.map(String).join(" ");
  console.log(s);
  lines.push(s);
};

mkdirSync(join(REPO, "species/critic-mock/evidence"), { recursive: true });

const electronBin = join(ELECDIR, "node_modules/electron/dist/electron");
const child = spawn(
  electronBin,
  ["--no-sandbox", "--ozone-platform=x11", "--disable-gpu", "--remote-debugging-port=9222", "."],
  {
    cwd: ELECDIR,
    env: {
      ...process.env,
      HOME: join(REPO, ".wo008-home"),
      COLLAB_DEV_WORKTREE_ROOT: ELECDIR,
      ELECTRON_DISABLE_SANDBOX: "1",
      ELECTRON_OZONE_PLATFORM_HINT: "x11",
      DISPLAY: process.env.DISPLAY || ":1",
      VITE_DEV_SERVER_URL: "http://localhost:5173/",
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
// drop ELECTRON_RUN_AS_NODE if present
delete child.spawnargs; // noop safety
log("electron_pid", String(child.pid));
child.stdout.on("data", (d) => process.stdout.write(d));
child.stderr.on("data", (d) => process.stderr.write(d));

async function waitCdp(ms = 60000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    try {
      const r = await fetch("http://127.0.0.1:9222/json/version");
      if (r.ok) return true;
    } catch {}
    await Bun.sleep(400);
  }
  return false;
}

function cdp(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let nextId = 1;
  const pending = new Map();
  const ready = new Promise((resolve, reject) => {
    ws.addEventListener("open", () => resolve());
    ws.addEventListener("error", (e) => reject(e));
  });
  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(String(ev.data));
    if (msg.id != null && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
    }
  });
  async function send(method, params = {}) {
    await ready;
    const id = nextId++;
    const p = new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
    ws.send(JSON.stringify({ id, method, params }));
    return p;
  }
  return { send, close: () => ws.close(), ready };
}

try {
  const up = await waitCdp();
  if (!up) throw new Error("CDP did not come up");
  log("CDP_UP");
  let shell = null;
  let targets = [];
  for (let i = 0; i < 60; i++) {
    targets = await (await fetch("http://127.0.0.1:9222/json/list")).json();
    shell = targets.find((t) => (t.url || "").includes("/shell/") || t.title === "Collaborator");
    if (shell?.webSocketDebuggerUrl) break;
    // any page with shellApi later; keep waiting for window creation
    if (targets.length) log("targets_partial", String(i), JSON.stringify(targets.map((t) => ({ title: t.title, url: t.url }))));
    await Bun.sleep(500);
  }
  log("targets", JSON.stringify(targets.map((t) => ({ title: t.title, url: t.url }))));
  if (!shell?.webSocketDebuggerUrl) throw new Error("shell target missing after wait");

  const client = cdp(shell.webSocketDebuggerUrl);
  await client.ready;
  await client.send("Page.enable");
  await client.send("Runtime.enable");

  const spawnCancel = await client.send("Runtime.evaluate", {
    expression: `(async () => {
      const defsRes = await window.shellApi.qf.listDefinitions();
      const defs = defsRes?.definitions || [];
      const species = "critic-mock";
      const spawned = await window.shellApi.qf.spawnSession({
        species,
        prompt: "WO-008 dock proof: reply with one short critique sentence.",
      });
      let id =
        spawned?.result?.sessionId ||
        spawned?.result?.id ||
        spawned?.result?.session?.id ||
        spawned?.sessionId ||
        spawned?.id ||
        null;
      // If spawn returned oddly, pick newest running critic-mock
      const pick = async () => {
        const listS = await window.shellApi.qf.listSessions();
        const sessions = listS?.sessions || [];
        const running = sessions.filter((s) => s.label === "critic-mock" && (s.status === "running" || s.status === "starting" || s.status === "blocked"));
        return running[0]?.id || null;
      };
      if (!id) id = await pick();
      let status = null;
      for (let i = 0; i < 40; i++) {
        const listS = await window.shellApi.qf.listSessions();
        const sessions = listS?.sessions || [];
        const row = sessions.find((s) => s.id === id);
        status = row?.status ?? null;
        if (status === "running" || status === "blocked") break;
        if (status === "failed" || status === "cancelled" || status === "closed") break;
        if (!id) id = await pick();
        await new Promise((r) => setTimeout(r, 250));
      }
      let cancelled = null;
      if (id) {
        cancelled = await window.shellApi.qf.cancelSession(id);
      }
      await new Promise((r) => setTimeout(r, 600));
      const after = await window.shellApi.qf.listSessions();
      const afterSessions = after?.sessions || [];
      const afterRow = afterSessions.find((s) => s.id === id);
      return JSON.stringify({
        defNames: defs.map((d) => d.name || d.id),
        species, spawned, id, statusBeforeCancel: status, cancelled,
        afterStatus: afterRow?.status ?? null, afterRow,
      });
    })()`,
    returnByValue: true,
    awaitPromise: true,
  });

  log("spawnCancel", spawnCancel.result?.value);
  if (spawnCancel.exceptionDetails) log("exception", JSON.stringify(spawnCancel.exceptionDetails));

  await Bun.sleep(800);
  const shot = await client.send("Page.captureScreenshot", { format: "png", fromSurface: true });
  const png = Buffer.from(shot.data, "base64");
  await Bun.write(OUT_PNG, png);
  log("screenshot", OUT_PNG, "bytes", String(png.length));
  client.close();
} catch (e) {
  log("ERROR", String(e?.stack || e));
  writeFileSync(LOG, lines.join("\n") + "\n");
  try { child.kill("SIGKILL"); } catch {}
  process.exit(1);
}

writeFileSync(LOG, lines.join("\n") + "\n");
log("wrote", LOG);
// keep electron for corrupt test — print pid
log("KEEP_ELECTRON_PID", String(child.pid));
child.unref();
await Bun.sleep(500);
process.exit(0);
