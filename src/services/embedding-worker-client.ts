import { EmbeddingWorker } from "../types";
import { initializeSelfHostedWorker } from "../workers/blobUrl";

const embeddingWorkerUrl = `${
  process.env.NODE_ENV === "development"
    ? "http://localhost:8000"
    : "https://similar-pages.vercel.app"
}/embedding.js`;

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

  console.log("embeddingWorker.current", embeddingWorker.current);
  console.log("embeddingWorker.current.postMessage", embeddingWorker.current.postMessage);

  embeddingWorker?.current?.postMessage({ method: "init", pageIds });

  return embeddingWorker.current;
  // return fetch(embeddingWorkerUrl)
  //   .then((r) => r.blob())
  //   .then((r) => {
  //     embeddingWorker.current = new Worker(window.URL.createObjectURL(r));
  //     embeddingWorker.current.onmessage = (e) => {
  //       const { method, ...data } = e.data;

  //       if (method === "complete" && data["workersDone"]) {
  //         callbackFn(data["workersDone"]);
  //       }
  //     };

  //     embeddingWorker?.current?.postMessage({ method: "init", pageIds });
  //   })
  //   .then(() => {
  //     return embeddingWorker.current;
  //   });
};
