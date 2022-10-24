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
      const stringsToEmbed = [...args?.chunk?.map((f) => f[FULL_STRING_KEY])];

      model?.embed(stringsToEmbed)?.then(async (embeddings) => {
        const vec = await embeddings.array();

        // TODO add embeddings and similarities to idb

        // maybe return total number of embeddings?
        // or just the number of embeddings in this chunk?

        postMessage({
          method: "complete",
          embeddablePageOutput: vec.map((v, i) => {
            return {
              [EMBEDDING_KEY]: v,
              [ID_KEY]: args?.chunk[i][ID_KEY],
            };
          }),
        });
      });
    });
  }
};

export {};
