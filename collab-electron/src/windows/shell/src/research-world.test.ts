import { describe, expect, test } from "bun:test";

describe("research world renderer seam", () => {
  test("uses projection attributes and never opens a truth store", async () => {
    const source = await Bun.file(new URL("./research-world.js", import.meta.url)).text();
    expect(source).toContain("qfWorldField");
    expect(source).toContain("Show research world");
    const forbidden = new RegExp([
      ["bun", "sqlite"].join(":"),
      ["node", "sqlite"].join(":"),
      "better" + "-sqlite3",
      ["node", "fs"].join(":"),
    ].join("|"));
    expect(source).not.toMatch(forbidden);
  });
});
