import { runGeospatialWorkerTask } from "../lib/geospatial/analysisEngine.js";

globalThis.addEventListener("message", (event) => {
  const { requestId, revisionId, task, payload } = event.data || {};
  try {
    const result = runGeospatialWorkerTask(task, payload);
    globalThis.postMessage({ requestId, revisionId, result });
  } catch (error) {
    globalThis.postMessage({
      requestId,
      revisionId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});
