import { describe, expect, test } from "bun:test";
import { renderTaskFoot } from "./task-composition.js";

class FakeElement {
  readonly tagName: string;
  className = "";
  private ownText = "";
  value = "";
  dataset: Record<string, string> = {};
  attributes: Record<string, string> = {};
  disabled = false;
  required = false;
  type = "";
  placeholder = "";
  selected = false;
  children: FakeElement[] = [];
  parent: FakeElement | null = null;
  listeners = new Map<string, (event: unknown) => void>();

  constructor(tagName = "div") {
    this.tagName = tagName.toUpperCase();
  }

  get textContent(): string {
    return this.ownText + this.children.map((child) => child.textContent).join("");
  }

  set textContent(value: string) {
    this.ownText = value;
    this.children = [];
  }

  get classList(): { length: number; contains: (className: string) => boolean } {
    const classes = this.className.split(/\s+/).filter(Boolean);
    return { length: classes.length, contains: (className) => classes.includes(className) };
  }

  get options(): FakeElement[] {
    return this.children;
  }

  appendChild(child: FakeElement): FakeElement {
    child.parent?.removeChild(child);
    child.parent = this;
    this.children.push(child);
    return child;
  }

  replaceChildren(...children: FakeElement[]): void {
    for (const child of this.children) child.parent = null;
    this.children = children;
    for (const child of children) child.parent = this;
  }

  addEventListener(type: string, listener: (event: unknown) => void): void {
    this.listeners.set(type, listener);
  }

  removeChild(child: FakeElement): void {
    const index = this.children.indexOf(child);
    if (index >= 0) this.children.splice(index, 1);
    if (child.parent === this) child.parent = null;
  }

  remove(): void {
    this.parent?.removeChild(this);
  }

  replaceWith(child: FakeElement): void {
    if (!this.parent) return;
    const parent = this.parent;
    const index = parent.children.indexOf(this);
    if (index < 0) return;
    this.parent = null;
    child.parent?.removeChild(child);
    child.parent = parent;
    parent.children[index] = child;
  }

  setAttribute(name: string, value: string): void {
    this.attributes[name] = String(value);
  }

  getAttribute(name: string): string | null {
    return this.attributes[name] ?? null;
  }

  focus(): void {}

  querySelector(selector: string): FakeElement | null {
    return this.querySelectorAll(selector)[0] ?? null;
  }

  querySelectorAll(selector: string): FakeElement[] {
    const wanted = selector.startsWith(".") ? selector.slice(1) : "";
    const wantsWorldField = selector === "[data-qf-world-field]";
    const found: FakeElement[] = [];
    const visit = (element: FakeElement): void => {
      if ((wanted && element.classList.contains(wanted)) || (wantsWorldField && "qfWorldField" in element.dataset)) {
        found.push(element);
      }
      for (const child of element.children) visit(child);
    };
    visit(this);
    return found;
  }
}

