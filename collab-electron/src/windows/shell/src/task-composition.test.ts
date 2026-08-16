import { describe, expect, test } from "bun:test";
import { renderTaskFoot } from "./task-composition.js";

class FakeElement {
  className = "";
  textContent = "";
  value = "";
  dataset: Record<string, string> = {};
  children: FakeElement[] = [];
  listeners = new Map<string, (event: unknown) => void>();

  appendChild(child: FakeElement): FakeElement {
    this.children.push(child);
    return child;
  }

  replaceChildren(...children: FakeElement[]): void {
    this.children = children;
  }

  addEventListener(type: string, listener: (event: unknown) => void): void {
    this.listeners.set(type, listener);
  }

  remove(): void {}

  querySelector(selector: string): FakeElement | null {
    return this.querySelectorAll(selector)[0] ?? null;
  }

  querySelectorAll(selector: string): FakeElement[] {
    const wanted = selector.startsWith(".") ? selector.slice(1) : "";
    const found: FakeElement[] = [];
    const visit = (element: FakeElement): void => {
      if (wanted && element.className.split(/\s+/).includes(wanted)) found.push(element);
      for (const child of element.children) visit(child);
    };
    visit(this);
    return found;
  }
}

function withDocument<T>(run: (document: { createElement: () => FakeElement }) => T): T {
  const previous = (globalThis as Record<string, unknown>).document;
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: { createElement: () => new FakeElement() },
  });
  try {
    return run((globalThis as Record<string, unknown>).document as { createElement: () => FakeElement });
  } finally {
    if (previous === undefined) delete (globalThis as Record<string, unknown>).document;
    else Object.defineProperty(globalThis, "document", { configurable: true, value: previous });
  }
}

const assigned = {
  taskId: "task-1",
  title: "Read fixture market",
  status: "open" as const,
  delegatorDisplayName: "Research Director",
  description: "Use the exact Kernel objective.",
  delegatedBySessionId: "director-1",
  assignedToSessionId: "worker-1",
  assignmentState: "assigned" as const,
  unavailableSessionIds: [],
};

describe("Task footer projection", () => {
  test("renders four separate Kernel-backed facts for the exact specialist tile", () => {
    withDocument(() => {
      const foot = new FakeElement();
      renderTaskFoot(
        { taskFoot: foot },
        { id: "tile-worker", sessionId: "worker-1" },
        { assignments: [assigned] },
      );
      expect(foot.querySelector(".qf-task-title")?.textContent).toBe("Read fixture market");
      expect(foot.querySelector(".qf-task-status")?.textContent).toBe("OPEN");
      expect(foot.querySelector(".qf-task-delegator")?.textContent).toBe("Assigned by Research Director");
      expect(foot.querySelector(".qf-task-reason")?.textContent).toBe("Use the exact Kernel objective.");
      for (const selector of [".qf-task-title", ".qf-task-status", ".qf-task-delegator", ".qf-task-reason"]) {
        expect(foot.querySelector(selector)!.children).toHaveLength(0);
      }
    });
  });

  test("hides delegator and reason when the assignment is unavailable", () => {
    withDocument(() => {
      const foot = new FakeElement();
      renderTaskFoot(
        { taskFoot: foot },
        { id: "tile-worker", sessionId: "worker-1" },
        {
          assignments: [{
            ...assigned,
            assignmentState: "unavailable" as const,
            delegatedBySessionId: null,
            assignedToSessionId: null,
            delegatorDisplayName: null,
            unavailableSessionIds: ["worker-1"],
          }],
        },
      );
      expect(foot.querySelector(".task-fact-label")?.textContent).toBe("Assignment unavailable");
      expect(foot.querySelector(".qf-task-delegator")).toBeNull();
      expect(foot.querySelector(".qf-task-reason")).toBeNull();
    });
  });
});
