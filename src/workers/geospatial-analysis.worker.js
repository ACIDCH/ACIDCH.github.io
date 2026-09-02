import { runGeospatialWorkerTask } from "../lib/geospatial/analysisEngine.js";

globalThis.addEventListener("message", async (event) => {
  const { requestId, revisionId, task, payload } = event.data || {};
  try {
    const result = await runGeospatialWorkerTask(task, payload);
    globalThis.postMessage({ requestId, revisionId, result });
  } catch (error) {
    globalThis.postMessage({
      requestId,
      revisionId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});
