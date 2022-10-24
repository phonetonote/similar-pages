import React from "react";
import resolveRefs from "roamjs-components/dom/resolveRefs";
import {
  BODY_SIZE,
  DIJKSTRA_STORE,
  EMBEDDINGS_STORE,
  STRINGS_STORE,
  IDB_NAME,
  SIMILARITIES_STORE,
  TITLES_STORE,
} from "../constants";
import { getStringAndChildrenString } from "../services/queries";
import {
  GPDijkstraDiffMap,
  GPEmbeddingMap,
  GPFullStringMap,
  GpSimiliarityMap,
  GPTitleMap,
  IncomingNode,
  TITLE_KEY,
  EmbeddablePageOutput,
  IncomingNodeMap,
} from "../types";
import { dot } from "mathjs";
import { ShortestPathLengthMapping as ShortestPathMap } from "graphology-shortest-path/unweighted";
import { IDBPDatabase, openDB } from "idb";

const stores = [DIJKSTRA_STORE, EMBEDDINGS_STORE, STRINGS_STORE, SIMILARITIES_STORE, TITLES_STORE];

// TODO rename to useIdb
function usePageMap() {
  // maybe activePageIds stays as state? 🛵
  const [activePageIds, setActivePageIds] = React.useState<string[]>([]);
  const [apexPageId, setApexPageId] = React.useState<string>();

  const [dijkstraDiffMap, setDijkstraDiffMap] = React.useState<GPDijkstraDiffMap>(new Map());
  const [fullStringMap, setFullStringMap] = React.useState<GPFullStringMap>(new Map());
  const [embeddingMap, setEmbeddingMap] = React.useState<GPEmbeddingMap>(new Map());
  const [similarityMap, setSimilarityMap] = React.useState<GpSimiliarityMap>(new Map());
  const [titleMap, setTitleMap] = React.useState<GPTitleMap>(new Map());

  const idb = React.useRef<IDBPDatabase>();

  React.useEffect(() => {
    let active = true;
    load();
    return () => {
      active = false;
    };

    async function load() {
      const freshDb = await openDB(IDB_NAME, 1, {
        upgrade(db) {
          stores.forEach((store) => db.createObjectStore(store, { keyPath: "pageId" }));
        },
      });

      if (!active) {
        return;
      }
      idb.current = freshDb;
    }
  }, []);

  // const { add } = useIndexedDBStore(PAGE_STORE);

  // 🛵 come back to this one
  const hasAllEmbeddings = React.useMemo(() => {
    return activePageIds.every((id) => embeddingMap.has(id));
  }, [activePageIds, embeddingMap]);

  const upsertApexAttrs = React.useCallback(
    (uid: string, attrs: IncomingNode) => {
      setApexPageId(uid);

      setTitleMap((prev) => {
        return new Map(prev).set(uid, prev.get(uid) || attrs[TITLE_KEY]);
      });

      setFullStringMap((prev) => {
        return new Map(prev).set(
          uid,
          prev.get(uid) || resolveRefs(getStringAndChildrenString(attrs).slice(0, BODY_SIZE))
        );
      });
    },
    [setApexPageId, setTitleMap, setFullStringMap]
  );

  const addActivePages = React.useCallback((pathMap: ShortestPathMap, nodeMap: IncomingNodeMap) => {
    const addActivePagesAsync = async () => {
      if (!idb.current) {
        console.error("idb not ready");
        return;
      } else {
        const activePages = Object.entries(pathMap).filter(([uid]) => {
          return uid !== apexPageId;
        });

        setActivePageIds(activePages.map(([uid]) => uid));

        const tx = idb.current.transaction(stores, "readwrite");
        if (tx) {
          const operations = [
            activePages.map(([pageId, dijkstraDiff]) => {
              return tx.objectStore(DIJKSTRA_STORE).put(dijkstraDiff, pageId);
            }),
            activePages.map(([pageId]) => {
              return tx.objectStore(TITLES_STORE).put(nodeMap.get(pageId)[TITLE_KEY], pageId);
            }),
            activePages.map(([pageId]) => {
              if (tx.objectStore(STRINGS_STORE).get(pageId)) {
                return null;
              } else {
                return tx
                  .objectStore(STRINGS_STORE)
                  .put(
                    resolveRefs(
                      getStringAndChildrenString(nodeMap.get(pageId)).slice(0, BODY_SIZE)
                    ),
                    pageId
                  );
              }
            }),
            tx.done,
          ].filter((maybeOperation) => !!maybeOperation);

          await Promise.all(operations);
        }
      }
    };

    addActivePagesAsync();
  }, []);

  const upsertActiveAttrs = React.useCallback(
    (pathMap: ShortestPathMap, roamPages: IncomingNodeMap) => {
      const activeNonApexPages = Object.entries(pathMap).filter(([uid]) => {
        return uid !== apexPageId;
      });

      setActivePageIds((prev) => {
        return [...prev, ...activeNonApexPages.map(([uid]) => uid)];
      });

      setDijkstraDiffMap((prev) => {
        const newMap = new Map(prev);
        for (const [uid, dijkstraDiff] of activeNonApexPages) {
          newMap.set(uid, dijkstraDiff);
        }
        return newMap;
      });

      setTitleMap((prev) => {
        const newMap = new Map(prev);
        for (const [uid] of activeNonApexPages) {
          newMap.set(uid, prev.get(uid) || roamPages.get(uid)[TITLE_KEY]);
        }
        return newMap;
      });

      setFullStringMap((prev) => {
        const newMap = new Map(prev);
        for (const [uid] of activeNonApexPages) {
          newMap.set(
            uid,
            prev.get(uid) ||
              resolveRefs(getStringAndChildrenString(roamPages.get(uid)).slice(0, BODY_SIZE))
          );
        }
        return newMap;
      });
    },
    [apexPageId, setActivePageIds, setDijkstraDiffMap, setTitleMap, setFullStringMap]
  );

  const addEmbeddings = React.useCallback((embeddings: EmbeddablePageOutput[]) => {
    setEmbeddingMap((prev) => {
      const newMap = new Map(prev);
      embeddings.forEach((e) => {
        newMap.set(e.id, e.embedding);
      });
      return newMap;
    });
  }, []);

  const addSimilarities = React.useCallback(
    (embeddingMap: GPEmbeddingMap) => {
      const apexEmbedding = embeddingMap.get(apexPageId);
      setSimilarityMap((prev) => {
        const newMap = new Map(prev);
        embeddingMap.forEach((embedding, uid) => {
          newMap.set(uid, dot(embedding, apexEmbedding));
        });
        return newMap;
      });
    },
    [apexPageId]
  );

  const pageKeysToEmbed = React.useMemo(() => {
    return [...activePageIds, apexPageId].filter((p) => !embeddingMap.has(p));
  }, [activePageIds, apexPageId, embeddingMap]);

  return [
    upsertApexAttrs,
    upsertActiveAttrs,
    addEmbeddings,
    addSimilarities,
    pageKeysToEmbed,
    embeddingMap,
    fullStringMap,
    dijkstraDiffMap,
    similarityMap,
    titleMap,
    hasAllEmbeddings,
  ] as const;
}

export default usePageMap;
