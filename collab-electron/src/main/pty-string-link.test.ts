import { beforeEach, describe, expect, test } from "bun:test";
import {
  __forwardStringDataForTests,
  __setBatonDuplicateTtlMsForTests,
  __setStringTargetWriterForTests,
  getStringActivity,
  listStringLinks,
  unregisterStringLink,
  upsertStringLink,
} from "./pty";

describe("upsertStringLink", () => {
  beforeEach(() => {
    for (const l of listStringLinks()) {
      unregisterStringLink(l.id);
    }
    __setStringTargetWriterForTests(null);
    __setBatonDuplicateTtlMsForTests(8);
  });

  test("inserts one link", () => {
    upsertStringLink({
      id: "s1",
      sourceSessionId: "src-a",
      targetSessionId: "tgt-b",
      filter: "framed",
      active: true,
    });
    const links = listStringLinks();
    expect(links.length).toBe(1);
    expect(links[0]!.id).toBe("s1");
    expect(links[0]!.sourceSessionId).toBe("src-a");
    expect(links[0]!.triggered).toBe(true);
    expect(links[0]!.mode).toBe("generic");
  });

  test("same id replaces instead of duplicating", () => {
    upsertStringLink({
      id: "s2",
      sourceSessionId: "a",
      targetSessionId: "b",
      filter: "framed",
      active: true,
    });
    upsertStringLink({
      id: "s2",
      sourceSessionId: "a2",
      targetSessionId: "b2",
      filter: "ansi-strip",
      active: false,
      mode: "baton",
    });
    const links = listStringLinks();
    expect(links.length).toBe(1);
    expect(links[0]!.sourceSessionId).toBe("a2");
    expect(links[0]!.filter).toBe("framed");
    expect(links[0]!.mode).toBe("baton");
    expect(links[0]!.active).toBe(false);
  });

  test("triggerPattern sets triggered false until gate", () => {
    upsertStringLink({
      id: "s3",
      sourceSessionId: "x",
      targetSessionId: "y",
      filter: "framed",
      active: true,
      triggerPattern: "HANDOFF",
    });
    const link = listStringLinks().find((l) => l.id === "s3");
    expect(link?.triggered).toBe(false);
  });

  test("triggered from shell restores armed gate after reload", () => {
    upsertStringLink({
      id: "s4",
      sourceSessionId: "x",
      targetSessionId: "y",
      filter: "framed",
      active: true,
      triggerPattern: "HANDOFF",
      triggered: true,
    });
    const link = listStringLinks().find((l) => l.id === "s4");
    expect(link?.triggered).toBe(true);
  });

  test("baton mode forwards a split frame once as one submit", () => {
    const writes: Array<{ sessionId: string; data: string }> = [];
    __setStringTargetWriterForTests((sessionId, data) => {
      writes.push({ sessionId, data });
      return true;
    });

    upsertStringLink({
      id: "baton-1",
      sourceSessionId: "doc",
      targetSessionId: "librarian",
      filter: "ansi-strip",
      mode: "baton",
      active: true,
    });

    __forwardStringDataForTests("doc", "[PIPE_START]HANDOFF_READY");
    expect(writes).toEqual([]);

    __forwardStringDataForTests("doc", " expertise/foo/[PIPE_END]\n");
    expect(writes).toEqual([
      {
        sessionId: "librarian",
        data: "HANDOFF_READY expertise/foo/\r",
      },
    ]);

    expect(getStringActivity("baton-1")).toMatchObject({
      events: 1,
      deliveryState: "delivered",
      lastPayload: "HANDOFF_READY expertise/foo/",
    });
  });

  test("baton mode ignores framed markers echoed inside the typed source command", () => {
    const writes: string[] = [];
    __setStringTargetWriterForTests((_sessionId, data) => {
      writes.push(data);
      return true;
    });

    upsertStringLink({
      id: "baton-echo",
      sourceSessionId: "doc",
      targetSessionId: "librarian",
      filter: "framed",
      mode: "baton",
      active: true,
    });

    __forwardStringDataForTests(
      "doc",
      "printf '%s\\n' '[PIPE_START]HANDOFF_READY expertise/foo/[PIPE_END]'\n",
    );
    expect(writes).toEqual([]);

    __forwardStringDataForTests(
      "doc",
      "[PIPE_START]HANDOFF_READY expertise/foo/[PIPE_END]\n",
    );
    expect(writes).toEqual(["HANDOFF_READY expertise/foo/\r"]);
  });

  test("identical baton payload inside duplicate ttl is suppressed once", () => {
    const writes: string[] = [];
    __setStringTargetWriterForTests((_sessionId, data) => {
      writes.push(data);
      return true;
    });

    upsertStringLink({
      id: "baton-dup",
      sourceSessionId: "doc",
      targetSessionId: "librarian",
      filter: "framed",
      mode: "baton",
      active: true,
    });

    const frame = "[PIPE_START]HANDOFF_READY expertise/foo/[PIPE_END]\n";
    __forwardStringDataForTests("doc", frame);
    __forwardStringDataForTests("doc", frame);

    expect(writes).toEqual(["HANDOFF_READY expertise/foo/\r"]);
    expect(getStringActivity("baton-dup")).toMatchObject({
      events: 1,
      duplicateSuppressions: 1,
      deliveryState: "duplicate-suppressed",
    });
  });

  test("identical baton payload after duplicate ttl is allowed again", async () => {
    const writes: string[] = [];
    __setStringTargetWriterForTests((_sessionId, data) => {
      writes.push(data);
      return true;
    });

    upsertStringLink({
      id: "baton-ttl",
      sourceSessionId: "doc",
      targetSessionId: "librarian",
      filter: "framed",
      mode: "baton",
      active: true,
    });

    const frame = "[PIPE_START]HANDOFF_READY expertise/foo/[PIPE_END]\n";
    __forwardStringDataForTests("doc", frame);
    await Bun.sleep(20);
    __forwardStringDataForTests("doc", frame);

    expect(writes).toEqual([
      "HANDOFF_READY expertise/foo/\r",
      "HANDOFF_READY expertise/foo/\r",
    ]);
    expect(getStringActivity("baton-ttl")).toMatchObject({
      events: 2,
      deliveryState: "delivered",
      duplicateSuppressions: 0,
    });
  });

  test("baton triggerPattern matches extracted REVIEW_READY payloads", () => {
    const writes: string[] = [];
    __setStringTargetWriterForTests((_sessionId, data) => {
      writes.push(data);
      return true;
    });

    upsertStringLink({
      id: "baton-review",
      sourceSessionId: "librarian",
      targetSessionId: "hermes",
      filter: "framed",
      mode: "baton",
      active: true,
      triggerPattern: "^REVIEW_READY\\b",
    });

    __forwardStringDataForTests(
      "librarian",
      "[PIPE_START]REVIEW_READY run-1 expertise/test/[PIPE_END]\n",
    );

    expect(writes).toEqual(["REVIEW_READY run-1 expertise/test/\r"]);
    expect(getStringActivity("baton-review")).toMatchObject({
      events: 1,
      deliveryState: "delivered",
      lastPayload: "REVIEW_READY run-1 expertise/test/",
    });
  });

  test("baton triggerPattern does not fire on an almost-matching REVIEW_READY line", () => {
    const writes: string[] = [];
    __setStringTargetWriterForTests((_sessionId, data) => {
      writes.push(data);
      return true;
    });

    upsertStringLink({
      id: "baton-review-miss",
      sourceSessionId: "librarian",
      targetSessionId: "hermes",
      filter: "framed",
      mode: "baton",
      active: true,
      triggerPattern: "^REVIEW_READY\\b",
    });

    __forwardStringDataForTests(
      "librarian",
      "[PIPE_START]XREVIEW_READY run-1 expertise/test/[PIPE_END]\n",
    );

    expect(writes).toEqual([]);
    expect(getStringActivity("baton-review-miss")).toMatchObject({
      events: 0,
      deliveryState: "idle",
      lastPayload: null,
    });
  });

  test("upsert clears stale baton dedupe state", () => {
    const writes: string[] = [];
    __setStringTargetWriterForTests((_sessionId, data) => {
      writes.push(data);
      return true;
    });

    upsertStringLink({
      id: "baton-reset",
      sourceSessionId: "doc",
      targetSessionId: "librarian",
      filter: "framed",
      mode: "baton",
      active: true,
    });

    const frame = "[PIPE_START]HANDOFF_READY expertise/foo/[PIPE_END]\n";
    __forwardStringDataForTests("doc", frame);
    __forwardStringDataForTests("doc", frame);
    upsertStringLink({
      id: "baton-reset",
      sourceSessionId: "doc",
      targetSessionId: "librarian",
      filter: "framed",
      mode: "baton",
      active: true,
    });
    __forwardStringDataForTests("doc", frame);

    expect(writes).toEqual([
      "HANDOFF_READY expertise/foo/\r",
      "HANDOFF_READY expertise/foo/\r",
    ]);
  });
});
