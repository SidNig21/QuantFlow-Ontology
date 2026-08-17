// qf-atlas / extract.mjs
//
// Reads the repository and produces the atlas model. Nothing here is
// hand-authored: every node, wire, and strip candidate is derived from source,
// so the map moves when the code moves.
//
// This is a PROJECTION of the code. It is not Kernel truth and it is not the
// running app. The Kernel still owns Missions, Tasks, Runs and Evaluations.
// The atlas owns exactly one claim: "this is how the program is wired right now."

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { execSync } from "node:child_process";

export const REPO = join(import.meta.dirname, "..");
const rel = (p) => relative(REPO, p).split(sep).join("/");

const SKIP_DIR = /^(node_modules|dist|out|build|coverage|\.git|\.package-staging.*)$/;
const CODE = /\.(ts|tsx|js|jsx|mjs|cjs)$/;
// Exported so nobody types a second definition of "test file". A divergent copy
// in generate.mjs (`/.(test|spec)./`, unescaped dots, no `.check.ts`) is how the
// `test-only` verdict came to be unreachable in practice.
export const IS_TEST = /\.(test|spec)\.|\.check\.ts$/;

/** `keepTests` includes test files, which the default walk strips. Reachability
 *  needs them: without a test file set there is nothing to seed the test walk
 *  from, and every test-only file falls through to `unreachable` — i.e. to
 *  "delete me". */
export function walk(dir, out = [], keepTests = false) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP_DIR.test(e.name)) walk(p, out, keepTests); }
    else if (CODE.test(e.name) && (keepTests || !IS_TEST.test(e.name))) out.push(p);
  }
  return out;
}

/** Every regex match with its 1-indexed line number. */
function matches(text, re) {
  const out = [];
  const r = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
  let m;
  while ((m = r.exec(text))) {
    out.push({ value: m[1] ?? m[0], index: m.index, line: text.slice(0, m.index).split("\n").length });
  }
  return out;
}

const cache = new Map();
function read(p) {
  if (!cache.has(p)) cache.set(p, readFileSync(p, "utf8"));
  return cache.get(p);
}

/** Comments are prose, not code. `errors.ts` mentions "CREATE TABLE" in a note;
 *  counting that as a write was a false finding on the first run. Newlines are
 *  preserved so reported line numbers stay correct. */
function stripComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/(^|[^:"'`\\])\/\/[^\n]*/g, (m, p) => p + " ".repeat(m.length - p.length));
}

/** Files that are ALLOWED to write SQL: the Kernel's declared write door and the
 *  generated schema. Anything else holding DML is a governance finding, and a new
 *  file that starts writing SQL appears automatically because it is not listed. */
export const WRITE_DOOR = new Set([
  "packages/qf-kernel/src/execute.ts",   // the sole mutation path
  "packages/qf-kernel/src/create.ts",    // object construction for 24 types
  "packages/qf-kernel/src/insert.ts",    // shared INSERT helper
  "packages/qf-kernel/src/events.ts",    // append-only event log
  "packages/qf-kernel/src/db.ts",        // schema DDL + handle
  "packages/qf-kernel/src/upgrade.ts",   // versioned migrations
]);
const DOOR_PREFIX = ["qf-kernel-schema/"];
export const insideWriteDoor = (p) => WRITE_DOOR.has(p) || DOOR_PREFIX.some((d) => p.startsWith(d));

// ─────────────────────────────────────────────────────────────────────────────
// 1 · THE WIRES.  renderer method → preload channel → main handler.
//     A break in any hop is a flow that dies, and that is the point of the map.
// ─────────────────────────────────────────────────────────────────────────────

const RE = {
  // main: channel may sit on the following line, so \s* must cross newlines
  handle:    /ipcMain\.handle(?:Once)?\(\s*["'`]([^"'`]+)["'`]/,
  on:        /ipcMain\.on\(\s*["'`]([^"'`]+)["'`]/,
  // preload: invoke, send AND sendSync — omitting sendSync produced a false
  // "dead wire" for get-home-path on the first run.
  invoke:    /ipcRenderer\.(?:invoke|send|sendSync)\(\s*["'`]([^"'`]+)["'`]/,
  bridge:    /exposeInMainWorld\(\s*["'`]([^"'`]+)["'`]/,
  // preload method name -> the channel it forwards to, e.g.  listArtifacts: () => ipcRenderer.invoke("qf:artifacts:list")
  bridgeFn:  /([A-Za-z_$][\w$]*)\s*:\s*(?:async\s*)?\([^)]*\)\s*(?::[^=]+)?=>[\s\S]{0,220}?ipcRenderer\.(?:invoke|send|sendSync)\(\s*["'`]([^"'`]+)["'`]/,
  // Bare `exec` matched `regex.exec(text)` and reported 15 process spawns in
  // kernel.ts, which starts none. main imports execFile/execFileSync/execSync/
  // spawn and never bare exec, so the alternative is dropped rather than guessed at.
  spawn:     /\b(?:spawnSync|spawn|execFileSync|execFile|execSync|fork)\s*\(/,
  // Only these keep running after the call returns, so only these need reaping.
  spawnLive: /\b(?:spawn|execFile|fork)\s*\(/,
  diskWrite: /\b(?:writeFile|writeFileSync|appendFile|appendFileSync|createWriteStream)\(/,
  dml:       /\b(?:CREATE\s+TABLE|INSERT(?:\s+OR\s+\w+)?\s+INTO|REPLACE\s+INTO|UPDATE(?:\s+OR\s+\w+)?\s+[a-z_]+\s+SET|DELETE\s+FROM|ALTER\s+TABLE|DROP\s+TABLE)\b/i,
  execute:   /\bexecute(?:Command)?\(/,
};

export function extractWires(mainFiles, preloadFiles, rendererFiles) {
  // where each channel is registered in main
  const registered = new Map();          // channel -> {file,line,kind}
  // Every registration is recorded, not only the first. Keeping just the first
  // hid second owners completely — and "old code left alive beside new code" is
  // the failure mode that matters most in this repo, more than plain dead code.
  const allRegistrations = new Map();    // channel -> [{file,line,kind}]
  const note = (ch, entry) => {
    if (!allRegistrations.has(ch)) allRegistrations.set(ch, []);
    allRegistrations.get(ch).push(entry);
    if (!registered.has(ch)) registered.set(ch, entry);
  };
  for (const f of mainFiles) {
    const t = read(f);
    for (const m of matches(t, RE.handle)) note(m.value, { file: rel(f), line: m.line, kind: "handle" });
    for (const m of matches(t, RE.on))     note(m.value, { file: rel(f), line: m.line, kind: "on" });
  }
  // IPC MODE IS PART OF IDENTITY.
  //
  // Electron runs two different protocols on the same channel name:
  //   ipcMain.on(ch)     receives ipcRenderer.send() / sendSync()  — event
  //   ipcMain.handle(ch) answers ipcRenderer.invoke()              — request/response
  //
  // They do not overwrite each other, so registering both is NOT duplicate
  // ownership. Reporting pty:write that way was a confident red produced by an
  // incomplete model — the exact failure this analyzer exists to prevent.
  //
  //   same channel + same mode + different implementations → duplicate owner
  //   same channel + different modes                       → protocol variants
  const modeOf = (kind) => (kind === "handle" ? "invoke" : "send");
  const duplicates = [];
  const protocolVariants = [];

  // Deferred until the preload scan below has filled allCalls — which protocol a
  // caller uses is what decides whether a registered variant is live.
  const classifyRegistrations = (allCalls) => {
  for (const [channel, list] of allRegistrations) {
    const byMode = new Map();
    for (const r of list) {
      const mode = modeOf(r.kind);
      if (!byMode.has(mode)) byMode.set(mode, []);
      byMode.get(mode).push(r);
    }

    for (const [mode, regs] of byMode)
      if (regs.length > 1)
        duplicates.push({
          id: `duplicate-owner:${channel}:${mode}`,
          channel, mode,
          owners: regs.map((o) => `${o.file}:${o.line}`),
          confidence: "high",
          why: `${regs.length} ${mode === "invoke" ? "handle" : "on"} registrations for one channel and mode. Same protocol, more than one owner — this is a genuine conflict.`,
        });

    if (byMode.size > 1) {
      // Which variant does production actually use? The preload's call mode decides.
      const callerModes = new Set(
        (allCalls.get(channel) ?? []).map((c) => (c.kind === "invoke" ? "invoke" : "send")));
      const unusedModes = [...byMode.keys()].filter((m) => !callerModes.has(m));
      protocolVariants.push({
        id: `protocol-variants:${channel}`,
        channel,
        modes: [...byMode.keys()],
        registrations: list.map((o) => `${o.file}:${o.line} (${modeOf(o.kind)})`),
        callerModes: [...callerModes],
        unusedModes,
        confidence: unusedModes.length ? "medium" : "low",
        disposition: unusedModes.length ? "investigate" : "keep",
        why: unusedModes.length
          ? `Registered for both protocols; preload only calls via ${[...callerModes].join(", ") || "no caller found"}. The ${unusedModes.join(", ")} variant looks legacy, but a packaged or dynamic caller must be ruled out before removing it.`
          : `Registered for both protocols and both are called. Dual transport by design.`,
      });
    }
  }
  };

  // where each channel is called from preload, and under which bridge method
  const called = new Map();              // channel -> {file,line}
  const allCalls = new Map();            // channel -> [{file,line,kind}]  kind: invoke|send|sendSync
  const bridgeMethods = new Map();       // method  -> channel
  const bridges = new Set();
  for (const f of preloadFiles) {
    const t = read(f);
    // Capture the call mode, not just the channel: which protocol the preload
    // uses is what decides whether a registered variant is actually live.
    for (const m of t.matchAll(/ipcRenderer\.(invoke|sendSync|send)\(\s*["'`]([^"'`]+)["'`]/g)) {
      const kind = m[1];
      const channel = m[2];
      const line = t.slice(0, m.index).split("\n").length;
      if (!allCalls.has(channel)) allCalls.set(channel, []);
      allCalls.get(channel).push({ file: rel(f), line, kind });
      if (!called.has(channel)) called.set(channel, { file: rel(f), line, kind });
    }
    for (const m of matches(t, RE.bridge)) bridges.add(m.value);
    const r = new RegExp(RE.bridgeFn.source, "g");
    let m;
    while ((m = r.exec(t))) if (!bridgeMethods.has(m[1])) bridgeMethods.set(m[1], m[2]);
  }

  // which bridge methods the renderer actually calls
  //
  // This set must stay a SUBSET of the declared methods. It did not: any property
  // read off a bridge object was counted as usage, so `usedMethodCount` (158)
  // exceeded `bridgeMethodCount` (127) — an impossible ratio that survived because
  // nothing rendered the two numbers together until ATLAS.md drew them side by side.
  //
  // A bridge property the renderer reads that the preload never declared is not
  // usage. It is one of two findings, and the map may not silently absorb either:
  //   · the renderer calls a method that does not exist  → broken at hop 1
  //   · the preload declares it in a form the regex missed → coverage gap
  const rendererSources = rendererFiles.map((f) => [rel(f), read(f)]);
  const rendererText = rendererSources.map(([, t]) => t).join("\n");
  const usedMethods = new Set();
  const undeclared = new Set();
  for (const b of bridges)
    for (const m of matches(rendererText, new RegExp(`${b}\\.([A-Za-z_$][\\w$]*)`)))
      (bridgeMethods.has(m.value) ? usedMethods : undeclared).add(m.value);
  // bare destructured usage, e.g.  const {listArtifacts} = window.shellApi
  for (const [method] of bridgeMethods)
    if (new RegExp(`\\b${method}\\s*\\(`).test(rendererText)) usedMethods.add(method);

  // Every property key the preload declares, whether or not it pairs with an
  // invoke channel. `bridgeMethods` pairs a method to a channel, so an
  // `ipcRenderer.on` subscriber never lands in it — which means that map alone
  // cannot answer the question "does this method exist at all?".
  //
  // Deliberately loose: a name appearing as a key anywhere in a preload file
  // counts as declared, including inside a type annotation. That biases toward
  // UNDER-reporting breaks, which is the correct direction — a false accusation
  // that a live call site is broken would get working code deleted.
  const preloadKeys = new Set();
  for (const f of preloadFiles)
    for (const m of matches(stripComments(read(f)), /(?:^|[{,;\s])([A-Za-z_$][\w$]*)\s*[:(]/))
      preloadKeys.add(m.value);

  // Hop 1 was only ever checked in one direction: "is this declared method
  // used?". Nothing asked the reverse — "does this used method exist?" — so a
  // renderer awaiting a bridge method the preload never exposed threw at runtime
  // and the map reported the loop green.
  const bridgeBlindSpots = [];
  const brokenBridgeCalls = [];
  for (const name of [...undeclared].sort()) {
    if (preloadKeys.has(name)) { bridgeBlindSpots.push(name); continue; }
    const callers = [];
    for (const [path, t] of rendererSources)
      for (const m of matches(t, new RegExp(`\\.(${name})\\s*\\(`)))
        callers.push(`${path}:${m.line}`);
    brokenBridgeCalls.push({ method: name, callers });
  }

  classifyRegistrations(allCalls);

  const channelToMethod = new Map();
  for (const [method, ch] of bridgeMethods) if (!channelToMethod.has(ch)) channelToMethod.set(ch, method);

  const wires = [];
  const allChannels = new Set([...registered.keys(), ...called.keys()]);
  for (const ch of allChannels) {
    const reg = registered.get(ch) || null;
    const call = called.get(ch) || null;
    const method = channelToMethod.get(ch) || null;
    const usedByRenderer = method ? usedMethods.has(method) : null;

    let status, breakAt = null;
    if (!reg)                      { status = "dead";        breakAt = "main"; }
    else if (!call)                { status = "unreached";   breakAt = "preload"; }
    else if (method && !usedByRenderer) { status = "unused"; breakAt = "renderer"; }
    else                           { status = "live"; }

    wires.push({
      channel: ch, method, status, breakAt,
      hops: [
        { layer: "renderer", present: usedByRenderer !== false, detail: method ? `${method}()` : "—" },
        { layer: "preload",  present: !!call, detail: call ? `${call.file}:${call.line}` : "no caller" },
        { layer: "main",     present: !!reg,  detail: reg ? `${reg.file}:${reg.line}` : "no handler" },
      ],
      registeredAt: reg, calledAt: call,
    });
  }
  wires.sort((a, b) => a.channel.localeCompare(b.channel));
  return {
    wires, duplicates, protocolVariants,
    bridges: [...bridges],
    bridgeMethodCount: bridgeMethods.size,
    usedMethodCount: usedMethods.size,
    bridgeBlindSpots,
    brokenBridgeCalls,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1b · THE PUSH DIRECTION.  main -> preload/renderer.
//
// Contract section E. This direction was not modelled AT ALL: no pattern for
// `webContents.send` or `ipcRenderer.on` existed anywhere, across ~48 channels. A
// push channel whose listener was deleted looked exactly like one that works, so
// half the event surface was invisible and 43 `on*`/`off*` bridge methods could not
// be matched to anything.
//
// TWO LAYERS, and the second is a tunnel:
//   direct     main --webContents.send(ch)--> ipcRenderer.on(ch) in a preload
//   tunnelled  main --send("shell:forward", target, inner)--> shell preload
//              --> shell renderer dispatcher --> <webview>.send(inner)
//              --> ipcRenderer.on(inner) in universal.ts
// A regex that only matches `webContents.send("literal")` sees `"shell:forward"` and
// misses every inner name — and those inner names are exactly the ones that then look
// like orphan listeners. Resolving the tunnel is what stops this analysis being a
// false-positive generator.
//
// CONFIDENCE. These patterns are textual, and the contract forbids regex from
// creating a high-confidence architectural red on its own. Every finding here is
// therefore emitted at `medium` confidence with disposition INVESTIGATE, and channels
// whose name is built dynamically are reported as an explicit coverage boundary
// rather than omitted. Promotion to red requires the AST pass.
const PUSH = {
  // webContents.send / win.webContents.send / wc.send — the literal-channel case.
  direct: /\.send\(\s*["'`]([^"'`$]+)["'`]/g,
  // Wrappers that take the channel as their first argument. Their own bodies call
  // `.send(channel)` with a variable, so the literal only exists at the call site.
  helper: /\b(?:sendToShell|sendToRenderer|sendToMainWindow|broadcast)\(\s*["'`]([^"'`$]+)["'`]/g,
  // sendToSender(webContentsId, channel, …)
  helperSecond: /\bsendToSender\(\s*[^,()]+,\s*["'`]([^"'`$]+)["'`]/g,
  // The tunnel: forwardToWebview(target, innerChannel, …)
  tunnel: /\bforwardToWebview\(\s*(?:["'`]([^"'`]*)["'`]|([A-Za-z_$][\w$.]*|`[^`]*`))\s*,\s*["'`]([^"'`$]+)["'`]/g,
  // Anything where the channel itself is not a literal — a variable or a template.
  dynamic: /(?:\.send|forwardToWebview)\(\s*(?:[^"'`,()]*,\s*)?(?:`[^`]*\$\{|[A-Za-z_$][\w$.]*\s*[,)])/g,
  listener: /ipcRenderer\.(on|once)\(\s*["'`]([^"'`$]+)["'`]/g,
};

/** The tunnel's outer channel. Not a product channel in its own right. */
const TUNNEL_CHANNEL = "shell:forward";

export function pushWires(mainFiles, preloadFiles, rendererFiles) {
  const senders = new Map();       // channel -> [{file,line,kind,target}]
  const dynamicSites = [];         // explicit coverage boundary, never silence
  const add = (ch, site) => {
    if (!senders.has(ch)) senders.set(ch, []);
    senders.get(ch).push(site);
  };

  for (const f of mainFiles) {
    const t = stripComments(read(f));
    const at = (i) => t.slice(0, i).split("\n").length;
    // Helper names COLLIDE across files with different signatures. `sendToShell` in
    // ipc-kernel.ts takes (channel, …); `sendToShell` in canvas-rpc.ts takes
    // (method, …) and sends the fixed channel "canvas:rpc-request" with the method in
    // the payload. Matching on the name alone reported all 19 RPC method names —
    // canvas.tileList, canvas.viewportGet … — as push channels with no listener: ten
    // fabricated findings pointing at healthy code.
    //
    // So verify per file: does this helper actually forward its FIRST parameter to
    // `.send(`? That is a file-local static fact, not a name guess and not an
    // allowlist.
    // The distinction is not "which parameter is the channel" — parsing parameter
    // lists by regex breaks on multi-line signatures and on types containing parens,
    // which is why pty.ts's sendToSender/sendToMainWindow and ipc-kernel.ts's
    // broadcast were all being skipped and their channels reported senderless.
    //
    // The real question is simpler: does this helper's own `.send(` take a VARIABLE
    // or a STRING LITERAL as its channel?
    //   variable  -> the channel comes from the caller, so the call-site literal IS
    //                a channel name        (ipc-kernel broadcast, pty sendToSender)
    //   literal   -> the channel is fixed and the caller's literal is payload, not a
    //                channel              (canvas-rpc sendToShell -> "canvas:rpc-request")
    const forwardsAChannel = (name) => {
      const def = new RegExp(
        `(?:function\\s+${name}\\s*\\(|(?:const|let|var)\\s+${name}\\s*=)`).exec(t);
      // Not defined in this file: it is an injected dependency such as the
      // forwardToWebview passed into each IPC domain context. Those do forward.
      if (!def) return true;
      const send = /\.send\(\s*(["'`])?/.exec(t.slice(def.index, def.index + 1600));
      if (!send) return false;
      return send[1] === undefined;
    };
    for (const m of t.matchAll(PUSH.direct))
      if (m[1] !== TUNNEL_CHANNEL) add(m[1], { file: rel(f), line: at(m.index), kind: "direct" });
    for (const re of [PUSH.helper, PUSH.helperSecond]) {
      for (const m of t.matchAll(re)) {
        if (m[1] === TUNNEL_CHANNEL) continue;
        const helperName = /^\s*([A-Za-z_$][\w$]*)/.exec(m[0])?.[1];
        if (helperName && !forwardsAChannel(helperName)) continue;
        add(m[1], { file: rel(f), line: at(m.index), kind: "helper" });
      }
    }
    for (const m of t.matchAll(PUSH.tunnel)) {
      const target = m[1] ?? m[2] ?? "?";
      const literalTarget = m[1] !== undefined;
      add(m[3], { file: rel(f), line: at(m.index), kind: "tunnel", target,
        targetResolved: literalTarget });
      if (!literalTarget)
        dynamicSites.push({ file: rel(f), line: at(m.index),
          why: `forwardToWebview target is not a literal (${target}) — the routed destination cannot be resolved statically`,
          coverage: "dynamic" });
    }
    for (const m of t.matchAll(PUSH.dynamic))
      dynamicSites.push({ file: rel(f), line: at(m.index),
        why: "push channel name is a variable or template literal, not resolvable from text",
        coverage: "dynamic" });
  }

  // Subscribers. `ipcRenderer.on` in a preload is the receiving end.
  const listeners = new Map();
  for (const f of preloadFiles) {
    const t = stripComments(read(f));
    for (const m of t.matchAll(PUSH.listener)) {
      const ch = m[2];
      if (!listeners.has(ch)) listeners.set(ch, []);
      listeners.get(ch).push({ file: rel(f), line: t.slice(0, m.index).split("\n").length, mode: m[1] });
    }
  }

  // A tunnelled inner channel may terminate in the shell renderer instead of a
  // preload — the dispatcher handles it directly and no listener is expected. Without
  // this, ten live channels would read as dead push. This is the single largest
  // false-positive source in this analysis.
  const rendererText = rendererFiles.map(read).join("\n");
  const consumedInRenderer = (ch) =>
    new RegExp(`["'\`]${ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'\`]`).test(rendererText);

  // The shell RENDERER also originates pushes into <webview> guests, so "no send site
  // in main" is not "no sender". canvas-opacity, nav-visibility, focus-search,
  // shell-blur and scope-changed are all sent from renderer.js / tile-manager.js.
  // Reporting those as dead listeners would delete live wiring.
  const rendererSends = new Set();
  for (const f of rendererFiles)
    for (const m of stripComments(read(f)).matchAll(PUSH.direct)) rendererSends.add(m[1]);

  // Dynamic channel names that resolve to a family: `agent:${event.kind}` at
  // ipc-misc.ts produces agent:session-started / file-touched / session-ended. The
  // literal never appears, so those three listeners look senderless. Capture the
  // resolvable prefix so they are reported as dynamically sent, not dead.
  const dynamicPrefixes = [];
  for (const f of mainFiles)
    for (const m of stripComments(read(f)).matchAll(/["'`]([a-z][\w:-]*?:)\$\{/gi))
      dynamicPrefixes.push(m[1]);
  const dynamicallySent = (ch) => dynamicPrefixes.some((p) => ch.startsWith(p));

  const channels = [...new Set([...senders.keys(), ...listeners.keys()])].sort();
  const rows = channels.map((channel) => {
    const sends = senders.get(channel) ?? [];
    const subs = listeners.get(channel) ?? [];
    const tunnelled = sends.some((s) => s.kind === "tunnel");
    const rendererEnd = consumedInRenderer(channel);
    let status, why, disposition;
    if (channel === TUNNEL_CHANNEL) {
      status = "tunnel"; disposition = "KEEP";
      why = "the forwarding transport itself, not a product channel: it carries an inner channel name in its payload";
    } else if (sends.length && subs.length) {
      status = "live"; disposition = "KEEP";
      why = `${sends.length} send site(s), ${subs.length} listener(s)`;
    } else if (sends.length && rendererEnd) {
      status = "renderer-terminated"; disposition = "KEEP";
      why = "no preload listener, but the shell renderer consumes this channel name directly — the dispatcher is the endpoint";
    } else if (sends.length) {
      status = "no-listener"; disposition = "INVESTIGATE";
      why = "main pushes this channel and no preload listener or renderer consumer was found; if the target is routed dynamically the receiver may exist";
    } else if (rendererSends.has(channel)) {
      status = "renderer-originated"; disposition = "KEEP";
      why = "sent by the shell renderer into a webview guest rather than by main — a real sender, just not in the main process";
    } else if (dynamicallySent(channel)) {
      status = "dynamic-sender"; disposition = "INVESTIGATE";
      why = "no literal send site, but a template-literal channel in main shares this prefix, so the sender is probably this listener's — unresolvable from text";
    } else {
      status = "no-sender"; disposition = "INVESTIGATE";
      why = "a preload subscribes and no send site was found in main or the renderer; verify no dynamic producer before removing";
    }
    return {
      // Stable, semantic id. The channel name is the identity; line numbers are
      // evidence (contract J).
      id: `push:${channel}`,
      channel, status, disposition, why,
      confidence: "medium",
      evidenceLevel: "S",
      tunnelled,
      senders: sends.slice(0, 6),
      listeners: subs.slice(0, 6),
      rendererConsumed: rendererEnd,
    };
  });

  return {
    rows,
    dynamicSites,
    stats: {
      channels: rows.length,
      tunnelled: rows.filter((r) => r.tunnelled).length,
      live: rows.filter((r) => r.status === "live").length,
      rendererTerminated: rows.filter((r) => r.status === "renderer-terminated").length,
      noListener: rows.filter((r) => r.status === "no-listener").length,
      noSender: rows.filter((r) => r.status === "no-sender").length,
      dynamicSites: dynamicSites.length,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2 · PER-FILE FACTS.  Size and the three signals that decide One Rule severity.
// ─────────────────────────────────────────────────────────────────────────────

export function fileFacts(files) {
  return files.map((f) => {
    const t = read(f);
    const code = stripComments(t);
    const dmlHits = matches(code, RE.dml);
    return {
      path: rel(f),
      kb: +(statSync(f).size / 1024).toFixed(1),
      spawns: matches(code, RE.spawn).length,
      spawnsLive: matches(code, RE.spawnLive).length,
      writes: matches(code, RE.diskWrite).length,
      dml: dmlHits.length,
      dmlLines: dmlHits.slice(0, 6).map((h) => h.line),
      executes: matches(code, RE.execute).length,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 3 · STRIP CANDIDATES.  What the first job of the atlas is: what should go.
// ─────────────────────────────────────────────────────────────────────────────

export function stripCandidates(wires, facts) {
  const strip = [];

  for (const w of wires.filter((w) => w.status === "unreached")) {
    strip.push({
      kind: "unreached-ipc",
      bucket: "safe-leftover",
      advice: "REMOVAL-CANDIDATE. Nothing can reach it today, but static non-reachability is not permission: rule out a packaged or dynamically-loaded caller first.",
      what: w.channel,
      where: `${w.registeredAt.file}:${w.registeredAt.line}`,
      why: "Registered in main; nothing in preload calls it. The renderer cannot reach this handler.",
    });
  }
  for (const w of wires.filter((w) => w.status === "unused")) {
    strip.push({
      kind: "unused-bridge",
      bucket: "maybe-later",
      // NOT "safe to delete". qf:review:projection is unused today and is
      // exactly what R16 needs to render the Evaluation tile. Deleting the
      // unused bucket wholesale would remove the next rung.
      advice: "Do not delete on sight. This works end to end and may be a surface the next rung needs.",
      what: `${w.method}() → ${w.channel}`,
      where: `${w.calledAt.file}:${w.calledAt.line}`,
      why: "Exposed on the contextBridge and wired to a live handler, but no renderer file calls it.",
    });
  }
  for (const w of wires.filter((w) => w.status === "dead")) {
    strip.push({
      kind: "dead-wire",
      bucket: "broken-now",
      advice: "Fix or remove. This call fails at runtime today.",
      what: w.channel,
      where: `${w.calledAt.file}:${w.calledAt.line}`,
      why: "Preload calls this channel and no main handler registers it. This call fails at runtime.",
    });
  }

  return strip;
}

/** Governance breaches — distinct from strip candidates. A strip candidate is
 *  safe to delete; a violation is code that works but breaks the One Rule, and
 *  deciding what to do about it is a founder call, not a cleanup. */
export function violations(facts) {
  const out = [];
  for (const f of facts) {
    if (f.dml === 0 || insideWriteDoor(f.path)) continue;
    // A gate seeding a fixture database is test infrastructure, not a product
    // path. Kept on the map, but scoped so it cannot inflate the real number.
    const scope = f.path.startsWith("qa/") ? "qa" : "product";
    out.push({
      kind: "outside-write-door",
      scope,
      what: `${f.dml} SQL statement${f.dml > 1 ? "s" : ""} outside execute()`,
      where: f.path,
      lines: f.dmlLines,
      why: scope === "qa"
        ? "A QA harness writing its own fixture SQL. Expected, but listed so it stays visible."
        : "START_HERE §1: the Kernel owns truth. This product file writes SQL without going through the declared write door.",
    });
  }
  return out.sort((a, b) =>
    (a.scope === b.scope ? 0 : a.scope === "product" ? -1 : 1) ||
    b.lines.length - a.lines.length || a.where.localeCompare(b.where));
}

export function gitMeta() {
  const g = (c) => { try { return execSync(c, { cwd: REPO, encoding: "utf8" }).trim(); } catch { return "unknown"; } };
  return { branch: g("git rev-parse --abbrev-ref HEAD"), commit: g("git rev-parse --short HEAD") };
}

export { rel, read, matches, RE };
