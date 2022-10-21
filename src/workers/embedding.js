import { EMBEDDING_KEY, FULL_STRING_KEY, ID_KEY } from "../types";

importScripts(
  "https://cdn.jsdelivr.net/combine/npm/@tensorflow/tfjs@3.20.0,npm/@tensorflow-models/universal-sentence-encoder@1.3.3"
);

tf.setBackend("webgl");

onmessage = (e) => {
  const { data = {} } = e;
  const { method, ...args } = data;

  if (method === "init") {
    use.load().then((model) => {
      const stringsToEmbed = [...args?.chunk?.map((f) => f[FULL_STRING_KEY])];

      model?.embed(stringsToEmbed)?.then(async (embeddings) => {
        const vec = await embeddings.array();

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
