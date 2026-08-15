import { runTeamCompositionUiGate } from "./team-composition-ui.ts";

if (import.meta.main) {
  process.exit((await runTeamCompositionUiGate()).ok ? 0 : 1);
}

export { runTeamCompositionUiGate };
