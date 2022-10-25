import { EMBEDDING_KEY, FULL_STRING_KEY, ID_KEY } from "../types";

importScripts(
  "https://cdn.jsdelivr.net/combine/npm/@tensorflow/tfjs@3.20.0,npm/@tensorflow-models/universal-sentence-encoder@1.3.3"
);

// TODO embed idb

tf.setBackend("webgl");

onmessage = (e) => {
  const { data = {} } = e;
  const { method, ...args } = data;

  if (method === "init") {
    use.load().then((model) => {
      const { pageIds } = args;
      // TODO pull fullString from idb

      // const stringsToEmbed = [...args?.chunk?.map((f) => f[FULL_STRING_KEY])];

      model?.embed(stringsToEmbed)?.then(async (embeddings) => {
        const vec = await embeddings.array();

        // TODO add embeddings and similarities to idb
        //   EMBEDDINGS_STORE, SIMILARITIES_STORE,
        // return

        postMessage({
          method: "complete",
          workersDone: stringsToEmbed.length,
        });
      });
    });
  }
};

export {};
