/** Only generated reads over market.read objects are completion-eligible receipts. */
export function ontologyReadReceiptEligible(
  toolName: string,
  capabilityGroup: "market.read" | "desk.orchestrate" | "research.evaluate" | null,
): boolean {
  return /^qf_.+_(get|query|links)$/.test(toolName) && capabilityGroup === "market.read";
}
