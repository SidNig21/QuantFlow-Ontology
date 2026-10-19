/**
 * Pregame usage for one player and one game.
 * Rows are nflverse-shaped records. Identity is player_id, never the display name.
 * A game at or after the cutoff, and the game being studied, stay out of the history.
 */

export type UsageRow = {
  player_id: string;
  player_name: string;
  season: number;
  week: number;
  game_id: string;
  team: string;
  opponent: string;
  kickoff: string;
  targets: number | null;
  routes: number | null;
  offense_snaps: number | null;
  team_offense_snaps: number | null;
  team_pass_attempts: number | null;
  source: string;
  source_retrieved_at: string;
};

export type EvidenceInput = {
  player_id: string;
  player_name: string;
  subject_game_id: string;
  as_of: string;
  dataset: {
    source: string;
    retrieved_at: string;
    version: string;
  };
  rows: UsageRow[];
};

export type UsageGame = {
  season: number;
  week: number;
  game_id: string;
  team: string;
  opponent: string;
  kickoff: string;
  targets: number | null;
  routes: number | null;
  snap_share: number | null;
  team_pass_attempts: number | null;
  source: string;
  source_retrieved_at: string;
};

export type EvidenceReport = {
  player_id: string;
  player_name: string;
  subject_game_id: string;
  as_of: string;
  dataset: EvidenceInput["dataset"];
  retrieved_after_cutoff: boolean;
  games: UsageGame[];
  coverage: {
    games: number;
    targets: number;
    routes: number;
    snap_share: number;
    team_pass_attempts: number;
  };
  missing: string[];
  excluded: string[];
  source_timestamps: Array<{ source: string; retrieved_at: string }>;
};

function instant(value: string, label: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`${label} is not a timestamp: ${value}`);
  return parsed;
}

function snapShare(snaps: number | null, teamSnaps: number | null): number | null {
  if (snaps === null || teamSnaps === null) return null;
  if (teamSnaps <= 0) return null;
  return snaps / teamSnaps;
}

export function buildEvidence(input: EvidenceInput): EvidenceReport {
  const asOf = instant(input.as_of, "as_of");
  instant(input.dataset.retrieved_at, "dataset.retrieved_at");
  const games: UsageGame[] = [];
  const excluded: string[] = [];
  const seenExcluded = new Set<string>();
  function exclude(reason: string): void {
    if (seenExcluded.has(reason)) return;
    seenExcluded.add(reason);
    excluded.push(reason);
  }

  for (const row of input.rows) {
    if (row.player_id !== input.player_id) {
      if (row.player_name === input.player_name) {
        exclude(`${row.player_id} was not used; a matching display name is not an identity`);
      }
      continue;
    }
    const kickoff = instant(row.kickoff, `${row.game_id} kickoff`);
    if (row.game_id === input.subject_game_id) {
      exclude(`${row.game_id} is the game being studied`);
      continue;
    }
    if (kickoff >= asOf) {
      exclude(`${row.game_id} starts at or after the cutoff`);
      continue;
    }
    games.push({
      season: row.season,
      week: row.week,
      game_id: row.game_id,
      team: row.team,
      opponent: row.opponent,
      kickoff: row.kickoff,
      targets: row.targets,
      routes: row.routes,
      snap_share: snapShare(row.offense_snaps, row.team_offense_snaps),
      team_pass_attempts: row.team_pass_attempts,
      source: row.source,
      source_retrieved_at: row.source_retrieved_at,
    });
  }
  games.sort((left, right) => left.kickoff.localeCompare(right.kickoff) || left.game_id.localeCompare(right.game_id));

  const missing: string[] = [];
  if (games.length === 0) missing.push("no historical games before the as-of cutoff");
  for (const game of games) {
    if (game.targets === null) missing.push(`targets for ${game.game_id}`);
    if (game.routes === null) missing.push(`routes for ${game.game_id}`);
    if (game.snap_share === null) missing.push(`snap share for ${game.game_id}`);
    if (game.team_pass_attempts === null) missing.push(`team pass attempts for ${game.game_id}`);
  }

  const stamps = new Map<string, { source: string; retrieved_at: string }>();
  stamps.set(`${input.dataset.source}\t${input.dataset.retrieved_at}`, {
    source: input.dataset.source,
    retrieved_at: input.dataset.retrieved_at,
  });
  for (const game of games) {
    stamps.set(`${game.source}\t${game.source_retrieved_at}`, {
      source: game.source,
      retrieved_at: game.source_retrieved_at,
    });
  }

  const present = (pick: (game: UsageGame) => number | null) =>
    games.filter((game) => pick(game) !== null).length;

  return {
    player_id: input.player_id,
    player_name: input.player_name,
    subject_game_id: input.subject_game_id,
    as_of: input.as_of,
    dataset: input.dataset,
    retrieved_after_cutoff: instant(input.dataset.retrieved_at, "dataset.retrieved_at") > asOf,
    games,
    coverage: {
      games: games.length,
      targets: present((game) => game.targets),
      routes: present((game) => game.routes),
      snap_share: present((game) => game.snap_share),
      team_pass_attempts: present((game) => game.team_pass_attempts),
    },
    missing,
    excluded,
    source_timestamps: [...stamps.values()],
  };
}

function countText(value: number | null): string {
  return value === null ? "missing" : String(value);
}

function shareText(value: number | null): string {
  return value === null ? "missing" : value.toFixed(3);
}

export function formatEvidence(report: EvidenceReport): string {
  const lines = [
    "Football evidence",
    `Player: ${report.player_name} (${report.player_id})`,
    `Game being studied: ${report.subject_game_id}`,
    `As-of cutoff: ${report.as_of}`,
    `Data version: ${report.dataset.version}`,
    `Source: ${report.dataset.source}`,
    `Source time: ${report.dataset.retrieved_at}`,
  ];
  if (report.retrieved_after_cutoff) {
    lines.push("This file was retrieved after the cutoff. It is not proof of what was known before that kickoff.");
  }
  lines.push("", "Historical usage before the cutoff");
  if (report.games.length === 0) lines.push("(none)");
  for (const game of report.games) {
    lines.push(
      `week ${game.week}  ${game.game_id}  ${game.team} vs ${game.opponent}  targets ${countText(game.targets)}  routes ${countText(game.routes)}  snap share ${shareText(game.snap_share)}  team pass attempts ${countText(game.team_pass_attempts)}  kickoff ${game.kickoff}`,
    );
  }
  lines.push(
    "",
    "Coverage",
    `games ${report.coverage.games}`,
    `targets present ${report.coverage.targets} of ${report.coverage.games}`,
    `routes present ${report.coverage.routes} of ${report.coverage.games}`,
    `snap share present ${report.coverage.snap_share} of ${report.coverage.games}`,
    `team pass attempts present ${report.coverage.team_pass_attempts} of ${report.coverage.games}`,
    "",
    "Missing",
    ...(report.missing.length ? report.missing : ["(none)"]),
    "",
    "Excluded",
    ...(report.excluded.length ? report.excluded : ["(none)"]),
    "",
    "Source timestamps",
  );
  for (const stamp of report.source_timestamps) {
    lines.push(`${stamp.source} retrieved ${stamp.retrieved_at}`);
  }
  return lines.join("\n");
}
