import { EmbeddingWorker } from "../types";
import { initializeSelfHostedWorker } from "../workers/blobUrl";

const embeddingWorker: EmbeddingWorker = { current: undefined, init: false };

export const initializeEmbeddingWorker = (
  pageIds: string[],
  callbackFn: (workersDone: number) => void
): Worker => {
  embeddingWorker.current = initializeSelfHostedWorker();
  embeddingWorker.current.onmessage = (e) => {
    const { method, ...data } = e.data;

    if (method === "complete" && data["workersDone"]) {
      callbackFn(data["workersDone"]);
    }
  };

  embeddingWorker?.current?.postMessage({ method: "init", pageIds });
  return embeddingWorker.current;
};
