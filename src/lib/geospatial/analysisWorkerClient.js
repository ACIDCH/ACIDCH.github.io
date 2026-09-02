import { runGeospatialWorkerTask } from "./analysisEngine.js";
import analysisWorkerUrl from "../../workers/geospatial-analysis.worker.js?worker&url";

export class StaleWorkerResultError extends Error {
  constructor() {
    super("Worker result belongs to an older scenario revision");
    this.name = "StaleWorkerResultError";
  }
}

export class WorkerTaskError extends Error {
  constructor(message) {
    super(message);
    this.name = "WorkerTaskError";
  }
}

export function createAnalysisWorkerClient({ WorkerCtor = globalThis.Worker } = {}) {
  let worker = null;
  let sequence = 0;
  const pending = new Map();

  const ensureWorker = () => {
    if (worker || typeof WorkerCtor !== "function") return worker;
    worker = new WorkerCtor(analysisWorkerUrl, {
      type: "module",
      name: "geospatial-analysis",
    });
    worker.addEventListener("message", (event) => {
      const message = event.data || {};
      const entry = pending.get(message.requestId);
      if (!entry) return;
      pending.delete(message.requestId);
      if (message.revisionId !== entry.revisionId || !entry.isCurrent()) {
        entry.reject(new StaleWorkerResultError());
      } else if (message.error) {
        entry.reject(new WorkerTaskError(message.error));
      } else {
        entry.resolve({ result: message.result, execution: "worker" });
      }
    });
    worker.addEventListener("error", (event) => {
      const error = new Error(event.message || "Geospatial Worker failed");
      for (const entry of pending.values()) entry.reject(error);
      pending.clear();
      worker?.terminate();
      worker = null;
    });
    return worker;
  };

  return Object.freeze({
    async run(task, payload, { revisionId, isCurrent = () => true } = {}) {
      const requestId = ++sequence;
      try {
        const activeWorker = ensureWorker();
        if (!activeWorker) throw new Error("Web Worker unavailable");
        return await new Promise((resolve, reject) => {
          pending.set(requestId, { resolve, reject, revisionId, isCurrent });
          activeWorker.postMessage({ requestId, revisionId, task, payload });
        });
      } catch (workerError) {
        if (
          workerError instanceof StaleWorkerResultError ||
          workerError instanceof WorkerTaskError
        )
          throw workerError;
        if (task === "fetchParseGraph") {
          throw new WorkerTaskError(
            `Background road loading unavailable: ${workerError?.message || "Web Worker unavailable"}`,
          );
        }
        if (!isCurrent()) throw new StaleWorkerResultError();
        const result = await runGeospatialWorkerTask(task, payload);
        if (!isCurrent()) throw new StaleWorkerResultError();
        return {
          result,
          execution: "fallback",
          warning: workerError?.message || "Web Worker unavailable",
        };
      }
    },
    terminate() {
      worker?.terminate();
      worker = null;
      for (const entry of pending.values())
        entry.reject(new Error("Worker terminated"));
      pending.clear();
    },
  });
}

let singleton;

export function getAnalysisWorkerClient() {
  if (!singleton) singleton = createAnalysisWorkerClient();
  return singleton;
}
