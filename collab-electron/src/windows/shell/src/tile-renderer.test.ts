import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import {
  getAgentTileModel,
  getTileLabel,
  splitFilepath,
  positionTile,
  createTileDOM,
  armCloseHead,
} from "./tile-renderer.js";

/** Minimal DOM for bun tests — no new dependency (one-skin / order forbid). */
function installMinimalDom() {
  class El {
    tagName: string;
    className = "";
    id = "";
    title = "";
    type = "";
    textContent = "";
    innerHTML = "";
    parentNode: El | null = null;
    children: El[] = [];
    dataset: Record<string, string> = {};
    style: Record<string, string> = {};
    disabled = false;
    classList = {
      add: (...tokens: string[]) => {
        const set = new Set(this.className.split(/\s+/).filter(Boolean));
        for (const t of tokens) set.add(t);
        this.className = [...set].join(" ");
      },
      contains: (token: string) => this.className.split(/\s+/).includes(token),
    };
    private listeners = new Map<string, Array<(e: unknown) => void>>();
    constructor(tag: string) {
      this.tagName = tag.toUpperCase();
    }
    appendChild(child: El) {
      this.children.push(child);
      child.parentNode = this;
      return child;
    }
    addEventListener(type: string, fn: (e: unknown) => void) {
      const list = this.listeners.get(type) ?? [];
      list.push(fn);
      this.listeners.set(type, list);
    }
    dispatchEvent(event: { type: string; stopPropagation?: () => void; preventDefault?: () => void }) {
      const e = {
        type: event.type,
        stopPropagation() {},
        preventDefault() {},
        ...event,
      };
      for (const fn of this.listeners.get(event.type) ?? []) fn(e);
      return true;
    }
    querySelector(sel: string): El | null {
      return this.querySelectorAll(sel)[0] ?? null;
    }
    querySelectorAll(sel: string): El[] {
      const out: El[] = [];
      const walk = (node: El) => {
        if (matches(node, sel)) out.push(node);
        for (const c of node.children) walk(c);
      };
      walk(this);
      return out;
    }
  }

  function matches(node: El, sel: string): boolean {
    if (sel.startsWith(".")) {
      const cls = sel.slice(1);
      return node.className.split(/\s+/).includes(cls);
    }
    return false;
  }

  const doc = {
    createElement(tag: string) {
      return new El(tag);
    },
    documentElement: new El("html"),
  };
  const prevDoc = (globalThis as { document?: unknown }).document;
  const prevGetComputed = (globalThis as { getComputedStyle?: unknown }).getComputedStyle;
  (globalThis as { document: typeof doc }).document = doc;
  (globalThis as { getComputedStyle: (el: unknown) => { getPropertyValue: (p: string) => string } }).getComputedStyle =
    () => ({ getPropertyValue: () => "" });
  (globalThis as { MouseEvent: new (type: string, init?: object) => { type: string } }).MouseEvent =
    class MouseEvent {
      type: string;
      constructor(type: string) {
        this.type = type;
      }
    } as never;
  (globalThis as { Event: new (type: string, init?: object) => { type: string } }).Event =
    class Event {
      type: string;
      constructor(type: string) {
        this.type = type;
      }
    } as never;
  return () => {
    (globalThis as { document?: unknown }).document = prevDoc;
    (globalThis as { getComputedStyle?: unknown }).getComputedStyle = prevGetComputed;
  };
}

// -- splitFilepath --

describe("splitFilepath", () => {
  test("splits a typical absolute path", () => {
    expect(splitFilepath("/Users/me/projects/app/index.ts")).toEqual({
      parent: "/Users/me/projects/app/",
      name: "index.ts",
    });
  });

  test("handles a single filename with no directory", () => {
    expect(splitFilepath("file.txt")).toEqual({
      parent: "",
      name: "file.txt",
    });
  });

  test("handles a path with one directory level", () => {
    expect(splitFilepath("src/file.ts")).toEqual({
      parent: "src/",
      name: "file.ts",
    });
  });

  test("handles trailing slash (directory path)", () => {
    // pop returns "" which is falsy, so fallback to full path as name
    const result = splitFilepath("/Users/me/projects/");
    expect(result.name).toBe("/Users/me/projects/");
    expect(result.parent).toBe("/Users/me/projects/");
  });

  test("handles root path", () => {
    const result = splitFilepath("/");
    expect(result.name).toBe("/");
  });
});

// -- getTileLabel --

