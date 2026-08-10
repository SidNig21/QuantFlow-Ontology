import { expect, test } from "bun:test";
import { runAtomicResultCommit } from "./atomic-result-commit";

test("completion failure rolls publication rows, links, and events back together", () => {
  const state = { artifacts: [] as string[], links: [] as string[], events: [] as string[] };
  const owner = {
    transaction<T>(fn: () => T): () => T {
      return () => {
        const snapshot = {
          artifacts: [...state.artifacts],
          links: [...state.links],
          events: [...state.events],
        };
        try {
          return fn();
        } catch (error) {
          state.artifacts = snapshot.artifacts;
          state.links = snapshot.links;
          state.events = snapshot.events;
          throw error;
        }
      };
    },
  };
  expect(() => runAtomicResultCommit(
    owner,
    () => {
      state.artifacts.push("result-1");
      state.links.push("produces", "derived_from");
      state.events.push("artifact.published");
      return { artifactId: "result-1" };
    },
    () => {
      throw new Error("injected complete_task failure");
    },
  )).toThrow(/injected/);
  expect(state).toEqual({ artifacts: [], links: [], events: [] });
});
