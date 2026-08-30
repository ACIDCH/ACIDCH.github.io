import { describe, expect, it } from "vitest";
import {
  createAnalysisWorkerClient,
  StaleWorkerResultError,
} from "./analysisWorkerClient.js";

class StaleWorker {
  listeners = {};
  addEventListener(type, listener) {
    this.listeners[type] = listener;
  }
  postMessage(message) {
    globalThis.queueMicrotask(() =>
      this.listeners.message({
        data: {
          requestId: message.requestId,
          revisionId: message.revisionId + 1,
          result: {},
        },
      }),
    );
  }
  terminate() {}
}

describe("analysis Worker client", () => {
  it("discards a result carrying an older or mismatched revision", async () => {
    const client = createAnalysisWorkerClient({ WorkerCtor: StaleWorker });
    await expect(
      client.run("monteCarlo", {}, { revisionId: 4, isCurrent: () => true }),
    ).rejects.toBeInstanceOf(StaleWorkerResultError);
  });

  it("reports an explicit main-thread fallback when Worker construction fails", async () => {
    class BrokenWorker {
      constructor() {
        throw new Error("worker blocked");
      }
    }
    const client = createAnalysisWorkerClient({ WorkerCtor: BrokenWorker });
    const result = await client.run(
      "criticality",
      {
        graph: {
          nodes: new Map(),
          nodeList: [],
          edges: [],
          adjacency: new Map(),
          version: "empty",
        },
        entities: { facilities: [], demands: [] },
        solution: { factoryAssignments: [], assignments: [] },
        scenario: {},
      },
      { revisionId: 1, isCurrent: () => true },
    );
    expect(result.execution).toBe("fallback");
    expect(result.warning).toMatch(/worker blocked/);
    expect(result.result.edges).toEqual([]);
  });
});
