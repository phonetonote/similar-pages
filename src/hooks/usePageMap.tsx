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
import { IncomingNode, TITLE_KEY, IncomingNodeMap } from "../types";
import { dot } from "mathjs";
import { ShortestPathLengthMapping as ShortestPathMap } from "graphology-shortest-path/unweighted";
import { IDBPDatabase, openDB } from "idb";

const stores = [DIJKSTRA_STORE, EMBEDDINGS_STORE, STRINGS_STORE, SIMILARITIES_STORE, TITLES_STORE];

// TODO rename to useIdb
function usePageMap() {
  // activePageIds and apexPageId stays as state? 🛵
  const [activePageIds, setActivePageIds] = React.useState<string[]>([]);
  const [apexPageId, setApexPageId] = React.useState<string>();

  // TODO use typescript type for idb
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
    // TODO reimplement with idb
    // TODO make this hasAllEmbeddingsAndSimilarities

    return activePageIds.every((id) => embeddingMap.has(id));
  }, [activePageIds]);

  const addApexPage = React.useCallback(
    (uid: string, attrs: IncomingNode) => {
      const addApexPageAsync = async () => {
        setApexPageId(uid);

        if (!idb.current) {
          console.error("idb not initialized");
          return;
        } else {
          const tx = idb.current.transaction([TITLES_STORE, STRINGS_STORE], "readwrite");

          if (tx) {
            const operations = [
              tx.objectStore(TITLES_STORE).put({ pageId: uid, title: attrs[TITLE_KEY] }),
            ];

            const txStringStore = tx.objectStore(STRINGS_STORE);
            if (txStringStore.count(uid)) {
              operations.push(
                txStringStore.put({
                  pageId: uid,
                  string: resolveRefs(getStringAndChildrenString(attrs).slice(0, BODY_SIZE)),
                })
              );
            }
          }
        }
      };

      addApexPageAsync();
    },
    [setApexPageId]
  );

  const addActivePages = React.useCallback((pathMap: ShortestPathMap, nodeMap: IncomingNodeMap) => {
    const addActivePagesAsync = async () => {
      const activePages = Object.entries(pathMap).filter(([uid]) => {
        return uid !== apexPageId;
      });

      setActivePageIds(activePages.map(([uid]) => uid));

      if (!idb.current) {
        console.error("idb not ready");
        return;
      } else {
        const tx = idb.current.transaction(
          [DIJKSTRA_STORE, TITLES_STORE, STRINGS_STORE],
          "readwrite"
        );
        if (tx) {
          const operations = [
            activePages.map(([pageId, dijkstraDiff]) => {
              return tx.objectStore(DIJKSTRA_STORE).put(dijkstraDiff, pageId);
            }),
            activePages.map(([pageId]) => {
              return tx.objectStore(TITLES_STORE).put(nodeMap.get(pageId)[TITLE_KEY], pageId);
            }),
            activePages.map(([pageId]) => {
              if (tx.objectStore(STRINGS_STORE).count(pageId)) {
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

  const pageKeysToEmbed = React.useMemo(() => {
    // TODO reimplement with idb
    return [...activePageIds, apexPageId].filter((p) => !embeddingMap.has(p));
  }, [activePageIds, apexPageId]);

  return [addApexPage, addActivePages, pageKeysToEmbed, hasAllEmbeddings] as const;
}

export default usePageMap;
