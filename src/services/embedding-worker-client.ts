import { EmbeddingWorker } from "../types";

const embeddingWorkerUrl = `${
  process.env.NODE_ENV === "development"
    ? "http://localhost:8000"
    : "https://TODO_UPDATE_AFTER_DEPLOYING"
}/embedding.js`;

const embeddingWorker: EmbeddingWorker = { current: undefined, init: false };

export const initializeEmbeddingWorker = (
  pageIds: string[],
  callbackFn: (workersDone: number) => void
) => {
  return fetch(embeddingWorkerUrl)
    .then((r) => r.blob())
    .then((r) => {
      embeddingWorker.current = new Worker(window.URL.createObjectURL(r));
      embeddingWorker.current.onmessage = (e) => {
        const { method, ...data } = e.data;

        if (method === "complete" && data["workersDone"]) {
          callbackFn(data["workersDone"]);
        }
      };

      embeddingWorker?.current?.postMessage({ method: "init", pageIds });
    })
    .then(() => {
      return embeddingWorker.current;
    });
};