describe("getTileLabel", () => {
  test("returns cwd basename for term tiles with cwd", () => {
    const label = getTileLabel({
      type: "term", id: "t1", cwd: "/Users/me/projects/collab",
    });
    expect(label.name).toBe("collab");
    expect(label.parent).toBe("/Users/me/projects/");
  });

  test("returns 'Terminal' for term tiles without session info", () => {
    const label = getTileLabel({ type: "term", id: "t1" });
    expect(label.name).toBe("Terminal");
    expect(label.parent).toBe("");
  });

  test("userTitle wins over autoTitle and cwd", () => {
    const label = getTileLabel({
      type: "term", id: "t1",
      userTitle: "My Server",
      autoTitle: "/Users/me/projects/app",
      cwd: "/Users/me/projects/app",
    });
    expect(label.name).toBe("My Server");
    expect(label.parent).toBe("");
  });

  test("returns autoTitle split when no userTitle", () => {
    const label = getTileLabel({
      type: "term", id: "t1",
      autoTitle: "/Users/me/projects/app",
    });
    expect(label.name).toBe("app");
    expect(label.parent).toBe("/Users/me/projects/");
  });

  test("falls back to cwd when no userTitle or autoTitle", () => {
    const label = getTileLabel({
      type: "term", id: "t1",
      cwd: "/Users/me/projects/fallback",
    });
    expect(label.name).toBe("fallback");
    expect(label.parent).toBe("/Users/me/projects/");
  });

  test("empty userTitle falls through to autoTitle", () => {
    const label = getTileLabel({
      type: "term", id: "t1",
      userTitle: "",
      autoTitle: "/Users/me/projects/app",
    });
    expect(label.name).toBe("app");
    expect(label.parent).toBe("/Users/me/projects/");
  });

  test("returns hostname for browser tiles with URL", () => {
    const label = getTileLabel({
      type: "browser", id: "t1",
      url: "https://example.com/page",
    });
    expect(label.name).toBe("example.com");
  });

  test("returns raw URL for browser tiles with invalid URL", () => {
    const label = getTileLabel({
      type: "browser", id: "t1",
      url: "not-a-url",
    });
    expect(label.name).toBe("not-a-url");
  });

  test("returns 'Browser' for browser tiles without URL", () => {
    const label = getTileLabel({ type: "browser", id: "t1" });
    expect(label.name).toBe("Browser");
  });

  test("returns folder name for graph tiles with folderPath", () => {
    const label = getTileLabel({
      type: "graph", id: "t1",
      folderPath: "/Users/me/projects/myapp",
    });
    expect(label.name).toBe("myapp");
    expect(label.parent).toBe("/Users/me/projects/");
  });

  test("returns 'Graph' for graph tiles without folderPath", () => {
    const label = getTileLabel({ type: "graph", id: "t1" });
    expect(label.name).toBe("Graph");
  });

  test("returns filename for file-based tiles", () => {
    const label = getTileLabel({
      type: "note", id: "t1",
      filePath: "/Users/me/docs/readme.md",
    });
    expect(label.name).toBe("readme.md");
    expect(label.parent).toBe("/Users/me/docs/");
  });

  test("returns tile type for tiles without filePath", () => {
    const label = getTileLabel({ type: "code", id: "t1" });
    expect(label.name).toBe("code");
  });

  test("returns filename for image tiles", () => {
    const label = getTileLabel({
      type: "image", id: "t1",
      filePath: "/photos/cat.png",
    });
    expect(label.name).toBe("cat.png");
    expect(label.parent).toBe("/photos/");
  });
});

describe("native TUI agent tile model", () => {
  test("makes identity, runtime, status, and session binding explicit", () => {
    expect(getAgentTileModel({
      type: "term",
      id: "tile-agent",
      definitionId: "hermes-worker",
      role: "worker",
      sessionId: "session-worker-123456",
      ptySessionId: "pty-worker",
    })).toEqual({
      identity: "hermes-worker",
      runtime: "Native TUI",
      status: "TUI attached",
      sessionId: "session-worker-123456",
      dominantSurface: "tui",
      actions: ["fullscreen", "close"],
    });
  });

  test("does not label an ordinary terminal as an agent", () => {
    expect(getAgentTileModel({ type: "term", id: "terminal" })).toBeNull();
  });

  test("marks a durable agent tile without a live PTY as stopped", () => {
    expect(getAgentTileModel({
      type: "term",
      id: "tile-stopped-agent",
      definitionId: "hermes-worker",
      sessionId: "session-worker-stopped",
    })?.status).toBe("stopped");
  });
});

// -- positionTile --

