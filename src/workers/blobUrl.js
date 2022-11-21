const saveEmbedding = function ({ data }) {
  if (data["method"]) {
    const method = data["method"];
    const pageIds = data["pageIds"];
    const IDB_NAME = "sp";
    const STRING_STORE = "fullStrings";
    const EMBEDDING_STORE = "embeddings";
    const SIMILARITY_STORE = "similarities";

    if (method === "init") {
      importScripts(
        "https://cdn.jsdelivr.net/combine/npm/@tensorflow/tfjs@3.20.0,npm/@tensorflow-models/universal-sentence-encoder@1.3.3,npm/idb@6.0.0/build/iife/index-min.min.js"
      );

      use.load().then((model) => {
        idb
          .openDB(IDB_NAME, undefined, {
            upgrade(db) {
              [STRING_STORE, EMBEDDING_STORE, SIMILARITY_STORE].forEach((store) => {
                if (!db.objectStoreNames.contains(store)) {
                  db.createObjectStore(store);
                }
              });
            },
          })
          .then((db) => {
            Promise.all(pageIds.map((id) => db.get(STRING_STORE, id))).then((pageStrings) => {
              model?.embed(pageStrings)?.then((embeddings) => {
                embeddings.array().then((vec) => {
                  const tx = db.transaction([EMBEDDING_STORE, SIMILARITY_STORE], "readwrite");
                  const embeddingsStore = tx.objectStore(EMBEDDING_STORE);
                  const operations = pageIds.map((id, i) => {
                    embeddingsStore.put(vec[i], id);
                  });

                  Promise.all(operations).then(() => {
                    tx.done.then(() => {
                      postMessage({ method: "complete", workersDone: vec.length });
                    });
                  });
                });
              });
            });
          });
      });
    }
  }
};

const initializeSelfHostedWorker = () => {
  const newBlob = new Blob([`self.onmessage=${saveEmbedding.toString()}`], {
    type: "application/javascript",
  });

  const blobURL = URL.createObjectURL(newBlob);
  return new Worker(blobURL);
};

export { initializeSelfHostedWorker };
