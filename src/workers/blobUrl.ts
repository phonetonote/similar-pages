import { STRING_STORE, IDB_NAME, EMBEDDING_STORE, SIMILARITY_STORE } from "../services/idb";
import { openDB } from "idb/with-async-ittr";
import { UniversalSentenceEncoder } from "@tensorflow-models/universal-sentence-encoder";

async function updateIdb(pageIds: string[], model: any) {
  // can't use freshDbWithStores here for unknown webpack reasons ¯\_(ツ)_/¯
  const db = await openDB(IDB_NAME, undefined, {
    upgrade(db) {
      [STRING_STORE, EMBEDDING_STORE, SIMILARITY_STORE].forEach((store) => {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store);
        }
      });
    },
  });

  const pageStrings = await Promise.all(pageIds.map(async (id) => await db.get(STRING_STORE, id)));

  model?.embed(pageStrings)?.then(async (embeddings: any) => {
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

const functionToStringify = function ({ data }: { data: any }) {
  const doWorkAsync = () => {
    if (data["method"]) {
      const method = data["method"];
      const pageIds = data["pageIds"];

      if (method === "init") {
        this.load().then((model: any) => {
          updateIdb(pageIds, model);
        });
        // loadedTf.load().then((model: any) => {
        //   updateIdb(pageIds, model);
        // });
      }
    }
  };

  //Long-running work here
  doWorkAsync();
};

const initializeSelfHostedWorker = () => {
  // console.log("stringified", functionToStringify.toString());
  console.log("UniversalSentenceEncoder", UniversalSentenceEncoder);

  const newBlob = new Blob(
    [`${UniversalSentenceEncoder.protoString()}self.onmessage=${functionToStringify.toString()}`],
    {
      type: "application/javascript",
    }
  );

  console.log("newBlob", newBlob);
  console.log("newBlob Text", newBlob.text());

  const blobURL = URL.createObjectURL(newBlob);

  console.log("blobURL", blobURL);

  return new Worker(blobURL);
};

export { initializeSelfHostedWorker };
