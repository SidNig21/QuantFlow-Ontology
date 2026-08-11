export function runAtomicResultCommit<P, C>(
  transactionOwner: { transaction<T>(fn: () => T): () => T },
  publish: () => P,
  complete: (published: P) => C,
): { published: P; completion: C } {
  return transactionOwner.transaction(() => {
    const published = publish();
    const completion = complete(published);
    return { published, completion };
  })();
}
