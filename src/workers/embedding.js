import { STRING_STORE, IDB_NAME, EMBEDDING_STORE, SIMILARITY_STORE } from "../services/idb";
importScripts(
  "https://cdn.jsdelivr.net/combine/npm/@tensorflow/tfjs@3.20.0,npm/@tensorflow-models/universal-sentence-encoder@1.3.3,npm/idb@7.1.0/build/umd.min.js"
);

tf.setBackend("webgl");

async function updateIdb(pageIds, model) {
  // can't use freshDbWithStores here for unknown webpack reasons ¯\_(ツ)_/¯
  const db = await idb.openDB(IDB_NAME, undefined, {
    upgrade(db) {
      [STRING_STORE, EMBEDDING_STORE, SIMILARITY_STORE].forEach((store) => {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store);
        }
      });
    },
  });

  const pageStrings = await Promise.all(pageIds.map(async (id) => await db.get(STRING_STORE, id)));

  model?.embed(pageStrings)?.then(async (embeddings) => {
    const vec = await embeddings.array();
    const tx = db.transaction([EMBEDDING_STORE, SIMILARITY_STORE], "readwrite");
    const embeddingsStore = tx.objectStore(EMBEDDING_STORE);
    const operations = pageIds.map((id, i) => {
      embeddingsStore.put(vec[i], id);
    });
    await Promise.all(operations);
    await tx.done;

    postMessage({ method: "complete", workersDone: vec.length });
  });
}

self.onmessage = async ({ data = {} }) => {
  const { method, ...args } = data;
  const { pageIds } = args;

  if (method === "init") {
    const model = await use.load();
    await updateIdb(pageIds, model);
  }
};
