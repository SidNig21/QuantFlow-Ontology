const researchHypothesisBySession = new Map<string, string>();

export function bindResearchHypothesis(sessionId: string, hypothesisId: string): void {
  if (sessionId.length === 0) throw new Error("research context requires session id");
  if (hypothesisId.length === 0) throw new Error("research context requires Hypothesis id");
  researchHypothesisBySession.set(sessionId, hypothesisId);
}

export function researchHypothesisForSession(sessionId: string): string | undefined {
  return researchHypothesisBySession.get(sessionId);
}

export function clearResearchHypothesis(sessionId: string): void {
  researchHypothesisBySession.delete(sessionId);
}

export function clearAllResearchHypotheses(): void {
  researchHypothesisBySession.clear();
}