describe("positionTile", () => {
  function mockContainer() {
    const style: Record<string, string> = {};
    return { style };
  }

  test("sets position from tile coords + pan offset", () => {
    const container = mockContainer();
    const tile = { x: 100, y: 200, width: 400, height: 500, zIndex: 5 };
    positionTile(container, tile, 50, 30, 1);
    expect(container.style.left).toBe("150px");
    expect(container.style.top).toBe("230px");
  });

  test("applies zoom to screen position", () => {
    const container = mockContainer();
    const tile = { x: 100, y: 200, width: 400, height: 500, zIndex: 1 };
    positionTile(container, tile, 0, 0, 0.5);
    // screen x = 100 * 0.5 + 0 = 50
    // screen y = 200 * 0.5 + 0 = 100
    expect(container.style.left).toBe("50px");
    expect(container.style.top).toBe("100px");
    expect(container.style.transform).toBe("scale(0.5)");
  });

  test("sets width, height, and zIndex", () => {
    const container = mockContainer();
    const tile = { x: 0, y: 0, width: 400, height: 500, zIndex: 7 };
    positionTile(container, tile, 0, 0, 1);
    expect(container.style.width).toBe("400px");
    expect(container.style.height).toBe("500px");
    expect(container.style.zIndex).toBe("7");
  });

  test("sets transformOrigin to top left", () => {
    const container = mockContainer();
    const tile = { x: 0, y: 0, width: 100, height: 100, zIndex: 1 };
    positionTile(container, tile, 0, 0, 1);
    expect(container.style.transformOrigin).toBe("top left");
  });

  test("handles negative pan offset", () => {
    const container = mockContainer();
    const tile = { x: 100, y: 100, width: 100, height: 100, zIndex: 1 };
    positionTile(container, tile, -50, -50, 1);
    expect(container.style.left).toBe("50px");
    expect(container.style.top).toBe("50px");
  });

  test("handles negative tile coordinates", () => {
    const container = mockContainer();
    const tile = { x: -100, y: -200, width: 100, height: 100, zIndex: 1 };
    positionTile(container, tile, 500, 400, 1);
    expect(container.style.left).toBe("400px");
    expect(container.style.top).toBe("200px");
  });

  test("zoom and pan combine correctly", () => {
    const container = mockContainer();
    const tile = { x: 200, y: 300, width: 100, height: 100, zIndex: 1 };
    positionTile(container, tile, 10, 20, 0.75);
    // screen x = 200 * 0.75 + 10 = 160
    // screen y = 300 * 0.75 + 20 = 245
    expect(container.style.left).toBe("160px");
    expect(container.style.top).toBe("245px");
  });
});

describe("WO-g2 glacier spine DOM", () => {
  let restore: (() => void) | undefined;
  beforeAll(() => {
    restore = installMinimalDom();
  });
  afterAll(() => {
    restore?.();
  });

  test("uses the Kernel-projected friendly label while retaining exact DOM identity", () => {
    const dom = createTileDOM({
      type: "term",
      id: "tile-director",
      definitionId: "hermes-research-director",
      agentLabel: "Research Director",
      role: "orchestrator",
      sessionId: "session-director",
      ptySessionId: "pty-director",
    }, { onClose: () => {} });
    expect(dom.container.dataset.definitionId).toBe("hermes-research-director");
    expect(dom.container.dataset.sessionId).toBe("session-director");
    expect(dom.container.querySelector(".tile-title-name")?.textContent).toBe("Research Director");
  });

  test("createTileDOM builds spine/head/id/grip/body/screen and cable nodes", () => {
    const closes: string[] = [];
    const fs: string[] = [];
    const dom = createTileDOM(
      { type: "term", id: "t-spine", definitionId: "hermes-worker", sessionId: "sess-abc" },
      {
        onClose: (id: string) => closes.push(id),
        onToggleFullscreen: (id: string) => fs.push(id),
      },
    );
    expect(dom.container.querySelector(".gl-tile__spine")).toBeTruthy();
    expect(dom.container.querySelector(".gl-tile__head")).toBeTruthy();
    expect(dom.container.querySelector(".gl-tile__id")).toBeTruthy();
    expect(dom.container.querySelector(".gl-tile__grip")).toBeTruthy();
    expect(dom.container.querySelector(".gl-tile__body")).toBeTruthy();
    expect(dom.container.querySelector(".gl-tile__screen")).toBeTruthy();
    expect(dom.container.querySelectorAll(".gl-node")).toHaveLength(4);
    expect(dom.container.querySelector(".tile-title-bar")).toBeNull();
    expect(dom.container.querySelector(".tile-action-btn")).toBeNull();
    expect(dom.spine).toBe(dom.titleBar);
  });

  test("arm/confirm: one click does not close; two within 2s closes", () => {
    const closes: string[] = [];
    const head = document.createElement("button");
    head.dataset.armed = "false";
    armCloseHead(head, { onConfirm: () => closes.push("ok"), armMs: 2000 });
    head.dispatchEvent(new Event("click"));
    expect(closes).toEqual([]);
    expect(head.dataset.armed).toBe("true");
    head.dispatchEvent(new Event("click"));
    expect(closes).toEqual(["ok"]);
    expect(head.dataset.armed).toBe("false");
  });

  test("arm/confirm: arm lapses after timer so second click does not close", async () => {
    const closes: string[] = [];
    const head = document.createElement("button");
    head.dataset.armed = "false";
    armCloseHead(head, { onConfirm: () => closes.push("ok"), armMs: 50 });
    head.dispatchEvent(new Event("click"));
    expect(head.dataset.armed).toBe("true");
    await Bun.sleep(80);
    expect(head.dataset.armed).toBe("false");
    head.dispatchEvent(new Event("click"));
    expect(closes).toEqual([]);
    expect(head.dataset.armed).toBe("true");
  });

  test("dblclick spine toggles fullscreen via callback", () => {
    const fs: string[] = [];
    const dom = createTileDOM(
      { type: "term", id: "t-fs" },
      { onClose: () => {}, onToggleFullscreen: (id: string) => fs.push(id) },
    );
    dom.spine.dispatchEvent(new MouseEvent("dblclick"));
    expect(fs).toEqual(["t-fs"]);
  });
});
