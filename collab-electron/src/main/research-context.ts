const researchHypothesisBySession = new Map<string, string>();
const researchStrategyBySession = new Map<string, string>();

export function bindResearchHypothesis(sessionId: string, hypothesisId: string, strategyId?: string): void {
  if (sessionId.length === 0) throw new Error("research context requires session id");
  if (hypothesisId.length === 0) throw new Error("research context requires Hypothesis id");
  researchHypothesisBySession.set(sessionId, hypothesisId);
  if (strategyId) researchStrategyBySession.set(sessionId, strategyId);
}

export function researchStrategyForSession(sessionId: string): string | undefined {
  return researchStrategyBySession.get(sessionId);
}

export function researchHypothesisForSession(sessionId: string): string | undefined {
  return researchHypothesisBySession.get(sessionId);
}

export function clearResearchHypothesis(sessionId: string): void {
  researchHypothesisBySession.delete(sessionId);
  researchStrategyBySession.delete(sessionId);
}

export function clearAllResearchHypotheses(): void {
  researchHypothesisBySession.clear();
  researchStrategyBySession.clear();
}