function withDocument<T>(run: (document: { createElement: (tagName: string) => FakeElement }) => T): T {
  const previous = (globalThis as Record<string, unknown>).document;
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: { createElement: (tagName: string) => new FakeElement(tagName) },
  });
  try {
    return run((globalThis as Record<string, unknown>).document as { createElement: (tagName: string) => FakeElement });
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

function elementSnapshot(element: FakeElement): unknown {
  return {
    tagName: element.tagName,
    className: element.className,
    textContent: element.textContent,
    attributes: { ...element.attributes },
    dataset: { ...element.dataset },
    control: {
      disabled: element.disabled,
      required: element.required,
      type: element.type,
      placeholder: element.placeholder,
      value: element.value,
      selected: element.selected,
    },
    children: element.children.map(elementSnapshot),
  };
}

function expectedElement(
  tagName: string,
  className: string,
  textContent: string,
  dataset: Record<string, string> = {},
  control: Partial<Pick<FakeElement, "disabled" | "required" | "type" | "placeholder" | "value" | "selected">> = {},
  children: unknown[] = [],
): unknown {
  return {
    tagName,
    className,
    textContent,
    attributes: {},
    dataset,
    control: {
      disabled: false,
      required: false,
      type: "",
      placeholder: "",
      value: "",
      selected: false,
      ...control,
    },
    children,
  };
}

function seedFormAndError(foot: FakeElement): void {
  const form = new FakeElement("form");
  form.className = "task-create-form";
  const title = new FakeElement("input");
  title.className = "task-title";
  title.placeholder = "Task title";
  title.required = true;
  title.value = "draft title";
  const description = new FakeElement("textarea");
  description.className = "task-description";
  description.placeholder = "Completion description";
  description.required = true;
  description.value = "draft description";
  const assignee = new FakeElement("select");
  assignee.className = "task-assignee";
  const option = new FakeElement("option");
  option.value = "worker-1";
  option.textContent = "Worker";
  option.selected = true;
  assignee.appendChild(option);
  const submit = new FakeElement("button");
  submit.className = "task-action";
  submit.type = "submit";
  submit.textContent = "Create";
  form.appendChild(title);
  form.appendChild(description);
  form.appendChild(assignee);
  form.appendChild(submit);
  foot.appendChild(form);
  const error = new FakeElement("div");
  error.className = "task-foot-error";
  error.textContent = "persisted error";
  foot.appendChild(error);
}

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

  test("retains one opaque session receipt and preserves the unchanged no-receipt projection", async () => {
    withDocument(() => {
      const foot = new FakeElement();
      const nested = new FakeElement("div");
      const nestedReceipt = new FakeElement("div");
      nestedReceipt.className = "qf-world-session-receipt";
      nested.appendChild(nestedReceipt);
      const extraClass = new FakeElement("div");
      extraClass.className = "qf-world-session-receipt extra";
      const retainedReceipt = new FakeElement("div");
      retainedReceipt.className = "qf-world-session-receipt";
      const retainedInspection = new FakeElement("div");
      retainedInspection.className = "qf-world-session-inspect";
      const receiptRows = ["id", "status", "label"].map((field) => {
        const row = new FakeElement("div");
        row.className = "qf-world-field";
        row.dataset.qfWorldField = field;
        const value = new FakeElement("span");
        value.className = "qf-world-field-value";
        value.textContent = `receipt-${field}`;
        row.appendChild(value);
        retainedReceipt.appendChild(row);
        return { row, value };
      });
      const duplicateReceipt = new FakeElement("div");
      duplicateReceipt.className = "qf-world-session-receipt";
      const duplicateInspection = new FakeElement("div");
      duplicateInspection.className = "qf-world-session-inspect";
      foot.appendChild(nested);
      foot.appendChild(extraClass);
      foot.appendChild(retainedReceipt);
      foot.appendChild(retainedInspection);
      foot.appendChild(duplicateReceipt);
      foot.appendChild(duplicateInspection);

      const sessionTile = { id: "tile-worker", sessionId: "worker-1" };
      const renderReceipt = (title: string): void => {
        renderTaskFoot(
          { taskFoot: foot },
          sessionTile,
          { assignments: [{ ...assigned, title }] },
        );
      };
      const assertReceipt = (title: string): void => {
        const directReceipts = foot.children.filter((child) =>
          child.classList.length === 1 && child.classList.contains("qf-world-session-receipt")
        );
        expect(directReceipts).toEqual([retainedReceipt]);
        expect(foot.children[foot.children.length - 1]).toBe(retainedReceipt);
        expect(foot.querySelector(".qf-world-session-receipt")).toBe(retainedReceipt);
        expect(foot.children.includes(duplicateReceipt)).toBe(false);
        expect(foot.querySelector(".qf-world-session-inspect")).toBe(retainedInspection);
        expect(foot.children.filter((child) => child.classList.contains("qf-world-session-inspect"))).toEqual([retainedInspection]);
        expect(foot.children.includes(duplicateInspection)).toBe(false);
        expect(foot.children.includes(nested)).toBe(false);
        expect(foot.children.includes(extraClass)).toBe(false);
        expect(retainedReceipt.children).toEqual(receiptRows.map(({ row }) => row));
        for (const { row, value } of receiptRows) {
          expect(row.children).toEqual([value]);
          expect(row.dataset).toEqual({ qfWorldField: row.dataset.qfWorldField });
          expect(value.textContent).toBe(`receipt-${row.dataset.qfWorldField}`);
        }
        expect(foot.querySelector(".qf-task-title")?.textContent).toBe(title);
      };

      renderReceipt("task-a");
      assertReceipt("task-a");
      renderReceipt("task-b");
      assertReceipt("task-b");

      const noReceiptTile = { id: "tile-director", sessionId: "director-1", role: "orchestrator" };
      const noReceiptSessions = [
        { id: "director-1", display_name: "Research Director", status: "running" },
        { id: "worker-1", display_name: "Worker", status: "running" },
      ];
      const noReceiptAssignment = {
        ...assigned,
        taskId: "task-director",
        title: "direct task",
        description: "direct description",
        delegatedBySessionId: "director-1",
        assignedToSessionId: "director-1",
        history: [{
          event_id: "event-1",
          sequence: 1,
          kind: "assigned",
          task_id: "task-director",
          mode: "direct",
          text: "history text",
          outcome: "accepted",
          target_session_id: "director-1",
        }],
      };
      const noReceiptFoot = new FakeElement();
      seedFormAndError(noReceiptFoot);
      renderTaskFoot(
        { taskFoot: noReceiptFoot },
        noReceiptTile,
        { sessions: noReceiptSessions, assignments: [noReceiptAssignment] },
      );
      const firstNoReceiptSnapshot = elementSnapshot(noReceiptFoot);
      expect(noReceiptFoot.querySelectorAll(".qf-world-session-receipt")).toHaveLength(0);
      expect(noReceiptFoot.querySelectorAll("[data-qf-world-field]")).toHaveLength(0);
      expect(noReceiptFoot.querySelectorAll(".qf-world-field-value")).toHaveLength(0);
      const expectedNoReceiptSnapshot = expectedElement(
        "DIV",
        "",
        "direct taskOPENAssigned by Research Directordirect descriptionassignedhistory textaccepteddirector-1ReassignCancelClarifyRedirectSecond opinionResearch DirectorWorkerCreatepersisted error",
        {},
        {},
        [
          expectedElement(
            "DIV",
            "task-fact task-fact-open",
            "direct taskOPENAssigned by Research Directordirect description",
            {
              taskId: "task-director",
              delegatedBySessionId: "director-1",
              assignedToSessionId: "director-1",
            },
            {},
            [
              expectedElement("SPAN", "qf-task-title", "direct task"),
              expectedElement("SPAN", "qf-task-status", "OPEN"),
              expectedElement("SPAN", "qf-task-delegator", "Assigned by Research Director"),
              expectedElement("SPAN", "qf-task-reason", "direct description"),
            ],
          ),
          expectedElement(
            "DIV",
            "task-history",
            "assignedhistory textaccepteddirector-1",
            {},
            {},
            [
              expectedElement(
                "DIV",
                "task-history-fact",
                "assignedhistory textaccepteddirector-1",
                {
                  eventId: "event-1",
                  sequence: "1",
                  kind: "assigned",
                  taskId: "task-director",
                  mode: "direct",
                  text: "history text",
                  outcome: "accepted",
                  targetSessionId: "director-1",
                },
                {},
                [
                  expectedElement("SPAN", "task-history-action", "assigned"),
                  expectedElement("SPAN", "task-history-text", "history text"),
                  expectedElement("SPAN", "task-history-outcome", "accepted"),
                  expectedElement("SPAN", "task-history-target", "director-1"),
                ],
              ),
            ],
          ),
          expectedElement(
            "DIV",
            "task-foot-actions",
            "ReassignCancelClarifyRedirectSecond opinion",
            {},
            {},
            [
              expectedElement("BUTTON", "task-action", "Reassign"),
              expectedElement("BUTTON", "task-action task-action-cancel", "Cancel"),
              expectedElement("BUTTON", "task-action", "Clarify"),
              expectedElement("BUTTON", "task-action", "Redirect"),
              expectedElement("BUTTON", "task-action", "Second opinion"),
            ],
          ),
          expectedElement(
            "FORM",
            "task-create-form",
            "Research DirectorWorkerCreate",
            {},
            {},
            [
              expectedElement("INPUT", "task-title", "", {}, { required: true, placeholder: "Task title", value: "draft title" }),
              expectedElement("TEXTAREA", "task-description", "", {}, { required: true, placeholder: "Completion description", value: "draft description" }),
              expectedElement(
                "SELECT",
                "task-assignee",
                "Research DirectorWorker",
                {},
                {},
                [
                  expectedElement("OPTION", "", "Research Director", {}, { value: "director-1" }),
                  expectedElement("OPTION", "", "Worker", {}, { value: "worker-1", selected: true }),
                ],
              ),
              expectedElement("BUTTON", "task-action", "Create", {}, { type: "submit" }),
            ],
          ),
          expectedElement("DIV", "task-foot-error", "persisted error"),
        ],
      );
      expect(firstNoReceiptSnapshot).toEqual(expectedNoReceiptSnapshot);

      const identicalNoReceiptFoot = new FakeElement();
      seedFormAndError(identicalNoReceiptFoot);
      renderTaskFoot(
        { taskFoot: identicalNoReceiptFoot },
        noReceiptTile,
        { sessions: noReceiptSessions, assignments: [noReceiptAssignment] },
      );
      expect(elementSnapshot(identicalNoReceiptFoot)).toEqual(expectedNoReceiptSnapshot);
      expect(elementSnapshot(identicalNoReceiptFoot)).toEqual(firstNoReceiptSnapshot);
    });

    const source = await Bun.file(new URL("./task-composition.js", import.meta.url)).text();
	expect(source).toContain("participantFieldRows");
	expect(source).not.toContain("function makeField");
    expect(source).not.toContain("makeField");
    expect(source).not.toContain("displayValue");
    expect(source).not.toContain("renderObject");
  });
});
