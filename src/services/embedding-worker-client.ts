import { UniversalSentenceEncoder } from "@tensorflow-models/universal-sentence-encoder";
import * as use from "@tensorflow-models/universal-sentence-encoder";
import * as tf from "@tensorflow/tfjs-core";
import { ActivePage } from "../types";

const embeddingWorkerUrl = `${
  process.env.NODE_ENV === "development"
    ? "http://localhost:8000"
    : "https://TODO_UPDATE_AFTER_DEPLOYING"
}/embedding.js`;

const embeddingWorker: { current: Worker | undefined; init: boolean } = {
  current: undefined,
  init: false,
};

export const listeners: { [name: string]: ({ id, error }: { id: string; error: any }) => void } =
  {};

const loadEmbedding = (chunk: ActivePage[]) =>
  new Promise<void>((resolve) => {
    listeners["init"] = (params: any) => {
      // listeners["init"] = ({ id, error }: { id?: string; error?: string }) => {
      // delete listeners["init"];
      console.log('!!!PTNLOG - loadEmbedding - listeners["init"] - params: ', params);
      resolve();
      // embeddingWorker.init = true;
      // document.body.dispatchEvent(new Event("ptn:embedding-worker:init"));
      // if (error) {
      //   console.error(error);
      // } else if (id) {
      //   console.log("!!!PTNLOG embedding worker loaded WITH ID");
      //   console.log(id);
      //   resolve();
      // } else {
      //   console.log("!!!PTNLOG embedding worker loaded WITHOUT ID");
      //   resolve();
      // }
    };
    // TODO render loading
    embeddingWorker?.current?.postMessage({
      method: "init",
      foo: "bar",
      chunk,
    });
  });

export const initializeEmbeddingWorker = (chunk: ActivePage[]) =>
  fetch(embeddingWorkerUrl)
    .then((r) => r.blob())
    .then((r) => {
      embeddingWorker.current = new Worker(window.URL.createObjectURL(r));
      embeddingWorker.current.onmessage = (e) => {
        console.log("!!!PTNLOG - onmessage", e);

        const { method, ...data } = e.data;

        console.log("!!!PTNLOG - listeners[method]", listeners);

        if (data["vec"]) {
          console.log("!!!PTNLOG - vec", data["vec"]);
          console.log("!!!PTNLOG - listeners", listeners);
          listeners["init"]?.(data["vec"]);
        }
      };

      console.log("embeddingWorker initialized");
      console.log("embeddingWorker chunk", chunk);

      return loadEmbedding(chunk);
    })
    .then((data) => {
      console.log("!!!PTNLOG embeddingWorker loaded", embeddingWorker.current);
      // window.roamAlphaAPI.ui.commandPalette.addCommand({
      //   label: "Refresh Discourse Data",
      //   callback: () => {
      //     deleteBlock(getSubTree({ parentUid: configUid, key: "cache" }).uid)
      //       .then(() => loadGraph(configUid))
      //       .then(refreshAllUi);
      //   },
      // });
      return embeddingWorker.current;
    });
