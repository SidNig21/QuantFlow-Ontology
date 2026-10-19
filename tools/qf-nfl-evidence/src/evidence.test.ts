import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildEvidence, formatEvidence, type EvidenceInput } from "./evidence.ts";

function fixture(): EvidenceInput {
  return JSON.parse(
    readFileSync(join(import.meta.dir, "fixtures", "receiver.json"), "utf8"),
  ) as EvidenceInput;
}

describe("pregame football evidence", () => {
  test("keeps earlier usage and drops the game being studied, later games, and a same-name impostor", () => {
    const report = buildEvidence(fixture());
    expect(report.games.map((game) => game.game_id)).toEqual([
      "2026_03_MIA_BUF",
      "2026_04_NYJ_BUF",
      "2026_05_BUF_NE",
    ]);
    expect(report.games.some((game) => game.targets === 99)).toBe(false);
    expect(report.games[1]!.routes).toBeNull();
    expect(report.games[0]!.snap_share).toBeCloseTo(48 / 62);
    expect(report.games[2]!.snap_share).toBeNull();
    expect(report.games[2]!.team_pass_attempts).toBeNull();
    expect(report.coverage).toEqual({
      games: 3,
      targets: 3,
      routes: 2,
      snap_share: 2,
      team_pass_attempts: 2,
    });
    expect(report.missing).toEqual([
      "routes for 2026_04_NYJ_BUF",
      "snap share for 2026_05_BUF_NE",
      "team pass attempts for 2026_05_BUF_NE",
    ]);
    expect(report.excluded).toEqual([
      "2026_06_BUF_LV is the game being studied",
      "2026_07_BUF_KC starts at or after the cutoff",
      "00-0088888 was not used; a matching display name is not an identity",
    ]);
    expect(report.retrieved_after_cutoff).toBe(true);
  });

  test("a cutoff before every game is an explicit empty sample", () => {
    const input = fixture();
    input.as_of = "2026-09-01T00:00:00.000Z";
    const report = buildEvidence(input);
    expect(report.games).toEqual([]);
    expect(report.missing).toEqual(["no historical games before the as-of cutoff"]);
    expect(report.coverage.games).toBe(0);
  });

  test("the printed report traces each kept number and leaves blanks missing", () => {
    const text = formatEvidence(buildEvidence(fixture()));
    expect(text).toContain("targets 8  routes 31  snap share 0.774  team pass attempts 34");
    expect(text).toContain("targets 6  routes missing  snap share 0.700  team pass attempts 29");
    expect(text).toContain("targets 11  routes 36  snap share missing  team pass attempts missing");
    expect(text).not.toContain("targets 14");
    expect(text).not.toContain("targets 99");
    expect(text).toContain("not proof of what was known before that kickoff");
  });
});
