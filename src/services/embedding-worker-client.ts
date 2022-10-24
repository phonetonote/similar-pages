import { EmbeddablePageInput, EmbeddablePageOutput, EmbeddingWorker } from "../types";

const embeddingWorkerUrl = `${
  process.env.NODE_ENV === "development"
    ? "http://localhost:8000"
    : "https://TODO_UPDATE_AFTER_DEPLOYING"
}/embedding.js`;

const embeddingWorker: EmbeddingWorker = { current: undefined, init: false };

export const initializeEmbeddingWorker = (
  chunk: EmbeddablePageInput[], // chunk has apex as last item
  callbackFn: () => void
) => {
  return fetch(embeddingWorkerUrl)
    .then((r) => r.blob())
    .then((r) => {
      embeddingWorker.current = new Worker(window.URL.createObjectURL(r));
      embeddingWorker.current.onmessage = (e) => {
        const { method, ...data } = e.data;

        if (method === "complete" && data["embeddablePageOutput"]) {
          // TODO add embeddings and similarities to idb
          // addEmbeddings(embeddablePageOutputs);
          // addSimilarities(embeddingMap);

          callbackFn();
        }
      };

      embeddingWorker?.current?.postMessage({ method: "init", chunk });
    })
    .then(() => {
      return embeddingWorker.current;
    });
};
